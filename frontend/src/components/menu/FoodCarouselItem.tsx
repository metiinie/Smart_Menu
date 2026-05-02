'use client';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import type { MenuItem } from '@/shared/types';

interface Props {
  item: MenuItem;
  quantity: number;
  onTap: () => void;
  variant?: 'center' | 'side';
}

export function FoodCarouselItem({ item, quantity, onTap, variant = 'center' }: Props) {
  const isCenter = variant === 'center';
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      className={`${
        isCenter
          ? 'w-[min(64vw,278px)] min-w-[200px] max-w-[278px]'
          : 'w-[118px] sm:w-[128px] min-w-0 max-w-[132px]'
      } flex-shrink-0 flex flex-col items-center bg-transparent cursor-pointer outline-none`}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap();
        }
      }}
    >
      <div
        className={`${
          isCenter
            ? 'w-[min(58vw,252px)] h-[min(58vw,252px)] min-w-[180px] min-h-[180px] max-w-[252px] max-h-[252px]'
            : 'w-[118px] h-[118px] sm:w-[128px] sm:h-[128px] max-w-[132px] max-h-[132px]'
        } relative flex items-center justify-center`}
      >
        <div className="absolute bottom-[8%] w-[82%] h-[14%] bg-[#0A6D52]/35 blur-2xl rounded-full" />
        <div className="absolute inset-0 rounded-full scale-[0.88] blur-2xl bg-[#44CFA0]" />
        <div className="absolute inset-[22%] rounded-full bg-[#39C798]" />

        <div
          className={`${
            isCenter
              ? 'w-[min(44vw,202px)] h-[min(44vw,202px)] min-w-[132px] min-h-[132px] max-w-[202px] max-h-[202px]'
              : 'w-[86px] h-[86px] sm:w-[94px] sm:h-[94px]'
          } relative z-10`}
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes={isCenter ? '(max-width: 640px) 170px, 200px' : '96px'}
              className="object-contain drop-shadow-[0_18px_22px_rgba(0,0,0,0.28)]"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center text-6xl">
              🍽️
            </div>
          )}
        </div>

        {quantity > 0 && (
          <div className="absolute top-3 right-4 z-20 w-8 h-8 rounded-full bg-[#E53935] text-white text-sm font-bold flex items-center justify-center border-2 border-white">
            {quantity}
          </div>
        )}

        {/* Favorite Icon */}
        <button
          className="absolute top-4 left-4 z-20 w-[34px] h-[34px] rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 transition-all active:scale-90"
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
        >
          <Heart 
            size={16} 
            className={`transition-colors ${isFavorite ? 'fill-[#E53935] text-[#E53935]' : 'text-white/80'}`} 
          />
        </button>
      </div>
    </div>
  );
}
