'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Role } from '@/shared/types';
import { OfflineSyncBanner } from '@/components/admin/OfflineSyncBanner';

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.SUPER_ADMIN, Role.KITCHEN, Role.RESTAURANT_ADMIN]}>
      <div className="min-h-dvh flex flex-col bg-background transition-colors duration-300">
        <OfflineSyncBanner />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
