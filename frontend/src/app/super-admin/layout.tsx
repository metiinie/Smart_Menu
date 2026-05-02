'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Role } from '@/shared/types';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard,
  Store,
  CreditCard,
  Users,
  GitBranch,
  Activity,
  ShieldAlert,
  LogOut,
  ChevronRight,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'Platform',
    items: [
      { href: '/super-admin', label: 'Overview', icon: LayoutDashboard, exact: true },
      { href: '/super-admin/restaurants', label: 'Restaurants', icon: Store },
      { href: '/super-admin/plans', label: 'Subscription Plans', icon: CreditCard },
    ],
  },
  {
    label: 'Tenant Data',
    items: [
      { href: '/super-admin/users', label: 'All Users', icon: Users },
      { href: '/super-admin/branches', label: 'All Branches', icon: GitBranch },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/super-admin/system', label: 'System Health', icon: Activity },
    ],
  },
];

function SuperAdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-[#0d0d14] border-r border-slate-800/60 flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <ShieldAlert size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-400">ArifSmart</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Platform Control</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 px-3 mb-1.5">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                        active
                          ? 'bg-gradient-to-r from-rose-500/15 to-violet-500/10 text-white border border-rose-500/20 shadow-sm'
                          : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon
                        size={15}
                        className={active ? 'text-rose-400' : 'text-slate-600 group-hover:text-slate-400 transition-colors'}
                      />
                      <span className="flex-1">{label}</span>
                      {active && <ChevronRight size={12} className="text-rose-400/60" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="px-3 pb-4 border-t border-slate-800/60 pt-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/40 mb-1">
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center border border-rose-500/20">
            <span className="text-xs font-black text-rose-400">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'S'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.name ?? 'Super Admin'}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Platform Admin</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-150"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.SUPER_ADMIN]}>
      <div className="min-h-dvh bg-[#080810] flex font-sans">
        <SuperAdminSidebar />
        {/* Main Content — offset by sidebar width */}
        <div className="flex-1 ml-60 flex flex-col min-h-dvh">
          <main className="flex-1 p-7 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
