'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useForm, useFieldArray } from 'react-hook-form';
import { X, Save, UploadCloud, Plus, Trash2, Box } from 'lucide-react';
import Image from 'next/image';
import type { MenuItem, Category } from '@/shared/types';
import { adminApi } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';

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
  dietaryTags: { label: string }[];
}

interface Props {
  item?: MenuItem | null;
  categories: Category[];
  onSubmit: (data: FormData) => Promise<void>;
  onClose: () => void;
}

export function MenuItemForm({ item, categories, onSubmit, onClose }: Props) {
  const { t } = useTranslation();
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
          dietaryTags: item.dietaryTags || [],
        } as any
      : { 
          isAvailable: true, 
          isFasting: false,
          ingredients: [],
          dietaryTags: [],
        },
  });

  const { fields: ingFields, append: addIng, remove: rmIng } = useFieldArray({ control, name: 'ingredients' });
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
      toast.error('Upload failed. Check console.');
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
        className="w-full max-w-xl bg-surface rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85dvh] border border-surface-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-200 bg-surface-100 shrink-0">
          <h2 className="font-display font-bold text-foreground text-lg">
            {item ? t('editItem') : t('newItem')}
          </h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center hover:bg-surface-300 transition-colors">
            <X size={16} className="text-foreground/60" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-200 bg-surface-100 shrink-0 px-4 pt-2">
          <button type="button" onClick={() => setActiveTab('basic')} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'basic' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-foreground/40'}`}>{t('basicInfo')}</button>
          <button type="button" onClick={() => setActiveTab('cms')} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'cms' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-foreground/40'}`}>{t('nutritionDataCMS')}</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(submit as any)} className="p-5 overflow-y-auto flex-1 space-y-4">
          
          <div className={activeTab === 'basic' ? 'space-y-4' : 'hidden'}>
            {/* Name */}
            <div>
              <label className="text-foreground/40 text-xs mb-1 block font-bold">{t('name')} *</label>
              <input {...register('name', { required: true })}
                className="w-full bg-surface-100 text-foreground rounded-xl px-4 py-3 text-sm outline-none border border-surface-200 focus:border-brand-500 shadow-sm transition-all"
                placeholder="e.g. Doro Wat" />
            </div>

            {/* Description */}
            <div>
              <label className="text-foreground/40 text-xs mb-1 block font-bold">{t('description')}</label>
              <textarea {...register('description')} rows={2}
                className="w-full bg-surface-100 text-foreground rounded-xl px-4 py-3 text-sm outline-none border border-surface-200 focus:border-brand-500 resize-none shadow-sm transition-all"
                placeholder="Short description…" />
            </div>

            {/* Price + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-foreground/40 text-xs mb-1 block font-bold">{t('price')} (ETB) *</label>
                <input type="number" {...register('price', { required: true, min: 0 })}
                  className="w-full bg-surface-100 text-foreground rounded-xl px-4 py-3 text-sm outline-none border border-surface-200 focus:border-brand-500 shadow-sm transition-all"
                  placeholder="0" />
              </div>
              <div>
                <label className="text-foreground/40 text-xs mb-1 block font-bold">{t('category')} *</label>
                <select {...register('categoryId', { required: true })}
                  className="w-full bg-surface-100 text-foreground rounded-xl px-4 py-3 text-sm outline-none border border-surface-200 focus:border-brand-500 shadow-sm transition-all">
                  <option value="">{t('select')}…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {/* Asset Uploads */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-surface-200 rounded-xl p-3 bg-surface-100 flex flex-col items-center justify-center relative overflow-hidden">
                {imageUrl ? (
                  <>
                    <Image src={imageUrl} alt="preview" fill sizes="260px" className="object-cover opacity-30" />
                    <span className="relative z-10 text-xs font-bold text-foreground bg-surface/80 px-2 py-1 rounded">{t('imageUploaded')}</span>
                    <button type="button" onClick={() => setValue('imageUrl', '')} className="relative z-10 text-[10px] mt-2 text-red-500 underline">{t('remove')}</button>
                  </>
                ) : (
                  <>
                    <UploadCloud size={20} className="text-foreground/20 mb-1" />
                    <span className="text-[10px] text-foreground/40 font-bold">{t('uploadImage')}</span>
                    {uploadingImage && <span className="text-[10px] text-brand-500 animate-pulse mt-1">{t('uploading' as any)}...</span>}
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'imageUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </>
                )}
              </div>
              <div className="border border-surface-200 rounded-xl p-3 bg-surface-100 flex flex-col items-center justify-center relative overflow-hidden">
                {model3dUrl ? (
                  <>
                    <Box size={20} className="text-brand-500 mb-1 relative z-10" />
                    <span className="relative z-10 text-xs font-bold text-foreground bg-surface/80 px-2 py-1 rounded">{t('upload3DModel')}</span>
                    <button type="button" onClick={() => setValue('model3dUrl', '')} className="relative z-10 text-[10px] mt-2 text-red-500 underline">{t('remove')}</button>
                  </>
                ) : (
                  <>
                    <Box size={20} className="text-foreground/20 mb-1" />
                    <span className="text-[10px] text-foreground/40 font-bold">{t('upload3DModel')}</span>
                    {uploadingModel && <span className="text-[10px] text-brand-500 animate-pulse mt-1">{t('uploading' as any)}...</span>}
                    <input type="file" accept=".glb" onChange={(e) => handleFileUpload(e, 'model3dUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </>
                )}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-4">
              {[
                { name: 'isAvailable', label: t('available') },
                { name: 'isFasting', label: t('fasting') },
              ].map(({ name, label }) => (
                <label key={name} className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" {...register(name as keyof FormData)}
                    className="w-4 h-4 accent-brand-500 rounded border-surface-300" />
                  <span className="text-foreground/80 text-sm font-medium group-hover:text-brand-600 transition-colors">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={activeTab === 'cms' ? 'space-y-6' : 'hidden'}>
            
            {/* Ingredients Array */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-foreground/40 text-xs font-bold">{t('ingredientsLabel')}</label>
                <button type="button" onClick={() => addIng({ name: '', detail: '' })} className="text-[10px] font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 bg-brand-500/10 px-2 py-1 rounded-lg">
                  <Plus size={12} /> {t('addIngredient')}
                </button>
              </div>
              <div className="space-y-2">
                {ingFields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <input {...register(`ingredients.${idx}.name` as const, { required: true })} placeholder={t('name')} className="flex-1 bg-surface-100 text-xs rounded-lg px-3 py-2 border border-surface-200 text-foreground" />
                    <input {...register(`ingredients.${idx}.detail` as const)} placeholder={t('detail' as any)} className="flex-1 bg-surface-100 text-xs rounded-lg px-3 py-2 border border-surface-200 text-foreground" />
                    <button type="button" onClick={() => rmIng(idx)} className="text-red-400 p-1 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                ))}
                {ingFields.length === 0 && <p className="text-xs text-foreground/30 italic">{t('noIngredientsAdded')}</p>}
              </div>
            </div>

            {/* Dietary Tags Array */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-foreground/40 text-xs font-bold">{t('dietaryTags')}</label>
                <button type="button" onClick={() => addTag({ label: '' })} className="text-[10px] font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 bg-brand-500/10 px-2 py-1 rounded-lg">
                  <Plus size={12} /> {t('addTag')}
                </button>
              </div>
              <div className="space-y-2 flex flex-wrap gap-2">
                {tagFields.map((field, idx) => (
                  <div key={field.id} className="flex items-center bg-surface-100 rounded-lg border border-surface-200 overflow-hidden pr-1">
                    <input {...register(`dietaryTags.${idx}.label` as const, { required: true })} placeholder="e.g. Vegan" className="w-24 text-xs px-2 py-1.5 outline-none bg-transparent text-foreground" />
                    <button type="button" onClick={() => rmTag(idx)} className="text-red-400 hover:text-red-600 p-1"><X size={12} /></button>
                  </div>
                ))}
                {tagFields.length === 0 && <p className="text-xs text-foreground/30 italic w-full">{t('noTagsAdded')}</p>}
              </div>
            </div>

            <p className="text-[10px] text-foreground/30">Note: Nutrition Sections can be managed via API or full CMS portal in this MVP.</p>
          </div>

          <div className="pt-2 shrink-0">
            <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={saving}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold flex items-center justify-center gap-2 py-4 rounded-2xl shadow-lg shadow-brand-500/20 transition-all active:scale-95"
            >
              {saving
                ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <><Save size={18} /> {t('saveItem')}</>}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
