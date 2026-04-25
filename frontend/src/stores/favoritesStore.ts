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

interface FavoritesStore {
  favorites: FavoriteItem[];
  addFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
  removeFavorite: (menuItemId: string) => void;
  isFavorite: (menuItemId: string) => boolean;
  toggleFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],

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
    }),
    {
      name: 'arifsmart-favorites',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
