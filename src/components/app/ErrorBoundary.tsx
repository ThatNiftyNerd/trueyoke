/**
 * Last-resort React error boundary.
 *
 * Route-level boundaries (TanStack's `errorComponent`) only catch errors
 * thrown *inside* a route component. Errors thrown by the router's own match
 * renderer during React's commit phase blow past them and unmount the whole
 * tree, leaving a blank page. This boundary sits above that, so the worst
 * case is a readable "please reload" screen.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

interface Props {
  children: ReactNode;
  /** Used for telemetry so we can tell which boundary caught the error. */
  name: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    reportLovableError(error, {
      boundary: this.props.name,
      componentStack: info.componentStack ?? "",
    });
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-app-canvas px-6 text-center">
        <h1 className="font-serif text-2xl text-app-ink">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-sm text-app-ink/70">
          We hit an unexpected error. Reloading usually sorts it out — your account is safe.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-app-primary px-4 py-2 text-sm font-medium text-app-on-primary transition-colors hover:bg-app-primary/90"
        >
          Reload
        </button>
      </main>
    );
  }
}
