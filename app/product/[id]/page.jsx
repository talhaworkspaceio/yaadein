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

const resizeImage = (base64Str, maxW = 200, maxH = 200) => {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith("data:image")) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > maxW) {
          h = Math.round((h * maxW) / w);
          w = maxW;
        }
      } else {
        if (h > maxH) {
          w = Math.round((w * maxH) / h);
          h = maxH;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => {
      resolve(base64Str);
    };
    img.src = base64Str;
  });
};

function ProductDetailContent({ params }) {
  const { id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [frames, setFrames] = useState([]);
  const [selectedFrame, setSelectedFrame] = useState(null);

  // Set orientation initially based on query parameters if present, defaulting to portrait
  const [orientation, setOrientation] = useState(searchParams?.get("orientation") || "portrait");
  const [selectedSize, setSelectedSize] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const [userUploadedImage, setUserUploadedImage] = useState(null);
  const [lightOn, setLightOn] = useState(true);

  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Sync carousel index to show selected frame in center
  useEffect(() => {
    if (frames.length > 0 && selectedFrame) {
      const idx = frames.findIndex((f) => f.id === selectedFrame.id);
      if (idx !== -1) {
        const targetStart = (idx - 1 + frames.length) % frames.length;
        setCarouselIndex(targetStart);
      }
    }
  }, [frames, selectedFrame]);

  const handlePrevFrame = () => {
    if (frames.length === 0) return;
    setCarouselIndex((prev) => (prev - 1 + frames.length) % frames.length);
  };

  const handleNextFrame = () => {
    if (frames.length === 0) return;
    setCarouselIndex((prev) => (prev + 1) % frames.length);
  };

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

  // Frame Switching Handler - local state update to prevent full page refresh
  const handleFrameChange = (frameId) => {
    const matched = frames.find((f) => f.id === frameId);
    if (matched) {
      setSelectedFrame(matched);
      if (typeof window !== "undefined") {
        const url = `/product/${frameId}${window.location.search}`;
        window.history.pushState({ ...window.history.state, as: url, url }, "", url);
      }
    }
  };

  // Sync state if browser Back/Forward is clicked
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== "undefined") {
        const pathSegments = window.location.pathname.split("/");
        const frameId = pathSegments[pathSegments.length - 1];
        if (frameId && frames.length > 0) {
          const matched = frames.find((f) => f.id === frameId);
          if (matched) {
            setSelectedFrame(matched);
          }
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [frames]);

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
      case "12x16": return 0;
      case "16x20": return 2500;
      case "24x36": return 6500;
      default: return 0;
    }
  };

  const getSizeLabel = (size) => {
    switch (size) {
      case "8x10": return '8" x 10"';
      case "12x16": return '12" x 16"';
      case "16x20": return '16" x 20"';
      case "24x36": return '24" x 36"';
      default: return 'Choose Size';
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

  // Get visible frames for the switcher carousel
  const getVisibleFrames = () => {
    if (frames.length === 0) return [];
    const visible = [];
    for (let i = 0; i < 3; i++) {
      const idx = (carouselIndex + i) % frames.length;
      visible.push(frames[idx]);
    }
    return visible;
  };
  const visibleFrames = getVisibleFrames();

  // Swapped inner padding logic for rotated frames - simplified to native paddings since frame rotates
  const getPaddings = () => {
    if (!selectedFrame) return { top: 0, left: 0, bottom: 0, right: 0 };
    const p = selectedFrame;
    return {
      top: p.paddingTop || 0,
      left: p.paddingLeft || 0,
      bottom: p.paddingBottom || 0,
      right: p.paddingRight || 0
    };
  };

  const paddings = getPaddings();
  const aspectRatio = "2 / 3"; // Always keep native portrait aspect ratio to avoid stretching the texture

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

  const handleAddToCart = async () => {
    if (!selectedFrame) return;
    if (!selectedSize) {
      setSizeError(true);
      alert("Please select a size before adding to cart.");
      return;
    }

    let finalImage = currentPhoto;
    if (userUploadedImage) {
      try {
        finalImage = await resizeImage(userUploadedImage, 150, 150);
      } catch (err) {
        console.error("Error compressing user image:", err);
      }
    }

    const item = {
      id: selectedFrame.id,
      frameName: selectedFrame.name,
      frameColor: selectedFrame.color || "",
      price: calculatedPriceStr,
      size: getSizeLabel(selectedSize),
      orientation: orientation,
      rotation: 0,
      image: finalImage
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

  if (!selectedFrame) {
    return (
      <div style={{ minHeight: "100vh", background: "#0C0A08", color: "var(--text2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-serif)" }}>
        Loading product details...
      </div>
    );
  }

  return (
    <div className="product-page-root">
      <style dangerouslySetInnerHTML={{
        __html: `
        .product-page-root {
          font-family: var(--font-serif);
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .product-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 40px 100px;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 80px;
          flex: 1;
          align-items: center;
          justify-content: center;
          width: 100%;
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

        /* Pull chain switch removed */
        
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
          aspect-ratio: 2 / 3; /* Always keep portrait to avoid stretching the wood texture */
          box-shadow: 0 25px 50px rgba(0,0,0,0.85);
          overflow: hidden;
          background: #000;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .exquisite-wood-frame.rotated-landscape {
          transform: rotate(90deg);
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
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), filter 0.35s ease;
          transform-origin: center center;
        }
        .exquisite-inner-photo img.rotated-landscape-img {
          transform: rotate(-90deg) scale(1.5);
        }

        .exquisite-inner-photo img.light-active {
          filter: grayscale(100%) contrast(1.1) brightness(0.95);
        }

        .exquisite-inner-photo img.light-inactive {
          filter: grayscale(100%) contrast(1.1) brightness(0.95);
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
          gap: 22px;
          background-image: url('/images/paper.png');
          background-color: transparent !important;
          background-size: 100% 100%;
          background-repeat: no-repeat;
          border-radius: 0;
          padding: 55px 45px 55px 65px;
          border: none !important;
          box-shadow: none !important;
          filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.65));
          color: #2c1e11;
          position: relative;
          max-width: 460px;
          width: 100%;
          margin: 0 auto;
          align-self: end;
          transform: translateY(40px);
        }

        .product-config-pane::before {
          content: 'Y';
          position: absolute;
          bottom: 30px;
          right: 35px;
          width: 80px;
          height: 80px;
          border: 3px double rgba(185, 28, 28, 0.08);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(185, 28, 28, 0.08);
          font-family: 'Cinzel', serif;
          font-size: 32px;
          font-weight: 700;
          transform: rotate(-15deg);
          pointer-events: none;
          z-index: 0;
          line-height: 80px;
          text-align: center;
        }

        .product-meta-header,
        .config-section,
        .action-row {
          position: relative;
          z-index: 1;
        }

        .product-meta-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-bottom: 1px dashed rgba(139, 94, 60, 0.25);
          padding-bottom: 16px;
        }

        .product-tag {
          font-family: var(--font-typewriter);
          font-size: 10px;
          color: #8b5e3c;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .product-title {
          font-family: 'Shelly', cursive, serif;
          font-size: 52px;
          font-weight: normal;
          color: #2c1e11;
          line-height: 1.1;
          text-shadow: 0.5px 0.5px 0px rgba(255, 255, 255, 0.6);
        }

        .product-price-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 2px;
        }

        .product-price-val {
          font-family: var(--font-typewriter);
          font-size: 22px;
          font-weight: 700;
          color: #8b1e1e; /* Vintage red ink stamp */
          text-shadow: 0.5px 0.5px 0px rgba(255, 255, 255, 0.6);
        }

        .product-desc-text {
          font-family: var(--font-typewriter);
          font-size: 13px;
          line-height: 1.6;
          color: #2c1e11;
        }

        .config-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .config-label {
          font-family: var(--font-typewriter);
          font-size: 11px;
          color: #8b5e3c;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* Size Buttons */
        .choice-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .choice-btn {
          background: rgba(255, 255, 255, 0.35);
          border: 1px dashed rgba(139, 94, 60, 0.45);
          color: #21160a;
          padding: 8px 6px;
          font-family: var(--font-typewriter);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 6px;
          text-align: center;
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.5);
          line-height: 1.3;
        }
        .choice-btn:hover {
          background: rgba(255, 255, 255, 0.85);
          border-color: #8b5e3c;
          color: #2c1e11;
        }
        .choice-btn.selected {
          background: rgba(139, 94, 60, 0.12);
          color: #8b5e3c;
          border: 1.5px solid #8b5e3c;
          box-shadow: 0 2px 8px rgba(139, 94, 60, 0.1);
        }

        /* Action Buttons */
        .action-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 6px;
          border-top: 1px dashed rgba(139, 94, 60, 0.25);
          padding-top: 20px;
        }

        .action-row .btn-premium {
          width: 100%;
          text-align: center;
          padding: 12px 24px !important;
          border-radius: 9999px !important;
          background: #2c1e11 !important; /* Dark ink block print */
          color: #f6f0df !important;
          font-family: var(--font-display) !important;
          font-weight: 700 !important;
          letter-spacing: 0.08em;
          box-shadow: 0 4px 12px rgba(44, 30, 17, 0.25);
          transition: all 0.3s ease;
        }
        .action-row .btn-premium:hover {
          background: #47321d !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(44, 30, 17, 0.35);
        }

        .action-row .btn-premium-ghost {
          width: 100%;
          text-align: center;
          padding: 12px 24px !important;
          border-radius: 9999px !important;
          background: transparent !important;
          border: 1.5px solid #2c1e11 !important;
          color: #2c1e11 !important;
          font-family: var(--font-display) !important;
          font-weight: 700 !important;
          letter-spacing: 0.08em;
          transition: all 0.25s ease;
        }
        .action-row .btn-premium-ghost:hover {
          background: rgba(44, 30, 17, 0.08) !important;
          transform: translateY(-2px);
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
          .product-config-pane {
            align-self: center;
            transform: translateY(0);
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

        /* Redesigned Select Dropdown Styling */
        .select-wrapper {
          position: relative;
          width: 100%;
        }
        .premium-select {
          width: 100%;
          padding: 12px 40px 12px 16px;
          font-family: var(--font-typewriter);
          font-size: 13px;
          font-weight: 700;
          color: #2c1e11;
          background: rgba(255, 255, 255, 0.4);
          border: 1px dashed rgba(139, 94, 60, 0.6);
          border-radius: 6px;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          cursor: pointer;
          outline: none;
          transition: all 0.2s ease;
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.5);
        }
        .premium-select:hover, .premium-select:focus {
          background: rgba(255, 255, 255, 0.85);
          border-color: #8b5e3c;
          border-style: solid;
        }
        .premium-select.error {
          border-color: #8b1e1e;
          border-style: solid;
          background: rgba(139, 30, 30, 0.05);
        }
        .select-arrow {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #8b5e3c;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .size-error-msg {
          font-family: var(--font-typewriter);
          font-size: 10px;
          color: #8b1e1e;
          margin-top: 2px;
        }

        /* Redesigned Orientation Selector Styling */
        .orientation-btns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .orientation-btn {
          background: rgba(255, 255, 255, 0.35);
          border: 1px dashed rgba(139, 94, 60, 0.45);
          border-radius: 6px;
          color: #21160a;
          padding: 14px 10px;
          cursor: pointer;
          font-family: var(--font-typewriter);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.5);
        }
        .orientation-btn:hover {
          background: rgba(255, 255, 255, 0.85);
          border-color: #8b5e3c;
          color: #2c1e11;
        }
        .orientation-btn.active {
          background: rgba(139, 94, 60, 0.12);
          color: #8b5e3c;
          border: 1.5px solid #8b5e3c;
          box-shadow: 0 2px 8px rgba(139, 94, 60, 0.1);
        }
        .orientation-btn-icon {
          width: 16px;
          height: 22px;
          border: 2px solid currentColor;
          border-radius: 3px;
          transition: all 0.2s ease;
          opacity: 0.8;
        }
        .orientation-btn.active .orientation-btn-icon {
          opacity: 1;
        }
        .orientation-btn.landscape-btn .orientation-btn-icon {
          width: 22px;
          height: 16px;
        }
        .orientation-btn-label {
          font-size: 10px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* Frame Switcher Carousel & Dot Indicators styling */
        .frame-thumbnails-carousel {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 30px;
          width: 100%;
          max-width: 380px;
          z-index: 10;
        }
        .carousel-thumbnails-wrapper {
          display: flex;
          gap: 10px;
          overflow: hidden;
          justify-content: center;
          flex: 1;
        }
        .carousel-thumb-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.25s ease;
          width: 76px;
          opacity: 0.6;
        }
        .carousel-thumb-card:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }
        .carousel-thumb-card.active {
          opacity: 1;
          transform: scale(1.04);
        }
        .thumb-image-wrapper {
          width: 54px;
          height: 72px;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.45);
          background: #111;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.25s ease;
        }
        .carousel-thumb-card.active .thumb-image-wrapper {
          border: 1.5px solid #dfc38a;
          box-shadow: 0 0 10px rgba(223, 195, 138, 0.35);
        }
        .thumb-image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .thumb-label {
          font-family: var(--font-typewriter);
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #dfc38a;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
        .carousel-arrow {
          background: none;
          border: none;
          color: #dfc38a;
          font-size: 28px;
          line-height: 1;
          cursor: pointer;
          padding: 0 6px;
          transition: color 0.2s ease, transform 0.2s ease;
          user-select: none;
        }
        .carousel-arrow:hover {
          color: #fff;
          transform: scale(1.25);
        }
        .carousel-dots {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 10px;
          z-index: 10;
        }
        .carousel-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(223, 195, 138, 0.22);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .carousel-dot:hover {
          background: rgba(223, 195, 138, 0.5);
        }
        .carousel-dot.active {
          background: #dfc38a;
          transform: scale(1.15);
          box-shadow: 0 0 5px rgba(223, 195, 138, 0.55);
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

              {/* Soft light beam */}
              <div className={`lamp-light-beam ${lightOn ? "on" : ""}`} />
            </div>

            {/* Toggle switch panel (Placed on top of the frame) */}
            <div className="light-control-panel" style={{ marginBottom: "20px", alignSelf: "center", width: "fit-content", zIndex: 30 }}>
              <span className="light-control-label">Studio Light</span>
              <button 
                className={`light-switch-btn ${lightOn ? 'on' : ''}`} 
                onClick={() => setLightOn(!lightOn)} 
                aria-label="Toggle Studio Light"
              >
                <span className="light-switch-knob" />
              </button>
            </div>

            {/* Picture Frame */}
            <div className={`exquisite-wood-frame ${lightOn ? "light-on" : ""} ${orientation === "landscape" ? "rotated-landscape" : ""}`}>
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
                  className={`${lightOn ? "light-active" : "light-inactive"} ${orientation === "landscape" ? "rotated-landscape-img" : ""}`}
                />
                <div className="glass-reflection" />
              </div>
            </div>

            {/* Frame Switcher Carousel (Placed at the bottom of the frame) */}
            {frames.length > 0 && (
              <>
                <div className="frame-thumbnails-carousel">
                  <button className="carousel-arrow left" onClick={handlePrevFrame} aria-label="Previous frames">
                    ‹
                  </button>
                  <div className="carousel-thumbnails-wrapper">
                    {visibleFrames.map((f) => (
                      <div
                        key={f.id}
                        className={`carousel-thumb-card ${f.id === selectedFrame.id ? "active" : ""}`}
                        onClick={() => handleFrameChange(f.id)}
                      >
                        <div className="thumb-image-wrapper">
                          {f.imageUrl ? (
                            <img src={f.imageUrl} alt={f.name} />
                          ) : (
                            <div className="cart-item-thumb-placeholder">Y</div>
                          )}
                        </div>
                        <span className="thumb-label">{f.name}</span>
                      </div>
                    ))}
                  </div>
                  <button className="carousel-arrow right" onClick={handleNextFrame} aria-label="Next frames">
                    ›
                  </button>
                </div>
                {/* Dot Indicators */}
                <div className="carousel-dots">
                  {frames.map((f) => (
                    <span
                      key={f.id}
                      className={`carousel-dot ${f.id === selectedFrame.id ? "active" : ""}`}
                      onClick={() => handleFrameChange(f.id)}
                      title={f.name}
                    />
                  ))}
                </div>
              </>
            )}
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

          {/* Size selection */}
          <div className="config-section">
            <span className="config-label">Choose Size</span>
            <div className="select-wrapper">
              <select
                className={`premium-select ${sizeError ? "error" : ""}`}
                value={selectedSize}
                onChange={(e) => {
                  setSelectedSize(e.target.value);
                  setSizeError(false);
                }}
              >
                <option value="">Choose Size</option>
                <option value="8x10">8" x 10" (- Rs. 1,500)</option>
                <option value="12x16">12" x 16" (Base Price)</option>
                <option value="16x20">16" x 20" (+ Rs. 2,500)</option>
                <option value="24x36">24" x 36" (+ Rs. 6,500)</option>
              </select>
              <span className="select-arrow">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
            {sizeError && <span className="size-error-msg">Please select a size</span>}
          </div>

          {/* Orientation selection */}
          <div className="config-section" style={{ marginTop: "6px" }}>
            <span className="config-label">Select Orientation</span>
            <div className="orientation-btns">
              <button
                className={`orientation-btn portrait-btn ${orientation === "portrait" ? "active" : ""}`}
                onClick={() => handleOrientationChange("portrait")}
              >
                <div className="orientation-btn-icon" />
                <span className="orientation-btn-label">Portrait</span>
              </button>
              <button
                className={`orientation-btn landscape-btn ${orientation === "landscape" ? "active" : ""}`}
                onClick={() => handleOrientationChange("landscape")}
              >
                <div className="orientation-btn-icon" />
                <span className="orientation-btn-label">Landscape</span>
              </button>
            </div>
          </div>

          {/* CTA Actions */}
          <div className="action-row">
            <button className="btn-premium" onClick={handleAddToCart}>
              Add to Cart
            </button>
            <button className="btn-premium-ghost" onClick={triggerFileUpload}>
              Upload Photo
            </button>
            {userUploadedImage && (
              <button 
                className="remove-photo-link" 
                onClick={removeCustomImage}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8b1e1e",
                  fontFamily: "var(--font-typewriter)",
                  fontSize: "10px",
                  textDecoration: "underline",
                  cursor: "pointer",
                  marginTop: "4px",
                  alignSelf: "center"
                }}
              >
                Remove Custom Photo
              </button>
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />
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
