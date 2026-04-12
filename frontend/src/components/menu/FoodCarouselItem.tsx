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
  // Helper to get Pinterest premium image path if available
  const displayImageUrl = item.imageUrl?.replace('.jpg', '.png');

  return (
    <div className="w-[300px] flex-shrink-0 flex flex-col items-center px-4">
      {/* Decorative Base & Image Container */}
      <div 
        className="relative w-full aspect-square flex items-center justify-center cursor-pointer mb-4"
        onClick={onTap}
      >
        {/* Decorative shadow base */}
        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[70%] h-[15%] bg-black/10 blur-xl rounded-full" />
        
        {/* Floating Ring / Glow */}
        <div className="absolute inset-0 bg-brand-500/5 rounded-full scale-90 blur-2xl" />

        {/* Main Image */}
        <motion.div 
          className="relative w-[220px] h-[220px] z-10 flex items-center justify-center"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {item.imageUrl ? (
            <Image
              src={displayImageUrl || item.imageUrl}
              alt={item.name}
              fill
              sizes="220px"
              className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
              priority
            />
          ) : (
            <div className="w-40 h-40 flex items-center justify-center text-7xl bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-inner">
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
