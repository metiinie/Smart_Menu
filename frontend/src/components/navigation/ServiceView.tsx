'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Receipt, Coffee, Utensils, 
  Globe, Moon, Sun, ChevronLeft, 
  History, CheckCircle2, ChevronRight,
  Shield, Star, Loader2, MessageSquare
} from 'lucide-react';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useCartStore } from '@/stores/cartStore';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { LANGUAGES, UI_STRINGS } from '@/lib/i18n';
import { formatPrice } from '@/lib/formatters';
import { callWaiter } from '@/lib/socket';
import { RatingModal } from '@/components/feedback/RatingModal';

type ServiceSubView = 'main' | 'history';

export function ServiceView() {
  const { language, setLanguage, isDarkMode, toggleDarkMode, currency } = useFavoritesStore();
  const { tableId, customerRef, branchId } = useCartStore();
  
  const t = UI_STRINGS[language];
  const [subView, setSubView] = useState<ServiceSubView>('main');
  const [waiterStatus, setWaiterStatus] = useState<'idle' | 'calling' | 'success'>('idle');
  const [activeRequest, setActiveRequest] = useState<string | null>(null);
  const [ratingOrder, setRatingOrder] = useState<any>(null);

  // Fetch Order History
  const { data: history = [], refetch: refetchHistory } = useQuery({
    queryKey: ['order-history', customerRef],
    queryFn: () => ordersApi.getOrderHistory(customerRef!),
    enabled: !!customerRef,
  });

  const handleServiceAction = (type: 'WAITER' | 'BILL' | 'WATER' | 'CLEAN') => {
    if (!tableId || !branchId) return;
    
    setWaiterStatus('calling');
    setActiveRequest(type);

    // Get table context if possible
    const tableCtx = localStorage.getItem('_table_ctx');
    const tableNumber = tableCtx ? JSON.parse(tableCtx).table.tableNumber : 0;

    callWaiter({
      tableId,
      tableNumber,
      branchId,
      requestType: type as any,
    });

    setTimeout(() => {
      setWaiterStatus('success');
      setTimeout(() => {
        setWaiterStatus('idle');
        setActiveRequest(null);
      }, 3000);
    }, 1500);
  };

  const SubPageHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-surface-200 bg-surface-50 sticky top-0 z-20">
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={onBack}
        className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-surface-600"
      >
        <ChevronLeft size={20} />
      </motion.button>
      <h3 className="text-lg font-display font-bold text-surface-900 tracking-tight">{title}</h3>
    </div>
  );

  return (
    <div className="service-view pb-32 bg-white min-h-full relative overflow-x-hidden">
      <AnimatePresence mode="wait">
        {subView === 'main' ? (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Dark Mode Toggle - Floating */}
            <div className="absolute top-6 right-6 z-10">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleDarkMode}
                className={`w-12 h-6 rounded-full p-1 transition-colors relative ${isDarkMode ? 'bg-[#8E1C1C]' : 'bg-surface-200'}`}
              >
                <motion.div
                  animate={{ x: isDarkMode ? 24 : 0 }}
                  className="w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden"
                >
                   {isDarkMode ? <Moon size={10} className="text-[#8E1C1C]" /> : <Sun size={10} className="text-amber-500" />}
                </motion.div>
              </motion.button>
            </div>

            {/* Header Area */}
            <div className="pt-12 pb-8 px-6">
              <h2 className="text-3xl font-serif font-bold text-surface-900 tracking-tight">{t.service}</h2>
              <p className="text-surface-500 text-sm mt-1 font-medium">{t.howCanAssist}</p>
            </div>

            <div className="px-5 space-y-6">
              {/* Primary Service Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleServiceAction('WAITER')}
                  disabled={waiterStatus !== 'idle'}
                  className="bg-[#D35400] rounded-[2rem] p-6 shadow-sm border border-[#D35400]/20 text-left group relative overflow-hidden text-white"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                    activeRequest === 'WAITER' && waiterStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-[#7B3012]/10 text-[#7B3012]'
                  }`}>
                    {activeRequest === 'WAITER' && waiterStatus === 'calling' ? <Loader2 className="animate-spin" /> : <Bell size={24} />}
                  </div>
                  <h4 className="text-[13px] font-black text-surface-900 uppercase tracking-tighter leading-none mb-1">
                    {activeRequest === 'WAITER' && waiterStatus === 'success' ? t.called : t.callWaiter}
                  </h4>
                  <p className="text-[9px] text-surface-400 font-bold uppercase tracking-wider">{t.assistance}</p>
                </button>

                <button 
                  onClick={() => handleServiceAction('BILL')}
                  disabled={waiterStatus !== 'idle'}
                  className="bg-[#D35400] rounded-[2rem] p-6 shadow-sm border border-[#D35400]/20 text-left group text-white"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                    activeRequest === 'BILL' && waiterStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-[#7B3012]/10 text-[#7B3012]'
                  }`}>
                    {activeRequest === 'BILL' && waiterStatus === 'calling' ? <Loader2 className="animate-spin" /> : <Receipt size={24} />}
                  </div>
                  <h4 className="text-[13px] font-black text-surface-900 uppercase tracking-tighter leading-none mb-1">
                    {activeRequest === 'BILL' && waiterStatus === 'success' ? t.sent : t.requestBill}
                  </h4>
                  <p className="text-[9px] text-surface-400 font-bold uppercase tracking-wider">{t.payment}</p>
                </button>
              </div>

              {/* Secondary Service Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleServiceAction('WATER')}
                  disabled={waiterStatus !== 'idle'}
                  className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-5 shadow-sm border border-white/50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Coffee size={18} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-surface-900 uppercase tracking-tight">{t.water}</h4>
                      <p className="text-[8px] text-surface-400 font-bold uppercase">{t.refresh}</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => handleServiceAction('CLEAN')}
                  disabled={waiterStatus !== 'idle'}
                  className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-5 shadow-sm border border-white/50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-500">
                      <Utensils size={18} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-surface-900 uppercase tracking-tight">{t.napkins}</h4>
                      <p className="text-[8px] text-surface-400 font-bold uppercase">{t.service}</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Settings Area */}
              <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-white/50">
                 <div className="flex items-center gap-2 mb-5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <Globe size={14} />
                    </div>
                    <span className="text-[11px] font-black text-surface-900 uppercase tracking-widest">{t.languageLabel}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`flex flex-col items-center justify-center py-3 rounded-2xl border-2 transition-all ${
                          language === lang.code 
                            ? 'bg-orange-500/5 border-orange-500 text-orange-600 shadow-inner' 
                            : 'bg-surface-50 border-transparent text-surface-600'
                        }`}
                      >
                        <span className="text-2xl mb-1">{lang.flag}</span>
                        <span className="text-[10px] font-black">{lang.label}</span>
                      </button>
                    ))}
                  </div>
              </div>

              {/* Activity Section */}
              <button 
                onClick={() => setSubView('history')}
                className="w-full bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-white/50 text-left group flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 transition-transform group-active:scale-90">
                    <History size={24} />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-black text-surface-900 uppercase tracking-tighter leading-none mb-1">{t.history}</h4>
                    <p className="text-[10px] text-surface-400 font-bold uppercase tracking-wider">{history.length} {t.ordersPlaced}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-surface-300" />
              </button>

              {/* Session Control */}
              <div className="pt-4 pb-8">
                <button 
                  onClick={() => {
                    if (confirm(t.endSessionConfirm)) {
                      localStorage.removeItem('arifsmart_customerRef');
                      localStorage.removeItem('arifsmart_cart');
                      window.location.reload();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 py-4 text-red-500/40 hover:text-red-500 transition-all font-black text-[11px] uppercase tracking-[0.2em] hover:bg-red-50 rounded-2xl border border-transparent hover:border-red-100"
                >
                   <Shield size={16} />
                   <span>{t.endSession}</span>
                </button>
              </div>

            </div>

          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="min-h-full pb-32"
          >
            <SubPageHeader title={t.history} onBack={() => setSubView('main')} />
            
            <div className="p-4 space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4 opacity-20">📜</div>
                  <h4 className="text-lg font-bold text-surface-900">{t.noOrdersYet}</h4>
                  <p className="text-sm text-surface-400 mt-2">{t.previousOrdersAppear}</p>
                </div>
              ) : (
                history.map((order: any) => (
                  <div key={order.id} className="p-4 bg-surface-100 rounded-2xl border border-surface-200 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-50 flex items-center justify-center text-lg shadow-sm">
                          📦
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-surface-400 tracking-wider">{t.orderNum}{order.displayNumber}</span>
                          <p className="text-sm font-bold text-surface-700">{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-brand-600">{formatPrice(order.totalPrice)}</span>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="space-y-2 mb-4 bg-surface-200/30 p-3 rounded-xl">
                      {order.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-xs font-medium text-surface-600">
                          <span>{item.quantity}x {item.menuItem?.name}</span>
                          <span className="text-surface-400">@{formatPrice(item.unitPrice)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 items-center pt-3 border-t border-surface-200">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        order.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {order.status}
                      </span>
                      
                      {order.status === 'DELIVERED' && !order.ratings?.some((r: any) => !r.menuItemId) && (
                        <button 
                          onClick={() => setRatingOrder(order)}
                          className="ml-auto flex items-center gap-2 text-xs font-bold text-brand-500 bg-brand-500/5 px-4 py-2 rounded-xl border border-brand-500/10"
                        >
                          <Star size={14} className="fill-brand-500" />
                          {t.rate}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <div className="mt-12 px-6 text-center pb-12">
        <p className="text-[10px] text-surface-300 font-bold uppercase tracking-[0.2em] opacity-50">
          Smart Menu Concierge v1.5.0
        </p>
      </div>

      {/* Rating Modal */}
      {ratingOrder && (
        <RatingModal 
          isOpen={!!ratingOrder}
          onClose={() => setRatingOrder(null)}
          orderId={ratingOrder.id}
          customerRef={customerRef!}
          onSuccess={() => refetchHistory()}
        />
      )}
    </div>
  );
}
