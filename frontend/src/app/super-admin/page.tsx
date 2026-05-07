'use client';

import { useQuery } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/api';
import {
  Store,
  Users,
  GitBranch,
  ShoppingBag,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="relative bg-surface border border-surface-200 rounded-2xl p-5 overflow-hidden group hover:border-brand-500/30 transition-all duration-300">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${accent} pointer-events-none opacity-[0.03]`} />
      <div className="relative">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${accent.replace('from-', 'from-').replace('/5', '/20').replace('/10', '/30')}`}>
          <Icon size={18} className="text-white/80" />
        </div>
        <p className="text-3xl font-black text-foreground tracking-tight mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">{label}</p>
        {sub && <p className="text-xs text-foreground/20 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function SubStatusBadge({ status, count }: { status: string; count: number }) {
  const { t } = useTranslation();
  const config: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: t('active'), color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    TRIALING: { label: t('trialing'), color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    PAST_DUE: { label: t('pastDue'), color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    CANCELED: { label: t('canceled'), color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  };
  const c = config[status] ?? { label: status, color: 'text-slate-400 bg-slate-800 border-slate-700' };
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${c.color}`}>{c.label}</span>
      <span className="text-2xl font-black text-foreground">{count}</span>
    </div>
  );
}

export default function SuperAdminOverviewPage() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: superAdminApi.getStats,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  const breakdown = stats?.subscriptionBreakdown ?? {};

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-rose-500" />
          <span className="text-xs font-black uppercase tracking-widest text-rose-500">{t('overview')}</span>
        </div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">{t('platformControl')}</h1>
        <p className="text-foreground/40 text-sm mt-1">{t('realTimeSnapshot')}</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label={t('restaurants')}
          value={stats?.totalRestaurants ?? 0}
          sub={`${stats?.activeRestaurants ?? 0} ${t('active').toLowerCase()} · ${stats?.suspendedRestaurants ?? 0} ${t('suspended').toLowerCase()}`}
          icon={Store}
          accent="from-rose-500/5 to-rose-600/10"
        />
        <StatCard
          label={t('users')}
          value={stats?.totalUsers ?? 0}
          sub={t('activeStaff')}
          icon={Users}
          accent="from-violet-500/5 to-violet-600/10"
        />
        <StatCard
          label={t('branches')}
          value={stats?.totalBranches ?? 0}
          sub={t('acrossAllRestaurants')}
          icon={GitBranch}
          accent="from-blue-500/5 to-blue-600/10"
        />
        <StatCard
          label={t('orders')}
          value={stats?.totalOrders ?? 0}
          sub={t('allTimeOrders')}
          icon={ShoppingBag}
          accent="from-amber-500/5 to-amber-600/10"
        />
        <StatCard
          label={t('revenue')}
          value={`ETB ${(stats?.platformRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub={t('allTimeGrossRevenue')}
          icon={TrendingUp}
          accent="from-emerald-500/5 to-emerald-600/10"
        />
        <StatCard
          label={t('newThisMonth')}
          value={stats?.newThisMonth ?? 0}
          sub={t('restaurantsRegistered')}
          icon={CreditCard}
          accent="from-pink-500/5 to-pink-600/10"
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active vs Suspended */}
        <div className="bg-surface border border-surface-200 rounded-2xl p-6 transition-colors duration-300">
          <h3 className="text-sm font-bold text-foreground mb-5">{t('restaurantStatus')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-sm font-semibold text-foreground/60">{t('active')}</span>
              </div>
              <span className="text-xl font-black text-emerald-500">{stats?.activeRestaurants ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl">
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-rose-500" />
                <span className="text-sm font-semibold text-foreground/60">{t('suspended')}</span>
              </div>
              <span className="text-xl font-black text-rose-500">{stats?.suspendedRestaurants ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Subscription Breakdown */}
        <div className="bg-surface border border-surface-200 rounded-2xl p-6 transition-colors duration-300">
          <h3 className="text-sm font-bold text-foreground mb-5">{t('subscriptionBreakdown')}</h3>
          <div className="space-y-3">
            {(['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED'] as const).map((status) => (
              <SubStatusBadge
                key={status}
                status={status}
                count={breakdown[status] ?? 0}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
