'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, RefreshCw, LogOut, List } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { getSocket, joinRoom, leaveRoom } from '@/lib/socket';
import { AdminOrderTable } from '@/components/admin/AdminOrderTable';
import { useAuthStore } from '@/stores/authStore';
import { ErrorState, EmptyState } from '@/components/ui/StatusStates';
import { Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';

interface StaffUser { id: string; name: string; role: 'ADMIN' | 'KITCHEN' }

const BRANCH_ID = process.env.NEXT_PUBLIC_BRANCH_ID ?? '';

export default function AdminOrdersPage() {
  const { user, logout } = useAuthStore();
  const [branchId] = useState(BRANCH_ID);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isConnected, setIsConnected] = useState(false);

  const { data: orders = [], isFetching, isError, refetch } = useQuery({
    queryKey: ['admin-orders', branchId],
    queryFn: () => adminApi.getOrders(branchId),
    enabled: !!user && !!branchId,
    refetchInterval: 15_000,
  });

  // Realtime triggers
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleRefresh = () => refetch();

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('new-order', handleRefresh);
    socket.on('order-updated', handleRefresh);

    setIsConnected(socket.connected);
    joinRoom('admin'); // Assuming admin room exists or generic messages are fine

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('new-order', handleRefresh);
      socket.off('order-updated', handleRefresh);
      leaveRoom('admin');
    };
  }, [user, refetch]);

  const logoutStaff = () => {
    logout();
    // AuthGuard will handle redirect to /login
  };

  const STATUSES = ['ALL', 'CREATED', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'];
  const filtered = statusFilter === 'ALL'
    ? orders
    : orders.filter((o: { status: string }) => o.status === statusFilter);

  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-surface-200 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <h1 className="font-display font-bold text-white text-sm">Admin · Orders</h1>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase transition-colors
              ${isConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isConnected ? 'Live' : 'Polling'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/menu" className="text-xs text-brand-400 px-3 py-1.5 rounded-xl bg-brand-500/10 flex items-center gap-1">
              <List size={12} /> Menu
            </Link>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => refetch()}
              className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center">
              <RefreshCw size={14} className={`text-white/60 ${isFetching ? 'animate-spin' : ''}`} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={logoutStaff}
              className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center">
              <LogOut size={14} className="text-white/60" />
            </motion.button>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar px-4 pb-3">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors
                ${statusFilter === s ? 'bg-brand-500 text-white' : 'bg-surface-100 text-white/50'}`}
              id={`filter-${s}`}>
              {s}
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 pb-12">
        {isError && (
          <div className="mb-6">
            <ErrorState message="Failed to fetch orders" onRetry={refetch} />
          </div>
        )}
        
        <p className="text-white/40 text-xs mb-3">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>
        
        {filtered.length === 0 ? (
          <EmptyState message="No orders match your current filter" />
        ) : (
          <AdminOrderTable orders={filtered} />
        )}
      </main>
    </div>
  );
}
