'use client';

import { AlertCircle, FileSearch, Inbox, RefreshCw, MessageCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

interface ErrorStateProps {
  message?: string;
  errorType?: string;
  orderId?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, errorType = 'General', orderId, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  const displayMessage = message || t('operationFailed');
  const whatsappNumber = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '+251911223344';
  const reportText = encodeURIComponent(`ArifSmart Error Report\nType: ${errorType}\nOrder ID: ${orderId || 'N/A'}\nMessage: ${message}`);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${reportText}`;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
        <AlertCircle size={32} className="text-red-500" />
      </div>
      <h3 className="text-foreground font-bold text-xl mb-2">{t('oops')}</h3>
      <p className="text-foreground/50 text-sm mb-8 max-w-[280px]">{displayMessage}</p>
      
      <div className="flex flex-col gap-3 w-full max-w-[240px]">
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-primary flex items-center justify-center gap-2 py-3"
          >
            <RefreshCw size={18} /> {t('retry')}
          </button>
        )}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-foreground/40 text-xs hover:text-foreground transition-colors py-2"
        >
          <MessageCircle size={14} /> {t('reportProblem')}
        </a>
      </div>
    </div>
  );
}

interface NotFoundStateProps {
  title?: string;
  message?: string;
  returnHref?: string;
  returnLabel?: string;
}

export function NotFoundState({ 
  title, 
  message,
  returnHref = '/',
  returnLabel
}: NotFoundStateProps) {
  const { t } = useTranslation();
  const displayTitle = title || t('notFound');
  const displayMessage = message || t('noData');
  const displayLabel = returnLabel || t('backToHome');
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mb-4">
        <FileSearch size={32} className="text-brand-500" />
      </div>
      <h3 className="text-foreground font-bold text-xl mb-2">{displayTitle}</h3>
      <p className="text-foreground/50 text-sm mb-8 max-w-[280px]">{displayMessage}</p>
      
      <Link
        href={returnHref}
        className="btn-primary flex items-center justify-center gap-2 py-3 w-full max-w-[240px]"
      >
        <ArrowLeft size={18} /> {displayLabel}
      </Link>
    </div>
  );
}

export function EmptyState({ message, icon: Icon = Inbox }: { message?: string; icon?: any }) {
  const { t } = useTranslation();
  const displayMessage = message || t('noData');
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center text-foreground/20">
      <Icon size={48} className="mb-4 opacity-50" />
      <p className="text-sm font-medium">{displayMessage}</p>
    </div>
  );
}
