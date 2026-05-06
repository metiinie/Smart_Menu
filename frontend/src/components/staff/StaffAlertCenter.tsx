'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  User, 
  Receipt, 
  MessageSquare,
  Volume2,
  VolumeX
} from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useTranslation } from '@/hooks/useTranslation';

interface StaffAlert {
  id: string;
  tableNumber: number;
  tableId: string;
  requestType: 'WAITER' | 'BILL' | 'HELP';
  timestamp: string;
}

export function StaffAlertCenter({ branchId }: { branchId: string }) {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<StaffAlert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleAlert = useCallback((data: any) => {
    // Only handle alerts for the current branch
    if (data.branchId && data.branchId !== branchId) return;

    const newAlert: StaffAlert = {
      id: `${data.tableId}-${Date.now()}`,
      ...data
    };
    setAlerts(prev => [newAlert, ...prev]);
    
    if (soundEnabled) {
      const audio = new Audio('/alert.mp3');
      audio.play().catch(e => console.log('Sound blocked by browser'));
    }
  }, [branchId, soundEnabled]);

  useEffect(() => {
    if (!branchId) return;
    const socket = getSocket();
    
    socket.on('waiter-call', handleAlert);
    return () => {
      socket.off('waiter-call', handleAlert);
    };
  }, [branchId, handleAlert]);

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'WAITER': return <User size={20} />;
      case 'BILL': return <Receipt size={20} />;
      default: return <MessageSquare size={20} />;
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case 'WAITER': return 'bg-blue-500';
      case 'BILL': return 'bg-amber-500';
      default: return 'bg-purple-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
            <Bell size={22} strokeWidth={2.5} />
          </div>
          <h2 className="text-lg font-black text-foreground tracking-tight">{t('activeRequests')}</h2>
          {alerts.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full animate-bounce shadow-lg shadow-red-500/20">
              {alerts.length}
            </span>
          )}
        </div>
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2.5 rounded-2xl bg-surface-100 text-foreground/40 transition-colors active:scale-90"
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {alerts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 flex flex-col items-center justify-center text-center bg-surface rounded-[2.5rem] border-2 border-dashed border-surface-200 transition-colors duration-300"
          >
            <div className="w-20 h-20 rounded-full bg-surface-100 flex items-center justify-center mb-4">
              <Bell size={32} className="text-foreground/20" />
            </div>
            <p className="text-base font-black text-foreground">{t('systemQuiet')}</p>
            <p className="text-sm text-foreground/40 mt-1 font-medium">{t('noActiveRequests')}</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="relative bg-surface rounded-[2rem] p-5 shadow-lg border-2 border-surface-200 flex items-center gap-5 group overflow-hidden transition-colors duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${getColorClass(alert.requestType)}`}>
                  {getIcon(alert.requestType)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-xl font-black text-foreground leading-none">
                      {t('table')} {alert.tableNumber}
                    </h3>
                    <span className="text-xs text-foreground/40 font-bold font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs font-black text-foreground/40 mt-2 uppercase tracking-[0.1em]">
                    {alert.requestType === 'WAITER' ? t('needsAssistance') : t('requestingBill')}
                  </p>
                </div>

                <button 
                  onClick={() => dismissAlert(alert.id)}
                  className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center text-foreground/40 hover:bg-surface-200 transition-colors active:scale-95"
                >
                  <X size={22} strokeWidth={2.5} />
                </button>
                
                {/* Visual indicator bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getColorClass(alert.requestType)}`} />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
