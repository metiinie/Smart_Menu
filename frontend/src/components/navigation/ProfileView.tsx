'use client';

import { useState} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Globe, CreditCard, Bell, ChevronRight, 
   Shield,  History, Star,
    Receipt, CheckCircle2,
    Edit3, } from 'lucide-react';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useCartStore } from '@/stores/cartStore';
import { ordersApi } from '@/lib/api';
import { callWaiter } from '@/lib/socket';
import { RatingModal } from '@/components/feedback/RatingModal';
import { useQuery } from '@tanstack/react-query';
import { LANGUAGES, UI_STRINGS } from '@/lib/i18n';
import { NotificationManager } from '@/components/notifications/NotificationManager';

const CURRENCIES = [
  { code: 'ETB', label: 'Ethiopian Birr', symbol: 'Br' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
];

type ExpandedSection = 'none' | 'language' | 'currency' | 'history';

export function ProfileView() {
  const { customerProfile, updateProfile, language, setLanguage } = useFavoritesStore();
  const { tableId, customerRef } = useCartStore();
  
  const t = UI_STRINGS[language];
  const [currency, setCurrency] = useState('ETB');
  const [expanded, setExpanded] = useState<ExpandedSection>('none');
  const [waiterStatus, setWaiterStatus] = useState<'idle' | 'calling' | 'success'>('idle');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
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
    setIsEditingProfile(false);
  };

  return (
    <div className="profile-view pb-32">
      {/* Profile Header */}
      <div className="profile-view__header p-6 flex flex-col items-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 border-4 border-white shadow-xl mb-4">
            <User size={48} />
          </div>
          <button 
            onClick={() => {
              setIsEditingProfile(true);
              setTempName(customerProfile.name || '');
              setTempPhone(customerProfile.phone || '');
            }}
            className="absolute bottom-4 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-400"
          >
            <Edit3 size={14} />
          </button>
        </div>

        {isEditingProfile ? (
          <div className="w-full space-y-3 mt-2">
            <input 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Your Name"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-brand-500"
              autoFocus
            />
            <input 
              value={tempPhone}
              onChange={(e) => setTempPhone(e.target.value)}
              placeholder="Phone Number"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-brand-500"
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-400 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProfile}
                className="flex-1 py-2 text-xs font-bold text-white bg-brand-500 rounded-xl shadow-lg shadow-brand-500/20"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-900">
              {customerProfile.name || 'Guest User'}
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              {customerProfile.phone || t.welcome}
            </p>
          </div>
        )}
      </div>

      {/* Main Actions */}
      <div className="px-4 space-y-4">
        {/* Service Section */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Bell size={12} /> {t.callWaiter}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCallWaiter('WAITER')}
              className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all ${
                waiterStatus === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-600'
              }`}
            >
              <User size={20} className="mb-2" />
              <span className="text-xs font-bold">{t.callWaiter}</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCallWaiter('BILL')}
              className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all ${
                waiterStatus === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-600'
              }`}
            >
              <Receipt size={20} className="mb-2" />
              <span className="text-xs font-bold">{t.requestBill}</span>
            </motion.button>
          </div>
          {waiterStatus === 'success' && (
            <motion.p 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-emerald-500 text-[10px] font-bold mt-3"
            >
              Successfully notified staff! They are on their way.
            </motion.p>
          )}
        </div>

        {/* Notifications */}
        <NotificationManager />

        {/* Order History */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <button 
            className="w-full flex items-center justify-between p-5"
            onClick={() => toggleSection('history')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <History size={20} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-slate-800">{t.history}</h4>
                <p className="text-[10px] text-slate-400">{history.length} {t.history.toLowerCase()}</p>
              </div>
            </div>
            <ChevronRight 
              size={18} 
              className={`text-slate-300 transition-transform ${expanded === 'history' ? 'rotate-90' : ''}`} 
            />
          </button>
          
          <AnimatePresence>
            {expanded === 'history' && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden border-t border-slate-50"
              >
                <div className="p-4 space-y-3">
                  {history.length === 0 ? (
                    <p className="text-center py-6 text-slate-400 text-xs">No order history found</p>
                  ) : (
                    history.map((order: any) => (
                      <div key={order.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400">Order #{order.displayNumber}</span>
                            <p className="text-xs font-bold text-slate-700">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className="text-xs font-black text-brand-600">ETB {order.totalPrice}</span>
                        </div>
                        <div className="flex gap-2 items-center mt-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            {order.status}
                          </span>
                          
                          {order.status === 'DELIVERED' && !order.ratings?.some((r: any) => !r.menuItemId) && (
                            <button 
                              onClick={() => setRatingOrder(order)}
                              className="ml-auto flex items-center gap-1 text-[10px] font-bold text-brand-500 bg-brand-50 px-2 py-1 rounded-lg"
                            >
                              <Star size={10} className="fill-brand-500" />
                              Rate Order
                            </button>
                          )}
                          
                          {order.ratings?.some((r: any) => !r.menuItemId) && (
                            <div className="ml-auto flex items-center gap-0.5 text-amber-400">
                              {[...Array(order.ratings.find((r: any) => !r.menuItemId).rating)].map((_, i) => (
                                <Star key={i} size={10} className="fill-amber-400" />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Other Settings */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Language */}
          <button 
            className="w-full flex items-center justify-between p-5 border-b border-slate-50"
            onClick={() => toggleSection('language')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Globe size={20} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-slate-800">{t.settings}</h4>
                <p className="text-[10px] text-slate-400">{selectedLang.flag} {selectedLang.label}</p>
              </div>
            </div>
            <ChevronRight 
              size={18} 
              className={`text-slate-300 transition-transform ${expanded === 'language' ? 'rotate-90' : ''}`} 
            />
          </button>
          <AnimatePresence>
            {expanded === 'language' && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-slate-50">
                {LANGUAGES.map((lang) => (
                  <button 
                    key={lang.code}
                    className="w-full p-4 flex items-center justify-between border-b border-white/50"
                    onClick={() => { setLanguage(lang.code); setExpanded('none'); }}
                  >
                    <span className="text-sm font-medium text-slate-700">{lang.flag} {lang.label}</span>
                    {language === lang.code && <CheckCircle2 size={16} className="text-brand-500" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Currency */}
          <button 
            className="w-full flex items-center justify-between p-5"
            onClick={() => toggleSection('currency')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CreditCard size={20} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-slate-800">Currency</h4>
                <p className="text-[10px] text-slate-400">{selectedCurr.symbol} {selectedCurr.label}</p>
              </div>
            </div>
            <ChevronRight 
              size={18} 
              className={`text-slate-300 transition-transform ${expanded === 'currency' ? 'rotate-90' : ''}`} 
            />
          </button>
          <AnimatePresence>
            {expanded === 'currency' && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-slate-50">
                {CURRENCIES.map((curr) => (
                  <button 
                    key={curr.code}
                    className="w-full p-4 flex items-center justify-between border-b border-white/50"
                    onClick={() => { setCurrency(curr.code); setExpanded('none'); }}
                  >
                    <span className="text-sm font-medium text-slate-700">{curr.symbol} {curr.label}</span>
                    {currency === curr.code && <CheckCircle2 size={16} className="text-brand-500" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 px-6 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-300 mb-2">
          <Shield size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Secure & Privacy-First</span>
        </div>
        <p className="text-[10px] text-slate-400">
          Your data is stored locally on this device. Powered by ArifSmart v1.0.0
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
