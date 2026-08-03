"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useRefundPolicyContent } from "../../lib/cms";

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

export default function RefundPage() {
  const { data: refundCms } = useRefundPolicyContent();
  const [cartItems, setCartItems] = useState([]);

  const [cartOpen, setCartOpen] = useState(false);
  const [lightOn, setLightOn] = useState(true);

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

  return (
    <div className="policy-root">
      <style dangerouslySetInnerHTML={{ __html: `
        .policy-root {
          font-family: var(--font-serif);
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          overflow-x: hidden;
        }
        
        .hero-banner {
          position: relative;
          padding: 120px 40px 60px;
          background: linear-gradient(to bottom, #14110E 0%, #080605 100%);
          border-bottom: 2px solid #1C0F07;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        
        .hero-title {
          font-family: var(--font-display);
          font-size: 42px;
          color: var(--text);
          letter-spacing: 0.05em;
        }
        
        .hero-title span {
          color: var(--accent);
        }
        
        .policy-container {
          padding: 60px 40px;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .policy-card {
          background: linear-gradient(135deg, var(--surface) 0%, #100D0B 100%);
          border: 6px solid #1C0F07;
          outline: 1.5px solid var(--accent);
          outline-offset: -5px;
          padding: 48px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.6);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .policy-text h2 {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--accent);
          margin-top: 24px;
          margin-bottom: 12px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 6px;
        }
        
        .policy-text p {
          font-size: 14px;
          line-height: 1.7;
          color: var(--text2);
          margin-bottom: 16px;
        }
        
        .policy-text ul {
          list-style: none;
          padding-left: 20px;
          margin-bottom: 16px;
        }
        
        .policy-text ul li {
          font-size: 14px;
          line-height: 1.7;
          color: var(--text2);
          margin-bottom: 8px;
          position: relative;
        }
        
        .policy-text ul li::before {
          content: "•";
          color: var(--accent);
          position: absolute;
          left: -20px;
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
          .hero-title { font-size: 32px; }
          .policy-container { padding: 40px 16px; }
          .policy-card { padding: 24px; }
        }

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
          margin-top: -30px; /* Pull it slightly higher in the padding */
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
          top: 116px;
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

        .catalog-lamp .lamp-light-beam {
          width: 650px;
          height: 500px;
          background: radial-gradient(ellipse at top, rgba(255, 238, 180, 0.38) 0%, rgba(255, 238, 180, 0.15) 35%, rgba(255, 238, 180, 0.04) 60%, transparent 75%);
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
      ` }} />

      <Navbar onCartOpen={() => setCartOpen(true)} />

      <div className="hero-banner">
        {/* Suspended Brass Lamp on top of heading */}
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

        <h1 className="hero-title">{refundCms?.title || refundCms?.pageTitle || "Refund Policy"}</h1>

        
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

      <div className="policy-container">
        <div className="policy-card">
          <div className="policy-text">
            <p className="last-updated">{refundCms?.lastUpdated || "Last updated: July 2026"}</p>
            
            {refundCms?.content ? (
              <div style={{ whiteSpace: "pre-line", lineHeight: "1.8", color: "var(--text2)", fontSize: "15px" }}>
                {refundCms.content}
              </div>
            ) : refundCms?.sections && refundCms.sections.length > 0 ? (
              refundCms.sections.map((sec, idx) => (
                <div key={idx} style={{ marginBottom: "24px" }}>
                  {sec.title && <h2>{sec.title}</h2>}
                  {sec.content && <p style={{ whiteSpace: "pre-line" }}>{sec.content}</p>}
                </div>
              ))
            ) : (
              <>
                <p>{refundCms?.introText || "At Yaadein, our dedication to traditional hand-craftsmanship means each photo frame is custom built to your specific dimensions and preferences. Please read our guidelines on refunds and returns below."}</p>

                <h2>1. Custom Orders (Non-Refundable)</h2>
                <p>Because each custom frame is designed digitally by you and individually hand-made to order, we are unable to accept returns, exchanges, or issue refunds for changes of mind or errors made during customization (e.g., incorrect orientation, frame choice, uploaded image quality, or size inputs).</p>
                
                <h2>2. Damaged or Defective Items</h2>
                <p>In the rare event that your custom frame arrives damaged during courier shipping or possesses craftsmanship defects, we will construct and ship a replacement frame absolutely free of charge.</p>
                <p>To request a free replacement:</p>
                <ul>
                  <li>Inspect your package immediately upon delivery.</li>
                  <li>Photograph the packaging damages, transit box, and the specific defective spots of the frame.</li>
                  <li>Email the photographs along with your Reference Order ID (e.g. FS-XXXXXX) to <strong>support@yaadein.com</strong> within 48 hours of delivery.</li>
                </ul>
                
                <h2>3. Incorrect Orders</h2>
                <p>If our workshop has mistakenly shipped a frame style or size different from your original design specifications, please contact us immediately, and we will rush your correct order to your doorstep without extra cost.</p>
              </>
            )}

          </div>
        </div>
      </div>


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
