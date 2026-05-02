'use client';

import { useEffect, useState, use } from 'react';
import { motion} from 'framer-motion';
import {  Utensils, ArrowLeft, WifiOff, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useLocalOrderStore } from '@/stores/localOrderStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LocalOrderStatus } from '@/shared/types';
import { syncManager } from '@/lib/syncManager';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LocalOrderPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const order = useLocalOrderStore((state) => state.orders[id]);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await syncManager.retryOrder(id);
      // If success, the useEffect will trigger redirect
    } catch (err) {
      // Error handled by syncManager (marks store as FAILED)
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    if (order?.status === LocalOrderStatus.SYNCED && order.serverOrderId) {
      router.push(`/order/${order.serverOrderId}`);
    }
  }, [order?.status, order?.serverOrderId, router]);

  useEffect(() => {
    if (!order) return;
    if (![LocalOrderStatus.PENDING, LocalOrderStatus.SYNCING].includes(order.status)) return;

    syncManager.startSync();
    const handleOnline = () => syncManager.startSync();
    const interval = window.setInterval(() => syncManager.startSync(), 5000);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.clearInterval(interval);
    };
  }, [order]);

  if (!order) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-surface p-6 text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h1 className="text-white font-bold text-xl mb-2">Order Not Found</h1>
        <p className="text-white/50 text-sm mb-6">We couldn&apos;t find the details for this local order.</p>
        <Link href="/" className="btn-primary px-8">Back to Menu</Link>
      </div>
    );
  }

  const isFailed = order.status === LocalOrderStatus.FAILED;
  const isSyncing = order.status === LocalOrderStatus.SYNCING;

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Header */}
      <header className="safe-top px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-full bg-surface-100 flex items-center justify-center">
            <ArrowLeft size={18} className="text-white/70" />
          </Link>
          <h1 className="font-display font-bold text-white text-lg">Order Status</h1>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
          ${isFailed ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
          {isFailed ? <AlertCircle size={10} /> : <WifiOff size={10} />}
          {isFailed ? 'Sync Failed' : 'Offline Mode'}
        </div>
      </header>

      <main className="flex-1 px-4 pb-8">
        {/* Status Hero */}
        <div className="card p-6 mb-6 text-center relative overflow-hidden">
          {isSyncing && (
             <motion.div
              className="absolute inset-0 bg-brand-500/5"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          <div className="text-6xl mb-4 mt-2">
            {isFailed ? '❌' : '⏳'}
          </div>

          <h2 className="font-display font-bold text-2xl text-white">
            {isFailed ? 'Sync Failed' : isSyncing ? 'Syncing Order...' : 'Order Queued'}
          </h2>
          <div className="mt-3 mb-1">
            <p className={`text-sm max-w-[260px] mx-auto font-bold px-3 py-2 rounded-xl border ${
              isFailed ? 'text-red-300 bg-red-500/10 border-red-500/20' : 'text-amber-300 bg-amber-500/10 border-amber-500/20'
            }`}>
              {isFailed
                ? (order.error || 'Server rejected the order. Please try again or ask staff.')
                : 'Connection Issue: Your order is queued. Please DO NOT close your browser until connection is restored.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-surface-200">
            <div className="text-center">
              <p className="text-white/40 text-xs">Status</p>
              <p className={`font-bold text-sm uppercase mt-0.5 ${isFailed ? 'text-red-400' : 'text-amber-400'}`}>
                {order.status}
              </p>
            </div>
            <div className="w-px h-8 bg-surface-200" />
            <div className="text-center">
              <p className="text-white/40 text-xs">Total</p>
              <p className="font-bold text-brand-400 text-lg">ETB {order.totalPrice.toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Action Button for failure */}
        {isFailed && (
           <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full bg-brand-500 text-white font-bold py-4 rounded-2xl mb-6 shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
            {isRetrying ? 'Syncing...' : 'Retry Synchronization'}
          </motion.button>
        )}

        {/* Navigation Button */}
        {isFailed && (
          <Link
            href={`/menu/${order.branchId}/${order.tableId}`}
            className="w-full bg-surface-100 text-white/80 font-semibold py-4 rounded-2xl mb-6 flex items-center justify-center gap-2 border border-surface-200"
          >
            <Utensils size={18} /> Continue Browsing Menu
          </Link>
        )}

        {/* Items List */}
        <div className="card p-4">
          <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-brand-400" /> Order Details
          </h3>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-1">
                <div className="flex flex-col">
                  <span className="text-white/80 text-sm font-medium">{item.name}</span>
                  <span className="text-white/30 text-[10px]">Price per unit: ETB {item.priceAtAdd}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/40 text-xs">×{item.quantity}</span>
                  <span className="text-white text-sm font-semibold">
                    ETB {(item.priceAtAdd * item.quantity).toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-white/20 text-[10px] mt-8 uppercase tracking-widest font-bold">
          Local ID: {order.id.slice(0, 8)} • Table {order.tableId.slice(-4).toUpperCase()}
        </p>
      </main>
    </div>
  );
}
