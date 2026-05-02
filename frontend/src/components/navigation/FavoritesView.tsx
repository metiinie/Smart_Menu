'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Search, Heart, X, Plus,  TrendingUp } from 'lucide-react';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useCartStore } from '@/stores/cartStore';
import type { MenuItem, MenuCategoryDto } from '@/shared/types';
import { getLocalized, UI_STRINGS } from '@/lib/i18n';
import { useQuery } from '@tanstack/react-query';
import { menuApi } from '@/lib/api';
import { formatPrice } from '@/lib/formatters';

interface Props {
  groupedMenu: MenuCategoryDto[];
  onSelectItem: (item: MenuItem) => void;
}

export function FavoritesView({ groupedMenu, onSelectItem }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const { favorites, removeFavorite, language, fetchFavorites, customerProfile } = useFavoritesStore();
  const t = UI_STRINGS[language];
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const ref = customerProfile?.customerRef || (typeof window !== 'undefined' ? localStorage.getItem('arifsmart_customerRef') : null);
    if (ref) {
      fetchFavorites(ref);
    }
  }, [customerProfile?.customerRef, fetchFavorites]);

  // Flatten all items for search
  const allItems = useMemo(
    () => groupedMenu.flatMap((g) => g.items),
    [groupedMenu]
  );

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allItems.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(q) ||
        Object.values((item as any).nameTranslations || {}).some((v: any) => v.toLowerCase().includes(q));
      
      const descMatch = item.description?.toLowerCase().includes(q) ||
        Object.values((item as any).descriptionTranslations || {}).some((v: any) => v.toLowerCase().includes(q));
      
      return nameMatch || descMatch;
    });
  }, [searchQuery, allItems]);

  // Popular items from API (fallback to mocked if no branchId or error)
  const branchId = groupedMenu.length > 0 ? groupedMenu[0].category.branchId : '';
  const { data: trendingItems = [] } = useQuery<MenuItem[]>({
    queryKey: ['trending-items', branchId],
    queryFn: () => menuApi.getTrending(branchId, 6),
    enabled: !!branchId,
  });

  const popularItemsMock = useMemo(
    () => [...allItems].sort((a, b) => b.price - a.price).slice(0, 6),
    [allItems]
  );

  const popularItems: MenuItem[] = trendingItems.length > 0 ? trendingItems : popularItemsMock;

  const isSearching = searchQuery.trim().length > 0;
  const hasFavorites = favorites.length > 0;

  return (
    <div className="fav-view">
      {/* Search Bar */}
      <div className="fav-view__search-wrap">
        <div className="fav-view__search">
          <Search size={18} className="fav-view__search-icon" />
          <input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="fav-view__search-input"
            id="fav-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="fav-view__search-clear"
              id="fav-search-clear"
              aria-label="Clear search"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div
            key="search-results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fav-view__section"
          >
            <h3 className="fav-view__section-title">
              <Search size={16} />
              Results for &ldquo;{searchQuery}&rdquo;
            </h3>
            {searchResults.length === 0 ? (
              <div className="fav-view__empty">
                <span className="fav-view__empty-emoji">🔍</span>
                <p>No dishes found for &ldquo;{searchQuery}&rdquo;</p>
              </div>
            ) : (
              <div className="fav-view__grid">
                {searchResults.map((item) => (
                  <FavItemCard
                    key={item.id}
                    item={item}
                    onTap={() => onSelectItem(item)}
                    onAddToCart={() =>
                      addItem({
                        menuItemId: item.id,
                        name: item.name,
                        priceAtAdd: item.price,
                        imageUrl: item.imageUrl,
                      })
                    }
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="favorites-content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            {/* Favorites section */}
            {hasFavorites && (
              <div className="fav-view__section">
                <h3 className="fav-view__section-title">
                  <Heart size={16} className="text-red-400" />
                  {t.favorites}
                </h3>
                <div className="fav-view__grid">
                  {favorites.map((fav) => (
                    <FavSavedCard
                      key={fav.menuItemId}
                      fav={fav}
                      allItems={allItems}
                      onRemove={() => removeFavorite(fav.menuItemId)}
                      onTap={() => {
                        const real = allItems.find((i) => i.id === fav.menuItemId);
                        if (real) onSelectItem(real);
                      }}
                      onAddToCart={(realItem) => {
                        if (realItem) {
                          addItem({
                            menuItemId: realItem.id,
                            name: realItem.name,
                            priceAtAdd: realItem.price,
                            imageUrl: realItem.imageUrl,
                          });
                        } else {
                          addItem({
                            menuItemId: fav.menuItemId,
                            name: fav.name,
                            priceAtAdd: fav.price,
                            imageUrl: fav.imageUrl,
                          });
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Popular / Trending section */}
            <div className="fav-view__section">
              <h3 className="fav-view__section-title">
                <TrendingUp size={16} /> Trending Now
              </h3>
              <div className="fav-view__grid">
                {popularItems.map((item) => (
                  <FavItemCard
                    key={item.id}
                    item={item}
                    onTap={() => onSelectItem(item)}
                    onAddToCart={() =>
                      addItem({
                        menuItemId: item.id,
                        name: item.name,
                        priceAtAdd: item.price,
                        imageUrl: item.imageUrl,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Sub-components ─── */

export function FavItemCard({
  item,
  onTap,
  onAddToCart,
}: {
  item: MenuItem;
  onTap: () => void;
  onAddToCart: () => void;
}) {
  const { isFavorite, toggleFavorite, language } = useFavoritesStore();
  const isFav = isFavorite(item.id);

  return (
    <motion.div
      layout
      className="fav-card"
      whileTap={{ scale: 0.97 }}
    >
      <div className="fav-card__image" onClick={onTap}>
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="140px"
            className="object-cover"
          />
        ) : (
          <div className="fav-card__placeholder">🍽️</div>
        )}
        <button
          className={`fav-card__heart ${isFav ? 'fav-card__heart--active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite({
              menuItemId: item.id,
              name: item.name,
              price: item.price,
              imageUrl: item.imageUrl ?? undefined,
              description: item.description ?? undefined,
            });
          }}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart size={14} fill={isFav ? '#E53935' : 'none'} />
        </button>
      </div>
      <div className="fav-card__info" onClick={onTap}>
        <h4 className="fav-card__name">{getLocalized((item as any).nameTranslations, item.name, language)}</h4>
        <p className="fav-card__price">{formatPrice(item.price)}</p>
      </div>
      <button className="fav-card__add" onClick={onAddToCart} aria-label="Add to cart" title="Add to cart">
        <Plus size={14} />
      </button>
    </motion.div>
  );
}

function FavSavedCard({
  fav,
  allItems,
  onRemove,
  onTap,
  onAddToCart,
}: {
  fav: { menuItemId: string; name: string; price: number; imageUrl?: string };
  allItems: MenuItem[];
  onRemove: () => void;
  onTap: () => void;
  onAddToCart: (realItem: MenuItem | null) => void;
}) {
  const { language } = useFavoritesStore();
  const realItem = allItems.find((i) => i.id === fav.menuItemId);
  const displayName = realItem 
    ? getLocalized((realItem as any).nameTranslations, realItem.name, language)
    : fav.name;
    
  const displayPrice = realItem ? realItem.price : fav.price;

  return (
    <motion.div
      layout
      exit={{ opacity: 0, scale: 0.8 }}
      className="fav-card"
      whileTap={{ scale: 0.97 }}
    >
      <div className="fav-card__image" onClick={onTap}>
        {fav.imageUrl ? (
          <Image
            src={fav.imageUrl}
            alt={displayName}
            fill
            sizes="140px"
            className="object-cover"
          />
        ) : (
          <div className="fav-card__placeholder">🍽️</div>
        )}
        <button
          className="fav-card__heart fav-card__heart--active"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove from favorites"
          title="Remove from favorites"
        >
          <Heart size={14} fill="#E53935" />
        </button>
      </div>
      <div className="fav-card__info" onClick={onTap}>
        <h4 className="fav-card__name">{displayName}</h4>
        <p className="fav-card__price">{formatPrice(displayPrice)}</p>
      </div>
      <button className="fav-card__add" onClick={() => onAddToCart(realItem || null)} aria-label="Add to cart" title="Add to cart">
        <Plus size={14} />
      </button>
    </motion.div>
  );
}
