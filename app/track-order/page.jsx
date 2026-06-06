"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "../../lib/firebase";
import { ref, onValue } from "firebase/database";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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

export default function TrackOrderPage() {
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [lightOn, setLightOn] = useState(true);

  // Search state
  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [recentOrders, setRecentOrders] = useState([]);

  // Auto-fill order ID from URL query param if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const recent = JSON.parse(localStorage.getItem("recent_orders") || "[]");
        setRecentOrders(recent);
      } catch (e) {
        console.error(e);
      }

      const params = new URLSearchParams(window.location.search);
      const qId = params.get("id");
      if (qId) {
        setSearchId(qId);
        handleTrackOrder(null, qId);
      }
    }
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

  const handleTrackOrder = (e, overrideId = null) => {
    if (e) e.preventDefault();
    const targetId = (overrideId || searchId).trim();
    if (!targetId) {
      setErrorMsg("Please enter a valid Order Reference ID.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    setSearched(false);
    setOrder(null);

    const ordersRef = ref(db, "orders");
    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const match = Object.entries(data).find(([key, val]) => {
          return val.orderId && val.orderId.trim().toUpperCase() === targetId.toUpperCase();
        });
        if (match) {
          const matchedOrder = { docId: match[0], ...match[1] };
          setOrder(matchedOrder);

          // Save to local recent orders array
          if (typeof window !== "undefined") {
            try {
              const recent = JSON.parse(localStorage.getItem("recent_orders") || "[]");
              if (!recent.includes(matchedOrder.orderId)) {
                const updated = [matchedOrder.orderId, ...recent].slice(0, 5);
                localStorage.setItem("recent_orders", JSON.stringify(updated));
                setRecentOrders(updated);
              }
            } catch (err) {
              console.error("Local storage error:", err);
            }
          }
        } else {
          setOrder(null);
        }
      } else {
        setOrder(null);
      }
      setSearched(true);
      setLoading(false);
    }, { onlyOnce: true });
  };

  // Helper to determine status step indexes
  const getStatusStep = (status) => {
    switch (status) {
      case "Pending": return 0;
      case "Processing": return 1;
      case "Shipped": return 2;
      case "Delivered": return 3;
      case "Cancelled": return -1;
      default: return 0;
    }
  };

  const currentStep = order ? getStatusStep(order.status) : 0;

  return (
    <div className="track-root">
      <style dangerouslySetInnerHTML={{ __html: `
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

        .track-lamp {
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
          height: 38px;
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

        .track-lamp .lamp-head {
          width: 440px; /* Cover the title */
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
          top: 76px;
          left: 50%;
          transform: translateX(-50%);
          width: 480px;
          height: 480px;
          background: radial-gradient(ellipse at top, rgba(255, 238, 180, 0.32) 0%, rgba(255, 238, 180, 0.12) 30%, rgba(255, 238, 180, 0.03) 55%, transparent 70%);
          filter: blur(30px);
          pointer-events: none;
          z-index: 15;
          opacity: 0;
          transition: opacity 0.25s ease-in-out;
        }
        .lamp-light-beam.on {
          opacity: 1;
        }

        .track-lamp .lamp-light-beam {
          width: 650px;
          height: 500px;
          background: radial-gradient(ellipse at top, rgba(255, 238, 180, 0.38) 0%, rgba(255, 238, 180, 0.15) 35%, rgba(255, 238, 180, 0.04) 60%, transparent 75%);
        }

        /* GLOW & PARTICLES */
        .exquisite-glow-container {
          top: 68px !important;
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
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          opacity: 0;
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
          animation: rotate 20s linear 0s infinite alternate;
        }

        .angle { position: absolute; top: 0; left: 0; }
        .size { position: absolute; top: 0; left: 0; }
        .position { position: absolute; top: 0; left: 0; }
        .pulse {
          position: absolute;
          top: 0;
          left: 0;
          animation: pulse 1.5s linear 0s infinite alternate;
        }
        .particle {
          position: absolute;
          top: calc(50% - 5px);
          left: calc(50% - 5px);
          width: 10px;
          height: 10px;
          border-radius: 50%;
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

        @keyframes rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes angle { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes size { 0% { transform: scale(.2); } 100% { transform: scale(.6); } }
        @keyframes pulse { 0% { transform: scale(1); } 100% { transform: scale(.5); } }
        @keyframes position {
          0% { transform: translate3d(0,0,0); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: translate3d(100px,100px,0); opacity: 0; }
        }

        @keyframes particle-warm {
          0% { box-shadow: inset 0 0 10px 10px #D4AF37, 0 0 30px 5px #F59E0B, inset 0 0 40px 40px #FFF59D; }
          33.33% { box-shadow: inset 0 0 10px 10px #D4AF37, 0 0 60px 5px #F59E0B, inset 0 0 25px 25px #FFF59D; }
          33.34% { box-shadow: inset 0 0 10px 10px #FCD34D, 0 0 30px 5px #FCD34D, inset 0 0 40px 40px #FFF; }
          66.66% { box-shadow: inset 0 0 10px 10px #FCD34D, 0 0 60px 5px #FCD34D, inset 0 0 25px 25px #FFF; }
          66.67% { box-shadow: inset 0 0 10px 10px #D97706, 0 0 30px 5px #D97706, inset 0 0 40px 40px #FF8A00; }
          100% { box-shadow: inset 0 0 10px 10px #D97706, 0 0 60px 5px #D97706, inset 0 0 25px 25px #FF8A00; }
        }

        .rotate .angle:nth-child(1) { animation: angle 10s steps(5) 0s infinite; }
        .rotate .angle:nth-child(1) .size { animation: size 10s steps(5) 0s infinite; }
        .rotate .angle:nth-child(1) .particle { animation: particle-warm 6s linear infinite alternate; }
        .rotate .angle:nth-child(1) .position { animation: position 2s linear 0s infinite; }

        .rotate .angle:nth-child(2) { animation: angle 4.95s steps(3) -1.65s infinite; }
        .rotate .angle:nth-child(2) .size { animation: size 4.95s steps(3) -1.65s infinite alternate; }
        .rotate .angle:nth-child(2) .particle { animation: particle-warm 4.95s linear -3.3s infinite alternate; }
        .rotate .angle:nth-child(2) .position { animation: position 1.65s linear 0s infinite; }

        .rotate .angle:nth-child(3) { animation: angle 13.76s steps(8) -6.88s infinite; }
        .rotate .angle:nth-child(3) .size { animation: size 6.88s steps(4) -5.16s infinite alternate; }
        .rotate .angle:nth-child(3) .particle { animation: particle-warm 5.16s linear -1.72s infinite alternate; }
        .rotate .angle:nth-child(3) .position { animation: position 1.72s linear 0s infinite; }

        .track-root {
          font-family: var(--font-serif);
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          overflow-x: hidden;
        }
        
        .hero-banner {
          position: relative;
          padding: 120px 40px 80px;
          background: linear-gradient(to bottom, #14110E 0%, #080605 100%);
          border-bottom: 2px solid #1C0F07;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        
        .hero-title {
          font-family: var(--font-display);
          font-size: 52px;
          color: var(--text);
          letter-spacing: 0.05em;
        }
        
        .hero-title span {
          color: var(--accent);
        }
        
        .hero-desc {
          font-family: var(--font-serif);
          font-size: 16px;
          color: var(--text2);
          max-width: 650px;
          line-height: 1.7;
        }

        .track-section {
          padding: 80px 40px;
          position: relative;
          overflow: hidden;
          background: #080605;
          min-height: 500px;
          display: flex;
          justify-content: center;
        }

        .track-container {
          max-width: 800px;
          width: 100%;
          margin: 0 auto;
          position: relative;
          z-index: 3;
        }

        /* Frosted Glass overlay sheet */
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

        .catalog-glass-bg {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }

        .catalog-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 1000px;
          height: 1000px;
          background: radial-gradient(circle, rgba(181, 139, 92, 0.25) 0%, rgba(139, 94, 60, 0.08) 50%, rgba(0, 0, 0, 0) 80%);
          pointer-events: none;
          z-index: 1;
          opacity: 1;
        }

        .liquid-blob-1 {
          position: absolute;
          top: -10%;
          left: 10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(181, 139, 92, 0.2) 0%, rgba(139, 94, 60, 0) 70%);
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
          background: radial-gradient(circle, rgba(139, 94, 60, 0.18) 0%, rgba(201, 168, 76, 0) 70%);
          border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%;
          animation: liquid-move-2 30s infinite alternate ease-in-out;
          pointer-events: none;
          z-index: 1;
        }

        /* SEARCH CARD */
        .track-card {
          background: linear-gradient(135deg, var(--surface) 0%, #100D0B 100%);
          border: 6px solid #1C0F07;
          border-radius: var(--radius);
          box-shadow: inset 0 0 0 1.5px var(--accent), 0 12px 30px rgba(0,0,0,0.6);
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 30px;
          position: relative;
        }

        .track-card-title {
          font-family: var(--font-display);
          font-size: 24px;
          color: var(--accent);
          border-bottom: 2px solid #1C0F07;
          padding-bottom: 12px;
          letter-spacing: 0.05em;
        }

        .search-form-group {
          display: flex;
          gap: 12px;
        }

        .order-search-input {
          flex: 1;
          background: var(--surface2);
          border: 1px solid var(--border2);
          border-radius: var(--radius);
          color: var(--text);
          padding: 14px 18px;
          font-family: var(--font-typewriter);
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .order-search-input:focus {
          border-color: var(--accent);
        }

        .btn-track {
          min-width: 140px;
        }

        /* TIMELINE TRACKER styling */
        .track-timeline {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          padding: 30px 0;
          margin: 10px 0 20px;
        }

        .track-timeline-line {
          position: absolute;
          top: 50%;
          left: 40px;
          right: 40px;
          height: 4px;
          background: #2D1A0F;
          z-index: 1;
          transform: translateY(-50%);
        }

        .track-timeline-progress {
          position: absolute;
          top: 50%;
          left: 40px;
          height: 4px;
          background: radial-gradient(circle, var(--accent2) 0%, var(--accent) 100%);
          box-shadow: 0 0 10px var(--accent);
          z-index: 2;
          transform: translateY(-50%);
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .timeline-node {
          position: relative;
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          width: 80px;
        }

        .node-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #100d0b;
          border: 2px solid #2D1A0F;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          color: transparent;
          font-size: 10px;
          font-weight: 700;
        }

        .timeline-node.active .node-dot {
          background: var(--accent);
          border-color: #7E631F;
          box-shadow: 0 0 12px var(--accent);
          color: #1A1100;
        }

        .timeline-node.completed .node-dot {
          background: #dfc38a;
          border-color: #7E631F;
          color: #1A1100;
        }

        .node-label {
          font-family: var(--font-typewriter);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text2);
          transition: color 0.3s ease;
          white-space: nowrap;
        }

        .timeline-node.active .node-label {
          color: var(--accent);
          font-weight: 700;
        }

        .timeline-node.completed .node-label {
          color: var(--text);
        }

        /* Order Details info sheet */
        .order-info-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 30px;
          border-top: 1px dashed rgba(181, 139, 92, 0.2);
          padding-top: 24px;
        }

        .info-col-title {
          font-family: var(--font-display);
          font-size: 14px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }

        .tracking-items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tracking-item {
          display: flex;
          gap: 12px;
          background: var(--surface2);
          border: 3px solid #1C0F07;
          border-radius: var(--radius);
          padding: 8px;
          align-items: center;
        }

        .tracking-item-thumb {
          width: 50px;
          height: 50px;
          border-radius: var(--radius);
          overflow: hidden;
          background: #1c1815;
          display: flex;
          position: relative;
          padding: 4px;
        }

        .tracking-item-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: var(--radius);
        }

        .tracking-item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .tracking-item-name {
          font-family: var(--font-display);
          font-size: 13px;
          color: var(--text);
        }

        .tracking-item-meta {
          font-family: var(--font-typewriter);
          font-size: 9px;
          color: var(--text2);
        }

        .tracking-item-price {
          font-family: var(--font-typewriter);
          font-size: 12px;
          color: var(--accent);
          font-weight: 700;
        }

        .customer-summary {
          font-family: var(--font-serif);
          font-size: 14px;
          line-height: 1.6;
          color: var(--text2);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .customer-summary strong {
          color: var(--text);
        }

        .cancelled-banner {
          background: rgba(255, 90, 90, 0.08);
          border: 1.5px dashed #FF5A5A;
          color: #FF7777;
          padding: 18px;
          border-radius: var(--radius);
          text-align: center;
          font-family: var(--font-typewriter);
          font-size: 14px;
          margin-bottom: 10px;
        }

        /* LIGHT SWITCH TOGGLE STYLING */
        .light-control-panel {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(20, 17, 14, 0.6);
          border: 1.5px solid rgba(212, 175, 55, 0.25);
          padding: 8px 18px;
          border-radius: 999px;
          z-index: 30;
          margin-top: 10px;
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
          border-radius: var(--radius);
          padding: 12px;
          position: relative;
          box-shadow: 0 4px 10px rgba(0,0,0,0.4);
        }
        .cart-item-thumb {
          width: 70px;
          height: 70px;
          border-radius: var(--radius);
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
          .hero-title { font-size: 38px; }
          .track-section { padding: 40px 20px; }
          .order-info-grid { grid-template-columns: 1fr; gap: 30px; }
          .search-form-group { flex-direction: column; }
          .btn-track { width: 100%; }
        }
      ` }} />

      <Navbar onCartOpen={() => setCartOpen(true)} />

      <div className="hero-banner">
        {/* Suspended Brass Lamp on top of Track Order heading */}
        <div className={`exquisite-lamp track-lamp ${lightOn ? 'on' : ''}`}>
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
              </div>
            </div>
          </div>
        </div>

        <h1 className="hero-title">Track <span>Order</span></h1>
        <p className="hero-desc">
          Review the status of your handcrafted orders. Enter your Order Reference ID code below to trace your design through production and delivery.
        </p>
        
        {/* Toggle switch panel */}
        <div className="light-control-panel">
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

      <section className="track-section">
        {/* Dynamic liquid backdrop elements */}
        <div className="catalog-glass-bg">
          <div className="liquid-blob-1" />
          <div className="liquid-blob-2" />
          <div className="catalog-glow" />
        </div>

        {/* Frosted Glass overlay sheet */}
        <div className="catalog-glass-pane" />

        <div className="track-container">
          <div className="track-card">
            <h2 className="track-card-title">Order Tracking Search</h2>

            <form onSubmit={handleTrackOrder} className="search-form-group">
              <input
                type="text"
                placeholder="Enter Reference ID (e.g. YAADEIN-XXXXXX)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="order-search-input"
              />
              <button type="submit" className="btn-premium btn-track" disabled={loading}>
                {loading ? "Searching..." : "Track Status"}
              </button>
            </form>

            {errorMsg && <div style={{ color: "#FF7777", fontFamily: "var(--font-typewriter)", fontSize: "13px" }}>{errorMsg}</div>}

            {recentOrders.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", fontSize: "12px", fontFamily: "var(--font-typewriter)", color: "var(--text2)" }}>
                <span>Recent Orders:</span>
                {recentOrders.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setSearchId(id);
                      handleTrackOrder(null, id);
                    }}
                    style={{
                      background: "rgba(212, 175, 55, 0.08)",
                      border: "1px solid rgba(212, 175, 55, 0.2)",
                      borderRadius: "4px",
                      color: "var(--accent)",
                      padding: "4px 8px",
                      fontSize: "11px",
                      cursor: "pointer",
                      fontFamily: "var(--font-typewriter)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {id}
                  </button>
                ))}
              </div>
            )}

            {searched && !order && (
              <div style={{ textAlign: "center", color: "var(--text2)", padding: "20px 0", fontFamily: "var(--font-typewriter)", borderTop: "1.5px dashed rgba(181, 139, 92, 0.15)", paddingTop: "30px" }}>
                ❌ Order ID "{searchId}" not found. Please double-check your receipt code.
              </div>
            )}

            {order && (
              <div style={{ borderTop: "1.5px dashed rgba(181, 139, 92, 0.2)", paddingTop: "30px" }}>
                
                {/* Cancelled Banner */}
                {order.status === "Cancelled" && (
                  <div className="cancelled-banner">
                    ⚠️ THIS ORDER HAS BEEN CANCELLED
                  </div>
                )}

                {/* Timeline progress tracker */}
                {order.status !== "Cancelled" && (
                  <div className="track-timeline">
                    <div className="track-timeline-line" />
                    <div 
                      className="track-timeline-progress" 
                      style={{ width: `${(currentStep / 3) * 100}%` }}
                    />

                    <div className={`timeline-node ${currentStep >= 0 ? "active" : ""} ${currentStep > 0 ? "completed" : ""}`}>
                      <div className="node-dot">✓</div>
                      <span className="node-label">Placed</span>
                    </div>

                    <div className={`timeline-node ${currentStep >= 1 ? "active" : ""} ${currentStep > 1 ? "completed" : ""}`}>
                      <div className="node-dot">✓</div>
                      <span className="node-label">Processing</span>
                    </div>

                    <div className={`timeline-node ${currentStep >= 2 ? "active" : ""} ${currentStep > 2 ? "completed" : ""}`}>
                      <div className="node-dot">✓</div>
                      <span className="node-label">Shipped</span>
                    </div>

                    <div className={`timeline-node ${currentStep >= 3 ? "active" : ""} ${currentStep > 3 ? "completed" : ""}`}>
                      <div className="node-dot">✓</div>
                      <span className="node-label">Delivered</span>
                    </div>
                  </div>
                )}

                {/* Details Row */}
                <div className="order-info-grid">
                  <div>
                    <h3 className="info-col-title">Order Summary</h3>
                    <div className="tracking-items-list">
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="tracking-item">
                          <div className="tracking-item-thumb" style={{ background: item.frameColor }}>
                            {item.image ? (
                              <img src={item.image} alt={item.frameName} />
                            ) : (
                              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(201, 168, 76, 0.15)", fontSize: "16px", fontFamily: "var(--font-display)" }}>Y</div>
                            )}
                          </div>
                          <div className="tracking-item-info">
                            <span className="tracking-item-name">{item.frameName}</span>
                            <span className="tracking-item-meta">{item.size || "Standard"} • {item.orientation || "Portrait"} {item.quantity > 1 ? `x${item.quantity}` : ""}</span>
                          </div>
                          <span className="tracking-item-price">{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="info-col-title">Recipient Details</h3>
                    <div className="customer-summary">
                      <div><strong>Full Name:</strong> {order.customer?.fullName}</div>
                      <div><strong>Phone Number:</strong> {order.customer?.phone}</div>
                      <div><strong>Shipping Address:</strong> {order.customer?.address}</div>
                      <div><strong>City / Region:</strong> {order.customer?.city}</div>
                      <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed rgba(181, 139, 92, 0.15)", color: "var(--accent)", fontFamily: "var(--font-typewriter)", fontSize: "15px" }}>
                        <strong>Grand Total:</strong> Rs. {order.total?.toLocaleString()} (COD)
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
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
                      <div className="cart-item-thumb-placeholder">Y</div>
                    )}
                  </div>
                  <div className="cart-item-details">
                    <div className="cart-item-name">{item.frameName}</div>
                    <div className="cart-item-meta">
                      {item.size} / {item.orientation}
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
