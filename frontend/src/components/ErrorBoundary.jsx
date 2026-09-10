// frontend/src/components/ErrorBoundary.jsx
import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("🔴 ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
    // Optional: send to Sentry or your error tracking service
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-danger)]/20 bg-[var(--bg-card)] p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)]">
              <span className="text-2xl text-[var(--color-danger)]">⚠</span>
            </div>

            <h1 className="text-lg font-bold text-[var(--text-primary)]">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              An unexpected error occurred. You can try reloading the page or return home.
            </p>

            {this.state.error && (
              <details className="mt-4 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-3 text-left">
                <summary className="cursor-pointer text-xs font-medium text-[var(--text-muted)]">
                  Error details
                </summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[10px] text-[var(--color-danger)]">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)]"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)]"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}