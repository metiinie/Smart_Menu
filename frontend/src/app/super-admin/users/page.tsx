'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { Search, Users, Filter } from 'lucide-react';

const ROLES = ['ALL', 'SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER', 'KITCHEN', 'STAFF'];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  RESTAURANT_ADMIN: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  MANAGER: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  KITCHEN: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  STAFF: 'text-slate-400 bg-slate-800 border-slate-700',
};

export default function SuperAdminUsersPage() {
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
        <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-0.5">Tenant Data</p>
        <h1 className="text-2xl font-black text-white tracking-tight">All Users</h1>
        <p className="text-sm text-slate-500 mt-1">All staff accounts across every restaurant on the platform.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-64 bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-all"
            placeholder="Search name, email, restaurant…"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${activeFilter === f ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-slate-500" />
          <select
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-slate-600 transition-all"
            value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{r === 'ALL' ? 'All Roles' : r.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <span className="text-xs text-slate-500 bg-slate-900 border border-slate-800 px-3 py-2.5 rounded-xl">
          {filtered.length} users
        </span>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Restaurant</th>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((user: any, i: number) => (
                <motion.tr key={user.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                        <span className="text-xs font-black text-slate-300">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-100">{user.name}</p>
                        <p className="text-[10px] text-slate-500">{user.email ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${ROLE_COLORS[user.role] ?? 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                      {user.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs text-slate-300">{user.restaurant?.name ?? <span className="text-slate-600 italic">Platform</span>}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs text-slate-500">{user.branch?.name ?? '—'}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${user.isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-[10px] text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500 text-sm">No users found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
