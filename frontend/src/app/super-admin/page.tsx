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
    <div className="relative bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5 overflow-hidden group hover:border-slate-700/60 transition-all duration-200">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${accent} pointer-events-none`} />
      <div className="relative">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${accent.replace('from-', 'from-').replace('/5', '/20').replace('/10', '/30')}`}>
          <Icon size={18} className="text-white/80" />
        </div>
        <p className="text-3xl font-black text-white tracking-tight mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function SubStatusBadge({ status, count }: { status: string; count: number }) {
  const config: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'Active', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    TRIALING: { label: 'Trialing', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    PAST_DUE: { label: 'Past Due', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    CANCELED: { label: 'Canceled', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  };
  const c = config[status] ?? { label: status, color: 'text-slate-400 bg-slate-800 border-slate-700' };
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${c.color}`}>{c.label}</span>
      <span className="text-2xl font-black text-white">{count}</span>
    </div>
  );
}

export default function SuperAdminOverviewPage() {
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
          <Sparkles size={14} className="text-rose-400" />
          <span className="text-xs font-black uppercase tracking-widest text-rose-400">Platform Overview</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Control Center</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time snapshot of your entire platform.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Restaurants"
          value={stats?.totalRestaurants ?? 0}
          sub={`${stats?.activeRestaurants ?? 0} active · ${stats?.suspendedRestaurants ?? 0} suspended`}
          icon={Store}
          accent="from-rose-500/5 to-rose-600/10"
        />
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          sub="Active staff across all tenants"
          icon={Users}
          accent="from-violet-500/5 to-violet-600/10"
        />
        <StatCard
          label="Branches"
          value={stats?.totalBranches ?? 0}
          sub="Across all restaurants"
          icon={GitBranch}
          accent="from-blue-500/5 to-blue-600/10"
        />
        <StatCard
          label="Total Orders"
          value={stats?.totalOrders ?? 0}
          sub="All-time platform orders"
          icon={ShoppingBag}
          accent="from-amber-500/5 to-amber-600/10"
        />
        <StatCard
          label="Platform Revenue"
          value={`ETB ${(stats?.platformRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub="All-time gross revenue"
          icon={TrendingUp}
          accent="from-emerald-500/5 to-emerald-600/10"
        />
        <StatCard
          label="New This Month"
          value={stats?.newThisMonth ?? 0}
          sub="Restaurants registered"
          icon={CreditCard}
          accent="from-pink-500/5 to-pink-600/10"
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active vs Suspended */}
        <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-5">Restaurant Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="text-sm font-semibold text-slate-300">Active</span>
              </div>
              <span className="text-xl font-black text-emerald-400">{stats?.activeRestaurants ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl">
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-rose-400" />
                <span className="text-sm font-semibold text-slate-300">Suspended</span>
              </div>
              <span className="text-xl font-black text-rose-400">{stats?.suspendedRestaurants ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Subscription Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-5">Subscription Breakdown</h3>
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
