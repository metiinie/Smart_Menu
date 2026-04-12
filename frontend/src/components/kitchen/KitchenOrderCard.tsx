'use client';

import { motion } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { useState } from 'react';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  note?: string;
  menuItem: { name: string; imageUrl?: string };
}

interface KitchenOrder {
  id: string;
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

const NEXT_STATUS: Record<string, { label: string; value: string; color: string }> = {
  CREATED:   { label: 'Confirm',    value: 'CONFIRMED', color: 'bg-blue-500' },
  CONFIRMED: { label: 'Start Prep', value: 'PREPARING', color: 'bg-amber-500' },
  PREPARING: { label: 'Mark Ready', value: 'READY',     color: 'bg-emerald-500' },
};

const STATUS_BADGE: Record<string, string> = {
  CREATED:   'badge-status-created',
  CONFIRMED: 'badge-status-confirmed',
  PREPARING: 'badge-status-preparing',
  READY:     'badge-status-ready',
};

export function KitchenOrderCard({ order, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const next = NEXT_STATUS[order.status];

  const elapsed = Math.floor(
    (Date.now() - new Date(order.createdAt).getTime()) / 60000,
  );

  const updateStatus = async () => {
    if (!next) return;
    setLoading(true);
    try {
      await ordersApi.updateStatus(order.id, next.value);
      onUpdated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="card p-4 space-y-3"
      id={`kitchen-order-${order.id}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-white text-lg">
            Table {order.table.tableNumber}
          </span>
          <span className={STATUS_BADGE[order.status] ?? 'badge'}>
            {order.status}
          </span>
        </div>
        <div className="flex items-center gap-1 text-white/40 text-xs">
          <Clock size={12} />
          <span>{elapsed}m ago</span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {order.items.map((item) => (
          <div key={item.id} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm font-medium">{item.menuItem.name}</span>
              <span className="font-bold text-white text-sm bg-surface-200 rounded-lg px-2 py-0.5">
                ×{item.quantity}
              </span>
            </div>
            {item.note && (
              <p className="text-[11px] text-amber-400/90 italic ml-1">
                ↳ {item.note}
              </p>
            )}
          </div>
        ))}
      </div>

      {order.notes && (
        <p className="text-xs text-amber-400 bg-amber-500/10 rounded-xl px-3 py-2 border border-amber-500/20">
          📝 {order.notes}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-white/40 text-xs">
          ETB {Number(order.totalPrice).toFixed(0)}
        </span>
        {next && (
          <button
            onClick={updateStatus}
            disabled={loading}
            className={`${next.color} text-white text-sm font-semibold px-4 py-2
                        rounded-xl flex items-center gap-1.5 transition-opacity cursor-pointer
                        ${loading ? 'opacity-60' : ''}`}
            id={`kitchen-action-${order.id}`}
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <>{next.label} <ChevronRight size={14} /></>
            }
          </button>
        )}
      </div>
    </div>
  );
}
