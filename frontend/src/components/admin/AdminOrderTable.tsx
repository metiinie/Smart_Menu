'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { adminApi } from '@/lib/api';

interface OrderItem { id: string; quantity: number; menuItem: { name: string } }
interface Order {
  id: string;
  status: string;
  sessionId: string;
  totalPrice: number;
  createdAt: string;
  table: { tableNumber: number };
  items: OrderItem[];
}

interface Props { orders: Order[] }

const STATUS_BADGE: Record<string, string> = {
  CREATED:   'badge-status-created',
  CONFIRMED: 'badge-status-confirmed',
  PREPARING: 'badge-status-preparing',
  READY:     'badge-status-ready',
  DELIVERED: 'badge-status-delivered',
};

export function AdminOrderTable({ orders }: Props) {
  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="card p-4"
          id={`admin-order-${order.id}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white text-sm">Table {order.table.tableNumber}</span>
                <span className={STATUS_BADGE[order.status] ?? 'badge'}>{order.status}</span>
              </div>
              <p className="text-white/40 text-xs flex items-center gap-1">
                <Clock size={10} />
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <span className="font-display font-bold text-brand-400 text-sm flex-shrink-0">
              ETB {Number(order.totalPrice).toFixed(0)}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-surface-200">
            <p className="text-white/50 text-xs">
              {order.items.map((i) => `${i.menuItem.name} ×${i.quantity}`).join(' · ')}
            </p>
          </div>
          {order.status === 'DELIVERED' && (
            <div className="mt-3 pt-3 border-t border-surface-200 flex justify-end">
              <button
                onClick={async () => {
                   if (confirm('Close session and reset table?')) {
                     try {
                        if (order.sessionId) {
                           await adminApi.closeTableSession(order.sessionId);
                           alert('Session closed. Table reset!');
                        } else {
                           alert('Session tracking unavailable on this view.');
                        }
                     } catch (err: any) { alert(err.message); }
                   }
                }}
                className="text-xs text-red-500 bg-red-500/10 px-3 py-1.5 rounded flex flex-row items-center gap-2 cursor-pointer font-semibold transition hover:bg-red-500/20"
                id={`close-session-${order.id}`}
              >
                Close Session (Reset Table)
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
