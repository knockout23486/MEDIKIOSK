import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  scope?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Prevents an unexpected render failure from turning the kiosk into a blank screen. */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[ErrorBoundary:${this.props.scope ?? 'application'}]`, error, info.componentStack);
  }

  private retry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[55vh] flex items-center justify-center px-4 py-12" role="alert">
        <section className="w-full max-w-lg rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl dark:border-amber-900 dark:bg-slate-800">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            This screen could not be displayed
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Your session is safe. Retry this screen, or return to the kiosk and continue from there.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={this.retry}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-ayush-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-ayush-800"
            >
              <RefreshCw className="h-4 w-4" /> Retry screen
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Home className="h-4 w-4" /> Return to kiosk
            </a>
          </div>
        </section>
      </div>
    );
  }
}
