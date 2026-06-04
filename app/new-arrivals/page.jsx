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

export default function NewArrivalsPage() {
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState([]);

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

  // We will highlight "Antique Gold" and "Gallery Landscape" as new arrivals, but show all with premium badges
  const isNewArrival = (id) => {
    return id === "antique-gold" || id === "gallery-landscape" || id === "landscape-oak";
  };

  return (
    <div className="new-arrivals-root">
      <style dangerouslySetInnerHTML={{ __html: `
        .new-arrivals-root {
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
        
        .exhibition-section {
          padding: 80px 40px;
          max-width: 1300px;
          margin: 0 auto;
        }
        
        .gallery-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 40px;
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
          aspect-ratio: 4/5;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 20px;
        }
        
        .card-frame {
          border: 8px solid #2D1A0F;
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
          font-size: 21px;
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
          border-radius: var(--radius);
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
        
        .arrival-card:hover .btn-card {
          background: linear-gradient(135deg, var(--accent) 0%, #A67C1E 100%);
          border-color: #7E631F;
          color: #1A1100;
          outline: 3px solid #D4AF37;
          outline-offset: -4px;
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.35);
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

        @media (max-width: 768px) {
          .hero-title { font-size: 38px; }
          .exhibition-section { padding: 40px 20px; }
          .gallery-grid { gap: 20px; }
          .arrival-card { width: 100%; max-width: 320px; }
        }
      ` }} />

      <Navbar onCartOpen={() => setCartOpen(true)} />

      <div className="hero-banner">
        <h1 className="hero-title">New <span>Arrivals</span></h1>
        <p className="hero-desc">
          Experience the latest additions to the Yaadein catalogue. Exquisite styles handpicked by our designers to turn your photographs into museum-quality centerpieces.
        </p>
      </div>

      <section className="exhibition-section">
        {products.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text2)", padding: "80px 0", fontFamily: "var(--font-typewriter)" }}>
            Discovering new frame arrivals...
          </div>
        ) : (
          <div className="gallery-grid">
            {products.map((p) => (
              <div key={p.id} className="arrival-card">
                {isNewArrival(p.id) && <div className="ribbon">New Arrival</div>}
                
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
                  Customize Frame
                </a>
              </div>
            ))}
          </div>
        )}
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
