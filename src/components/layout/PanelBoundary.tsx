"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  name: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class PanelBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.name}] crashed:`, error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-sm text-neutral-300">
          The {this.props.name.toLowerCase()} panel hit an error.
        </p>
        <p className="max-w-xs break-words text-xs text-neutral-500">
          {this.state.error.message}
        </p>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 transition hover:bg-neutral-800"
        >
          Try again
        </button>
      </div>
    );
  }
}