'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Users, 
  Coffee, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { staffApi } from '@/lib/api';
import { useAuthStore, selectBranchId } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';

export default function StaffTablesPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const branchId = selectBranchId(user);

  const { data: tables = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['staff-tables', branchId],
    queryFn: () => staffApi.getTables(branchId),
    enabled: !!branchId,
    refetchInterval: 10000,
  });

  const getTableStatus = (table: any) => {
    const activeSession = table.sessions?.[0];
    if (!activeSession) return { label: t('available' as any), color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 };
    
    const orders = activeSession.orders || [];
    const hasReady = orders.some((o: any) => o.status === 'READY');
    const hasPreparing = orders.some((o: any) => o.status === 'PREPARING' || o.status === 'CONFIRMED' || o.status === 'CREATED');
    
    if (hasReady) return { label: t('readyForPickup'), color: 'text-brand-500', bg: 'bg-brand-500/10', icon: AlertCircle, pulse: true };
    if (hasPreparing) return { label: t('waitingForFood'), color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock };
    
    return { label: t('occupied'), color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Users };
  };

  return (
    <div className="p-6 bg-background min-h-screen pb-24 transition-colors duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">{t('tableOverview')}</h1>
          <p className="text-sm text-foreground/40 mt-1 font-medium">{t('realTimeOccupancy')}</p>
        </div>
        <button 
          onClick={() => refetch()}
          className={`p-3 rounded-2xl bg-surface shadow-sm border border-surface-200 text-foreground/40 active:scale-90 transition-all ${isFetching ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={22} />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-surface-200 animate-pulse rounded-[2rem]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {tables.map((table: any) => {
            const status = getTableStatus(table);
            const Icon = status.icon;
            const activeSession = table.sessions?.[0];

            return (
              <motion.div
                key={table.id}
                layout
                className={`relative p-5 rounded-[2rem] border-2 transition-all duration-300 ${
                  activeSession 
                    ? 'bg-surface border-surface-200 shadow-xl shadow-foreground/5' 
                    : 'bg-surface-100 border-dashed border-surface-200 grayscale opacity-70'
                }`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-md ${
                    activeSession ? 'bg-foreground text-background' : 'bg-surface-200 text-foreground/20'
                  }`}>
                    {table.tableNumber}
                  </div>
                  {status.pulse && (
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500 shadow-sm"></span>
                    </span>
                  )}
                </div>

                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${status.bg} ${status.color}`}>
                  <Icon size={14} strokeWidth={3} />
                  <span className="text-[11px] font-black uppercase tracking-tight">{status.label}</span>
                </div>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-surface-100">
                  <div className="flex items-center gap-1.5 text-foreground/30">
                    <Coffee size={14} />
                    <span className="text-xs font-bold">
                      {activeSession?.orders?.length || 0}
                    </span>
                  </div>
                  {activeSession && (
                    <span className="text-xs font-black text-foreground bg-surface-100 px-2 py-1 rounded-lg">
                      {Number(activeSession.orders?.reduce((sum: number, o: any) => sum + Number(o.totalPrice), 0)).toFixed(0)}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
