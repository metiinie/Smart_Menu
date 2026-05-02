'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Building2, CreditCard, Activity } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SuperAdminRestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const qc = useQueryClient();

  const [saving, setSaving] = useState(false);

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['super-admin-restaurant', id],
    queryFn: () => superAdminApi.getRestaurant(id),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" /></div>;
  }

  if (!restaurant) {
    return <div className="text-white text-center py-20">Restaurant not found.</div>;
  }

  const handleToggleActive = async () => {
    toast.warning(
      `Are you sure you want to ${restaurant.isActive ? 'suspend' : 'activate'} this restaurant?`,
      {
        action: {
          label: 'Confirm',
          onClick: async () => {
            setSaving(true);
            try {
              await superAdminApi.updateRestaurant(id, { isActive: !restaurant.isActive });
              await qc.invalidateQueries({ queryKey: ['super-admin-restaurant', id] });
              await qc.invalidateQueries({ queryKey: ['super-admin-restaurants'] });
              toast.success(`Restaurant ${restaurant.isActive ? 'suspended' : 'activated'} successfully.`);
            } catch (err: any) {
              toast.error(err.message || 'Failed to update restaurant status');
            } finally {
              setSaving(false);
            }
          },
        },
        cancel: {
          label: 'Cancel',
          onClick: () => {},
        },
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/super-admin/restaurants" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors">
        <ArrowLeft size={16} /> Back to Restaurants
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">{restaurant.name}</h2>
          <p className="text-slate-400 font-mono text-sm mt-1">{restaurant.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full ${restaurant.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            {restaurant.isActive ? 'Active' : 'Suspended'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-white">
            <Building2 size={16} className="text-rose-500" />
            <h3 className="font-bold">Organization Details</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">ID</p>
              <p className="text-sm text-slate-300 font-mono bg-slate-950 p-2 rounded-lg border border-slate-800">{restaurant.id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Created At</p>
              <p className="text-sm text-slate-300 font-mono">{new Date(restaurant.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Branches ({restaurant.branches?.length ?? 0})</p>
              <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
                {restaurant.branches?.map((b: any) => (
                  <li key={b.id}>{b.name}</li>
                ))}
                {(!restaurant.branches || restaurant.branches.length === 0) && <li className="text-slate-500 italic list-none">No branches</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* Subscription & Platform Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4 text-white">
              <CreditCard size={16} className="text-amber-500" />
              <h3 className="font-bold">Subscription</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Current Plan</p>
                <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-sm font-black uppercase tracking-wider text-amber-400">
                    {restaurant.plan?.name || 'None'}
                  </span>
                  <span className="text-xs text-slate-500">
                    ETB {restaurant.plan?.priceMonthly ?? 0}/mo
                  </span>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          <div>
            <div className="flex items-center gap-2 mb-4 text-white">
              <Activity size={16} className="text-rose-500" />
              <h3 className="font-bold">Danger Zone</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {restaurant.isActive 
                ? "Suspending a restaurant immediately prevents all staff and customers from logging in or placing orders."
                : "Activating this restaurant will restore access to all features."}
            </p>
            <button
              onClick={handleToggleActive}
              disabled={saving}
              className={`w-full py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-colors ${
                restaurant.isActive 
                  ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20' 
                  : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20'
              }`}
            >
              {saving && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              {restaurant.isActive ? 'Suspend Restaurant' : 'Activate Restaurant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
