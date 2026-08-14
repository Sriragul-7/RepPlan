import { Component, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center">
          <div className="glass-card max-w-sm space-y-4 p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.06]">
              <svg
                className="h-8 w-8 text-ivory"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold text-ivory">
              Something went wrong
            </h2>
            <p className="text-sm text-stone">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
              className="w-full rounded-full bg-ivory py-3 text-sm font-semibold text-ink transition-all hover:bg-white active:scale-[0.98]"
            >
              Restart app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
