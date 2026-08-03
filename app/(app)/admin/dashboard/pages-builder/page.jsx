"use client";

import { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../../../../../lib/firebase";

export default function AdminPageBuilder() {
  const [pages, setPages] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [activeSlug, setActiveSlug] = useState(null);
  const [pageForm, setPageForm] = useState({
    title: "",
    slug: "",
    blocks: [],
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const pagesRef = ref(db, "cms_pages");
    const unsub = onValue(pagesRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setPages(val);
      } else {
        // Initial default dummy page
        setPages({
          dummy: {
            title: "Dummy Page",
            slug: "dummy",
            blocks: [
              {
                blockType: "hero",
                title: "Welcome to Yaadein Custom Page",
                subtitle: "This page was built using our native custom page builder inside the admin panel.",
                buttonText: "Explore Catalog",
                buttonLink: "/catalog",
                bgImage: "/images/wood-bg.png",
              },
              {
                blockType: "text-media-split",
                heading: "Handcrafted Elegance",
                body: "Every piece of timber is individually selected and cured to guarantee life-long beauty and structural strength.",
                image: "/images/bespoke_framing.png",
                imagePosition: "right",
              },
              {
                blockType: "cta-banner",
                title: "Ready to Frame Your Memories?",
                subtitle: "Upload your photographs or choose from our luxury catalogue today.",
                buttonText: "Launch Studio Customizer",
                buttonLink: "/customize",
              },
            ],
          },
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    setMessage("");
    try {
      await set(ref(db, "cms_pages"), pages);
      setMessage("✅ All custom pages saved successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to save custom pages.");
    } finally {
      setSaving(false);
    }
  };

  const openAddPageModal = () => {
    setActiveSlug(null);
    setPageForm({
      title: "New Custom Page",
      slug: "new-page",
      blocks: [
        {
          blockType: "hero",
          title: "New Page Headline",
          subtitle: "Subtext describing this custom page...",
          buttonText: "Get Started",
          buttonLink: "/contact",
          bgImage: "/images/wood-bg.png",
        },
      ],
    });
    setIsModalOpen(true);
  };

  const openEditPageModal = (slugKey) => {
    setActiveSlug(slugKey);
    const item = pages[slugKey];
    setPageForm({
      title: item.title || slugKey,
      slug: item.slug || slugKey,
      blocks: Array.isArray(item.blocks) ? item.blocks : [],
    });
    setIsModalOpen(true);
  };

  const handleAddBlock = (type) => {
    let newBlock = {};
    if (type === "hero") {
      newBlock = {
        blockType: "hero",
        title: "Hero Section Title",
        subtitle: "Engaging subtitle description text...",
        buttonText: "Learn More",
        buttonLink: "/catalog",
        bgImage: "/images/wood-bg.png",
      };
    } else if (type === "text-media-split") {
      newBlock = {
        blockType: "text-media-split",
        heading: "Section Heading",
        body: "Rich narrative content detailing your brand craft or services...",
        image: "/images/bespoke_framing.png",
        imagePosition: "right",
      };
    } else if (type === "cta-banner") {
      newBlock = {
        blockType: "cta-banner",
        title: "Call to Action Heading",
        subtitle: "Promotional banner subtext encouraging user action.",
        buttonText: "Contact Us Today",
        buttonLink: "/contact",
      };
    }
    setPageForm({
      ...pageForm,
      blocks: [...(pageForm.blocks || []), newBlock],
    });
  };

  const handleRemoveBlock = (bIdx) => {
    setPageForm({
      ...pageForm,
      blocks: pageForm.blocks.filter((_, i) => i !== bIdx),
    });
  };

  const handleSavePage = (e) => {
    e.preventDefault();
    const cleanSlug = pageForm.slug.replace(/^\//, '').trim().toLowerCase().replace(/\s+/g, '-');
    const updated = { ...pages };
    
    // If slug changed, delete old key
    if (activeSlug && activeSlug !== cleanSlug) {
      delete updated[activeSlug];
    }

    updated[cleanSlug] = {
      title: pageForm.title,
      slug: cleanSlug,
      blocks: pageForm.blocks,
    };

    setPages(updated);
    setIsModalOpen(false);
  };

  const handleDeletePage = (slugKey) => {
    if (confirm(`Are you sure you want to delete page "/${slugKey}"?`)) {
      const updated = { ...pages };
      delete updated[slugKey];
      setPages(updated);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, color: "var(--text2)" }}>Loading Page Builder...</div>;
  }

  const pageEntries = Object.entries(pages);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 0 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--text)" }}>
            Custom <span>Page Builder</span>
          </h1>
          <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>
            Create dynamic website pages with custom layout blocks (Hero, Text & Media Split, CTA Banners).
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={openAddPageModal}
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
            + Create New Page
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
            {saving ? "Saving..." : "Save All Pages"}
          </button>
        </div>
      </div>

      {message && (
        <div style={{ background: "rgba(201, 168, 76, 0.15)", border: "1px solid var(--accent)", color: "var(--accent)", padding: 14, borderRadius: 8, marginBottom: 24 }}>
          {message}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
        {pageEntries.map(([slugKey, pageItem]) => (
          <div key={slugKey} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 11, background: "rgba(201, 168, 76, 0.2)", color: "var(--accent)", fontWeight: 700, padding: "3px 8px", borderRadius: 4 }}>
                  /{slugKey}
                </span>
                <a href={`/${slugKey}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--text2)", textDecoration: "underline" }}>
                  View Live ↗
                </a>
              </div>

              <h3 style={{ fontSize: 20, color: "#fff", marginBottom: 8 }}>{pageItem.title}</h3>
              <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
                Contains {pageItem.blocks?.length || 0} layout section blocks.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <button
                onClick={() => openEditPageModal(slugKey)}
                style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border2)", color: "#fff", padding: "9px 0", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
              >
                Edit Page & Blocks
              </button>
              <button
                onClick={() => handleDeletePage(slugKey)}
                style={{ background: "rgba(255, 62, 108, 0.15)", border: "1px solid #FF3E6C", color: "#FF3E6C", padding: "9px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Page Builder Editor */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 12, width: 700, maxWidth: "100%", padding: 26, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 20, color: "var(--accent)", marginBottom: 20 }}>
              {activeSlug ? `Edit Page: /${activeSlug}` : "Create New Dynamic Page"}
            </h2>

            <form onSubmit={handleSavePage} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Page Title *</label>
                  <input
                    type="text"
                    value={pageForm.title}
                    onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                    required
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>URL Slug (e.g. dummy or about-us) *</label>
                  <input
                    type="text"
                    value={pageForm.slug}
                    onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                    required
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "#fff", padding: 10, borderRadius: 6 }}
                  />
                </div>
              </div>

              {/* Blocks Editor */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 15, color: "#fff" }}>Layout Blocks ({pageForm.blocks?.length || 0})</h3>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("hero")}
                      style={{ background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--accent)", padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}
                    >
                      + Hero Block
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("text-media-split")}
                      style={{ background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--accent)", padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}
                    >
                      + Split Block
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("cta-banner")}
                      style={{ background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--accent)", padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}
                    >
                      + CTA Banner
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {pageForm.blocks?.map((block, bIdx) => (
                    <div key={bIdx} style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 8, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase" }}>
                          Block #{bIdx + 1}: {block.blockType}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlock(bIdx)}
                          style={{ background: "none", border: "none", color: "#FF5A5A", cursor: "pointer", fontSize: 12 }}
                        >
                          Remove Block
                        </button>
                      </div>

                      {block.blockType === "hero" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <input
                            type="text"
                            placeholder="Hero Title"
                            value={block.title || ""}
                            onChange={(e) => {
                              const updated = [...pageForm.blocks];
                              updated[bIdx].title = e.target.value;
                              setPageForm({ ...pageForm, blocks: updated });
                            }}
                            style={{ background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 4, fontSize: 13 }}
                          />
                          <textarea
                            placeholder="Hero Subtitle"
                            value={block.subtitle || ""}
                            rows={2}
                            onChange={(e) => {
                              const updated = [...pageForm.blocks];
                              updated[bIdx].subtitle = e.target.value;
                              setPageForm({ ...pageForm, blocks: updated });
                            }}
                            style={{ background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 4, fontSize: 13 }}
                          />
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <input
                              type="text"
                              placeholder="Button Text"
                              value={block.buttonText || ""}
                              onChange={(e) => {
                                const updated = [...pageForm.blocks];
                                updated[bIdx].buttonText = e.target.value;
                                setPageForm({ ...pageForm, blocks: updated });
                              }}
                              style={{ background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 4, fontSize: 13 }}
                            />
                            <input
                              type="text"
                              placeholder="Button Link"
                              value={block.buttonLink || ""}
                              onChange={(e) => {
                                const updated = [...pageForm.blocks];
                                updated[bIdx].buttonLink = e.target.value;
                                setPageForm({ ...pageForm, blocks: updated });
                              }}
                              style={{ background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 4, fontSize: 13 }}
                            />
                          </div>
                        </div>
                      )}

                      {block.blockType === "text-media-split" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <input
                            type="text"
                            placeholder="Section Heading"
                            value={block.heading || ""}
                            onChange={(e) => {
                              const updated = [...pageForm.blocks];
                              updated[bIdx].heading = e.target.value;
                              setPageForm({ ...pageForm, blocks: updated });
                            }}
                            style={{ background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 4, fontSize: 13 }}
                          />
                          <textarea
                            placeholder="Body paragraph text..."
                            value={block.body || ""}
                            rows={3}
                            onChange={(e) => {
                              const updated = [...pageForm.blocks];
                              updated[bIdx].body = e.target.value;
                              setPageForm({ ...pageForm, blocks: updated });
                            }}
                            style={{ background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 4, fontSize: 13 }}
                          />
                          <input
                            type="text"
                            placeholder="Image URL"
                            value={block.image || ""}
                            onChange={(e) => {
                              const updated = [...pageForm.blocks];
                              updated[bIdx].image = e.target.value;
                              setPageForm({ ...pageForm, blocks: updated });
                            }}
                            style={{ background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 4, fontSize: 13 }}
                          />
                        </div>
                      )}

                      {block.blockType === "cta-banner" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <input
                            type="text"
                            placeholder="Banner Title"
                            value={block.title || ""}
                            onChange={(e) => {
                              const updated = [...pageForm.blocks];
                              updated[bIdx].title = e.target.value;
                              setPageForm({ ...pageForm, blocks: updated });
                            }}
                            style={{ background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 4, fontSize: 13 }}
                          />
                          <input
                            type="text"
                            placeholder="Banner Subtitle"
                            value={block.subtitle || ""}
                            onChange={(e) => {
                              const updated = [...pageForm.blocks];
                              updated[bIdx].subtitle = e.target.value;
                              setPageForm({ ...pageForm, blocks: updated });
                            }}
                            style={{ background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 4, fontSize: 13 }}
                          />
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <input
                              type="text"
                              placeholder="Button Label"
                              value={block.buttonText || ""}
                              onChange={(e) => {
                                const updated = [...pageForm.blocks];
                                updated[bIdx].buttonText = e.target.value;
                                setPageForm({ ...pageForm, blocks: updated });
                              }}
                              style={{ background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 4, fontSize: 13 }}
                            />
                            <input
                              type="text"
                              placeholder="Button Link"
                              value={block.buttonLink || ""}
                              onChange={(e) => {
                                const updated = [...pageForm.blocks];
                                updated[bIdx].buttonLink = e.target.value;
                                setPageForm({ ...pageForm, blocks: updated });
                              }}
                              style={{ background: "var(--surface3)", border: "1px solid var(--border)", color: "#fff", padding: 8, borderRadius: 4, fontSize: 13 }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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
                  {activeSlug ? "Update Page" : "Create Page"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
