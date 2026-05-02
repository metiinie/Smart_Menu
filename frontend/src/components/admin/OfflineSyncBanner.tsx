'use client';

import { useShallow } from 'zustand/react/shallow';
import { useLocalOrderStore } from '@/stores/localOrderStore';
import { LocalOrderStatus } from '@/shared/types';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineSyncBanner() {
  const [mounted, setMounted] = useState(false);
  const pendingOrders = useLocalOrderStore(
    useShallow((s) =>
      Object.values(s.orders).filter(
        (o) => o.status === LocalOrderStatus.PENDING || o.status === LocalOrderStatus.SYNCING
      )
    )
  );
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {pendingOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-amber-500 text-white px-4 py-1.5 flex items-center justify-center gap-2 text-[11px] font-bold shadow-md z-50"
        >
          <Loader2 size={14} className="animate-spin" />
          <span>⚡ {pendingOrders.length} {pendingOrders.length === 1 ? 'order' : 'orders'} pending sync — reconnecting...</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
