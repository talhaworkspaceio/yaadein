"use client";

import { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../../../../../lib/firebase";

export default function AdminReelsPage() {
  const [tagline, setTagline] = useState("FOLLOW OUR JOURNEY");
  const [title, setTitle] = useState("#YaadeinFrames");
  const [subtitle, setSubtitle] = useState("See how our customers style their spaces. Tag us to get featured in our gallery.");
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Modal / Form state for adding/editing a reel
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [reelForm, setReelForm] = useState({
    authorName: "yaadein.pk",
    avatarInitial: "Y",
    platform: "Instagram",
    videoUrl: "/videos/yaadein.mp4",
    thumbnailUrl: "/images/dummyImg.jpg",
    caption: "Gallery wall completed! 🖼️✨ #YaadeinFrames #HomeDecor",
    likesCount: "234",
    commentsCount: "18",
    postDate: "2 days ago",
  });

  useEffect(() => {
    const reelsRef = ref(db, "site_content/home-page/socialFeedSection");
    const unsub = onValue(reelsRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setTagline(val.tagline || "FOLLOW OUR JOURNEY");
        setTitle(val.title || "#YaadeinFrames");
        setSubtitle(val.subtitle || "See how our customers style their spaces. Tag us to get featured in our gallery.");
        setReels(val.reels || []);
      } else {
        // Default initial reels if empty
        setReels([
          {
            authorName: "hassan.captures",
            avatarInitial: "H",
            platform: "Instagram",
            videoUrl: "/videos/yaadein.mp4",
            thumbnailUrl: "/images/dummyImg.jpg",
            caption: "Excepteur sint occaecat cupidatat non proident, sunt in culpa. Gallery wall completed! 📸 #WallArt #Photography",
            likesCount: "156",
            commentsCount: "9",
            postDate: "2 weeks ago",
          },
          {
            authorName: "zainab.frames",
            avatarInitial: "Z",
            platform: "Instagram",
            videoUrl: "/videos/yaadein.mp4",
            thumbnailUrl: "/images/dummyImg.jpg",
            caption: "Absolutely in love with the classic oak frame! It matches my bedroom aesthetic perfectly. 🌿✨ #AestheticHome #Decor",
            likesCount: "245",
            commentsCount: "19",
            postDate: "3 weeks ago",
          },
          {
            authorName: "maryam.spaces",
            avatarInitial: "M",
            platform: "Instagram",
            videoUrl: "/videos/yaadein.mp4",
            thumbnailUrl: "/images/dummyImg.jpg",
            caption: "The gold frame detailing is even more beautiful in person. Handcrafted perfection! 💛 #ArtStudio #LuxuryHome",
            likesCount: "198",
            commentsCount: "14",
            postDate: "1 month ago",
          },
        ]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    setMessage("");
    try {
      await set(ref(db, "site_content/home-page/socialFeedSection"), {
        tagline,
        title,
        subtitle,
        reels,
      });
      setMessage("✅ #YaadeinFrames Video Reels updated successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to save video reels.");
    } finally {
      setSaving(false);
    }
  };

  const openAddModal = () => {
    setEditIndex(null);
    setReelForm({
      authorName: "yaadein.pk",
      avatarInitial: "Y",
      platform: "Instagram",
      videoUrl: "/videos/yaadein.mp4",
      thumbnailUrl: "/images/dummyImg.jpg",
      caption: "Check out this customer styling! 🖼️✨ #YaadeinFrames",
      likesCount: "198",
      commentsCount: "14",
      postDate: "Recently",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (index) => {
    setEditIndex(index);
    setReelForm({ ...reels[index] });
    setIsModalOpen(true);
  };

  const handleSaveReel = (e) => {
    e.preventDefault();
    const updated = [...reels];
    if (editIndex !== null) {
      updated[editIndex] = reelForm;
    } else {
      updated.push(reelForm);
    }
    setReels(updated);
    setIsModalOpen(false);
  };

  const handleDeleteReel = (index) => {
    if (confirm("Are you sure you want to delete this reel?")) {
      const updated = reels.filter((_, i) => i !== index);
      setReels(updated);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, color: "var(--text2)" }}>Loading Video Reels...</div>;
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 0 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--text)" }}>
            #YaadeinFrames <span>Video Reels Manager</span>
          </h1>
          <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>
            Upload & configure customer video reels displayed on the homepage carousel.
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
            + Add New Reel
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            style={{
              background: "var(--accent)",
              color: "#000",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </div>

      {message && (
        <div style={{ background: "rgba(201, 168, 76, 0.15)", border: "1px solid var(--accent)", color: "var(--accent)", padding: 14, borderRadius: 8, marginBottom: 24 }}>
          {message}
        </div>
      )}

      {/* Section Header Inputs */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, color: "var(--accent)", marginBottom: 16 }}>Section Title & Heading Settings</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>Tagline / Eyebrow</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)", color: "#fff", padding: 10, borderRadius: 6 }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>Hashtag / Title</label>
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

      {/* Video Reels Cards Grid */}
      <h3 style={{ fontSize: 18, color: "var(--text)", marginBottom: 16 }}>
        Active Video Reels ({reels.length})
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
        {reels.map((reel, idx) => (
          <div key={idx} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "relative", width: "100%", height: 320, background: "#000" }}>
              {reel.videoUrl ? (
                <video
                  src={reel.videoUrl}
                  poster={reel.thumbnailUrl}
                  controls
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <img src={reel.thumbnailUrl || "/images/dummyImg.jpg"} alt={reel.authorName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.7)", color: "var(--accent)", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                🎬 REEL #{idx + 1}
              </div>
            </div>

            <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent)", color: "#000", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                    {reel.avatarInitial || "Y"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>@{reel.authorName}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>{reel.platform} • {reel.postDate}</div>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: "var(--text2)", margin: "10px 0", lineHeight: 1.4 }}>
                  {reel.caption}
                </p>

                <div style={{ fontSize: 12, color: "var(--accent)", display: "flex", gap: 16 }}>
                  <span>❤️ {reel.likesCount || 0} Likes</span>
                  <span>💬 {reel.commentsCount || 0} Comments</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={() => openEditModal(idx)}
                  style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border2)", color: "#fff", padding: "8px 0", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
                >
                  Edit Reel
                </button>
                <button
                  onClick={() => handleDeleteReel(idx)}
                  style={{ background: "rgba(255, 62, 108, 0.15)", border: "1px solid #FF3E6C", color: "#FF3E6C", padding: "8px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Add / Edit Reel */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 12, width: 550, maxWidth: "100%", padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 20, color: "var(--accent)", marginBottom: 20 }}>
              {editIndex !== null ? `Edit Reel #${editIndex + 1}` : "Add New Video Reel"}
            </h2>

            <form onSubmit={handleSaveReel} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Video File URL (MP4 / WebM)</label>
                <input
                  type="text"
                  value={reelForm.videoUrl}
                  onChange={(e) => setReelForm({ ...reelForm, videoUrl: e.target.value })}
                  placeholder="/videos/yaadein.mp4 or https://..."
                  required
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Thumbnail / Poster Image URL</label>
                <input
                  type="text"
                  value={reelForm.thumbnailUrl}
                  onChange={(e) => setReelForm({ ...reelForm, thumbnailUrl: e.target.value })}
                  placeholder="/images/dummyImg.jpg or https://..."
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Author Username</label>
                  <input
                    type="text"
                    value={reelForm.authorName}
                    onChange={(e) => setReelForm({ ...reelForm, authorName: e.target.value })}
                    required
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Avatar Initial Badge</label>
                  <input
                    type="text"
                    value={reelForm.avatarInitial}
                    onChange={(e) => setReelForm({ ...reelForm, avatarInitial: e.target.value })}
                    maxLength={2}
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Caption Text</label>
                <textarea
                  value={reelForm.caption}
                  onChange={(e) => setReelForm({ ...reelForm, caption: e.target.value })}
                  rows={3}
                  required
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Likes Count</label>
                  <input
                    type="text"
                    value={reelForm.likesCount}
                    onChange={(e) => setReelForm({ ...reelForm, likesCount: e.target.value })}
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Comments Count</label>
                  <input
                    type="text"
                    value={reelForm.commentsCount}
                    onChange={(e) => setReelForm({ ...reelForm, commentsCount: e.target.value })}
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Post Date</label>
                  <input
                    type="text"
                    value={reelForm.postDate}
                    onChange={(e) => setReelForm({ ...reelForm, postDate: e.target.value })}
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: "none", border: "1px solid var(--border2)", color: "var(--text2)", padding: "10px 18px", borderRadius: 6, cursor: "pointer" }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{ background: "var(--accent)", color: "#000", border: "none", padding: "10px 24px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
                >
                  {editIndex !== null ? "Update Reel" : "Add Reel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
