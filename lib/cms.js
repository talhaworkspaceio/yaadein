"use client";

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from './firebase';
import { useInitialCmsValue } from './CmsProvider';

// ---------------------------------------------------------------------------
// CMS content hooks.
//
// Firebase is read from the browser, so on a fresh page the hook has nothing to
// return until the round-trip finishes. Every consumer is written as
// `cms?.title || "Hardcoded default"`, which meant the default painted first and
// visibly swapped a second or two later once the real content arrived.
//
// So the last known payload is mirrored into localStorage and replayed in a
// layout effect — before the browser paints — and then reconciled with the live
// value when it lands. A reload now shows the saved content immediately.
// ---------------------------------------------------------------------------

const CACHE_PREFIX = 'yaadein:cms:v1:';

function readCache(key) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Private mode, disabled storage or corrupt JSON — fall back to the network.
    return null;
  }
}

function writeCache(key, value) {
  if (typeof window === 'undefined') return;
  try {
    if (value === null || value === undefined) window.localStorage.removeItem(CACHE_PREFIX + key);
    else window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota or storage unavailable — caching is an optimisation, never required.
  }
}

// Runs before paint in the browser; falls back to useEffect during SSR so React
// does not warn. Reading the cache here (rather than in useState) keeps the
// first client render identical to the server HTML, avoiding a hydration
// mismatch while still updating before anything is painted.
const useBeforePaint = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useCachedNode(path, cacheKey) {
  // Rendered on the server too, so the first client render matches the HTML and
  // there is no swap to see.
  const serverValue = useInitialCmsValue(path);
  const hasServerValue = serverValue !== undefined;

  const [data, setData] = useState(hasServerValue ? serverValue : null);
  const [loading, setLoading] = useState(!hasServerValue);
  const gotLive = useRef(false);

  // Only pages outside the server preload need the localStorage fallback.
  useBeforePaint(() => {
    if (hasServerValue || gotLive.current) return;
    const cached = readCache(cacheKey);
    if (cached !== null) {
      setData(cached);
      setLoading(false);
    }
  }, [cacheKey, hasServerValue]);

  useEffect(() => {
    let isMounted = true;
    try {
      const nodeRef = ref(db, path);
      const unsub = onValue(
        nodeRef,
        (snapshot) => {
          if (!isMounted) return;
          const val = snapshot.val() || null;
          gotLive.current = true;
          setData(val);
          setLoading(false);
          writeCache(cacheKey, val);
        },
        (err) => {
          console.warn(`[CMS Firebase] Error reading ${path}:`, err);
          if (isMounted) setLoading(false);
        }
      );
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {
      if (isMounted) setLoading(false);
    }
  }, [path, cacheKey]);

  return { data, loading };
}

function useGlobalContent(slug) {
  return useCachedNode(`site_content/${slug}`, `site:${slug}`);
}

export function useHomePageContent() {
  return useGlobalContent('home-page');
}

export function useCatalogPageContent() {
  return useGlobalContent('catalog-page');
}

export function useServicesPageContent() {
  return useGlobalContent('services-page');
}

export function useTrackPageContent() {
  return useGlobalContent('track-page');
}

export function useContactPageContent() {
  return useGlobalContent('contact-page');
}

export function usePrivacyPolicyContent() {
  return useGlobalContent('privacy-policy-page');
}

export function useRefundPolicyContent() {
  return useGlobalContent('refund-policy-page');
}

export function useTermsContent() {
  return useGlobalContent('terms-page');
}

export function useNavigationContent() {
  return useGlobalContent('navigation');
}

export function usePageContent(pageIdentifier) {
  const { data, loading } = useCachedNode(`cms_pages/${pageIdentifier}`, `page:${pageIdentifier}`);
  return { content: data, loading };
}
