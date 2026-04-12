'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ChefHat, RefreshCw, LogOut, Wifi, WifiOff } from 'lucide-react';
import { kitchenApi } from '@/lib/api';
import { getSocket, joinRoom, leaveRoom } from '@/lib/socket';
import { KitchenOrderCard } from '@/components/kitchen/KitchenOrderCard';
import { useAuthStore } from '@/stores/authStore';
import { ErrorState, EmptyState } from '@/components/ui/StatusStates';

const BRANCH_ID = process.env.NEXT_PUBLIC_BRANCH_ID ?? '';

interface StaffUser { id: string; name: string; role: 'ADMIN' | 'KITCHEN' }

export default function KitchenPage() {
  const { user, logout } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [branchId, setBranchId] = useState(BRANCH_ID);

  const { data: orders = [], refetch, isFetching, isError } = useQuery({
    queryKey: ['kitchen-orders', branchId],
    queryFn: () => kitchenApi.getOrders(branchId),
    enabled: !!user && !!branchId,
    refetchInterval: 3000,
  });

  // Socket.io for realtime (Enhancement only)
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    
    const playAlert = () => {
      const audio = new Audio('/alert.mp3');
      audio.play().catch(e => console.log('Audio play blocked or failed', e));
    };

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('new-order', () => {
      refetch();
      playAlert();
    });
    socket.on('order-updated', () => refetch());
    
    setIsConnected(socket.connected);
    joinRoom('kitchen');

    return () => {
      socket.off('new-order');
      socket.off('order-updated');
      socket.off('connect');
      socket.off('disconnect');
      leaveRoom('kitchen');
    };
  }, [user, refetch]);

  const logoutStaff = () => {
    logout();
    // AuthGuard will handle redirect
  };

  if (!user) {
    return null;
  }

  const grouped = {
    CREATED:   orders.filter((o: { status: string }) => o.status === 'CREATED'),
    CONFIRMED: orders.filter((o: { status: string }) => o.status === 'CONFIRMED'),
    PREPARING: orders.filter((o: { status: string }) => o.status === 'PREPARING'),
  };

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-surface-200 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center">
              <ChefHat size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-sm">Kitchen</h1>
              <p className="text-white/40 text-xs">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {isConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
              {isConnected ? 'Live' : 'Polling'}
            </div>
            <button onClick={() => refetch()} className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center cursor-pointer">
              <RefreshCw size={14} className={`text-white/60 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={logoutStaff} className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center cursor-pointer">
              <LogOut size={14} className="text-white/60" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        {/* BranchId input if not set */}
        {!branchId && (
          <div className="card p-4 mb-4">
            <label className="text-white/60 text-xs mb-2 block">Branch ID</label>
            <input
              className="w-full bg-surface-100 text-white rounded-xl px-3 py-2 text-sm outline-none border border-surface-300 focus:border-brand-500"
              placeholder="Enter branch ID from seed output"
              onBlur={(e) => setBranchId(e.target.value)}
              id="branch-id-input"
            />
          </div>
        )}

        {isError ? (
          <div className="py-20">
            <ErrorState message="Could not load kitchen orders" onRetry={refetch} />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState 
            message="No active orders at the moment" 
            icon={ChefHat} 
          />
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([status, statusOrders]) =>
              statusOrders.length > 0 ? (
                <div key={status}>
                  <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      status === 'CREATED' ? 'bg-gray-400' :
                      status === 'CONFIRMED' ? 'bg-blue-400' : 'bg-amber-400'
                    }`} />
                    {status} ({statusOrders.length})
                  </h2>
                  <div className="space-y-3">
                    {statusOrders.map((order: Parameters<typeof KitchenOrderCard>[0]['order']) => (
                      <KitchenOrderCard key={order.id} order={order} onUpdated={refetch} />
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </main>
    </div>
  );
}
