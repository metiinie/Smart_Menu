'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Plus, Minus } from 'lucide-react';
import type { MenuItem } from '@arifsmart/shared';

interface Props {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onTap: () => void;
}

export function FoodCard({ item, quantity, onAdd, onTap }: Props) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="card flex gap-3 p-3 cursor-pointer"
      onClick={onTap}
      id={`food-card-${item.id}`}
    >
      {/* Image */}
      <div className="relative w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden bg-surface-100">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="96px"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            🍽️
          </div>
        )}
        {item.isFasting && (
          <span className="absolute top-1.5 left-1.5 badge-fasting text-[10px] px-1.5 py-0.5">
            Fasting
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-1">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-white/40 text-xs mt-0.5 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="font-display font-bold text-brand-400 text-sm">
            ETB {item.price.toFixed(0)}
          </span>

          {quantity > 0 ? (
            <div
              className="flex items-center gap-2 bg-brand-500/20 rounded-full px-2 py-1"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-brand-400 font-bold text-sm w-4 text-center">
                {quantity}
              </span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={onAdd}
                className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center"
                id={`add-item-${item.id}`}
              >
                <Plus size={14} className="text-white" />
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
              className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center shadow-glow"
              id={`add-item-${item.id}`}
            >
              <Plus size={16} className="text-white" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
