"use client";

// SSR-safe media-query hook. Built on useSyncExternalStore — React's purpose-made
// primitive for subscribing to an external store (here: matchMedia). It replaces
// the useState + useEffect + addEventListener dance, and crucially takes a
// `serverValue` used for SSR and the first client render, so there is no
// hydration mismatch or post-mount flash the way an effect-based read has.
//
// Prefer plain CSS media queries when the query only drives styling. Reach for
// this hook only when the breakpoint must change JS behavior (branch on it,
// close a portal, pick a component).

import { useSyncExternalStore } from "react";

// One MediaQueryList per query, shared across all callers and stable across
// renders. useSyncExternalStore re-runs `subscribe` whenever its identity
// changes, so these MUST be referentially stable — inline closures would tear
// down and re-add the listener on every render, the exact churn this replaces.
const stores = new Map<
  string,
  { mql: MediaQueryList; subscribe: (cb: () => void) => () => void; getSnapshot: () => boolean }
>();

function storeFor(query: string) {
  let store = stores.get(query);
  if (!store) {
    const mql = window.matchMedia(query);
    store = {
      mql,
      subscribe: (cb) => {
        mql.addEventListener("change", cb);
        return () => mql.removeEventListener("change", cb);
      },
      getSnapshot: () => mql.matches,
    };
    stores.set(query, store);
  }
  return store;
}

export function useMediaQuery(query: string, serverValue = false): boolean {
  // getServerSnapshot runs on the server and the first client render (to match
  // SSR output); it must not touch window/matchMedia. Stable no-op-ish literal.
  const getServerSnapshot = () => serverValue;
  // storeFor is only ever reached on the client (getServerSnapshot handles SSR),
  // where window.matchMedia exists. The store is cached per query, so subscribe/
  // getSnapshot keep a stable identity across renders.
  const store = typeof window === "undefined" ? null : storeFor(query);
  return useSyncExternalStore(
    store ? store.subscribe : () => () => {},
    store ? store.getSnapshot : getServerSnapshot,
    getServerSnapshot,
  );
}
