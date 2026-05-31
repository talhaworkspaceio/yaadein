"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "../lib/firebase";
import { ref, onValue } from "firebase/database";

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

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [filter, setFilter] = useState("portrait");
  const [products, setProducts] = useState([]);
  const [catalogEntered, setCatalogEntered] = useState(false);

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

  useEffect(() => {
    const catalogSec = document.getElementById("catalog");
    if (!catalogSec) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCatalogEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(catalogSec);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const catalogSec = document.getElementById("catalog");
    const glowEl = document.getElementById("catalog-glow");
    if (!catalogSec || !glowEl) return;

    const handleMouseMove = (e) => {
      const rect = catalogSec.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      window.requestAnimationFrame(() => {
        glowEl.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      });
    };

    const handleMouseEnter = () => {
      glowEl.style.opacity = "1";
    };

    const handleMouseLeave = () => {
      glowEl.style.opacity = "0";
    };

    catalogSec.addEventListener("mousemove", handleMouseMove);
    catalogSec.addEventListener("mouseenter", handleMouseEnter);
    catalogSec.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      catalogSec.removeEventListener("mousemove", handleMouseMove);
      catalogSec.removeEventListener("mouseenter", handleMouseEnter);
      catalogSec.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [products]);

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

  const displayedProducts = products.filter(p => p.orientation === filter);

  return (
    <div className="home-root">
      <style dangerouslySetInnerHTML={{
        __html: `
        .home-root {
          font-family: var(--font-serif);
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          overflow-x: hidden;
          scroll-behavior: smooth;
        }

        /* NAVBAR */
        .navbar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 80px;
          background: linear-gradient(to bottom, rgba(12, 10, 8, 0.8) 0%, rgba(12, 10, 8, 0) 100%);
          border-bottom: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          z-index: 1000;
          box-shadow: none;
        }
        .nav-brand {
          display: flex;
          align-items: center;
          transition: transform 0.2s ease;
        }
        .nav-brand:hover {
          transform: scale(1.03);
        }
        .nav-logo-img {
          height: 38px;
          width: auto;
          display: block;
        }
        
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 24px;
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

        .btn-nav-primary {
          background: linear-gradient(135deg, var(--accent) 0%, #A67C1E 100%);
          color: #1A1100;
          text-decoration: none;
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 700;
          padding: 8px 18px;
          border: 1px solid #7E631F;
          outline: 3px solid #D4AF37;
          outline-offset: -4px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          box-shadow: 0 4px 10px rgba(0,0,0,0.4);
        }
        .btn-nav-primary:hover {
          background: linear-gradient(135deg, var(--accent2) 0%, var(--accent) 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(212, 175, 55, 0.25);
        }

        .menu-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text);
          font-size: 24px;
          cursor: pointer;
        }

        /* CATALOG SECTION */
        .catalog-section {
          background: #080605;
          padding: 100px 40px;
          position: relative;
          overflow: hidden;
        }
        
        .catalog-glass-bg {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }

        .catalog-glass-pane {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: rgba(12, 10, 8, 0.45);
          backdrop-filter: blur(35px) saturate(140%);
          -webkit-backdrop-filter: blur(35px) saturate(140%);
          border-top: 1px solid rgba(181, 139, 92, 0.15);
          border-bottom: 1px solid rgba(181, 139, 92, 0.15);
          box-shadow: inset 0 20px 40px rgba(0, 0, 0, 0.5), inset 0 -20px 40px rgba(0, 0, 0, 0.5);
          pointer-events: none;
        }

        .catalog-container {
          max-width: 1300px;
          margin: 0 auto;
          position: relative;
          z-index: 3;
        }

        .catalog-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(181, 139, 92, 0.25) 0%, rgba(139, 94, 60, 0.08) 50%, rgba(0, 0, 0, 0) 80%);
          pointer-events: none;
          z-index: 1;
          opacity: 0;
          transition: opacity 0.4s ease;
          will-change: transform, opacity;
        }

        /* LIQUID BLOBS */
        .liquid-blob-1 {
          position: absolute;
          top: -10%;
          left: 10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(181, 139, 92, 0.28) 0%, rgba(139, 94, 60, 0) 70%);
          border-radius: 43% 57% 51% 49% / 57% 40% 60% 43%;
          animation: liquid-move-1 25s infinite alternate ease-in-out;
          pointer-events: none;
          z-index: 1;
        }

        .liquid-blob-2 {
          position: absolute;
          bottom: -15%;
          right: 5%;
          width: 550px;
          height: 550px;
          background: radial-gradient(circle, rgba(139, 94, 60, 0.24) 0%, rgba(201, 168, 76, 0) 70%);
          border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%;
          animation: liquid-move-2 30s infinite alternate ease-in-out;
          pointer-events: none;
          z-index: 1;
        }

        @keyframes liquid-move-1 {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            border-radius: 43% 57% 51% 49% / 57% 40% 60% 43%;
          }
          33% {
            transform: translate(80px, -60px) scale(1.15) rotate(45deg);
            border-radius: 54% 46% 38% 62% / 49% 70% 30% 51%;
          }
          66% {
            transform: translate(-40px, 80px) scale(0.9) rotate(90deg);
            border-radius: 35% 65% 60% 40% / 50% 35% 65% 50%;
          }
          100% {
            transform: translate(0, 0) scale(1) rotate(180deg);
            border-radius: 43% 57% 51% 49% / 57% 40% 60% 43%;
          }
        }

        @keyframes liquid-move-2 {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%;
          }
          50% {
            transform: translate(-100px, 50px) scale(1.2) rotate(120deg);
            border-radius: 38% 62% 62% 38% / 68% 48% 52% 32%;
          }
          100% {
            transform: translate(60px, -70px) scale(0.9) rotate(-60deg);
            border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%;
          }
        }
        .section-header {
          text-align: center;
          margin-bottom: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .section-title {
          font-family: var(--font-display);
          font-size: 42px;
          color: var(--accent);
          letter-spacing: 0.05em;
        }
        .section-desc {
          font-family: var(--font-serif);
          font-size: 16px;
          color: var(--text2);
          max-width: 600px;
          line-height: 1.7;
        }
        
        /* FILTERS */
        .catalog-filters {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 40px;
        }
        .filter-btn {
          background: var(--surface2);
          border: 1px solid var(--border2);
          color: var(--text2);
          padding: 10px 24px;
          border-radius: 2px;
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .filter-btn:hover {
          color: var(--accent);
          border-color: var(--accent);
        }
        .filter-btn.active {
          background: var(--accent);
          color: #1A1100;
          border-color: var(--accent);
          box-shadow: inset 0 0 4px rgba(0,0,0,0.5);
        }

        /* GRID */
        .catalog-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 30px;
        }

        /* PRODUCT CARD - MINI WOODEN FRAME */
        .product-card {
          width: 290px;
          background: linear-gradient(135deg, var(--surface2) 0%, #15110D 100%);
          border: 6px solid #1C0F07; /* dark wood border */
          outline: 1px solid var(--accent);
          outline-offset: -5px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(0,0,0,0.6);
        }
        .product-card:hover {
          transform: translateY(-8px);
          border-color: #2D1A0F;
          box-shadow: 0 15px 35px rgba(0,0,0,0.8), 0 0 10px rgba(212,175,55,0.25);
        }

        /* HANGING LAMPS */
        .lamp-wrapper {
          position: absolute;
          top: -10px;
          z-index: 5;
          transform-origin: top center;
          transform: rotate(45deg);
          pointer-events: none;
        }
        .catalog-section.animate-lamps .lamp-wrapper {
          animation: lamp-swing 3s forwards;
        }
        .lamp-wrapper.left {
          left: 40px;
        }
        .lamp-wrapper.right {
          right: 40px;
        }

        .lamp {
          width: 5.5em;
          height: auto;
          display: block;
        }
        .bulb {
          fill: #fbf8ca;
          fill-opacity: 0.1;
        }
        .catalog-section.animate-lamps .bulb {
          animation: bulb-glow 0.3s 0.3s 5 cubic-bezier(0.26, 1.17, 0.89, -0.74) alternate forwards;
        }
        .lamp-glow {
          position: absolute;
          top: 175px; /* adjusted to line up below bulb */
          left: 50%;
          transform: translateX(-50%);
          width: 180px;
          height: 380px;
          background: linear-gradient(to bottom, rgba(251, 248, 202, 0.3) 0%, rgba(251, 248, 202, 0.08) 55%, rgba(251, 248, 202, 0) 100%);
          clip-path: polygon(48% 0%, 52% 0%, 100% 100%, 0% 100%);
          opacity: 0;
          pointer-events: none;
          mix-blend-mode: screen;
        }
        .catalog-section.animate-lamps .lamp-glow {
          animation: bulb-glow 0.3s 0.3s 5 cubic-bezier(0.26, 1.17, 0.89, -0.74) alternate forwards;
        }

        @keyframes bulb-glow {
          to {
            fill-opacity: 1;
            fill: #fbf8ca;
            opacity: 1;
          }
        }
        @keyframes lamp-swing {
          5% { transform: rotate(-45deg); }
          10% { transform: rotate(35deg); }
          15% { transform: rotate(-35deg); }
          25% { transform: rotate(15deg); }
          40% { transform: rotate(-15deg); }
          65% { transform: rotate(3deg); }
          85% { transform: rotate(-1deg); }
          100% { transform: rotate(0deg); }
        }
        
        .card-thumb-wrap {
          aspect-ratio: 4/5;
          background: #080605;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.9);
          padding: 16px;
        }
        .card-frame {
          border: 8px solid #2D1A0F; /* antique dark wood */
          outline: 1px solid var(--accent);
          outline-offset: -3px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.6);
          display: flex;
          position: relative;
        }
        .card-frame-inner {
          flex: 1;
          background: #2D2822;
          box-shadow: inset 0 0 12px rgba(0,0,0,0.8);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card-frame-inner::after {
          content: '❧';
          font-size: 32px;
          color: rgba(212, 175, 55, 0.15);
        }
        
        .product-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .product-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }
        .product-name {
          font-family: var(--font-display);
          font-size: 19px;
          color: var(--text);
        }
        .product-price {
          font-family: var(--font-typewriter);
          font-size: 15px;
          font-weight: 700;
          color: var(--accent);
        }
        .product-tag {
          font-family: var(--font-typewriter);
          font-size: 10px;
          color: var(--text2);
          align-self: flex-start;
          border-bottom: 1.5px solid var(--accent);
          padding-bottom: 2px;
        }
        .product-desc {
          font-family: var(--font-serif);
          font-size: 14px;
          line-height: 1.6;
          color: var(--text2);
        }
        .btn-card {
          width: 100%;
          text-align: center;
          background: linear-gradient(to bottom, #1E1A15, #14110E);
          border: 1px solid var(--border2);
          color: var(--text);
          padding: 12px;
          border-radius: 2px;
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.2s ease;
          margin-top: auto;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }
        .product-card:hover .btn-card {
          background: linear-gradient(135deg, var(--accent) 0%, #A67C1E 100%);
          border-color: #7E631F;
          color: #1A1100;
          outline: 3px solid #D4AF37;
          outline-offset: -4px;
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.35);
        }

        /* FOOTER */
        .footer {
          background: #080605;
          border-top: 2px solid #1C0F07;
          padding: 80px 40px 40px;
        }
        .footer-grid {
          max-width: 1300px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 60px;
          padding-bottom: 60px;
          border-bottom: 1px solid var(--border);
        }
        .footer-brand-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .footer-brand {
          display: flex;
          align-items: center;
          transition: transform 0.2s ease;
        }
        .footer-brand:hover {
          transform: scale(1.03);
        }
        .footer-logo-img {
          height: 38px;
          width: auto;
          display: block;
        }
        .footer-tagline {
          font-family: var(--font-serif);
          font-size: 15px;
          line-height: 1.7;
          color: var(--text2);
          max-width: 320px;
        }
        .footer-title {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 24px;
        }
        .footer-links {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .footer-link {
          color: var(--text2);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.15s ease;
        }
        .footer-link:hover {
          color: var(--accent);
        }
        .footer-bottom {
          max-width: 1300px;
          margin: 40px auto 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-typewriter);
          font-size: 12px;
          color: var(--text2);
          letter-spacing: 0.05em;
        }
        .footer-bottom span {
          color: var(--accent);
        }

        /* CART DRAWER SLIDE-OVER */
        .cart-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
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
          width: 400px;
          max-width: 100vw;
          background: linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%);
          border-left: 3px solid #1C0F07;
          outline: 1px solid var(--border);
          outline-offset: -4px;
          z-index: 2001;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          box-shadow: -10px 0 40px rgba(0,0,0,0.8);
        }
        .cart-drawer.open {
          transform: translateX(0);
        }
        .cart-drawer-header {
          padding: 24px;
          border-bottom: 2px solid #1C0F07;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cart-drawer-header h3 {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--accent);
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
          border: 3px solid #1C0F07;
          outline: 1px solid var(--border);
          outline-offset: -3px;
          border-radius: 2px;
          padding: 12px;
          position: relative;
          box-shadow: 0 4px 10px rgba(0,0,0,0.4);
        }
        .cart-item-thumb {
          width: 70px;
          height: 70px;
          border-radius: 2px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
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
          border-radius: 2px;
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
        .cart-footer-note {
          font-family: var(--font-serif);
          font-size: 11px;
          color: var(--text2);
          text-align: center;
          font-style: italic;
        }
        .btn-checkout-primary {
          display: block;
          width: 100%;
          text-align: center;
          background: linear-gradient(135deg, var(--accent) 0%, #A67C1E 100%);
          color: #1A1100;
          text-decoration: none;
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          padding: 14px;
          border: 1px solid #7E631F;
          outline: 3px solid #D4AF37;
          outline-offset: -4px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(0,0,0,0.5);
        }
        .btn-checkout-primary:hover {
          background: linear-gradient(135deg, var(--accent2) 0%, var(--accent) 100%);
          transform: translateY(-1px);
        }

        /* MOBILE STYLES */
        @media (max-width: 1024px) {
          .catalog-grid { justify-content: center; }
        }

        @media (max-width: 768px) {
          .navbar { padding: 0 20px; }
          .nav-links, .nav-actions { display: none; }
          .menu-btn { display: block; }
          .catalog-section { padding: 60px 20px; }
          .section-title { font-size: 32px; }
          .catalog-grid { gap: 20px; }
          .product-card { width: 100%; max-width: 320px; }
          .lamp-wrapper { display: none; }
          .footer { padding: 60px 20px 20px; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
          .footer-bottom { flex-direction: column; gap: 16px; text-align: center; }
        }
      ` }} />

      {/* NAVBAR */}
      <nav className="navbar">
        <a href="/" className="nav-brand">
          <img src="/images/logo-white.png" alt="Yaadein Logo" className="nav-logo-img" />
        </a>

        <div className="nav-links">
          <a href="/" className="nav-link">Home</a>
          <a href="#catalog" className="nav-link">Catalog</a>
          <a href="/customize" className="nav-link">Customize</a>
        </div>

        <div className="nav-actions">
          <button className="btn-nav-cart" onClick={() => setCartOpen(true)} title="View Cart">
            👜 <span className="cart-badge">{cartCount}</span>
          </button>
        </div>

        <button className="menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          ☰
        </button>
      </nav>

      {/* FULLSCREEN VIDEO HERO BANNER */}
      <section className="hero-fullscreen-frame">
        <video
          src="/videos/yaadein.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="hero-video-bg"
        />
        <div className="hero-video-overlay" />

        <div className="hero-fullscreen-content">

          <h1 className="hero-fullscreen-title">
            Turn Your Moments Into <br />
            <span>Museum Art</span>
          </h1>
          <p className="hero-fullscreen-desc">
            Experience bespoke picture framing handcrafted for your specific style. Customize details in real-time, and let our master artisans deliver it ready to hang.
          </p>
        </div>
      </section>

      {/* CURATED PRODUCTS CATALOG */}
      <section className={`catalog-section ${catalogEntered ? "animate-lamps" : ""}`} id="catalog">
        {/* Dynamic liquid backdrop elements */}
        <div className="catalog-glass-bg">
          <div className="liquid-blob-1" />
          <div className="liquid-blob-2" />
          <div id="catalog-glow" className="catalog-glow" />
        </div>
        
        {/* Frosted Glass overlay sheet */}
        <div className="catalog-glass-pane" />

        {/* Hanging Lamp Left */}
        <div className="lamp-wrapper left">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 130" className="lamp" height="210">
            <g>
              <circle className="bulb" cx="30" cy="109.3" r="10.7" />
              <line style={{ fill: "none", stroke: "#D7D5AF", strokeWidth: 0.263, strokeLinecap: "round", strokeMiterlimit: 10 }} x1="28.1" y1="108.1" x2="27.4" y2="113.4" />
              <line style={{ fill: "none", stroke: "#D7D5AF", strokeWidth: 0.263, strokeLinecap: "round", strokeMiterlimit: 10 }} x1="32" y1="108.1" x2="32.6" y2="113.4" />
              <polyline style={{ fill: "none", stroke: "#D7D5AF", strokeWidth: 0.263, strokeLinecap: "round", strokeMiterlimit: 10 }} points="27.8,113.5 28.3,112.8 28.8,113.5 29.6,112.8 30,113.5 30.7,112.9 31.2,113.5 31.8,112.8 32.3,113.5" />
            </g>
            <rect x="20.7" y="66.7" style={{ fill: "#2D2D2F" }} width="18.6" height="15.6" />
            <rect x="28.5" y="0" style={{ fill: "#2D2D2F" }} width="3" height="66.7" />
            <path style={{ fill: "#2D2D2F" }} d="M30,80.3c-16.6,0-30,13.4-30,30h60C60,93.8,46.6,80.3,30,80.3z" />
            <path style={{ fill: "#2D2D2F" }} d="M30,80.3c-16.6,0-30,13.4-30,30h60C60,93.8,46.6,80.3,30,80.3z" />
          </svg>
          <div className="lamp-glow" />
        </div>

        {/* Hanging Lamp Right */}
        <div className="lamp-wrapper right">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 130" className="lamp" height="210">
            <g>
              <circle className="bulb" cx="30" cy="109.3" r="10.7" />
              <line style={{ fill: "none", stroke: "#D7D5AF", strokeWidth: 0.263, strokeLinecap: "round", strokeMiterlimit: 10 }} x1="28.1" y1="108.1" x2="27.4" y2="113.4" />
              <line style={{ fill: "none", stroke: "#D7D5AF", strokeWidth: 0.263, strokeLinecap: "round", strokeMiterlimit: 10 }} x1="32" y1="108.1" x2="32.6" y2="113.4" />
              <polyline style={{ fill: "none", stroke: "#D7D5AF", strokeWidth: 0.263, strokeLinecap: "round", strokeMiterlimit: 10 }} points="27.8,113.5 28.3,112.8 28.8,113.5 29.6,112.8 30,113.5 30.7,112.9 31.2,113.5 31.8,112.8 32.3,113.5" />
            </g>
            <rect x="20.7" y="66.7" style={{ fill: "#2D2D2F" }} width="18.6" height="15.6" />
            <rect x="28.5" y="0" style={{ fill: "#2D2D2F" }} width="3" height="66.7" />
            <path style={{ fill: "#2D2D2F" }} d="M30,80.3c-16.6,0-30,13.4-30,30h60C60,93.8,46.6,80.3,30,80.3z" />
            <path style={{ fill: "#2D2D2F" }} d="M30,80.3c-16.6,0-30,13.4-30,30h60C60,93.8,46.6,80.3,30,80.3z" />
          </svg>
          <div className="lamp-glow" />
        </div>

        <div className="catalog-container">
          <div className="section-header">

            <h2 className="section-title">The Product Catalog</h2>
            <p className="section-desc">
              Choose from our bespoke frame profiles. Select a style to launch it instantly in our interactive studio builder.
            </p>
          </div>

          <div className="catalog-filters">
            <button className={`filter-btn ${filter === 'portrait' ? 'active' : ''}`} onClick={() => setFilter('portrait')}>Portrait Frames</button>
            <button className={`filter-btn ${filter === 'landscape' ? 'active' : ''}`} onClick={() => setFilter('landscape')}>Landscape Frames</button>
          </div>

          {products.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text2)", padding: "40px 0", fontFamily: "var(--font-typewriter)" }}>
              Loading catalog from database...
            </div>
          ) : (
            <div className="catalog-grid">
              {displayedProducts.map((p) => (
                <div key={p.id} className="product-card">
                  <div className="card-thumb-wrap">
                    <div
                      className="card-frame"
                      style={{
                        position: "relative",
                        aspectRatio: p.aspectRatio || (p.orientation === "landscape" ? 3 / 2 : 2 / 3),
                        width: p.orientation === "landscape" ? "100%" : "auto",
                        height: p.orientation === "landscape" ? "auto" : "100%",
                        boxShadow: "0 10px 24px rgba(0,0,0,0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden"
                      }}
                    >
                      {/* Frame image background */}
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
                            zIndex: p.imageUrl.endsWith('.png') ? 2 : 4,
                            pointerEvents: "none"
                          }}
                        />
                      )}

                      {/* Inner matted print opening */}
                      <div
                        className="card-frame-inner"
                        style={{
                          position: "absolute",
                          top: `${p.paddingTop || 0}%`,
                          left: `${p.paddingLeft || 0}%`,
                          bottom: `${p.paddingBottom || 0}%`,
                          right: `${p.paddingRight || 0}%`,
                          zIndex: p.imageUrl && p.imageUrl.endsWith('.png') ? 4 : 2,
                          background: "#2D2822",
                          boxShadow: "inset 0 0 10px rgba(0,0,0,0.8)"
                        }}
                      />
                    </div>
                  </div>

                  <div className="product-info">
                    <div className="product-header-row">
                      <h3 className="product-name">{p.name}</h3>
                      <span className="product-price">{p.price}</span>
                    </div>
                    <span className="product-tag">{p.tag}</span>
                    <p className="product-desc">{p.desc}</p>
                  </div>

                  <a href={`/customize?frame=${p.id}`} className="btn-card">
                    Customize
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <a href="/" className="footer-brand">
              <img src="/images/logo-white.png" alt="Yaadein Logo" className="footer-logo-img" />
            </a>
            <p className="footer-tagline">
              Masterpiece picture framing handcrafted for your unique memories. Designed digitally by you, hand-finished by master craftspeople in Pakistan.
            </p>
          </div>

          <div>
            <h4 className="footer-title">Explore</h4>
            <div className="footer-links">
              <a href="/" className="footer-link">Home</a>
              <a href="#catalog" className="footer-link">Frame Catalog</a>
              <a href="/customize" className="footer-link">Customizer Studio</a>
            </div>
          </div>

          <div>
            <h4 className="footer-title">Collections</h4>
            <div className="footer-links">
              <a href="/customize?frame=classic" className="footer-link">Classic Oak</a>
              <a href="/customize?frame=gold" className="footer-link">Antique Gold</a>
              <a href="/customize?frame=obsidian" className="footer-link">Obsidian Steel</a>
              <a href="/customize?frame=modern" className="footer-link">Matte Black</a>
            </div>
          </div>

          <div>
            <h4 className="footer-title">Studio Info</h4>
            <div className="footer-links">
              <span className="footer-link" style={{ cursor: "default" }}>Mon - Fri: 9:00 AM - 6:00 PM</span>
              <span className="footer-link" style={{ cursor: "default" }}>Support: team@yaadein.com</span>
              <span className="footer-link" style={{ cursor: "default" }}>Designed in Pakistan</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Yaadein. All rights reserved.</p>
          <p>Crafted with <span>❧</span> for timeless galleries.</p>
        </div>
      </footer>

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
