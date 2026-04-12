'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import type { MenuItem } from '@arifsmart/shared';

interface Props {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onTap: () => void;
}

export function FoodCarouselItem({ item, quantity, onAdd, onTap }: Props) {
  return (
    <div className="w-[280px] flex-shrink-0 flex flex-col items-center px-4">
      {/* Decorative Base & Image Container */}
      <div 
        className="relative w-full aspect-[4/5] flex items-center justify-center cursor-pointer"
        onClick={onTap}
      >
        {/* Decorative Orange Base (Glow) */}
        <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[80%] h-[30%] bg-brand-500/20 blur-3xl rounded-full" />
        <div 
          className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[70%] h-[15%] bg-brand-500/10 rounded-[50%] rotate-x-60" 
          style={{ transform: 'translateX(-50%) rotateX(70deg)' }}
        />

        {/* Main Image */}
        <motion.div 
          whileHover={{ y: -10 }}
          className="relative w-[180px] h-[240px] z-10"
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="180px"
              className="object-contain drop-shadow-2xl"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl bg-white/50 backdrop-blur-sm rounded-3xl border border-white/20">
              🍽️
            </div>
          )}
        </motion.div>

        {/* Quantity Badge if > 0 */}
        {quantity > 0 && (
          <div className="absolute top-4 right-4 z-20 bg-brand-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg">
            {quantity}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="text-center mt-6 space-y-2">
        <h3 className="font-display font-bold text-xl text-slate-800 line-clamp-1">
          {item.name}
        </h3>
        <p className="font-display font-black text-2xl text-slate-900">
          {item.price.toFixed(0)} <span className="text-sm font-bold text-slate-400 ml-1">ETB</span>
        </p>
      </div>

      {/* Add Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        className="mt-6 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-black text-lg
                   px-10 py-4 rounded-full shadow-lg shadow-brand-500/30 transition-all active:scale-95"
      >
        ORDER
      </motion.button>
    </div>
  );
}
