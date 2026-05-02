import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

import { useAuthStore } from '@/stores/authStore';

// Attach JWT if present
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Unwrap data from {success, data, timestamp} wrapper
api.interceptors.response.use(
  (res) => {
    // If it's the standard wrapper, extract the data payload
    if (res.data && typeof res.data === 'object' && 'success' in res.data) {
      // Return the data if it exists, otherwise a safe fallback
      return { ...res, data: res.data.data ?? res.data };
    }
    return res;
  },
  (error) => {
    // ⚠️ IMPORTANT: Re-throw the original Axios error so callers can still
    // inspect error.response.status and error.response.data.message.
    // (e.g. SESSION_EXPIRED recovery in syncManager depends on this)
    const raw = error.response?.data?.message ?? error.message ?? 'Something went wrong';
    const normalized = Array.isArray(raw) ? raw.join(', ') : String(raw);
    error.message =
      error.response?.status === 503 && normalized.toLowerCase().includes('database')
        ? 'Server is waking up. Please wait a moment and try again.'
        : normalized;
    return Promise.reject(error);
  },
);

// ─── API helpers ─────────────────────────────────────────────────────────────

export const menuApi = {
  getMenu: (branchId: string, fasting?: boolean) =>
    api
      .get(`/menu/${branchId}`, { params: { fasting } })
      .then((r) => r.data),
      
  getTrending: (branchId: string, limit?: number) =>
    api
      .get(`/menu/${branchId}/trending`, { params: { limit } })
      .then((r) => r.data),
};

export const contextApi = {
  getTableContext: (branchId: string, tableId: string) =>
    api.get(`/table-context/${branchId}/${tableId}`).then((r) => r.data),
};

export const ordersApi = {
  create: (payload: {
    tableId: string;
    sessionId: string;
    customerRef: string;
    items: {
      menuItemId: string;
      quantity: number;
      note?: string;
      options?: { optionName: string; optionPrice: number }[];
    }[];
    notes?: string;
  }) => api.post('/orders', payload, { timeout: 30000 }).then((r) => r.data),

  getById: (id: string) => api.get(`/orders/${id}`).then((r) => r.data),

  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }).then((r) => r.data),

  list: (branchId: string, status?: string) =>
    api.get('/orders', { params: { branchId, status } }).then((r) => r.data),

  getActiveOrders: (branchId: string, sessionId: string, customerRef: string) =>
    api.get('/orders/my-orders/active', { params: { branchId, sessionId, customerRef } }).then((r) => r.data),

  submitRating: (orderId: string, data: { rating: number; comment?: string; customerRef: string; menuItemId?: string }) =>
    api.post(`/orders/${orderId}/rate`, data).then((r) => r.data),

  getOrderHistory: (customerRef: string) =>
    api.get('/orders/history/customer', { params: { customerRef } }).then((r) => r.data),
};

export const kitchenApi = {
  getOrders: (branchId: string) =>
    api.get('/kitchen/orders', { params: { branchId } }).then((r) => r.data),
};

export const adminApi = {
  // Menu Items
  getMenuItems: (branchId: string) =>
    api.get('/admin/menu-items', { params: { branchId } }).then((r) => r.data),

  createMenuItem: (data: Record<string, unknown>) =>
    api.post('/admin/menu-items', data).then((r) => r.data),

  updateMenuItem: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/menu-items/${id}`, data).then((r) => r.data),

  toggleAvailability: (id: string, isAvailable: boolean) =>
    api
      .patch(`/admin/menu-items/${id}/availability`, { isAvailable })
      .then((r) => r.data),

  deleteMenuItem: (id: string) =>
    api.delete(`/admin/menu-items/${id}`).then((r) => r.data),

  // Orders
  getOrders: (branchId: string) =>
    api.get('/admin/orders', { params: { branchId } }).then((r) => r.data),

  getOrderAudit: (branchId: string, limit = 40) =>
    api.get('/admin/orders/audit', { params: { branchId, limit } }).then((r) => r.data),

  // Categories
  getCategories: (branchId: string) =>
    api.get('/admin/categories', { params: { branchId } }).then((r) => r.data),

  createCategory: (data: { name: string; branchId: string; sortOrder?: number; imageUrl?: string }) =>
    api.post('/admin/categories', data).then((r) => r.data),

  updateCategory: (id: string, data: { name?: string; sortOrder?: number; imageUrl?: string }) =>
    api.patch(`/admin/categories/${id}`, data).then((r) => r.data),

  deleteCategory: (id: string) =>
    api.delete(`/admin/categories/${id}`).then((r) => r.data),

  // Tables
  getTables: (branchId: string) =>
    api.get('/admin/tables', { params: { branchId } }).then((r) => r.data),

  createTable: (data: { branchId: string; tableNumber: number }) =>
    api.post('/admin/tables', data).then((r) => r.data),

  toggleTableStatus: (id: string, isActive: boolean) =>
    api.patch(`/admin/tables/${id}/status`, { isActive }).then((r) => r.data),

  deleteTable: (id: string) =>
    api.delete(`/admin/tables/${id}`).then((r) => r.data),

  // Dashboard Analytics
  getDashboard: (branchId: string) =>
    api.get('/admin/dashboard', { params: { branchId } }).then((r) => r.data),

  // Staff
  getStaff: (branchId: string) =>
    api.get('/admin/staff', { params: { branchId } }).then((r) => r.data),

  createStaff: (data: { name: string; role: string; email: string; password?: string; pin?: string; branchId: string }) =>
    api.post('/admin/staff', data).then((r) => r.data),

  updateStaff: (id: string, data: { name?: string; role?: string; email?: string; isActive?: boolean }) =>
    api.patch(`/admin/staff/${id}`, data).then((r) => r.data),

  deleteStaff: (id: string) =>
    api.delete(`/admin/staff/${id}`).then((r) => r.data),

  resetStaffPin: (id: string, newPin: string) =>
    api.post(`/admin/staff/${id}/reset-pin`, { newPin }).then((r) => r.data),

  resetStaffPassword: (id: string, newPassword: string) =>
    api.post(`/admin/staff/${id}/reset-password`, { newPassword }).then((r) => r.data),

  // Branch Settings
  getBranch: (branchId: string) =>
    api.get('/admin/branch', { params: { branchId } }).then((r) => r.data),

  updateBranch: (id: string, data: { name?: string; vatRate?: number; serviceChargeRate?: number }) =>
    api.patch(`/admin/branch/${id}`, data).then((r) => r.data),

  // Uploads
  uploadAsset: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  closeTableSession: (sessionId: string) =>
    api.patch(`/table-sessions/${sessionId}/close`).then((r) => r.data),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),

  pinLogin: (staffId: string, pin: string) =>
    api.post('/auth/pin-login', { staffId, pin }).then((r) => r.data),

  listStaff: (branchId: string) =>
    api.get('/auth/staff', { params: { branchId } }).then((r) => r.data),

  getDefaultBranch: () =>
    api.get('/auth/default-branch').then((r) => r.data),
};

export const notificationsApi = {
  subscribe: (customerRef: string, subscription: any) =>
    api.post('/notifications/subscribe', subscription, { params: { customerRef } }).then((r) => r.data),
};

export const favoritesApi = {
  getFavorites: (customerRef: string) =>
    api.get(`/favorites/${customerRef}`).then((r) => r.data),
    
  addFavorite: (customerRef: string, menuItemId: string) =>
    api.post('/favorites', { customerRef, menuItemId }).then((r) => r.data),
    
  removeFavorite: (customerRef: string, menuItemId: string) =>
    api.delete(`/favorites/${customerRef}/${menuItemId}`).then((r) => r.data),
};

export const superAdminApi = {
  // ── Stats ────────────────────────────────────────────────────────────────
  getStats: () =>
    api.get('/platform/stats').then((r) => r.data),

  // ── Restaurants ──────────────────────────────────────────────────────────
  getRestaurants: () =>
    api.get('/platform/restaurants').then((r) => r.data),

  getRestaurant: (id: string) =>
    api.get(`/platform/restaurants/${id}`).then((r) => r.data),

  createRestaurant: (data: {
    name: string;
    slug: string;
    planId: string;
    branchName?: string;
    adminEmail: string;
    adminName: string;
    adminPassword: string;
  }) => api.post('/platform/restaurants', data).then((r) => r.data),

  updateRestaurant: (id: string, data: { isActive?: boolean; subscriptionStatus?: string; planId?: string }) =>
    api.patch(`/platform/restaurants/${id}`, data).then((r) => r.data),

  deleteRestaurant: (id: string) =>
    api.delete(`/platform/restaurants/${id}`).then((r) => r.data),

  // ── Subscription Plans ───────────────────────────────────────────────────
  getPlans: () =>
    api.get('/platform/plans').then((r) => r.data),

  createPlan: (data: { name: string; maxBranches: number; maxStaff: number; priceMonthly: number; features?: Record<string, boolean> }) =>
    api.post('/platform/plans', data).then((r) => r.data),

  updatePlan: (id: string, data: { name?: string; maxBranches?: number; maxStaff?: number; priceMonthly?: number; features?: Record<string, boolean> }) =>
    api.patch(`/platform/plans/${id}`, data).then((r) => r.data),

  deletePlan: (id: string) =>
    api.delete(`/platform/plans/${id}`).then((r) => r.data),

  // ── Cross-Tenant Users ───────────────────────────────────────────────────
  getAllUsers: (params?: { restaurantId?: string; role?: string; isActive?: boolean }) =>
    api.get('/platform/users', { params }).then((r) => r.data),

  // ── Cross-Tenant Branches ────────────────────────────────────────────────
  getAllBranches: (restaurantId?: string) =>
    api.get('/platform/branches', { params: restaurantId ? { restaurantId } : {} }).then((r) => r.data),
};
