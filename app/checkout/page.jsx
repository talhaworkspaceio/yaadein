"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { ref, push, set } from "firebase/database";

const CLOUDINARY_CLOUD = "hpikhwjw";
const CLOUDINARY_PRESET = "ml_default";


// Persistent Cart LocalStorage Helpers
const getCart = () => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("fs_cart") || "[]");
  } catch (e) {
    return [];
  }
};

const clearCart = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("fs_cart");
  window.dispatchEvent(new Event("fs-cart-updated"));
};

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getSubtotal = () => {
    return cartItems.reduce((acc, item) => {
      const priceVal = parseInt((item.price || "0").replace(/[^0-9]/g, "")) || 0;
      return acc + priceVal * item.quantity;
    }, 0);
  };

  const subtotal = getSubtotal();
  const shipping = subtotal > 0 ? 250 : 0; // Flat courier rate in Pakistan
  const total = subtotal + shipping;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (cartItems.length === 0) {
      setErrorMsg("Your cart is empty. Please add a frame to customize first!");
      return;
    }

    // Basic Validation
    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.email.trim() ||
      !formData.address.trim() ||
      !formData.city.trim() ||
      !formData.state.trim() ||
      !formData.zip.trim()
    ) {
      setErrorMsg("Please fill in all the shipping and contact information fields.");
      return;
    }

    setIsSubmitting(true);
    const randomId = "FS-" + Math.floor(100000 + Math.random() * 900000);

    try {
      // Loop over items, upload images if they are data URLs
      const processedItems = await Promise.all(
        cartItems.map(async (item) => {
          if (item.image && item.image.startsWith("data:image")) {
            try {
              const dataUpload = new FormData();
              dataUpload.append("file", item.image);
              dataUpload.append("upload_preset", CLOUDINARY_PRESET);

              const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
                method: "POST",
                body: dataUpload,
              });

              if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error?.message || "Failed to upload image to Cloudinary");
              }

              const result = await res.json();
              return { ...item, image: result.secure_url };
            } catch (err) {
              console.error("Error uploading image to Cloudinary:", err);
              // Fallback to saving as-is (keeping base64 or empty) if it failed
              return item;
            }
          }
          return item;
        })
      );

      const orderData = {
        customer: formData,
        items: processedItems,
        subtotal: subtotal,
        shipping: shipping,
        total: total,
        orderId: randomId,
        status: "Pending",
        createdAt: Date.now()
      };

      const ordersRef = ref(db, "orders");
      const newOrderRef = push(ordersRef);
      await set(newOrderRef, orderData);

      setOrderId(randomId);
      setOrderSuccess(true);
      clearCart();
    } catch (err) {
      console.error("Firebase Order Error:", err);
      setErrorMsg("Failed to place order securely. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-root">
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

        .checkout-root {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* HEADER */
        .navbar {
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
        }
        .nav-brand span { color: var(--text); font-size: 19px; }
        
        .btn-back {
          color: var(--text2);
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: color 0.15s ease;
        }
        .btn-back:hover {
          color: var(--accent);
        }

        /* LAYOUT */
        .checkout-container {
          flex: 1;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 60px 40px;
        }

        /* DUAL COLUMN */
        .checkout-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 48px;
          align-items: start;
        }

        /* LEFT SIDE FORM */
        .checkout-main {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .checkout-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 36px;
        }
        .card-title {
          font-family: 'DM Serif Display', serif;
          font-size: 24px;
          color: var(--text);
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }
        .form-group.full {
          grid-column: span 2;
        }
        .form-group label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text2);
        }
        .form-control {
          background: var(--surface2);
          border: 1px solid var(--border2);
          border-radius: 8px;
          color: var(--text);
          padding: 12px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .form-control:focus {
          border-color: var(--accent);
        }

        /* COD BADGE */
        .cod-badge {
          background: rgba(201, 168, 76, 0.03);
          border: 1px dashed var(--accent);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
          margin-top: 12px;
        }
        .cod-icon {
          font-size: 28px;
          color: var(--accent);
          line-height: 1;
        }
        .cod-details h4 {
          font-family: 'DM Serif Display', serif;
          font-size: 16px;
          color: var(--accent);
          margin-bottom: 4px;
        }
        .cod-details p {
          font-size: 12px;
          line-height: 1.5;
          color: var(--text2);
        }

        .btn-order {
          width: 100%;
          background: var(--accent);
          color: #1A1100;
          border: none;
          border-radius: 12px;
          padding: 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(201, 168, 76, 0.25);
          margin-top: 24px;
        }
        .btn-order:hover:not(:disabled) {
          background: var(--accent2);
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(201, 168, 76, 0.35);
        }
        .btn-order:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* RIGHT SIDE ORDER SUMMARY */
        .checkout-sidebar {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          position: sticky;
          top: 100px;
        }
        .sidebar-title {
          font-family: 'DM Serif Display', serif;
          font-size: 20px;
          color: var(--text);
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
        }

        .summary-items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 280px;
          overflow-y: auto;
        }
        .summary-item {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .summary-thumb {
          width: 50px;
          height: 50px;
          border-radius: 6px;
          display: flex;
          padding: 4px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .summary-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 2px;
        }
        .summary-thumb-placeholder {
          flex: 1;
          background: #2D2822;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: rgba(201,168,76,0.15);
        }
        .summary-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .summary-name {
          font-family: 'DM Serif Display', serif;
          font-size: 14px;
          color: var(--text);
        }
        .summary-meta {
          font-size: 9px;
          color: var(--text2);
          text-transform: uppercase;
        }
        .summary-price-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text2);
        }
        .summary-price {
          color: var(--accent);
          font-weight: 700;
        }

        .summary-totals {
          border-top: 1px solid var(--border);
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text2);
        }
        .totals-row.grand {
          font-family: 'DM Serif Display', serif;
          font-size: 20px;
          color: var(--text);
          border-top: 1px solid var(--border);
          padding-top: 12px;
          margin-top: 4px;
        }
        .totals-row.grand span:last-child {
          color: var(--accent);
        }

        .error-message {
          background: rgba(255, 90, 90, 0.08);
          border: 1px solid #FF5A5A;
          color: #FF7777;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 13px;
          margin-bottom: 20px;
          text-align: center;
        }

        /* SUCCESS SCREEN */
        .success-card {
          max-width: 600px;
          margin: 60px auto;
          background: var(--surface);
          border: 1px solid var(--accent);
          border-radius: var(--radius);
          padding: 48px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        .success-icon {
          font-size: 56px;
          color: var(--accent);
          animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .success-title {
          font-family: 'DM Serif Display', serif;
          font-size: 32px;
          color: var(--text);
        }
        .success-order-id {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent);
          background: rgba(201,168,76,0.08);
          padding: 8px 18px;
          border-radius: 20px;
          border: 1px solid rgba(201,168,76,0.25);
        }
        .success-desc {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text2);
          max-width: 440px;
        }
        .success-summary {
          width: 100%;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 24px;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 12px;
        }
        .success-summary h4 {
          font-family: 'DM Serif Display', serif;
          font-size: 16px;
          color: var(--text);
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }
        .success-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text2);
        }
        .success-row strong {
          color: var(--text);
        }

        .btn-success {
          background: var(--accent);
          color: #1A1100;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          padding: 14px 28px;
          border-radius: 30px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          margin-top: 12px;
          box-shadow: 0 4px 14px rgba(201, 168, 76, 0.25);
        }
        .btn-success:hover {
          background: var(--accent2);
          transform: translateY(-1px);
        }

        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }

        @media (max-width: 768px) {
          .checkout-container { padding: 40px 20px; }
          .checkout-grid { grid-template-columns: 1fr; gap: 32px; }
          .checkout-card { padding: 24px; }
          .form-row { grid-template-columns: 1fr; gap: 0; }
          .form-group.full { grid-column: auto; }
          .success-card { padding: 32px 24px; margin: 30px 20px; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="navbar">
        <a href="/" className="nav-brand">
          ❧ <span>Frame</span>Studio
        </a>
        <a href="/customize" className="btn-back">
          ← Return to Customizer
        </a>
      </nav>

      {/* BODY */}
      <div className="checkout-container">
        {orderSuccess ? (
          <div className="success-card">
            <div className="success-icon">❧</div>
            <h2 className="success-title">Order Placed!</h2>
            <div className="success-order-id">Reference: {orderId}</div>
            <p className="success-desc">
              Thank you for framing with us. Our master craftsmen in Pakistan will begin hand-building your premium customized frames immediately. 
            </p>
            <div className="success-summary">
              <h4>Delivery Details</h4>
              <div className="success-row">
                <span>Recipient:</span>
                <strong>{formData.name}</strong>
              </div>
              <div className="success-row">
                <span>Phone:</span>
                <strong>{formData.phone}</strong>
              </div>
              <div className="success-row">
                <span>Delivery Address:</span>
                <strong style={{ textAlign: "right", maxWidth: "250px" }}>
                  {formData.address}, {formData.city}, {formData.state} {formData.zip}
                </strong>
              </div>
              <div className="success-row" style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "4px" }}>
                <span>Amount to Pay (COD):</span>
                <strong style={{ color: "var(--accent)", fontSize: "16px" }}>Rs. {total.toLocaleString()}</strong>
              </div>
            </div>
            <a href="/" className="btn-success">Back to Gallery</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="checkout-main-form">
            <div className="checkout-grid">
              
              {/* LEFT COLUMN FORM */}
              <div className="checkout-main">
                {errorMsg && <div className="error-message">{errorMsg}</div>}
                
                <div className="checkout-card">
                  <h3 className="card-title">1. Delivery Information</h3>
                  
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="e.g. Ali Khan"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="e.g. ali@example.com"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        placeholder="e.g. +92 300 1234567"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Street Address</label>
                    <input
                      type="text"
                      name="address"
                      className="form-control"
                      placeholder="House, Street, Area"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        name="city"
                        className="form-control"
                        placeholder="e.g. Lahore"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label>Province/State</label>
                        <input
                          type="text"
                          name="state"
                          className="form-control"
                          placeholder="e.g. Punjab"
                          value={formData.state}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label>ZIP Code</label>
                        <input
                          type="text"
                          name="zip"
                          className="form-control"
                          placeholder="ZIP"
                          value={formData.zip}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="checkout-card">
                  <h3 className="card-title">2. Payment Method</h3>
                  
                  <div className="cod-badge">
                    <div className="cod-icon">💵</div>
                    <div className="cod-details">
                      <h4>Cash on Delivery Only</h4>
                      <p>
                        Pay directly in cash (PKR) to our courier agent when your handcrafted matted frames arrive at your home. No credit cards or prepayment required.
                      </p>
                    </div>
                  </div>

                  <button type="submit" className="btn-order" disabled={isSubmitting}>
                    {isSubmitting ? "Placing Order..." : "Place Order (Cash on Delivery)"}
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN SUMMARY */}
              <div className="checkout-sidebar">
                <h3 className="sidebar-title">Order Summary</h3>
                
                <div className="summary-items-list">
                  {cartItems.length === 0 ? (
                    <div style={{ color: "var(--text2)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
                      No custom frames in order summary.
                    </div>
                  ) : (
                    cartItems.map((item, idx) => (
                      <div key={idx} className="summary-item">
                        <div className="summary-thumb" style={{ background: item.frameColor }}>
                          {item.image ? (
                            <img src={item.image} alt={item.frameName} />
                          ) : (
                            <div className="summary-thumb-placeholder">❧</div>
                          )}
                        </div>
                        <div className="summary-details">
                          <h4 className="summary-name">{item.frameName}</h4>
                          <span className="summary-meta">{item.rotation !== 0 ? `Rotated ${item.rotation}°` : "Portrait"}</span>
                          <div className="summary-price-row">
                            <span>Qty: {item.quantity}</span>
                            <span className="summary-price">{item.price}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="summary-totals">
                  <div className="totals-row">
                    <span>Subtotal</span>
                    <span>Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="totals-row">
                    <span>Courier Delivery (COD)</span>
                    <span>{shipping > 0 ? `Rs. ${shipping.toLocaleString()}` : "Rs. 0"}</span>
                  </div>
                  <div className="totals-row grand">
                    <span>Grand Total</span>
                    <span>Rs. {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>
          </form>
        )}
      </div>
    </div>
  );
}
