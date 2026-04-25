'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MOCK_FX_AS_OF_ISO,
  MOCK_FX_ETB_PER_UNIT,
  convertEtbToCurrency,
  type MockFxCurrency,
} from '@/lib/menu/mockFxRates';
import { DetailTabPanelShell } from '@/components/menu/DetailTabPanelShell';

function formatConverted(amount: number, code: string): string {
  if (code === 'ETB') return Math.round(amount).toLocaleString('en-ET');
  if (amount >= 100) return amount.toFixed(2);
  if (amount >= 1) return amount.toFixed(2);
  return amount.toFixed(4);
}

export function CurrencyPanel({ priceEtb }: { priceEtb: number }) {
  const [selected, setSelected] = useState<MockFxCurrency>(() => MOCK_FX_ETB_PER_UNIT[0]!);

  const converted = useMemo(
    () => convertEtbToCurrency(priceEtb, selected),
    [priceEtb, selected],
  );

  const rateLine = useMemo(() => {
    if (selected.code === 'ETB') return `1 ETB = 1 ETB`;
    return `1 ${selected.code} = ${selected.etbPerUnit.toLocaleString('en-ET', { maximumFractionDigits: 2 })} ETB`;
  }, [selected]);

  return (
    <DetailTabPanelShell>
      <p className="font-mono text-[11px] text-slate-500">{MOCK_FX_AS_OF_ISO}</p>

      <p className="mt-6 text-3xl font-black tabular-nums tracking-tight text-slate-900 sm:text-4xl">
        {priceEtb.toLocaleString('en-ET')}
        <span className="ml-2 text-lg font-bold text-[#08AE75]">ETB</span>
      </p>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-1 no-scrollbar [-webkit-overflow-scrolling:touch]">
        {MOCK_FX_ETB_PER_UNIT.map((c) => {
          const on = c.code === selected.code;
          return (
            <motion.button
              key={c.code}
              type="button"
              onClick={() => setSelected(c)}
              whileTap={{ scale: 0.96 }}
              className={`relative shrink-0 rounded-2xl px-4 py-2.5 font-mono text-sm font-bold transition-colors ${
                on
                  ? 'text-slate-950 shadow-md shadow-cyan-500/15'
                  : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {on && (
                <motion.span
                  layoutId="currency-pill"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-200 via-white to-violet-200"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              )}
              <span className="relative z-10">{c.code}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="relative mt-8 overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/90 p-5 ring-1 ring-slate-100 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-50/80 via-transparent to-violet-50/60" />
        <p className="relative font-mono text-[11px] tracking-widest text-slate-500">{selected.code}</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={selected.code}
            initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-2 bg-gradient-to-r from-[#0d4a3c] via-[#08AE75] to-cyan-600 bg-clip-text text-4xl font-black tabular-nums tracking-tight text-transparent sm:text-5xl"
          >
            {selected.symbol}
            {formatConverted(converted, selected.code)}
          </motion.p>
        </AnimatePresence>
        <p className="relative mt-4 border-t border-slate-200/90 pt-4 font-mono text-xs text-slate-500">{rateLine}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-slate-500">
        {MOCK_FX_ETB_PER_UNIT.filter((c) => c.code !== 'ETB').map((c) => (
          <span key={c.code}>
            {c.code} {c.etbPerUnit.toFixed(2)}
          </span>
        ))}
      </div>
    </DetailTabPanelShell>
  );
}
