'use client';

import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Hash,
  ChevronRight,
  Package
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  order: any;
  onDeliver: (orderId: string) => void;
  isDelivering?: boolean;
}

export function StaffOrderCard({ order, onDeliver, isDelivering }: Props) {
  const { t } = useTranslation();
  const isReady = order.status === 'READY';
  
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'CREATED':   return 'bg-surface-200 text-foreground';
      case 'CONFIRMED': return 'bg-blue-500/10 text-blue-500';
      case 'PREPARING': return 'bg-amber-500/10 text-amber-500';
      case 'READY':     return 'bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/20';
      case 'DELIVERED': return 'bg-surface-200 text-foreground/40';
      default:          return 'bg-surface-200 text-foreground';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-surface rounded-[2rem] p-6 shadow-md border-2 transition-all duration-300 ${
        isReady ? 'border-brand-500 shadow-brand-500/10' : 'border-surface-200 opacity-60 shadow-sm'
      }`}
    >
      {/* Table Badge */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-background font-black text-2xl shadow-xl ${
            isReady ? 'bg-gradient-to-br from-brand-500 to-orange-600' : 'bg-surface-300'
          }`}>
            {order.table?.tableNumber || '?'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-foreground uppercase tracking-wider">{t('table')}</span>
              {order.displayNumber && (
                <span className="text-xs font-mono bg-surface-100 px-2 py-0.5 rounded-lg text-foreground/40 font-bold">
                  #{order.displayNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-foreground/40 text-xs mt-1 font-medium">
              <Clock size={14} />
              <span>{formatDistanceToNow(new Date(order.createdAt))} {t('ago')}</span>
            </div>
          </div>
        </div>
        
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${getStatusClasses(order.status)}`}>
          {t(order.status.toLowerCase() as any)}
        </div>
      </div>

      {/* Item List Preview */}
      <div className="space-y-3 mb-6 bg-surface-100 p-4 rounded-2xl border border-surface-200">
        {order.items?.map((item: any) => (
          <div key={item.id} className="flex items-start gap-3">
            <span className="text-xs font-black text-brand-500 bg-brand-500/10 w-6 h-6 flex items-center justify-center rounded-lg flex-shrink-0 border border-brand-500/20">
              {item.quantity}
            </span>
            <div className="flex-1">
              <p className="text-sm font-black text-foreground leading-tight">
                {item.menuItem?.name}
              </p>
              {item.options && item.options.length > 0 && (
                <p className="text-xs text-foreground/40 font-medium mt-1">
                  {item.options.map((o: any) => o.optionName).join(' • ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => onDeliver(order.id)}
        disabled={!isReady || isDelivering}
        className={`w-full py-4.5 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all shadow-xl ${
          isReady 
            ? 'bg-brand-500 text-white shadow-brand-500/30 active:shadow-none' 
            : 'bg-surface-100 text-foreground/20 cursor-not-allowed shadow-none'
        }`}
      >
        {isDelivering ? (
          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <CheckCircle2 size={22} strokeWidth={3} />
            <span>{t('completeDelivery')}</span>
          </>
        )}
      </motion.button>

      {/* Location & ID Hint */}
      <div className="mt-5 pt-4 border-t border-surface-200 flex items-center justify-between text-foreground/20">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="text-brand-500" />
          <span className="text-xs font-bold text-foreground">{t('mainHall' as any)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Hash size={12} />
          <span className="text-xs font-mono font-bold">{order.id.slice(-6).toUpperCase()}</span>
        </div>
      </div>

      {/* Urgency Indicator */}
      {isReady && (
        <span className="absolute -top-2 -right-2 flex h-6 w-6">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-6 w-6 bg-brand-500 border-4 border-white shadow-md"></span>
        </span>
      )}
    </motion.div>
  );
}
