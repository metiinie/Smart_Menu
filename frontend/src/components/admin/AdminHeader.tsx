import { motion } from 'framer-motion';
import { ShieldCheck, LogOut } from 'lucide-react';
import { ReactNode } from 'react';
import { ThemeToggle } from '../ui/ThemeToggle';

interface AdminHeaderProps {
  title: string;
  onLogout: () => void;
  titleBadge?: ReactNode;
  children?: ReactNode;
}

export function AdminHeader({ title, onLogout, titleBadge, children }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-surface-200 safe-top transition-colors duration-300">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center shadow-glow-sm">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-foreground text-sm tracking-tight">{title}</h1>
          {titleBadge}
        </div>
        <div className="flex items-center gap-2">
          {children}
          <ThemeToggle />
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={onLogout}
            className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-200 flex items-center justify-center border border-surface-200 dark:border-surface-300 transition-colors"
          >
            <LogOut size={16} className="text-foreground/60" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
