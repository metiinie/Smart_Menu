'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Plus, Minus, Trash2, ChevronRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { LocalOrder, LocalOrderStatus } from '@arifsmart/shared';
import { syncManager } from '@/lib/syncManager';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { getLocalized } from '@/lib/i18n';

export function CartView() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, totalPrice, branchId, tableId, sessionId } =
    useCartStore();
  const { language } = useFavoritesStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = useMemo(() => totalPrice(), [items, totalPrice]);
  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

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
      totalPrice: total,
      status: LocalOrderStatus.PENDING,
      timestamp: Date.now(),
    };

    try {
      const result = await syncManager.placeOrder(localOrder);
      clearCart();
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

  if (items.length === 0) {
    return (
      <div className="cart-view">
        <div className="cart-view__empty">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="cart-view__empty-icon"
          >
            <ShoppingBag size={48} />
          </motion.div>
          <h3 className="cart-view__empty-title">Your cart is empty</h3>
          <p className="cart-view__empty-subtitle">
            Browse the menu and add your favorite dishes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-view">
      {/* Header summary */}
      <div className="cart-view__header">
        <div>
          <h3 className="cart-view__title">My Order</h3>
          <p className="cart-view__subtitle">{itemCount} item{itemCount !== 1 ? 's' : ''} in cart</p>
        </div>
        <button onClick={clearCart} className="cart-view__clear" id="cart-clear-all">
          Clear All
        </button>
      </div>

      {/* Items list */}
      <div className="cart-view__items">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.menuItemId + (item.note || '')}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60, height: 0 }}
              className="cart-view__item"
            >
              <div className="cart-view__item-img">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="cart-view__item-placeholder">🍽️</div>
                )}
              </div>
              <div className="cart-view__item-info">
                <h4 className="cart-view__item-name">
                  {getLocalized((item as any).nameTranslations, item.name, language)}
                </h4>
                {item.note && (
                  <p className="cart-view__item-note">&ldquo;{item.note}&rdquo;</p>
                )}
                <p className="cart-view__item-price">
                  ETB {(item.priceAtAdd * item.quantity).toFixed(0)}
                </p>
              </div>
              <div className="cart-view__item-actions">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                  className="cart-view__qty-btn cart-view__qty-btn--minus"
                >
                  <Minus size={14} />
                </motion.button>
                <span className="cart-view__qty">{item.quantity}</span>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                  className="cart-view__qty-btn cart-view__qty-btn--plus"
                >
                  <Plus size={14} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => removeItem(item.menuItemId)}
                  className="cart-view__remove-btn"
                >
                  <Trash2 size={14} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer checkout */}
      <div className="cart-view__footer">
        {error && <p className="cart-view__error">{error}</p>}
        <div className="cart-view__total">
          <span>Total</span>
          <span className="cart-view__total-amount">ETB {total.toFixed(0)}</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={placeOrder}
          disabled={loading}
          className="cart-view__checkout-btn"
          id="cart-place-order"
        >
          {loading ? (
            <div className="cart-view__spinner" />
          ) : (
            <>
              Place Order <ChevronRight size={18} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
