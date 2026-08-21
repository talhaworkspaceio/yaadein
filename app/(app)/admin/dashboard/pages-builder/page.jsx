"use client";

import { useState, useEffect, useRef } from "react";
import { ref, onValue, set, remove } from "firebase/database";
import { db } from "../../../../../lib/firebase";

export const FONT_FAMILIES = [
  { name: "Default (Inherit)", val: "inherit" },
  { name: "Cinzel (Luxury Serif)", val: "'Cinzel', serif" },
  { name: "Playfair Display (Editorial)", val: "'Playfair Display', serif" },
  { name: "Inter (Modern Sans)", val: "'Inter', sans-serif" },
  { name: "Montserrat (Bold Clean)", val: "'Montserrat', sans-serif" },
  { name: "Lora (Classic Serif)", val: "'Lora', serif" },
  { name: "Outfit (Contemporary)", val: "'Outfit', sans-serif" },
  { name: "Monospace", val: "monospace" },
];

export const FONT_COLORS = [
  { name: "Gold (Accent) (#C9A84C)", hex: "#C9A84C" },
  { name: "Pure White (#FFFFFF)", hex: "#FFFFFF" },
  { name: "Soft Cream (#E0D7CD)", hex: "#E0D7CD" },
  { name: "Vibrant Gold (#FFD700)", hex: "#FFD700" },
  { name: "Coral Pink (#FF5A5F)", hex: "#FF5A5F" },
  { name: "Emerald Green (#2ECC71)", hex: "#2ECC71" },
  { name: "Sky Blue (#3498DB)", hex: "#3498DB" },
  { name: "Warm Amber (#E67E22)", hex: "#E67E22" },
  { name: "Muted Steel (#A0A0A0)", hex: "#A0A0A0" },
  { name: "Dark Charcoal (#1A1A1A)", hex: "#1A1A1A" },
];

export const BORDER_STYLES = [
  { name: "None", val: "none" },
  { name: "Solid Line", val: "solid" },
  { name: "Dashed Line", val: "dashed" },
  { name: "Dotted Line", val: "dotted" },
  { name: "Double Line", val: "double" },
];

export const SHADOW_PRESETS = [
  { name: "None", val: "none" },
  { name: "Subtle Soft Shadow", val: "0 4px 12px rgba(0,0,0,0.4)" },
  { name: "Gold Ambient Glow", val: "0 0 20px rgba(201, 168, 76, 0.35)" },
  { name: "Deep Elevated 3D", val: "0 12px 32px rgba(0,0,0,0.8)" },
  { name: "Inverted Inner Shadow", val: "inset 0 2px 8px rgba(0,0,0,0.6)" },
];

export const SAMPLE_TEMPLATES = [
  {
    id: "blog-layout",
    title: "Editorial Blog & Art Journal Layout",
    category: "Blog & Editorial",
    icon: "📰",
    slug: "art-journal-gallery-walls",
    blocks: [
      { id: "b1", type: "heading", tag: "h1", text: "The Art of Gallery Walls: 7 Secrets from Master Curators", fontFamily: "'Cinzel', serif", textColor: "#C9A84C", fontSize: "38", fontWeight: "700", textAlign: "center", paddingTop: "20", paddingBottom: "10" },
      { id: "b2", type: "paragraph", text: "Published by @yaadein.pk • 5 Min Read • Interior Art Curation Series", fontFamily: "'Inter', sans-serif", textColor: "#A0A0A0", fontSize: "14", fontWeight: "400", textAlign: "center", paddingTop: "0", paddingBottom: "20" },
      { id: "b3", type: "row-2col", colRatio: "1fr 1fr", col1Type: "image", col1Image: "/images/bespoke_framing.png", col1Title: "Precision Spacing & Sightlines", col1Body: "A gallery wall should feel balanced, not cluttered.", col2Type: "text", col2Title: "1. Match Frame Profiles to Art Style", col2Body: "Pair ornate gilded frames with classical portraiture, and sleek matte black frames with modern line art.", col2ButtonText: "Explore Frame Profiles", col2ButtonLink: "/catalog", textColor: "#C9A84C", gap: "24", paddingTop: "20", paddingBottom: "20" },
      { id: "b4", type: "testimonial", name: "Sarah Khan", rating: "5", quote: "Following this gallery wall guide transformed our living room wall into a museum exhibit!", location: "Islamabad", textColor: "#C9A84C" },
      { id: "b5", type: "cta-banner", title: "Want a Custom Gallery Wall Set?", subtitle: "Consult directly with our master framing artisans today.", buttonText: "Request Consultation", buttonLink: "/contact", textColor: "#FFD700" }
    ]
  },
  {
    id: "contact-layout",
    title: "Studio Consultation & Contact Layout",
    category: "Contact & Inquiry",
    icon: "📞",
    slug: "studio-consultation",
    blocks: [
      { id: "b1", type: "heading", tag: "h1", text: "Request a Free Studio Framing Consultation", fontFamily: "'Cinzel', serif", textColor: "#C9A84C", fontSize: "40", fontWeight: "700", textAlign: "center", paddingTop: "20", paddingBottom: "10" },
      { id: "b2", type: "row-2col", colRatio: "1fr 1fr", col1Type: "text", col1Title: "Yaadein Main Framing Studio", col1Body: "Visit our workshop or contact our framing advisors online.\n\n📍 Studio Address: Main Boulevard, Gulberg III, Lahore, Pakistan\n📞 Direct Line: +92 (300) 123-4567\n✉️ Email: concierge@yaadein.pk", col2Type: "text", col2Title: "Studio Operating Hours", col2Body: "Monday - Saturday: 11:00 AM - 9:00 PM\nSunday: By Appointment Only\n\nWe offer nationwide insured shipping across Pakistan.", col2ButtonText: "Call Concierge", col2ButtonLink: "tel:+923001234567", textColor: "#C9A84C", gap: "24", paddingTop: "20", paddingBottom: "20" },
      { id: "b3", type: "faq", question: "How long does custom framing take?", answer: "Standard orders take 3-5 business days. Express 24-hour framing is available upon request.", textColor: "#C9A84C" },
      { id: "b4", type: "faq", question: "Do you offer glass replacement?", answer: "Yes! We fit 99% UV-protective museum glass or non-reflective optical acrylic.", textColor: "#C9A84C" }
    ]
  }
];

export const WIDGET_PALETTE = [
  { id: "heading", name: "Heading Headline", category: "Typography", icon: "H", defaultData: { type: "heading", tag: "h2", text: "Luxury Framing Headline", fontFamily: "'Cinzel', serif", textColor: "#C9A84C", fontSize: "36", fontWeight: "700", textAlign: "center", textTransform: "none", fontStyle: "normal", textDecoration: "none", lineHeight: "1.3", letterSpacing: "0", wordSpacing: "0", textShadow: "none", positionMode: "relative", posX: 0, posY: 0, displayMode: "block", boxWidth: "100%", boxHeight: "auto", boxAlign: "center", bgColor: "transparent", borderStyle: "none", borderWidth: "1", borderColor: "rgba(201,168,76,0.3)", borderRadius: "0", shadow: "none", opacity: "1", paddingTop: "10", paddingBottom: "10", paddingLeft: "10", paddingRight: "10", marginTop: "0", marginBottom: "20", marginLeft: "", marginRight: "" } },
  { id: "paragraph", name: "Text Paragraph", category: "Typography", icon: "¶", defaultData: { type: "paragraph", text: "Our handcrafted solid wood picture frames are built using century-tested joinery techniques in our studio.", fontFamily: "'Inter', sans-serif", textColor: "#E0D7CD", fontSize: "16", fontWeight: "400", textAlign: "left", textTransform: "none", fontStyle: "normal", textDecoration: "none", lineHeight: "1.8", letterSpacing: "0", wordSpacing: "0", positionMode: "relative", posX: 0, posY: 0, displayMode: "block", boxWidth: "100%", boxHeight: "auto", boxAlign: "center", bgColor: "transparent", borderStyle: "none", borderWidth: "1", borderColor: "rgba(201,168,76,0.3)", borderRadius: "0", shadow: "none", opacity: "1", paddingTop: "10", paddingBottom: "10", paddingLeft: "10", paddingRight: "10", marginTop: "0", marginBottom: "20", marginLeft: "", marginRight: "" } },
  { id: "row-2col", name: "2-Column Side-by-Side Row (50/50)", category: "Side-by-Side Layout", icon: "⫽", defaultData: { type: "row-2col", isContainer: true, layout: "2col", colRatio: "1fr 1fr", col1Type: "text", col1Image: "/images/bespoke_framing.png", col1Title: "Left Paragraph Headline", col1Body: "Our handcrafted solid wood picture frames are built using century-tested joinery techniques in our studio.", col2Type: "text", col2Title: "Right Paragraph Headline", col2Body: "Our master woodcraftsmen build every frame to millimeter precision in our studio.", col2ButtonText: "", col2ButtonLink: "/catalog", textColor: "#C9A84C", gap: "24", verticalAlign: "center", positionMode: "relative", posX: 0, posY: 0, displayMode: "block", boxWidth: "100%", boxHeight: "auto", boxAlign: "center", bgColor: "transparent", borderStyle: "none", borderWidth: "1", borderColor: "rgba(201,168,76,0.3)", borderRadius: "0", shadow: "none", opacity: "1", paddingTop: "20", paddingBottom: "20", paddingLeft: "10", paddingRight: "10", marginTop: "0", marginBottom: "30", marginLeft: "", marginRight: "" } },
  { id: "row-3col", name: "3-Column Side-by-Side Row (33/33/33)", category: "Side-by-Side Layout", icon: "⫾", defaultData: { type: "row-3col", isContainer: true, layout: "3col", col1Title: "Feature 1", col1Body: "100% Acid-Free Mats", col2Title: "Feature 2", col2Body: "99% UV Glass Protection", col3Title: "Feature 3", col3Body: "Solid Teak & Mahogany Wood", textColor: "#C9A84C", gap: "20", positionMode: "relative", posX: 0, posY: 0, displayMode: "block", boxWidth: "100%", boxHeight: "auto", boxAlign: "center", bgColor: "transparent", borderStyle: "none", borderWidth: "1", borderColor: "rgba(201,168,76,0.3)", borderRadius: "0", shadow: "none", opacity: "1", paddingTop: "20", paddingBottom: "20", paddingLeft: "10", paddingRight: "10", marginTop: "0", marginBottom: "30", marginLeft: "", marginRight: "" } },
  { id: "image", name: "Image / Photo", category: "Media", icon: "▢", defaultData: { type: "image", url: "/images/bespoke_framing.png", caption: "Bespoke Solid Wood Framing", width: "100%", aspectRatio: "auto", objectFit: "cover", positionMode: "relative", posX: 0, posY: 0, displayMode: "block", boxWidth: "100%", boxHeight: "auto", boxAlign: "center", bgColor: "transparent", borderStyle: "solid", borderWidth: "1", borderColor: "rgba(201,168,76,0.3)", borderRadius: "8", shadow: "0 10px 24px rgba(0,0,0,0.6)", opacity: "1", paddingTop: "10", paddingBottom: "10", paddingLeft: "10", paddingRight: "10", marginTop: "0", marginBottom: "20", marginLeft: "", marginRight: "" } },
  { id: "video", name: "Video Player", category: "Media", icon: "▶", defaultData: { type: "video", url: "/videos/reel1.mp4", caption: "Craftsmanship Video Reel", aspectRatio: "16/9", autoPlay: false, loop: false, controls: true, muted: false, positionMode: "relative", posX: 0, posY: 0, displayMode: "block", boxWidth: "100%", boxHeight: "auto", boxAlign: "center", bgColor: "transparent", borderStyle: "none", borderWidth: "1", borderColor: "rgba(201,168,76,0.3)", borderRadius: "12", shadow: "0 12px 30px rgba(0,0,0,0.8)", opacity: "1", paddingTop: "10", paddingBottom: "10", paddingLeft: "10", paddingRight: "10", marginTop: "0", marginBottom: "30", marginLeft: "", marginRight: "" } },
  { id: "video-reels", name: "Instagram Reels Gallery", category: "Media", icon: "❖", defaultData: { type: "video-reels", sectionTitle: "Our Work in Motion", sectionSubtitle: "See how our customers style their spaces.", layout: "carousel", columns: "2", textColor: "#C9A84C", reels: [{ id: "r_1", instagramUrl: "https://www.instagram.com/reel/DaiiHdCNkku/", caption: "Behind the scenes at Yaadein Studio", featured: true }], positionMode: "relative", posX: 0, posY: 0, displayMode: "block", boxWidth: "100%", boxHeight: "auto", boxAlign: "center", bgColor: "transparent", borderStyle: "none", borderWidth: "1", borderColor: "rgba(201,168,76,0.3)", borderRadius: "0", shadow: "none", opacity: "1", paddingTop: "20", paddingBottom: "20", paddingLeft: "10", paddingRight: "10", marginTop: "0", marginBottom: "30", marginLeft: "", marginRight: "" } },
  { id: "cta-banner", name: "CTA Callout Banner", category: "Sections", icon: "◈", defaultData: { type: "cta-banner", title: "Custom Framing Order", subtitle: "Speak directly with our studio artisans.", buttonText: "Get Free Quote", buttonLink: "/contact", textColor: "#FFD700", bgGradient: "linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(20,12,6,0.9) 100%)", positionMode: "relative", posX: 0, posY: 0, displayMode: "block", boxWidth: "100%", boxHeight: "auto", boxAlign: "center", bgColor: "transparent", borderStyle: "solid", borderWidth: "1", borderColor: "#C9A84C", borderRadius: "16", shadow: "0 12px 32px rgba(0,0,0,0.8)", opacity: "1", paddingTop: "50", paddingBottom: "50", paddingLeft: "10", paddingRight: "10", marginTop: "20", marginBottom: "40", marginLeft: "", marginRight: "" } },
  { id: "testimonial", name: "Testimonial Card", category: "Social Proof", icon: "★", defaultData: { type: "testimonial", name: "Fatima Ali", rating: "5", quote: "The quality of the wood framing and museum glass exceeded all my expectations!", location: "Lahore", textColor: "#C9A84C", avatarUrl: "", avatarShape: "circle", positionMode: "relative", posX: 0, posY: 0, displayMode: "block", boxWidth: "100%", boxHeight: "auto", boxAlign: "center", bgColor: "rgba(28, 15, 7, 0.6)", borderStyle: "solid", borderWidth: "1", borderColor: "rgba(201, 168, 76, 0.2)", borderRadius: "12", shadow: "0 8px 24px rgba(0,0,0,0.6)", opacity: "1", paddingTop: "28", paddingBottom: "28", paddingLeft: "10", paddingRight: "10", marginTop: "10", marginBottom: "30", marginLeft: "", marginRight: "" } },
  { id: "faq", name: "FAQ Accordion Item", category: "Information", icon: "❖", defaultData: { type: "faq", question: "Do you ship nationwide across Pakistan?", answer: "Yes! We provide insured nationwide shipping in custom wooden crates.", textColor: "#C9A84C", iconStyle: "plus-minus", initialOpen: false, positionMode: "relative", posX: 0, posY: 0, displayMode: "block", boxWidth: "100%", boxHeight: "auto", boxAlign: "center", bgColor: "rgba(20, 12, 6, 0.7)", borderStyle: "solid", borderWidth: "1", borderColor: "var(--border)", borderRadius: "8", shadow: "none", opacity: "1", paddingTop: "0", paddingBottom: "0", paddingLeft: "10", paddingRight: "10", marginTop: "0", marginBottom: "14", marginLeft: "", marginRight: "" } },
  { id: "pricing", name: "Pricing Card", category: "E-Commerce", icon: "◇", defaultData: { type: "pricing", title: "Custom Archival Package", currency: "Rs.", price: "4,500", period: "per frame", ribbonBadge: "MOST POPULAR", buttonText: "Configure Frame", buttonLink: "/customize", textColor: "#C9A84C", positionMode: "relative", posX: 0, posY: 0, displayMode: "block", boxWidth: "100%", boxHeight: "auto", boxAlign: "center", bgColor: "rgba(201, 168, 76, 0.15)", borderStyle: "solid", borderWidth: "1", borderColor: "#C9A84C", borderRadius: "16", shadow: "0 12px 32px rgba(0,0,0,0.8)", opacity: "1", paddingTop: "32", paddingBottom: "32", paddingLeft: "10", paddingRight: "10", marginTop: "10", marginBottom: "30", marginLeft: "", marginRight: "" } },
  { id: "divider", name: "Divider Line", category: "Layout", icon: "―", defaultData: { type: "divider", color: "#C9A84C", width: "100%", height: "1", borderStyle: "solid", positionMode: "relative", posX: 0, posY: 0, displayMode: "block", boxWidth: "100%", boxHeight: "auto", boxAlign: "center", bgColor: "transparent", opacity: "1", paddingTop: "10", paddingBottom: "10", paddingLeft: "0", paddingRight: "0", marginTop: "10", marginBottom: "30", marginLeft: "", marginRight: "" } },
  { id: "spacer", name: "Vertical Spacer", category: "Layout", icon: "↕", defaultData: { type: "spacer", height: "40", positionMode: "relative", posX: 0, posY: 0, displayMode: "block", boxWidth: "100%", boxAlign: "center" } },
];

export default function ElementorPageBuilder() {
  const [pagesList, setPagesList] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState("art-journal-gallery-walls");
  const [pageTitle, setPageTitle] = useState("Editorial Blog & Art Journal Layout");
  const [pageBlocks, setPageBlocks] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [activeInspectorTab, setActiveInspectorTab] = useState("content");
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Create New Page Modal State
  const [showCreatePageModal, setShowCreatePageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newPagePreset, setNewPagePreset] = useState("blank");

  // Collapsible Sidebars State
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // Drag and Drop States
  const [draggedWidgetId, setDraggedWidgetId] = useState(null);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Interactive Resizing & Moving Ref States
  const canvasRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isMovingFree, setIsMovingFree] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0, initialWidth: 0, initialHeight: 0, initialX: 0, initialY: 0 });

  // Load pages from Firebase
  useEffect(() => {
    const pagesRef = ref(db, "cms_pages");
    const unsub = onValue(pagesRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list = Object.values(val);
        setPagesList(list);

        const activePage = list.find(p => p.slug === selectedSlug);
        if (activePage) {
          setPageTitle(activePage.title);
          setPageBlocks(Array.isArray(activePage.blocks) ? activePage.blocks : []);
        } else if (!selectedSlug && list.length > 0) {
          setSelectedSlug(list[0].slug);
          setPageTitle(list[0].title);
          setPageBlocks(Array.isArray(list[0].blocks) ? list[0].blocks : []);
        }
      } else {
        setPagesList([]);
        setPageBlocks([]);
      }
    });
    return () => unsub();
  }, [selectedSlug]);

  const [viewMode, setViewMode] = useState("list"); // "list" (Dashboard) or "editor"
  const [pagesSearch, setPagesSearch] = useState("");
  const [pageToDelete, setPageToDelete] = useState(null); // { slug, title }

  const handleOpenEditor = (slug) => {
    setSelectedSlug(slug);
    const found = pagesList.find(p => p.slug === slug);
    if (found) {
      setPageTitle(found.title);
      setPageBlocks(Array.isArray(found.blocks) ? found.blocks : []);
    }
    setSelectedIndex(null);
    setViewMode("editor");
  };

  const handlePromptDelete = (slug, title, e) => {
    if (e) e.stopPropagation();
    setPageToDelete({ slug, title });
  };

  const handleConfirmDelete = async () => {
    if (!pageToDelete) return;
    const { slug, title } = pageToDelete;
    try {
      setPagesList(prev => prev.filter(p => p.slug !== slug));
      await remove(ref(db, `cms_pages/${slug}`));
      setMessage(`Page "${title}" (/${slug}) deleted successfully.`);
      setTimeout(() => setMessage(""), 3500);
      if (selectedSlug === slug) {
        const remaining = pagesList.filter(p => p.slug !== slug);
        if (remaining.length > 0) {
          setSelectedSlug(remaining[0].slug);
          setPageTitle(remaining[0].title);
          setPageBlocks(Array.isArray(remaining[0].blocks) ? remaining[0].blocks : []);
        } else {
          setSelectedSlug("");
          setPageTitle("");
          setPageBlocks([]);
        }
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to delete page.");
    } finally {
      setPageToDelete(null);
    }
  };

  const handleDuplicatePage = async (page, e) => {
    e.stopPropagation();
    const newSlug = `${page.slug}-copy-${Date.now().toString().slice(-4)}`;
    const newPageObj = {
      title: `${page.title} (Copy)`,
      slug: newSlug,
      blocks: page.blocks || [],
      createdAt: new Date().toISOString(),
    };
    try {
      await set(ref(db, `cms_pages/${newSlug}`), newPageObj);
      setMessage(`Duplicated to "/${newSlug}"`);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage("Failed to duplicate page.");
    }
  };

  const handleSelectPage = (slug) => {
    setSelectedSlug(slug);
    const found = pagesList.find(p => p.slug === slug);
    if (found) {
      setPageTitle(found.title);
      setPageBlocks(Array.isArray(found.blocks) ? found.blocks : []);
    }
    setSelectedIndex(null);
  };

  const handleCreateNewPage = async (e) => {
    e.preventDefault();
    if (!newPageTitle.trim()) return;
    const cleanSlug = newPageSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") || newPageTitle.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (!cleanSlug) return;

    let initialBlocks = [];
    if (newPagePreset !== "blank") {
      const foundTpl = SAMPLE_TEMPLATES.find(t => t.id === newPagePreset);
      if (foundTpl) {
        initialBlocks = JSON.parse(JSON.stringify(foundTpl.blocks));
      }
    }

    const newPageObj = {
      title: newPageTitle.trim(),
      slug: cleanSlug,
      blocks: initialBlocks,
      createdAt: new Date().toISOString(),
    };

    try {
      await set(ref(db, `cms_pages/${cleanSlug}`), newPageObj);
      setSelectedSlug(cleanSlug);
      setPageTitle(newPageTitle.trim());
      setPageBlocks(initialBlocks);
      setSelectedIndex(null);
      setShowCreatePageModal(false);
      setNewPageTitle("");
      setNewPageSlug("");
      setViewMode("editor");
      setMessage(`New Custom Page "/${cleanSlug}" created!`);
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setMessage("Failed to create new page.");
    }
  };

  const handleSavePage = async () => {
    if (!selectedSlug) return;
    setSaving(true);
    setMessage("");
    try {
      const pageRef = ref(db, `cms_pages/${selectedSlug}`);
      await set(pageRef, {
        title: pageTitle,
        slug: selectedSlug,
        blocks: pageBlocks,
        updatedAt: new Date().toISOString(),
      });
      setMessage("✅ Page layout saved successfully to Firebase!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to save page layout.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddWidget = (widget, targetIdx = null) => {
    const newBlock = {
      id: "b_" + Date.now(),
      ...JSON.parse(JSON.stringify(widget.defaultData)),
    };
    const updated = [...pageBlocks];
    if (targetIdx !== null) {
      updated.splice(targetIdx, 0, newBlock);
      setSelectedIndex(targetIdx);
    } else {
      updated.push(newBlock);
      setSelectedIndex(updated.length - 1);
    }
    setPageBlocks(updated);
  };

  const handleCanvasDrop = (e, targetIdx = null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
    const widgetId = e.dataTransfer.getData("widgetId") || draggedWidgetId;
    const blockIdxStr = e.dataTransfer.getData("blockIndex");

    if (widgetId) {
      const widget = WIDGET_PALETTE.find(w => w.id === widgetId);
      if (widget) {
        handleAddWidget(widget, targetIdx);
        setMessage(`✨ Dropped new ${widget.name} widget onto canvas!`);
        setTimeout(() => setMessage(""), 3000);
      }
      setDraggedWidgetId(null);
    } else if (blockIdxStr !== "" && blockIdxStr !== null) {
      const fromIdx = parseInt(blockIdxStr, 10);
      if (!isNaN(fromIdx) && targetIdx !== null && fromIdx !== targetIdx) {
        const updated = [...pageBlocks];
        const [moved] = updated.splice(fromIdx, 1);
        updated.splice(targetIdx, 0, moved);
        setPageBlocks(updated);
        setSelectedIndex(targetIdx);
        setMessage(`🔄 Reordered block #${fromIdx + 1} to position #${targetIdx + 1}!`);
        setTimeout(() => setMessage(""), 3000);
      }
      setDraggedBlockIndex(null);
    }
  };

  const handleMoveBlock = (index, delta) => {
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= pageBlocks.length) return;
    const updated = [...pageBlocks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setPageBlocks(updated);
    setSelectedIndex(targetIndex);
  };

  const handleDuplicateBlock = (index) => {
    const original = pageBlocks[index];
    const duplicate = {
      ...JSON.parse(JSON.stringify(original)),
      id: "b_" + Date.now(),
    };
    const updated = [...pageBlocks];
    updated.splice(index + 1, 0, duplicate);
    setPageBlocks(updated);
    setSelectedIndex(index + 1);
  };

  const handleDeleteBlock = (index) => {
    const updated = pageBlocks.filter((_, i) => i !== index);
    setPageBlocks(updated);
    if (selectedIndex === index) setSelectedIndex(null);
    else if (selectedIndex > index) setSelectedIndex(selectedIndex - 1);
  };

  const handleUpdateSelectedBlock = (key, value) => {
    if (selectedIndex === null) return;
    const updated = [...pageBlocks];
    updated[selectedIndex] = {
      ...updated[selectedIndex],
      [key]: value,
    };
    setPageBlocks(updated);
  };

  // Freeform Mouse Dragging & Resizing Logic
  const handleMouseDownMove = (e, idx) => {
    e.stopPropagation();
    setSelectedIndex(idx);
    const targetBlock = pageBlocks[idx];
    if (targetBlock.positionMode !== "absolute") return;

    setIsMovingFree(true);
    setDragStartPos({
      x: e.clientX,
      y: e.clientY,
      initialX: parseFloat(targetBlock.posX || 0),
      initialY: parseFloat(targetBlock.posY || 0),
    });
  };

  const handleMouseDownResize = (e, idx) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedIndex(idx);
    const targetBlock = pageBlocks[idx];
    const el = e.currentTarget.parentElement;
    const currentW = el ? el.offsetWidth : 300;
    const currentH = el ? el.offsetHeight : 150;

    setIsResizing(true);
    setDragStartPos({
      x: e.clientX,
      y: e.clientY,
      initialWidth: currentW,
      initialHeight: currentH,
    });
  };

  const handleMouseMoveGlobal = (e) => {
    if (selectedIndex === null) return;

    if (isMovingFree) {
      const deltaX = e.clientX - dragStartPos.x;
      const deltaY = e.clientY - dragStartPos.y;
      const newX = Math.max(0, dragStartPos.initialX + deltaX);
      const newY = Math.max(0, dragStartPos.initialY + deltaY);

      const updated = [...pageBlocks];
      updated[selectedIndex] = {
        ...updated[selectedIndex],
        posX: Math.round(newX),
        posY: Math.round(newY),
      };
      setPageBlocks(updated);
    } else if (isResizing) {
      const deltaX = e.clientX - dragStartPos.x;
      const deltaY = e.clientY - dragStartPos.y;
      const newW = Math.max(80, dragStartPos.initialWidth + deltaX);
      const newH = Math.max(40, dragStartPos.initialHeight + deltaY);

      const updated = [...pageBlocks];
      updated[selectedIndex] = {
        ...updated[selectedIndex],
        boxWidth: `${Math.round(newW)}px`,
        boxHeight: `${Math.round(newH)}px`,
      };
      setPageBlocks(updated);
    }
  };

  const handleMouseUpGlobal = () => {
    if (isMovingFree || isResizing) {
      setIsMovingFree(false);
      setIsResizing(false);
    }
  };

  const handleFontFileUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const fontDataUrl = e.target.result;
      const customFontName = `CustomFont_${Date.now()}`;
      
      const newStyle = document.createElement("style");
      newStyle.appendChild(document.createTextNode(`
        @font-face {
          font-family: '${customFontName}';
          src: url('${fontDataUrl}');
        }
      `));
      document.head.appendChild(newStyle);

      handleUpdateSelectedBlock("fontFamily", `'${customFontName}', sans-serif`);
      handleUpdateSelectedBlock("customFontLoadedName", customFontName);
      setMessage(`✅ Uploaded custom font "${file.name}"!`);
      setTimeout(() => setMessage(""), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleImportTemplate = (template) => {
    setPageTitle(template.title);
    setSelectedSlug(template.slug);
    setPageBlocks(JSON.parse(JSON.stringify(template.blocks)));
    setSelectedIndex(null);
    setShowTemplateModal(false);
    setMessage(`✅ Imported ${template.title}! Click 'Save Layout' to publish.`);
    setTimeout(() => setMessage(""), 4000);
  };

  const filteredWidgets = WIDGET_PALETTE.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedBlock = selectedIndex !== null ? pageBlocks[selectedIndex] : null;

  const filteredPages = pagesList.filter(p =>
    (p.title || "").toLowerCase().includes(pagesSearch.toLowerCase()) ||
    (p.slug || "").toLowerCase().includes(pagesSearch.toLowerCase())
  );

  if (viewMode === "list") {
    return (
      <div style={{ minHeight: "100vh", background: "#0F0D0B", color: "#F5F0E8", padding: "32px", fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 24, color: "var(--accent)" }}>▤</span>
              <h1 style={{ fontFamily: "var(--font-serif, 'DM Serif Display')", fontSize: 28, color: "#F5F0E8", margin: 0 }}>
                Pages & CMS Builder
              </h1>
              <span style={{ background: "rgba(201, 168, 76, 0.15)", border: "1px solid var(--accent)", color: "var(--accent)", padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                {pagesList.length} Pages
              </span>
            </div>
            <p style={{ color: "var(--text2, #A8A08C)", fontSize: 14, margin: 0 }}>
              Manage all custom dynamic pages. Click <strong>Edit in Builder</strong> to customize blocks, typography, layouts, and video reels.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => setShowTemplateModal(true)}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#FFF",
                padding: "10px 18px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>▤</span> Sample Templates
            </button>

            <button
              onClick={() => setShowCreatePageModal(true)}
              style={{
                background: "linear-gradient(135deg, #C9A84C 0%, #E8D48B 50%, #C9A84C 100%)",
                color: "#000",
                border: "none",
                borderRadius: 8,
                padding: "10px 22px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(201, 168, 76, 0.35)",
              }}
            >
              + Create New Page
            </button>
          </div>
        </div>

        {message && (
          <div style={{ background: "rgba(201, 168, 76, 0.15)", border: "1px solid var(--accent)", color: "var(--accent)", padding: "10px 20px", borderRadius: 8, marginBottom: 24, fontSize: 13, fontWeight: 600 }}>
            {message}
          </div>
        )}

        {/* Search Bar */}
        <div style={{ marginBottom: 24, maxWidth: 400 }}>
          <input
            type="text"
            placeholder="Search pages by title or slug..."
            value={pagesSearch}
            onChange={(e) => setPagesSearch(e.target.value)}
            style={{
              width: "100%",
              background: "var(--surface, #171512)",
              border: "1px solid var(--border2, rgba(255,255,255,0.12))",
              color: "#FFF",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
            }}
          />
        </div>

        {/* Pages Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
          {filteredPages.map((page) => {
            const blocksCount = Array.isArray(page.blocks) ? page.blocks.length : (Array.isArray(page.layout) ? page.layout.length : 0);
            return (
              <div
                key={page.slug}
                style={{
                  background: "var(--surface, #171512)",
                  border: "1px solid var(--border, rgba(255,255,255,0.06))",
                  borderRadius: 12,
                  padding: 22,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.25s ease",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <h3 style={{ fontSize: 17, color: "#FFF", fontWeight: 700, margin: 0 }}>
                      {page.title}
                    </h3>
                    <span style={{ fontSize: 11, background: "rgba(201,168,76,0.12)", color: "var(--accent)", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
                      {blocksCount} block{blocksCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: "var(--text2, #A8A08C)", fontFamily: "monospace" }}>
                      /{page.slug}
                    </span>
                  </div>

                  <p style={{ fontSize: 12, color: "var(--text2, #A8A08C)", margin: "0 0 20px 0", lineHeight: 1.5 }}>
                    {page.createdAt ? `Created ${new Date(page.createdAt).toLocaleDateString()}` : (page.updatedAt ? `Updated ${new Date(page.updatedAt).toLocaleDateString()}` : "Custom studio page template")}
                  </p>
                </div>

                {/* Operations Footer */}
                <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border, rgba(255,255,255,0.06))", paddingTop: 14 }}>
                  <button
                    onClick={() => handleOpenEditor(page.slug)}
                    style={{
                      flex: 1,
                      background: "linear-gradient(135deg, #C9A84C 0%, #E8D48B 50%, #C9A84C 100%)",
                      color: "#000",
                      border: "none",
                      padding: "8px 0",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Edit in Builder
                  </button>

                  <a
                    href={`/${page.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: "var(--surface2, #211E1A)",
                      border: "1px solid var(--border2, rgba(255,255,255,0.12))",
                      color: "#FFF",
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ↗ View
                  </a>

                  <button
                    onClick={(e) => handleDuplicatePage(page, e)}
                    title="Duplicate Page"
                    style={{
                      background: "var(--surface2, #211E1A)",
                      border: "1px solid var(--border2, rgba(255,255,255,0.12))",
                      color: "var(--text2)",
                      padding: "8px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    ⎘
                  </button>

                  <button
                    onClick={(e) => handlePromptDelete(page.slug, page.title, e)}
                    title="Delete Page"
                    style={{
                      background: "rgba(255,62,108,0.12)",
                      border: "1px solid #FF3E6C",
                      color: "#FF3E6C",
                      padding: "8px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Confirmation Modal for Deletion */}
        {pageToDelete && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", zIndex: 4000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: "#171512", border: "1px solid rgba(255,62,108,0.4)", borderRadius: 16, padding: "28px 32px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.9)" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,62,108,0.15)", border: "1px solid #FF3E6C", color: "#FF3E6C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>
                ✕
              </div>
              
              <h3 style={{ fontSize: 20, color: "#FFF", fontWeight: 700, margin: "0 0 8px 0" }}>
                Delete Page?
              </h3>
              
              <p style={{ fontSize: 14, color: "var(--text2, #A8A08C)", lineHeight: 1.5, margin: "0 0 24px 0" }}>
                Are you sure you want to delete <strong style={{ color: "#FFF" }}>"{pageToDelete.title}"</strong> (<code style={{ color: "var(--accent)", fontSize: 12 }}>/{pageToDelete.slug}</code>)? This action cannot be undone.
              </p>

              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button
                  onClick={() => setPageToDelete(null)}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#FFF",
                    padding: "10px 18px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirmDelete}
                  style={{
                    flex: 1,
                    background: "linear-gradient(135deg, #FF3E6C 0%, #E60039 100%)",
                    border: "none",
                    color: "#FFF",
                    padding: "10px 18px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(255,62,108,0.4)",
                  }}
                >
                  Yes, Delete Page
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Page Modal */}
        {showCreatePageModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: "var(--surface, #171512)", border: "1px solid var(--border2, rgba(255,255,255,0.12))", borderRadius: 16, padding: 30, maxWidth: 500, width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, color: "var(--accent)", fontWeight: 700, margin: 0 }}>Create New Custom Page</h2>
                <button onClick={() => setShowCreatePageModal(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>&times;</button>
              </div>

              <form onSubmit={handleCreateNewPage} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2, #A8A08C)", marginBottom: 6 }}>Page Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wedding Framing Guide"
                    value={newPageTitle}
                    onChange={(e) => {
                      setNewPageTitle(e.target.value);
                      if (!newPageSlug) {
                        setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                      }
                    }}
                    style={{ width: "100%", background: "var(--surface2, #211E1A)", border: "1px solid var(--border2, rgba(255,255,255,0.12))", color: "#fff", padding: 10, borderRadius: 8, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2, #A8A08C)", marginBottom: 6 }}>URL Slug (e.g. /wedding-framing-guide)</label>
                  <input
                    type="text"
                    required
                    placeholder="wedding-framing-guide"
                    value={newPageSlug}
                    onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    style={{ width: "100%", background: "var(--surface2, #211E1A)", border: "1px solid var(--border2, rgba(255,255,255,0.12))", color: "#fff", padding: 10, borderRadius: 8, fontSize: 13, fontFamily: "monospace" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2, #A8A08C)", marginBottom: 6 }}>Initial Preset Template</label>
                  <select
                    value={newPagePreset}
                    onChange={(e) => setNewPagePreset(e.target.value)}
                    style={{ width: "100%", background: "var(--surface2, #211E1A)", border: "1px solid var(--border2, rgba(255,255,255,0.12))", color: "#fff", padding: 10, borderRadius: 8, fontSize: 13 }}
                  >
                    <option value="blank">Blank Canvas (Empty)</option>
                    {SAMPLE_TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.title} ({t.category})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
                  <button type="button" onClick={() => setShowCreatePageModal(false)} style={{ background: "none", border: "1px solid var(--border2, rgba(255,255,255,0.12))", color: "var(--text2, #A8A08C)", padding: "10px 18px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ background: "var(--accent)", color: "#000", border: "none", padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    Create & Launch Editor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Templates Importer Modal */}
        {showTemplateModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: "var(--surface, #171512)", border: "1px solid var(--border2, rgba(255,255,255,0.12))", borderRadius: 16, padding: 30, maxWidth: 840, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 22, color: "var(--accent)", fontWeight: 700, margin: 0 }}>Load Sample Template</h2>
                  <p style={{ fontSize: 13, color: "var(--text2, #A8A08C)", marginTop: 4 }}>Select a pre-designed luxury layout template to open in editor.</p>
                </div>
                <button onClick={() => setShowTemplateModal(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>&times;</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 20 }}>
                {SAMPLE_TEMPLATES.map((tpl) => (
                  <div key={tpl.id} style={{ background: "var(--surface2, #211E1A)", border: "1px solid var(--border2, rgba(255,255,255,0.12))", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 20 }}>▤</span>
                        <div>
                          <h3 style={{ fontSize: 16, color: "#fff", fontWeight: 700, margin: 0 }}>{tpl.title}</h3>
                          <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700 }}>{tpl.category}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text2, #A8A08C)", margin: "10px 0 16px" }}>
                        Includes {tpl.blocks.length} pre-formatted layout blocks.
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleImportTemplate(tpl);
                        setViewMode("editor");
                      }}
                      style={{ background: "var(--accent)", color: "#000", border: "none", padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%" }}
                    >
                      Import & Edit Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onMouseMove={handleMouseMoveGlobal}
      onMouseUp={handleMouseUpGlobal}
      style={{ height: "100vh", background: "#050403", color: "#E0D7CD", display: "flex", flexDirection: "column", fontFamily: "var(--font-serif)", overflow: "hidden", userSelect: (isMovingFree || isResizing) ? "none" : "auto" }}
    >
      
      {/* ELEGANT STUDIO CONTROL BAR */}
      <header style={{
        height: "72px",
        minHeight: "72px",
        background: "rgba(13, 10, 7, 0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(201, 168, 76, 0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        zIndex: 200,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.6)"
      }}>
        {/* LEFT GROUP */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={() => setViewMode("list")}
            style={{
              color: "var(--accent)",
              border: "1px solid var(--accent)",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(201, 168, 76, 0.1)",
              padding: "8px 16px",
              borderRadius: "20px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            ← All Pages
          </button>

          <button
            onClick={() => setLeftOpen(!leftOpen)}
            style={{
              background: leftOpen ? "rgba(201, 168, 76, 0.18)" : "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${leftOpen ? "var(--accent)" : "rgba(255, 255, 255, 0.15)"}`,
              color: leftOpen ? "var(--accent)" : "#FFF",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s ease"
            }}
          >
            <span>❖</span> {leftOpen ? "Hide Palette" : "Show Palette"}
          </button>
        </div>

        {/* CENTER GROUP: ACTIVE PAGE SELECTOR & NEW PAGE BUTTON */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(20, 15, 10, 0.85)", border: "1px solid rgba(201, 168, 76, 0.35)", padding: "6px 14px", borderRadius: "30px", boxShadow: "0 4px 15px rgba(0,0,0,0.5)" }}>
          <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 700 }}>
            PAGE:
          </span>
          <select
            value={selectedSlug}
            onChange={(e) => {
              if (e.target.value === "__create_new__") {
                setShowCreatePageModal(true);
              } else {
                handleSelectPage(e.target.value);
              }
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "#FFF",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              outline: "none",
              maxWidth: 280,
              textOverflow: "ellipsis"
            }}
          >
            <option value="__create_new__" style={{ background: "#1C150C", color: "var(--accent)", fontWeight: 700 }}>
              + Create New Custom Page...
            </option>
            {pagesList.map(p => (
              <option key={p.slug} value={p.slug} style={{ background: "#110D09", color: "#FFF" }}>
                {p.title} (/{p.slug})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCreatePageModal(true)}
            style={{
              background: "var(--accent)",
              color: "#000",
              border: "none",
              borderRadius: "16px",
              padding: "5px 14px",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(201,168,76,0.3)"
            }}
          >
            + Create New Page
          </button>
        </div>

        {/* RIGHT GROUP */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setShowTemplateModal(true)}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              color: "var(--accent)",
              border: "1px solid rgba(201, 168, 76, 0.3)",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>▤</span> Templates
          </button>

          <a
            href={`/${selectedSlug}`}
            target="_blank"
            rel="noreferrer"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              color: "#FFF",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: 12,
              textDecoration: "none",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>↗</span> Live Page
          </a>

          <button
            onClick={() => setRightOpen(!rightOpen)}
            style={{
              background: rightOpen ? "rgba(201, 168, 76, 0.18)" : "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${rightOpen ? "var(--accent)" : "rgba(255, 255, 255, 0.15)"}`,
              color: rightOpen ? "var(--accent)" : "#FFF",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>⚙</span> {rightOpen ? "Hide Inspector" : "Inspector"}
          </button>

          <button
            onClick={handleSavePage}
            disabled={saving}
            style={{
              background: "linear-gradient(135deg, #C9A84C 0%, #E8D48B 50%, #C9A84C 100%)",
              color: "#000",
              border: "none",
              padding: "9px 24px",
              borderRadius: "20px",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(201, 168, 76, 0.4)",
              letterSpacing: "0.03em"
            }}
          >
            {saving ? "Publishing..." : "Save Layout"}
          </button>
        </div>
      </header>

      {message && (
        <div style={{ background: "rgba(201, 168, 76, 0.15)", borderBottom: "1px solid var(--accent)", color: "var(--accent)", padding: "8px 24px", fontSize: 12, textAlign: "center", fontWeight: 600 }}>
          {message}
        </div>
      )}

      {/* 3-PANE WORKSPACE */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        
        {/* LEFT PANE: WIDGET PALETTE WITH DRAGGABLE WIDGETS */}
        {leftOpen && (
          <aside style={{ width: "300px", minWidth: "300px", background: "#0A0805", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden", transition: "all 0.3s ease" }}>
            <div style={{ padding: 16, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)", margin: 0, fontWeight: 700 }}>
                Widgets Palette
              </h3>
              <button onClick={() => setLeftOpen(false)} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 14 }}>◀</button>
            </div>
            <div style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>
              <input
                type="text"
                placeholder="Search widgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", background: "#14100B", border: "1px solid var(--border2)", color: "#FFF", padding: "8px 12px", borderRadius: 6, fontSize: 12 }}
              />
              <span style={{ fontSize: 10, color: "var(--text2)", display: "block", marginTop: 4 }}>Click or Drag & Drop widgets onto canvas</span>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredWidgets.map((widget) => (
                <div
                  key={widget.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("widgetId", widget.id);
                    setDraggedWidgetId(widget.id);
                  }}
                  onClick={() => handleAddWidget(widget)}
                  style={{
                    background: "#14100B",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: 12,
                    textAlign: "left",
                    cursor: "grab",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    userSelect: "none"
                  }}
                >
                  <span style={{ fontSize: 20 }}>{widget.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, color: "#FFF", fontWeight: 600 }}>{widget.name}</div>
                    <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 2 }}>{widget.category} • Drag Me</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* CENTER PANE: SPACIOUS LIVE VISUAL CANVAS DROP TARGET */}
        <main
          ref={canvasRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleCanvasDrop(e)}
          style={{ flex: 1, background: "#050403", backgroundImage: "radial-gradient(rgba(201, 168, 76, 0.08) 1px, transparent 1px)", backgroundSize: "24px 24px", overflowY: "auto", padding: "40px 60px", position: "relative" }}
        >
          <div style={{ maxWidth: "1100px", margin: "0 auto", minHeight: "850px", background: "#080605", border: "1px solid var(--border)", borderRadius: 16, padding: "40px 30px", boxShadow: "0 20px 50px rgba(0,0,0,0.8)", position: "relative", overflow: "hidden" }}>
            
            {/* Signature Floating Animated Background Liquid Blobs */}
            <div className="canvas-liquid-blob-1" />
            <div className="canvas-liquid-blob-2" />

            <style dangerouslySetInnerHTML={{
              __html: `
              .canvas-liquid-blob-1 {
                position: absolute;
                top: -10%;
                left: 10%;
                width: 500px;
                height: 500px;
                background: radial-gradient(circle, rgba(181, 139, 92, 0.22) 0%, rgba(139, 94, 60, 0) 70%);
                border-radius: 43% 57% 51% 49% / 57% 40% 60% 43%;
                animation: liquid-move-1 25s infinite alternate ease-in-out;
                pointer-events: none;
                z-index: 0;
              }
              .canvas-liquid-blob-2 {
                position: absolute;
                bottom: -15%;
                right: 5%;
                width: 550px;
                height: 550px;
                background: radial-gradient(circle, rgba(139, 94, 60, 0.2) 0%, rgba(201, 168, 76, 0) 70%);
                border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%;
                animation: liquid-move-2 30s infinite alternate ease-in-out;
                pointer-events: none;
                z-index: 0;
              }
              @keyframes liquid-move-1 {
                0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                33% { transform: translate(60px, -40px) scale(1.15) rotate(45deg); }
                66% { transform: translate(-30px, 60px) scale(0.9) rotate(90deg); }
                100% { transform: translate(0, 0) scale(1) rotate(180deg); }
              }
              @keyframes liquid-move-2 {
                0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                50% { transform: translate(-80px, 40px) scale(1.2) rotate(120deg); }
                100% { transform: translate(50px, -50px) scale(0.9) rotate(-60deg); }
              }
            ` }} />

            {/* Authentic Yaadein Suspended Brass Picture Lamp Hero Banner Preview */}
            <div style={{
              position: "relative",
              padding: "70px 20px 40px",
              background: "linear-gradient(to bottom, #14110E 0%, #080605 100%)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              marginBottom: 40,
              overflow: "hidden",
              zIndex: 2,
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)"
            }}>
              {/* Suspended Lamp Graphics */}
              <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", width: 240, marginBottom: 15, zIndex: 20 }}>
                {/* Rod */}
                <div style={{ width: 4, height: 60, background: "linear-gradient(to right, #403014, #9c7f47 50%, #2b1f0d)", boxShadow: "1px 0 3px rgba(0,0,0,0.4)" }} />
                {/* Mount */}
                <div style={{ width: 28, height: 14, background: "linear-gradient(135deg, #2b1f0d, #8f723b 40%, #dfc38a 60%, #5e461b)", border: "1px solid #1a1205", borderRadius: 2 }} />
                {/* Arm */}
                <div style={{ width: 5, height: 32, background: "linear-gradient(to right, #403014, #9c7f47 50%, #2b1f0d)" }} />
                {/* Head */}
                <div style={{ width: 280, height: 18, background: "linear-gradient(to bottom, #362710 0%, #8f723b 25%, #dfc38a 45%, #fae7b5 55%, #8f723b 75%, #362710 100%)", border: "1px solid #1a1205", borderRadius: 10, position: "relative", boxShadow: "0 6px 14px rgba(0,0,0,0.6)" }}>
                  {/* Bulb */}
                  <div style={{ position: "absolute", bottom: 0, left: "15%", right: "15%", height: 3, background: "#fff", borderRadius: 2, boxShadow: "0 0 10px 3px #fae7b5, 0 0 20px 6px #fae7b5" }} />
                </div>
                {/* Ambient Light Beam Glow */}
                <div style={{ position: "absolute", top: 110, left: "50%", transform: "translateX(-50%)", width: 450, height: 300, background: "radial-gradient(ellipse at top, rgba(255, 238, 180, 0.28) 0%, rgba(255, 238, 180, 0.1) 40%, transparent 70%)", filter: "blur(20px)", pointerEvents: "none", zIndex: 5 }} />
              </div>

              <div style={{ position: "relative", zIndex: 10 }}>
                <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 700 }}>
                  Yaadein Studio Page
                </span>
                <h1 style={{ fontFamily: "var(--font-display, 'Cinzel', serif)", fontSize: 36, color: "#FFF", margin: "8px 0 6px" }}>
                  {pageTitle}
                </h1>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--text2)", maxWidth: 550, margin: "0 auto", lineHeight: 1.6 }}>
                  Custom page layout built inside Yaadein Elementor Studio.
                </p>
              </div>

              {/* Studio Light Switch Pill */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(20, 15, 10, 0.85)", border: "1px solid rgba(201, 168, 76, 0.3)", padding: "6px 16px", borderRadius: 25, zIndex: 10 }}>
                <span style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--accent)", textTransform: "uppercase", fontWeight: 700 }}>
                  Studio Light
                </span>
                <div style={{ width: 36, height: 18, background: "var(--accent)", borderRadius: 10, position: "relative" }}>
                  <div style={{ width: 14, height: 14, background: "#000", borderRadius: "50%", position: "absolute", top: 2, right: 2 }} />
                </div>
              </div>
            </div>

            {/* Dropped Layout Blocks */}
            {pageBlocks.length > 0 ? (
              pageBlocks.map((block, idx) => {
                const isSelected = selectedIndex === idx;
                const isDragOver = dragOverIndex === idx;
                const textColor = block.textColor || "#C9A84C";
                const fontFamily = block.fontFamily || "inherit";
                const fontStyle = block.fontStyle || "normal";
                const textDecoration = block.textDecoration || "none";
                const textTransform = block.textTransform || "none";

                // Layout Flow & Sizing Math
                const isAbsolute = block.positionMode === "absolute";
                const displayMode = block.displayMode || "block";
                const isInline = displayMode === "inline-50" || displayMode === "inline-33" || (block.boxWidth && block.boxWidth !== "100%" && block.boxWidth !== "auto");
                
                const boxWidth = block.boxWidth || (displayMode === "inline-50" ? "48%" : displayMode === "inline-33" ? "31%" : "100%");
                const boxHeight = block.boxHeight || "auto";
                const mLeft = block.marginLeft !== undefined && block.marginLeft !== "" ? `${block.marginLeft}px` : (block.boxAlign === "center" ? "auto" : block.boxAlign === "right" ? "auto" : "0");
                const mRight = block.marginRight !== undefined && block.marginRight !== "" ? `${block.marginRight}px` : (block.boxAlign === "center" ? "auto" : block.boxAlign === "left" ? "auto" : "0");

                const wrapperStyle = {
                  position: isAbsolute ? "absolute" : "relative",
                  left: isAbsolute ? `${block.posX || 0}px` : "auto",
                  top: isAbsolute ? `${block.posY || 0}px` : "auto",
                  display: isAbsolute ? "block" : (isInline ? "inline-block" : "block"),
                  verticalAlign: "top",
                  boxSizing: "border-box",
                  width: boxWidth,
                  height: boxHeight,
                  marginTop: isAbsolute ? 0 : `${block.marginTop || 0}px`,
                  marginBottom: isAbsolute ? 0 : `${block.marginBottom || 20}px`,
                  marginLeft: isAbsolute ? 0 : mLeft,
                  marginRight: isAbsolute ? 0 : mRight,
                  paddingTop: `${block.paddingTop || 10}px`,
                  paddingBottom: `${block.paddingBottom || 10}px`,
                  paddingLeft: `${block.paddingLeft || 10}px`,
                  paddingRight: `${block.paddingRight || 10}px`,
                  background: block.bgColor === "transparent" ? "transparent" : (block.bgColor || (block.bgGradient ? block.bgGradient : "transparent")),
                  backdropFilter: block.backdropBlur ? `blur(${block.backdropBlur}px)` : "none",
                  borderStyle: block.borderStyle || "none",
                  borderWidth: `${block.borderWidth || 1}px`,
                  borderColor: block.borderColor || "transparent",
                  borderRadius: `${block.borderRadius || 0}px`,
                  boxShadow: block.shadow || "none",
                  opacity: block.opacity ? parseFloat(block.opacity) : 1,
                  outline: isDragOver ? "3px solid #FFD700" : isSelected ? "2px solid var(--accent)" : "1px dashed rgba(255,255,255,0.1)",
                  outlineOffset: "4px",
                  cursor: isAbsolute ? "move" : "grab",
                  transition: isMovingFree || isResizing ? "none" : "all 0.2s ease",
                  zIndex: isSelected ? 50 : 2,
                };

                return (
                  <div
                    key={block.id || idx}
                    draggable={!isAbsolute}
                    onMouseDown={(e) => isAbsolute && handleMouseDownMove(e, idx)}
                    onDragStart={(e) => {
                      if (!isAbsolute) {
                        e.dataTransfer.setData("blockIndex", idx.toString());
                        setDraggedBlockIndex(idx);
                      }
                    }}
                    onDragOver={(e) => {
                      if (!isAbsolute) {
                        e.preventDefault();
                        setDragOverIndex(idx);
                      }
                    }}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDrop={(e) => !isAbsolute && handleCanvasDrop(e, idx)}
                    style={wrapperStyle}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    
                    {/* Floating Block Toolbar */}
                    {isSelected && (
                      <div style={{ position: "absolute", top: -32, right: 0, background: "var(--accent)", color: "#000", padding: "3px 12px", borderRadius: "6px 6px 0 0", fontSize: 11, fontWeight: 700, display: "flex", gap: 10, alignItems: "center", zIndex: 100 }}>
                        <span>Selected #{idx + 1} ({block.type}) {isAbsolute ? "📍 Freeform Drag" : ""}</span>
                        <button onClick={(e) => { e.stopPropagation(); handleMoveBlock(idx, -1); }} style={{ background: "none", border: "none", cursor: "pointer" }}>▲</button>
                        <button onClick={(e) => { e.stopPropagation(); handleMoveBlock(idx, 1); }} style={{ background: "none", border: "none", cursor: "pointer" }}>▼</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDuplicateBlock(idx); }} style={{ background: "none", border: "none", cursor: "pointer" }}>📋</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteBlock(idx); }} style={{ background: "none", border: "none", cursor: "pointer" }}>🗑️</button>
                      </div>
                    )}

                    {/* CORNER RESIZE HANDLE (↘) */}
                    {isSelected && (
                      <div
                        onMouseDown={(e) => handleMouseDownResize(e, idx)}
                        style={{
                          position: "absolute",
                          bottom: -6,
                          right: -6,
                          width: 16,
                          height: 16,
                          background: "var(--accent)",
                          border: "2px solid #000",
                          borderRadius: "50%",
                          cursor: "se-resize",
                          zIndex: 110,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.8)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 8,
                          color: "#000",
                          fontWeight: 900
                        }}
                      >
                        ↘
                      </div>
                    )}

                    {/* RENDERERS */}
                    {block.type === "heading" && (
                      <h2 style={{ fontFamily, fontSize: `${block.fontSize || 36}px`, color: textColor, textAlign: block.textAlign || "center", fontWeight: block.fontWeight || "700", fontStyle, textDecoration, textTransform, letterSpacing: `${block.letterSpacing || 0}px`, lineHeight: block.lineHeight || "1.3", textShadow: block.textShadow || "none", margin: 0 }}>
                        {block.text}
                      </h2>
                    )}

                    {block.type === "paragraph" && (
                      <p style={{ fontFamily, fontSize: `${block.fontSize || 16}px`, color: textColor, textAlign: block.textAlign || "left", fontWeight: block.fontWeight || "400", fontStyle, textDecoration, textTransform, letterSpacing: `${block.letterSpacing || 0}px`, lineHeight: block.lineHeight || "1.8", textShadow: block.textShadow || "none", margin: 0 }}>
                        {block.text}
                      </p>
                    )}

                    {block.type === "row-2col" && (
                      <div style={{ display: "grid", gridTemplateColumns: block.colRatio || "1fr 1fr", gap: `${block.gap || 24}px`, alignItems: block.verticalAlign || "center" }}>
                        <div style={{ background: "rgba(20, 12, 6, 0.6)", padding: 20, borderRadius: 10, border: "1px solid var(--border)" }}>
                          <span style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700 }}>LEFT COLUMN (50%)</span>
                          {block.col1Type === "image" ? (
                            <img src={block.col1Image || "/images/bespoke_framing.png"} alt="Left Media" style={{ width: "100%", borderRadius: 8, height: 180, objectFit: "cover", marginTop: 8 }} />
                          ) : (
                            <div style={{ marginTop: 8 }}>
                              {block.col1Title && <h4 style={{ fontSize: 18, color: textColor, margin: "0 0 6px 0" }}>{block.col1Title}</h4>}
                              <p style={{ fontSize: 13, color: "var(--text2)", margin: 0 }}>{block.col1Body}</p>
                            </div>
                          )}
                        </div>
                        <div style={{ background: "rgba(20, 12, 6, 0.6)", padding: 20, borderRadius: 10, border: "1px solid var(--border)" }}>
                          <span style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700 }}>RIGHT COLUMN (50%)</span>
                          {block.col2Type === "image" ? (
                            <img src={block.col2Image || "/images/bespoke_framing.png"} alt="Right Media" style={{ width: "100%", borderRadius: 8, height: 180, objectFit: "cover", marginTop: 8 }} />
                          ) : (
                            <div style={{ marginTop: 8 }}>
                              {block.col2Title && <h4 style={{ fontSize: 18, color: textColor, margin: "0 0 6px 0" }}>{block.col2Title}</h4>}
                              <p style={{ fontSize: 13, color: "var(--text2)", margin: 0 }}>{block.col2Body}</p>
                              {block.col2ButtonText && <span style={{ display: "inline-block", background: textColor, color: "#000", fontWeight: 700, padding: "8px 20px", borderRadius: 6, fontSize: 12, marginTop: 10 }}>{block.col2ButtonText}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {block.type === "row-3col" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: `${block.gap || 20}px` }}>
                        <div style={{ background: "rgba(20, 12, 6, 0.6)", padding: 16, borderRadius: 10, textAlign: "center" }}>
                          <h5 style={{ color: textColor, fontSize: 16 }}>{block.col1Title}</h5>
                          <p style={{ fontSize: 13, color: "var(--text2)" }}>{block.col1Body}</p>
                        </div>
                        <div style={{ background: "rgba(20, 12, 6, 0.6)", padding: 16, borderRadius: 10, textAlign: "center" }}>
                          <h5 style={{ color: textColor, fontSize: 16 }}>{block.col2Title}</h5>
                          <p style={{ fontSize: 13, color: "var(--text2)" }}>{block.col2Body}</p>
                        </div>
                        <div style={{ background: "rgba(20, 12, 6, 0.6)", padding: 16, borderRadius: 10, textAlign: "center" }}>
                          <h5 style={{ color: textColor, fontSize: 16 }}>{block.col3Title}</h5>
                          <p style={{ fontSize: 13, color: "var(--text2)" }}>{block.col3Body}</p>
                        </div>
                      </div>
                    )}

                    {block.type === "image" && (
                      <div style={{ textAlign: "center" }}>
                        <img src={block.url || "/images/bespoke_framing.png"} alt="Widget" style={{ maxWidth: block.width || "100%", borderRadius: `${block.borderRadius || 8}px`, border: `${block.borderWidth || 1}px ${block.borderStyle || "solid"} ${block.borderColor || "transparent"}`, objectFit: block.objectFit || "cover" }} />
                        {block.caption && <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 8 }}>{block.caption}</p>}
                      </div>
                    )}

                    {block.type === "video" && (
                      <div style={{ textAlign: "center" }}>
                        <video src={block.url || "/videos/reel1.mp4"} controls style={{ width: "100%", maxHeight: 350, borderRadius: `${block.borderRadius || 12}px`, background: "#000" }} />
                        {block.caption && <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 8 }}>{block.caption}</p>}
                      </div>
                    )}

                    {block.type === "button" && (
                      <div style={{ textAlign: block.alignment || "center" }}>
                        <span style={{ display: "inline-block", background: block.btnColor || textColor, color: block.textColor || "#000", fontFamily, fontWeight: block.fontWeight || "700", fontSize: `${block.fontSize || 14}px`, padding: `${block.paddingTop || 14}px ${block.paddingRight || 32}px`, borderRadius: `${block.borderRadius || 8}px` }}>
                          {block.text} {block.iconName === "arrow" ? "→" : block.iconName === "star" ? "✦" : ""}
                        </span>
                      </div>
                    )}

                    {block.type === "cta-banner" && (
                      <div style={{ background: block.bgGradient || "linear-gradient(135deg, rgba(201, 168, 76, 0.2) 0%, rgba(20, 12, 6, 0.9) 100%)", border: `1px solid ${textColor}`, borderRadius: 16, padding: 40, textAlign: "center" }}>
                        <h3 style={{ fontFamily, fontSize: 30, color: textColor, marginBottom: 10 }}>{block.title}</h3>
                        <p style={{ color: "var(--text2)", fontSize: 15, marginBottom: 20 }}>{block.subtitle}</p>
                        <span style={{ display: "inline-block", background: textColor, color: "#000", fontWeight: 700, padding: "12px 28px", borderRadius: 8, fontSize: 13 }}>{block.buttonText}</span>
                      </div>
                    )}

                    {block.type === "testimonial" && (
                      <div style={{ background: "rgba(28, 15, 7, 0.6)", border: "1px solid rgba(201, 168, 76, 0.2)", borderRadius: 12, padding: 24 }}>
                        <div style={{ color: textColor, fontSize: 18, marginBottom: 8 }}>{"★".repeat(parseInt(block.rating || "5"))}</div>
                        <p style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: "#fff", fontStyle: "italic", marginBottom: 12 }}>"{block.quote}"</p>
                        <div style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{block.name} ({block.location})</div>
                      </div>
                    )}

                    {block.type === "faq" && (
                      <div style={{ background: "rgba(20, 12, 6, 0.7)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                        <div style={{ fontWeight: 600, color: textColor, fontSize: 15 }}>❓ {block.question}</div>
                        <div style={{ fontSize: 14, color: "var(--text2)", marginTop: 6 }}>{block.answer}</div>
                      </div>
                    )}

                    {block.type === "pricing" && (
                      <div style={{ background: "rgba(201, 168, 76, 0.15)", border: `1px solid ${textColor}`, borderRadius: 16, padding: 28, textAlign: "center" }}>
                        {block.ribbonBadge && <span style={{ background: textColor, color: "#000", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4 }}>{block.ribbonBadge}</span>}
                        <h4 style={{ fontSize: 20, color: "#fff", marginTop: 6 }}>{block.title}</h4>
                        <div style={{ fontSize: 32, fontWeight: 700, color: textColor, margin: "8px 0" }}>{block.currency || "Rs."} {block.price}</div>
                        <span style={{ display: "inline-block", background: textColor, color: "#000", fontWeight: 700, padding: "10px 24px", borderRadius: 8, fontSize: 13, marginTop: 12 }}>{block.buttonText}</span>
                      </div>
                    )}

                    {block.type === "divider" && (
                      <div style={{ padding: "10px 0", display: "flex", alignItems: "center" }}>
                        <div style={{ width: "100%", height: parseInt(block.height || "1"), background: textColor }} />
                      </div>
                    )}

                    {block.type === "spacer" && (
                      <div style={{ height: parseInt(block.height || "40"), background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--text2)" }}>
                        Spacer Gap ({block.height || 40}px)
                      </div>
                    )}

                    {block.type === "video-reels" && (() => {
                      const reelsList = Array.isArray(block.reels) ? block.reels : [];
                      const isCarousel = block.layout === "carousel";
                      const cols = parseInt(block.columns || "2");
                      return (
                        <div style={{ background: "rgba(20, 12, 6, 0.5)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                          <div style={{ textAlign: "center", marginBottom: 16 }}>
                            <span style={{ fontSize: 10, color: textColor, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>{block.sectionTitle || "Our Work in Motion"}</span>
                            {block.sectionSubtitle && <p style={{ fontSize: 12, color: "var(--text2)", margin: "4px 0 0" }}>{block.sectionSubtitle}</p>}
                          </div>
                          
                          {isCarousel ? (
                            <div style={{ display: "flex", gap: 12, overflow: "hidden", justifyContent: reelsList.length <= 3 ? "center" : "flex-start" }}>
                              {reelsList.map((reel, rIdx) => (
                                <div key={reel.id || rIdx} style={{ flex: "0 0 160px", background: "#000", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", position: "relative", height: 220, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 8, textAlign: "center" }}>
                                  <span style={{ fontSize: 18, color: "var(--accent)" }}>❖</span>
                                  <span style={{ fontSize: 11, color: "#fff", fontWeight: 600, marginTop: 4 }}>Instagram Reel</span>
                                  <span style={{ fontSize: 9, color: "var(--text2)", maxWidth: "100%", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", marginTop: 2, display: "block" }}>{reel.instagramUrl || "No URL"}</span>
                                  {reel.featured && (
                                    <span style={{ position: "absolute", top: 6, right: 6, background: "var(--accent)", color: "#000", fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 10 }}>FEATURED</span>
                                  )}
                                  {reel.caption && (
                                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.85)", padding: "4px 6px", fontSize: 8, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{reel.caption}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, justifyContent: "center" }}>
                              {reelsList.map((reel, rIdx) => (
                                <div key={reel.id || rIdx} style={{ background: "#000", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", position: "relative", minHeight: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 8, textAlign: "center" }}>
                                  <span style={{ fontSize: 18, color: "var(--accent)" }}>❖</span>
                                  <span style={{ fontSize: 11, color: "#fff", fontWeight: 600, marginTop: 4 }}>Instagram Reel</span>
                                  <span style={{ fontSize: 9, color: "var(--text2)", maxWidth: "90%", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", marginTop: 2, display: "block" }}>{reel.instagramUrl || "No URL"}</span>
                                  {reel.featured && (
                                    <span style={{ position: "absolute", top: 6, right: 6, background: "var(--accent)", color: "#000", fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 10 }}>FEATURED</span>
                                  )}
                                  {reel.caption && (
                                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.85)", padding: "4px 6px", fontSize: 8, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{reel.caption}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={{ textAlign: "center", marginTop: 12, fontSize: 10, color: "var(--accent)", fontWeight: 600 }}>
                            {reelsList.length} Reel{reelsList.length !== 1 ? "s" : ""} • {isCarousel ? "Carousel (Horizontal Row with Arrow Navigation)" : `Grid Layout (${cols} Columns)`}
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                );
              })
            ) : (
              <div style={{ padding: "100px 20px", textAlign: "center", color: "var(--text2)" }}>
                <h3>Your Canvas is Empty</h3>
                <p style={{ fontSize: 14, marginTop: 8 }}>Drag & drop any widget from the left palette or click it to add it to your layout.</p>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT PANE: COLLAPSIBLE INSPECTOR */}
        {rightOpen && (
          <aside style={{ width: "340px", minWidth: "340px", background: "#0A0805", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden", transition: "all 0.3s ease" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)", margin: 0, fontWeight: 700 }}>
                ⚙️ Inspector: {selectedBlock ? selectedBlock.type : "Select Block"}
              </h3>
              <button onClick={() => setRightOpen(false)} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 14 }}>▶</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {selectedBlock ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  
                  {/* INSPECTOR SUB-TABS */}
                  <div style={{ display: "flex", background: "#14100B", padding: 3, borderRadius: 6, border: "1px solid var(--border)" }}>
                    {["content", "typography", "style", "spacing"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveInspectorTab(tab)}
                        style={{
                          flex: 1,
                          background: activeInspectorTab === tab ? "var(--accent)" : "none",
                          color: activeInspectorTab === tab ? "#000" : "#fff",
                          border: "none",
                          padding: "6px 4px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          textTransform: "capitalize"
                        }}
                      >
                        {tab === "style" ? "Box Style" : tab}
                      </button>
                    ))}
                  </div>

                  {/* TAB 1: CONTENT & SPECIFIC ENTITIES */}
                  {activeInspectorTab === "content" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      
                      {selectedBlock.type === "heading" && (
                        <>
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>HTML Heading Tag</label>
                            <select
                              value={selectedBlock.tag || "h2"}
                              onChange={(e) => handleUpdateSelectedBlock("tag", e.target.value)}
                              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                            >
                              <option value="h1">H1 (Main Title)</option>
                              <option value="h2">H2 (Section Header)</option>
                              <option value="h3">H3 (Sub Header)</option>
                              <option value="h4">H4 (Minor Title)</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Headline Text String</label>
                            <textarea
                              value={selectedBlock.text || ""}
                              onChange={(e) => handleUpdateSelectedBlock("text", e.target.value)}
                              rows={3}
                              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                            />
                          </div>
                        </>
                      )}

                      {selectedBlock.type === "paragraph" && (
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Paragraph Text Content</label>
                          <textarea
                            value={selectedBlock.text || ""}
                            onChange={(e) => handleUpdateSelectedBlock("text", e.target.value)}
                            rows={5}
                            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                          />
                        </div>
                      )}

                      {selectedBlock.type === "image" && (
                        <>
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 4 }}>Select Image File (Local Storage)</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (evt) => {
                                    handleUpdateSelectedBlock("url", evt.target.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 11 }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Caption Text</label>
                            <input
                              type="text"
                              value={selectedBlock.caption || ""}
                              onChange={(e) => handleUpdateSelectedBlock("caption", e.target.value)}
                              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                            />
                          </div>
                        </>
                      )}

                      {selectedBlock.type === "video" && (
                        <>
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 4 }}>Select Video File (Local Storage)</label>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (evt) => {
                                    handleUpdateSelectedBlock("url", evt.target.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 11 }}
                            />
                          </div>
                        </>
                      )}

                      {selectedBlock.type === "video-reels" && (() => {
                        const reelsList = Array.isArray(selectedBlock.reels) ? selectedBlock.reels : [];
                        const isCarousel = (selectedBlock.layout || "carousel") === "carousel";

                        const updateReelField = (rIdx, field, value) => {
                          const updated = [...reelsList];
                          updated[rIdx] = { ...updated[rIdx], [field]: value };
                          handleUpdateSelectedBlock("reels", updated);
                        };

                        const addReel = () => {
                          const updated = [...reelsList, { id: `r_${Date.now()}`, instagramUrl: "", caption: "", featured: false }];
                          handleUpdateSelectedBlock("reels", updated);
                        };

                        const deleteReel = (rIdx) => {
                          handleUpdateSelectedBlock("reels", reelsList.filter((_, i) => i !== rIdx));
                        };

                        const moveReel = (rIdx, delta) => {
                          const tgt = rIdx + delta;
                          if (tgt < 0 || tgt >= reelsList.length) return;
                          const updated = [...reelsList];
                          [updated[rIdx], updated[tgt]] = [updated[tgt], updated[rIdx]];
                          handleUpdateSelectedBlock("reels", updated);
                        };

                        return (
                          <>
                            {/* Section Header */}
                            <div>
                              <label style={{ display: "block", fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 2 }}>Section Title</label>
                              <input
                                type="text"
                                value={selectedBlock.sectionTitle || ""}
                                onChange={(e) => handleUpdateSelectedBlock("sectionTitle", e.target.value)}
                                style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                              />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Section Subtitle</label>
                              <input
                                type="text"
                                value={selectedBlock.sectionSubtitle || ""}
                                onChange={(e) => handleUpdateSelectedBlock("sectionSubtitle", e.target.value)}
                                style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                              />
                            </div>

                            {/* Layout & Columns */}
                            <div style={{ display: "grid", gridTemplateColumns: isCarousel ? "1fr" : "1fr 1fr", gap: 10 }}>
                              <div>
                                <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Layout Mode</label>
                                <select
                                  value={selectedBlock.layout || "carousel"}
                                  onChange={(e) => handleUpdateSelectedBlock("layout", e.target.value)}
                                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                                >
                                  <option value="carousel">Horizontal Carousel (Scroll Buttons)</option>
                                  <option value="grid">Fixed Column Grid</option>
                                </select>
                              </div>
                              {!isCarousel && (
                                <div>
                                  <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Grid Columns</label>
                                  <select
                                    value={selectedBlock.columns || "2"}
                                    onChange={(e) => handleUpdateSelectedBlock("columns", e.target.value)}
                                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                                  >
                                    <option value="1">1 Column</option>
                                    <option value="2">2 Columns</option>
                                    <option value="3">3 Columns</option>
                                    <option value="4">4 Columns</option>
                                  </select>
                                </div>
                              )}
                            </div>

                            {/* Reels CRUD List */}
                            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700 }}>Instagram Reels ({reelsList.length})</span>
                                <button
                                  onClick={addReel}
                                  style={{ background: "var(--accent)", color: "#000", border: "none", padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                                >
                                  + Add Reel
                                </button>
                              </div>

                              {reelsList.map((reel, rIdx) => (
                                <div key={reel.id || rIdx} style={{ background: "rgba(201,168,76,0.08)", border: "1px solid var(--border)", borderRadius: 8, padding: 10, marginBottom: 10 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                    <span style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700 }}>Reel #{rIdx + 1}</span>
                                    <div style={{ display: "flex", gap: 4 }}>
                                      <button onClick={() => moveReel(rIdx, -1)} disabled={rIdx === 0} style={{ background: "none", border: "1px solid var(--border)", color: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 10, cursor: "pointer" }}>▲</button>
                                      <button onClick={() => moveReel(rIdx, 1)} disabled={rIdx === reelsList.length - 1} style={{ background: "none", border: "1px solid var(--border)", color: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 10, cursor: "pointer" }}>▼</button>
                                      <button onClick={() => deleteReel(rIdx)} style={{ background: "rgba(255,62,108,0.15)", border: "1px solid #FF3E6C", color: "#FF3E6C", padding: "2px 8px", borderRadius: 4, fontSize: 10, cursor: "pointer" }}>✕</button>
                                    </div>
                                  </div>

                                  {/* Link Input */}
                                  <div style={{ marginBottom: 6 }}>
                                    <label style={{ display: "block", fontSize: 10, color: "var(--text2)", marginBottom: 2 }}>Instagram Reel URL</label>
                                    <input
                                      type="text"
                                      placeholder="https://www.instagram.com/reel/..."
                                      value={reel.instagramUrl || ""}
                                      onChange={(e) => updateReelField(rIdx, "instagramUrl", e.target.value)}
                                      style={{ width: "100%", background: "#0A0805", border: "1px solid var(--border)", color: "#fff", padding: 5, borderRadius: 4, fontSize: 11, fontFamily: "monospace" }}
                                    />
                                  </div>

                                  {/* Caption */}
                                  <div style={{ marginBottom: 6 }}>
                                    <label style={{ display: "block", fontSize: 10, color: "var(--text2)", marginBottom: 2 }}>Caption (Optional)</label>
                                    <input
                                      type="text"
                                      placeholder="Behind the scenes at Yaadein Studio..."
                                      value={reel.caption || ""}
                                      onChange={(e) => updateReelField(rIdx, "caption", e.target.value)}
                                      style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 5, borderRadius: 4, fontSize: 11 }}
                                    />
                                  </div>

                                  {/* Featured Toggle */}
                                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--accent)", fontWeight: 600, cursor: "pointer" }}>
                                    <input
                                      type="checkbox"
                                      checked={!!reel.featured}
                                      onChange={(e) => updateReelField(rIdx, "featured", e.target.checked)}
                                    />
                                    Mark as Featured
                                  </label>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                      {selectedBlock.type === "button" && (
                        <>
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Button Label</label>
                            <input
                              type="text"
                              value={selectedBlock.text || ""}
                              onChange={(e) => handleUpdateSelectedBlock("text", e.target.value)}
                              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Button Link Target</label>
                            <input
                              type="text"
                              value={selectedBlock.link || ""}
                              onChange={(e) => handleUpdateSelectedBlock("link", e.target.value)}
                              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                            />
                          </div>
                        </>
                      )}

                      {selectedBlock.type === "row-2col" && (
                        <>
                          <div style={{ background: "rgba(201,168,76,0.1)", padding: 10, borderRadius: 6, border: "1px solid var(--border)" }}>
                            <h4 style={{ fontSize: 11, color: "var(--accent)", marginBottom: 6, fontWeight: 700 }}>Left Column (50%)</h4>
                            <select
                              value={selectedBlock.col1Type || "text"}
                              onChange={(e) => handleUpdateSelectedBlock("col1Type", e.target.value)}
                              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12, marginBottom: 8 }}
                            >
                              <option value="text">Paragraph / Narrative Text</option>
                              <option value="image">Image / Photo</option>
                            </select>
                            {selectedBlock.col1Type === "image" ? (
                              <div>
                                <label style={{ display: "block", fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 2 }}>Select Left Image File</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (evt) => {
                                        handleUpdateSelectedBlock("col1Image", evt.target.result);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 4, borderRadius: 4, fontSize: 11 }}
                                />
                              </div>
                            ) : (
                              <>
                                <input
                                  type="text"
                                  placeholder="Left Title (Optional)"
                                  value={selectedBlock.col1Title || ""}
                                  onChange={(e) => handleUpdateSelectedBlock("col1Title", e.target.value)}
                                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12, marginBottom: 6 }}
                                />
                                <textarea
                                  placeholder="Left Paragraph Text"
                                  value={selectedBlock.col1Body || ""}
                                  onChange={(e) => handleUpdateSelectedBlock("col1Body", e.target.value)}
                                  rows={3}
                                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                                />
                              </>
                            )}
                          </div>

                          <div style={{ background: "rgba(201,168,76,0.1)", padding: 10, borderRadius: 6, border: "1px solid var(--border)" }}>
                            <h4 style={{ fontSize: 11, color: "var(--accent)", marginBottom: 6, fontWeight: 700 }}>Right Column (50%)</h4>
                            <select
                              value={selectedBlock.col2Type || "text"}
                              onChange={(e) => handleUpdateSelectedBlock("col2Type", e.target.value)}
                              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12, marginBottom: 8 }}
                            >
                              <option value="text">Paragraph / Narrative Text</option>
                              <option value="image">Image / Photo</option>
                            </select>
                            {selectedBlock.col2Type === "image" ? (
                              <div>
                                <label style={{ display: "block", fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 2 }}>Select Right Image File</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (evt) => {
                                        handleUpdateSelectedBlock("col2Image", evt.target.result);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 4, borderRadius: 4, fontSize: 11 }}
                                />
                              </div>
                            ) : (
                              <>
                                <input
                                  type="text"
                                  placeholder="Right Title (Optional)"
                                  value={selectedBlock.col2Title || ""}
                                  onChange={(e) => handleUpdateSelectedBlock("col2Title", e.target.value)}
                                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12, marginBottom: 6 }}
                                />
                                <textarea
                                  placeholder="Right Paragraph Text"
                                  value={selectedBlock.col2Body || ""}
                                  onChange={(e) => handleUpdateSelectedBlock("col2Body", e.target.value)}
                                  rows={3}
                                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12, marginBottom: 6 }}
                                />
                                <input
                                  type="text"
                                  placeholder="Button Label (Optional)"
                                  value={selectedBlock.col2ButtonText || ""}
                                  onChange={(e) => handleUpdateSelectedBlock("col2ButtonText", e.target.value)}
                                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                                />
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* TAB 2: ADVANCED TYPOGRAPHY SUITE */}
                  {activeInspectorTab === "typography" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 2 }}>🔤 Font Family</label>
                        <select
                          value={selectedBlock.fontFamily || "inherit"}
                          onChange={(e) => handleUpdateSelectedBlock("fontFamily", e.target.value)}
                          style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12, marginBottom: 6 }}
                        >
                          {FONT_FAMILIES.map(f => (
                            <option key={f.val} value={f.val}>{f.name}</option>
                          ))}
                        </select>

                        {/* UPLOAD CUSTOM FONT FILE */}
                        <div style={{ background: "rgba(201,168,76,0.1)", padding: 8, borderRadius: 6, border: "1px solid var(--border)" }}>
                          <label style={{ display: "block", fontSize: 10, color: "var(--accent)", fontWeight: 700, marginBottom: 4 }}>📁 Upload Custom Font (.ttf, .otf, .woff)</label>
                          <input
                            type="file"
                            accept=".ttf,.otf,.woff,.woff2"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFontFileUpload(file);
                            }}
                            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 4, borderRadius: 4, fontSize: 10 }}
                          />
                        </div>
                      </div>

                      {/* TEXT COLOR & COLOR PICKER */}
                      <div>
                        <label style={{ display: "block", fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 4 }}>🎨 Text Font Color & Color Picker</label>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input
                            type="color"
                            value={selectedBlock.textColor || "#C9A84C"}
                            onChange={(e) => handleUpdateSelectedBlock("textColor", e.target.value)}
                            style={{ width: 40, height: 32, border: "1px solid var(--border)", background: "none", cursor: "pointer", borderRadius: 4 }}
                          />
                          <select
                            value={selectedBlock.textColor || "#C9A84C"}
                            onChange={(e) => handleUpdateSelectedBlock("textColor", e.target.value)}
                            style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", color: selectedBlock.textColor || "#C9A84C", fontWeight: 700, padding: 6, borderRadius: 4, fontSize: 11 }}
                          >
                            {FONT_COLORS.map(c => (
                              <option key={c.hex} value={c.hex} style={{ color: c.hex, background: "#111" }}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Font Size: {selectedBlock.fontSize || 36}px</label>
                        <input
                          type="range"
                          min="12"
                          max="96"
                          value={selectedBlock.fontSize || 36}
                          onChange={(e) => handleUpdateSelectedBlock("fontSize", e.target.value)}
                          style={{ width: "100%" }}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Font Weight</label>
                          <select
                            value={selectedBlock.fontWeight || "700"}
                            onChange={(e) => handleUpdateSelectedBlock("fontWeight", e.target.value)}
                            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 11 }}
                          >
                            <option value="300">300 (Light)</option>
                            <option value="400">400 (Regular)</option>
                            <option value="600">600 (Semi-Bold)</option>
                            <option value="700">700 (Bold)</option>
                            <option value="900">900 (Black)</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Alignment</label>
                          <select
                            value={selectedBlock.textAlign || "center"}
                            onChange={(e) => handleUpdateSelectedBlock("textAlign", e.target.value)}
                            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 11 }}
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                            <option value="justify">Justify</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Text Transform</label>
                          <select
                            value={selectedBlock.textTransform || "none"}
                            onChange={(e) => handleUpdateSelectedBlock("textTransform", e.target.value)}
                            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 11 }}
                          >
                            <option value="none">None</option>
                            <option value="uppercase">UPPERCASE</option>
                            <option value="lowercase">lowercase</option>
                            <option value="capitalize">Capitalize</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Text Style</label>
                          <select
                            value={selectedBlock.fontStyle || "normal"}
                            onChange={(e) => handleUpdateSelectedBlock("fontStyle", e.target.value)}
                            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 11 }}
                          >
                            <option value="normal">Normal</option>
                            <option value="italic">Italic</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: BOX STYLE & FREEFORM POSITIONING */}
                  {activeInspectorTab === "style" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      
                      {/* FREEFORM DRAG VS FLOW MODE */}
                      <div style={{ background: "rgba(201,168,76,0.12)", padding: 10, borderRadius: 8, border: "1px solid var(--accent)" }}>
                        <label style={{ display: "block", fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 4 }}>📍 Position Mode</label>
                        <select
                          value={selectedBlock.positionMode || "relative"}
                          onChange={(e) => handleUpdateSelectedBlock("positionMode", e.target.value)}
                          style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12, marginBottom: 6 }}
                        >
                          <option value="relative">Flow Layout (Auto Vertical Flow)</option>
                          <option value="absolute">Freeform Canvas Drag (Absolute X/Y)</option>
                        </select>

                        {selectedBlock.positionMode === "absolute" && (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
                            <div>
                              <label style={{ display: "block", fontSize: 10, color: "var(--text2)" }}>X Pos (Left px)</label>
                              <input
                                type="number"
                                value={selectedBlock.posX || 0}
                                onChange={(e) => handleUpdateSelectedBlock("posX", parseInt(e.target.value) || 0)}
                                style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 4, borderRadius: 4, fontSize: 11 }}
                              />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: 10, color: "var(--text2)" }}>Y Pos (Top px)</label>
                              <input
                                type="number"
                                value={selectedBlock.posY || 0}
                                onChange={(e) => handleUpdateSelectedBlock("posY", parseInt(e.target.value) || 0)}
                                style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 4, borderRadius: 4, fontSize: 11 }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* DISPLAY LAYOUT MODE */}
                      {selectedBlock.positionMode !== "absolute" && (
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 4 }}>📐 Flow Placement</label>
                          <select
                            value={selectedBlock.displayMode || (selectedBlock.boxWidth === "48%" || selectedBlock.boxWidth === "45%" ? "inline-50" : "block")}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateSelectedBlock("displayMode", val);
                              if (val === "inline-50") {
                                handleUpdateSelectedBlock("boxWidth", "45%");
                                handleUpdateSelectedBlock("marginRight", "20");
                              } else if (val === "inline-33") {
                                handleUpdateSelectedBlock("boxWidth", "30%");
                                handleUpdateSelectedBlock("marginRight", "16");
                              } else {
                                handleUpdateSelectedBlock("boxWidth", "100%");
                                handleUpdateSelectedBlock("marginRight", "");
                              }
                            }}
                            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                          >
                            <option value="block">Full Width Row Block (Default)</option>
                            <option value="inline-50">Inline Side-by-Side (45% Width + Gap)</option>
                            <option value="inline-33">Inline Side-by-Side (30% Width + Gap)</option>
                          </select>
                        </div>
                      )}

                      {/* WIDTH & HEIGHT */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 2 }}>Box Width</label>
                          <input
                            type="text"
                            value={selectedBlock.boxWidth || "100%"}
                            onChange={(e) => handleUpdateSelectedBlock("boxWidth", e.target.value)}
                            placeholder="e.g. 100%, 450px, 45%"
                            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 2 }}>Box Height</label>
                          <input
                            type="text"
                            value={selectedBlock.boxHeight || "auto"}
                            onChange={(e) => handleUpdateSelectedBlock("boxHeight", e.target.value)}
                            placeholder="e.g. auto, 250px"
                            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                          />
                        </div>
                      </div>

                      {/* BOX POSITION / ALIGNMENT */}
                      {selectedBlock.positionMode !== "absolute" && (
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 4 }}>📍 Box Alignment Position</label>
                          <div style={{ display: "flex", gap: 8 }}>
                            {["left", "center", "right"].map((pos) => (
                              <button
                                key={pos}
                                onClick={() => handleUpdateSelectedBlock("boxAlign", pos)}
                                style={{
                                  flex: 1,
                                  background: (selectedBlock.boxAlign || "center") === pos ? "var(--accent)" : "var(--surface2)",
                                  color: (selectedBlock.boxAlign || "center") === pos ? "#000" : "#fff",
                                  border: "1px solid var(--border)",
                                  padding: "6px 0",
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  textTransform: "capitalize",
                                  cursor: "pointer"
                                }}
                              >
                                {pos}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* BACKGROUND COLOR & TRANSPARENT TOGGLE */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <label style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600 }}>Background Color</label>
                          <button
                            onClick={() => handleUpdateSelectedBlock("bgColor", "transparent")}
                            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid var(--border)", color: "var(--accent)", padding: "2px 8px", borderRadius: 4, fontSize: 10, cursor: "pointer" }}
                          >
                            Set Transparent
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input
                            type="color"
                            value={selectedBlock.bgColor === "transparent" ? "#000000" : (selectedBlock.bgColor || "#080605")}
                            onChange={(e) => handleUpdateSelectedBlock("bgColor", e.target.value)}
                            style={{ width: 36, height: 30, border: "1px solid var(--border)", background: "none", cursor: "pointer", borderRadius: 4 }}
                          />
                          <input
                            type="text"
                            value={selectedBlock.bgColor || "transparent"}
                            onChange={(e) => handleUpdateSelectedBlock("bgColor", e.target.value)}
                            placeholder="transparent or #14100B"
                            style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                          />
                        </div>
                      </div>

                      {/* BORDER STYLE, WIDTH & COLOR */}
                      <div style={{ background: "rgba(201,168,76,0.05)", padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}>
                        <h4 style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 8 }}>🖼️ Border & Frame Styling</h4>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                          <div>
                            <label style={{ display: "block", fontSize: 10, color: "var(--text2)", marginBottom: 2 }}>Border Style</label>
                            <select
                              value={selectedBlock.borderStyle || "none"}
                              onChange={(e) => {
                                handleUpdateSelectedBlock("borderStyle", e.target.value);
                                if (!selectedBlock.borderWidth || selectedBlock.borderWidth === "0") {
                                  handleUpdateSelectedBlock("borderWidth", "1");
                                }
                              }}
                              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 5, borderRadius: 4, fontSize: 11 }}
                            >
                              {BORDER_STYLES.map(b => (
                                <option key={b.val} value={b.val}>{b.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: 10, color: "var(--text2)", marginBottom: 2 }}>Border Color</label>
                            <div style={{ display: "flex", gap: 4 }}>
                              <input
                                type="color"
                                value={selectedBlock.borderColor || "#C9A84C"}
                                onChange={(e) => handleUpdateSelectedBlock("borderColor", e.target.value)}
                                style={{ width: 28, height: 26, border: "1px solid var(--border)", background: "none", cursor: "pointer", borderRadius: 4 }}
                              />
                              <input
                                type="text"
                                value={selectedBlock.borderColor || "#C9A84C"}
                                onChange={(e) => handleUpdateSelectedBlock("borderColor", e.target.value)}
                                style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 3, borderRadius: 4, fontSize: 10 }}
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: 10, color: "var(--text2)", marginBottom: 2 }}>Border Width: {selectedBlock.borderWidth || 1}px</label>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            value={selectedBlock.borderWidth || 1}
                            onChange={(e) => handleUpdateSelectedBlock("borderWidth", e.target.value)}
                            style={{ width: "100%" }}
                          />
                        </div>

                        <div style={{ marginTop: 6 }}>
                          <label style={{ display: "block", fontSize: 10, color: "var(--text2)", marginBottom: 2 }}>Border Radius: {selectedBlock.borderRadius || 0}px</label>
                          <input
                            type="range"
                            min="0"
                            max="60"
                            value={selectedBlock.borderRadius || 0}
                            onChange={(e) => handleUpdateSelectedBlock("borderRadius", e.target.value)}
                            style={{ width: "100%" }}
                          />
                        </div>
                      </div>

                      {/* SHADOW & OPACITY */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Box Shadow Preset</label>
                          <select
                            value={selectedBlock.shadow || "none"}
                            onChange={(e) => handleUpdateSelectedBlock("shadow", e.target.value)}
                            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 11 }}
                          >
                            {SHADOW_PRESETS.map(s => (
                              <option key={s.name} value={s.val}>{s.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Opacity: {selectedBlock.opacity || 1}</label>
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={selectedBlock.opacity || 1}
                            onChange={(e) => handleUpdateSelectedBlock("opacity", e.target.value)}
                            style={{ width: "100%" }}
                          />
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 4: SPACING & HORIZONTAL MARGINS/PADDING */}
                  {activeInspectorTab === "spacing" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ background: "rgba(201,168,76,0.1)", padding: 10, borderRadius: 6, border: "1px solid var(--border)" }}>
                        <h4 style={{ fontSize: 11, color: "var(--accent)", marginBottom: 6, fontWeight: 700 }}>↔️ Quick Side-by-Side Gap Presets</h4>
                        <div style={{ display: "flex", gap: 6 }}>
                          {[
                            { label: "Small (10px)", gap: "10" },
                            { label: "Medium (20px)", gap: "20" },
                            { label: "Large (35px)", gap: "35" },
                          ].map(preset => (
                            <button
                              key={preset.gap}
                              onClick={() => {
                                handleUpdateSelectedBlock("marginRight", preset.gap);
                              }}
                              style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: "6px 0", borderRadius: 4, fontSize: 10, cursor: "pointer" }}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Padding Top (px)</label>
                          <input
                            type="number"
                            value={selectedBlock.paddingTop || 0}
                            onChange={(e) => handleUpdateSelectedBlock("paddingTop", e.target.value)}
                            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Padding Bottom (px)</label>
                          <input
                            type="number"
                            value={selectedBlock.paddingBottom || 0}
                            onChange={(e) => handleUpdateSelectedBlock("paddingBottom", e.target.value)}
                            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 2 }}>Padding Left (px)</label>
                          <input
                            type="number"
                            value={selectedBlock.paddingLeft || 0}
                            onChange={(e) => handleUpdateSelectedBlock("paddingLeft", e.target.value)}
                            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 2 }}>Padding Right (px)</label>
                          <input
                            type="number"
                            value={selectedBlock.paddingRight || 0}
                            onChange={(e) => handleUpdateSelectedBlock("paddingRight", e.target.value)}
                            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Margin Top (px)</label>
                          <input
                            type="number"
                            value={selectedBlock.marginTop || 0}
                            onChange={(e) => handleUpdateSelectedBlock("marginTop", e.target.value)}
                            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Margin Bottom (px)</label>
                          <input
                            type="number"
                            value={selectedBlock.marginBottom || 0}
                            onChange={(e) => handleUpdateSelectedBlock("marginBottom", e.target.value)}
                            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 2 }}>Margin Left (px)</label>
                          <input
                            type="number"
                            value={selectedBlock.marginLeft || 0}
                            onChange={(e) => handleUpdateSelectedBlock("marginLeft", e.target.value)}
                            placeholder="0"
                            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 2 }}>Margin Right (px)</label>
                          <input
                            type="number"
                            value={selectedBlock.marginRight || 0}
                            onChange={(e) => handleUpdateSelectedBlock("marginRight", e.target.value)}
                            placeholder="e.g. 20"
                            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 6, borderRadius: 4, fontSize: 12 }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div style={{ padding: 30, textAlign: "center", color: "var(--text2)", fontSize: 12 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>⚙️</div>
                  <p>Click any element on the center canvas to open its real-time Style & Property Inspector.</p>
                </div>
              )}
            </div>
          </aside>
        )}

      </div>

      {/* CREATE NEW CUSTOM PAGE MODAL */}
      {showCreatePageModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 30, maxWidth: 540, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, color: "var(--accent)", fontWeight: 700 }}>➕ Create New Custom Page</h2>
                <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>Add a brand new page route to your website & page builder.</p>
              </div>
              <button onClick={() => setShowCreatePageModal(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>&times;</button>
            </div>

            <form onSubmit={handleCreateNewPage} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#fff", fontWeight: 600, marginBottom: 4 }}>Page Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bespoke Framing Guide"
                  value={newPageTitle}
                  onChange={(e) => {
                    setNewPageTitle(e.target.value);
                    if (!newPageSlug) {
                      setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                    }
                  }}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 8, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "#fff", fontWeight: 600, marginBottom: 4 }}>URL Slug / Route *</label>
                <div style={{ display: "flex", alignItems: "center", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "0 10px" }}>
                  <span style={{ fontSize: 12, color: "var(--accent)", fontFamily: "monospace" }}>/</span>
                  <input
                    type="text"
                    required
                    placeholder="bespoke-framing-guide"
                    value={newPageSlug}
                    onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    style={{ flex: 1, background: "none", border: "none", color: "#fff", padding: "10px 4px", fontSize: 13, fontFamily: "monospace", outline: "none" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "#fff", fontWeight: 600, marginBottom: 4 }}>Starting Layout Preset</label>
                <select
                  value={newPagePreset}
                  onChange={(e) => setNewPagePreset(e.target.value)}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 8, fontSize: 13 }}
                >
                  <option value="blank">✨ Blank Canvas (Empty Page)</option>
                  {SAMPLE_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>📋 {t.title}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 10 }}>
                <button type="button" onClick={() => setShowCreatePageModal(false)} style={{ background: "var(--surface2)", color: "#fff", border: "1px solid var(--border)", padding: "10px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ background: "var(--accent)", color: "#000", border: "none", padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Create & Launch Editor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAMPLE TEMPLATES IMPORTER MODAL */}
      {showTemplateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 30, maxWidth: 840, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, color: "var(--accent)", fontWeight: 700 }}>📚 Load Sample Template</h2>
                <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>Select a pre-designed luxury layout template to load into your editor.</p>
              </div>
              <button onClick={() => setShowTemplateModal(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>&times;</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 20 }}>
              {SAMPLE_TEMPLATES.map((tpl) => (
                <div key={tpl.id} style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>{tpl.icon}</span>
                      <div>
                        <h3 style={{ fontSize: 16, color: "#fff", fontWeight: 700 }}>{tpl.title}</h3>
                        <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700 }}>{tpl.category}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)", margin: "10px 0 16px" }}>
                      Includes {tpl.blocks.length} pre-formatted layout blocks.
                    </div>
                  </div>

                  <button
                    onClick={() => handleImportTemplate(tpl)}
                    style={{ background: "var(--accent)", color: "#000", border: "none", padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%" }}
                  >
                    Import Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
