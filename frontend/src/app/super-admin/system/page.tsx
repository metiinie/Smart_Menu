'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api, telemetryApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Activity, Server, Database, Clock, RefreshCw, ShieldCheck, Bug, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

function useHealthCheck() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: () => api.get('/health').then((r) => r.data),
    refetchInterval: 30_000,
    retry: 1,
  });
}

function useTelemetryErrors() {
  return useQuery({
    queryKey: ['telemetry-errors'],
    queryFn: () => telemetryApi.getErrors(),
    refetchInterval: 60_000,
  });
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-surface-200 last:border-0">
      <div className="flex items-center gap-2.5">
        {ok
          ? <CheckCircle2 size={14} className="text-emerald-500" />
          : <XCircle size={14} className="text-rose-500" />}
        <span className="text-sm text-foreground/60 font-medium">{label}</span>
      </div>
      <span className={`text-xs font-bold ${ok ? 'text-emerald-500' : 'text-rose-500'}`}>{value}</span>
    </div>
  );
}

export default function SuperAdminSystemPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading, isError, dataUpdatedAt, isFetching } = useHealthCheck();
  const { data: errors = [], isFetching: isFetchingErrors } = useTelemetryErrors();

  const resolveMutation = useMutation({
    mutationFn: (id: string) => telemetryApi.resolveError(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['telemetry-errors'] });
      toast.success('Error marked as resolved');
    },
  });

  const now = new Date();
  const lastChecked = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  const health = data ?? { services: { api: false, db: false, storage: false } };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-0.5">{t('system')}</p>
          <h1 className="text-2xl font-black text-foreground tracking-tight">{t('systemHealth')}</h1>
        </div>
        <button 
          onClick={() => {
            qc.invalidateQueries({ queryKey: ['system-health'] });
            qc.invalidateQueries({ queryKey: ['telemetry-errors'] });
          }} 
          disabled={isFetching || isFetchingErrors}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-foreground/60 bg-surface-100 hover:bg-surface-200 hover:text-foreground transition-all disabled:opacity-50">
          <RefreshCw size={14} className={(isFetching || isFetchingErrors) ? 'animate-spin' : ''} /> {t('refresh')}
        </button>
      </div>

      {/* Overall Status Banner */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-4 p-5 rounded-2xl border transition-colors duration-300 ${
          isLoading ? 'bg-surface border-surface-200' :
          isError ? 'bg-rose-500/5 border-rose-500/20' :
          'bg-emerald-500/5 border-emerald-500/20'
        }`}>
        {isLoading ? (
          <div className="w-8 h-8 border-2 border-surface-200 border-t-foreground/20 rounded-full animate-spin" />
        ) : isError ? (
          <XCircle size={28} className="text-rose-500" />
        ) : (
          <CheckCircle2 size={28} className="text-emerald-500" />
        )}
        <div>
          <p className={`text-base font-black ${isLoading ? 'text-foreground/40' : isError ? 'text-rose-500' : 'text-emerald-500'}`}>
            {isLoading ? t('checking') : isError ? t('serviceDegraded') : t('allSystemsOperational')}
          </p>
          <p className="text-xs text-foreground/20 mt-0.5">
            {lastChecked ? `${t('lastCheckedAt')} ${lastChecked.toLocaleTimeString()}` : t('checkingStatus')}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Service Status */}
        <div className="bg-surface border border-surface-200 rounded-2xl p-6 transition-colors duration-300">
          <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-500" /> {t('serviceStatus')}
          </h3>
          <div className="space-y-4">
            {[
              { label: t('apiServer'), status: health.services.api ? 'online' : 'offline' },
              { label: t('database'), status: health.services.db ? 'online' : 'offline' },
              { label: t('fileStorage'), status: health.services.storage ? 'online' : 'offline' },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between p-3.5 bg-surface-100/50 border border-surface-200 rounded-xl">
                <span className="text-xs font-bold text-foreground/60">{s.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${s.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${s.status === 'online' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {s.status === 'online' ? t('online') : t('offline')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Environment Info */}
        <div className="bg-surface border border-surface-200 rounded-2xl p-5 transition-colors duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Database size={15} className="text-violet-500" />
            <h3 className="text-sm font-bold text-foreground">{t('environment')}</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: t('platform'), value: 'ArifSmart SaaS' },
              { label: t('environment'), value: process.env.NODE_ENV ?? 'development' },
              { label: t('frontend'), value: 'Next.js 14 (App Router)' },
              { label: t('backend'), value: 'NestJS + Prisma' },
              { label: t('database'), value: 'PostgreSQL (Neon)' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-surface-200 last:border-0">
                <span className="text-xs text-foreground/40">{label}</span>
                <span className="text-xs font-semibold text-foreground/60">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Uptime */}
        <div className="md:col-span-2 bg-surface border border-surface-200 rounded-2xl p-5 transition-colors duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} className="text-blue-500" />
            <h3 className="text-sm font-bold text-foreground">{t('liveStatus')}</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Response', value: data ? 'OK' : isError ? 'Error' : '…', icon: Server },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-surface-100 border border-surface-200 rounded-xl p-3">
                <Icon size={13} className="text-foreground/20 mb-2" />
                <p className="text-sm font-black text-foreground">{value}</p>
                <p className="text-[9px] text-foreground/40 uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Frontend Crash Logs */}
      <div className="bg-surface border border-surface-200 rounded-2xl p-6 mt-6 transition-colors duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Bug size={16} className="text-rose-500" /> Frontend Telemetry Logs
          </h3>
          <span className="px-2 py-1 bg-surface-100 rounded-lg text-[10px] font-bold text-foreground/40">
            {errors.filter((e: any) => !e.resolved).length} Unresolved
          </span>
        </div>
        
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence>
            {errors.length === 0 ? (
              <div className="text-center py-12 bg-surface-100/30 rounded-xl border border-surface-200 border-dashed">
                <ShieldCheck size={24} className="text-emerald-500/50 mx-auto mb-2" />
                <p className="text-xs font-bold text-foreground/40">No frontend crashes reported</p>
              </div>
            ) : (
              errors.map((error: any) => (
                <motion.div
                  key={error.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-4 rounded-xl border transition-all ${
                    error.resolved 
                      ? 'bg-surface-100/30 border-surface-200 opacity-60' 
                      : 'bg-rose-500/5 border-rose-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!error.resolved && <AlertTriangle size={12} className="text-rose-500 shrink-0" />}
                        <p className={`font-mono text-xs font-bold truncate ${error.resolved ? 'text-foreground/60' : 'text-rose-500'}`}>
                          {error.message}
                        </p>
                      </div>
                      <p className="text-[10px] text-foreground/40 break-all mb-2">
                        {error.url}
                      </p>
                      {error.stackTrace && !error.resolved && (
                        <pre className="mt-2 p-3 bg-black/40 rounded-lg text-[9px] text-rose-300/70 font-mono overflow-x-auto whitespace-pre-wrap max-h-32 custom-scrollbar">
                          {error.stackTrace}
                        </pre>
                      )}
                      <div className="flex items-center gap-3 mt-3 text-[9px] text-foreground/30 font-semibold uppercase tracking-wider">
                        <span>{new Date(error.createdAt).toLocaleString()}</span>
                        {error.restaurantId && <span>• Rest: {error.restaurantId.substring(0,6)}</span>}
                        {error.userId && <span>• User: {error.userId.substring(0,6)}</span>}
                      </div>
                    </div>
                    {!error.resolved && (
                      <button
                        onClick={() => resolveMutation.mutate(error.id)}
                        disabled={resolveMutation.isPending}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors shrink-0 disabled:opacity-50"
                        title="Mark as resolved"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
