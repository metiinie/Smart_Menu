'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface Props {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: AlertCircle,
};

const COLORS = {
  success: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
  error: 'bg-red-500/20 border-red-500/40 text-red-300',
  info: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
};

export function Toast({ message, type = 'info', onClose, duration = 3000 }: Props) {
  const Icon = ICONS[type];

  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur
                  shadow-card max-w-sm w-full ${COLORS[type]}`}
    >
      <Icon size={18} className="flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose}><X size={16} /></button>
    </motion.div>
  );
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      <div className="pointer-events-auto">
        <AnimatePresence>{children}</AnimatePresence>
      </div>
    </div>
  );
}
