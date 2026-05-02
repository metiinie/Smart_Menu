'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ChefHat, RefreshCw, LogOut, Wifi, WifiOff, Volume2, VolumeX } from 'lucide-react';
import { kitchenApi } from '@/lib/api';
import { getSocket, joinRoom, leaveRoom } from '@/lib/socket';
import { KitchenOrderCard } from '@/components/kitchen/KitchenOrderCard';
import { useAuthStore, selectBranchId } from '@/stores/authStore';
import { ErrorState } from '@/components/ui/StatusStates';
import { StaffNotificationCenter } from '@/components/admin/StaffNotificationCenter';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Role } from '@/shared/types';

export default function KitchenPage() {
  const { user, logout } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  // Use a ref for soundEnabled so we never need to restart socket listeners on toggle
  const soundEnabledRef = useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Derive branchId from user with consistent fallback to env var
  const branchId = selectBranchId(user);

  const { data: orders = [], refetch, isFetching, isError } = useQuery({
    queryKey: ['kitchen-orders', branchId],
    queryFn: () => kitchenApi.getOrders(branchId),
    enabled: !!user && !!branchId,
    // Poll every 8 s as a safety-net; real-time socket is the primary delivery mechanism.
    // Use callback form to stop polling when there is a fetch error (avoids TS circular ref).
    refetchInterval: (query) => (query.state.status === 'error' ? false : 8_000),
    refetchIntervalInBackground: false,
  });


  // Keep the ref in sync when the toggle changes — no socket re-subscription needed
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Stable refetch callback so it never changes identity unnecessarily
  const stableRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  // ── Socket subscription ───────────────────────────────────────────────────
  // Dependencies: only user and branchId.
  // soundEnabled is intentionally excluded — we read it via ref to avoid re-mounting.
  useEffect(() => {
    if (!user || !branchId) return;

    const socket = getSocket();

    const playAlert = () => {
      if (!soundEnabledRef.current) return;
      try {
        const audio = new Audio('/alert.mp3');
        audio.play().catch(() => {});
      } catch {
        // audio not available — silently ignore
      }
    };

    // Named handlers — REQUIRED so socket.off removes the exact function
    const onConnect = () => {
      console.log('[Kitchen] ✅ Socket connected:', socket.id);
      setIsConnected(true);
    };
    const onDisconnect = (reason: string) => {
      console.log('[Kitchen] ❌ Socket disconnected:', reason);
      setIsConnected(false);
    };
    const onNewOrder = (order: unknown) => {
      console.log('[Kitchen] 🔔 New order received via socket:', order);
      stableRefetch();
      playAlert();
    };
    const onOrderUpdated = (order: unknown) => {
      console.log('[Kitchen] 🔄 Order updated via socket:', order);
      stableRefetch();
    };

    // Register listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new-order', onNewOrder);
    socket.on('order-updated', onOrderUpdated);

    // Sync initial connection state and join the branch-specific room
    setIsConnected(socket.connected);
    const room = `kitchen:${branchId}`;
    console.log(`[Kitchen] 🟢 DEBUG: Current Branch ID is "${branchId}"`);
    console.log(`[Kitchen] 🟢 DEBUG: Joining socket room "${room}"`);
    joinRoom(room);

    return () => {
      console.log('[Kitchen] Cleanup — leaving room and removing listeners:', room);
      // Remove ONLY our specific handlers — not every listener on the socket
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new-order', onNewOrder);
      socket.off('order-updated', onOrderUpdated);
      leaveRoom(room);
    };
  }, [user, branchId, stableRefetch]); // soundEnabled NOT here — handled via ref

  // ── Group orders by status ────────────────────────────────────────────────
  const grouped = {
    CREATED:   orders.filter((o: any) => o?.status === 'CREATED'),
    CONFIRMED: orders.filter((o: any) => o?.status === 'CONFIRMED'),
    PREPARING: orders.filter((o: any) => o?.status === 'PREPARING'),
    READY:     orders.filter((o: any) => o?.status === 'READY'),
  };

  return (
    <AuthGuard allowedRoles={[Role.RESTAURANT_ADMIN, Role.KITCHEN]}>
      <div className="min-h-dvh bg-slate-950 flex flex-col font-sans">
        {/* Waiter-call notifications (shared socket singleton is fine here) */}
        <StaffNotificationCenter />

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 safe-top shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left: logo + name */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shadow-inner">
                <ChefHat size={20} className="text-brand-500" />
              </div>
              <div>
                <h1 className="font-display font-black text-white text-lg tracking-tight">KITCHEN DISPLAY</h1>
                <div className="flex items-center gap-2">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{user?.name}</p>
                  <span className="text-slate-700">•</span>
                  <div className="flex items-center gap-1 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700">
                    <span className="text-[10px] text-slate-500 font-mono">BRANCH:</span>
                    <span className="text-[10px] text-brand-400 font-mono font-bold">{branchId || 'NOT SET'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: controls */}
            <div className="flex items-center gap-3">
              {/* Sound toggle */}
              <button
                onClick={() => setSoundEnabled((v) => !v)}
                aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
                className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                  soundEnabled
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                {soundEnabled ? 'Sound On' : 'Sound Off'}
              </button>

              {/* Connection status */}
              <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                {isConnected ? 'LIVE' : 'POLLING'}
              </div>

              {/* Manual refresh */}
              <button
                onClick={() => refetch()}
                aria-label="Refresh orders"
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors border border-slate-700 text-slate-300"
              >
                <RefreshCw size={18} className={isFetching ? 'animate-spin text-brand-400' : ''} />
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                aria-label="Logout"
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center transition-colors border border-slate-700 text-slate-400"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="flex-1 p-6 overflow-x-hidden">
          {/* Prompt for branch ID if missing (fallback for misconfigured envs) */}
          {!branchId && (
            <div className="bg-slate-900 p-6 mb-6 rounded-3xl border border-amber-500/30 shadow-xl max-w-md mx-auto">
              <p className="text-amber-400 text-sm font-bold mb-1">⚠️ Branch ID not detected</p>
              <p className="text-slate-500 text-xs">
                Log in with a staff account that has a branch assigned, or check the backend configuration.
              </p>
            </div>
          )}

          {isError ? (
            <div className="py-20 flex justify-center">
              <ErrorState message="Could not load kitchen orders. Check your connection and try again." onRetry={refetch} />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
              <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center">
                <ChefHat size={48} className="text-slate-600" />
              </div>
              <h2 className="text-2xl font-display font-bold text-slate-300">Kitchen is quiet</h2>
              <p className="text-slate-500 font-medium">Waiting for new orders…</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full items-start">
              <KitchenColumn
                title="New Orders"
                dotColor="bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                orders={grouped.CREATED}
                onUpdated={stableRefetch}
              />
              <KitchenColumn
                title="To Prepare"
                dotColor="bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                orders={grouped.CONFIRMED}
                onUpdated={stableRefetch}
              />
              <KitchenColumn
                title="Preparing"
                dotColor="bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                orders={grouped.PREPARING}
                onUpdated={stableRefetch}
              />
              <KitchenColumn
                title="Ready"
                dotColor="bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]"
                orders={grouped.READY}
                onUpdated={stableRefetch}
              />
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

// ── Sub-component: one kanban column ───────────────────────────────────────
interface KitchenColumnProps {
  title: string;
  dotColor: string;
  orders: any[];
  onUpdated: () => void;
}

function KitchenColumn({ title, dotColor, orders, onUpdated }: KitchenColumnProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-[72px] z-10 bg-slate-950/80 backdrop-blur pb-2">
        <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 shadow-sm">
          <span className={`w-3 h-3 rounded-full ${dotColor}`} />
          {title}
          <span className="ml-auto bg-slate-800 text-slate-400 px-2 py-0.5 rounded-lg text-xs">
            {orders.length}
          </span>
        </h2>
      </div>
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              <KitchenOrderCard order={order} onUpdated={onUpdated} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
