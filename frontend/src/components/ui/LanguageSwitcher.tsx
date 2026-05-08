'use client';

import { useFavoritesStore } from '@/stores/favoritesStore';
import { LANGUAGES, Language } from '@/lib/i18n';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function LanguageSwitcher() {
  const { language, setLanguage } = useFavoritesStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 border border-white/20 transition-all active:scale-95 backdrop-blur-md shadow-lg"
        title="Switch Language"
      >
        <span className="text-[14px]">{currentLang.flag}</span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-white/90 hidden xs:inline">
          {currentLang.code}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute right-0 mt-2 w-40 bg-surface border border-surface-200 rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-1.5 space-y-0.5">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as Language);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    language === lang.code
                      ? 'bg-brand-500 text-white'
                      : 'hover:bg-surface-100 text-foreground/70'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-xs font-bold">{lang.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
