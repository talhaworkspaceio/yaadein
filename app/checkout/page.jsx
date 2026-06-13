"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { ref, push, set, onValue } from "firebase/database";

const CLOUDINARY_CLOUD = "hpikhwjw";
const CLOUDINARY_PRESET = "ml_default";

const UPSELL_SERVICES = [
  {
    id: "editing",
    name: "Photo Editing",
    price: 499,
    icon: "📷",
    desc: "Professional color grading, blemish removal, and brightness adjustment."
  },
  {
    id: "restoration",
    name: "Old Photo Restoration",
    price: 1499,
    icon: "🎨",
    desc: "Repair cracks, restore faded colors, and upscale resolutions."
  },
  {
    id: "boardgames",
    name: "Board Games",
    price: 2499,
    icon: "🎲",
    desc: "Custom framing setup suited for game prints, puzzle setups, or cards."
  },
  {
    id: "nikkah",
    name: "Nikkah Naama",
    price: 3999,
    icon: "📜",
    desc: "Premium frame treatment with elegant marriage certificate matting style."
  }
];


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

const getWhatsAppNumber = (phone) => {
  if (!phone) return "";
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = "92" + clean.slice(1);
  }
  if (clean.length === 10 && !clean.startsWith("92")) {
    clean = "92" + clean;
  }
  return clean;
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
  const [selectedServices, setSelectedServices] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("EasyPaisa");
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [deliveryCharges, setDeliveryCharges] = useState(250);

  useEffect(() => {
    const settingsRef = ref(db, "settings/deliveryCharges");
    const unsub = onValue(settingsRef, (snapshot) => {
      const val = snapshot.val();
      if (val !== null) {
        setDeliveryCharges(parseInt(val) ?? 250);
      }
    });
    return () => unsub();
  }, []);

  const toggleService = (service) => {
    if (selectedServices.some(s => s.id === service.id)) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setPaymentReceipt(uploadEvent.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReceipt = () => {
    setPaymentReceipt(null);
  };

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

  const getCartSubtotal = () => {
    return cartItems.reduce((acc, item) => {
      const priceVal = parseInt((item.price || "0").replace(/[^0-9]/g, "")) || 0;
      return acc + priceVal * item.quantity;
    }, 0);
  };

  const framesSubtotal = getCartSubtotal();
  const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const subtotal = framesSubtotal + servicesTotal;
  const shipping = framesSubtotal > 0 ? deliveryCharges : 0;
  const total = subtotal + shipping;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (cartItems.length === 0) {
      setErrorMsg("Your cart is empty. Please add a frame first!");
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

    if (!paymentReceipt) {
      setErrorMsg("Please upload a screenshot of your payment receipt to complete order verification.");
      return;
    }

    setIsSubmitting(true);
    const randomId = "FS-" + Math.floor(100000 + Math.random() * 900000);

    try {
      // 1. Upload payment receipt screenshot
      let receiptUrl = "";
      try {
        const dataUpload = new FormData();
        dataUpload.append("file", paymentReceipt);
        dataUpload.append("upload_preset", CLOUDINARY_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
          method: "POST",
          body: dataUpload,
        });
        if (!res.ok) {
          throw new Error("Failed to upload payment receipt");
        }
        const result = await res.json();
        receiptUrl = result.secure_url;
        setPaymentReceipt(receiptUrl);
      } catch (err) {
        console.error("Receipt upload error:", err);
        setErrorMsg("Failed to upload payment receipt screenshot securely. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // 2. Process cart items
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

      const serviceItems = selectedServices.map(s => ({
        id: `service-${s.id}`,
        frameName: `${s.name} (Service Upgrade)`,
        price: `Rs. ${s.price.toLocaleString()}`,
        quantity: 1,
        frameColor: "#1C0F07",
        size: "Service Upgrade",
        orientation: "N/A",
        image: ""
      }));

      const orderData = {
        customer: {
          ...formData,
          fullName: formData.name // Safe mapping for order tracking page recipient view
        },
        items: [...processedItems, ...serviceItems],
        subtotal,
        shipping,
        total,
        orderId: randomId,
        paymentMethod,
        paymentReceiptUrl: receiptUrl,
        status: "Pending",
        createdAt: Date.now(),
      };

      const ordersRef = ref(db, "orders");
      const newOrderRef = push(ordersRef);
      await set(newOrderRef, orderData);

      setOrderId(randomId);
      setOrderSuccess(true);

      // Automated WhatsApp order confirmation message redirect
      try {
        const messageText = `*Yaadein Order Confirmation* 🌟\n\n` +
          `Order Reference: *${randomId}*\n` +
          `Customer Name: *${formData.name}*\n` +
          `Phone: *${formData.phone}*\n` +
          `Address: *${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}*\n` +
          `Payment Method: *${paymentMethod}*\n` +
          `Grand Total: *Rs. ${total.toLocaleString()}*\n\n` +
          `Please find the attached receipt screenshot below. Thank you!`;
        const whatsappUrl = `https://wa.me/${getWhatsAppNumber(formData.phone)}?text=${encodeURIComponent(messageText)}`;
        if (typeof window !== "undefined") {
          window.open(whatsappUrl, "_blank");
        }
      } catch (err) {
        console.error("Error launching WhatsApp:", err);
      }

      // Save to recent orders list
      if (typeof window !== "undefined") {
        try {
          const recent = JSON.parse(localStorage.getItem("recent_orders") || "[]");
          if (!recent.includes(randomId)) {
            recent.unshift(randomId);
            localStorage.setItem("recent_orders", JSON.stringify(recent.slice(0, 5)));
          }
        } catch (e) {
          console.error("Error storing order ID locally:", e);
        }
      }

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
      <style dangerouslySetInnerHTML={{
        __html: `
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

        /* ── RECEIPT UPLOADER ── */
        .receipt-uploader-zone {
          margin-top: 18px;
          border: 2px dashed rgba(181, 139, 92, 0.3);
          border-radius: var(--radius);
          padding: 24px;
          text-align: center;
          background: rgba(30, 25, 20, 0.2);
          transition: all 0.3s ease;
          position: relative;
          cursor: pointer;
        }
        .receipt-uploader-zone:hover {
          border-color: var(--accent);
          background: rgba(181, 139, 92, 0.03);
        }
        .upload-receipt-input {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 10;
        }
        .uploader-prompt-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          pointer-events: none;
        }
        .uploader-prompt-icon {
          font-size: 32px;
          color: var(--accent);
        }
        .uploader-prompt-title {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }
        .uploader-prompt-desc {
          font-size: 11px;
          color: var(--text2);
        }

        .receipt-preview-container {
          margin-top: 18px;
          border: 2px solid rgba(181, 139, 92, 0.25);
          border-radius: var(--radius);
          background: rgba(30, 25, 20, 0.5);
          overflow: hidden;
          position: relative;
        }
        .receipt-preview-image-wrapper {
          width: 100%;
          max-height: 340px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0A0806;
          cursor: pointer;
          position: relative;
        }
        .receipt-preview-image-wrapper img {
          width: 100%;
          max-height: 340px;
          object-fit: contain;
          display: block;
          transition: transform 0.3s ease;
        }
        .receipt-preview-image-wrapper:hover img {
          transform: scale(1.02);
        }
        .receipt-preview-image-wrapper::after {
          content: 'Click to view full size';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 8px;
          background: linear-gradient(transparent, rgba(0,0,0,0.7));
          color: rgba(255,255,255,0.5);
          font-size: 10px;
          text-align: center;
          font-family: var(--font-display);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .receipt-preview-image-wrapper:hover::after {
          opacity: 1;
        }
        .receipt-preview-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-top: 1px solid rgba(181, 139, 92, 0.15);
          background: rgba(20, 17, 14, 0.6);
        }
        .receipt-preview-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .receipt-preview-check {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(68, 212, 136, 0.12);
          border: 1.5px solid #44D488;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #44D488;
          flex-shrink: 0;
        }
        .receipt-preview-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .receipt-preview-title {
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 600;
          color: var(--text);
        }
        .receipt-preview-status {
          font-size: 10px;
          color: #44D488;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .btn-remove-receipt {
          background: none;
          border: 1px solid rgba(255, 90, 90, 0.3);
          color: #FF7777;
          font-family: var(--font-display);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 6px 14px;
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .btn-remove-receipt:hover {
          background: rgba(255, 90, 90, 0.08);
          border-color: #FF5A5A;
          color: #FF5A5A;
        }

        /* ── RECEIPT LIGHTBOX ── */
        .receipt-lightbox-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          cursor: zoom-out;
          animation: fadeInLightbox 0.25s ease;
        }
        .receipt-lightbox-overlay img {
          max-width: 90vw;
          max-height: 85vh;
          object-fit: contain;
          border-radius: var(--radius);
          box-shadow: 0 20px 60px rgba(0,0,0,0.8);
          border: 2px solid rgba(181, 139, 92, 0.3);
        }
        .receipt-lightbox-close {
          position: absolute;
          top: 20px;
          right: 24px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .receipt-lightbox-close:hover {
          background: rgba(255,255,255,0.2);
        }
        @keyframes fadeInLightbox {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* ── DELIVERY NOTIFICATION ── */
        .delivery-timeline-note {
          background: rgba(181, 139, 92, 0.04);
          border: 1px solid rgba(181, 139, 92, 0.2);
          border-radius: var(--radius);
          padding: 14px 18px;
          margin-top: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
        }
        .delivery-timeline-icon {
          font-size: 20px;
          color: var(--accent);
          flex-shrink: 0;
        }
        .delivery-timeline-text {
          font-size: 12px;
          line-height: 1.5;
          color: var(--text2);
        }
        .delivery-timeline-text strong {
          color: var(--accent);
        }

        /* ── ADDITIONAL SERVICES UPSELL ── */
        .services-upsell-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-top: 10px;
        }
        .upsell-card {
          background: rgba(30, 25, 20, 0.4);
          border: 2px solid #1C0F07;
          border-radius: var(--radius);
          padding: 18px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
          text-align: left;
        }
        .upsell-card:hover {
          border-color: rgba(181, 139, 92, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0,0,0,0.4);
        }
        .upsell-card.selected {
          border-color: var(--accent);
          background: rgba(181, 139, 92, 0.05);
          box-shadow: 0 0 15px rgba(181, 139, 92, 0.15);
        }
        .upsell-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .upsell-icon {
          font-size: 24px;
        }
        .upsell-price {
          font-family: var(--font-typewriter);
          font-size: 13px;
          font-weight: 700;
          color: var(--accent);
        }
        .upsell-name {
          font-family: var(--font-display);
          font-size: 14px;
          color: var(--text);
          font-weight: 600;
        }
        .upsell-desc {
          font-size: 12px;
          color: var(--text2);
          line-height: 1.5;
          flex-grow: 1;
        }
        .btn-upsell-action {
          width: 100%;
          background: transparent;
          border: 1px solid rgba(181, 139, 92, 0.3);
          color: var(--accent);
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 8px;
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .upsell-card:hover .btn-upsell-action {
          background: rgba(181, 139, 92, 0.05);
          border-color: var(--accent);
        }
        .upsell-card.selected .btn-upsell-action {
          background: var(--accent);
          color: #1A1100;
          border-color: var(--accent);
        }

        /* ── PAYMENT TABS ── */
        .payment-tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
          margin-top: 12px;
        }
        .payment-tab-btn {
          background: rgba(30, 25, 20, 0.4);
          border: 2px solid #1C0F07;
          color: var(--text2);
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 600;
          padding: 14px;
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .payment-tab-btn:hover {
          border-color: rgba(181, 139, 92, 0.3);
          color: var(--text);
        }
        .payment-tab-btn.active {
          border-color: var(--accent);
          background: rgba(181, 139, 92, 0.05);
          color: var(--accent);
        }
        .payment-tab-icon {
          font-size: 20px;
        }

        .payment-method-details-box {
          background: rgba(20, 16, 12, 0.6);
          border: 1px solid var(--border2);
          border-radius: var(--radius);
          padding: 20px;
          margin-top: 16px;
          text-align: left;
        }
        .payment-details-pane strong {
          font-family: var(--font-display);
          font-size: 14px;
          color: var(--accent);
          display: block;
          margin-bottom: 8px;
        }
        .payment-details-pane p {
          font-size: 13px;
          line-height: 1.6;
          color: var(--text2);
          margin-bottom: 14px;
        }
        .pane-info-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          border-bottom: 1px dashed rgba(181,139,92,0.1);
          padding: 8px 0;
        }
        .pane-info-row span {
          color: var(--text2);
        }
        .pane-info-row strong {
          font-family: var(--font-typewriter);
          color: var(--text);
          display: inline;
          margin-bottom: 0;
        }

        /* ── SUCCESS SCREEN PAYMENT INSTRUCTIONS ── */
        .payment-instructions-card {
          width: 100%;
          background: rgba(181, 139, 92, 0.04);
          border: 2px dashed var(--accent);
          border-radius: var(--radius);
          padding: 20px;
          text-align: left;
          margin-top: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .payment-instructions-card h4 {
          font-family: var(--font-display);
          font-size: 14px;
          color: var(--accent);
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .payment-instructions-card p {
          font-size: 13px;
          line-height: 1.6;
          color: var(--text2);
          margin-bottom: 12px;
        }
        .account-info-box {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(181, 139, 92, 0.2);
          padding: 12px;
          border-radius: var(--radius);
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .account-info-box div {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }
        .account-info-box div span {
          color: var(--text2);
        }
        .account-info-box div strong {
          color: var(--text);
          font-family: var(--font-typewriter);
        }
        .instruction-note {
          font-size: 12px !important;
          line-height: 1.5;
          color: var(--accent) !important;
          font-style: italic;
          margin-bottom: 0 !important;
        }
      ` }} />

      {/* NAVBAR */}
      <nav className="navbar">
        <a href="/" className="nav-brand">
          <img src="/images/logo-white.png" alt="Yaadein Logo" className="nav-logo-img" />
        </a>
        <a href="/catalog" className="btn-back">← Return to Catalog</a>
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
                <div className="success-row">
                  <span>Payment Method:</span>
                  <strong>{paymentMethod}</strong>
                </div>
              </div>
              <div className="success-row" style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "4px" }}>
                <span>Amount Transferred:</span>
                <strong style={{ color: "var(--accent)", fontSize: "16px" }}>Rs. {total.toLocaleString()}</strong>
              </div>
            </div>

            {paymentReceipt && (
              <div className="success-summary" style={{ marginTop: "14px", textRendering: "optimizeLegibility" }}>
                <h4>Payment Receipt Submitted</h4>
                <div style={{ width: "100%", height: "140px", borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid rgba(181,139,92,0.2)", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={paymentReceipt} alt="Receipt Screenshot" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
                <p style={{ fontSize: "11px", color: "#44D488", marginTop: "6px", textAlign: "center" }}>✓ Screenshot attached and saved securely.</p>
              </div>
            )}

            <div className="payment-instructions-card">
              <h4>Prepaid Transfer Instructions</h4>
              {paymentMethod === "EasyPaisa" && (
                <div className="instruction-details">
                  <p>Please transfer the total of <strong>Rs. {total.toLocaleString()}</strong> to our EasyPaisa mobile account:</p>
                  <div className="account-info-box">
                    <div><span>Account Title:</span> <strong>Yaadein Art Studio</strong></div>
                    <div><span>Mobile Number:</span> <strong>0300-1234567</strong></div>
                  </div>
                  <p className="instruction-note">Once paid, share the payment receipt screenshot with Reference ID <strong>{orderId}</strong> on WhatsApp at <strong>+92 300 7001977</strong>.</p>
                </div>
              )}
              {paymentMethod === "JazzCash" && (
                <div className="instruction-details">
                  <p>Please transfer the total of <strong>Rs. {total.toLocaleString()}</strong> to our JazzCash mobile account:</p>
                  <div className="account-info-box">
                    <div><span>Account Title:</span> <strong>Yaadein Art Studio</strong></div>
                    <div><span>Mobile Number:</span> <strong>0300-7654321</strong></div>
                  </div>
                  <p className="instruction-note">Once paid, share the payment receipt screenshot with Reference ID <strong>{orderId}</strong> on WhatsApp at <strong>+92 300 7001977</strong>.</p>
                </div>
              )}
              {paymentMethod === "Bank Transfer" && (
                <div className="instruction-details">
                  <p>Please transfer the total of <strong>Rs. {total.toLocaleString()}</strong> to our Bank account via banking app or ATM:</p>
                  <div className="account-info-box">
                    <div><span>Bank Name:</span> <strong>Bank Alfalah</strong></div>
                    <div><span>Account Title:</span> <strong>Yaadein Art Studio</strong></div>
                    <div><span>Account Number:</span> <strong>0123-4567-8910-1112</strong></div>
                    <div><span>IBAN:</span> <strong>PK12ALFH0123456789101112</strong></div>
                  </div>
                  <p className="instruction-note">Once paid, email the transaction receipt or WhatsApp to <strong>+92 300 7001977</strong> with Reference ID <strong>{orderId}</strong>.</p>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", marginTop: "16px" }}>
              <a
                href={`https://wa.me/${getWhatsAppNumber(formData.phone)}?text=${encodeURIComponent(
                  `*Yaadein Order Confirmation* 🌟\n\n` +
                  `Order Reference: *${orderId}*\n` +
                  `Customer Name: *${formData.name}*\n` +
                  `Phone: *${formData.phone}*\n` +
                  `Address: *${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}*\n` +
                  `Payment Method: *${paymentMethod}*\n` +
                  `Grand Total: *Rs. ${total.toLocaleString()}*\n\n` +
                  `Please find the attached receipt screenshot below. Thank you!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-success"
                style={{
                  textAlign: "center",
                  width: "100%",
                  background: "#25D366 !important",
                  color: "#FFFFFF !important",
                  boxShadow: "0 4px 15px rgba(37, 211, 102, 0.25)"
                }}
              >
                💬 Confirm Order on WhatsApp
              </a>
              <a href={`/track-order?id=${orderId}`} className="btn-success" style={{ textAlign: "center", width: "100%" }}>
                Track Order Status
              </a>
              <a href="/" className="btn-success" style={{
                textAlign: "center",
                width: "100%",
                background: "rgba(20, 17, 14, 0.6) !important",
                border: "1.5px solid var(--accent) !important",
                color: "var(--accent) !important",
                boxShadow: "none"
              }}>
                Back to Gallery
              </a>
            </div>
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

                  {/* Delivery Timeline Note */}
                  <div className="delivery-timeline-note">
                    <span className="delivery-timeline-icon">🚚</span>
                    <p className="delivery-timeline-text">
                      <strong>14-Day Standard Delivery:</strong> Because every frame is custom handcrafted to your specifications by our master craftsmen, please allow up to <strong>14 working days</strong> for production and shipment delivery.
                    </p>
                  </div>
                </div>

                {/* ── SECTION 2: ADDITIONAL SERVICES UPSELL ── */}
                <div className="checkout-card">
                  <h3 className="card-title">2. Enhance Your Memories</h3>
                  <p style={{ color: "var(--text2)", fontSize: "13px", marginBottom: "18px", lineHeight: "1.5", textAlign: "left" }}>
                    Select professional studio services to complement your premium handcrafted frames.
                  </p>
                  <div className="services-upsell-grid">
                    {UPSELL_SERVICES.map((service) => {
                      const isSelected = selectedServices.some(s => s.id === service.id);
                      return (
                        <div
                          key={service.id}
                          className={`upsell-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleService(service)}
                        >
                          <div className="upsell-header">
                            <span className="upsell-icon">{service.icon}</span>
                            <span className="upsell-price">+Rs. {service.price.toLocaleString()}</span>
                          </div>
                          <h4 className="upsell-name">{service.name}</h4>
                          <p className="upsell-desc">{service.desc}</p>
                          <button
                            type="button"
                            className={`btn-upsell-action ${isSelected ? 'added' : ''}`}
                          >
                            {isSelected ? "✓ Added" : "+ Add Service"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── SECTION 3: PAYMENT OPTIONS ── */}
                <div className="checkout-card">
                  <h3 className="card-title">3. Payment Method</h3>
                  <p style={{ color: "var(--text2)", fontSize: "13px", marginBottom: "18px", textAlign: "left" }}>
                    We support secure prepaid digital transfers. Please select your preferred method:
                  </p>

                  <div className="payment-tabs">
                    <button
                      type="button"
                      className={`payment-tab-btn ${paymentMethod === 'EasyPaisa' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('EasyPaisa')}
                    >
                      <span className="payment-tab-icon">📱</span>
                      EasyPaisa
                    </button>
                    <button
                      type="button"
                      className={`payment-tab-btn ${paymentMethod === 'JazzCash' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('JazzCash')}
                    >
                      <span className="payment-tab-icon">💸</span>
                      JazzCash
                    </button>
                    <button
                      type="button"
                      className={`payment-tab-btn ${paymentMethod === 'Bank Transfer' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('Bank Transfer')}
                    >
                      <span className="payment-tab-icon">🏦</span>
                      Bank Transfer
                    </button>
                  </div>

                  <div className="payment-method-details-box">
                    {paymentMethod === 'EasyPaisa' && (
                      <div className="payment-details-pane">
                        <strong>EasyPaisa Mobile Wallet</strong>
                        <p>Transfer the final invoice amount directly to our EasyPaisa account. Share receipt screenshot on WhatsApp to initiate production.</p>
                        <div className="pane-info-row">
                          <span>Account Title:</span> <strong>Yaadein Art Studio</strong>
                        </div>
                        <div className="pane-info-row">
                          <span>Mobile Number:</span> <strong>0300-1234567</strong>
                        </div>
                      </div>
                    )}
                    {paymentMethod === 'JazzCash' && (
                      <div className="payment-details-pane">
                        <strong>JazzCash Mobile Wallet</strong>
                        <p>Transfer the final invoice amount directly to our JazzCash account. Share receipt screenshot on WhatsApp to initiate production.</p>
                        <div className="pane-info-row">
                          <span>Account Title:</span> <strong>Yaadein Art Studio</strong>
                        </div>
                        <div className="pane-info-row">
                          <span>Mobile Number:</span> <strong>0300-7654321</strong>
                        </div>
                      </div>
                    )}
                    {paymentMethod === 'Bank Transfer' && (
                      <div className="payment-details-pane">
                        <strong>Direct Bank Transfer</strong>
                        <p>Transfer the final invoice amount to our Bank Alfalah business account via internet banking, ATM, or bank deposit.</p>
                        <div className="pane-info-row">
                          <span>Bank Name:</span> <strong>Bank Alfalah</strong>
                        </div>
                        <div className="pane-info-row">
                          <span>Account Title:</span> <strong>Yaadein Art Studio</strong>
                        </div>
                        <div className="pane-info-row">
                          <span>Account Number:</span> <strong>0123-4567-8910-1112</strong>
                        </div>
                        <div className="pane-info-row">
                          <span>IBAN:</span> <strong>PK12ALFH0123456789101112</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Receipt screenshot uploader */}
                  {!paymentReceipt ? (
                    <div className="receipt-uploader-zone">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptChange}
                        className="upload-receipt-input"
                        id="receipt-file-input"
                      />
                      <div className="uploader-prompt-content">
                        <span className="uploader-prompt-icon">📸</span>
                        <span className="uploader-prompt-title">Upload Payment Receipt Screenshot</span>
                        <span className="uploader-prompt-desc">Tap or drag image here (JPEG, PNG, WebP)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="receipt-preview-container">
                      <div
                        className="receipt-preview-image-wrapper"
                        onClick={() => {
                          const overlay = document.createElement('div');
                          overlay.className = 'receipt-lightbox-overlay';
                          overlay.onclick = () => overlay.remove();
                          const closeBtn = document.createElement('button');
                          closeBtn.className = 'receipt-lightbox-close';
                          closeBtn.innerHTML = '✕';
                          closeBtn.onclick = (e) => { e.stopPropagation(); overlay.remove(); };
                          const img = document.createElement('img');
                          img.src = paymentReceipt;
                          img.alt = 'Payment Receipt Full View';
                          overlay.appendChild(closeBtn);
                          overlay.appendChild(img);
                          document.body.appendChild(overlay);
                        }}
                      >
                        <img src={paymentReceipt} alt="Payment Receipt Preview" />
                      </div>
                      <div className="receipt-preview-footer">
                        <div className="receipt-preview-info">
                          <div className="receipt-preview-check">✓</div>
                          <div className="receipt-preview-details">
                            <span className="receipt-preview-title">receipt_screenshot.png</span>
                            <span className="receipt-preview-status">✓ Ready to submit</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeReceipt}
                          className="btn-remove-receipt"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  <button type="submit" className="btn-order" disabled={isSubmitting}>
                    {isSubmitting ? "Placing Order..." : `Place Order (Prepaid via ${paymentMethod})`}
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
                    <>
                      {cartItems.map((item, idx) => (
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
                      ))}
                      {selectedServices.map((service, idx) => (
                        <div key={`service-${idx}`} className="summary-item" style={{ borderStyle: "dashed", borderColor: "rgba(181, 139, 92, 0.3)" }}>
                          <div className="summary-thumb" style={{ background: "#1C0F07", border: "1px dashed var(--accent)" }}>
                            <div className="summary-thumb-placeholder" style={{ color: "var(--accent)", fontSize: "18px" }}>{service.icon}</div>
                          </div>
                          <div className="summary-details">
                            <h4 className="summary-name">{service.name}</h4>
                            <span className="summary-meta">Service Upgrade</span>
                            <div className="summary-price-row">
                              <span>Qty: 1</span>
                              <span className="summary-price">Rs. {service.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="summary-totals">
                  <div className="totals-row">
                    <span>Subtotal</span>
                    <span>Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="totals-row">
                    <span>Courier Delivery (14-day Standard)</span>
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
