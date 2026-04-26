'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
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
  
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAuthStore } from '@/stores/authStore';
import { QRCodeSVG } from 'qrcode.react';

const BRANCH_ID = process.env.NEXT_PUBLIC_BRANCH_ID ?? '';
const APP_URL = typeof window !== 'undefined' ? window.location.origin : '';

export default function AdminTablesPage() {
  const { logout } = useAuthStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [qrTable, setQrTable] = useState<any>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const { data: tables = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-tables', BRANCH_ID],
    queryFn: () => adminApi.getTables(BRANCH_ID),
    enabled: !!BRANCH_ID,
  });

  const handleCreate = async () => {
    if (!newTableNum) return;
    try {
      await adminApi.createTable({ branchId: BRANCH_ID, tableNumber: parseInt(newTableNum) });
      setNewTableNum('');
      setShowAdd(false);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to create table');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this table? This cannot be undone.')) return;
    try {
      await adminApi.deleteTable(id);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleToggle = async (table: any) => {
    try {
      await adminApi.toggleTableStatus(table.id, !table.isActive);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle');
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
    `${APP_URL}/menu/${BRANCH_ID}/${table.id}`;

  return (
    <>
      <AdminHeader title="Tables" onLogout={logout}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => refetch()}
          className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center"
        >
          <RefreshCw size={14} className={`text-white/60 ${isFetching ? 'animate-spin' : ''}`} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 bg-brand-500 text-white text-xs font-semibold px-3 py-2 rounded-xl"
        >
          <Plus size={14} /> Add Table
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
            <p className="text-slate-500 text-sm font-medium">No tables yet</p>
            <p className="text-slate-400 text-xs mt-1">Add your first dining table to get started</p>
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
                  className={`relative bg-white rounded-2xl p-4 shadow-sm border border-slate-100 ${
                    !table.isActive ? 'opacity-50 grayscale' : ''
                  }`}
                >
                  {/* Status indicator */}
                  <div className="absolute top-3 right-3">
                    <span className={`w-2.5 h-2.5 rounded-full block ${
                      hasSession ? 'bg-amber-400 animate-pulse' : table.isActive ? 'bg-emerald-400' : 'bg-slate-300'
                    }`} />
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                      <Hash size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-lg leading-none">{table.tableNumber}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {hasSession ? 'In Use' : table.isActive ? 'Available' : 'Disabled'}
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 mb-3">{table._count?.orders ?? 0} total orders</p>

                  <div className="flex items-center gap-1.5">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQrTable(table)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-brand-500/10 text-brand-600 text-[10px] font-semibold"
                    >
                      <QrCode size={12} /> QR
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleToggle(table)}
                      className="p-1.5 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      {table.isActive
                        ? <ToggleRight size={16} className="text-emerald-500" />
                        : <ToggleLeft size={16} className="text-slate-300" />}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(table.id)}
                      className="p-1.5 rounded-lg bg-red-50 border border-red-100"
                    >
                      <Trash2 size={12} className="text-red-400" />
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
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl p-5 shadow-2xl max-w-sm mx-auto"
            >
              <h3 className="font-bold text-slate-900 mb-4">Add New Table</h3>
              <input
                type="number"
                value={newTableNum}
                onChange={(e) => setNewTableNum(e.target.value)}
                placeholder="Table number (e.g. 1, 2, 3...)"
                className="w-full bg-slate-50 text-slate-900 rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-200 focus:border-brand-500 mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-500 bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-500"
                >
                  Create
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
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-3xl p-6 shadow-2xl max-w-sm mx-auto text-center"
            >
              <button
                onClick={() => setQrTable(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X size={14} className="text-slate-500" />
              </button>

              <h3 className="font-bold text-slate-900 text-lg mb-1">Table {qrTable.tableNumber}</h3>
              <p className="text-xs text-slate-400 mb-5">Scan to open menu</p>

              <div ref={qrRef} className="inline-flex p-4 bg-white rounded-2xl border border-slate-100 shadow-inner">
                <QRCodeSVG
                  value={getMenuUrl(qrTable)}
                  size={200}
                  level="H"
                  fgColor="#1E1E1E"
                  bgColor="#ffffff"
                />
              </div>

              <p className="text-[10px] text-slate-400 mt-3 font-mono break-all px-4">
                {getMenuUrl(qrTable)}
              </p>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={downloadQR}
                className="mt-4 w-full py-3 rounded-xl bg-brand-500 text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Download size={16} /> Download QR Code
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
