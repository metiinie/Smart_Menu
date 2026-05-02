'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, FolderTree, X, Save } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAuthStore, selectBranchId } from '@/stores/authStore';
import { toast } from 'sonner';
import type { Category } from '@/shared/types';

export default function AdminCategoriesPage() {
  const { user, logout } = useAuthStore();
  const branchId = selectBranchId(user);
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['admin-categories', branchId],
    queryFn: () => adminApi.getCategories(branchId),
    enabled: !!branchId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-categories'] });

  const handleOpenForm = (category?: Category) => {
    if (category) {
      setEditItem(category);
      setName(category.name);
    } else {
      setEditItem(null);
      setName('');
    }
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await adminApi.updateCategory(editItem.id, { name: name.trim() });
        toast.success('Category updated');
      } else {
        // Find highest sortOrder
        const highestOrder = categories.reduce((max, c) => Math.max(max, c.sortOrder ?? 0), -1);
        await adminApi.createCategory({ name: name.trim(), branchId, sortOrder: highestOrder + 1 });
        toast.success('Category created');
      }
      await invalidate();
      setFormOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (category: Category) => {
    toast.warning(`Delete category "${category.name}"?`, {
      description: 'Items in this category might be affected.',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await adminApi.deleteCategory(category.id);
            toast.success('Category deleted');
            await invalidate();
          } catch (err: any) {
            toast.error(err.message || 'Failed to delete category');
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  const moveOrder = async (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= categories.length) return;
    
    // Create a local copy to mutate
    const newCategories = [...categories];
    // Swap the two items
    const temp = newCategories[index];
    newCategories[index] = newCategories[index + direction];
    newCategories[index + direction] = temp;
    
    // Assign new sortOrders based on their new index
    const updates = newCategories.map((c, i) => ({ id: c.id, sortOrder: i }));
    
    // Optimistically update the UI cache
    qc.setQueryData(['admin-categories', branchId], newCategories.map(c => {
      const update = updates.find(u => u.id === c.id);
      return update ? { ...c, sortOrder: update.sortOrder } : c;
    }));

    try {
      // Fire off API calls for the swapped items
      await Promise.all([
        adminApi.updateCategory(newCategories[index].id, { sortOrder: index }),
        adminApi.updateCategory(newCategories[index + direction].id, { sortOrder: index + direction })
      ]);
    } catch (err: any) {
      toast.error('Failed to reorder');
      invalidate(); // Revert on failure
    }
  };

  return (
    <>
      <AdminHeader title="Categories" onLogout={logout}>
        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={() => handleOpenForm()}
          className="flex items-center gap-1 bg-brand-500 text-white text-xs font-semibold px-3 py-2 rounded-xl"
        >
          <Plus size={14} /> New Category
        </motion.button>
      </AdminHeader>

      <main className="p-4 pb-12">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20">
            <FolderTree size={32} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-400">No categories found</p>
            <p className="text-xs text-slate-300 mt-1">Create one to organize your menu</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {categories.map((category, i) => (
                <motion.div 
                  key={category.id} 
                  layout 
                  initial={{ opacity: 0, y: 8 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }} 
                  className="bg-white p-4 flex items-center gap-3 rounded-2xl shadow-sm border border-slate-100"
                >
                  {/* Reorder controls */}
                  <div className="flex flex-col gap-1 items-center justify-center">
                    <button 
                      onClick={() => moveOrder(i, -1)} 
                      disabled={i === 0}
                      className="p-1 rounded bg-slate-50 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button 
                      onClick={() => moveOrder(i, 1)} 
                      disabled={i === categories.length - 1}
                      className="p-1 rounded bg-slate-50 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm">{category.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Order: {category.sortOrder ?? i}</p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <motion.button 
                      whileTap={{ scale: 0.9 }} 
                      onClick={() => handleOpenForm(category)}
                      className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100"
                    >
                      <Pencil size={12} className="text-slate-600" />
                    </motion.button>
                    <motion.button 
                      whileTap={{ scale: 0.9 }} 
                      onClick={() => handleDelete(category)}
                      className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center border border-red-100"
                    >
                      <Trash2 size={12} className="text-red-500" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Form Drawer */}
      <AnimatePresence>
        {formOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setFormOpen(false)} 
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 shadow-2xl max-w-lg mx-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 text-lg">{editItem ? 'Edit Category' : 'New Category'}</h3>
                <button onClick={() => setFormOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <X size={16} className="text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Category Name</label>
                  <input
                    value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Appetizers, Main Course, Drinks..."
                    className="w-full bg-slate-50 text-slate-900 rounded-xl px-3 py-2.5 text-sm outline-none border border-slate-200 focus:border-brand-500"
                    autoFocus
                  />
                </div>

                <motion.button 
                  whileTap={{ scale: 0.97 }} 
                  onClick={handleSubmit} 
                  disabled={saving}
                  className="w-full py-3.5 rounded-xl bg-brand-500 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-2"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                    <><Save size={16} /> {editItem ? 'Save Changes' : 'Create Category'}</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
