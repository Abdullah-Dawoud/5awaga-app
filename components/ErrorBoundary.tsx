'use client';

import { Component, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[TypeFlow] Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 animate-in fade-in duration-300">
          <div className="text-5xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Something went wrong</h2>
          <p className="text-slate-400 text-sm mb-8 max-w-sm">
            An unexpected error occurred. Your progress is saved — just reload to continue.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, message: '' });
              window.location.reload();
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-300 text-slate-950 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <RotateCcw className="w-4 h-4" />
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
