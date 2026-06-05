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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getSubtotal = () => {
    return cartItems.reduce((acc, item) => {
      const priceVal = parseInt((item.price || "0").replace(/[^0-9]/g, "")) || 0;
      return acc + priceVal * item.quantity;
    }, 0);
  };

  const subtotal = getSubtotal();
  const shipping = subtotal > 0 ? 250 : 0;
  const total = subtotal + shipping;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (cartItems.length === 0) {
      setErrorMsg("Your cart is empty. Please add a frame to customize first!");
      return;
    }

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
              return item;
            }
          }
          return item;
        })
      );

      const orderData = {
        customer: formData,
        items: processedItems,
        subtotal,
        shipping,
        total,
        orderId: randomId,
        status: "Pending",
        createdAt: Date.now(),
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
      <style dangerouslySetInnerHTML={{ __html: `
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .checkout-root {
          font-family: var(--font-serif);
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* ── NAVBAR ── */
        .navbar {
          height: 72px;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 1000;
          position: sticky;
          top: 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
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
        .btn-back {
          color: var(--text2);
          text-decoration: none;
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: color 0.15s ease;
          white-space: nowrap;
        }
        .btn-back:hover { color: var(--accent); }

        /* ── LAYOUT ── */
        .checkout-container {
          flex: 1;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 52px 40px;
        }

        /* ── GRID ── */
        .checkout-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 48px;
          align-items: start;
        }

        /* ── FORM COLUMN ── */
        .checkout-main {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .checkout-card {
          background: linear-gradient(135deg, var(--surface) 0%, #100D0B 100%);
          border: 6px solid #1C0F07;
          outline: 1px solid var(--accent);
          outline-offset: -5px;
          border-radius: var(--radius);
          padding: 32px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.6);
        }
        .card-title {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--accent);
          margin-bottom: 22px;
          border-bottom: 2px solid #1C0F07;
          padding-bottom: 12px;
          letter-spacing: 0.05em;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
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
          padding: 12px 16px;
          font-family: var(--font-typewriter);
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s ease;
          width: 100%;
          -webkit-appearance: none;
          appearance: none;
        }
        .form-control:focus { border-color: var(--accent); }

        /* sub-row */
        .sub-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .sub-row .form-group { margin-bottom: 0; }

        /* ── COD ── */
        .cod-badge {
          background: rgba(212, 175, 55, 0.03);
          border: 1.5px dashed var(--accent);
          border-radius: var(--radius);
          padding: 18px;
          display: flex;
          gap: 14px;
          align-items: flex-start;
          margin-top: 12px;
        }
        .cod-icon { font-size: 26px; color: var(--accent); line-height: 1; flex-shrink: 0; }
        .cod-details h4 {
          font-family: var(--font-display);
          font-size: 15px;
          color: var(--accent);
          margin-bottom: 4px;
        }
        .cod-details p { font-size: 13px; line-height: 1.6; color: var(--text2); }

        .btn-order {
          width: 100%;
          margin-top: 22px;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .btn-order:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── SIDEBAR ── */
        .checkout-sidebar {
          background: linear-gradient(135deg, var(--surface) 0%, #100D0B 100%);
          border: 6px solid #1C0F07;
          outline: 1px solid var(--accent);
          outline-offset: -5px;
          border-radius: var(--radius);
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 22px;
          position: sticky;
          top: 96px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.6);
        }
        .sidebar-title {
          font-family: var(--font-display);
          font-size: 18px;
          color: var(--accent);
          border-bottom: 2px solid #1C0F07;
          padding-bottom: 12px;
          letter-spacing: 0.05em;
        }
        .summary-items-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-height: 260px;
          overflow-y: auto;
        }
        .summary-item { 
          display: flex; 
          gap: 12px; 
          align-items: center; 
          background: var(--surface2);
          border: 2px solid #1C0F07;
          padding: 8px;
          border-radius: var(--radius);
        }
        .summary-thumb {
          width: 48px; height: 48px;
          border-radius: var(--radius);
          display: flex;
          flex-shrink: 0;
          padding: 3px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .summary-thumb img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius); }
        .summary-thumb-placeholder {
          flex: 1;
          background: #2D2822;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: rgba(201,168,76,0.15);
        }
        .summary-details { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .summary-name {
          font-family: var(--font-display);
          font-size: 13px;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .summary-meta { font-family: var(--font-typewriter); font-size: 9px; color: var(--text2); text-transform: uppercase; }
        .summary-price-row { display: flex; justify-content: space-between; font-size: 12px; color: var(--text2); }
        .summary-price { font-family: var(--font-typewriter); color: var(--accent); font-weight: 700; }

        .summary-totals {
          border-top: 2px solid #1C0F07;
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .totals-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text2); }
        .totals-row.grand {
          font-family: var(--font-display);
          font-size: 18px;
          color: var(--text);
          border-top: 2px solid #1C0F07;
          padding-top: 12px;
          margin-top: 4px;
        }
        .totals-row.grand span:last-child { font-family: var(--font-typewriter); color: var(--accent); }

        .error-message {
          background: rgba(255, 90, 90, 0.08);
          border: 1px solid #FF5A5A;
          color: #FF7777;
          border-radius: var(--radius);
          padding: 12px 16px;
          font-size: 13px;
          margin-bottom: 16px;
          text-align: center;
          font-family: var(--font-typewriter);
        }

        /* ── SUCCESS ── */
        .success-card {
          max-width: 560px;
          margin: 52px auto;
          background: linear-gradient(135deg, var(--surface) 0%, #100D0B 100%);
          border: 6px solid #1C0F07;
          outline: 1.5px solid var(--accent);
          outline-offset: -5px;
          border-radius: var(--radius);
          padding: 48px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.7);
        }
        .success-icon { font-size: 52px; color: var(--accent); animation: scaleIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275); }
        .success-title { font-family: var(--font-display); font-size: 30px; color: var(--accent); letter-spacing: 0.05em; }
        .success-order-id {
          font-family: var(--font-typewriter);
          font-size: 12px; font-weight: 700;
          color: var(--accent);
          background: rgba(201,168,76,0.08);
          padding: 8px 16px; border-radius: var(--radius);
          border: 1px solid rgba(201,168,76,0.25);
        }
        .success-desc { font-size: 14px; line-height: 1.6; color: var(--text2); max-width: 420px; }
        .success-summary {
          width: 100%;
          background: var(--surface2);
          border: 3px solid #1C0F07;
          outline: 1px solid var(--border);
          outline-offset: -3px;
          border-radius: var(--radius);
          padding: 20px;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 8px;
        }
        .success-summary h4 {
          font-family: var(--font-display);
          font-size: 15px; color: var(--accent);
          border-bottom: 2px solid #1C0F07;
          padding-bottom: 8px;
          letter-spacing: 0.05em;
        }
        .success-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text2); gap: 12px; }
        .success-row strong { color: var(--text); text-align: right; }
        .btn-success {
          margin-top: 8px;
        }

        @keyframes scaleIn {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }

        /* ── TABLET ── */
        @media (max-width: 900px) {
          .checkout-container { padding: 36px 28px; }
          .checkout-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .checkout-sidebar {
            position: static;
            order: -1;
          }
        }

        /* ── MOBILE ── */
        @media (max-width: 580px) {
          .navbar { padding: 0 16px; height: 54px; }
          .nav-logo-img { height: 32px; }
          .btn-back { font-size: 11px; }
          .checkout-container {
            padding: 20px 16px 48px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .checkout-main-form { width: 100%; }
          .checkout-grid {
            width: 100%;
            grid-template-columns: 1fr;
            gap: 18px;
          }
          .checkout-card  { padding: 18px 16px; border-radius: var(--radius); }
          .checkout-sidebar { padding: 18px 16px; border-radius: var(--radius); }
          .card-title     { font-size: 18px; margin-bottom: 16px; }
          .sidebar-title  { font-size: 17px; }
          .form-row { grid-template-columns: 1fr !important; gap: 0; margin-bottom: 0; }
          .sub-row { grid-template-columns: 1fr 1fr; gap: 10px; }
          .form-group { margin-bottom: 14px; }
          .form-group label { font-size: 10px; }
          .form-control { padding: 13px 14px; }
          .cod-badge { padding: 14px; gap: 12px; }
          .cod-icon  { font-size: 22px; }
          .cod-details h4 { font-size: 13px; }
          .cod-details p  { font-size: 11px; }
          .btn-order { padding: 17px; font-size: 13px; margin-top: 18px; border-radius: 9999px !important; }
          .summary-items-list { max-height: 190px; }
          .totals-row.grand   { font-size: 17px; }
          .success-card  { margin: 20px 0 40px; padding: 28px 18px; border-radius: var(--radius); gap: 14px; }
          .success-title { font-size: 24px; }
          .success-icon  { font-size: 42px; }
          .success-summary { padding: 16px; }
          .success-row   { font-size: 12px; }
        }
      ` }} />

      {/* NAVBAR */}
      <nav className="navbar">
        <a href="/" className="nav-brand">
          <img src="/images/logo-white.png" alt="Yaadein Logo" className="nav-logo-img" />
        </a>
        <a href="/customize" className="btn-back">← Return to Customizer</a>
      </nav>

      {/* BODY */}
      <div className="checkout-container">
        {orderSuccess ? (
          <div className="success-card">
            <div className="success-icon">✓</div>
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
                <strong style={{ textAlign: "right", maxWidth: "220px" }}>
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

              {/* ── LEFT: FORM ── */}
              <div className="checkout-main">
                {errorMsg && <div className="error-message">{errorMsg}</div>}

                <div className="checkout-card">
                  <h3 className="card-title">1. Delivery Information</h3>

                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text" name="name" className="form-control"
                      placeholder="e.g. Ali Khan"
                      value={formData.name} onChange={handleChange}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email" name="email" className="form-control"
                        placeholder="e.g. ali@example.com"
                        value={formData.email} onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel" name="phone" className="form-control"
                        placeholder="e.g. +92 300 1234567"
                        value={formData.phone} onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Street Address</label>
                    <input
                      type="text" name="address" className="form-control"
                      placeholder="House, Street, Area"
                      value={formData.address} onChange={handleChange}
                    />
                  </div>

                  {/* City row */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text" name="city" className="form-control"
                        placeholder="e.g. Lahore"
                        value={formData.city} onChange={handleChange}
                      />
                    </div>

                    {/* Province + ZIP always side-by-side via sub-row */}
                    <div className="sub-row">
                      <div className="form-group">
                        <label>Province / State</label>
                        <input
                          type="text" name="state" className="form-control"
                          placeholder="e.g. Punjab"
                          value={formData.state} onChange={handleChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>ZIP Code</label>
                        <input
                          type="text" name="zip" className="form-control"
                          placeholder="ZIP"
                          value={formData.zip} onChange={handleChange}
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
                    {isSubmitting ? "Placing Order…" : "Place Order (Cash on Delivery)"}
                  </button>
                </div>
              </div>

              {/* ── RIGHT: ORDER SUMMARY ── */}
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
                            <div className="summary-thumb-placeholder">Y</div>
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
