import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  addFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
  removeFavorite: (menuItemId: string) => void;
  isFavorite: (menuItemId: string) => boolean;
  toggleFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
  updateProfile: (profile: Partial<CustomerProfile>) => void;
  setLanguage: (lang: 'en' | 'am' | 'or') => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      customerProfile: {},
      language: 'en',

      addFavorite: (item) =>
        set((state) => {
          if (state.favorites.some((f) => f.menuItemId === item.menuItemId)) {
            return state;
          }
          return {
            favorites: [{ ...item, addedAt: Date.now() }, ...state.favorites],
          };
        }),

      removeFavorite: (menuItemId) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.menuItemId !== menuItemId),
        })),

      isFavorite: (menuItemId) =>
        get().favorites.some((f) => f.menuItemId === menuItemId),

      toggleFavorite: (item) => {
        const state = get();
        if (state.favorites.some((f) => f.menuItemId === item.menuItemId)) {
          set({
            favorites: state.favorites.filter(
              (f) => f.menuItemId !== item.menuItemId
            ),
          });
        } else {
          set({
            favorites: [{ ...item, addedAt: Date.now() }, ...state.favorites],
          });
        }
      },

      updateProfile: (profile) =>
        set((state) => ({
          customerProfile: { ...state.customerProfile, ...profile },
        })),

      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'arifsmart-favorites',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
