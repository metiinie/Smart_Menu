'use client';

import { useState, useEffect, useCallback, use, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Clock, ChevronRight, Leaf, AlertCircle, Loader2, CheckCircle2, Bell, Receipt, User } from 'lucide-react';
import { menuApi, contextApi, ordersApi } from '@/lib/api';
import { useCartStore } from '@/stores/cartStore';
import { CategoryTabs } from '@/components/menu/CategoryTabs';
import { useLocalOrderStore } from '@/stores/localOrderStore';
import { LocalOrderStatus } from '@/shared/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { FoodCarouselItem } from '@/components/menu/FoodCarouselItem';
import { MenuItemDetailPanel } from '@/components/menu/MenuItemDetailPanel';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { SkeletonCategoryTab } from '@/components/ui/SkeletonCard';
import { getSocket, callWaiter } from '@/lib/socket';
import { WelcomeSplash } from '@/components/ui/WelcomeSplash';
import { Tooltip } from '@/components/ui/Tooltip';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BottomTabBar, type TabId } from '@/components/navigation/BottomTabBar';
import { WebSidebarDrawer } from '@/components/navigation/WebSidebarDrawer';
import { FavoritesView } from '@/components/navigation/FavoritesView';
import { CartView } from '@/components/navigation/CartView';
import { ServiceView } from '@/components/navigation/ServiceView';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { getLocalized, UI_STRINGS } from '@/lib/i18n';
import { useTranslation } from '@/hooks/useTranslation';
import type { MenuItem, Category, MenuCategoryDto, Order } from '@/shared/types';

interface PageProps {
  params: Promise<{ branchId: string; tableId: string }>;
}

export default function MenuPage({ params }: PageProps) {
  const palette = {
    appOrange: 'var(--customer-orange)',
    appWhite: 'var(--customer-bg)',
    patternStroke: 'var(--customer-stroke)',
    darkButton: 'var(--customer-dark-orange)',
  };
  const resolvedParams = use(params);
  const router = useRouter();
  const { t, language } = useTranslation();

  const [branchId, setBranchId] = useState('');
  const [tableId, setTableId] = useState('');
  const [fastingOnly, setFastingOnly] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [introReady, setIntroReady] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Navigation state
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [localCustomerRef, setLocalCustomerRef] = useState<string | null>(null);
  const [callMode, setCallMode] = useState<'WAITER' | 'BILL'>('WAITER');
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const [waiterStatus, setWaiterStatus] = useState<'idle' | 'calling' | 'success'>('idle');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let ref = localStorage.getItem('arifsmart_customerRef');
      if (!ref) {
        ref = crypto.randomUUID();
        localStorage.setItem('arifsmart_customerRef', ref);
      }
      setLocalCustomerRef(ref);
    }
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem('arifsmart_splash_shown')) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    setIntroReady(false);
    setTimeout(() => setIntroReady(true), 220);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('arifsmart_splash_shown', 'true');
    }
  }, []);

  const setContext = useCartStore((state) => state.setContext);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const items = useCartStore((state) => state.items);
  const cartBranchId = useCartStore((state) => state.branchId);
  const cartTableId = useCartStore((state) => state.tableId);
  const cartSessionId = useCartStore((state) => state.sessionId);
  const cartCustomerRef = useCartStore((state) => state.customerRef);

  const totalItemsCount = useMemo(() => 
    items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  useEffect(() => {
    setBranchId(resolvedParams.branchId);
    setTableId(resolvedParams.tableId);
  }, [resolvedParams]);

  const { data: contextData } = useQuery({
    queryKey: ['table-context', branchId, tableId],
    queryFn: () => contextApi.getTableContext(branchId, tableId),
    enabled: !!branchId && !!tableId,
  });

  useEffect(() => {
    if (contextData) {
      localStorage.setItem('_table_ctx', JSON.stringify(contextData));
      
      let customerRef = localStorage.getItem('arifsmart_customerRef');
      if (!customerRef) {
        customerRef = crypto.randomUUID();
        localStorage.setItem('arifsmart_customerRef', customerRef);
      }

      setContext(
        contextData.branch.restaurantId,
        contextData.branch.id,
        contextData.table.id,
        contextData.activeSession.id,
        customerRef
      );
    }
  }, [contextData, setContext]);

  const { data: menuData, isLoading, isError } = useQuery({
    queryKey: ['menu', branchId, fastingOnly],
    queryFn: () => menuApi.getMenu(branchId, fastingOnly || undefined),
    enabled: !!branchId,
    staleTime: 60_000,
  });

  const groupedMenuData: MenuCategoryDto[] = menuData ?? [];
  const sessionId: string = contextData?.activeSession?.id ?? '';
  const customerRef = localCustomerRef;

  const groupedMenu = groupedMenuData;
  const categories: Category[] = groupedMenu.map((g) => g.category);

  const { data: activeOrders = [], refetch: refetchActive } = useQuery({
    queryKey: ['active-orders', branchId, sessionId, customerRef],
    queryFn: () => ordersApi.getActiveOrders(branchId, sessionId, customerRef!),
    enabled: !!branchId && !!sessionId && !!customerRef,
    refetchInterval: 10_000,
  });

  useEffect(() => {
    const socket = getSocket();
    socket.on('order-updated', refetchActive);
    return () => { socket.off('order-updated', refetchActive); };
  }, [refetchActive]);

  useEffect(() => {
    if (categories.length && !activeCategory) {
      setActiveCategory(categories[0]?.id ?? '');
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (!showSplash) {
      setIntroReady(true);
    }
  }, [showSplash]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeCategory]);

  const getQuantity = useCallback(
    (menuItemId: string) =>
      items.find((i) => i.menuItemId === menuItemId)?.quantity ?? 0,
    [items],
  );

  const activeItems =
    groupedMenu.find((g) => g.category.id === activeCategory)?.items ?? [];

  const filteredItems = activeItems;

  useEffect(() => {
    if (filteredItems.length === 0) {
      setCurrentIndex(0);
      return;
    }
    if (currentIndex >= filteredItems.length) {
      setCurrentIndex(0);
    }
  }, [filteredItems.length, currentIndex]);

  const count = filteredItems.length;
  const currentItem = filteredItems[currentIndex] ?? filteredItems[0];
  const prevItem = count > 1 ? filteredItems[(currentIndex - 1 + count) % count] : null;
  const nextItem = count > 1 ? filteredItems[(currentIndex + 1) % count] : null;

  const handleQuickOrder = async () => {
    const item = filteredItems[currentIndex];
    if (!item) return;

    const resolvedRestaurantId = contextData?.branch?.restaurantId || '';
    const resolvedBranchId  = cartBranchId  || contextData?.branch?.id       || branchId;
    const resolvedTableId   = contextData?.table?.id        || cartTableId   || tableId;
    const resolvedSessionId = cartSessionId || contextData?.activeSession?.id || '';
    let resolvedCustomerRef = cartCustomerRef || (typeof window !== 'undefined' ? localStorage.getItem('arifsmart_customerRef') : null);
    if (!resolvedCustomerRef) {
      resolvedCustomerRef = crypto.randomUUID();
      if (typeof window !== 'undefined') localStorage.setItem('arifsmart_customerRef', resolvedCustomerRef);
    }

    if (!resolvedTableId || !resolvedSessionId || !resolvedBranchId) {
      addItem({ menuItemId: item.id, name: item.name, nameTranslations: (item as any).nameTranslations, priceAtAdd: item.price, imageUrl: item.imageUrl } as any);
      setOrderError(UI_STRINGS[language].addedToCart);
      setTimeout(() => setOrderError(''), 3000);
      return;
    }

    setOrderLoading(true);
    setOrderError('');
    setOrderSuccess(false);

    const { syncManager } = await import('@/lib/syncManager');
    const localId = crypto.randomUUID();
    const localOrder = {
      id: localId,
      restaurantId: resolvedRestaurantId,
      branchId: resolvedBranchId,
      tableId: resolvedTableId,
      sessionId: resolvedSessionId,
      customerRef: resolvedCustomerRef,
      items: [{ menuItemId: item.id, name: item.name, nameTranslations: (item as any).nameTranslations, priceAtAdd: item.price, imageUrl: item.imageUrl, quantity: 1, cartItemId: localId }],
      totalPrice: item.price,
      status: LocalOrderStatus.PENDING,
      timestamp: Date.now(),
    };

    try {
      const result = await syncManager.placeOrder(localOrder as any);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 3000);
      if (result && (result as any).type === 'QUEUED') {
        router.push(`/order/local/${localId}`);
      } else {
        router.push(`/order/${(result as any).id}`);
      }
    } catch (e: unknown) {
      setOrderError(UI_STRINGS[language].orderFailed);
      setTimeout(() => setOrderError(''), 4000);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleCallWaiterAction = () => {
    if (!tableId) return;
    setWaiterStatus('calling');
    
    const tableNumber = contextData?.table?.tableNumber || 0;
    const resolvedBranchId = contextData?.branch?.id || branchId;

    callWaiter({
      tableId,
      tableNumber,
      branchId: resolvedBranchId,
      requestType: callMode === 'WAITER' ? 'WAITER' : 'BILL',
    });

    setTimeout(() => {
      setWaiterStatus('success');
      setTimeout(() => setWaiterStatus('idle'), 3000);
    }, 1000);
  };

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden font-sans" style={{ backgroundColor: palette.appWhite }}>
      {showSplash && <WelcomeSplash onComplete={handleSplashComplete} />}

      <div className="relative z-10 w-full min-h-dvh">
        <motion.div
          className="absolute top-0 left-0 right-0 z-10 overflow-hidden"
          initial={{ y: -650 }}
          animate={{ y: showSplash ? -650 : 0 }}
          transition={{ type: 'spring', stiffness: 86, damping: 19, mass: 1.1, delay: 0.04 }}
          style={{ height: '36%', minHeight: '240px', backgroundColor: palette.appOrange }}
        >
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <pattern id="handDrawnPattern" x="0" y="0" width="180" height="180" patternUnits="userSpaceOnUse">
                <path d="M20 30 L60 30 L40 70 Z" fill="none" stroke={palette.patternStroke} strokeWidth="1" strokeLinecap="round" />
                <circle cx="35" cy="40" r="2" fill={palette.patternStroke} />
                <path d="M90 40 Q120 40 120 55 H90 Z" fill="none" stroke={palette.patternStroke} strokeWidth="1" />
                <path d="M40 100 H70 V140 H40 Z" fill="none" stroke={palette.patternStroke} strokeWidth="1" />
                <path d="M110 110 L130 110 L135 145 L105 145 Z" fill="none" stroke={palette.patternStroke} strokeWidth="1" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#handDrawnPattern)"/>
            </svg>
          </div>

          <div className="relative z-10 h-full max-w-md mx-auto w-full flex flex-col">
            <header className="px-4 sm:px-5 pt-2 sm:pt-3 pb-0 flex justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFastingOnly(!fastingOnly)}
                  className={`px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 shadow-sm ${
                    fastingOnly ? 'bg-black/20 text-white' : 'bg-black/10 text-white'
                  }`}
                >
                  <Leaf size={12} className="text-white" />
                  <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">{fastingOnly ? UI_STRINGS[language].fasting : UI_STRINGS[language].all}</span>
                </button>
              </div>
              
              <div className="absolute top-1.5 right-4 flex items-center gap-1">
                <LanguageSwitcher />
                <ThemeToggle />
                <Link 
                  href="/login"
                  className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 flex items-center justify-center border border-white/20 shadow-lg active:scale-95 transition-all backdrop-blur-md"
                  title={t('profile')}
                >
                  <User size={14} className="text-white/90" />
                </Link>
              </div>
            </header>

            <div className="flex-1 flex items-start justify-center px-3 sm:px-4 pt-1 sm:pt-2">
              <div className="flex flex-col items-center">
                  <h1 className="text-foreground text-[1.85rem] sm:text-[2.45rem] font-semibold uppercase tracking-[-0.01em] leading-[0.95] font-serif">
                    {UI_STRINGS[language].orderSmarter}
                  </h1>
                  <h2 className="text-foreground text-[2.2rem] sm:text-[3.05rem] font-semibold uppercase tracking-[-0.02em] leading-[0.9] font-serif inline-flex items-end gap-1.5 sm:gap-2">
                    <span>{UI_STRINGS[language].eatBetter}</span>
                  </h2>

                  <motion.div className="mt-5 sm:mt-6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                    <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-full pl-1.5 pr-1.5 py-1.5 shadow-2xl">
                      <button
                        onClick={handleCallWaiterAction}
                        disabled={waiterStatus !== 'idle'}
                        className="flex items-center gap-2.5 pl-0 pr-2 group active:scale-95 transition-all"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg relative ${waiterStatus === 'success' ? 'bg-emerald-500' : 'bg-[var(--customer-dark-orange)]'}`}>
                          {waiterStatus === 'calling' ? <Loader2 size={14} className="animate-spin" /> : waiterStatus === 'success' ? <CheckCircle2 size={14} /> : callMode === 'WAITER' ? <Bell size={14} /> : <Receipt size={14} />}
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-white/60 text-[8px] font-black uppercase tracking-wider leading-none mb-1">{UI_STRINGS[language].request}</span>
                          <span className={`text-[10px] font-bold leading-none ${waiterStatus === 'success' ? 'text-emerald-400' : 'text-[var(--customer-dark-orange)]'}`}>
                            {waiterStatus === 'success' ? UI_STRINGS[language].sent : callMode === 'WAITER' ? UI_STRINGS[language].callWaiter : UI_STRINGS[language].requestBill}
                          </span>
                        </div>
                      </button>
                      <div className="w-[1px] h-6 bg-white/10 mx-0.5" />
                      <button onClick={() => setCallMode(prev => prev === 'WAITER' ? 'BILL' : 'WAITER')} className="w-8 h-8 flex items-center justify-center text-white/30">
                        <ChevronRight size={16} strokeWidth={3} className={`transition-transform duration-500 ${callMode === 'BILL' ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {!showSplash && (
          <motion.div
            className="absolute left-0 right-0 bottom-0 z-20 flex flex-col shadow-2xl" 
            initial={{ y: 120, opacity: 0.8 }}
            animate={introReady ? { y: 0, opacity: 1 } : { y: 120, opacity: 0.8 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            style={{ backgroundColor: palette.appWhite, top: 'calc(36% - 62px)', borderTopLeftRadius: '100% 118px', borderTopRightRadius: '100% 118px' }}
          >
            <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
              <motion.div className="mt-2" initial={{ y: 46, opacity: 0 }} animate={introReady ? { y: 0, opacity: 1 } : { y: 46, opacity: 0 }} transition={{ delay: 0.18 }}>
                {isLoading ? <SkeletonCategoryTab /> : <CategoryTabs categories={categories} activeId={activeCategory} onChange={(id) => { setActiveCategory(id); setCurrentIndex(0); }} />}
              </motion.div>

              <div className="flex-1 flex flex-col justify-start min-h-0 pb-2">
                <motion.div className="w-full pt-1 sm:pt-1.5" initial={{ y: 24, opacity: 0 }} animate={introReady ? { y: 0, opacity: 1 } : { y: 24, opacity: 0 }} transition={{ delay: 0.22 }}>
                  <motion.div
                    ref={carouselRef}
                    className="flex w-full max-w-md mx-auto items-end justify-center gap-0 min-h-[232px] sm:min-h-[256px] overflow-hidden"
                    drag="x" dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (count <= 1) return;
                      if (info.offset.x < -48 || info.velocity.x < -420) setCurrentIndex((prev) => (prev + 1) % count);
                      else if (info.offset.x > 48 || info.velocity.x > 420) setCurrentIndex((prev) => (prev - 1 + count) % count);
                    }}
                  >
                    <div className={`min-w-0 shrink-0 flex justify-end items-end overflow-hidden pb-5 sm:pb-7 ${count > 1 ? 'w-[26%] sm:w-[24%]' : 'w-0'}`}>
                      {prevItem && <FoodCarouselItem item={prevItem} quantity={getQuantity(prevItem.id)} variant="side" isFavorite={isFavorite(prevItem.id)} onToggleFavorite={(it) => toggleFavorite({ menuItemId: it.id, name: it.name, price: it.price, imageUrl: it.imageUrl ?? undefined })} onAdd={() => setSelectedItem(prevItem)} onTap={() => setCurrentIndex((currentIndex - 1 + count) % count)} />}
                    </div>
                    <div className={`min-w-0 shrink-0 flex justify-center items-end z-10 pb-0 ${count > 1 ? 'w-[48%] sm:w-[52%]' : 'w-full'}`}>
                      {currentItem && <FoodCarouselItem item={currentItem} quantity={getQuantity(currentItem.id)} variant="center" isFavorite={isFavorite(currentItem.id)} onToggleFavorite={(it) => toggleFavorite({ menuItemId: it.id, name: it.name, price: it.price, imageUrl: it.imageUrl ?? undefined })} onAdd={() => setSelectedItem(currentItem)} onTap={() => setSelectedItem(currentItem)} />}
                    </div>
                    <div className={`min-w-0 shrink-0 flex justify-start items-end overflow-hidden pb-5 sm:pb-7 ${count > 1 ? 'w-[26%] sm:w-[24%]' : 'w-0'}`}>
                      {nextItem && <FoodCarouselItem item={nextItem} quantity={getQuantity(nextItem.id)} variant="side" isFavorite={isFavorite(nextItem.id)} onToggleFavorite={(it) => toggleFavorite({ menuItemId: it.id, name: it.name, price: it.price, imageUrl: it.imageUrl ?? undefined })} onAdd={() => setSelectedItem(nextItem)} onTap={() => setCurrentIndex((currentIndex + 1) % count)} />}
                    </div>
                  </motion.div>
                </motion.div>
              </div>

              {currentItem && (
                <motion.div className="text-center mt-0 mb-1 px-3" initial={{ y: 16, opacity: 0 }} animate={introReady ? { y: 0, opacity: 1 } : { y: 16, opacity: 0 }} transition={{ delay: 0.32 }}>
                  <h3 className="text-slate-900 text-[14px] sm:text-[16px] leading-tight font-black uppercase tracking-tight px-6 sm:px-8">
                    {getLocalized((currentItem as any).nameTranslations, currentItem.name, language)}
                  </h3>
                  <p className="text-[#08AE75] text-[20px] sm:text-[22px] leading-none font-black mt-1">{Math.round(currentItem.price)}<span className="text-[11px] sm:text-[12px] ml-0.5">ETB</span></p>
                </motion.div>
              )}

              <motion.div className="flex justify-center gap-2.5 sm:gap-3 mb-4" initial={{ y: 26, opacity: 0 }} animate={introReady ? { y: 0, opacity: 1 } : { y: 26, opacity: 0 }} transition={{ delay: 0.36 }}>
                {filteredItems.map((_, i) => <motion.div key={i} animate={{ width: currentIndex === i ? 20 : 10, opacity: currentIndex === i ? 1 : 0.35 }} className="h-2.5 rounded-full bg-white border border-white/50 shadow-sm" onClick={() => setCurrentIndex(i)} />)}
              </motion.div>

              <motion.div className="flex justify-center pb-16" initial={{ y: 20, opacity: 0 }} animate={introReady ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }} transition={{ delay: 0.42 }}>
                 <button onClick={handleQuickOrder} disabled={orderLoading} className="h-10 px-8 text-white font-black text-[11px] tracking-[0.25em] uppercase rounded-full shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95" style={{ backgroundColor: palette.darkButton }}>
                  {orderLoading ? <Loader2 size={14} className="animate-spin" /> : orderSuccess ? <><CheckCircle2 size={14} /> {t('success').toUpperCase()}</> : t('order')}
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {activeTab !== 'home' && (
            <motion.div key={activeTab} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="tab-content-area" style={{ backgroundColor: palette.appWhite }}>
              {activeTab === 'favorite' && <FavoritesView groupedMenu={groupedMenu} onSelectItem={(item) => { setSelectedItem(item); setActiveTab('home'); }} />}
              {activeTab === 'cart' && <CartView groupedMenu={groupedMenu} />}
              {activeTab === 'service' && <ServiceView />}
            </motion.div>
          )}
        </AnimatePresence>

        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} groupedMenu={groupedMenu} />
        <MenuItemDetailPanel
          item={selectedItem}
          quantity={selectedItem ? getQuantity(selectedItem.id) : 0}
          onClose={() => setSelectedItem(null)}
          onOpenCart={() => { setCartOpen(true); }}
          onAdd={(note, options) => {
            if (!selectedItem) return;
            const optionsTotal = options ? options.reduce((sum, opt) => sum + opt.optionPrice, 0) : 0;
            addItem({ menuItemId: selectedItem.id, name: selectedItem.name, nameTranslations: (selectedItem as any).nameTranslations, priceAtAdd: selectedItem.price + optionsTotal, imageUrl: selectedItem.imageUrl, note, options } as any);
          }}
          onRemove={() => { if (selectedItem) updateQuantity(selectedItem.id, getQuantity(selectedItem.id) - 1); }}
        />
        <PendingOrders branchId={branchId} tableId={tableId} />
        <div className={`fixed right-6 z-40 transition-all duration-500 ${items.length > 0 ? 'bottom-24' : 'bottom-20'}`}>
          <ActiveOrderBar orders={activeOrders} branchId={branchId} tableId={tableId} />
        </div>
        <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

function ActiveOrderBar({ orders, branchId, tableId }: { orders: Order[]; branchId: string; tableId: string }) {
  const { t, language } = useTranslation();
  const items = useCartStore((state) => state.items);
  const localOrders = useLocalOrderStore((state) => state.orders);
  const pruneOldOrders = useLocalOrderStore((state) => state.pruneOldOrders);
  const hasCartItems = useMemo(() => items.length > 0, [items]);

  useEffect(() => { pruneOldOrders(); }, [pruneOldOrders]);

  const pendingLocals = useMemo(() =>
    Object.values(localOrders)
      .filter((o) => o.branchId === branchId && o.tableId === tableId && [LocalOrderStatus.PENDING, LocalOrderStatus.SYNCING, LocalOrderStatus.FAILED].includes(o.status))
      .sort((a, b) => b.timestamp - a.timestamp),
    [localOrders, branchId, tableId]
  );

  const activeOnes = orders.filter(o => o.status !== 'DELIVERED');
  const latestPending = pendingLocals[0];

  if (!latestPending && activeOnes.length === 0) return null;

  if (latestPending) {
    const pendingLabel = latestPending.status === LocalOrderStatus.FAILED ? t('retryNeeded') : t('stillSyncing');
    return (
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className={`fixed left-0 right-0 z-40 px-4 pt-4 transition-all duration-300 ${hasCartItems ? 'bottom-24' : 'bottom-6'}`}>
        <Link href={`/order/local/${latestPending.id}`} className="block bg-surface-card/95 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-3 shadow-2xl relative">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white">
                {latestPending.status === LocalOrderStatus.FAILED ? <AlertCircle size={18} /> : <Loader2 size={18} className="animate-spin" />}
              </div>
              <div>
                <h4 className="text-foreground text-xs font-bold uppercase tracking-wider mb-0.5">{t('latestOrder')}</h4>
                <p className="text-foreground/40 text-[11px] flex items-center gap-1.5">{pendingLabel} · #{latestPending.id.slice(0, 6).toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-amber-700 font-bold text-xs uppercase">{t('open')} <ChevronRight size={14} /></div>
          </div>
        </Link>
      </motion.div>
    );
  }

  const latest = activeOnes[0];
  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-max">
      <Link href={`/order/${latest.id}`} className="flex items-center gap-2.5 bg-surface-card/95 backdrop-blur-2xl border border-surface-200 rounded-full pl-1.5 pr-3.5 py-1.5 shadow-2xl active:scale-95 transition-all">
        <div className="w-8 h-8 rounded-full bg-[var(--customer-dark-orange)] flex items-center justify-center text-white shadow-lg"><Clock size={14} /></div>
        <div className="flex flex-col">
          <span className="text-white/60 text-[8px] font-black uppercase tracking-wider leading-none mb-0.5">{t('status')}</span>
          <div className="flex items-center gap-1">
            <span className="text-foreground text-[11px] font-black leading-none">#{latest.displayNumber}</span>
            <span className="text-[var(--customer-dark-orange)] text-[10px] font-bold leading-none">{t(latest.status.toLowerCase() as any)}</span>
          </div>
        </div>
        <ChevronRight size={14} strokeWidth={3} className="text-white/30" />
      </Link>
    </motion.div>
  );
}

function PendingOrders({ branchId, tableId }: { branchId: string; tableId: string }) {
  const ordersMap = useLocalOrderStore((state) => state.orders);
  const pruneOldOrders = useLocalOrderStore((state) => state.pruneOldOrders);
  const { t } = useTranslation();

  useEffect(() => { pruneOldOrders(); }, [pruneOldOrders]);
  
  const filteredOrders = useMemo(() => Object.values(ordersMap).filter((o) => o.branchId === branchId && o.tableId === tableId && [LocalOrderStatus.PENDING, LocalOrderStatus.SYNCING, LocalOrderStatus.FAILED].includes(o.status)), [ordersMap, branchId, tableId]);

  if (filteredOrders.length === 0) return null;

  return (
    <div className="px-6 py-2 pb-0 space-y-2 relative z-20">
      {filteredOrders.map((order) => (
        <Link key={order.id} href={`/order/local/${order.id}`} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border animate-in fade-in slide-in-from-top-2 ${order.status === LocalOrderStatus.FAILED ? 'bg-red-500/10 border-red-500/20 text-red-600' : 'bg-orange-500/10 border-orange-500/20 text-orange-600'}`}>
          <div className="flex items-center gap-2">
            {order.status === LocalOrderStatus.FAILED ? <AlertCircle size={14} /> : <Loader2 size={14} className="animate-spin" />}
            <span className="text-[10px] font-bold uppercase">{order.status === LocalOrderStatus.FAILED ? t('orderSyncFailed') : t('syncingOrder')}</span>
          </div>
          <span className="text-[9px] opacity-50 font-mono">#{order.id.slice(0, 6).toUpperCase()}</span>
        </Link>
      ))}
    </div>
  );
}
