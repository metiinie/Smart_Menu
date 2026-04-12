'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Filter, Leaf, Search, X as CloseIcon, Clock, ChevronRight } from 'lucide-react';
import { menuApi, contextApi, ordersApi } from '@/lib/api';
import { useCartStore } from '@/stores/cartStore';
import { CategoryTabs } from '@/components/menu/CategoryTabs';
import { useLocalOrderStore } from '@/stores/localOrderStore';
import { LocalOrderStatus } from '@arifsmart/shared';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import { FoodCard } from '@/components/menu/FoodCard';
import { FoodCarouselItem } from '@/components/menu/FoodCarouselItem';
import { ItemModal } from '@/components/menu/ItemModal';
import { FloatingCartButton } from '@/components/menu/FloatingCartButton';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { SkeletonCard, SkeletonCategoryTab } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/StatusStates';
import { getSocket } from '@/lib/socket';
import type { MenuItem, Category, MenuCategoryDto, Order } from '@arifsmart/shared';

interface PageProps {
  params: Promise<{ branchId: string; tableId: string }>;
}

export default function MenuPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [branchId, setBranchId] = useState('');
  const [tableId, setTableId] = useState('');
  const [fastingOnly, setFastingOnly] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const { setContext, addItem, updateQuantity, items, totalItems, totalPrice } = useCartStore();

  useEffect(() => {
    setBranchId(resolvedParams.branchId);
    setTableId(resolvedParams.tableId);
  }, [resolvedParams]);

  const { data: contextData } = useQuery({
    queryKey: ['table-context', branchId, tableId],
    queryFn: () => contextApi.getTableContext(branchId, tableId),
    enabled: !!branchId && !!tableId,
  });

  const { data: menuData, isLoading, isError, refetch } = useQuery({
    queryKey: ['menu', branchId, fastingOnly],
    queryFn: () => menuApi.getMenu(branchId, fastingOnly || undefined),
    enabled: !!branchId,
    staleTime: 60_000,
  });

  const groupedMenu: MenuCategoryDto[] = menuData ?? [];
  const categories: Category[] = groupedMenu.map((g) => g.category);
  const sessionId: string = contextData?.activeSession?.id ?? '';
  const customerRef = typeof window !== 'undefined' ? localStorage.getItem('arifsmart_customerRef') : null;

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

  return (
    <div className="min-h-dvh flex flex-col bg-surface relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none select-none z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="food-pattern-home" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M10 10 Q 15 5, 20 10 T 30 10" stroke="black" fill="transparent" />
            <circle cx="50" cy="50" r="2" fill="black" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#food-pattern-home)" />
        </svg>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 safe-top bg-surface/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="w-8 h-8 rounded-full bg-white/80 shadow-sm flex items-center justify-center border border-black/5">
            <div className="flex flex-col gap-1">
              <div className="w-4 h-0.5 bg-slate-800 rounded-full" />
              <div className="w-2.5 h-0.5 bg-slate-800 rounded-full" />
              <div className="w-4 h-0.5 bg-slate-800 rounded-full" />
            </div>
          </div>
          <div className="flex-1 text-center">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] -mb-1">Table {tableId.slice(-4).toUpperCase()}</h4>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/80 shadow-sm flex items-center justify-center border border-black/5 relative active:scale-95 transition-transform" onClick={() => setCartOpen(true)}>
            <Search size={18} className="text-slate-800" />
          </div>
        </div>

        {/* Premium Title */}
        <div className="px-6 pt-2 pb-6 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategoryName}
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -15 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-0"
            >
              <h2 className="font-display text-2xl font-black text-slate-800 tracking-tight leading-none uppercase opacity-80">I Want</h2>
              <h1 className="font-display text-6xl font-black text-brand-500 tracking-tighter leading-none uppercase my-1">{activeCategoryName}</h1>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Category tabs */}
        {isLoading ? (
          <SkeletonCategoryTab />
        ) : (
          <CategoryTabs
            categories={categories}
            activeId={activeCategory}
            onChange={(id) => {
              setActiveCategory(id);
              setCurrentIndex(0);
            }}
          />
        )}
      </header>

      {/* Main Swiper Content */}
      <main className="flex-1 relative z-10 pt-4 overflow-hidden">
        {isError ? (
          <ErrorState message="Could not load the menu." onRetry={refetch} />
        ) : isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <span className="text-5xl mb-3">🔍</span>
            <p className="text-sm font-bold">No results found</p>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Horizontal Swiper Container */}
            <div className="flex-1 relative flex items-center overflow-hidden">
              <motion.div
                className="flex items-center cursor-grab active:cursor-grabbing h-full"
                drag="x"
                dragConstraints={{
                  left: -((filteredItems.length - 1) * 300),
                  right: 0
                }}
                animate={{ x: -(currentIndex * 300) }}
                onDragEnd={(_, info) => {
                  const threshold = 40;
                  const velocity = info.velocity.x;
                  
                  if (info.offset.x < -threshold || velocity < -500) {
                    if (currentIndex < filteredItems.length - 1) {
                      setCurrentIndex(currentIndex + 1);
                    }
                  } else if (info.offset.x > threshold || velocity > 500) {
                    if (currentIndex > 0) {
                      setCurrentIndex(currentIndex - 1);
                    }
                  }
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 25, mass: 0.8 }}
                style={{ paddingLeft: 'calc(50% - 150px)' }}
              >
                {filteredItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={false}
                    animate={{
                      scale: currentIndex === i ? 1 : 0.8,
                      opacity: currentIndex === i ? 1 : 0.3,
                      filter: currentIndex === i ? 'blur(0px)' : 'blur(4px)',
                      z: currentIndex === i ? 0 : -100
                    }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="perspective-1000"
                  >
                    <FoodCarouselItem
                      item={item}
                      quantity={getQuantity(item.id)}
                      onAdd={() =>
                        addItem({
                          menuItemId: item.id,
                          name: item.name,
                          priceAtAdd: item.price,
                          imageUrl: item.imageUrl,
                        })
                      }
                      onTap={() => setSelectedItem(item)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 py-8">
              {filteredItems.map((_, i) => (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{
                    width: currentIndex === i ? 32 : 8,
                    backgroundColor: currentIndex === i ? '#F97316' : '#E2E8F0',
                    opacity: currentIndex === i ? 1 : 0.5
                  }}
                  className="h-2 rounded-full cursor-pointer"
                  onClick={() => setCurrentIndex(i)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating cart */}
      <div className="fixed bottom-8 right-6 z-50">
        <FloatingCartButton
          totalItems={totalItems()}
          totalPrice={totalPrice()}
          onClick={() => setCartOpen(true)}
        />
      </div>

      {/* Cart drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Item modal */}
      <ItemModal
        item={selectedItem}
        quantity={selectedItem ? getQuantity(selectedItem.id) : 0}
        onClose={() => setSelectedItem(null)}
        onAdd={(note) => {
          if (!selectedItem) return;
          addItem({
            menuItemId: selectedItem.id,
            name: selectedItem.name,
            priceAtAdd: selectedItem.price,
            imageUrl: selectedItem.imageUrl,
            note,
          });
        }}
        onRemove={() => {
          if (!selectedItem) return;
          const q = getQuantity(selectedItem.id);
          updateQuantity(selectedItem.id, q - 1);
        }}
      />

      {/* Resume Order Persistent Bar (FIX 9) */}
      <ActiveOrderBar orders={activeOrders} />

      {/* Version Tag */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none">
        <span className="text-[8px] font-mono text-slate-400 uppercase tracking-tighter">
          v2.0-PREMIUM
        </span>
      </div>
    </div>
  );
}

function ActiveOrderBar({ orders }: { orders: Order[] }) {
  const activeOnes = orders.filter(o => o.status !== 'DELIVERED');
  if (activeOnes.length === 0) return null;

  // Show the most recent one
  const latest = activeOnes[0];

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-24 pt-4"
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
  const orders = useLocalOrderStore((state) =>
    Object.values(state.orders).filter(
      (o) =>
        o.branchId === branchId &&
        o.tableId === tableId &&
        [LocalOrderStatus.PENDING, LocalOrderStatus.SYNCING, LocalOrderStatus.FAILED].includes(o.status),
    ),
  );

  if (orders.length === 0) return null;

  return (
    <div className="px-6 py-2 pb-0 space-y-2 relative z-20">
      {orders.map((order) => (
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
