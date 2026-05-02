'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { syncManager } from '@/lib/syncManager';
import dynamic from 'next/dynamic';
import { Toaster } from 'sonner';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { Toast, ToastContainer, ToastType } from '@/components/ui/Toast';

/**
 * NOTE: SyncProvider.tsx contains identical logic and is NOT rendered anywhere.
 * All offline-sync bootstrap lives here — do not add a second SyncProvider to
 * any layout, as it would double-register the online/visibilitychange listeners
 * and double the API calls every 15 seconds.
 */

const PwaInstallPrompt = dynamic(
  () => import('@/components/ui/PwaInstallPrompt').then((mod) => mod.PwaInstallPrompt),
  { ssr: false },
);

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const isDarkMode = useFavoritesStore((state) => state.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return <>{children}</>;
}

function OrderAuditToaster() {
  const [auditToast, setAuditToast] = useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  useEffect(() => {
    const onAudit = (event: Event) => {
      const custom = event as CustomEvent<{
        type: ToastType;
        message: string;
        meta?: Record<string, unknown>;
      }>;
      const detail = custom.detail;
      if (!detail) return;
      const compactMeta = detail.meta
        ? ` | b:${String(detail.meta.branchId ?? '-')} s:${String(detail.meta.sessionId ?? '-')}`
        : '';
      setAuditToast({
        type: detail.type,
        message: `${detail.message}${compactMeta}`,
      });
      console.log('[OrderAudit]', detail);
    };
    window.addEventListener('arifsmart-order-audit', onAudit as EventListener);
    return () => window.removeEventListener('arifsmart-order-audit', onAudit as EventListener);
  }, []);

  return (
    <ToastContainer>
      {auditToast && (
        <Toast
          message={auditToast.message}
          type={auditToast.type}
          duration={5000}
          onClose={() => setAuditToast(null)}
        />
      )}
    </ToastContainer>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Attempt to flush any orders queued while offline
    if (navigator.onLine) {
      syncManager.startSync();
    }

    // 2. Re-trigger sync when the browser reconnects to the network
    const handleOnline = () => {
      console.log('[Providers] Network reconnected — flushing offline queue');
      syncManager.startSync();
    };

    // 3. Re-trigger when the tab comes back to the foreground
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncManager.startSync();
      }
    };

    // 4. Periodic fallback poll (in case online event was missed)
    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncManager.startSync();
      }
    }, 15_000);

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeWrapper>
        {children}
        <PwaInstallPrompt />
        <OrderAuditToaster />
        <Toaster position="top-center" richColors theme="dark" />
      </ThemeWrapper>
    </QueryClientProvider>
  );
}
