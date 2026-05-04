import React, { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class RouterErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Router render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background px-6 text-center">
          <p className="text-lg font-semibold text-foreground">Something went wrong</p>
          <p className="text-sm text-muted-foreground max-w-md">
            {this.state.error.message}
          </p>
          <button
            type="button"
            className="text-sm text-primary underline"
            onClick={() => window.location.reload()}
          >
            Reload the page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
