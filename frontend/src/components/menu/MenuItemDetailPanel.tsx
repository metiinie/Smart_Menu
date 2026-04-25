'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ArrowLeft, Plus, Minus, ShoppingCart, MessageSquare, Zap, Dumbbell, Droplets, Box, Sparkles } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Script from 'next/script';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        'auto-rotate'?: boolean;
        'camera-controls'?: boolean;
        'shadow-intensity'?: string;
        'environment-image'?: string;
        'rotation-per-second'?: string;
        'interaction-prompt'?: string;
      }, HTMLElement>;
    }
  }
}
import type { MenuItem } from '@arifsmart/shared';
import {
  getIngredientInsights,
  type IngredientInsights,
  type NutritionRow,
  type NutritionSection,
} from '@/lib/menu/placeholderIngredientInsights';
import { CurrencyPanel } from '@/components/menu/CurrencyPanel';
import { DetailTabPanelShell } from '@/components/menu/DetailTabPanelShell';

const palette = {
  patternStroke: '#E9DFD1',
};

import { Tooltip } from '@/components/ui/Tooltip';

function hasTextHeadline(headline: string): boolean {
  const t = headline.trim();
  return t.length > 0 && t !== '—';
}

type DetailTabId = 'nutrition' | 'ingredients' | 'currency';

type NutritionFilterId = 'all' | 'macros' | 'fats' | 'vitamins' | 'minerals';

const DETAIL_TABS: { id: DetailTabId; label: string }[] = [
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'currency', label: 'Currency' },
];

interface Props {
  item: MenuItem | null;
  quantity: number;
  onClose: () => void;
  onAdd: (note?: string) => void;
  onRemove: () => void;
  onOpenCart?: () => void;
}

export function MenuItemDetailPanel({ item, quantity, onClose, onAdd, onRemove, onOpenCart }: Props) {
  const [note, setNote] = useState('');
  const [detailTab, setDetailTab] = useState<DetailTabId>('nutrition');
  const [is3DMode, setIs3DMode] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (item) {
      setNote('');
      setDetailTab('nutrition');
      setIs3DMode(false);
      setCurrentImageIndex(0);
    }
  }, [item?.id]);

  useEffect(() => {
    if (!item) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [item]);

  const handleAdd = () => {
    onAdd(note);
    if (quantity === 0) {
      onClose();
    }
  };

  const insights = item ? getIngredientInsights(item) : null;

  const mockImages = useMemo(() => {
    if (!item?.imageUrl) return [];
    // Mocking 3 angles of the same image to demonstrate the carousel functionality
    return [
      item.imageUrl,
      item.imageUrl,
      item.imageUrl,
    ];
  }, [item?.imageUrl]);

  return (
    <AnimatePresence>
      {item && insights && (
        <>
          <Script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js" />
          <motion.button
            type="button"
            aria-label="Close details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[65]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="item-detail-title"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="fixed inset-0 z-[75] flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#06a06e] font-sans"
          >
            {/* Scroll height = content only; modest bottom pad */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
              <div className="relative bg-[#FBF8F3]">
                <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
                  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="detailSketch" x="0" y="0" width="180" height="180" patternUnits="userSpaceOnUse">
                      <path
                        d="M20 30 L60 30 L40 70 Z"
                        fill="none"
                        stroke={palette.patternStroke}
                        strokeWidth="1"
                        strokeLinecap="round"
                      />
                      <circle cx="35" cy="40" r="2" fill={palette.patternStroke} />
                      <path d="M90 40 Q120 40 120 55 H90 Z" fill="none" stroke={palette.patternStroke} strokeWidth="1" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#detailSketch)" />
                  </svg>
                </div>

                <header className="relative z-10 flex items-center justify-between gap-3 px-4 pb-1 pt-4 sm:px-5 sm:pt-5">
                  <Tooltip label="Back">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1E1E1E]/[0.06] text-[#1E1E1E] transition-transform active:scale-95"
                      aria-label="Back to menu"
                    >
                      <ArrowLeft size={22} strokeWidth={2} />
                    </button>
                  </Tooltip>
                  <p className="text-[11px] font-serif uppercase tracking-[0.2em] text-[#1E1E1E]/45">Dish</p>
                  <div className="flex items-center gap-2">
                    <Tooltip label={is3DMode ? "View Gallery" : "View in 3D"}>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIs3DMode(!is3DMode)}
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${
                          is3DMode 
                            ? 'bg-[#1E1E1E] text-[#44CFA0]' 
                            : 'bg-[#1E1E1E]/[0.06] text-[#1E1E1E] hover:bg-[#1E1E1E]/10'
                        }`}
                        aria-label="Toggle AR Stage View"
                      >
                        {is3DMode ? <Sparkles size={20} /> : <Box size={20} />}
                      </motion.button>
                    </Tooltip>
                    {onOpenCart ? (
                      <Tooltip label="Cart">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenCart();
                          }}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1E1E1E]/[0.06] text-[#1E1E1E] transition-transform active:scale-95"
                          aria-label="Open cart"
                        >
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 01-8 0" />
                          </svg>
                        </button>
                      </Tooltip>
                    ) : null}
                  </div>
                </header>

                <div className="relative z-10 flex min-h-0 flex-col items-center px-4 pb-5 pt-1 w-full">
                  <div className="relative flex w-full justify-center">
                    <motion.div
                      initial={false}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                      className="relative h-[min(52vw,200px)] w-[min(52vw,200px)] min-h-[140px] min-w-[140px] max-h-[200px] max-w-[200px]"
                    >
                      {is3DMode ? (
                        <div className="absolute inset-0 flex items-center justify-center w-full h-full rounded-full z-10 bg-[#06a06e]/20 ring-4 ring-white/20 shadow-2xl overflow-hidden backdrop-blur-sm">
                          {/* True 3D Model Viewer */}
                          <model-viewer
                            src="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb"
                            alt="3D representation of the dish"
                            auto-rotate
                            camera-controls
                            shadow-intensity="1.5"
                            environment-image="neutral"
                            rotation-per-second="20deg"
                            interaction-prompt="auto"
                            style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="absolute bottom-[6%] left-1/2 h-[12%] w-[78%] -translate-x-1/2 rounded-full bg-[#08AE75]/20 blur-2xl" />
                          <div className="absolute inset-0 scale-[0.88] rounded-full bg-[#44CFA0]/70 blur-xl" />
                          <div className="absolute inset-[18%] rounded-full bg-[#39C798]" />
                          <div className="absolute inset-[22%] z-10 overflow-hidden rounded-full shadow-lg ring-2 ring-white/50 bg-white">
                            {mockImages.length > 0 ? (
                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={currentImageIndex}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  transition={{ duration: 0.2 }}
                                  className="absolute inset-0"
                                >
                                  <Image src={mockImages[currentImageIndex]} alt={item.name} fill className="object-contain" sizes="200px" />
                                </motion.div>
                              </AnimatePresence>
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-white/10 text-5xl">🍽️</div>
                            )}
                          </div>
                        </>
                      )}

                      {item.isFasting && !is3DMode && (
                        <span className="absolute -top-0.5 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/40 bg-[#08AE75] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white shadow-lg">
                          Fasting
                        </span>
                      )}
                    </motion.div>
                  </div>

                  {/* Carousel Indicators */}
                  {!is3DMode && mockImages.length > 1 && (
                    <div className="mt-4 flex gap-1.5 z-10">
                      {mockImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            currentImageIndex === idx ? 'w-5 bg-[#1E1E1E]' : 'w-1.5 bg-[#1E1E1E]/30'
                          }`}
                          aria-label={`Go to image ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  <h1
                    id="item-detail-title"
                    className="mt-3 max-w-[20rem] text-center font-serif text-lg font-semibold leading-tight tracking-tight text-[#1E1E1E] line-clamp-2 sm:text-xl"
                  >
                    {item.name}
                  </h1>
                  <p className="mt-1 text-2xl font-black tabular-nums text-[#b8895c] sm:text-[1.65rem]">
                    {Math.round(item.price)}
                    <span className="ml-1 text-sm font-bold text-[#1E1E1E]/40">ETB</span>
                  </p>
                </div>
              </div>

              <div className="relative border-t border-white/15 bg-gradient-to-b from-[#059c6a] to-[#048a5e] px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:px-5">
                <div className="mx-auto max-w-md mb-4">
                  <nav aria-label="Dish details">
                    <div className="flex gap-1.5 overflow-x-auto rounded-2xl bg-white/20 p-1.5 ring-1 ring-white/25 backdrop-blur-md no-scrollbar [-webkit-overflow-scrolling:touch]">
                      {DETAIL_TABS.map(({ id, label }) => {
                        const active = detailTab === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setDetailTab(id)}
                            className={`relative min-h-[48px] min-w-[5.5rem] flex-1 rounded-2xl text-[12px] font-bold tracking-tight transition-colors sm:text-[13px] ${
                              active
                                ? 'text-slate-950'
                                : 'text-white/90 hover:bg-white/15'
                            }`}
                          >
                            {active && (
                              <motion.span
                                layoutId="detail-tab-pill"
                                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-200 via-white to-violet-200 shadow-md shadow-cyan-500/25"
                                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                              />
                            )}
                            <span className="relative z-10 flex h-full items-center justify-center px-2">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </nav>
                </div>
                <div className="mx-auto max-w-md">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={detailTab}
                      role="tabpanel"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="space-y-4 pb-2"
                    >
                      {detailTab === 'nutrition' && <NutritionModern insights={insights} resetKey={item.id} />}
                      {detailTab === 'ingredients' && <IngredientsModern insights={insights} />}
                      {detailTab === 'currency' && <CurrencyPanel priceEtb={Math.round(item.price)} />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-white/20 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.1)] backdrop-blur-xl sm:px-5 space-y-3">
                <label className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-[0.16em]">
                  <MessageSquare size={12} className="text-[#08AE75]" />
                  Note to kitchen
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. No onions, mild spice…"
                  rows={2}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-[#08AE75]/40 focus:ring-2 focus:ring-[#08AE75]/15 resize-none"
                />
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/90 p-1.5">
                    <Tooltip label="Decrease">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.88 }}
                        onClick={onRemove}
                        disabled={quantity === 0}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-100 disabled:opacity-30"
                      >
                        <Minus size={18} />
                      </motion.button>
                    </Tooltip>
                    <span className="w-7 text-center font-black text-lg tabular-nums text-slate-800">{quantity}</span>
                    <Tooltip label="Increase">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.88 }}
                        onClick={handleAdd}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#08AE75] text-white shadow-md"
                      >
                        <Plus size={18} />
                      </motion.button>
                    </Tooltip>
                  </div>
                  <Tooltip label={quantity > 0 ? "Update Cart" : "Add to Cart"}>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={handleAdd}
                      className="flex h-[3.25rem] flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-800/10 bg-[#2A5D55] font-black text-[15px] uppercase tracking-[0.12em] text-white shadow-lg transition-colors active:bg-[#234d48]"
                    >
                      <ShoppingCart size={18} />
                      {quantity > 0 ? 'Update' : 'Add'}
                    </motion.button>
                  </Tooltip>
                </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function isPlaceholderStat(v: string | null): boolean {
  if (v == null || !v.trim()) return true;
  return /^[\s—\-~]+$/.test(v) || v.includes('—');
}

function macroSummary(insights: IngredientInsights) {
  const block = insights.nutritionSections.find(
    (s) => /energy|macro/i.test(s.title),
  );
  if (!block) return { energy: null as string | null, protein: null as string | null, fat: null as string | null };
  const find = (re: RegExp) => block.rows.find((r) => re.test(r.nutrient))?.amount ?? null;
  const energy = find(/^energy$/i);
  const protein = find(/^protein$/i);
  const fat = find(/total fat/i);
  return {
    energy: isPlaceholderStat(energy) ? null : energy,
    protein: isPlaceholderStat(protein) ? null : protein,
    fat: isPlaceholderStat(fat) ? null : fat,
  };
}

function findMacrosSection(insights: IngredientInsights): NutritionSection | undefined {
  return insights.nutritionSections.find((s) => /energy|macro/i.test(s.title));
}

function findVitaminsSection(insights: IngredientInsights): NutritionSection | undefined {
  return insights.nutritionSections.find((s) => /vitamin/i.test(s.title));
}

function findMineralsSection(insights: IngredientInsights): NutritionSection | undefined {
  return insights.nutritionSections.find((s) => /mineral/i.test(s.title));
}

function fatDetailRows(macro: NutritionSection | undefined): NutritionRow[] {
  if (!macro) return [];
  return macro.rows.filter((r) => {
    const n = r.nutrient.toLowerCase();
    return (
      n.includes('fat') ||
      n.includes('saturated') ||
      n.includes('trans') ||
      n.includes('cholesterol')
    );
  });
}

function useNutritionFilterTabs(insights: IngredientInsights) {
  return useMemo(() => {
    const macroSec = findMacrosSection(insights);
    const vitSec = findVitaminsSection(insights);
    const minSec = findMineralsSection(insights);
    const fats = fatDetailRows(macroSec);
    const tabs: { id: NutritionFilterId; label: string }[] = [{ id: 'all', label: 'All' }];
    if (macroSec) tabs.push({ id: 'macros', label: 'Macros' });
    if (fats.length) tabs.push({ id: 'fats', label: 'Fats' });
    if (vitSec) tabs.push({ id: 'vitamins', label: 'Vitamins' });
    if (minSec) tabs.push({ id: 'minerals', label: 'Minerals' });
    return { tabs, macroSec, vitSec, minSec, fatRows: fats };
  }, [insights]);
}

function NutritionSectionTable({
  section,
  displayTitle,
  index,
}: {
  section: NutritionSection;
  displayTitle?: string;
  index: number;
}) {
  const title = displayTitle ?? section.title;
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 + index * 0.04 }}
      className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/90 px-4 py-3 sm:px-5">
        <span className="h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-[#08AE75] to-cyan-500" />
        <h2 className="text-sm font-bold tracking-tight text-slate-800">{title}</h2>
      </div>
      <div className="px-2 pb-1 sm:px-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_3.25rem] gap-x-2 border-b border-slate-100 px-2 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:px-3">
          <span>Nutrient</span>
          <span className="text-right">Amount</span>
          <span className="text-right">% DV</span>
        </div>
        {section.rows.map((row) => (
          <NutritionRowModern key={`${title}-${row.nutrient}`} row={row} />
        ))}
      </div>
    </motion.section>
  );
}

function NutritionModern({ insights, resetKey }: { insights: IngredientInsights; resetKey: string }) {
  const [nutritionFilter, setNutritionFilter] = useState<NutritionFilterId>('all');
  const { tabs, macroSec, vitSec, minSec, fatRows } = useNutritionFilterTabs(insights);

  useEffect(() => {
    setNutritionFilter('all');
  }, [resetKey]);

  useEffect(() => {
    if (tabs.some((t) => t.id === nutritionFilter)) return;
    setNutritionFilter('all');
  }, [tabs, nutritionFilter]);

  const summary = useMemo(() => macroSummary(insights), [insights]);

  const macroTiles = useMemo(() => {
    const list = [
      {
        label: 'Energy',
        value: summary.energy,
        icon: Zap,
        gradient: 'from-amber-400 to-orange-500',
        iconWrap: 'bg-amber-100 text-amber-800',
      },
      {
        label: 'Protein',
        value: summary.protein,
        icon: Dumbbell,
        gradient: 'from-emerald-400 to-teal-500',
        iconWrap: 'bg-emerald-100 text-emerald-800',
      },
      {
        label: 'Total fat',
        value: summary.fat,
        icon: Droplets,
        gradient: 'from-sky-400 to-indigo-500',
        iconWrap: 'bg-sky-100 text-sky-800',
      },
    ].filter((t) => t.value);
    if (nutritionFilter === 'fats') {
      return list.filter((c) => c.label === 'Total fat');
    }
    if (nutritionFilter === 'vitamins' || nutritionFilter === 'minerals') {
      return [];
    }
    return list;
  }, [summary.energy, summary.fat, summary.protein, nutritionFilter]);

  const sectionBlocks = useMemo((): { section: NutritionSection; title?: string }[] => {
    switch (nutritionFilter) {
      case 'all':
        return insights.nutritionSections.map((s) => ({ section: s }));
      case 'macros':
        return macroSec ? [{ section: macroSec }] : [];
      case 'fats': {
        if (fatRows.length === 0) return [];
        return [
          {
            section: { title: 'Fats', rows: fatRows },
            title: 'Fats',
          },
        ];
      }
      case 'vitamins':
        return vitSec ? [{ section: vitSec }] : [];
      case 'minerals':
        return minSec ? [{ section: minSec }] : [];
      default: {
        const _e: never = nutritionFilter;
        return _e;
      }
    }
  }, [insights, nutritionFilter, macroSec, vitSec, minSec, fatRows]);

  const showDietary =
    nutritionFilter === 'all' || nutritionFilter === 'macros' || nutritionFilter === 'fats';

  return (
    <DetailTabPanelShell>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar [-webkit-overflow-scrolling:touch] -mx-1 px-1">
        {tabs.map((tab) => {
          const on = tab.id === nutritionFilter;
          return (
            <motion.button
              key={tab.id}
              type="button"
              onClick={() => setNutritionFilter(tab.id)}
              whileTap={{ scale: 0.96 }}
              className={`relative shrink-0 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-colors sm:px-4 sm:text-sm ${
                on
                  ? 'text-slate-950 shadow-md shadow-cyan-500/15'
                  : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {on && (
                <motion.span
                  layoutId="nutrition-filter-pill"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-200 via-white to-violet-200"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              )}
              <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 sm:p-5"
      >
        <p className="relative font-mono text-[11px] leading-relaxed text-slate-500">{insights.servingLine}</p>
        {hasTextHeadline(insights.headline) ? (
          <p className="relative mt-3 text-base font-semibold leading-snug text-slate-800 sm:text-lg">
            {insights.headline}
          </p>
        ) : null}
      </motion.div>

      {macroTiles.length > 0 && (
        <div
          className={`mt-5 grid gap-2 sm:gap-3 ${
            macroTiles.length === 1 ? 'grid-cols-1 sm:max-w-xs' : 'grid-cols-3'
          }`}
        >
          {macroTiles.map((cell, i) => {
            const Icon = cell.icon;
            return (
              <motion.div
                key={cell.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 + i * 0.05 }}
                className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-3.5"
              >
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${cell.gradient} opacity-90`}
                />
                <div className={`relative mb-2 inline-flex rounded-lg p-1.5 ${cell.iconWrap}`}>
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <p className="relative text-[9px] font-bold uppercase tracking-wider text-slate-500">{cell.label}</p>
                <p className="relative mt-0.5 text-sm font-bold tabular-nums leading-tight text-slate-900 sm:text-base">
                  {cell.value}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}

      <motion.div
        key={nutritionFilter}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="min-h-0"
      >
        {sectionBlocks.map((b, idx) => (
          <NutritionSectionTable
            key={b.title ?? b.section.title}
            section={b.section}
            displayTitle={b.title}
            index={idx}
          />
        ))}

        {sectionBlocks.length === 0 && (
          <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
            No data for this view.
          </p>
        )}
      </motion.div>

      {showDietary && insights.dietaryTags.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
          className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-emerald-100/80 bg-emerald-50/50 p-4"
        >
          {insights.dietaryTags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80 shadow-sm"
            >
              {t}
            </span>
          ))}
        </motion.div>
      )}
    </DetailTabPanelShell>
  );
}

function parseDailyPercent(dv: string | undefined): number | null {
  if (dv == null || dv === '—' || !String(dv).includes('%')) return null;
  const m = String(dv).match(/(\d+)/);
  if (!m) return null;
  return Math.min(100, parseInt(m[1], 10));
}

function NutritionRowModern({ row }: { row: NutritionRow }) {
  const pct = parseDailyPercent(row.dailyValue);
  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_auto_3.25rem] items-center gap-x-2 border-b border-slate-100 px-2 py-2.5 last:border-b-0 sm:px-3 ${
        row.sub ? 'bg-slate-50/80' : ''
      }`}
    >
      <span
        className={`min-w-0 text-[13px] leading-snug ${
          row.sub ? 'border-l-2 border-[#08AE75]/50 pl-2.5 text-slate-500' : 'font-semibold text-slate-800'
        }`}
      >
        {row.nutrient}
      </span>
      <span className="shrink-0 text-right text-[13px] font-semibold tabular-nums text-slate-900">{row.amount}</span>
      <div className="flex min-h-[2.25rem] flex-col items-end justify-center gap-1">
        <span className="text-[11px] tabular-nums text-slate-500">{row.dailyValue ?? '—'}</span>
        {pct != null ? (
          <div className="h-1 w-full max-w-[2.75rem] overflow-hidden rounded-full bg-slate-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-[#08AE75] to-cyan-500"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function IngredientsModern({ insights }: { insights: IngredientInsights }) {
  return (
    <DetailTabPanelShell>
      {hasTextHeadline(insights.headline) ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 sm:p-5"
        >
          <p className="text-[15px] font-medium leading-snug text-slate-800 sm:text-base">{insights.headline}</p>
        </motion.div>
      ) : null}

      <ul className={`${hasTextHeadline(insights.headline) ? 'mt-5' : ''} space-y-3`}>
        {insights.ingredients.map((ing, i) => (
          <motion.li
            key={ing.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex gap-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-200 via-white to-violet-200 text-sm font-black text-slate-900 shadow-sm ring-1 ring-slate-200/50">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[15px] font-semibold leading-tight text-slate-900">{ing.name}</p>
              {ing.detail ? <p className="mt-1 text-[13px] leading-snug text-slate-500">{ing.detail}</p> : null}
            </div>
          </motion.li>
        ))}
      </ul>
    </DetailTabPanelShell>
  );
}

