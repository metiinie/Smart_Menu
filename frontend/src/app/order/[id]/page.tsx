'use client';

import { useEffect, useState, use } from 'react';
import { motion} from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Clock, Utensils, ArrowLeft, Star } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { getSocket, joinRoom, leaveRoom } from '@/lib/socket';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { ErrorState, NotFoundState } from '@/components/ui/StatusStates';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { PageTransition } from '@/components/ui/PageTransition';
import Link from 'next/link';
import type { Order } from '@/shared/types';
import { RatingModal } from '@/components/feedback/RatingModal';

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_MESSAGES: Record<string, { title: string; subtitle: string; emoji: string }> = {
  CREATED:   { title: 'Order Received!',     subtitle: 'Waiting for confirmation...', emoji: '🎉' },
  CONFIRMED: { title: 'Order Confirmed',      subtitle: 'Kitchen is getting ready',    emoji: '✅' },
  PREPARING: { title: 'Being Prepared',       subtitle: 'Your food is being cooked!',  emoji: '👨‍🍳' },
  READY:     { title: 'Ready to Serve!',      subtitle: 'A staff member will bring it', emoji: '🔔' },
  DELIVERED: { title: 'Enjoy your meal!',     subtitle: 'Thank you for choosing us',   emoji: '🍽️' },
};

export default function OrderStatusPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [orderId, setOrderId] = useState('');
  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    setOrderId(resolvedParams.id);
  }, [resolvedParams]);

  const { data: order, isLoading, isError, error, refetch } = useQuery<Order>({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId),
    enabled: !!orderId,
    refetchInterval: (query) => {
      const status = (query.state.data as Order | undefined)?.status;
      return status === 'DELIVERED' ? false : 3000;
    },
  });

  // Socket.io realtime (Enhancement only)
  useEffect(() => {
    if (!orderId) return;
    const socket = getSocket();
    const handleRefresh = () => refetch();
    
    socket.on('order-updated', handleRefresh);
    joinRoom(`order:${orderId}`);

    return () => { 
      socket.off('order-updated', handleRefresh);
      leaveRoom(`order:${orderId}`);
    };
  }, [orderId, refetch]);

  const msg = order ? STATUS_MESSAGES[order.status] ?? STATUS_MESSAGES.CREATED : null;
  const isDelivered = order?.status === 'DELIVERED';
  const hasRated = (order as any)?.ratings?.some((r: any) => !r.menuItemId);

  if (isError) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface p-6">
        <ErrorState
          message={error instanceof Error ? error.message : 'Could not load order'}
          errorType="ORDER_FETCH_FAILED"
          orderId={orderId}
          onRetry={refetch}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-surface p-6 space-y-4">
        <div className="h-8 w-32 bg-surface-100 rounded-lg animate-pulse mb-8" />
        <div className="h-48 w-full bg-surface-100 rounded-2xl animate-pulse" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface p-6">
        <NotFoundState
          title="Order Not Found"
          message="We couldn't find an order with this ID. It may have expired or belongs to a different session."
          returnLabel="Back to Menu"
        />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-dvh bg-surface flex flex-col">
        {/* Header */}
        <header className="safe-top bg-white/80 backdrop-blur-md border-b border-brand-500/5 sticky top-0 z-20">
          <div className="max-w-2xl mx-auto w-full px-4 py-4 flex items-center gap-3">
            <Link href="/" className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100 hover:border-brand-200 transition-colors">
              <ArrowLeft size={20} className="text-slate-800" />
            </Link>
            <div>
              <h1 className="font-display font-black text-slate-800 text-lg uppercase tracking-tight">Order Status</h1>
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest leading-none">Real-time Updates</p>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-20 pt-6">
        {/* Status hero */}
          <div className="bg-white rounded-[2.5rem] p-8 mb-6 text-center relative border border-brand-500/5 shadow-xl shadow-brand-500/5">
            <div className="absolute top-6 right-6 bg-brand-500/10 text-brand-600 font-mono font-black px-4 py-1.5 rounded-2xl text-[10px] uppercase tracking-widest border border-brand-500/10">
              #{order.displayNumber}
            </div>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-7xl mb-6 mt-4 drop-shadow-lg"
            >
              {msg?.emoji}
            </motion.div>
            <h2 className="font-display font-black text-3xl text-slate-800 uppercase tracking-tighter leading-none">{msg?.title}</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">{msg?.subtitle}</p>

            <div className="flex items-center justify-center gap-6 mt-8 pt-8 border-t border-slate-100">
              <div className="text-center">
                <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mb-1">Table</p>
                <p className="font-display font-black text-slate-800 text-xl">{order.table?.tableNumber ?? '—'}</p>
              </div>
              <div className="w-px h-10 bg-slate-100" />
              <div className="text-center">
                <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mb-1">Total</p>
                <p className="font-display font-black text-brand-500 text-xl">ETB {Number(order.totalPrice).toFixed(0)}</p>
              </div>
              <div className="w-px h-10 bg-slate-100" />
              <div className="text-center">
                <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mb-1">Items</p>
                <p className="font-display font-black text-slate-800 text-xl">{order.items?.length ?? 0}</p>
              </div>
            </div>
          </div>

        {/* Items list */}
        <div className="bg-white rounded-3xl p-6 mb-6 border border-brand-500/5 shadow-sm">
          <h3 className="font-display font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
            <Utensils size={14} className="text-brand-500" /> Your Selection
          </h3>
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 border-dashed">
                <div>
                  <span className="text-slate-800 text-sm font-bold block">{item.menuItem?.name ?? 'Item'}</span>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Qty: {item.quantity}</span>
                </div>
                <span className="text-slate-800 text-sm font-display font-black">
                  ETB {(Number(item.unitPrice) * item.quantity).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-3xl p-6 border border-brand-500/5 shadow-sm">
          <h3 className="font-display font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
            <Clock size={14} className="text-brand-500" /> Progress Timeline
          </h3>
          <OrderTimeline status={order.status} />
        </div>

        {isDelivered && (
          <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-emerald-600 font-bold text-lg mb-1">Delivered! Enjoy your meal 🎊</p>
            <p className="text-slate-400 text-xs mb-6 px-10">We hope you liked everything. Your feedback means the world to us!</p>
            
            {!hasRated && !showRating && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowRating(true)}
                className="inline-flex items-center gap-2 bg-brand-500 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-brand-500/20"
              >
                <Star size={18} className="fill-white" />
                Rate Experience
              </motion.button>
            )}

            {hasRated && (
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 flex items-center justify-center gap-2">
                <CheckCircle size={16} />
                <span className="text-sm font-bold">Thank you for your rating!</span>
              </div>
            )}
          </div>
        )}
      </main>

      {order && (
        <RatingModal 
          isOpen={showRating}
          onClose={() => setShowRating(false)}
          orderId={order.id}
          customerRef={(order as any).customerRef}
          onSuccess={() => refetch()}
        />
      )}
      </div>
    </PageTransition>
  );
}
