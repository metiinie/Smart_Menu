'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ClipboardList, 
  LayoutGrid, 
  Bell, 
  User,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Role } from '@/shared/types';
import { useAuthStore, selectBranchId } from '@/stores/authStore';
import { joinRoom, leaveRoom } from '@/lib/socket';
import { useTranslation } from '@/hooks/useTranslation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface Props {
  children: ReactNode;
}

export default function StaffLayout({ children }: Props) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const branchId = selectBranchId(user);

  // Join the staff-specific room for real-time alerts
  useEffect(() => {
    if (!branchId) return;
    const room = `staff:${branchId}`;
    joinRoom(room);
    return () => leaveRoom(room);
  }, [branchId]);

  const navItems = [
    { label: t('pickup'), href: '/staff', icon: ClipboardList },
    { label: t('tables' as any), href: '/staff/tables', icon: LayoutGrid },
    { label: t('alerts' as any), href: '/staff/alerts', icon: Bell },
  ];

  return (
    <AuthGuard allowedRoles={[Role.RESTAURANT_ADMIN, Role.MANAGER, Role.STAFF]}>
      <div className="min-h-screen bg-background pb-24 transition-colors duration-300">
        {/* Header */}
        <header className="bg-surface/90 backdrop-blur border-b border-surface-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-foreground flex items-center justify-center text-background shadow-lg">
              <User size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base font-black text-foreground leading-none tracking-tight">{t('staffPanel')}</h1>
              <p className="text-[11px] text-foreground/40 font-bold mt-1 uppercase tracking-widest">
                {user?.name} • {t(user?.role?.toLowerCase() as any)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button 
              onClick={logout}
              className="w-10 h-10 rounded-2xl bg-surface-100 flex items-center justify-center text-foreground/40 hover:text-red-500 transition-colors active:scale-90"
              title={t('logout')}
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main>{children}</main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 inset-x-0 bg-surface/80 backdrop-blur-xl border-t border-surface-200 px-8 py-3 pb-safe z-50 flex items-center justify-between shadow-[0_-8px_30px_rgba(0,0,0,0.08)] rounded-t-[2.5rem] transition-colors duration-300">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className="flex flex-col items-center gap-1.5 min-w-[70px] relative group"
              >
                <div className={`relative p-2 rounded-2xl transition-all duration-300 ${
                  isActive ? 'text-background bg-foreground shadow-xl shadow-foreground/10 scale-110' : 'text-foreground/40 hover:bg-surface-100'
                }`}>
                  <Icon size={24} strokeWidth={isActive ? 3 : 2} />
                </div>
                <span className={`text-[11px] font-black tracking-tight transition-colors ${
                  isActive ? 'text-foreground' : 'text-foreground/40'
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="activeNavIndicator"
                    className="absolute -top-3 w-1 h-1 rounded-full bg-brand-500"
                    initial={false}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </AuthGuard>
  );
}
