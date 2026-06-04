"use client";

import { useState, useEffect, useCallback } from "react";
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

export default function ServicesPage() {
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

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
    <div className="services-root">
      <style dangerouslySetInnerHTML={{ __html: `
        .services-root {
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
        
        .services-section {
          padding: 80px 40px;
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 50px;
        }
        
        .service-card {
          background: linear-gradient(135deg, var(--surface) 0%, #100D0B 100%);
          border: 6px solid #1C0F07;
          outline: 1.5px solid var(--accent);
          outline-offset: -5px;
          padding: 40px;
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 40px;
          align-items: center;
          box-shadow: 0 12px 30px rgba(0,0,0,0.6);
        }
        
        .service-card:nth-child(even) {
          grid-template-columns: 1.2fr 1fr;
        }
        
        .service-card:nth-child(even) .service-visual {
          order: 2;
        }
        
        .service-visual {
          background: #080605;
          border: 3px solid #1C0F07;
          outline: 1px solid var(--border);
          outline-offset: -3px;
          aspect-ratio: 4/3;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 52px;
          color: var(--accent);
          box-shadow: inset 0 0 15px rgba(0,0,0,0.8);
        }
        
        .service-info {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .service-name {
          font-family: var(--font-display);
          font-size: 28px;
          color: var(--accent);
          letter-spacing: 0.02em;
        }
        
        .service-desc {
          font-family: var(--font-serif);
          font-size: 15px;
          line-height: 1.7;
          color: var(--text2);
        }
        
        .service-features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .service-features li {
          font-family: var(--font-typewriter);
          font-size: 12px;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .service-features li::before {
          content: "•";
          color: var(--accent);
          font-size: 14px;
        }
        
        .btn-service-action {
          display: inline-block;
          align-self: flex-start;
          background-image: url('/images/wood-bg.png') !important;
          background-size: 100% 100% !important;
          background-repeat: no-repeat !important;
          color: var(--text) !important;
          text-decoration: none;
          font-family: var(--font-display) !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          padding: 10px 24px !important;
          border-radius: var(--radius) !important;
          border: 3px solid #1C0F07 !important;
          outline: 1.5px solid var(--accent) !important;
          outline-offset: -5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          cursor: pointer;
        }
        
        .btn-service-action:hover {
          filter: brightness(1.18) !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(0,0,0,0.7);
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

        @media (max-width: 800px) {
          .hero-title { font-size: 38px; }
          .services-section { padding: 40px 20px; gap: 30px; }
          .service-card { grid-template-columns: 1fr !important; padding: 24px; gap: 20px; }
          .service-visual { order: -1 !important; aspect-ratio: 16/9; }
        }
      ` }} />

      <Navbar onCartOpen={() => setCartOpen(true)} />

      <div className="hero-banner">
        <h1 className="hero-title">Our <span>Services</span></h1>
        <p className="hero-desc">
          We combine traditional handcrafting methods with modern web customizers to provide bespoke framing and digital printing solutions of absolute visual excellence.
        </p>
      </div>

      <section className="services-section">
        {/* Service 1 */}
        <div className="service-card">
          <div className="service-visual">🖼</div>
          <div className="service-info">
            <h2 className="service-name">Bespoke Picture Framing</h2>
            <p className="service-desc">
              Every frame is individually built by hand in our local workshop. We select high-grade local wood, cure it to prevent warping, and shape it with premium moulding profiles.
            </p>
            <ul className="service-features">
              <li>Solid cured local pine, walnut, and oak mouldings</li>
              <li>Acid-free double mounting mats (matboards)</li>
              <li>Premium scratch-resistant acrylic and conservation glass</li>
            </ul>
            <a href="/customize" className="btn-service-action">Launch Customizer</a>
          </div>
        </div>

        {/* Service 2 */}
        <div className="service-card">
          <div className="service-visual">🖨</div>
          <div className="service-info">
            <h2 className="service-name">Giclée Fine Art Printing</h2>
            <p className="service-desc">
              Send us your digital images. We print on museum-grade canvas or fine-textured paper using professional wide-format pigment plotters. Colors are perfectly calibrated.
            </p>
            <ul className="service-features">
              <li>Archival 380gsm matte cotton canvas</li>
              <li>12-color Lucia PRO pigment inks (fade-proof for 100+ years)</li>
              <li>Digital color grading & image resolution upscaling</li>
            </ul>
            <a href="/customize" className="btn-service-action">Print & Frame</a>
          </div>
        </div>

        {/* Service 3 */}
        <div className="service-card">
          <div className="service-visual">📐</div>
          <div className="service-info">
            <h2 className="service-name">Gallery Wall Layouts</h2>
            <p className="service-desc">
              Have a blank staircase, hallway, or living space? We design curated collections of frames that fit together in complete harmony to reflect your personal memories.
            </p>
            <ul className="service-features">
              <li>Custom multi-frame spacing blueprints</li>
              <li>Virtual render pre-views for your specific walls</li>
              <li>Includes absolute wall-hanging templates</li>
            </ul>
            <a href="/contact" className="btn-service-action">Consult Designer</a>
          </div>
        </div>

        {/* Service 4 */}
        <div className="service-card">
          <div className="service-visual">📜</div>
          <div className="service-info">
            <h2 className="service-name">Heritage Conservation</h2>
            <p className="service-desc">
              Preserve your original historical documents, hand-drawn sketches, vintage rugs, or family heirlooms. We package them securely inside acid-free preservation frames.
            </p>
            <ul className="service-features">
              <li>Reversible mounting techniques (no adhesive damage)</li>
              <li>99% UV-blocking conservation museum acrylic</li>
              <li>Dust and humidity-controlled rear framing seal</li>
            </ul>
            <a href="/contact" className="btn-service-action">Inquire About Conservation</a>
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
