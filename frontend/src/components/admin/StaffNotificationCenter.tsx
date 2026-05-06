'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Receipt, User, HelpCircle } from 'lucide-react';
import { getSocket, joinRoom, leaveRoom } from '@/lib/socket';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore, selectBranchId } from '@/stores/authStore';

// ── Types ──────────────────────────────────────────────────────────────────

interface WaiterCall {
  tableNumber: number;
  tableId: string;
  requestType: 'WAITER' | 'BILL' | 'HELP';
  timestamp: string;
}

interface WaiterCallWithId extends WaiterCall {
  id: string;
}

// ── Config ─────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 12_000;

// ── Component ──────────────────────────────────────────────────────────────

export function StaffNotificationCenter() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const branchId = selectBranchId(user);
  const [calls, setCalls] = useState<WaiterCallWithId[]>([]);
  // Track timeout IDs so we can clear them all on unmount
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeCall = useCallback((id: string) => {
    setCalls((prev) => prev.filter((c) => c.id !== id));
    const t = timeoutsRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timeoutsRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    if (!user || !branchId) return;

    const socket = getSocket();
    const timeouts = timeoutsRef.current;
    
    const room = `staff:${branchId}`;
    joinRoom(room);

    const handleWaiterCall = (data: WaiterCall) => {
      const id = crypto.randomUUID();
      setCalls((prev) => [{ ...data, id }, ...prev]);

      // Play notification sound — fail silently if blocked
      try {
        new Audio('/notification.mp3').play().catch(() => {});
      } catch {
        // Audio API not available
      }

      // Auto-dismiss — store the timeout ID so it can be cleared on unmount or manual dismiss
      const t = setTimeout(() => {
        setCalls((prev) => prev.filter((c) => c.id !== id));
        timeouts.delete(id);
      }, AUTO_DISMISS_MS);
      timeouts.set(id, t);
    };

    socket.on('waiter-call', handleWaiterCall);

    return () => {
      // Remove only our specific handler
      socket.off('waiter-call', handleWaiterCall);
      leaveRoom(room);
      // Clear every pending auto-dismiss timeout so we don't fire on unmounted state
      timeouts.forEach((t) => clearTimeout(t));
      timeouts.clear();
    };
  }, [user, branchId]);

  if (calls.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-20 right-4 z-[200] flex flex-col gap-3 w-80 pointer-events-none"
    >
      <AnimatePresence initial={false}>
        {calls.map((call) => (
          <motion.div
            key={call.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="bg-surface rounded-2xl shadow-2xl border border-surface-200 p-4 pointer-events-auto flex gap-4 items-start backdrop-blur-md transition-colors duration-300"
          >
            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconStyle(call.requestType)}`}>
              {requestIcon(call.requestType)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-black text-foreground text-sm uppercase truncate">
                   {t('table')} {call.tableNumber}
                </h4>
                <button
                  onClick={() => removeCall(call.id)}
                  aria-label={t('dismissNotification' as any)}
                  className="text-foreground/20 hover:text-foreground/60 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-foreground/40 font-bold mt-0.5">
                {requestLabel(call.requestType, t)}
              </p>
              <p className="text-[10px] text-foreground/20 mt-2 font-medium">
                {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Pure helpers ───────────────────────────────────────────────────────────

function iconStyle(type: 'WAITER' | 'BILL' | 'HELP'): string {
  switch (type) {
    case 'BILL':   return 'bg-amber-500/10 text-amber-500';
    case 'WAITER': return 'bg-blue-500/10 text-blue-500';
    case 'HELP':   return 'bg-rose-500/10 text-rose-500';
  }
}

function requestIcon(type: 'WAITER' | 'BILL' | 'HELP') {
  switch (type) {
    case 'BILL':   return <Receipt size={24} />;
    case 'WAITER': return <User size={24} />;
    case 'HELP':   return <HelpCircle size={24} />;
  }
}

function requestLabel(type: 'WAITER' | 'BILL' | 'HELP', t: any): string {
  switch (type) {
    case 'BILL':   return t('requestingBill');
    case 'WAITER': return t('callForWaiter');
    case 'HELP':   return t('needsAssistance');
  }
}
