'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Utensils, Globe, Sparkles, QrCode } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const branchId = process.env.NEXT_PUBLIC_BRANCH_ID || 'default';
  const tableId = 'table-01';

  const languages = [
    { code: 'en', label: 'English', active: true },
    { code: 'am', label: 'አማርኛ', active: false },
    { code: 'or', label: 'Afaan Oromoo', active: false },
  ];

  const handleScanSimulation = () => {
    router.push(`/menu/${branchId}/${tableId}`);
  };

  return (
    <main className="min-h-dvh relative flex flex-col items-center justify-between bg-[#FCFAF7] px-6 py-20 overflow-hidden">
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
        className="absolute -top-20 -right-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" 
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        className="absolute -bottom-20 -left-20 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" 
      />

      {/* Center Content */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 text-center w-full max-w-sm">
        {/* Interactive QR Simulator */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-12 relative group cursor-pointer"
          onClick={handleScanSimulation}
        >
          {/* Animated Glow Rings */}
          <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
          
          <div className="relative w-48 h-48 bg-white/80 backdrop-blur-xl rounded-[40px] border-4 border-white shadow-2xl flex flex-col items-center justify-center overflow-hidden p-6 group-active:scale-95 transition-transform duration-200">
            {/* The QR Icon */}
            <QrCode size={80} className="text-slate-800 mb-4" />
            
            {/* Scanning Laser Line */}
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-0.5 bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,1)] z-10"
            />

            <div className="space-y-1">
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block">Tap To Scan</span>
              <div className="flex gap-1 justify-center">
                {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-slate-300" />)}
              </div>
            </div>

            {/* Corner Accents */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-orange-500/30" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-orange-500/30" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-orange-500/30" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-orange-500/30" />
          </div>

          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-4 border border-dashed border-orange-500/20 rounded-full"
          />
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="space-y-4"
        >
          <span className="font-display text-xs font-black tracking-[0.4em] text-slate-400 uppercase block opacity-60">
            ArifSmart Experience
          </span>
          <h1 className="font-display text-4xl font-black text-[#1E293B] leading-none tracking-tighter">
            READY TO<br />
            <span className="text-[#F97316] drop-shadow-sm">ORDER?</span>
          </h1>
          <p className="text-slate-400 text-xs font-medium max-w-[200px] mx-auto leading-relaxed mt-2 uppercase tracking-wide">
            Tap the code above to begin your journey
          </p>
        </motion.div>
      </div>

      {/* Language Selector Footer */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="w-full flex flex-col items-center gap-6 z-10"
      >
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100/50">
          <Globe size={14} className="text-orange-500" />
          <span className="font-display text-[11px] text-orange-600 font-black tracking-[0.1em] uppercase">
            Select Language
          </span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3">
          {languages.map((lang, idx) => (
            <motion.button
              key={lang.code}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-2xl text-sm font-black transition-all duration-300 border ${lang.active
                ? 'bg-orange-600 text-white border-transparent shadow-xl shadow-orange-600/30'
                : 'bg-white text-slate-500 border-slate-100 hover:border-orange-200'
                }`}
            >
              {lang.label}
            </motion.button>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
            Scan QR Code to Order
          </p>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-[8px] font-mono text-slate-400 uppercase tracking-tighter">
            v2.0-PREMIUM
          </span>
        </div>
      </motion.div>
    </main>
  );
}
