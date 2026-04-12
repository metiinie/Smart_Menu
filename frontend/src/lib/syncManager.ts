import { ordersApi } from './api';
import { LocalOrder, LocalOrderStatus } from '@arifsmart/shared';

let isSyncing = false;

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
      items: localOrder.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
    };

    try {
      const result = await ordersApi.create(payload);
      useLocalOrderStore.getState().updateOrderStatus(localOrder.id, LocalOrderStatus.SYNCED, result.id);
      return result;
    } catch (error: any) {
      const isNetworkError = !error.response || [503, 504].includes(error.response.status);

      if (isNetworkError) {
        this._enqueue(localOrder.id, payload);
        return { type: 'QUEUED', localId: localOrder.id };
      }

      // If it's a 400 or other terminal error, mark as FAILED
      if (error.response?.status === 400) {
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
        useLocalOrderStore.getState().updateOrderStatus(item.id, LocalOrderStatus.SYNCING);
        const res = await ordersApi.create(item.payload);
        useLocalOrderStore.getState().updateOrderStatus(item.id, LocalOrderStatus.SYNCED, res.id);
      } catch (err: any) {
        const isNetworkError = !err.response || [503, 504].includes(err.response.status);

        if (isNetworkError) {
          remaining.push(item);
          useLocalOrderStore.getState().updateOrderStatus(item.id, LocalOrderStatus.PENDING);
        } else if (err.response?.status === 400) {
          // Terminal error: mark FAILED and stop auto-syncing this item
          useLocalOrderStore.getState().updateOrderStatus(
            item.id,
            LocalOrderStatus.FAILED,
            undefined,
            err.response?.data?.message || err.message,
          );
        } else {
          // Other error: keep in queue but mark as pending
          remaining.push(item);
          useLocalOrderStore.getState().updateOrderStatus(item.id, LocalOrderStatus.PENDING);
        }
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
      items: order.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
    };

    useLocalOrderStore.getState().updateOrderStatus(localId, LocalOrderStatus.SYNCING);

    try {
      const res = await ordersApi.create(payload);
      useLocalOrderStore.getState().updateOrderStatus(localId, LocalOrderStatus.SYNCED, res.id);
      return res;
    } catch (err: any) {
      const isNetworkError = !err.response || [503, 504].includes(err.response.status);

      if (isNetworkError) {
        // Back to pending/queue
        this._enqueue(localId, payload);
        throw new Error('Still offline. Order queued for later sync.');
      } else {
        const msg = err.response?.data?.message || err.message;
        useLocalOrderStore.getState().updateOrderStatus(localId, LocalOrderStatus.FAILED, undefined, msg);
        throw new Error(msg);
      }
    }
  },

  // --- Private Helpers ---

  _getQueue(): any[] {
    try {
      return JSON.parse(localStorage.getItem('arifsmart_offline_queue') || '[]');
    } catch {
      return [];
    }
  },

  _enqueue(id: string, payload: any) {
    const queue = this._getQueue();
    // Avoid duplicates
    if (queue.some((i) => i.id === id)) return;

    queue.push({ id, payload, timestamp: Date.now() });
    localStorage.setItem('arifsmart_offline_queue', JSON.stringify(queue));
    
    // Lazy update
    import('@/stores/localOrderStore').then(({ useLocalOrderStore }) => {
      useLocalOrderStore.getState().updateOrderStatus(id, LocalOrderStatus.PENDING);
    });
  },
};
