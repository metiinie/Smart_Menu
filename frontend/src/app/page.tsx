'use client';

import React from 'react';
import { Utensils } from 'lucide-react';

export default function HomePage() {
  const languages = [
    { code: 'en', label: 'English', active: true },
    { code: 'am', label: 'አማርኛ', active: false },
    { code: 'or', label: 'Afaan Oromoo', active: false },
  ];

  return (
    <main className="min-h-dvh relative flex flex-col items-center justify-between bg-[#FCFAF7] px-6 py-20 overflow-hidden">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="food-pattern-home" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M10 10 Q 15 5, 20 10 T 30 10" stroke="black" fill="transparent" />
            <circle cx="50" cy="50" r="2" fill="black" />
            <rect x="70" y="20" width="10" height="10" rx="2" stroke="black" fill="transparent" />
            <path d="M20 70 L 30 80 L 40 70" stroke="black" fill="transparent" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#food-pattern-home)" />
        </svg>
      </div>

      {/* Decorative Blobs */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Center Content */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 text-center">
        {/* Golden Cloche Icon */}
        <div className="mb-12 transform scale-125">
          <svg width="100" height="75" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
            <path d="M40 10C25 10 12 18 10 28H70C68 18 55 10 40 10Z" fill="url(#gold_grad_home)" stroke="#D97706" strokeWidth="1" />
            <rect x="8" y="28" width="64" height="4" rx="2" fill="#D97706" />
            <circle cx="40" cy="8" r="4" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
            <defs>
              <linearGradient id="gold_grad_home" x1="40" y2="28" x2="40" y1="10" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDE68A" />
                <stop offset="1" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="space-y-4">
          <span className="font-display text-sm font-medium tracking-[0.3em] text-slate-400 uppercase block">
            Welcome To
          </span>
          <h1 className="font-display text-2xl md:text-4xl font-extrabold text-[#1E293B] leading-tight tracking-tight">
            ARIFSMART<br />
            <span className="text-[#F97316]">MENU</span>
          </h1>
        </div>
      </div>

      {/* Language Selector Footer */}
      <div className="w-full flex flex-col items-center gap-6 z-10">
        <span className="font-display text-[10px] text-slate-400 font-bold tracking-widest uppercase opacity-70">
          Select Language
        </span>
        <div className="flex flex-wrap justify-center gap-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border ${lang.active
                ? 'bg-[#F97316] text-white border-transparent shadow-lg shadow-orange-500/25 ring-2 ring-orange-100 ring-offset-1'
                : 'bg-white text-slate-600 border-slate-100 hover:border-orange-200 hover:bg-orange-50/30'
                }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <p className="mt-8 text-[10px] text-slate-400 font-medium">
          Scan a table QR code to begin your journey
        </p>
      </div>
    </main>
  );
}
