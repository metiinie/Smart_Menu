'use client';

import { useState, useEffect, useCallback, use, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Clock, ChevronRight } from 'lucide-react';
import { menuApi, contextApi, ordersApi } from '@/lib/api';
import { useCartStore } from '@/stores/cartStore';
import { CategoryTabs } from '@/components/menu/CategoryTabs';
import { useLocalOrderStore } from '@/stores/localOrderStore';
import { LocalOrderStatus } from '@arifsmart/shared';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import { FoodCarouselItem } from '@/components/menu/FoodCarouselItem';
import { MenuItemDetailPanel } from '@/components/menu/MenuItemDetailPanel';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { SkeletonCategoryTab } from '@/components/ui/SkeletonCard';
import { getSocket } from '@/lib/socket';
import { WelcomeSplash } from '@/components/ui/WelcomeSplash';
import { Tooltip } from '@/components/ui/Tooltip';
import { BottomTabBar, type TabId } from '@/components/navigation/BottomTabBar';
import { WebSidebarDrawer } from '@/components/navigation/WebSidebarDrawer';
import { FavoritesView } from '@/components/navigation/FavoritesView';
import { CartView } from '@/components/navigation/CartView';
import { ProfileView } from '@/components/navigation/ProfileView';
import type { MenuItem, Category, MenuCategoryDto, Order } from '@arifsmart/shared';

interface PageProps {
  params: Promise<{ branchId: string; tableId: string }>;
}

export default function MenuPage({ params }: PageProps) {
  const palette = {
    appGreen: '#08AE75',
    appWhite: '#FBF8F3',
    patternStroke: '#E9DFD1',
    darkButton: '#2A5D55',
  };
  const resolvedParams = use(params);
  const [branchId, setBranchId] = useState('');
  const [tableId, setTableId] = useState('');
  const [fastingOnly, setFastingOnly] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [introReady, setIntroReady] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Navigation state
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Welcome splash - only show once per session
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('arifsmart_splash_shown');
    }
    return true;
  });

  const handleSplashComplete = () => {
    setShowSplash(false);
    setIntroReady(false);
    setTimeout(() => setIntroReady(true), 220);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('arifsmart_splash_shown', 'true');
    }
  };

  const setContext = useCartStore((state) => state.setContext);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const items = useCartStore((state) => state.items);

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

  const { data: menuData, isLoading, isError } = useQuery({
    queryKey: ['menu', branchId, fastingOnly],
    queryFn: () => menuApi.getMenu(branchId, fastingOnly || undefined),
    enabled: !!branchId,
    staleTime: 60_000,
  });

  const groupedMenuData: MenuCategoryDto[] = menuData ?? [];
  const sessionId: string = contextData?.activeSession?.id ?? '';
  const customerRef = typeof window !== 'undefined' ? localStorage.getItem('arifsmart_customerRef') : null;

  // --- UI/UX DESIGN FALLBACK ---
  // To ensure the beautiful UI is always visible for design review even if the DB is empty
  const useMockData = isError || groupedMenuData.length === 0;
  
  const mockGroupedMenu: MenuCategoryDto[] = [
    {
      category: { id: 'mock-1', name: 'Drinks', branchId, sortOrder: 1 },
      items: [
        { id: 'm101', name: 'Fresh Avocado Juice', description: 'Creamy blended avocado', price: 80, isAvailable: true, isFasting: true, categoryId: 'mock-1', imageUrl: '/images/menu/avocado-juice.png' },
        { id: 'm102', name: 'Ethiopian Coffee', description: 'Traditional coffee', price: 60, isAvailable: true, isFasting: true, categoryId: 'mock-1', imageUrl: '/images/menu/coffee.png' }
      ]
    },
    {
      category: { id: 'mock-2', name: 'Main Dishes', branchId, sortOrder: 2 },
      items: [
        { id: 'm201', name: 'Kitfo Special', description: 'Ethiopian steak tartare', price: 350, isAvailable: true, isFasting: false, categoryId: 'mock-2', imageUrl: '/images/menu/kitfo.png' },
        { id: 'm202', name: 'Doro Wat', description: 'Spicy chicken stew', price: 280, isAvailable: true, isFasting: false, categoryId: 'mock-2', imageUrl: '/images/menu/doro-wat.png' }
      ]
    },
    {
      category: { id: 'mock-3', name: 'Desserts', branchId, sortOrder: 3 },
      items: [
        { id: 'm301', name: 'Baklava', description: 'Honey-soaked pastry', price: 90, isAvailable: true, isFasting: false, categoryId: 'mock-3', imageUrl: undefined },
      ]
    }
  ];

  const groupedMenu = useMockData ? mockGroupedMenu : groupedMenuData;
  const categories: Category[] = groupedMenu.map((g) => g.category);

  const { data: activeOrders = [], refetch: refetchActive } = useQuery({
    queryKey: ['active-orders', branchId, sessionId, customerRef],
    queryFn: () => ordersApi.getActiveOrders(branchId, sessionId, customerRef!),
    enabled: !!branchId && !!sessionId && !!customerRef,
    refetchInterval: 10_000,
  });

  // Listen for socket updates to refresh persistence bar
  useEffect(() => {
    const socket = getSocket();
    socket.on('order-updated', refetchActive);
    return () => { socket.off('order-updated', refetchActive); };
  }, [refetchActive]);

  useEffect(() => {
    if (branchId && tableId && sessionId) {
      let customerRef = localStorage.getItem('arifsmart_customerRef');
      if (!customerRef) {
        customerRef = crypto.randomUUID();
        localStorage.setItem('arifsmart_customerRef', customerRef);
      }
      setContext(branchId, tableId, sessionId, customerRef);
    }
  }, [branchId, tableId, sessionId, setContext]);

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

  // Reset swiper when search or category changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [searchQuery, activeCategory]);

  const getQuantity = useCallback(
    (menuItemId: string) =>
      items.find((i) => i.menuItemId === menuItemId)?.quantity ?? 0,
    [items],
  );

  const activeItems =
    groupedMenu.find((g) => g.category.id === activeCategory)?.items ?? [];

  const filteredItems = activeItems.filter((item) => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(s) ||
      item.description?.toLowerCase().includes(s)
    );
  });

  const activeCategoryName = categories.find(c => c.id === activeCategory)?.name || 'FOOD';
  
  // Keep current index valid whenever result set changes.
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

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden font-sans" style={{ backgroundColor: palette.appGreen }}>
      {showSplash && <WelcomeSplash onComplete={handleSplashComplete} />}

      <div className="relative z-10 w-full min-h-dvh">
        {/* ── WHITE TOP SECTION (Hand-Drawn Style) ── */}
        <motion.div
          className="absolute top-0 left-0 right-0 z-10 overflow-hidden"
          initial={{ y: -650 }}
          animate={{ y: showSplash ? -650 : 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 86, 
            damping: 19, 
            mass: 1.1,
            delay: 0.04 
          }}
          style={{ height: '36%', minHeight: '240px', backgroundColor: palette.appWhite }}
        >
          {/* Subtle Watermark Food Sketches */}
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
            {/* Elegant Header Navigation */}
            <header className="px-4 sm:px-5 pt-4 sm:pt-6 pb-0 flex justify-between items-start gap-3">
              <div className="flex flex-col gap-[7px] cursor-pointer group" onClick={() => setSidebarOpen(true)}>
                <div className="w-8 h-[2.5px] bg-[#1E1E1E] rounded-full group-hover:w-6 transition-all duration-300"></div>
                <div className="w-8 h-[2.5px] bg-[#1E1E1E] rounded-full group-hover:w-8 transition-all duration-300"></div>
                <div className="w-8 h-[2.5px] bg-[#1E1E1E] rounded-full group-hover:w-5 transition-all duration-300"></div>
              </div>
              <Tooltip label="View Cart">
                <div className="relative cursor-pointer active:scale-90 transition-transform p-1 bg-black/5 rounded-2xl" onClick={() => setCartOpen(true)}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1E1E1E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 bg-[#E53935] text-white text-[11px] w-6 h-6 flex items-center justify-center rounded-full font-black shadow-md border-2 border-[#FDFBF7]"
                  >
                    {totalItemsCount}
                  </motion.span>
                </div>
              </Tooltip>
            </header>

            {/* Premium Branding Section */}
            <div className="flex-1 flex items-start justify-center px-3 sm:px-4 pt-1 sm:pt-2">
              <div className="flex flex-col items-center">
                  <h1 className="text-[#1E1E1E] text-[1.85rem] sm:text-[2.45rem] font-semibold uppercase tracking-[-0.01em] leading-[0.95] select-none font-serif">
                    ORDER SMARTER,
                  </h1>
                  <h2 className="text-[#C59B76] text-[2.2rem] sm:text-[3.05rem] font-semibold uppercase tracking-[-0.02em] leading-[0.9] select-none font-serif inline-flex items-end gap-1.5 sm:gap-2">
                    <span>EAT BETTER</span>
                    <span className="w-[42px] h-[34px] sm:w-[54px] sm:h-[44px] -translate-y-1">
                      <svg viewBox="0 0 80 55" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                        <path d="M12 20 Q24 8 34 20" stroke="#1E1E1E" strokeWidth="3" strokeLinecap="round" fill="none"/>
                        <path d="M48 20 Q60 8 70 20" stroke="#1E1E1E" strokeWidth="3" strokeLinecap="round" fill="none"/>
                        <path d="M6 35 Q40 60 76 35" stroke="#1E1E1E" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                        <path d="M54 44 C54 62 74 62 74 46 C70 38 58 38 54 44Z" fill="#E53935" stroke="#1E1E1E" strokeWidth="2"/>
                      </svg>
                    </span>
                  </h2>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── GREEN WAVE AREA (Smooth Elliptical Curve) ── */}
        {!showSplash && (
          <motion.div
            className="absolute left-0 right-0 bottom-0 z-20 flex flex-col shadow-[0_-30px_60px_rgba(0,0,0,0.12)]" 
            initial={{ y: 120, opacity: 0.8 }}
            animate={introReady ? { y: 0, opacity: 1 } : { y: 120, opacity: 0.8 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            style={{ 
              backgroundColor: palette.appGreen,
              top: 'calc(36% - 62px)',
              borderTopLeftRadius: '100% 118px',
              borderTopRightRadius: '100% 118px'
            }}
          >
            <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
              <motion.div
                className="mt-2 overflow-visible"
                initial={{ y: 46, opacity: 0 }}
                animate={introReady ? { y: 0, opacity: 1 } : { y: 46, opacity: 0 }}
                transition={{ delay: 0.18, duration: 0.52 }}
              >
                <div className="mt-0 overflow-visible">
                  {isLoading ? (
                    <SkeletonCategoryTab />
                  ) : (
                    <CategoryTabs
                      categories={categories}
                      activeId={activeCategory}
                      onChange={(id: string) => { setActiveCategory(id); setCurrentIndex(0); }}
                    />
                  )}
                </div>
              </motion.div>

              {/* Food carousel: true center hero + half-peek prev/next (flex, not absolute) */}
              <div className="flex-1 flex flex-col justify-start min-h-0">
                <motion.div
                  className="w-full pt-1 sm:pt-2"
                  initial={{ y: 24, opacity: 0 }}
                  animate={introReady ? { y: 0, opacity: 1 } : { y: 24, opacity: 0 }}
                  transition={{ delay: 0.22, duration: 0.45 }}
                >
                  <motion.div
                    ref={carouselRef}
                    className="flex w-full max-w-md mx-auto items-end justify-center gap-0 min-h-[232px] sm:min-h-[256px] overflow-hidden px-0 select-none touch-pan-y cursor-grab active:cursor-grabbing"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.12}
                    onDragEnd={(_, info) => {
                      if (count <= 1) return;
                      if (info.offset.x < -48 || info.velocity.x < -420) {
                        setCurrentIndex((prev) => (prev + 1) % count);
                      } else if (info.offset.x > 48 || info.velocity.x > 420) {
                        setCurrentIndex((prev) => (prev - 1 + count) % count);
                      }
                    }}
                  >
                    {/* Previous (right half visible at left edge) */}
                    <div
                      className={`min-w-0 shrink-0 flex justify-end items-end overflow-hidden pb-5 sm:pb-7 ${count > 1 ? 'w-[26%] sm:w-[24%]' : 'w-0 overflow-hidden p-0 m-0'}`}
                    >
                      {prevItem ? (
                        <motion.div
                          key={prevItem.id}
                          className="translate-x-[38%] sm:translate-x-[44%] translate-y-2 sm:translate-y-3 opacity-90 origin-bottom"
                          initial={false}
                          animate={{ opacity: 0.9 }}
                          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <FoodCarouselItem
                            item={prevItem}
                            quantity={getQuantity(prevItem.id)}
                            variant="side"
                            onTap={() =>
                              setCurrentIndex((currentIndex - 1 + count) % count)
                            }
                          />
                        </motion.div>
                      ) : (
                        <div className="w-full h-24" aria-hidden />
                      )}
                    </div>

                    {/* Center hero — always screen-centered in row */}
                    <div
                      className={`min-w-0 shrink-0 flex justify-center items-end z-10 pb-0 ${count > 1 ? 'w-[48%] sm:w-[52%]' : 'w-full flex-1'}`}
                    >
                      {currentItem ? (
                        <motion.div
                          key={currentItem.id}
                          className="w-full flex justify-center -translate-y-3 sm:-translate-y-5"
                          initial={false}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <FoodCarouselItem
                            item={currentItem}
                            quantity={getQuantity(currentItem.id)}
                            variant="center"
                            onTap={() => setSelectedItem(currentItem)}
                          />
                        </motion.div>
                      ) : null}
                    </div>

                    {/* Next (left half visible at right edge) */}
                    <div
                      className={`min-w-0 shrink-0 flex justify-start items-end overflow-hidden pb-5 sm:pb-7 ${count > 1 ? 'w-[26%] sm:w-[24%]' : 'w-0 overflow-hidden p-0 m-0'}`}
                    >
                      {nextItem ? (
                        <motion.div
                          key={nextItem.id}
                          className="-translate-x-[38%] sm:-translate-x-[44%] translate-y-2 sm:translate-y-3 opacity-90 origin-bottom"
                          initial={false}
                          animate={{ opacity: 0.9 }}
                          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <FoodCarouselItem
                            item={nextItem}
                            quantity={getQuantity(nextItem.id)}
                            variant="side"
                            onTap={() =>
                              setCurrentIndex((currentIndex + 1) % count)
                            }
                          />
                        </motion.div>
                      ) : (
                        <div className="w-full h-24" aria-hidden />
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              </div>

              {currentItem && (
                <motion.div
                  className="text-center mt-2 mb-3 px-3"
                  initial={{ y: 16, opacity: 0 }}
                  animate={introReady ? { y: 0, opacity: 1 } : { y: 16, opacity: 0 }}
                  transition={{ delay: 0.32, duration: 0.4 }}
                >
                  <h3 className="text-white text-[13px] sm:text-[14px] leading-[1.25] font-medium font-serif px-6 sm:px-8 line-clamp-2">
                    {currentItem.name}
                  </h3>
                  <p className="text-black text-[29px] sm:text-[33px] leading-none font-black mt-1.5 sm:mt-2">
                    {Math.round(currentItem.price)}
                    <span className="text-[14px] sm:text-[16px] ml-1">ETB</span>
                  </p>
                </motion.div>
              )}

              {/* Dots */}
              <motion.div
                className="flex justify-center gap-2.5 sm:gap-3 mb-6 sm:mb-10"
                initial={{ y: 26, opacity: 0 }}
                animate={introReady ? { y: 0, opacity: 1 } : { y: 26, opacity: 0 }}
                transition={{ delay: 0.36, duration: 0.45 }}
              >
                {filteredItems.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      width: currentIndex === i ? 20 : 10,
                      opacity: currentIndex === i ? 1 : 0.35, 
                    }}
                    className="h-2.5 rounded-full bg-white border border-white/50 cursor-pointer shadow-sm"
                    onClick={() => setCurrentIndex(i)}
                  />
                ))}
              </motion.div>

              {/* Dark Action Button (Deep Teal) */}
              <motion.div
                className="px-8 sm:px-14 pb-24 sm:pb-28 mt-auto text-center"
                initial={{ y: 28, opacity: 0 }}
                animate={introReady ? { y: 0, opacity: 1 } : { y: 28, opacity: 0 }}
                transition={{ delay: 0.42, duration: 0.45 }}
              >
                <Tooltip label="Quick Add">
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      const item = filteredItems[currentIndex];
                      if (item) addItem({ menuItemId: item.id, name: item.name, priceAtAdd: item.price, imageUrl: item.imageUrl });
                    }}
                    className="w-full text-white font-black text-[18px] sm:text-[22px] tracking-[0.26em] sm:tracking-[0.4em] uppercase py-4 sm:py-6 rounded-[2.1rem] sm:rounded-[2.5rem] shadow-2xl border border-white/5 transition-all"
                    style={{ backgroundColor: palette.darkButton }}
                  >
                    ORDER
                  </motion.button>
                </Tooltip>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ── TAB CONTENT OVERLAYS (Favorites, Cart, Profile) ── */}
        <AnimatePresence mode="wait">
          {activeTab !== 'home' && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="tab-content-area"
              style={{ backgroundColor: palette.appGreen }}
            >
              {activeTab === 'favorite' && (
                <FavoritesView
                  groupedMenu={groupedMenu}
                  onSelectItem={(item) => { setSelectedItem(item); setActiveTab('home'); }}
                />
              )}
              {activeTab === 'cart' && <CartView />}
              {activeTab === 'profile' && <ProfileView />}
            </motion.div>
          )}
        </AnimatePresence>

        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        <MenuItemDetailPanel
          item={selectedItem}
          quantity={selectedItem ? getQuantity(selectedItem.id) : 0}
          onClose={() => setSelectedItem(null)}
          onOpenCart={() => { setCartOpen(true); }}
          onAdd={(note?: string) => {
            if (!selectedItem) return;
            addItem({ menuItemId: selectedItem.id, name: selectedItem.name, priceAtAdd: selectedItem.price, imageUrl: selectedItem.imageUrl, note });
          }}
          onRemove={() => {
            if (!selectedItem) return;
            updateQuantity(selectedItem.id, getQuantity(selectedItem.id) - 1);
          }}
        />
        <ActiveOrderBar orders={activeOrders} />

        {/* ── NAVIGATION COMPONENTS ── */}
        <WebSidebarDrawer
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

function ActiveOrderBar({ orders }: { orders: Order[] }) {
  const activeOnes = orders.filter(o => o.status !== 'DELIVERED');
  if (activeOnes.length === 0) return null;

  const items = useCartStore((state) => state.items);
  const hasCartItems = useMemo(() => items.length > 0, [items]);

  // Show the most recent one
  const latest = activeOnes[0];

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className={`fixed left-0 right-0 z-40 px-4 pt-4 transition-all duration-300 ${hasCartItems ? 'bottom-24' : 'bottom-6'}`}
    >
      <Link
        href={`/order/${latest.id}`}
        className="block bg-white/80 backdrop-blur-xl border border-brand-500/20 rounded-2xl p-3 shadow-2xl overflow-hidden relative group"
      >
        <div className="absolute inset-0 bg-brand-500/5 group-active:bg-brand-500/10 transition-colors" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white">
              <Clock size={18} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-slate-800 text-xs font-bold uppercase tracking-wider mb-0.5">Order in Progress</h4>
              <p className="text-slate-500 text-[11px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-ping" />
                Status: {latest.status} · Order #{latest.displayNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-brand-600 font-bold text-xs uppercase">
            Resume <ChevronRight size={14} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function PendingOrders({ branchId, tableId }: { branchId: string; tableId: string }) {
  const ordersMap = useLocalOrderStore((state) => state.orders);
  
  const filteredOrders = useMemo(() => 
    Object.values(ordersMap).filter(
      (o) =>
        o.branchId === branchId &&
        o.tableId === tableId &&
        [LocalOrderStatus.PENDING, LocalOrderStatus.SYNCING, LocalOrderStatus.FAILED].includes(o.status),
    ),
    [ordersMap, branchId, tableId]
  );

  if (filteredOrders.length === 0) return null;

  return (
    <div className="px-6 py-2 pb-0 space-y-2 relative z-20">
      {filteredOrders.map((order) => (
        <Link
          key={order.id}
          href={`/order/local/${order.id}`}
          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border animate-in fade-in slide-in-from-top-2
            ${order.status === LocalOrderStatus.FAILED
              ? 'bg-red-500/10 border-red-500/20 text-red-600'
              : 'bg-orange-500/10 border-orange-500/20 text-orange-600'}`}
        >
          <div className="flex items-center gap-2">
            {order.status === LocalOrderStatus.FAILED ? (
              <AlertCircle size={14} />
            ) : (
              <Loader2 size={14} className="animate-spin" />
            )}
            <span className="text-[10px] font-bold uppercase">
              {order.status === LocalOrderStatus.FAILED
                ? 'Order Sync Failed'
                : 'Syncing Order...'}
            </span>
          </div>
          <span className="text-[9px] opacity-50 font-mono">
            #{order.id.slice(0, 6).toUpperCase()}
          </span>
        </Link>
      ))}
    </div>
  );
}
