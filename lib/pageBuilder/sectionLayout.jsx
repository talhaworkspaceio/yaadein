"use client";

// ---------------------------------------------------------------------------
// Section layouts for hand-coded pages.
//
// The big pages (home, catalog, checkout…) stay as React because their value is
// the behaviour — cart, customizer, players. What an admin actually wants to
// change is the *arrangement*: which bands appear, in what order, how much air
// they get, and slotting extra content between them.
//
// So each coded page exposes its sections as keyed nodes, and this module
// renders them according to a saved layout in `cms_layouts/<pageId>`:
//
//   { items: [ { kind:'section', sectionId:'hero', hidden:false, style:{…} },
//              { kind:'block',   block:{…builder block…} } ] }
//
// With no saved layout the page renders its default order, so nothing changes
// until someone edits it.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { useCachedNode } from "../cms";
import BlockView from "./BlockView";
import { buildPageCss } from "./styles";

/** Pages that expose a section layout, and the sections each one has. */
export const SECTION_PAGES = {
  home: {
    label: "Home Page",
    route: "/",
    sections: [
      { id: "hero", label: "Fullscreen Video Hero", hint: "Autoplaying hero video with the headline overlay." },
      { id: "catalog", label: "Curated Products Catalog", hint: "Live product carousel pulled from the frame catalogue." },
      { id: "showcase", label: "Exquisite Showcase", hint: "The lamp-lit framed showcase stage." },
      { id: "reviews", label: "Google Reviews", hint: "Customer review cards and rating summary." },
      { id: "heritage", label: "Vintage Heritage Note", hint: "The handwritten heritage strip." },
      { id: "services", label: "Our Services", hint: "Photo-left / content-right services band." },
      { id: "social", label: "Social Media Feed", hint: "Instagram reels feed and social links." },
    ],
  },
  catalog: {
    label: "Catalog",
    route: "/catalog",
    sections: [
      { id: "hero", label: "Catalog Hero", hint: "Lamp banner, heading and the studio light switch." },
      { id: "content", label: "Exhibition Grid", hint: "The filterable product grid and its controls." },
    ],
  },
  services: {
    label: "Services",
    route: "/services",
    sections: [
      { id: "hero", label: "Services Hero", hint: "Lamp banner and page heading." },
      { id: "content", label: "Service Cards", hint: "The list of service cards pulled from Services Content." },
    ],
  },
  contact: {
    label: "Contact",
    route: "/contact",
    sections: [
      { id: "hero", label: "Contact Hero", hint: "Lamp banner and page heading." },
      { id: "content", label: "Contact Form & Details", hint: "Enquiry form and studio contact details." },
    ],
  },
  track: {
    label: "Track Order",
    route: "/track-order",
    sections: [
      { id: "hero", label: "Track Hero", hint: "Lamp banner and page heading." },
      { id: "content", label: "Order Lookup", hint: "The order number lookup and status panel." },
    ],
  },
  privacy: {
    label: "Privacy Policy",
    route: "/privacy-policy",
    sections: [
      { id: "hero", label: "Policy Hero", hint: "Lamp banner and page heading." },
      { id: "content", label: "Policy Body", hint: "The policy card and its sections." },
    ],
  },
  refund: {
    label: "Refund Policy",
    route: "/refund-policy",
    sections: [
      { id: "hero", label: "Policy Hero", hint: "Lamp banner and page heading." },
      { id: "content", label: "Policy Body", hint: "The policy card and its sections." },
    ],
  },
  terms: {
    label: "Terms & Conditions",
    route: "/terms-and-conditions",
    sections: [
      { id: "hero", label: "Terms Hero", hint: "Lamp banner and page heading." },
      { id: "content", label: "Terms Body", hint: "The terms card and its sections." },
    ],
  },
};

export const getSectionPage = (pageId) => SECTION_PAGES[pageId] || null;
export const defaultOrder = (pageId) => (SECTION_PAGES[pageId]?.sections || []).map((s) => s.id);

/**
 * Subscribe to the saved layout for a page.
 * Cached like the rest of the CMS so a reload does not render the code's default
 * section order and then visibly reshuffle when the saved layout arrives.
 */
export function useSectionLayout(pageId) {
  const { data, loading } = useCachedNode(`cms_layouts/${pageId}`, `layout:${pageId}`);
  return { layout: data, loading };
}

/**
 * A coded page's layout is an ordinary builder block tree; its own bands appear
 * as `coded-section` blocks. This turns a stored layout into that tree, keeping
 * it honest against the sections the code actually ships: new sections are
 * appended, sections deleted from code fall away.
 */
export function resolveLayoutBlocks(pageId, layout) {
  const def = SECTION_PAGES[pageId];
  const known = def ? def.sections : [];
  const decorate = (id) => {
    const meta = known.find((s) => s.id === id) || {};
    return {
      id: `sec_${pageId}_${id}`,
      type: "coded-section",
      componentId: "coded-section",
      sectionId: id,
      sectionLabel: meta.label || id,
      sectionHint: meta.hint || "",
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      marginBottom: 0,
      boxWidth: "100%",
      displayMode: "block",
      positionMode: "relative",
    };
  };

  const fresh = () => known.map((s) => decorate(s.id));

  let stored = Array.isArray(layout?.blocks) ? layout.blocks : null;

  // Older saves used a flat {items:[{kind:'section'|'block'}]} shape.
  if (!stored && Array.isArray(layout?.items)) {
    stored = layout.items
      .map((item) => {
        if (!item) return null;
        if (item.kind === "block") return item.block || null;
        if (!known.some((s) => s.id === item.sectionId)) return null;
        const b = decorate(item.sectionId);
        if (item.hidden) b.hidden = true;
        if (item.style) {
          if (item.style.paddingTop !== undefined && item.style.paddingTop !== "") b.paddingTop = Number(item.style.paddingTop) || 0;
          if (item.style.paddingBottom !== undefined && item.style.paddingBottom !== "") b.paddingBottom = Number(item.style.paddingBottom) || 0;
          if (item.style.background) { b.bgType = "color"; b.bgColor = item.style.background; }
          if (item.style.maxWidth) b.maxWidth = item.style.maxWidth;
        }
        return b;
      })
      .filter(Boolean);
  }

  if (!stored) return fresh();

  // Keep only sections the code still has, then append any it gained.
  const seen = new Set();
  const walk = (list) =>
    list
      .map((b) => {
        if (!b) return null;
        if (b.type === "coded-section") {
          if (!known.some((s) => s.id === b.sectionId) || seen.has(b.sectionId)) return null;
          seen.add(b.sectionId);
          const meta = known.find((s) => s.id === b.sectionId) || {};
          return { ...b, sectionLabel: meta.label || b.sectionId, sectionHint: meta.hint || "" };
        }
        if (Array.isArray(b.children)) return { ...b, children: walk(b.children) };
        return b;
      })
      .filter(Boolean);

  const tree = walk(stored);
  known.forEach((s) => {
    if (!seen.has(s.id)) tree.push(decorate(s.id));
  });
  return tree;
}

export const LAYOUT_PREVIEW_MESSAGE = "pb-section-layout-preview";

/**
 * Render a coded page from its layout. `nodes` maps sectionId → the page's own
 * JSX, handed to BlockView through ctx so `coded-section` blocks mount the real
 * thing while every other block renders normally.
 */
export function SectionLayoutRenderer({ pageId, nodes, ctx = {} }) {
  const { layout } = useSectionLayout(pageId);
  const [draft, setDraft] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Inside the builder's canvas frame, take the unsaved layout over the saved one
  // and turn on the click-to-select chrome so the real page becomes the canvas.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!new URLSearchParams(window.location.search).has("pbpreview")) return;
    const onMessage = (e) => {
      const d = e.data;
      if (!d || d.pageId !== pageId) return;
      if (d.type === LAYOUT_PREVIEW_MESSAGE) {
        if (Array.isArray(d.blocks)) setDraft(d.blocks);
        if (typeof d.editMode === "boolean") setEditMode(d.editMode);
        if ("selectedId" in d) setSelectedId(d.selectedId);
      }
    };
    window.addEventListener("message", onMessage);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: `${LAYOUT_PREVIEW_MESSAGE}-ready`, pageId }, "*");
    }
    return () => window.removeEventListener("message", onMessage);
  }, [pageId]);

  const blocks = draft || resolveLayoutBlocks(pageId, layout);
  const css = buildPageCss(blocks);

  const post = (msg) => {
    if (window.parent && window.parent !== window) window.parent.postMessage({ ...msg, pageId }, "*");
  };

  const renderCtx = {
    ...ctx,
    sectionNodes: nodes,
    isEditor: false,
    ...(editMode
      ? {
          blockProps: (block) => ({
            className: `pb-ed ${selectedId === block.id ? "pb-ed-on" : ""}`,
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              post({ type: "pb-select", id: block.id });
            },
          }),
          blockOverlay: (block) =>
            selectedId === block.id ? (
              <div className="pb-ed-bar" onClick={(e) => e.stopPropagation()}>
                <span className="pb-ed-name">{block.sectionLabel || block.type}</span>
                <button type="button" title="Move up" onClick={() => post({ type: "pb-action", action: "up", id: block.id })}>▲</button>
                <button type="button" title="Move down" onClick={() => post({ type: "pb-action", action: "down", id: block.id })}>▼</button>
                <button type="button" title="Duplicate" onClick={() => post({ type: "pb-action", action: "duplicate", id: block.id })}>⧉</button>
                <button type="button" title="Remove" onClick={() => post({ type: "pb-action", action: "delete", id: block.id })}>✕</button>
              </div>
            ) : null,
        }
      : {}),
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {editMode && <style dangerouslySetInnerHTML={{ __html: EDIT_CHROME_CSS }} />}
      {blocks.map((block, idx) => (
        <BlockView key={block.id || idx} block={block} device="desktop" ctx={renderCtx} index={idx} />
      ))}
    </>
  );
}

// Chrome injected into the previewed page while it is acting as the canvas.
const EDIT_CHROME_CSS = `
  .pb-ed { position: relative; cursor: pointer; }
  .pb-ed::after {
    content: ''; position: absolute; inset: 0; z-index: 40;
    outline: 1px dashed rgba(181,139,92,.45); outline-offset: -1px;
    background: transparent; transition: background .15s ease; pointer-events: none;
  }
  .pb-ed:hover::after { background: rgba(181,139,92,.09); outline-color: rgba(181,139,92,.9); }
  .pb-ed-on::after { outline: 2px solid #B58B5C; background: rgba(181,139,92,.06); }
  .pb-ed-bar {
    position: absolute; top: 8px; right: 8px; z-index: 60;
    display: flex; align-items: center; gap: 2px;
    background: #B58B5C; color: #0C0A08;
    border-radius: 9px; padding: 5px 9px;
    font-family: var(--font-serif); font-size: 11px; font-weight: 700;
    box-shadow: 0 6px 20px rgba(0,0,0,.5); white-space: nowrap;
  }
  .pb-ed-name { padding-right: 8px; max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
  .pb-ed-bar button {
    background: none; border: none; cursor: pointer; color: #0C0A08;
    font-size: 12px; padding: 2px 6px; border-radius: 5px; font-family: inherit;
  }
  .pb-ed-bar button:hover { background: rgba(0,0,0,.18); }
  /* Keep links and players from firing while arranging the page */
  .pb-ed a, .pb-ed button:not(.pb-ed-bar button) { pointer-events: none; }
  /* Popups and drawers would sit over the canvas — they are not part of the layout */
  .promo-overlay, .cart-drawer, .cart-drawer-overlay, .newsletter-popup { display: none !important; }
`;
