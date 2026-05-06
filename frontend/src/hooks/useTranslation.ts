import { useFavoritesStore } from '@/stores/favoritesStore';
import { UI_STRINGS, Language } from '@/lib/i18n';

export function useTranslation() {
  const { language } = useFavoritesStore();
  
  // Type-safe translation function
  const t = (key: keyof typeof UI_STRINGS['en'], params?: Record<string, string>) => {
    const langStrings = (UI_STRINGS as any)[language] || UI_STRINGS['en'];
    let val = langStrings[key] || UI_STRINGS['en'][key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{{${k}}}`, v);
      });
    }
    return val;
  };

  return { t, language };
}
