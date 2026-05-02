import { useFavoritesStore } from '@/stores/favoritesStore';

const EXCHANGE_RATE = 115.5; // Example fixed rate: 1 USD = 115.5 ETB

export function formatPrice(priceETB: number) {
  const { currency } = useFavoritesStore.getState();
  
  if (currency === 'USD') {
    const priceUSD = priceETB / EXCHANGE_RATE;
    return `$ ${priceUSD.toFixed(2)}`;
  }
  
  return `ETB ${priceETB.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getCurrencySymbol() {
  const { currency } = useFavoritesStore.getState();
  return currency === 'USD' ? '$' : 'ETB';
}
