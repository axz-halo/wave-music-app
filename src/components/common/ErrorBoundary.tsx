'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-sk4-off-white p-sk4-lg">
          <div className="max-w-md w-full bg-white rounded-lg border border-sk4-gray p-sk4-xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-sk4-md">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="sk4-text-lg font-semibold text-sk4-charcoal mb-sk4-sm">
              오류가 발생했습니다
            </h2>
            <p className="sk4-text-sm text-sk4-medium-gray mb-sk4-lg">
              {this.state.error?.message || '알 수 없는 오류가 발생했습니다'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="sk4-btn px-6 py-3 bg-sk4-orange text-white hover:bg-sk4-orange/90 transition-all duration-200"
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for function components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

