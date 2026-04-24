'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Coffee, Utensils, Cake, Flame, Grid } from 'lucide-react';
import type { Category } from '@arifsmart/shared';

interface Props {
  categories: Category[];
  activeId: string;
  onChange: (id: string) => void;
}

export function CategoryTabs({ categories, activeId, onChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [curveMap, setCurveMap] = useState<Record<string, number>>({});

  const recomputeCurve = useCallback(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const viewportCenter = scroller.clientWidth / 2;
    const maxCurve = 30;
    const nextCurve: Record<string, number> = {};

    categories.forEach((cat) => {
      const el = itemRefs.current[cat.id];
      if (!el) {
        nextCurve[cat.id] = 0;
        return;
      }
      const itemCenter = el.offsetLeft - scroller.scrollLeft + el.offsetWidth / 2;
      const normDistance = Math.min(1, Math.abs(itemCenter - viewportCenter) / viewportCenter);
      const curveY = Math.round(normDistance * normDistance * maxCurve);
      nextCurve[cat.id] = curveY;
    });

    setCurveMap(nextCurve);
  }, [categories]);

  useEffect(() => {
    recomputeCurve();
    const scroller = scrollRef.current;
    if (!scroller) return;

    const handleScroll = () => recomputeCurve();
    scroller.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      scroller.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [recomputeCurve]);

  useEffect(() => {
    const activeEl = itemRefs.current[activeId];
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      requestAnimationFrame(() => recomputeCurve());
    }
  }, [activeId, recomputeCurve]);

  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('drink')) return { emoji: '🥤', icon: <Coffee size={26} /> };
    if (n.includes('food') || n.includes('main')) return { emoji: '🍽️', icon: <Utensils size={26} /> };
    if (n.includes('desert') || n.includes('dessert') || n.includes('sweet')) return { emoji: '🧁', icon: <Cake size={26} /> };
    if (n.includes('special')) return { emoji: '🔥', icon: <Flame size={26} /> };
    return { emoji: '🍱', icon: <Grid size={26} /> };
  };

  return (
    <div className="relative overflow-visible">
      <div ref={scrollRef} className="overflow-x-auto no-scrollbar snap-x px-4 pb-2">
        <div className="inline-flex min-w-max items-start gap-3 pt-1">
      {categories.map((cat, index) => {
        const isActive = activeId === cat.id;
        const meta = getIcon(cat.name);
        const curveY = curveMap[cat.id] ?? 0;
        return (
          <button
            ref={(el) => {
              itemRefs.current[cat.id] = el;
            }}
            key={cat.id}
            id={`category-tab-${cat.id}`}
            onClick={() => onChange(cat.id)}
            className="flex flex-col items-center gap-2 min-w-[66px] sm:min-w-[74px] flex-shrink-0 transition-all duration-300 active:scale-90 snap-start"
            style={{ transform: `translateY(${curveY}px)` }}
          >
            <div
              className={`w-[58px] h-[58px] sm:w-[68px] sm:h-[68px] rounded-full flex items-center justify-center relative transition-all duration-300
                ${isActive 
                  ? 'bg-[#F1CFAE] text-[#1E1E1E] shadow-xl shadow-[#F1CFAE]/35 scale-105' 
                  : 'bg-white text-[#1E1E1E] border border-black/5 shadow-sm hover:border-[#C59B76]/30'}`}
            >
              <span className={`text-[24px] sm:text-[30px] transition-opacity duration-300 ${isActive ? 'opacity-0' : 'opacity-100'}`}>
                {meta.emoji}
              </span>
              {isActive && (
                <div className="absolute inset-0 flex items-center justify-center text-[#1E1E1E]">
                  {meta.icon}
                </div>
              )}
            </div>
            <span
              className={`text-[11px] sm:text-[14px] leading-none transition-colors duration-300 font-medium font-serif text-center
                ${isActive ? 'text-white' : 'text-white/95'}`}
            >
              {cat.name}
            </span>
          </button>
        );
      })}
        </div>
      </div>
    </div>
  );
}
