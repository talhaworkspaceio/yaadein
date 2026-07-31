"use client";

import { use, useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function CustomRootPage({ params }) {
  const resolvedParams = use(params);
  const rawSlug = resolvedParams?.slug;
  const slug = rawSlug ? rawSlug.replace(/^\//, '') : '';

  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchCustomPage() {
      if (!slug) return;
      try {
        const res = await fetch(`/api/pages?where[or][0][slug][equals]=${slug}&where[or][1][slug][equals]=/${slug}&depth=2`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.docs && json.docs.length > 0 && json.docs[0].status === "published") {
            if (isMounted) setPageData(json.docs[0]);
          } else {
            if (isMounted) setNotFound(true);
          }
        } else {
          if (isMounted) setNotFound(true);
        }
      } catch (err) {
        console.warn("[CMS Page Builder] Failed to fetch custom page:", err);
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCustomPage();
    return () => { isMounted = false; };
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#050403", color: "#E0D7CD", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-serif)" }}>
        <p style={{ fontSize: "18px", letterSpacing: "0.1em" }}>Loading Page...</p>
      </div>
    );
  }

  if (notFound || !pageData) {
    return (
      <div style={{ minHeight: "100vh", background: "#050403", color: "#E0D7CD", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Navbar />
        <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 20px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "42px", color: "var(--accent)", marginBottom: "16px" }}>404 - Page Not Found</h1>
          <p style={{ fontFamily: "var(--font-serif)", color: "var(--text2)", fontSize: "16px", marginBottom: "24px" }}>The page you are looking for does not exist or has not been published yet.</p>
          <a href="/" style={{ color: "var(--accent)", textDecoration: "none", borderBottom: "1px solid var(--accent)" }}>Return to Home</a>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050403", color: "#E0D7CD", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "120px 20px 80px", maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
        <style dangerouslySetInnerHTML={{ __html: `
          .pb-block { margin-bottom: 80px; }
          .pb-hero { text-align: center; padding: 60px 20px; background: rgba(28,15,7,0.4); border-radius: 16px; border: 1px solid rgba(184,134,11,0.2); position: relative; overflow: hidden; }
          .pb-hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.25; z-index: 0; }
          .pb-hero-content { position: relative; z-index: 1; }
          .pb-hero h1 { font-family: var(--font-display); font-size: 48px; color: var(--accent); margin-bottom: 16px; }
          .pb-hero p { font-family: var(--font-serif); font-size: 18px; color: var(--text2); max-width: 700px; margin: 0 auto 24px; }
          .pb-btn { display: inline-block; padding: 14px 28px; background: var(--accent); color: #000; font-weight: 700; text-decoration: none; border-radius: 8px; transition: transform 0.2s ease; }
          .pb-btn:hover { transform: scale(1.05); }

          .pb-split { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
          .pb-split.left { grid-template-areas: "img txt"; }
          .pb-split.right { grid-template-areas: "txt img"; }
          .pb-split-txt { grid-area: txt; }
          .pb-split-img { grid-area: img; width: 100%; height: auto; border-radius: 12px; border: 1px solid var(--border); }

          .pb-content-card { background: rgba(20,12,6,0.6); border: 1px solid rgba(184,134,11,0.15); border-radius: 16px; padding: 40px; }
          .pb-content-card h2 { font-family: var(--font-display); font-size: 32px; color: var(--accent); margin-bottom: 20px; }
          .pb-content-card div { font-family: var(--font-serif); font-size: 16px; line-height: 1.8; color: var(--text2); white-space: pre-line; }

          .pb-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
          .pb-grid-card { background: rgba(28,15,7,0.5); border: 1px solid rgba(184,134,11,0.15); border-radius: 12px; padding: 28px; }
          .pb-grid-card h3 { font-family: var(--font-display); font-size: 20px; color: var(--accent); margin-bottom: 10px; display: flex; align-items: center; gap: 10px; }
          .pb-grid-card p { font-family: var(--font-serif); font-size: 14px; color: var(--text2); line-height: 1.6; }

          .pb-cta { text-align: center; padding: 60px 20px; background: linear-gradient(135deg, rgba(184,134,11,0.15) 0%, rgba(28,15,7,0.8) 100%); border-radius: 16px; border: 1px solid var(--accent); }
          .pb-cta h2 { font-family: var(--font-display); font-size: 36px; color: var(--accent); margin-bottom: 16px; }
          .pb-cta p { font-family: var(--font-serif); font-size: 16px; color: var(--text2); max-width: 600px; margin: 0 auto 24px; }

          @media (max-width: 768px) {
            .pb-split { grid-template-columns: 1fr; grid-template-areas: "img" "txt" !important; }
            .pb-hero h1 { font-size: 32px; }
          }
        ` }} />

        {/* Page Builder Sections */}
        {pageData?.layout && pageData.layout.length > 0 ? (
          pageData.layout.map((block, idx) => {
            if (block.blockType === "heroBlock") {
              const bgUrl = block.bgImage?.url || (typeof block.bgImage === "string" ? block.bgImage : null);
              return (
                <div key={idx} className="pb-block pb-hero">
                  {bgUrl && <img src={bgUrl} alt={block.heading} className="pb-hero-bg" />}
                  <div className="pb-hero-content">
                    <h1>{block.heading}</h1>
                    {block.subheading && <p>{block.subheading}</p>}
                    {block.ctaText && block.ctaLink && (
                      <a href={block.ctaLink} className="pb-btn">{block.ctaText}</a>
                    )}
                  </div>
                </div>
              );
            }

            if (block.blockType === "textMediaBlock") {
              const imgPos = block.imagePosition || "right";
              const imgUrl = block.image?.url || (typeof block.image === "string" ? block.image : null);
              return (
                <div key={idx} className={`pb-block pb-split ${imgPos}`}>
                  <div className="pb-split-txt">
                    {block.heading && <h2 style={{ fontFamily: "var(--font-display)", fontSize: "32px", color: "var(--accent)", marginBottom: "16px" }}>{block.heading}</h2>}
                    {block.content && <p style={{ fontFamily: "var(--font-serif)", fontSize: "16px", lineHeight: "1.8", color: "var(--text2)", whiteSpace: "pre-line" }}>{block.content}</p>}
                  </div>
                  {imgUrl && (
                    <img src={imgUrl} alt={block.heading || "Page Image"} className="pb-split-img" />
                  )}
                </div>
              );
            }

            if (block.blockType === "contentBlock") {
              return (
                <div key={idx} className="pb-block pb-content-card">
                  {block.heading && <h2>{block.heading}</h2>}
                  {block.body && <div>{block.body}</div>}
                </div>
              );
            }

            if (block.blockType === "featuresGridBlock") {
              return (
                <div key={idx} className="pb-block">
                  {block.heading && <h2 style={{ fontFamily: "var(--font-display)", fontSize: "32px", color: "var(--accent)", marginBottom: "32px", textAlign: "center" }}>{block.heading}</h2>}
                  <div className="pb-grid">
                    {block.features?.map((feat, fIdx) => (
                      <div key={fIdx} className="pb-grid-card">
                        <h3><span>{feat.icon || "✦"}</span> {feat.title}</h3>
                        <p>{feat.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            if (block.blockType === "ctaBlock") {
              return (
                <div key={idx} className="pb-block pb-cta">
                  <h2>{block.heading}</h2>
                  {block.description && <p>{block.description}</p>}
                  {block.buttonText && block.buttonLink && (
                    <a href={block.buttonLink} className="pb-btn">{block.buttonText}</a>
                  )}
                </div>
              );
            }

            return null;
          })
        ) : (
          <div className="pb-block pb-hero">
            <h1>{pageData?.title}</h1>
            <p>This custom page has no content blocks added yet.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
