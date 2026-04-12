/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      let isFirebaseError = false;

      try {
        // Check if the error message is a JSON string from handleFirestoreError
        const parsed = JSON.parse(this.state.error?.message || '');
        if (parsed.error && parsed.operationType) {
          errorMessage = `Security Error: Insufficient permissions for ${parsed.operationType} on ${parsed.path || 'unknown path'}.`;
          isFirebaseError = true;
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl shadow-gray-100/50 dark:shadow-none border border-gray-100 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Something went wrong</h2>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 mb-8 text-left">
              <p className="text-sm font-mono text-gray-600 dark:text-gray-300 break-all">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-2xl shadow-lg shadow-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-5 h-5" />
              Reload Application
            </button>
            {isFirebaseError && (
              <p className="mt-4 text-xs text-gray-400">
                If this persists, please contact your administrator to update security rules.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
