'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Globe} from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { authApi } from '@/lib/api';

const LANGUAGES = [
  { code: 'en' as const, label: 'English' },
  { code: 'am' as const, label: 'አማርኛ' },
  { code: 'or' as const, label: 'Afaan Oromoo' },
];

export default function HomePage() {
  const router = useRouter();
  const { language, setLanguage } = useFavoritesStore();
  const [resolvedBranchId, setResolvedBranchId] = useState('');

  /**
   * In production, customers scan a QR code that encodes:
   *   /menu/{branchId}/{tableId}
   * This landing page is a fallback for direct visits.
   * We dynamically fetch the default branch from the backend.
   */
  useEffect(() => {
    if (resolvedBranchId) return;
    authApi
      .getDefaultBranch()
      .then((branch) => {
        if (branch?.id) setResolvedBranchId(branch.id);
      })
      .catch(() => {
        // keep empty if backend has no branch yet
      });
  }, [resolvedBranchId]);

  const handleScanSimulation = () => {
    if (!resolvedBranchId) {
      // No branch configured — can't proceed
      return;
    }
    // Navigate to the menu; the table-context endpoint will
    // resolve "table-01" → tableNumber 1 via its fallback parser
    router.push(`/menu/${resolvedBranchId}/table-01`);
  };

  return (
    <PageTransition>
      <main className="min-h-dvh relative flex flex-col items-center justify-between bg-surface px-6 py-12 md:py-20 lg:py-32 overflow-hidden">
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
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="space-y-4 px-4 mb-12"
          >
            <span className="font-display text-[10px] md:text-xs font-black tracking-[0.4em] text-slate-400 uppercase block opacity-60">
              ArifSmart Experience
            </span>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black text-[#1E293B] leading-[0.9] tracking-tighter">
              READY TO<br />
              <span className="text-brand-500 drop-shadow-sm">ORDER?</span>
            </h1>
            <p className="text-slate-400 text-[10px] md:text-sm font-medium max-w-[280px] md:max-w-md mx-auto leading-relaxed mt-4 uppercase tracking-widest">
              Tap below to begin your culinary journey
            </p>
          </motion.div>

          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
            onClick={handleScanSimulation}
            className="group relative px-12 py-5 bg-brand-500 text-white rounded-full font-black text-lg tracking-widest uppercase shadow-[0_0_40px_rgba(249,115,22,0.4)] hover:shadow-[0_0_60px_rgba(249,115,22,0.6)] hover:bg-brand-600 transition-all active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            <span className="relative z-10 flex items-center gap-3">
              Continue
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                →
              </motion.span>
            </span>
          </motion.button>
        </div>

        {/* Language Selector Footer */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="w-full max-w-2xl flex flex-col items-center gap-8 z-10 pb-8"
        >
          <div className="flex items-center gap-2 px-6 py-2 rounded-full bg-brand-50 border border-brand-100/50 shadow-sm">
            <Globe size={14} className="text-brand-500" />
            <span className="font-display text-[11px] text-brand-600 font-black tracking-[0.2em] uppercase">
              Select Language
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {LANGUAGES.map((lang) => (
              <motion.button
                key={lang.code}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLanguage(lang.code)}
                className={`px-8 py-4 rounded-3xl text-sm font-black transition-all duration-300 border ${language === lang.code
                  ? 'bg-brand-500 text-white border-transparent shadow-2xl shadow-brand-500/30'
                  : 'bg-white text-slate-500 border-slate-100 hover:border-brand-200'
                  }`}
              >
                {lang.label}
              </motion.button>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-[1px] bg-slate-200" />
              <p className="text-[10px] md:text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em] opacity-60">
                ArifSmart Premium
              </p>
              <div className="w-12 h-[1px] bg-slate-200" />
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-[8px] font-mono text-slate-400 uppercase tracking-tighter">
              v2.0-STABLE
            </span>
          </div>
        </motion.div>
      </main>
    </PageTransition>
  );
}
