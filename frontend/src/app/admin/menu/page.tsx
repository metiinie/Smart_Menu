'use client';

import { useState} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight,  } from 'lucide-react';
import Image from 'next/image';
import { adminApi } from '@/lib/api';
import { MenuItemForm } from '@/components/admin/MenuItemForm';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAuthStore, selectBranchId } from '@/stores/authStore';
import type { MenuItem,  Category } from '@/shared/types';

export default function AdminMenuPage() {
  const { user, logout } = useAuthStore();
  const branchId = selectBranchId(user);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const qc = useQueryClient();

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



  return (
    <>
      <AdminHeader 
        title="Menu" 
        onLogout={logout}
      >
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditItem(null); setFormOpen(true); }}
          className="flex items-center gap-1 bg-brand-500 text-white text-xs font-semibold px-3 py-2 rounded-xl"
          id="new-item-btn">
          <Plus size={14} /> New Item
        </motion.button>
      </AdminHeader>

      <main className="p-4 pb-12">
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.div key={item.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }} className={`bg-white p-4 flex gap-3 rounded-2xl shadow-sm border border-slate-100 ${!item.isAvailable ? 'opacity-50 grayscale' : ''}`}
                  id={`admin-item-${item.id}`}>
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                    {item.imageUrl
                      ? <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900 text-sm line-clamp-1">{item.name}</p>
                        <p className="text-slate-500 text-xs font-medium">{item.categoryName}</p>
                      </div>
                      <span className="font-black text-brand-600 text-sm flex-shrink-0">ETB {Number(item.price).toFixed(0)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {item.isFasting && <span className="badge-fasting text-[10px]">Fasting</span>}
                      <div className="flex items-center gap-1 ml-auto">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleToggle(item)}
                          className="p-1" id={`toggle-${item.id}`}>
                          {item.isAvailable
                            ? <ToggleRight size={24} className="text-emerald-500" />
                            : <ToggleLeft size={24} className="text-slate-300" />}
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditItem(item); setFormOpen(true); }}
                          className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100" id={`edit-${item.id}`}>
                          <Pencil size={12} className="text-slate-600" />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(item.id)}
                          className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center border border-red-100" id={`delete-${item.id}`}>
                          <Trash2 size={12} className="text-red-500" />
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
    </>
  );
}
