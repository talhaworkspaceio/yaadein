"use client";

// ---------------------------------------------------------------------------
// FrameLoader — the studio's loading state.
//
// Three brass rectangles stretch and reshuffle around a square, like frames
// being laid out on the workbench. Adapted from the Uiverse "boxes" loader by
// alexruix, re-skinned in the studio's brass palette.
//
//   <FrameLoader />                        inline, default size
//   <FrameLoader variant="page" />         centred in a full-height panel
//   <FrameLoader variant="overlay" />      floats over existing content
//   <FrameLoader variant="button" />       small enough to sit inside a button
//
// The keyframes are authored at the loader's natural 112px; `size` scales the
// whole thing with a transform so the animation geometry stays exact.
// ---------------------------------------------------------------------------

const BASE = 112;

const CSS = `
.fl-stage { position: relative; display: grid; place-items: center; flex-shrink: 0; }

.fl-boxes {
  position: absolute;
  top: 50%;
  left: 50%;
  width: ${BASE}px;
  height: ${BASE}px;
  transform-origin: center center;
}

.fl-box {
  box-sizing: border-box;
  position: absolute;
  display: block;
  border: 16px solid #B58B5C;
  border-image: linear-gradient(135deg, #6B5233 0%, #B58B5C 35%, #F0DCC0 52%, #B58B5C 68%, #6B5233 100%) 1;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, .55));
}

.fl-box1 {
  width: ${BASE}px;
  height: 48px;
  margin-top: 64px;
  margin-left: 0px;
  animation: fl-abox1 4s 1s forwards ease-in-out infinite;
}

.fl-box2 {
  width: 48px;
  height: 48px;
  margin-top: 0px;
  margin-left: 0px;
  animation: fl-abox2 4s 1s forwards ease-in-out infinite;
}

.fl-box3 {
  width: 48px;
  height: 48px;
  margin-top: 0px;
  margin-left: 64px;
  animation: fl-abox3 4s 1s forwards ease-in-out infinite;
}

/* Warm lamp wash behind the boxes so they sit in the studio, not on a void */
.fl-glow {
  position: absolute; top: 50%; left: 50%;
  width: 190%; height: 190%; border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(203,163,120,.28) 0%, rgba(181,139,92,.10) 45%, transparent 70%);
  filter: blur(14px); pointer-events: none;
  animation: fl-glow 4s ease-in-out infinite;
}
@keyframes fl-glow {
  0%, 100% { opacity: .45; }
  50%      { opacity: .9; }
}

@keyframes fl-abox1 {
  0%    { width: ${BASE}px; height: 48px;  margin-top: 64px; margin-left: 0px; }
  12.5% { width: 48px;  height: 48px;  margin-top: 64px; margin-left: 0px; }
  25%   { width: 48px;  height: 48px;  margin-top: 64px; margin-left: 0px; }
  37.5% { width: 48px;  height: 48px;  margin-top: 64px; margin-left: 0px; }
  50%   { width: 48px;  height: 48px;  margin-top: 64px; margin-left: 0px; }
  62.5% { width: 48px;  height: 48px;  margin-top: 64px; margin-left: 0px; }
  75%   { width: 48px;  height: ${BASE}px; margin-top: 0px;  margin-left: 0px; }
  87.5% { width: 48px;  height: 48px;  margin-top: 0px;  margin-left: 0px; }
  100%  { width: 48px;  height: 48px;  margin-top: 0px;  margin-left: 0px; }
}

@keyframes fl-abox2 {
  0%    { width: 48px;  height: 48px; margin-top: 0px; margin-left: 0px; }
  12.5% { width: 48px;  height: 48px; margin-top: 0px; margin-left: 0px; }
  25%   { width: 48px;  height: 48px; margin-top: 0px; margin-left: 0px; }
  37.5% { width: 48px;  height: 48px; margin-top: 0px; margin-left: 0px; }
  50%   { width: ${BASE}px; height: 48px; margin-top: 0px; margin-left: 0px; }
  62.5% { width: 48px;  height: 48px; margin-top: 0px; margin-left: 64px; }
  75%   { width: 48px;  height: 48px; margin-top: 0px; margin-left: 64px; }
  87.5% { width: 48px;  height: 48px; margin-top: 0px; margin-left: 64px; }
  100%  { width: 48px;  height: 48px; margin-top: 0px; margin-left: 64px; }
}

@keyframes fl-abox3 {
  0%    { width: 48px; height: 48px;  margin-top: 0px;  margin-left: 64px; }
  12.5% { width: 48px; height: 48px;  margin-top: 0px;  margin-left: 64px; }
  25%   { width: 48px; height: ${BASE}px; margin-top: 0px;  margin-left: 64px; }
  37.5% { width: 48px; height: 48px;  margin-top: 64px; margin-left: 64px; }
  50%   { width: 48px; height: 48px;  margin-top: 64px; margin-left: 64px; }
  62.5% { width: 48px; height: 48px;  margin-top: 64px; margin-left: 64px; }
  75%   { width: 48px; height: 48px;  margin-top: 64px; margin-left: 64px; }
  87.5% { width: 48px; height: 48px;  margin-top: 64px; margin-left: 64px; }
  100%  { width: ${BASE}px; height: 48px; margin-top: 64px; margin-left: 0px; }
}

@keyframes fl-dots { 0%, 20% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }

.fl-label {
  font-family: var(--font-typewriter, monospace);
  font-size: 11px; letter-spacing: .18em; text-transform: uppercase;
  color: var(--text2, #C5B6A5); text-align: center; margin: 0;
}
.fl-label i { font-style: normal; animation: fl-dots 1.4s infinite; }
.fl-label i:nth-child(2) { animation-delay: .2s; }
.fl-label i:nth-child(3) { animation-delay: .4s; }

.fl-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 26px; }
.fl-page { min-height: 60vh; width: 100%; }
.fl-overlay {
  position: absolute; inset: 0; z-index: 50;
  background: rgba(12,10,8,.72);
  backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
}
.fl-inline { padding: 44px 20px; width: 100%; }

@media (prefers-reduced-motion: reduce) {
  .fl-box, .fl-glow, .fl-label i { animation: none !important; }
}
`;

export default function FrameLoader({
  variant = "inline",
  size,
  label = "Loading",
  showLabel = true,
  className = "",
  style,
}) {
  const isButton = variant === "button";
  const px = size || (isButton ? 26 : variant === "page" ? 112 : 84);
  const scale = px / BASE;

  const stage = (
    <div className="fl-stage" style={{ width: px, height: px }} role="status" aria-live="polite">
      {!isButton && <span className="fl-glow" />}
      <span className="fl-boxes" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <span className="fl-box fl-box1" />
        <span className="fl-box fl-box2" />
        <span className="fl-box fl-box3" />
      </span>
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {label}
      </span>
    </div>
  );

  // Inside a button the stage is all we need — no label, no wrapper.
  if (isButton) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        {stage}
      </>
    );
  }

  const wrapClass = ["fl-wrap", variant === "page" ? "fl-page" : variant === "overlay" ? "fl-overlay fl-wrap" : "fl-inline", className]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className={wrapClass} style={style}>
        {stage}
        {showLabel && label && (
          <p className="fl-label" aria-hidden="true">
            {label}
            <i>.</i>
            <i>.</i>
            <i>.</i>
          </p>
        )}
      </div>
    </>
  );
}
