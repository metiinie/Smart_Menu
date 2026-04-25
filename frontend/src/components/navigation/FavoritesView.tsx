'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Search, Heart, X, Plus, Sparkles, TrendingUp } from 'lucide-react';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useCartStore } from '@/stores/cartStore';
import type { MenuItem, MenuCategoryDto } from '@arifsmart/shared';

interface Props {
  groupedMenu: MenuCategoryDto[];
  onSelectItem: (item: MenuItem) => void;
}

export function FavoritesView({ groupedMenu, onSelectItem }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const { favorites, removeFavorite } = useFavoritesStore();
  const addItem = useCartStore((s) => s.addItem);

  // Flatten all items for search
  const allItems = useMemo(
    () => groupedMenu.flatMap((g) => g.items),
    [groupedMenu]
  );

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    );
  }, [searchQuery, allItems]);

  // Popular items (top 6 by price, simulating popularity)
  const popularItems = useMemo(
    () => [...allItems].sort((a, b) => b.price - a.price).slice(0, 6),
    [allItems]
  );

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
            placeholder="Search dishes, ingredients..."
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
                  Your Favorites
                </h3>
                <div className="fav-view__grid">
                  {favorites.map((fav) => (
                    <FavSavedCard
                      key={fav.menuItemId}
                      fav={fav}
                      onRemove={() => removeFavorite(fav.menuItemId)}
                      onTap={() => {
                        const real = allItems.find((i) => i.id === fav.menuItemId);
                        if (real) onSelectItem(real);
                      }}
                      onAddToCart={() =>
                        addItem({
                          menuItemId: fav.menuItemId,
                          name: fav.name,
                          priceAtAdd: fav.price,
                          imageUrl: fav.imageUrl,
                        })
                      }
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

function FavItemCard({
  item,
  onTap,
  onAddToCart,
}: {
  item: MenuItem;
  onTap: () => void;
  onAddToCart: () => void;
}) {
  const isFav = useFavoritesStore((s) => s.isFavorite(item.id));
  const toggleFav = useFavoritesStore((s) => s.toggleFavorite);

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
            toggleFav({
              menuItemId: item.id,
              name: item.name,
              price: item.price,
              imageUrl: item.imageUrl,
              description: item.description,
            });
          }}
        >
          <Heart size={14} fill={isFav ? '#E53935' : 'none'} />
        </button>
      </div>
      <div className="fav-card__info" onClick={onTap}>
        <h4 className="fav-card__name">{item.name}</h4>
        <p className="fav-card__price">ETB {Math.round(item.price)}</p>
      </div>
      <button className="fav-card__add" onClick={onAddToCart}>
        <Plus size={14} />
      </button>
    </motion.div>
  );
}

function FavSavedCard({
  fav,
  onRemove,
  onTap,
  onAddToCart,
}: {
  fav: { menuItemId: string; name: string; price: number; imageUrl?: string };
  onRemove: () => void;
  onTap: () => void;
  onAddToCart: () => void;
}) {
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
            alt={fav.name}
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
        >
          <Heart size={14} fill="#E53935" />
        </button>
      </div>
      <div className="fav-card__info" onClick={onTap}>
        <h4 className="fav-card__name">{fav.name}</h4>
        <p className="fav-card__price">ETB {Math.round(fav.price)}</p>
      </div>
      <button className="fav-card__add" onClick={onAddToCart}>
        <Plus size={14} />
      </button>
    </motion.div>
  );
}
