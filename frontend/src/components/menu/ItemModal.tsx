'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Plus, Minus, ShoppingCart, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { MenuItem } from '@arifsmart/shared';

interface Props {
  item: MenuItem | null;
  quantity: number;
  onClose: () => void;
  onAdd: (note?: string) => void;
  onRemove: () => void;
}

export function ItemModal({ item, quantity, onClose, onAdd, onRemove }: Props) {
  const [note, setNote] = useState('');

  // Reset note when item changes
  useEffect(() => {
    if (item) setNote('');
  }, [item]);

  const handleAdd = () => {
    onAdd(note);
    if (quantity === 0) {
      onClose();
    }
  };
  return (
    <AnimatePresence>
      {item && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-surface-50 rounded-t-3xl
                       max-h-[90dvh] overflow-y-auto safe-bottom"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-surface-300" />
            </div>

            {/* Image */}
            <div className="relative w-full h-56 bg-surface-100 mx-0">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  🍽️
                </div>
              )}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50
                           backdrop-blur flex items-center justify-center"
                id="close-item-modal"
              >
                <X size={18} className="text-white" />
              </button>
              {item.isFasting && (
                <span className="absolute top-3 left-3 badge-fasting">🌿 Fasting</span>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="font-display font-bold text-xl text-white leading-tight">
                  {item.name}
                </h2>
                <span className="font-display font-bold text-brand-400 text-xl flex-shrink-0">
                  ETB {item.price.toFixed(0)}
                </span>
              </div>

              {item.description && (
                <p className="text-white/60 text-sm leading-relaxed mb-6">
                  {item.description}
                </p>
              )}

              {/* Special Instructions */}
              <div className="mb-6 space-y-2">
                <label className="flex items-center gap-2 text-white/50 text-[11px] font-bold uppercase tracking-wider">
                  <MessageSquare size={12} />
                  Special Instructions
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. No onions, extra spicy, etc."
                  className="w-full bg-surface-100 border border-surface-200 rounded-2xl p-3 
                             text-white text-sm outline-none focus:border-brand-500/50 transition-colors
                             placeholder:text-white/20 resize-none h-20"
                />
              </div>

              {/* Quantity + Add */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-surface-100 rounded-2xl p-1">
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={onRemove}
                    disabled={quantity === 0}
                    className="w-10 h-10 rounded-xl flex items-center justify-center
                               disabled:opacity-30 text-white"
                    id="modal-decrease"
                  >
                    <Minus size={18} />
                  </motion.button>
                  <span className="font-bold text-white w-6 text-center text-lg">
                    {quantity}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={handleAdd}
                    className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center"
                    id="modal-increase"
                  >
                    <Plus size={18} className="text-white" />
                  </motion.button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAdd}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                  id="modal-add-to-cart"
                >
                  <ShoppingCart size={18} />
                  {quantity > 0 ? `Added (${quantity})` : 'Add to Cart'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
