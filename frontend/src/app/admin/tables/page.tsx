'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  QrCode,
  ToggleLeft,
  ToggleRight,
  Download,
  X,
  RefreshCw,
  Hash,
  Printer,
  Copy,
  Check,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore, selectBranchId } from '@/stores/authStore';
import { QRCodeSVG } from 'qrcode.react';

const APP_URL = typeof window !== 'undefined' ? window.location.origin : '';

/** Shared logo config for branded QR codes */
const QR_LOGO = {
  src: '/icons/icon-192.png',
  height: 36,
  width: 36,
  excavate: true,
};
const QR_LOGO_PRINT = {
  src: '/icons/icon-192.png',
  height: 28,
  width: 28,
  excavate: true,
};

export default function AdminTablesPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const branchId = selectBranchId(user);
  const [showAdd, setShowAdd] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [qrTable, setQrTable] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const printSheetRef = useRef<HTMLDivElement>(null);

  const { data: tables = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-tables', branchId],
    queryFn: () => adminApi.getTables(branchId),
    enabled: !!branchId,
  });

  const handleCreate = async () => {
    if (!newTableNum) return;
    try {
      await adminApi.createTable({ branchId: branchId, tableNumber: parseInt(newTableNum) });
      setNewTableNum('');
      setShowAdd(false);
      refetch();
      toast.success(t('success'));
    } catch (err: any) {
      toast.error(err.message || t('operationFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteTableConfirm'))) return;
    try {
      await adminApi.deleteTable(id);
      refetch();
    } catch (err: any) {
      toast.error(err.message || t('operationFailed'));
    }
  };

  const handleToggle = async (table: any) => {
    try {
      await adminApi.toggleTableStatus(table.id, !table.isActive);
      refetch();
    } catch (err: any) {
      toast.error(err.message || t('operationFailed'));
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to close this table session?')) return;
    try {
      await adminApi.closeTableSession(sessionId);
      refetch();
      toast.success(t('success'));
    } catch (err: any) {
      toast.error(err.message || t('operationFailed'));
    }
  };

  const downloadQR = useCallback(() => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement('a');
      link.download = `table-${qrTable?.tableNumber}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  }, [qrTable]);

  const getMenuUrl = (table: any) =>
    `${APP_URL}/menu/${branchId}/${table.id}`;

  const printAllQR = useCallback(() => {
    if (!printSheetRef.current) return;
    printSheetRef.current.style.display = 'block';
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        if (printSheetRef.current) printSheetRef.current.style.display = 'none';
      }, 500);
    }, 100);
  }, []);

  return (
    <>
      <AdminHeader title={t('tables')} onLogout={logout}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => refetch()}
          className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center"
        >
          <RefreshCw size={14} className={`text-white/60 ${isFetching ? 'animate-spin' : ''}`} />
        </motion.button>
        {tables.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={printAllQR}
            className="flex items-center gap-1 bg-surface-100 text-foreground/60 text-xs font-semibold px-3 py-2 rounded-xl border border-surface-200"
          >
            <Printer size={14} /> {t('printAll' as any)}
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 bg-brand-500 text-white text-xs font-semibold px-3 py-2 rounded-xl"
        >
          <Plus size={14} /> {t('addTable')}
        </motion.button>
      </AdminHeader>

      <main className="p-4 pb-12">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : tables.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-500/10 flex items-center justify-center">
              <QrCode size={28} className="text-brand-500" />
            </div>
            <p className="text-foreground/40 text-sm font-medium">{t('noTablesYet')}</p>
            <p className="text-foreground/20 text-xs mt-1">{t('addFirstTable')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {tables.map((table: any, i: number) => {
              const hasSession = table.sessions && table.sessions.length > 0;
              return (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`relative bg-surface rounded-2xl p-4 shadow-sm border border-surface-200 transition-colors duration-300 ${
                    !table.isActive ? 'opacity-50 grayscale' : ''
                  }`}
                >
                  {/* Status indicator */}
                  <div className="absolute top-3 right-3">
                    <span className={`w-2.5 h-2.5 rounded-full block ${
                      hasSession ? 'bg-amber-400 animate-pulse' : table.isActive ? 'bg-emerald-400' : 'bg-foreground/10'
                    }`} />
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                      <Hash size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-lg leading-none">{table.tableNumber}</p>
                      <p className="text-[10px] text-foreground/40 font-medium mt-0.5">
                        {hasSession ? t('inUse') : table.isActive ? t('available') : t('disabled')}
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] text-foreground/40 mb-3">{table._count?.orders ?? 0} {t('totalOrdersCount')}</p>

                  <div className="flex items-center gap-1.5">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQrTable(table)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-brand-500/10 text-brand-600 text-[10px] font-semibold"
                    >
                      <QrCode size={12} /> QR
                    </motion.button>
                    {hasSession && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleCloseSession(table.sessions[0].id)}
                        className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
                        title="Close Session"
                      >
                        <X size={12} className="text-amber-500" />
                      </motion.button>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleToggle(table)}
                      className="p-1.5 rounded-lg bg-surface-100 border border-surface-200"
                    >
                      {table.isActive
                        ? <ToggleRight size={16} className="text-emerald-500" />
                        : <ToggleLeft size={16} className="text-foreground/20" />}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(table.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20"
                    >
                      <Trash2 size={12} className="text-rose-500" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Table Modal */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-surface rounded-2xl p-5 shadow-2xl max-w-sm mx-auto border border-surface-200"
            >
              <h3 className="font-bold text-foreground mb-4">{t('addNewTable')}</h3>
              <input
                type="number"
                value={newTableNum}
                onChange={(e) => setNewTableNum(e.target.value)}
                placeholder={t('tableNumberPlaceholder')}
                className="w-full bg-surface-100 text-foreground rounded-xl px-3 py-2.5 text-sm outline-none border border-surface-200 focus:border-brand-500 mb-4 transition-colors"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-foreground/40 bg-surface-100 border border-surface-200"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-500"
                >
                  {t('add')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {qrTable && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrTable(null)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-surface rounded-3xl p-6 shadow-2xl max-w-sm mx-auto text-center border border-surface-200"
            >
              <button
                onClick={() => setQrTable(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center transition-colors"
              >
                <X size={14} className="text-foreground/40" />
              </button>

              <h3 className="font-bold text-foreground text-lg mb-1">{t('tables')} {qrTable.tableNumber}</h3>
              <p className="text-xs text-foreground/40 mb-5">{t('scanToOpenMenu')}</p>

              <div ref={qrRef} className="inline-flex p-4 bg-white rounded-2xl border border-surface-200 shadow-inner">
                <QRCodeSVG
                  value={getMenuUrl(qrTable)}
                  size={200}
                  level="H"
                  fgColor="#1E1E1E"
                  bgColor="#ffffff"
                  imageSettings={QR_LOGO}
                />
              </div>

              <p className="text-[10px] text-slate-400 mt-3 font-mono break-all px-4">
                {getMenuUrl(qrTable)}
              </p>

              <div className="mt-4 flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    navigator.clipboard.writeText(getMenuUrl(qrTable));
                    setCopied(true);
                    toast.success(t('success'));
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all duration-300 ${
                    copied
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                      : 'bg-surface-100 border-surface-200 text-foreground/60 hover:border-brand-500/30'
                  }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? t('copied' as any) : t('copyURL' as any)}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={downloadQR}
                  className="flex-1 py-3 rounded-xl bg-brand-500 text-white font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <Download size={16} /> {t('downloadQRCode')}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hidden Printable QR Sheet — only visible during window.print() */}
      <div
        ref={printSheetRef}
        className="qr-print-sheet"
        style={{ display: 'none' }}
      >
        <style>{`
          @media print {
            body > *:not(.qr-print-sheet) { display: none !important; }
            .qr-print-sheet {
              display: block !important;
              position: fixed;
              inset: 0;
              z-index: 99999;
              background: white;
              overflow: auto;
            }
          }
          .qr-print-sheet {
            font-family: 'Inter', 'Segoe UI', sans-serif;
          }
          .qr-print-sheet .qr-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
            padding: 32px;
          }
          .qr-print-sheet .qr-card {
            border: 2px dashed #d1d5db;
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .qr-print-sheet .qr-card h3 {
            font-size: 18px;
            font-weight: 800;
            margin: 0 0 4px 0;
            color: #1e293b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .qr-print-sheet .qr-card .qr-subtitle {
            font-size: 11px;
            color: #94a3b8;
            margin: 0 0 12px 0;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          .qr-print-sheet .qr-card .qr-wrapper {
            display: inline-flex;
            padding: 8px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            background: white;
          }
          .qr-print-sheet .qr-card .qr-url {
            font-size: 8px;
            color: #94a3b8;
            margin-top: 8px;
            word-break: break-all;
            font-family: monospace;
          }
          .qr-print-sheet .qr-header {
            text-align: center;
            padding: 24px 32px 0;
          }
          .qr-print-sheet .qr-header h2 {
            font-size: 22px;
            font-weight: 800;
            color: #1e293b;
            margin: 0;
          }
          .qr-print-sheet .qr-header p {
            font-size: 11px;
            color: #94a3b8;
            margin: 4px 0 0;
          }
        `}</style>
        <div className="qr-header">
          <h2>ArifSmart — Table QR Codes</h2>
          <p>Scan to open the digital menu · Cut along dashed lines</p>
        </div>
        <div className="qr-grid">
          {tables.map((table: any) => (
            <div key={table.id} className="qr-card">
              <h3>Table {table.tableNumber}</h3>
              <p className="qr-subtitle">Scan to Order</p>
              <div className="qr-wrapper">
                <QRCodeSVG
                  value={getMenuUrl(table)}
                  size={160}
                  level="H"
                  fgColor="#1E1E1E"
                  bgColor="#ffffff"
                  imageSettings={QR_LOGO_PRINT}
                />
              </div>
              <p className="qr-url">{getMenuUrl(table)}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
