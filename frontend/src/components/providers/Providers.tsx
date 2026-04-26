'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { syncManager } from '@/lib/syncManager';
import dynamic from 'next/dynamic';

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
      {children}
      <PwaInstallPrompt />
    </QueryClientProvider>
  );
}
