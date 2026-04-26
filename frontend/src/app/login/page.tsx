'use client';

import { Suspense} from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PinLogin } from '@/components/ui/PinLogin';
import { useAuthStore } from '@/stores/authStore';
import { MeshBackground} from '@/components/ui/Backgrounds';
import { PageTransition } from '@/components/ui/PageTransition';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const branchId = process.env.NEXT_PUBLIC_BRANCH_ID ?? '';
  const returnUrl = searchParams.get('returnUrl') || '/admin/menu';

  const handleSuccess = (token: string, user: any) => {
    login(user, token);
    
    // Role-based redirection logic
    if (searchParams.get('returnUrl')) {
      router.replace(returnUrl);
    } else if (user.role === 'KITCHEN') {
      router.replace('/kitchen');
    } else {
      router.replace('/admin/dashboard');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-dvh relative flex flex-col items-center justify-center p-6 overflow-hidden bg-surface">
        <MeshBackground />
        <div className="relative z-10 w-full max-w-md mx-auto">
          <PinLogin 
            branchId={branchId} 
            onSuccess={handleSuccess} 
          />
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
