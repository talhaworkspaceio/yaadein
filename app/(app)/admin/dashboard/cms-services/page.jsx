"use client";

import { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../../../../../lib/firebase";

export const INITIAL_DEFAULT_SERVICES = [
  {
    id: "instagram-mirror-selfie",
    title: "Instagram Mirror Selfie Frame",
    slug: "instagram-mirror-selfie",
    tagline: "Viral Interactive Selfie Mirror",
    shortDesc: "Transform your space with a custom-crafted Instagram Reel & Post mirror frame. Complete with personalized handle, verified badge, likes count, custom audio title, and high-clarity HD mirror center for unforgettable selfies.",
    detailedText: "Take your selfie game and interior decor to the next level with our handcrafted Instagram Mirror Selfie Frame. Designed to replicate an authentic Instagram Reel UI complete with your custom handle, blue verified checkmark, custom audio name, and engagement stats. Featuring a high-definition shatterproof mirror at its center, this frame turns everyday mirror selfies into viral social media moments. It is tailor-made for cafes, fashion boutiques, photo studios, and modern bedrooms looking to add a stylish, interactive aesthetic centerpiece.",
    priceInfo: "Custom mirror frames start from Rs. 4,999 depending on size and acrylic finishes.",
    imageUrl: "/images/instagram_mirror_selfie.jpg",
    featuredImage: "/images/instagram_mirror_selfie.jpg",
    images: ["/images/instagram_mirror_selfie.jpg"],
    videoUrl: "",
    orientation: "portrait",
    enableUploadPhoto: false,
    enableChooseFrame: false,
    enableSelectSize: true,
    enableMultipleImages: true,
    enableNavigationButton: true,
    features: [
      "Custom engraved Instagram Reel UI (Username, verified badge & audio)",
      "High-definition shatterproof studio acrylic mirror",
      "Interactive social stats: Likes, Comments, Shares & Bookmarks",
      "Perfect aesthetic focal point for cafés, boutiques, studios & bedrooms",
      "Includes solid wood back support and heavy-duty wall mounting hardware"
    ],
    ctaText: "Explore Details",
    ctaLink: "/services/instagram-mirror-selfie",
  },
  {
    id: "nikkahnama-framing",
    title: "Nikkah Nama Framing",
    slug: "nikkahnama-framing",
    tagline: "Preserve Your Sacred Bond",
    shortDesc: "Preserve the most sacred contract of your life in a premium handcrafted frame. We specialize in archival-grade Nikkah Nama framing, utilizing acid-free mounts and museum glass to ensure your signature bond stays protected and visually stunning for generations.",
    detailedText: "Your Nikkah Nama is more than just a document — it is the celebration of a sacred vow. Our specialized Nikkah Nama framing service ensures this precious heirloom is protected from aging, moisture, and sunlight. We use 100% acid-free mats to prevent discoloration, and offer museum-grade conservation glass that blocks 99% of harmful UV rays. Each frame is custom-built by hand to perfectly match the size and aesthetic of your contract, completed with elegant gold accents and double matting for a truly royal look.",
    priceInfo: "Framing starts from Rs. 4,000 depending on dimensions and wood selection.",
    imageUrl: "/images/nikkahnama_images/sample1.jpeg",
    featuredImage: "/images/nikkahnama_images/sample1.jpeg",
    images: ["/images/nikkahnama_images/sample1.jpeg"],
    videoUrl: "",
    orientation: "portrait",
    enableUploadPhoto: true,
    enableChooseFrame: true,
    enableSelectSize: true,
    enableMultipleImages: true,
    enableNavigationButton: true,
    features: [
      "Custom-fit double mounting with elegant gold borders",
      "99% UV-protection museum glass options",
      "Selection of premium local and imported wood trims",
      "Dust and humidity-controlled rear framing seal",
      "Includes premium hanging hardware and mounting wire"
    ],
    ctaText: "Explore Details",
    ctaLink: "/services/nikkahnama-framing",
  },
  {
    id: "photo-restoration",
    title: "Old Photo Restoration",
    slug: "photo-restoration",
    tagline: "Bring Memories Back to Life",
    shortDesc: "Bring your damaged, faded, or torn family photographs back to life. Our digital restoration specialists repair cracks, restore lost colors, and upscale resolutions for printing.",
    detailedText: "Every photograph is a window to a moment in time, but physical prints degrade, fade, and tear. Our professional restoration service carefully reconstructs your cherished images pixel by pixel. We remove scratches, fix cracks, balance faded colors, and can even colorize monochrome photos to make them feel alive today. Combining state-of-the-art AI upscaling with meticulous digital painting, we ensure that the final result looks completely natural while retaining the vintage soul of the original capture.",
    priceInfo: "Restorations start from Rs. 1,499 per photo depending on level of damage.",
    imageUrl: "/images/photo_restoration.png",
    featuredImage: "/images/photo_restoration.png",
    images: ["/images/photo_restoration.png"],
    videoUrl: "",
    orientation: "landscape",
    enableUploadPhoto: true,
    enableChooseFrame: true,
    enableSelectSize: true,
    enableMultipleImages: true,
    enableNavigationButton: true,
    features: [
      "Scratch, crease, and tear removal",
      "Advanced AI colorization of black & white photos",
      "High-fidelity upscaling and detail sharpening",
      "Digital delivery + premium printing options",
      "Water damage and stain reconstruction"
    ],
    ctaText: "Explore Details",
    ctaLink: "/services/photo-restoration",
  },
  {
    id: "photo-editing",
    title: "Photo Editing Service",
    slug: "photo-editing",
    tagline: "Professional Digital Retouching",
    shortDesc: "Enhance, retouch, and transform your digital photos before printing and framing. Whether you need background removal, beauty retouching, object removal, or professional color grading, our digital artists prepare your images to look their absolute best.",
    detailedText: "Make every photo a masterpiece before it goes on your wall. Our professional digital editing service covers everything from subtle enhancements to major manipulations. Our skilled artists carefully adjust colors, exposure, and composition to give your photos a cinematic quality. We can remove distracting elements in the background, blend multiple photos, perform high-end skin and portrait retouching, and upscale lower resolution files so they print beautifully at larger sizes.",
    priceInfo: "Edits start from Rs. 1,000 per photo depending on level of retouching.",
    imageUrl: "/images/restoration/child_after.png",
    featuredImage: "/images/restoration/child_after.png",
    images: ["/images/restoration/child_after.png"],
    videoUrl: "",
    orientation: "landscape",
    enableUploadPhoto: true,
    enableChooseFrame: false,
    enableSelectSize: true,
    enableMultipleImages: true,
    enableNavigationButton: true,
    features: [
      "Professional beauty retouching and skin correction",
      "Background replacement and unwanted object removal",
      "Cinematic color grading and lighting adjustments",
      "High-resolution sharpening and upscaling",
      "Object manipulation and custom creative edits"
    ],
    ctaText: "Explore Details",
    ctaLink: "/services/photo-editing",
  },
];

export default function AdminServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    title: "",
    slug: "",
    tagline: "",
    shortDesc: "",
    detailedText: "",
    priceInfo: "",
    imageUrl: "",
    featuredImage: "",
    images: [],
    videoUrl: "",
    videos: [],
    orientation: "portrait", // portrait | landscape
    enableUploadPhoto: true,
    enableChooseFrame: true,
    enableSelectSize: true,
    enableMultipleImages: true,
    enableNavigationButton: true,
    features: [],
    ctaText: "Explore Details",
    ctaLink: "/contact",
  });

  const [featureInput, setFeatureInput] = useState("");
  const [videoUrlInput, setVideoUrlInput] = useState("");

  // Cloudinary credentials
  const cloudinaryCloud = "hpikhwjw";
  const cloudinaryPreset = "ml_default";
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Upload video files directly to Cloudinary so we store lightweight CDN URLs, not 10MB+ base64 strings
  const handleVideoFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingVideo(true);
    let uploaded = 0;

    for (const file of files) {
      const dataUpload = new FormData();
      dataUpload.append("file", file);
      dataUpload.append("upload_preset", cloudinaryPreset);

      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloud}/video/upload`, {
          method: "POST",
          body: dataUpload,
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error?.message || "Video upload failed");
        }
        const result = await res.json();
        setServiceForm((prev) => {
          const nextVideos = [...(prev.videos || []), result.secure_url];
          return { ...prev, videos: nextVideos, videoUrl: nextVideos[0] };
        });
        uploaded += 1;
      } catch (err) {
        alert(`Video upload failed for "${file.name}": ${err.message}`);
      }
    }

    e.target.value = "";
    setUploadingVideo(false);
    if (uploaded > 0) {
      setMessage(`✅ ${uploaded} video${uploaded > 1 ? "s" : ""} uploaded successfully!`);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  // ----- Video list helpers (order here is the carousel order on the service page) -----
  const addVideoUrl = () => {
    const url = videoUrlInput.trim();
    if (!url) return;
    setServiceForm((prev) => {
      if ((prev.videos || []).includes(url)) return prev;
      const nextVideos = [...(prev.videos || []), url];
      return { ...prev, videos: nextVideos, videoUrl: nextVideos[0] };
    });
    setVideoUrlInput("");
  };

  const removeVideo = (vIdx) => {
    setServiceForm((prev) => {
      const nextVideos = (prev.videos || []).filter((_, i) => i !== vIdx);
      return { ...prev, videos: nextVideos, videoUrl: nextVideos[0] || "" };
    });
  };

  const moveVideo = (vIdx, dir) => {
    setServiceForm((prev) => {
      const nextVideos = [...(prev.videos || [])];
      const target = vIdx + dir;
      if (target < 0 || target >= nextVideos.length) return prev;
      [nextVideos[vIdx], nextVideos[target]] = [nextVideos[target], nextVideos[vIdx]];
      return { ...prev, videos: nextVideos, videoUrl: nextVideos[0] || "" };
    });
  };

  // Upload image files directly to Cloudinary
  const handleImagesUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImages(true);
    for (const file of files) {
      const dataUpload = new FormData();
      dataUpload.append("file", file);
      dataUpload.append("upload_preset", cloudinaryPreset);
      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloud}/image/upload`, {
          method: "POST",
          body: dataUpload,
        });
        if (res.ok) {
          const result = await res.json();
          setServiceForm((prev) => {
            const curr = prev.images || [];
            return {
              ...prev,
              images: [...curr, result.secure_url],
              featuredImage: prev.featuredImage || result.secure_url,
              imageUrl: prev.featuredImage || result.secure_url,
            };
          });
        }
      } catch (err) {
        console.error("Error uploading image to Cloudinary:", err);
      }
    }
    setUploadingImages(false);
  };

  useEffect(() => {
    const servicesRef = ref(db, "cms_services");
    const unsub = onValue(servicesRef, (snapshot) => {
      const val = snapshot.val();
      let list = [];
      if (val !== null && val !== undefined) {
        list = Array.isArray(val) ? val : Object.values(val);
        setServices(list);
      } else {
        // Only seed default services once if database node is completely empty
        setServices(INITIAL_DEFAULT_SERVICES);
        set(ref(db, "cms_services"), INITIAL_DEFAULT_SERVICES).catch(console.error);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    setMessage("");
    try {
      await set(ref(db, "cms_services"), services);
      setMessage("✅ All Services saved successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to save services.");
    } finally {
      setSaving(false);
    }
  };

  const openAddModal = () => {
    setEditIndex(null);
    setServiceForm({
      title: "",
      slug: "",
      tagline: "",
      shortDesc: "",
      detailedText: "",
      priceInfo: "",
      imageUrl: "/images/bespoke_framing.png",
      featuredImage: "/images/bespoke_framing.png",
      images: ["/images/bespoke_framing.png"],
      videoUrl: "",
      videos: [],
      features: [],
      ctaText: "Explore Details",
      ctaLink: "/contact",
    });
    setFeatureInput("");
    setVideoUrlInput("");
    setIsModalOpen(true);
  };

  const openEditModal = (idx) => {
    setEditIndex(idx);
    const item = services[idx];
    const initialImages = Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : (item.imageUrl ? [item.imageUrl] : ["/images/bespoke_framing.png"]);
    const initialFeatured = item.featuredImage || item.imageUrl || initialImages[0] || "/images/bespoke_framing.png";
    // Older services stored a single videoUrl; newer ones keep an ordered videos array.
    const initialVideos = Array.isArray(item.videos) && item.videos.length > 0
      ? item.videos.filter(Boolean)
      : (item.videoUrl ? [item.videoUrl] : []);

    setServiceForm({
      title: item.title || "",
      slug: item.slug || "",
      tagline: item.tagline || "",
      shortDesc: item.shortDesc || "",
      detailedText: item.detailedText || "",
      priceInfo: item.priceInfo || "",
      imageUrl: initialFeatured,
      featuredImage: initialFeatured,
      images: initialImages,
      videoUrl: initialVideos[0] || "",
      videos: initialVideos,
      orientation: item.orientation || "portrait",
      enableUploadPhoto: item.enableUploadPhoto !== undefined ? !!item.enableUploadPhoto : true,
      enableChooseFrame: item.enableChooseFrame !== undefined ? !!item.enableChooseFrame : true,
      enableSelectSize: item.enableSelectSize !== undefined ? !!item.enableSelectSize : true,
      enableMultipleImages: item.enableMultipleImages !== undefined ? !!item.enableMultipleImages : true,
      enableNavigationButton: item.enableNavigationButton !== undefined ? !!item.enableNavigationButton : true,
      features: Array.isArray(item.features) ? item.features : [],
      ctaText: item.ctaText || "Explore Details",
      ctaLink: item.ctaLink || `/services/${item.slug || ""}`,
    });
    setFeatureInput("");
    setVideoUrlInput("");
    setIsModalOpen(true);
  };

  const handleDelete = async (idx) => {
    const targetService = services[idx];
    if (!targetService) return;
    if (!confirm(`Are you sure you want to delete "${targetService.title || 'this service'}"?`)) return;

    const updated = services.filter((_, i) => i !== idx);
    setServices(updated);

    try {
      await set(ref(db, "cms_services"), updated);
      setMessage(`✅ Service "${targetService.title || 'Selected service'}" deleted successfully!`);
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to delete service.");
    }
  };

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    setServiceForm({
      ...serviceForm,
      features: [...serviceForm.features, featureInput.trim()],
    });
    setFeatureInput("");
  };

  const handleRemoveFeature = (fIdx) => {
    const updated = serviceForm.features.filter((_, i) => i !== fIdx);
    setServiceForm({ ...serviceForm, features: updated });
  };

  const handleModalSave = async (e) => {
    e.preventDefault();
    const cleanSlug = serviceForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") || serviceForm.title.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const cleanVideos = (serviceForm.videos || []).filter(Boolean);
    const updatedItem = {
      ...serviceForm,
      id: cleanSlug,
      slug: cleanSlug,
      imageUrl: serviceForm.featuredImage || serviceForm.imageUrl,
      videos: cleanVideos,
      // Kept in sync so anything still reading the old single field keeps working.
      videoUrl: cleanVideos[0] || "",
    };

    const updatedList = [...services];
    if (editIndex !== null) {
      updatedList[editIndex] = updatedItem;
    } else {
      updatedList.push(updatedItem);
    }

    setServices(updatedList);
    setIsModalOpen(false);

    try {
      await set(ref(db, "cms_services"), updatedList);
      setMessage("✅ Service saved and published to Firebase!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to save service.");
    }
  };

  if (loading) {
    return <div style={{ padding: 40, color: "var(--text2)" }}>Loading Services Manager...</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 0 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--text)" }}>
            Services Content Manager
          </h1>
          <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>
            Create and edit service cards, descriptions, prices, feature bullets, and inner service pages.
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
            + Add New Service
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
            {saving ? "Saving..." : "Save All Services"}
          </button>
        </div>
      </div>

      {message && (
        <div style={{ background: "rgba(201, 168, 76, 0.15)", border: "1px solid var(--accent)", color: "var(--accent)", padding: 14, borderRadius: 8, marginBottom: 24 }}>
          {message}
        </div>
      )}

      {/* Services Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
        {services.map((srv, idx) => (
          <div key={srv.id || idx} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ position: "relative", height: 180, background: "#000" }}>
                <img
                  src={srv.imageUrl || "/images/bespoke_framing.png"}
                  alt={srv.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.75)", color: "var(--accent)", fontSize: 11, padding: "3px 8px", borderRadius: 4, fontFamily: "monospace" }}>
                  /services/{srv.slug}
                </div>
              </div>

              <div style={{ padding: 20 }}>
                <h3 style={{ fontSize: 18, color: "#fff", fontWeight: 700, marginBottom: 4 }}>{srv.title}</h3>
                <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, marginBottom: 12 }}>{srv.tagline}</div>
                <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, marginBottom: 14 }}>{srv.shortDesc}</p>

                {srv.priceInfo && (
                  <div style={{ background: "var(--surface2)", padding: 10, borderRadius: 6, fontSize: 12, color: "#fff", borderLeft: "3px solid var(--accent)", marginBottom: 14 }}>
                    💰 {srv.priceInfo}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, padding: 16, borderTop: "1px solid var(--border)", background: "var(--surface2)" }}>
              <button
                onClick={() => openEditModal(idx)}
                style={{ flex: 1, background: "var(--surface)", color: "#fff", border: "1px solid var(--border2)", padding: "8px 0", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                Edit Service
              </button>
              <button
                onClick={() => handleDelete(idx)}
                style={{ background: "rgba(255, 90, 90, 0.15)", color: "#FF5A5A", border: "1px solid rgba(255, 90, 90, 0.3)", padding: "8px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Service Editor Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 30, maxWidth: 680, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 20, color: "var(--accent)", marginBottom: 20 }}>
              {editIndex !== null ? "Edit Service Card" : "Add New Service Card"}
            </h2>

            <form onSubmit={handleModalSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Service Title</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>URL Slug</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.slug}
                    onChange={(e) => setServiceForm({ ...serviceForm, slug: e.target.value })}
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6, fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Tagline / Badge</label>
                <input
                  type="text"
                  value={serviceForm.tagline}
                  onChange={(e) => setServiceForm({ ...serviceForm, tagline: e.target.value })}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6, fontSize: 13 }}
                />
              </div>

              {/* Main Studio Image Orientation & Display Mode */}
              <div style={{ background: "rgba(201, 168, 76, 0.05)", border: "1px solid rgba(201, 168, 76, 0.25)", borderRadius: 8, padding: 14 }}>
                <label style={{ display: "block", fontSize: 12, color: "var(--accent)", fontWeight: 700, marginBottom: 6 }}>
                  Main Studio Image Mode (Orientation)
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 6,
                      background: serviceForm.orientation === "portrait" ? "rgba(201, 168, 76, 0.2)" : "var(--surface2)",
                      border: `1.5px solid ${serviceForm.orientation === "portrait" ? "var(--accent)" : "var(--border)"}`,
                      cursor: "pointer",
                      fontSize: 13,
                      color: "#fff",
                      fontWeight: serviceForm.orientation === "portrait" ? 700 : 400
                    }}
                  >
                    <input
                      type="radio"
                      name="orientation"
                      value="portrait"
                      checked={serviceForm.orientation === "portrait"}
                      onChange={() => setServiceForm({ ...serviceForm, orientation: "portrait" })}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>Portrait (Vertical)</div>
                      <div style={{ fontSize: 10, color: "var(--text2)" }}>Tall ratio (e.g. Nikkahnama, Mirror)</div>
                    </div>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 6,
                      background: serviceForm.orientation === "landscape" ? "rgba(201, 168, 76, 0.2)" : "var(--surface2)",
                      border: `1.5px solid ${serviceForm.orientation === "landscape" ? "var(--accent)" : "var(--border)"}`,
                      cursor: "pointer",
                      fontSize: 13,
                      color: "#fff",
                      fontWeight: serviceForm.orientation === "landscape" ? 700 : 400
                    }}
                  >
                    <input
                      type="radio"
                      name="orientation"
                      value="landscape"
                      checked={serviceForm.orientation === "landscape"}
                      onChange={() => setServiceForm({ ...serviceForm, orientation: "landscape" })}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>Landscape (Horizontal)</div>
                      <div style={{ fontSize: 10, color: "var(--text2)" }}>Wide ratio (e.g. Photo Restoration)</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Service Components Checklist (Check which options are needed) */}
              <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
                <label style={{ display: "block", fontSize: 12, color: "var(--accent)", fontWeight: 700, marginBottom: 4 }}>
                  Interactive Service Page Components (Admin Checklist)
                </label>
                <p style={{ fontSize: 11, color: "var(--text2)", margin: "0 0 12px 0" }}>
                  Select which interactive studio components are required for this service:
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#fff", cursor: "pointer", background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <input
                      type="checkbox"
                      checked={serviceForm.enableUploadPhoto}
                      onChange={(e) => setServiceForm({ ...serviceForm, enableUploadPhoto: e.target.checked })}
                    />
                    <span><strong>Upload Photo</strong> Button</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#fff", cursor: "pointer", background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <input
                      type="checkbox"
                      checked={serviceForm.enableChooseFrame}
                      onChange={(e) => setServiceForm({ ...serviceForm, enableChooseFrame: e.target.checked })}
                    />
                    <span><strong>Choose Frame</strong> Modal</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#fff", cursor: "pointer", background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <input
                      type="checkbox"
                      checked={serviceForm.enableSelectSize}
                      onChange={(e) => setServiceForm({ ...serviceForm, enableSelectSize: e.target.checked })}
                    />
                    <span><strong>Select Frame Size</strong> Dropdown</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#fff", cursor: "pointer", background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <input
                      type="checkbox"
                      checked={serviceForm.enableMultipleImages}
                      onChange={(e) => setServiceForm({ ...serviceForm, enableMultipleImages: e.target.checked })}
                    />
                    <span><strong>Multiple Photos & Gallery</strong></span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#fff", cursor: "pointer", background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)", gridColumn: "1 / -1" }}>
                    <input
                      type="checkbox"
                      checked={serviceForm.enableNavigationButton}
                      onChange={(e) => setServiceForm({ ...serviceForm, enableNavigationButton: e.target.checked })}
                    />
                    <span><strong>Navigation Button</strong> on /services page card (e.g. <em>Explore Details &rarr;</em>)</span>
                  </label>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--accent)", fontStyle: "italic" }}>
                  * Note: "Add to Cart" button is standard and always included for all services.
                </div>
              </div>

              {/* Multiple Photos & Featured Image Management */}
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--accent)", fontWeight: 700, marginBottom: 6 }}>
                  Service Photos Gallery & Featured Image
                </label>
                
                <div style={{ background: "var(--surface2)", border: "1px dashed var(--border)", borderRadius: 8, padding: 14, marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploadingImages}
                      onChange={handleImagesUpload}
                      style={{ background: "var(--surface3, #2A2620)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 6, fontSize: 12, flex: 1 }}
                    />
                    {uploadingImages && (
                      <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        Uploading to Cloud...
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text2)" }}>
                    You can select multiple photos at once. Click on any photo to set it as the <strong>Featured Cover Image</strong>.
                  </span>
                </div>

                {/* Uploaded Gallery Grid */}
                {Array.isArray(serviceForm.images) && serviceForm.images.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 10, marginTop: 10 }}>
                    {serviceForm.images.map((imgUrl, iIdx) => {
                      const isFeatured = (serviceForm.featuredImage === imgUrl) || (!serviceForm.featuredImage && iIdx === 0);
                      return (
                        <div
                          key={iIdx}
                          onClick={() => setServiceForm({ ...serviceForm, featuredImage: imgUrl, imageUrl: imgUrl })}
                          style={{
                            position: "relative",
                            borderRadius: 8,
                            overflow: "hidden",
                            border: `2px solid ${isFeatured ? "var(--accent)" : "rgba(255,255,255,0.12)"}`,
                            height: 80,
                            cursor: "pointer",
                            boxShadow: isFeatured ? "0 0 10px rgba(201,168,76,0.4)" : "none",
                            background: "#000",
                          }}
                        >
                          <img src={imgUrl} alt={`Photo ${iIdx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          {isFeatured && (
                            <span style={{ position: "absolute", top: 2, left: 2, background: "var(--accent)", color: "#000", fontSize: 8, fontWeight: 800, padding: "2px 4px", borderRadius: 4 }}>
                              FEATURED
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newImages = serviceForm.images.filter((_, idx) => idx !== iIdx);
                              const newFeatured = isFeatured ? (newImages[0] || "/images/bespoke_framing.png") : serviceForm.featuredImage;
                              setServiceForm({
                                ...serviceForm,
                                images: newImages,
                                featuredImage: newFeatured,
                                imageUrl: newFeatured,
                              });
                            }}
                            style={{
                              position: "absolute",
                              top: 2,
                              right: 2,
                              background: "rgba(255,62,108,0.85)",
                              color: "#fff",
                              border: "none",
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              fontSize: 10,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Video Upload — one video plays full-width, several become a carousel */}
              <div style={{ marginTop: 6, background: "rgba(201, 168, 76, 0.05)", border: "1px solid rgba(201, 168, 76, 0.2)", borderRadius: 8, padding: 14 }}>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--accent)", fontWeight: 700, marginBottom: 4 }}>
                  <span>Service Showcase Videos (Playable Full-Width)</span>
                  <span style={{ fontSize: 10, background: "rgba(201,168,76,0.2)", color: "#dfc38a", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                    Recommended: 1920 × 1080 (16:9) or 1080 × 1920 (9:16) MP4
                  </span>
                </label>

                <p style={{ fontSize: 11, color: "var(--text2)", margin: "0 0 10px 0" }}>
                  Upload MP4/WebM files or paste video URLs. Videos are hosted on Cloudinary CDN for instant smooth streaming.
                  Add <strong>one</strong> video and the service page plays it full-width as before; add <strong>two or more</strong>
                  {" "}and the page shows them in a carousel, in the order listed below.
                </p>

                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    multiple
                    disabled={uploadingVideo}
                    onChange={handleVideoFileChange}
                    style={{ background: "var(--surface3, #2A2620)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 6, fontSize: 12, flex: 1 }}
                  />
                  {uploadingVideo && (
                    <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
                      Uploading video...
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Or paste video direct link (e.g. /videos/mirror-showcase.mp4 or https://...)"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addVideoUrl();
                      }
                    }}
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 6, fontSize: 12 }}
                  />
                  <button
                    type="button"
                    onClick={addVideoUrl}
                    disabled={!videoUrlInput.trim()}
                    style={{ background: "rgba(201,168,76,0.2)", border: "1px solid var(--accent)", color: "var(--accent)", padding: "8px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: videoUrlInput.trim() ? "pointer" : "not-allowed", opacity: videoUrlInput.trim() ? 1 : 0.5, whiteSpace: "nowrap" }}
                  >
                    + Add Video
                  </button>
                </div>

                {/* Added videos — this order is the carousel order */}
                {Array.isArray(serviceForm.videos) && serviceForm.videos.length > 0 ? (
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    <span style={{ fontSize: 11, color: "var(--text2)" }}>
                      {serviceForm.videos.length === 1
                        ? "1 video — plays full-width on the service page."
                        : `${serviceForm.videos.length} videos — shown as a carousel in this order.`}
                    </span>

                    {serviceForm.videos.map((vUrl, vIdx) => (
                      <div
                        key={`${vUrl}-${vIdx}`}
                        style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}
                      >
                        <div style={{ position: "relative", width: 150, flexShrink: 0, borderRadius: 6, overflow: "hidden", background: "#000", border: "1px solid rgba(201,168,76,0.35)" }}>
                          <video src={vUrl} controls preload="metadata" style={{ width: "100%", maxHeight: 90, display: "block" }} />
                          <span style={{ position: "absolute", top: 3, left: 3, background: "var(--accent)", color: "#000", fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 4 }}>
                            #{vIdx + 1}
                          </span>
                        </div>

                        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                          <span style={{ fontSize: 11, color: "var(--text2)", wordBreak: "break-all", lineHeight: 1.4 }}>{vUrl}</span>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => moveVideo(vIdx, -1)}
                              disabled={vIdx === 0}
                              title="Move earlier in the carousel"
                              style={{ background: "var(--surface3, #2A2620)", border: "1px solid var(--border)", color: "#fff", padding: "4px 10px", borderRadius: 5, fontSize: 11, cursor: vIdx === 0 ? "not-allowed" : "pointer", opacity: vIdx === 0 ? 0.4 : 1 }}
                            >
                              ↑ Up
                            </button>
                            <button
                              type="button"
                              onClick={() => moveVideo(vIdx, 1)}
                              disabled={vIdx === serviceForm.videos.length - 1}
                              title="Move later in the carousel"
                              style={{ background: "var(--surface3, #2A2620)", border: "1px solid var(--border)", color: "#fff", padding: "4px 10px", borderRadius: 5, fontSize: 11, cursor: vIdx === serviceForm.videos.length - 1 ? "not-allowed" : "pointer", opacity: vIdx === serviceForm.videos.length - 1 ? 0.4 : 1 }}
                            >
                              ↓ Down
                            </button>
                            <button
                              type="button"
                              onClick={() => removeVideo(vIdx)}
                              style={{ background: "rgba(255,62,108,0.2)", border: "1px solid rgba(255,62,108,0.4)", color: "#ff6b8b", padding: "4px 10px", borderRadius: 5, fontSize: 11, cursor: "pointer" }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: 12, fontSize: 11, color: "var(--text2)", fontStyle: "italic" }}>
                    No videos added yet — the video section is hidden on the service page.
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Short Description (Card Summary)</label>
                <textarea
                  rows={3}
                  value={serviceForm.shortDesc}
                  onChange={(e) => setServiceForm({ ...serviceForm, shortDesc: e.target.value })}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Detailed Text (Inner Page Narrative)</label>
                <textarea
                  rows={4}
                  value={serviceForm.detailedText}
                  onChange={(e) => setServiceForm({ ...serviceForm, detailedText: e.target.value })}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Price Info Badge</label>
                <input
                  type="text"
                  value={serviceForm.priceInfo}
                  onChange={(e) => setServiceForm({ ...serviceForm, priceInfo: e.target.value })}
                  placeholder="e.g. Starting from Rs. 4,000 depending on wood selection"
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Feature Bullets</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    placeholder="Add bullet point..."
                    style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 6, fontSize: 12 }}
                  />
                  <button type="button" onClick={handleAddFeature} style={{ background: "var(--accent)", color: "#000", border: "none", padding: "0 16px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>+ Add</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {serviceForm.features.map((f, fIdx) => (
                    <div key={fIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface2)", padding: "6px 12px", borderRadius: 6, fontSize: 12 }}>
                      <span>• {f}</span>
                      <button type="button" onClick={() => handleRemoveFeature(fIdx)} style={{ background: "none", border: "none", color: "#FF5A5A", cursor: "pointer", fontSize: 14 }}>&times;</button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: "var(--surface2)", color: "#fff", border: "1px solid var(--border)", padding: "10px 20px", borderRadius: 8, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ background: "var(--accent)", color: "#000", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
