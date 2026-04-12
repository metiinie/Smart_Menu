'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PinLogin } from '@/components/ui/PinLogin';
import { useAuthStore } from '@/stores/authStore';
import { MeshBackground, FoodPatternOverlay } from '@/components/ui/Backgrounds';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const branchId = process.env.NEXT_PUBLIC_BRANCH_ID ?? '';
  const returnUrl = searchParams.get('returnUrl') || '/admin/menu';

  const handleSuccess = (token: string, user: any) => {
    login(user, token);
    router.replace(returnUrl);
  };

  return (
    <div className="min-h-dvh relative flex flex-col items-center justify-center p-6 overflow-hidden bg-surface">
      <MeshBackground />
      <div className="relative z-10 w-full">
        <PinLogin 
          branchId={branchId} 
          onSuccess={handleSuccess} 
        />
      </div>
    </div>
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
