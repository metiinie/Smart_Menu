'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Star, X, Send, MessageSquare } from 'lucide-react';
import { ordersApi } from '@/lib/api';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  customerRef: string;
  menuItemId?: string;
  itemName?: string;
  onSuccess?: () => void;
}

export function RatingModal({
  isOpen,
  onClose,
  orderId,
  customerRef,
  menuItemId,
  itemName,
  onSuccess,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      await ordersApi.submitRating(orderId, {
        rating,
        comment,
        customerRef,
        menuItemId,
      });
      setIsSubmitted(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
        // Reset state for next time
        setTimeout(() => {
          setIsSubmitted(false);
          setRating(0);
          setComment('');
        }, 300);
      }, 2000);
    } catch (err) {
      console.error('Failed to submit rating:', err);
      toast.error('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-x-0 bottom-0 bg-surface-50 rounded-t-[32px] z-[101] p-6 pb-10 shadow-2xl safe-bottom border-t border-surface-200"
        >
          <div className="w-12 h-1.5 bg-surface-200 rounded-full mx-auto mb-6" />

          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-surface-900">
                {isSubmitted ? 'Thank You!' : itemName ? `Rate ${itemName}` : 'Rate Your Experience'}
              </h3>
              <p className="text-surface-500 text-sm mt-1">
                {isSubmitted 
                  ? 'Your feedback helps us improve!' 
                  : 'How was your dish today?'}
              </p>
            </div>
            {!isSubmitting && !isSubmitted && (
              <button onClick={onClose} className="p-2 bg-surface-100 rounded-full text-surface-400">
                <X size={20} />
              </button>
            )}
          </div>

            {isSubmitted ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-10 flex flex-col items-center justify-center text-center"
              >
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <Star size={40} className="text-emerald-500 fill-emerald-500" />
                </div>
                <p className="font-semibold text-surface-800">Rating Submitted Successfully</p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {/* Star Rating */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileTap={{ scale: 0.8 }}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        size={42}
                        className={`transition-colors ${
                          star <= (hover || rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-surface-200 fill-transparent'
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>

                {/* Comment Area */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-surface-400 text-xs font-bold uppercase tracking-wider">
                    <MessageSquare size={14} />
                    <span>Any comments? (Optional)</span>
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you liked or how we can improve..."
                    className="w-full bg-surface-100 border border-surface-200 rounded-2xl p-4 text-sm text-surface-800 outline-none focus:border-brand-500 transition-colors h-32 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={rating === 0 || isSubmitting}
                  onClick={handleSubmit}
                  className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all ${
                    rating > 0 
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Submit Review</span>
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
