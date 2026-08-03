"use client";

import { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../../../../../lib/firebase";

const INITIAL_DEFAULT_SERVICES = [
  {
    id: "instagram-mirror-selfie",
    title: "Instagram Mirror Selfie Frame",
    slug: "instagram-mirror-selfie",
    tagline: "Viral Interactive Selfie Mirror",
    shortDesc: "Transform your space with a custom-crafted Instagram Reel & Post mirror frame. Complete with personalized handle, verified badge, likes count, custom audio title, and high-clarity HD mirror center for unforgettable selfies.",
    detailedText: "Take your selfie game and interior decor to the next level with our handcrafted Instagram Mirror Selfie Frame. Designed to replicate an authentic Instagram Reel UI complete with your custom handle, blue verified checkmark, custom audio name, and engagement stats. Featuring a high-definition shatterproof mirror at its center, this frame turns everyday mirror selfies into viral social media moments. It is tailor-made for cafes, fashion boutiques, photo studios, and modern bedrooms looking to add a stylish, interactive aesthetic centerpiece.",
    priceInfo: "Custom mirror frames start from Rs. 4,999 depending on size and acrylic finishes.",
    imageUrl: "/images/instagram_mirror_selfie.jpg",
    features: [
      "Custom engraved Instagram Reel UI (Username, verified badge & audio)",
      "High-definition shatterproof studio acrylic mirror",
      "Interactive social stats: Likes, Comments, Shares & Bookmarks",
      "Perfect aesthetic focal point for cafés, boutiques, studios & bedrooms",
      "Includes solid wood back support and heavy-duty wall mounting hardware"
    ],
    ctaText: "Customize & Order Mirror",
    ctaLink: "/contact",
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
    features: [
      "Custom-fit double mounting with elegant gold borders",
      "99% UV-protection museum glass options",
      "Selection of premium local and imported wood trims",
      "Dust and humidity-controlled rear framing seal",
      "Includes premium hanging hardware and mounting wire"
    ],
    ctaText: "Upload & Frame Nikkah Nama",
    ctaLink: "/contact",
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
    features: [
      "Scratch, crease, and tear removal",
      "Advanced AI colorization of black & white photos",
      "High-fidelity upscaling and detail sharpening",
      "Digital delivery + premium printing options",
      "Water damage and stain reconstruction"
    ],
    ctaText: "Upload Image for Quote",
    ctaLink: "/contact",
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
    features: [
      "Professional beauty retouching and skin correction",
      "Background replacement and unwanted object removal",
      "Cinematic color grading and lighting adjustments",
      "High-resolution sharpening and upscaling",
      "Object manipulation and custom creative edits"
    ],
    ctaText: "Upload Image for Editing",
    ctaLink: "/contact",
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
    features: [],
    ctaText: "Explore Details",
    ctaLink: "/contact",
  });

  const [featureInput, setFeatureInput] = useState("");

  useEffect(() => {
    const servicesRef = ref(db, "cms_services");
    const unsub = onValue(servicesRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setServices(Array.isArray(val) ? val : Object.values(val));
      } else {
        setServices(INITIAL_DEFAULT_SERVICES);
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
      title: "New Custom Service",
      slug: "new-custom-service",
      tagline: "Custom Bespoke Offering",
      shortDesc: "Short description of the new custom service...",
      detailedText: "Detailed explanation of what this custom service offers to customers...",
      priceInfo: "Starting from Rs. 2,500",
      imageUrl: "/images/bespoke_framing.png",
      features: ["Custom size & dimensions available", "Archival quality materials & finishing"],
      ctaText: "Order Service",
      ctaLink: "/contact",
    });
    setFeatureInput("");
    setIsModalOpen(true);
  };

  const openEditModal = (index) => {
    setEditIndex(index);
    const item = services[index];
    setServiceForm({
      ...item,
      features: Array.isArray(item.features) ? item.features : [],
    });
    setFeatureInput("");
    setIsModalOpen(true);
  };

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    setServiceForm({
      ...serviceForm,
      features: [...(serviceForm.features || []), featureInput.trim()],
    });
    setFeatureInput("");
  };

  const handleRemoveFeature = (fIdx) => {
    setServiceForm({
      ...serviceForm,
      features: serviceForm.features.filter((_, i) => i !== fIdx),
    });
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    const updated = [...services];
    const cleanSlug = serviceForm.slug.replace(/^\//, '').trim().toLowerCase().replace(/\s+/g, '-');
    const finalForm = {
      ...serviceForm,
      id: cleanSlug,
      slug: cleanSlug,
    };

    if (editIndex !== null) {
      updated[editIndex] = finalForm;
    } else {
      updated.push(finalForm);
    }
    setServices(updated);
    setIsModalOpen(false);
  };

  const handleDeleteService = (index) => {
    if (confirm(`Are you sure you want to delete "${services[index].title}"?`)) {
      const updated = services.filter((_, i) => i !== index);
      setServices(updated);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, color: "var(--text2)" }}>Loading Services Content...</div>;
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 0 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--text)" }}>
            Services <span>Content Manager</span>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
        {services.map((srv, idx) => (
          <div key={srv.id || idx} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "relative", width: "100%", height: 200, background: "#111" }}>
              <img src={srv.imageUrl || "/images/bespoke_framing.png"} alt={srv.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.75)", color: "var(--accent)", padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                /services/{srv.slug}
              </div>
            </div>

            <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: 18, color: "#fff", marginBottom: 4 }}>{srv.title}</h3>
                <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, marginBottom: 12 }}>{srv.tagline}</div>
                <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5, marginBottom: 14 }}>
                  {srv.shortDesc || srv.detailedText}
                </p>

                <div style={{ fontSize: 12, color: "#fff", background: "var(--surface2)", padding: 8, borderRadius: 6, marginBottom: 14 }}>
                  💰 {srv.priceInfo || "Custom pricing"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={() => openEditModal(idx)}
                  style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border2)", color: "#fff", padding: "8px 0", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
                >
                  Edit Service
                </button>
                <button
                  onClick={() => handleDeleteService(idx)}
                  style={{ background: "rgba(255, 62, 108, 0.15)", border: "1px solid #FF3E6C", color: "#FF3E6C", padding: "8px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Edit/Add Service */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 12, width: 620, maxWidth: "100%", padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 20, color: "var(--accent)", marginBottom: 20 }}>
              {editIndex !== null ? `Edit Service: ${serviceForm.title}` : "Add New Custom Service"}
            </h2>

            <form onSubmit={handleSaveModal} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Service Title *</label>
                  <input
                    type="text"
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                    required
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>URL Slug (e.g. dummyservice) *</label>
                  <input
                    type="text"
                    value={serviceForm.slug}
                    onChange={(e) => setServiceForm({ ...serviceForm, slug: e.target.value })}
                    required
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Tagline / Subheading</label>
                  <input
                    type="text"
                    value={serviceForm.tagline}
                    onChange={(e) => setServiceForm({ ...serviceForm, tagline: e.target.value })}
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Price Info (e.g. Starting from Rs. 4,999)</label>
                  <input
                    type="text"
                    value={serviceForm.priceInfo}
                    onChange={(e) => setServiceForm({ ...serviceForm, priceInfo: e.target.value })}
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Image URL / Path</label>
                <input
                  type="text"
                  value={serviceForm.imageUrl}
                  onChange={(e) => setServiceForm({ ...serviceForm, imageUrl: e.target.value })}
                  placeholder="/images/instagram_mirror_selfie.jpg or https://..."
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Short Description (Cards Grid)</label>
                <textarea
                  value={serviceForm.shortDesc}
                  onChange={(e) => setServiceForm({ ...serviceForm, shortDesc: e.target.value })}
                  rows={2}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Detailed Description (Inner Page)</label>
                <textarea
                  value={serviceForm.detailedText}
                  onChange={(e) => setServiceForm({ ...serviceForm, detailedText: e.target.value })}
                  rows={3}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                />
              </div>

              {/* Key Features Bullets */}
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>Key Feature Bullets ({serviceForm.features?.length || 0})</label>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    placeholder="Add bullet point specification..."
                    style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    style={{ background: "var(--surface3)", border: "1px solid var(--border2)", color: "#fff", padding: "0 16px", borderRadius: 6, cursor: "pointer" }}
                  >
                    + Add Bullet
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {serviceForm.features?.map((feat, fIdx) => (
                    <div key={fIdx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface2)", padding: "8px 12px", borderRadius: 6, fontSize: 13, color: "#fff" }}>
                      <span>• {feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(fIdx)}
                        style={{ background: "none", border: "none", color: "#FF5A5A", cursor: "pointer", fontSize: 14 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Button Action Label</label>
                  <input
                    type="text"
                    value={serviceForm.ctaText}
                    onChange={(e) => setServiceForm({ ...serviceForm, ctaText: e.target.value })}
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Button Target Link</label>
                  <input
                    type="text"
                    value={serviceForm.ctaLink}
                    onChange={(e) => setServiceForm({ ...serviceForm, ctaLink: e.target.value })}
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
                  {editIndex !== null ? "Update Service" : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
