'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Role } from '@/shared/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Grid3X3, Settings, FolderTree, CreditCard, Users, Store, LogOut } from 'lucide-react';
import { StaffNotificationCenter } from '@/components/admin/StaffNotificationCenter';
import { OfflineSyncBanner } from '@/components/admin/OfflineSyncBanner';
import { useAuthStore } from '@/stores/authStore';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useTranslation } from '@/hooks/useTranslation';

const getNavItems = (t: any) => [
  { href: '/admin/dashboard', label: t('dashboard'),  icon: LayoutDashboard },
  { href: '/admin/menu',      label: t('menu'),       icon: UtensilsCrossed },
  { href: '/admin/categories',label: t('categories'), icon: FolderTree },
  { href: '/admin/orders',    label: t('orders'),     icon: ClipboardList },
  { href: '/admin/tables',    label: t('tables'),     icon: Grid3X3 },
  { href: '/admin/team',      label: t('team'),       icon: Users, adminOnly: true },
  { href: '/admin/branches',  label: t('branches'),   icon: Store, adminOnly: true },
  { href: '/admin/settings',  label: t('settings'),   icon: Settings, matchPrefix: true },
  { href: '/admin/subscription', label: t('billing'), icon: CreditCard, adminOnly: true },
];

function AdminNav() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const isStaff = user?.role === Role.STAFF;

  const filteredItems = getNavItems(t).filter(item => {
    if (isStaff) {
      // Staff only see Orders and Tables
      return ['/admin/orders', '/admin/tables'].includes(item.href);
    }
    if (item.adminOnly && user?.role !== Role.RESTAURANT_ADMIN) {
      return false;
    }
    return true;
  });

  return (
    <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-surface-200 safe-top shadow-sm transition-colors duration-300">
      <nav className="flex items-center justify-between px-4 py-3">
        <div className="flex gap-1 overflow-x-auto no-scrollbar pr-4">
          {filteredItems.map(({ href, label, icon: Icon, matchPrefix }) => {
            const active = matchPrefix ? pathname.startsWith(href) : pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-1.5 flex-shrink-0 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  active
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                    : 'bg-surface-100 text-foreground/40 hover:bg-surface-200 hover:text-foreground/60'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            onClick={logout}
            className="flex-shrink-0 w-10 h-10 rounded-2xl bg-surface hover:bg-rose-500/10 text-foreground/20 hover:text-rose-500 flex items-center justify-center transition-all border border-surface-200 active:scale-90"
            title={t('logout')}
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.SUPER_ADMIN, Role.RESTAURANT_ADMIN, Role.MANAGER, Role.STAFF]}>
      <div className="min-h-dvh bg-surface flex flex-col">
        <OfflineSyncBanner />
        <AdminNav />
        <StaffNotificationCenter />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
