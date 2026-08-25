// ---------------------------------------------------------------------------
// Page Builder schema
//
// Everything the builder knows about a component lives here: its default data
// and the list of editable fields. The inspector is generated from this, so a
// component gains a full editor the moment it is listed below.
//
// Storage model for responsiveness: desktop values live on the block itself,
// tablet/mobile overrides live under block.tablet / block.mobile. A field marked
// `responsive: true` can be overridden per device.
// ---------------------------------------------------------------------------

export const BREAKPOINTS = [
  { id: "desktop", label: "Desktop", icon: "🖥", maxWidth: null, canvasWidth: "100%" },
  { id: "tablet", label: "Tablet", icon: "▭", maxWidth: 1024, canvasWidth: "820px" },
  { id: "mobile", label: "Mobile", icon: "▯", maxWidth: 767, canvasWidth: "390px" },
];

export const FONT_FAMILIES = [
  { name: "Inherit from page", val: "inherit" },
  { name: "Studio Display", val: "var(--font-display)" },
  { name: "Studio Serif", val: "var(--font-serif)" },
  { name: "Typewriter", val: "var(--font-typewriter)" },
  { name: "Cinzel (Luxury Serif)", val: "'Cinzel', serif" },
  { name: "Playfair Display (Editorial)", val: "'Playfair Display', serif" },
  { name: "Inter (Modern Sans)", val: "'Inter', sans-serif" },
  { name: "Montserrat (Bold Clean)", val: "'Montserrat', sans-serif" },
  { name: "Lora (Classic Serif)", val: "'Lora', serif" },
  { name: "Outfit (Contemporary)", val: "'Outfit', sans-serif" },
  { name: "Monospace", val: "monospace" },
];

export const BORDER_STYLES = [
  { name: "None", val: "none" },
  { name: "Solid", val: "solid" },
  { name: "Dashed", val: "dashed" },
  { name: "Dotted", val: "dotted" },
  { name: "Double", val: "double" },
];

export const SHADOW_PRESETS = [
  { name: "None", val: "none" },
  { name: "Subtle Soft", val: "0 4px 12px rgba(0,0,0,0.4)" },
  { name: "Gold Ambient Glow", val: "0 0 20px rgba(201, 168, 76, 0.35)" },
  { name: "Deep Elevated", val: "0 12px 32px rgba(0,0,0,0.8)" },
  { name: "Floating Card", val: "0 20px 50px rgba(0,0,0,0.65)" },
  { name: "Inner Shadow", val: "inset 0 2px 8px rgba(0,0,0,0.6)" },
];

export const GRADIENT_PRESETS = [
  { name: "Studio Night", val: "linear-gradient(180deg, #14110E 0%, #050403 100%)" },
  { name: "Warm Brass Glow", val: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,168,76,0.25) 0%, #080605 70%)" },
  { name: "Deep Walnut", val: "linear-gradient(160deg, #241a10 0%, #0b0806 60%, #050403 100%)" },
  { name: "Gold Sheen", val: "linear-gradient(135deg, #C9A84C 0%, #E8D48B 50%, #C9A84C 100%)" },
  { name: "Charcoal Fade", val: "linear-gradient(180deg, #1a1a1a 0%, #050403 100%)" },
  { name: "Ember", val: "linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(20,12,6,0.9) 100%)" },
];

export const ANIMATIONS = [
  { name: "None", val: "none" },
  { name: "Fade In", val: "fade-in" },
  { name: "Slide Up", val: "slide-up" },
  { name: "Slide Down", val: "slide-down" },
  { name: "Slide Left", val: "slide-left" },
  { name: "Slide Right", val: "slide-right" },
  { name: "Zoom In", val: "zoom-in" },
];

// A small inline-SVG icon set so icon widgets need no external font.
export const ICON_LIBRARY = {
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  check: "M20 6L9 17l-5-5",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  truck: "M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 18.5a2 2 0 104 0 2 2 0 00-4 0zM14.5 18.5a2 2 0 104 0 2 2 0 00-4 0z",
  frame: "M3 3h18v18H3zM7 7h10v10H7z",
  camera: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z",
  gift: "M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z",
  mail: "M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6",
  pin: "M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z",
  sparkle: "M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z",
  award: "M12 15a7 7 0 100-14 7 7 0 000 14zM8.2 13.9L7 23l5-3 5 3-1.2-9.1",
  scissors: "M6 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM20 4L8.1 15.9M14.5 14.5L20 20",
  palette: "M12 22a10 10 0 110-20c5.5 0 10 3.6 10 8 0 3-2.5 4-4.5 4H15a2 2 0 00-1.5 3.3A2 2 0 0112 22zM7.5 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12.5 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  instagram: "M17 2H7a5 5 0 00-5 5v10a5 5 0 005 5h10a5 5 0 005-5V7a5 5 0 00-5-5zM12 16a4 4 0 110-8 4 4 0 010 8zM17.5 6.5h.01",
  facebook: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
  whatsapp: "M21 11.5a8.5 8.5 0 01-12.6 7.4L3 21l2.2-5.3A8.5 8.5 0 1121 11.5z",
  tiktok: "M21 8.5a6.5 6.5 0 01-5-2.4V16a6 6 0 11-6-6v3a3 3 0 103 3V2h3a6.5 6.5 0 005 6.5z",
  arrow: "M5 12h14M13 5l7 7-7 7",
  quote: "M7 7h4v6a4 4 0 01-4 4V7zM15 7h4v6a4 4 0 01-4 4V7z",
};

export const ICON_NAMES = Object.keys(ICON_LIBRARY);

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

const f = (key, label, type, extra = {}) => ({ key, label, type, ...extra });
const R = { responsive: true };

// ---------------------------------------------------------------------------
// Shared style fields — every block gets these tabs
// ---------------------------------------------------------------------------

export const LAYOUT_FIELDS = [
  f("displayMode", "Display", "select", {
    ...R,
    options: [
      { label: "Block (full row)", value: "block" },
      { label: "Inline block", value: "inline-block" },
      { label: "Flex", value: "flex" },
      { label: "Hidden", value: "none" },
    ],
  }),
  f("boxWidth", "Width", "size", { ...R, presets: ["100%", "75%", "66%", "50%", "33%", "25%", "auto", "fit-content"], placeholder: "100%" }),
  f("maxWidth", "Max Width", "size", { ...R, placeholder: "none" }),
  f("minWidth", "Min Width", "size", { ...R, placeholder: "none" }),
  f("boxHeight", "Height", "size", { ...R, presets: ["auto", "100%", "100vh", "50vh"], placeholder: "auto" }),
  f("minHeight", "Min Height", "size", { ...R, placeholder: "none" }),
  f("maxHeight", "Max Height", "size", { ...R, placeholder: "none" }),
  f("boxAlign", "Align Box", "buttons", {
    ...R,
    options: [
      { label: "Left", value: "left" },
      { label: "Center", value: "center" },
      { label: "Right", value: "right" },
    ],
  }),
  f("alignSelf", "Align Self (in parent)", "select", {
    ...R,
    options: [
      { label: "Auto", value: "auto" },
      { label: "Start", value: "flex-start" },
      { label: "Center", value: "center" },
      { label: "End", value: "flex-end" },
      { label: "Stretch", value: "stretch" },
    ],
  }),
  f("gridSpan", "Column Span (in grid parent)", "number", { ...R, min: 1, max: 12, placeholder: "1" }),
  f("flexGrow", "Flex Grow", "number", { ...R, min: 0, max: 12, placeholder: "0" }),
  f("order", "Order", "number", { ...R, min: -20, max: 20, placeholder: "0" }),
  f("positionMode", "Position", "select", {
    options: [
      { label: "Relative (normal flow)", value: "relative" },
      { label: "Absolute (free placement)", value: "absolute" },
      { label: "Sticky", value: "sticky" },
    ],
  }),
  f("posX", "Offset Left (px)", "number", { ...R, when: (b) => b.positionMode === "absolute" }),
  f("posY", "Offset Top (px)", "number", { ...R, when: (b) => b.positionMode === "absolute" || b.positionMode === "sticky" }),
  f("zIndex", "Z-Index", "number", { placeholder: "auto" }),
  f("overflow", "Overflow", "select", {
    options: [
      { label: "Visible", value: "visible" },
      { label: "Hidden", value: "hidden" },
      { label: "Auto scroll", value: "auto" },
    ],
  }),
  f("hidden", "Hide on this device", "toggle", { ...R, hint: "Switch device at the top of the canvas, then hide the block just for that size." }),
];

// Extra layout controls that only make sense on containers
export const CONTAINER_FIELDS = [
  f("layoutMode", "Child Layout", "select", {
    ...R,
    options: [
      { label: "Stack (vertical)", value: "stack" },
      { label: "Row (horizontal)", value: "row" },
      { label: "Grid (columns)", value: "grid" },
    ],
  }),
  f("gridColumns", "Grid Columns", "select", {
    ...R,
    when: (b, dv) => dv(b, "layoutMode") === "grid",
    options: [
      { label: "1 column", value: "1fr" },
      { label: "2 equal", value: "1fr 1fr" },
      { label: "3 equal", value: "1fr 1fr 1fr" },
      { label: "4 equal", value: "1fr 1fr 1fr 1fr" },
      { label: "2/1 (wide left)", value: "2fr 1fr" },
      { label: "1/2 (wide right)", value: "1fr 2fr" },
      { label: "3/1", value: "3fr 1fr" },
      { label: "1/3", value: "1fr 3fr" },
      { label: "1/2/1 (wide middle)", value: "1fr 2fr 1fr" },
      { label: "Auto-fit cards (min 260px)", value: "repeat(auto-fit, minmax(260px, 1fr))" },
      { label: "Auto-fit cards (min 180px)", value: "repeat(auto-fit, minmax(180px, 1fr))" },
    ],
  }),
  f("gap", "Gap (px)", "number", { ...R, min: 0, max: 160, placeholder: "24" }),
  f("rowGap", "Row Gap (px)", "number", { ...R, min: 0, max: 160, placeholder: "" }),
  f("justifyContent", "Horizontal Distribution", "select", {
    ...R,
    options: [
      { label: "Start", value: "flex-start" },
      { label: "Center", value: "center" },
      { label: "End", value: "flex-end" },
      { label: "Space between", value: "space-between" },
      { label: "Space around", value: "space-around" },
      { label: "Space evenly", value: "space-evenly" },
    ],
  }),
  f("alignItems", "Vertical Alignment", "select", {
    ...R,
    options: [
      { label: "Stretch", value: "stretch" },
      { label: "Top", value: "flex-start" },
      { label: "Middle", value: "center" },
      { label: "Bottom", value: "flex-end" },
    ],
  }),
  f("flexWrap", "Wrap children", "toggle", { ...R }),
  f("contentWidth", "Content Width", "size", { ...R, presets: ["100%", "1200px", "1000px", "820px", "640px"], hint: "Caps the inner content while the background stays full width." }),
];

export const SPACING_FIELDS = [
  f("padding", "Padding (px)", "box4", { ...R, keys: ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"] }),
  f("margin", "Margin (px)", "box4", { ...R, keys: ["marginTop", "marginRight", "marginBottom", "marginLeft"] }),
];

export const TYPOGRAPHY_FIELDS = [
  f("fontFamily", "Font Family", "select", { options: FONT_FAMILIES.map((x) => ({ label: x.name, value: x.val })) }),
  f("fontSize", "Font Size (px)", "number", { ...R, min: 8, max: 200 }),
  f("fontWeight", "Font Weight", "select", {
    options: ["300", "400", "500", "600", "700", "800", "900"].map((w) => ({ label: w, value: w })),
  }),
  f("lineHeight", "Line Height", "text", { ...R, placeholder: "1.6" }),
  f("letterSpacing", "Letter Spacing (px)", "number", { min: -5, max: 30, step: 0.5 }),
  f("wordSpacing", "Word Spacing (px)", "number", { min: -5, max: 40 }),
  f("textAlign", "Text Align", "buttons", {
    ...R,
    options: [
      { label: "Left", value: "left" },
      { label: "Center", value: "center" },
      { label: "Right", value: "right" },
      { label: "Justify", value: "justify" },
    ],
  }),
  f("textColor", "Text Colour", "color"),
  f("textTransform", "Text Transform", "select", {
    options: [
      { label: "None", value: "none" },
      { label: "UPPERCASE", value: "uppercase" },
      { label: "lowercase", value: "lowercase" },
      { label: "Capitalise", value: "capitalize" },
    ],
  }),
  f("fontStyle", "Font Style", "select", {
    options: [
      { label: "Normal", value: "normal" },
      { label: "Italic", value: "italic" },
    ],
  }),
  f("textDecoration", "Decoration", "select", {
    options: [
      { label: "None", value: "none" },
      { label: "Underline", value: "underline" },
      { label: "Line through", value: "line-through" },
    ],
  }),
  f("textShadow", "Text Shadow", "text", { placeholder: "0 2px 6px rgba(0,0,0,.6)" }),
];

export const BACKGROUND_FIELDS = [
  f("bgType", "Background", "select", {
    options: [
      { label: "None", value: "none" },
      { label: "Solid colour", value: "color" },
      { label: "Gradient", value: "gradient" },
      { label: "Image", value: "image" },
    ],
  }),
  f("bgColor", "Colour", "color", { when: (b, dv) => (b.bgType || "none") === "color" || (b.bgType || "none") === "image" }),
  f("bgGradientPreset", "Gradient Preset", "select", {
    when: (b) => b.bgType === "gradient",
    options: GRADIENT_PRESETS.map((g) => ({ label: g.name, value: g.val })),
  }),
  f("bgGradient", "Gradient CSS", "textarea", { when: (b) => b.bgType === "gradient", mono: true }),
  f("bgImage", "Image", "image", { when: (b) => b.bgType === "image" }),
  f("bgSize", "Image Size", "select", {
    when: (b) => b.bgType === "image",
    options: [
      { label: "Cover", value: "cover" },
      { label: "Contain", value: "contain" },
      { label: "Auto", value: "auto" },
    ],
  }),
  f("bgPosition", "Image Position", "select", {
    when: (b) => b.bgType === "image",
    options: ["center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"].map((v) => ({ label: v, value: v })),
  }),
  f("bgRepeat", "Repeat", "select", {
    when: (b) => b.bgType === "image",
    options: [
      { label: "No repeat", value: "no-repeat" },
      { label: "Repeat", value: "repeat" },
      { label: "Repeat X", value: "repeat-x" },
      { label: "Repeat Y", value: "repeat-y" },
    ],
  }),
  f("bgParallax", "Parallax (fixed while scrolling)", "toggle", { when: (b) => b.bgType === "image" }),
  f("overlayColor", "Overlay Tint", "text", { when: (b) => b.bgType !== "none", placeholder: "rgba(5,4,3,0.5)" }),
  f("backdropBlur", "Backdrop Blur (px)", "range", { min: 0, max: 24, step: 1 }),
];

export const BORDER_FIELDS = [
  f("borderStyle", "Border Style", "select", { options: BORDER_STYLES.map((b) => ({ label: b.name, value: b.val })) }),
  f("borderWidthBox", "Border Width (px)", "box4", { keys: ["borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth"], when: (b) => (b.borderStyle || "none") !== "none" }),
  f("borderColor", "Border Colour", "color", { when: (b) => (b.borderStyle || "none") !== "none" }),
  f("radiusBox", "Corner Radius (px)", "box4", { ...R, keys: ["radiusTopLeft", "radiusTopRight", "radiusBottomRight", "radiusBottomLeft"], labels: ["TL", "TR", "BR", "BL"] }),
];

export const EFFECT_FIELDS = [
  f("shadowPreset", "Shadow Preset", "select", { options: SHADOW_PRESETS.map((s) => ({ label: s.name, value: s.val })) }),
  f("shadow", "Shadow CSS", "text", { placeholder: "0 12px 32px rgba(0,0,0,.8)" }),
  f("opacity", "Opacity", "range", { min: 0, max: 1, step: 0.05 }),
  f("blur", "Blur (px)", "range", { min: 0, max: 20, step: 1 }),
  f("brightness", "Brightness", "range", { min: 0.2, max: 2, step: 0.05 }),
  f("saturate", "Saturation", "range", { min: 0, max: 3, step: 0.05 }),
  f("rotate", "Rotate (deg)", "number", { ...R, min: -180, max: 180 }),
  f("scale", "Scale", "range", { ...R, min: 0.2, max: 2, step: 0.05 }),
  f("translateX", "Nudge X (px)", "number", { ...R, min: -400, max: 400 }),
  f("translateY", "Nudge Y (px)", "number", { ...R, min: -400, max: 400 }),
  f("transition", "Transition", "text", { placeholder: "all 0.3s ease" }),
  f("hoverBg", "Hover Background", "text", { placeholder: "rgba(201,168,76,.15)" }),
  f("hoverColor", "Hover Text Colour", "color"),
  f("hoverBorderColor", "Hover Border Colour", "color"),
  f("hoverScale", "Hover Scale", "range", { min: 0.8, max: 1.5, step: 0.01 }),
  f("hoverShadow", "Hover Shadow", "text", { placeholder: "0 18px 40px rgba(0,0,0,.7)" }),
  f("animation", "Entrance Animation", "select", { options: ANIMATIONS.map((a) => ({ label: a.name, value: a.val })) }),
  f("animationDelay", "Animation Delay (ms)", "number", { min: 0, max: 3000, step: 50 }),
];

export const ADVANCED_FIELDS = [
  f("cssId", "CSS ID", "text", { placeholder: "my-section" }),
  f("cssClass", "CSS Classes", "text", { placeholder: "promo-card featured" }),
  f("customCss", "Custom CSS", "textarea", { mono: true, hint: "Rules for this block. Use `selector` for the block itself, e.g. `selector:hover { opacity:.8 }`" }),
];

// ---------------------------------------------------------------------------
// Base defaults shared by every block
// ---------------------------------------------------------------------------

export const BASE_DEFAULTS = {
  displayMode: "block",
  boxWidth: "100%",
  boxHeight: "auto",
  boxAlign: "center",
  positionMode: "relative",
  posX: 0,
  posY: 0,
  bgType: "none",
  bgColor: "#141110",
  bgGradient: GRADIENT_PRESETS[0].val,
  bgSize: "cover",
  bgPosition: "center",
  bgRepeat: "no-repeat",
  borderStyle: "none",
  borderColor: "rgba(201,168,76,0.3)",
  shadowPreset: "none",
  opacity: 1,
  paddingTop: 10,
  paddingRight: 10,
  paddingBottom: 10,
  paddingLeft: 10,
  marginTop: 0,
  marginBottom: 24,
  transition: "all 0.3s ease",
  animation: "none",
};

const withBase = (data) => ({ ...BASE_DEFAULTS, ...data });

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export const COMPONENTS = [
  // ---------------------------------------------------------------- structure
  {
    id: "section",
    name: "Section / Container",
    category: "Structure",
    icon: "▭",
    isContainer: true,
    description: "The building block for any layout. Nest sections inside sections for rows, columns, cards and grids.",
    defaults: withBase({
      type: "section",
      children: [],
      layoutMode: "stack",
      gridColumns: "1fr 1fr",
      gap: 24,
      justifyContent: "flex-start",
      alignItems: "stretch",
      flexWrap: true,
      contentWidth: "100%",
      paddingTop: 40,
      paddingBottom: 40,
      paddingLeft: 20,
      paddingRight: 20,
      marginBottom: 0,
      mobile: { layoutMode: "stack", gridColumns: "1fr", paddingLeft: 16, paddingRight: 16 },
    }),
    contentFields: [],
  },
  {
    id: "columns-2",
    name: "2 Columns",
    category: "Structure",
    icon: "⫿",
    isContainer: true,
    presetOf: "section",
    defaults: withBase({
      type: "section",
      children: [],
      layoutMode: "grid",
      gridColumns: "1fr 1fr",
      gap: 24,
      alignItems: "stretch",
      paddingTop: 20,
      paddingBottom: 20,
      mobile: { gridColumns: "1fr" },
    }),
    contentFields: [],
  },
  {
    id: "columns-3",
    name: "3 Columns",
    category: "Structure",
    icon: "⫼",
    isContainer: true,
    presetOf: "section",
    defaults: withBase({
      type: "section",
      children: [],
      layoutMode: "grid",
      gridColumns: "1fr 1fr 1fr",
      gap: 20,
      alignItems: "stretch",
      paddingTop: 20,
      paddingBottom: 20,
      tablet: { gridColumns: "1fr 1fr" },
      mobile: { gridColumns: "1fr" },
    }),
    contentFields: [],
  },
  {
    id: "columns-4",
    name: "4 Columns",
    category: "Structure",
    icon: "⧉",
    isContainer: true,
    presetOf: "section",
    defaults: withBase({
      type: "section",
      children: [],
      layoutMode: "grid",
      gridColumns: "1fr 1fr 1fr 1fr",
      gap: 18,
      alignItems: "stretch",
      paddingTop: 20,
      paddingBottom: 20,
      tablet: { gridColumns: "1fr 1fr" },
      mobile: { gridColumns: "1fr" },
    }),
    contentFields: [],
  },
  {
    id: "card",
    name: "Card Container",
    category: "Structure",
    icon: "▤",
    isContainer: true,
    presetOf: "section",
    defaults: withBase({
      type: "section",
      children: [],
      layoutMode: "stack",
      gap: 12,
      alignItems: "stretch",
      bgType: "color",
      bgColor: "rgba(20, 12, 6, 0.6)",
      borderStyle: "solid",
      borderTopWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderLeftWidth: 1,
      borderColor: "rgba(201,168,76,0.25)",
      radiusTopLeft: 14,
      radiusTopRight: 14,
      radiusBottomRight: 14,
      radiusBottomLeft: 14,
      shadowPreset: "0 12px 32px rgba(0,0,0,0.8)",
      paddingTop: 24,
      paddingRight: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      hoverScale: 1.02,
    }),
    contentFields: [],
  },

  // ------------------------------------------------------------------ content
  {
    id: "heading",
    name: "Heading",
    category: "Typography",
    icon: "H",
    defaults: withBase({
      type: "heading",
      tag: "h2",
      text: "Luxury Framing Headline",
      fontFamily: "var(--font-display)",
      textColor: "#C9A84C",
      fontSize: 36,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: "1.25",
      mobile: { fontSize: 26 },
    }),
    contentFields: [
      f("tag", "HTML Tag", "select", {
        options: ["h1", "h2", "h3", "h4", "h5", "h6"].map((t) => ({ label: t.toUpperCase(), value: t })),
      }),
      f("text", "Heading Text", "textarea", { rows: 3 }),
      f("link", "Link (optional)", "text", { placeholder: "/catalog" }),
    ],
  },
  {
    id: "paragraph",
    name: "Text Paragraph",
    category: "Typography",
    icon: "¶",
    defaults: withBase({
      type: "paragraph",
      text: "Our handcrafted solid wood picture frames are built using century-tested joinery techniques in our studio.",
      fontFamily: "var(--font-serif)",
      textColor: "#E0D7CD",
      fontSize: 16,
      lineHeight: "1.8",
      textAlign: "left",
      mobile: { fontSize: 15 },
    }),
    contentFields: [f("text", "Paragraph Text", "textarea", { rows: 6, hint: "Line breaks are preserved." })],
  },
  {
    id: "rich-text",
    name: "Rich HTML Text",
    category: "Typography",
    icon: "</>",
    defaults: withBase({
      type: "rich-text",
      html: "<p>Write <strong>HTML</strong> here — <em>bold</em>, lists, links, anything.</p>",
      textColor: "#E0D7CD",
      fontSize: 16,
      lineHeight: "1.8",
    }),
    contentFields: [f("html", "HTML Content", "textarea", { rows: 8, mono: true })],
  },
  {
    id: "quote",
    name: "Pull Quote",
    category: "Typography",
    icon: "❝",
    defaults: withBase({
      type: "quote",
      text: "Every frame we build is a promise that a memory will outlive us.",
      author: "Yaadein Studio",
      accentColor: "#C9A84C",
      fontSize: 22,
      fontFamily: "var(--font-serif)",
      fontStyle: "italic",
      textColor: "#F5F0E8",
      paddingLeft: 24,
    }),
    contentFields: [
      f("text", "Quote", "textarea", { rows: 4 }),
      f("author", "Attribution", "text"),
      f("accentColor", "Accent Bar Colour", "color"),
    ],
  },
  {
    id: "list",
    name: "Feature List",
    category: "Typography",
    icon: "☰",
    defaults: withBase({
      type: "list",
      listStyle: "icon",
      icon: "check",
      accentColor: "#C9A84C",
      gap: 10,
      fontSize: 15,
      textColor: "#E0D7CD",
      items: ["100% acid-free archival mats", "99% UV museum glass", "Hand-cut solid wood mouldings"],
    }),
    contentFields: [
      f("listStyle", "List Style", "select", {
        options: [
          { label: "Icon bullets", value: "icon" },
          { label: "Disc bullets", value: "disc" },
          { label: "Numbered", value: "number" },
          { label: "No marker", value: "none" },
        ],
      }),
      f("icon", "Bullet Icon", "icon", { when: (b) => (b.listStyle || "icon") === "icon" }),
      f("accentColor", "Marker Colour", "color"),
      f("items", "List Items", "repeater-text", { itemLabel: "Item" }),
    ],
  },
  {
    id: "divider",
    name: "Divider",
    category: "Typography",
    icon: "―",
    defaults: withBase({
      type: "divider",
      lineStyle: "solid",
      lineWidth: "100%",
      lineThickness: 1,
      lineColor: "rgba(201,168,76,0.5)",
      boxAlign: "center",
      marginTop: 10,
      marginBottom: 10,
    }),
    contentFields: [
      f("lineStyle", "Line Style", "select", { options: BORDER_STYLES.filter((b) => b.val !== "none").map((b) => ({ label: b.name, value: b.val })) }),
      f("lineWidth", "Line Width", "size", { presets: ["100%", "60%", "200px", "80px"] }),
      f("lineThickness", "Thickness (px)", "number", { min: 1, max: 20 }),
      f("lineColor", "Line Colour", "color"),
    ],
  },
  {
    id: "spacer",
    name: "Spacer",
    category: "Typography",
    icon: "↕",
    defaults: withBase({ type: "spacer", spacerHeight: 48, paddingTop: 0, paddingBottom: 0, marginBottom: 0, mobile: { spacerHeight: 28 } }),
    contentFields: [f("spacerHeight", "Height (px)", "number", { ...R, min: 0, max: 400 })],
  },

  // -------------------------------------------------------------------- media
  {
    id: "image",
    name: "Image",
    category: "Media",
    icon: "▢",
    defaults: withBase({
      type: "image",
      url: "/images/bespoke_framing.png",
      alt: "",
      caption: "",
      imageWidth: "100%",
      imageRatio: "auto",
      objectFit: "cover",
      radiusTopLeft: 10,
      radiusTopRight: 10,
      radiusBottomRight: 10,
      radiusBottomLeft: 10,
      link: "",
    }),
    contentFields: [
      f("url", "Image", "image"),
      f("alt", "Alt Text", "text", { hint: "Describes the image for screen readers and search engines." }),
      f("caption", "Caption", "text"),
      f("imageWidth", "Image Width", "size", { ...R, presets: ["100%", "75%", "50%", "300px"] }),
      f("imageRatio", "Aspect Ratio", "select", {
        options: [
          { label: "Original", value: "auto" },
          { label: "16:9", value: "16/9" },
          { label: "4:3", value: "4/3" },
          { label: "1:1 Square", value: "1/1" },
          { label: "3:4 Portrait", value: "3/4" },
          { label: "9:16 Tall", value: "9/16" },
        ],
      }),
      f("objectFit", "Fit", "select", {
        options: [
          { label: "Cover (fill, may crop)", value: "cover" },
          { label: "Contain (whole image)", value: "contain" },
        ],
      }),
      f("link", "Link (optional)", "text"),
    ],
  },
  {
    id: "video",
    name: "Video Player",
    category: "Media",
    icon: "▶",
    defaults: withBase({
      type: "video",
      url: "/videos/reel1.mp4",
      caption: "",
      aspectRatio: "16/9",
      objectFit: "contain",
      videoMaxWidth: "800px",
      controls: true,
      autoPlay: false,
      loop: false,
      muted: false,
      poster: "",
    }),
    contentFields: [
      f("url", "Video", "video"),
      f("poster", "Poster Image", "image"),
      f("caption", "Caption", "text"),
      f("aspectRatio", "Aspect Ratio", "select", {
        options: [
          { label: "16:9 Landscape", value: "16/9" },
          { label: "9:16 Reel", value: "9/16" },
          { label: "4:3", value: "4/3" },
          { label: "1:1 Square", value: "1/1" },
          { label: "21:9 Cinematic", value: "21/9" },
          { label: "Auto", value: "auto" },
        ],
      }),
      f("objectFit", "Fit", "select", {
        options: [
          { label: "Contain (never distorted)", value: "contain" },
          { label: "Cover (fill, crops)", value: "cover" },
        ],
      }),
      f("videoMaxWidth", "Max Width", "size", { ...R, presets: ["100%", "800px", "640px", "420px"] }),
      f("controls", "Show controls", "toggle"),
      f("autoPlay", "Autoplay", "toggle"),
      f("loop", "Loop", "toggle"),
      f("muted", "Muted", "toggle"),
    ],
  },
  {
    id: "gallery",
    name: "Image Gallery",
    category: "Media",
    icon: "⊞",
    defaults: withBase({
      type: "gallery",
      images: ["/images/bespoke_framing.png", "/images/gallery_walls.png", "/images/fine_art_printing.png"],
      galleryColumns: "3",
      gap: 14,
      imageRatio: "1/1",
      objectFit: "cover",
      radiusTopLeft: 10,
      radiusTopRight: 10,
      radiusBottomRight: 10,
      radiusBottomLeft: 10,
      tablet: { galleryColumns: "2" },
      mobile: { galleryColumns: "1" },
    }),
    contentFields: [
      f("images", "Images", "repeater-image", { itemLabel: "Image" }),
      f("galleryColumns", "Columns", "select", { ...R, options: ["1", "2", "3", "4", "5", "6"].map((n) => ({ label: `${n} across`, value: n })) }),
      f("imageRatio", "Tile Ratio", "select", {
        options: [
          { label: "Square", value: "1/1" },
          { label: "4:3", value: "4/3" },
          { label: "16:9", value: "16/9" },
          { label: "Portrait 3:4", value: "3/4" },
          { label: "Original", value: "auto" },
        ],
      }),
      f("objectFit", "Fit", "select", { options: [{ label: "Cover", value: "cover" }, { label: "Contain", value: "contain" }] }),
    ],
  },
  {
    id: "logo-strip",
    name: "Logo / Badge Strip",
    category: "Media",
    icon: "⋯",
    defaults: withBase({
      type: "logo-strip",
      images: [],
      logoHeight: 46,
      gap: 40,
      grayscale: true,
      justifyContent: "center",
      flexWrap: true,
    }),
    contentFields: [
      f("images", "Logos", "repeater-image", { itemLabel: "Logo" }),
      f("logoHeight", "Logo Height (px)", "number", { ...R, min: 16, max: 200 }),
      f("grayscale", "Desaturate until hover", "toggle"),
    ],
  },

  // ---------------------------------------------------------------- interactive
  {
    id: "button",
    name: "Button",
    category: "Interactive",
    icon: "▭",
    defaults: withBase({
      type: "button",
      text: "Get a Free Quote",
      link: "/contact",
      newTab: false,
      buttonStyle: "solid",
      btnColor: "#C9A84C",
      textColor: "#000000",
      fontSize: 14,
      fontWeight: "700",
      icon: "none",
      iconPosition: "right",
      boxWidth: "auto",
      displayMode: "inline-block",
      paddingTop: 14,
      paddingBottom: 14,
      paddingLeft: 30,
      paddingRight: 30,
      radiusTopLeft: 8,
      radiusTopRight: 8,
      radiusBottomRight: 8,
      radiusBottomLeft: 8,
      hoverScale: 1.04,
    }),
    contentFields: [
      f("text", "Label", "text"),
      f("link", "Link", "text", { placeholder: "/contact or https://..." }),
      f("newTab", "Open in new tab", "toggle"),
      f("buttonStyle", "Style", "select", {
        options: [
          { label: "Solid", value: "solid" },
          { label: "Outline", value: "outline" },
          { label: "Ghost / text", value: "ghost" },
          { label: "Gold gradient", value: "gradient" },
        ],
      }),
      f("btnColor", "Button Colour", "color"),
      f("icon", "Icon", "icon", { allowNone: true }),
      f("iconPosition", "Icon Position", "select", { options: [{ label: "Left", value: "left" }, { label: "Right", value: "right" }] }),
      f("fullWidthMobile", "Full width on mobile", "toggle"),
    ],
  },
  {
    id: "button-group",
    name: "Button Group",
    category: "Interactive",
    icon: "▭▭",
    defaults: withBase({
      type: "button-group",
      buttons: [
        { text: "Start a Project", link: "/customize", style: "solid" },
        { text: "Browse Catalog", link: "/catalog", style: "outline" },
      ],
      gap: 14,
      justifyContent: "center",
      flexWrap: true,
      btnColor: "#C9A84C",
      mobile: { layoutMode: "stack" },
    }),
    contentFields: [
      f("buttons", "Buttons", "repeater", {
        itemLabel: "Button",
        fields: [
          f("text", "Label", "text"),
          f("link", "Link", "text"),
          f("style", "Style", "select", {
            options: [
              { label: "Solid", value: "solid" },
              { label: "Outline", value: "outline" },
              { label: "Ghost", value: "ghost" },
              { label: "Gold gradient", value: "gradient" },
            ],
          }),
        ],
        newItem: { text: "New Button", link: "/", style: "solid" },
      }),
      f("btnColor", "Accent Colour", "color"),
    ],
  },
  {
    id: "icon",
    name: "Icon",
    category: "Interactive",
    icon: "✦",
    defaults: withBase({
      type: "icon",
      icon: "sparkle",
      iconSize: 44,
      iconColor: "#C9A84C",
      iconStroke: 1.6,
      iconShape: "none",
      link: "",
      boxAlign: "center",
    }),
    contentFields: [
      f("icon", "Icon", "icon"),
      f("iconSize", "Size (px)", "number", { ...R, min: 12, max: 200 }),
      f("iconColor", "Colour", "color"),
      f("iconStroke", "Stroke Width", "range", { min: 0.5, max: 4, step: 0.1 }),
      f("iconShape", "Container Shape", "select", {
        options: [
          { label: "None", value: "none" },
          { label: "Circle", value: "circle" },
          { label: "Rounded square", value: "square" },
        ],
      }),
      f("link", "Link (optional)", "text"),
    ],
  },
  {
    id: "icon-box",
    name: "Icon Box",
    category: "Interactive",
    icon: "◈",
    defaults: withBase({
      type: "icon-box",
      icon: "shield",
      iconSize: 34,
      iconColor: "#C9A84C",
      iconShape: "circle",
      title: "Museum-Grade Materials",
      text: "Acid-free mats and 99% UV conservation glass on every commission.",
      iconLayout: "top",
      textAlign: "center",
      titleSize: 18,
      textColor: "#A8A08C",
      fontSize: 14,
    }),
    contentFields: [
      f("icon", "Icon", "icon"),
      f("iconLayout", "Icon Placement", "select", {
        ...R,
        options: [
          { label: "Above text", value: "top" },
          { label: "Left of text", value: "left" },
          { label: "Right of text", value: "right" },
        ],
      }),
      f("iconSize", "Icon Size (px)", "number", { min: 12, max: 120 }),
      f("iconColor", "Icon Colour", "color"),
      f("iconShape", "Icon Container", "select", {
        options: [
          { label: "None", value: "none" },
          { label: "Circle", value: "circle" },
          { label: "Rounded square", value: "square" },
        ],
      }),
      f("title", "Title", "text"),
      f("titleSize", "Title Size (px)", "number", { ...R, min: 10, max: 60 }),
      f("text", "Description", "textarea", { rows: 4 }),
      f("link", "Link (optional)", "text"),
    ],
  },
  {
    id: "badge",
    name: "Badge / Tag",
    category: "Interactive",
    icon: "◷",
    defaults: withBase({
      type: "badge",
      text: "MOST POPULAR",
      badgeColor: "#C9A84C",
      badgeTextColor: "#000000",
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      displayMode: "inline-block",
      boxWidth: "auto",
      paddingTop: 5,
      paddingBottom: 5,
      paddingLeft: 12,
      paddingRight: 12,
      radiusTopLeft: 20,
      radiusTopRight: 20,
      radiusBottomRight: 20,
      radiusBottomLeft: 20,
    }),
    contentFields: [
      f("text", "Label", "text"),
      f("badgeColor", "Background", "color"),
      f("badgeTextColor", "Text Colour", "color"),
    ],
  },
  {
    id: "social-icons",
    name: "Social Icons",
    category: "Interactive",
    icon: "◍",
    defaults: withBase({
      type: "social-icons",
      links: [
        { icon: "instagram", url: "https://instagram.com/yaadein.pk" },
        { icon: "facebook", url: "https://facebook.com/yaadein.pk" },
        { icon: "whatsapp", url: "https://wa.me/923001234567" },
      ],
      iconSize: 20,
      iconColor: "#C9A84C",
      iconShape: "circle",
      gap: 12,
      justifyContent: "center",
    }),
    contentFields: [
      f("links", "Social Links", "repeater", {
        itemLabel: "Link",
        fields: [f("icon", "Icon", "icon"), f("url", "URL", "text")],
        newItem: { icon: "instagram", url: "" },
      }),
      f("iconSize", "Icon Size (px)", "number", { min: 10, max: 80 }),
      f("iconColor", "Colour", "color"),
      f("iconShape", "Shape", "select", {
        options: [
          { label: "Circle", value: "circle" },
          { label: "Rounded square", value: "square" },
          { label: "Bare icon", value: "none" },
        ],
      }),
    ],
  },
  {
    id: "tabs",
    name: "Tabs",
    category: "Interactive",
    icon: "⊟",
    defaults: withBase({
      type: "tabs",
      items: [
        { title: "Materials", body: "Solid teak, walnut and mahogany, cured against warping." },
        { title: "Glass", body: "99% UV conservation glass or non-reflective optical acrylic." },
        { title: "Delivery", body: "Insured nationwide delivery in custom wooden crates." },
      ],
      accentColor: "#C9A84C",
      textColor: "#E0D7CD",
      tabAlign: "center",
    }),
    contentFields: [
      f("items", "Tabs", "repeater", {
        itemLabel: "Tab",
        fields: [f("title", "Tab Title", "text"), f("body", "Tab Body", "textarea", { rows: 4 })],
        newItem: { title: "New Tab", body: "Tab content" },
      }),
      f("accentColor", "Accent Colour", "color"),
      f("tabAlign", "Tab Alignment", "buttons", {
        options: [
          { label: "Left", value: "flex-start" },
          { label: "Center", value: "center" },
          { label: "Right", value: "flex-end" },
        ],
      }),
    ],
  },
  {
    id: "accordion",
    name: "Accordion (multi-item)",
    category: "Interactive",
    icon: "≣",
    defaults: withBase({
      type: "accordion",
      items: [
        { question: "How long does custom framing take?", answer: "Standard orders take 3-5 business days.", open: true },
        { question: "Do you ship nationwide?", answer: "Yes — insured nationwide shipping in custom wooden crates.", open: false },
      ],
      iconStyle: "plus-minus",
      accentColor: "#C9A84C",
      allowMultiple: true,
      gap: 12,
    }),
    contentFields: [
      f("items", "Accordion Items", "repeater", {
        itemLabel: "Item",
        fields: [
          f("question", "Question", "text"),
          f("answer", "Answer", "textarea", { rows: 4 }),
          f("open", "Open by default", "toggle"),
        ],
        newItem: { question: "New question", answer: "Answer text", open: false },
      }),
      f("iconStyle", "Toggle Icon", "select", {
        options: [
          { label: "Plus / minus", value: "plus-minus" },
          { label: "Chevron", value: "chevron" },
          { label: "Arrow", value: "arrow" },
        ],
      }),
      f("allowMultiple", "Allow several open at once", "toggle"),
      f("accentColor", "Accent Colour", "color"),
    ],
  },
  {
    id: "faq",
    name: "FAQ Item (single)",
    category: "Interactive",
    icon: "❖",
    defaults: withBase({
      type: "faq",
      question: "Do you ship nationwide across Pakistan?",
      answer: "Yes! We provide insured nationwide shipping in custom wooden crates.",
      iconStyle: "plus-minus",
      initialOpen: false,
      textColor: "#C9A84C",
      bgType: "color",
      bgColor: "rgba(20, 12, 6, 0.7)",
      borderStyle: "solid",
      borderTopWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderLeftWidth: 1,
      radiusTopLeft: 8,
      radiusTopRight: 8,
      radiusBottomRight: 8,
      radiusBottomLeft: 8,
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      marginBottom: 14,
    }),
    contentFields: [
      f("question", "Question", "textarea", { rows: 2 }),
      f("answer", "Answer", "textarea", { rows: 6 }),
      f("iconStyle", "Toggle Icon", "select", {
        options: [
          { label: "Plus / minus", value: "plus-minus" },
          { label: "Chevron", value: "chevron" },
          { label: "Arrow", value: "arrow" },
        ],
      }),
      f("initialOpen", "Expanded by default", "toggle"),
    ],
  },

  // -------------------------------------------------------------------- data
  {
    id: "stat",
    name: "Stat Counter",
    category: "Data",
    icon: "◕",
    defaults: withBase({
      type: "stat",
      value: "12,400",
      prefix: "",
      suffix: "+",
      label: "Frames handcrafted",
      valueSize: 46,
      accentColor: "#C9A84C",
      textColor: "#A8A08C",
      textAlign: "center",
      mobile: { valueSize: 34 },
    }),
    contentFields: [
      f("prefix", "Prefix", "text", { placeholder: "Rs." }),
      f("value", "Value", "text"),
      f("suffix", "Suffix", "text", { placeholder: "+" }),
      f("label", "Label", "text"),
      f("valueSize", "Value Size (px)", "number", { ...R, min: 12, max: 140 }),
      f("accentColor", "Value Colour", "color"),
    ],
  },
  {
    id: "progress",
    name: "Progress Bar",
    category: "Data",
    icon: "▰",
    defaults: withBase({
      type: "progress",
      label: "Studio capacity booked",
      percent: 72,
      barColor: "#C9A84C",
      trackColor: "rgba(255,255,255,0.08)",
      barHeight: 10,
      showValue: true,
      textColor: "#E0D7CD",
      fontSize: 13,
    }),
    contentFields: [
      f("label", "Label", "text"),
      f("percent", "Percent", "range", { min: 0, max: 100, step: 1 }),
      f("showValue", "Show percentage", "toggle"),
      f("barColor", "Bar Colour", "color"),
      f("trackColor", "Track Colour", "text"),
      f("barHeight", "Bar Height (px)", "number", { min: 2, max: 60 }),
    ],
  },
  {
    id: "table",
    name: "Table",
    category: "Data",
    icon: "▦",
    defaults: withBase({
      type: "table",
      headers: ["Size", "Standard", "Museum Glass"],
      rows: [
        ["12\" x 18\"", "Rs. 4,000", "Rs. 6,500"],
        ["16\" x 24\"", "Rs. 5,500", "Rs. 8,000"],
      ],
      accentColor: "#C9A84C",
      textColor: "#E0D7CD",
      striped: true,
      fontSize: 14,
    }),
    contentFields: [
      f("headers", "Header Cells", "repeater-text", { itemLabel: "Header" }),
      f("rows", "Rows", "table-rows"),
      f("striped", "Striped rows", "toggle"),
      f("accentColor", "Header Colour", "color"),
    ],
  },
  {
    id: "pricing",
    name: "Pricing Card",
    category: "Data",
    icon: "◇",
    defaults: withBase({
      type: "pricing",
      title: "Custom Archival Package",
      currency: "Rs.",
      price: "4,500",
      period: "per frame",
      ribbonBadge: "MOST POPULAR",
      features: ["99% UV museum glass", "Acid-free double mount", "Insured nationwide delivery"],
      buttonText: "Configure Frame",
      buttonLink: "/customize",
      textColor: "#C9A84C",
      bgType: "color",
      bgColor: "rgba(201, 168, 76, 0.12)",
      borderStyle: "solid",
      borderTopWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderLeftWidth: 1,
      borderColor: "#C9A84C",
      radiusTopLeft: 16,
      radiusTopRight: 16,
      radiusBottomRight: 16,
      radiusBottomLeft: 16,
      paddingTop: 32,
      paddingBottom: 32,
      paddingLeft: 24,
      paddingRight: 24,
    }),
    contentFields: [
      f("title", "Plan Title", "text"),
      f("currency", "Currency", "text"),
      f("price", "Price", "text"),
      f("period", "Period / Note", "text"),
      f("ribbonBadge", "Ribbon Badge", "text", { hint: "Leave blank to hide." }),
      f("features", "Included Features", "repeater-text", { itemLabel: "Feature" }),
      f("buttonText", "Button Label", "text"),
      f("buttonLink", "Button Link", "text"),
    ],
  },
  {
    id: "testimonial",
    name: "Testimonial",
    category: "Data",
    icon: "★",
    defaults: withBase({
      type: "testimonial",
      name: "Fatima Ali",
      location: "Lahore",
      rating: "5",
      quote: "The quality of the wood framing and museum glass exceeded all my expectations!",
      avatarUrl: "",
      textColor: "#C9A84C",
      bgType: "color",
      bgColor: "rgba(28, 15, 7, 0.6)",
      borderStyle: "solid",
      borderTopWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderLeftWidth: 1,
      borderColor: "rgba(201, 168, 76, 0.2)",
      radiusTopLeft: 12,
      radiusTopRight: 12,
      radiusBottomRight: 12,
      radiusBottomLeft: 12,
      paddingTop: 26,
      paddingBottom: 26,
      paddingLeft: 24,
      paddingRight: 24,
    }),
    contentFields: [
      f("quote", "Quote", "textarea", { rows: 4 }),
      f("name", "Customer Name", "text"),
      f("location", "Location", "text"),
      f("rating", "Star Rating", "select", { options: ["1", "2", "3", "4", "5"].map((r) => ({ label: "★".repeat(+r), value: r })) }),
      f("avatarUrl", "Avatar", "image"),
    ],
  },
  {
    id: "cta-banner",
    name: "CTA Banner",
    category: "Data",
    icon: "◈",
    defaults: withBase({
      type: "cta-banner",
      title: "Custom Framing Order",
      subtitle: "Speak directly with our studio artisans.",
      buttonText: "Get Free Quote",
      buttonLink: "/contact",
      textColor: "#FFD700",
      bgType: "gradient",
      bgGradient: "linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(20,12,6,0.9) 100%)",
      borderStyle: "solid",
      borderTopWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderLeftWidth: 1,
      borderColor: "#C9A84C",
      radiusTopLeft: 16,
      radiusTopRight: 16,
      radiusBottomRight: 16,
      radiusBottomLeft: 16,
      paddingTop: 50,
      paddingBottom: 50,
      paddingLeft: 30,
      paddingRight: 30,
      textAlign: "center",
    }),
    contentFields: [
      f("title", "Headline", "text"),
      f("subtitle", "Sub-headline", "textarea", { rows: 2 }),
      f("buttonText", "Button Label", "text"),
      f("buttonLink", "Button Link", "text"),
    ],
  },

  // ------------------------------------------------------------------ embeds
  {
    id: "map",
    name: "Map Embed",
    category: "Embeds",
    icon: "⌖",
    defaults: withBase({
      type: "map",
      query: "Gulberg III, Lahore, Pakistan",
      mapHeight: 380,
      radiusTopLeft: 12,
      radiusTopRight: 12,
      radiusBottomRight: 12,
      radiusBottomLeft: 12,
      mobile: { mapHeight: 240 },
    }),
    contentFields: [
      f("query", "Location / Address", "text"),
      f("mapHeight", "Height (px)", "number", { ...R, min: 120, max: 900 }),
    ],
  },
  {
    id: "html-embed",
    name: "HTML / Embed Code",
    category: "Embeds",
    icon: "{}",
    defaults: withBase({ type: "html-embed", html: "<!-- paste an embed snippet here -->" }),
    contentFields: [f("html", "Embed Code", "textarea", { rows: 8, mono: true })],
  },
  {
    id: "form",
    name: "Contact Form",
    category: "Embeds",
    icon: "✉",
    defaults: withBase({
      type: "form",
      fields: [
        { label: "Your Name", type: "text", required: true },
        { label: "Email", type: "email", required: true },
        { label: "Tell us about your project", type: "textarea", required: false },
      ],
      submitText: "Send Enquiry",
      submitTo: "",
      accentColor: "#C9A84C",
      gap: 14,
    }),
    contentFields: [
      f("fields", "Form Fields", "repeater", {
        itemLabel: "Field",
        fields: [
          f("label", "Label", "text"),
          f("type", "Type", "select", {
            options: [
              { label: "Single line", value: "text" },
              { label: "Email", value: "email" },
              { label: "Phone", value: "tel" },
              { label: "Long text", value: "textarea" },
            ],
          }),
          f("required", "Required", "toggle"),
        ],
        newItem: { label: "New Field", type: "text", required: false },
      }),
      f("submitText", "Submit Button Label", "text"),
      f("submitTo", "Send to email (mailto)", "text", { placeholder: "team@yaadein.com" }),
    ],
  },
  {
    id: "video-reels",
    name: "Instagram Reels Gallery",
    category: "Embeds",
    icon: "❖",
    defaults: withBase({
      type: "video-reels",
      sectionTitle: "Our Work in Motion",
      sectionSubtitle: "See how our customers style their spaces.",
      layout: "carousel",
      columns: "3",
      textColor: "#C9A84C",
      reels: [{ id: "r_1", instagramUrl: "https://www.instagram.com/reel/DaiiHdCNkku/", caption: "", featured: true }],
      tablet: { columns: "2" },
      mobile: { columns: "1" },
    }),
    contentFields: [
      f("sectionTitle", "Section Title", "text"),
      f("sectionSubtitle", "Section Subtitle", "text"),
      f("layout", "Layout", "select", { options: [{ label: "Carousel", value: "carousel" }, { label: "Grid", value: "grid" }] }),
      f("columns", "Columns", "select", { ...R, options: ["1", "2", "3", "4"].map((n) => ({ label: `${n} across`, value: n })) }),
      f("reels", "Reels", "repeater", {
        itemLabel: "Reel",
        fields: [f("instagramUrl", "Instagram URL", "text"), f("caption", "Caption", "text"), f("featured", "Featured", "toggle")],
        newItem: { instagramUrl: "", caption: "", featured: false },
      }),
    ],
  },

  // --------------------------------------------------------- Yaadein studio
  {
    id: "studio-lamp",
    name: "Studio Brass Lamp",
    category: "Yaadein Studio",
    icon: "💡",
    defaults: withBase({
      type: "studio-lamp",
      lampWidth: 440,
      rodHeight: 80,
      beamWidth: 650,
      beamHeight: 500,
      glowIntensity: 0.38,
      followsPageLight: true,
      defaultOn: true,
      paddingTop: 40,
      paddingBottom: 40,
      mobile: { lampWidth: 260, beamWidth: 380, beamHeight: 320 },
    }),
    contentFields: [
      f("lampWidth", "Lamp Head Width (px)", "number", { ...R, min: 80, max: 900 }),
      f("rodHeight", "Rod Height (px)", "number", { ...R, min: 0, max: 400 }),
      f("beamWidth", "Beam Width (px)", "number", { ...R, min: 100, max: 1600 }),
      f("beamHeight", "Beam Height (px)", "number", { ...R, min: 80, max: 1200 }),
      f("glowIntensity", "Glow Intensity", "range", { min: 0, max: 1, step: 0.02 }),
      f("followsPageLight", "Follow the page's Studio Light button", "toggle"),
      f("defaultOn", "Always lit", "toggle", { when: (b) => b.followsPageLight === false }),
    ],
  },
  {
    id: "light-switch",
    name: "Studio Light Button",
    category: "Yaadein Studio",
    icon: "◉",
    defaults: withBase({ type: "light-switch", label: "Studio Light", boxAlign: "center" }),
    contentFields: [f("label", "Button Label", "text")],
  },
];

// Legacy block types kept renderable so pages built before the rewrite still work.
export const LEGACY_TYPES = ["row-2col", "row-3col", "rich-text-legacy"];

export const COMPONENTS_BY_TYPE = COMPONENTS.reduce((acc, c) => {
  if (!acc[c.defaults.type]) acc[c.defaults.type] = c;
  return acc;
}, {});

export const getComponent = (type) => COMPONENTS_BY_TYPE[type] || null;

export const CATEGORIES = COMPONENTS.reduce((acc, c) => {
  if (!acc.includes(c.category)) acc.push(c.category);
  return acc;
}, []);

let idCounter = 0;
export const newBlockId = () => `b_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;

export const createBlock = (componentId) => {
  const comp = COMPONENTS.find((c) => c.id === componentId);
  if (!comp) return null;
  const block = JSON.parse(JSON.stringify(comp.defaults));
  block.id = newBlockId();
  block.componentId = comp.id;
  if (comp.isContainer && !Array.isArray(block.children)) block.children = [];
  return block;
};

export const isContainerBlock = (block) => {
  if (!block) return false;
  const comp = getComponent(block.type);
  return !!(comp && comp.isContainer) || Array.isArray(block.children);
};
