'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Printer, CheckCircle2, XCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { PrintableTicket } from './PrintableTicket';

// ── Types ──────────────────────────────────────────────────────────────────

interface OrderItemOption { optionName: string; optionPrice: number }
interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  note?: string;
  menuItem: { name: string };
  options?: OrderItemOption[];
}
interface Order {
  id: string;
  displayNumber?: string;
  status: string;
  sessionId: string;
  subTotal?: number;
  vatAmount?: number;
  serviceChargeAmount?: number;
  totalPrice: number;
  createdAt: string;
  table: { tableNumber: number };
  items: OrderItem[];
  notes?: string;
}

interface Props {
  orders: Order[];
  /** Called after a session is closed so the parent can refetch. */
  onOrdersChange?: () => void;
}

// ── Status helpers ─────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  CREATED:   'badge-status-created',
  CONFIRMED: 'badge-status-confirmed',
  PREPARING: 'badge-status-preparing',
  READY:     'badge-status-ready',
  DELIVERED: 'badge-status-delivered',
};

// ── Component ──────────────────────────────────────────────────────────────

export function AdminOrderTable({ orders, onOrdersChange }: Props) {
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  // Track which order is showing an inline close-session confirmation
  const [confirmCloseId, setConfirmCloseId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  const handlePrint = (order: Order) => {
    setPrintOrder(order);
    // Let the ticket render before triggering the browser print dialog
    setTimeout(() => window.print(), 100);
  };

  const handleCloseSession = async (order: Order) => {
    if (!order.sessionId) {
      setCloseError('Session ID not available for this order.');
      return;
    }
    setClosingId(order.id);
    setCloseError(null);
    try {
      await adminApi.closeTableSession(order.sessionId);
      setConfirmCloseId(null);
      onOrdersChange?.();
    } catch (err: any) {
      setCloseError(err.message ?? 'Failed to close session. Please try again.');
    } finally {
      setClosingId(null);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {(orders ?? []).map((order) => (
          <div
            key={order.id}
            className="card p-4"
            id={`admin-order-${order.id}`}
          >
            {/* ── Order header ──────────────────────────────────── */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-white text-sm">Table {order.table.tableNumber}</span>
                  {order.displayNumber && (
                    <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/50">
                      #{order.displayNumber}
                    </span>
                  )}
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

            {/* ── Item list ─────────────────────────────────────── */}
            <div className="mt-2 space-y-1">
              {(order.items ?? []).map((item) => (
                <div key={item.id} className="text-white/50 text-xs">
                  <span>{item.quantity}× {item.menuItem?.name ?? 'Item'}</span>
                  {item.options && item.options.length > 0 && (
                    <span className="text-white/30 ml-1">
                      ({item.options.map((o) => o.optionName).join(', ')})
                    </span>
                  )}
                  {item.note && (
                    <span className="text-amber-400/60 ml-1 italic">"{item.note}"</span>
                  )}
                </div>
              ))}
            </div>

            {/* ── Tax breakdown ─────────────────────────────────── */}
            {(order.subTotal ?? 0) > 0 && (
              <div className="mt-2 pt-2 border-t border-surface-200 flex gap-3 text-[10px] text-white/30">
                <span>Sub: ETB {Number(order.subTotal).toFixed(0)}</span>
                {(order.serviceChargeAmount ?? 0) > 0 && (
                  <span>Svc: ETB {Number(order.serviceChargeAmount).toFixed(0)}</span>
                )}
                {(order.vatAmount ?? 0) > 0 && (
                  <span>VAT: ETB {Number(order.vatAmount).toFixed(0)}</span>
                )}
              </div>
            )}

            {/* ── Actions ──────────────────────────────────────── */}
            <div className="mt-3 pt-3 border-t border-surface-200 flex flex-col gap-2">
              <div className="flex justify-end gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handlePrint(order)}
                  className="text-xs text-brand-400 bg-brand-500/10 px-3 py-1.5 rounded flex items-center gap-1.5 font-semibold transition hover:bg-brand-500/20"
                >
                  <Printer size={12} /> Print Ticket
                </motion.button>

                {order.status === 'DELIVERED' && (
                  <button
                    onClick={() => {
                      setConfirmCloseId(order.id);
                      setCloseError(null);
                    }}
                    className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded flex items-center gap-1.5 font-semibold transition hover:bg-red-500/20"
                    id={`close-session-${order.id}`}
                  >
                    Close Session
                  </button>
                )}
              </div>

              {/* Inline confirmation — replaces window.confirm() */}
              <AnimatePresence>
                {confirmCloseId === order.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-white/80 space-y-3">
                      <p>Close this session and reset the table? This cannot be undone.</p>
                      {closeError && (
                        <p className="text-red-400 font-medium">{closeError}</p>
                      )}
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setConfirmCloseId(null)}
                          className="flex items-center gap-1 text-white/50 hover:text-white/80 font-semibold transition"
                        >
                          <XCircle size={14} /> Cancel
                        </button>
                        <button
                          onClick={() => handleCloseSession(order)}
                          disabled={closingId === order.id}
                          className="flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold transition disabled:opacity-50"
                        >
                          {closingId === order.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                          Confirm Close
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Hidden print area */}
      {printOrder && (
        <PrintableTicket ref={ticketRef} order={printOrder} />
      )}
    </>
  );
}
