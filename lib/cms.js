"use client";

import { useState, useEffect } from 'react';

function useGlobalContent(slug) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchGlobal() {
      try {
        const res = await fetch(`/api/globals/${slug}?depth=2`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        if (res.ok && isMounted) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.warn(`[CMS] Failed to fetch global ${slug}:`, err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchGlobal();
    return () => { isMounted = false; };
  }, [slug]);

  return { data, loading };
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

/**
 * Client-side React hook to fetch editable page content (text & media) from Payload CMS collection
 */
export function usePageContent(pageIdentifier) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchContent() {
      try {
        const res = await fetch(`/api/page-content?where[pageIdentifier][equals]=${pageIdentifier}&depth=2`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.docs && data.docs.length > 0 && isMounted) {
            setContent(data.docs[0]);
          }
        }
      } catch (err) {
        console.warn(`[CMS] Failed to load CMS content for ${pageIdentifier}:`, err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchContent();
    return () => { isMounted = false; };
  }, [pageIdentifier]);

  return { content, loading };
}
