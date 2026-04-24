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
  return (
    <button
      type="button"
      className="w-[240px] sm:w-[270px] flex-shrink-0 flex flex-col items-center bg-transparent"
      onClick={onTap}
    >
      <div className="relative w-[220px] h-[220px] sm:w-[250px] sm:h-[250px] flex items-center justify-center">
        <div className="absolute bottom-[8%] w-[82%] h-[14%] bg-[#0A6D52]/35 blur-2xl rounded-full" />
        <div className="absolute inset-0 rounded-full scale-[0.88] blur-2xl bg-[#44CFA0]" />
        <div className="absolute inset-[22%] rounded-full bg-[#39C798]" />

        <motion.div
          className="relative z-10 w-[170px] h-[170px] sm:w-[200px] sm:h-[200px]"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 170px, 200px"
              className="object-contain drop-shadow-[0_18px_22px_rgba(0,0,0,0.28)]"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center text-6xl">
              🍽️
            </div>
          )}
        </motion.div>

        {quantity > 0 && (
          <div className="absolute top-3 right-4 z-20 w-8 h-8 rounded-full bg-[#E53935] text-white text-sm font-bold flex items-center justify-center border-2 border-white">
            {quantity}
          </div>
        )}
      </div>

      <div className="text-center mt-1">
        <h3 className="text-white text-[34px] leading-[1.1] font-medium font-serif px-3 line-clamp-2">
          {item.name}
        </h3>
        <p className="text-black text-[40px] leading-none font-black mt-1">
          {Math.round(item.price)}
          <span className="text-[18px] ml-1">ETB</span>
        </p>
      </div>
    </button>
  );
}
