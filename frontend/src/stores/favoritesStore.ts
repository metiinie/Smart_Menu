import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { favoritesApi } from '@/lib/api';

export interface FavoriteItem {
  menuItemId: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  categoryName?: string;
  addedAt: number;
}

export interface CustomerProfile {
  name?: string;
  phone?: string;
  customerRef?: string;
}

interface FavoritesStore {
  favorites: FavoriteItem[];
  customerProfile: CustomerProfile;
  language: 'en' | 'am' | 'or';
  currency: 'ETB' | 'USD';
  isDarkMode: boolean;
  setFavorites: (favorites: FavoriteItem[]) => void;
  fetchFavorites: (customerRef: string) => Promise<void>;
  addFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
  removeFavorite: (menuItemId: string) => void;
  isFavorite: (menuItemId: string) => boolean;
  toggleFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
  updateProfile: (profile: Partial<CustomerProfile>) => void;
  setLanguage: (lang: 'en' | 'am' | 'or') => void;
  setCurrency: (currency: 'ETB' | 'USD') => void;
  toggleDarkMode: () => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      customerProfile: {},
      language: 'en',
      currency: 'ETB',
      isDarkMode: false,

      setFavorites: (favorites) => set({ favorites }),

      fetchFavorites: async (customerRef) => {
        try {
          const fetched = await favoritesApi.getFavorites(customerRef);
          set({ favorites: fetched });
        } catch (error) {
          console.error('Failed to fetch favorites', error);
        }
      },

      addFavorite: (item) => {
        set((state) => {
          if (state.favorites.some((f) => f.menuItemId === item.menuItemId)) {
            return state;
          }
          return {
            favorites: [{ ...item, addedAt: Date.now() }, ...state.favorites],
          };
        });
        const ref = get().customerProfile.customerRef || (typeof window !== 'undefined' ? localStorage.getItem('arifsmart_customerRef') : null);
        if (ref) favoritesApi.addFavorite(ref, item.menuItemId).catch(console.error);
      },

      removeFavorite: (menuItemId) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.menuItemId !== menuItemId),
        }));
        const ref = get().customerProfile.customerRef || (typeof window !== 'undefined' ? localStorage.getItem('arifsmart_customerRef') : null);
        if (ref) favoritesApi.removeFavorite(ref, menuItemId).catch(console.error);
      },

      isFavorite: (menuItemId) =>
        get().favorites.some((f) => f.menuItemId === menuItemId),

      toggleFavorite: (item) => {
        const state = get();
        const isFav = state.favorites.some((f) => f.menuItemId === item.menuItemId);
        if (isFav) {
          get().removeFavorite(item.menuItemId);
        } else {
          get().addFavorite(item);
        }
      },

      updateProfile: (profile) =>
        set((state) => ({
          customerProfile: { ...state.customerProfile, ...profile },
        })),

      setLanguage: (language) => set({ language }),

      setCurrency: (currency) => set({ currency }),

      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    }),
    {
      name: 'arifsmart-favorites',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
