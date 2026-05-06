import { telemetryApi } from './api';

export function initGlobalErrorLogger() {
  if (typeof window === 'undefined') return;

  // Prevent multiple initializations
  if ((window as any).__loggerInitialized) return;
  (window as any).__loggerInitialized = true;

  const logToBackend = async (message: string, stackTrace?: string) => {
    try {
      // Extract auth context if available
      const rawUser = localStorage.getItem('arifsmart_user');
      let userId, restaurantId, branchId;
      if (rawUser) {
        try {
          const user = JSON.parse(rawUser);
          userId = user.id;
          restaurantId = user.restaurantId;
          branchId = user.branchId;
        } catch (e) {}
      }

      await telemetryApi.logError({
        message,
        stackTrace,
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId,
        restaurantId,
        branchId,
      });
    } catch (e) {
      console.error('Failed to log error to telemetry backend', e);
    }
  };

  // Catch synchronous runtime errors
  window.addEventListener('error', (event) => {
    const error = event.error || event;
    logToBackend(
      error.message || 'Unknown runtime error',
      error.stack || undefined
    );
  });

  // Catch unhandled promise rejections (often API failures or async crashes)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    logToBackend(
      reason?.message || typeof reason === 'string' ? reason : 'Unhandled Promise Rejection',
      reason?.stack || undefined
    );
  });
}
