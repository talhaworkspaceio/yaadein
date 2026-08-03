"use client";

import { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../../../../../lib/firebase";

export default function AdminSiteContentPage() {
  const [activeTab, setActiveTab] = useState("privacy");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Form states for each section
  const [privacyContent, setPrivacyContent] = useState("");
  const [refundContent, setRefundContent] = useState("");
  const [termsContent, setTermsContent] = useState("");

  const [homeHero, setHomeHero] = useState({
    titleLine1: "Turn Your",
    titleLine2: "Moments Into",
    titleHighlight: "Museum Art",
    subtitle: "Experience bespoke picture framing handcrafted for your specific style. Customize details in real-time, and let our master artisans deliver it ready to hang.",
    backgroundVideoUrl: "/videos/yaadein.mp4",
  });

  const [navigation, setNavigation] = useState({
    brandName: "Yaadein",
    tagline: "Masterpiece picture framing handcrafted for your unique memories.",
    supportEmail: "team@yaadein.com",
    studioHours: "Mon - Fri: 9:00 AM - 6:00 PM",
    location: "Designed & Handcrafted in Pakistan",
    developerLink: "https://linkedin.com",
    copyrightText: "2026 Yaadein. All rights reserved.",
  });

  useEffect(() => {
    // Listen to privacy policy
    const privacyRef = ref(db, "site_content/privacy-policy-page");
    onValue(privacyRef, (snap) => {
      const val = snap.val();
      if (val) setPrivacyContent(val.content || val.detailedText || "");
    });

    // Listen to refund policy
    const refundRef = ref(db, "site_content/refund-policy-page");
    onValue(refundRef, (snap) => {
      const val = snap.val();
      if (val) setRefundContent(val.content || val.detailedText || "");
    });

    // Listen to terms
    const termsRef = ref(db, "site_content/terms-page");
    onValue(termsRef, (snap) => {
      const val = snap.val();
      if (val) setTermsContent(val.content || val.detailedText || "");
    });

    // Listen to home page hero
    const homeRef = ref(db, "site_content/home-page/hero");
    onValue(homeRef, (snap) => {
      const val = snap.val();
      if (val) setHomeHero(val);
    });

    // Listen to navigation/footer
    const navRef = ref(db, "site_content/navigation");
    onValue(navRef, (snap) => {
      const val = snap.val();
      if (val) setNavigation(val);
      setLoading(false);
    });
  }, []);

  const handleSavePrivacy = async () => {
    setSaving(true);
    setMessage("");
    try {
      await set(ref(db, "site_content/privacy-policy-page"), {
        title: "Privacy Policy",
        content: privacyContent,
        detailedText: privacyContent,
      });
      setMessage("✅ Privacy Policy text saved successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (e) {
      setMessage("❌ Failed to save Privacy Policy.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRefund = async () => {
    setSaving(true);
    setMessage("");
    try {
      await set(ref(db, "site_content/refund-policy-page"), {
        title: "Refund Policy",
        content: refundContent,
        detailedText: refundContent,
      });
      setMessage("✅ Refund Policy text saved successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (e) {
      setMessage("❌ Failed to save Refund Policy.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTerms = async () => {
    setSaving(true);
    setMessage("");
    try {
      await set(ref(db, "site_content/terms-page"), {
        title: "Terms & Conditions",
        content: termsContent,
        detailedText: termsContent,
      });
      setMessage("✅ Terms & Conditions text saved successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (e) {
      setMessage("❌ Failed to save Terms & Conditions.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHomeHero = async () => {
    setSaving(true);
    setMessage("");
    try {
      await set(ref(db, "site_content/home-page/hero"), homeHero);
      setMessage("✅ Homepage Hero text saved successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (e) {
      setMessage("❌ Failed to save Homepage Hero text.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNavigation = async () => {
    setSaving(true);
    setMessage("");
    try {
      await set(ref(db, "site_content/navigation"), navigation);
      setMessage("✅ Header & Footer settings saved successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (e) {
      setMessage("❌ Failed to save Header & Footer settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, color: "var(--text2)" }}>Loading Site Content...</div>;
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 0 60px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--text)" }}>
          Site Content <span>& Policy Manager</span>
        </h1>
        <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>
          Edit policies, homepage text, hero background video, header & footer brand info.
        </p>
      </div>

      {message && (
        <div style={{ background: "rgba(201, 168, 76, 0.15)", border: "1px solid var(--accent)", color: "var(--accent)", padding: 14, borderRadius: 8, marginBottom: 24 }}>
          {message}
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: 10, borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 28, overflowX: "auto" }}>
        {[
          { id: "hero", label: "Homepage Hero" },
          { id: "privacy", label: "Privacy Policy" },
          { id: "refund", label: "Refund Policy" },
          { id: "terms", label: "Terms & Conditions" },
          { id: "footer", label: "Header & Footer" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? "var(--accent)" : "var(--surface)",
              color: activeTab === tab.id ? "#000" : "var(--text2)",
              border: activeTab === tab.id ? "none" : "1px solid var(--border2)",
              borderRadius: 8,
              padding: "10px 20px",
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

      {/* TAB 1: HOMEPAGE HERO */}
      {activeTab === "hero" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 18, color: "var(--accent)", marginBottom: 20 }}>Homepage Hero Section Settings</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Title Line 1</label>
                <input
                  type="text"
                  value={homeHero.titleLine1 || ""}
                  onChange={(e) => setHomeHero({ ...homeHero, titleLine1: e.target.value })}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Title Line 2</label>
                <input
                  type="text"
                  value={homeHero.titleLine2 || ""}
                  onChange={(e) => setHomeHero({ ...homeHero, titleLine2: e.target.value })}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Highlighted Text (Gold)</label>
                <input
                  type="text"
                  value={homeHero.titleHighlight || ""}
                  onChange={(e) => setHomeHero({ ...homeHero, titleHighlight: e.target.value })}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Hero Subtitle / Description</label>
              <textarea
                value={homeHero.subtitle || ""}
                onChange={(e) => setHomeHero({ ...homeHero, subtitle: e.target.value })}
                rows={3}
                style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Background Video File URL (MP4)</label>
              <input
                type="text"
                value={homeHero.backgroundVideoUrl || ""}
                onChange={(e) => setHomeHero({ ...homeHero, backgroundVideoUrl: e.target.value })}
                placeholder="/videos/yaadein.mp4"
                style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
              />
            </div>

            <div style={{ marginTop: 10 }}>
              <button
                onClick={handleSaveHomeHero}
                disabled={saving}
                style={{ background: "var(--accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
              >
                {saving ? "Saving..." : "Save Homepage Hero Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRIVACY POLICY */}
      {activeTab === "privacy" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 18, color: "var(--accent)", marginBottom: 12 }}>Privacy Policy Editor</h3>
          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
            Edit full description text for Privacy Policy (/privacy-policy). New lines are preserved live on the frontend.
          </p>

          <textarea
            value={privacyContent}
            onChange={(e) => setPrivacyContent(e.target.value)}
            rows={15}
            placeholder="Enter Privacy Policy text here..."
            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 14, borderRadius: 8, fontSize: 14, lineHeight: 1.6 }}
          />

          <div style={{ marginTop: 16 }}>
            <button
              onClick={handleSavePrivacy}
              disabled={saving}
              style={{ background: "var(--accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
            >
              {saving ? "Saving..." : "Save Privacy Policy Text"}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: REFUND POLICY */}
      {activeTab === "refund" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 18, color: "var(--accent)", marginBottom: 12 }}>Refund Policy Editor</h3>
          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
            Edit full description text for Refund & Returns Policy (/refund-policy).
          </p>

          <textarea
            value={refundContent}
            onChange={(e) => setRefundContent(e.target.value)}
            rows={15}
            placeholder="Enter Refund Policy text here..."
            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 14, borderRadius: 8, fontSize: 14, lineHeight: 1.6 }}
          />

          <div style={{ marginTop: 16 }}>
            <button
              onClick={handleSaveRefund}
              disabled={saving}
              style={{ background: "var(--accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
            >
              {saving ? "Saving..." : "Save Refund Policy Text"}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: TERMS & CONDITIONS */}
      {activeTab === "terms" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 18, color: "var(--accent)", marginBottom: 12 }}>Terms & Conditions Editor</h3>
          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
            Edit full description text for Terms & Conditions (/terms-and-conditions).
          </p>

          <textarea
            value={termsContent}
            onChange={(e) => setTermsContent(e.target.value)}
            rows={15}
            placeholder="Enter Terms & Conditions text here..."
            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 14, borderRadius: 8, fontSize: 14, lineHeight: 1.6 }}
          />

          <div style={{ marginTop: 16 }}>
            <button
              onClick={handleSaveTerms}
              disabled={saving}
              style={{ background: "var(--accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
            >
              {saving ? "Saving..." : "Save Terms & Conditions Text"}
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: HEADER & FOOTER */}
      {activeTab === "footer" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 18, color: "var(--accent)", marginBottom: 20 }}>Header & Footer Brand Info</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Brand Name</label>
                <input
                  type="text"
                  value={navigation.brandName || ""}
                  onChange={(e) => setNavigation({ ...navigation, brandName: e.target.value })}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Support Email</label>
                <input
                  type="text"
                  value={navigation.supportEmail || ""}
                  onChange={(e) => setNavigation({ ...navigation, supportEmail: e.target.value })}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Footer Tagline Text</label>
              <textarea
                value={navigation.tagline || ""}
                onChange={(e) => setNavigation({ ...navigation, tagline: e.target.value })}
                rows={2}
                style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Studio Working Hours</label>
                <input
                  type="text"
                  value={navigation.studioHours || ""}
                  onChange={(e) => setNavigation({ ...navigation, studioHours: e.target.value })}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Workshop Location</label>
                <input
                  type="text"
                  value={navigation.location || ""}
                  onChange={(e) => setNavigation({ ...navigation, location: e.target.value })}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Developer LinkedIn URL</label>
                <input
                  type="text"
                  value={navigation.developerLink || ""}
                  onChange={(e) => setNavigation({ ...navigation, developerLink: e.target.value })}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                />
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <button
                onClick={handleSaveNavigation}
                disabled={saving}
                style={{ background: "var(--accent)", color: "#000", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
              >
                {saving ? "Saving..." : "Save Header & Footer Settings"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
