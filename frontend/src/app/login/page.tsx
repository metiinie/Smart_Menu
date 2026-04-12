'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PinLogin } from '@/components/ui/PinLogin';
import { useAuthStore } from '@/stores/authStore';
import { MeshBackground, FoodPatternOverlay } from '@/components/ui/Backgrounds';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const branchId = process.env.NEXT_PUBLIC_BRANCH_ID ?? '3ea2a044-ae51-488b-b13e-dc4e7afafb7a';

  useEffect(() => {
    // Redirect to default menu for simplicity
    router.replace(`/menu/${branchId}/T1`);
  }, [router, branchId]);

  return (
    <div className="min-h-dvh relative flex flex-col items-center justify-center p-6 overflow-hidden">
      <MeshBackground />
      <div className="w-8 h-8 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin relative z-10" />
      <p className="mt-4 text-white/40 text-xs font-bold uppercase tracking-widest relative z-10">
        Redirecting to menu...
      </p>
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
