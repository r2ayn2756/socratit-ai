// ============================================================================
// ERROR BOUNDARY COMPONENT
// React error boundary for graceful error handling
// ============================================================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <div className="bg-white/90 backdrop-blur-2xl border border-red-200/50 rounded-3xl shadow-2xl p-8">
              {/* Error Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center mb-6 mx-auto">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>

              {/* Error Message */}
              <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
                Something went wrong
              </h1>
              <p className="text-gray-600 text-center mb-6">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-2">Error Details:</h3>
                  <p className="text-sm text-red-800 font-mono mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="text-sm text-red-700">
                      <summary className="cursor-pointer font-semibold mb-2">
                        Component Stack
                      </summary>
                      <pre className="whitespace-pre-wrap text-xs bg-red-100 p-3 rounded-lg overflow-x-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={this.handleReset}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors duration-200"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// ASYNC ERROR BOUNDARY (for async operations)
// ============================================================================

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

export const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = ({
  children,
  fallback,
}) => {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = (error: Error) => {
    console.error('AsyncErrorBoundary caught:', error);
    setError(error);
  };

  const handleRetry = () => {
    setError(null);
  };

  if (error) {
    if (fallback) {
      return <>{fallback(error, handleRetry)}</>;
    }

    return (
      <div className="p-6 rounded-xl bg-red-50 border border-red-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-1">Error Loading Data</h3>
            <p className="text-sm text-red-700 mb-3">{error.message}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
