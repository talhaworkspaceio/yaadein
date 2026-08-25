"use client";

import { use, useState, useEffect, useCallback } from "react";
import { db } from "../../../lib/firebase";
import { ref, onValue } from "firebase/database";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import CardDescription from "../../components/CardDescription";

// Persistent Cart LocalStorage Helpers
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

export default function CategoryPage({ params }) {
  const resolvedParams = use(params);
  const category = resolvedParams?.category; // "portrait", "landscape", or "board-games"

  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [lightOn, setLightOn] = useState(true);

  // Fetch products from Firebase
  useEffect(() => {
    const framesRef = ref(db, "frames");
    const unsub = onValue(framesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const framesList = Object.entries(data).map(([key, val]) => ({
          id: key,
          ...val
        }));
        setProducts(framesList);
      } else {
        setProducts([]);
      }
    });
    return () => unsub();
  }, []);

  // Cart synchronization
  const loadCart = useCallback(() => {
    const rawCart = getCart();
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
    return () => window.removeEventListener("fs-cart-updated", loadCart);
  }, [loadCart]);

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

  const isNewArrival = (p) => {
    if (!p) return false;
    const createdAt = typeof p === "object" ? p.createdAt : null;
    if (createdAt) {
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      return (Date.now() - createdAt) < sevenDaysInMs;
    }
    const id = typeof p === "string" ? p : p.id;
    return id === "antique-gold" || id === "gallery-landscape" || id === "landscape-oak";
  };

  const isFeatured = (id) => {
    return id === "modern-black" || id === "classic-walnut" || id === "royal-gilt" || id === "colonial-pine";
  };

  const isBoardGame = (p) => {
    const cat = p?.category || "";
    return cat.toLowerCase().includes("board game");
  };

  // Filter products by category
  const filteredProducts = products.filter(p => {
    if (category === "portrait") return !isBoardGame(p) && p.orientation !== "landscape";
    if (category === "landscape") return !isBoardGame(p) && p.orientation === "landscape";
    if (category === "board-games") return isBoardGame(p);
    return false;
  });

  const categoryTitle =
    category === "portrait" ? "Portrait Collection" :
      category === "landscape" ? "Landscape Collection" :
        category === "board-games" ? "Board Games" : "Collection";

  const categoryDesc =
    category === "portrait" ? "Bespoke vertical wood profiles designed for portraits, headshots, and vertical moments." :
      category === "landscape" ? "Timeless horizontal borders crafted for panoramas, landscapes, and wide memories." :
        category === "board-games" ? "Luxury wooden board games crafted for family fun and timeless aesthetic value." :
          "Choose from our catalog of premium frames.";

  return (
    <div className="catalog-root">
      <style dangerouslySetInnerHTML={{
        __html: `
        /* PICTURE LIGHT LAMP STYLING */
        .exquisite-lamp {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 240px;
          margin-bottom: 25px;
          z-index: 20;
        }

        .catalog-lamp {
          margin-top: -30px;
        }

        .lamp-rod {
          width: 4px;
          height: 100vh;
          background: linear-gradient(to right, #403014, #9c7f47 50%, #2b1f0d);
          box-shadow: 1px 0 3px rgba(0,0,0,0.4);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
        }

        .lamp-mount {
          width: 32px;
          height: 18px;
          background: linear-gradient(135deg, #2b1f0d, #8f723b 40%, #dfc38a 60%, #5e461b);
          border: 1px solid #1a1205;
          box-shadow: 0 4px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.2);
          border-radius: 2px;
          position: relative;
          z-index: 12;
        }

        .lamp-arm {
          width: 6px;
          height: 78px;
          background: linear-gradient(to right, #403014, #9c7f47 50%, #2b1f0d);
          box-shadow: 2px 0 5px rgba(0,0,0,0.4);
          position: relative;
        }
        
        .lamp-arm::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: -4px;
          width: 14px;
          height: 6px;
          background: #5e461b;
          border-radius: 2px;
        }

        .lamp-head {
          width: 180px;
          height: 24px;
          background: linear-gradient(to bottom, 
            #362710 0%, 
            #8f723b 25%, 
            #dfc38a 45%, 
            #fae7b5 55%, 
            #8f723b 75%, 
            #362710 100%
          );
          border: 1px solid #1a1205;
          border-radius: 12px;
          box-shadow: 
            0 8px 16px rgba(0,0,0,0.6),
            inset 0 1px 2px rgba(255,255,255,0.3);
          position: relative;
        }

        .catalog-lamp .lamp-head {
          width: 440px;
        }

        .lamp-head::before, .lamp-head::after {
          content: '';
          position: absolute;
          top: -1px;
          width: 8px;
          height: 24px;
          background: linear-gradient(to bottom, #1a1205, #5e461b, #1a1205);
          border: 1px solid #1a1205;
          border-radius: 50%;
        }
        .lamp-head::before { left: -4px; }
        .lamp-head::after { right: -4px; }

        .lamp-bulb {
          position: absolute;
          bottom: 0px;
          left: 15%;
          right: 15%;
          height: 4px;
          background: #fff;
          border-radius: 2px;
          box-shadow: 0 0 12px 3px #fae7b5, 0 0 24px 8px #fae7b5;
          opacity: 0;
          transition: opacity 0.25s ease;
          z-index: 5;
        }
        .lamp-bulb.on {
          opacity: 1;
        }

        .lamp-light-beam {
          position: absolute;
          top: 72px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(ellipse at top, rgba(255, 238, 180, 0.42) 0%, rgba(255, 238, 180, 0.16) 30%, rgba(255, 238, 180, 0.04) 60%, transparent 80%);
          filter: blur(35px);
          pointer-events: none;
          z-index: 15;
          opacity: 0;
          transition: opacity 0.25s ease-in-out;
        }
        .lamp-light-beam.on {
          opacity: 1;
        }

        /* GLOW & PARTICLES */
        .exquisite-glow-container {
          top: 108px !important;
        }
        .lamp-glow-container {
          position: absolute;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          pointer-events: none;
        }

        .glow {
          display: none;
        }
        .exquisite-glow-container.on .glow {
          opacity: 1;
          animation: glow-warm 3s linear infinite alternate;
        }

        .particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100px;
          height: 100px;
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        .exquisite-glow-container.on .particles {
          opacity: 1;
        }

        .rotate {
          position: absolute;
          top: calc(50% - 5px);
          left: calc(50% - 5px);
          width: 10px;
          height: 10px;
          animation: rotate 120s linear 0s infinite alternate;
        }

        .angle {
          position: absolute;
          top: 0;
          left: 0;
        }

        .size {
          position: absolute;
          top: 0;
          left: 0;
        }

        .position {
          position: absolute;
          top: 0;
          left: 0;
        }

        .pulse {
          position: absolute;
          top: 0;
          left: 0;
          animation: pulse 6s linear 0s infinite alternate;
        }

        .particle {
          position: absolute;
          top: calc(50% - 2.5px);
          left: calc(50% - 2.5px);
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }
        .particle::before, .particle::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          width: 4px;
          height: 4px;
          box-shadow: inherit;
        }
        .particle::before {
          top: -30px;
          left: 25px;
          animation: float-firefly-1 25s ease-in-out infinite alternate;
        }
        .particle::after {
          width: 3px;
          height: 3px;
          top: 35px;
          left: -30px;
          animation: float-firefly-2 30s ease-in-out infinite alternate;
        }

        @keyframes glow-warm {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
            box-shadow: 0 0 100px 35px rgba(251, 191, 36, 0.85), 35px 20px 75px 15px #fff, -5px -35px 45px 8px #fff;
          }
          100% {
            transform: translate(-50%, -50%) rotate(5deg);
            box-shadow: 0 0 140px 35px rgba(251, 191, 36, 0.95), 50px 30px 60px 15px #fff, -45px -45px 60px 8px #fff;
          }
        }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes angle {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes size {
          0% { transform: scale(.2); }
          100% { transform: scale(.6); }
        }

        @keyframes position {
          0% {
            transform: translate3d(0,0,0);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate3d(180px, 140px, 0);
            opacity: 0;
          }
        }
        @keyframes float-firefly-1 {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-100px, -80px, 0); }
        }
        @keyframes float-firefly-2 {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(100px, -120px, 0); }
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          100% { transform: scale(.5); }
        }

        @keyframes particle-warm {
          0% {
            box-shadow: inset 0 0 10px 10px #D4AF37, 0 0 30px 5px #F59E0B, inset 0 0 40px 40px #FFF59D;
          }
          33.33% {
            box-shadow: inset 0 0 10px 10px #D4AF37, 0 0 60px 5px #F59E0B, inset 0 0 25px 25px #FFF59D;
          }
          33.34% {
            box-shadow: inset 0 0 10px 10px #FCD34D, 0 0 30px 5px #FCD34D, inset 0 0 40px 40px #FFF;
          }
          66.66% {
            box-shadow: inset 0 0 10px 10px #FCD34D, 0 0 60px 5px #FCD34D, inset 0 0 25px 25px #FFF;
          }
          66.67% {
            box-shadow: inset 0 0 10px 10px #D97706, 0 0 30px 5px #D97706, inset 0 0 40px 40px #FF8A00;
          }
          100% {
            box-shadow: inset 0 0 10px 10px #D97706, 0 0 60px 5px #D97706, inset 0 0 25px 25px #FF8A00;
          }
        }

        .rotate .angle:nth-child(1) {
          animation: angle 60s steps(5) 0s infinite;
        }
        .rotate .angle:nth-child(1) .size {
          animation: size 60s steps(5) 0s infinite;
        }
        .rotate .angle:nth-child(1) .particle {
          animation: particle-warm 8s linear infinite alternate;
        }
        .rotate .angle:nth-child(1) .position {
          animation: position 18s linear 0s infinite;
        }

        .rotate .angle:nth-child(2) {
          animation: angle 35s steps(3) -17s infinite;
        }
        .rotate .angle:nth-child(2) .size {
          animation: size 35s steps(3) -17s infinite alternate;
        }
        .rotate .angle:nth-child(2) .particle {
          animation: particle-warm 7s linear -4.6s infinite alternate;
        }
        .rotate .angle:nth-child(2) .position {
          animation: position 15s linear 0s infinite;
        }

        .rotate .angle:nth-child(3) {
          animation: angle 80s steps(8) -40s infinite;
        }
        .rotate .angle:nth-child(3) .size {
          animation: size 40s steps(4) -30s infinite alternate;
        }
        .rotate .angle:nth-child(3) .particle {
          animation: particle-warm 6.5s linear -2.2s infinite alternate;
        }
        .rotate .angle:nth-child(3) .position {
          animation: position 16s linear 0s infinite;
        }

        .rotate .angle:nth-child(4) {
          animation: angle 50s steps(6) -12s infinite;
        }
        .rotate .angle:nth-child(4) .size {
          animation: size 50s steps(6) -25s infinite alternate;
        }
        .rotate .angle:nth-child(4) .particle {
          animation: particle-warm 9s linear -3s infinite alternate;
        }
        .rotate .angle:nth-child(4) .position {
          animation: position 20s linear -5s infinite;
        }

        .rotate .angle:nth-child(5) {
          animation: angle 70s steps(7) -35s infinite;
        }
        .rotate .angle:nth-child(5) .size {
          animation: size 35s steps(5) -15s infinite alternate;
        }
        .rotate .angle:nth-child(5) .particle {
          animation: particle-warm 7.5s linear -5s infinite alternate;
        }
        .rotate .angle:nth-child(5) .position {
          animation: position 22s linear -8s infinite;
        }



        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #fae7b5;
          border-radius: 50%;
          box-shadow: 0 0 10px 2px #dfc38a, 0 0 20px 4px #fae7b5;
        }

        .angle:nth-child(1) .particle { top: 30px; left: 40px; }
        .angle:nth-child(2) .particle { top: 80px; left: 110px; width: 3px; height: 3px; }
        .angle:nth-child(3) .particle { top: 110px; left: 30px; width: 5px; height: 5px; }

        /* CATALOG LAYOUT & BACKGROUND */
        .catalog-root {
          background: #090706;
          color: var(--text);
          min-height: 100vh;
          font-family: var(--font-sans);
          position: relative;
          overflow-x: hidden;
        }

        .hero-banner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 140px 20px 60px;
          border-bottom: 2px solid #1C0F07;
          position: relative;
          z-index: 10;
          background: #0C0A08;
        }

        .hero-title {
          font-family: var(--font-display);
          font-size: 52px;
          color: var(--text);
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }

        .hero-title span {
          color: var(--accent);
        }

        .hero-desc {
          font-family: var(--font-serif);
          font-size: 16px;
          color: var(--text2);
          max-width: 600px;
          line-height: 1.7;
          margin-bottom: 30px;
        }

        /* Light Switch Control Panel */
        .light-control-panel {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(20, 17, 14, 0.6);
          border: 1.5px solid rgba(212, 175, 55, 0.25);
          padding: 8px 18px;
          border-radius: 999px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          transition: border-color 0.3s ease;
        }
        .light-control-panel:hover {
          border-color: rgba(212, 175, 55, 0.5);
        }
        .light-control-label {
          font-family: var(--font-typewriter);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #dfc38a;
          user-select: none;
        }
        .light-switch-btn {
          width: 46px;
          height: 24px;
          background: #1a1205;
          border: 1.5px solid #5e461b;
          border-radius: 999px;
          position: relative;
          cursor: pointer;
          padding: 0;
          outline: none;
          transition: all 0.3s ease;
        }
        .light-switch-btn.on {
          background: #5e461b;
          border-color: #dfc38a;
          box-shadow: 0 0 8px rgba(212, 175, 55, 0.4);
        }
        .light-switch-knob {
          width: 16px;
          height: 16px;
          background: linear-gradient(135deg, #8f723b, #dfc38a);
          border: 1px solid #1a1205;
          border-radius: 50%;
          position: absolute;
          top: 2.5px;
          left: 3px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .light-switch-btn.on .light-switch-knob {
          transform: translateX(20px);
          background: linear-gradient(135deg, #dfc38a, #fae7b5);
        }

        /* EXHIBITION SECTION GRID */
        .exhibition-section {
          padding: 100px 40px;
          position: relative;
        }

        .catalog-glass-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 1;
          pointer-events: none;
        }

        .liquid-blob-1, .liquid-blob-2 {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          filter: blur(140px);
          opacity: 0.12;
        }

        .liquid-blob-1 {
          background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
          top: -10%;
          left: -10%;
          animation: liquid-move-1 25s infinite alternate ease-in-out;
        }

        .liquid-blob-2 {
          background: radial-gradient(circle, #dfc38a 0%, transparent 70%);
          bottom: -10%;
          right: -10%;
          animation: liquid-move-2 30s infinite alternate ease-in-out;
        }

        @keyframes liquid-move-1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(120px, 80px) scale(1.15); }
        }

        @keyframes liquid-move-2 {
          0% { transform: translate(0, 0) scale(1.1); }
          100% { transform: translate(-100px, -120px) scale(0.9); }
        }

        .catalog-glow {
          position: absolute;
          top: 30%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(181, 139, 92, 0.04) 0%, transparent 75%);
          filter: blur(80px);
          pointer-events: none;
        }

        .catalog-glass-pane {
          position: absolute;
          inset: 0;
          background: rgba(9, 7, 6, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 2;
          pointer-events: none;
        }
        
        .exhibition-container {
          max-width: 1300px;
          margin: 0 auto;
          position: relative;
          z-index: 3;
        }
        
        .gallery-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 40px;
          width: 100%;
        }
        
        .arrival-card {
          width: 340px;
          background: linear-gradient(135deg, var(--surface2) 0%, #15110D 100%);
          border: 6px solid #1C0F07;
          outline: 1px solid var(--accent);
          outline-offset: -5px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          box-shadow: 0 12px 30px rgba(0,0,0,0.6);
        }
        
        .arrival-card:hover {
          transform: translateY(-8px);
          border-color: #2D1A0F;
          box-shadow: 0 20px 45px rgba(0,0,0,0.8), 0 0 15px rgba(212,175,55,0.2);
        }
        
        .ribbon {
          position: absolute;
          top: 15px;
          left: 15px;
          background: radial-gradient(circle, var(--accent2) 0%, var(--accent) 100%);
          border: 1px solid #7E631F;
          color: #1A1100;
          font-family: var(--font-typewriter);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 4px 10px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.4);
          z-index: 10;
        }

        .card-thumb-wrap {
          height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 20px;
        }

        .product-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .product-header-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
        }

        .product-name {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          color: var(--text);
        }

        .product-price {
          font-family: var(--font-typewriter);
          font-size: 16px;
          font-weight: 700;
          color: var(--accent);
        }

        .product-tag {
          font-family: var(--font-typewriter);
          font-size: 11px;
          color: var(--accent2);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .product-desc {
          font-family: var(--font-serif);
          font-size: 13.5px;
          color: var(--text2);
          line-height: 1.5;
        }

        /* CART DRAWER SLIDE-OVER */
        .cart-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          opacity: 0;
          visibility: hidden;
          transition: all 0.4s ease;
          z-index: 998;
        }
        .cart-drawer-overlay.open {
          opacity: 1;
          visibility: visible;
        }
        .cart-drawer {
          position: fixed;
          top: 0;
          right: -420px;
          bottom: 0;
          width: 100%;
          max-width: 420px;
          background: #0C0A08;
          border-left: 2px solid #1C0F07;
          box-shadow: -10px 0 30px rgba(0,0,0,0.9);
          display: flex;
          flex-direction: column;
          z-index: 999;
          transition: right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .cart-drawer.open {
          right: 0;
        }
        .cart-drawer-header {
          padding: 24px;
          border-bottom: 2px solid #1C0F07;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--surface);
        }
        .cart-drawer-header h3 {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--text);
        }
        .cart-close-btn {
          background: none;
          border: none;
          color: var(--text);
          font-size: 28px;
          cursor: pointer;
          line-height: 1;
        }
        .cart-close-btn:hover {
          color: var(--accent);
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
          gap: 16px;
          color: var(--text2);
        }
        .cart-empty-icon {
          width: 48px;
          height: 48px;
          color: var(--accent);
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
          border: 3px solid #1C0F07;
          outline: 1px solid var(--border);
          padding: 16px;
          border-radius: var(--radius);
          position: relative;
        }
        .cart-item-thumb {
          width: 70px;
          height: 70px;
          border-radius: var(--radius);
          overflow: hidden;
          border: 1px solid var(--border2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cart-item-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: var(--radius);
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
          font-family: var(--font-display);
          font-size: 15px;
          color: var(--text);
        }
        .cart-item-meta {
          font-family: var(--font-typewriter);
          font-size: 10px;
          color: var(--text2);
          text-transform: uppercase;
        }
        .cart-item-price {
          font-family: var(--font-typewriter);
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
          border-radius: var(--radius);
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
          font-family: var(--font-typewriter);
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
          border-top: 2px solid #1C0F07;
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
          font-family: var(--font-typewriter);
          font-size: 22px;
          color: var(--accent);
        }
        .btn-checkout-primary {
          display: block;
          width: 100%;
          text-align: center;
          padding: 14px;
        }

        @media (max-width: 768px) {
          .hero-banner {
            padding: 80px 20px 40px !important;
          }
          .hero-title {
            font-size: 36px !important;
          }
          .hero-desc {
            font-size: 14px !important;
            line-height: 1.6 !important;
          }
          .catalog-lamp {
            transform: scale(0.6) !important;
            transform-origin: top center !important;
            margin-top: -10px !important;
            margin-bottom: -70px !important;
          }
          .catalog-lamp .lamp-rod {
            height: 120px !important;
          }

          .exhibition-section { padding: 40px 20px; }
          .gallery-grid { gap: 20px; }
          .arrival-card { width: 100%; max-width: 320px; }
        }
      ` }} />

      <Navbar onCartOpen={() => setCartOpen(true)} />

      <div className="hero-banner">
        {/* Suspended Brass Lamp on top of Our Catalog heading */}
        <div className={`exquisite-lamp catalog-lamp ${lightOn ? 'on' : ''}`}>
          <div className="lamp-rod" />
          <div className="lamp-mount" />
          <div className="lamp-arm" />
          <div className="lamp-head">
            <div className={`lamp-bulb ${lightOn ? 'on' : ''}`} />
          </div>

          {/* Light beam */}
          <div className={`lamp-light-beam ${lightOn ? 'on' : ''}`} />

          {/* Lamp glow & particle system */}
          <div className={`lamp-glow-container exquisite-glow-container ${lightOn ? 'on' : ''}`}>
            <div className="glow"></div>
            <div className="particles">
              <div className="rotate">
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`lamp-glow-container exquisite-glow-container ${lightOn ? 'on' : ''}`}>
            <div className="glow"></div>
            <div className="particles">
              <div className="rotate">
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`lamp-glow-container exquisite-glow-container ${lightOn ? 'on' : ''}`}>
            <div className="glow"></div>
            <div className="particles">
              <div className="rotate">
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`lamp-glow-container exquisite-glow-container ${lightOn ? 'on' : ''}`}>
            <div className="glow"></div>
            <div className="particles">
              <div className="rotate">
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`lamp-glow-container exquisite-glow-container ${lightOn ? 'on' : ''}`}>
            <div className="glow"></div>
            <div className="particles">
              <div className="rotate">
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`lamp-glow-container exquisite-glow-container ${lightOn ? 'on' : ''}`}>
            <div className="glow"></div>
            <div className="particles">
              <div className="rotate">
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="angle">
                  <div className="size">
                    <div className="position">
                      <div className="pulse">
                        <div className="particle"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>

        <h1 className="hero-title">
          {category === "portrait" ? <>Portrait <span>Collection</span></> :
            category === "landscape" ? <>Landscape <span>Collection</span></> :
              category === "board-games" ? <>Board <span>Games</span></> :
                <>Our <span>Collection</span></>}
        </h1>
        <p className="hero-desc">{categoryDesc}</p>



        {/* Toggle switch panel */}
        <div className="light-control-panel" style={{ marginTop: "24px" }}>
          <span className="light-control-label">Studio Light</span>
          <button
            className={`light-switch-btn ${lightOn ? 'on' : ''}`}
            onClick={() => setLightOn(!lightOn)}
            aria-label="Toggle Studio Light"
          >
            <span className="light-switch-knob" />
          </button>
        </div>
      </div>

      <section className="exhibition-section">
        {/* Dynamic liquid backdrop elements */}
        <div className="catalog-glass-bg">
          <div className="liquid-blob-1" />
          <div className="liquid-blob-2" />
          <div className="catalog-glow" />
        </div>

        {/* Frosted Glass overlay sheet */}
        <div className="catalog-glass-pane" />

        <div className="exhibition-container">
          {products.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text2)", padding: "80px 0", fontFamily: "var(--font-typewriter)" }}>
              Loading frame catalog...
            </div>
          ) : (
            <div className="gallery-grid">
              {filteredProducts.map((p) => (
                <div key={p.id} className={`arrival-card ${p.orientation === "landscape" ? "landscape-card" : isBoardGame(p) ? "square-card" : ""}`}>
                  {isNewArrival(p) ? (
                    <div className="ribbon">New Arrival</div>
                  ) : isFeatured(p.id) ? (
                    <div className="ribbon">Featured</div>
                  ) : null}

                  {(() => {
                    const isGame = isBoardGame(p);
                    const getProductPreviewImage = (prod) => {
                      if (prod.thumbnailUrl) return prod.thumbnailUrl;
                      return prod.orientation === "landscape" ? "/images/nature.jpg" : "/images/dummyImg.jpg";
                    };

                    return (
                      <>
                        <div
                          className="card-thumb-wrap"
                          style={{
                            aspectRatio: p.orientation === "landscape" ? "3 / 2" : isGame ? "1 / 1" : "2 / 3",
                            padding: p.orientation === "landscape" ? "8px" : isGame ? "20px" : "20px"
                          }}
                        >
                          <div
                            className="card-frame"
                            style={{
                              position: "relative",
                              aspectRatio: isGame ? "1 / 1" : p.aspectRatio || (p.orientation === "landscape" ? 3 / 2 : 2 / 3),
                              width: p.orientation === "landscape" ? "100%" : "auto",
                              height: p.orientation === "landscape" ? "auto" : "100%",
                              boxShadow: "0 10px 24px rgba(0,0,0,0.6)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden"
                            }}
                          >
                            <div
                              style={p.orientation === "landscape" ? {
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: "66.6667%",
                                height: "150%",
                                transform: "translate(-50%, -50%) rotate(90deg)",
                                overflow: "hidden"
                              } : {
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                overflow: "hidden"
                              }}
                            >
                              {p.imageUrl && (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "fill",
                                    position: "absolute",
                                    inset: 0,
                                    zIndex: 4,
                                    pointerEvents: "none"
                                  }}
                                />
                              )}
                              <div
                                className="card-frame-inner"
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  zIndex: 2,
                                  background: "#2D2822",
                                  boxShadow: "inset 0 0 10px rgba(0,0,0,0.8)",
                                  overflow: "hidden"
                                }}
                              >
                                <img
                                  src={p.thumbnailUrl || getProductPreviewImage(p)}
                                  alt={p.name || "Frame Art Preview"}
                                  style={{
                                    width: p.orientation === "landscape" ? "152%" : "100%",
                                    height: p.orientation === "landscape" ? "152%" : "100%",
                                    objectFit: isGame ? "fill" : "cover",
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: p.orientation === "landscape" ? "translate(-50%, -50%) rotate(-90deg)" : "translate(-50%, -50%)",
                                    objectPosition: p.orientation === "landscape" ? "center 15%" : "center center"
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="product-info">
                          <div className="product-header-row">
                            <h3 className="product-name">{p.name}</h3>
                            <span className="product-price">{p.price}</span>
                          </div>
                          <span className="product-tag">{p.tag}</span>
                          <CardDescription desc={p.desc} />
                        </div>

                        <a href={`/product/${p.id}?orientation=${isGame ? 'square' : (p.orientation || 'portrait')}`} className="btn-card">
                          {isGame ? "View Game" : "View Frame"}
                        </a>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />

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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="cart-empty-icon">
                <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a.75.75 0 1 0 0-1.5.75 0 0 0 0 1.5Zm6 0a.75.75 0 1 0 0-1.5.75 0 0 0 0 1.5Z" clipRule="evenodd" />
              </svg>
              <p>Your shopping cart is empty.</p>
              <button className="btn-nav-primary" style={{ marginTop: "16px" }} onClick={() => setCartOpen(false)}>
                Explore Collections
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