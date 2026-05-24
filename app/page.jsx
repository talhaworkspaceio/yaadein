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
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0F0D0B;
          --surface: #171512;
          --surface2: #211E1A;
          --surface3: #2D2822;
          --border: rgba(255,255,255,0.06);
          --border2: rgba(255,255,255,0.12);
          --text: #F5F0E8;
          --text2: #A8A08C;
          --accent: #C9A84C;
          --accent2: #E8C96A;
          --radius: 16px;
        }

        .home-root {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          overflow-x: hidden;
          scroll-behavior: smooth;
        }

        /* NAVBAR */
        .navbar {
          position: sticky;
          top: 0;
          height: 68px;
          background: rgba(15, 13, 11, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          z-index: 1000;
        }
        .nav-brand {
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
        .nav-brand:hover {
          transform: scale(1.02);
        }
        .nav-brand span { color: var(--text); font-size: 19px; }
        
        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .nav-link {
          color: var(--text2);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: color 0.2s ease;
        }
        .nav-link:hover {
          color: var(--accent);
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }
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

        .btn-nav-primary {
          background: var(--accent);
          color: #1A1100;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          padding: 10px 20px;
          border-radius: 30px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(201, 168, 76, 0.25);
        }
        .btn-nav-primary:hover {
          background: var(--accent2);
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(201, 168, 76, 0.35);
        }

        .menu-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text);
          font-size: 24px;
          cursor: pointer;
        }

        /* HERO BANNER */
        .hero {
          padding: 100px 40px 80px;
          max-width: 1300px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 60px;
          align-items: center;
        }
        .hero-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 24px;
        }
        .hero-tag {
          font-size: 11px;
          font-weight: 700;
          color: var(--accent);
          letter-spacing: 0.2em;
          text-transform: uppercase;
          background: rgba(201, 168, 76, 0.08);
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid rgba(201, 168, 76, 0.15);
        }
        .hero-title {
          font-family: 'DM Serif Display', serif;
          font-size: 56px;
          line-height: 1.1;
          color: var(--text);
          letter-spacing: -0.01em;
        }
        .hero-title span {
          color: var(--accent);
        }
        .hero-desc {
          font-size: 16px;
          line-height: 1.6;
          color: var(--text2);
          max-width: 540px;
        }
        .hero-btns {
          display: flex;
          gap: 16px;
          margin-top: 12px;
        }
        .btn-hero-primary {
          background: var(--accent);
          color: #1A1100;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          padding: 14px 32px;
          border-radius: 30px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          box-shadow: 0 8px 24px rgba(201, 168, 76, 0.2);
        }
        .btn-hero-primary:hover {
          background: var(--accent2);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(201, 168, 76, 0.3);
        }
        .btn-hero-ghost {
          background: rgba(255,255,255,0.02);
          color: var(--text);
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          padding: 14px 30px;
          border-radius: 30px;
          border: 1px solid var(--border2);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: all 0.2s ease;
        }
        .btn-hero-ghost:hover {
          background: rgba(255,255,255,0.06);
          border-color: var(--accent);
          color: var(--accent);
          transform: translateY(-2px);
        }

        /* HERO GRAPHIC */
        .hero-graphic-container {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .hero-frame-wrap {
          border-radius: 8px;
          overflow: hidden;
          background: #8B5E3C;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.4);
          padding: 24px;
          width: 100%;
          max-width: 500px;
          aspect-ratio: 1;
          display: flex;
          position: relative;
        }
        .hero-frame-inner {
          flex: 1;
          border-radius: 3px;
          overflow: hidden;
          box-shadow: inset 0 0 15px rgba(0,0,0,0.6);
          position: relative;
        }
        .hero-frame-inner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .hero-frame-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          box-shadow: inset 0 0 30px rgba(0,0,0,0.4);
          background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.15) 100%);
        }

        /* CATALOG SECTION */
        .catalog-section {
          background: var(--surface);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 100px 40px;
        }
        .catalog-container {
          max-width: 1300px;
          margin: 0 auto;
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
          font-family: 'DM Serif Display', serif;
          font-size: 42px;
          color: var(--text);
        }
        .section-desc {
          font-size: 15px;
          color: var(--text2);
          max-width: 600px;
          line-height: 1.6;
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
          border-radius: 30px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-btn:hover {
          color: var(--text);
          border-color: var(--text);
        }
        .filter-btn.active {
          background: var(--accent);
          color: #1A1100;
          border-color: var(--accent);
        }

        /* GRID */
        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 30px;
        }

        /* PRODUCT CARD */
        .product-card {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
        }
        .product-card:hover {
          transform: translateY(-8px);
          border-color: var(--accent);
          box-shadow: 0 15px 35px rgba(0,0,0,0.3);
        }
        
        .card-thumb-wrap {
          aspect-ratio: 4/5;
          background: var(--bg);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
          padding: 16px;
        }
        .card-frame {
          border-radius: 4px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          display: flex;
          position: relative;
        }
        .card-frame-inner {
          flex: 1;
          background: #2D2822;
          box-shadow: inset 0 0 8px rgba(0,0,0,0.4);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card-frame-inner::after {
          content: '❧';
          font-size: 32px;
          color: rgba(201, 168, 76, 0.12);
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
          font-family: 'DM Serif Display', serif;
          font-size: 20px;
          color: var(--text);
        }
        .product-price {
          font-size: 16px;
          font-weight: 700;
          color: var(--accent);
        }
        .product-tag {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text2);
          align-self: flex-start;
          border-bottom: 1.5px solid var(--accent);
          padding-bottom: 2px;
        }
        .product-desc {
          font-size: 13px;
          line-height: 1.5;
          color: var(--text2);
        }
        .btn-card {
          width: 100%;
          text-align: center;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border2);
          color: var(--text);
          padding: 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.2s ease;
          margin-top: auto;
        }
        .product-card:hover .btn-card {
          background: var(--accent);
          border-color: var(--accent);
          color: #1A1100;
          box-shadow: 0 4px 12px rgba(201, 168, 76, 0.2);
        }

        /* FOOTER */
        .footer {
          background: #090807;
          border-top: 1px solid var(--border);
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
          font-family: 'DM Serif Display', serif;
          font-size: 24px;
          color: var(--accent);
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .footer-brand span { color: var(--text); font-size: 20px; }
        .footer-tagline {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text2);
          max-width: 320px;
        }
        .footer-title {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text);
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
          font-size: 13px;
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

        /* MOBILE STYLES */
        @media (max-width: 1024px) {
          .catalog-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .navbar { padding: 0 20px; }
          .nav-links, .nav-actions { display: none; }
          .menu-btn { display: block; }
          .hero {
            grid-template-columns: 1fr;
            padding: 60px 20px 40px;
            gap: 40px;
            text-align: center;
          }
          .hero-content { align-items: center; }
          .hero-title { font-size: 40px; }
          .hero-btns { flex-direction: column; width: 100%; }
          .btn-hero-primary, .btn-hero-ghost { text-align: center; width: 100%; }
          .catalog-section { padding: 60px 20px; }
          .section-title { font-size: 32px; }
          .catalog-grid { grid-template-columns: 1fr; gap: 20px; }
          .footer { padding: 60px 20px 20px; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
          .footer-bottom { flex-direction: column; gap: 16px; text-align: center; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="navbar">
        <a href="/" className="nav-brand">
          ❧ Yaadein
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
          <a href="/customize" className="btn-nav-primary">Start Framing</a>
        </div>

        <button className="menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          ☰
        </button>
      </nav>

      {/* HERO BANNER */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-tag">Premium Custom Framing</span>
          <h1 className="hero-title">
            Turn Your Moments Into <span>Museum Art</span>
          </h1>
          <p className="hero-desc">
            Experience bespoke picture framing handcrafted for your specific style. Drop your own photo, customize details with premium frames in real-time, and let our master artisans deliver it ready to hang.
          </p>
          <div className="hero-btns">
            <a href="/customize" className="btn-hero-primary">Start Customizing</a>
            <a href="#catalog" className="btn-hero-ghost">Explore Collections</a>
          </div>
        </div>

        <div className="hero-graphic-container">
          <div className="hero-frame-wrap" style={{ padding: "28px" }}>
            <div className="hero-frame-inner">
              <video
                src="/videos/yaadein.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <div className="hero-frame-overlay" />
            </div>
          </div>
        </div>
      </section>

      {/* CURATED PRODUCTS CATALOG */}
      <section className="catalog-section" id="catalog">
        <div className="catalog-container">
          <div className="section-header">
            <span className="hero-tag">Curated Collections</span>
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
            <div style={{ textAlign: "center", color: "var(--text2)", padding: "40px 0" }}>
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
                        boxShadow: "0 10px 24px rgba(0,0,0,0.4)",
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
                          boxShadow: "inset 0 0 10px rgba(0,0,0,0.6)"
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
              ❧ Yaadein
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
