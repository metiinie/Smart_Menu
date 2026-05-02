'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, Fingerprint } from 'lucide-react';
import { authApi } from '@/lib/api';
import { BrandLogo } from './BrandLogo';

interface Props {
  onSuccess: (token: string, user: any) => void;
}

export function EmailLogin({ onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await authApi.login(email, password);
      onSuccess(res.token, res.user);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <BrandLogo className="mb-10" />

        <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
          <div className="text-center space-y-2 mb-4">
            <h2 className="text-2xl font-display font-black text-slate-900 uppercase tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 text-sm font-medium">Sign in to manage your restaurant</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-gold-600 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@arifsmart.com"
                    required
                    className="w-full bg-white/60 border border-white/80 focus:border-gold-500/50 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-300 shadow-sm"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-gold-600 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white/60 border border-white/80 focus:border-gold-500/50 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-300 shadow-sm"
                  />
                </div>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 bg-red-500/5 border border-red-500/10 text-red-500 p-4 rounded-2xl text-xs font-bold uppercase tracking-tight"
              >
                <AlertCircle size={16} className="flex-shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-slate-200 text-slate-900 font-black py-4 rounded-2xl transition-all shadow-lg shadow-gold-500/20 flex items-center justify-center gap-3 group overflow-hidden relative"
            >
              {loading ? (
                <div className="w-6 h-6 border-[3px] border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                  <span className="uppercase tracking-widest text-sm">Sign In</span>
                </>
              )}
            </motion.button>
          </form>

          <div className="pt-4 border-t border-slate-100/50 flex flex-col items-center gap-3">
             <div className="flex items-center gap-2 text-slate-300">
                <Fingerprint size={14} />
                <p className="text-[10px] font-bold uppercase tracking-widest">Secure Dashboard Access</p>
             </div>
          </div>
        </div>
        
        <p className="text-center text-slate-400 text-xs font-medium">
          Forgot your password? <span className="text-gold-600 font-bold cursor-pointer hover:underline">Contact Support</span>
        </p>
      </motion.div>
    </div>
  );
}
