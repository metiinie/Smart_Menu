'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { GitBranch, Search, MapPin, Phone, Table2, Users } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function SuperAdminBranchesPage() {
  const { t } = useTranslation();
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
        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-0.5">{t('tenantData')}</p>
        <h1 className="text-2xl font-black text-foreground tracking-tight">{t('allBranches')}</h1>
        <p className="text-sm text-foreground/40 mt-1">{t('everyBranchAcrossRestaurants')}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/20" />
          <input
            className="w-full bg-surface border border-surface-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-foreground/20 focus:outline-none focus:border-brand-500/30 transition-all"
            placeholder={t('searchByNameRestaurantAddress')}
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs font-semibold text-foreground/40 bg-surface border border-surface-200 px-3 py-2.5 rounded-xl">
          {filtered.length} {t('branchesCount')}
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((branch: any, i: number) => (
            <motion.div key={branch.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-surface border border-surface-200 rounded-2xl p-5 hover:border-brand-500/30 transition-all duration-300">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center shrink-0">
                  <GitBranch size={16} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{branch.name}</p>
                  <p className="text-[10px] text-violet-500 font-semibold mt-0.5">
                    {branch.restaurant?.name ?? t('unknownRestaurant')}
                    {!branch.restaurant?.isActive && (
                      <span className="ml-2 text-rose-500">({t('suspended')})</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-foreground/40 mb-4">
                {branch.address && branch.address !== 'To be configured' && (
                  <div className="flex items-center gap-1.5"><MapPin size={11} />{branch.address}</div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-1.5"><Phone size={11} />{branch.phone}</div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-foreground/60 bg-surface-100 px-3 py-1.5 rounded-lg border border-surface-200">
                  <Table2 size={12} className="text-foreground/20" />
                  {branch._count?.tables ?? 0} {t('tables')}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-foreground/60 bg-surface-100 px-3 py-1.5 rounded-lg border border-surface-200">
                  <Users size={12} className="text-foreground/20" />
                  {branch._count?.users ?? 0} {t('staff')}
                </div>
                <span className="ml-auto text-[10px] text-foreground/20">
                  {new Date(branch.createdAt).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-16 text-slate-500 text-sm">{t('noBranchesFound')}</div>
          )}
        </div>
      )}
    </div>
  );
}
