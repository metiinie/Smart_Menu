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
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useTranslation } from '@/hooks/useTranslation';

const getNavSections = (t: any) => [
  {
    label: t('platformControl'),
    items: [
      { href: '/super-admin', label: t('overview'), icon: LayoutDashboard, exact: true },
      { href: '/super-admin/restaurants', label: t('restaurants'), icon: Store },
      { href: '/super-admin/plans', label: t('plans'), icon: CreditCard },
    ],
  },
  {
    label: t('tenantData'),
    items: [
      { href: '/super-admin/users', label: t('users'), icon: Users },
      { href: '/super-admin/branches', label: t('branches'), icon: GitBranch },
    ],
  },
  {
    label: t('system'),
    items: [
      { href: '/super-admin/system', label: t('systemHealth'), icon: Activity },
    ],
  },
];

function SuperAdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-surface border-r border-surface-200 flex flex-col z-30 transition-colors duration-300">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-surface-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <ShieldAlert size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-500">ArifSmart</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/40">{t('platformControl')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {getNavSections(t).map((section) => (
          <div key={section.label}>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/20 px-3 mb-1.5">
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
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                          : 'text-foreground/40 hover:text-foreground hover:bg-surface-100'
                      }`}
                    >
                      <Icon
                        size={15}
                        className={active ? 'text-white' : 'text-foreground/20 group-hover:text-foreground/40 transition-colors'}
                      />
                      <span className="flex-1">{label}</span>
                      {active && <ChevronRight size={12} className="text-white/40" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="px-3 pb-4 border-t border-surface-200 pt-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-100 mb-1">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <span className="text-xs font-black text-rose-500">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'S'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{user?.name ?? t('superAdmin')}</p>
            <p className="text-[9px] text-foreground/40 uppercase tracking-wider font-bold">{t('platformAdmin')}</p>
          </div>
        </div>
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center gap-2 py-2 text-xs font-semibold text-foreground/40 hover:text-rose-500 transition-all duration-150"
          >
            <LogOut size={14} />
            {t('logout')}
          </button>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.SUPER_ADMIN]}>
      <div className="min-h-dvh bg-background flex font-sans transition-colors duration-300">
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
