'use client';

import { useQuery } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/api';
import Link from 'next/link';
import { Store, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SuperAdminRestaurantsPage() {
  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['super-admin-restaurants'],
    queryFn: superAdminApi.getRestaurants,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Registered Restaurants</h2>
        <span className="text-sm font-semibold text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
          {restaurants.length} Total
        </span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider font-bold">
              <th className="px-6 py-4 border-b border-slate-800">Restaurant</th>
              <th className="px-6 py-4 border-b border-slate-800">Slug</th>
              <th className="px-6 py-4 border-b border-slate-800 text-center">Branches</th>
              <th className="px-6 py-4 border-b border-slate-800">Plan</th>
              <th className="px-6 py-4 border-b border-slate-800">Status</th>
              <th className="px-6 py-4 border-b border-slate-800 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {restaurants.map((rest: any, i: number) => (
              <motion.tr 
                key={rest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="hover:bg-slate-800/20 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                      <Store size={18} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">{rest.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Joined {new Date(rest.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-mono text-slate-400">{rest.slug}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg">
                    {rest._count?.branches ?? 0}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                    {rest.plan?.name || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    {rest.isActive ? (
                      <CheckCircle size={14} className="text-emerald-500" />
                    ) : (
                      <XCircle size={14} className="text-rose-500" />
                    )}
                    <span className={`text-xs font-semibold ${rest.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {rest.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/super-admin/restaurants/${rest.id}`}
                    className="text-xs font-bold text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Manage
                  </Link>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        
        {restaurants.length === 0 && (
          <div className="p-12 text-center text-slate-500 font-medium">
            No restaurants found on the platform.
          </div>
        )}
      </div>
    </div>
  );
}
