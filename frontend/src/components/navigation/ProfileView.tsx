'use client';

import { useState} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Globe, CreditCard, Bell, ChevronRight, 
   Shield,  History, Star,
    Receipt, CheckCircle2,
    Edit3, } from 'lucide-react';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { NotificationManager } from '@/components/notifications/NotificationManager';
import { Settings, Moon, Sun, User as UserIcon, LogOut, ChevronLeft, X } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { ordersApi } from '@/lib/api';
import { callWaiter } from '@/lib/socket';
import { RatingModal } from '@/components/feedback/RatingModal';
import { useQuery } from '@tanstack/react-query';
import { LANGUAGES, UI_STRINGS } from '@/lib/i18n';
import { formatPrice } from '@/lib/formatters';

const CURRENCIES = [
  { code: 'ETB', label: 'Ethiopian Birr', symbol: 'Br' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
];

type ProfileSubView = 'main' | 'history' | 'currency';
type ExpandedSection = 'none' | 'language' | 'settings';

export function ProfileView() {
  const { customerProfile, updateProfile, language, setLanguage, isDarkMode, toggleDarkMode, currency, setCurrency } = useFavoritesStore();
  const { tableId, customerRef } = useCartStore();
  
  const t = UI_STRINGS[language];
  const [subView, setSubView] = useState<ProfileSubView>('main');
  const [expanded, setExpanded] = useState<ExpandedSection>('none');
  const [waiterStatus, setWaiterStatus] = useState<'idle' | 'calling' | 'success'>('idle');
  const [tempName, setTempName] = useState(customerProfile.name || '');
  const [tempPhone, setTempPhone] = useState(customerProfile.phone || '');
  
  const [ratingOrder, setRatingOrder] = useState<any>(null);

  const selectedLang = LANGUAGES.find((l) => l.code === language)!;
  const selectedCurr = CURRENCIES.find((c) => c.code === currency)!;

  // Fetch Order History
  const { data: history = [], refetch: refetchHistory } = useQuery({
    queryKey: ['order-history', customerRef],
    queryFn: () => ordersApi.getOrderHistory(customerRef!),
    enabled: !!customerRef,
  });

  const toggleSection = (section: ExpandedSection) => {
    setExpanded((prev) => (prev === section ? 'none' : section));
  };

  const handleCallWaiter = (type: 'WAITER' | 'BILL' | 'HELP') => {
    if (!tableId) return;
    setWaiterStatus('calling');
    
    // We try to get table number from local storage context if available
    const ctx = JSON.parse(localStorage.getItem('_table_ctx') || '{}');
    const tableNumber = ctx.tableNumber || 0;

    callWaiter({
      tableId,
      tableNumber,
      requestType: type,
    });

    setTimeout(() => {
      setWaiterStatus('success');
      setTimeout(() => setWaiterStatus('idle'), 3000);
    }, 1000);
  };

  const handleSaveProfile = () => {
    updateProfile({ name: tempName, phone: tempPhone });
    setExpanded('none');
  };

  // ── Helper Component: Sub-Page Header ──
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
    <div className="profile-view pb-32 bg-surface-50 min-h-full relative overflow-x-hidden">
      <AnimatePresence mode="wait">
        {subView === 'main' ? (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Settings Icon (Top Right) */}
            <div className="absolute top-6 right-6 z-10">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleSection('settings')}
                className="w-10 h-10 rounded-full bg-surface-100 border border-surface-200 flex items-center justify-center text-surface-600 shadow-sm"
              >
                <Settings size={20} />
              </motion.button>
            </div>

            {/* Profile Header */}
            <div className="profile-view__header pt-8 pb-4 px-6 flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative group"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-500 to-orange-400 p-0.5 shadow-xl animate-float">
                  <div className="w-full h-full rounded-full bg-surface-50 flex items-center justify-center text-brand-500 overflow-hidden">
                    <User size={40} className="text-brand-500" />
                  </div>
                </div>
              </motion.div>

              <div className="text-center mt-3">
                <h3 className="text-lg font-display font-bold text-surface-900 tracking-tight">
                  {customerProfile.name || 'Guest User'}
                </h3>
                <p className="text-surface-500 text-[10px] font-medium mt-0.5 uppercase tracking-widest opacity-70">
                  {customerProfile.phone || 'Welcome Back'}
                </p>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="px-4 space-y-4 mt-2">
              {/* Quick Service Actions */}
              <div className="bg-surface-100/50 backdrop-blur-sm rounded-[1.5rem] p-4 border border-surface-200/50">
                <h4 className="text-[9px] font-bold text-surface-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Bell size={10} /> {t.callWaiter}
                </h4>
                <div className="flex flex-col gap-2">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCallWaiter('WAITER')}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                      waiterStatus === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                        : 'bg-surface-200/50 border-surface-200 text-surface-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center shadow-inner">
                      <UserIcon size={18} />
                    </div>
                    <span className="text-[12px] font-bold tracking-wide">{t.callWaiter}</span>
                    <ChevronRight size={14} className="ml-auto opacity-30" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCallWaiter('BILL')}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                      waiterStatus === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                        : 'bg-surface-200/50 border-surface-200 text-surface-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center shadow-inner">
                      <Receipt size={18} />
                    </div>
                    <span className="text-[12px] font-bold tracking-wide">{t.requestBill}</span>
                    <ChevronRight size={14} className="ml-auto opacity-30" />
                  </motion.button>
                </div>
                {waiterStatus === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 text-emerald-500 text-[10px] font-bold mt-3 bg-emerald-500/5 py-1.5 rounded-lg"
                  >
                    <CheckCircle2 size={12} /> Successfully notified staff!
                  </motion.div>
                )}
              </div>

              {/* Navigation Rows (Professional Style) */}
              <div className="bg-surface-100/50 backdrop-blur-sm rounded-[1.5rem] border border-surface-200/50 overflow-hidden divide-y divide-surface-200/50">
                {/* Order History Redirect */}
                <button 
                  onClick={() => setSubView('history')}
                  className="w-full flex items-center justify-between p-4 active:bg-surface-200/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <History size={20} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-[13px] font-bold text-surface-900 tracking-tight">{t.history}</h4>
                      <p className="text-[9px] text-surface-400 font-medium uppercase tracking-wider">{history.length} Previous Orders</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-surface-300">
                    <span className="text-[10px] font-bold text-brand-500/50">VIEW ALL</span>
                    <ChevronRight size={16} />
                  </div>
                </button>

                {/* Currency Redirect */}
                <button 
                  onClick={() => setSubView('currency')}
                  className="w-full flex items-center justify-between p-4 active:bg-surface-200/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <CreditCard size={20} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-[13px] font-bold text-surface-900 tracking-tight">Currency</h4>
                      <p className="text-[9px] text-surface-400 font-medium uppercase tracking-wider">Default: {currency}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">{currency}</span>
                    <ChevronRight size={16} className="text-surface-300" />
                  </div>
                </button>
              </div>

              {/* Notifications */}
              <NotificationManager />
            </div>

          </motion.div>
        ) : subView === 'history' ? (
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
                  <h4 className="text-lg font-bold text-surface-900">No orders yet</h4>
                  <p className="text-sm text-surface-400 mt-2">Your previous orders will appear here</p>
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
                          <span className="text-[10px] font-bold text-surface-400 tracking-wider">ORDER #{order.displayNumber}</span>
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
                          Rate Experience
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="currency"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="min-h-full pb-32"
          >
            <SubPageHeader title={t.currency || "Select Currency"} onBack={() => setSubView('main')} />
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-surface-500 font-medium mb-4">
                Choose your preferred currency for price display across the app.
              </p>
              
              {CURRENCIES.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => { setCurrency(curr.code as 'ETB' | 'USD'); setSubView('main'); }}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${
                    currency === curr.code 
                      ? 'bg-emerald-500/5 border-emerald-500/20 shadow-sm' 
                      : 'bg-surface-100 border-surface-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black ${
                      currency === curr.code ? 'bg-emerald-500 text-white shadow-lg' : 'bg-surface-200 text-surface-400'
                    }`}>
                      {curr.symbol}
                    </div>
                    <div className="text-left">
                      <h4 className={`font-bold ${currency === curr.code ? 'text-surface-900' : 'text-surface-600'}`}>
                        {curr.label}
                      </h4>
                      <p className="text-xs text-surface-400">{curr.code}</p>
                    </div>
                  </div>
                  {currency === curr.code && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </button>
              ))}
              
              <div className="bg-surface-200/50 p-4 rounded-xl mt-8">
                <p className="text-[10px] text-surface-400 leading-relaxed italic">
                  Note: Exchange rates are updated periodically. Prices may vary slightly based on current restaurant policies.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="mt-12 px-6 text-center pb-12">
        <div className="flex items-center justify-center gap-2 text-surface-200 mb-2">
          <Shield size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Secure & Privacy-First</span>
        </div>
        <p className="text-[10px] text-surface-400 font-medium opacity-60">
          Your data is stored locally on this device. Powered by ArifSmart v1.2.0
        </p>
      </div>

      {/* Settings Panel (Overlay) */}
      <AnimatePresence>
        {expanded === 'settings' && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded('none')}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 bg-surface-50 rounded-t-[2rem] z-[70] shadow-2xl p-6 safe-bottom max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-bold text-surface-900 tracking-tight">App Settings</h3>
                <button onClick={() => setExpanded('none')} className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center">
                  <X size={16} className="text-surface-400" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Edit Profile */}
                <div className="space-y-3">
                  <label className="text-[9px] font-bold text-surface-400 uppercase tracking-widest">Your Identity</label>
                  <div className="space-y-2">
                    <input 
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full bg-surface-100 border border-surface-200 rounded-xl px-4 py-3 text-[13px] font-medium text-surface-900 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                    <input 
                      value={tempPhone}
                      onChange={(e) => setTempPhone(e.target.value)}
                      placeholder="Phone Number"
                      className="w-full bg-surface-100 border border-surface-200 rounded-xl px-4 py-3 text-[13px] font-medium text-surface-900 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                    <button 
                      onClick={handleSaveProfile}
                      className="w-full py-3 text-[13px] font-bold text-white bg-brand-500 rounded-xl shadow-lg shadow-brand-500/20 active:scale-95 transition-transform"
                    >
                      Update Profile
                    </button>
                  </div>
                </div>

                <div className="h-px bg-surface-200" />

                {/* Language Selection */}
                <div className="space-y-3">
                  <label className="text-[9px] font-bold text-surface-400 uppercase tracking-widest">Language</label>
                  <div className="grid grid-cols-3 gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                          language === lang.code 
                            ? 'bg-brand-500/10 border-brand-500/20 text-brand-600' 
                            : 'bg-surface-100 border-surface-200 text-surface-600'
                        }`}
                      >
                        <span className="text-lg mb-1">{lang.flag}</span>
                        <span className="text-[10px] font-bold">{lang.label}</span>
                        {language === lang.code && (
                          <div className="mt-1 w-1 h-1 rounded-full bg-brand-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-surface-200" />

                {/* Currency & Dark Mode Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Dark Mode */}
                  <div className="flex items-center justify-between p-3 bg-surface-100 rounded-xl border border-surface-200">
                    <div className="flex items-center gap-2">
                      <div className="text-indigo-500 opacity-80">
                        {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                      </div>
                      <span className="text-[11px] font-bold text-surface-900">Dark</span>
                    </div>
                    <button 
                      onClick={toggleDarkMode}
                      className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${isDarkMode ? 'bg-brand-500' : 'bg-surface-300'}`}
                    >
                      <motion.div 
                        animate={{ x: isDarkMode ? 20 : 0 }}
                        className="w-4 h-4 rounded-full bg-white shadow-sm"
                      />
                    </button>
                  </div>

                  {/* Currency (Simple Link to sub-page) */}
                  <button 
                    onClick={() => { setSubView('currency'); setExpanded('none'); }}
                    className="flex items-center justify-between p-3 bg-surface-100 rounded-xl border border-surface-200 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-emerald-500 opacity-80">
                        <CreditCard size={18} />
                      </div>
                      <span className="text-[11px] font-bold text-surface-900">Currency</span>
                    </div>
                    <span className="text-[9px] font-black bg-surface-200 px-2 py-1 rounded-md text-surface-600">{currency}</span>
                  </button>
                </div>

                {/* Footer Actions */}
                <div className="pt-2">
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to end your guest session? This will clear your cart and history on this device.')) {
                        localStorage.removeItem('arifsmart_customerRef');
                        localStorage.removeItem('arifsmart_cart');
                        window.location.reload();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 text-red-500/60 hover:text-red-500 transition-colors"
                  >
                     <LogOut size={16} />
                     <span className="text-[11px] font-bold">End Guest Session</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
