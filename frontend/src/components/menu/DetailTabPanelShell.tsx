'use client';

import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  contentClassName?: string;
};

/** White / light content card on green page — subtle brand-tinted wash. */
export function DetailTabPanelShell({
  children,
  contentClassName = 'px-4 pb-6 pt-5 sm:px-6 sm:pt-6',
}: Props) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#08AE75]/[0.07] via-white to-cyan-50/50" />
      <div className="pointer-events-none absolute -right-1/3 top-0 h-[200px] w-[80%] bg-[radial-gradient(ellipse_at_100%_0%,rgba(6,182,212,0.12),transparent_60%)]" />
      <div className={`relative ${contentClassName}`}>{children}</div>
    </div>
  );
}
