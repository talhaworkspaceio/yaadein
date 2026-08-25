"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "../../lib/firebase";
import { ref, onValue } from "firebase/database";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CardDescription from "../components/CardDescription";
import { useCatalogPageContent } from "../../lib/cms";

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

export default function CatalogPage() {
  const { data: catalogCms } = useCatalogPageContent();
  const [cartItems, setCartItems] = useState([]);

  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [lightOn, setLightOn] = useState(true);

  // Carousel slider indices
  const [newArrivalsIndex, setNewArrivalsIndex] = useState(0);
  const [portraitIndex, setPortraitIndex] = useState(0);
  const [landscapeIndex, setLandscapeIndex] = useState(0);
  const [boardGamesIndex, setBoardGamesIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const isNewArrival = (p) => {
    if (!p) return false;
    const createdAt = typeof p === "object" ? p.createdAt : null;
    if (createdAt) {
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      if ((Date.now() - createdAt) < sevenDaysInMs) {
        return true;
      }
    }
    const id = typeof p === "string" ? p : p.id;
    return id === "antique-gold" || id === "gallery-landscape" || id === "landscape-oak" || id === "1" || id === "17" || id === "18";
  };

  const isFeatured = (id) => {
    return id === "modern-black" || id === "classic-walnut" || id === "royal-gilt" || id === "colonial-pine";
  };

  // Categorize products
  const isBoardGame = (p) => {
    const cat = p?.category || "";
    return cat.toLowerCase().includes("board game");
  };

  const newArrivalsProducts = products.filter(p => isNewArrival(p));
  const portraitProducts = products.filter(p => !isBoardGame(p) && p.orientation !== "landscape");
  const landscapeProducts = products.filter(p => !isBoardGame(p) && p.orientation === "landscape");
  const boardGamesProducts = products.filter(p => isBoardGame(p));

  const itemsPerPage = isMobile ? 1 : 3;

  // Translation values
  const newArrivalsTranslation = isMobile
    ? `calc(-${newArrivalsIndex} * (100% + 24px))`
    : `calc(-${newArrivalsIndex} * (100% / 3 + 8px))`;

  const portraitTranslation = isMobile
    ? `calc(-${portraitIndex} * (100% + 24px))`
    : `calc(-${portraitIndex} * (100% / 3 + 8px))`;

  const landscapeTranslation = isMobile
    ? `calc(-${landscapeIndex} * (100% + 24px))`
    : `calc(-${landscapeIndex} * (100% / 3 + 8px))`;

  const boardGamesTranslation = isMobile
    ? `calc(-${boardGamesIndex} * (100% + 24px))`
    : `calc(-${boardGamesIndex} * (100% / 3 + 8px))`;

  const renderProductCard = (p) => {
    const isLandscape = p.orientation === "landscape";
    const isGame = isBoardGame(p);

    const getProductPreviewImage = (prod) => {
      if (prod.thumbnailUrl) return prod.thumbnailUrl;
      return prod.orientation === "landscape" ? "/images/nature.jpg" : "/images/dummyImg.jpg";
    };

    return (
      <div className={`arrival-card ${isLandscape ? "landscape-card" : isGame ? "square-card" : ""}`}>
        {isNewArrival(p) ? (
          <div className="ribbon">New Arrival</div>
        ) : isFeatured(p.id) ? (
          <div className="ribbon">Featured</div>
        ) : null}

        <div
          className="card-thumb-wrap"
          style={{
            aspectRatio: isLandscape ? "3 / 2" : isGame ? "1 / 1" : "2 / 3",
            padding: isLandscape ? "8px" : isGame ? "20px" : "20px"
          }}
        >
          <div
            className="card-frame"
            style={{
              position: "relative",
              aspectRatio: isGame ? "1 / 1" : p.aspectRatio || (isLandscape ? "3 / 2" : "2 / 3"),
              width: isLandscape ? "100%" : "auto",
              height: isLandscape ? "auto" : "100%",
              maxWidth: "100%",
              boxShadow: "0 10px 24px rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              margin: "0 auto"
            }}
          >
            <div
              style={isLandscape ? {
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "66.6667%",
                height: "150%",
                transform: "translate(-50%, -50%) rotate(90deg)",
                overflow: "hidden"
              } : {
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
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
                    zIndex: 4,
                    pointerEvents: "none"
                  }}
                />
              )}
              <div
                className="card-frame-inner"
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 2,
                  background: "#2D2822",
                  boxShadow: "inset 0 0 10px rgba(0,0,0,0.8)",
                  overflow: "hidden"
                }}
              >
                <img
                  src={p.thumbnailUrl || getProductPreviewImage(p)}
                  alt={p.name || "Frame Art Preview"}
                  style={{
                    width: isLandscape ? "152%" : "100%",
                    height: isLandscape ? "152%" : "100%",
                    objectFit: isGame ? "fill" : "cover",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: isLandscape ? "translate(-50%, -50%) rotate(-90deg)" : "translate(-50%, -50%)",
                    objectPosition: isLandscape ? "center 15%" : "center center"
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="product-info">
          <div className="product-header-row">
            <h3 className="product-name">{p.name}</h3>
            <span className="product-price">{p.price}</span>
          </div>
          <CardDescription desc={p.desc} />
        </div>

        <a href={`/product/${p.id}?orientation=${isGame ? 'square' : (p.orientation || 'portrait')}`} className="btn-card">
          {isGame ? "View Game" : "View Frame"}
        </a>
      </div>
    );
  };

  return (
    <div className="catalog-root">
      <style dangerouslySetInnerHTML={{
        __html: `
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



        .catalog-root {
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
          position: relative;
          overflow: hidden;
          background: #080605;
          max-width: 100%;
          width: 100%;
        }
        
        .exhibition-container {
          max-width: 1300px;
          margin: 0 auto;
          position: relative;
          z-index: 3;
        }
        
        .carousels-container {
          display: flex;
          flex-direction: column;
          gap: 80px;
          width: 100%;
        }

        .carousel-section {
          width: 100%;
          position: relative;
          z-index: 5;
        }

        .carousel-section-header {
          margin-bottom: 28px;
        }

        .carousel-section-title {
          font-family: var(--font-display);
          font-size: 32px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.01em;
          margin-bottom: 8px;
        }

        .carousel-section-desc {
          font-family: var(--font-serif);
          font-size: 15px;
          color: var(--text2);
          max-width: 800px;
          line-height: 1.5;
        }

        .carousel-row {
          display: flex;
          align-items: center;
          gap: 24px;
          width: 100%;
        }

        .carousel-viewport-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          min-width: 0;
        }

        .carousel-viewport {
          width: 100%;
          overflow: hidden;
          padding: 12px 0;
        }

        .carousel-track {
          display: flex;
          gap: 24px;
          transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
          width: 100%;
        }

        .carousel-slide {
          flex: 0 0 calc((100% - 48px) / 3);
          box-sizing: border-box;
          min-width: 0;
          display: flex;
          justify-content: center;
        }

        /* Match the home page slider cards: capped width, centered in the slide */
        .carousel-slide .arrival-card {
          width: 100%;
          max-width: 360px;
          height: 100%;
        }

        .carousel-slide .arrival-card.landscape-card {
          max-width: 390px;
        }

        /* Chevrons */
        .carousel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(12, 10, 8, 0.9);
          border: 1.5px solid rgba(212, 175, 55, 0.35);
          color: var(--accent);
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.6);
        }
        .carousel-arrow:hover {
          background: var(--accent);
          color: #0C0A08;
          border-color: var(--accent);
          box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
        }
        .carousel-arrow-prev {
          left: -22px;
        }
        .carousel-arrow-next {
          right: -22px;
        }

        .carousel-view-all-link {
          font-family: var(--font-display) !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          color: var(--accent) !important;
          text-decoration: none !important;
          letter-spacing: 0.1em !important;
          text-transform: uppercase;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .carousel-view-all-link:hover {
          color: var(--accent2) !important;
          transform: translateX(4px);
        }

        /* View All Card */
        .view-all-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          text-decoration: none;
          gap: 16px;
          flex: 0 0 200px;
          background: rgba(20, 17, 14, 0.55);
          border: 1.5px dashed rgba(212, 175, 55, 0.25);
          border-radius: var(--radius);
        }
        .view-all-card:hover {
          border-color: var(--accent);
          background: rgba(20, 17, 14, 0.8);
          transform: translateY(-6px);
          box-shadow: 0 12px 30px rgba(212, 175, 55, 0.15);
        }
        .view-all-title {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          line-height: 1.4;
        }
        .view-all-arrow-svg {
          width: 28px;
          height: 28px;
          color: var(--accent);
          transition: transform 0.3s ease;
        }
        .view-all-card:hover .view-all-arrow-svg {
          transform: translateX(4px);
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
          padding: 12px;
          margin-top: auto;
        }

        /* BACKDROP LIQUID ANIMATIONS */
        .catalog-glass-bg {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }

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

        .catalog-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 1000px;
          height: 1000px;
          background: radial-gradient(circle, rgba(181, 139, 92, 0.3) 0%, rgba(139, 94, 60, 0.1) 50%, rgba(0, 0, 0, 0) 80%);
          pointer-events: none;
          z-index: 1;
          opacity: 1;
          animation: catalog-glow-auto 10s infinite ease-in-out;
        }

        @keyframes catalog-glow-auto {
          0% {
            transform: translate(-20%, -20%) scale(1);
          }
          25% {
            transform: translate(100%, 10%) scale(1.2);
          }
          50% {
            transform: translate(40%, 40%) scale(0.9);
          }
          75% {
            transform: translate(-10%, 30%) scale(1.1);
          }
          100% {
            transform: translate(-20%, -20%) scale(1);
          }
        }

        /* LIQUID BLOBS */
        .liquid-blob-1 {
          position: absolute;
          top: -10%;
          left: 10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(181, 139, 92, 0.28) 0%, rgba(139, 94, 60, 0) 70%);
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
          background: radial-gradient(circle, rgba(139, 94, 60, 0.24) 0%, rgba(201, 168, 76, 0) 70%);
          border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%;
          animation: liquid-move-2 30s infinite alternate ease-in-out;
          pointer-events: none;
          z-index: 1;
        }

        @keyframes liquid-move-1 {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            border-radius: 43% 57% 51% 49% / 57% 40% 60% 43%;
          }
          33% {
            transform: translate(80px, -60px) scale(1.15) rotate(45deg);
            border-radius: 54% 46% 38% 62% / 49% 70% 30% 51%;
          }
          66% {
            transform: translate(-40px, 80px) scale(0.9) rotate(90deg);
            border-radius: 35% 65% 60% 40% / 50% 35% 65% 50%;
          }
          100% {
            transform: translate(0, 0) scale(1) rotate(180deg);
            border-radius: 43% 57% 51% 49% / 57% 40% 60% 43%;
          }
        }

        @keyframes liquid-move-2 {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%;
          }
          50% {
            transform: translate(-100px, 50px) scale(1.2) rotate(120deg);
            border-radius: 38% 62% 62% 38% / 68% 48% 52% 32%;
          }
          100% {
            transform: translate(60px, -70px) scale(0.9) rotate(-60deg);
            border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%;
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
          width: 48px;
          height: 48px;
          color: var(--accent);
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
          .hero-banner {
            padding: 80px 20px 40px !important;
          }
          .hero-title {
            font-size: 36px;
          }
          .hero-desc {
            font-size: 14px !important;
            line-height: 1.6 !important;
          }
          
          /* Scale down the brass lamp in hero section */
          .catalog-lamp {
            transform: scale(0.6) !important;
            transform-origin: top center !important;
            margin-top: -10px !important;
            margin-bottom: -70px !important;
          }
          .catalog-lamp .lamp-rod {
            height: 120px !important;
          }

          .exhibition-section { padding: 40px 20px; }
          .gallery-grid { gap: 20px; }
          .arrival-card { width: 100%; max-width: 320px; }
          
          .carousel-row {
            flex-direction: column;
            gap: 16px;
            align-items: center;
            width: 100%;
          }
          .carousel-viewport-wrapper {
            width: 100%;
          }
          .carousel-slide {
            flex: 0 0 100%;
          }
          .carousel-viewport {
            padding: 8px 0;
          }
          .carousel-arrow {
            width: 36px;
            height: 36px;
            font-size: 14px;
            z-index: 50;
            display: flex !important;
          }
          .carousel-arrow-prev {
            left: 10px;
          }
          .carousel-arrow-next {
            right: 10px;
          }
          .view-all-card {
            flex: 0 0 auto;
            width: 100%;
            max-width: 320px;
            height: auto;
            padding: 16px;
            flex-direction: row;
            justify-content: center;
            border-style: solid;
            gap: 12px;
          }
        }
      ` }} />

      <Navbar onCartOpen={() => setCartOpen(true)} />

      <div className="hero-banner">
        {/* Suspended Brass Lamp on top of Our Catalog heading */}
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

        {catalogCms?.bannerEyebrow && <span className="hero-eyebrow" style={{ color: "var(--accent)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.15em", display: "block", marginBottom: "8px" }}>{catalogCms.bannerEyebrow}</span>}
        <h1 className="hero-title">{catalogCms?.bannerTitle || catalogCms?.title || "Our Catalog"}</h1>
        <p className="hero-desc">
          {catalogCms?.bannerSubtitle || catalogCms?.subtitle || "Choose from our bespoke frame profiles. Select a style to launch it instantly in our interactive studio builder."}
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

      <section className="exhibition-section">
        {/* Dynamic liquid backdrop elements */}
        <div className="catalog-glass-bg">
          <div className="liquid-blob-1" />
          <div className="liquid-blob-2" />
          <div className="catalog-glow" />
        </div>

        {/* Frosted Glass overlay sheet */}
        <div className="catalog-glass-pane" />

        <div className="exhibition-container">
          {products.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text2)", padding: "80px 0", fontFamily: "var(--font-typewriter)" }}>
              Loading frame catalog...
            </div>
          ) : (
            <div className="carousels-container">
              {/* NEW ARRIVALS SECTION */}
              {newArrivalsProducts.length > 0 && (
                <div className="carousel-section">
                  <div className="carousel-section-header">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <h2 className="carousel-section-title">New Arrivals</h2>
                    </div>
                    <p className="carousel-section-desc">Handcrafted items fresh from our workshops, added within the last 7 days.</p>
                  </div>
                  <div className="carousel-row">
                    <div className="carousel-viewport-wrapper">
                      {newArrivalsIndex > 0 && (
                        <button className="carousel-arrow carousel-arrow-prev" onClick={() => setNewArrivalsIndex(p => Math.max(0, p - 1))}>
                          &larr;
                        </button>
                      )}
                      <div className="carousel-viewport">
                        <div className="carousel-track" style={{ transform: `translateX(${newArrivalsTranslation})` }}>
                          {newArrivalsProducts.map((p) => (
                            <div className="carousel-slide" key={p.id}>
                              {renderProductCard(p)}
                            </div>
                          ))}
                        </div>
                      </div>
                      {newArrivalsIndex < newArrivalsProducts.length - itemsPerPage && (
                        <button className="carousel-arrow carousel-arrow-next" onClick={() => setNewArrivalsIndex(p => Math.min(newArrivalsProducts.length - itemsPerPage, p + 1))}>
                          &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PORTRAIT SECTION */}
              {portraitProducts.length > 0 && (
                <div className="carousel-section">
                  <div className="carousel-section-header">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <h2 className="carousel-section-title">Portrait Frames</h2>
                      <a href="/catalog/portrait" className="carousel-view-all-link">
                        View All &rarr;
                      </a>
                    </div>
                    <p className="carousel-section-desc">Bespoke vertical wood profiles designed for portraits, headshots, and vertical moments.</p>
                  </div>
                  <div className="carousel-row">
                    <div className="carousel-viewport-wrapper">
                      {portraitIndex > 0 && (
                        <button className="carousel-arrow carousel-arrow-prev" onClick={() => setPortraitIndex(p => Math.max(0, p - 1))}>
                          &larr;
                        </button>
                      )}
                      <div className="carousel-viewport">
                        <div className="carousel-track" style={{ transform: `translateX(${portraitTranslation})` }}>
                          {portraitProducts.map((p) => (
                            <div className="carousel-slide" key={p.id}>
                              {renderProductCard(p)}
                            </div>
                          ))}
                        </div>
                      </div>
                      {portraitIndex < portraitProducts.length - itemsPerPage && (
                        <button className="carousel-arrow carousel-arrow-next" onClick={() => setPortraitIndex(p => Math.min(portraitProducts.length - itemsPerPage, p + 1))}>
                          &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* LANDSCAPE SECTION */}
              {landscapeProducts.length > 0 && (
                <div className="carousel-section">
                  <div className="carousel-section-header">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <h2 className="carousel-section-title">Landscape Frames</h2>
                      <a href="/catalog/landscape" className="carousel-view-all-link">
                        View All &rarr;
                      </a>
                    </div>
                    <p className="carousel-section-desc">Timeless horizontal borders crafted for panoramas, landscapes, and wide memories.</p>
                  </div>
                  <div className="carousel-row">
                    <div className="carousel-viewport-wrapper">
                      {landscapeIndex > 0 && (
                        <button className="carousel-arrow carousel-arrow-prev" onClick={() => setLandscapeIndex(p => Math.max(0, p - 1))}>
                          &larr;
                        </button>
                      )}
                      <div className="carousel-viewport">
                        <div className="carousel-track" style={{ transform: `translateX(${landscapeTranslation})` }}>
                          {landscapeProducts.map((p) => (
                            <div className="carousel-slide" key={p.id}>
                              {renderProductCard(p)}
                            </div>
                          ))}
                        </div>
                      </div>
                      {landscapeIndex < landscapeProducts.length - itemsPerPage && (
                        <button className="carousel-arrow carousel-arrow-next" onClick={() => setLandscapeIndex(p => Math.min(landscapeProducts.length - itemsPerPage, p + 1))}>
                          &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* BOARD GAMES SECTION */}
              {boardGamesProducts.length > 0 && (
                <div className="carousel-section">
                  <div className="carousel-section-header">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <h2 className="carousel-section-title">Board Games</h2>
                      <a href="/catalog/board-games" className="carousel-view-all-link">
                        View All &rarr;
                      </a>
                    </div>
                    <p className="carousel-section-desc">Luxury wooden board games crafted for family fun and timeless aesthetic value.</p>
                  </div>
                  <div className="carousel-row">
                    <div className="carousel-viewport-wrapper">
                      {boardGamesIndex > 0 && (
                        <button className="carousel-arrow carousel-arrow-prev" onClick={() => setBoardGamesIndex(p => Math.max(0, p - 1))}>
                          &larr;
                        </button>
                      )}
                      <div className="carousel-viewport">
                        <div className="carousel-track" style={{ transform: `translateX(${boardGamesTranslation})` }}>
                          {boardGamesProducts.map((p) => (
                            <div className="carousel-slide" key={p.id}>
                              {renderProductCard(p)}
                            </div>
                          ))}
                        </div>
                      </div>
                      {boardGamesIndex < boardGamesProducts.length - itemsPerPage && (
                        <button className="carousel-arrow carousel-arrow-next" onClick={() => setBoardGamesIndex(p => Math.min(boardGamesProducts.length - itemsPerPage, p + 1))}>
                          &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="cart-empty-icon">
                <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a.75.75 0 1 0 0-1.5.75 0 0 0 0 1.5Zm6 0a.75.75 0 1 0 0-1.5.75 0 0 0 0 1.5Z" clipRule="evenodd" />
              </svg>
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