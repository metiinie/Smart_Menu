import { ordersApi } from './api';
import { LocalOrder, LocalOrderStatus } from '@/shared/types';

let isSyncing = false;
type OrderAuditType = 'success' | 'error' | 'info';

function emitOrderAudit(type: OrderAuditType, message: string, meta: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('arifsmart-order-audit', {
      detail: { type, message, meta, at: new Date().toISOString() },
    }),
  );
}

/**
 * SyncManager: Centralized engine for handling order synchronization.
 * Responsibilities:
 * - Placing orders (with auto-queuing if offline)
 * - Processing the offline queue
 * - Handling manual retries of failed orders
 */
export const syncManager = {
  /**
   * Primary entry point for placing a new order.
   * Adds to local store immediately, then attempts to send to server.
   */
  async placeOrder(localOrder: LocalOrder) {
    const { useLocalOrderStore } = await import('@/stores/localOrderStore');
    // 1. Ensure it's in the store
    useLocalOrderStore.getState().addOrder(localOrder);

    const payload = {
      tableId: localOrder.tableId,
      sessionId: localOrder.sessionId,
      customerRef: localOrder.customerRef,
      items: localOrder.items.map((i) => ({ 
        menuItemId: i.menuItemId, 
        quantity: i.quantity,
        note: i.note,
        options: i.options
      })),
    };

    try {
      const result = await ordersApi.create(payload);
      useLocalOrderStore.getState().updateOrderStatus(localOrder.id, LocalOrderStatus.SYNCED, result.id);
      emitOrderAudit('success', 'Order submitted successfully', {
        localOrderId: localOrder.id,
        serverOrderId: result.id,
        branchId: localOrder.branchId,
        sessionId: localOrder.sessionId,
      });
      return result;
    } catch (error: any) {
      // 🟢 CONTROLLED RECOVERY: Handle expired session
      if (error.response?.data?.message === 'SESSION_EXPIRED') {
        try {
          const { contextApi } = await import('./api');
          const { useCartStore } = await import('@/stores/cartStore');
          
          // 1. Fetch fresh context (this will create/get an active session)
          const contextData = await contextApi.getTableContext(localOrder.branchId, localOrder.tableId);
          
          // 2. Update global store
          useCartStore.getState().setContext(
            contextData.branch.restaurantId,
            contextData.branch.id, 
            contextData.table.id, 
            contextData.activeSession.id,
            useCartStore.getState().customerRef || ''
          );
          
          // 3. Update the local order in store
          useLocalOrderStore.getState().updateOrderSession(localOrder.id, contextData.activeSession.id);
          
          // 4. Retry once with the new ID
          payload.sessionId = contextData.activeSession.id;
          const retryResult = await ordersApi.create(payload);
          useLocalOrderStore.getState().updateOrderStatus(localOrder.id, LocalOrderStatus.SYNCED, retryResult.id);
          return retryResult;
        } catch (retryError) {
          error = retryError; // Fall through to standard error handling
        }
      }

      const isNetworkError = !error.response || [503, 504].includes(error.response.status);

      if (isNetworkError) {
        this._enqueue(localOrder.id, payload, localOrder.branchId, localOrder.tableId);
        emitOrderAudit('info', 'Order queued offline; waiting for sync', {
          localOrderId: localOrder.id,
          branchId: localOrder.branchId,
          sessionId: localOrder.sessionId,
        });
        return { type: 'QUEUED', localId: localOrder.id };
      }

      // If it's a 400 or other terminal error, mark as FAILED
      if (error.response?.status === 400) {
        emitOrderAudit('error', 'Order rejected by server', {
          localOrderId: localOrder.id,
          branchId: localOrder.branchId,
          sessionId: localOrder.sessionId,
          reason: error.response?.data?.message || error.message,
        });
        useLocalOrderStore.getState().updateOrderStatus(
          localOrder.id,
          LocalOrderStatus.FAILED,
          undefined,
          error.response?.data?.message || error.message,
        );
      }
      throw error;
    }
  },

  /**
   * Process the entire offline queue in sequence.
   */
  async startSync() {
    if (isSyncing || typeof window === 'undefined') return;
    const { useLocalOrderStore } = await import('@/stores/localOrderStore');
    const queue = this._getQueue();
    if (queue.length === 0) return;

    isSyncing = true;
    console.log(`[SyncManager] Starting sync for ${queue.length} orders...`);

    const remaining = [];

    for (const item of queue) {
      try {
        // Double-check status — don't sync if already SYNCED or FAILED
        const currentOrder = useLocalOrderStore.getState().orders[item.id];
        if (!currentOrder || currentOrder.status === LocalOrderStatus.SYNCED || currentOrder.status === LocalOrderStatus.FAILED) {
          continue;
        }

        useLocalOrderStore.getState().updateOrderStatus(item.id, LocalOrderStatus.SYNCING);
        
        // RE-ATTACH: If the payload has a stale sessionId, try to refresh it from current context
        const contextStr = localStorage.getItem('_table_ctx');
        if (contextStr) {
          try {
            const ctx = JSON.parse(contextStr);
            if (ctx.activeSession?.id && item.payload.sessionId !== ctx.activeSession.id) {
              console.log(`[SyncManager] Re-attaching order ${item.id} to new session ${ctx.activeSession.id}`);
              item.payload.sessionId = ctx.activeSession.id;
            }
          } catch (e) {
            console.error('[SyncManager] Failed to parse table context during sync', e);
          }
        }

        try {
          // Add a tiny delay to ensure the UI transition is visible and smooth
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const res = await ordersApi.create(item.payload);
          useLocalOrderStore.getState().updateOrderStatus(item.id, LocalOrderStatus.SYNCED, res.id);
          emitOrderAudit('success', 'Queued order synced successfully', {
            localOrderId: item.id,
            serverOrderId: res.id,
            branchId: item.branchId,
            sessionId: item.payload.sessionId,
          });
        } catch (err: any) {
          // Handle session expiry during background sync
          if (err.response?.data?.message === 'SESSION_EXPIRED') {
            try {
              const { contextApi } = await import('./api');
              const { useCartStore } = await import('@/stores/cartStore');
              const branchId = item.branchId || useCartStore.getState().branchId;
              if (!branchId) throw new Error('Missing branchId for session recovery');

              const ctx = await contextApi.getTableContext(branchId, item.tableId);
              item.payload.sessionId = ctx.activeSession.id;
              useLocalOrderStore.getState().updateOrderSession(item.id, ctx.activeSession.id);
              
              const retryRes = await ordersApi.create(item.payload);
              useLocalOrderStore.getState().updateOrderStatus(item.id, LocalOrderStatus.SYNCED, retryRes.id);
              emitOrderAudit('success', 'Queued order synced after session recovery', {
                localOrderId: item.id,
                serverOrderId: retryRes.id,
                branchId,
                sessionId: item.payload.sessionId,
              });
            } catch (retryErr) {
              // Mark as failed if retry also fails
              emitOrderAudit('error', 'Queued order sync failed after recovery', {
                localOrderId: item.id,
                branchId: item.branchId,
                sessionId: item.payload.sessionId,
                reason: (retryErr as any).message,
              });
              useLocalOrderStore.getState().updateOrderStatus(item.id, LocalOrderStatus.FAILED, undefined, (retryErr as any).message);
            }
          } else {
            // Check for terminal errors (like 400, 404, 403)
            const isNetworkError = !err.response || [503, 504].includes(err.response.status);
    
            if (isNetworkError) {
              remaining.push(item);
              useLocalOrderStore.getState().updateOrderStatus(item.id, LocalOrderStatus.PENDING);
            } else {
              // Terminal error (400 Bad Request, etc.): mark FAILED so user can see what's wrong
              const errorMsg = err.response?.data?.message || err.message;
              console.error(`[SyncManager] Terminal error for order ${item.id}:`, errorMsg);
              emitOrderAudit('error', 'Queued order rejected by server', {
                localOrderId: item.id,
                branchId: item.branchId,
                sessionId: item.payload.sessionId,
                reason: errorMsg,
              });
              useLocalOrderStore.getState().updateOrderStatus(
                item.id,
                LocalOrderStatus.FAILED,
                undefined,
                errorMsg,
              );
            }
          }
        }
      } catch (outerErr) {
        console.error(`[SyncManager] Critical error processing item ${item.id}:`, outerErr);
        remaining.push(item);
        useLocalOrderStore.getState().updateOrderStatus(item.id, LocalOrderStatus.PENDING);
      }
    }

    localStorage.setItem('arifsmart_offline_queue', JSON.stringify(remaining));
    isSyncing = false;
    console.log(`[SyncManager] Sync completed. ${remaining.length} orders remaining.`);
  },

  /**
   * Manually retry a failed order.
   */
  async retryOrder(localId: string) {
    const { useLocalOrderStore } = await import('@/stores/localOrderStore');
    const order = useLocalOrderStore.getState().orders[localId];
    if (!order) throw new Error('Order not found');

    const payload = {
      tableId: order.tableId,
      sessionId: order.sessionId,
      customerRef: order.customerRef,
      items: order.items.map((i) => ({ 
        menuItemId: i.menuItemId, 
        quantity: i.quantity,
        note: i.note,
        options: i.options 
      })),
    };

    useLocalOrderStore.getState().updateOrderStatus(localId, LocalOrderStatus.SYNCING);

    try {
      const res = await ordersApi.create(payload);
      useLocalOrderStore.getState().updateOrderStatus(localId, LocalOrderStatus.SYNCED, res.id);
      emitOrderAudit('success', 'Order retry succeeded', {
        localOrderId: localId,
        serverOrderId: res.id,
        branchId: order.branchId,
        sessionId: payload.sessionId,
      });
      return res;
    } catch (err: any) {
      // 🟢 CONTROLLED RECOVERY: Handle expired session during retry
      if (err.response?.data?.message === 'SESSION_EXPIRED') {
        try {
          const { contextApi } = await import('./api');
          const { useCartStore } = await import('@/stores/cartStore');
          const contextData = await contextApi.getTableContext(order.branchId, order.tableId);
          
          useCartStore.getState().setContext(
            contextData.branch.restaurantId,
            contextData.branch.id, 
            contextData.table.id, 
            contextData.activeSession.id,
            useCartStore.getState().customerRef || ''
          );
          useLocalOrderStore.getState().updateOrderSession(localId, contextData.activeSession.id);
          
          payload.sessionId = contextData.activeSession.id;
          const retryRes = await ordersApi.create(payload);
          useLocalOrderStore.getState().updateOrderStatus(localId, LocalOrderStatus.SYNCED, retryRes.id);
          return retryRes;
        } catch (retryError) {
          err = retryError;
        }
      }

      const isNetworkError = !err.response || [503, 504].includes(err.response.status);

      if (isNetworkError) {
        // Back to pending/queue
        this._enqueue(localId, payload, order.branchId, order.tableId);
        emitOrderAudit('info', 'Retry queued offline; will auto-sync later', {
          localOrderId: localId,
          branchId: order.branchId,
          sessionId: payload.sessionId,
        });
        throw new Error('Still offline. Order queued for later sync.');
      } else {
        const msg = err.response?.data?.message || err.message;
        emitOrderAudit('error', 'Order retry failed', {
          localOrderId: localId,
          branchId: order.branchId,
          sessionId: payload.sessionId,
          reason: msg,
        });
        useLocalOrderStore.getState().updateOrderStatus(localId, LocalOrderStatus.FAILED, undefined, msg);
        throw new Error(msg);
      }
    }
  },

  /** Private helpers */
  _getQueue() {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('arifsmart_offline_queue') || '[]');
    } catch {
      return [];
    }
  },

  _enqueue(id: string, payload: any, branchId: string, tableId: string) {
    if (typeof window === 'undefined') return;
    const queue = this._getQueue();
    // Don't add if already there
    if (!queue.find((q: any) => q.id === id)) {
      queue.push({ 
        id, 
        payload, 
        branchId, 
        tableId 
      });
      localStorage.setItem('arifsmart_offline_queue', JSON.stringify(queue));
    }
  },
};
