'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Save,
  Building2,
  Percent,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAuthStore, selectBranchId } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import Link from 'next/link';

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const branchId = selectBranchId(user);
  const qc = useQueryClient();

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') =>
    setToast({ message, type });

  const { data: branch, isLoading } = useQuery({
    queryKey: ['admin-branch', branchId],
    queryFn: () => adminApi.getBranch(branchId),
    enabled: !!branchId,
  });

  const [branchName, setBranchName] = useState('');
  const [vatRate, setVatRate] = useState('');
  const [serviceRate, setServiceRate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (branch) {
      setBranchName(branch.name || '');
      setVatRate(String(branch.vatRate ?? 15));
      setServiceRate(String(branch.serviceChargeRate ?? 10));
    }
  }, [branch]);

  const handleSave = async () => {
    if (!branchId) return;
    setSaving(true);
    try {
      await adminApi.updateBranch(branchId, {
        name: branchName,
        vatRate: parseFloat(vatRate) || 15,
        serviceChargeRate: parseFloat(serviceRate) || 10,
      });
      qc.invalidateQueries({ queryKey: ['admin-branch'] });
      showToast(t('branchSettingsSaved'));
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || t('operationFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminHeader title={t('settings')} onLogout={logout} />

      <ToastContainer>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </ToastContainer>

      <main className="p-4 pb-12 space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Branch Settings ─────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-2xl p-5 shadow-sm border border-surface-200 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                  <Building2 size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{t('branchSettings')}</h3>
                  <p className="text-[10px] text-foreground/40">{t('currentBranchConfig')}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1 block">{t('branchName')}</label>
                  <input value={branchName} onChange={(e) => setBranchName(e.target.value)}
                    className="w-full bg-surface-100 text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-surface-200 focus:border-brand-500 transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1 flex items-center gap-1">
                      <Percent size={10} /> {t('vatRate')}
                    </label>
                    <div className="relative">
                      <input type="number" value={vatRate} onChange={(e) => setVatRate(e.target.value)}
                        className="w-full bg-surface-100 text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-surface-200 focus:border-brand-500 pr-8 transition-colors" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/20 text-sm">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1 flex items-center gap-1">
                      <Percent size={10} /> {t('serviceCharge')}
                    </label>
                    <div className="relative">
                      <input type="number" value={serviceRate} onChange={(e) => setServiceRate(e.target.value)}
                        className="w-full bg-surface-100 text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-surface-200 focus:border-brand-500 pr-8 transition-colors" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/20 text-sm">%</span>
                    </div>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
                  className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-brand-500 text-white">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> {t('saveChanges')}</>}
                </motion.button>
              </div>
            </motion.div>

            {/* ── Subscription Banner ──────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
              <Link href="/admin/subscription">
                <div className="relative overflow-hidden bg-gradient-to-r from-brand-500 to-indigo-600 rounded-2xl p-5 shadow-lg cursor-pointer group">
                  <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
                  <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/5" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <CreditCard size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[9px] font-black uppercase tracking-wider rounded-full px-2 py-0.5 mb-1">
                        ✨ {t('trialing' as any)}
                      </span>
                      <p className="text-white font-bold text-sm">{t('manageSubscription')}</p>
                      <p className="text-white/70 text-[10px]">{t('viewPlansUpgrade')}</p>
                    </div>
                    <ChevronRight size={18} className="text-white/70 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* ── System Info ──────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-surface rounded-2xl p-5 shadow-sm border border-surface-200 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center shadow-md">
                  <Settings size={18} className="text-white" />
                </div>
                <h3 className="font-bold text-foreground text-sm">{t('systemInfo')}</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-surface-200">
                  <span className="text-foreground/40">Branch ID</span>
                  <span className="text-foreground/60 font-mono text-[10px]">{branchId || '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-surface-200">
                  <span className="text-foreground/40">{t('appVersion')}</span>
                  <span className="text-foreground/60 font-mono">1.0.0</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-foreground/40">API</span>
                  <span className="text-foreground/60 font-mono text-[10px]">{process.env.NEXT_PUBLIC_API_URL || 'localhost:3001'}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </main>
    </>
  );
}
