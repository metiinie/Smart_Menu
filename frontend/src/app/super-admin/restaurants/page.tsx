'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, CheckCircle2, XCircle, Plus, Search, ChevronRight, X, Loader2, Building2, Mail, Lock, Tag, User } from 'lucide-react';

function CreateRestaurantModal({ plans, onClose }: { plans: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const starterPlan = plans.find((p) => p.name.toLowerCase().includes('starter'));
  const [form, setForm] = useState({
    name: '', slug: '',
    planId: starterPlan?.id ?? plans[0]?.id ?? '',
    branchName: '', adminName: '', adminEmail: '', adminPassword: '',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => superAdminApi.createRestaurant(form),
    onSuccess: () => {
      toast.success('Restaurant created successfully');
      qc.invalidateQueries({ queryKey: ['super-admin-restaurants'] });
      qc.invalidateQueries({ queryKey: ['platform-stats'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create restaurant'),
  });

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const valid = form.name && form.slug && form.planId && form.adminName && form.adminEmail && form.adminPassword.length >= 8;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="w-full max-w-xl bg-[#0d0d14] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div>
            <h2 className="text-base font-black text-white">Create Restaurant</h2>
            <p className="text-xs text-slate-500 mt-0.5">A default branch and admin user will be provisioned automatically.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Restaurant Info</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Restaurant Name *</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/50 transition-all"
                  placeholder="e.g. Lalibela Restaurant" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">URL Slug *</label>
              <div className="relative">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/50 transition-all font-mono"
                  placeholder="lalibela-restaurant" value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Subscription Plan *</label>
              <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/50 transition-all"
                value={form.planId} onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}>
                {plans.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} — ETB {p.priceMonthly}/mo</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Branch Name <span className="text-slate-600">(optional)</span></label>
              <input className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/50 transition-all"
                placeholder="Defaults to Main Branch" value={form.branchName}
                onChange={(e) => setForm((f) => ({ ...f, branchName: e.target.value }))} />
            </div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 pt-2">Admin Account</p>
          <div className="space-y-3">
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
                placeholder="Admin Full Name *" value={form.adminName}
                onChange={(e) => setForm((f) => ({ ...f, adminName: e.target.value }))} />
            </div>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="email" className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
                placeholder="admin@restaurant.com *" value={form.adminEmail}
                onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))} />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="password" className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
                placeholder="Temporary Password (min 8 chars) *" value={form.adminPassword}
                onChange={(e) => setForm((f) => ({ ...f, adminPassword: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-800">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 bg-slate-800/60 hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={() => mutate()} disabled={isPending || !valid}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-violet-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20">
            {isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {isPending ? 'Creating...' : 'Create Restaurant'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const SUB_COLORS: Record<string, string> = {
  ACTIVE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  TRIALING: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  PAST_DUE: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  CANCELED: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

export default function SuperAdminRestaurantsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const { data: restaurants = [], isLoading } = useQuery({ queryKey: ['super-admin-restaurants'], queryFn: superAdminApi.getRestaurants });
  const { data: plans = [] } = useQuery({ queryKey: ['platform-plans'], queryFn: superAdminApi.getPlans });

  const filtered = (restaurants as any[]).filter((r: any) =>
    r.name.toLowerCase().includes(search.toLowerCase()) || r.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <AnimatePresence>{showCreate && <CreateRestaurantModal plans={plans as any[]} onClose={() => setShowCreate(false)} />}</AnimatePresence>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-0.5">Platform</p>
            <h1 className="text-2xl font-black text-white tracking-tight">Restaurants</h1>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-violet-600 hover:opacity-90 transition-all shadow-lg shadow-rose-500/20">
            <Plus size={15} /> New Restaurant
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-all"
              placeholder="Search by name or slug..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-900 border border-slate-800 px-3 py-2.5 rounded-xl">
            {filtered.length} of {(restaurants as any[]).length}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" /></div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="px-6 py-4">Restaurant</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4 text-center">Branches</th>
                  <th className="px-6 py-4 text-center">Users</th>
                  <th className="px-6 py-4">Subscription</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((rest: any, i: number) => (
                  <motion.tr key={rest.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/20 to-violet-600/20 border border-rose-500/10 flex items-center justify-center shrink-0">
                          <Store size={15} className="text-rose-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-100">{rest.name}</p>
                          <p className="text-[10px] font-mono text-slate-500">{rest.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                        {rest.plan?.name ?? 'None'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center"><span className="text-xs font-black text-slate-300">{rest._count?.branches ?? 0}</span></td>
                    <td className="px-6 py-4 text-center"><span className="text-xs font-black text-slate-300">{rest._count?.users ?? 0}</span></td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${SUB_COLORS[rest.subscriptionStatus] ?? 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                        {rest.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {rest.isActive
                        ? <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /><span className="text-xs font-semibold text-emerald-400">Active</span></div>
                        : <div className="flex items-center gap-1.5"><XCircle size={13} className="text-rose-400" /><span className="text-xs font-semibold text-rose-400">Suspended</span></div>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/super-admin/restaurants/${rest.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-all">
                        Manage <ChevronRight size={12} />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-500 text-sm font-medium">No restaurants found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
