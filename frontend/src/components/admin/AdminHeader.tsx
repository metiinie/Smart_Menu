import { motion } from 'framer-motion';
import { ShieldCheck, LogOut } from 'lucide-react';
import { ReactNode } from 'react';

interface AdminHeaderProps {
  title: string;
  onLogout: () => void;
  titleBadge?: ReactNode;
  children?: ReactNode;
}

export function AdminHeader({ title, onLogout, titleBadge, children }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-surface-200 safe-top">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-white text-sm">{title}</h1>
          {titleBadge}
        </div>
        <div className="flex items-center gap-2">
          {children}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onLogout}
            className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center"
          >
            <LogOut size={14} className="text-white/60" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
