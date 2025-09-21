'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { errorMonitoring, ErrorBoundary as ErrorBoundaryError } from '@/lib/error-monitoring';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report error to monitoring service
    errorMonitoring.captureException(
      new ErrorBoundaryError(error.message, errorInfo.componentStack),
      {
        component: 'ErrorBoundary',
        action: 'component_error',
        metadata: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        },
      }
    );

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  handleReportError = () => {
    if (this.state.error) {
      // Allow null to report additional context
      const nullDescription = prompt('Please describe what you were doing when this error occurred:');
      
      errorMonitoring.captureMessage(
        `User reported error: ${this.state.error.message}`,
        'error',
        {
          component: 'ErrorBoundary',
          action: 'null_report',
          metadata: {
            nullDescription: nullDescription || 'No description provided',
            errorId: this.state.errorId,
          },
        }
      );

      alert('Thank you for the report! Our team will investigate this issue.');
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-500" />
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Something went wrong
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We apologize for the inconvenience. An unexpected error has occurred.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-left">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Development Error Details:
                  </h3>
                  <p className="text-xs text-red-700 font-mono">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <button
                onClick={this.handleRetry}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Try Again
              </button>

              <button
                onClick={this.handleReportError}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Report This Error
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Go to Homepage
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Error ID: {this.state.errorId}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                If the problem persists, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simpler functional error boundary for specific components
interface SimpleErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

export function SimpleErrorBoundary({ 
  children, 
  fallback,
  componentName = 'Unknown Component'
}: SimpleErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error in {componentName}
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  This component encountered an error and couldn't render properly.
                </p>
              </div>
            </div>
          </div>
        )
      }
      onError={(error, errorInfo) => {
        errorMonitoring.captureException(error, {
          component: componentName,
          action: 'simple_error_boundary',
          metadata: {
            componentStack: errorInfo.componentStack,
          },
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;