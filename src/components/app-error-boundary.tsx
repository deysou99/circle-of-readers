import { Component, type ErrorInfo, type ReactNode } from "react";
import { detectDuplicateReact, isReactInstanceError } from "@/lib/react-integrity";
import { reportLovableError } from "@/lib/lovable-error-reporting";

type Props = { children: ReactNode };
type State = { error: Error | null; retries: number; retrying: boolean };

const MAX_AUTO_RETRIES = 1;
const RETRY_DELAY_MS = 600;

/**
 * Global boundary so a failed route render never leaves a blank screen.
 * Transient render failures get one automatic retry; duplicate-React crashes
 * get a dedicated explanation because retrying can never fix them.
 */
export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { error: null, retries: 0, retrying: false };
  private timer: ReturnType<typeof setTimeout> | undefined;

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[app-error-boundary]", error, info.componentStack);
    reportLovableError(error, { boundary: "app_error_boundary" });

    const fatal = isReactInstanceError(error) || detectDuplicateReact().duplicate;
    if (!fatal && this.state.retries < MAX_AUTO_RETRIES) {
      this.setState({ retrying: true });
      this.timer = setTimeout(() => {
        this.setState((s) => ({ error: null, retries: s.retries + 1, retrying: false }));
      }, RETRY_DELAY_MS);
    }
  }

  override componentWillUnmount() {
    if (this.timer) clearTimeout(this.timer);
  }

  private reset = () => this.setState({ error: null, retrying: false });

  override render() {
    const { error, retrying } = this.state;
    if (!error) return this.props.children;

    if (retrying) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-paper px-6">
          <p className="text-sm text-muted-foreground">Reloading this screen…</p>
        </div>
      );
    }

    const duplicateReact = isReactInstanceError(error) || detectDuplicateReact().duplicate;

    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-6">
        <div className="max-w-md text-center">
          <h1
            className="text-xl font-semibold tracking-tight text-ink"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {duplicateReact ? "Circle needs a hard refresh" : "This screen didn't load"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {duplicateReact
              ? "Two copies of the app framework were loaded, usually from a stale cached bundle. A hard refresh clears it."
              : "Something went wrong while rendering. You can retry or head back home."}
          </p>
          <p className="mt-3 break-words rounded-xl border border-border bg-parchment px-3 py-2 text-left text-[11px] text-muted-foreground">
            {error.message}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {!duplicateReact && (
              <button
                onClick={this.reset}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Try again
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="rounded-md border border-input bg-paper px-4 py-2 text-sm font-medium text-ink"
            >
              Hard refresh
            </button>
            <a
              href="/"
              className="rounded-md border border-input bg-paper px-4 py-2 text-sm font-medium text-ink"
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
