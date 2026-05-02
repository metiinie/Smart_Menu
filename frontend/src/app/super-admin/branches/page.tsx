'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { GitBranch, Search, MapPin, Phone, Table2, Users } from 'lucide-react';

export default function SuperAdminBranchesPage() {
  const [search, setSearch] = useState('');

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['platform-branches'],
    queryFn: () => superAdminApi.getAllBranches(),
  });

  const filtered = (branches as any[]).filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.restaurant?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (b.address ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-0.5">Tenant Data</p>
        <h1 className="text-2xl font-black text-white tracking-tight">All Branches</h1>
        <p className="text-sm text-slate-500 mt-1">Every branch across all restaurants on the platform.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-all"
            placeholder="Search by name, restaurant, address…"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-900 border border-slate-800 px-3 py-2.5 rounded-xl">
          {filtered.length} branches
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((branch: any, i: number) => (
            <motion.div key={branch.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/60 transition-all">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center shrink-0">
                  <GitBranch size={16} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-100 truncate">{branch.name}</p>
                  <p className="text-[10px] text-violet-400 font-semibold mt-0.5">
                    {branch.restaurant?.name ?? 'Unknown Restaurant'}
                    {!branch.restaurant?.isActive && (
                      <span className="ml-2 text-rose-400">(Suspended)</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                {branch.address && branch.address !== 'To be configured' && (
                  <div className="flex items-center gap-1.5"><MapPin size={11} />{branch.address}</div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-1.5"><Phone size={11} />{branch.phone}</div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800/40">
                  <Table2 size={12} className="text-slate-500" />
                  {branch._count?.tables ?? 0} tables
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800/40">
                  <Users size={12} className="text-slate-500" />
                  {branch._count?.users ?? 0} staff
                </div>
                <span className="ml-auto text-[10px] text-slate-600">
                  {new Date(branch.createdAt).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-16 text-slate-500 text-sm">No branches found.</div>
          )}
        </div>
      )}
    </div>
  );
}
