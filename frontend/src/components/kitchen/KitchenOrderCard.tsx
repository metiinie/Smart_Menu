'use client';

import { useState, useEffect } from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { ordersApi } from '@/lib/api';

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
  note?: string;
  menuItem: { name: string; imageUrl?: string };
  options?: OrderItemOption[];
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

const NEXT_STATUS: Record<string, { label: string; value: string; color: string }> = {
  CREATED:   { label: 'Confirm',    value: 'CONFIRMED', color: 'bg-blue-500 hover:bg-blue-400' },
  CONFIRMED: { label: 'Start Prep', value: 'PREPARING', color: 'bg-amber-500 hover:bg-amber-400' },
  PREPARING: { label: 'Mark Ready', value: 'READY',     color: 'bg-emerald-500 hover:bg-emerald-400' },
};

const STATUS_BADGE: Record<string, string> = {
  CREATED:   'badge-status-created',
  CONFIRMED: 'badge-status-confirmed',
  PREPARING: 'badge-status-preparing',
  READY:     'badge-status-ready',
};

const URGENT_THRESHOLD_MINUTES = 10; // highlight orders waiting > 10 min

// ── Helpers ────────────────────────────────────────────────────────────────

function getElapsedMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);
}

// ── Component ──────────────────────────────────────────────────────────────

export function KitchenOrderCard({ order, onUpdated }: Props) {
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

  return (
    <div
      className={`bg-slate-800 rounded-2xl border shadow-xl p-5 space-y-4 transition-colors ${
        isUrgent ? 'border-rose-500/60' : 'border-slate-700'
      }`}
      id={`kitchen-order-${order.id}`}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display font-black text-white text-xl whitespace-nowrap">
            Table {order.table.tableNumber}
          </span>
          {order.displayNumber && (
            <span className="text-xs font-mono bg-white/10 text-white/60 px-1.5 py-0.5 rounded">
              #{order.displayNumber}
            </span>
          )}
          <span className={`${STATUS_BADGE[order.status] ?? 'badge'} text-xs font-bold px-2 py-1 flex-shrink-0`}>
            {order.status}
          </span>
        </div>

        {/* Elapsed time — red when urgent */}
        <div className={`flex items-center gap-1.5 text-xs font-bold flex-shrink-0 ${
          isUrgent ? 'text-rose-400' : 'text-slate-400'
        }`}>
          <Clock size={14} />
          <span>{elapsed}m ago</span>
          {isUrgent && <span className="animate-pulse">⚠️</span>}
        </div>
      </div>

      {/* ── Items list ─────────────────────────────────────────────── */}
      <div className="space-y-3 bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
        {order.items.map((item) => (
          <div key={item.id} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-200 text-base font-semibold">{item.menuItem.name}</span>
              <span className="font-black text-white text-sm bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-lg px-2.5 py-0.5">
                ×{item.quantity}
              </span>
            </div>
            {/* Per-item modifiers */}
            {item.options && item.options.length > 0 && (
              <p className="text-xs text-slate-400 ml-2">
                {item.options.map((o) => o.optionName).join(' · ')}
              </p>
            )}
            {/* Per-item note */}
            {item.note && (
              <p className="text-xs text-amber-400/90 italic ml-2 border-l-2 border-amber-500/30 pl-2">
                {item.note}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Order-level notes ───────────────────────────────────────── */}
      {order.notes && (
        <p className="text-sm text-amber-400 bg-amber-500/10 rounded-xl px-3 py-2 border border-amber-500/20 font-medium">
          📝 {order.notes}
        </p>
      )}

      {/* ── Footer: price + action ──────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-700">
        <span className="text-slate-400 text-xs font-medium">
          ETB {Number(order.totalPrice).toFixed(0)}
        </span>

        {next && (
          <button
            onClick={updateStatus}
            disabled={loading}
            id={`kitchen-action-${order.id}`}
            className={`${next.color} text-white text-sm font-bold px-5 py-2.5
              rounded-xl flex items-center gap-2 transition-all
              hover:scale-[1.02] active:scale-95 cursor-pointer shadow-lg
              disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100`}
          >
            {loading ? (
              <div className="w-5 h-5 border-[3px] border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {next.label}
                <ChevronRight size={16} strokeWidth={3} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
