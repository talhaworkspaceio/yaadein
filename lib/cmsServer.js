// ---------------------------------------------------------------------------
// Server-side CMS read.
//
// The client hooks can only fetch after hydration, so the server HTML used to
// ship the hardcoded defaults and the real content swapped in a moment later.
// Reading the same nodes here over Firebase's REST API means the HTML leaves the
// server already correct — there is nothing to swap.
//
// Kept deliberately small and failure-tolerant: if the fetch fails the page
// still renders, and the client hooks fill in as they always did.
// ---------------------------------------------------------------------------

const DB_URL = "https://framestudio-e4481-default-rtdb.firebaseio.com";

// Nodes whose values decide what the first paint looks like.
const PRELOAD = ["site_content", "cms_layouts"];

async function fetchNode(node) {
  try {
    const res = await fetch(`${DB_URL}/${node}.json`, {
      // Content is edited in the admin and must show up immediately.
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Returns a flat map of `path -> value`, matching the paths the client hooks
 * subscribe to (e.g. "site_content/catalog-page", "cms_layouts/home").
 */
export async function getInitialCmsData() {
  const out = {};
  const results = await Promise.all(PRELOAD.map(fetchNode));

  PRELOAD.forEach((node, i) => {
    const val = results[i];
    if (!val || typeof val !== "object") return;
    Object.entries(val).forEach(([key, child]) => {
      out[`${node}/${key}`] = child ?? null;
    });
  });

  return out;
}
