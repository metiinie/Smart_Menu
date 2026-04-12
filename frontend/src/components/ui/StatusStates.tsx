'use client';

import { motion } from 'framer-motion';
import { AlertCircle, FileSearch, Inbox, RefreshCw, MessageCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ErrorStateProps {
  message?: string;
  errorType?: string;
  orderId?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', errorType = 'General', orderId, onRetry }: ErrorStateProps) {
  const whatsappNumber = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '+251911223344';
  const reportText = encodeURIComponent(`ArifSmart Error Report\nType: ${errorType}\nOrder ID: ${orderId || 'N/A'}\nMessage: ${message}`);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${reportText}`;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
        <AlertCircle size={32} className="text-red-500" />
      </div>
      <h3 className="text-white font-bold text-xl mb-2">Oops!</h3>
      <p className="text-white/50 text-sm mb-8 max-w-[280px]">{message}</p>
      
      <div className="flex flex-col gap-3 w-full max-w-[240px]">
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-primary flex items-center justify-center gap-2 py-3"
          >
            <RefreshCw size={18} /> Retry
          </button>
        )}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-white/40 text-xs hover:text-white transition-colors py-2"
        >
          <MessageCircle size={14} /> Report Problem
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
  title = 'Not Found', 
  message = "We couldn't find what you were looking for.",
  returnHref = '/',
  returnLabel = 'Back to Home'
}: NotFoundStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mb-4">
        <FileSearch size={32} className="text-brand-500" />
      </div>
      <h3 className="text-white font-bold text-xl mb-2">{title}</h3>
      <p className="text-white/50 text-sm mb-8 max-w-[280px]">{message}</p>
      
      <Link
        href={returnHref}
        className="btn-primary flex items-center justify-center gap-2 py-3 w-full max-w-[240px]"
      >
        <ArrowLeft size={18} /> {returnLabel}
      </Link>
    </div>
  );
}

export function EmptyState({ message = 'No data available', icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center text-white/30">
      <Icon size={48} className="mb-4 opacity-50" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
