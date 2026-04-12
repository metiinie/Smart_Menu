import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LocalOrder, LocalOrderStatus } from '@arifsmart/shared';

interface LocalOrderStore {
  orders: Record<string, LocalOrder>;
  addOrder: (order: LocalOrder) => void;
  updateOrderStatus: (id: string, status: LocalOrderStatus, serverOrderId?: string, error?: string) => void;
  getOrder: (id: string) => LocalOrder | undefined;
}

export const useLocalOrderStore = create<LocalOrderStore>()(
  persist(
    (set, get) => ({
      orders: {},
      addOrder: (order) =>
        set((state) => ({
          orders: { ...state.orders, [order.id]: order },
        })),
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
    }),
    {
      name: 'local-orders',
    },
  ),
);
