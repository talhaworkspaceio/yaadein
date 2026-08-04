"use client";

import { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../../../../../lib/firebase";

export const normalizeIgUrl = (u) => {
  if (!u) return "";
  let clean = u.trim();
  if (!clean.endsWith("/")) clean += "/";
  return clean;
};

export const getIgEmbedUrl = (u) => {
  if (!u) return "";
  const norm = normalizeIgUrl(u);
  if (norm.includes("/embed")) return norm;
  return `${norm}embed/?cr=1&v=14&rd=`;
};

const DEFAULT_INITIAL_REELS = [
  {
    instagramUrl: "https://www.instagram.com/reel/DaiiHdCNkku/",
    caption: "Behind the chair at Yaadein Studio. Handcrafted luxury solid wood frames.",
    featured: true,
    label: "Featured Studio Reel",
    authorName: "yaadein.pk",
    likesCount: "254",
    commentsCount: "18",
  },
  {
    instagramUrl: "https://www.instagram.com/reel/Dai-iyjNbe3/",
    caption: "Bridal Nikkah Nama framing glow in the making.",
    featured: false,
    label: "Customer Showcase",
    authorName: "yaadein.pk",
    likesCount: "312",
    commentsCount: "24",
  },
];

export default function AdminReelsPage() {
  const [tagline, setTagline] = useState("OUR WORK IN MOTION");
  const [title, setTitle] = useState("Straight from our Instagram");
  const [subtitle, setSubtitle] = useState("See how our customers style their spaces. Copy & paste any Instagram Reel link to show it live on your home page.");
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Modal / Form state for adding/editing a reel
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const [reelForm, setReelForm] = useState({
    instagramUrl: "",
    caption: "",
    featured: false,
    label: "Featured Reel",
    authorName: "yaadein.pk",
    likesCount: "150",
    commentsCount: "12",
  });

  useEffect(() => {
    const reelsRef = ref(db, "site_content/home-page/socialFeedSection");
    const unsub = onValue(reelsRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setTagline(val.tagline || "OUR WORK IN MOTION");
        setTitle(val.title || "Straight from our Instagram");
        setSubtitle(val.subtitle || "See how our customers style their spaces. Copy & paste any Instagram Reel link to show it live on your home page.");
        
        if (val.reels !== undefined && val.reels !== null) {
          const rawList = Array.isArray(val.reels) ? val.reels : Object.values(val.reels);
          const cleanedReels = rawList.map(r => ({
            instagramUrl: r.instagramUrl || r.url || r.videoUrl || "",
            caption: r.caption || "",
            featured: !!r.featured,
            label: r.label || "Studio Reel",
            authorName: r.authorName || "yaadein.pk",
            likesCount: r.likesCount || "150",
            commentsCount: r.commentsCount || "12",
          }));
          setReels(cleanedReels);
        } else if (val.isCustomInitialized) {
          setReels([]);
        } else {
          setReels(DEFAULT_INITIAL_REELS);
        }
      } else {
        setReels(DEFAULT_INITIAL_REELS);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSaveAll = async (reelsToSave = reels) => {
    setSaving(true);
    setMessage("");
    try {
      await set(ref(db, "site_content/home-page/socialFeedSection"), {
        tagline,
        title,
        subtitle,
        reels: reelsToSave,
        isCustomInitialized: true,
        updatedAt: new Date().toISOString(),
      });
      setMessage("✅ Changes saved & published to Firebase!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const openAddModal = () => {
    setEditIndex(null);
    setReelForm({
      instagramUrl: "",
      caption: "Behind the scenes at Yaadein Studio 🖼️✨ #YaadeinFrames",
      featured: false,
      label: "Featured Reel",
      authorName: "yaadein.pk",
      likesCount: "185",
      commentsCount: "15",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (index) => {
    setEditIndex(index);
    setReelForm({ ...reels[index], authorName: "yaadein.pk" });
    setIsModalOpen(true);
  };

  const handleSaveReel = (e) => {
    e.preventDefault();
    if (!reelForm.instagramUrl.trim()) {
      alert("Please paste a valid Instagram Reel link!");
      return;
    }

    const updated = [...reels];
    const itemToSave = {
      ...reelForm,
      instagramUrl: reelForm.instagramUrl.trim(),
      authorName: "yaadein.pk",
    };

    if (editIndex !== null) {
      updated[editIndex] = itemToSave;
    } else {
      updated.push(itemToSave);
    }
    setReels(updated);
    setIsModalOpen(false);
    handleSaveAll(updated);
  };

  const handleDeleteReel = (index) => {
    if (confirm("Are you sure you want to delete this Instagram Reel?")) {
      const updated = reels.filter((_, i) => i !== index);
      setReels(updated);
      handleSaveAll(updated);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, color: "var(--text2)" }}>Loading Instagram Reels...</div>;
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 0 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--text)" }}>
            📸 <span>Instagram Reels Manager</span>
          </h1>
          <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>
            Simply copy and paste any Instagram Reel link (e.g. <code>https://www.instagram.com/reel/DaiiHdCNkku/</code>) to render it live on your home page with full Instagram post UI.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={openAddModal}
            style={{
              background: "var(--surface2)",
              color: "var(--accent)",
              border: "1px solid var(--accent)",
              borderRadius: 8,
              padding: "10px 20px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Add Instagram Reel Link
          </button>

          <button
            onClick={() => handleSaveAll(reels)}
            disabled={saving}
            style={{
              background: "linear-gradient(135deg, #C9A84C 0%, #E8D48B 50%, #C9A84C 100%)",
              color: "#000",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(201, 168, 76, 0.4)",
            }}
          >
            {saving ? "Saving..." : "💾 Save All Changes"}
          </button>
        </div>
      </div>

      {message && (
        <div style={{ background: "rgba(201, 168, 76, 0.15)", border: "1px solid var(--accent)", color: "var(--accent)", padding: 14, borderRadius: 8, marginBottom: 24, fontWeight: 600 }}>
          {message}
        </div>
      )}

      {/* Section Header Inputs */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, color: "var(--accent)", marginBottom: 16, fontWeight: 700 }}>Section Title & Header Settings</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>Eyebrow / Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)", color: "#fff", padding: 10, borderRadius: 6 }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>Main Heading Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)", color: "#fff", padding: 10, borderRadius: 6 }}
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>Subtitle Description</label>
          <textarea
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            rows={2}
            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)", color: "#fff", padding: 10, borderRadius: 6 }}
          />
        </div>
      </div>

      {/* Active Reels Grid */}
      <h3 style={{ fontSize: 18, color: "var(--text)", marginBottom: 16, fontWeight: 700 }}>
        Active Instagram Reels ({reels.length})
      </h3>

      {reels.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
          {reels.map((reel, idx) => {
            const embed = getIgEmbedUrl(reel.instagramUrl);
            return (
              <div key={idx} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                
                {/* Instagram Embed Live Preview */}
                <div style={{ position: "relative", width: "100%", height: 620, background: "#000" }}>
                  {embed ? (
                    <iframe
                      title={`Instagram Reel ${idx + 1}`}
                      src={embed}
                      style={{ border: 0, width: "100%", height: "100%", background: "#000" }}
                      allow="autoplay; encrypted-media; clipboard-write"
                      allowFullScreen
                      scrolling="no"
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text2)", fontSize: 12 }}>
                      Invalid Instagram URL
                    </div>
                  )}
                  
                  {reel.featured && (
                    <div style={{ position: "absolute", top: 12, right: 12, background: "var(--accent)", color: "#000", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, zIndex: 10 }}>
                      ★ FEATURED REEL
                    </div>
                  )}
                </div>

                {/* Controls & Details */}
                <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {reel.label || "Studio Reel"}
                    </div>
                    <div style={{ fontSize: 12, color: "#FFF", fontFamily: "monospace", margin: "4px 0 8px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      🔗 {reel.instagramUrl}
                    </div>
                    {reel.caption && (
                      <p style={{ fontSize: 13, color: "var(--text2)", margin: 0, lineHeight: 1.4 }}>
                        {reel.caption}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                    <button
                      onClick={() => openEditModal(idx)}
                      style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border2)", color: "#fff", padding: "8px 0", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                    >
                      ✏️ Edit Link & Info
                    </button>
                    <button
                      onClick={() => handleDeleteReel(idx)}
                      style={{ background: "rgba(255, 62, 108, 0.15)", border: "1px solid #FF3E6C", color: "#FF3E6C", padding: "8px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: "60px 20px", textAlign: "center", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: 16, color: "var(--text2)" }}>
          <h3>No Instagram Reels Added Yet</h3>
          <p style={{ fontSize: 13, marginTop: 6 }}>Click "+ Add Instagram Reel Link" to add your first reel.</p>
        </div>
      )}

      {/* Modal for Add / Edit Reel */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 16, width: 560, maxWidth: "100%", padding: 28, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 20, color: "var(--accent)", marginBottom: 20, fontWeight: 700 }}>
              {editIndex !== null ? `Edit Reel #${editIndex + 1}` : "➕ Add Instagram Reel Link"}
            </h2>

            <form onSubmit={handleSaveReel} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              {/* PRIMARY INPUT: INSTAGRAM REEL URL */}
              <div style={{ background: "rgba(201, 168, 76, 0.12)", border: "1px solid var(--accent)", borderRadius: 10, padding: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "var(--accent)", marginBottom: 6 }}>
                  🔗 Instagram Reel Link / URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://www.instagram.com/reel/DaiiHdCNkku/"
                  value={reelForm.instagramUrl}
                  onChange={(e) => setReelForm({ ...reelForm, instagramUrl: e.target.value })}
                  style={{ width: "100%", background: "#0A0805", border: "1px solid var(--border2)", color: "#fff", padding: 12, borderRadius: 8, fontSize: 13, fontFamily: "monospace" }}
                />
                <span style={{ fontSize: 11, color: "var(--text2)", display: "block", marginTop: 6 }}>
                  💡 Copy any Reel or Post link directly from Instagram app or web.
                </span>
              </div>

              {/* LIVE EMBED PREVIEW */}
              {reelForm.instagramUrl.trim() && (
                <div style={{ background: "#000", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", height: 380 }}>
                  <iframe
                    title="Reel Preview"
                    src={getIgEmbedUrl(reelForm.instagramUrl)}
                    style={{ width: "100%", height: "100%", border: 0 }}
                    allow="autoplay; encrypted-media; clipboard-write"
                    allowFullScreen
                    scrolling="no"
                  />
                </div>
              )}

              {/* CAPTION TEXT */}
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#fff", fontWeight: 600, marginBottom: 4 }}>Caption / Description (Optional)</label>
                <textarea
                  value={reelForm.caption}
                  onChange={(e) => setReelForm({ ...reelForm, caption: e.target.value })}
                  rows={3}
                  placeholder="Behind the scenes at Yaadein Studio..."
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 8, fontSize: 13 }}
                />
              </div>

              {/* FEATURED TOGGLE & BADGE LABEL */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#fff", fontWeight: 600, marginBottom: 4 }}>Badge Label</label>
                  <input
                    type="text"
                    value={reelForm.label}
                    onChange={(e) => setReelForm({ ...reelForm, label: e.target.value })}
                    placeholder="e.g. Featured Collab"
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 6, fontSize: 12 }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--accent)", fontWeight: 700, background: "var(--surface2)", padding: 9, borderRadius: 6, border: "1px solid var(--border)" }}>
                    <input
                      type="checkbox"
                      checked={reelForm.featured}
                      onChange={(e) => setReelForm({ ...reelForm, featured: e.target.checked })}
                    />
                    Mark as Featured Reel
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: "none", border: "1px solid var(--border2)", color: "var(--text2)", padding: "10px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{ background: "var(--accent)", color: "#000", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 800, cursor: "pointer", fontSize: 13 }}
                >
                  {editIndex !== null ? "Update Reel Link" : "Add Reel Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
