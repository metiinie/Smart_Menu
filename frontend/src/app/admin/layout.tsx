'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Role } from '@/shared/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Grid3X3, Settings, FolderTree, CreditCard } from 'lucide-react';
import { StaffNotificationCenter } from '@/components/admin/StaffNotificationCenter';
import { OfflineSyncBanner } from '@/components/admin/OfflineSyncBanner';
import { useAuthStore } from '@/stores/authStore';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/admin/menu',      label: 'Menu',       icon: UtensilsCrossed },
  { href: '/admin/categories',label: 'Categories', icon: FolderTree },
  { href: '/admin/orders',    label: 'Orders',     icon: ClipboardList },
  { href: '/admin/tables',    label: 'Tables',     icon: Grid3X3 },
  { href: '/admin/settings',  label: 'Settings',   icon: Settings, matchPrefix: true },
  { href: '/admin/subscription', label: 'Billing', icon: CreditCard },
];

function AdminNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isStaff = user?.role === Role.STAFF;

  const filteredItems = NAV_ITEMS.filter(item => {
    if (isStaff) {
      // Staff only see Orders and Tables
      return ['/admin/orders', '/admin/tables'].includes(item.href);
    }
    return true;
  });

  return (
    <nav className="flex gap-1 overflow-x-auto no-scrollbar px-4 pb-3 pt-1">
      {filteredItems.map(({ href, label, icon: Icon, matchPrefix }) => {
        const active = matchPrefix ? pathname.startsWith(href) : pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex items-center gap-1.5 flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              active
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.RESTAURANT_ADMIN, Role.MANAGER, Role.STAFF]}>
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
