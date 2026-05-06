'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { getSocket, joinRoom, leaveRoom } from '@/lib/socket';
import { AdminOrderTable } from '@/components/admin/AdminOrderTable';
import { useAuthStore, selectBranchId } from '@/stores/authStore';
import { EmptyState, ErrorState } from '@/components/ui/StatusStates';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useTranslation } from '@/hooks/useTranslation';

const ALL_STATUSES = ['ALL', 'CREATED', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'] as const;
type StatusFilter = typeof ALL_STATUSES[number];

export default function AdminOrdersPage() {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [isConnected, setIsConnected] = useState(false);

  // Resolve branchId from the authenticated user — consistent with kitchen/dashboard pages
  const branchId = selectBranchId(user);

  const { data: orders = [], isFetching, isError, refetch } = useQuery({
    queryKey: ['admin-orders', branchId],
    queryFn: () => adminApi.getOrders(branchId),
    enabled: !!user && !!branchId,
    refetchInterval: 15_000,
  });

  // Stable refetch reference so the socket effect never re-fires just because
  // the react-query refetch identity changed
  const stableRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  // ── Socket subscription ─────────────────────────────────────────────────
  useEffect(() => {
    // Guard: require both user and a valid branchId before joining any room
    if (!user || !branchId) return;

    const socket = getSocket();
    const room = `admin:${branchId}`;

    // Named handlers — mandatory for correct socket.off behaviour
    const onConnect    = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onRefresh    = () => {
      console.log('[Admin Orders] Real-time update received — refreshing');
      stableRefetch();
    };

    socket.on('connect',       onConnect);
    socket.on('disconnect',    onDisconnect);
    socket.on('new-order',     onRefresh);
    socket.on('order-updated', onRefresh);

    setIsConnected(socket.connected);
    console.log('[Admin Orders] Joining room:', room);
    joinRoom(room);

    return () => {
      socket.off('connect',       onConnect);
      socket.off('disconnect',    onDisconnect);
      socket.off('new-order',     onRefresh);
      socket.off('order-updated', onRefresh);
      leaveRoom(room);
    };
  }, [user, branchId, stableRefetch]);

  // ── Filtering ───────────────────────────────────────────────────────────
  const filtered =
    statusFilter === 'ALL'
      ? orders
      : orders.filter((o: { status: string }) => o.status === statusFilter);

  return (
    <>
      <AdminHeader
        title={t('orders')}
        onLogout={logout}
        titleBadge={
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            }`}
          >
            {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
            {isConnected ? t('online' as any) : t('polling')}
          </div>
        }
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => refetch()}
          aria-label={t('refresh')}
          className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center"
        >
          <RefreshCw size={14} className={`text-white/60 ${isFetching ? 'animate-spin' : ''}`} />
        </motion.button>
      </AdminHeader>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-6 pb-4" role="tablist">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={statusFilter === s}
            onClick={() => setStatusFilter(s)}
            id={`filter-${s}`}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${
              statusFilter === s
                ? 'bg-brand-500 text-slate-900 border-brand-500 shadow-lg shadow-brand-500/20'
                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-600'
            }`}
          >
            {s === 'ALL' ? t('orders') : t(s.toLowerCase() as any)}
          </button>
        ))}
      </div>

      <main className="p-4 pb-12">
        {isError && (
          <div className="mb-6">
            <ErrorState message={t('operationFailed')} onRetry={refetch} />
          </div>
        )}

        <p className="text-white/40 text-xs mb-3">
          {filtered.length} {t('orders').toLowerCase()}
        </p>

        {filtered.length === 0 ? (
          <EmptyState message={t('noData')} />
        ) : (
          <AdminOrderTable orders={filtered} onOrdersChange={stableRefetch} />
        )}
      </main>
    </>
  );
}
