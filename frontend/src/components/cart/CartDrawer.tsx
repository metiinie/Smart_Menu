'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Plus, Minus, Trash2, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api';
import { useState } from 'react';
import { useLocalOrderStore } from '@/stores/localOrderStore';
import { LocalOrder, LocalOrderStatus } from '@arifsmart/shared';
import { syncManager } from '@/lib/syncManager';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: Props) {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, totalPrice, branchId, tableId, sessionId } =
    useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const placeOrder = async () => {
    if (!tableId || !sessionId || !branchId) return;
    setLoading(true);
    setError('');

    let customerRef = localStorage.getItem('arifsmart_customerRef');
    if (!customerRef) {
      customerRef = crypto.randomUUID();
      localStorage.setItem('arifsmart_customerRef', customerRef);
    }
    
    const localId = crypto.randomUUID();
    const localOrder: LocalOrder = {
      id: localId,
      branchId,
      tableId,
      sessionId,
      customerRef,
      items: [...items],
      totalPrice: totalPrice(),
      status: LocalOrderStatus.PENDING,
      timestamp: Date.now(),
    };

    try {
      const result = await syncManager.placeOrder(localOrder);

      clearCart();
      onClose();

      if (result && result.type === 'QUEUED') {
        router.push(`/order/local/${localId}`);
      } else {
        router.push(`/order/${result.id}`);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-surface-50 z-50
                       flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-surface-200">
              <h2 className="font-display font-bold text-xl text-white">Your Cart</h2>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-surface-100 flex items-center justify-center"
                id="close-cart"
              >
                <X size={18} className="text-white/70" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-white/40">
                  <span className="text-5xl">🛒</span>
                  <p className="text-sm">Your cart is empty</p>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.menuItemId}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 bg-surface-100 rounded-2xl p-3"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-200 flex-shrink-0">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} width={56} height={56} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{item.name}</p>
                      {item.note && (
                        <p className="text-[10px] text-amber-400 font-medium italic mt-0.5 max-w-full truncate">
                          "{item.note}"
                        </p>
                      )}
                      <p className="text-brand-400 text-sm font-bold mt-0.5">
                        ETB {(item.priceAtAdd * item.quantity).toFixed(0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <motion.button whileTap={{ scale: 0.85 }}
                        onClick={() => updateQuantity(item.menuItemId, item.quantity - 1, item.note)}
                        className="w-7 h-7 rounded-lg bg-surface-200 flex items-center justify-center"
                        id={`cart-decrease-${item.menuItemId}`}
                      >
                        <Minus size={12} className="text-white" />
                      </motion.button>
                      <span className="w-5 text-center text-sm font-bold text-white">{item.quantity}</span>
                      <motion.button whileTap={{ scale: 0.85 }}
                        onClick={() => updateQuantity(item.menuItemId, item.quantity + 1, item.note)}
                        className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center"
                        id={`cart-increase-${item.menuItemId}`}
                      >
                        <Plus size={12} className="text-white" />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.85 }}
                        onClick={() => removeItem(item.menuItemId)}
                        className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center ml-1"
                        id={`cart-remove-${item.menuItemId}`}
                      >
                        <Trash2 size={12} className="text-red-400" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-surface-200 space-y-4 safe-bottom">
                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Total</span>
                    <span className="font-display font-bold text-xl text-white">
                      ETB {totalPrice().toFixed(0)}
                    </span>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={placeOrder}
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-4"
                  id="place-order-btn"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Place Order <ChevronRight size={18} />
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
