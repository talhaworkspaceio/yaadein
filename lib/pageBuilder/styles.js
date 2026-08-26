// ---------------------------------------------------------------------------
// Page Builder style engine
//
// One place turns a block into CSS. The builder canvas and the published page
// both call it, so what you see in the editor is what ships.
//
//  - resolveValue()   : desktop value with tablet/mobile overrides layered on
//  - blockDeclarations(): the CSS declarations for one block at one breakpoint
//  - buildPageCss()   : the full stylesheet (base rules + media queries)
// ---------------------------------------------------------------------------

import { BREAKPOINTS, isContainerBlock } from "./schema";

export const DEVICE_ORDER = ["desktop", "tablet", "mobile"];

/** Desktop value, with the tablet then mobile override layered on top. */
export function resolveValue(block, key, device = "desktop") {
  if (!block) return undefined;
  if (device === "mobile") {
    if (block.mobile && block.mobile[key] !== undefined && block.mobile[key] !== "") return block.mobile[key];
    if (block.tablet && block.tablet[key] !== undefined && block.tablet[key] !== "") return block.tablet[key];
    return block[key];
  }
  if (device === "tablet") {
    if (block.tablet && block.tablet[key] !== undefined && block.tablet[key] !== "") return block.tablet[key];
    return block[key];
  }
  return block[key];
}

/** The raw value stored for one device only — used by the inspector. */
export function rawValue(block, key, device = "desktop") {
  if (!block) return undefined;
  if (device === "desktop") return block[key];
  return block[device] ? block[device][key] : undefined;
}

export const blockClassName = (block) => `pb-${block.id}`;

const px = (v) => (v === undefined || v === null || v === "" ? null : (typeof v === "number" || /^-?\d+(\.\d+)?$/.test(String(v)) ? `${v}px` : String(v)));
const raw = (v) => (v === undefined || v === null || v === "" ? null : String(v));

const push = (out, prop, value) => {
  if (value === null || value === undefined || value === "") return;
  out.push(`${prop}: ${value};`);
};

function backgroundDeclarations(block, dv, out) {
  const type = dv("bgType") || "none";
  if (type === "color") push(out, "background", raw(dv("bgColor")));
  else if (type === "gradient") push(out, "background", raw(dv("bgGradient")));
  else if (type === "image" && dv("bgImage")) {
    push(out, "background-color", raw(dv("bgColor")));
    push(out, "background-image", `url("${dv("bgImage")}")`);
    push(out, "background-size", raw(dv("bgSize")) || "cover");
    push(out, "background-position", raw(dv("bgPosition")) || "center");
    push(out, "background-repeat", raw(dv("bgRepeat")) || "no-repeat");
    push(out, "background-attachment", dv("bgParallax") ? "fixed" : "scroll");
  }
  const blur = parseFloat(dv("backdropBlur"));
  if (blur > 0) {
    push(out, "backdrop-filter", `blur(${blur}px)`);
    push(out, "-webkit-backdrop-filter", `blur(${blur}px)`);
  }
}

function transformDeclarations(block, dv, out) {
  const parts = [];
  const tx = dv("translateX");
  const ty = dv("translateY");
  const rot = dv("rotate");
  const sc = dv("scale");
  if (tx) parts.push(`translateX(${tx}px)`);
  if (ty) parts.push(`translateY(${ty}px)`);
  if (rot) parts.push(`rotate(${rot}deg)`);
  if (sc !== undefined && sc !== "" && parseFloat(sc) !== 1) parts.push(`scale(${sc})`);
  if (parts.length) push(out, "transform", parts.join(" "));

  const filters = [];
  const blur = parseFloat(dv("blur"));
  const bright = parseFloat(dv("brightness"));
  const sat = parseFloat(dv("saturate"));
  if (blur > 0) filters.push(`blur(${blur}px)`);
  if (!isNaN(bright) && bright !== 1) filters.push(`brightness(${bright})`);
  if (!isNaN(sat) && sat !== 1) filters.push(`saturate(${sat})`);
  if (filters.length) push(out, "filter", filters.join(" "));
}

/**
 * CSS declarations for a block at one breakpoint.
 * `onlyOverrides` emits just the keys stored for that device, so media queries
 * stay small and inherit everything else from the base rule.
 */
export function blockDeclarations(block, device = "desktop", onlyOverrides = false) {
  const out = [];
  const store = device === "desktop" ? block : block[device] || {};
  const has = (key) => (onlyOverrides ? store[key] !== undefined && store[key] !== "" : true);
  const dv = (key) => resolveValue(block, key, device);

  const isContainer = isContainerBlock(block);
  const layoutMode = dv("layoutMode") || "stack";
  const display = dv("displayMode") || "block";

  // ---- display / layout
  if (has("hidden") && dv("hidden")) {
    out.push("display: none !important;");
    return out.join(" ");
  }
  if (has("displayMode") || (onlyOverrides && (store.layoutMode || store.gridColumns))) {
    if (display === "none") push(out, "display", "none");
    else if (isContainer) push(out, "display", layoutMode === "grid" ? "grid" : "flex");
    else push(out, "display", display);
  }

  if (isContainer) {
    if (has("layoutMode") || has("gridColumns")) {
      if (layoutMode === "grid") {
        push(out, "grid-template-columns", raw(dv("gridColumns")) || "1fr");
      } else {
        push(out, "flex-direction", layoutMode === "row" ? "row" : "column");
      }
    }
    if (has("gap")) push(out, "gap", px(dv("gap")));
    if (has("rowGap")) push(out, "row-gap", px(dv("rowGap")));
    if (has("justifyContent")) push(out, "justify-content", raw(dv("justifyContent")));
    if (has("alignItems")) push(out, "align-items", raw(dv("alignItems")));
    if (has("flexWrap") && layoutMode !== "grid") push(out, "flex-wrap", dv("flexWrap") ? "wrap" : "nowrap");
  }

  // ---- box model
  if (has("boxWidth")) push(out, "width", raw(dv("boxWidth")));
  if (has("maxWidth")) push(out, "max-width", raw(dv("maxWidth")));
  if (has("minWidth")) push(out, "min-width", raw(dv("minWidth")));
  if (has("boxHeight")) push(out, "height", raw(dv("boxHeight")));
  if (has("minHeight")) push(out, "min-height", raw(dv("minHeight")));
  if (has("maxHeight")) push(out, "max-height", raw(dv("maxHeight")));
  if (has("alignSelf") && dv("alignSelf") && dv("alignSelf") !== "auto") push(out, "align-self", raw(dv("alignSelf")));
  if (has("gridSpan") && dv("gridSpan") > 1) push(out, "grid-column", `span ${dv("gridSpan")}`);
  if (has("flexGrow") && dv("flexGrow")) push(out, "flex-grow", raw(dv("flexGrow")));
  if (has("order") && dv("order")) push(out, "order", raw(dv("order")));
  if (has("zIndex")) push(out, "z-index", raw(dv("zIndex")));
  if (has("overflow")) push(out, "overflow", raw(dv("overflow")));

  // ---- position
  const pos = dv("positionMode");
  if (has("positionMode") && pos && pos !== "relative") push(out, "position", raw(pos));
  else if (has("positionMode")) push(out, "position", "relative");
  if (pos === "absolute") {
    if (has("posX")) push(out, "left", px(dv("posX")));
    if (has("posY")) push(out, "top", px(dv("posY")));
  } else if (pos === "sticky") {
    if (has("posY")) push(out, "top", px(dv("posY") || 0));
  }

  // ---- spacing
  ["Top", "Right", "Bottom", "Left"].forEach((side) => {
    const pKey = `padding${side}`;
    const mKey = `margin${side}`;
    if (has(pKey)) push(out, `padding-${side.toLowerCase()}`, px(dv(pKey)));
    if (has(mKey)) push(out, `margin-${side.toLowerCase()}`, px(dv(mKey)));
  });

  // Box alignment resolves to auto margins so it works in flow and flex alike.
  if (has("boxAlign")) {
    const align = dv("boxAlign");
    const width = dv("boxWidth");
    const isFull = !width || width === "100%";
    if (!isFull) {
      if (align === "center") {
        push(out, "margin-left", "auto");
        push(out, "margin-right", "auto");
      } else if (align === "right") {
        push(out, "margin-left", "auto");
      } else if (align === "left") {
        push(out, "margin-right", "auto");
      }
    }
  }

  // ---- typography
  if (has("fontFamily")) push(out, "font-family", raw(dv("fontFamily")));
  if (has("fontSize")) push(out, "font-size", px(dv("fontSize")));
  if (has("fontWeight")) push(out, "font-weight", raw(dv("fontWeight")));
  if (has("lineHeight")) push(out, "line-height", raw(dv("lineHeight")));
  if (has("letterSpacing")) push(out, "letter-spacing", px(dv("letterSpacing")));
  if (has("wordSpacing")) push(out, "word-spacing", px(dv("wordSpacing")));
  if (has("textAlign")) push(out, "text-align", raw(dv("textAlign")));
  if (has("textColor")) push(out, "color", raw(dv("textColor")));
  if (has("textTransform")) push(out, "text-transform", raw(dv("textTransform")));
  if (has("fontStyle")) push(out, "font-style", raw(dv("fontStyle")));
  if (has("textDecoration")) push(out, "text-decoration", raw(dv("textDecoration")));
  if (has("textShadow")) push(out, "text-shadow", raw(dv("textShadow")));

  // ---- background
  if (!onlyOverrides || store.bgType || store.bgColor || store.bgGradient || store.bgImage) {
    backgroundDeclarations(block, dv, out);
  }

  // ---- border + radius
  const bStyle = dv("borderStyle");
  if (has("borderStyle") && bStyle && bStyle !== "none") {
    push(out, "border-style", raw(bStyle));
    push(out, "border-color", raw(dv("borderColor")));
    push(out, "border-top-width", px(dv("borderTopWidth") ?? 1));
    push(out, "border-right-width", px(dv("borderRightWidth") ?? 1));
    push(out, "border-bottom-width", px(dv("borderBottomWidth") ?? 1));
    push(out, "border-left-width", px(dv("borderLeftWidth") ?? 1));
  } else if (has("borderStyle")) {
    push(out, "border", "none");
  }
  const radii = ["radiusTopLeft", "radiusTopRight", "radiusBottomRight", "radiusBottomLeft"];
  if (radii.some((k) => has(k) && dv(k) !== undefined && dv(k) !== "")) {
    push(out, "border-radius", radii.map((k) => `${parseInt(dv(k) || 0, 10)}px`).join(" "));
  }

  // ---- effects
  if (has("shadowPreset") || has("shadow")) {
    const shadow = dv("shadow") || dv("shadowPreset");
    if (shadow && shadow !== "none") push(out, "box-shadow", raw(shadow));
  }
  if (has("opacity") && dv("opacity") !== undefined && dv("opacity") !== "" && parseFloat(dv("opacity")) !== 1) {
    push(out, "opacity", raw(dv("opacity")));
  }
  transformDeclarations(block, dv, out);
  if (has("transition")) push(out, "transition", raw(dv("transition")));

  if (!onlyOverrides) push(out, "box-sizing", "border-box");

  return out.join(" ");
}

function hoverDeclarations(block) {
  const out = [];
  push(out, "background", raw(block.hoverBg));
  push(out, "color", raw(block.hoverColor));
  push(out, "border-color", raw(block.hoverBorderColor));
  if (block.hoverShadow) push(out, "box-shadow", raw(block.hoverShadow));
  if (block.hoverScale && parseFloat(block.hoverScale) !== 1) {
    const parts = [];
    if (block.translateX) parts.push(`translateX(${block.translateX}px)`);
    if (block.translateY) parts.push(`translateY(${block.translateY}px)`);
    if (block.rotate) parts.push(`rotate(${block.rotate}deg)`);
    parts.push(`scale(${block.hoverScale})`);
    push(out, "transform", parts.join(" "));
  }
  return out.join(" ");
}

/** Walk a nested block tree. */
export function walkBlocks(blocks, fn, depth = 0, parent = null) {
  (blocks || []).forEach((block, index) => {
    fn(block, { depth, parent, index });
    if (Array.isArray(block.children) && block.children.length) {
      walkBlocks(block.children, fn, depth + 1, block);
    }
  });
}

export function flattenBlocks(blocks) {
  const list = [];
  walkBlocks(blocks, (b, meta) => list.push({ block: b, ...meta }));
  return list;
}

const ANIMATION_KEYFRAMES = `
@keyframes pb-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes pb-slide-up { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
@keyframes pb-slide-down { from { opacity: 0; transform: translateY(-28px); } to { opacity: 1; transform: none; } }
@keyframes pb-slide-left { from { opacity: 0; transform: translateX(32px); } to { opacity: 1; transform: none; } }
@keyframes pb-slide-right { from { opacity: 0; transform: translateX(-32px); } to { opacity: 1; transform: none; } }
@keyframes pb-zoom-in { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .pb-block { animation: none !important; }
}
@keyframes pb-pulse { 0%,100% { opacity: .35; } 50% { opacity: .7; } }
.pb-live-card:hover { transform: translateY(-4px); border-color: rgba(201,168,76,.6) !important; box-shadow: 0 16px 40px rgba(0,0,0,.6); }
`;

/**
 * Build the stylesheet for a whole page.
 *
 * `device` renders a single breakpoint flat (used by the builder canvas, where
 * the frame is narrower than the viewport so real media queries would not fire).
 * Omit it to emit base rules plus tablet/mobile media queries for the live page.
 */
export function buildPageCss(blocks, { device = null, scope = "" } = {}) {
  const flat = flattenBlocks(blocks);
  const base = [];
  const tabletRules = [];
  const mobileRules = [];
  const extras = [];
  const prefix = scope ? `${scope} ` : "";

  flat.forEach(({ block }) => {
    const sel = `${prefix}.${blockClassName(block)}`;

    if (device) {
      const decls = blockDeclarations(block, device, false);
      if (decls) base.push(`${sel} { ${decls} }`);
    } else {
      const decls = blockDeclarations(block, "desktop", false);
      if (decls) base.push(`${sel} { ${decls} }`);
      const tDecls = block.tablet ? blockDeclarations(block, "tablet", true) : "";
      if (tDecls) tabletRules.push(`${sel} { ${tDecls} }`);
      const mDecls = block.mobile ? blockDeclarations(block, "mobile", true) : "";
      if (mDecls) mobileRules.push(`${sel} { ${mDecls} }`);
    }

    const hover = hoverDeclarations(block);
    if (hover) extras.push(`${sel}:hover { ${hover} }`);

    if (block.animation && block.animation !== "none") {
      extras.push(
        `${sel} { animation: pb-${block.animation} 0.7s cubic-bezier(.22,.61,.36,1) both; animation-delay: ${parseInt(block.animationDelay || 0, 10)}ms; }`
      );
    }

    if (block.customCss && block.customCss.trim()) {
      extras.push(block.customCss.split("selector").join(sel));
    }
  });

  const tabletBp = BREAKPOINTS.find((b) => b.id === "tablet");
  const mobileBp = BREAKPOINTS.find((b) => b.id === "mobile");

  let css = ANIMATION_KEYFRAMES + "\n" + base.join("\n") + "\n" + extras.join("\n");
  if (tabletRules.length) css += `\n@media (max-width: ${tabletBp.maxWidth}px) {\n${tabletRules.join("\n")}\n}`;
  if (mobileRules.length) css += `\n@media (max-width: ${mobileBp.maxWidth}px) {\n${mobileRules.join("\n")}\n}`;
  return css;
}

/** Immutably update one block anywhere in the tree. */
export function updateBlockById(blocks, id, updater) {
  return (blocks || []).map((block) => {
    if (block.id === id) return updater(block);
    if (Array.isArray(block.children) && block.children.length) {
      return { ...block, children: updateBlockById(block.children, id, updater) };
    }
    return block;
  });
}

export function findBlockById(blocks, id) {
  for (const block of blocks || []) {
    if (block.id === id) return block;
    if (Array.isArray(block.children)) {
      const found = findBlockById(block.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function findParentOf(blocks, id, parent = null) {
  for (const block of blocks || []) {
    if (block.id === id) return parent;
    if (Array.isArray(block.children)) {
      const found = findParentOf(block.children, id, block);
      if (found !== null || (block.children || []).some((c) => c.id === id)) return found || block;
    }
  }
  return null;
}

export function removeBlockById(blocks, id) {
  const next = [];
  for (const block of blocks || []) {
    if (block.id === id) continue;
    if (Array.isArray(block.children) && block.children.length) {
      next.push({ ...block, children: removeBlockById(block.children, id) });
    } else {
      next.push(block);
    }
  }
  return next;
}

/** Insert `newBlock` into `parentId` (null = page root) at `index` (null = end). */
export function insertBlock(blocks, newBlock, parentId = null, index = null) {
  if (!parentId) {
    const next = [...(blocks || [])];
    if (index === null || index > next.length) next.push(newBlock);
    else next.splice(index, 0, newBlock);
    return next;
  }
  return (blocks || []).map((block) => {
    if (block.id === parentId) {
      const children = [...(block.children || [])];
      if (index === null || index > children.length) children.push(newBlock);
      else children.splice(index, 0, newBlock);
      return { ...block, children };
    }
    if (Array.isArray(block.children) && block.children.length) {
      return { ...block, children: insertBlock(block.children, newBlock, parentId, index) };
    }
    return block;
  });
}

/** True when `ancestorId` is `blockId` or contains it — stops a drop into itself. */
export function containsBlock(blocks, ancestorId, blockId) {
  const ancestor = findBlockById(blocks, ancestorId);
  if (!ancestor) return false;
  if (ancestorId === blockId) return true;
  let found = false;
  walkBlocks(ancestor.children || [], (b) => {
    if (b.id === blockId) found = true;
  });
  return found;
}

export function moveBlock(blocks, blockId, targetParentId, index) {
  if (targetParentId && containsBlock(blocks, blockId, targetParentId)) return blocks;
  const moving = findBlockById(blocks, blockId);
  if (!moving) return blocks;
  const without = removeBlockById(blocks, blockId);
  return insertBlock(without, moving, targetParentId, index);
}

export function duplicateBlockTree(block, newId) {
  const clone = JSON.parse(JSON.stringify(block));
  const reId = (b) => {
    b.id = newId();
    if (Array.isArray(b.children)) b.children.forEach(reId);
  };
  reId(clone);
  return clone;
}
