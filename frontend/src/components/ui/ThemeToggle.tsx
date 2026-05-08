'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useFavoritesStore } from '@/stores/favoritesStore';

export function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useFavoritesStore();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      onClick={toggleDarkMode}
      className="relative w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 
                 flex items-center justify-center border border-white/20
                 shadow-lg transition-colors duration-300 overflow-hidden backdrop-blur-md"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDarkMode ? (
          <motion.div
            key="moon"
            initial={{ y: 8, opacity: 0, rotate: 40 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -8, opacity: 0, rotate: -40 }}
            transition={{ duration: 0.2 }}
          >
            <Moon size={14} className="text-brand-400" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: 8, opacity: 0, rotate: 40 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -8, opacity: 0, rotate: -40 }}
            transition={{ duration: 0.2 }}
          >
            <Sun size={14} className="text-amber-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
