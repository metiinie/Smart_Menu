'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
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
  Lock,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Toast, ToastContainer } from '@/components/ui/Toast';

// ── Role Config ────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { labelKey: string; icon: React.ElementType; color: string }> = {
  RESTAURANT_ADMIN: { labelKey: 'admin',   icon: Shield,   color: 'bg-violet-500/10 text-violet-500' },
  MANAGER:          { labelKey: 'manager', icon: Briefcase, color: 'bg-blue-500/10 text-blue-500' },
  KITCHEN:          { labelKey: 'kitchen', icon: ChefHat,   color: 'bg-amber-500/10 text-amber-500' },
  STAFF:            { labelKey: 'staff',   icon: UserIcon,  color: 'bg-emerald-500/10 text-emerald-500' },
};

// ── PIN Input ──────────────────────────────────────────────────────────────
function PinInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1 block">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          inputMode="numeric"
          maxLength={4}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          className="w-full bg-surface-100 text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-surface-200 focus:border-brand-500 pr-10 tracking-[0.4em] font-mono transition-colors"
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/20">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

// ── Add/Edit Staff Drawer ─────────────────────────────────────────────────
interface StaffFormProps {
  staff?: any;
  branches: any[];
  onClose: () => void;
  onSaved: () => void;
}
function StaffDrawer({ staff, branches, onClose, onSaved }: StaffFormProps) {
  const { t } = useTranslation();
  const isEdit = !!staff;
  const [name, setName] = useState(staff?.name ?? '');
  const [email, setEmail] = useState(staff?.email ?? '');
  const [role, setRole] = useState(staff?.role ?? 'KITCHEN');
  const [branchId, setBranchId] = useState(staff?.branch?.id ?? (branches[0]?.id || ''));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return setError(t('required'));
    if (!email.trim() && !pin) return setError(t('required'));
    if (!branchId) return setError(t('required'));
    if (!isEdit && !pin && password.length < 6) return setError(t('passwordAtLeast6'));
    if (!isEdit && password !== confirmPassword) return setError(t('passwordsDoNotMatch'));
    
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
          <h3 className="font-bold text-foreground text-lg">{isEdit ? t('editStaff') : t('addStaffMember')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center transition-colors">
            <X size={16} className="text-foreground/40" />
          </button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1 block">{t('fullName')}</label>
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Abebe Kebede"
                className="w-full bg-surface-100 text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-surface-200 focus:border-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1 block">{t('email')}</label>
              <input
                type="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="abebe@mail.com"
                className="w-full bg-surface-100 text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-surface-200 focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {!isEdit && (
            <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1 block">{t('assignToBranch')}</label>
            <select
              value={branchId} onChange={(e) => setBranchId(e.target.value)}
              className="w-full bg-surface-100 text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-surface-200 focus:border-brand-500 transition-colors"
            >
              <option value="" disabled className="bg-surface">{t('selectBranch')}</option>
              {branches.map(b => <option key={b.id} value={b.id} className="bg-surface">{b.name}</option>)}
            </select>
          </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-2 block">{t('role')}</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ROLE_CONFIG).filter(([k]) => k !== 'SUPER_ADMIN').map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button key={key} type="button" onClick={() => setRole(key)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${role === key ? 'border-brand-500 bg-brand-500/5' : 'border-surface-200 bg-surface-100'}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.color}`}>
                      <Icon size={14} />
                    </div>
                    <span className={`text-sm font-semibold ${role === key ? 'text-brand-500' : 'text-foreground/60'}`}>{t(cfg.labelKey as any)}</span>
                    {role === key && <Check size={14} className="ml-auto text-brand-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1 block">{t('password')}</label>
                <input
                  type="password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-100 text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-surface-200 focus:border-brand-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1 block">{t('confirmPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-100 text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-surface-200 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>
          )}

          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <PinInput value={pin} onChange={setPin} label={`${t('pin')} (4 ${t('digits')} - ${t('optional')})`} />
              <PinInput value={confirmPin} onChange={setConfirmPin} label={t('confirmPin')} />
            </div>
          )}

          {error && (
            <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={saving}
            className="w-full py-3.5 rounded-xl bg-brand-500 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
              <><Users size={16} /> {isEdit ? t('saveChanges') : t('addStaffMember')}</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

// ── Reset PIN/Password Modals (Omitted for brevity, assumed identical logic to settings) ──
function ResetPinModal({ staffName, staffId, onClose, onSaved }: { staffName: string; staffId: string; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (pin.length !== 4) return setError(t('required'));
    if (pin !== confirmPin) return setError(t('pinsDoNotMatch'));
    setSaving(true);
    try {
      await adminApi.resetStaffPin(staffId, pin);
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
        onClick={onClose} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-surface rounded-3xl p-6 shadow-2xl max-w-sm mx-auto border border-surface-200">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <KeyRound size={20} className="text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{t('resetPin')}</h3>
            <p className="text-xs text-foreground/40">{staffName}</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center transition-colors">
            <X size={14} className="text-foreground/40" />
          </button>
        </div>
        <div className="space-y-3">
          <PinInput value={pin} onChange={setPin} label={t('newPin')} />
          <PinInput value={confirmPin} onChange={setConfirmPin} label={t('confirmPin')} />
          {error && <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleReset} disabled={saving}
            className="w-full py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-1">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
              <><KeyRound size={16} /> {t('setNewPin')}</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

function ResetPasswordModal({ staffName, staffId, onClose, onSaved }: { staffName: string; staffId: string; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (password.length < 6) return setError(t('passwordAtLeast6'));
    if (password !== confirmPassword) return setError(t('passwordsDoNotMatch'));
    setSaving(true);
    try {
      await adminApi.resetStaffPassword(staffId, password);
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
        onClick={onClose} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-surface rounded-3xl p-6 shadow-2xl max-w-sm mx-auto border border-surface-200">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 flex items-center justify-center">
            <Lock size={20} className="text-brand-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{t('resetPassword')}</h3>
            <p className="text-xs text-foreground/40">{staffName}</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center transition-colors">
            <X size={14} className="text-foreground/40" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1 block">{t('newPassword')}</label>
            <input
              type="password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-100 text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-surface-200 focus:border-brand-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 mb-1 block">{t('confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-100 text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-surface-200 focus:border-brand-500 transition-colors"
            />
          </div>
          {error && <p className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleReset} disabled={saving}
            className="w-full py-3 rounded-xl bg-brand-500 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-1">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
              <><Lock size={16} /> {t('saveChanges')}</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

export default function TeamManagementPage() {
  const { t } = useTranslation();
  const { logout } = useAuthStore();
  const qc = useQueryClient();

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [staffDrawer, setStaffDrawer] = useState<{ open: boolean; staff?: any }>({ open: false });
  const [resetPinTarget, setResetPinTarget] = useState<{ id: string; name: string } | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<{ id: string; name: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') =>
    setToast({ message, type });

  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['admin-staff'],
    queryFn: () => adminApi.getStaff(), // Fetches all staff for the restaurant
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: () => adminApi.getBranches(),
  });

  const handleToggleActive = async (s: any) => {
    try {
      await adminApi.updateStaff(s.id, { isActive: !s.isActive });
      qc.invalidateQueries({ queryKey: ['admin-staff'] });
      showToast(`${s.name} ${s.isActive ? t('deactivated') : t('activated')}`);
    } catch (e: any) {
      showToast(e.response?.data?.message || e.message || t('operationFailed'), 'error');
    }
  };

  const handleDeleteStaff = async (s: any) => {
    if (!confirm(`${t('deactivate')} ${s.name}?`)) return;
    try {
      await adminApi.deleteStaff(s.id);
      qc.invalidateQueries({ queryKey: ['admin-staff'] });
      showToast(`${s.name} ${t('deactivated')}`);
    } catch (e: any) {
      showToast(e.response?.data?.message || e.message || t('operationFailed'), 'error');
    }
  };

  return (
    <>
      <AdminHeader title={t('teamManagement')} onLogout={logout} />

      <ToastContainer>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </ToastContainer>

      <main className="p-4 pb-12 space-y-5">
        <div className="bg-surface rounded-3xl p-5 shadow-sm border border-surface-200 transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">{t('staffMembers')}</h3>
                <p className="text-xs text-foreground/40">{t('manageAccessAllBranches')}</p>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => setStaffDrawer({ open: true, staff: undefined })}
              className="flex items-center gap-2 bg-brand-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-600 transition-colors">
              <Plus size={16} /> {t('addStaff')}
            </motion.button>
          </div>

          {staffLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {staff.length === 0 ? (
                <div className="col-span-full text-center py-16 bg-surface-100 rounded-2xl border border-dashed border-surface-200">
                  <UserCog size={40} className="mx-auto text-foreground/10 mb-3" />
                  <p className="text-foreground/40 font-semibold">{t('noStaffYet')}</p>
                  <p className="text-xs text-foreground/20 mt-1">{t('addFirstStaff')}</p>
                </div>
              ) : (
                staff.map((s: any, i: number) => {
                  const cfg = ROLE_CONFIG[s.role] ?? ROLE_CONFIG.STAFF;
                  const Icon = cfg.icon;
                  return (
                    <motion.div key={s.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className={`flex flex-col p-4 rounded-2xl border transition-all ${s.isActive ? 'bg-surface border-surface-200 shadow-sm hover:shadow-md' : 'bg-surface-100 border-surface-200 opacity-60'}`}>
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                          <Icon size={20} />
                        </div>
                         <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-foreground leading-tight truncate">{s.name}</p>
                          <p className="text-xs text-foreground/40 truncate">{s.email || t(cfg.labelKey as any)}</p>
                          {s.branch && <span className="inline-block mt-1 px-2 py-0.5 rounded bg-surface-200 text-foreground/60 text-[10px] font-bold uppercase truncate max-w-full">{s.branch.name}</span>}
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${s.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {s.isActive ? t('active') : t('disabled')}
                        </span>
                      </div>
                      
                      <div className="mt-auto grid grid-cols-4 gap-2 pt-4 border-t border-surface-200">
                        <motion.button whileTap={{ scale: 0.9 }} title={t('resetPassword')}
                          onClick={() => setResetPasswordTarget({ id: s.id, name: s.name })}
                          className="flex items-center justify-center py-2 rounded-xl bg-surface-100 hover:bg-surface-200 text-foreground/60 transition-colors">
                          <Lock size={14} />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} title={t('resetPin')}
                          onClick={() => setResetPinTarget({ id: s.id, name: s.name })}
                          className="flex items-center justify-center py-2 rounded-xl bg-surface-100 hover:bg-surface-200 text-foreground/60 transition-colors">
                          <KeyRound size={14} />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} title={t('edit')}
                          onClick={() => setStaffDrawer({ open: true, staff: s })}
                          className="flex items-center justify-center py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 transition-colors">
                          <Pencil size={14} />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} title={s.isActive ? t('deactivate') : t('activate')}
                          onClick={() => s.isActive ? handleDeleteStaff(s) : handleToggleActive(s)}
                          className={`flex items-center justify-center py-2 rounded-xl transition-colors ${s.isActive ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500'}`}>
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {staffDrawer.open && (
          <StaffDrawer
            staff={staffDrawer.staff}
            branches={branches}
            onClose={() => setStaffDrawer({ open: false })}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ['admin-staff'] });
              showToast(staffDrawer.staff ? t('staffUpdated') : t('staffAdded'));
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resetPinTarget && (
          <ResetPinModal staffName={resetPinTarget.name} staffId={resetPinTarget.id} onClose={() => setResetPinTarget(null)} onSaved={() => showToast(t('pinResetSuccess'))} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resetPasswordTarget && (
          <ResetPasswordModal staffName={resetPasswordTarget.name} staffId={resetPasswordTarget.id} onClose={() => setResetPasswordTarget(null)} onSaved={() => showToast(t('passwordResetSuccess'))} />
        )}
      </AnimatePresence>
    </>
  );
}
