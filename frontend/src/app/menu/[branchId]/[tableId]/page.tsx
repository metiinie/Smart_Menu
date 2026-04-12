'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { ItemModal } from '@/components/menu/ItemModal';
import { FloatingCartButton } from '@/components/menu/FloatingCartButton';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { SkeletonCard, SkeletonCategoryTab } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/StatusStates';
import { getSocket } from '@/lib/socket';
import type { MenuItem, Category, MenuCategoryDto, Order } from '@arifsmart/shared';

interface PageProps {
  params: { branchId: string; tableId: string };
}

export default function MenuPage({ params }: PageProps) {
  const [branchId, setBranchId] = useState('');
  const [tableId, setTableId] = useState('');
  const [fastingOnly, setFastingOnly] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { setContext, addItem, updateQuantity, items, totalItems, totalPrice } = useCartStore();

  useEffect(() => {
    setBranchId(params.branchId);
    setTableId(params.tableId);
  }, [params]);

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

  return (
    <div className="min-h-dvh flex flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-surface-200 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="font-display font-bold text-lg text-white">Menu</h1>
            {tableId && (
              <p className="text-white/40 text-xs">Table {tableId.slice(-4).toUpperCase()}</p>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setFastingOnly(!fastingOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold
              transition-colors ${fastingOnly
                ? 'bg-emerald-500 text-white'
                : 'bg-surface-100 text-white/60'}`}
            id="fasting-filter-btn"
          >
            <Leaf size={13} />
            Fasting
          </motion.button>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className="w-full bg-surface-100 border border-surface-200 rounded-2xl pl-9 pr-9 py-2 
                         text-sm text-white outline-none focus:border-brand-500/50 transition-colors
                         placeholder:text-white/20"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30"
              >
                <CloseIcon size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        {isLoading ? (
          <SkeletonCategoryTab />
        ) : (
          <CategoryTabs
            categories={categories}
            activeId={activeCategory}
            onChange={setActiveCategory}
          />
        )}
        {/* Pending Orders Indicator */}
        <PendingOrders branchId={branchId} tableId={tableId} />

        <div className="h-2" />
      </header>

      {/* Menu items */}
      <main className="flex-1 px-4 pb-32 space-y-3 pt-2">
        {isError ? (
          <ErrorState
            message="Could not load the menu. Please check your connection."
            onRetry={refetch}
          />
        ) : isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <span className="text-5xl mb-3">🔍</span>
            <p className="text-sm">No items match your search</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
              >
                <FoodCard
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
          </AnimatePresence>
        )}
      </main>

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

      {/* Floating cart */}
      <FloatingCartButton
        totalItems={totalItems()}
        totalPrice={totalPrice()}
        onClick={() => setCartOpen(true)}
      />

      {/* Cart drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Resume Order Persistent Bar (FIX 9) */}
      <ActiveOrderBar orders={activeOrders} />
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
      className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-20 pt-4"
    >
      <Link
        href={`/order/${latest.id}`}
        className="block bg-surface-100/80 backdrop-blur-xl border border-brand-500/20 rounded-2xl p-3 shadow-2xl overflow-hidden relative group"
      >
        <div className="absolute inset-0 bg-brand-500/5 group-active:bg-brand-500/10 transition-colors" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white">
              <Clock size={18} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-0.5">Order in Progress</h4>
              <p className="text-white/60 text-[11px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-ping" />
                Status: {latest.status} · Order #{latest.displayNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-brand-400 font-bold text-xs uppercase">
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
    <div className="px-4 py-2 space-y-2">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/order/local/${order.id}`}
          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border animate-in fade-in slide-in-from-top-2
            ${order.status === LocalOrderStatus.FAILED
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}
        >
          <div className="flex items-center gap-2">
            {order.status === LocalOrderStatus.FAILED ? (
              <AlertCircle size={14} />
            ) : (
              <Loader2 size={14} className="animate-spin" />
            )}
            <span className="text-xs font-bold">
              {order.status === LocalOrderStatus.FAILED
                ? 'Order Sync Failed'
                : 'Syncing Order...'}
            </span>
          </div>
          <span className="text-[10px] opacity-70 font-mono">
            {order.id.slice(0, 8).toUpperCase()}
          </span>
        </Link>
      ))}
    </div>
  );
}
