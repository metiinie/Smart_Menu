'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Role } from '@arifsmart/shared';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Grid3X3, Settings} from 'lucide-react';
import { StaffNotificationCenter } from '@/components/admin/StaffNotificationCenter';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/tables', label: 'Tables', icon: Grid3X3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto no-scrollbar px-4 pb-3 pt-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
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
    <AuthGuard allowedRoles={[Role.ADMIN]}>
      <div className="min-h-dvh bg-surface">
        <AdminNav />
        <StaffNotificationCenter />
        {children}
      </div>
    </AuthGuard>
  );
}
