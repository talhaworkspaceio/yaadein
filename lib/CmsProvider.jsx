"use client";

// Carries the server-rendered CMS snapshot down to the client hooks, so their
// very first render matches the HTML the server produced.

import { createContext, useContext } from "react";

const CmsContext = createContext(null);

export function CmsProvider({ initial, children }) {
  return <CmsContext.Provider value={initial || null}>{children}</CmsContext.Provider>;
}

/** The server-rendered value for a Firebase path, or undefined if not preloaded. */
export function useInitialCmsValue(path) {
  const map = useContext(CmsContext);
  if (!map) return undefined;
  return Object.prototype.hasOwnProperty.call(map, path) ? map[path] : undefined;
}
