'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Award,
  BarChart3,
  RefreshCw,
  CalendarDays,
  Zap,
  Bug,
  Star
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAuthStore, selectBranchId } from '@/stores/authStore';

// ── Component ──────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user, logout } = useAuthStore();

  // Resolve branchId from the authenticated user — NOT from a stale env var
  const branchId = selectBranchId(user);

  const { data: analytics, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-dashboard', branchId],
    queryFn: () => adminApi.getDashboard(branchId),
    enabled: !!user && !!branchId,
    refetchInterval: 30_000,
  });
  const { data: orderAudit = [] } = useQuery({
    queryKey: ['admin-order-audit', branchId],
    queryFn: () => adminApi.getOrderAudit(branchId, 12),
    enabled: !!user && !!branchId,
    refetchInterval: 10_000,
  });

  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0));
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate average rating
  const avgRating = analytics?.recentRatings?.length
    ? analytics.recentRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / analytics.recentRatings.length
    : 0;

  return (
    <>
      <AdminHeader 
        title="Dashboard" 
        onLogout={logout}
        titleBadge={
          avgRating > 0 ? (
            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full text-xs font-bold border border-amber-500/20">
              <Star size={12} className="fill-amber-500" />
              {avgRating.toFixed(1)} Avg
            </div>
          ) : undefined
        }
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => refetch()}
          aria-label="Refresh dashboard"
          className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center"
        >
          <RefreshCw size={14} className={`text-white/60 ${isFetching ? 'animate-spin' : ''}`} />
        </motion.button>
      </AdminHeader>

      <main className="p-4 pb-12 space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : !analytics ? (
          <p className="text-center text-slate-400 py-20">No analytics data available</p>
        ) : (
          <>
            {/* ── Revenue Cards ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                icon={DollarSign}
                label="Today's Revenue"
                value={`ETB ${fmt(analytics.todayRevenue)}`}
                sub={`${analytics.todayOrders} orders today`}
                gradient="from-emerald-500 to-teal-600"
                delay={0}
              />
              <MetricCard
                icon={CalendarDays}
                label="This Week"
                value={`ETB ${fmt(analytics.weekRevenue)}`}
                sub={`${analytics.weekOrders} orders`}
                gradient="from-blue-500 to-indigo-600"
                delay={0.05}
              />
              <MetricCard
                icon={TrendingUp}
                label="Total Revenue"
                value={`ETB ${fmt(analytics.totalRevenue)}`}
                sub={`${analytics.totalOrders} orders all-time`}
                gradient="from-violet-500 to-purple-600"
                delay={0.1}
              />
              <MetricCard
                icon={Zap}
                label="Pending Orders"
                value={analytics.pendingOrders.toString()}
                sub={`${analytics.activeTables}/${analytics.totalTables} tables active`}
                gradient="from-amber-500 to-orange-600"
                delay={0.15}
              />
            </div>

            {/* ── 7-Day Revenue Bar Chart ───────────────────────────── */}
            {analytics.revenueByDay?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                    <BarChart3 size={16} className="text-brand-500" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Revenue (7 Days)</h3>
                </div>
                <div className="flex items-end gap-2 h-32">
                  {analytics.revenueByDay.map((day: any, i: number) => {
                    const maxRev = Math.max(...analytics.revenueByDay.map((d: any) => d.revenue), 1);
                    const pct = (day.revenue / maxRev) * 100;
                    const dayName = dayNames[new Date(day.date).getDay()];
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold text-slate-500 tabular-nums">
                          {day.revenue > 0 ? fmt(day.revenue) : ''}
                        </span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(pct, 4)}%` }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                          className="w-full rounded-lg bg-gradient-to-t from-brand-500 to-brand-400 min-h-[4px]"
                        />
                        <span className="text-[10px] font-semibold text-slate-400">{dayName}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Orders by Status ──────────────────────────────────── */}
            {analytics.ordersByStatus && Object.keys(analytics.ordersByStatus).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <ShoppingCart size={16} className="text-violet-500" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Orders by Status</h3>
                </div>
                <div className="space-y-2">
                  {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${statusDotColor(status)}`} />
                        <span className="text-xs font-semibold text-slate-600 capitalize">
                          {status.toLowerCase()}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 tabular-nums">
                        {count as number}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Top Dishes ────────────────────────────────────────── */}
            {analytics.topDishes?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Award size={16} className="text-amber-500" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Top Selling Dishes</h3>
                </div>
                <div className="space-y-2.5">
                  {analytics.topDishes.map((dish: any, i: number) => (
                    <motion.div
                      key={dish.menuItemId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.04 }}
                      className="flex items-center gap-3"
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${rankBadgeColor(i)}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{dish.name}</p>
                        <p className="text-[10px] text-slate-400">
                          ETB {dish.price} · {dish.orderCount} orders
                        </p>
                      </div>
                      <span className="text-sm font-black text-brand-600 tabular-nums">
                        {dish.totalSold} sold
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <Bug size={16} className="text-rose-500" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Recent Order Audit</h3>
              </div>
              {orderAudit.length === 0 ? (
                <p className="text-xs text-slate-400">No recent order audit events.</p>
              ) : (
                <div className="space-y-2.5">
                  {orderAudit.map((entry: any) => (
                    <div key={entry.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${auditColor(entry.status)}`}>
                          {entry.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(entry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">
                        {entry.displayNumber ? `Order #${entry.displayNumber}` : 'Order attempt'}
                        {entry.reason ? ` · ${entry.reason}` : ''}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">
                        table:{entry.tableId?.slice?.(-6) ?? '-'} session:{entry.sessionId?.slice?.(-6) ?? '-'} customer:{entry.customerRef?.slice?.(0, 6) ?? '-'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ── Recent Ratings ────────────────────────────────────── */}
            {analytics.recentRatings?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 md:col-span-2"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Star size={16} className="text-amber-500 fill-amber-500" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Recent Reviews</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analytics.recentRatings.map((rating: any, i: number) => (
                    <div key={rating.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              className={star <= rating.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(rating.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {rating.comment ? (
                        <p className="text-xs text-slate-700 italic">&quot;{rating.comment}&quot;</p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No comment provided.</p>
                      )}
                      
                      <div className="mt-auto pt-2 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-500">
                        {rating.menuItem ? (
                          <span className="font-semibold text-slate-700">{rating.menuItem.name}</span>
                        ) : (
                          <span>Overall Experience</span>
                        )}
                        {rating.order && (
                          <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            Order #{rating.order.displayNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </main>
    </>
  );
}

// ── Pure helpers ───────────────────────────────────────────────────────────

function statusDotColor(status: string): string {
  switch (status) {
    case 'CREATED':   return 'bg-blue-400';
    case 'CONFIRMED': return 'bg-indigo-400';
    case 'PREPARING': return 'bg-amber-400';
    case 'READY':     return 'bg-emerald-400';
    case 'DELIVERED': return 'bg-slate-300';
    default:          return 'bg-slate-300';
  }
}

function rankBadgeColor(index: number): string {
  switch (index) {
    case 0:  return 'bg-amber-400 text-white';
    case 1:  return 'bg-slate-300 text-white';
    case 2:  return 'bg-amber-700 text-white';
    default: return 'bg-slate-100 text-slate-500';
  }
}

function auditColor(status: string): string {
  switch (status) {
    case 'CREATED':
    case 'STATUS_UPDATED':
      return 'text-emerald-600';
    case 'ATTEMPT':
      return 'text-blue-600';
    case 'SESSION_EXPIRED':
    case 'ITEM_UNAVAILABLE':
    case 'REJECTED':
      return 'text-rose-600';
    default:
      return 'text-slate-500';
  }
}

// ── MetricCard ─────────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  gradient: string;
  delay: number;
}

function MetricCard({ icon: Icon, label, value, sub, gradient, delay }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-md`}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
      <p className="text-lg font-black text-slate-900 leading-tight">{value}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
    </motion.div>
  );
}
