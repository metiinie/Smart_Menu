'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Save,
  Building2,
  Percent,
  Users,
  Shield,
  ChefHat,
  
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAuthStore } from '@/stores/authStore';

const BRANCH_ID = process.env.NEXT_PUBLIC_BRANCH_ID ?? '';

export default function AdminSettingsPage() {
  const { logout } = useAuthStore();
  const qc = useQueryClient();

  const { data: branch, isLoading: branchLoading } = useQuery({
    queryKey: ['admin-branch', BRANCH_ID],
    queryFn: () => adminApi.getBranch(BRANCH_ID),
    enabled: !!BRANCH_ID,
  });

  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['admin-staff', BRANCH_ID],
    queryFn: () => adminApi.getStaff(BRANCH_ID),
    enabled: !!BRANCH_ID,
  });

  const [branchName, setBranchName] = useState('');
  const [vatRate, setVatRate] = useState('');
  const [serviceRate, setServiceRate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (branch) {
      setBranchName(branch.name || '');
      setVatRate(String(branch.vatRate ?? 15));
      setServiceRate(String(branch.serviceChargeRate ?? 10));
    }
  }, [branch]);

  const handleSave = async () => {
    if (!BRANCH_ID) return;
    setSaving(true);
    try {
      await adminApi.updateBranch(BRANCH_ID, {
        name: branchName,
        vatRate: parseFloat(vatRate) || 15,
        serviceChargeRate: parseFloat(serviceRate) || 10,
      });
      qc.invalidateQueries({ queryKey: ['admin-branch'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const isLoading = branchLoading || staffLoading;

  return (
    <>
      <AdminHeader title="Settings" onLogout={logout} />

      <main className="p-4 pb-12 space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Branch Settings */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                  <Building2 size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Branch Settings</h3>
                  <p className="text-[10px] text-slate-400">Configure your restaurant details</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                    Restaurant Name
                  </label>
                  <input
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-200 focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <Percent size={10} /> VAT Rate
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={vatRate}
                        onChange={(e) => setVatRate(e.target.value)}
                        className="w-full bg-slate-50 text-slate-900 rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-200 focus:border-brand-500 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <Percent size={10} /> Service Charge
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={serviceRate}
                        onChange={(e) => setServiceRate(e.target.value)}
                        className="w-full bg-slate-50 text-slate-900 rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-200 focus:border-brand-500 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={saving}
                  className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                    saved
                      ? 'bg-emerald-500 text-white'
                      : 'bg-brand-500 text-white'
                  }`}
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : saved ? (
                    'Saved ✓'
                  ) : (
                    <>
                      <Save size={16} /> Save Changes
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>

            {/* Staff Users */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Users size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Staff Members</h3>
                  <p className="text-[10px] text-slate-400">{staff.length} registered</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {staff.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No staff members found</p>
                ) : (
                  staff.map((s: any, i: number) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.04 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        s.role === 'ADMIN'
                          ? 'bg-violet-100 text-violet-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}>
                        {s.role === 'ADMIN' ? <Shield size={16} /> : <ChefHat size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{s.role.toLowerCase()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        s.isActive
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-red-100 text-red-500'
                      }`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* System Info */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center shadow-md">
                  <Settings size={18} className="text-white" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">System Info</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400">Branch ID</span>
                  <span className="text-slate-600 font-mono text-[10px]">{BRANCH_ID || '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400">App Version</span>
                  <span className="text-slate-600 font-mono">1.0.0</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">API</span>
                  <span className="text-slate-600 font-mono text-[10px]">{process.env.NEXT_PUBLIC_API_URL || 'localhost:3001'}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </main>
    </>
  );
}
