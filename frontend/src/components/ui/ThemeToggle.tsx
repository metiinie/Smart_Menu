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
      className="relative w-5 h-5 rounded-sm bg-surface-100/10 hover:bg-surface-100/20 
                 flex items-center justify-center border border-white/10
                 shadow-sm transition-colors duration-300 overflow-hidden backdrop-blur-sm"
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
            <Moon size={8} className="text-brand-400" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: 8, opacity: 0, rotate: 40 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -8, opacity: 0, rotate: -40 }}
            transition={{ duration: 0.2 }}
          >
            <Sun size={8} className="text-amber-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
