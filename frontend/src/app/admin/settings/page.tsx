'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Save,
  Building2,
  Percent,
  Users,
  Shield,
  ChefHat,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  X,
  Eye,
  EyeOff,
  Check,
  UserCog,
  Briefcase,
  User as UserIcon,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAuthStore, selectBranchId } from '@/stores/authStore';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import Link from 'next/link';

// ── Role Config ────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  RESTAURANT_ADMIN: { label: 'Admin',   icon: Shield,   color: 'bg-violet-100 text-violet-600' },
  MANAGER:          { label: 'Manager', icon: Briefcase, color: 'bg-blue-100 text-blue-600' },
  KITCHEN:          { label: 'Kitchen', icon: ChefHat,   color: 'bg-amber-100 text-amber-600' },
  STAFF:            { label: 'Staff',   icon: UserIcon,  color: 'bg-emerald-100 text-emerald-600' },
};

// ── PIN Input ──────────────────────────────────────────────────────────────
function PinInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          inputMode="numeric"
          maxLength={4}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          className="w-full bg-slate-50 text-slate-900 rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-200 focus:border-brand-500 pr-10 tracking-[0.4em] font-mono"
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

// ── Add/Edit Staff Drawer ─────────────────────────────────────────────────
interface StaffFormProps {
  staff?: any;
  branchId: string;
  onClose: () => void;
  onSaved: () => void;
}
function StaffDrawer({ staff, branchId, onClose, onSaved }: StaffFormProps) {
  const isEdit = !!staff;
  const [name, setName] = useState(staff?.name ?? '');
  const [email, setEmail] = useState(staff?.email ?? '');
  const [role, setRole] = useState(staff?.role ?? 'KITCHEN');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return setError('Name is required');
    if (!email.trim()) return setError('Email is required');
    if (!isEdit) {
      if (password.length < 6) return setError('Password must be at least 6 characters');
      if (password !== confirmPassword) return setError('Passwords do not match');
    }
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await adminApi.updateStaff(staff.id, { name: name.trim(), email: email.trim().toLowerCase(), role });
      } else {
        await adminApi.createStaff({ name: name.trim(), email: email.trim().toLowerCase(), role, password, pin, branchId });
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to save');
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
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 shadow-2xl max-w-lg mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-900 text-lg">{isEdit ? 'Edit Staff' : 'Add Staff Member'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name & Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Full Name</label>
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Abebe Kebede"
                className="w-full bg-slate-50 text-slate-900 rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-200 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Email</label>
              <input
                type="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="abebe@mail.com"
                className="w-full bg-slate-50 text-slate-900 rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-200 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button key={key} type="button" onClick={() => setRole(key)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${role === key ? 'border-brand-500 bg-brand-500/5' : 'border-slate-200 bg-slate-50'}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.color}`}>
                      <Icon size={14} />
                    </div>
                    <span className={`text-sm font-semibold ${role === key ? 'text-brand-600' : 'text-slate-600'}`}>{cfg.label}</span>
                    {role === key && <Check size={14} className="ml-auto text-brand-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password (only on create) */}
          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Password</label>
                <input
                  type="password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 text-slate-900 rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-200 focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 text-slate-900 rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-200 focus:border-brand-500"
                />
              </div>
            </div>
          )}

          {/* PIN (optional on create) */}
          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <PinInput value={pin} onChange={setPin} label="PIN (4 digits - optional)" />
              <PinInput value={confirmPin} onChange={setConfirmPin} label="Confirm PIN" />
            </div>
          )}

          {error && (
            <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={saving}
            className="w-full py-3.5 rounded-xl bg-brand-500 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
              <><Save size={16} /> {isEdit ? 'Save Changes' : 'Create Staff Member'}</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

// ── Reset PIN Modal ────────────────────────────────────────────────────────
function ResetPinModal({ staffName, staffId, onClose, onSaved }: { staffName: string; staffId: string; onClose: () => void; onSaved: () => void }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (pin.length !== 4) return setError('PIN must be 4 digits');
    if (pin !== confirmPin) return setError('PINs do not match');
    setSaving(true);
    try {
      await adminApi.resetStaffPin(staffId, pin);
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to reset PIN');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-3xl p-6 shadow-2xl max-w-sm mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
            <KeyRound size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Reset PIN</h3>
            <p className="text-xs text-slate-400">{staffName}</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X size={14} className="text-slate-500" />
          </button>
        </div>
        <div className="space-y-3">
          <PinInput value={pin} onChange={setPin} label="New PIN" />
          <PinInput value={confirmPin} onChange={setConfirmPin} label="Confirm PIN" />
          {error && <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleReset} disabled={saving}
            className="w-full py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-1">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
              <><KeyRound size={16} /> Set New PIN</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

function ResetPasswordModal({ staffName, staffId, onClose, onSaved }: { staffName: string; staffId: string; onClose: () => void; onSaved: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');
    setSaving(true);
    try {
      await adminApi.resetStaffPassword(staffId, password);
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-3xl p-6 shadow-2xl max-w-sm mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center">
            <Lock size={20} className="text-brand-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Reset Password</h3>
            <p className="text-xs text-slate-400">{staffName}</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X size={14} className="text-slate-500" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">New Password</label>
            <input
              type="password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 text-slate-900 rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-200 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 text-slate-900 rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-200 focus:border-brand-500"
            />
          </div>
          {error && <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleReset} disabled={saving}
            className="w-full py-3 rounded-xl bg-brand-500 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-1">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
              <><Lock size={16} /> Set New Password</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const { user, logout } = useAuthStore();
  const branchId = selectBranchId(user);
  const qc = useQueryClient();

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [staffDrawer, setStaffDrawer] = useState<{ open: boolean; staff?: any }>({ open: false });
  const [resetPinTarget, setResetPinTarget] = useState<{ id: string; name: string } | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<{ id: string; name: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') =>
    setToast({ message, type });

  const { data: branch, isLoading: branchLoading } = useQuery({
    queryKey: ['admin-branch', branchId],
    queryFn: () => adminApi.getBranch(branchId),
    enabled: !!branchId,
  });

  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['admin-staff', branchId],
    queryFn: () => adminApi.getStaff(branchId),
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
      showToast('Branch settings saved!');
    } catch (err: any) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s: any) => {
    try {
      await adminApi.updateStaff(s.id, { isActive: !s.isActive });
      qc.invalidateQueries({ queryKey: ['admin-staff'] });
      showToast(`${s.name} ${s.isActive ? 'deactivated' : 'activated'}`);
    } catch (e: any) {
      showToast(e.message || 'Failed to update', 'error');
    }
  };

  const handleDeleteStaff = async (s: any) => {
    if (!confirm(`Deactivate ${s.name}? They won't be able to log in.`)) return;
    try {
      await adminApi.deleteStaff(s.id);
      qc.invalidateQueries({ queryKey: ['admin-staff'] });
      showToast(`${s.name} deactivated`);
    } catch (e: any) {
      showToast(e.message || 'Failed to deactivate', 'error');
    }
  };

  const isLoading = branchLoading || staffLoading;

  return (
    <>
      <AdminHeader title="Settings" onLogout={logout} />

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
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                  <Building2 size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Branch Settings</h3>
                  <p className="text-[10px] text-slate-400">Restaurant name & tax configuration</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Restaurant Name</label>
                  <input value={branchName} onChange={(e) => setBranchName(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-200 focus:border-brand-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <Percent size={10} /> VAT Rate
                    </label>
                    <div className="relative">
                      <input type="number" value={vatRate} onChange={(e) => setVatRate(e.target.value)}
                        className="w-full bg-slate-50 text-slate-900 rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-200 focus:border-brand-500 pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <Percent size={10} /> Service Charge
                    </label>
                    <div className="relative">
                      <input type="number" value={serviceRate} onChange={(e) => setServiceRate(e.target.value)}
                        className="w-full bg-slate-50 text-slate-900 rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-200 focus:border-brand-500 pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                    </div>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
                  className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-brand-500 text-white">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> Save Changes</>}
                </motion.button>
              </div>
            </motion.div>

            {/* ── Staff Members ────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <Users size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Staff Members</h3>
                    <p className="text-[10px] text-slate-400">{staff.length} registered</p>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => setStaffDrawer({ open: true, staff: undefined })}
                  className="flex items-center gap-1 bg-brand-500 text-white text-xs font-semibold px-3 py-2 rounded-xl">
                  <Plus size={14} /> Add Staff
                </motion.button>
              </div>

              <div className="space-y-2.5">
                {staff.length === 0 ? (
                  <div className="text-center py-10">
                    <UserCog size={32} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-sm text-slate-400">No staff members yet</p>
                    <p className="text-xs text-slate-300 mt-1">Add your first staff member above</p>
                  </div>
                ) : (
                  staff.map((s: any, i: number) => {
                    const cfg = ROLE_CONFIG[s.role] ?? ROLE_CONFIG.STAFF;
                    const Icon = cfg.icon;
                    return (
                      <motion.div key={s.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${s.isActive ? 'bg-slate-50 border-slate-100' : 'bg-red-50/50 border-red-100 opacity-60'}`}>
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                          <Icon size={16} />
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 leading-none">{s.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{s.email || cfg.label}</p>
                        </div>
                        {/* Status badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${s.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                          {s.isActive ? 'Active' : 'Off'}
                        </span>
                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <motion.button whileTap={{ scale: 0.85 }} title="Reset Password"
                            onClick={() => setResetPasswordTarget({ id: s.id, name: s.name })}
                            className="w-7 h-7 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center">
                            <Lock size={12} className="text-brand-500" />
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.85 }} title="Reset PIN"
                            onClick={() => setResetPinTarget({ id: s.id, name: s.name })}
                            className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                            <KeyRound size={12} className="text-amber-500" />
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.85 }} title="Edit"
                            onClick={() => setStaffDrawer({ open: true, staff: s })}
                            className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                            <Pencil size={12} className="text-blue-500" />
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.85 }} title={s.isActive ? 'Deactivate' : 'Re-activate'}
                            onClick={() => s.isActive ? handleDeleteStaff(s) : handleToggleActive(s)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border ${s.isActive ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                            <Trash2 size={12} className={s.isActive ? 'text-red-400' : 'text-emerald-500'} />
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
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
                        ✨ TRIALING
                      </span>
                      <p className="text-white font-bold text-sm">Manage Subscription</p>
                      <p className="text-white/70 text-[10px]">View plans & upgrade your account</p>
                    </div>
                    <ChevronRight size={18} className="text-white/70 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* ── System Info ──────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center shadow-md">
                  <Settings size={18} className="text-white" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">System Info</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400">Branch ID</span>
                  <span className="text-slate-600 font-mono text-[10px]">{branchId || '—'}</span>
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

      {/* ── Drawers & Modals ────────────────────────────────────────────── */}
      <AnimatePresence>
        {staffDrawer.open && (
          <StaffDrawer
            staff={staffDrawer.staff}
            branchId={branchId}
            onClose={() => setStaffDrawer({ open: false })}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ['admin-staff'] });
              showToast(staffDrawer.staff ? 'Staff updated!' : 'Staff member added!');
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resetPinTarget && (
          <ResetPinModal
            staffName={resetPinTarget.name}
            staffId={resetPinTarget.id}
            onClose={() => setResetPinTarget(null)}
            onSaved={() => showToast('PIN reset successfully!')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resetPasswordTarget && (
          <ResetPasswordModal
            staffName={resetPasswordTarget.name}
            staffId={resetPasswordTarget.id}
            onClose={() => setResetPasswordTarget(null)}
            onSaved={() => showToast('Password reset successfully!')}
          />
        )}
      </AnimatePresence>
    </>
  );
}
