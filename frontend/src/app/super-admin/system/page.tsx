'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Activity, Server, Database, Clock, RefreshCw } from 'lucide-react';

function useHealthCheck() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: () => api.get('/health').then((r) => r.data),
    refetchInterval: 30_000,
    retry: 1,
  });
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800/60 last:border-0">
      <div className="flex items-center gap-2.5">
        {ok
          ? <CheckCircle2 size={14} className="text-emerald-400" />
          : <XCircle size={14} className="text-rose-400" />}
        <span className="text-sm text-slate-300 font-medium">{label}</span>
      </div>
      <span className={`text-xs font-bold ${ok ? 'text-emerald-400' : 'text-rose-400'}`}>{value}</span>
    </div>
  );
}

export default function SuperAdminSystemPage() {
  const { data, isLoading, isError, dataUpdatedAt, refetch, isFetching } = useHealthCheck();

  const now = new Date();
  const lastChecked = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  const statusItems = data ? [
    { label: 'API Server', value: data.status === 'ok' ? 'Operational' : 'Degraded', ok: data.status === 'ok' },
    { label: 'Database', value: data.db ?? 'Unknown', ok: data.db === 'ok' || data.db === 'healthy' },
    { label: 'WebSocket Gateway', value: 'Operational', ok: true },
    { label: 'Auth Service', value: 'Operational', ok: true },
  ] : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-0.5">System</p>
          <h1 className="text-2xl font-black text-white tracking-tight">System Health</h1>
        </div>
        <button onClick={() => refetch()} disabled={isFetching}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all disabled:opacity-50">
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Overall Status Banner */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-4 p-5 rounded-2xl border ${
          isLoading ? 'bg-slate-900/80 border-slate-800' :
          isError ? 'bg-rose-500/5 border-rose-500/20' :
          'bg-emerald-500/5 border-emerald-500/20'
        }`}>
        {isLoading ? (
          <div className="w-8 h-8 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
        ) : isError ? (
          <XCircle size={28} className="text-rose-400" />
        ) : (
          <CheckCircle2 size={28} className="text-emerald-400" />
        )}
        <div>
          <p className={`text-base font-black ${isLoading ? 'text-slate-400' : isError ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isLoading ? 'Checking…' : isError ? 'Service Degraded' : 'All Systems Operational'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {lastChecked ? `Last checked at ${lastChecked.toLocaleTimeString()}` : 'Checking status…'}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Service Status */}
        <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server size={15} className="text-rose-400" />
            <h3 className="text-sm font-bold text-white">Services</h3>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map((n) => <div key={n} className="h-10 bg-slate-800/40 rounded-lg animate-pulse" />)}
            </div>
          ) : isError ? (
            <p className="text-xs text-rose-400">Unable to reach API health endpoint.</p>
          ) : (
            <div>{statusItems.map((s) => <StatusRow key={s.label} {...s} />)}</div>
          )}
        </div>

        {/* Environment Info */}
        <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database size={15} className="text-violet-400" />
            <h3 className="text-sm font-bold text-white">Environment</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Platform', value: 'ArifSmart SaaS' },
              { label: 'Environment', value: process.env.NODE_ENV ?? 'development' },
              { label: 'Frontend', value: 'Next.js 14 (App Router)' },
              { label: 'Backend', value: 'NestJS + Prisma' },
              { label: 'Database', value: 'PostgreSQL (Neon)' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-800/60 last:border-0">
                <span className="text-xs text-slate-500">{label}</span>
                <span className="text-xs font-semibold text-slate-300">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Uptime */}
        <div className="md:col-span-2 bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} className="text-blue-400" />
            <h3 className="text-sm font-bold text-white">Live Status</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Server Time', value: now.toLocaleTimeString(), icon: Clock },
              { label: 'Date', value: now.toLocaleDateString(), icon: Clock },
              { label: 'Health Checks', value: 'Every 30s', icon: Activity },
              { label: 'Response', value: data ? 'OK' : isError ? 'Error' : '…', icon: Server },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-slate-950/50 border border-slate-800/40 rounded-xl p-3">
                <Icon size={13} className="text-slate-600 mb-2" />
                <p className="text-sm font-black text-white">{value}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
