"use client";

import { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../../../../../lib/firebase";

const DEFAULT_INITIAL_REELS = [
  {
    authorName: "yaadein.pk",
    avatarInitial: "Y",
    platform: "Instagram",
    videoUrl: "/videos/reel1.mp4",
    thumbnailUrl: "",
    caption: "Gallery wall completed! 📸 Handcrafted solid wood frames. #YaadeinFrames #HomeDecor",
    likesCount: "156",
    commentsCount: "9",
    postDate: "2 weeks ago",
  },
  {
    authorName: "yaadein.pk",
    avatarInitial: "Y",
    platform: "Instagram",
    videoUrl: "/videos/reel2.mp4",
    thumbnailUrl: "",
    caption: "Classic oak frame matching elegant room aesthetic perfectly. 🌿✨ #YaadeinFrames #Bespoke",
    likesCount: "245",
    commentsCount: "19",
    postDate: "3 weeks ago",
  },
  {
    authorName: "yaadein.pk",
    avatarInitial: "Y",
    platform: "Instagram",
    videoUrl: "/videos/reel3.mp4",
    thumbnailUrl: "",
    caption: "Gold frame detailing handcrafted with precision. Museum grade glass! 💛 #YaadeinFrames #ArtStudio",
    likesCount: "198",
    commentsCount: "14",
    postDate: "1 month ago",
  },
  {
    authorName: "yaadein.pk",
    avatarInitial: "Y",
    platform: "Instagram",
    videoUrl: "/videos/reel4.mp4",
    thumbnailUrl: "",
    caption: "Master artisan assembling a bespoke Nikkah Nama frame set in real cured mahogany wood! 🖼️✨ #YaadeinFrames",
    likesCount: "312",
    commentsCount: "27",
    postDate: "3 days ago",
  },
];

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
  const [videoUploading, setVideoUploading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const [reelForm, setReelForm] = useState({
    authorName: "yaadein.pk",
    avatarInitial: "Y",
    platform: "Instagram",
    videoUrl: "/videos/reel1.mp4",
    thumbnailUrl: "",
    caption: "Check out this customer styling! 🖼️✨ #YaadeinFrames",
    likesCount: "198",
    commentsCount: "14",
    postDate: "Recently",
  });

  useEffect(() => {
    const reelsRef = ref(db, "site_content/home-page/socialFeedSection");
    const unsub = onValue(reelsRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setTagline(val.tagline || "FOLLOW OUR JOURNEY");
        setTitle(val.title || "#YaadeinFrames");
        setSubtitle(val.subtitle || "See how our customers style their spaces. Tag us to get featured in our gallery.");
        
        // Clean reels so they use native video thumbnail unless a custom image is uploaded
        const cleanedReels = (val.reels && val.reels.length > 0)
          ? val.reels.map((r) => {
              let thumb = r.thumbnailUrl || "";
              if (thumb.includes("dummyImg.jpg") || thumb.includes("instagram_mirror_selfie.jpg") || thumb.includes("gallery_walls.png") || thumb.includes("bespoke_framing.png")) {
                thumb = ""; // Clear image fallback so native video frame is used as thumbnail
              }
              return {
                ...r,
                authorName: "yaadein.pk",
                avatarInitial: "Y",
                thumbnailUrl: thumb,
              };
            })
          : DEFAULT_INITIAL_REELS;

        setReels(cleanedReels);
      } else {
        setReels(DEFAULT_INITIAL_REELS);
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
      videoUrl: "/videos/reel1.mp4",
      thumbnailUrl: "",
      caption: "Check out this customer styling! 🖼️✨ #YaadeinFrames",
      likesCount: "198",
      commentsCount: "14",
      postDate: "Recently",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (index) => {
    setEditIndex(index);
    setReelForm({ ...reels[index], authorName: "yaadein.pk", avatarInitial: "Y" });
    setIsModalOpen(true);
  };

  const handleLocalVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      setReelForm((prev) => ({ ...prev, videoUrl: event.target.result }));
      setVideoUploading(false);
    };
    reader.onerror = () => {
      alert("Failed to read video file.");
      setVideoUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleLocalImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      setReelForm((prev) => ({ ...prev, thumbnailUrl: event.target.result }));
      setImageUploading(false);
    };
    reader.onerror = () => {
      alert("Failed to read image file.");
      setImageUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveReel = (e) => {
    e.preventDefault();
    const updated = [...reels];
    const itemToSave = { ...reelForm, authorName: "yaadein.pk", avatarInitial: "Y" };
    if (editIndex !== null) {
      updated[editIndex] = itemToSave;
    } else {
      updated.push(itemToSave);
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
            Upload local video files directly from your computer. Video elements automatically display their native 1st-frame video thumbnail.
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
        Active Playable Video Reels ({reels.length})
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
        {reels.map((reel, idx) => (
          <div key={idx} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "relative", width: "100%", height: 340, background: "#000" }}>
              {reel.videoUrl ? (
                <video
                  src={reel.videoUrl}
                  poster={reel.thumbnailUrl || undefined}
                  preload="metadata"
                  controls
                  loop
                  muted
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text2)", fontSize: 12 }}>
                  No Video Uploaded
                </div>
              )}
              <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.75)", color: "var(--accent)", padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                🎬 REEL #{idx + 1}
              </div>
            </div>

            <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--accent)", color: "#000", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                    Y
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>@yaadein.pk</div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>Instagram • {reel.postDate || "Recently"}</div>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 12, width: 580, maxWidth: "100%", padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 20, color: "var(--accent)", marginBottom: 20 }}>
              {editIndex !== null ? `Edit Reel #${editIndex + 1}` : "Add New Video Reel"}
            </h2>

            <form onSubmit={handleSaveReel} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              {/* VIDEO FILE UPLOAD FROM LOCAL SYSTEM */}
              <div style={{ background: "var(--surface2)", border: "1px dashed var(--border2)", borderRadius: 8, padding: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--accent)", marginBottom: 6 }}>
                  1. Upload Local Video File (from your computer)
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleLocalVideoUpload}
                  style={{ width: "100%", color: "var(--text2)", fontSize: 12 }}
                />
                {videoUploading && <p style={{ fontSize: 11, color: "var(--accent)", marginTop: 4 }}>Processing video file...</p>}
                
                <div style={{ marginTop: 10 }}>
                  <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>or Video URL / Relative Path:</label>
                  <input
                    type="text"
                    value={reelForm.videoUrl.length > 80 ? `${reelForm.videoUrl.substring(0, 75)}... (Local Base64 Video)` : reelForm.videoUrl}
                    onChange={(e) => setReelForm({ ...reelForm, videoUrl: e.target.value })}
                    placeholder="/videos/reel1.mp4 or https://..."
                    required
                    style={{ width: "100%", background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 6, fontSize: 12 }}
                  />
                </div>
              </div>

              {/* OPTIONAL CUSTOM THUMBNAIL IMAGE UPLOAD */}
              <div style={{ background: "var(--surface2)", border: "1px dashed var(--border2)", borderRadius: 8, padding: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text2)", marginBottom: 6 }}>
                  2. Optional Custom Poster Image (Leave blank to use native 1st frame video thumbnail)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLocalImageUpload}
                  style={{ width: "100%", color: "var(--text2)", fontSize: 12 }}
                />
                {imageUploading && <p style={{ fontSize: 11, color: "var(--accent)", marginTop: 4 }}>Processing image file...</p>}

                {reelForm.thumbnailUrl && (
                  <div style={{ marginTop: 10, width: 80, height: 80, borderRadius: 6, overflow: "hidden", border: "1px solid var(--accent)" }}>
                    <img src={reelForm.thumbnailUrl} alt="Thumbnail preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}

                <div style={{ marginTop: 10 }}>
                  <label style={{ display: "block", fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>or Optional Thumbnail URL (leave empty for video thumbnail):</label>
                  <input
                    type="text"
                    value={reelForm.thumbnailUrl.length > 80 ? `${reelForm.thumbnailUrl.substring(0, 75)}... (Local Base64 Image)` : reelForm.thumbnailUrl}
                    onChange={(e) => setReelForm({ ...reelForm, thumbnailUrl: e.target.value })}
                    placeholder="Leave empty for video native thumbnail"
                    style={{ width: "100%", background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 6, fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ background: "rgba(201, 168, 76, 0.1)", border: "1px solid var(--border2)", borderRadius: 6, padding: 10, fontSize: 12, color: "var(--accent)" }}>
                Author Profile: <strong>@yaadein.pk</strong> (Official Studio Account)
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
