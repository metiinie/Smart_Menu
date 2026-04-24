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
    if (n.includes('drink')) return { emoji: '🥤', icon: <Coffee size={26} /> };
    if (n.includes('food') || n.includes('main')) return { emoji: '🍽️', icon: <Utensils size={26} /> };
    if (n.includes('desert') || n.includes('dessert') || n.includes('sweet')) return { emoji: '🧁', icon: <Cake size={26} /> };
    if (n.includes('special')) return { emoji: '🔥', icon: <Flame size={26} /> };
    return { emoji: '🍱', icon: <Grid size={26} /> };
  };

  return (
    <div className="flex items-start justify-between gap-3 overflow-x-auto no-scrollbar py-3 px-6 snap-x">
      {categories.map((cat) => {
        const isActive = activeId === cat.id;
        const meta = getIcon(cat.name);
        return (
          <button
            key={cat.id}
            id={`category-tab-${cat.id}`}
            onClick={() => onChange(cat.id)}
            className="flex flex-col items-center gap-2.5 min-w-[76px] flex-shrink-0 transition-all duration-300 active:scale-90 snap-start"
          >
            <div
              className={`w-[74px] h-[74px] rounded-full flex items-center justify-center relative transition-all duration-300
                ${isActive 
                  ? 'bg-[#F1CFAE] text-[#1E1E1E] shadow-xl shadow-[#F1CFAE]/35 scale-105' 
                  : 'bg-white text-[#1E1E1E] border border-black/5 shadow-sm hover:border-[#C59B76]/30'}`}
            >
              <motion.span
                animate={isActive ? { rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] } : { rotate: 0, scale: 1 }}
                transition={{ duration: 1.2, repeat: isActive ? Infinity : 0, repeatDelay: 1.8 }}
                className={`text-[30px] transition-opacity duration-300 ${isActive ? 'opacity-0' : 'opacity-100'}`}
              >
                {meta.emoji}
              </motion.span>
              {isActive && (
                <motion.div
                  layoutId="active-icon-bg"
                  initial={{ scale: 0.75, opacity: 0 }}
                  animate={{ scale: [1, 1.08, 1], opacity: 1, rotate: [0, 10, 0] }}
                  transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 2.2 }}
                  className="absolute inset-0 flex items-center justify-center text-[#1E1E1E]"
                >
                  {meta.icon}
                </motion.div>
              )}
            </div>
            <span
              className={`text-[15px] leading-none transition-colors duration-300 font-medium font-serif
                ${isActive ? 'text-white' : 'text-white/95'}`}
            >
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
