import Link from 'next/link';
import { QrCode, Utensils, ChefHat, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-500 shadow-glow mb-4">
          <Utensils size={36} className="text-white" />
        </div>
        <h1 className="font-display text-4xl font-bold text-white">
          Arif<span className="text-gradient">Smart</span>
        </h1>
        <p className="text-white/50 mt-2 text-sm">QR-based restaurant ordering</p>
      </div>

      {/* Instructions */}
      <div className="card w-full max-w-sm p-6 space-y-4 mb-8">
        <h2 className="font-display text-lg font-semibold text-white text-center">
          How it works
        </h2>
        {[
          { icon: QrCode, title: 'Scan QR code', desc: 'Find the QR code on your table' },
          { icon: Utensils, title: 'Browse menu', desc: 'Explore categories and add items' },
          { icon: ShieldCheck, title: 'Place order', desc: 'Confirm and we\'ll handle the rest' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <Icon size={18} className="text-brand-400" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{title}</p>
              <p className="text-white/50 text-xs mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Staff Links */}
      <div className="flex gap-4 w-full max-w-sm">
        <Link
          href="/kitchen"
          className="flex-1 flex items-center justify-center gap-2 btn-secondary text-sm py-3"
        >
          <ChefHat size={16} />
          Kitchen
        </Link>
        <Link
          href="/admin/menu"
          className="flex-1 flex items-center justify-center gap-2 btn-secondary text-sm py-3"
        >
          <ShieldCheck size={16} />
          Admin
        </Link>
      </div>

      <p className="text-white/25 text-xs mt-8">
        Scan a table QR code to start ordering
      </p>
    </main>
  );
}
