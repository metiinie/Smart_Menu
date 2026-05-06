'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ChefHat, RefreshCw, LogOut, Wifi, WifiOff, Volume2, VolumeX, Maximize2, Minimize2, Filter } from 'lucide-react';
import { kitchenApi } from '@/lib/api';
import { getSocket, joinRoom, leaveRoom } from '@/lib/socket';
import { KitchenOrderCard } from '@/components/kitchen/KitchenOrderCard';
import { useAuthStore, selectBranchId } from '@/stores/authStore';
import { ErrorState } from '@/components/ui/StatusStates';
import { StaffNotificationCenter } from '@/components/admin/StaffNotificationCenter';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Role } from '@/shared/types';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export default function KitchenPage() {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(false);
  // Use a ref for soundEnabled so we never need to restart socket listeners on toggle
  const soundEnabledRef = useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

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

  // ── Filtering ────────────────────────────────────────────────────────────
  const filteredOrders = orders.filter((o: any) => {
    if (categoryFilter === 'ALL') return true;
    return o.items.some((item: any) => item.menuItem.category?.name === categoryFilter);
  });

  // ── Group orders by status ────────────────────────────────────────────────
  const grouped = {
    CREATED:   filteredOrders.filter((o: any) => o?.status === 'CREATED'),
    CONFIRMED: filteredOrders.filter((o: any) => o?.status === 'CONFIRMED'),
    PREPARING: filteredOrders.filter((o: any) => o?.status === 'PREPARING'),
    READY:     filteredOrders.filter((o: any) => o?.status === 'READY'),
  };

  // Get unique category names for filter
  const categories = Array.from(new Set(
    orders.flatMap((o: any) => o.items.map((i: any) => i.menuItem.category?.name))
  )).filter(Boolean) as string[];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <AuthGuard allowedRoles={[Role.RESTAURANT_ADMIN, Role.KITCHEN]}>
      <div className="min-h-dvh bg-background flex flex-col font-sans pb-10 transition-colors duration-300">
        {/* Waiter-call notifications (shared socket singleton is fine here) */}
        <StaffNotificationCenter />

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-xl border-b border-surface-200 safe-top shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left: logo + name */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center shadow-lg">
                <ChefHat size={24} className="text-background" />
              </div>
              <div>
                <h1 className="font-display font-black text-foreground text-xl tracking-tight leading-none">{t('kitchenMonitor')}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-foreground/40 text-xs font-black uppercase tracking-widest">{user?.name}</p>
                  <span className="text-foreground/20">•</span>
                  <div className="flex items-center gap-1.5 bg-surface-100 px-2 py-0.5 rounded-lg border border-surface-200">
                    <span className="text-[10px] text-foreground/30 font-bold tracking-tighter">{t('branch' as any)}:</span>
                    <span className="text-[10px] text-brand-500 font-black tracking-tight">{branchId?.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: controls */}
            <div className="flex items-center gap-4">
              {/* Sound toggle */}
              <button
                onClick={() => setSoundEnabled((v) => !v)}
                className={`flex items-center gap-2 text-xs font-black px-4 py-2 rounded-2xl border-2 transition-all active:scale-95 ${
                  soundEnabled
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-sm'
                    : 'bg-surface-100 text-foreground/40 border-surface-200'
                }`}
              >
                {soundEnabled ? <Volume2 size={16} strokeWidth={3} /> : <VolumeX size={16} strokeWidth={3} />}
                <span className="hidden sm:inline">{soundEnabled ? t('sound') : t('muted')}</span>
              </button>

              {/* Connection status */}
              <div className={`flex items-center gap-2 text-xs font-black px-4 py-2 rounded-2xl border-2 shadow-sm ${
                isConnected
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-500/20'
                  : 'bg-rose-100 text-rose-900 border-rose-500/20'
              }`}>
                {isConnected ? <Wifi size={16} strokeWidth={3} /> : <WifiOff size={16} strokeWidth={3} />}
                <span className="hidden sm:inline">{isConnected ? t('online' as any) : t('polling')}</span>
              </div>

              <LanguageSwitcher />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Fullscreen toggle */}
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 rounded-2xl bg-surface hover:bg-surface-100 flex items-center justify-center transition-all border-2 border-surface-200 text-foreground shadow-sm active:scale-90"
              >
                {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>

              {/* Manual refresh */}
              <button
                onClick={() => refetch()}
                className="w-10 h-10 rounded-2xl bg-surface hover:bg-surface-100 flex items-center justify-center transition-all border-2 border-surface-200 text-foreground shadow-sm active:scale-90"
              >
                <RefreshCw size={20} className={isFetching ? 'animate-spin text-brand-500' : ''} />
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                className="w-10 h-10 rounded-2xl bg-surface hover:bg-rose-500/10 flex items-center justify-center transition-all border-2 border-surface-200 text-foreground/40 hover:text-rose-500 shadow-sm active:scale-90"
                title={t('logout')}
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Sub-header for filters */}
          <div className="px-6 pb-4 flex items-center gap-4 border-t border-surface-200 pt-4 bg-surface/50 backdrop-blur-md transition-colors duration-300">
            <div className="flex items-center gap-2 text-foreground/30">
              <Filter size={16} strokeWidth={3} />
              <span className="text-xs font-black uppercase tracking-widest">{t('station')}:</span>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={`px-5 py-1.5 rounded-xl text-xs font-black transition-all border-2 shadow-sm ${
                  categoryFilter === 'ALL'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-surface text-foreground/40 border-surface-200 hover:border-surface-300 hover:text-foreground/60'
                }`}
              >
                {t('allStations')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-5 py-1.5 rounded-xl text-xs font-black transition-all border-2 shadow-sm whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-surface text-foreground/40 border-surface-200 hover:border-surface-300 hover:text-foreground/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        {/* ── Main content: Independent scrolling columns ────────────────── */}
        <main className="flex-1 p-6 h-[calc(100dvh_-_180px)] overflow-hidden">
          {/* Prompt for branch ID if missing */}
          {!branchId && (
            <div className="bg-foreground p-6 mb-6 rounded-3xl border border-amber-500/30 shadow-xl max-w-md mx-auto">
              <p className="text-amber-500 text-sm font-bold mb-1">⚠️ {t('error' as any)}</p>
              <p className="text-background/40 text-xs">
                {t('noData')}
              </p>
            </div>
          )}

          {isError ? (
            <div className="py-20 flex justify-center">
              <ErrorState message="Could not load kitchen orders. Check your connection and try again." onRetry={refetch} />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-24 h-24 bg-surface-100 rounded-full flex items-center justify-center">
                <ChefHat size={48} className="text-foreground/10" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground/20">{t('kitchenQuiet')}</h2>
              <p className="text-foreground/30 font-medium">{t('waitingOrders')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
              <KitchenColumn
                title={t('newOrders')}
                dotColor="bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                orders={grouped.CREATED}
                onUpdated={stableRefetch}
              />
              <KitchenColumn
                title={t('toPrepare')}
                dotColor="bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                orders={grouped.CONFIRMED}
                onUpdated={stableRefetch}
              />
              <KitchenColumn
                title={t('preparing')}
                dotColor="bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                orders={grouped.PREPARING}
                onUpdated={stableRefetch}
              />
              <KitchenColumn
                title={t('ready')}
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
    <div className="flex flex-col h-full overflow-hidden">
      <div className="pb-4 flex-shrink-0">
        <h2 className="text-[13px] font-black text-foreground uppercase tracking-widest flex items-center gap-3 bg-surface border-2 border-surface-200 rounded-[1.25rem] px-5 py-4 shadow-sm transition-colors duration-300">
          <span className={`w-3.5 h-3.5 rounded-full ${dotColor}`} />
          {title}
          <span className="ml-auto bg-surface-100 text-foreground/40 px-2.5 py-0.5 rounded-lg text-xs font-black">
            {orders.length}
          </span>
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
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
    </div>
  );
}
