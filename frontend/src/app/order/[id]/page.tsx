'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Clock, Utensils, ArrowLeft } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { getSocket, joinRoom, leaveRoom } from '@/lib/socket';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { ErrorState, NotFoundState } from '@/components/ui/StatusStates';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import Link from 'next/link';
import type { Order } from '@arifsmart/shared';

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
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    setOrderId(params.id);
  }, [params]);

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
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Header */}
      <header className="safe-top px-4 py-4 flex items-center gap-3">
        <Link href="/" className="w-9 h-9 rounded-full bg-surface-100 flex items-center justify-center">
          <ArrowLeft size={18} className="text-white/70" />
        </Link>
        <h1 className="font-display font-bold text-white text-lg">Order Status</h1>
      </header>

      <main className="flex-1 px-4 pb-8">
        {/* Status hero */}
        <div
          className="card p-6 mb-6 text-center relative"
        >
          <div className="absolute top-4 right-4 bg-brand-500/20 text-brand-400 font-mono font-bold px-3 py-1 rounded-full text-xs">
            #{order.displayNumber}
          </div>
          <div
            className="text-6xl mb-4 mt-2"
          >
            {msg?.emoji}
          </div>
          <h2 className="font-display font-bold text-2xl text-white">{msg?.title}</h2>
          <p className="text-white/50 text-sm mt-1">{msg?.subtitle}</p>

          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-surface-200">
            <div className="text-center">
              <p className="text-white/40 text-xs">Table</p>
              <p className="font-bold text-white text-lg">{order.table?.tableNumber ?? '—'}</p>
            </div>
            <div className="w-px h-8 bg-surface-200" />
            <div className="text-center">
              <p className="text-white/40 text-xs">Total</p>
              <p className="font-bold text-brand-400 text-lg">ETB {Number(order.totalPrice).toFixed(0)}</p>
            </div>
            <div className="w-px h-8 bg-surface-200" />
            <div className="text-center">
              <p className="text-white/40 text-xs">Items</p>
              <p className="font-bold text-white text-lg">{order.items?.length ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Items list */}
        <div className="card p-4 mb-6 space-y-2">
          <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
            <Utensils size={14} className="text-brand-400" /> Your Order
          </h3>
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-surface-200 last:border-0">
              <span className="text-white/80 text-sm">{item.menuItem?.name ?? 'Item'}</span>
              <div className="flex items-center gap-3">
                <span className="text-white/40 text-xs">×{item.quantity}</span>
                <span className="text-white text-sm font-semibold">
                  ETB {(Number(item.unitPrice) * item.quantity).toFixed(0)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="card">
          <div className="px-4 pt-4 pb-1">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Clock size={14} className="text-brand-400" /> Progress
            </h3>
          </div>
          <OrderTimeline status={order.status} />
        </div>

        {isDelivered && (
          <div
            className="mt-6 text-center"
          >
            <CheckCircle size={32} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-emerald-400 font-semibold">Order complete! Enjoy your meal 🎊</p>
          </div>
        )}
      </main>
    </div>
  );
}
