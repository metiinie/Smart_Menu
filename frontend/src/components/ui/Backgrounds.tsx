'use client';

import { motion } from 'framer-motion';

export function MeshBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-surface">
      {/* Primary Brand Ambient Orb */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full 
                   bg-brand-500/10 blur-[120px]"
      />
      
      {/* Gold Accent Orb */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, 60, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full 
                   bg-gold-500/5 blur-[100px]"
      />

      {/* Deep Bottom Orb */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute -bottom-[20%] left-[20%] w-[70%] h-[70%] rounded-full 
                   bg-brand-600/5 blur-[140px]"
      />
    </div>
  );
}

export function FoodPatternOverlay() {
  return (
    <div className="fixed inset-0 -z-0 opacity-[0.03] pointer-events-none food-pattern" />
  );
}
