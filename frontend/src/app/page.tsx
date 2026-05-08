'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageTransition } from '@/components/ui/PageTransition';
import { authApi } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    authApi
      .getDefaultBranch()
      .then((branch) => {
        if (branch?.id) {
          router.push(`/menu/${branch.id}/table-01`);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        setError(true);
      });
  }, [router]);

  return (
    <PageTransition>
      <main className="min-h-dvh relative flex flex-col items-center justify-center bg-surface px-6 overflow-hidden">
        {/* Background Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern id="food-pattern-home" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M10 10 Q 15 5, 20 10 T 30 10" stroke="#000" fill="transparent" />
              <circle cx="50" cy="50" r="2" fill="#000" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#food-pattern-home)" />
          </svg>
        </div>

        {/* Decorative Blobs */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-20 -right-20 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-20 -left-20 w-96 h-96 bg-brand-600/5 rounded-full blur-3xl pointer-events-none" 
        />

        {/* Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center z-10 text-center w-full max-w-xl mx-auto">
          {!error ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
              <h2 className="font-display text-xl md:text-2xl font-bold text-slate-800 animate-pulse">
                Preparing your experience...
              </h2>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-red-500">Could not load menu</h2>
              <p className="text-slate-500">Please scan the QR code at your table again.</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-brand-500 text-white rounded-full text-sm font-bold mt-4"
              >
                Retry
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </PageTransition>
  );
}
