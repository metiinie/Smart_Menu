'use client';
import Image from 'next/image';
import { Heart, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import type { MenuItem } from '@/shared/types';

interface Props {
  item: MenuItem;
  quantity: number;
  onTap: () => void;
  onAdd?: (item: MenuItem) => void;
  onToggleFavorite?: (item: MenuItem) => void;
  isFavorite?: boolean;
  variant?: 'center' | 'side';
}

export function FoodCarouselItem({ 
  item, 
  quantity, 
  onTap, 
  onAdd,
  onToggleFavorite,
  isFavorite = false,
  variant = 'center' 
}: Props) {
  const isCenter = variant === 'center';

  return (
    <div
      role="button"
      tabIndex={0}
      className={`${
        isCenter
          ? 'w-[min(64vw,278px)] min-w-[200px] max-w-[278px]'
          : 'w-[118px] sm:w-[128px] min-w-0 max-w-[132px]'
      } flex-shrink-0 flex flex-col items-center bg-transparent cursor-pointer outline-none group`}
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
        <div className="absolute bottom-[8%] w-[82%] h-[14%] bg-brand-500/20 blur-2xl rounded-full" />
        <div className="absolute inset-0 rounded-full scale-[0.88] blur-2xl bg-brand-400/20" />
        <div className="absolute inset-[22%] rounded-full bg-brand-50/10 dark:bg-brand-900/10" />

        <div
          className={`${
            isCenter
              ? 'w-[min(44vw,202px)] h-[min(44vw,202px)] min-w-[132px] min-h-[132px] max-w-[202px] max-h-[202px]'
              : 'w-[86px] h-[86px] sm:w-[94px] sm:h-[94px]'
          } relative z-10 transition-transform duration-500 group-hover:scale-110`}
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
            <div className="w-full h-full rounded-full bg-surface-100 flex items-center justify-center text-6xl shadow-inner border border-surface-200">
              🍽️
            </div>
          )}
        </div>

        {quantity > 0 && (
          <div className="absolute top-3 right-4 z-20 w-8 h-8 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center border-2 border-white dark:border-surface-200 shadow-lg transition-all group-hover:scale-110 group-hover:-translate-y-1">
            {quantity}
          </div>
        )}

        {/* Hover Actions */}
        <div className="absolute inset-0 z-30 pointer-events-none">
          {/* Favorite Icon (Top Left) */}
          <button
            className="absolute top-4 left-4 pointer-events-auto w-[34px] h-[34px] rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 transition-all active:scale-90 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(item);
            }}
          >
            <Heart 
              size={16} 
              className={`transition-colors ${isFavorite ? 'fill-[#E53935] text-[#E53935]' : 'text-white'}`} 
            />
          </button>

          {/* Cart Icon (Top Right) */}
          <button
            className="absolute top-4 right-4 pointer-events-auto w-[34px] h-[34px] rounded-full bg-brand-500 backdrop-blur-md flex items-center justify-center border border-white/10 transition-all active:scale-90 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 delay-[50ms]"
            onClick={(e) => {
              e.stopPropagation();
              onAdd?.(item);
            }}
          >
            <ShoppingBag size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
