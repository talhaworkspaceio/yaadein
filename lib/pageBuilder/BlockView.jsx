"use client";

// ---------------------------------------------------------------------------
// The one renderer for page-builder blocks.
//
// Both the builder canvas and the published page mount this, so the editor is a
// true preview rather than a lookalike. Positioning/typography/background all
// come from the generated stylesheet (see styles.js); this file only produces
// the inner markup for each component type.
// ---------------------------------------------------------------------------

import { useState } from "react";
import { ICON_LIBRARY, isContainerBlock } from "./schema";
import { resolveValue, blockClassName } from "./styles";
import { AppSection, APP_SECTION_TYPES } from "./AppSections";

const normalizeIgUrl = (u) => {
  if (!u) return "";
  let clean = String(u).trim();
  if (!clean.endsWith("/")) clean += "/";
  return clean;
};

const getIgEmbedUrl = (u) => {
  if (!u) return "";
  const norm = normalizeIgUrl(u);
  if (norm.includes("/embed")) return norm;
  return `${norm}embed/?cr=1&v=14&rd=`;
};

export function Icon({ name, size = 24, color = "currentColor", stroke = 1.6, style }) {
  const path = ICON_LIBRARY[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

function iconShellStyle(shape, color, size) {
  if (shape === "none" || !shape) return {};
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: size * 2.1,
    height: size * 2.1,
    borderRadius: shape === "circle" ? "50%" : Math.round(size * 0.5),
    background: "rgba(181, 139, 92, 0.12)",
    border: `1px solid ${color}44`,
  };
}

function buttonStyleFor(style, color, textColor) {
  if (style === "outline") {
    return { background: "transparent", color: color, border: `1.5px solid ${color}` };
  }
  if (style === "ghost") {
    return { background: "transparent", color: color, border: "1.5px solid transparent", textDecoration: "underline" };
  }
  if (style === "gradient") {
    return {
      background: `linear-gradient(135deg, ${color} 0%, #CBA378 50%, ${color} 100%)`,
      color: textColor || "#000",
      border: "none",
    };
  }
  return { background: color, color: textColor || "#000", border: "none" };
}

function InlineButton({ text, link, style, color, textColor, icon, iconPosition, newTab }) {
  const skin = buttonStyleFor(style, color || "#B58B5C", textColor);
  return (
    <a
      href={link || "#"}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noreferrer" : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "12px 26px",
        borderRadius: 8,
        fontWeight: 700,
        fontSize: 13,
        textDecoration: skin.textDecoration || "none",
        cursor: "pointer",
        transition: "all .25s ease",
        ...skin,
      }}
    >
      {icon && icon !== "none" && iconPosition === "left" && <Icon name={icon} size={16} color="currentColor" />}
      <span>{text}</span>
      {icon && icon !== "none" && iconPosition !== "left" && <Icon name={icon} size={16} color="currentColor" />}
    </a>
  );
}

function Tabs({ block, accent }) {
  const items = Array.isArray(block.items) ? block.items : [];
  const [active, setActive] = useState(0);
  if (!items.length) return null;
  const current = items[Math.min(active, items.length - 1)];
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: block.tabAlign || "center", borderBottom: `1px solid ${accent}33`, paddingBottom: 8, marginBottom: 18 }}>
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            style={{
              background: i === active ? accent : "transparent",
              color: i === active ? "#000" : "inherit",
              border: `1px solid ${i === active ? accent : "transparent"}`,
              padding: "8px 18px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all .2s ease",
            }}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>{current?.body}</div>
    </div>
  );
}

function Accordion({ block, accent }) {
  const items = Array.isArray(block.items) ? block.items : [];
  const [open, setOpen] = useState(() => {
    const init = {};
    items.forEach((it, i) => {
      if (it.open) init[i] = true;
    });
    return init;
  });

  const toggle = (i) => {
    setOpen((prev) => {
      if (block.allowMultiple === false) return prev[i] ? {} : { [i]: true };
      return { ...prev, [i]: !prev[i] };
    });
  };

  const marker = (isOpen) =>
    block.iconStyle === "chevron" ? (isOpen ? "⌃" : "⌄") : block.iconStyle === "arrow" ? (isOpen ? "↓" : "→") : isOpen ? "−" : "+";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: block.gap ?? 12, width: "100%" }}>
      {items.map((item, i) => (
        <div key={i} style={{ border: `1px solid ${accent}33`, borderRadius: 10, overflow: "hidden", background: "rgba(20,12,6,0.55)" }}>
          <button
            type="button"
            onClick={() => toggle(i)}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              background: "none",
              border: "none",
              color: accent,
              padding: 16,
              fontSize: 15,
              fontWeight: 600,
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <span>{item.question}</span>
            <span style={{ flexShrink: 0 }}>{marker(!!open[i])}</span>
          </button>
          {open[i] && (
            <div style={{ padding: "0 16px 16px", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-line", opacity: 0.85 }}>
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SingleFaq({ block, ctx, index }) {
  const accent = block.textColor || "#B58B5C";
  const key = block.id || index;
  const isOpen = ctx.faqState ? !!ctx.faqState[key] : !!block.initialOpen;
  const marker = block.iconStyle === "chevron" ? (isOpen ? "⌃" : "⌄") : block.iconStyle === "arrow" ? (isOpen ? "↓" : "→") : isOpen ? "−" : "+";
  return (
    <>
      <button
        type="button"
        onClick={() => ctx.toggleFaq && ctx.toggleFaq(key)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          background: "none",
          border: "none",
          color: accent,
          padding: 18,
          fontSize: "inherit",
          fontWeight: 600,
          fontFamily: "inherit",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <span>{block.question}</span>
        <span style={{ flexShrink: 0 }}>{marker}</span>
      </button>
      {isOpen && (
        <div style={{ padding: "14px 18px 18px", borderTop: `1px solid ${accent}33`, fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-line", opacity: 0.85 }}>
          {block.answer}
        </div>
      )}
    </>
  );
}

function StudioLamp({ block, ctx, device }) {
  const lit = block.followsPageLight === false ? block.defaultOn !== false : ctx.lightOn !== false;
  const headW = Math.max(60, parseInt(resolveValue(block, "lampWidth", device) || 440, 10));
  const rodH = Math.max(0, parseInt(resolveValue(block, "rodHeight", device) || 80, 10));
  const beamW = Math.max(100, parseInt(resolveValue(block, "beamWidth", device) || 650, 10));
  const beamH = Math.max(80, parseInt(resolveValue(block, "beamHeight", device) || 500, 10));
  const glow = Math.min(1, Math.max(0, parseFloat(block.glowIntensity ?? 0.38)));

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      <div style={{ width: 4, height: rodH, background: "linear-gradient(to right, #403014, #9c7f47 50%, #2b1f0d)", boxShadow: "1px 0 3px rgba(0,0,0,0.4)" }} />
      <div style={{ width: 30, height: 16, background: "linear-gradient(135deg, #2b1f0d, #8f723b 40%, #dfc38a 60%, #5e461b)", border: "1px solid #1a1205", borderRadius: 2 }} />
      <div style={{ width: 6, height: 34, background: "linear-gradient(to right, #403014, #9c7f47 50%, #2b1f0d)" }} />
      <div style={{ width: headW, maxWidth: "100%", height: 22, background: "linear-gradient(to bottom, #362710 0%, #8f723b 25%, #dfc38a 45%, #fae7b5 55%, #8f723b 75%, #362710 100%)", border: "1px solid #1a1205", borderRadius: 11, position: "relative", boxShadow: "0 8px 16px rgba(0,0,0,0.6)" }}>
        <div style={{ position: "absolute", bottom: 0, left: "15%", right: "15%", height: 4, background: "#fff", borderRadius: 2, boxShadow: "0 0 12px 3px #fae7b5, 0 0 24px 8px #fae7b5", opacity: lit ? 1 : 0, transition: "opacity .25s ease" }} />
      </div>
      <div
        style={{
          position: "absolute",
          top: rodH + 60,
          left: "50%",
          transform: "translateX(-50%)",
          width: beamW,
          maxWidth: "150%",
          height: beamH,
          background: `radial-gradient(ellipse at top, rgba(255,238,180,${glow}) 0%, rgba(255,238,180,${glow * 0.4}) 35%, rgba(255,238,180,${glow * 0.1}) 60%, transparent 75%)`,
          filter: "blur(28px)",
          pointerEvents: "none",
          opacity: lit ? 1 : 0,
          transition: "opacity .25s ease",
          zIndex: -1,
        }}
      />
    </div>
  );
}

function LightSwitch({ block, ctx }) {
  const on = ctx.lightOn !== false;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        background: "rgba(20, 15, 10, 0.8)",
        border: "1px solid rgba(181, 139, 92, 0.3)",
        padding: "8px 20px",
        borderRadius: 30,
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
      }}
    >
      <span style={{ fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "0.15em", color: "var(--accent, #B58B5C)", textTransform: "uppercase", fontWeight: 700 }}>
        {block.label || "Studio Light"}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (ctx.setLightOn) ctx.setLightOn(!on);
        }}
        aria-label="Toggle Studio Light"
        style={{
          width: 44,
          height: 22,
          background: on ? "var(--accent, #B58B5C)" : "#1c150c",
          border: "1px solid var(--border2, rgba(181,139,92,0.35))",
          borderRadius: 12,
          position: "relative",
          cursor: "pointer",
          transition: "background .3s ease",
          padding: 0,
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            background: on ? "#000" : "#fff",
            borderRadius: "50%",
            position: "absolute",
            top: 2,
            left: 2,
            transform: on ? "translateX(22px)" : "translateX(0)",
            transition: "transform .3s cubic-bezier(.4,0,.2,1)",
            boxShadow: "0 1px 3px rgba(0,0,0,.4)",
          }}
        />
      </button>
    </div>
  );
}

function ReelsGallery({ block, device, isEditor }) {
  const reels = Array.isArray(block.reels) ? block.reels : [];
  const cols = parseInt(resolveValue(block, "columns", device) || 3, 10);
  const accent = block.textColor || "#B58B5C";
  const isCarousel = (block.layout || "carousel") === "carousel";

  return (
    <div style={{ width: "100%" }}>
      {(block.sectionTitle || block.sectionSubtitle) && (
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          {block.sectionTitle && (
            <div style={{ fontSize: 12, color: accent, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700 }}>{block.sectionTitle}</div>
          )}
          {block.sectionSubtitle && <p style={{ fontSize: 14, opacity: 0.7, margin: "6px 0 0" }}>{block.sectionSubtitle}</p>}
        </div>
      )}
      <div
        style={
          isCarousel
            ? { display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x mandatory" }
            : { display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 16 }
        }
      >
        {reels.map((reel, i) => (
          <div
            key={reel.id || i}
            style={{
              position: "relative",
              flex: isCarousel ? "0 0 min(300px, 78vw)" : undefined,
              scrollSnapAlign: isCarousel ? "start" : undefined,
              aspectRatio: "9 / 16",
              background: "#000",
              borderRadius: 12,
              overflow: "hidden",
              border: `1px solid ${accent}33`,
            }}
          >
            {isEditor || !reel.instagramUrl ? (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, textAlign: "center" }}>
                <span style={{ fontSize: 22, color: accent }}>❖</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Instagram Reel</span>
                <span style={{ fontSize: 9, opacity: 0.6, wordBreak: "break-all" }}>{reel.instagramUrl || "No URL set"}</span>
              </div>
            ) : (
              <iframe
                src={getIgEmbedUrl(reel.instagramUrl)}
                title={`Reel ${i + 1}`}
                loading="lazy"
                allowFullScreen
                scrolling="no"
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            )}
            {reel.featured && (
              <span style={{ position: "absolute", top: 8, right: 8, background: accent, color: "#000", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10 }}>FEATURED</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner markup per component type
// ---------------------------------------------------------------------------

function BlockInner({ block, device, ctx, index }) {
  const type = block.type || block.blockType;
  const accent = block.accentColor || block.textColor || "#B58B5C";
  const isEditor = !!ctx.isEditor;

  switch (type) {
    case "section":
      return null; // children render in the wrapper

    case "heading": {
      const Tag = block.tag && /^h[1-6]$/.test(block.tag) ? block.tag : "h2";
      const content = <Tag style={{ margin: 0, font: "inherit", color: "inherit", letterSpacing: "inherit" }}>{block.text}</Tag>;
      return block.link ? (
        <a href={block.link} style={{ color: "inherit", textDecoration: "none" }}>
          {content}
        </a>
      ) : (
        content
      );
    }

    case "paragraph":
      return <p style={{ margin: 0, whiteSpace: "pre-line", font: "inherit", color: "inherit" }}>{block.text}</p>;

    case "rich-text":
      return <div className="pb-rich" dangerouslySetInnerHTML={{ __html: block.html || "" }} />;

    case "quote":
      return (
        <blockquote style={{ margin: 0, borderLeft: `3px solid ${accent}`, paddingLeft: 20 }}>
          <p style={{ margin: 0, font: "inherit", color: "inherit" }}>{block.text}</p>
          {block.author && <footer style={{ marginTop: 12, fontSize: 13, fontStyle: "normal", color: accent, letterSpacing: ".08em", textTransform: "uppercase" }}>— {block.author}</footer>}
        </blockquote>
      );

    case "list": {
      const items = Array.isArray(block.items) ? block.items : [];
      const style = block.listStyle || "icon";
      const Tag = style === "number" ? "ol" : "ul";
      return (
        <Tag style={{ margin: 0, padding: style === "disc" || style === "number" ? "0 0 0 22px" : 0, listStyle: style === "disc" ? "disc" : style === "number" ? "decimal" : "none", display: "flex", flexDirection: "column", gap: block.gap ?? 10 }}>
          {items.map((item, i) => (
            <li key={i} style={{ display: style === "icon" ? "flex" : "list-item", gap: 10, alignItems: "flex-start", lineHeight: 1.55 }}>
              {style === "icon" && <Icon name={block.icon || "check"} size={16} color={accent} style={{ marginTop: 3 }} />}
              <span>{item}</span>
            </li>
          ))}
        </Tag>
      );
    }

    case "divider":
      return (
        <div style={{ display: "flex", justifyContent: block.textAlign === "left" ? "flex-start" : block.textAlign === "right" ? "flex-end" : "center" }}>
          <span
            style={{
              display: "block",
              width: block.lineWidth || "100%",
              borderTopWidth: parseInt(block.lineThickness || 1, 10),
              borderTopStyle: block.lineStyle || "solid",
              borderTopColor: block.lineColor || "rgba(181,139,92,.5)",
            }}
          />
        </div>
      );

    case "spacer":
      return <div style={{ height: parseInt(resolveValue(block, "spacerHeight", device) || 48, 10) }} />;

    case "image": {
      const ratio = block.imageRatio && block.imageRatio !== "auto" ? block.imageRatio.replace("/", " / ") : undefined;
      const img = (
        <img
          src={block.url || "/images/bespoke_framing.png"}
          alt={block.alt || block.caption || ""}
          loading="lazy"
          style={{
            width: resolveValue(block, "imageWidth", device) || "100%",
            maxWidth: "100%",
            aspectRatio: ratio,
            height: ratio ? "100%" : "auto",
            objectFit: block.objectFit || "cover",
            display: "block",
            borderRadius: "inherit",
            margin: "0 auto",
          }}
        />
      );
      return (
        <figure style={{ margin: 0 }}>
          {block.link ? <a href={block.link}>{img}</a> : img}
          {block.caption && <figcaption style={{ fontSize: 13, opacity: 0.7, marginTop: 10, textAlign: "center" }}>{block.caption}</figcaption>}
        </figure>
      );
    }

    case "video": {
      const ratio = block.aspectRatio && block.aspectRatio !== "auto" ? block.aspectRatio.replace("/", " / ") : undefined;
      return (
        <figure style={{ margin: 0 }}>
          <div
            style={{
              width: "100%",
              maxWidth: resolveValue(block, "videoMaxWidth", device) || "800px",
              margin: "0 auto",
              aspectRatio: ratio,
              overflow: "hidden",
              borderRadius: "inherit",
              background: "#000",
            }}
          >
            <video
              src={block.url || "/videos/reel1.mp4"}
              poster={block.poster || undefined}
              controls={block.controls !== false}
              autoPlay={!!block.autoPlay}
              loop={!!block.loop}
              muted={!!block.muted || !!block.autoPlay}
              playsInline
              preload="metadata"
              style={{ width: "100%", height: ratio ? "100%" : "auto", objectFit: block.objectFit || "contain", display: "block", background: "#000" }}
            />
          </div>
          {block.caption && <figcaption style={{ fontSize: 13, opacity: 0.7, marginTop: 10, textAlign: "center" }}>{block.caption}</figcaption>}
        </figure>
      );
    }

    case "gallery": {
      const images = Array.isArray(block.images) ? block.images : [];
      const cols = parseInt(resolveValue(block, "galleryColumns", device) || 3, 10);
      const ratio = block.imageRatio && block.imageRatio !== "auto" ? block.imageRatio.replace("/", " / ") : undefined;
      return (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: block.gap ?? 14, width: "100%" }}>
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              loading="lazy"
              style={{ width: "100%", aspectRatio: ratio, objectFit: block.objectFit || "cover", display: "block", borderRadius: "inherit", background: "#000" }}
            />
          ))}
        </div>
      );
    }

    case "logo-strip": {
      const images = Array.isArray(block.images) ? block.images : [];
      const h = parseInt(resolveValue(block, "logoHeight", device) || 46, 10);
      return (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: block.justifyContent || "center", gap: block.gap ?? 40, width: "100%" }}>
          {images.length === 0 && <span style={{ fontSize: 12, opacity: 0.5 }}>Add logo images in the inspector.</span>}
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              loading="lazy"
              style={{ height: h, width: "auto", objectFit: "contain", filter: block.grayscale ? "grayscale(1)" : "none", opacity: block.grayscale ? 0.75 : 1, transition: "all .3s ease" }}
            />
          ))}
        </div>
      );
    }

    case "button":
      return (
        <InlineButton
          text={block.text}
          link={block.link}
          style={block.buttonStyle}
          color={block.btnColor}
          textColor={block.textColor}
          icon={block.icon}
          iconPosition={block.iconPosition}
          newTab={block.newTab}
        />
      );

    case "button-group": {
      const buttons = Array.isArray(block.buttons) ? block.buttons : [];
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: block.gap ?? 14, justifyContent: block.justifyContent || "center", width: "100%" }}>
          {buttons.map((b, i) => (
            <InlineButton key={i} text={b.text} link={b.link} style={b.style} color={block.btnColor} textColor="#000" />
          ))}
        </div>
      );
    }

    case "icon": {
      const size = parseInt(resolveValue(block, "iconSize", device) || 44, 10);
      const node = (
        <span style={iconShellStyle(block.iconShape, block.iconColor || accent, size)}>
          <Icon name={block.icon || "sparkle"} size={size} color={block.iconColor || accent} stroke={block.iconStroke || 1.6} />
        </span>
      );
      return block.link ? <a href={block.link}>{node}</a> : node;
    }

    case "icon-box": {
      const layout = resolveValue(block, "iconLayout", device) || "top";
      const size = parseInt(block.iconSize || 34, 10);
      const iconNode = (
        <span style={iconShellStyle(block.iconShape, block.iconColor || accent, size)}>
          <Icon name={block.icon || "star"} size={size} color={block.iconColor || accent} />
        </span>
      );
      const textNode = (
        <div style={{ minWidth: 0 }}>
          {block.title && (
            <h4 style={{ margin: "0 0 8px", fontSize: parseInt(resolveValue(block, "titleSize", device) || 18, 10), color: block.titleColor || "#F4EFE6", fontFamily: "inherit", fontWeight: 700 }}>
              {block.title}
            </h4>
          )}
          {block.text && <p style={{ margin: 0, whiteSpace: "pre-line", font: "inherit", color: "inherit" }}>{block.text}</p>}
        </div>
      );
      const body =
        layout === "top" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: block.textAlign === "left" ? "flex-start" : block.textAlign === "right" ? "flex-end" : "center" }}>
            {iconNode}
            {textNode}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: layout === "right" ? "row-reverse" : "row", gap: 16, alignItems: "flex-start" }}>
            {iconNode}
            {textNode}
          </div>
        );
      return block.link ? (
        <a href={block.link} style={{ color: "inherit", textDecoration: "none", display: "block" }}>
          {body}
        </a>
      ) : (
        body
      );
    }

    case "badge":
      return (
        <span style={{ display: "inline-block", background: block.badgeColor || accent, color: block.badgeTextColor || "#000", font: "inherit", lineHeight: 1.4 }}>
          {block.text}
        </span>
      );

    case "social-icons": {
      const links = Array.isArray(block.links) ? block.links : [];
      const size = parseInt(block.iconSize || 20, 10);
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: block.gap ?? 12, justifyContent: block.justifyContent || "center", width: "100%" }}>
          {links.map((l, i) => (
            <a key={i} href={l.url || "#"} target="_blank" rel="noreferrer" aria-label={l.icon} style={{ ...iconShellStyle(block.iconShape, block.iconColor || accent, size), color: "inherit", textDecoration: "none" }}>
              <Icon name={l.icon || "instagram"} size={size} color={block.iconColor || accent} />
            </a>
          ))}
        </div>
      );
    }

    case "tabs":
      return <Tabs block={block} accent={accent} />;

    case "accordion":
      return <Accordion block={block} accent={accent} />;

    case "faq":
      return <SingleFaq block={block} ctx={ctx} index={index} />;

    case "stat":
      return (
        <div>
          <div style={{ fontSize: parseInt(resolveValue(block, "valueSize", device) || 46, 10), fontWeight: 800, color: accent, lineHeight: 1.1, fontFamily: "inherit" }}>
            {block.prefix}
            {block.value}
            {block.suffix}
          </div>
          {block.label && <div style={{ marginTop: 8, font: "inherit", color: "inherit", opacity: 0.85 }}>{block.label}</div>}
        </div>
      );

    case "progress": {
      const pct = Math.max(0, Math.min(100, parseFloat(block.percent) || 0));
      return (
        <div style={{ width: "100%" }}>
          {(block.label || block.showValue) && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, font: "inherit" }}>
              <span>{block.label}</span>
              {block.showValue !== false && <span style={{ color: accent, fontWeight: 700 }}>{pct}%</span>}
            </div>
          )}
          <div style={{ width: "100%", height: parseInt(block.barHeight || 10, 10), background: block.trackColor || "rgba(181,139,92,.18)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: block.barColor || accent, borderRadius: 999, transition: "width .6s ease" }} />
          </div>
        </div>
      );
    }

    case "table": {
      const headers = Array.isArray(block.headers) ? block.headers : [];
      const rows = Array.isArray(block.rows) ? block.rows : [];
      return (
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", font: "inherit", minWidth: 420 }}>
            {headers.length > 0 && (
              <thead>
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} style={{ textAlign: "left", padding: "12px 14px", color: accent, borderBottom: `1px solid ${accent}55`, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ background: block.striped && ri % 2 ? "rgba(232,216,198,.035)" : "transparent" }}>
                  {(Array.isArray(row) ? row : []).map((cell, ci) => (
                    <td key={ci} style={{ padding: "12px 14px", borderBottom: "1px solid rgba(181,139,92,.16)" }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "pricing": {
      const features = Array.isArray(block.features) ? block.features.filter(Boolean) : [];
      return (
        <div style={{ textAlign: block.textAlign || "center" }}>
          {block.ribbonBadge && (
            <span style={{ display: "inline-block", background: accent, color: "#000", fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 4, marginBottom: 12, letterSpacing: ".05em" }}>
              {block.ribbonBadge}
            </span>
          )}
          <h3 style={{ margin: "0 0 8px", fontSize: 22, color: "#F4EFE6", fontFamily: "inherit" }}>{block.title}</h3>
          <div style={{ fontSize: 38, fontWeight: 800, color: accent, lineHeight: 1.1 }}>
            {block.currency} {block.price}
          </div>
          {block.period && <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{block.period}</div>}
          {features.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0, margin: "22px auto", maxWidth: 320, textAlign: "left", display: "flex", flexDirection: "column", gap: 9 }}>
              {features.map((feat, i) => (
                <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, lineHeight: 1.5, opacity: 0.9 }}>
                  <Icon name="check" size={15} color={accent} style={{ marginTop: 3 }} />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          )}
          {block.buttonText && <InlineButton text={block.buttonText} link={block.buttonLink} style="solid" color={accent} textColor="#000" />}
        </div>
      );
    }

    case "testimonial":
      return (
        <div>
          <div style={{ color: accent, fontSize: 18, marginBottom: 10, letterSpacing: 2 }}>{"★".repeat(parseInt(block.rating || 5, 10))}</div>
          <p style={{ margin: "0 0 16px", fontStyle: "italic", fontSize: 16, color: "#F4EFE6", lineHeight: 1.65 }}>“{block.quote}”</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {block.avatarUrl && <img src={block.avatarUrl} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />}
            <div style={{ fontSize: 13, fontWeight: 700, color: accent }}>
              {block.name}
              {block.location ? <span style={{ opacity: 0.65, fontWeight: 400 }}> · {block.location}</span> : null}
            </div>
          </div>
        </div>
      );

    case "cta-banner":
      return (
        <div>
          <h3 style={{ margin: "0 0 12px", fontSize: 30, color: accent, fontFamily: "inherit" }}>{block.title}</h3>
          {block.subtitle && <p style={{ margin: "0 0 22px", fontSize: 15, opacity: 0.8 }}>{block.subtitle}</p>}
          {block.buttonText && <InlineButton text={block.buttonText} link={block.buttonLink} style="solid" color={accent} textColor="#000" />}
        </div>
      );

    case "map": {
      const h = parseInt(resolveValue(block, "mapHeight", device) || 380, 10);
      const src = `https://www.google.com/maps?q=${encodeURIComponent(block.query || "Lahore, Pakistan")}&output=embed`;
      return (
        <div style={{ width: "100%", height: h, borderRadius: "inherit", overflow: "hidden", background: "#111" }}>
          {isEditor ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6, color: accent }}>
              <Icon name="pin" size={26} color={accent} />
              <span style={{ fontSize: 12 }}>Map · {block.query}</span>
              <span style={{ fontSize: 10, opacity: 0.6 }}>Live map renders on the published page</span>
            </div>
          ) : (
            <iframe src={src} title="Map" loading="lazy" style={{ width: "100%", height: "100%", border: "none" }} />
          )}
        </div>
      );
    }

    case "html-embed":
      return isEditor ? (
        <div style={{ border: `1px dashed ${accent}66`, borderRadius: 8, padding: 16, fontSize: 11, fontFamily: "monospace", opacity: 0.75, wordBreak: "break-all" }}>
          {(block.html || "").slice(0, 300) || "Empty embed"}
        </div>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: block.html || "" }} />
      );

    case "form": {
      const fields = Array.isArray(block.fields) ? block.fields : [];
      const inputStyle = {
        width: "100%",
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${accent}44`,
        borderRadius: 8,
        padding: "12px 14px",
        color: "inherit",
        fontSize: 14,
        fontFamily: "inherit",
        boxSizing: "border-box",
      };
      return (
        <form
          style={{ display: "flex", flexDirection: "column", gap: block.gap ?? 14, width: "100%" }}
          onSubmit={(e) => {
            e.preventDefault();
            if (isEditor) return;
            const data = new FormData(e.currentTarget);
            const body = [...data.entries()].map(([k, v]) => `${k}: ${v}`).join("\n");
            const to = block.submitTo || "team@yaadein.com";
            window.location.href = `mailto:${to}?subject=${encodeURIComponent("Website enquiry")}&body=${encodeURIComponent(body)}`;
          }}
        >
          {fields.map((fld, i) => (
            <label key={i} style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, opacity: 0.85 }}>
              <span>
                {fld.label}
                {fld.required ? " *" : ""}
              </span>
              {fld.type === "textarea" ? (
                <textarea name={fld.label} rows={4} required={!!fld.required} style={inputStyle} />
              ) : (
                <input name={fld.label} type={fld.type || "text"} required={!!fld.required} style={inputStyle} />
              )}
            </label>
          ))}
          <button
            type="submit"
            style={{ background: accent, color: "#000", border: "none", padding: "13px 28px", borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: "pointer", alignSelf: "flex-start" }}
          >
            {block.submitText || "Submit"}
          </button>
        </form>
      );
    }

    case "video-reels":
      return <ReelsGallery block={block} device={device} isEditor={isEditor} />;

    case "coded-section": {
      // On the real page the section's React lives in ctx.sectionNodes; in the
      // editor there is nothing to mount, so show what it is and where it sits.
      const node = ctx.sectionNodes ? ctx.sectionNodes[block.sectionId] : null;
      if (node) return node;
      const label = block.sectionLabel || block.sectionId || "Coded section";
      return (
        <div style={{ border: "1px dashed rgba(181,139,92,.5)", borderRadius: 12, background: "linear-gradient(160deg, rgba(181,139,92,.09), rgba(181,139,92,.02))", padding: "26px 22px", display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 11, background: "rgba(181,139,92,.16)", border: "1px solid rgba(181,139,92,.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#B58B5C" }}>⬓</span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 16, fontWeight: 700, color: "#F4EFE6" }}>{label}</span>
            <span style={{ display: "block", fontSize: 12.5, color: "#9A8A79", marginTop: 4, lineHeight: 1.55 }}>
              {block.sectionHint || "Built in React — renders live on the page. Drag to reorder, or style its wrapper from the inspector."}
            </span>
          </span>
        </div>
      );
    }

    case "product-grid":
    case "services-grid":
    case "category-tiles":
      return <AppSection block={block} device={device} ctx={ctx} />;

    case "studio-lamp":
      return <StudioLamp block={block} ctx={ctx} device={device} />;

    case "light-switch":
      return <LightSwitch block={block} ctx={ctx} />;

    // ---- legacy blocks from before the rewrite
    case "row-2col":
    case "row-3col": {
      const count = type === "row-3col" ? 3 : 2;
      return (
        <div style={{ display: "grid", gridTemplateColumns: block.colRatio || `repeat(${count}, 1fr)`, gap: block.gap ?? 24, alignItems: block.verticalAlign || "center", width: "100%" }}>
          {Array.from({ length: count }).map((_, i) => {
            const n = i + 1;
            return (
              <div key={n} style={{ background: "rgba(20,12,6,.6)", border: "1px solid rgba(181,139,92,.2)", borderRadius: 12, padding: 22, minHeight: block.colMinHeight || undefined }}>
                {block[`col${n}Type`] === "image" ? (
                  <img src={block[`col${n}Image`] || "/images/bespoke_framing.png"} alt="" style={{ width: "100%", borderRadius: 8, display: "block" }} />
                ) : (
                  <>
                    {block[`col${n}Title`] && <h4 style={{ margin: "0 0 8px", color: accent, fontSize: 18 }}>{block[`col${n}Title`]}</h4>}
                    <p style={{ margin: 0, whiteSpace: "pre-line", fontSize: 14, opacity: 0.8 }}>{block[`col${n}Body`]}</p>
                    {block[`col${n}ButtonText`] && (
                      <div style={{ marginTop: 14 }}>
                        <InlineButton text={block[`col${n}ButtonText`]} link={block[`col${n}ButtonLink`]} style="solid" color={accent} textColor="#000" />
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    default:
      return isEditor ? (
        <div style={{ padding: 16, border: "1px dashed rgba(255,255,255,.2)", borderRadius: 8, fontSize: 12, opacity: 0.6 }}>
          Unknown block type “{type}”
        </div>
      ) : null;
  }
}

/**
 * Render one block (and its children). `ctx` carries page-level state:
 *   { lightOn, setLightOn, faqState, toggleFaq, isEditor, renderChild }
 * `renderChild` lets the builder wrap nested blocks in its own selection chrome.
 */
export default function BlockView({ block, device = "desktop", ctx = {}, index = 0 }) {
  if (!block) return null;
  const isContainer = isContainerBlock(block);
  const classes = [blockClassName(block), "pb-block", `pb-t-${block.type}`, block.cssClass || ""].filter(Boolean).join(" ");
  const contentWidth = resolveValue(block, "contentWidth", device);
  const needsInnerWrap = isContainer && contentWidth && contentWidth !== "100%";

  const children = isContainer
    ? (block.children || []).map((child, i) => <BlockView key={child.id || i} block={child} device={device} ctx={ctx} index={i} />)
    : null;

  // The editor injects selection/drag handlers straight onto the block element so
  // the DOM shape stays identical between the canvas and the published page.
  const { className: extraClass, ...editorProps } = ctx.blockProps ? ctx.blockProps(block) : {};

  return (
    <div
      className={[classes, extraClass].filter(Boolean).join(" ")}
      id={block.cssId || undefined}
      data-block-id={block.id}
      {...editorProps}
    >
      {ctx.blockOverlay ? ctx.blockOverlay(block) : null}
      {isContainer ? (
        needsInnerWrap ? (
          <div
            style={{
              width: "100%",
              maxWidth: contentWidth,
              margin: "0 auto",
              display: "inherit",
              gridTemplateColumns: "inherit",
              flexDirection: "inherit",
              gap: "inherit",
              alignItems: "inherit",
              justifyContent: "inherit",
            }}
          >
            {children}
          </div>
        ) : (
          children
        )
      ) : (
        <BlockInner block={block} device={device} ctx={ctx} index={index} />
      )}
      {isContainer && ctx.isEditor && (block.children || []).length === 0 && (
        <div style={{ flex: 1, minHeight: 90, border: "1px dashed rgba(181,139,92,.45)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "rgba(181,139,92,.75)", gridColumn: "1 / -1" }}>
          Drop widgets here
        </div>
      )}
    </div>
  );
}
