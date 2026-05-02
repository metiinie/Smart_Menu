export type Language = 'en' | 'am' | 'or';

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'am', label: 'አማርኛ', flag: '🇪🇹' },
  { code: 'or', label: 'Oromoo', flag: '🇪🇹' },
];

/**
 * Utility to get localized text from a translation object.
 * Falls back to the default string if translation is missing.
 */
export function getLocalized(
  translations: any,
  defaultStr: string,
  lang: Language = 'en'
): string {
  if (!translations || typeof translations !== 'object') return defaultStr;
  
  const localized = translations[lang];
  if (localized && localized.trim().length > 0) {
    return localized;
  }
  
  return defaultStr;
}

/**
 * Common UI strings localized
 */
export const UI_STRINGS = {
  en: {
    welcome: 'Welcome',
    categories: 'Categories',
    search: 'Search for food...',
    cart: 'My Cart',
    profile: 'Profile',
    history: 'History',
    favorites: 'Favorites',
    settings: 'Settings',
    callWaiter: 'Call Waiter',
    requestBill: 'Request Bill',
    total: 'Total',
    checkout: 'Checkout',
    placeOrder: 'Place Order',
    orderStatus: 'Order Status',
    delivered: 'Delivered',
    ready: 'Ready',
    preparing: 'Preparing',
    confirmed: 'Confirmed',
    created: 'Created',
    currency: 'Currency',
  },
  am: {
    welcome: 'እንኳን ደህና መጡ',
    categories: 'ምድቦች',
    search: 'ምግብ ይፈልጉ...',
    cart: 'የእኔ ቅርጫት',
    profile: 'መገለጫ',
    history: 'ታሪክ',
    favorites: 'ተወዳጆች',
    settings: 'ቅንብሮች',
    callWaiter: 'አስተናጋጅ ጥራ',
    requestBill: 'ሒሳብ ጠይቅ',
    total: 'ጠቅላላ',
    checkout: 'ክፈል',
    placeOrder: 'ትዕዛዝ ይላኩ',
    orderStatus: 'የትዕዛዝ ሁኔታ',
    delivered: 'ደረሰ',
    ready: 'ተዘጋጅቷል',
    preparing: 'በመዘጋጀት ላይ',
    confirmed: 'ተረጋግጧል',
    created: 'ተፈጥሯል',
    currency: 'ምንዛሬ',
  },
  or: {
    welcome: 'Baga nagaan dhuftan',
    categories: 'Ramaddii',
    search: 'Nyaata barbaadi...',
    cart: 'Kootii koo',
    profile: 'Piroofayilii',
    history: 'Seenaa',
    favorites: 'Kan jaallataman',
    settings: 'Sajoo',
    callWaiter: 'Waa’ee waami',
    requestBill: 'Bill gaafadhu',
    total: 'Waliigala',
    checkout: 'Kaffali',
    placeOrder: 'Ajajadhu',
    orderStatus: 'Haala ajajaa',
    delivered: 'Gaan’eera',
    ready: 'Qophaa’eera',
    preparing: 'Qophaa’aa jira',
    confirmed: 'Mirkanaa’eera',
    created: 'Uumameera',
    currency: 'Ji’a',
  },
};
