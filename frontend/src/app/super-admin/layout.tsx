import { AuthGuard } from '@/components/auth/AuthGuard';
import { Role } from '@/shared/types';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.SUPER_ADMIN]}>
      <div className="min-h-dvh bg-slate-950 flex flex-col font-sans">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <ShieldAlert size={20} className="text-rose-500" />
            </div>
            <div>
              <h1 className="font-display font-black text-white text-lg tracking-tight">ARIFSMART PLATFORM</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Administration</p>
            </div>
          </div>
          <nav className="flex gap-4">
            <Link href="/super-admin/restaurants" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
              Restaurants
            </Link>
          </nav>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
