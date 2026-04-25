'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { syncManager } from '@/lib/syncManager';
import dynamic from 'next/dynamic';

const PwaInstallPrompt = dynamic(
  () => import('@/components/ui/PwaInstallPrompt').then((mod) => mod.PwaInstallPrompt),
  { ssr: false }
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
    const handleOnline = () => {
      syncManager.startSync();
    };

    window.addEventListener('online', handleOnline);
    // Initial check
    if (navigator.onLine) {
      handleOnline();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <PwaInstallPrompt />
    </QueryClientProvider>
  );
}
