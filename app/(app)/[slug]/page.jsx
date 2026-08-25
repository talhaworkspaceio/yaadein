"use client";

import { use, useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ref, onValue, set } from "firebase/database";
import { db } from "../../lib/firebase";
import BlockView from "../../lib/pageBuilder/BlockView";
import { buildPageCss } from "../../lib/pageBuilder/styles";

const normalizeIgUrl = (u) => {
  if (!u) return "";
  let clean = u.trim();
  if (!clean.endsWith("/")) clean += "/";
  return clean;
};

const getIgEmbedUrl = (u) => {
  if (!u) return "";
  const norm = normalizeIgUrl(u);
  if (norm.includes("/embed")) return norm;
  return `${norm}embed/?cr=1&v=14&rd=`;
};

// Mirrors DEFAULT_PAGE_SETTINGS in the builder — pages saved before page settings
// existed fall back to the original studio look.
const PAGE_SETTINGS_FALLBACK = {
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
  backdropGradient: "",
  backdropImage: "",
  backdropParallax: true,
  backdropOverlay: "rgba(5, 4, 3, 0.55)",
  backdropBlur: "0",
  showBlobs: true,
};

const SAMPLE_FALLBACK_PAGES = {
  "art-journal-gallery-walls": {
    title: "Editorial Blog & Art Journal Layout",
    slug: "art-journal-gallery-walls",
    blocks: [
      { id: "b1", type: "heading", text: "The Art of Gallery Walls: 7 Secrets from Master Curators", fontFamily: "'Cinzel', serif", textColor: "#C9A84C", fontSize: "38", fontWeight: "700", textAlign: "center", paddingTop: "20", paddingBottom: "10" },
      { id: "b2", type: "paragraph", text: "Published by @yaadein.pk • 5 Min Read • Interior Art Curation Series", fontFamily: "'Inter', sans-serif", textColor: "#A0A0A0", fontSize: "14", fontWeight: "400", textAlign: "center", paddingTop: "0", paddingBottom: "20" },
      { id: "b3", type: "row-2col", colRatio: "1fr 1fr", col1Type: "image", col1Image: "/images/bespoke_framing.png", col1Title: "Precision Spacing & Sightlines", col1Body: "A gallery wall should feel balanced, not cluttered.", col2Type: "text", col2Title: "1. Match Frame Profiles to Art Style", col2Body: "Pair ornate gilded frames with classical portraiture, and sleek matte black frames with modern line art.", col2ButtonText: "Explore Frame Profiles", col2ButtonLink: "/catalog", textColor: "#C9A84C", gap: "24", paddingTop: "20", paddingBottom: "20" },
      { id: "b4", type: "testimonial", name: "Sarah Khan", rating: "5", quote: "Following this gallery wall guide transformed our living room wall into a museum exhibit!", location: "Islamabad", textColor: "#C9A84C" },
      { id: "b5", type: "cta-banner", title: "Want a Custom Gallery Wall Set?", subtitle: "Consult directly with our master framing artisans today.", buttonText: "Request Consultation", buttonLink: "/contact", textColor: "#FFD700" }
    ]
  },
  "studio-consultation": {
    title: "Studio Consultation & Contact Layout",
    slug: "studio-consultation",
    blocks: [
      { id: "b1", type: "heading", text: "Request a Free Studio Framing Consultation", fontFamily: "'Cinzel', serif", textColor: "#C9A84C", fontSize: "40", fontWeight: "700", textAlign: "center", paddingTop: "20", paddingBottom: "10" },
      { id: "b2", type: "row-2col", colRatio: "1fr 1fr", col1Type: "text", col1Title: "Yaadein Main Framing Studio", col1Body: "Visit our workshop or contact our framing advisors online.\n\n📍 Studio Address: Main Boulevard, Gulberg III, Lahore, Pakistan\n📞 Direct Line: +92 (300) 123-4567\n✉️ Email: concierge@yaadein.pk", col2Type: "text", col2Title: "Studio Operating Hours", col2Body: "Monday - Saturday: 11:00 AM - 9:00 PM\nSunday: By Appointment Only\n\nWe offer nationwide insured shipping across Pakistan.", col2ButtonText: "Call Concierge", col2ButtonLink: "tel:+923001234567", textColor: "#C9A84C", gap: "24", paddingTop: "20", paddingBottom: "20" },
      { id: "b3", type: "faq", question: "How long does custom framing take?", answer: "Standard orders take 3-5 business days. Express 24-hour framing is available upon request.", textColor: "#C9A84C" },
      { id: "b4", type: "faq", question: "Do you offer glass replacement?", answer: "Yes! We fit 99% UV-protective museum glass or non-reflective optical acrylic.", textColor: "#C9A84C" }
    ]
  }
};

export default function CustomRootPage({ params }) {
  const resolvedParams = use(params);
  const rawSlug = resolvedParams?.slug;
  const slug = rawSlug ? rawSlug.replace(/^\//, '') : '';

  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightOn, setLightOn] = useState(true);
  const [expandedFaqs, setExpandedFaqs] = useState({});
  const [faqsInitialised, setFaqsInitialised] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!slug) return;
    try {
      const pageRef = ref(db, `cms_pages/${slug}`);
      const unsub = onValue(pageRef, (snapshot) => {
        const val = snapshot.val();
        if (isMounted) {
          if (val) {
            setPageData(val);
            setNotFound(false);
          } else {
            setNotFound(true);
          }
          setLoading(false);
        }
      });
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (err) {
      console.warn("[Firebase Page Builder] Failed to fetch custom page:", err);
      if (isMounted) {
        if (SAMPLE_FALLBACK_PAGES[slug]) {
          setPageData(SAMPLE_FALLBACK_PAGES[slug]);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      }
    }
  }, [slug]);

  const toggleFaq = (idx) => {
    setExpandedFaqs(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Single source of truth for the rendered blocks (older pages stored them as `layout`)
  const rawBlocks = Array.isArray(pageData?.blocks)
    ? pageData.blocks
    : (Array.isArray(pageData?.layout) ? pageData.layout : []);

  // FAQ items flagged "expanded by default" in the builder open on first paint
  useEffect(() => {
    if (faqsInitialised || !pageData) return;
    const initial = {};
    const visit = (list) => {
      (list || []).forEach((b, i) => {
        const t = b.type || b.blockType;
        if ((t === "faq" || t === "faq-accordion") && b.initialOpen) initial[b.id || i] = true;
        if (Array.isArray(b.children)) visit(b.children);
      });
    };
    visit(rawBlocks);
    setExpandedFaqs(initial);
    setFaqsInitialised(true);
  }, [pageData, rawBlocks, faqsInitialised]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#050403", color: "#E0D7CD", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-serif)" }}>
        <p style={{ fontSize: "18px", letterSpacing: "0.1em" }}>Loading Studio Page...</p>
      </div>
    );
  }

  if (notFound || !pageData) {
    return (
      <div style={{ minHeight: "100vh", background: "#050403", color: "#E0D7CD", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 20px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "42px", color: "var(--accent)", marginBottom: "16px" }}>404 - Page Not Found</h1>
          <p style={{ fontFamily: "var(--font-serif)", color: "var(--text2)", fontSize: "16px", marginBottom: "24px" }}>The custom page "/{slug}" does not exist or has not been published yet.</p>
          <a href="/" style={{ color: "var(--accent)", textDecoration: "none", borderBottom: "1px solid var(--accent)" }}>Return to Home</a>
        </main>
        <Footer />
      </div>
    );
  }

  const blocksList = rawBlocks;

  // ----- Page settings (heading, studio chrome, parallax backdrop) -----
  const settings = { ...PAGE_SETTINGS_FALLBACK, ...(pageData.settings || {}) };
  const backdropType = settings.backdropType || "none";
  const backdropBlur = parseFloat(settings.backdropBlur || 0) || 0;

  // The backdrop sits on its own fixed layer so `parallax` can pin it while the
  // page scrolls over the top.
  const backdropLayerStyle = (() => {
    if (backdropType === "color") return { background: settings.backdropColor || "#050403" };
    if (backdropType === "gradient") return { background: settings.backdropGradient || "#050403" };
    if (backdropType === "image" && settings.backdropImage) {
      return {
        backgroundColor: settings.backdropColor || "#050403",
        backgroundImage: `url(${settings.backdropImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: settings.backdropParallax !== false ? "fixed" : "scroll",
      };
    }
    return null;
  })();

  const heroHeading = settings.heading || pageData.title;
  const heroAlign = settings.headingAlign || "center";

  // One stylesheet for the whole tree, including the tablet/mobile media queries.
  const blocksCss = buildPageCss(blocksList);

  const blockCtx = {
    isEditor: false,
    lightOn,
    setLightOn,
    faqState: expandedFaqs,
    toggleFaq,
  };

  return (
    <div className={`app-container ${lightOn ? 'light-on' : 'light-off'}`} style={{ minHeight: "100vh", background: settings.backdropColor && backdropType === "color" ? settings.backdropColor : "#050403", color: "#E0D7CD", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>

      {/* Parallax backdrop fill + readability overlay */}
      {backdropLayerStyle && (
        <div
          aria-hidden="true"
          style={{
            position: settings.backdropParallax !== false && backdropType === "image" ? "fixed" : "absolute",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            ...backdropLayerStyle,
          }}
        />
      )}
      {backdropLayerStyle && settings.backdropOverlay && settings.backdropOverlay !== "transparent" && (
        <div
          aria-hidden="true"
          style={{
            position: settings.backdropParallax !== false && backdropType === "image" ? "fixed" : "absolute",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            background: settings.backdropOverlay,
            backdropFilter: backdropBlur > 0 ? `blur(${backdropBlur}px)` : "none",
            WebkitBackdropFilter: backdropBlur > 0 ? `blur(${backdropBlur}px)` : "none",
          }}
        />
      )}

      {/* Signature Animated Ambient Background Color Blobs */}
      {settings.showBlobs !== false && <div className="liquid-blob-1" />}
      {settings.showBlobs !== false && <div className="liquid-blob-2" />}

      {/* Dynamic Style block for Suspended Lamp & Liquid Color Animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .liquid-blob-1 {
          position: absolute;
          top: -10%;
          left: 10%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(181, 139, 92, 0.28) 0%, rgba(139, 94, 60, 0) 70%);
          border-radius: 43% 57% 51% 49% / 57% 40% 60% 43%;
          animation: liquid-move-1 25s infinite alternate ease-in-out;
          pointer-events: none;
          z-index: 1;
        }
        .liquid-blob-2 {
          position: absolute;
          bottom: -15%;
          right: 5%;
          width: 650px;
          height: 650px;
          background: radial-gradient(circle, rgba(139, 94, 60, 0.24) 0%, rgba(201, 168, 76, 0) 70%);
          border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%;
          animation: liquid-move-2 30s infinite alternate ease-in-out;
          pointer-events: none;
          z-index: 1;
        }
        @keyframes liquid-move-1 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); border-radius: 43% 57% 51% 49% / 57% 40% 60% 43%; }
          33% { transform: translate(80px, -60px) scale(1.15) rotate(45deg); border-radius: 54% 46% 38% 62% / 49% 70% 30% 51%; }
          66% { transform: translate(-40px, 80px) scale(0.9) rotate(90deg); border-radius: 35% 65% 60% 40% / 50% 35% 65% 50%; }
          100% { transform: translate(0, 0) scale(1) rotate(180deg); border-radius: 43% 57% 51% 49% / 57% 40% 60% 43%; }
        }
        @keyframes liquid-move-2 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%; }
          50% { transform: translate(-100px, 50px) scale(1.2) rotate(120deg); border-radius: 38% 62% 62% 38% / 68% 48% 52% 32%; }
          100% { transform: translate(60px, -70px) scale(0.9) rotate(-60deg); border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%; }
        }

        .exquisite-lamp {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 240px;
          margin-bottom: 25px;
          z-index: 20;
        }

        .catalog-lamp {
          margin-top: -30px;
        }

        .lamp-rod {
          width: 4px;
          height: 100vh;
          background: linear-gradient(to right, #403014, #9c7f47 50%, #2b1f0d);
          box-shadow: 1px 0 3px rgba(0,0,0,0.4);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
        }

        .lamp-mount {
          width: 32px;
          height: 18px;
          background: linear-gradient(135deg, #2b1f0d, #8f723b 40%, #dfc38a 60%, #5e461b);
          border: 1px solid #1a1205;
          box-shadow: 0 4px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.2);
          border-radius: 2px;
          position: relative;
          z-index: 12;
        }

        .lamp-arm {
          width: 6px;
          height: 78px;
          background: linear-gradient(to right, #403014, #9c7f47 50%, #2b1f0d);
          box-shadow: 2px 0 5px rgba(0,0,0,0.4);
          position: relative;
        }

        .lamp-arm::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: -4px;
          width: 14px;
          height: 6px;
          background: #5e461b;
          border-radius: 2px;
        }

        .lamp-head {
          width: 440px;
          height: 24px;
          background: linear-gradient(to bottom, #362710 0%, #8f723b 25%, #dfc38a 45%, #fae7b5 55%, #8f723b 75%, #362710 100%);
          border: 1px solid #1a1205;
          border-radius: 12px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.3);
          position: relative;
        }

        .lamp-bulb {
          position: absolute;
          bottom: 0px;
          left: 15%;
          right: 15%;
          height: 4px;
          background: #fff;
          border-radius: 2px;
          box-shadow: 0 0 12px 3px #fae7b5, 0 0 24px 8px #fae7b5;
          opacity: 0;
          transition: opacity 0.25s ease;
          z-index: 5;
        }
        .lamp-bulb.on { opacity: 1; }

        .lamp-light-beam {
          position: absolute;
          top: 116px;
          left: 50%;
          transform: translateX(-50%);
          width: 650px;
          height: 500px;
          background: radial-gradient(ellipse at top, rgba(255, 238, 180, 0.38) 0%, rgba(255, 238, 180, 0.15) 35%, rgba(255, 238, 180, 0.04) 60%, transparent 75%);
          filter: blur(30px);
          pointer-events: none;
          z-index: 15;
          opacity: 0;
          transition: opacity 0.25s ease-in-out;
        }
        .lamp-light-beam.on { opacity: 1; }

        .hero-banner {
          position: relative;
          padding: 120px 40px 60px;
          background: linear-gradient(to bottom, #14110E 0%, #080605 100%);
          border-bottom: 2px solid #1C0F07;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          z-index: 10;
        }

        .hero-title {
          font-family: var(--font-display);
          font-size: 52px;
          color: var(--text);
          letter-spacing: 0.05em;
          margin: 0;
        }

        .hero-desc {
          font-family: var(--font-serif);
          font-size: 16px;
          color: var(--text2);
          max-width: 650px;
          line-height: 1.7;
          margin: 0;
        }

        .light-control-panel {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          background: rgba(20, 15, 10, 0.8);
          border: 1px solid rgba(201, 168, 76, 0.3);
          padding: 8px 20px;
          border-radius: 30px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
          margin-top: 10px;
        }
        .light-control-label {
          font-family: var(--font-display);
          font-size: 11px;
          letter-spacing: 0.15em;
          color: var(--accent);
          text-transform: uppercase;
          font-weight: 700;
        }
        .light-switch-btn {
          width: 44px;
          height: 22px;
          background: #1c150c;
          border: 1px solid var(--border2);
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          transition: background 0.3s ease;
          padding: 0;
        }
        .light-switch-btn.on {
          background: var(--accent);
        }
        .light-switch-knob {
          width: 16px;
          height: 16px;
          background: #fff;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }
        .light-switch-btn.on .light-switch-knob {
          transform: translateX(22px);
          background: #000;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .reel-nav-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(20, 15, 10, 0.85);
          border: 1px solid var(--accent, #C9A84C);
          color: var(--accent, #C9A84C);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
          font-size: 16px;
        }
        .reel-nav-btn:hover {
          background: var(--accent, #C9A84C);
          color: #000;
          transform: scale(1.08);
        }

        @media (max-width: 768px) {
          .hero-banner { padding: 80px 20px 40px !important; }
          .hero-title { font-size: 34px !important; }
          .catalog-lamp {
            transform: scale(0.6) !important;
            transform-origin: top center !important;
            margin-top: -10px !important;
            margin-bottom: -70px !important;
          }
        }
      ` }} />

      <Navbar />

      {/* Signature Yaadein Studio Suspended Brass Lamp Hero Banner */}
      {settings.showHero !== false && (
        <div className="hero-banner" style={backdropLayerStyle ? { background: "transparent", borderBottom: "none" } : undefined}>
          {settings.showLamp !== false && (
            <div className={`exquisite-lamp catalog-lamp ${lightOn ? 'on' : ''}`}>
              <div className="lamp-rod" />
              <div className="lamp-mount" />
              <div className="lamp-arm" />
              <div className="lamp-head">
                <div className={`lamp-bulb ${lightOn ? 'on' : ''}`} />
              </div>
              <div className={`lamp-light-beam ${lightOn ? 'on' : ''}`} />
            </div>
          )}

          <div style={{ width: "100%", textAlign: heroAlign }}>
            <h1
              className="hero-title"
              style={{
                fontFamily: settings.headingFontFamily || "var(--font-display)",
                fontSize: `${parseInt(settings.headingFontSize || 52, 10) || 52}px`,
                color: settings.headingColor || "var(--text)",
              }}
            >
              {heroHeading}
            </h1>
            <p className="hero-desc" style={{ margin: heroAlign === "center" ? "16px auto 0" : "16px 0 0" }}>
              {settings.subtitle || pageData.subtitle || ""}
            </p>
          </div>

          {/* Centered Studio Light Switch Pill — identical component on every page */}
          {settings.showLightSwitch !== false && (
            <div className="light-control-panel">
              <span className="light-control-label">Studio Light</span>
              <button
                className={`light-switch-btn ${lightOn ? 'on' : ''}`}
                onClick={() => setLightOn(!lightOn)}
                aria-label="Toggle Studio Light"
              >
                <span className="light-switch-knob" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Blocks Content — rendered by the shared page-builder engine, so the
          published layout and the editor canvas come from one code path. */}
      <style dangerouslySetInnerHTML={{ __html: blocksCss }} />
      <main style={{ flex: 1, padding: "40px 20px 80px", maxWidth: settings.contentMaxWidth || "1200px", width: "100%", margin: "0 auto", position: "relative", zIndex: 10 }}>
        {blocksList.length > 0 ? (
          blocksList.map((block, idx) => (
            <BlockView key={block.id || idx} block={block} device="desktop" ctx={blockCtx} index={idx} />
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <h2>{pageData.title}</h2>
            <p style={{ color: "var(--text2)" }}>This custom page has no content blocks added yet.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
