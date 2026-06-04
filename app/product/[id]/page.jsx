"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { db } from "../../../lib/firebase";
import { ref, onValue } from "firebase/database";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

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

const parsePrice = (priceStr) => {
  if (!priceStr) return 0;
  return parseInt(priceStr.replace(/[^0-9]/g, "")) || 0;
};

const formatPrice = (priceNum) => {
  return `Rs. ${priceNum.toLocaleString()}`;
};

function ProductDetailContent({ params }) {
  const { id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [frames, setFrames] = useState([]);
  const [selectedFrame, setSelectedFrame] = useState(null);
  
  // Set orientation initially based on query parameters if present, defaulting to portrait
  const [orientation, setOrientation] = useState(searchParams?.get("orientation") || "portrait");
  const [selectedSize, setSelectedSize] = useState("12x16");
  const [userUploadedImage, setUserUploadedImage] = useState(null);
  const [lightOn, setLightOn] = useState(true);

  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch all frames from Firebase database
  useEffect(() => {
    const framesRef = ref(db, "frames");
    const unsub = onValue(framesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const framesList = Object.entries(data).map(([key, val]) => ({
          id: key,
          ...val
        }));
        setFrames(framesList);
      } else {
        setFrames([]);
      }
    });
    return () => unsub();
  }, []);

  // Update selected frame based on route param
  useEffect(() => {
    if (frames.length > 0 && id) {
      const matched = frames.find((f) => f.id === id);
      if (matched) {
        setSelectedFrame(matched);
        const queryOrientation = searchParams?.get("orientation");
        setOrientation(queryOrientation || matched.orientation || "portrait");
      }
    }
  }, [frames, id, searchParams]);

  // Sync Cart items
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

  // Frame Switching Handler
  const handleFrameChange = (frameId) => {
    router.push(`/product/${frameId}`, { scroll: false });
  };

  // Orientation toggling logic
  const handleOrientationChange = (newOrientation) => {
    setOrientation(newOrientation);
  };

  // Image Upload Handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const removeCustomImage = () => {
    setUserUploadedImage(null);
  };

  // Size specifications and price additions
  const getSizePremium = (size) => {
    switch (size) {
      case "8x10": return -1500;
      case "16x20": return 2500;
      case "24x36": return 6500;
      default: return 0; // "12x16" is base price
    }
  };

  const getSizeLabel = (size) => {
    switch (size) {
      case "8x10": return '8" x 10"';
      case "16x20": return '16" x 20"';
      case "24x36": return '24" x 36"';
      default: return '12" x 16"';
    }
  };

  const basePriceNum = parsePrice(selectedFrame?.price);
  const sizePremium = getSizePremium(selectedSize);
  const calculatedPriceNum = basePriceNum + sizePremium;
  const calculatedPriceStr = formatPrice(calculatedPriceNum);

  // Dynamic dummy photo loader
  const getDummyPhoto = () => {
    if (orientation === "landscape") {
      return "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800";
    } else {
      return "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800";
    }
  };

  const currentPhoto = userUploadedImage || getDummyPhoto();

  // Swapped inner padding logic for rotated frames
  const getPaddings = () => {
    if (!selectedFrame) return { top: 0, left: 0, bottom: 0, right: 0 };
    const p = selectedFrame;
    if (orientation === (p.orientation || "portrait")) {
      return {
        top: p.paddingTop || 0,
        left: p.paddingLeft || 0,
        bottom: p.paddingBottom || 0,
        right: p.paddingRight || 0
      };
    } else {
      return {
        top: p.paddingLeft || 0,
        left: p.paddingTop || 0,
        bottom: p.paddingRight || 0,
        right: p.paddingBottom || 0
      };
    }
  };

  const paddings = getPaddings();
  const aspectRatio = orientation === "landscape" ? "3 / 2" : "2 / 3";

  // Cart Drawer operations
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

  const handleAddToCart = () => {
    if (!selectedFrame) return;
    const item = {
      id: selectedFrame.id,
      frameName: selectedFrame.name,
      frameColor: selectedFrame.color || "",
      price: calculatedPriceStr,
      size: getSizeLabel(selectedSize),
      orientation: orientation,
      rotation: 0,
      image: currentPhoto
    };

    const cart = getCart();
    const existingIndex = cart.findIndex(
      (x) => x.id === item.id && x.orientation === item.orientation && x.size === item.size && x.image === item.image
    );

    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }
    saveCart(cart);
    setCartOpen(true);
  };

  const navigateToStudio = () => {
    if (!selectedFrame) return;
    let url = `/customize?frame=${selectedFrame.id}&orientation=${orientation}`;
    router.push(url);
  };

  if (!selectedFrame) {
    return (
      <div style={{ minHeight: "100vh", background: "#0C0A08", color: "var(--text2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-serif)" }}>
        Loading product details...
      </div>
    );
  }

  return (
    <div className="product-page-root">
      <style dangerouslySetInnerHTML={{ __html: `
        .product-page-root {
          font-family: var(--font-serif);
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          overflow-x: hidden;
        }

        .product-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 40px 100px;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 80px;
        }

        /* --- Left Column: Visual Showcase --- */
        .product-visual-pane {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          position: relative;
          padding-top: 100px; /* Space for picture light */
        }

        .exquisite-frame-component {
          position: relative;
          width: 100%;
          max-width: 380px;
          padding-top: 110px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Wall Glow under lamp */
        .exquisite-wall-glow {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255, 238, 180, 0.14) 0%, rgba(255, 238, 180, 0.04) 50%, transparent 80%);
          filter: blur(24px);
          z-index: 1;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .exquisite-wall-glow.on {
          opacity: 1;
        }

        /* Picture Light structure */
        .exquisite-lamp {
          position: absolute;
          top: 0px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 240px;
        }

        .lamp-rod {
          width: 4px;
          height: 100px;
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
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          width: 460px;
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

        /* Pull chain string */
        .pull-chain {
          position: absolute;
          top: 56px;
          left: calc(50% + 22px);
          width: 20px;
          height: 180px;
          cursor: pointer;
          z-index: 25;
          transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .pull-chain:active {
          transform: translateY(12px);
        }
        
        .chain-wire {
          width: 2px;
          height: 120px;
          background: repeating-linear-gradient(to bottom, #7a613b, #7a613b 2px, #362916 2px, #362916 4px);
          margin: 0 auto;
          box-shadow: 1px 1px 2px rgba(0,0,0,0.4);
        }
        
        .chain-handle {
          width: 8px;
          height: 24px;
          background: linear-gradient(to right, #403014, #dfc38a 50%, #2b1f0d);
          border: 1px solid #1a1205;
          box-shadow: 0 4px 8px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.3);
          border-radius: 4px;
          margin: 0 auto;
          position: relative;
        }
        
        .chain-handle::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 1px;
          width: 4px;
          height: 4px;
          background: #8f723b;
          border-radius: 50%;
        }

        /* Wood Frame */
        .exquisite-wood-frame {
          position: relative;
          z-index: 10;
          width: 100%;
          aspect-ratio: ${aspectRatio};
          box-shadow: 0 25px 50px rgba(0,0,0,0.85);
          overflow: hidden;
          background: #000;
        }

        .exquisite-wood-frame::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 14px;
          background: linear-gradient(to bottom, rgba(255, 240, 180, 0.55) 0%, rgba(255, 240, 180, 0.15) 60%, transparent 100%);
          z-index: 15;
          opacity: 0;
          transition: opacity 0.25s ease;
          pointer-events: none;
        }
        .exquisite-wood-frame.light-on::after {
          opacity: 1;
        }

        .wood-frame-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: fill;
          z-index: 12;
          pointer-events: none;
        }

        .exquisite-inner-photo {
          position: absolute;
          top: ${paddings.top}%;
          left: ${paddings.left}%;
          bottom: ${paddings.bottom}%;
          right: ${paddings.right}%;
          background: #111;
          overflow: hidden;
          box-shadow: inset 0 0 12px rgba(0,0,0,0.9);
          z-index: 10;
        }

        .exquisite-inner-photo::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 45px;
          background: linear-gradient(to bottom, rgba(255, 240, 180, 0.25) 0%, transparent 100%);
          z-index: 12;
          opacity: 0;
          transition: opacity 0.25s ease;
          pointer-events: none;
        }
        .exquisite-wood-frame.light-on .exquisite-inner-photo::after {
          opacity: 1;
        }

        .exquisite-inner-photo img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block;
          transition: filter 0.35s ease;
        }

        .exquisite-inner-photo img.light-active {
          filter: grayscale(100%) contrast(1.1) brightness(0.95);
        }

        .exquisite-inner-photo img.light-inactive {
          filter: grayscale(100%) contrast(1.15) brightness(0.18);
        }

        .glass-reflection {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%, rgba(255,255,255,0.01) 100%);
          z-index: 11;
          pointer-events: none;
        }

        /* --- Right Column: Config Panel --- */
        .product-config-pane {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .product-meta-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 20px;
          border-radius: 8px;
        }

        .product-tag {
          font-family: var(--font-typewriter);
          font-size: 11px;
          color: var(--accent);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .product-title {
          font-family: 'Cinzel', serif;
          font-size: 38px;
          font-weight: 600;
          color: var(--text);
        }

        .product-price-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 4px;
        }

        .product-price-val {
          font-family: var(--font-typewriter);
          font-size: 24px;
          font-weight: 700;
          color: var(--accent);
        }

        .product-desc-text {
          font-family: var(--font-serif);
          font-size: 15px;
          line-height: 1.6;
          color: var(--text2);
        }

        .config-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .config-label {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--accent);
        }

        /* Orientation and Size Buttons */
        .choice-row {
          display: flex;
          gap: 12px;
        }

        .choice-btn {
          flex: 1;
          background: var(--surface2);
          border: 1px solid var(--border2);
          color: var(--text2);
          padding: 12px;
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 8px;
          text-align: center;
        }
        .choice-btn:hover {
          color: var(--text);
          border-color: var(--accent);
        }
        .choice-btn.selected {
          background: var(--accent);
          color: #1A1100;
          border-color: var(--accent);
          box-shadow: inset 0 0 5px rgba(0,0,0,0.5);
        }

        /* Action Buttons */
        .action-row {
          display: flex;
          gap: 16px;
          margin-top: 10px;
          border-top: 1px solid var(--border);
          padding-top: 24px;
        }

        .action-row .btn-premium {
          flex: 1.2;
          text-align: center;
          padding: 14px 28px !important;
          border-radius: 8px !important;
        }

        .action-row .btn-premium-ghost {
          flex: 1;
          text-align: center;
          padding: 14px 26px !important;
          border-radius: 8px !important;
        }

        /* Responsive styling */
        @media (max-width: 900px) {
          .product-container {
            grid-template-columns: 1fr;
            gap: 50px;
            padding: 40px 24px;
          }
          .product-visual-pane {
            padding-top: 90px;
          }
        }
        @media (max-width: 580px) {
          .product-title {
            font-size: 30px;
          }
          .product-price-val {
            font-size: 20px;
          }
          .choice-row {
            flex-direction: column;
            gap: 8px;
          }
        }
      ` }} />

      <Navbar onCartOpen={() => setCartOpen(true)} />

      <div className="product-container">
        {/* LEFT COLUMN: VISUAL FRAME PREVIEW */}
        <div className="product-visual-pane">
          <div className="exquisite-frame-component">
            {/* Ambient Wall Glow */}
            <div className={`exquisite-wall-glow ${lightOn ? "on" : ""}`} />

            {/* Suspended Lamp */}
            <div className="exquisite-lamp">
              <div className="lamp-rod" />
              <div className="lamp-mount" />
              <div className="lamp-arm" />
              <div className="lamp-head">
                <div className={`lamp-bulb ${lightOn ? "on" : ""}`} />
              </div>
              {/* Pull switch cord */}
              <div className="pull-chain" onClick={() => setLightOn(!lightOn)} title="Toggle Lamp Light">
                <div className="chain-wire" />
                <div className="chain-handle" />
              </div>
              {/* Soft light beam */}
              <div className={`lamp-light-beam ${lightOn ? "on" : ""}`} />
            </div>

            {/* Picture Frame */}
            <div className={`exquisite-wood-frame ${lightOn ? "light-on" : ""}`}>
              {selectedFrame.imageUrl && (
                <img
                  src={selectedFrame.imageUrl}
                  alt={selectedFrame.name}
                  className="wood-frame-overlay"
                />
              )}

              {/* Photo opening */}
              <div className="exquisite-inner-photo">
                <img
                  src={currentPhoto}
                  alt="Customized preview print"
                  className={lightOn ? "light-active" : "light-inactive"}
                />
                <div className="glass-reflection" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONFIGURATION PANEL */}
        <div className="product-config-pane">
          <div className="product-meta-header">
            <span className="product-tag">{selectedFrame.tag || "Bespoke Frame"}</span>
            <h1 className="product-title">{selectedFrame.name}</h1>
            <div className="product-price-row">
              <span className="product-price-val">{calculatedPriceStr}</span>
            </div>
          </div>

          {/* Description */}
          <div className="config-section">
            <span className="config-label">Molding Description</span>
            <p className="product-desc-text">
              {selectedFrame.desc || "Exquisitely designed wooden moulding frame, handcrafted to highlight contrast, depth, and the natural grain details of original timber prints."}
            </p>
          </div>

          {/* Orientation selection */}
          <div className="config-section">
            <span className="config-label">Select Orientation</span>
            <div className="choice-row">
              <button
                className={`choice-btn ${orientation === "portrait" ? "selected" : ""}`}
                onClick={() => handleOrientationChange("portrait")}
              >
                Portrait (Vertical)
              </button>
              <button
                className={`choice-btn ${orientation === "landscape" ? "selected" : ""}`}
                onClick={() => handleOrientationChange("landscape")}
              >
                Landscape (Horizontal)
              </button>
            </div>
          </div>

          {/* Size selection */}
          <div className="config-section">
            <span className="config-label">Choose Size</span>
            <div className="choice-row">
              <button
                className={`choice-btn ${selectedSize === "8x10" ? "selected" : ""}`}
                onClick={() => setSelectedSize("8x10")}
              >
                8" x 10" <br />
                <span style={{ fontSize: "10px", opacity: 0.8 }}>- Rs. 1,500</span>
              </button>
              <button
                className={`choice-btn ${selectedSize === "12x16" ? "selected" : ""}`}
                onClick={() => setSelectedSize("12x16")}
              >
                12" x 16" <br />
                <span style={{ fontSize: "10px", opacity: 0.8 }}>Base Price</span>
              </button>
              <button
                className={`choice-btn ${selectedSize === "16x20" ? "selected" : ""}`}
                onClick={() => setSelectedSize("16x20")}
              >
                16" x 20" <br />
                <span style={{ fontSize: "10px", opacity: 0.8 }}>+ Rs. 2,500</span>
              </button>
              <button
                className={`choice-btn ${selectedSize === "24x36" ? "selected" : ""}`}
                onClick={() => setSelectedSize("24x36")}
              >
                24" x 36" <br />
                <span style={{ fontSize: "10px", opacity: 0.8 }}>+ Rs. 6,500</span>
              </button>
            </div>
          </div>

          {/* CTA Actions */}
          <div className="action-row">
            <button className="btn-premium" onClick={handleAddToCart}>
              Add to Cart
            </button>
            <button className="btn-premium-ghost" onClick={navigateToStudio}>
              Interactive Studio
            </button>
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

export default function ProductDetailPage({ params }) {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0C0A08", color: "var(--text2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-serif)" }}>
        Loading product details...
      </div>
    }>
      <ProductDetailContent params={params} />
    </Suspense>
  );
}
