'use client';

import { motion } from 'framer-motion';
import { Coffee, Utensils, Cake, Flame, Grid } from 'lucide-react';
import type { Category } from '@arifsmart/shared';

interface Props {
  categories: Category[];
  activeId: string;
  onChange: (id: string) => void;
}

export function CategoryTabs({ categories, activeId, onChange }: Props) {
  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('drink')) return { emoji: '🥤', icon: <Coffee size={24} /> };
    if (n.includes('food') || n.includes('main')) return { emoji: '🍴', icon: <Utensils size={24} /> };
    if (n.includes('desert') || n.includes('sweet')) return { emoji: '🍰', icon: <Cake size={24} /> };
    if (n.includes('special')) return { emoji: '🔥', icon: <Flame size={24} /> };
    return { emoji: '🍽️', icon: <Grid size={24} /> };
  };

  return (
    <div className="flex gap-6 overflow-x-auto no-scrollbar py-4 px-6 snap-x">
      {categories.map((cat) => {
        const isActive = activeId === cat.id;
        const meta = getIcon(cat.name);
        return (
          <button
            key={cat.id}
            id={`category-tab-${cat.id}`}
            onClick={() => onChange(cat.id)}
            className="flex flex-col items-center gap-3 flex-shrink-0 transition-all duration-300 active:scale-90 snap-start"
          >
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center relative transition-all duration-300
                ${isActive 
                  ? 'bg-orange-500 text-white shadow-2xl shadow-orange-500/40 -rotate-6 scale-110' 
                  : 'bg-white text-slate-400 border border-black/5 shadow-sm hover:border-orange-200'}`}
            >
              <span className={`text-3xl transition-opacity duration-300 ${isActive ? 'opacity-0' : 'opacity-100'}`}>
                {meta.emoji}
              </span>
              {isActive && (
                <motion.div
                  layoutId="active-icon-bg"
                  initial={{ scale: 0, rotate: 20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute inset-0 flex items-center justify-center text-white"
                >
                  {meta.icon}
                </motion.div>
              )}
            </div>
            <span
              className={`text-[11px] uppercase font-black tracking-[0.2em] transition-colors duration-300
                ${isActive ? 'text-orange-600' : 'text-slate-300'}`}
            >
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
