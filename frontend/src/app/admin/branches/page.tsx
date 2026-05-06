'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Store,
  Plus,
  Pencil,
  Trash2,
  X,
  MapPin,
  Phone,
  Percent,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Toast, ToastContainer } from '@/components/ui/Toast';

// ── Add/Edit Branch Drawer ─────────────────────────────────────────────────
interface BranchFormProps {
  branch?: any;
  onClose: () => void;
  onSaved: () => void;
}
function BranchDrawer({ branch, onClose, onSaved }: BranchFormProps) {
  const { t } = useTranslation();
  const isEdit = !!branch;
  const [name, setName] = useState(branch?.name ?? '');
  const [address, setAddress] = useState(branch?.address ?? '');
  const [phone, setPhone] = useState(branch?.phone ?? '');
  const [vatRate, setVatRate] = useState(branch?.vatRate?.toString() ?? '15');
  const [serviceChargeRate, setServiceChargeRate] = useState(branch?.serviceChargeRate?.toString() ?? '10');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return setError(t('required'));
    if (!address.trim()) return setError(t('required'));
    
    setSaving(true);
    setError('');
    const payload = {
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim() || undefined,
      vatRate: parseFloat(vatRate) || 0,
      serviceChargeRate: parseFloat(serviceChargeRate) || 0,
    };

    try {
      if (isEdit) {
        await adminApi.updateBranch(branch.id, payload);
      } else {
        await adminApi.createBranch(payload);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || t('operationFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl p-6 shadow-2xl max-w-lg mx-auto border-t border-surface-200"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-foreground text-lg">{isEdit ? t('editBranch') : t('addNewBranch')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center transition-colors">
            <X size={16} className="text-foreground/40" />
          </button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar pb-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1 block">{t('branchName')}</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Downtown Branch"
              className="w-full bg-surface-100 text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-surface-200 focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1 block">{t('address')}</label>
            <input
              value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St..."
              className="w-full bg-surface-100 text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-surface-200 focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1 block">{t('phone')} ({t('optional')})</label>
            <input
              value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+123456789"
              className="w-full bg-surface-100 text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-surface-200 focus:border-brand-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1 block">{t('vatRatePercent')}</label>
              <input
                type="number" step="0.1"
                value={vatRate} onChange={(e) => setVatRate(e.target.value)}
                className="w-full bg-surface-100 text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-surface-200 focus:border-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1 block">{t('serviceChargePercent')}</label>
              <input
                type="number" step="0.1"
                value={serviceChargeRate} onChange={(e) => setServiceChargeRate(e.target.value)}
                className="w-full bg-surface-100 text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-surface-200 focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={saving}
            className="w-full py-3.5 rounded-xl bg-brand-500 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
              <><Store size={16} /> {isEdit ? t('saveChanges') : t('addBranch')}</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

export default function BranchesManagementPage() {
  const { t } = useTranslation();
  const { logout } = useAuthStore();
  const qc = useQueryClient();

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [drawer, setDrawer] = useState<{ open: boolean; branch?: any }>({ open: false });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') =>
    setToast({ message, type });

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: () => adminApi.getBranches(),
  });

  const handleDelete = async (b: any) => {
    if (!confirm(t('deleteBranchConfirm'))) return;
    try {
      await adminApi.deleteBranch(b.id);
      qc.invalidateQueries({ queryKey: ['admin-branches'] });
      showToast(t('success'));
    } catch (e: any) {
      showToast(e.response?.data?.message || e.message || t('operationFailed'), 'error');
    }
  };

  return (
    <>
      <AdminHeader title={t('branchManagement')} onLogout={logout} />

      <ToastContainer>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </ToastContainer>

      <main className="p-4 pb-12 space-y-5">
        <div className="bg-surface rounded-3xl p-5 shadow-sm border border-surface-200 transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Store size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">{t('yourBranches')}</h3>
                <p className="text-xs text-foreground/40">{branches.length} {t('registeredLocations')}</p>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => setDrawer({ open: true, branch: undefined })}
              className="flex items-center gap-2 bg-brand-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-600 transition-colors">
              <Plus size={16} /> Add Branch
            </motion.button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branches.length === 0 ? (
                <div className="col-span-full text-center py-16 bg-surface-100 rounded-2xl border border-dashed border-surface-200">
                  <Store size={40} className="mx-auto text-foreground/10 mb-3" />
                  <p className="text-foreground/40 font-semibold">{t('noBranchesYet')}</p>
                  <p className="text-xs text-foreground/20 mt-1">{t('addFirstBranch')}</p>
                </div>
              ) : (
                branches.map((b: any, i: number) => (
                  <motion.div key={b.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex flex-col p-5 rounded-2xl border bg-surface border-surface-200 shadow-sm hover:shadow-md transition-all duration-300">
                    
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-foreground">{b.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-foreground/40 mt-1">
                          <MapPin size={12} className="text-brand-500" />
                          <span>{b.address || t('noData')}</span>
                        </div>
                      </div>
                      <span className="inline-flex px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 text-[10px] font-bold uppercase">
                        {t('active')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-5">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-100 border border-surface-200">
                        <Phone size={14} className="text-foreground/20" />
                        <span className="text-xs font-medium text-foreground/60 truncate">{b.phone || t('noData')}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-100 border border-surface-200">
                        <Percent size={14} className="text-foreground/20" />
                        <span className="text-xs font-medium text-foreground/60">VAT: {b.vatRate}% | SC: {b.serviceChargeRate}%</span>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-end gap-2 pt-4 border-t border-surface-200">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setDrawer({ open: true, branch: b })}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-semibold hover:bg-blue-500/20 transition-colors">
                        <Pencil size={12} /> {t('edit')}
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(b)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 text-xs font-semibold hover:bg-rose-500/20 transition-colors">
                        <Trash2 size={12} /> {t('delete')}
                      </motion.button>
                    </div>

                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {drawer.open && (
          <BranchDrawer
            branch={drawer.branch}
            onClose={() => setDrawer({ open: false })}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ['admin-branches'] });
              showToast(drawer.branch ? t('branchUpdated') : t('branchCreated'));
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
