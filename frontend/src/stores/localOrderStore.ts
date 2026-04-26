import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LocalOrder, LocalOrderStatus } from '@arifsmart/shared';

/** Orders older than this (ms) and in SYNCED state will be auto-pruned */
const PRUNE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface LocalOrderStore {
  orders: Record<string, LocalOrder>;
  addOrder: (order: LocalOrder) => void;
  updateOrderStatus: (id: string, status: LocalOrderStatus, serverOrderId?: string, error?: string) => void;
  getOrder: (id: string) => LocalOrder | undefined;
  /** Remove SYNCED orders older than 24h to prevent unbounded localStorage growth */
  pruneOldOrders: () => void;
  /** Clear all local orders (e.g., on logout or session reset) */
  clearAll: () => void;
}

export const useLocalOrderStore = create<LocalOrderStore>()(
  persist(
    (set, get) => ({
      orders: {},
      addOrder: (order) =>
        set((state) => {
          // Auto-prune stale orders on every new order
          const now = Date.now();
          const pruned: Record<string, LocalOrder> = {};
          for (const [id, o] of Object.entries(state.orders)) {
            const age = now - o.timestamp;
            const isStaleSynced = o.status === LocalOrderStatus.SYNCED && age > PRUNE_AGE_MS;
            if (!isStaleSynced) {
              pruned[id] = o;
            }
          }
          return { orders: { ...pruned, [order.id]: order } };
        }),
      updateOrderStatus: (id, status, serverOrderId, error) =>
        set((state) => {
          const order = state.orders[id];
          if (!order) return state;
          return {
            orders: {
              ...state.orders,
              [id]: { ...order, status, serverOrderId: serverOrderId ?? order.serverOrderId, error: error ?? order.error },
            },
          };
        }),
      getOrder: (id) => get().orders[id],
      pruneOldOrders: () =>
        set((state) => {
          const now = Date.now();
          const pruned: Record<string, LocalOrder> = {};
          for (const [id, o] of Object.entries(state.orders)) {
            const age = now - o.timestamp;
            const isStaleSynced = o.status === LocalOrderStatus.SYNCED && age > PRUNE_AGE_MS;
            if (!isStaleSynced) {
              pruned[id] = o;
            }
          }
          return { orders: pruned };
        }),
      clearAll: () => set({ orders: {} }),
    }),
    {
      name: 'local-orders',
    },
  ),
);
