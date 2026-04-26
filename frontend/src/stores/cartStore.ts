import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem } from '@arifsmart/shared';

interface CartStore {
  items: CartItem[];
  branchId: string | null;
  tableId: string | null;
  sessionId: string | null;
  customerRef: string | null;

  setContext: (branchId: string, tableId: string, sessionId: string, customerRef: string) => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      branchId: null,
      tableId: null,
      sessionId: null,
      customerRef: null,

      setContext: (branchId, tableId, sessionId, customerRef) =>
        set({ branchId, tableId, sessionId, customerRef }),

      addItem: (item) =>
        set((state) => {
          // Serialize options for comparison
          const serializeOpts = (opts: any) => JSON.stringify([...(opts || [])].sort((a,b) => a.optionName.localeCompare(b.optionName)));
          const itemOpts = serializeOpts(item.options);

          const existingIndex = state.items.findIndex(
            (i) => i.menuItemId === item.menuItemId && (i.note || '') === (item.note || '') && serializeOpts(i.options) === itemOpts
          );
          
          if (existingIndex > -1) {
            const newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + 1,
            };
            return { items: newItems };
          }
          
          return { items: [...state.items, { ...item, quantity: 1, cartItemId: crypto.randomUUID() }] };
        }),

      removeItem: (cartItemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.cartItemId !== cartItemId && i.menuItemId !== cartItemId), // Fallback if cartItemId is not set
        })),

      updateQuantity: (cartItemId, quantity) =>
        set((state) => {
          const isRemoving = quantity <= 0;
          const targetItems = state.items.filter((i) => {
            const isMatch = i.cartItemId === cartItemId || (!i.cartItemId && i.menuItemId === cartItemId);
            if (!isMatch) return true;
            return !isRemoving;
          });

          if (isRemoving) return { items: targetItems };

          return {
            items: state.items.map((i) => {
              const isMatch = i.cartItemId === cartItemId || (!i.cartItemId && i.menuItemId === cartItemId);
              return isMatch ? { ...i, quantity } : i;
            }),
          };
        }),

      clearCart: () => set({ items: [] }),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.priceAtAdd * i.quantity, 0),

      totalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'cart',
      storage: createJSONStorage(() => ({
        getItem: () => {
          if (typeof window === 'undefined') return null;
          const state = JSON.parse(localStorage.getItem('_cart_ctx') ?? '{}');
          const key = `cart:${state.branchId ?? ''}:${state.tableId ?? ''}:${state.sessionId ?? ''}:${state.customerRef ?? ''}`;
          return localStorage.getItem(key) ?? null;
        },
        setItem: ( value) => {
          if (typeof window === 'undefined') return;
          const parsed = JSON.parse(value);
          const { branchId, tableId, sessionId, customerRef } = parsed.state ?? {};
          if (branchId && tableId && sessionId && customerRef) {
            localStorage.setItem('_cart_ctx', JSON.stringify({ branchId, tableId, sessionId, customerRef }));
            localStorage.setItem(`cart:${branchId}:${tableId}:${sessionId}:${customerRef}`, value);
          }
        },
        removeItem: () => {
          if (typeof window === 'undefined') return;
          const state = JSON.parse(localStorage.getItem('_cart_ctx') ?? '{}');
          const key = `cart:${state.branchId ?? ''}:${state.tableId ?? ''}:${state.sessionId ?? ''}:${state.customerRef ?? ''}`;
          localStorage.removeItem(key);
        },
      })),
    },
  ),
);
