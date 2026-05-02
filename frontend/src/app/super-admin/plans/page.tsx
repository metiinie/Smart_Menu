'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Loader2, CreditCard, Users, GitBranch, DollarSign, Check } from 'lucide-react';

type Plan = { id: string; name: string; maxBranches: number; maxStaff: number; priceMonthly: number; features?: Record<string, boolean>; _count?: { restaurants: number } };

const EMPTY_FORM = { name: '', maxBranches: 1, maxStaff: 5, priceMonthly: 0 };

function PlanModal({ plan, onClose }: { plan?: Plan; onClose: () => void }) {
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
      toast.success(isEdit ? 'Plan updated' : 'Plan created');
      qc.invalidateQueries({ queryKey: ['platform-plans'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Operation failed'),
  });

  const valid = form.name.trim().length > 0 && form.priceMonthly >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="w-full max-w-md bg-[#0d0d14] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <h2 className="text-base font-black text-white">{isEdit ? 'Edit Plan' : 'New Subscription Plan'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Plan Name *</label>
            <input className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/50 transition-all"
              placeholder="e.g. Starter, Pro, Enterprise"
              value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Max Branches</label>
              <input type="number" min={1} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/50 transition-all"
                value={form.maxBranches} onChange={(e) => setForm((f) => ({ ...f, maxBranches: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Max Staff</label>
              <input type="number" min={1} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/50 transition-all"
                value={form.maxStaff} onChange={(e) => setForm((f) => ({ ...f, maxStaff: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Price / Month (ETB)</label>
            <input type="number" min={0} step={0.01} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/50 transition-all"
              value={form.priceMonthly} onChange={(e) => setForm((f) => ({ ...f, priceMonthly: Number(e.target.value) }))} />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-800">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 bg-slate-800/60 hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={() => mutate()} disabled={isPending || !valid}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-violet-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {isEdit ? 'Save Changes' : 'Create Plan'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function SuperAdminPlansPage() {
  const [modal, setModal] = useState<null | 'create' | Plan>(null);
  const qc = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({ queryKey: ['platform-plans'], queryFn: superAdminApi.getPlans });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => superAdminApi.deletePlan(id),
    onSuccess: () => { toast.success('Plan deleted'); qc.invalidateQueries({ queryKey: ['platform-plans'] }); },
    onError: (err: any) => toast.error(err.message || 'Cannot delete plan'),
  });

  const handleDelete = (plan: Plan) => {
    if ((plan._count?.restaurants ?? 0) > 0) {
      toast.error(`Cannot delete "${plan.name}" — ${plan._count!.restaurants} restaurant(s) still use it.`);
      return;
    }
    toast.warning(`Delete plan "${plan.name}"?`, {
      action: { label: 'Delete', onClick: () => deleteMutation.mutate(plan.id) },
      cancel: { label: 'Cancel', onClick: () => {} },
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
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-0.5">Platform</p>
            <h1 className="text-2xl font-black text-white tracking-tight">Subscription Plans</h1>
          </div>
          <button onClick={() => setModal('create')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-violet-600 hover:opacity-90 transition-all shadow-lg shadow-rose-500/20">
            <Plus size={15} /> New Plan
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(plans as Plan[]).map((plan, i) => (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/60 transition-all group relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500/40 to-violet-500/40 rounded-t-2xl" />

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-violet-600/20 border border-rose-500/15 flex items-center justify-center">
                      <CreditCard size={16} className="text-rose-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{plan.name}</p>
                      <p className="text-xs text-slate-500">{plan._count?.restaurants ?? 0} restaurants</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-white">ETB {plan.priceMonthly.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500">/month</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center gap-2 bg-slate-950/50 rounded-xl p-2.5 border border-slate-800/40">
                    <GitBranch size={13} className="text-blue-400" />
                    <div>
                      <p className="text-xs font-black text-white">{plan.maxBranches}</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider">Max Branches</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950/50 rounded-xl p-2.5 border border-slate-800/40">
                    <Users size={13} className="text-violet-400" />
                    <div>
                      <p className="text-xs font-black text-white">{plan.maxStaff}</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider">Max Staff</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setModal(plan)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800/60 hover:bg-slate-700 transition-all">
                    <Pencil size={12} /> Edit
                  </button>
                  <button onClick={() => handleDelete(plan)} disabled={deleteMutation.isPending}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/5 border border-rose-500/15 hover:bg-rose-500/10 transition-all disabled:opacity-50">
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
            {(plans as Plan[]).length === 0 && (
              <div className="col-span-2 text-center py-16 text-slate-500 text-sm">
                No subscription plans. Create your first plan.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
