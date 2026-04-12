'use client';

import { motion } from 'framer-motion';

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative mb-4"
      >
        {/* Professional Cloche Icon (Custom SVG) */}
        <div className="w-20 h-20 rounded-3xl bg-surface-100/50 backdrop-blur-xl border border-gold-500/20 
                        flex items-center justify-center shadow-glow-gold relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Cloche Knob */}
            <circle cx="12" cy="7" r="1.5" fill="url(#goldGradient)" />
            {/* Cloche Dome */}
            <path d="M4 15C4 10.5817 7.58172 7 12 7C16.4183 7 20 10.5817 20 15H4Z" fill="url(#goldGradient)" />
            {/* Cloche Base */}
            <rect x="3" y="16" width="18" height="1.5" rx="0.75" fill="url(#goldGradient)" />
            
            <defs>
              <linearGradient id="goldGradient" x1="4" y1="7" x2="20" y2="17.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FABD2F" />
                <stop offset="1" stopColor="#D97706" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center"
      >
        <h1 className="text-3xl font-display font-black tracking-tight text-white uppercase italic">
          ARIFSMART
          <span className="block text-sm font-medium normal-case not-italic text-gold-500 tracking-[0.2em] mt-1">
            PREMIUM MENU
          </span>
        </h1>
      </motion.div>
    </div>
  );
}
