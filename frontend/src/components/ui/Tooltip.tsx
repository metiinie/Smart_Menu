import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  label: string;
}

export function Tooltip({ children, label }: TooltipProps) {
  return (
    <div className="group relative inline-flex items-center justify-center touch-manipulation">
      {children}
      <span className="pointer-events-none absolute -top-10 scale-95 opacity-0 transition-all duration-200 ease-out group-hover:scale-100 group-hover:opacity-100 group-active:scale-100 group-active:opacity-100 z-[100] whitespace-nowrap rounded-lg bg-black/85 px-2.5 py-1.5 text-[11px] font-bold tracking-wide text-white shadow-xl backdrop-blur-sm">
        {label}
        <svg className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-black/85" width="8" height="4" viewBox="0 0 8 4" fill="currentColor">
          <path d="M4 4L0 0H8L4 4Z" />
        </svg>
      </span>
    </div>
  );
}
