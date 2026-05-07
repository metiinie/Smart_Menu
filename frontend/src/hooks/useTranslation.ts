import { useFavoritesStore } from '@/stores/favoritesStore';
import { UI_STRINGS, Language } from '@/lib/i18n';

export function useTranslation() {
  const { language } = useFavoritesStore();
  
  // Accept any string key — falls back to English then the raw key at runtime
  const t = (key: string, params?: Record<string, string>) => {
    const langStrings = (UI_STRINGS as any)[language] || UI_STRINGS['en'];
    let val = langStrings[key] || (UI_STRINGS['en'] as any)[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{{${k}}}`, v);
      });
    }
    return val as string;
  };

  return { t, language };
}
