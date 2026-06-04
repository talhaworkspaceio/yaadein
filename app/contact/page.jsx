"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "../../lib/firebase";
import { ref, push, set } from "firebase/database";
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

export default function ContactPage() {
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      const contactRef = ref(db, "contacts");
      const newMsgRef = push(contactRef);
      await set(newMsgRef, {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        createdAt: Date.now()
      });
      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error("Error saving contact message:", err);
      setErrorMsg("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-root">
      <style dangerouslySetInnerHTML={{ __html: `
        .contact-root {
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
        
        .contact-section {
          padding: 80px 40px;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 50px;
        }
        
        .contact-card {
          background: linear-gradient(135deg, var(--surface) 0%, #100D0B 100%);
          border: 6px solid #1C0F07;
          outline: 1.5px solid var(--accent);
          outline-offset: -5px;
          padding: 40px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.6);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .card-title {
          font-family: var(--font-display);
          font-size: 24px;
          color: var(--accent);
          border-bottom: 2px solid #1C0F07;
          padding-bottom: 12px;
          letter-spacing: 0.05em;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .form-group label {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text2);
        }
        
        .form-control {
          background: var(--surface2);
          border: 1px solid var(--border2);
          border-radius: var(--radius);
          color: var(--text);
          padding: 14px 16px;
          font-family: var(--font-typewriter);
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s ease;
          width: 100%;
        }
        
        .form-control:focus {
          border-color: var(--accent);
        }
        
        textarea.form-control {
          resize: vertical;
          min-height: 120px;
        }
        
        .btn-submit {
          background: linear-gradient(135deg, var(--accent) 0%, #A67C1E 100%);
          color: #1A1100;
          border: 1px solid #7E631F;
          outline: 3px solid #D4AF37;
          outline-offset: -4px;
          border-radius: var(--radius);
          padding: 14px;
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          text-align: center;
        }
        
        .btn-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, var(--accent2) 0%, var(--accent) 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(212,175,55,0.25);
        }
        
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .success-box {
          background: rgba(212, 175, 55, 0.05);
          border: 1.5px dashed var(--accent);
          color: var(--text);
          padding: 20px;
          border-radius: var(--radius);
          text-align: center;
          font-family: var(--font-serif);
          font-size: 15px;
          line-height: 1.6;
        }
        
        .error-box {
          background: rgba(255, 90, 90, 0.08);
          border: 1px solid #FF5A5A;
          color: #FF7777;
          padding: 12px;
          border-radius: var(--radius);
          text-align: center;
          font-family: var(--font-typewriter);
          font-size: 13px;
        }
        
        /* RIGHT COLUMN: MAP & INFO */
        .info-col {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .info-label {
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 700;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .info-val {
          font-size: 14px;
          color: var(--text2);
          line-height: 1.6;
        }
        
        .map-container {
          flex: 1;
          border: 6px solid #1C0F07;
          outline: 1.5px solid var(--accent);
          outline-offset: -5px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.6);
          position: relative;
          background: #0C0A08;
          min-height: 300px;
          overflow: hidden;
        }
        
        .map-iframe {
          width: 100%;
          height: 100%;
          border: none;
          position: absolute;
          inset: 0;
          filter: grayscale(1) invert(0.9) contrast(1.25);
          -webkit-filter: grayscale(1) invert(0.9) contrast(1.25);
          pointer-events: auto;
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
          .contact-section { grid-template-columns: 1fr; padding: 40px 20px; gap: 40px; }
          .map-container { min-height: 250px; }
          .info-grid { grid-template-columns: 1fr; }
        }
      ` }} />

      <Navbar onCartOpen={() => setCartOpen(true)} />

      <div className="hero-banner">
        <h1 className="hero-title">Contact <span>Us</span></h1>
        <p className="hero-desc">
          Have an inquiry about a custom frame project, bulk framing requirements, or need gallery installation support? Reach out to our team.
        </p>
      </div>

      <section className="contact-section">
        {/* Left Column: Form */}
        <div className="contact-card">
          <h2 className="card-title">Send a Message</h2>
          
          {success ? (
            <div className="success-box">
              <span style={{ fontSize: "28px", display: "block", marginBottom: "12px", color: "var(--accent)" }}>✓</span>
              <strong>Thank you for writing to us!</strong><br />
              Our framing experts have received your message and will contact you via email within 24 hours.
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {errorMsg && <div className="error-box">{errorMsg}</div>}
              
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Zainab Shah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. zainab@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Your Message / Project Details</label>
                <textarea
                  placeholder="Describe your framing requirements, custom size, or support request..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="form-control"
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn-submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Info & Map */}
        <div className="info-col">
          <div className="contact-card" style={{ padding: "30px 40px" }}>
            <h2 className="card-title">Studio details</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Email Support</span>
                <span className="info-val">support@yaadein.com</span>
              </div>
              <div className="info-item">
                <span className="info-label">Call Us</span>
                <span className="info-val">+92 300 9876543</span>
              </div>
              <div className="info-item">
                <span className="info-label">Address</span>
                <span className="info-val">Block H3, Johar Town, Lahore, Pakistan</span>
              </div>
              <div className="info-item">
                <span className="info-label">Hours</span>
                <span className="info-val">Mon - Fri: 9:00 AM - 6:00 PM</span>
              </div>
            </div>
          </div>

          <div className="map-container">
            <iframe
              src="https://maps.google.com/maps?q=Johar%20Town,%20Lahore,%20Pakistan&t=&z=14&ie=UTF8&iwloc=&output=embed"
              className="map-iframe"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
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
