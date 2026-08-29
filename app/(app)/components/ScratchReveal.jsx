"use client";

// ---------------------------------------------------------------------------
// ScratchReveal — lottery-style scratch-off over the framed photo.
//
// A sheet of antique gold foil covers the print inside the frame. Holding the
// left mouse button and dragging tears it away in angular chunks, so the
// revealed area keeps the ragged, torn-foil edge of a real scratch card rather
// than a smooth brush stroke. Hovering alone does nothing.
//
// Attached by selector rather than by wrapping JSX: the sections live deep
// inside an 8k-line page, so a MutationObserver picks them up whenever they
// mount or the saved page layout reorders them.
// ---------------------------------------------------------------------------

import { useEffect } from "react";

// The photo inside the gold frame, in the two showcase bands on the home page
// ("Where Memories Meet Nature's Light" and "Crafted With Care, Delivered With
// Pride"). Both render the same container.
const TARGETS = ".exquisite-inner-photo";

// Chunk radius scales with the photo so a small frame is not torn open in one
// swipe and a large one does not need endless scrubbing.
const chunkFor = (w, h) => Math.max(16, Math.min(46, Math.min(w, h) * 0.11));

const CLEAR_AT = 0.62;    // fraction torn away before the rest falls off
const SAMPLE_EVERY = 6;   // drag events between progress checks (getImageData is costly)

const CSS = `
.scratch-layer {
  position: absolute;
  inset: 0;
  /* Above the print, below the lamp highlight and glass reflection so the
     foil still catches the picture light. */
  z-index: 11;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
  transition: opacity 620ms ease;
}
.scratch-layer:active { cursor: grabbing; }
.scratch-layer.is-cleared { opacity: 0; pointer-events: none; }
@media (prefers-reduced-motion: reduce) {
  .scratch-layer { display: none; }
}
`;

// Read once: the typewriter face the rest of the site uses, resolved from the
// CSS custom property because canvas cannot take `var()` in its `font` string.
let FOIL_FONT = "monospace";
if (typeof window !== "undefined") {
  const token = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-typewriter")
    .trim();
  if (token) FOIL_FONT = token;
}

/** Antique gold leaf, matching the gilded frame it sits inside. */
function paintFoil(ctx, w, h) {
  // Banded rather than a plain two-stop ramp — gold reads as metal only when
  // the highlights and shadows alternate across the surface.
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0.0, "#6E5118");
  g.addColorStop(0.14, "#B08B2E");
  g.addColorStop(0.26, "#E7CE84");
  g.addColorStop(0.36, "#A07C27");
  g.addColorStop(0.5, "#F0DA9B");
  g.addColorStop(0.62, "#9A7623");
  g.addColorStop(0.76, "#DCC071");
  g.addColorStop(0.88, "#7C5C1B");
  g.addColorStop(1.0, "#5A4113");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Fine vertical brushing, like leaf that has been burnished.
  ctx.globalAlpha = 0.05;
  for (let x = 0; x < w; x += 2) {
    ctx.fillStyle = Math.random() > 0.5 ? "#FFF4CE" : "#3F2D0C";
    ctx.fillRect(x, 0, 1, h);
  }

  // Speckle so it does not look like a flat gradient.
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < (w * h) / 700; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "#FFF6DA" : "#2E2008";
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }
  ctx.globalAlpha = 1;

  // Diagonal sheen sweeping across the leaf.
  const sheen = ctx.createLinearGradient(0, h, w, 0);
  sheen.addColorStop(0, "rgba(255,255,255,0)");
  sheen.addColorStop(0.46, "rgba(255,248,214,0.26)");
  sheen.addColorStop(0.54, "rgba(255,248,214,0.08)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  // Darkened edges, so the sheet sits into the frame rather than on top of it.
  const vig = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.25,
    w / 2, h / 2, Math.max(w, h) * 0.72
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(28,18,2,0.45)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Too cramped for a legible prompt — leave it clean.
  if (w < 90 || h < 70) return;

  const label = "SCRATCH TO REVEAL";
  const size = Math.max(10, Math.min(15, w / 15));
  ctx.font = `700 ${size}px ${FOIL_FONT}, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) ctx.letterSpacing = "2px";
  ctx.fillStyle = "rgba(46,28,2,0.72)";
  ctx.fillText(label, w / 2, h / 2 + 1.5);
  ctx.fillStyle = "rgba(255,247,226,0.95)";
  ctx.fillText(label, w / 2, h / 2);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
}

export default function ScratchReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cleanups = [];

    // A photo in a section that has not been laid out yet measures 0x0. Watch
    // it and lay the foil down the moment it is given a size.
    const pending = new ResizeObserver((entries) => {
      entries.forEach((e) => {
        if (e.contentRect.width >= 40 && e.contentRect.height >= 40) {
          pending.unobserve(e.target);
          attach(e.target);
        }
      });
    });

    const attach = (host) => {
      if (!host || host.dataset.scratchBound) return;
      const rect = host.getBoundingClientRect();
      if (rect.width < 40 || rect.height < 40) {
        if (!host.dataset.scratchPending) {
          host.dataset.scratchPending = "1";
          pending.observe(host);
        }
        return;
      }

      delete host.dataset.scratchPending;
      host.dataset.scratchBound = "1";

      // The canvas is absolutely positioned, so the host has to be a containing
      // block. Only force that when it is static — the showcase photo is already
      // absolutely positioned inside its frame, and overriding that would knock
      // it out of place.
      if (getComputedStyle(host).position === "static") host.style.position = "relative";

      const canvas = document.createElement("canvas");
      canvas.className = "scratch-layer";
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      let w = 0;
      let h = 0;
      let cleared = false;
      let events = 0;
      let last = null;
      let radius = 24;

      const size = () => {
        const r = host.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = Math.max(1, Math.round(r.width));
        h = Math.max(1, Math.round(r.height));
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        radius = chunkFor(w, h);
        paintFoil(ctx, w, h);
      };

      const progress = () => {
        // Sample on a coarse grid — reading every pixel each drag is far too slow.
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let clearPx = 0;
        let total = 0;
        for (let i = 3; i < img.length; i += 4 * 16) {
          total++;
          if (img[i] === 0) clearPx++;
        }
        return total ? clearPx / total : 0;
      };

      const finish = () => {
        cleared = true;
        canvas.classList.add("is-cleared");
        window.setTimeout(() => canvas.remove(), 700);
      };

      // One torn-away flake: an irregular spiked polygon, not a circle. Overlapping
      // these along the drag is what gives the ragged zig-zag edge.
      const flake = (x, y) => {
        const spikes = 9 + Math.floor(Math.random() * 4);
        ctx.beginPath();
        for (let i = 0; i < spikes; i++) {
          const a = (i / spikes) * Math.PI * 2 + Math.random() * 0.22;
          const rad = radius * (0.5 + Math.random() * 0.85);
          const px = x + Math.cos(a) * rad;
          const py = y + Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      };

      const tearTo = (x, y) => {
        ctx.globalCompositeOperation = "destination-out";

        if (last) {
          // Step along the drag so the torn strip is continuous even when the
          // pointer jumps, while every flake keeps its own jagged outline.
          const dx = x - last.x;
          const dy = y - last.y;
          const dist = Math.hypot(dx, dy);
          const steps = Math.max(1, Math.ceil(dist / (radius * 0.42)));
          for (let i = 1; i <= steps; i++) {
            flake(last.x + (dx * i) / steps, last.y + (dy * i) / steps);
          }
        } else {
          flake(x, y);
        }

        ctx.globalCompositeOperation = "source-over";
        last = { x, y };

        if (++events % SAMPLE_EVERY === 0 && progress() >= CLEAR_AT) finish();
      };

      const point = (e) => {
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };

      const onDown = (e) => {
        if (cleared || e.button !== 0) return;
        e.preventDefault();
        // Keep receiving moves even if the drag wanders off the photo.
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {
          // Not fatal — the pointermove listener still fires over the canvas.
        }
        last = null;
        const p = point(e);
        tearTo(p.x, p.y);
      };

      const onMove = (e) => {
        // Scratch only while the left button is held; hovering does nothing.
        if (cleared || !(e.buttons & 1)) {
          last = null;
          return;
        }
        e.preventDefault();
        const p = point(e);
        tearTo(p.x, p.y);
      };

      const onUp = (e) => {
        last = null;
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          // Capture may already have been lost; nothing to release.
        }
      };

      const onLeave = () => {
        last = null;
      };

      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onUp);
      canvas.addEventListener("pointerleave", onLeave);

      host.appendChild(canvas);
      size();

      const ro = new ResizeObserver(() => {
        if (!cleared) size();
      });
      ro.observe(host);

      cleanups.push(() => {
        ro.disconnect();
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointercancel", onUp);
        canvas.removeEventListener("pointerleave", onLeave);
        canvas.remove();
        delete host.dataset.scratchBound;
      });
    };

    const scan = () => document.querySelectorAll(TARGETS).forEach(attach);
    scan();

    // Sections mount after the CMS answers, so keep watching for new ones.
    const mo = new MutationObserver(() => {
      window.clearTimeout(mo._t);
      mo._t = window.setTimeout(scan, 120);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(mo._t);
      mo.disconnect();
      pending.disconnect();
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}
