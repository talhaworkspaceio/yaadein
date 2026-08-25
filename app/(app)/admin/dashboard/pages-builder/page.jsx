"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ref, onValue, set, remove } from "firebase/database";
import { db } from "../../../../../lib/firebase";

import {
  COMPONENTS,
  CATEGORIES,
  BREAKPOINTS,
  FONT_FAMILIES,
  GRADIENT_PRESETS,
  createBlock,
  getComponent,
  isContainerBlock,
  newBlockId,
} from "../../../../../lib/pageBuilder/schema";
import {
  buildPageCss,
  updateBlockById,
  findBlockById,
  findParentOf,
  removeBlockById,
  insertBlock,
  moveBlock,
  duplicateBlockTree,
  flattenBlocks,
  containsBlock,
} from "../../../../../lib/pageBuilder/styles";
import BlockView from "../../../../../lib/pageBuilder/BlockView";
import Inspector from "../../../../../lib/pageBuilder/Inspector";

export const DEFAULT_PAGE_SETTINGS = {
  showHero: true,
  showLamp: true,
  showLightSwitch: true,
  heading: "",
  subtitle: "Custom page layout built inside Yaadein Elementor Studio.",
  headingFontFamily: "var(--font-display)",
  headingColor: "#FFFFFF",
  headingFontSize: "52",
  headingAlign: "center",
  backdropType: "none",
  backdropColor: "#050403",
  backdropGradient: GRADIENT_PRESETS[0].val,
  backdropImage: "",
  backdropParallax: true,
  backdropOverlay: "rgba(5, 4, 3, 0.55)",
  backdropBlur: "0",
  showBlobs: true,
  contentMaxWidth: "1200px",
};

// Starter layouts — each is a nested tree, so they double as worked examples.
const STARTER_LAYOUTS = [
  { id: "blank", label: "Blank canvas", desc: "Start from nothing." },
  { id: "hero-features", label: "Hero + 3 features", desc: "Headline, sub-copy, buttons, then a 3-column icon row." },
  { id: "split", label: "Split image / text", desc: "A 50/50 row that stacks on mobile." },
  { id: "pricing", label: "Pricing trio", desc: "Three pricing cards in a responsive grid." },
];

function buildStarter(id) {
  const mk = (componentId, patch = {}, children = null) => {
    const b = createBlock(componentId);
    Object.assign(b, patch);
    if (children) b.children = children;
    return b;
  };

  if (id === "hero-features") {
    return [
      mk("section", { paddingTop: 70, paddingBottom: 50, alignItems: "center", gap: 18 }, [
        mk("heading", { text: "Framing that outlives the memory", fontSize: 46, mobile: { fontSize: 30 } }),
        mk("paragraph", { text: "Hand-built in our Lahore studio using archival materials and century-tested joinery.", textAlign: "center", maxWidth: "620px", fontSize: 17 }),
        mk("button-group", {}),
      ]),
      mk("columns-3", { paddingTop: 20, paddingBottom: 60 }, [
        mk("icon-box", { icon: "shield", title: "Museum Materials", text: "Acid-free mats and 99% UV conservation glass." }),
        mk("icon-box", { icon: "scissors", title: "Hand-Cut Mouldings", text: "Solid teak, walnut and mahogany, cured against warping." }),
        mk("icon-box", { icon: "truck", title: "Insured Delivery", text: "Crated and shipped nationwide with full cover." }),
      ]),
    ];
  }
  if (id === "split") {
    return [
      mk("columns-2", { paddingTop: 50, paddingBottom: 50, alignItems: "center", gap: 40 }, [
        mk("image", { url: "/images/bespoke_framing.png", imageRatio: "4/3" }),
        mk("section", { layoutMode: "stack", gap: 16, paddingTop: 0, paddingBottom: 0 }, [
          mk("badge", { text: "BESPOKE" }),
          mk("heading", { text: "Built around your piece, not the other way round", fontSize: 34, textAlign: "left" }),
          mk("paragraph", { text: "We measure, mount and finish every commission by hand." }),
          mk("button", { text: "Start a commission", boxAlign: "left" }),
        ]),
      ]),
    ];
  }
  if (id === "pricing") {
    return [
      mk("section", { paddingTop: 60, paddingBottom: 20, alignItems: "center" }, [
        mk("heading", { text: "Studio Pricing", fontSize: 40 }),
        mk("paragraph", { text: "Transparent pricing, no hidden framing costs.", textAlign: "center" }),
      ]),
      mk("columns-3", { paddingBottom: 70, alignItems: "stretch" }, [
        mk("pricing", { title: "Essential", price: "2,500", ribbonBadge: "", features: ["Solid pine moulding", "Standard glass", "3-5 day turnaround"] }),
        mk("pricing", { title: "Archival", price: "4,500", features: ["99% UV museum glass", "Acid-free double mount", "Insured delivery"] }),
        mk("pricing", { title: "Heirloom", price: "8,000", ribbonBadge: "", features: ["Hand-gilded moulding", "Conservation mounting", "Studio consultation"] }),
      ]),
    ];
  }
  return [];
}

// ---------------------------------------------------------------------------

export default function PageBuilder() {
  // ---- page data
  const [pagesList, setPagesList] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [pageBlocks, setPageBlocks] = useState([]);
  const [pageSettings, setPageSettings] = useState({ ...DEFAULT_PAGE_SETTINGS });

  // ---- editor state
  const [viewMode, setViewMode] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const [device, setDevice] = useState("desktop");
  const [leftTab, setLeftTab] = useState("widgets");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewLightOn, setPreviewLightOn] = useState(true);
  const [dropTarget, setDropTarget] = useState(null); // { id, mode }
  const [collapsedLayers, setCollapsedLayers] = useState({});
  const [previewMode, setPreviewMode] = useState(false);
  const [openCategories, setOpenCategories] = useState({});
  const [previewFaqs, setPreviewFaqs] = useState({});

  // ---- modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newPagePreset, setNewPagePreset] = useState("hero-features");
  const [pageToDelete, setPageToDelete] = useState(null);
  const [pagesSearch, setPagesSearch] = useState("");

  // ---- history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const skipHistoryRef = useRef(false);
  const hydratedSlugRef = useRef(null);
  const dragPayloadRef = useRef(null);

  const flash = (text, ms = 2500) => {
    setMessage(text);
    setTimeout(() => setMessage(""), ms);
  };

  // ------------------------------------------------------------------ loading
  useEffect(() => {
    const pagesRef = ref(db, "cms_pages");
    const unsub = onValue(pagesRef, (snapshot) => {
      const val = snapshot.val();
      const list = val ? Object.values(val) : [];
      setPagesList(list);
      const active = list.find((p) => p.slug === selectedSlug);
      if (active && hydratedSlugRef.current !== selectedSlug) {
        hydratedSlugRef.current = selectedSlug;
        setPageTitle(active.title || "");
        setPageBlocks(Array.isArray(active.blocks) ? active.blocks : []);
        setPageSettings({ ...DEFAULT_PAGE_SETTINGS, ...(active.settings || {}) });
      }
    });
    return () => unsub();
  }, [selectedSlug]);

  const loadPage = (slug) => {
    const found = pagesList.find((p) => p.slug === slug);
    hydratedSlugRef.current = slug;
    setPageTitle(found?.title || "");
    setPageBlocks(Array.isArray(found?.blocks) ? found.blocks : []);
    setPageSettings({ ...DEFAULT_PAGE_SETTINGS, ...(found?.settings || {}) });
    setHistory([]);
    setHistoryIndex(-1);
    setSelectedId(null);
  };

  const openEditor = (slug) => {
    setSelectedSlug(slug);
    loadPage(slug);
    setViewMode("editor");
  };

  // ------------------------------------------------------------------ history
  useEffect(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      return;
    }
    const snapshot = JSON.stringify({ blocks: pageBlocks, settings: pageSettings, title: pageTitle });
    const timer = setTimeout(() => {
      if (history[historyIndex] === snapshot) return;
      const next = [...history.slice(0, historyIndex + 1), snapshot].slice(-80);
      setHistory(next);
      setHistoryIndex(next.length - 1);
    }, 260);
    return () => clearTimeout(timer);
  }, [pageBlocks, pageSettings, pageTitle, history, historyIndex]);

  const applySnapshot = (idx) => {
    const snap = history[idx];
    if (!snap) return;
    let parsed;
    try {
      parsed = JSON.parse(snap);
    } catch {
      return;
    }
    skipHistoryRef.current = true;
    setPageBlocks(parsed.blocks || []);
    setPageSettings({ ...DEFAULT_PAGE_SETTINGS, ...(parsed.settings || {}) });
    setPageTitle(parsed.title || "");
    setHistoryIndex(idx);
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex >= 0 && historyIndex < history.length - 1;
  const undo = () => canUndo && applySnapshot(historyIndex - 1);
  const redo = () => canRedo && applySnapshot(historyIndex + 1);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || e.target?.isContentEditable) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y")) {
        e.preventDefault();
        redo();
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        deleteBlock(selectedId);
      } else if (mod && e.key.toLowerCase() === "d" && selectedId) {
        e.preventDefault();
        duplicateBlock(selectedId);
      } else if (e.key === "Escape") {
        if (previewMode) setPreviewMode(false);
        else setSelectedId(null);
      } else if (!mod && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPreviewMode((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history, historyIndex, selectedId, pageBlocks, previewMode]);

  // ------------------------------------------------------------- block ops
  const selectedBlock = selectedId ? findBlockById(pageBlocks, selectedId) : null;
  const selectedParent = selectedId ? findParentOf(pageBlocks, selectedId) : null;

  const siblingsOf = (id) => {
    const parent = findParentOf(pageBlocks, id);
    return parent ? parent.children || [] : pageBlocks;
  };

  const updateField = (key, value, dev = "desktop") => {
    if (!selectedId) return;
    setPageBlocks((prev) =>
      updateBlockById(prev, selectedId, (b) => {
        if (dev === "desktop") return { ...b, [key]: value };
        const layer = { ...(b[dev] || {}) };
        if (value === "" || value === undefined) delete layer[key];
        else layer[key] = value;
        return { ...b, [dev]: layer };
      })
    );
  };

  const clearDeviceOverride = (key, dev) => {
    if (!selectedId || dev === "desktop") return;
    setPageBlocks((prev) =>
      updateBlockById(prev, selectedId, (b) => {
        const layer = { ...(b[dev] || {}) };
        delete layer[key];
        return { ...b, [dev]: layer };
      })
    );
  };

  const resetBlockSize = () => {
    if (!selectedId) return;
    setPageBlocks((prev) =>
      updateBlockById(prev, selectedId, (b) => ({
        ...b,
        boxWidth: "100%",
        boxHeight: "auto",
        maxWidth: "",
        minWidth: "",
        minHeight: "",
        maxHeight: "",
        positionMode: "relative",
        posX: 0,
        posY: 0,
        rotate: "",
        scale: "",
        translateX: "",
        translateY: "",
      }))
    );
    flash("↺ Size and position reset.");
  };

  const addBlock = (componentId, parentId = null, index = null) => {
    const block = createBlock(componentId);
    if (!block) return;
    // Clicking a widget drops it inside the selected container, else at page end.
    let targetParent = parentId;
    if (targetParent === null && selectedBlock) {
      targetParent = isContainerBlock(selectedBlock) ? selectedBlock.id : selectedParent?.id || null;
    }
    setPageBlocks((prev) => insertBlock(prev, block, targetParent, index));
    setSelectedId(block.id);
    flash(`✨ Added ${getComponent(block.type)?.name || componentId}`);
  };

  const deleteBlock = (id) => {
    setPageBlocks((prev) => removeBlockById(prev, id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateBlock = (id) => {
    const block = findBlockById(pageBlocks, id);
    if (!block) return;
    const clone = duplicateBlockTree(block, newBlockId);
    const parent = findParentOf(pageBlocks, id);
    const sibs = parent ? parent.children || [] : pageBlocks;
    const idx = sibs.findIndex((b) => b.id === id);
    setPageBlocks((prev) => insertBlock(prev, clone, parent?.id || null, idx + 1));
    setSelectedId(clone.id);
  };

  const nudgeBlock = (id, delta) => {
    const parent = findParentOf(pageBlocks, id);
    const sibs = parent ? parent.children || [] : pageBlocks;
    const idx = sibs.findIndex((b) => b.id === id);
    const target = idx + delta;
    if (target < 0 || target >= sibs.length) return;
    setPageBlocks((prev) => moveBlock(prev, id, parent?.id || null, target));
  };

  // ------------------------------------------------------------- drag & drop
  const onPaletteDragStart = (componentId) => (e) => {
    dragPayloadRef.current = { kind: "new", componentId };
    e.dataTransfer.effectAllowed = "copy";
    try {
      e.dataTransfer.setData("text/plain", componentId);
    } catch {}
  };

  const onBlockDragStart = (block) => (e) => {
    e.stopPropagation();
    dragPayloadRef.current = { kind: "move", id: block.id };
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", block.id);
    } catch {}
  };

  const onBlockDragOver = (block) => (e) => {
    const payload = dragPayloadRef.current;
    if (!payload) return;
    e.preventDefault();
    e.stopPropagation();
    const container = isContainerBlock(block);
    // Inside a container unless the pointer is near its top/bottom edge.
    let mode = "after";
    if (container) {
      const rect = e.currentTarget.getBoundingClientRect();
      const edge = Math.min(28, rect.height * 0.18);
      if (e.clientY > rect.top + edge && e.clientY < rect.bottom - edge) mode = "inside";
      else mode = e.clientY <= rect.top + edge ? "before" : "after";
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      mode = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
    }
    setDropTarget({ id: block.id, mode });
  };

  const performDrop = (targetId, mode) => {
    const payload = dragPayloadRef.current;
    dragPayloadRef.current = null;
    setDropTarget(null);
    if (!payload) return;

    let parentId = null;
    let index = null;

    if (targetId === "__root__") {
      parentId = null;
      index = null;
    } else if (mode === "inside") {
      parentId = targetId;
      index = null;
    } else {
      const parent = findParentOf(pageBlocks, targetId);
      parentId = parent?.id || null;
      const sibs = parent ? parent.children || [] : pageBlocks;
      const idx = sibs.findIndex((b) => b.id === targetId);
      index = mode === "before" ? idx : idx + 1;
    }

    if (payload.kind === "new") {
      const block = createBlock(payload.componentId);
      if (!block) return;
      setPageBlocks((prev) => insertBlock(prev, block, parentId, index));
      setSelectedId(block.id);
      flash(`✨ Dropped ${getComponent(block.type)?.name || payload.componentId}`);
    } else if (payload.kind === "move") {
      if (parentId && containsBlock(pageBlocks, payload.id, parentId)) {
        flash("A block can't be dropped inside itself.");
        return;
      }
      setPageBlocks((prev) => moveBlock(prev, payload.id, parentId, index));
      setSelectedId(payload.id);
    }
  };

  const onBlockDrop = (block) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    performDrop(block.id, dropTarget?.id === block.id ? dropTarget.mode : "after");
  };

  // ------------------------------------------------------------------- save
  const savePage = async () => {
    if (!selectedSlug) return;
    setSaving(true);
    try {
      await set(ref(db, `cms_pages/${selectedSlug}`), {
        title: pageTitle,
        slug: selectedSlug,
        blocks: pageBlocks,
        settings: pageSettings,
        updatedAt: new Date().toISOString(),
      });
      flash("✅ Page published to Firebase.", 3500);
    } catch (err) {
      console.error(err);
      flash("❌ Failed to save page.", 4000);
    } finally {
      setSaving(false);
    }
  };

  const createPage = async (e) => {
    e.preventDefault();
    if (!newPageTitle.trim()) return;
    const slug = (newPageSlug.trim() || newPageTitle.trim()).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    if (!slug) return;
    const blocks = buildStarter(newPagePreset);
    const settings = { ...DEFAULT_PAGE_SETTINGS, heading: newPageTitle.trim() };
    try {
      await set(ref(db, `cms_pages/${slug}`), { title: newPageTitle.trim(), slug, blocks, settings, createdAt: new Date().toISOString() });
      hydratedSlugRef.current = slug;
      setSelectedSlug(slug);
      setPageTitle(newPageTitle.trim());
      setPageBlocks(blocks);
      setPageSettings(settings);
      setHistory([]);
      setHistoryIndex(-1);
      setSelectedId(null);
      setShowCreateModal(false);
      setNewPageTitle("");
      setNewPageSlug("");
      setViewMode("editor");
      flash(`New page /${slug} created.`);
    } catch (err) {
      console.error(err);
      flash("Failed to create page.");
    }
  };

  const deletePage = async () => {
    if (!pageToDelete) return;
    try {
      setPagesList((prev) => prev.filter((p) => p.slug !== pageToDelete.slug));
      await remove(ref(db, `cms_pages/${pageToDelete.slug}`));
      flash(`Deleted /${pageToDelete.slug}`);
    } catch (err) {
      console.error(err);
    } finally {
      setPageToDelete(null);
    }
  };

  const duplicatePage = async (page, e) => {
    e.stopPropagation();
    const slug = `${page.slug}-copy-${Date.now().toString().slice(-4)}`;
    try {
      await set(ref(db, `cms_pages/${slug}`), { ...page, title: `${page.title} (Copy)`, slug, createdAt: new Date().toISOString() });
      flash(`Duplicated to /${slug}`);
    } catch (err) {
      console.error(err);
    }
  };

  // ------------------------------------------------------------------ canvas
  const canvasCss = useMemo(() => buildPageCss(pageBlocks, { device, scope: ".pb-canvas" }), [pageBlocks, device]);
  const previewCss = useMemo(() => buildPageCss(pageBlocks, { device, scope: ".pb-preview-frame" }), [pageBlocks, device]);
  const deviceMeta = BREAKPOINTS.find((b) => b.id === device) || BREAKPOINTS[0];

  // Preview runs the blocks exactly as a visitor sees them — no selection chrome,
  // interactive widgets live.
  const previewCtx = {
    isEditor: false,
    lightOn: previewLightOn,
    setLightOn: setPreviewLightOn,
    faqState: previewFaqs,
    toggleFaq: (key) => setPreviewFaqs((p) => ({ ...p, [key]: !p[key] })),
  };

  const editorCtx = {
    isEditor: true,
    lightOn: previewLightOn,
    setLightOn: setPreviewLightOn,
    faqState: {},
    toggleFaq: () => {},
    blockProps: (block) => {
      const isSel = block.id === selectedId;
      const isDrop = dropTarget?.id === block.id;
      return {
        className: [
          "pb-editable",
          isSel ? "pb-selected" : "",
          isDrop ? `pb-drop-${dropTarget.mode}` : "",
        ]
          .filter(Boolean)
          .join(" "),
        draggable: true,
        onDragStart: onBlockDragStart(block),
        onDragEnd: () => {
          dragPayloadRef.current = null;
          setDropTarget(null);
        },
        onDragOver: onBlockDragOver(block),
        onDrop: onBlockDrop(block),
        onClick: (e) => {
          e.stopPropagation();
          setSelectedId(block.id);
        },
      };
    },
    blockOverlay: (block) =>
      block.id === selectedId ? (
        <div className="pb-toolbar" contentEditable={false}>
          <span className="pb-toolbar-name">{getComponent(block.type)?.name || block.type}</span>
          <button type="button" title="Select parent" onClick={(e) => { e.stopPropagation(); const p = findParentOf(pageBlocks, block.id); setSelectedId(p ? p.id : null); }}>⤴</button>
          <button type="button" title="Move up" onClick={(e) => { e.stopPropagation(); nudgeBlock(block.id, -1); }}>▲</button>
          <button type="button" title="Move down" onClick={(e) => { e.stopPropagation(); nudgeBlock(block.id, 1); }}>▼</button>
          <button type="button" title="Duplicate (⌘D)" onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}>⧉</button>
          <button type="button" title="Delete (Del)" onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}>✕</button>
        </div>
      ) : null,
  };

  const filteredComponents = COMPONENTS.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPages = pagesList.filter(
    (p) => (p.title || "").toLowerCase().includes(pagesSearch.toLowerCase()) || (p.slug || "").toLowerCase().includes(pagesSearch.toLowerCase())
  );

  // ======================================================== PAGES LIST VIEW
  if (viewMode === "list") {
    return (
      <div style={{ minHeight: "100vh", background: "#0F0D0B", color: "#F5F0E8", padding: 32, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, margin: 0 }}>Pages &amp; CMS Builder</h1>
            <p style={{ color: "#A8A08C", fontSize: 14, margin: "6px 0 0" }}>
              Build any layout from nestable sections. Every block has desktop, tablet and mobile settings.
            </p>
          </div>
          <button onClick={() => setShowCreateModal(true)} style={primaryBtn}>+ Create New Page</button>
        </div>

        {message && <div style={noticeStyle}>{message}</div>}

        <input type="text" placeholder="Search pages by title or slug..." value={pagesSearch} onChange={(e) => setPagesSearch(e.target.value)} style={{ ...fieldStyle, maxWidth: 420, marginBottom: 22 }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
          {filteredPages.map((page) => (
            <div key={page.slug} style={{ background: "#16120E", border: "1px solid rgba(201,168,76,.2)", borderRadius: 12, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: 17 }}>{page.title}</h3>
                <span style={{ fontSize: 10, background: "rgba(201,168,76,.15)", color: "#C9A84C", padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>
                  {flattenBlocks(page.blocks || []).length} blocks
                </span>
              </div>
              <code style={{ display: "block", fontSize: 12, color: "#8b8474", margin: "8px 0 16px" }}>/{page.slug}</code>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openEditor(page.slug)} style={{ ...primaryBtn, flex: 1, padding: "8px 12px", fontSize: 12 }}>Edit in Builder</button>
                <a href={`/${page.slug}`} target="_blank" rel="noreferrer" style={{ ...ghostBtn, textDecoration: "none", fontSize: 12 }}>View</a>
                <button onClick={(e) => duplicatePage(page, e)} title="Duplicate" style={{ ...ghostBtn, fontSize: 12 }}>⧉</button>
                <button onClick={(e) => { e.stopPropagation(); setPageToDelete(page); }} title="Delete" style={{ ...ghostBtn, color: "#FF6B8B", borderColor: "rgba(255,62,108,.4)", fontSize: 12 }}>✕</button>
              </div>
            </div>
          ))}
          {filteredPages.length === 0 && <p style={{ color: "#8b8474", fontSize: 14 }}>No pages yet — create one to get started.</p>}
        </div>

        {showCreateModal && <CreateModal />}
        {pageToDelete && (
          <div style={modalOverlay}>
            <div style={modalCard}>
              <h3 style={{ marginTop: 0 }}>Delete “{pageToDelete.title}”?</h3>
              <p style={{ color: "#A8A08C", fontSize: 13 }}>The route /{pageToDelete.slug} will stop working. This cannot be undone.</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                <button onClick={() => setPageToDelete(null)} style={ghostBtn}>Cancel</button>
                <button onClick={deletePage} style={{ ...primaryBtn, background: "#FF3E6C", color: "#fff" }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function CreateModal() {
    return (
      <div style={modalOverlay}>
        <div style={{ ...modalCard, maxWidth: 560 }}>
          <h3 style={{ marginTop: 0 }}>Create New Page</h3>
          <form onSubmit={createPage} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Page Title *</label>
              <input required value={newPageTitle} onChange={(e) => { setNewPageTitle(e.target.value); setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); }} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>URL Slug</label>
              <input value={newPageSlug} onChange={(e) => setNewPageSlug(e.target.value)} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Starting Layout</label>
              <div style={{ display: "grid", gap: 8 }}>
                {STARTER_LAYOUTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setNewPagePreset(s.id)}
                    style={{
                      textAlign: "left",
                      background: newPagePreset === s.id ? "rgba(201,168,76,.18)" : "#14100B",
                      border: `1px solid ${newPagePreset === s.id ? "#C9A84C" : "rgba(255,255,255,.1)"}`,
                      borderRadius: 8,
                      padding: 10,
                      cursor: "pointer",
                      color: "#fff",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: "#A8A08C", marginTop: 2 }}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowCreateModal(false)} style={ghostBtn}>Cancel</button>
              <button type="submit" style={primaryBtn}>Create Page</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================ EDITOR VIEW
  const inPreview = previewMode;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#08070A", color: "#F5F0E8", display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif", zIndex: 500 }}>
      <style dangerouslySetInnerHTML={{ __html: EDITOR_CSS }} />

      {/* ============================================================ TOOLBAR */}
      <header className="pb-topbar">
        {/* left cluster — where am I */}
        <div className="pb-topbar-group">
          <button onClick={() => setViewMode("list")} className="pb-btn pb-btn-quiet" title="Back to all pages">
            <span style={{ fontSize: 14 }}>←</span> Pages
          </button>

          <div className="pb-page-chip">
            <span className="pb-page-chip-label">Editing</span>
            <select
              value={selectedSlug}
              onChange={(e) => { setSelectedSlug(e.target.value); loadPage(e.target.value); }}
              className="pb-page-select"
            >
              {pagesList.map((p) => (
                <option key={p.slug} value={p.slug} style={{ background: "#15121C" }}>{p.title}</option>
              ))}
            </select>
            <code className="pb-page-slug">/{selectedSlug}</code>
          </div>
        </div>

        {/* center cluster — device */}
        <div className="pb-device-switch" role="group" aria-label="Preview size">
          {BREAKPOINTS.map((bp) => (
            <button
              key={bp.id}
              onClick={() => setDevice(bp.id)}
              className={`pb-device-btn ${device === bp.id ? "is-active" : ""}`}
              title={bp.maxWidth ? `${bp.label} — styles apply at ${bp.maxWidth}px and below` : `${bp.label} — the base styles`}
            >
              <span style={{ fontSize: 13 }}>{bp.icon}</span>
              <span>{bp.label}</span>
            </button>
          ))}
        </div>

        {/* right cluster — actions */}
        <div className="pb-topbar-group" style={{ marginLeft: "auto" }}>
          <div className="pb-seg">
            <button onClick={undo} disabled={!canUndo} title="Undo (⌘Z)" className="pb-seg-btn">↶</button>
            <button onClick={redo} disabled={!canRedo} title="Redo (⌘⇧Z)" className="pb-seg-btn">↷</button>
          </div>

          <button onClick={() => setPreviewMode(true)} className="pb-btn pb-btn-quiet" title="Full-page preview (P)">
            <span style={{ fontSize: 13 }}>▶</span> Preview
          </button>

          <a href={`/${selectedSlug}`} target="_blank" rel="noreferrer" className="pb-btn pb-btn-quiet" style={{ textDecoration: "none" }}>
            ↗ Live
          </a>

          <button onClick={savePage} disabled={saving} className="pb-btn pb-btn-primary">
            {saving ? "Publishing…" : "Save & Publish"}
          </button>
        </div>
      </header>

      {message && <div className="pb-flash">{message}</div>}

      {/* ========================================================== WORKSPACE */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0, position: "relative" }}>
        {/* ------------------------------------------------------- LEFT RAIL */}
        <div className="pb-rail">
          {[
            ["widgets", "❖", "Widgets"],
            ["layers", "≡", "Layers"],
            ["page", "🎛", "Page"],
          ].map(([id, icon, lbl]) => (
            <button
              key={id}
              onClick={() => {
                if (id === "page") { setSelectedId(null); setRightOpen(true); setLeftTab("layers"); }
                else setLeftTab(id);
                setLeftOpen(true);
              }}
              className={`pb-rail-btn ${leftTab === id && id !== "page" ? "is-active" : ""}`}
              title={lbl}
            >
              <span style={{ fontSize: 17 }}>{icon}</span>
              <span style={{ fontSize: 9.5 }}>{lbl}</span>
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={() => setLeftOpen((v) => !v)} className="pb-rail-btn" title={leftOpen ? "Collapse panel" : "Expand panel"}>
            <span style={{ fontSize: 15 }}>{leftOpen ? "◀" : "▶"}</span>
          </button>
        </div>

        {/* ------------------------------------------------------ LEFT PANEL */}
        {leftOpen && (
          <aside className="pb-panel" style={{ width: 344, minWidth: 344 }}>
            {leftTab === "widgets" ? (
              <>
                <div className="pb-panel-head">
                  <h2 className="pb-panel-title">Widgets</h2>
                  <p className="pb-panel-sub">Drag onto the canvas, or click to drop into the selected section.</p>
                  <input
                    type="text"
                    placeholder="Search widgets…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pb-search"
                  />
                </div>

                <div className="pb-panel-body">
                  {CATEGORIES.map((cat) => {
                    const items = filteredComponents.filter((c) => c.category === cat);
                    if (!items.length) return null;
                    const isOpen = openCategories[cat] !== false;
                    return (
                      <div key={cat} style={{ marginBottom: 10 }}>
                        <button
                          onClick={() => setOpenCategories((p) => ({ ...p, [cat]: isOpen ? false : true }))}
                          className="pb-cat-head"
                        >
                          <span style={{ color: "#8b8474", fontSize: 10, transform: isOpen ? "none" : "rotate(-90deg)", transition: "transform .18s ease", display: "inline-block" }}>▾</span>
                          <span style={{ flex: 1, textAlign: "left" }}>{cat}</span>
                          <span className="pb-cat-count">{items.length}</span>
                        </button>

                        {isOpen && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                            {items.map((c) => (
                              <div
                                key={c.id}
                                draggable
                                onDragStart={onPaletteDragStart(c.id)}
                                onDragEnd={() => { dragPayloadRef.current = null; setDropTarget(null); }}
                                onClick={() => addBlock(c.id)}
                                className="pb-widget"
                                title={c.description || `Add ${c.name}`}
                              >
                                <span className="pb-widget-icon">{c.icon}</span>
                                <span style={{ minWidth: 0, flex: 1 }}>
                                  <span className="pb-widget-name">{c.name}</span>
                                  {c.description && <span className="pb-widget-desc">{c.description}</span>}
                                </span>
                                <span className="pb-widget-grab">⠿</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredComponents.length === 0 && (
                    <p style={{ fontSize: 12.5, color: "#77715f", padding: "20px 4px", lineHeight: 1.6 }}>
                      Nothing matches “{searchQuery}”.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="pb-panel-head">
                  <h2 className="pb-panel-title">Layers</h2>
                  <p className="pb-panel-sub">The structure of this page. Click to select, ◐ marks responsive overrides.</p>
                </div>
                <div className="pb-panel-body">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="pb-layer-row"
                    style={{ background: selectedId === null ? "rgba(201,168,76,.18)" : "transparent", borderColor: selectedId === null ? "#C9A84C" : "transparent", width: "100%", marginBottom: 6 }}
                  >
                    <span style={{ fontSize: 13 }}>🎛</span>
                    <span style={{ flex: 1, textAlign: "left", fontWeight: 700 }}>Page settings</span>
                  </button>
                  <LayerTree
                    blocks={pageBlocks}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    collapsed={collapsedLayers}
                    toggleCollapse={(id) => setCollapsedLayers((p) => ({ ...p, [id]: !p[id] }))}
                  />
                  {pageBlocks.length === 0 && <p style={{ fontSize: 12.5, color: "#77715f", padding: "16px 4px", lineHeight: 1.6 }}>No blocks yet — add one from the Widgets tab.</p>}
                </div>
              </>
            )}
          </aside>
        )}

        {/* ---------------------------------------------------------- CANVAS */}
        <main
          className="pb-stage"
          onClick={() => setSelectedId(null)}
          onDragOver={(e) => { if (dragPayloadRef.current) { e.preventDefault(); setDropTarget({ id: "__root__", mode: "inside" }); } }}
          onDrop={(e) => { e.preventDefault(); performDrop("__root__", "inside"); }}
        >
          <div className="pb-stage-bar">
            <span className="pb-stage-meta">
              {deviceMeta.icon} {deviceMeta.label}
              <span style={{ opacity: .55 }}> · {deviceMeta.maxWidth ? `≤ ${deviceMeta.maxWidth}px` : "base styles"}</span>
            </span>
            <span className="pb-stage-meta" style={{ opacity: .7 }}>
              {flattenBlocks(pageBlocks).length} blocks
            </span>
          </div>

          <div className="pb-stage-scroll">
            <div className="pb-device-frame" style={{ width: deviceMeta.canvasWidth }}>
              <div className="pb-browser-chrome">
                <span className="pb-dot" style={{ background: "#FF5F57" }} />
                <span className="pb-dot" style={{ background: "#FEBC2E" }} />
                <span className="pb-dot" style={{ background: "#28C840" }} />
                <span className="pb-url">yaadein.pk/{selectedSlug}</span>
              </div>

              <div
                className="pb-canvas"
                style={{
                  width: "100%",
                  background: pageSettings.backdropType === "gradient" ? pageSettings.backdropGradient : pageSettings.backdropType === "color" ? pageSettings.backdropColor : "#080605",
                  backgroundImage: pageSettings.backdropType === "image" && pageSettings.backdropImage ? `url(${pageSettings.backdropImage})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <style dangerouslySetInnerHTML={{ __html: canvasCss }} />

                {pageSettings.showHero !== false && (
                  <div style={{ padding: device === "mobile" ? "40px 18px 30px" : "60px 24px 44px", textAlign: pageSettings.headingAlign || "center", background: "linear-gradient(to bottom, #14110E 0%, rgba(8,6,5,0) 100%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                    {pageSettings.showLamp !== false && (
                      <BlockView block={{ id: "__hero_lamp__", type: "studio-lamp", lampWidth: device === "mobile" ? 220 : 380, rodHeight: 50, beamWidth: 500, beamHeight: 340, glowIntensity: 0.38, followsPageLight: true }} device={device} ctx={{ lightOn: previewLightOn }} />
                    )}
                    <h1 style={{ margin: 0, fontFamily: pageSettings.headingFontFamily, fontSize: Math.round((parseInt(pageSettings.headingFontSize || 52, 10) || 52) * (device === "mobile" ? 0.6 : 0.86)), color: pageSettings.headingColor, lineHeight: 1.15 }}>
                      {pageSettings.heading || pageTitle}
                    </h1>
                    {pageSettings.subtitle && <p style={{ margin: 0, fontSize: 14, color: "#A8A08C", maxWidth: 560, lineHeight: 1.6 }}>{pageSettings.subtitle}</p>}
                    {pageSettings.showLightSwitch !== false && (
                      <BlockView block={{ id: "__hero_switch__", type: "light-switch", label: "Studio Light" }} device={device} ctx={{ lightOn: previewLightOn, setLightOn: setPreviewLightOn }} />
                    )}
                  </div>
                )}

                <div style={{ position: "relative", minHeight: 320, paddingBottom: 80 }}>
                  {pageBlocks.map((block, i) => (
                    <BlockView key={block.id} block={block} device={device} ctx={editorCtx} index={i} />
                  ))}
                  {pageBlocks.length === 0 && (
                    <div className="pb-empty">
                      <span style={{ fontSize: 34 }}>▭</span>
                      <h3>Start with a Section</h3>
                      <p>Sections are the containers everything else lives in. Drop one on the canvas, then fill it with headings, images and buttons.</p>
                      <button onClick={(e) => { e.stopPropagation(); addBlock("section"); }} className="pb-btn pb-btn-primary" style={{ marginTop: 6 }}>
                        + Add a Section
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ------------------------------------------------------ RIGHT PANEL */}
        {rightOpen && (
          <aside className="pb-panel" style={{ width: 396, minWidth: 396, borderLeft: "1px solid rgba(255,255,255,.07)", borderRight: "none" }}>
            <div className="pb-panel-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <h2 className="pb-panel-title">{selectedBlock ? "Block settings" : "Page settings"}</h2>
                <p className="pb-panel-sub" style={{ marginBottom: 0 }}>
                  {selectedBlock ? "Everything about the selected block." : "Applies to the whole page."}
                </p>
              </div>
              <button onClick={() => setRightOpen(false)} className="pb-icon-btn" title="Hide inspector">✕</button>
            </div>

            <div className="pb-panel-body">
              {selectedBlock ? (
                <Inspector
                  block={selectedBlock}
                  device={device}
                  onChange={updateField}
                  onClearDevice={clearDeviceOverride}
                  onResetSize={resetBlockSize}
                  onDuplicate={() => duplicateBlock(selectedBlock.id)}
                  onDelete={() => deleteBlock(selectedBlock.id)}
                  breadcrumb={
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center", fontSize: 11, color: "#8b8474" }}>
                      <button onClick={() => setSelectedId(null)} style={crumbBtn}>Page</button>
                      {selectedParent && (
                        <>
                          <span>›</span>
                          <button onClick={() => setSelectedId(selectedParent.id)} style={crumbBtn}>{getComponent(selectedParent.type)?.name || selectedParent.type}</button>
                        </>
                      )}
                      <span>›</span>
                      <span style={{ color: "#C9A84C", fontWeight: 700 }}>{getComponent(selectedBlock.type)?.name || selectedBlock.type}</span>
                    </div>
                  }
                />
              ) : (
                <PageSettingsPanel settings={pageSettings} setSettings={setPageSettings} pageTitle={pageTitle} setPageTitle={setPageTitle} />
              )}
            </div>
          </aside>
        )}

        {!rightOpen && (
          <button onClick={() => setRightOpen(true)} className="pb-reopen" title="Show inspector">⚙</button>
        )}
      </div>

      {/* ==================================================== FULL-PAGE PREVIEW */}
      {inPreview && (
        <div className="pb-preview-overlay">
          <div className="pb-preview-bar">
            <span style={{ fontSize: 12, color: "#A8A08C" }}>
              Previewing <strong style={{ color: "#F5F0E8" }}>{pageTitle}</strong>
            </span>
            <div className="pb-device-switch" style={{ margin: "0 auto" }}>
              {BREAKPOINTS.map((bp) => (
                <button key={bp.id} onClick={() => setDevice(bp.id)} className={`pb-device-btn ${device === bp.id ? "is-active" : ""}`}>
                  <span style={{ fontSize: 13 }}>{bp.icon}</span>
                  <span>{bp.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setPreviewMode(false)} className="pb-btn pb-btn-primary">✕ Exit preview</button>
          </div>

          <div className="pb-preview-scroll">
            <div
              className="pb-preview-frame"
              style={{
                width: deviceMeta.canvasWidth,
                background: pageSettings.backdropType === "gradient" ? pageSettings.backdropGradient : pageSettings.backdropType === "color" ? pageSettings.backdropColor : "#050403",
                backgroundImage: pageSettings.backdropType === "image" && pageSettings.backdropImage ? `url(${pageSettings.backdropImage})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderRadius: device === "desktop" ? 0 : 26,
              }}
            >
              <style dangerouslySetInnerHTML={{ __html: previewCss }} />
              {pageSettings.showHero !== false && (
                <div style={{ padding: device === "mobile" ? "56px 20px 40px" : "90px 30px 60px", textAlign: pageSettings.headingAlign || "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
                  {pageSettings.showLamp !== false && (
                    <BlockView block={{ id: "__pv_lamp__", type: "studio-lamp", lampWidth: device === "mobile" ? 260 : 440, rodHeight: 60, beamWidth: 650, beamHeight: 460, glowIntensity: 0.38, followsPageLight: true }} device={device} ctx={{ lightOn: previewLightOn }} />
                  )}
                  <h1 style={{ margin: 0, fontFamily: pageSettings.headingFontFamily, fontSize: device === "mobile" ? Math.round((parseInt(pageSettings.headingFontSize || 52, 10) || 52) * 0.62) : parseInt(pageSettings.headingFontSize || 52, 10), color: pageSettings.headingColor, lineHeight: 1.15 }}>
                    {pageSettings.heading || pageTitle}
                  </h1>
                  {pageSettings.subtitle && <p style={{ margin: 0, fontSize: 16, color: "#A8A08C", maxWidth: 620, lineHeight: 1.7 }}>{pageSettings.subtitle}</p>}
                  {pageSettings.showLightSwitch !== false && (
                    <BlockView block={{ id: "__pv_switch__", type: "light-switch", label: "Studio Light" }} device={device} ctx={{ lightOn: previewLightOn, setLightOn: setPreviewLightOn }} />
                  )}
                </div>
              )}
              <div className="pb-preview-main" style={{ maxWidth: pageSettings.contentMaxWidth || "1200px" }}>
                {pageBlocks.map((block, i) => (
                  <BlockView key={block.id} block={block} device={device} ctx={previewCtx} index={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layers tree
// ---------------------------------------------------------------------------

function LayerTree({ blocks, selectedId, onSelect, collapsed, toggleCollapse, depth = 0 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {(blocks || []).map((block) => {
        const comp = getComponent(block.type);
        const kids = block.children || [];
        const isOpen = !collapsed[block.id];
        return (
          <div key={block.id}>
            <div
              onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 7px",
                paddingLeft: 7 + depth * 12,
                borderRadius: 5,
                cursor: "pointer",
                background: selectedId === block.id ? "rgba(201,168,76,.22)" : "transparent",
                border: `1px solid ${selectedId === block.id ? "#C9A84C" : "transparent"}`,
                fontSize: 11,
              }}
            >
              {kids.length > 0 ? (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleCollapse(block.id); }}
                  style={{ background: "none", border: "none", color: "#8b8474", cursor: "pointer", padding: 0, fontSize: 9, width: 10 }}
                >
                  {isOpen ? "▾" : "▸"}
                </button>
              ) : (
                <span style={{ width: 10 }} />
              )}
              <span style={{ fontSize: 12 }}>{comp?.icon || "▪"}</span>
              <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: selectedId === block.id ? "#fff" : "#cfc7b6" }}>
                {comp?.name || block.type}
              </span>
              {(block.mobile || block.tablet) && <span title="Has responsive overrides" style={{ fontSize: 8, color: "#C9A84C" }}>◐</span>}
            </div>
            {kids.length > 0 && isOpen && (
              <LayerTree blocks={kids} selectedId={selectedId} onSelect={onSelect} collapsed={collapsed} toggleCollapse={toggleCollapse} depth={depth + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page settings panel
// ---------------------------------------------------------------------------

function PageSettingsPanel({ settings, setSettings, pageTitle, setPageTitle }) {
  const upd = (k, v) => setSettings((prev) => ({ ...prev, [k]: v }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 11, color: "#8b8474", margin: 0, lineHeight: 1.5 }}>
        Applies to the whole page. Click any block on the canvas to edit that block instead.
      </p>

      <div style={panelBox}>
        <div style={panelTitle}>✍️ Page Heading</div>
        <label style={labelStyle}>Heading Text</label>
        <input value={settings.heading || ""} placeholder={pageTitle} onChange={(e) => upd("heading", e.target.value)} style={fieldStyle} />
        <label style={labelStyle}>Sub-heading</label>
        <textarea rows={2} value={settings.subtitle || ""} onChange={(e) => upd("subtitle", e.target.value)} style={fieldStyle} />
        <label style={labelStyle}>Page Name (dashboard + tab)</label>
        <input value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} style={fieldStyle} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label style={labelStyle}>Size (px)</label>
            <input type="number" value={settings.headingFontSize || "52"} onChange={(e) => upd("headingFontSize", e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Align</label>
            <select value={settings.headingAlign || "center"} onChange={(e) => upd("headingAlign", e.target.value)} style={fieldStyle}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
        <label style={labelStyle}>Heading Font</label>
        <select value={settings.headingFontFamily || "var(--font-display)"} onChange={(e) => upd("headingFontFamily", e.target.value)} style={fieldStyle}>
          {FONT_FAMILIES.map((f) => <option key={f.val} value={f.val}>{f.name}</option>)}
        </select>
        <label style={labelStyle}>Heading Colour</label>
        <div style={{ display: "flex", gap: 6 }}>
          <input type="color" value={settings.headingColor || "#FFFFFF"} onChange={(e) => upd("headingColor", e.target.value)} style={{ width: 34, height: 30, border: "1px solid rgba(201,168,76,.22)", borderRadius: 5, background: "none", padding: 2, cursor: "pointer" }} />
          <input value={settings.headingColor || ""} onChange={(e) => upd("headingColor", e.target.value)} style={{ ...fieldStyle, flex: 1 }} />
        </div>
      </div>

      <div style={panelBox}>
        <div style={panelTitle}>💡 Studio Chrome</div>
        {[["showHero", "Show hero banner"], ["showLamp", "Show suspended brass lamp"], ["showLightSwitch", "Show Studio Light button"], ["showBlobs", "Show ambient glow blobs"]].map(([k, lbl]) => (
          <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, cursor: "pointer" }}>
            <input type="checkbox" checked={settings[k] !== false} onChange={(e) => upd(k, e.target.checked)} />
            {lbl}
          </label>
        ))}
      </div>

      <div style={panelBox}>
        <div style={panelTitle}>📐 Content Width</div>
        <label style={labelStyle}>Max width of the block area</label>
        <select value={settings.contentMaxWidth || "1200px"} onChange={(e) => upd("contentMaxWidth", e.target.value)} style={fieldStyle}>
          <option value="100%">Full bleed (100%)</option>
          <option value="1400px">Extra wide (1400px)</option>
          <option value="1200px">Standard (1200px)</option>
          <option value="1000px">Narrow (1000px)</option>
          <option value="760px">Article (760px)</option>
        </select>
      </div>

      <div style={panelBox}>
        <div style={panelTitle}>🌌 Backdrop</div>
        <label style={labelStyle}>Type</label>
        <select value={settings.backdropType || "none"} onChange={(e) => upd("backdropType", e.target.value)} style={fieldStyle}>
          <option value="none">None (studio black)</option>
          <option value="color">Solid colour</option>
          <option value="gradient">Gradient</option>
          <option value="image">Image</option>
        </select>

        {(settings.backdropType === "color" || settings.backdropType === "image") && (
          <>
            <label style={labelStyle}>{settings.backdropType === "image" ? "Base colour" : "Fill colour"}</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input type="color" value={settings.backdropColor || "#050403"} onChange={(e) => upd("backdropColor", e.target.value)} style={{ width: 34, height: 30, border: "1px solid rgba(201,168,76,.22)", borderRadius: 5, background: "none", padding: 2, cursor: "pointer" }} />
              <input value={settings.backdropColor || ""} onChange={(e) => upd("backdropColor", e.target.value)} style={{ ...fieldStyle, flex: 1 }} />
            </div>
          </>
        )}

        {settings.backdropType === "gradient" && (
          <>
            <label style={labelStyle}>Preset</label>
            <select value={settings.backdropGradient || ""} onChange={(e) => upd("backdropGradient", e.target.value)} style={fieldStyle}>
              {GRADIENT_PRESETS.map((g) => <option key={g.val} value={g.val}>{g.name}</option>)}
            </select>
            <label style={labelStyle}>Custom CSS gradient</label>
            <textarea rows={2} value={settings.backdropGradient || ""} onChange={(e) => upd("backdropGradient", e.target.value)} style={{ ...fieldStyle, fontFamily: "monospace", fontSize: 10 }} />
          </>
        )}

        {settings.backdropType === "image" && (
          <>
            <label style={labelStyle}>Upload image</label>
            <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const r = new FileReader(); r.onload = (ev) => upd("backdropImage", ev.target.result); r.readAsDataURL(file); }} style={{ ...fieldStyle, fontSize: 10 }} />
            <label style={labelStyle}>Or image URL</label>
            <input value={(settings.backdropImage || "").startsWith("data:") ? "" : settings.backdropImage || ""} onChange={(e) => upd("backdropImage", e.target.value)} style={fieldStyle} />
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, cursor: "pointer", marginTop: 6 }}>
              <input type="checkbox" checked={settings.backdropParallax !== false} onChange={(e) => upd("backdropParallax", e.target.checked)} />
              Parallax scroll
            </label>
          </>
        )}

        {settings.backdropType !== "none" && (
          <>
            <label style={labelStyle}>Overlay tint</label>
            <input value={settings.backdropOverlay || ""} placeholder="rgba(5,4,3,0.55)" onChange={(e) => upd("backdropOverlay", e.target.value)} style={fieldStyle} />
            <label style={labelStyle}>Backdrop blur ({settings.backdropBlur || 0}px)</label>
            <input type="range" min="0" max="24" value={settings.backdropBlur || "0"} onChange={(e) => upd("backdropBlur", e.target.value)} style={{ width: "100%" }} />
          </>
        )}
      </div>

      <p style={{ fontSize: 10, color: "#6f6a5d", textAlign: "center", margin: 0, lineHeight: 1.6 }}>
        ⌘Z undo · ⌘⇧Z redo · ⌘D duplicate · Del removes · Esc deselects
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared inline styles
// ---------------------------------------------------------------------------

const fieldStyle = {
  width: "100%",
  background: "#14100B",
  border: "1px solid rgba(201,168,76,.22)",
  color: "#fff",
  padding: "7px 9px",
  borderRadius: 6,
  fontSize: 12,
  boxSizing: "border-box",
  fontFamily: "inherit",
  marginBottom: 2,
};

const labelStyle = { display: "block", fontSize: 11, color: "#A8A08C", margin: "8px 0 4px" };

const primaryBtn = {
  background: "linear-gradient(135deg, #C9A84C 0%, #E8D48B 50%, #C9A84C 100%)",
  color: "#000",
  border: "none",
  padding: "9px 20px",
  borderRadius: 20,
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
};

const ghostBtn = {
  background: "rgba(255,255,255,.05)",
  border: "1px solid rgba(255,255,255,.15)",
  color: "#fff",
  padding: "7px 14px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const crumbBtn = { background: "none", border: "none", color: "#8b8474", fontSize: 10, cursor: "pointer", padding: 0, textDecoration: "underline" };

const panelBox = { background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.16)", borderRadius: 8, padding: 10 };
const panelTitle = { fontSize: 11, color: "#C9A84C", fontWeight: 800, marginBottom: 6 };

const noticeStyle = { background: "rgba(201,168,76,.15)", border: "1px solid #C9A84C", color: "#C9A84C", padding: "8px 18px", borderRadius: 8, marginBottom: 18, fontSize: 13, fontWeight: 600 };

const modalOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
const modalCard = { background: "#16120E", border: "1px solid rgba(201,168,76,.3)", borderRadius: 14, padding: 26, maxWidth: 460, width: "100%", color: "#F5F0E8" };

const EDITOR_CSS = `
/* ---------------------------------------------------------------- toolbar */
.pb-topbar {
  display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
  padding: 14px 20px;
  background: #100E14;
  border-bottom: 1px solid rgba(255,255,255,.07);
}
.pb-topbar-group { display: flex; align-items: center; gap: 10px; }

.pb-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 18px; border-radius: 11px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  font-family: inherit; border: 1px solid transparent;
  transition: all .18s ease; white-space: nowrap;
}
.pb-btn-quiet { background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.11); color: #E8E3D8; }
.pb-btn-quiet:hover { background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.2); }
.pb-btn-primary {
  background: linear-gradient(135deg, #C9A84C 0%, #E8D48B 50%, #C9A84C 100%);
  color: #17130A; font-weight: 800; box-shadow: 0 4px 16px rgba(201,168,76,.3);
}
.pb-btn-primary:hover { filter: brightness(1.08); }
.pb-btn-primary:disabled { opacity: .55; cursor: default; }

.pb-page-chip {
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
  padding: 7px 14px; border-radius: 12px;
}
.pb-page-chip-label { font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: #77715f; font-weight: 700; }
.pb-page-select {
  background: transparent; border: none; color: #F5F0E8;
  font-size: 14px; font-weight: 700; cursor: pointer; outline: none;
  font-family: inherit; max-width: 220px;
}
.pb-page-slug { font-size: 11px; color: #77715f; font-family: monospace; }

.pb-device-switch {
  display: flex; gap: 4px; padding: 4px;
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
  border-radius: 13px;
}
.pb-device-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 18px; border-radius: 10px; border: none;
  background: transparent; color: #A8A08C;
  font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit;
  transition: all .18s ease; white-space: nowrap;
}
.pb-device-btn:hover { color: #F5F0E8; background: rgba(255,255,255,.05); }
.pb-device-btn.is-active { background: #C9A84C; color: #17130A; font-weight: 800; }

.pb-seg { display: flex; gap: 2px; padding: 3px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 11px; }
.pb-seg-btn {
  background: none; border: none; color: #E8E3D8; cursor: pointer;
  padding: 7px 13px; border-radius: 8px; font-size: 15px; line-height: 1; transition: background .15s ease;
}
.pb-seg-btn:hover:not(:disabled) { background: rgba(255,255,255,.09); }
.pb-seg-btn:disabled { color: rgba(255,255,255,.2); cursor: default; }

.pb-flash {
  padding: 11px 20px; text-align: center; font-size: 13px; font-weight: 600;
  background: rgba(201,168,76,.14); color: #E8D48B;
  border-bottom: 1px solid rgba(201,168,76,.3);
}

/* ------------------------------------------------------------ left rail */
.pb-rail {
  width: 74px; min-width: 74px; background: #0C0A10;
  border-right: 1px solid rgba(255,255,255,.07);
  display: flex; flex-direction: column; align-items: center;
  padding: 14px 0; gap: 6px;
}
.pb-rail-btn {
  width: 56px; padding: 11px 0; border-radius: 12px;
  background: transparent; border: 1px solid transparent; color: #8b8474;
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  cursor: pointer; font-family: inherit; font-weight: 600; transition: all .18s ease;
}
.pb-rail-btn:hover { background: rgba(255,255,255,.05); color: #E8E3D8; }
.pb-rail-btn.is-active { background: rgba(201,168,76,.15); border-color: rgba(201,168,76,.4); color: #C9A84C; }

/* ---------------------------------------------------------------- panels */
.pb-panel {
  background: #0C0A10; border-right: 1px solid rgba(255,255,255,.07);
  display: flex; flex-direction: column; overflow: hidden;
}
.pb-panel-head { padding: 20px 20px 16px; border-bottom: 1px solid rgba(255,255,255,.06); }
.pb-panel-title { margin: 0; font-size: 16px; font-weight: 700; color: #F5F0E8; letter-spacing: -.01em; }
.pb-panel-sub { margin: 6px 0 14px; font-size: 12px; color: #77715f; line-height: 1.55; }
.pb-panel-body { flex: 1; overflow-y: auto; padding: 18px 20px 40px; }
.pb-panel-body::-webkit-scrollbar { width: 10px; }
.pb-panel-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,.09); border-radius: 6px; border: 3px solid #0C0A10; }

.pb-search {
  width: 100%; box-sizing: border-box;
  background: #151109; border: 1px solid rgba(201,168,76,.2); color: #fff;
  padding: 11px 14px; border-radius: 10px; font-size: 13px; font-family: inherit; outline: none;
}
.pb-search:focus { border-color: rgba(201,168,76,.55); }

.pb-cat-head {
  width: 100%; display: flex; align-items: center; gap: 9px;
  background: none; border: none; cursor: pointer; padding: 8px 2px;
  font-size: 11px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase;
  color: #C9A84C; font-family: inherit;
}
.pb-cat-count { font-size: 10px; color: #77715f; background: rgba(255,255,255,.06); padding: 2px 8px; border-radius: 9px; letter-spacing: 0; }

.pb-widget {
  display: flex; align-items: center; gap: 13px;
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px; padding: 12px 13px; cursor: grab; user-select: none;
  transition: all .16s ease;
}
.pb-widget:hover { background: rgba(201,168,76,.1); border-color: rgba(201,168,76,.4); transform: translateX(3px); }
.pb-widget:active { cursor: grabbing; }
.pb-widget-icon {
  width: 38px; height: 38px; flex-shrink: 0; border-radius: 10px;
  background: rgba(201,168,76,.13); border: 1px solid rgba(201,168,76,.22);
  display: flex; align-items: center; justify-content: center; font-size: 16px; color: #C9A84C;
}
.pb-widget-name { display: block; font-size: 13px; font-weight: 600; color: #EDE7DA; line-height: 1.3; }
.pb-widget-desc {
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  font-size: 11px; color: #77715f; margin-top: 3px; line-height: 1.45;
}
.pb-widget-grab { color: #4a463d; font-size: 13px; flex-shrink: 0; }

.pb-layer-row {
  display: flex; align-items: center; gap: 9px;
  padding: 9px 11px; border-radius: 9px; cursor: pointer;
  border: 1px solid transparent; font-size: 12.5px; color: #cfc7b6;
  background: transparent; font-family: inherit;
}
.pb-layer-row:hover { background: rgba(255,255,255,.05); }

.pb-icon-btn {
  width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
  color: #A8A08C; cursor: pointer; font-size: 13px;
}
.pb-icon-btn:hover { background: rgba(255,255,255,.1); color: #fff; }

.pb-reopen {
  position: absolute; right: 20px; top: 20px; z-index: 60;
  width: 46px; height: 46px; border-radius: 14px;
  background: #C9A84C; border: none; color: #17130A; font-size: 19px;
  cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,.5);
}

/* ---------------------------------------------------------------- canvas */
.pb-stage {
  flex: 1; min-width: 0; display: flex; flex-direction: column;
  background: #08070A;
  background-image: radial-gradient(rgba(255,255,255,.045) 1px, transparent 1px);
  background-size: 26px 26px;
}
.pb-stage-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 22px; border-bottom: 1px solid rgba(255,255,255,.06);
  background: rgba(12,10,16,.75);
}
.pb-stage-meta { font-size: 11.5px; color: #A8A08C; font-weight: 600; }
.pb-stage-scroll { flex: 1; overflow-y: auto; padding: 34px 28px 90px; }
.pb-stage-scroll::-webkit-scrollbar { width: 12px; }
.pb-stage-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 7px; border: 3px solid #08070A; }

.pb-device-frame {
  max-width: 100%; margin: 0 auto;
  border-radius: 16px; overflow: hidden;
  box-shadow: 0 30px 80px rgba(0,0,0,.75), 0 0 0 1px rgba(255,255,255,.07);
  transition: width .3s cubic-bezier(.22,.61,.36,1);
}
.pb-browser-chrome {
  display: flex; align-items: center; gap: 7px;
  padding: 11px 16px; background: #17151D; border-bottom: 1px solid rgba(255,255,255,.06);
}
.pb-dot { width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; }
.pb-url {
  margin-left: 12px; flex: 1; font-size: 11px; color: #6f6a5d; font-family: monospace;
  background: rgba(0,0,0,.35); padding: 5px 12px; border-radius: 7px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.pb-empty {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 90px 32px; text-align: center; color: #6f6a5d;
}
.pb-empty h3 { margin: 6px 0 0; color: #C9A84C; font-size: 19px; }
.pb-empty p { margin: 0; font-size: 13.5px; max-width: 400px; line-height: 1.65; }

/* ------------------------------------------------------- editing affordances */
.pb-canvas .pb-editable { cursor: pointer; }
.pb-canvas .pb-editable:hover { outline: 1px dashed rgba(201,168,76,.5); outline-offset: 2px; }
.pb-canvas .pb-selected { outline: 2px solid #C9A84C !important; outline-offset: 2px; }
.pb-canvas .pb-drop-inside { outline: 2px dashed #7CE0A0 !important; outline-offset: -4px; background-image: linear-gradient(rgba(124,224,160,.08), rgba(124,224,160,.08)); }
.pb-canvas .pb-drop-before { box-shadow: 0 -3px 0 0 #7CE0A0; }
.pb-canvas .pb-drop-after { box-shadow: 0 3px 0 0 #7CE0A0; }
.pb-toolbar {
  position: absolute; top: -30px; right: 0; z-index: 999;
  display: flex; align-items: center; gap: 2px;
  background: #C9A84C; color: #17130A;
  border-radius: 9px 9px 0 0; padding: 4px 9px;
  font-size: 11px; font-weight: 700; white-space: nowrap;
  font-family: 'DM Sans', sans-serif; box-shadow: 0 -3px 12px rgba(0,0,0,.35);
}
.pb-toolbar-name { padding-right: 8px; max-width: 170px; overflow: hidden; text-overflow: ellipsis; }
.pb-toolbar button { background: none; border: none; cursor: pointer; font-size: 12px; padding: 3px 6px; color: #17130A; border-radius: 5px; }
.pb-toolbar button:hover { background: rgba(0,0,0,.18); }
.pb-canvas .pb-rich a { color: #C9A84C; }

/* --------------------------------------------------------- full-page preview */
.pb-preview-overlay {
  position: fixed; inset: 0; z-index: 900;
  background: #050403; display: flex; flex-direction: column;
  animation: pb-preview-in .22s ease;
}
@keyframes pb-preview-in { from { opacity: 0; } to { opacity: 1; } }
.pb-preview-bar {
  display: flex; align-items: center; gap: 18px;
  padding: 12px 22px; background: #100E14;
  border-bottom: 1px solid rgba(255,255,255,.08); flex-wrap: wrap;
}
.pb-preview-scroll { flex: 1; overflow-y: auto; display: flex; justify-content: center; padding: 0; }
.pb-preview-frame {
  max-width: 100%; min-height: 100%;
  transition: width .3s cubic-bezier(.22,.61,.36,1);
  box-shadow: 0 0 60px rgba(0,0,0,.6);
  color: #E0D7CD;
}
.pb-preview-main { width: 100%; margin: 0 auto; padding: 40px 20px 90px; box-sizing: border-box; }
.pb-preview-scroll::-webkit-scrollbar { width: 12px; }
.pb-preview-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 7px; border: 3px solid #050403; }

@media (max-width: 1500px) {
  .pb-panel { width: 300px !important; min-width: 300px !important; }
}
`;
