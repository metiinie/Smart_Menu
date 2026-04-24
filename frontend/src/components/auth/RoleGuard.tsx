'use client';

import { useAuthStore } from '@/stores/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { Role } from '@arifsmart/shared';

interface Props {
  children: ReactNode;
  allowedRoles?: Role[];
}

/**
 * RoleGuard: High-level wrapper for protecting routes.
 * Handles:
 * 1. Not logged in -> Redirect to /login
 * 2. Wrong role -> Redirect to home or show error
 * 3. Loading state -> Show spinner
 */
export function RoleGuard({ children, allowedRoles }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    // 1. Check if authenticated
    if (!isAuthenticated || !token) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    // 2. Check Role permissions if specific roles are required
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace('/');
      return;
    }
  }, [isAuthenticated, token, user, allowedRoles, router, pathname]);

  // Loading / Block state
  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-surface gap-3">
        <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verifying session...</p>
      </div>
    );
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
