'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeSplashProps {
  onComplete: () => void;
}

/**
 * Cinematic welcome splash animation for QR code scan entry.
 * Phase 1: Splash screen with off-white background, green blob, "WELCOME", and logo.
 * Phase 2: Green blob expands to fill screen, elements form lockup.
 * Phase 3: Fades out to reveal menu.
 */
export function WelcomeSplash({ onComplete }: WelcomeSplashProps) {
  const palette = {
    appGreen: '#08AE75',
    appWhite: '#FBF8F3',
    pattern: '#E9DFD1',
  };
  const [phase, setPhase] = useState<'splash' | 'revealText' | 'expand'>('splash');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('revealText'), 1100);
    const t2 = setTimeout(() => setPhase('expand'), 2200);
    // Keep a short hold on the expanded brand frame before hand-off.
    const t3 = setTimeout(() => onComplete(), 4600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        exit={{ opacity: 0, transition: { duration: 0.1 } }}
        className="fixed inset-0 z-[100] overflow-hidden flex flex-col justify-between"
        style={{ backgroundColor: palette.appWhite }}
      >
          {/* Background Layer: White watermark */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <pattern id="food-pattern-splash" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M10 10 Q 15 5, 20 10 T 30 10" stroke={palette.pattern} strokeWidth="1" fill="transparent" />
                <path d="M30 40 Q 35 30, 45 40 T 60 40" stroke={palette.pattern} strokeWidth="1" fill="transparent" />
                <circle cx="50" cy="50" r="2" fill={palette.pattern} />
                <path d="M70 80 Q 75 70, 85 80 T 100 80" stroke={palette.pattern} strokeWidth="1" fill="transparent" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#food-pattern-splash)" />
            </svg>
          </div>

          {/* Organic Green Blob matching start.png */}
          <motion.div
            className="absolute z-10 origin-center"
            initial={{ 
              top: "-10%", 
              left: "-26%", 
              width: "124vw", 
              height: "124vw", 
              scale: 1
            }}
            animate={
              phase === 'splash' || phase === 'revealText'
                ? { scale: 1 }
                : { scale: 15, top: "-26%", left: "-22%" }
            }
            transition={{ duration: 1.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
              <path 
                fill={palette.appGreen} 
                d="M45.7,-76.3C58.9,-69.3,68.9,-55.4,76.5,-40.7C84.1,-26,89.3,-10.5,88.1,4.7C86.9,19.9,79.4,34.8,69.5,47.8C59.6,60.8,47.4,71.9,33.1,78.2C18.8,84.5,2.4,85.9,-12.9,82.8C-28.2,79.7,-42.4,72.1,-55.2,61.4C-68,50.7,-79.4,36.9,-84.3,21.1C-89.2,5.3,-87.6,-12.4,-80.7,-27.6C-73.8,-42.8,-61.6,-55.5,-47.9,-62.7C-34.2,-69.9,-19,-71.6,-2.3,-68.8C14.4,-66,28.8,-58.7,45.7,-76.3Z" 
                transform="translate(100 100)" 
              />
            </svg>
          </motion.div>

          {/* Top Section: WELCOME TO */}
          <div className="relative z-20 w-full flex flex-col items-center pt-60 pointer-events-none">
            <motion.h1
              animate={
                phase === 'expand'
                  ? { y: -88, scale: 0.84 }
                  : { y: 0, scale: 1 }
              }
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="text-white text-4xl font-black tracking-[0.08em] drop-shadow-md"
            >
              WELCOME
            </motion.h1>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={
                phase === 'expand'
                  ? { opacity: 1, y: -72 }
                  : { opacity: 0, y: 10 }
              }
              transition={{ duration: 0.4, delay: phase === 'expand' ? 0.3 : 0 }}
              className="text-white text-3xl font-black tracking-[0.08em] drop-shadow-md"
            >
              TO
            </motion.h1>
          </div>

          {/* Bottom Section: Logo & RESTAURANT Menu */}
          <div className="relative z-20 w-full flex justify-center pb-16 pointer-events-none">
            <motion.div
              animate={
                phase === 'expand'
                  ? { y: -280, scale: 1.08 }
                  : { y: 0, scale: 1 }
              }
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="flex items-center gap-4 h-16"
            >
              <motion.div 
                animate={
                  phase === 'splash' 
                    ? { x: 92 } 
                    : { x: 0 }  
                }
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-2 border-[#FABD2F]/20 relative overflow-hidden shrink-0 bg-gradient-to-br from-[#F6BE32] to-[#D79900]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50" />
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                  <circle cx="12" cy="7" r="1.5" fill="white" />
                  <path d="M4 15C4 10.5817 7.58172 7 12 7C16.4183 7 20 10.5817 20 15H4Z" fill="white" />
                  <rect x="3" y="16" width="18" height="1.5" rx="0.75" fill="white" />
                </svg>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, width: 0, x: -26 }}
                animate={
                  phase === 'splash'
                    ? { opacity: 0, width: 0, x: -26 }
                    : { opacity: 1, width: "auto", x: 0 }
                }
                transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col justify-center overflow-hidden whitespace-nowrap"
              >
                <motion.h2
                  initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
                  animate={
                    phase === 'splash'
                      ? { opacity: 0, clipPath: 'inset(0 100% 0 0)' }
                      : { opacity: 1, clipPath: 'inset(0 0% 0 0)' }
                  }
                  transition={{ duration: 0.45, delay: 0.08, ease: 'easeOut' }}
                  className="text-[#FABD2F] font-serif text-xl font-bold tracking-widest drop-shadow-sm leading-none"
                >
                  RESTAURANT
                </motion.h2>
                <motion.span
                  initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
                  animate={
                    phase === 'splash'
                      ? { opacity: 0, clipPath: 'inset(0 100% 0 0)' }
                      : { opacity: 1, clipPath: 'inset(0 0% 0 0)' }
                  }
                  transition={{ duration: 0.42, delay: 0.2, ease: 'easeOut' }}
                  className={`block font-normal italic text-lg capitalize mt-1 ${phase === 'expand' ? 'text-[#E8B832]' : 'text-slate-600'}`}
                >
                  Menu
                </motion.span>
              </motion.div>
            </motion.div>
          </div>

        </motion.div>
    </AnimatePresence>
  );
}
