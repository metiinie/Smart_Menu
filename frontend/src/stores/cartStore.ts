import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem } from '@/shared/types';

interface CartStore {
  items: CartItem[];
  restaurantId: string | null;
  branchId: string | null;
  tableId: string | null;
  sessionId: string | null;
  customerRef: string | null;

  setContext: (restaurantId: string, branchId: string, tableId: string, sessionId: string, customerRef: string) => void;
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
      restaurantId: null,
      branchId: null,
      tableId: null,
      sessionId: null,
      customerRef: null,

      setContext: (restaurantId, branchId, tableId, sessionId, customerRef) =>
        set({ restaurantId, branchId, tableId, sessionId, customerRef }),

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
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          try {
            const ctxStr = localStorage.getItem('_cart_ctx');
            if (!ctxStr) {
              // Context not yet written (first visit / reload before API responds).
              // Fall back to the plain unscoped key so we don't lose cart items.
              return localStorage.getItem(name) ?? null;
            }
            const state = JSON.parse(ctxStr);
            const key = `${name}:${state.restaurantId ?? ''}:${state.branchId ?? ''}:${state.tableId ?? ''}:${state.sessionId ?? ''}:${state.customerRef ?? ''}`;
            return localStorage.getItem(key) ?? localStorage.getItem(name) ?? null;
          } catch (e) {
            console.error('Failed to get cart from storage:', e);
            return null;
          }
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          try {
            const parsed = JSON.parse(value);
            const { restaurantId, branchId, tableId, sessionId, customerRef } = parsed.state ?? {};
            // Always write the plain unscoped key as a fallback for getItem on reload
            localStorage.setItem(name, value);
            if (restaurantId && branchId && tableId && sessionId && customerRef) {
              localStorage.setItem('_cart_ctx', JSON.stringify({ restaurantId, branchId, tableId, sessionId, customerRef }));
              localStorage.setItem(`${name}:${restaurantId}:${branchId}:${tableId}:${sessionId}:${customerRef}`, value);
            }
          } catch (e) {
            console.error('Failed to set cart in storage:', e);
          }
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          try {
            const ctxStr = localStorage.getItem('_cart_ctx');
            if (!ctxStr) return;
            const state = JSON.parse(ctxStr);
            const key = `${name}:${state.restaurantId ?? ''}:${state.branchId ?? ''}:${state.tableId ?? ''}:${state.sessionId ?? ''}:${state.customerRef ?? ''}`;
            localStorage.removeItem(key);
          } catch (e) {
            console.error('Failed to remove cart from storage:', e);
          }
        },
      })),
    },
  ),
);
