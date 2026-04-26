'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, Heart, ShoppingBag, User, Bell, Globe, CreditCard, Info } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { UI_STRINGS } from '@/lib/i18n';
import { useMemo } from 'react';
import type { TabId } from './BottomTabBar';

interface Props {
  open: boolean;
  onClose: () => void;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}


export function WebSidebarDrawer({ open, onClose, activeTab, onTabChange }: Props) {
  const cartItems = useCartStore((s) => s.items);
  const { favorites, language } = useFavoritesStore();
  const t = UI_STRINGS[language];

  const cartCount = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.quantity, 0),
    [cartItems]
  );

  const handleNav = (tab: TabId) => {
    onTabChange(tab);
    onClose();
  };

  const getNavItems = () => [
    { id: 'home' as TabId, label: 'Main Menu', icon: <Home size={20} />, description: 'Browse categories & dishes' },
    { id: 'favorite' as TabId, label: t.favorites || 'Favorites', icon: <Heart size={20} />, description: 'Find dishes, view saved items' },
    { id: 'cart' as TabId, label: t.cart || 'My Cart', icon: <ShoppingBag size={20} />, description: 'Review order & checkout' },
    { id: 'profile' as TabId, label: t.profile || 'Profile', icon: <User size={20} />, description: 'Language, currency, service' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="web-sidebar__backdrop"
          />

          {/* Sidebar panel */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="web-sidebar__panel"
          >
            {/* Header */}
            <div className="web-sidebar__header">
              <div className="web-sidebar__brand">
                <div className="web-sidebar__brand-logo">
                  <svg viewBox="0 0 80 55" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-6">
                    <path d="M12 20 Q24 8 34 20" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <path d="M48 20 Q60 8 70 20" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <path d="M6 35 Q40 60 76 35" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
                <div>
                  <h2 className="web-sidebar__title">ArifSmart</h2>
                  <p className="web-sidebar__subtitle">Smart Menu</p>
                </div>
              </div>
              <button onClick={onClose} className="web-sidebar__close" id="sidebar-close">
                <X size={20} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="web-sidebar__nav">
              {getNavItems().map(({ id, label, icon, description }) => {
                const isActive = activeTab === id;
                const badge =
                  id === 'cart' ? cartCount : id === 'favorite' ? favorites.length : 0;

                return (
                  <button
                    key={id}
                    id={`sidebar-nav-${id}`}
                    className={`web-sidebar__nav-item ${isActive ? 'web-sidebar__nav-item--active' : ''}`}
                    onClick={() => handleNav(id)}
                  >
                    <div className={`web-sidebar__nav-icon ${isActive ? 'web-sidebar__nav-icon--active' : ''}`}>
                      {icon}
                    </div>
                    <div className="web-sidebar__nav-text">
                      <span className="web-sidebar__nav-label">{label}</span>
                      <span className="web-sidebar__nav-desc">{description}</span>
                    </div>
                    {badge > 0 && (
                      <span className="web-sidebar__nav-badge">{badge}</span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Divider */}
            <div className="web-sidebar__divider" />

            {/* Quick actions */}
            <div className="web-sidebar__quick-actions">
              <p className="web-sidebar__section-title">Quick Actions</p>
              <button className="web-sidebar__action-btn" id="sidebar-call-waiter" onClick={() => handleNav('profile')}>
                <Bell size={16} />
                <span>Call Waiter</span>
              </button>
              <button className="web-sidebar__action-btn" id="sidebar-language" onClick={() => handleNav('profile')}>
                <Globe size={16} />
                <span>Language</span>
              </button>
              <button className="web-sidebar__action-btn" id="sidebar-currency" onClick={() => handleNav('profile')}>
                <CreditCard size={16} />
                <span>Currency</span>
              </button>
            </div>

            {/* Footer */}
            <div className="web-sidebar__footer">
              <div className="web-sidebar__footer-info">
                <Info size={14} />
                <span>Powered by ArifSmart</span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
