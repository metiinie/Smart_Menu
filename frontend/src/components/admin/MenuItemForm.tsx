'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { X, Save } from 'lucide-react';
import type { MenuItem, Category } from '@arifsmart/shared';

interface FormData {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  isAvailable: boolean;
  isFasting: boolean;
}

interface Props {
  item?: MenuItem | null;
  categories: Category[];
  onSubmit: (data: FormData) => Promise<void>;
  onClose: () => void;
}

export function MenuItemForm({ item, categories, onSubmit, onClose }: Props) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: item
      ? { ...item, price: Number(item.price) }
      : { isAvailable: true, isFasting: false },
  });

  const submit = async (data: FormData) => {
    setSaving(true);
    try { await onSubmit({ ...data, price: Number(data.price) }); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-md bg-surface-50 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-200">
          <h2 className="font-display font-bold text-white text-lg">
            {item ? 'Edit Item' : 'New Item'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center" id="close-item-form">
            <X size={16} className="text-white/60" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(submit)} className="p-5 space-y-4 max-h-[70dvh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="text-white/60 text-xs mb-1 block">Name *</label>
            <input {...register('name', { required: true })}
              className="w-full bg-surface-100 text-white rounded-xl px-4 py-3 text-sm outline-none border border-surface-300 focus:border-brand-500"
              placeholder="e.g. Doro Wat" id="item-name" />
          </div>

          {/* Description */}
          <div>
            <label className="text-white/60 text-xs mb-1 block">Description</label>
            <textarea {...register('description')} rows={2}
              className="w-full bg-surface-100 text-white rounded-xl px-4 py-3 text-sm outline-none border border-surface-300 focus:border-brand-500 resize-none"
              placeholder="Short description…" id="item-description" />
          </div>

          {/* Price + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-xs mb-1 block">Price (ETB) *</label>
              <input type="number" {...register('price', { required: true, min: 0 })}
                className="w-full bg-surface-100 text-white rounded-xl px-4 py-3 text-sm outline-none border border-surface-300 focus:border-brand-500"
                placeholder="0" id="item-price" />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">Category *</label>
              <select {...register('categoryId', { required: true })}
                className="w-full bg-surface-100 text-white rounded-xl px-4 py-3 text-sm outline-none border border-surface-300 focus:border-brand-500"
                id="item-category">
                <option value="">Select…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="text-white/60 text-xs mb-1 block">Image URL</label>
            <input {...register('imageUrl')}
              className="w-full bg-surface-100 text-white rounded-xl px-4 py-3 text-sm outline-none border border-surface-300 focus:border-brand-500"
              placeholder="/images/menu/item.jpg" id="item-image" />
          </div>

          {/* Toggles */}
          <div className="flex gap-4">
            {[
              { name: 'isAvailable', label: 'Available' },
              { name: 'isFasting', label: 'Fasting' },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register(name as keyof FormData)}
                  className="w-4 h-4 accent-brand-500" id={`item-${name}`} />
                <span className="text-white/70 text-sm">{label}</span>
              </label>
            ))}
          </div>

          <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={saving}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 mt-2"
            id="save-item-btn">
            {saving
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <><Save size={16} /> Save Item</>}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
