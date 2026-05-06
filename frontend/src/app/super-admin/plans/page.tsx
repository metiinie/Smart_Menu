'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Loader2, CreditCard, Users, GitBranch, DollarSign, Check } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type Plan = { id: string; name: string; maxBranches: number; maxStaff: number; priceMonthly: number; features?: Record<string, boolean>; _count?: { restaurants: number } };

const EMPTY_FORM = { name: '', maxBranches: 1, maxStaff: 5, priceMonthly: 0 };

function PlanModal({ plan, onClose }: { plan?: Plan; onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = !!plan;
  const [form, setForm] = useState({
    name: plan?.name ?? '',
    maxBranches: plan?.maxBranches ?? 1,
    maxStaff: plan?.maxStaff ?? 5,
    priceMonthly: plan?.priceMonthly ?? 0,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      isEdit
        ? superAdminApi.updatePlan(plan!.id, form)
        : superAdminApi.createPlan(form),
    onSuccess: () => {
      toast.success(isEdit ? t('planUpdated') : t('planCreated'));
      qc.invalidateQueries({ queryKey: ['platform-plans'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Operation failed'),
  });

  const valid = form.name.trim().length > 0 && form.priceMonthly >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="w-full max-w-md bg-surface border border-surface-200 rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300">
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-200">
          <h2 className="text-base font-black text-foreground">{isEdit ? t('editPlan') : t('newSubscriptionPlan')}</h2>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground/40 mb-1.5">{t('planName')} *</label>
            <input className="w-full bg-surface-100 border border-surface-200 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-foreground/20 focus:outline-none focus:border-rose-500/50 transition-all"
              placeholder="e.g. Starter, Pro, Enterprise"
              value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground/40 mb-1.5">{t('maxBranches')}</label>
              <input type="number" min={1} className="w-full bg-surface-100 border border-surface-200 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-rose-500/50 transition-all"
                value={form.maxBranches} onChange={(e) => setForm((f) => ({ ...f, maxBranches: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/40 mb-1.5">{t('maxStaff')}</label>
              <input type="number" min={1} className="w-full bg-surface-100 border border-surface-200 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-rose-500/50 transition-all"
                value={form.maxStaff} onChange={(e) => setForm((f) => ({ ...f, maxStaff: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground/40 mb-1.5">{t('priceMonth')} (ETB)</label>
            <input type="number" min={0} step={0.01} className="w-full bg-surface-100 border border-surface-200 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-rose-500/50 transition-all"
              value={form.priceMonthly} onChange={(e) => setForm((f) => ({ ...f, priceMonthly: Number(e.target.value) }))} />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-surface-200">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-foreground/40 bg-surface-100 hover:bg-surface-200 transition-colors">{t('cancel')}</button>
          <button onClick={() => mutate()} disabled={isPending || !valid}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-violet-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {isEdit ? t('saveChanges') : t('createPlan')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function SuperAdminPlansPage() {
  const { t } = useTranslation();
  const [modal, setModal] = useState<null | 'create' | Plan>(null);
  const qc = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({ queryKey: ['platform-plans'], queryFn: superAdminApi.getPlans });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => superAdminApi.deletePlan(id),
    onSuccess: () => { toast.success(t('planDeleted')); qc.invalidateQueries({ queryKey: ['platform-plans'] }); },
    onError: (err: any) => toast.error(err.message || t('cannotDeletePlan')),
  });

  const handleDelete = (plan: Plan) => {
    if ((plan._count?.restaurants ?? 0) > 0) {
      toast.error(`${t('cannotDeletePlan')} "${plan.name}" — ${plan._count!.restaurants} ${t('restaurantsCount')} still use it.`);
      return;
    }
    toast.warning(`${t('deletePlan')} "${plan.name}"?`, {
      action: { label: t('deleteForever'), onClick: () => deleteMutation.mutate(plan.id) },
      cancel: { label: t('cancel'), onClick: () => {} },
    });
  };

  return (
    <>
      <AnimatePresence>
        {modal === 'create' && <PlanModal onClose={() => setModal(null)} />}
        {modal && typeof modal === 'object' && <PlanModal plan={modal as Plan} onClose={() => setModal(null)} />}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-0.5">{t('platform')}</p>
            <h1 className="text-2xl font-black text-foreground tracking-tight">{t('subscriptionPlans')}</h1>
          </div>
          <button onClick={() => setModal('create')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-violet-600 hover:opacity-90 transition-all shadow-lg shadow-rose-500/20">
            <Plus size={15} /> {t('newPlan')}
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(plans as Plan[]).map((plan, i) => (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-surface border border-surface-200 rounded-2xl p-5 hover:border-brand-500/30 transition-all group relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500/40 to-violet-500/40 rounded-t-2xl" />

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-violet-600/20 border border-rose-500/15 flex items-center justify-center">
                      <CreditCard size={16} className="text-rose-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{plan.name}</p>
                      <p className="text-xs text-slate-500">{plan._count?.restaurants ?? 0} {t('restaurantsCount')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-foreground">ETB {plan.priceMonthly.toLocaleString()}</p>
                    <p className="text-[10px] text-foreground/40">/{t('month')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center gap-2 bg-surface-100 rounded-xl p-2.5 border border-surface-200">
                    <GitBranch size={13} className="text-blue-500" />
                    <div>
                      <p className="text-xs font-black text-foreground">{plan.maxBranches}</p>
                      <p className="text-[9px] text-foreground/40 uppercase tracking-wider">{t('maxBranches')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-surface-100 rounded-xl p-2.5 border border-surface-200">
                    <Users size={13} className="text-violet-500" />
                    <div>
                      <p className="text-xs font-black text-foreground">{plan.maxStaff}</p>
                      <p className="text-[9px] text-foreground/40 uppercase tracking-wider">{t('maxStaff')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setModal(plan)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-foreground/60 bg-surface-100 hover:bg-surface-200 transition-all">
                    <Pencil size={12} /> {t('edit')}
                  </button>
                  <button onClick={() => handleDelete(plan)} disabled={deleteMutation.isPending}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 bg-rose-500/5 border border-rose-500/20 hover:bg-rose-500/10 transition-all disabled:opacity-50">
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
            {(plans as Plan[]).length === 0 && (
              <div className="col-span-2 text-center py-16 text-foreground/20 text-sm">
                {t('noSubscriptionPlans')}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
