'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ShieldCheck, LogOut } from 'lucide-react';
import Image from 'next/image';
import { adminApi } from '@/lib/api';
import { MenuItemForm } from '@/components/admin/MenuItemForm';
import { PinLogin } from '@/components/ui/PinLogin';
import type { MenuItem, StaffUser, Category } from '@arifsmart/shared';

const BRANCH_ID = process.env.NEXT_PUBLIC_BRANCH_ID ?? '';

export default function AdminMenuPage() {
  const [user, setUser] = useState<any>(null);
  const [branchId, setBranchId] = useState(BRANCH_ID);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('arifsmart_token');
    const saved = localStorage.getItem('arifsmart_user');
    if (token && saved) {
      try {
        const u = JSON.parse(saved);
        if (u.role === 'ADMIN') setUser(u);
      } catch {}
    }
  }, []);

  const { data: items = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ['admin-menu', branchId],
    queryFn: () => adminApi.getMenuItems(branchId),
    enabled: !!user && !!branchId,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['admin-categories', branchId],
    queryFn: () => adminApi.getCategories(branchId),
    enabled: !!user && !!branchId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-menu'] });

  const handleSubmit = async (data: any) => {
    if (editItem) await adminApi.updateMenuItem(editItem.id, data);
    else await adminApi.createMenuItem({ ...data, branchId });
    await invalidate();
    setFormOpen(false);
    setEditItem(null);
  };

  const handleToggle = async (item: MenuItem) => {
    await adminApi.toggleAvailability(item.id, !item.isAvailable);
    await invalidate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await adminApi.deleteMenuItem(id);
    await invalidate();
  };

  const logout = () => {
    localStorage.removeItem('arifsmart_token');
    localStorage.removeItem('arifsmart_user');
    setUser(null);
  };

  if (!user) return <PinLogin branchId={branchId || 'demo'} onSuccess={(_, u) => u.role === 'ADMIN' && setUser(u)} />;

  return (
    <div className="min-h-dvh bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-surface-200 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <h1 className="font-display font-bold text-white text-sm">Admin · Menu</h1>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditItem(null); setFormOpen(true); }}
              className="flex items-center gap-1 bg-brand-500 text-white text-xs font-semibold px-3 py-2 rounded-xl"
              id="new-item-btn">
              <Plus size={14} /> New Item
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={logout}
              className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center">
              <LogOut size={14} className="text-white/60" />
            </motion.button>
          </div>
        </div>
      </header>

      <main className="p-4 pb-12">
        {!branchId && (
          <div className="card p-4 mb-4">
            <label className="text-white/60 text-xs mb-2 block">Branch ID (from seed output)</label>
            <input className="w-full bg-surface-100 text-white rounded-xl px-3 py-2 text-sm outline-none border border-surface-300 focus:border-brand-500"
              onBlur={(e) => setBranchId(e.target.value)} id="admin-branch-id" />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.div key={item.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }} className={`card p-4 flex gap-3 ${!item.isAvailable ? 'opacity-50' : ''}`}
                  id={`admin-item-${item.id}`}>
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-100 flex-shrink-0">
                    {item.imageUrl
                      ? <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white text-sm line-clamp-1">{item.name}</p>
                        <p className="text-white/40 text-xs">{item.categoryName}</p>
                      </div>
                      <span className="font-bold text-brand-400 text-sm flex-shrink-0">ETB {Number(item.price).toFixed(0)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {item.isFasting && <span className="badge-fasting text-[10px]">Fasting</span>}
                      <div className="flex items-center gap-1 ml-auto">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleToggle(item)}
                          className="text-white/50" id={`toggle-${item.id}`}>
                          {item.isAvailable
                            ? <ToggleRight size={20} className="text-emerald-400" />
                            : <ToggleLeft size={20} className="text-white/30" />}
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditItem(item); setFormOpen(true); }}
                          className="w-7 h-7 rounded-lg bg-surface-200 flex items-center justify-center" id={`edit-${item.id}`}>
                          <Pencil size={12} className="text-white/60" />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(item.id)}
                          className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center" id={`delete-${item.id}`}>
                          <Trash2 size={12} className="text-red-400" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <AnimatePresence>
        {formOpen && (
          <MenuItemForm
            item={editItem}
            categories={categories}
            onSubmit={handleSubmit as (data: Parameters<typeof handleSubmit>[0]) => Promise<void>}
            onClose={() => { setFormOpen(false); setEditItem(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
