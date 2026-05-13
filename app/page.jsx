"use client";

import { useState, useRef, useCallback } from "react";

const FRAMES = [
  {
    id: "classic",
    name: "Classic Oak",
    border: "24px",
    color: "#8B5E3C",
    accent: "#6B4423",
    innerShadow: "inset 0 0 8px rgba(0,0,0,0.35)",
    outerShadow: "0 8px 32px rgba(0,0,0,0.28)",
    grain: true,
  },
  {
    id: "modern",
    name: "Matte Black",
    border: "16px",
    color: "#1A1A1A",
    accent: "#333",
    innerShadow: "inset 0 0 6px rgba(0,0,0,0.5)",
    outerShadow: "0 12px 40px rgba(0,0,0,0.4)",
    grain: false,
  },
  {
    id: "gold",
    name: "Antique Gold",
    border: "28px",
    color: "#C9A84C",
    accent: "#A07830",
    innerShadow: "inset 0 0 10px rgba(0,0,0,0.3)",
    outerShadow: "0 10px 36px rgba(180,140,40,0.3)",
    grain: false,
  },
  {
    id: "white",
    name: "Gallery White",
    border: "20px",
    color: "#F0EDE8",
    accent: "#D5D0C8",
    innerShadow: "inset 0 0 6px rgba(0,0,0,0.12)",
    outerShadow: "0 8px 28px rgba(0,0,0,0.18)",
    grain: false,
  },
  {
    id: "silver",
    name: "Brushed Silver",
    border: "18px",
    color: "#B8BCC4",
    accent: "#8E9298",
    innerShadow: "inset 0 0 8px rgba(0,0,0,0.2)",
    outerShadow: "0 8px 30px rgba(0,0,0,0.22)",
    grain: false,
  },
  {
    id: "rustic",
    name: "Rustic Walnut",
    border: "30px",
    color: "#5C3D2E",
    accent: "#3E2417",
    innerShadow: "inset 0 0 12px rgba(0,0,0,0.4)",
    outerShadow: "0 10px 38px rgba(0,0,0,0.3)",
    grain: true,
  },
];

const SAMPLE_PHOTOS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=800&fit=crop",
];

export default function FrameCustomizer() {
  const [selectedFrame, setSelectedFrame] = useState(FRAMES[0]);
  const [rotation, setRotation] = useState(0);
  const [uploadedImage, setUploadedImage] = useState(SAMPLE_PHOTOS[0]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("frame");
  const fileRef = useRef();

  const handleUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedImage(url);
  }, []);

  const handleRotate = useCallback((deg) => {
    setRotation((r) => (r + deg + 360) % 360);
  }, []);

  const borderInt = parseInt(selectedFrame.border);

  return (
    <div className="app-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0F0D0B;
          --surface: #1A1714;
          --surface2: #231F1B;
          --surface3: #2D2822;
          --border: rgba(255,255,255,0.07);
          --border2: rgba(255,255,255,0.13);
          --text: #F5F0E8;
          --text2: #A09880;
          --accent: #C9A84C;
          --accent2: #E8C96A;
          --radius: 12px;
          --sidebar: 280px;
        }

        .app-root {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* HEADER */
        .header {
          height: 56px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          position: sticky;
          top: 0;
          z-index: 100;
          flex-shrink: 0;
        }
        .header-brand {
          font-family: 'DM Serif Display', serif;
          font-size: 18px;
          letter-spacing: 0.02em;
          color: var(--accent);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .header-brand span { color: var(--text); font-size: 16px; }
        .header-actions { display: flex; gap: 8px; }
        .btn-icon {
          width: 36px; height: 36px;
          background: var(--surface2);
          border: 1px solid var(--border2);
          border-radius: 8px;
          color: var(--text2);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          transition: all 0.15s;
        }
        .btn-icon:hover { background: var(--surface3); color: var(--text); }
        .menu-toggle {
          display: none;
        }

        /* LAYOUT */
        .layout {
          flex: 1;
          display: flex;
          overflow: hidden;
          position: relative;
        }

        /* SIDEBAR */
        .sidebar {
          width: var(--sidebar);
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          flex-shrink: 0;
          transition: transform 0.3s ease, width 0.3s ease;
        }
        .sidebar-closed {
          transform: translateX(calc(-1 * var(--sidebar)));
          width: 0;
          overflow: hidden;
          border: none;
        }

        .sidebar-tabs {
          display: flex;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .tab-btn {
          flex: 1;
          padding: 14px 0;
          background: none;
          border: none;
          color: var(--text2);
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          position: relative;
          transition: color 0.15s;
        }
        .tab-btn.active { color: var(--accent); }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: 0; left: 20%; right: 20%;
          height: 2px;
          background: var(--accent);
          border-radius: 2px 2px 0 0;
        }

        .sidebar-section { padding: 20px 16px; }
        .section-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text2);
          margin-bottom: 12px;
        }

        /* FRAME GRID */
        .frame-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .frame-card {
          background: var(--surface2);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          padding: 12px 10px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .frame-card:hover { border-color: var(--border2); background: var(--surface3); }
        .frame-card.selected { border-color: var(--accent); background: rgba(201,168,76,0.07); }
        .frame-thumb {
          width: 48px; height: 60px;
          border-radius: 4px;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        .frame-thumb-inner {
          position: absolute;
          inset: 0;
          background: #888;
        }
        .frame-name {
          font-size: 11px;
          font-weight: 400;
          color: var(--text2);
          text-align: center;
          line-height: 1.3;
        }
        .frame-card.selected .frame-name { color: var(--accent); }

        /* ROTATE CONTROLS */
        .rotate-controls {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .rotate-display {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          text-align: center;
        }
        .rotate-value {
          font-family: 'DM Serif Display', serif;
          font-size: 32px;
          color: var(--accent);
          line-height: 1;
        }
        .rotate-unit {
          font-size: 11px;
          color: var(--text2);
          margin-top: 4px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .rotate-btns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .rotate-btn {
          background: var(--surface2);
          border: 1px solid var(--border2);
          border-radius: 10px;
          color: var(--text);
          padding: 12px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.15s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .rotate-btn:hover { background: var(--surface3); border-color: var(--accent); color: var(--accent); }
        .rotate-btn-icon { font-size: 20px; }
        .rotate-reset {
          background: none;
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text2);
          padding: 10px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          transition: all 0.15s;
          text-align: center;
        }
        .rotate-reset:hover { border-color: var(--border2); color: var(--text); }

        /* SLIDER */
        .slider-wrap { padding: 8px 0; }
        .slider-row { display: flex; align-items: center; gap: 12px; }
        .slider-row label { font-size: 11px; color: var(--text2); min-width: 64px; text-transform: uppercase; letter-spacing: 0.07em; }
        .slider-row input[type=range] {
          flex: 1;
          accent-color: var(--accent);
          height: 4px;
          cursor: pointer;
        }
        .slider-val { font-size: 11px; color: var(--accent); min-width: 28px; text-align: right; }

        /* UPLOAD */
        .upload-btn {
          width: 100%;
          background: var(--surface2);
          border: 1.5px dashed var(--border2);
          border-radius: var(--radius);
          color: var(--text2);
          padding: 20px;
          cursor: pointer;
          text-align: center;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
        }
        .upload-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(201,168,76,0.05); }
        .upload-icon { font-size: 24px; margin-bottom: 6px; }

        /* SAMPLE PHOTOS */
        .photo-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-top: 12px;
        }
        .photo-thumb {
          aspect-ratio: 3/4;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.15s;
        }
        .photo-thumb.active { border-color: var(--accent); }
        .photo-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* CANVAS AREA */
        .canvas-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          overflow: hidden;
          background: var(--bg);
          position: relative;
          min-width: 0;
        }

        /* Subtle grid bg */
        .canvas-area::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }

        .canvas-inner {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
          z-index: 1;
          max-width: 800px;
          width: 100%;
        }

        /* FRAME WRAPPER */
        .frame-outer {
          position: relative;
          transition: transform 0.5s cubic-bezier(0.34,1.56,0.64,1);
          cursor: grab;
        }
        .frame-border {
          position: relative;
          border-radius: 4px;
          overflow: hidden;
        }
        .frame-image-wrap {
          position: absolute;
          overflow: hidden;
          background: #333;
        }
        .frame-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          user-select: none;
          pointer-events: none;
        }
        .frame-grain {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
          border-radius: 4px;
          mix-blend-mode: overlay;
        }

        /* CAPTION */
        .canvas-caption {
          font-size: 12px;
          color: var(--text2);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-align: center;
        }
        .canvas-caption strong {
          color: var(--accent);
          font-weight: 500;
          font-family: 'DM Serif Display', serif;
          font-size: 14px;
          display: block;
          margin-bottom: 4px;
          text-transform: none;
          letter-spacing: 0.04em;
        }

        /* BOTTOM BAR */
        .bottom-bar {
          flex-shrink: 0;
          background: var(--surface);
          border-top: 1px solid var(--border);
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 10;
        }
        .btn-primary {
          background: var(--accent);
          color: #1A1100;
          border: none;
          border-radius: 10px;
          padding: 10px 22px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-primary:hover { background: var(--accent2); }
        .btn-ghost {
          background: var(--surface2);
          color: var(--text2);
          border: 1px solid var(--border2);
          border-radius: 10px;
          padding: 10px 18px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
          margin-left: auto;
        }
        .btn-ghost:hover { color: var(--text); background: var(--surface3); }

        /* MOBILE OVERLAY */
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 90;
        }

        @media (max-width: 768px) {
          :root { --sidebar: 100vw; }

          .sidebar {
            position: fixed;
            top: 56px;
            left: 0;
            bottom: 0;
            z-index: 95;
            width: 320px !important;
            transform: translateX(-320px);
            transition: transform 0.3s ease;
          }
          .sidebar:not(.sidebar-closed) {
            transform: translateX(0);
          }
          .sidebar.sidebar-closed {
            transform: translateX(-320px);
            width: 320px !important;
          }
          .menu-toggle { display: flex; }
          .sidebar-overlay { display: block; }
          .sidebar-overlay.hidden { display: none; }
          .canvas-area { padding: 32px 24px 24px; }
          .bottom-bar { padding: 10px 14px; }
          .btn-primary { padding: 10px 16px; font-size: 12px; }
          .btn-ghost { padding: 10px 14px; font-size: 12px; }
        }
      `}</style>

      {/* HEADER */}
      <header className="header">
        <div className="header-brand">
          ❧ <span>Frame</span>Studio
        </div>
        <div className="header-actions">
          <button
            className="btn-icon menu-toggle"
            onClick={() => setSidebarOpen((s) => !s)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <button className="btn-icon" title="Undo">↩</button>
          <button className="btn-icon" title="Download">⬇</button>
        </div>
      </header>

      <div className="layout">
        {/* SIDEBAR OVERLAY (mobile) */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? "" : "hidden"}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? "" : "sidebar-closed"}`}>
          <div className="sidebar-tabs">
            <button
              className={`tab-btn ${activeTab === "frame" ? "active" : ""}`}
              onClick={() => setActiveTab("frame")}
            >Frame</button>
            <button
              className={`tab-btn ${activeTab === "rotate" ? "active" : ""}`}
              onClick={() => setActiveTab("rotate")}
            >Rotate</button>
            <button
              className={`tab-btn ${activeTab === "photo" ? "active" : ""}`}
              onClick={() => setActiveTab("photo")}
            >Photo</button>
          </div>

          {/* FRAME TAB */}
          {activeTab === "frame" && (
            <div className="sidebar-section">
              <p className="section-label">Choose Frame</p>
              <div className="frame-grid">
                {FRAMES.map((f) => (
                  <div
                    key={f.id}
                    className={`frame-card ${selectedFrame.id === f.id ? "selected" : ""}`}
                    onClick={() => setSelectedFrame(f)}
                  >
                    <div
                      className="frame-thumb"
                      style={{
                        background: f.color,
                        boxShadow: `inset 0 0 2px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.2)`,
                        padding: `${Math.max(3, parseInt(f.border) / 5)}px`,
                        display: "flex",
                      }}
                    >
                      <div
                        className="frame-thumb-inner"
                        style={{
                          flex: 1,
                          backgroundImage: `url(${uploadedImage})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          borderRadius: "1px",
                          boxShadow: "inset 0 0 4px rgba(0,0,0,0.3)",
                          position: "relative",
                        }}
                      />
                      {f.grain && (
                        <div 
                          className="frame-grain" 
                          style={{ 
                            opacity: 0.15, 
                            borderRadius: "4px",
                            pointerEvents: "none"
                          }} 
                        />
                      )}
                    </div>
                    <span className="frame-name">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ROTATE TAB */}
          {activeTab === "rotate" && (
            <div className="sidebar-section">
              <p className="section-label">Rotation</p>
              <div className="rotate-controls">
                <div className="rotate-display">
                  <div className="rotate-value">{rotation}°</div>
                  <div className="rotate-unit">Current angle</div>
                </div>
                <div className="rotate-btns">
                  <button className="rotate-btn" onClick={() => handleRotate(-90)}>
                    <span className="rotate-btn-icon">↺</span>
                    <span>–90°</span>
                  </button>
                  <button className="rotate-btn" onClick={() => handleRotate(90)}>
                    <span className="rotate-btn-icon">↻</span>
                    <span>+90°</span>
                  </button>
                  <button className="rotate-btn" onClick={() => handleRotate(-45)}>
                    <span className="rotate-btn-icon">↺</span>
                    <span>–45°</span>
                  </button>
                  <button className="rotate-btn" onClick={() => handleRotate(45)}>
                    <span className="rotate-btn-icon">↻</span>
                    <span>+45°</span>
                  </button>
                </div>
                <div className="slider-wrap">
                  <div className="slider-row">
                    <label>Fine</label>
                    <input
                      type="range"
                      min="0"
                      max="359"
                      step="1"
                      value={rotation}
                      onChange={(e) => setRotation(Number(e.target.value))}
                    />
                    <span className="slider-val">{rotation}°</span>
                  </div>
                </div>
                <button className="rotate-reset" onClick={() => setRotation(0)}>
                  Reset to 0°
                </button>
              </div>
            </div>
          )}

          {/* PHOTO TAB */}
          {activeTab === "photo" && (
            <div className="sidebar-section">
              <p className="section-label">Upload Photo</p>
              <button className="upload-btn" onClick={() => fileRef.current?.click()}>
                <div className="upload-icon">📷</div>
                Click to upload your photo
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleUpload}
              />
              <p className="section-label" style={{ marginTop: 20 }}>Sample Photos</p>
              <div className="photo-grid">
                {SAMPLE_PHOTOS.map((src, i) => (
                  <div
                    key={i}
                    className={`photo-thumb ${uploadedImage === src ? "active" : ""}`}
                    onClick={() => setUploadedImage(src)}
                  >
                    <img src={src} alt={`Sample ${i + 1}`} loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* CANVAS */}
        <main className="canvas-area">
          <div className="canvas-inner">
            {/* FRAME */}
            <div
              className="frame-outer"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <div
                className="frame-border"
                style={{
                  width: "100%",
                  maxWidth: 420,
                  aspectRatio: "3/4",
                  background: selectedFrame.color,
                  boxShadow: `${selectedFrame.outerShadow}, ${selectedFrame.innerShadow}`,
                  padding: selectedFrame.border,
                  position: "relative",
                }}
              >
                {/* Inner bevel highlight */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 4,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.3)",
                    pointerEvents: "none",
                    zIndex: 3,
                  }}
                />
                {/* Image */}
                <div
                  className="frame-image-wrap"
                  style={{
                    top: selectedFrame.border,
                    left: selectedFrame.border,
                    right: selectedFrame.border,
                    bottom: selectedFrame.border,
                    borderRadius: 2,
                    boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
                  }}
                >
                  <img src={uploadedImage} alt="Framed photo" draggable={false} />
                </div>
                {/* Grain overlay */}
                {selectedFrame.grain && <div className="frame-grain" />}
              </div>
            </div>

            {/* CAPTION */}
            <div className="canvas-caption">
              <strong>{selectedFrame.name}</strong>
              {rotation !== 0 ? `Rotated ${rotation}°` : "Portrait orientation"}
            </div>
          </div>
        </main>
      </div>

      {/* BOTTOM BAR */}
      <div className="bottom-bar">
        <button className="btn-primary">Save Design</button>
        <button className="btn-primary" style={{ background: "#2A2420", color: "#C9A84C", border: "1px solid #C9A84C" }}>
          Add to Cart
        </button>
        <button className="btn-ghost" onClick={() => { setSelectedFrame(FRAMES[0]); setRotation(0); setUploadedImage(SAMPLE_PHOTOS[0]); }}>
          Reset All
        </button>
      </div>
    </div>
  );
}
