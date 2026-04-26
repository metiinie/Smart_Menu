'use client';

import { motion } from 'framer-motion';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useCartStore } from '@/stores/cartStore';
import { useMemo } from 'react';

export type TabId = 'home' | 'favorite' | 'cart' | 'profile';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

/* ─── Icon components (inline SVG for pixel-perfect control) ─── */

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
        stroke={active ? '#08AE75' : '#8B8B8B'}
        fill={active ? '#08AE75' : 'none'}
        fillOpacity={active ? 0.12 : 0}
      />
      <path d="M9 21V13h6v8" stroke={active ? '#08AE75' : '#8B8B8B'} />
    </svg>
  );
}

function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        stroke={active ? '#E53935' : '#8B8B8B'}
        fill={active ? '#E53935' : 'none'}
        fillOpacity={active ? 0.15 : 0}
      />
    </svg>
  );
}

function CartIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke={active ? '#08AE75' : '#8B8B8B'} fill={active ? '#08AE75' : 'none'} fillOpacity={active ? 0.12 : 0} />
      <line x1="3" y1="6" x2="21" y2="6" stroke={active ? '#08AE75' : '#8B8B8B'} />
      <path d="M16 10a4 4 0 01-8 0" stroke={active ? '#08AE75' : '#8B8B8B'} />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={active ? '#08AE75' : '#8B8B8B'} />
      <circle cx="12" cy="7" r="4" stroke={active ? '#08AE75' : '#8B8B8B'} fill={active ? '#08AE75' : 'none'} fillOpacity={active ? 0.12 : 0} />
    </svg>
  );
}


import { UI_STRINGS } from '@/lib/i18n';

export function BottomTabBar({ activeTab, onTabChange }: Props) {
  const cartItems = useCartStore((s) => s.items);
  const { favorites, language } = useFavoritesStore();
  const t = UI_STRINGS[language];

  const cartCount = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.quantity, 0),
    [cartItems]
  );
  const favCount = favorites.length;

  const getTabs = () => [
    { id: 'home' as TabId, label: 'Home', Icon: HomeIcon },
    { id: 'favorite' as TabId, label: t.favorites || 'Favorites', Icon: HeartIcon },
    { id: 'cart' as TabId, label: t.cart || 'Cart', Icon: CartIcon },
    { id: 'profile' as TabId, label: t.profile || 'Profile', Icon: ProfileIcon },
  ];

  return (
    <nav
      className="btm-tab-bar"
      id="bottom-tab-bar"
    >
      {/* Glassmorphism background */}
      <div className="btm-tab-bar__bg" />

      <div className="btm-tab-bar__inner">
        {getTabs().map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          const badge =
            id === 'cart' ? cartCount : id === 'favorite' ? favCount : 0;

          return (
            <button
              key={id}
              id={`tab-${id}`}
              className={`btm-tab-bar__item ${isActive ? 'btm-tab-bar__item--active' : ''}`}
              onClick={() => onTabChange(id)}
              aria-label={label}
            >
              {/* Active indicator pill */}
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="btm-tab-bar__indicator"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <div className="btm-tab-bar__icon-wrap">
                <Icon active={isActive} />
                {badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="btm-tab-bar__badge"
                  >
                    {badge > 99 ? '99+' : badge}
                  </motion.span>
                )}
              </div>

              <span
                className={`btm-tab-bar__label ${
                  isActive ? 'btm-tab-bar__label--active' : ''
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
