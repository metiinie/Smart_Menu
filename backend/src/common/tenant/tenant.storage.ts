import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  restaurantId: string;
  userId?: string;
  role?: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();
