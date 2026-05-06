'use client';

import { useState, useEffect } from 'react';
import { ordersApi, kitchenApi } from '@/lib/api';
import { RotateCcw, AlertTriangle, CheckCircle2, Loader2, Clock, ChevronRight, Utensils } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

// ── Types ──────────────────────────────────────────────────────────────────

interface OrderItemOption {
  id: string;
  optionName: string;
  optionPrice: number;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  status: string;
  menuItem: { id: string; name: string; imageUrl?: string };
  options?: OrderItemOption[];
  note?: string;
}

interface KitchenOrder {
  id: string;
  displayNumber?: string;
  status: string;
  totalPrice: number;
  notes?: string;
  createdAt: string;
  table: { tableNumber: number };
  items: OrderItem[];
}

interface Props {
  order: KitchenOrder;
  onUpdated: () => void;
}

// ── Constants ──────────────────────────────────────────────────────────────

const NEXT_STATUS: Record<string, { labelKey: string; value: string; color: string }> = {
  CREATED: { labelKey: 'confirmAction', value: 'CONFIRMED', color: 'bg-blue-400 hover:bg-blue-300 text-slate-950' },
  CONFIRMED: { labelKey: 'startPrep', value: 'PREPARING', color: 'bg-amber-400 hover:bg-amber-300 text-slate-950' },
  PREPARING: { labelKey: 'markReady', value: 'READY', color: 'bg-emerald-400 hover:bg-emerald-300 text-slate-950' },
};

const STATUS_BADGE: Record<string, string> = {
  CREATED: 'bg-surface-200 text-foreground font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider',
  CONFIRMED: 'bg-blue-500/10 text-blue-500 font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider',
  PREPARING: 'bg-amber-500/10 text-amber-500 font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider',
  READY: 'bg-emerald-500/10 text-emerald-500 font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider',
};

const URGENT_THRESHOLD_MINUTES = 10; // highlight orders waiting > 10 min

// ── Helpers ────────────────────────────────────────────────────────────────

function getElapsedMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);
}

// ── Component ──────────────────────────────────────────────────────────────

export function KitchenOrderCard({ order, onUpdated }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(() => getElapsedMinutes(order.createdAt));

  // Re-compute elapsed every minute so the display stays accurate
  useEffect(() => {
    setElapsed(getElapsedMinutes(order.createdAt));
    const timer = setInterval(() => {
      setElapsed(getElapsedMinutes(order.createdAt));
    }, 60_000);
    return () => clearInterval(timer);
  }, [order.createdAt]);

  const next = NEXT_STATUS[order.status];
  const isUrgent = elapsed >= URGENT_THRESHOLD_MINUTES && order.status !== 'READY';

  const updateStatus = async () => {
    if (!next || loading) return;
    setLoading(true);
    try {
      await ordersApi.updateStatus(order.id, next.value);
      onUpdated();
    } catch (err) {
      console.error('[KitchenOrderCard] Failed to update order status:', err);
    } finally {
      setLoading(false);
    }
  };

  const undoStatus = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await kitchenApi.moveOrderBack(order.id);
      onUpdated();
    } catch (err) {
      console.error('[KitchenOrderCard] Failed to undo status:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleItemStatus = async (itemId: string, currentStatus: string) => {
    const nextItemStatus: Record<string, string> = {
      PENDING: 'PREPARING',
      PREPARING: 'READY',
      READY: 'PENDING',
    };
    try {
      await kitchenApi.updateItemStatus(itemId, nextItemStatus[currentStatus] || 'PENDING');
      onUpdated();
    } catch (err) {
      console.error('[KitchenOrderCard] Failed to update item status:', err);
    }
  };

  const toggleAvailability = async (itemId: string, isAvailable: boolean) => {
    if (!confirm(t('confirmAvailability', { status: isAvailable ? t('available') : t('outOfStock') }))) return;
    try {
      await kitchenApi.toggleMenuItemAvailability(itemId, isAvailable);
      alert(t('settingsSaved' as any));
    } catch (err) {
      console.error('[KitchenOrderCard] Failed to toggle availability:', err);
    }
  };

  return (
    <div
      className={`bg-surface-card rounded-2xl border-2 shadow-lg p-3 space-y-2 transition-all ${isUrgent ? 'border-rose-500 shadow-rose-500/10' : 'border-surface-200 shadow-slate-200/10'}`}
      id={`kitchen-order-${order.id}`}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-y-3">
        {/* Left Side: Table & Order # */}
        <div className="flex items-center gap-2.5">
          <span className="font-display font-black text-foreground text-xl leading-none">
            {t('table')} {order.table.tableNumber}
          </span>
          {order.displayNumber && (
            <span className="text-[11px] font-mono bg-surface-100 text-foreground/40 px-1.5 py-0.5 rounded-lg font-bold border border-surface-200">
              #{order.displayNumber}
            </span>
          )}
        </div>

        {/* Right Side: Status & Time */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <span className={`${STATUS_BADGE[order.status] ?? 'badge'} text-[9px] font-black px-2 py-1 rounded-lg shadow-sm border border-black/5`}>
            {t(order.status.toLowerCase() as any)}
          </span>
          <div className={`flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-lg bg-surface-100 border border-surface-200 ${isUrgent ? 'text-rose-600' : 'text-foreground/40'
            }`}>
            <Clock size={12} strokeWidth={3} />
            <span>{elapsed}m</span>
          </div>
          {isUrgent && <AlertTriangle size={14} className="text-rose-500 animate-pulse" />}
        </div>
      </div>

      {/* ── Items list ─────────────────────────────────────────────── */}
      <div className="space-y-1.5 bg-surface-100/50 rounded-xl p-1.5 border border-surface-200">
        {order.items.map((item) => (
          <div key={item.id} className="group/item bg-surface-card rounded-lg p-1 border border-surface-200 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start gap-2">
              {/* Image + Qty Overlay */}
              <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-surface-200 flex-shrink-0 border border-surface-200">
                {item.menuItem.imageUrl ? (
                  <img src={item.menuItem.imageUrl} className="w-full h-full object-cover" alt={item.menuItem.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-foreground/20">
                    <Utensils size={20} />
                  </div>
                )}
                <div className="absolute bottom-0 right-0 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-black px-1.5 py-0.5 rounded-tl-lg min-w-[22px] text-center">
                  ×{item.quantity}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <span className="text-foreground text-[12px] font-black leading-tight">
                    {item.menuItem.name}
                  </span>
                  <button
                    onClick={() => toggleItemStatus(item.id, item.status)}
                    className={`text-[8px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded-md border transition-all active:scale-90 flex-shrink-0 ${item.status === 'READY'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : item.status === 'PREPARING'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-surface-200 text-foreground/30 border-surface-300'
                      }`}
                  >
                    {t(item.status.toLowerCase() as any)}
                  </button>
                </div>

                {/* Modifiers & Notes */}
                <div className="mt-1 space-y-1">
                  {item.options && item.options.length > 0 && (
                    <p className="text-[10px] text-foreground/40 font-bold">
                      {item.options.map((o) => o.optionName).join(' • ')}
                    </p>
                  )}
                  {item.note && (
                    <p className="text-[10px] text-brand-500 bg-brand-500/5 rounded-lg px-2 py-1 italic font-medium">
                      &quot;{item.note}&quot;
                    </p>
                  )}
                </div>

                <button 
                  onClick={() => toggleAvailability(item.menuItem.id, false)}
                  className="mt-2 opacity-0 group-hover/item:opacity-100 transition-opacity text-[8px] bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-md uppercase font-black"
                >
                  {t('outOfStock')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Order-level notes ───────────────────────────────────────── */}
      {order.notes && (
        <p className="text-sm text-brand-500 bg-brand-500/5 rounded-2xl px-4 py-3 border-2 border-brand-500/10 font-bold leading-relaxed">
          📝 {order.notes}
        </p>
      )}

      {/* ── Footer: price + action ──────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-surface-200">
        <div className="flex flex-col">
          <span className="text-foreground/30 text-[8px] font-black uppercase tracking-[0.15em] leading-none mb-0.5">{t('total')}</span>
          <span className="text-foreground text-xs font-black">
            ETB {Number(order.totalPrice).toFixed(0)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Undo Button (Verify Icon) */}
          {order.status !== 'CREATED' && order.status !== 'DELIVERED' && (
            <button
              onClick={undoStatus}
              disabled={loading}
              className="w-12 h-12 rounded-2xl bg-surface hover:bg-surface-100 text-foreground/20 hover:text-foreground flex items-center justify-center transition-all border-2 border-surface-200 shadow-sm active:scale-90 disabled:opacity-50"
              title={t('undoStatus' as any)}
            >
              <RotateCcw size={18} strokeWidth={3} />
            </button>
          )}

          {next && (
            <button
              onClick={updateStatus}
              disabled={loading}
              id={`kitchen-action-${order.id}`}
              className={`${next.color} text-[11px] font-black px-5 py-2.5
                rounded-xl flex items-center gap-2 transition-all
                hover:scale-[1.02] active:scale-95 cursor-pointer shadow-md
                disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 uppercase tracking-wider`}
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  {t(next.labelKey as any)}
                  <ChevronRight size={14} strokeWidth={3} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
