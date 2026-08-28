"use client";

import { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../../../../../lib/firebase";
import FrameLoader from "../../../components/FrameLoader";

export default function AdminSiteContentPage() {
  const [activeTab, setActiveTab] = useState("homepage");
  const [homeSubTab, setHomeSubTab] = useState("hero");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // 1. HOMEPAGE SECTIONS
  const [heroVideoUploading, setHeroVideoUploading] = useState(false);
  const [homeHero, setHomeHero] = useState({
    titleLine1: "Turn Your",
    titleLine2: "Moments Into",
    titleHighlight: "Museum Art",
    subtitle: "Experience bespoke picture framing handcrafted for your specific style. Customize details in real-time, and let our master artisans deliver it ready to hang.",
    backgroundVideoUrl: "/videos/yaadein.mp4",
  });

  const handleHeroVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroVideoUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      setHomeHero((prev) => ({ ...prev, backgroundVideoUrl: event.target.result }));
      setHeroVideoUploading(false);
    };
    reader.onerror = () => {
      alert("Failed to read video file.");
      setHeroVideoUploading(false);
    };
    reader.readAsDataURL(file);
  };


  const [homeFeaturedProducts, setHomeFeaturedProducts] = useState({
    title: "Featured Products",
    subtitle: "Choose from our bespoke frame profiles. Select a style to launch it instantly in our interactive studio builder.",
  });

  const [homeMemories, setHomeMemories] = useState({
    title: "Where Memories Meet Nature's Light",
    body: "Every photograph is a story of shadows and highlights. Our bespoke frames are built to interact harmoniously with the ambient atmosphere. Watch as natural daylight from a nearby window shifts across the real-wood textures and museum matting, breathing organic life into your timeless moments.",
    browseButtonText: "BROWSE CATALOGUE",
    browseButtonLink: "/catalog",
    lightSwitchText: "Light Switch",
  });

  const [homeWrittenInTime, setHomeWrittenInTime] = useState({
    eyebrow: "Preserving Memories",
    title: "Written in Time",
    body: "Every frame we build, every photo we restore, is a testament to the moments that define us. Using traditional techniques and premium materials, we craft heirlooms that bridge generations. Let us help you write your story in wood and glass.",
    signature: "Yaadein Art Studio",
  });

  const [homeGoogleReviews, setHomeGoogleReviews] = useState({
    title: "What Our Clients Say",
    subtitle: "Real reviews from our verified customers on Google. Every frame tells a story — here's what they have to say.",
    averageScore: "4.9",
    totalReviewsText: "Based on 127 Google Reviews",
    googleReviewUrl: "https://g.page/r/yaadein-art-studio/review",
  });

  const [homeServicesSection, setHomeServicesSection] = useState({
    eyebrow: "Our Services",
    title: "Crafted With Care, Delivered With Pride",
    body: "From the first cut of wood to the final placement on your wall, every step is handled by our in-house artisans. Whatever your framing need, we bring museum-grade craftsmanship to your doorstep.",
    feature1Title: "Old Photo Restoration",
    feature1Desc: "Bring damaged, faded, or torn family photographs back to life with professional digital repair and colorization.",
    feature2Title: "Nikkahnama Frame",
    feature2Desc: "Elegant custom-built frames designed specifically to preserve and display your Nikkahnama with timeless grace.",
    feature3Title: "Board Games",
    feature3Desc: "Handcrafted luxury wooden board games — from Ludo to Chess — built for family fun and aesthetic value.",
    buttonText: "EXPLORE SERVICES",
    buttonLink: "/services",
  });

  // 2. CATALOG PAGE
  const [catalogPage, setCatalogPage] = useState({
    bannerTitle: "Curated Masterpieces",
    bannerSubtitle: "Explore our handcrafted collection of solid wood picture frames, vintage gallery mounts, and luxury display frames.",
  });


  // 3. SERVICES PAGE
  const [servicesPage, setServicesPage] = useState({
    heroTitle: "Bespoke Picture Framing & Fine Art Services",
    heroSubtitle: "Handcrafted in Pakistan with archival materials, museum-grade glass, and century-tested woodworking precision.",
  });


  // 4. TRACK ORDER PAGE
  const [trackPage, setTrackPage] = useState({
    title: "Track Your Order",
    subtitle: "Enter your unique Order Reference ID (e.g. YDN-1092) below to view real-time crafting status and courier dispatch details.",
    instruction1: "Check your SMS confirmation or invoice email for your Order ID.",
    instruction2: "For urgent modifications, contact our studio support helpline directly.",
    supportPhone: "+92 300 1234567",
    supportEmail: "team@yaadein.com",
  });

  // 5. CONTACT PAGE
  const [contactPage, setContactPage] = useState({
    title: "Visit Our Studio or Talk to an Artisan",
    subtitle: "Have a custom framing request, bulk order, or photo restoration inquiry? We are here to assist.",
    addressLine1: "Yaadein Craft Studio, Gulberg III",
    addressLine2: "Lahore, Punjab, Pakistan",
    phone1: "+92 300 1234567",
    phone2: "+92 321 7654321",
    email: "team@yaadein.com",
    workingHours: "Monday – Saturday: 10:00 AM – 8:00 PM",
    mapEmbedUrl: "",
  });


  // 6. POLICY PAGES
  const [privacyContent, setPrivacyContent] = useState("");
  const [refundContent, setRefundContent] = useState("");
  const [termsContent, setTermsContent] = useState("");

  // 7. HEADER & FOOTER NAVIGATION
  const [navigation, setNavigation] = useState({
    brandName: "Yaadein",
    tagline: "Masterpiece picture framing handcrafted for your unique memories.",
    supportEmail: "team@yaadein.com",
    phone: "+92 300 1234567",
    studioHours: "Mon - Fri: 9:00 AM - 6:00 PM",
    location: "Designed & Handcrafted in Pakistan",
    developerLink: "https://linkedin.com",
    copyrightText: "2026 Yaadein. All rights reserved.",
  });

  useEffect(() => {
    // 1. Homepage content
    const homeRef = ref(db, "site_content/home-page");
    onValue(homeRef, (snap) => {
      const val = snap.val();
      if (val) {
        if (val.hero) setHomeHero(val.hero);
        if (val.featuredProducts) setHomeFeaturedProducts(val.featuredProducts);
        if (val.memoriesSection) setHomeMemories(val.memoriesSection);
        if (val.writtenInTimeSection) setHomeWrittenInTime(val.writtenInTimeSection);
        if (val.servicesSection) setHomeServicesSection(val.servicesSection);
      }
    });

    // 2. Catalog Page
    const catalogRef = ref(db, "site_content/catalog-page");
    onValue(catalogRef, (snap) => {
      const val = snap.val();
      if (val) setCatalogPage(val);
    });

    // 3. Services Page
    const servicesPageRef = ref(db, "site_content/services-page");
    onValue(servicesPageRef, (snap) => {
      const val = snap.val();
      if (val) setServicesPage(val);
    });

    // 4. Track Page
    const trackRef = ref(db, "site_content/track-page");
    onValue(trackRef, (snap) => {
      const val = snap.val();
      if (val) setTrackPage(val);
    });

    // 5. Contact Page
    const contactRef = ref(db, "site_content/contact-page");
    onValue(contactRef, (snap) => {
      const val = snap.val();
      if (val) setContactPage(val);
    });

    // 6. Policy Pages
    onValue(ref(db, "site_content/privacy-policy-page"), (snap) => {
      const val = snap.val();
      if (val) setPrivacyContent(val.content || val.detailedText || "");
    });
    onValue(ref(db, "site_content/refund-policy-page"), (snap) => {
      const val = snap.val();
      if (val) setRefundContent(val.content || val.detailedText || "");
    });
    onValue(ref(db, "site_content/terms-page"), (snap) => {
      const val = snap.val();
      if (val) setTermsContent(val.content || val.detailedText || "");
    });

    // 7. Navigation
    onValue(ref(db, "site_content/navigation"), (snap) => {
      const val = snap.val();
      if (val) setNavigation(val);
      setLoading(false);
    });
  }, []);

  const handleSaveSection = async (dbPath, payloadData, successMsg) => {
    setSaving(true);
    setMessage("");
    try {
      await set(ref(db, dbPath), payloadData);
      setMessage(`✅ ${successMsg} saved successfully!`);
      setTimeout(() => setMessage(""), 4000);
    } catch (e) {
      console.error(e);
      setMessage(`❌ Failed to save ${successMsg}.`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <FrameLoader variant="page" label="Loading site content" />;
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 0 60px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--text)" }}>
          Site Content <span>& Policy Manager</span>
        </h1>
        <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>
          Edit all text, headlines, descriptions, section blocks, and policies across the entire website.
        </p>
      </div>

      {message && (
        <div style={{ background: "rgba(201, 168, 76, 0.15)", border: "1px solid var(--accent)", color: "var(--accent)", padding: 14, borderRadius: 8, marginBottom: 24 }}>
          {message}
        </div>
      )}

      {/* Primary Page Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { id: "homepage", label: "🏠 Homepage Sections" },
          { id: "catalog", label: "🛍️ Catalog Page" },
          { id: "services", label: "🛠️ Services Page" },
          { id: "track", label: "📦 Track Order Page" },
          { id: "contact", label: "📞 Contact Page" },
          { id: "privacy", label: "🔒 Privacy Policy" },
          { id: "refund", label: "🔄 Refund Policy" },
          { id: "terms", label: "📜 Terms & Conditions" },
          { id: "footer", label: "🧭 Header & Footer" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? "var(--accent)" : "var(--surface)",
              color: activeTab === tab.id ? "#000" : "var(--text2)",
              border: activeTab === tab.id ? "none" : "1px solid var(--border2)",
              borderRadius: 8,
              padding: "10px 18px",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: HOMEPAGE SECTIONS */}
      {activeTab === "homepage" && (
        <div>
          {/* Sub-tabs for Homepage Sections */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {[
              { id: "hero", label: "Hero Banner" },
              { id: "featured", label: "Featured Products" },
              { id: "memories", label: "Memories & Daylight" },
              { id: "written", label: "Written in Time" },
              { id: "services", label: "Services Overview" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setHomeSubTab(st.id)}
                style={{
                  background: homeSubTab === st.id ? "var(--surface2)" : "transparent",
                  color: homeSubTab === st.id ? "var(--accent)" : "var(--text2)",
                  border: "1px solid " + (homeSubTab === st.id ? "var(--accent)" : "var(--border)"),
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Sub-Tab: Hero Banner */}
          {homeSubTab === "hero" && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 18, color: "var(--accent)", marginBottom: 20 }}>Homepage Hero Banner Settings</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Title Line 1</label>
                    <input type="text" value={homeHero.titleLine1 || ""} onChange={(e) => setHomeHero({ ...homeHero, titleLine1: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Title Line 2</label>
                    <input type="text" value={homeHero.titleLine2 || ""} onChange={(e) => setHomeHero({ ...homeHero, titleLine2: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Highlighted Text (Gold)</label>
                    <input type="text" value={homeHero.titleHighlight || ""} onChange={(e) => setHomeHero({ ...homeHero, titleHighlight: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Hero Subtitle / Description</label>
                  <textarea value={homeHero.subtitle || ""} onChange={(e) => setHomeHero({ ...homeHero, subtitle: e.target.value })} rows={3} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                </div>

                <div style={{ background: "var(--surface2)", border: "1px dashed var(--border2)", borderRadius: 8, padding: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--accent)", marginBottom: 6 }}>
                    Upload Background Video File (from your computer)
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleHeroVideoUpload}
                    style={{ width: "100%", color: "var(--text2)", fontSize: 12 }}
                  />
                  {heroVideoUploading && <p style={{ fontSize: 11, color: "var(--accent)", marginTop: 4 }}>Processing video file...</p>}

                  <div style={{ marginTop: 12 }}>
                    <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>or Video File URL / Relative Path:</label>
                    <input
                      type="text"
                      value={homeHero.backgroundVideoUrl && homeHero.backgroundVideoUrl.length > 80 ? `${homeHero.backgroundVideoUrl.substring(0, 75)}... (Local Base64 Video)` : (homeHero.backgroundVideoUrl || "")}
                      onChange={(e) => setHomeHero({ ...homeHero, backgroundVideoUrl: e.target.value })}
                      placeholder="/videos/yaadein.mp4 or https://..."
                      style={{ width: "100%", background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6, fontSize: 12 }}
                    />
                  </div>
                </div>


                <div style={{ marginTop: 10 }}>
                  <button onClick={() => handleSaveSection("site_content/home-page/hero", homeHero, "Homepage Hero")} disabled={saving} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                    {saving ? "Saving..." : "Save Hero Section"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab: Featured Products */}
          {homeSubTab === "featured" && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 18, color: "var(--accent)", marginBottom: 20 }}>Featured Products Section Settings</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Section Title</label>
                  <input type="text" value={homeFeaturedProducts.title || ""} onChange={(e) => setHomeFeaturedProducts({ ...homeFeaturedProducts, title: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Section Subtitle</label>
                  <textarea value={homeFeaturedProducts.subtitle || ""} onChange={(e) => setHomeFeaturedProducts({ ...homeFeaturedProducts, subtitle: e.target.value })} rows={2} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                </div>

                <div style={{ marginTop: 10 }}>
                  <button onClick={() => handleSaveSection("site_content/home-page/featuredProducts", homeFeaturedProducts, "Featured Products Section")} disabled={saving} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                    {saving ? "Saving..." : "Save Featured Products Section"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab: Memories & Daylight */}
          {homeSubTab === "memories" && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 18, color: "var(--accent)", marginBottom: 20 }}>Where Memories Meet Nature's Light Settings</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Section Title</label>
                  <input type="text" value={homeMemories.title || ""} onChange={(e) => setHomeMemories({ ...homeMemories, title: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Section Body Narrative</label>
                  <textarea value={homeMemories.body || ""} onChange={(e) => setHomeMemories({ ...homeMemories, body: e.target.value })} rows={4} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Browse Button Text</label>
                    <input type="text" value={homeMemories.browseButtonText || ""} onChange={(e) => setHomeMemories({ ...homeMemories, browseButtonText: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Browse Button Link</label>
                    <input type="text" value={homeMemories.browseButtonLink || ""} onChange={(e) => setHomeMemories({ ...homeMemories, browseButtonLink: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Light Switch Label Text</label>
                    <input type="text" value={homeMemories.lightSwitchText || ""} onChange={(e) => setHomeMemories({ ...homeMemories, lightSwitchText: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <button onClick={() => handleSaveSection("site_content/home-page/memoriesSection", homeMemories, "Memories Section")} disabled={saving} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                    {saving ? "Saving..." : "Save Memories Section"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab: Written in Time */}
          {homeSubTab === "written" && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 18, color: "var(--accent)", marginBottom: 20 }}>Written in Time (Pen Story) Settings</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Eyebrow Tagline</label>
                    <input type="text" value={homeWrittenInTime.eyebrow || ""} onChange={(e) => setHomeWrittenInTime({ ...homeWrittenInTime, eyebrow: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Cursive Title</label>
                    <input type="text" value={homeWrittenInTime.title || ""} onChange={(e) => setHomeWrittenInTime({ ...homeWrittenInTime, title: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Story Body Text</label>
                  <textarea value={homeWrittenInTime.body || ""} onChange={(e) => setHomeWrittenInTime({ ...homeWrittenInTime, body: e.target.value })} rows={4} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Signature Text</label>
                  <input type="text" value={homeWrittenInTime.signature || ""} onChange={(e) => setHomeWrittenInTime({ ...homeWrittenInTime, signature: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                </div>

                <div style={{ marginTop: 10 }}>
                  <button onClick={() => handleSaveSection("site_content/home-page/writtenInTimeSection", homeWrittenInTime, "Written in Time Section")} disabled={saving} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                    {saving ? "Saving..." : "Save Written in Time Section"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab: Services Overview */}
          {homeSubTab === "services" && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 18, color: "var(--accent)", marginBottom: 20 }}>Homepage Services Overview Section Settings</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Section Eyebrow</label>
                    <input type="text" value={homeServicesSection.eyebrow || ""} onChange={(e) => setHomeServicesSection({ ...homeServicesSection, eyebrow: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Section Title</label>
                    <input type="text" value={homeServicesSection.title || ""} onChange={(e) => setHomeServicesSection({ ...homeServicesSection, title: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Section Body</label>
                  <textarea value={homeServicesSection.body || ""} onChange={(e) => setHomeServicesSection({ ...homeServicesSection, body: e.target.value })} rows={3} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                </div>

                {/* 3 Bullet Features */}
                <div style={{ background: "var(--surface2)", padding: 16, borderRadius: 8 }}>
                  <h4 style={{ fontSize: 14, color: "#fff", marginBottom: 12 }}>Feature Bullet 1</h4>
                  <input type="text" placeholder="Title" value={homeServicesSection.feature1Title || ""} onChange={(e) => setHomeServicesSection({ ...homeServicesSection, feature1Title: e.target.value })} style={{ width: "100%", background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 4, marginBottom: 8 }} />
                  <input type="text" placeholder="Description" value={homeServicesSection.feature1Desc || ""} onChange={(e) => setHomeServicesSection({ ...homeServicesSection, feature1Desc: e.target.value })} style={{ width: "100%", background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 4 }} />
                </div>

                <div style={{ background: "var(--surface2)", padding: 16, borderRadius: 8 }}>
                  <h4 style={{ fontSize: 14, color: "#fff", marginBottom: 12 }}>Feature Bullet 2</h4>
                  <input type="text" placeholder="Title" value={homeServicesSection.feature2Title || ""} onChange={(e) => setHomeServicesSection({ ...homeServicesSection, feature2Title: e.target.value })} style={{ width: "100%", background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 4, marginBottom: 8 }} />
                  <input type="text" placeholder="Description" value={homeServicesSection.feature2Desc || ""} onChange={(e) => setHomeServicesSection({ ...homeServicesSection, feature2Desc: e.target.value })} style={{ width: "100%", background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 4 }} />
                </div>

                <div style={{ background: "var(--surface2)", padding: 16, borderRadius: 8 }}>
                  <h4 style={{ fontSize: 14, color: "#fff", marginBottom: 12 }}>Feature Bullet 3</h4>
                  <input type="text" placeholder="Title" value={homeServicesSection.feature3Title || ""} onChange={(e) => setHomeServicesSection({ ...homeServicesSection, feature3Title: e.target.value })} style={{ width: "100%", background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 4, marginBottom: 8 }} />
                  <input type="text" placeholder="Description" value={homeServicesSection.feature3Desc || ""} onChange={(e) => setHomeServicesSection({ ...homeServicesSection, feature3Desc: e.target.value })} style={{ width: "100%", background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 4 }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Button Text</label>
                    <input type="text" value={homeServicesSection.buttonText || ""} onChange={(e) => setHomeServicesSection({ ...homeServicesSection, buttonText: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Button Link</label>
                    <input type="text" value={homeServicesSection.buttonLink || ""} onChange={(e) => setHomeServicesSection({ ...homeServicesSection, buttonLink: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <button onClick={() => handleSaveSection("site_content/home-page/servicesSection", homeServicesSection, "Services Overview Section")} disabled={saving} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                    {saving ? "Saving..." : "Save Services Overview Section"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CATALOG PAGE */}
      {activeTab === "catalog" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 18, color: "var(--accent)", marginBottom: 20 }}>Catalog Page Title & Subtitle Settings</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Banner Title</label>
              <input type="text" value={catalogPage.bannerTitle || ""} onChange={(e) => setCatalogPage({ ...catalogPage, bannerTitle: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Banner Subtitle Description</label>
              <textarea value={catalogPage.bannerSubtitle || ""} onChange={(e) => setCatalogPage({ ...catalogPage, bannerSubtitle: e.target.value })} rows={3} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
            </div>

            <div style={{ marginTop: 10 }}>
              <button onClick={() => handleSaveSection("site_content/catalog-page", catalogPage, "Catalog Page Content")} disabled={saving} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                {saving ? "Saving..." : "Save Catalog Page Content"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* TAB 3: SERVICES PAGE */}
      {activeTab === "services" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 18, color: "var(--accent)", marginBottom: 20 }}>Main Services Page (/services) Header Settings</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Hero Title</label>
              <input type="text" value={servicesPage.heroTitle || ""} onChange={(e) => setServicesPage({ ...servicesPage, heroTitle: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Hero Subtitle</label>
              <textarea value={servicesPage.heroSubtitle || ""} onChange={(e) => setServicesPage({ ...servicesPage, heroSubtitle: e.target.value })} rows={2} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
            </div>

            <div style={{ marginTop: 10 }}>
              <button onClick={() => handleSaveSection("site_content/services-page", servicesPage, "Services Page Content")} disabled={saving} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                {saving ? "Saving..." : "Save Services Page Content"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* TAB 4: TRACK ORDER PAGE */}
      {activeTab === "track" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 18, color: "var(--accent)", marginBottom: 20 }}>Track Order Page (/track-order) Settings</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Main Heading</label>
              <input type="text" value={trackPage.title || ""} onChange={(e) => setTrackPage({ ...trackPage, title: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Instruction Subtitle</label>
              <textarea value={trackPage.subtitle || ""} onChange={(e) => setTrackPage({ ...trackPage, subtitle: e.target.value })} rows={2} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Support Phone Number</label>
                <input type="text" value={trackPage.supportPhone || ""} onChange={(e) => setTrackPage({ ...trackPage, supportPhone: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Support Email Address</label>
                <input type="text" value={trackPage.supportEmail || ""} onChange={(e) => setTrackPage({ ...trackPage, supportEmail: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <button onClick={() => handleSaveSection("site_content/track-page", trackPage, "Track Order Page Settings")} disabled={saving} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                {saving ? "Saving..." : "Save Track Order Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CONTACT PAGE */}
      {activeTab === "contact" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 18, color: "var(--accent)", marginBottom: 20 }}>Contact Page (/contact) Settings</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Heading Title</label>
              <input type="text" value={contactPage.title || ""} onChange={(e) => setContactPage({ ...contactPage, title: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Subtitle Description</label>
              <textarea value={contactPage.subtitle || ""} onChange={(e) => setContactPage({ ...contactPage, subtitle: e.target.value })} rows={2} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
            </div>


            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Address Line 1</label>
                <input type="text" value={contactPage.addressLine1 || ""} onChange={(e) => setContactPage({ ...contactPage, addressLine1: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Address Line 2 (City / Country)</label>
                <input type="text" value={contactPage.addressLine2 || ""} onChange={(e) => setContactPage({ ...contactPage, addressLine2: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Phone 1</label>
                <input type="text" value={contactPage.phone1 || ""} onChange={(e) => setContactPage({ ...contactPage, phone1: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Phone 2</label>
                <input type="text" value={contactPage.phone2 || ""} onChange={(e) => setContactPage({ ...contactPage, phone2: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Email</label>
                <input type="text" value={contactPage.email || ""} onChange={(e) => setContactPage({ ...contactPage, email: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Working Hours String</label>
              <input type="text" value={contactPage.workingHours || ""} onChange={(e) => setContactPage({ ...contactPage, workingHours: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
            </div>

            <div style={{ marginTop: 10 }}>
              <button onClick={() => handleSaveSection("site_content/contact-page", contactPage, "Contact Page Settings")} disabled={saving} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                {saving ? "Saving..." : "Save Contact Page Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PRIVACY POLICY */}
      {activeTab === "privacy" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 18, color: "var(--accent)", marginBottom: 12 }}>Privacy Policy Editor (/privacy-policy)</h3>
          <textarea
            value={privacyContent}
            onChange={(e) => setPrivacyContent(e.target.value)}
            rows={15}
            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 14, borderRadius: 8, fontSize: 14, lineHeight: 1.6 }}
          />
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => handleSaveSection("site_content/privacy-policy-page", { title: "Privacy Policy", content: privacyContent }, "Privacy Policy")}
              disabled={saving}
              style={{ background: "var(--accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
            >
              {saving ? "Saving..." : "Save Privacy Policy"}
            </button>
          </div>
        </div>
      )}

      {/* TAB 7: REFUND POLICY */}
      {activeTab === "refund" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 18, color: "var(--accent)", marginBottom: 12 }}>Refund Policy Editor (/refund-policy)</h3>
          <textarea
            value={refundContent}
            onChange={(e) => setRefundContent(e.target.value)}
            rows={15}
            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 14, borderRadius: 8, fontSize: 14, lineHeight: 1.6 }}
          />
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => handleSaveSection("site_content/refund-policy-page", { title: "Refund Policy", content: refundContent }, "Refund Policy")}
              disabled={saving}
              style={{ background: "var(--accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
            >
              {saving ? "Saving..." : "Save Refund Policy"}
            </button>
          </div>
        </div>
      )}

      {/* TAB 8: TERMS & CONDITIONS */}
      {activeTab === "terms" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 18, color: "var(--accent)", marginBottom: 12 }}>Terms & Conditions Editor (/terms-and-conditions)</h3>
          <textarea
            value={termsContent}
            onChange={(e) => setTermsContent(e.target.value)}
            rows={15}
            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 14, borderRadius: 8, fontSize: 14, lineHeight: 1.6 }}
          />
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => handleSaveSection("site_content/terms-page", { title: "Terms & Conditions", content: termsContent }, "Terms & Conditions")}
              disabled={saving}
              style={{ background: "var(--accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
            >
              {saving ? "Saving..." : "Save Terms & Conditions"}
            </button>
          </div>
        </div>
      )}

      {/* TAB 9: HEADER & FOOTER */}
      {activeTab === "footer" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 18, color: "var(--accent)", marginBottom: 20 }}>Header & Footer Brand Info</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Brand Name</label>
                <input type="text" value={navigation.brandName || ""} onChange={(e) => setNavigation({ ...navigation, brandName: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Support Email</label>
                <input type="text" value={navigation.supportEmail || ""} onChange={(e) => setNavigation({ ...navigation, supportEmail: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Support Phone Number</label>
                <input type="text" value={navigation.phone || ""} onChange={(e) => setNavigation({ ...navigation, phone: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Footer Tagline Text</label>
              <textarea value={navigation.tagline || ""} onChange={(e) => setNavigation({ ...navigation, tagline: e.target.value })} rows={2} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Studio Working Hours</label>
                <input type="text" value={navigation.studioHours || ""} onChange={(e) => setNavigation({ ...navigation, studioHours: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Workshop Location</label>
                <input type="text" value={navigation.location || ""} onChange={(e) => setNavigation({ ...navigation, location: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Developer LinkedIn URL</label>
                <input type="text" value={navigation.developerLink || ""} onChange={(e) => setNavigation({ ...navigation, developerLink: e.target.value })} style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }} />
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <button onClick={() => handleSaveSection("site_content/navigation", navigation, "Header & Footer Settings")} disabled={saving} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                {saving ? "Saving..." : "Save Header & Footer Settings"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
