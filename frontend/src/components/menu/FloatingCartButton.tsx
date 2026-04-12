'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';

interface Props {
  totalItems: number;
  totalPrice: number;
  onClick: () => void;
}

export function FloatingCartButton({ totalItems, totalPrice, onClick }: Props) {
  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-0 left-0 right-0 p-4 safe-bottom z-30"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className="w-full btn-primary flex items-center justify-between py-4 px-5 shadow-glow-lg"
            id="floating-cart-btn"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart size={22} />
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white
                                 text-brand-600 text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              </div>
              <span className="font-semibold">View Cart</span>
            </div>
            <span className="font-display font-bold text-lg">
              ETB {totalPrice.toFixed(0)}
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
