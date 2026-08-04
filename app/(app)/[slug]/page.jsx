"use client";

import { use, useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ref, onValue, set } from "firebase/database";
import { db } from "../../lib/firebase";

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
          } else if (SAMPLE_FALLBACK_PAGES[slug]) {
            const fallbackItem = SAMPLE_FALLBACK_PAGES[slug];
            setPageData(fallbackItem);
            setNotFound(false);
            set(ref(db, `cms_pages/${slug}`), fallbackItem).catch(console.error);
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

  const blocksList = Array.isArray(pageData.blocks)
    ? pageData.blocks
    : (Array.isArray(pageData.layout) ? pageData.layout : []);

  return (
    <div className={`app-container ${lightOn ? 'light-on' : 'light-off'}`} style={{ minHeight: "100vh", background: "#050403", color: "#E0D7CD", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      
      {/* Signature Animated Ambient Background Color Blobs */}
      <div className="liquid-blob-1" />
      <div className="liquid-blob-2" />

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
      <div className="hero-banner">
        <div className={`exquisite-lamp catalog-lamp ${lightOn ? 'on' : ''}`}>
          <div className="lamp-rod" />
          <div className="lamp-mount" />
          <div className="lamp-arm" />
          <div className="lamp-head">
            <div className={`lamp-bulb ${lightOn ? 'on' : ''}`} />
          </div>
          <div className={`lamp-light-beam ${lightOn ? 'on' : ''}`} />
        </div>

        <h1 className="hero-title">{pageData.title}</h1>
        <p className="hero-desc">
          {pageData.subtitle || "Custom page layout built inside Yaadein Elementor Studio."}
        </p>

        {/* Centered Studio Light Switch Pill */}
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
      </div>

      {/* Main Blocks Content Container */}
      <main style={{ flex: 1, padding: "40px 20px 80px", maxWidth: "1200px", width: "100%", margin: "0 auto", position: "relative", zIndex: 10 }}>
        {blocksList.length > 0 ? (
          blocksList.map((block, idx) => {
            const bType = block.type || block.blockType;
            const headingColor = block.textColor || "var(--accent)";
            const fontFamily = block.fontFamily || "inherit";
            const fontStyle = block.fontStyle || "normal";
            const textDecoration = block.textDecoration || "none";
            const textTransform = block.textTransform || "none";
            const letterSpacing = block.letterSpacing ? `${block.letterSpacing}px` : "normal";
            const lineHeight = block.lineHeight || "1.4";
            const textShadow = block.textShadow || "none";

            const pTop = block.paddingTop ? `${block.paddingTop}px` : "0";
            const pBottom = block.paddingBottom ? `${block.paddingBottom}px` : "0";
            const pLeft = block.paddingLeft ? `${block.paddingLeft}px` : "0";
            const pRight = block.paddingRight ? `${block.paddingRight}px` : "0";

            const mTop = block.marginTop ? `${block.marginTop}px` : "0";
            const mBottom = block.marginBottom ? `${block.marginBottom}px` : "40px";

            const isAbsolute = block.positionMode === "absolute";
            const displayMode = block.displayMode || "block";
            const isInline = displayMode === "inline-50" || displayMode === "inline-33" || (block.boxWidth && block.boxWidth !== "100%" && block.boxWidth !== "auto");

            const boxWidth = block.boxWidth || (displayMode === "inline-50" ? "46%" : displayMode === "inline-33" ? "30%" : "100%");
            const boxHeight = block.boxHeight || "auto";

            const mLeft = block.marginLeft !== undefined && block.marginLeft !== "" ? `${block.marginLeft}px` : (block.boxAlign === "center" ? "auto" : block.boxAlign === "right" ? "auto" : "0");
            const mRight = block.marginRight !== undefined && block.marginRight !== "" ? `${block.marginRight}px` : (displayMode === "inline-50" ? "4%" : (block.boxAlign === "center" ? "auto" : block.boxAlign === "left" ? "auto" : "0"));

            const borderStyle = block.borderStyle || "none";
            const borderWidth = block.borderWidth ? `${block.borderWidth}px` : "0";
            const borderColor = block.borderColor || "transparent";
            const borderRadius = block.borderRadius ? `${block.borderRadius}px` : "0";
            const boxShadow = block.shadow || "none";
            const bgColor = block.bgColor === "transparent" ? "transparent" : (block.bgColor || (block.bgGradient ? block.bgGradient : "transparent"));

            const boxWrapperStyles = {
              position: isAbsolute ? "absolute" : "relative",
              left: isAbsolute ? `${block.posX || 0}px` : "auto",
              top: isAbsolute ? `${block.posY || 0}px` : "auto",
              display: isAbsolute ? "block" : (isInline ? "inline-block" : "block"),
              verticalAlign: "top",
              boxSizing: "border-box",
              width: boxWidth,
              height: boxHeight,
              paddingTop: pTop,
              paddingBottom: pBottom,
              paddingLeft: pLeft,
              paddingRight: pRight,
              marginTop: isAbsolute ? 0 : mTop,
              marginBottom: isAbsolute ? 0 : mBottom,
              marginLeft: isAbsolute ? 0 : mLeft,
              marginRight: isAbsolute ? 0 : mRight,
              background: bgColor,
              backdropFilter: block.backdropBlur ? `blur(${block.backdropBlur}px)` : "none",
              borderStyle,
              borderWidth,
              borderColor,
              borderRadius,
              boxShadow,
              opacity: block.opacity ? parseFloat(block.opacity) : 1,
            };

            // 1. HEADING
            if (bType === "heading") {
              const TagName = block.tag || "h2";
              return (
                <div key={idx} style={boxWrapperStyles}>
                  <TagName style={{ fontFamily, fontSize: `${block.fontSize || 36}px`, color: headingColor, textAlign: block.textAlign || "center", fontWeight: block.fontWeight || "700", fontStyle, textDecoration, textTransform, letterSpacing, lineHeight, textShadow, margin: 0 }}>
                    {block.text}
                  </TagName>
                </div>
              );
            }

            // 2. PARAGRAPH
            if (bType === "paragraph" || bType === "rich-text") {
              return (
                <div key={idx} style={boxWrapperStyles}>
                  <p style={{ fontFamily, fontSize: `${block.fontSize || 16}px`, color: headingColor, textAlign: block.textAlign || "left", fontWeight: block.fontWeight || "400", fontStyle, textDecoration, textTransform, letterSpacing, lineHeight: lineHeight || "1.8", textShadow, margin: 0 }}>
                    {block.text || block.body}
                  </p>
                </div>
              );
            }

            // 3. IMAGE
            if (bType === "image") {
              return (
                <div key={idx} style={{ ...boxWrapperStyles, textAlign: "center" }}>
                  <img src={block.url || block.image} alt={block.caption || "Page Graphic"} style={{ maxWidth: block.width || "100%", borderRadius, border: `${borderWidth} ${borderStyle} ${borderColor}`, boxShadow, objectFit: block.objectFit || "cover" }} />
                  {block.caption && <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 8 }}>{block.caption}</p>}
                </div>
              );
            }

            // 4. VIDEO
            if (bType === "video" || bType === "video-player") {
              return (
                <div key={idx} style={{ ...boxWrapperStyles, textAlign: "center" }}>
                  <div style={{ maxWidth: 800, margin: "0 auto", borderRadius, overflow: "hidden", border: `1px solid ${headingColor}`, boxShadow, background: "#000" }}>
                    <video src={block.url || block.videoUrl || "/videos/reel1.mp4"} controls autoPlay={block.autoPlay} loop={block.loop} muted={block.muted} playsInline style={{ width: "100%", maxHeight: 450, objectFit: "cover" }} />
                  </div>
                  {block.caption && <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 10 }}>{block.caption}</p>}
                </div>
              );
            }

            // 5. BUTTON
            if (bType === "button") {
              return (
                <div key={idx} style={{ ...boxWrapperStyles, textAlign: block.alignment || "center" }}>
                  <a href={block.link || block.buttonLink || "/customize"} style={{ display: "inline-block", background: block.btnColor || headingColor, color: block.textColor || "#000", fontFamily, fontWeight: block.fontWeight || "700", fontSize: `${block.fontSize || 14}px`, padding: `${block.paddingTop || 14}px ${block.paddingRight || 32}px`, borderRadius: `${block.borderRadius || 8}px`, textDecoration: "none", boxShadow }}>
                    {block.text || block.buttonText} {block.iconName === "arrow" ? "→" : block.iconName === "star" ? "✦" : ""}
                  </a>
                </div>
              );
            }

            // 6. 2-COLUMN SIDE-BY-SIDE ROW
            if (bType === "row-2col") {
              return (
                <div key={idx} style={{ ...boxWrapperStyles, display: "grid", gridTemplateColumns: block.colRatio || "repeat(auto-fit, minmax(320px, 1fr))", gap: `${block.gap || 24}px`, alignItems: block.verticalAlign || "center" }}>
                  {/* Left Column */}
                  <div style={{ background: "rgba(20, 12, 6, 0.6)", padding: 24, borderRadius: 12, border: "1px solid var(--border)" }}>
                    {block.col1Type === "image" ? (
                      <div>
                        <img src={block.col1Image || "/images/bespoke_framing.png"} alt={block.col1Title || "Media"} style={{ width: "100%", borderRadius: 10, maxHeight: 320, objectFit: "cover" }} />
                        {block.col1Title && <h3 style={{ fontFamily, fontSize: 20, color: headingColor, marginTop: 12, marginBottom: 4 }}>{block.col1Title}</h3>}
                        {block.col1Body && <p style={{ color: "var(--text2)", fontSize: 14, margin: 0 }}>{block.col1Body}</p>}
                      </div>
                    ) : (
                      <div>
                        {block.col1Title && <h3 style={{ fontFamily, fontSize: 22, color: headingColor, marginBottom: 10 }}>{block.col1Title}</h3>}
                        {block.col1Body && <p style={{ fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--text2)", lineHeight: 1.7, margin: 0 }}>{block.col1Body}</p>}
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div style={{ background: "rgba(20, 12, 6, 0.6)", padding: 24, borderRadius: 12, border: "1px solid var(--border)" }}>
                    {block.col2Type === "image" ? (
                      <div>
                        <img src={block.col2Image || "/images/bespoke_framing.png"} alt={block.col2Title || "Media"} style={{ width: "100%", borderRadius: 10, maxHeight: 320, objectFit: "cover" }} />
                        {block.col2Title && <h3 style={{ fontFamily, fontSize: 20, color: headingColor, marginTop: 12, marginBottom: 4 }}>{block.col2Title}</h3>}
                        {block.col2Body && <p style={{ color: "var(--text2)", fontSize: 14, margin: 0 }}>{block.col2Body}</p>}
                      </div>
                    ) : (
                      <div>
                        {block.col2Title && <h3 style={{ fontFamily, fontSize: 22, color: headingColor, marginBottom: 10 }}>{block.col2Title}</h3>}
                        {block.col2Body && <p style={{ fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--text2)", lineHeight: 1.7, marginBottom: 16 }}>{block.col2Body}</p>}
                        {block.col2ButtonText && (
                          <a href={block.col2ButtonLink || "/catalog"} style={{ display: "inline-block", background: headingColor, color: "#000", fontWeight: 700, padding: "10px 24px", borderRadius: 6, textDecoration: "none" }}>
                            {block.col2ButtonText}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // 7. 3-COLUMN SIDE-BY-SIDE ROW
            if (bType === "row-3col") {
              return (
                <div key={idx} style={{ ...boxWrapperStyles, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: `${block.gap || 20}px` }}>
                  <div style={{ background: "rgba(20, 12, 6, 0.6)", padding: 20, borderRadius: 12, border: "1px solid var(--border)", textAlign: "center" }}>
                    <h4 style={{ fontFamily, fontSize: 18, color: headingColor, marginBottom: 8 }}>{block.col1Title || "Column 1"}</h4>
                    <p style={{ fontSize: 14, color: "var(--text2)", margin: 0 }}>{block.col1Body}</p>
                  </div>
                  <div style={{ background: "rgba(20, 12, 6, 0.6)", padding: 20, borderRadius: 12, border: "1px solid var(--border)", textAlign: "center" }}>
                    <h4 style={{ fontFamily, fontSize: 18, color: headingColor, marginBottom: 8 }}>{block.col2Title || "Column 2"}</h4>
                    <p style={{ fontSize: 14, color: "var(--text2)", margin: 0 }}>{block.col2Body}</p>
                  </div>
                  <div style={{ background: "rgba(20, 12, 6, 0.6)", padding: 20, borderRadius: 12, border: "1px solid var(--border)", textAlign: "center" }}>
                    <h4 style={{ fontFamily, fontSize: 18, color: headingColor, marginBottom: 8 }}>{block.col3Title || "Column 3"}</h4>
                    <p style={{ fontSize: 14, color: "var(--text2)", margin: 0 }}>{block.col3Body}</p>
                  </div>
                </div>
              );
            }

            // 8. CALLOUT BANNER
            if (bType === "cta-banner" || bType === "ctaBlock") {
              return (
                <div key={idx} style={{ background: block.bgGradient || "linear-gradient(135deg, rgba(201, 168, 76, 0.2) 0%, rgba(20, 12, 6, 0.9) 100%)", border: `1px solid ${headingColor}`, borderRadius: borderRadius || "16px", padding: "50px 30px", textAlign: "center", marginBottom: mBottom, marginTop: mTop }}>
                  <h2 style={{ fontFamily, fontSize: "34px", color: headingColor, marginBottom: 12 }}>{block.title || block.heading}</h2>
                  {(block.subtitle || block.description) && <p style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--text2)", maxWidth: 600, margin: "0 auto 24px" }}>{block.subtitle || block.description}</p>}
                  {block.buttonText && (
                    <a href={block.buttonLink || "/catalog"} style={{ background: headingColor, color: "#000", fontWeight: 700, padding: "12px 28px", borderRadius: 8, textDecoration: "none" }}>
                      {block.buttonText}
                    </a>
                  )}
                </div>
              );
            }

            // 9. TESTIMONIAL
            if (bType === "testimonial" || bType === "testimonials") {
              return (
                <div key={idx} style={{ background: "rgba(28, 15, 7, 0.6)", border: "1px solid rgba(201, 168, 76, 0.2)", borderRadius: borderRadius || "12px", padding: 28, marginBottom: mBottom, marginTop: mTop }}>
                  <div style={{ color: headingColor, fontSize: 18, marginBottom: 10 }}>{"★".repeat(parseInt(block.rating || "5"))}</div>
                  <p style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: "#fff", fontStyle: "italic", marginBottom: 16, lineHeight: 1.6 }}>"{block.quote}"</p>
                  <div style={{ fontSize: 14, fontWeight: 700, color: headingColor }}>{block.name}</div>
                  {block.location && <div style={{ fontSize: 12, color: "var(--text2)" }}>{block.location}</div>}
                </div>
              );
            }

            // 10. FAQ ACCORDION ITEM
            if (bType === "faq" || bType === "faq-accordion") {
              const isOpen = expandedFaqs[idx];
              return (
                <div key={idx} style={{ background: "rgba(20, 12, 6, 0.7)", border: "1px solid var(--border)", borderRadius: borderRadius || "8px", overflow: "hidden", marginBottom: 14, marginTop: mTop }}>
                  <button onClick={() => toggleFaq(idx)} style={{ width: "100%", background: "none", border: "none", color: headingColor, padding: 18, textAlign: "left", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{block.question}</span>
                    <span>{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 18px 18px", color: "var(--text2)", fontSize: 14, lineHeight: 1.6, borderTop: "1px solid var(--border)" }}>
                      {block.answer}
                    </div>
                  )}
                </div>
              );
            }

            // 11. PRICING CARD
            if (bType === "pricing" || bType === "pricing-matrix") {
              return (
                <div key={idx} style={{ background: "rgba(201, 168, 76, 0.15)", border: `1px solid ${headingColor}`, borderRadius: borderRadius || "16px", padding: 32, textAlign: "center", marginBottom: mBottom, marginTop: mTop }}>
                  {block.ribbonBadge && <span style={{ background: headingColor, color: "#000", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4, display: "inline-block", marginBottom: 10 }}>{block.ribbonBadge}</span>}
                  <h3 style={{ fontFamily, fontSize: 24, color: "#fff", marginBottom: 8 }}>{block.title}</h3>
                  <div style={{ fontSize: 36, fontWeight: 700, color: headingColor, marginBottom: 4 }}>{block.currency || "Rs."} {block.price}</div>
                  <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>{block.period}</div>
                  <a href={block.buttonLink || "/customize"} style={{ display: "inline-block", background: headingColor, color: "#000", fontWeight: 700, padding: "12px 32px", borderRadius: 8, textDecoration: "none" }}>{block.buttonText || "Order Now"}</a>
                </div>
              );
            }

            // 12. DIVIDER LINE
            if (bType === "divider") {
              return (
                <div key={idx} style={{ padding: "10px 0", display: "flex", alignItems: "center", marginBottom: mBottom }}>
                  <div style={{ width: "100%", height: parseInt(block.height || "1"), background: headingColor }} />
                </div>
              );
            }

            // 13. VERTICAL SPACER GAP
            if (bType === "spacer") {
              return <div key={idx} style={{ height: parseInt(block.height || "50") }} />;
            }

            return null;
          })
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
