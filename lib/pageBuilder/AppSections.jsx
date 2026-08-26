"use client";

// ---------------------------------------------------------------------------
// Dynamic content blocks.
//
// These are the bridge between the page builder and the real site: instead of
// holding static text, they read live data out of Firebase (frames, services,
// categories) and render it. That means a page assembled in the builder can
// show the actual catalogue, and it stays current when the catalogue changes —
// no rebuilding the page.
//
// The heavy interactive pages (checkout, customizer, product stage) stay in
// code; these blocks are how a builder page links into them.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { resolveValue } from "./styles";

/** Subscribe to a Firebase node and return it as an array of records. */
function useCollection(path) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    try {
      const unsub = onValue(
        ref(db, path),
        (snap) => {
          if (!alive) return;
          const val = snap.val();
          if (!val) {
            setItems([]);
          } else if (Array.isArray(val)) {
            setItems(val.map((v, i) => (v ? { id: String(i), ...v } : null)).filter(Boolean));
          } else {
            setItems(Object.entries(val).map(([id, v]) => ({ id, ...v })));
          }
          setLoading(false);
        },
        () => alive && setLoading(false)
      );
      return () => {
        alive = false;
        unsub();
      };
    } catch {
      setLoading(false);
    }
  }, [path]);

  return { items, loading };
}

const isBoardGame = (f) => {
  const hay = `${f.category || ""} ${f.subCategory || ""} ${f.name || ""}`.toLowerCase();
  return ["board", "game", "ludo", "chess", "monopoly", "carrom", "scrabble"].some((w) => hay.includes(w));
};

function Skeleton({ count, columns, ratio }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`, gap: 18, width: "100%" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ aspectRatio: ratio, background: "rgba(232,216,198,.045)", border: "1px solid rgba(232,216,198,.065)", borderRadius: 12, animation: "pb-pulse 1.4s ease-in-out infinite", animationDelay: `${i * 90}ms` }} />
      ))}
    </div>
  );
}

function EmptyNote({ children }) {
  return (
    <div style={{ padding: "28px 20px", textAlign: "center", border: "1px dashed rgba(181,139,92,.35)", borderRadius: 12, fontSize: 13, color: "#9A8A79", lineHeight: 1.6, width: "100%" }}>
      {children}
    </div>
  );
}

function CardShell({ href, isEditor, children, accent }) {
  const style = {
    display: "block",
    background: "rgba(20,12,6,.6)",
    border: `1px solid ${accent}33`,
    borderRadius: 14,
    overflow: "hidden",
    textDecoration: "none",
    color: "inherit",
    transition: "transform .25s ease, border-color .25s ease, box-shadow .25s ease",
  };
  // In the editor the card must not navigate away mid-edit.
  if (isEditor) return <div style={style}>{children}</div>;
  return (
    <a href={href} style={style} className="pb-live-card">
      {children}
    </a>
  );
}

// ---------------------------------------------------------------------------

export function ProductGrid({ block, device, ctx }) {
  const { items, loading } = useCollection("frames");
  const accent = block.accentColor || "#B58B5C";
  const columns = parseInt(resolveValue(block, "columns", device) || 3, 10);
  const limit = parseInt(block.limit || 6, 10);

  let list = items.filter((f) => f.imageUrl || f.thumbnailUrl);
  if (block.excludeBoardGames !== false) list = list.filter((f) => !isBoardGame(f));
  if (block.category && block.category !== "all") {
    list = list.filter((f) => (f.category || "").toLowerCase() === block.category.toLowerCase());
  }
  if (block.orientation && block.orientation !== "all") {
    list = list.filter((f) => (f.orientation || "portrait") === block.orientation);
  }
  if (block.sort === "price-asc") list = [...list].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
  else if (block.sort === "price-desc") list = [...list].sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
  else if (block.sort === "name") list = [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  list = list.slice(0, limit);

  if (loading) return <Skeleton count={Math.min(limit, columns * 2)} columns={columns} ratio="3 / 4" />;
  if (!list.length) {
    return <EmptyNote>No frames match this filter yet. Add frames in <strong>Frame Catalog</strong>, or widen the filter in the Content section.</EmptyNote>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`, gap: block.gap ?? 20, width: "100%" }}>
      {list.map((frame) => (
        <CardShell key={frame.id} href={`/product/${frame.id}`} isEditor={ctx.isEditor} accent={accent}>
          <div style={{ aspectRatio: block.imageRatio || "3 / 4", background: "#000", overflow: "hidden" }}>
            <img src={frame.thumbnailUrl || frame.imageUrl} alt={frame.name || ""} loading="lazy" style={{ width: "100%", height: "100%", objectFit: block.objectFit || "cover", display: "block" }} />
          </div>
          <div style={{ padding: 16 }}>
            <h4 style={{ margin: 0, fontSize: 15, color: "#F4EFE6", fontFamily: "inherit", fontWeight: 600 }}>{frame.name}</h4>
            {block.showCategory !== false && frame.category && (
              <div style={{ fontSize: 11, color: "#9A8A79", marginTop: 4, letterSpacing: ".06em", textTransform: "uppercase" }}>{frame.category}</div>
            )}
            {block.showPrice !== false && frame.price && (
              <div style={{ fontSize: 16, color: accent, fontWeight: 800, marginTop: 10 }}>{frame.price}</div>
            )}
            {block.showButton && (
              <span style={{ display: "inline-block", marginTop: 14, background: accent, color: "#0C0A08", fontWeight: 700, fontSize: 12, padding: "9px 18px", borderRadius: 8 }}>
                {block.buttonText || "View frame"}
              </span>
            )}
          </div>
        </CardShell>
      ))}
    </div>
  );
}

const parsePrice = (p) => parseInt(String(p || "").replace(/[^0-9]/g, ""), 10) || 0;

// ---------------------------------------------------------------------------

export function ServicesGrid({ block, device, ctx }) {
  const { items, loading } = useCollection("cms_services");
  const accent = block.accentColor || "#B58B5C";
  const columns = parseInt(resolveValue(block, "columns", device) || 2, 10);
  const limit = parseInt(block.limit || 4, 10);

  const list = items.filter((s) => s && s.slug).slice(0, limit);

  if (loading) return <Skeleton count={Math.min(limit, columns * 2)} columns={columns} ratio="16 / 10" />;
  if (!list.length) return <EmptyNote>No services published yet — add them under <strong>Services Content</strong>.</EmptyNote>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`, gap: block.gap ?? 22, width: "100%" }}>
      {list.map((svc) => (
        <CardShell key={svc.slug} href={`/services/${svc.slug}`} isEditor={ctx.isEditor} accent={accent}>
          {block.showImage !== false && (
            <div style={{ aspectRatio: block.imageRatio || "16 / 10", background: "#000", overflow: "hidden" }}>
              <img src={svc.featuredImage || svc.imageUrl} alt={svc.title || ""} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          )}
          <div style={{ padding: 20 }}>
            {svc.tagline && <div style={{ fontSize: 10.5, letterSpacing: ".16em", textTransform: "uppercase", color: accent, fontWeight: 700 }}>{svc.tagline}</div>}
            <h4 style={{ margin: "8px 0 0", fontSize: 19, color: "#F4EFE6", fontFamily: "inherit", fontWeight: 700 }}>{svc.title}</h4>
            {block.showDescription !== false && svc.shortDesc && (
              <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "#C5B6A5", display: "-webkit-box", WebkitLineClamp: parseInt(block.descriptionLines || 3, 10), WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {svc.shortDesc}
              </p>
            )}
            {block.showPrice !== false && svc.priceInfo && (
              <div style={{ fontSize: 13, color: accent, marginTop: 12, fontWeight: 600 }}>{svc.priceInfo}</div>
            )}
            {block.showButton !== false && (
              <span style={{ display: "inline-block", marginTop: 16, background: accent, color: "#0C0A08", fontWeight: 700, fontSize: 12, padding: "10px 20px", borderRadius: 8 }}>
                {block.buttonText || "Explore service"}
              </span>
            )}
          </div>
        </CardShell>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function CategoryTiles({ block, device, ctx }) {
  const { items, loading } = useCollection("categories");
  const accent = block.accentColor || "#B58B5C";
  const columns = parseInt(resolveValue(block, "columns", device) || 4, 10);

  const list = items.filter((c) => c && c.name).slice(0, parseInt(block.limit || 8, 10));

  if (loading) return <Skeleton count={columns} columns={columns} ratio="1 / 1" />;
  if (!list.length) return <EmptyNote>No categories yet — add them under <strong>Categories</strong>.</EmptyNote>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`, gap: block.gap ?? 14, width: "100%" }}>
      {list.map((cat) => (
        <CardShell key={cat.id} href={`/catalog/${encodeURIComponent(String(cat.name).toLowerCase().replace(/\s+/g, "-"))}`} isEditor={ctx.isEditor} accent={accent}>
          <div style={{ padding: "26px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{ width: 42, height: 42, borderRadius: "50%", background: `${accent}22`, border: `1px solid ${accent}55`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontSize: 17 }}>▢</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#F4EFE6" }}>{cat.name}</span>
          </div>
        </CardShell>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function AppSection({ block, device, ctx }) {
  switch (block.type) {
    case "product-grid":
      return <ProductGrid block={block} device={device} ctx={ctx} />;
    case "services-grid":
      return <ServicesGrid block={block} device={device} ctx={ctx} />;
    case "category-tiles":
      return <CategoryTiles block={block} device={device} ctx={ctx} />;
    default:
      return null;
  }
}

export const APP_SECTION_TYPES = ["product-grid", "services-grid", "category-tiles"];
