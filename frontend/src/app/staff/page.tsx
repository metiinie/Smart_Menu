'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Package, 
  Search, 
  Filter,
  RefreshCw,
  Wifi,
  WifiOff,
  ShoppingBag
} from 'lucide-react';
import { staffApi } from '@/lib/api';
import { useAuthStore, selectBranchId } from '@/stores/authStore';
import { getSocket } from '@/lib/socket';
import { StaffOrderCard } from '@/components/staff/StaffOrderCard';
import { ErrorState, EmptyState } from '@/components/ui/StatusStates';
import { useTranslation } from '@/hooks/useTranslation';

export default function StaffPickupPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const branchId = selectBranchId(user);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<'PICKUP' | 'HISTORY'>('PICKUP');

  // Fetch orders
  const { data: orders = [], isFetching, isError, refetch } = useQuery({
    queryKey: ['staff-orders', branchId],
    queryFn: () => staffApi.getOrders(branchId),
    enabled: !!branchId,
    refetchInterval: 15000,
  });

  const stableRefetch = useCallback(() => refetch(), [refetch]);

  // Real-time listener
  useEffect(() => {
    if (!branchId) return;
    const socket = getSocket();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onRefresh = () => stableRefetch();

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new-order', onRefresh);
    socket.on('order-updated', onRefresh);

    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new-order', onRefresh);
      socket.off('order-updated', onRefresh);
    };
  }, [branchId, stableRefetch]);

  // Deliver mutation
  const deliverMutation = useMutation({
    mutationFn: (orderId: string) => staffApi.markAsDelivered(orderId),
    onSuccess: () => {
      toast.success(t('orderDelivered' as any));
      stableRefetch();
    },
    onError: () => toast.error(t('error' as any)),
  });

  const pickupOrders = orders.filter((o: any) => o.status === 'READY');
  const preparingOrders = orders.filter((o: any) => o.status === 'PREPARING' || o.status === 'CONFIRMED' || o.status === 'CREATED');
  const deliveredToday = orders.filter((o: any) => o.status === 'DELIVERED');

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      {/* Search & Status Bar */}
      <div className="bg-surface px-6 py-4 border-b border-surface-200 flex items-center gap-4 sticky top-0 z-30 transition-colors duration-300">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
          <input 
            type="text"
            placeholder={t('searchPlaceholder' as any)}
            className="w-full bg-surface-100 border-2 border-transparent rounded-[1.25rem] py-3 pl-12 pr-4 text-sm font-bold text-foreground placeholder:text-foreground/30 focus:border-brand-500 focus:bg-surface transition-all outline-none"
          />
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm ${
          isConnected ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
        }`}>
          {isConnected ? <Wifi size={14} strokeWidth={3} /> : <WifiOff size={14} strokeWidth={3} />}
          <span className="hidden xs:inline">{isConnected ? t('online' as any) : t('polling')}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface px-6 pt-2 flex gap-8 border-b border-surface-200 sticky top-[73px] z-20 transition-colors duration-300">
        <button 
          onClick={() => setFilter('PICKUP')}
          className={`pb-4 text-sm font-black transition-all relative ${
            filter === 'PICKUP' ? 'text-foreground' : 'text-foreground/40 hover:text-foreground/60'
          }`}
        >
          {t('activeOrders')}
          {pickupOrders.length > 0 && (
            <span className="ml-2 bg-brand-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black shadow-lg shadow-brand-500/20">
              {pickupOrders.length}
            </span>
          )}
          {filter === 'PICKUP' && (
            <motion.div layoutId="staffTab" className="absolute bottom-0 inset-x-0 h-1 bg-brand-500 rounded-t-full" />
          )}
        </button>
        <button 
          onClick={() => setFilter('HISTORY')}
          className={`pb-4 text-sm font-black transition-all relative ${
            filter === 'HISTORY' ? 'text-foreground' : 'text-foreground/40 hover:text-foreground/60'
          }`}
        >
          {t('todaysHistory')}
          {filter === 'HISTORY' && (
            <motion.div layoutId="staffTab" className="absolute bottom-0 inset-x-0 h-1 bg-brand-500 rounded-t-full" />
          )}
        </button>
      </div>

      {/* List Area */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar">
        {isError && <ErrorState message={t('error' as any)} onRetry={refetch} />}
        
        {filter === 'PICKUP' ? (
          <>
            {pickupOrders.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Package size={18} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">
                    {t('readyForDelivery')}
                  </h3>
                </div>
                {pickupOrders.map((order: any) => (
                  <StaffOrderCard 
                    key={order.id} 
                    order={order} 
                    onDeliver={(id) => deliverMutation.mutate(id)}
                    isDelivering={deliverMutation.isPending && deliverMutation.variables === order.id}
                  />
                ))}
              </div>
            )}

            {preparingOrders.length > 0 && (
              <div className="space-y-4 pt-6">
                <div className="flex items-center gap-3 mb-2 opacity-60">
                  <div className="w-8 h-8 rounded-lg bg-surface-200 flex items-center justify-center text-foreground/40">
                    <ShoppingBag size={18} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">
                    {t('inKitchen')}
                  </h3>
                </div>
                {preparingOrders.map((order: any) => (
                  <StaffOrderCard 
                    key={order.id} 
                    order={order} 
                    onDeliver={() => {}} 
                  />
                ))}
              </div>
            )}

              <div className="py-20 bg-surface rounded-[2.5rem] border-2 border-dashed border-surface-200 text-center">
                <div className="w-20 h-20 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-4">
                  <Package size={32} className="text-foreground/20" />
                </div>
                <h4 className="text-lg font-black text-foreground">{t('allClear')}</h4>
                <p className="text-sm text-foreground/40 mt-1 font-medium px-10">{t('waitingForOrders')}</p>
              </div>
          </>
        ) : (
          <div className="space-y-4">
            {deliveredToday.length === 0 ? (
              <div className="py-20 text-center bg-surface rounded-[2.5rem] border-2 border-dashed border-surface-200">
                <EmptyState message={t('noData' as any)} />
              </div>
            ) : (
              deliveredToday.map((order: any) => (
                <StaffOrderCard 
                  key={order.id} 
                  order={order} 
                  onDeliver={() => {}} 
                />
              ))
            )}
          </div>
        )}
      </main>

      {/* Sync indicator */}
      <AnimatePresence>
        {isFetching && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 z-50 bg-slate-900 text-white p-3 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <RefreshCw size={16} className="animate-spin text-brand-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">{t('syncing' as any)}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
