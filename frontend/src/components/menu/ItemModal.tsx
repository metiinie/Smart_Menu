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
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#FDFBF7] rounded-t-[3rem]
                       max-h-[85dvh] overflow-y-auto safe-bottom shadow-[0_-20px_60px_rgba(0,0,0,0.3)]"
          >
            {/* Header / Drag Handle */}
            <div className="sticky top-0 bg-[#FDFBF7] z-10 px-6 pt-6 pb-2 flex justify-between items-center">
               <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto absolute top-3 left-1/2 -translate-x-1/2" />
               <h2 className="font-display font-black text-2xl text-slate-800 uppercase tracking-tighter">
                 Details
               </h2>
               <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-transform"
              >
                <X size={20} />
              </button>
            </div>

            {/* Image Section */}
            <div className="px-6 pb-6">
              <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden bg-slate-100 shadow-inner">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl">
                    🍱
                  </div>
                )}
                {item.isFasting && (
                  <span className="absolute top-4 left-4 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                    Fasting
                  </span>
                )}
              </div>
            </div>

            {/* Content Section */}
            <div className="px-8 pb-12">
              <div className="flex flex-col gap-2 mb-6">
                <h1 className="font-display font-black text-4xl text-slate-900 leading-[0.9] tracking-tighter uppercase">
                  {item.name}
                </h1>
                <p className="text-slate-500 text-base leading-relaxed">
                  {item.description || "A masterfully prepared dish using the finest seasonal ingredients, curated for the ultimate culinary experience."}
                </p>
              </div>

              {/* Price Row */}
              <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-100">
                <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Price per unit</span>
                <span className="font-display font-black text-3xl text-[#009A66]">
                  {item.price.toFixed(0)} <span className="text-sm font-bold opacity-40">ETB</span>
                </span>
              </div>

              {/* Special Instructions */}
              <div className="mb-8 space-y-4">
                <label className="flex items-center gap-3 text-slate-400 text-xs font-black uppercase tracking-[0.2em]">
                  <MessageSquare size={14} className="text-[#C59B76]" />
                  Customization
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any special requests? (e.g., No onions, extra spicy...)"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-5 
                             text-slate-800 text-base outline-none focus:border-[#C59B76]/30 transition-all
                             placeholder:text-slate-300 resize-none h-32"
                />
              </div>

              {/* Action Bar */}
              <div className="flex items-center gap-4 sticky bottom-0">
                <div className="flex items-center gap-2 bg-slate-100 rounded-full p-2">
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={onRemove}
                    disabled={quantity === 0}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-white text-slate-400 shadow-sm disabled:opacity-30"
                  >
                    <Minus size={20} />
                  </motion.button>
                  <span className="font-black text-slate-800 w-8 text-center text-xl">
                    {quantity}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={handleAdd}
                    className="w-12 h-12 rounded-full bg-[#009A66] text-white flex items-center justify-center shadow-lg"
                  >
                    <Plus size={20} />
                  </motion.button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAdd}
                  className="flex-1 bg-[#1E3E34] text-white h-16 rounded-full font-black text-lg uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3"
                >
                  <ShoppingCart size={20} />
                  {quantity > 0 ? `Update Order` : 'Add to Order'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
