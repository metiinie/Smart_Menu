import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT if present (DISABLED for open access)
/*
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
*/

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
    const message =
      error.response?.data?.message ?? error.message ?? 'Something went wrong';
    return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
  },
);

// ─── API helpers ─────────────────────────────────────────────────────────────

export const menuApi = {
  getMenu: (branchId: string, fasting?: boolean) =>
    api
      .get(`/menu/${branchId}`, { params: { fasting } })
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
    items: { menuItemId: string; quantity: number }[];
    notes?: string;
  }) => api.post('/orders', payload).then((r) => r.data),

  getById: (id: string) => api.get(`/orders/${id}`).then((r) => r.data),

  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }).then((r) => r.data),

  list: (branchId: string, status?: string) =>
    api.get('/orders', { params: { branchId, status } }).then((r) => r.data),

  getActiveOrders: (branchId: string, sessionId: string, customerRef: string) =>
    api.get('/orders/my-orders/active', { params: { branchId, sessionId, customerRef } }).then((r) => r.data),
};

export const kitchenApi = {
  getOrders: (branchId: string) =>
    api.get('/kitchen/orders', { params: { branchId } }).then((r) => r.data),
};

export const adminApi = {
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

  getOrders: (branchId: string) =>
    api.get('/admin/orders', { params: { branchId } }).then((r) => r.data),

  getCategories: (branchId: string) =>
    api.get('/admin/categories', { params: { branchId } }).then((r) => r.data),

  closeTableSession: (sessionId: string) =>
    api.patch(`/table-sessions/${sessionId}/close`).then((r) => r.data),
};

export const authApi = {
  pinLogin: (staffId: string, pin: string) =>
    api.post('/auth/pin-login', { staffId, pin }).then((r) => r.data),

  listStaff: (branchId: string) =>
    api.get('/auth/staff', { params: { branchId } }).then((r) => r.data),
};
