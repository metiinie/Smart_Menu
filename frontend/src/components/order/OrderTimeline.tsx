'use client';

import { motion } from 'framer-motion';
import { Check, Clock, ChefHat, Bell, Package } from 'lucide-react';
import { OrderStatus } from '@arifsmart/shared';

const STEPS = [
  { status: OrderStatus.CONFIRMED, label: 'Order Confirmed', icon: Check,    color: 'bg-blue-500' },
  { status: OrderStatus.PREPARING, label: 'Preparing',       icon: ChefHat,  color: 'bg-amber-500' },
  { status: OrderStatus.READY,     label: 'Ready to Serve',  icon: Bell,     color: 'bg-emerald-500' },
  { status: OrderStatus.DELIVERED, label: 'Delivered',       icon: Package,  color: 'bg-purple-500' },
];

const STATUS_INDEX: Record<string, number> = {
  CREATED: -1, CONFIRMED: 0, PREPARING: 1, READY: 2, DELIVERED: 3,
};

interface Props {
  status: string;
}

export function OrderTimeline({ status }: Props) {
  const currentIndex = STATUS_INDEX[status] ?? -1;

  return (
    <div className="relative px-4 py-6">
      {/* Vertical line */}
      <div className="absolute left-10 top-10 bottom-10 w-0.5 bg-surface-200" />
      <motion.div
        className="absolute left-10 top-10 w-0.5 bg-brand-500"
        initial={{ height: 0 }}
        animate={{ height: `${Math.max(0, (currentIndex / (STEPS.length - 1)) * 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />

      <div className="space-y-8">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = i <= currentIndex;
          const active = i === currentIndex;

          return (
            <motion.div
              key={step.status}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative flex items-center gap-4"
            >
              {/* Circle */}
              <div
                className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center
                  flex-shrink-0 border-2 transition-all duration-500
                  ${done
                    ? `${step.color} border-transparent shadow-glow`
                    : 'bg-surface-100 border-surface-300'
                  }
                  ${active ? 'ring-4 ring-brand-500/30' : ''}
                `}
              >
                <Icon size={20} className={done ? 'text-white' : 'text-white/30'} />
                {active && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-brand-400"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Text */}
              <div>
                <p className={`font-semibold transition-colors ${done ? 'text-white' : 'text-white/30'}`}>
                  {step.label}
                </p>
                {active && (
                  <p className="text-brand-400 text-xs mt-0.5 flex items-center gap-1">
                    <Clock size={11} /> In progress…
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
