'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Plus, Minus, Trash2, ChevronRight, ShoppingBag, AlertTriangle } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { LocalOrder, LocalOrderStatus, MenuCategoryDto } from '@/shared/types';
import { syncManager } from '@/lib/syncManager';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { getLocalized } from '@/lib/i18n';
import { formatPrice } from '@/lib/formatters';

// ── Tax rate defaults (used when branch settings are unavailable) ─────────
const DEFAULT_SERVICE_CHARGE_RATE = 10; // percent
const DEFAULT_VAT_RATE = 15;            // percent

/** Read branch tax rates from the persisted table context */
function getBranchTaxRates(): { serviceChargeRate: number; vatRate: number } {
  if (typeof window === 'undefined') {
    return { serviceChargeRate: DEFAULT_SERVICE_CHARGE_RATE, vatRate: DEFAULT_VAT_RATE };
  }
  try {
    const ctx = JSON.parse(localStorage.getItem('_table_ctx') ?? '{}');
    return {
      serviceChargeRate: ctx.branch?.serviceChargeRate ?? DEFAULT_SERVICE_CHARGE_RATE,
      vatRate: ctx.branch?.vatRate ?? DEFAULT_VAT_RATE,
    };
  } catch {
    return { serviceChargeRate: DEFAULT_SERVICE_CHARGE_RATE, vatRate: DEFAULT_VAT_RATE };
  }
}

interface Props {
  groupedMenu?: MenuCategoryDto[];
}

export function CartView({ groupedMenu = [] }: Props) {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, restaurantId, branchId, tableId, sessionId } = useCartStore();
  const { language } = useFavoritesStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Read tax rates from branch settings
  const { serviceChargeRate, vatRate } = useMemo(() => getBranchTaxRates(), []);

  // Flatten all live items
  const allItems = useMemo(
    () => groupedMenu.flatMap((g) => g.items),
    [groupedMenu]
  );

  const liveItems = useMemo(() => {
    return items.map((cartItem) => {
      const realItem = allItems.find((i) => i.id === cartItem.menuItemId);
      const isAvailable = realItem ? realItem.isAvailable : false;
      
      const basePrice = realItem ? realItem.price : cartItem.priceAtAdd;
      
      const optionsTotal = cartItem.options?.reduce((s, o) => s + o.optionPrice, 0) || 0;
      const unitPrice = basePrice + optionsTotal;
      
      return {
        ...cartItem,
        liveUnitPrice: unitPrice,
        isAvailable,
      };
    });
  }, [items, allItems]);
  const hasUnavailable = useMemo(
    () => liveItems.some((item) => !item.isAvailable),
    [liveItems],
  );

  const subTotal = useMemo(() => liveItems.reduce((sum, item) => sum + item.liveUnitPrice * item.quantity, 0), [liveItems]);
  const serviceCharge = subTotal * (serviceChargeRate / 100);
  const vat = (subTotal + serviceCharge) * (vatRate / 100);
  const grandTotal = subTotal + serviceCharge + vat;

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const placeOrder = async () => {
    if (!tableId || !sessionId || !branchId || hasUnavailable) return;
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
      restaurantId: restaurantId || '',
      branchId: branchId || '',
      tableId,
      sessionId,
      customerRef,
      items: [...items],
      totalPrice: grandTotal,
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
          <h3 className="cart-view__empty-title text-surface-900">Your cart is empty</h3>
          <p className="cart-view__empty-subtitle text-surface-500">
            Browse the menu and add your favorite dishes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-view flex flex-col h-full bg-surface-50">
      {/* Header summary */}
      <div className="cart-view__header flex items-center justify-between p-5 border-b border-surface-200">
        <div>
          <h3 className="cart-view__title font-display font-bold text-xl text-surface-900">My Order</h3>
          <p className="cart-view__subtitle text-surface-500">{itemCount} item{itemCount !== 1 ? 's' : ''} in cart</p>
        </div>
        <button onClick={clearCart} className="cart-view__clear text-red-400 font-medium text-sm px-3 py-1 bg-red-400/10 rounded-lg" id="cart-clear-all">
          Clear All
        </button>
      </div>

      {/* Items list */}
      <div className="cart-view__items flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {liveItems.map((item) => (
            <motion.div
              key={item.cartItemId || item.menuItemId + (item.note || '')}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60, height: 0 }}
              className={`py-3 border-b border-surface-200/50 last:border-0 ${!item.isAvailable ? 'opacity-70 grayscale-[0.5]' : ''}`}
            >
              <div className="flex items-center gap-3">
                {/* Image */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-200 flex-shrink-0 relative shadow-sm">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                  )}
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <AlertTriangle size={14} className="text-red-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="font-semibold text-surface-900 text-sm truncate">
                    {getLocalized((item as any).nameTranslations, item.name, language)}
                  </h4>
                   <p className="text-brand-400 text-xs font-bold mt-0.5">
                    {formatPrice(item.liveUnitPrice * item.quantity)}
                  </p>
                  
                  {/* Metadata (Unavailable / Notes / Options) */}
                  {(!item.isAvailable || item.note || (item.options && item.options.length > 0)) && (
                    <div className="flex flex-col gap-0.5 mt-1">
                      {!item.isAvailable && (
                        <p className="text-[10px] text-red-400 font-medium">Item Unavailable</p>
                      )}
                      {item.note && (
                        <p className="text-[10px] text-amber-400 font-medium italic truncate">
                          &quot;{item.note}&quot;
                        </p>
                      )}
                      {item.options && item.options.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.options.map((opt, idx) => (
                            <span key={idx} className="text-[9px] text-surface-500">
                              {opt.optionName}{opt.optionPrice > 0 ? ` (+${opt.optionPrice})` : ''}{idx < item.options!.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions (Inline: - QTY + | Trash) */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1 bg-surface-200/50 p-1 rounded-full border border-surface-200/50">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => updateQuantity(item.cartItemId || item.menuItemId, item.quantity - 1)}
                      className="w-6 h-6 rounded-full bg-surface-200 flex items-center justify-center hover:bg-surface-300 transition-colors"
                    >
                      <Minus size={12} className="text-surface-700" />
                    </motion.button>
                    <span className="w-4 text-center text-xs font-bold text-surface-900">{item.quantity}</span>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => updateQuantity(item.cartItemId || item.menuItemId, item.quantity + 1)}
                      className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center shadow-sm"
                    >
                      <Plus size={12} className="text-white" />
                    </motion.button>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => removeItem(item.cartItemId || item.menuItemId)}
                    className="p-1.5 rounded-full text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer checkout */}
      <div className="p-4 border-t border-surface-200 space-y-4 bg-surface-50 safe-bottom">
        {error && <p className="text-red-400 text-sm text-center font-medium bg-red-400/10 py-2 rounded-lg">{error}</p>}
        {hasUnavailable && <p className="text-red-400 text-xs text-center">Please remove unavailable items to checkout.</p>}
        
        {/* Centered Receipt Design */}
        <div className="bg-surface-100/50 rounded-2xl p-4 mx-2 space-y-3 backdrop-blur-sm border border-surface-200/50">
          <div className="flex items-center justify-between text-surface-500 text-xs font-medium">
            <span>Subtotal</span>
            <span>{formatPrice(subTotal)}</span>
          </div>
          <div className="flex items-center justify-between text-surface-500 text-xs font-medium">
            <span>Service Charge ({serviceChargeRate}%)</span>
            <span>{formatPrice(serviceCharge)}</span>
          </div>
          <div className="flex items-center justify-between text-surface-500 text-xs font-medium">
            <span>VAT ({vatRate}%)</span>
            <span>{formatPrice(vat)}</span>
          </div>
          
          <div className="border-t border-surface-200/50 pt-3 flex items-center justify-between">
            <span className="text-surface-900 text-sm font-bold">Grand Total</span>
            <span className="font-display font-bold text-xl text-brand-400">
              {formatPrice(grandTotal)}
            </span>
          </div>
        </div>

        {/* Small Pill Button Centered */}
        <div className="flex justify-center pb-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={placeOrder}
            disabled={loading || hasUnavailable}
            className={`px-8 py-3.5 rounded-full font-bold flex items-center justify-center gap-2 text-sm transition-all ${
              hasUnavailable 
                ? 'bg-surface-300 text-white/50 cursor-not-allowed' 
                : 'bg-brand-500 text-white shadow-[0_4px_20px_rgba(74,157,255,0.3)] hover:scale-[1.02]'
            }`}
            id="cart-place-order"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Place Order <ChevronRight size={16} />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
