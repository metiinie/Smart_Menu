'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { EmailLogin } from '@/components/ui/EmailLogin';
import { useAuthStore } from '@/stores/authStore';
import { MeshBackground } from '@/components/ui/Backgrounds';
import { PageTransition } from '@/components/ui/PageTransition';
import { Role } from '@/shared/types';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  
  const returnUrl = searchParams.get('returnUrl') || '/admin/dashboard';

  const handleSuccess = (token: string, user: any, refreshToken?: string) => {
    login(user, token, refreshToken);
    
    const returnUrl = searchParams.get('returnUrl');
    
    // Check if returnUrl is appropriate for the role
    let isSafeReturn = false;
    if (returnUrl) {
      if (user.role === Role.SUPER_ADMIN && returnUrl.startsWith('/super-admin')) isSafeReturn = true;
      if ([Role.RESTAURANT_ADMIN, Role.MANAGER, Role.STAFF].includes(user.role) && returnUrl.startsWith('/admin')) isSafeReturn = true;
      if (user.role === Role.KITCHEN && returnUrl.startsWith('/kitchen')) isSafeReturn = true;
    }

    if (isSafeReturn && returnUrl) {
      router.replace(returnUrl);
    } else if (user.role === Role.KITCHEN) {
      router.replace('/kitchen');
    } else if (user.role === Role.SUPER_ADMIN) {
      router.replace('/super-admin/restaurants');
    } else if (user.role === Role.STAFF) {
      router.replace('/admin/orders');
    } else {
      router.replace('/admin/dashboard');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-dvh relative flex flex-col items-center justify-center p-6 overflow-hidden bg-surface">
        <MeshBackground />
        <div className="absolute top-6 right-6 z-20">
          <LanguageSwitcher />
        </div>
        <div className="relative z-10 w-full max-w-md mx-auto">
          <EmailLogin onSuccess={handleSuccess} />
        </div>
      </div>
    </PageTransition>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
