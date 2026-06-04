"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import html2canvas from "html2canvas";
import { db } from "../../lib/firebase";
import { ref, onValue } from "firebase/database";

// Local Storage Helper Methods
const getCart = () => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("fs_cart") || "[]");
  } catch (e) {
    return [];
  }
};

const saveCart = (cart) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("fs_cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("fs-cart-updated"));
};

function FrameCustomizer() {
  const [frames, setFrames] = useState([]);
  const [selectedFrame, setSelectedFrame] = useState(null);

  const [rotation, setRotation] = useState(0);
  const [orientation, setOrientation] = useState("portrait");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageOffset, setImageOffset] = useState({ x: 50, y: 50 }); // percentage 0-100
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("frame");
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const fileRef = useRef();
  const frameRef = useRef();
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragStartOffset = useRef({ x: 50, y: 50 });
  const imageWrapRef = useRef(null);

  const searchParams = useSearchParams();
  const frameQuery = searchParams ? searchParams.get("frame") : null;

  useEffect(() => {
    const framesRef = ref(db, "frames");
    const unsub = onValue(framesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const framesList = Object.entries(data).map(([key, val]) => ({
          id: key,
          ...val
        }));
        setFrames(framesList);
      } else {
        setFrames([]);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (frames.length > 0 && !selectedFrame) {
      if (frameQuery) {
        const matched = frames.find(f => f.id === frameQuery);
        const frame = matched || frames[0];
        setSelectedFrame(frame);
        // Read orientation from query params or default to frame's native orientation
        const orientationQuery = searchParams ? searchParams.get("orientation") : null;
        setOrientation(orientationQuery || frame.orientation || "portrait");
      } else {
        setSelectedFrame(frames[0]);
        setOrientation(frames[0].orientation || "portrait");
      }
    }
  }, [frames, frameQuery, selectedFrame, searchParams]);

  const loadCart = useCallback(() => {
    const rawCart = getCart();
    // Normalize any old cart items that still have $ from previous session
    const normalizedCart = rawCart.map(item => {
      if (item.price && item.price.includes("$")) {
        const numeric = parseInt(item.price.replace(/[^0-9]/g, "")) || 0;
        return { ...item, price: `Rs. ${(numeric * 100).toLocaleString()}` };
      }
      return item;
    });
    setCartItems(normalizedCart);
  }, []);

  useEffect(() => {
    loadCart();
    window.addEventListener("fs-cart-updated", loadCart);
    return () => {
      window.removeEventListener("fs-cart-updated", loadCart);
    };
  }, [loadCart]);

  // Compute aspect ratio based on selected orientation (not frame's native orientation)
  const aspectRatio = orientation === "landscape" ? 3 / 2 : 2 / 3;

  // Compute paddings: swap top/bottom with left/right when orientation differs from native
  const getFramePaddings = () => {
    if (!selectedFrame) return { top: 0, left: 0, bottom: 0, right: 0 };
    const p = selectedFrame;
    const nativeOrientation = p.orientation || "portrait";
    if (orientation === nativeOrientation) {
      return {
        top: p.paddingTop || 0,
        left: p.paddingLeft || 0,
        bottom: p.paddingBottom || 0,
        right: p.paddingRight || 0
      };
    } else {
      // Swap paddings when rotating orientation
      return {
        top: p.paddingLeft || 0,
        left: p.paddingTop || 0,
        bottom: p.paddingRight || 0,
        right: p.paddingBottom || 0
      };
    }
  };
  const framePaddings = getFramePaddings();

  // Reset image offset when orientation changes
  useEffect(() => {
    setImageOffset({ x: 50, y: 50 });
  }, [orientation]);

  // Drag-to-reposition handlers
  const handleDragStart = useCallback((clientX, clientY) => {
    isDragging.current = true;
    dragStart.current = { x: clientX, y: clientY };
    dragStartOffset.current = { ...imageOffset };
  }, [imageOffset]);

  const handleDragMove = useCallback((clientX, clientY) => {
    if (!isDragging.current || !imageWrapRef.current) return;
    const rect = imageWrapRef.current.getBoundingClientRect();
    const deltaX = clientX - dragStart.current.x;
    const deltaY = clientY - dragStart.current.y;
    // Convert pixel delta to percentage (sensitivity scaled by container size)
    const sensitivity = 0.15;
    const newX = Math.max(0, Math.min(100, dragStartOffset.current.x - (deltaX / rect.width) * 100 * sensitivity));
    const newY = Math.max(0, Math.min(100, dragStartOffset.current.y - (deltaY / rect.height) * 100 * sensitivity));
    setImageOffset({ x: newX, y: newY });
  }, []);

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Mouse event wrappers
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  const onMouseMove = useCallback((e) => {
    handleDragMove(e.clientX, e.clientY);
  }, [handleDragMove]);

  const onMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Touch event wrappers
  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  }, [handleDragStart]);

  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  }, [handleDragMove]);

  const onTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Attach global mouse/touch listeners when dragging
  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [onMouseMove, onMouseUp, onTouchMove, onTouchEnd]);

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result);
      setImageOffset({ x: 50, y: 50 });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      processFile(file);
    }
  }, []);

  const handleDownload = async () => {
    if (!frameRef.current || !selectedFrame) return;
    try {
      const canvas = await html2canvas(frameRef.current, {
        backgroundColor: null,
        useCORS: true,
        scale: 3,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `frame-studio-${selectedFrame.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
    }
  };

  const handleUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      processFile(file);
    }
  }, []);

  const handleRotate = useCallback((deg) => {
    setRotation((r) => (r + deg + 360) % 360);
  }, []);

  const handleAddToCart = () => {
    if (!selectedFrame) return;
    const item = {
      id: selectedFrame.id,
      frameName: selectedFrame.name,
      frameColor: selectedFrame.color,
      price: selectedFrame.price || "Rs. 4,900",
      rotation: rotation,
      orientation: orientation,
      image: uploadedImage,
    };

    const cart = getCart();
    const existingIndex = cart.findIndex(
      (x) => x.id === item.id && x.rotation === item.rotation && x.orientation === item.orientation && x.image === item.image
    );
    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }
    saveCart(cart);
    setCartOpen(true);
  };

  const updateQuantity = (index, delta) => {
    const cart = getCart();
    cart[index].quantity = Math.max(1, cart[index].quantity + delta);
    saveCart(cart);
  };

  const removeCartItem = (index) => {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
  };

  const getCartSubtotal = () => {
    return cartItems.reduce((acc, item) => {
      const priceVal = parseInt((item.price || "0").replace(/[^0-9]/g, "")) || 0;
      return acc + (priceVal * item.quantity);
    }, 0);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="app-root">
      <style dangerouslySetInnerHTML={{
        __html: `
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .app-root {
          --radius: 0px !important;
          font-family: var(--font-serif);
          background: var(--bg);
          color: var(--text);
          height: 100vh;
          max-height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* HEADER / NAVBAR */
        .header {
          height: 72px;
          background: #000000;
          border-bottom: 1px solid #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          position: sticky;
          top: 0;
          z-index: 100;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.6);
        }
        .header-brand {
          display: flex;
          align-items: center;
          transition: transform 0.2s ease;
        }
        .header-brand:hover {
          transform: scale(1.03);
        }
        .header-logo-img {
          height: 38px;
          width: auto;
          display: block;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .btn-icon {
          width: 36px; height: 36px;
          background: linear-gradient(to bottom, #1E1A15, #14110E);
          border: 1px solid var(--border2);
          border-radius: 0;
          color: var(--text2);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          transition: all 0.15s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .btn-icon:hover { 
          border-color: var(--accent); 
          color: var(--accent);
          background: var(--surface3);
        }
        
        .btn-nav-cart {
          background: none;
          border: none;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          transition: transform 0.2s ease;
          font-size: 20px;
          color: var(--text);
        }
        .btn-nav-cart:hover {
          transform: scale(1.1);
          color: var(--accent);
        }
        .cart-badge {
          position: absolute;
          top: -2px;
          right: -4px;
          background: radial-gradient(circle, var(--accent2) 0%, var(--accent) 100%);
          border: 1px solid #7E631F;
          color: #1A1100;
          font-family: var(--font-typewriter);
          font-size: 10px;
          font-weight: 700;
          min-width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        }

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
          overflow: hidden;
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
          border-radius: 0;
        }

        .sidebar-section {
          padding: 20px 16px;
          flex: 1;
          overflow-y: auto;
          /* Custom sleek scrollbar */
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .sidebar-section::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-section::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-section::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.08);
          border-radius: 0;
        }
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
          border-radius: 0;
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
          border-radius: 0;
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

        /* ORIENTATION CONTROLS */
        .orientation-controls {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .orientation-current {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 0;
          padding: 16px;
          text-align: center;
        }

        .orientation-current-label {
          font-family: 'DM Serif Display', serif;
          font-size: 22px;
          color: var(--accent);
          line-height: 1;
          text-transform: capitalize;
        }

        .orientation-current-sub {
          font-size: 11px;
          color: var(--text2);
          margin-top: 6px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .orientation-btns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .orientation-btn {
          background: var(--surface2);
          border: 1px solid var(--border2);
          border-radius: 0;
          color: var(--text);
          padding: 14px 12px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .orientation-btn:hover {
          background: var(--surface3);
          border-color: var(--accent);
          color: var(--accent);
        }
        .orientation-btn.active {
          background: rgba(201, 168, 76, 0.12);
          border-color: var(--accent);
          color: var(--accent);
          box-shadow: inset 0 0 8px rgba(201, 168, 76, 0.1);
        }

        .orientation-btn-icon {
          width: 32px;
          height: 40px;
          border: 2px solid currentColor;
          border-radius: 2px;
          transition: all 0.2s ease;
        }
        .orientation-btn.landscape-btn .orientation-btn-icon {
          width: 40px;
          height: 28px;
        }

        .orientation-btn-label {
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .orientation-note {
          font-size: 10px;
          color: var(--text2);
          text-align: center;
          line-height: 1.5;
          padding: 0 4px;
          opacity: 0.7;
        }

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
          border-radius: 0;
          overflow: hidden;
        }
        .frame-image-wrap {
          position: absolute;
          overflow: hidden;
          background: #0a0806;
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
        .frame-image-wrap.draggable {
          cursor: grab;
        }
        .frame-image-wrap.draggable:active {
          cursor: grabbing;
        }
        .drag-hint {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          color: var(--text);
          font-size: 10px;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 12px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease;
          z-index: 8;
          white-space: nowrap;
        }
        .frame-image-wrap.draggable:hover .drag-hint {
          opacity: 1;
        }
        .frame-image-wrap.draggable:active .drag-hint {
          opacity: 0;
        }
        .reset-position-btn {
          background: none;
          border: 1px solid var(--border2);
          border-radius: 0;
          color: var(--text2);
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 0.05em;
          padding: 6px 14px;
          cursor: pointer;
          transition: all 0.15s;
          margin-top: 4px;
        }
        .reset-position-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .frame-grain {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
          border-radius: 0;
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
          border-radius: 0 !important;
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
          border-radius: 0 !important;
          padding: 10px 18px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
          margin-left: auto;
        }
        .btn-ghost:hover { color: var(--text); background: var(--surface3); }

        /* IN-FRAME PLACEHOLDER & OVERLAYS */
        .placeholder-content {
          position: absolute;
          inset: 12px;
          border: 1.5px dashed var(--accent);
          border-radius: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(201, 168, 76, 0.02);
          transition: all 0.2s ease;
          padding: 16px;
          text-align: center;
        }
        
        .frame-image-wrap:hover .placeholder-content {
          background: rgba(201, 168, 76, 0.06);
          border-color: var(--accent2);
        }
        
        .placeholder-plus {
          font-size: 32px;
          line-height: 1;
          color: var(--accent);
          transition: transform 0.2s ease;
        }
        
        .frame-image-wrap:hover .placeholder-plus {
          transform: scale(1.15) rotate(90deg);
          color: var(--accent2);
        }
        
        .placeholder-text {
          font-family: 'DM Serif Display', serif;
          font-size: 15px;
          letter-spacing: 0.02em;
          color: var(--text);
        }
        
        .placeholder-subtext {
          font-size: 10px;
          color: var(--text2);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /* CHANGE PHOTO CORNER BUTTON */
        .change-photo-corner {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(201, 168, 76, 0.4);
          color: var(--accent);
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          letter-spacing: 0.04em;
          cursor: pointer;
          z-index: 12;
          opacity: 0;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
          pointer-events: auto;
        }
        .frame-image-wrap:hover .change-photo-corner {
          opacity: 1;
        }
        .change-photo-corner:hover {
          background: rgba(201, 168, 76, 0.2);
          border-color: var(--accent);
          transform: scale(1.05);
        }

        /* MOBILE OVERLAY */
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 90;
        }

        /* CART DRAWER SLIDE-OVER */
        .cart-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 2000;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .cart-drawer-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }
        .cart-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 380px;
          max-width: 100vw;
          background: var(--bg);
          border-left: 1px solid var(--border);
          z-index: 2001;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          box-shadow: -10px 0 40px rgba(0,0,0,0.5);
        }
        .cart-drawer.open {
          transform: translateX(0);
        }
        .cart-drawer-header {
          padding: 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cart-drawer-header h3 {
          font-family: 'DM Serif Display', serif;
          font-size: 20px;
          color: var(--text);
        }
        .cart-close-btn {
          background: none;
          border: none;
          color: var(--text2);
          font-size: 28px;
          cursor: pointer;
          line-height: 1;
          transition: color 0.15s ease;
        }
        .cart-close-btn:hover {
          color: var(--text);
        }
        .cart-drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .cart-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          gap: 12px;
          color: var(--text2);
        }
        .cart-empty-icon {
          font-size: 48px;
        }
        
        .cart-items-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .cart-item {
          display: flex;
          gap: 16px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 0 !important;
          padding: 12px;
          position: relative;
        }
        .cart-item-thumb {
          width: 70px;
          height: 70px;
          border-radius: 0;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex;
          position: relative;
          padding: 6px;
        }
        .cart-item-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 0;
        }
        .cart-item-thumb-placeholder {
          flex: 1;
          background: #2D2822;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(201, 168, 76, 0.2);
          font-size: 24px;
        }
        
        .cart-item-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .cart-item-name {
          font-family: 'DM Serif Display', serif;
          font-size: 15px;
          color: var(--text);
        }
        .cart-item-meta {
          font-size: 10px;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .cart-item-price {
          font-size: 14px;
          font-weight: 700;
          color: var(--accent);
        }
        .cart-item-qty-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
        }
        .qty-btn {
          width: 24px;
          height: 24px;
          background: var(--surface3);
          border: 1px solid var(--border2);
          border-radius: 0 !important;
          color: var(--text);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          line-height: 1;
          transition: all 0.15s ease;
        }
        .qty-btn:hover {
          background: var(--accent);
          color: #1A1100;
          border-color: var(--accent);
        }
        .qty-val {
          font-size: 12px;
          font-weight: 500;
          color: var(--text);
        }
        
        .cart-item-remove {
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          color: var(--text2);
          font-size: 18px;
          cursor: pointer;
          line-height: 1;
          transition: color 0.15s ease;
        }
        .cart-item-remove:hover {
          color: #FF5A5A;
        }
        
        .cart-drawer-footer {
          padding: 24px;
          border-top: 1px solid var(--border);
          background: var(--surface);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .cart-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: var(--text2);
        }
        .cart-summary-total {
          font-family: 'DM Serif Display', serif;
          font-size: 24px;
          color: var(--accent);
        }
        .cart-footer-note {
          font-size: 11px;
          color: var(--text2);
          text-align: center;
        }
        .btn-checkout-primary {
          background: var(--accent);
          color: #1A1100;
          text-decoration: none;
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          padding: 14px;
          border-radius: 0 !important;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(201, 168, 76, 0.25);
          display: block;
        }
        .btn-checkout-primary:hover {
          background: var(--accent2);
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(201, 168, 76, 0.35);
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
      ` }} />

      {/* HEADER / NAVBAR */}
      <header className="header">
        <a href="/" className="header-brand">
          <img src="/images/logo-white.png" alt="Yaadein Logo" className="header-logo-img" />
        </a>
        <div className="header-actions">
          <button
            className="btn-icon menu-toggle"
            onClick={() => setSidebarOpen((s) => !s)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>

          <button className="btn-nav-cart" onClick={() => setCartOpen(true)} title="View Cart">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="cart-icon-svg" style={{ width: "22px", height: "22px", color: "#FFF", fill: "currentColor", display: "block" }}>
              <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a.75.75 0 1 0 0-1.5.75 0 0 0 0 1.5Zm6 0a.75.75 0 1 0 0-1.5.75 0 0 0 0 1.5Z" clipRule="evenodd" />
            </svg>
            <span className="cart-badge">{cartCount}</span>
          </button>

          <button className="btn-icon" title="Download Image" onClick={handleDownload}>⬇</button>
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
              className={`tab-btn ${activeTab === "orientation" ? "active" : ""}`}
              onClick={() => setActiveTab("orientation")}
            >Orientation</button>
          </div>

          {/* FRAME TAB */}
          {activeTab === "frame" && (
            <div className="sidebar-section">
              <p className="section-label">Choose Frame</p>

              {frames.length === 0 ? (
                <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text2)", fontSize: "12px" }}>Loading frames...</div>
              ) : (
                <div className="frame-grid">
                  {frames.map((f) => (
                    <div
                      key={f.id}
                      className={`frame-card ${selectedFrame?.id === f.id ? "selected" : ""}`}
                      onClick={() => setSelectedFrame(f)}
                    >
                      <div
                        className="frame-thumb"
                        style={{
                          position: "relative",
                          display: "flex",
                          width: f.orientation === "landscape" ? 60 : 48,
                          height: f.orientation === "landscape" ? 48 : 60,
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                        }}
                      >
                        {/* Frame image background */}
                        {f.imageUrl && (
                          <img
                            src={f.imageUrl}
                            alt={f.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "fill",
                              position: "absolute",
                              inset: 0,
                              zIndex: f.imageUrl.endsWith('.png') ? 2 : 4,
                              pointerEvents: "none"
                            }}
                          />
                        )}
                        {/* Inner thumbnail photo preview */}
                        <div
                          className="frame-thumb-inner"
                          style={{
                            position: "absolute",
                            top: `${f.paddingTop || 0}%`,
                            left: `${f.paddingLeft || 0}%`,
                            bottom: `${f.paddingBottom || 0}%`,
                            right: `${f.paddingRight || 0}%`,
                            zIndex: f.imageUrl && f.imageUrl.endsWith('.png') ? 4 : 2,
                            backgroundColor: "#3E352F",
                            backgroundImage: uploadedImage ? `url(${uploadedImage})` : "none",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            boxShadow: "inset 0 0 2px rgba(0,0,0,0.3)"
                          }}
                        />
                      </div>
                      <span className="frame-name">{f.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ORIENTATION TAB */}
          {activeTab === "orientation" && (
            <div className="sidebar-section">
              <p className="section-label">Orientation</p>
              <div className="orientation-controls">
                <div className="orientation-current">
                  <div className="orientation-current-label">{orientation}</div>
                  <div className="orientation-current-sub">Current Orientation</div>
                </div>
                <div className="orientation-btns">
                  <button
                    className={`orientation-btn portrait-btn ${orientation === "portrait" ? "active" : ""}`}
                    onClick={() => setOrientation("portrait")}
                  >
                    <div className="orientation-btn-icon" />
                    <span className="orientation-btn-label">Portrait</span>
                  </button>
                  <button
                    className={`orientation-btn landscape-btn ${orientation === "landscape" ? "active" : ""}`}
                    onClick={() => setOrientation("landscape")}
                  >
                    <div className="orientation-btn-icon" />
                    <span className="orientation-btn-label">Landscape</span>
                  </button>
                </div>
                <p className="orientation-note">
                  All frames support both orientations. The frame texture will adapt automatically.
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
        </aside>

        {/* CANVAS */}
        <main
          className="canvas-area"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="canvas-inner">
            {/* FRAME */}
            {selectedFrame && (
              <div
                className="frame-outer"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  width: orientation === "landscape" ? "min(480px, 85vw, 65vh)" : "min(380px, 85vw, 48vh)",
                  margin: "0 auto"
                }}
              >
                <div
                  ref={frameRef}
                  className="frame-border"
                  style={{
                    width: "100%",
                    aspectRatio: aspectRatio,
                    position: "relative",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
                    overflow: "hidden",
                    backgroundColor: "transparent"
                  }}
                >
                  {/* Actual Frame Image Overlay */}
                  {selectedFrame.imageUrl && (
                    <img
                      src={selectedFrame.imageUrl}
                      alt={selectedFrame.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "fill",
                        position: "absolute",
                        inset: 0,
                        zIndex: selectedFrame.imageUrl.endsWith('.png') ? 2 : 4,
                        pointerEvents: "none"
                      }}
                    />
                  )}

                  {/* Image or Placeholder */}
                  {uploadedImage ? (
                    <div
                      ref={imageWrapRef}
                      className="frame-image-wrap draggable"
                      style={{
                        position: "absolute",
                        top: `${framePaddings.top}%`,
                        left: `${framePaddings.left}%`,
                        bottom: `${framePaddings.bottom}%`,
                        right: `${framePaddings.right}%`,
                        zIndex: selectedFrame.imageUrl && selectedFrame.imageUrl.endsWith('.png') ? 4 : 2,
                      }}
                      onMouseDown={onMouseDown}
                      onTouchStart={onTouchStart}
                    >
                      <img
                        src={uploadedImage}
                        alt="Framed photo"
                        draggable={false}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: `${imageOffset.x}% ${imageOffset.y}%`
                        }}
                      />
                      <div className="drag-hint">✥ Drag to reposition</div>
                      <button
                        className="change-photo-corner"
                        onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        📷 Change
                      </button>
                    </div>
                  ) : (
                    <div
                      className="frame-image-wrap"
                      style={{
                        position: "absolute",
                        top: `${framePaddings.top}%`,
                        left: `${framePaddings.left}%`,
                        bottom: `${framePaddings.bottom}%`,
                        right: `${framePaddings.right}%`,
                        zIndex: selectedFrame.imageUrl && selectedFrame.imageUrl.endsWith('.png') ? 4 : 2,
                        background: "#181512",
                        cursor: "pointer",
                      }}
                      onClick={() => fileRef.current?.click()}
                    >
                      <div className="placeholder-content">
                        <div className="placeholder-plus">＋</div>
                        <div className="placeholder-text">Add Your Photo</div>
                        <div className="placeholder-subtext">Click or drag image here</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CAPTION */}
            {selectedFrame && (
              <div className="canvas-caption">
                <strong>{selectedFrame.name}</strong>
                {orientation === "landscape" ? "Landscape orientation" : "Portrait orientation"}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* BOTTOM BAR */}
      <div className="bottom-bar">
        <button className="btn-primary" onClick={handleDownload} disabled={!selectedFrame}>Save Design</button>
        <button className="btn-primary" onClick={handleAddToCart} disabled={!selectedFrame} style={{ background: "#2A2420", color: "#C9A84C", border: "1px solid #C9A84C" }}>
          Add to Cart
        </button>
        <button className="btn-ghost" onClick={() => { if (frames.length > 0) { setSelectedFrame(frames[0]); setOrientation(frames[0].orientation || "portrait"); } setRotation(0); setUploadedImage(null); setImageOffset({ x: 50, y: 50 }); setActiveTab("frame"); }}>
          Reset All
        </button>
      </div>

      {/* CART DRAWER SLIDE-OVER */}
      <div className={`cart-drawer-overlay ${cartOpen ? "open" : ""}`} onClick={() => setCartOpen(false)} />
      <div className={`cart-drawer ${cartOpen ? "open" : ""}`}>
        <div className="cart-drawer-header">
          <h3>Shopping Cart</h3>
          <button className="cart-close-btn" onClick={() => setCartOpen(false)}>×</button>
        </div>
        <div className="cart-drawer-body">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <span className="cart-empty-icon">👜</span>
              <p>Your shopping cart is empty.</p>
              <button className="btn-nav-primary" style={{ marginTop: "16px" }} onClick={() => setCartOpen(false)}>
                Back to Customizer
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map((item, idx) => (
                <div key={idx} className="cart-item">
                  <div className="cart-item-thumb" style={{ background: item.frameColor }}>
                    {item.image ? (
                      <img src={item.image} alt={item.frameName} />
                    ) : (
                      <div className="cart-item-thumb-placeholder">Y</div>
                    )}
                  </div>
                  <div className="cart-item-details">
                    <div className="cart-item-name">{item.frameName}</div>
                    <div className="cart-item-meta">
                      {item.orientation ? (item.orientation === "landscape" ? "Landscape" : "Portrait") : (item.rotation !== 0 ? `Rotated ${item.rotation}°` : "Portrait")}
                    </div>
                    <div className="cart-item-price">{item.price}</div>
                    <div className="cart-item-qty-row">
                      <button className="qty-btn" onClick={() => updateQuantity(idx, -1)}>–</button>
                      <span className="qty-val">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity(idx, 1)}>+</button>
                    </div>
                  </div>
                  <button className="cart-item-remove" onClick={() => removeCartItem(idx)} title="Remove Item">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span className="cart-summary-total">Rs. {getCartSubtotal().toLocaleString()}</span>
            </div>
            <p className="cart-footer-note">Shipping and taxes calculated at checkout.</p>
            <a href="/checkout" className="btn-checkout-primary">
              Proceed to Checkout
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomizePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        background: "#0F0D0B",
        color: "#A09880",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif"
      }}>
        Loading Frame Customizer...
      </div>
    }>
      <FrameCustomizer />
    </Suspense>
  );
}
