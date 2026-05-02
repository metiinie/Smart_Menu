'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Building2, GitBranch, Users, CreditCard, AlertTriangle, Loader2, CheckCircle2, XCircle, ChevronRight, Save } from 'lucide-react';

const SUB_STATUSES = ['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED'];

export default function SuperAdminRestaurantDetailPage() {
  const { id } = useParams() as { id: string };
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedSub, setSelectedSub] = useState<string>('');

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['super-admin-restaurant', id],
    queryFn: () => superAdminApi.getRestaurant(id),
    enabled: !!id,
  });

  const { data: plans = [] } = useQuery({ queryKey: ['platform-plans'], queryFn: superAdminApi.getPlans });

  const updateMutation = useMutation({
    mutationFn: (data: { isActive?: boolean; subscriptionStatus?: string; planId?: string }) =>
      superAdminApi.updateRestaurant(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin-restaurant', id] });
      qc.invalidateQueries({ queryKey: ['super-admin-restaurants'] });
      toast.success('Restaurant updated successfully');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => superAdminApi.deleteRestaurant(id),
    onSuccess: () => {
      toast.success('Restaurant permanently deleted');
      window.location.href = '/super-admin/restaurants';
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete'),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
    </div>
  );

  if (!restaurant) return (
    <div className="text-center py-20 text-slate-500">Restaurant not found.</div>
  );

  const currentPlan = selectedPlan || restaurant.planId;
  const currentSub = selectedSub || restaurant.subscriptionStatus;
  const hasUnsaved = (selectedPlan && selectedPlan !== restaurant.planId) ||
    (selectedSub && selectedSub !== restaurant.subscriptionStatus);

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        ...(selectedPlan && selectedPlan !== restaurant.planId ? { planId: selectedPlan } : {}),
        ...(selectedSub && selectedSub !== restaurant.subscriptionStatus ? { subscriptionStatus: selectedSub } : {}),
      });
      setSelectedPlan('');
      setSelectedSub('');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = () => {
    toast.warning(
      `${restaurant.isActive ? 'Suspend' : 'Activate'} "${restaurant.name}"?`,
      {
        action: { label: 'Confirm', onClick: () => updateMutation.mutate({ isActive: !restaurant.isActive }) },
        cancel: { label: 'Cancel', onClick: () => {} },
      }
    );
  };

  const handleDelete = () => {
    toast.error(`Permanently delete "${restaurant.name}" and all its data?`, {
      description: 'This cannot be undone.',
      action: { label: 'Delete Forever', onClick: () => deleteMutation.mutate() },
      cancel: { label: 'Cancel', onClick: () => {} },
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/super-admin/restaurants" className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={15} /> Back to Restaurants
        </Link>
        {hasUnsaved && (
          <button onClick={handleSaveChanges} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-violet-600 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-rose-500/20">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
        )}
      </div>

      {/* Restaurant Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-violet-600/20 border border-rose-500/15 flex items-center justify-center">
          <Building2 size={24} className="text-rose-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-white tracking-tight">{restaurant.name}</h1>
          <p className="text-xs font-mono text-slate-500 mt-0.5">{restaurant.slug} · ID: {restaurant.id.slice(0, 8)}…</p>
        </div>
        <span className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest rounded-xl border ${restaurant.isActive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
          {restaurant.isActive ? 'Active' : 'Suspended'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Subscription & Plan */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={15} className="text-amber-400" />
              <h3 className="text-sm font-bold text-white">Subscription Settings</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Subscription Plan</label>
                <select
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/50 transition-all"
                  value={currentPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                >
                  {(plans as any[]).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} — ETB {p.priceMonthly}/mo</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Subscription Status</label>
                <select
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/50 transition-all"
                  value={currentSub}
                  onChange={(e) => setSelectedSub(e.target.value)}
                >
                  {SUB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500 bg-slate-950/50 rounded-xl p-3 border border-slate-800/40">
              <div><span className="text-slate-600 font-semibold">Max Branches:</span> {restaurant.plan?.maxBranches ?? '—'}</div>
              <div><span className="text-slate-600 font-semibold">Max Staff:</span> {restaurant.plan?.maxStaff ?? '—'}</div>
              <div><span className="text-slate-600 font-semibold">Price:</span> ETB {restaurant.plan?.priceMonthly ?? 0}/mo</div>
              <div><span className="text-slate-600 font-semibold">Joined:</span> {new Date(restaurant.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Branches */}
          <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <GitBranch size={15} className="text-blue-400" />
              <h3 className="text-sm font-bold text-white">Branches ({restaurant.branches?.length ?? 0})</h3>
            </div>
            <div className="space-y-2">
              {(restaurant.branches ?? []).map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800/40 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-200">{b.name}</p>
                    <p className="text-[10px] text-slate-500">{b.address}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{b._count?.tables ?? 0} tables</span>
                    <span>·</span>
                    <span>{b._count?.users ?? 0} staff</span>
                  </div>
                </div>
              ))}
              {(!restaurant.branches || restaurant.branches.length === 0) && (
                <p className="text-xs text-slate-500 text-center py-4">No branches found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Stats + Controls */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={15} className="text-violet-400" />
              <h3 className="text-sm font-bold text-white">Quick Stats</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Total Users', value: restaurant._count?.users ?? 0 },
                { label: 'Branches', value: restaurant.branches?.length ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-sm font-black text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Controls</h3>
            <button onClick={handleToggleActive} disabled={updateMutation.isPending}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${restaurant.isActive ? 'bg-amber-500/5 text-amber-400 border-amber-500/20 hover:bg-amber-500/10' : 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'}`}>
              {restaurant.isActive ? <><XCircle size={13} /> Suspend Restaurant</> : <><CheckCircle2 size={13} /> Activate Restaurant</>}
            </button>

            <hr className="border-slate-800" />

            {/* Danger Zone */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={13} className="text-rose-500" />
                <span className="text-xs font-black text-rose-400 uppercase tracking-widest">Danger Zone</span>
              </div>
              <p className="text-[10px] text-slate-500 mb-3">Permanently deletes all data including branches, orders, and staff.</p>
              <button onClick={handleDelete} disabled={deleteMutation.isPending}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-400 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2">
                {deleteMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <AlertTriangle size={13} />}
                Delete Restaurant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
