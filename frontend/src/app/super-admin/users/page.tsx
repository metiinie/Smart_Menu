'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { Search, Users, Filter } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const ROLES = ['ALL', 'SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER', 'KITCHEN', 'STAFF'];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  RESTAURANT_ADMIN: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
  MANAGER: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  KITCHEN: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  STAFF: 'text-foreground/40 bg-surface-100 border-surface-200',
};

export default function SuperAdminUsersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['platform-users', roleFilter, activeFilter],
    queryFn: () =>
      superAdminApi.getAllUsers({
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
      }),
  });

  const filtered = (users as any[]).filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.restaurant?.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-0.5">{t('tenantData')}</p>
        <h1 className="text-2xl font-black text-foreground tracking-tight">{t('allUsers')}</h1>
        <p className="text-sm text-foreground/40 mt-1">{t('allStaffAccounts')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/20" />
          <input
            className="w-64 bg-surface border border-surface-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-foreground/20 focus:outline-none focus:border-brand-500/30 transition-all"
            placeholder={t('searchNameEmailRestaurant')}
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 bg-surface border border-surface-200 rounded-xl p-1">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${activeFilter === f ? 'bg-surface-200 text-foreground' : 'text-foreground/40 hover:text-foreground/60'}`}>
              {t(f)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-foreground/20" />
          <select
            className="bg-surface border border-surface-200 rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-brand-500/30 transition-all"
            value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{r === 'ALL' ? t('allRoles') : r.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <span className="text-xs text-foreground/40 bg-surface border border-surface-200 px-3 py-2.5 rounded-xl">
          {filtered.length} {t('usersCount')}
        </span>
      </div>

      {/* Table */}
      <div className="bg-surface border border-surface-200 rounded-2xl overflow-hidden transition-colors duration-300">
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-200 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                <th className="px-6 py-4">{t('user')}</th>
                <th className="px-6 py-4">{t('role')}</th>
                <th className="px-6 py-4">{t('restaurant')}</th>
                <th className="px-6 py-4">{t('branch')}</th>
                <th className="px-6 py-4">{t('status')}</th>
                <th className="px-6 py-4">{t('joined')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {filtered.map((user: any, i: number) => (
                <motion.tr key={user.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="hover:bg-surface-100 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-surface-200 flex items-center justify-center shrink-0">
                        <span className="text-xs font-black text-foreground/40">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{user.name}</p>
                        <p className="text-[10px] text-foreground/40">{user.email ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${ROLE_COLORS[user.role] ?? 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                      {user.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs text-foreground/60">{user.restaurant?.name ?? <span className="text-foreground/20 italic">{t('platform')}</span>}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs text-foreground/40">{user.branch?.name ?? '—'}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${user.isActive ? 'text-emerald-500 bg-emerald-500/10' : 'text-foreground/20 bg-surface-100'}`}>
                      {user.isActive ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-[10px] text-foreground/40">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500 text-sm">{t('noUsersFound')}</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
