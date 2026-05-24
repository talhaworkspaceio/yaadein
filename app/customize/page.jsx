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
  const [uploadedImage, setUploadedImage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("frame");
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const fileRef = useRef();
  const frameRef = useRef();

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
        setSelectedFrame(matched || frames[0]);
      } else {
        setSelectedFrame(frames[0]);
      }
    }
  }, [frames, frameQuery, selectedFrame]);

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

  const aspectRatio = selectedFrame ? (selectedFrame.aspectRatio || (selectedFrame.orientation === "landscape" ? 3 / 2 : 2 / 3)) : 2 / 3;

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result);
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
      image: uploadedImage,
    };

    const cart = getCart();
    const existingIndex = cart.findIndex(
      (x) => x.id === item.id && x.rotation === item.rotation && x.image === item.image
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
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
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
          height: 100vh;
          max-height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* HEADER / NAVBAR */
        .header {
          height: 68px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          position: sticky;
          top: 0;
          z-index: 100;
          flex-shrink: 0;
        }
        .header-brand {
          font-family: 'DM Serif Display', serif;
          font-size: 22px;
          letter-spacing: 0.02em;
          color: var(--accent);
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          transition: transform 0.2s ease;
        }
        .header-brand:hover {
          transform: scale(1.02);
        }
        .header-brand span { color: var(--text); font-size: 19px; }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
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
        
        .btn-nav-cart {
          background: none;
          border: none;
          color: var(--text);
          font-size: 20px;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          transition: transform 0.2s ease;
        }
        .btn-nav-cart:hover {
          transform: scale(1.1);
          color: var(--accent);
        }
        .cart-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: var(--accent);
          color: #1A1100;
          font-size: 9px;
          font-weight: 700;
          min-width: 15px;
          height: 15px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
          box-shadow: 0 2px 6px rgba(201,168,76,0.4);
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
          border-radius: 2px 2px 0 0;
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
          border-radius: 2px;
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

        /* IN-FRAME PLACEHOLDER & OVERLAYS */
        .placeholder-content {
          position: absolute;
          inset: 12px;
          border: 1.5px dashed var(--accent);
          border-radius: 6px;
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

        /* CHANGE PHOTO OVERLAY */
        .change-photo-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          z-index: 5;
        }
        
        .frame-image-wrap:hover .change-photo-overlay {
          opacity: 1;
        }
        
        .change-photo-btn {
          background: var(--surface2);
          border: 1px solid var(--accent);
          color: var(--accent);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
          transition: all 0.2s ease;
        }
        
        .change-photo-btn:hover {
          background: var(--accent);
          color: #1A1100;
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
          border-radius: 12px;
          padding: 12px;
          position: relative;
        }
        .cart-item-thumb {
          width: 70px;
          height: 70px;
          border-radius: 6px;
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
          border-radius: 2px;
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
          border-radius: 6px;
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
          border-radius: 12px;
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
      `}</style>

      {/* HEADER / NAVBAR */}
      <header className="header">
        <a href="/" className="header-brand">
          ❧ <span>Frame</span>Studio
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
            👜 <span className="cart-badge">{cartCount}</span>
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
              className={`tab-btn ${activeTab === "rotate" ? "active" : ""}`}
              onClick={() => setActiveTab("rotate")}
            >Rotate</button>
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
                  width: selectedFrame.orientation === "landscape" ? "min(480px, 85vw, 65vh)" : "min(380px, 85vw, 48vh)",
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
                      className="frame-image-wrap"
                      style={{
                        position: "absolute",
                        top: `${selectedFrame.paddingTop || 0}%`,
                        left: `${selectedFrame.paddingLeft || 0}%`,
                        bottom: `${selectedFrame.paddingBottom || 0}%`,
                        right: `${selectedFrame.paddingRight || 0}%`,
                        zIndex: selectedFrame.imageUrl && selectedFrame.imageUrl.endsWith('.png') ? 4 : 2,
                        cursor: "pointer",
                      }}
                      onClick={() => fileRef.current?.click()}
                    >
                      <img src={uploadedImage} alt="Framed photo" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div className="change-photo-overlay" style={{ zIndex: 10 }}>
                        <span className="change-photo-btn">📸 Change Photo</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="frame-image-wrap"
                      style={{
                        position: "absolute",
                        top: `${selectedFrame.paddingTop || 0}%`,
                        left: `${selectedFrame.paddingLeft || 0}%`,
                        bottom: `${selectedFrame.paddingBottom || 0}%`,
                        right: `${selectedFrame.paddingRight || 0}%`,
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
                {rotation !== 0 ? `Rotated ${rotation}°` : "Portrait orientation"}
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
        <button className="btn-ghost" onClick={() => { if(frames.length > 0) setSelectedFrame(frames[0]); setRotation(0); setUploadedImage(null); setActiveTab("frame"); }}>
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
                      <div className="cart-item-thumb-placeholder">❧</div>
                    )}
                  </div>
                  <div className="cart-item-details">
                    <div className="cart-item-name">{item.frameName}</div>
                    <div className="cart-item-meta">
                      {item.rotation !== 0 ? `Rotated ${item.rotation}°` : "Portrait"}
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
        ❧ Loading Frame Customizer...
      </div>
    }>
      <FrameCustomizer />
    </Suspense>
  );
}
