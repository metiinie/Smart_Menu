'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { MenuItem } from '@arifsmart/shared';

interface Props {
  item: MenuItem;
  quantity: number;
  onTap: () => void;
}

export function FoodCarouselItem({ item, quantity, onTap }: Props) {
  const palette = {
    halo: '#44CFA0',
    shadow: 'rgba(12, 74, 58, 0.35)',
  };
  // Helper to get Pinterest premium image path if available
  const displayImageUrl = item.imageUrl?.replace('.jpg', '.png');

  return (
    <div 
      className="w-[320px] flex-shrink-0 flex flex-col items-center cursor-pointer"
      onClick={onTap}
    >
      {/* Decorative Base & Image Container */}
      <div className="relative w-[280px] h-[280px] flex items-center justify-center">
        {/* Decorative shadow base */}
        <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[80%] h-[15%] blur-2xl rounded-full" style={{ backgroundColor: palette.shadow }} />
        
        {/* Floating Ring / Glow */}
        <div className="absolute inset-0 rounded-full scale-90 blur-3xl" style={{ backgroundColor: palette.halo }} />

        {/* Main Image */}
        <motion.div 
          className="relative w-[240px] h-[240px] z-10 flex items-center justify-center"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {item.imageUrl ? (
            <Image
              src={displayImageUrl || item.imageUrl}
              alt={item.name}
              fill
              sizes="240px"
              className="object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.4)]"
              priority
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-8xl bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-2xl">
              🍱
            </div>
          )}
        </motion.div>

        {/* Quantity Badge if > 0 */}
        {quantity > 0 && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 right-4 z-20 bg-[#E53935] text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow-xl border-4 border-white"
          >
            {quantity}
          </motion.div>
        )}
      </div>

      {/* Details */}
      <div className="text-center mt-3 space-y-1.5">
        <h3 className="font-medium text-[14px] leading-[1.25] text-white line-clamp-2 drop-shadow-sm px-2">
          {item.name}
        </h3>
        <p className="font-black text-[34px] leading-none text-black flex items-center justify-center gap-1">
          {item.price.toFixed(0)} 
          <span className="text-[18px] font-black text-black tracking-tight uppercase">ETB</span>
        </p>
      </div>
    </div>
  );
}
