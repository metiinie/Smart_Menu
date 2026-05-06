'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { telemetryApi } from '@/lib/api';
import { TriangleAlert } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);

    // Try to log to telemetry backend
    try {
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

      telemetryApi.logError({
        message: `[React Error] ${error.message}`,
        stackTrace: `${error.stack}\n\nComponent Stack:\n${errorInfo.componentStack}`,
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId,
        restaurantId,
        branchId,
      }).catch(e => console.error('Telemetry failed', e));
    } catch (e) {
      console.error('Failed to prepare telemetry data', e);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-100 flex items-center justify-center p-4 font-sans text-foreground">
          <div className="max-w-md w-full bg-surface rounded-2xl shadow-xl border border-surface-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <TriangleAlert size={32} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-foreground/60 text-sm mb-8">
              A critical error occurred while rendering this page. Our team has been automatically notified.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
