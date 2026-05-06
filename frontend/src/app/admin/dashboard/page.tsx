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
import { useTranslation } from '@/hooks/useTranslation';

// ── Component ──────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();

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
        title={t('dashboard')} 
        onLogout={logout}
        titleBadge={
          avgRating > 0 ? (
            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full text-xs font-bold border border-amber-500/20">
              <Star size={12} className="fill-amber-500" />
              {avgRating.toFixed(1)} {t('avg')}
            </div>
          ) : undefined
        }
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => refetch()}
          aria-label={t('refresh')}
          className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center transition-colors"
        >
          <RefreshCw size={14} className={`text-foreground/60 ${isFetching ? 'animate-spin' : ''}`} />
        </motion.button>
      </AdminHeader>

      <main className="p-4 pb-12 space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : !analytics ? (
          <p className="text-center text-foreground/40 py-20">{t('noData')}</p>
        ) : (
          <>
            {/* ── Revenue Cards ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                icon={DollarSign}
                label={t('todayRevenue')}
                value={`ETB ${fmt(analytics.todayRevenue)}`}
                sub={`${analytics.todayOrders} ${t('ordersToday')}`}
                gradient="from-emerald-500 to-teal-600"
                delay={0}
              />
              <MetricCard
                icon={CalendarDays}
                label={t('thisWeek')}
                value={`ETB ${fmt(analytics.weekRevenue)}`}
                sub={`${analytics.weekOrders} ${t('orders')}`}
                gradient="from-blue-500 to-indigo-600"
                delay={0.05}
              />
              <MetricCard
                icon={TrendingUp}
                label={t('totalRevenue')}
                value={`ETB ${fmt(analytics.totalRevenue)}`}
                sub={`${analytics.totalOrders} ${t('ordersAllTime')}`}
                gradient="from-violet-500 to-purple-600"
                delay={0.1}
              />
              <MetricCard
                icon={Zap}
                label={t('pendingOrders')}
                value={analytics.pendingOrders.toString()}
                sub={`${analytics.activeTables}/${analytics.totalTables} ${t('tables')} ${t('active')}`}
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
                className="bg-surface rounded-2xl p-4 shadow-sm border border-surface-200 transition-colors duration-300"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                    <BarChart3 size={16} className="text-brand-500" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">{t('revenue7Days')}</h3>
                </div>
                <div className="flex items-end gap-2 h-32">
                  {analytics.revenueByDay.map((day: any, i: number) => {
                    const maxRev = Math.max(...analytics.revenueByDay.map((d: any) => d.revenue), 1);
                    const pct = (day.revenue / maxRev) * 100;
                    const dayName = dayNames[new Date(day.date).getDay()];
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold text-foreground/40 tabular-nums">
                          {day.revenue > 0 ? fmt(day.revenue) : ''}
                        </span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(pct, 4)}%` }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                          className="w-full rounded-lg bg-gradient-to-t from-brand-500 to-brand-400 min-h-[4px]"
                        />
                        <span className="text-[10px] font-semibold text-foreground/20">{dayName}</span>
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
                className="bg-surface rounded-2xl p-4 shadow-sm border border-surface-200 transition-colors duration-300"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <ShoppingCart size={16} className="text-violet-500" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">{t('orders')} {t('byStatus')}</h3>
                </div>
                <div className="space-y-2">
                  {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${statusDotColor(status)}`} />
                        <span className="text-xs font-semibold text-foreground/60 capitalize">
                          {t(status.toLowerCase())}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-foreground tabular-nums">
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
                className="bg-surface rounded-2xl p-4 shadow-sm border border-surface-200 transition-colors duration-300"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Award size={16} className="text-amber-500" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">{t('topDishes')}</h3>
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
                        <p className="text-sm font-semibold text-foreground truncate">{dish.name}</p>
                        <p className="text-[10px] text-foreground/40">
                          ETB {dish.price} · {dish.orderCount} {t('orders')}
                        </p>
                      </div>
                      <span className="text-sm font-black text-brand-500 tabular-nums">
                        {dish.totalSold} {t('sold')}
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
              className="bg-surface rounded-2xl p-4 shadow-sm border border-surface-200 transition-colors duration-300"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <Bug size={16} className="text-rose-500" />
                </div>
                <h3 className="font-bold text-foreground text-sm">{t('orderAudit')}</h3>
              </div>
              {orderAudit.length === 0 ? (
                <p className="text-xs text-foreground/40">{t('noAuditEvents')}</p>
              ) : (
                <div className="space-y-2.5">
                  {orderAudit.map((entry: any) => (
                    <div key={entry.id} className="rounded-xl border border-surface-200 bg-surface-100 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${auditColor(entry.status)}`}>
                          {t(entry.status.toLowerCase()) || entry.status}
                        </span>
                        <span className="text-[10px] text-foreground/40 font-mono">
                          {new Date(entry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/70 mt-1">
                        {entry.displayNumber ? `${t('order')} #${entry.displayNumber}` : t('orderAttempt')}
                        {entry.reason ? ` · ${entry.reason}` : ''}
                      </p>
                      <p className="text-[10px] text-foreground/20 mt-1 font-mono">
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
                className="bg-surface rounded-2xl p-4 shadow-sm border border-surface-200 md:col-span-2 transition-colors duration-300"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Star size={16} className="text-amber-500 fill-amber-500" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">{t('recentReviews')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analytics.recentRatings.map((rating: any, i: number) => (
                    <div key={rating.id} className="bg-surface-100 rounded-xl p-4 border border-surface-200 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              className={star <= rating.rating ? "text-amber-400 fill-amber-400" : "text-foreground/10"}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-foreground/40 font-medium">
                          {new Date(rating.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {rating.comment ? (
                        <p className="text-xs text-foreground/80 italic">&quot;{rating.comment}&quot;</p>
                      ) : (
                        <p className="text-xs text-foreground/40 italic">{t('noComment')}</p>
                      )}
                      
                      <div className="mt-auto pt-2 border-t border-surface-200 flex items-center justify-between text-[10px] text-foreground/40">
                        {rating.menuItem ? (
                          <span className="font-semibold text-foreground/70">{rating.menuItem.name}</span>
                        ) : (
                          <span>{t('overallExperience')}</span>
                        )}
                        {rating.order && (
                          <span className="font-mono bg-surface px-1.5 py-0.5 rounded border border-surface-200">
                            {t('order')} #{rating.order.displayNumber}
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
    case 'CREATED':   return 'bg-blue-500';
    case 'CONFIRMED': return 'bg-indigo-500';
    case 'PREPARING': return 'bg-amber-500';
    case 'READY':     return 'bg-emerald-500';
    case 'DELIVERED': return 'bg-foreground/20';
    default:          return 'bg-foreground/10';
  }
}

function rankBadgeColor(index: number): string {
  switch (index) {
    case 0:  return 'bg-amber-500 text-white';
    case 1:  return 'bg-surface-200 text-foreground/60';
    case 2:  return 'bg-amber-800 text-white';
    default: return 'bg-surface-100 text-foreground/40';
  }
}

function auditColor(status: string): string {
  switch (status) {
    case 'CREATED':
    case 'STATUS_UPDATED':
      return 'text-emerald-500';
    case 'ATTEMPT':
      return 'text-blue-500';
    case 'SESSION_EXPIRED':
    case 'ITEM_UNAVAILABLE':
    case 'REJECTED':
      return 'text-rose-500';
    default:
      return 'text-foreground/40';
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
      className="relative overflow-hidden bg-surface rounded-2xl p-4 shadow-sm border border-surface-200 transition-colors duration-300"
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-md`}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-0.5">{label}</p>
      <p className="text-lg font-black text-foreground leading-tight">{value}</p>
      <p className="text-[10px] text-foreground/40 mt-0.5">{sub}</p>
    </motion.div>
  );
}
