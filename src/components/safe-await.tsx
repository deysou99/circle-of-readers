import { Await } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Safe wrapper around TanStack Router's `<Await>`.
 *
 * `useAwaited`/`Await` call React's `use()` on the promise it is given. If that
 * promise is `null`/`undefined` (a deferred loader value that never resolved,
 * or a route that streamed nothing), React throws
 * `Cannot read properties of null (reading 'use')` and the tree blanks out.
 * Always render deferred data through this component instead of `<Await>` so a
 * missing promise degrades to a fallback rather than crashing.
 */
export function SafeAwait<T>({
  promise,
  children,
  fallback = null,
}: {
  promise: Promise<T> | null | undefined;
  children: (value: T) => ReactNode;
  fallback?: ReactNode;
}) {
  if (!promise || typeof (promise as Promise<T>).then !== "function") {
    return <>{fallback}</>;
  }
  return <Await promise={promise} fallback={fallback} children={children} />;
}
