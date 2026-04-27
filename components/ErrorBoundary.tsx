"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error("UI section failed", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <section className="rounded-2xl border border-coral/20 bg-coral/10 p-4 shadow-soft">
            <h2 className="text-lg font-black text-coral">Section indisponible</h2>
            <p className="mt-2 text-sm font-semibold text-ink/70">
              Une erreur locale a ete isolee. Le reste de l&apos;application reste utilisable.
            </p>
          </section>
        )
      );
    }

    return this.props.children;
  }
}
