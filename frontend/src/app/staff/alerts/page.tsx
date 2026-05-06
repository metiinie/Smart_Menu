'use client';

import { StaffAlertCenter } from '@/components/staff/StaffAlertCenter';
import { useAuthStore, selectBranchId } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';

export default function StaffAlertsPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const branchId = selectBranchId(user);

  return (
    <div className="p-6 bg-background min-h-screen transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-foreground tracking-tight">{t('serviceDesk')}</h1>
        <p className="text-sm text-foreground/40 mt-1 font-medium">{t('realTimeOccupancy')}</p>
      </div>
      
      <StaffAlertCenter branchId={branchId} />
      
      <div className="mt-12 p-6 bg-surface rounded-[2rem] border-2 border-surface-200 shadow-sm transition-colors duration-300">
        <h4 className="text-xs font-black text-foreground uppercase tracking-[0.2em] mb-4">{t('operationsManual')}</h4>
        <ul className="text-sm text-foreground/60 space-y-3 font-medium">
          <li className="flex gap-2">
            <span className="text-brand-500 font-black">•</span>
            <span>{t('staffAlertManual1')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-500 font-black">•</span>
            <span>{t('staffAlertManual2')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-500 font-black">•</span>
            <span>{t('staffAlertManual3')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
