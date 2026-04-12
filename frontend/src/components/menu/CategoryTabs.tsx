'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Category } from '@arifsmart/shared';

interface Props {
  categories: Category[];
  activeId: string;
  onChange: (id: string) => void;
}

export function CategoryTabs({ categories, activeId, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 px-4">
      {categories.map((cat) => (
        <button
          key={cat.id}
          id={`category-tab-${cat.id}`}
          onClick={() => onChange(cat.id)}
          className={`relative flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold
            transition-colors duration-200 whitespace-nowrap
            ${activeId === cat.id
              ? 'text-white'
              : 'text-white/50 hover:text-white/80'
            }`}
        >
          {activeId === cat.id && (
            <motion.span
              layoutId="category-pill"
              className="absolute inset-0 bg-brand-500 rounded-full shadow-glow"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10">{cat.name}</span>
        </button>
      ))}
    </div>
  );
}
