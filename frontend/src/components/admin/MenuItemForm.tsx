'use client';

import { useState } from 'react';
import { motion} from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { X, Save, UploadCloud, Plus, Trash2, Box } from 'lucide-react';
import type { MenuItem, Category } from '@arifsmart/shared';
import { adminApi } from '@/lib/api';

interface FormData {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  model3dUrl?: string;
  isAvailable: boolean;
  isFasting: boolean;
  ingredients: { name: string; detail?: string }[];
  allergens: { label: string; present: boolean }[];
  dietaryTags: { label: string }[];
}

interface Props {
  item?: MenuItem | null;
  categories: Category[];
  onSubmit: (data: FormData) => Promise<void>;
  onClose: () => void;
}

export function MenuItemForm({ item, categories, onSubmit, onClose }: Props) {
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingModel, setUploadingModel] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'cms'>('basic');

  const { register, handleSubmit, control, setValue, watch, formState: { } } = useForm<FormData>({
    defaultValues: item
      ? { 
          ...item, 
          price: Number(item.price),
          ingredients: (item.ingredients || []).map(i => ({...i, detail: i.detail ?? undefined})),
          allergens: item.allergens || [],
          dietaryTags: item.dietaryTags || [],
        } as any
      : { 
          isAvailable: true, 
          isFasting: false,
          ingredients: [],
          allergens: [],
          dietaryTags: [],
        },
  });

  const { fields: ingFields, append: addIng, remove: rmIng } = useFieldArray({ control, name: 'ingredients' });
  const { fields: allFields, append: addAll, remove: rmAll } = useFieldArray({ control, name: 'allergens' });
  const { fields: tagFields, append: addTag, remove: rmTag } = useFieldArray({ control, name: 'dietaryTags' });

  const imageUrl = watch('imageUrl');
  const model3dUrl = watch('model3dUrl');

  const submit = async (data: FormData) => {
    setSaving(true);
    try { await onSubmit({ ...data, price: Number(data.price) }); }
    finally { setSaving(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'model3dUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (field === 'imageUrl') setUploadingImage(true);
    else setUploadingModel(true);

    try {
      const res = await adminApi.uploadAsset(file);
      setValue(field, res.url);
    } catch (error) {
      console.error('Upload failed', error);
      alert('Upload failed. Check console.');
    } finally {
      if (field === 'imageUrl') setUploadingImage(false);
      else setUploadingModel(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-xl bg-surface-50 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85dvh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <h2 className="font-display font-bold text-slate-900 text-lg">
            {item ? 'Edit Item' : 'New Item'}
          </h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors">
            <X size={16} className="text-slate-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 shrink-0 px-4 pt-2">
          <button type="button" onClick={() => setActiveTab('basic')} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'basic' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500'}`}>Basic Info</button>
          <button type="button" onClick={() => setActiveTab('cms')} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'cms' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500'}`}>Nutrition & Data (CMS)</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(submit as any)} className="p-5 overflow-y-auto flex-1 space-y-4">
          
          <div className={activeTab === 'basic' ? 'space-y-4' : 'hidden'}>
            {/* Name */}
            <div>
              <label className="text-slate-500 text-xs mb-1 block font-bold">Name *</label>
              <input {...register('name', { required: true })}
                className="w-full bg-slate-50 text-slate-900 rounded-xl px-4 py-3 text-sm outline-none border border-slate-200 focus:border-brand-500 shadow-sm transition-all"
                placeholder="e.g. Doro Wat" />
            </div>

            {/* Description */}
            <div>
              <label className="text-slate-500 text-xs mb-1 block font-bold">Description</label>
              <textarea {...register('description')} rows={2}
                className="w-full bg-slate-50 text-slate-900 rounded-xl px-4 py-3 text-sm outline-none border border-slate-200 focus:border-brand-500 resize-none shadow-sm transition-all"
                placeholder="Short description…" />
            </div>

            {/* Price + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 text-xs mb-1 block font-bold">Price (ETB) *</label>
                <input type="number" {...register('price', { required: true, min: 0 })}
                  className="w-full bg-slate-50 text-slate-900 rounded-xl px-4 py-3 text-sm outline-none border border-slate-200 focus:border-brand-500 shadow-sm transition-all"
                  placeholder="0" />
              </div>
              <div>
                <label className="text-slate-500 text-xs mb-1 block font-bold">Category *</label>
                <select {...register('categoryId', { required: true })}
                  className="w-full bg-slate-50 text-slate-900 rounded-xl px-4 py-3 text-sm outline-none border border-slate-200 focus:border-brand-500 shadow-sm transition-all">
                  <option value="">Select…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {/* Asset Uploads */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
                {imageUrl ? (
                  <>
                    <img src={imageUrl} alt="preview" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                    <span className="relative z-10 text-xs font-bold text-slate-700 bg-white/80 px-2 py-1 rounded">Image Uploaded</span>
                    <button type="button" onClick={() => setValue('imageUrl', '')} className="relative z-10 text-[10px] mt-2 text-red-500 underline">Remove</button>
                  </>
                ) : (
                  <>
                    <UploadCloud size={20} className="text-slate-400 mb-1" />
                    <span className="text-[10px] text-slate-500 font-bold">Upload Image</span>
                    {uploadingImage && <span className="text-[10px] text-brand-500 animate-pulse mt-1">Uploading...</span>}
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'imageUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </>
                )}
              </div>
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
                {model3dUrl ? (
                  <>
                    <Box size={20} className="text-brand-500 mb-1 relative z-10" />
                    <span className="relative z-10 text-xs font-bold text-slate-700 bg-white/80 px-2 py-1 rounded">3D Model Uploaded</span>
                    <button type="button" onClick={() => setValue('model3dUrl', '')} className="relative z-10 text-[10px] mt-2 text-red-500 underline">Remove</button>
                  </>
                ) : (
                  <>
                    <Box size={20} className="text-slate-400 mb-1" />
                    <span className="text-[10px] text-slate-500 font-bold">Upload 3D Model (.glb)</span>
                    {uploadingModel && <span className="text-[10px] text-brand-500 animate-pulse mt-1">Uploading...</span>}
                    <input type="file" accept=".glb" onChange={(e) => handleFileUpload(e, 'model3dUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </>
                )}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-4">
              {[
                { name: 'isAvailable', label: 'Available' },
                { name: 'isFasting', label: 'Fasting' },
              ].map(({ name, label }) => (
                <label key={name} className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" {...register(name as keyof FormData)}
                    className="w-4 h-4 accent-brand-500 rounded border-slate-300" />
                  <span className="text-slate-700 text-sm font-medium group-hover:text-brand-600 transition-colors">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={activeTab === 'cms' ? 'space-y-6' : 'hidden'}>
            
            {/* Ingredients Array */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-slate-500 text-xs font-bold">Ingredients</label>
                <button type="button" onClick={() => addIng({ name: '', detail: '' })} className="text-[10px] font-bold text-brand-600 flex items-center gap-1 bg-brand-50 px-2 py-1 rounded-lg">
                  <Plus size={12} /> Add Ingredient
                </button>
              </div>
              <div className="space-y-2">
                {ingFields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <input {...register(`ingredients.${idx}.name` as const, { required: true })} placeholder="Name" className="flex-1 bg-white text-xs rounded-lg px-3 py-2 border border-slate-200" />
                    <input {...register(`ingredients.${idx}.detail` as const)} placeholder="Detail (optional)" className="flex-1 bg-white text-xs rounded-lg px-3 py-2 border border-slate-200" />
                    <button type="button" onClick={() => rmIng(idx)} className="text-red-400 p-1 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                ))}
                {ingFields.length === 0 && <p className="text-xs text-slate-400 italic">No ingredients added.</p>}
              </div>
            </div>

            {/* Allergens Array */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-slate-500 text-xs font-bold">Allergens</label>
                <button type="button" onClick={() => addAll({ label: '', present: true })} className="text-[10px] font-bold text-brand-600 flex items-center gap-1 bg-brand-50 px-2 py-1 rounded-lg">
                  <Plus size={12} /> Add Allergen
                </button>
              </div>
              <div className="space-y-2">
                {allFields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <input {...register(`allergens.${idx}.label` as const, { required: true })} placeholder="e.g. Nuts" className="flex-1 bg-white text-xs rounded-lg px-3 py-2 border border-slate-200" />
                    <label className="flex items-center gap-1 text-xs text-slate-600 bg-white px-2 py-2 rounded-lg border border-slate-200">
                      <input type="checkbox" {...register(`allergens.${idx}.present` as const)} className="accent-brand-500" />
                      Present
                    </label>
                    <button type="button" onClick={() => rmAll(idx)} className="text-red-400 p-1 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                ))}
                {allFields.length === 0 && <p className="text-xs text-slate-400 italic">No allergens added.</p>}
              </div>
            </div>

            {/* Dietary Tags Array */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-slate-500 text-xs font-bold">Dietary Tags</label>
                <button type="button" onClick={() => addTag({ label: '' })} className="text-[10px] font-bold text-brand-600 flex items-center gap-1 bg-brand-50 px-2 py-1 rounded-lg">
                  <Plus size={12} /> Add Tag
                </button>
              </div>
              <div className="space-y-2 flex flex-wrap gap-2">
                {tagFields.map((field, idx) => (
                  <div key={field.id} className="flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden pr-1">
                    <input {...register(`dietaryTags.${idx}.label` as const, { required: true })} placeholder="e.g. Vegan" className="w-24 text-xs px-2 py-1.5 outline-none" />
                    <button type="button" onClick={() => rmTag(idx)} className="text-red-400 hover:text-red-600 p-1"><X size={12} /></button>
                  </div>
                ))}
                {tagFields.length === 0 && <p className="text-xs text-slate-400 italic w-full">No tags added.</p>}
              </div>
            </div>

            <p className="text-[10px] text-slate-400">Note: Nutrition Sections can be managed via API or full CMS portal in this MVP.</p>
          </div>

          <div className="pt-2 shrink-0">
            <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={saving}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold flex items-center justify-center gap-2 py-4 rounded-2xl shadow-lg shadow-brand-500/20 transition-all active:scale-95"
            >
              {saving
                ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <><Save size={18} /> Save Item</>}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
