'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Role } from '@arifsmart/shared';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, token } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token || !user) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      // User is logged in but doesn't have the right role
      // For now, redirect to login to switch account, or a forbidden page
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}&error=unauthorized`);
      return;
    }

    setIsAuthorized(true);
  }, [isAuthenticated, token, user, allowedRoles, router, pathname]);

  if (!isAuthorized) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
