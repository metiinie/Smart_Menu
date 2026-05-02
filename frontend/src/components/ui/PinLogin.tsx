'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {  ChefHat, ShieldCheck, ChevronLeft, Fingerprint} from 'lucide-react';
import { authApi } from '@/lib/api';
import { BrandLogo } from './BrandLogo';

import { Role } from '@/shared/types';

interface StaffUser {
  id: string;
  name: string;
  role: Role;
}

interface Props {
  branchId: string;
  onSuccess: (token: string, user: StaffUser) => void;
}

export function PinLogin({ branchId, onSuccess }: Props) {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [selected, setSelected] = useState<StaffUser | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setConnectionError(false);
    try {
      const data = await authApi.listStaff(branchId);
      if (Array.isArray(data) && data.length > 0) {
        setStaff(data);
      } else {
        // Fallback for stale branch IDs in env/config
        const fallbackData = await authApi.listStaff('');
        setStaff(Array.isArray(fallbackData) ? fallbackData : []);
      }
    } catch (err) {
      setConnectionError(true);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleDigit = useCallback((d: string) => {
    setPin(prev => {
      if (prev.length >= 8) return prev;
      return prev + d;
    });
    setError('');
  }, []);

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selected || pin.length < 4) return;
    setLoading(true);
    setError('');
    try {
      const res = await authApi.pinLogin(selected.id, pin);
      localStorage.setItem('arifsmart_token', res.token);
      localStorage.setItem('arifsmart_user', JSON.stringify(res.user));
      onSuccess(res.token, res.user);
    } catch {
      setError('Incorrect security PIN. Please try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  }, [selected, pin, onSuccess]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selected) return;
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      else if (e.key === 'Backspace') handleDelete();
      else if (e.key === 'Enter' && pin.length >= 4) handleSubmit();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, pin.length, handleDigit, handleDelete, handleSubmit]);

  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="w-full max-w-sm mx-auto">
      <AnimatePresence mode="wait">
        {!selected ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <BrandLogo className="mb-10" />
            
            <div className="space-y-3">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest text-center mb-6">
                Choose your profile to sign in
              </p>
              
              {loading && !staff.length && (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <div className="w-10 h-10 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
                  <p className="text-gold-500/60 text-[10px] font-bold uppercase tracking-widest animate-pulse">Connecting to server...</p>
                </div>
              )}

              {connectionError && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-gold p-6 rounded-3xl border-red-500/30 text-center space-y-4"
                >
                  <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
                    <ShieldCheck size={24} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Connection Error</p>
                    <p className="text-white/40 text-[11px] mt-1 leading-relaxed">
                      Unable to reach the server. Please ensure the backend is running and the database is awake.
                    </p>
                  </div>
                  <button 
                    onClick={loadStaff}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-colors border border-white/10"
                  >
                    Try Reconnecting
                  </button>
                </motion.div>
              )}

              <div className="space-y-3">
                {staff.map((s, i) => (
                  <motion.button
                    key={s.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.3 }}
                    whileHover={{ x: 8, backgroundColor: 'rgba(0, 0, 0, 0.03)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelected(s)}
                    className="w-full bg-white/40 backdrop-blur-md border border-white/60 flex items-center justify-between p-4 rounded-2xl group transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center border border-gold-500/20 group-hover:border-gold-500/40 transition-colors">
                        {s.role !== Role.KITCHEN ? (
                          <ShieldCheck size={24} className="text-gold-600" />
                        ) : (
                          <ChefHat size={24} className="text-gold-600" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-display font-bold text-slate-900 text-base">{s.name}</p>
                        <p className="text-slate-500 text-xs font-medium">
                          {s.role === Role.RESTAURANT_ADMIN ? 'Restaurant Admin' 
                           : s.role === Role.MANAGER ? 'Manager'
                           : s.role === Role.KITCHEN ? 'Kitchen Staff'
                           : s.role === Role.SUPER_ADMIN ? 'Super Admin'
                           : 'Staff'}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronLeft size={18} className="text-slate-400 rotate-180" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="pin"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Header with back button */}
            <div className="flex items-center justify-between mb-8">
              <button 
                aria-label="Back to profile selection"
                onClick={() => { setSelected(null); setPin(''); }}
                className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-md border border-black/5 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-right">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{selected.role}</p>
                <p className="font-display font-black text-slate-900 text-xl uppercase tracking-tight">{selected.name}</p>
              </div>
            </div>

            {/* PIN Entry Visualization */}
            <div className="flex flex-col items-center gap-6">
              <motion.div 
                animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="flex justify-center gap-4"
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={i < pin.length ? { scale: [1, 1.2, 1], rotate: [0, 10, 0] } : {}}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-300
                      ${i < pin.length 
                        ? 'bg-gold-500 border-gold-400 shadow-[0_0_15px_rgba(250,189,47,0.3)]' 
                        : 'bg-black/5 border-black/10'}`}
                  />
                ))}
              </motion.div>
              
              {error ? (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-xs font-bold uppercase tracking-widest bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20"
                >
                  {error}
                </motion.p>
              ) : (
                <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em]">
                  Security Verification Required
                </p>
              )}
            </div>

            {/* Premium Numpad */}
            <div className="grid grid-cols-3 gap-4">
              {digits.map((d, i) => (
                <motion.button
                  key={i}
                  whileTap={d ? { scale: 0.92 } : {}}
                  onClick={() => {
                    if (d === '⌫') handleDelete();
                    else if (d) handleDigit(d);
                  }}
                  disabled={!d}
                  className={`h-16 rounded-2xl font-display font-black text-2xl transition-all duration-200
                    ${d === '⌫' 
                      ? 'bg-black/5 text-slate-400'
                      : d 
                        ? 'bg-white/60 backdrop-blur-sm border border-black/5 text-slate-900 hover:bg-white hover:border-gold-500/40 active:text-gold-500 shadow-sm' 
                        : 'opacity-0 pointer-events-none'}`}
                >
                  {d}
                </motion.button>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={pin.length < 4 || loading}
              className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-surface-200 text-surface font-black py-5 
                         rounded-2xl transition-all shadow-glow-gold flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <div className="w-6 h-6 border-[3px] border-surface/20 border-t-surface rounded-full animate-spin" />
              ) : (
                <>
                  <Fingerprint size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="uppercase tracking-[0.1em] text-sm">Verify & Sign In</span>
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
