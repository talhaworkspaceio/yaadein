"use client";

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from './firebase';

function useGlobalContent(slug) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    try {
      const contentRef = ref(db, `site_content/${slug}`);
      const unsub = onValue(contentRef, (snapshot) => {
        if (isMounted) {
          setData(snapshot.val() || null);
          setLoading(false);
        }
      }, (err) => {
        console.warn(`[CMS Firebase] Error reading global ${slug}:`, err);
        if (isMounted) setLoading(false);
      });
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {
      if (isMounted) setLoading(false);
    }
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

export function usePageContent(pageIdentifier) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    try {
      const pageRef = ref(db, `cms_pages/${pageIdentifier}`);
      const unsub = onValue(pageRef, (snapshot) => {
        if (isMounted) {
          setContent(snapshot.val() || null);
          setLoading(false);
        }
      });
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {
      if (isMounted) setLoading(false);
    }
  }, [pageIdentifier]);

  return { content, loading };
}
