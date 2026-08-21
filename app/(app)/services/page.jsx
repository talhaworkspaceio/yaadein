"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BeforeAfterSlider from "../components/BeforeAfterSlider";
import { useServicesPageContent } from "../../lib/cms";
import { ref, onValue, set } from "firebase/database";
import { db } from "../../lib/firebase";

export const INITIAL_DEFAULT_SERVICES = [
  {
    id: "instagram-mirror-selfie",
    title: "Instagram Mirror Selfie Frame",
    slug: "instagram-mirror-selfie",
    tagline: "Viral Interactive Selfie Mirror",
    shortDesc: "Transform your space with a custom-crafted Instagram Reel & Post mirror frame. Complete with personalized handle, verified badge, likes count, custom audio title, and high-clarity HD mirror center for unforgettable selfies.",
    detailedText: "Take your selfie game and interior decor to the next level with our handcrafted Instagram Mirror Selfie Frame. Designed to replicate an authentic Instagram Reel UI complete with your custom handle, blue verified checkmark, custom audio name, and engagement stats. Featuring a high-definition shatterproof mirror at its center, this frame turns everyday mirror selfies into viral social media moments. It is tailor-made for cafes, fashion boutiques, photo studios, and modern bedrooms looking to add a stylish, interactive aesthetic centerpiece.",
    priceInfo: "Custom mirror frames start from Rs. 4,999 depending on size and acrylic finishes.",
    imageUrl: "/images/instagram_mirror_selfie.jpg",
    features: [
      "Custom engraved Instagram Reel UI (Username, verified badge & audio)",
      "High-definition shatterproof studio acrylic mirror",
      "Interactive social stats: Likes, Comments, Shares & Bookmarks",
      "Perfect aesthetic focal point for cafés, boutiques, studios & bedrooms",
      "Includes solid wood back support and heavy-duty wall mounting hardware"
    ],
    ctaText: "Customize & Order Mirror",
    ctaLink: "/contact",
  },
  {
    id: "nikkahnama-framing",
    title: "Nikkah Nama Framing",
    slug: "nikkahnama-framing",
    tagline: "Preserve Your Sacred Bond",
    shortDesc: "Preserve the most sacred contract of your life in a premium handcrafted frame. We specialize in archival-grade Nikkah Nama framing, utilizing acid-free mounts and museum glass to ensure your signature bond stays protected and visually stunning for generations.",
    detailedText: "Your Nikkah Nama is more than just a document — it is the celebration of a sacred vow. Our specialized Nikkah Nama framing service ensures this precious heirloom is protected from aging, moisture, and sunlight. We use 100% acid-free mats to prevent discoloration, and offer museum-grade conservation glass that blocks 99% of harmful UV rays. Each frame is custom-built by hand to perfectly match the size and aesthetic of your contract, completed with elegant gold accents and double matting for a truly royal look.",
    priceInfo: "Framing starts from Rs. 4,000 depending on dimensions and wood selection.",
    imageUrl: "/images/nikkahnama_images/sample1.jpeg",
    features: [
      "Custom-fit double mounting with elegant gold borders",
      "99% UV-protection museum glass options",
      "Selection of premium local and imported wood trims",
      "Dust and humidity-controlled rear framing seal",
      "Includes premium hanging hardware and mounting wire"
    ],
    ctaText: "Upload & Frame Nikkah Nama",
    ctaLink: "/contact",
  },
  {
    id: "photo-restoration",
    title: "Old Photo Restoration",
    slug: "photo-restoration",
    tagline: "Bring Memories Back to Life",
    shortDesc: "Bring your damaged, faded, or torn family photographs back to life. Our digital restoration specialists repair cracks, restore lost colors, and upscale resolutions for printing.",
    detailedText: "Every photograph is a window to a moment in time, but physical prints degrade, fade, and tear. Our professional restoration service carefully reconstructs your cherished images pixel by pixel. We remove scratches, fix cracks, balance faded colors, and can even colorize monochrome photos to make them feel alive today. Combining state-of-the-art AI upscaling with meticulous digital painting, we ensure that the final result looks completely natural while retaining the vintage soul of the original capture.",
    priceInfo: "Restorations start from Rs. 1,499 per photo depending on level of damage.",
    imageUrl: "/images/photo_restoration.png",
    features: [
      "Scratch, crease, and tear removal",
      "Advanced AI colorization of black & white photos",
      "High-fidelity upscaling and detail sharpening",
      "Digital delivery + premium printing options",
      "Water damage and stain reconstruction"
    ],
    ctaText: "Upload Image for Quote",
    ctaLink: "/contact",
  },
  {
    id: "photo-editing",
    title: "Photo Editing Service",
    slug: "photo-editing",
    tagline: "Professional Digital Retouching",
    shortDesc: "Enhance, retouch, and transform your digital photos before printing and framing. Whether you need background removal, beauty retouching, object removal, or professional color grading, our digital artists prepare your images to look their absolute best.",
    detailedText: "Make every photo a masterpiece before it goes on your wall. Our professional digital editing service covers everything from subtle enhancements to major manipulations. Our skilled artists carefully adjust colors, exposure, and composition to give your photos a cinematic quality. We can remove distracting elements in the background, blend multiple photos, perform high-end skin and portrait retouching, and upscale lower resolution files so they print beautifully at larger sizes.",
    priceInfo: "Edits start from Rs. 1,000 per photo depending on level of retouching.",
    imageUrl: "/images/restoration/child_after.png",
    features: [
      "Professional beauty retouching and skin correction",
      "Background replacement and unwanted object removal",
      "Cinematic color grading and lighting adjustments",
      "High-resolution sharpening and upscaling",
      "Object manipulation and custom creative edits"
    ],
    ctaText: "Upload Image for Editing",
    ctaLink: "/contact",
  },
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

const saveCart = (cart) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("fs_cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("fs-cart-updated"));
};

export default function ServicesPage() {
  const { data: servicesCms } = useServicesPageContent();
  const [cartItems, setCartItems] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    try {
      const servicesRef = ref(db, "cms_services");
      const unsub = onValue(servicesRef, (snapshot) => {
        const val = snapshot.val();
        let list = [];
        if (val) {
          list = Array.isArray(val) ? val : Object.values(val);
        }

        let hasNewMerged = false;
        const mergedList = [...list];
        INITIAL_DEFAULT_SERVICES.forEach(defSrv => {
          const exists = mergedList.some(s => s.id === defSrv.id || s.slug === defSrv.slug);
          if (!exists) {
            mergedList.push(defSrv);
            hasNewMerged = true;
          }
        });

        if (isMounted) {
          setServicesList(mergedList);
          setLoading(false);
        }
        if (hasNewMerged) {
          set(ref(db, "cms_services"), mergedList).catch(console.error);
        }
      });
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {
      console.warn("[Firebase Services] Error fetching services:", e);
      if (isMounted) {
        setServicesList(INITIAL_DEFAULT_SERVICES);
        setLoading(false);
      }
    }
  }, []);

  const [cartOpen, setCartOpen] = useState(false);
  const [lightOn, setLightOn] = useState(true);

  // Lock background page scroll while the cart drawer is open.
  useEffect(() => {
    document.documentElement.style.overflow = cartOpen ? "hidden" : "";
    document.body.style.overflow = cartOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [cartOpen]);

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
      return acc + priceVal * (item.quantity || 1);
    }, 0);
  };

  return (
    <div className="services-root">
      <style dangerouslySetInnerHTML={{
        __html: `
        .exquisite-lamp {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 240px;
          margin-bottom: 25px;
          z-index: 20;
        }

        .services-lamp {
          margin-top: -30px;
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
          width: 440px;
          height: 24px;
          background: linear-gradient(to bottom, #362710 0%, #8f723b 25%, #dfc38a 45%, #fae7b5 55%, #8f723b 75%, #362710 100%);
          border: 1px solid #1a1205;
          border-radius: 12px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.3);
          position: relative;
        }

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
        .lamp-bulb.on { opacity: 1; }

        .lamp-light-beam {
          position: absolute;
          top: 116px;
          left: 50%;
          transform: translateX(-50%);
          width: 650px;
          height: 500px;
          background: radial-gradient(ellipse at top, rgba(255, 238, 180, 0.38) 0%, rgba(255, 238, 180, 0.15) 35%, rgba(255, 238, 180, 0.04) 60%, transparent 75%);
          filter: blur(30px);
          pointer-events: none;
          z-index: 15;
          opacity: 0;
          transition: opacity 0.25s ease-in-out;
        }
        .lamp-light-beam.on { opacity: 1; }

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
        
        .hero-desc {
          font-family: var(--font-serif);
          font-size: 16px;
          color: var(--text2);
          max-width: 650px;
          line-height: 1.7;
        }
        
        .services-section {
          padding: 80px 40px;
          position: relative;
          overflow: hidden;
          background: #080605;
          max-width: 100%;
          width: 100%;
        }

        .services-container {
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
          z-index: 3;
          display: flex;
          flex-direction: column;
          gap: 50px;
        }
        
        .service-card {
          background: linear-gradient(135deg, var(--surface) 0%, #100D0B 100%);
          border-radius: var(--radius);
          box-shadow: inset 0 0 0 1.5px var(--accent), 0 12px 30px rgba(0, 0, 0, 0.6);
          padding: 40px;
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 40px;
          align-items: center;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }
        .service-card:hover {
          transform: translateY(-6px);
          box-shadow: inset 0 0 0 2px var(--accent2), 0 20px 45px rgba(0,0,0,0.8), 0 0 20px rgba(212,175,55,0.25);
        }
        
        .service-card:nth-child(even) {
          grid-template-columns: 1.2fr 1fr;
        }
        
        .service-card:nth-child(even) .service-visual {
          order: 2;
        }
        
        .service-visual {
          background: #080605;
          border-radius: var(--radius);
          border: 1px solid var(--border2);
          overflow: hidden;
          aspect-ratio: 4/3;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          position: relative;
          box-shadow: inset 0 0 15px rgba(0,0,0,0.8);
        }
        .service-visual img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        
        .service-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
        }
        
        .service-name {
          font-family: var(--font-display);
          font-size: 28px;
          color: var(--accent);
          letter-spacing: 0.02em;
        }
        
        .service-desc {
          font-size: 15px;
          line-height: 1.7;
          color: var(--text2);
        }
        
        .service-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }
        
        .service-features li {
          font-size: 14px;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .service-features li::before {
          content: "✦";
          color: var(--accent);
          font-size: 12px;
        }
        
        .btn-service {
          margin-top: 10px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--accent);
          color: #1A1100;
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          padding: 14px 28px;
          border-radius: var(--radius);
          text-decoration: none;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
        }
        .btn-service:hover {
          background: var(--accent2);
          transform: translateX(4px);
        }

        .light-control-panel {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          background: rgba(20, 15, 10, 0.8);
          border: 1px solid rgba(201, 168, 76, 0.3);
          padding: 8px 20px;
          border-radius: 30px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
          margin-top: 10px;
        }
        .light-control-label {
          font-family: var(--font-display);
          font-size: 11px;
          letter-spacing: 0.15em;
          color: var(--accent);
          text-transform: uppercase;
          font-weight: 700;
        }
        .light-switch-btn {
          width: 44px;
          height: 22px;
          background: #1c150c;
          border: 1px solid var(--border2);
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          transition: background 0.3s ease;
          padding: 0;
        }
        .light-switch-btn.on { background: var(--accent); }
        .light-switch-knob {
          width: 16px;
          height: 16px;
          background: #fff;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }
        .light-switch-btn.on .light-switch-knob {
          transform: translateX(22px);
          background: #000;
        }

        @media (max-width: 800px) {
          .hero-banner {
            padding: 80px 20px 40px !important;
          }
          .hero-title {
            font-size: 36px !important;
          }
          .hero-desc {
            font-size: 14px !important;
            line-height: 1.6 !important;
          }
          .catalog-lamp, .services-lamp {
            transform: scale(0.6) !important;
            transform-origin: top center !important;
            margin-top: -10px !important;
            margin-bottom: -70px !important;
          }
          .catalog-lamp .lamp-rod, .services-lamp .lamp-rod {
            height: 120px !important;
          }

          .services-section { padding: 40px 20px; gap: 30px; }
          .service-card { grid-template-columns: 1fr !important; padding: 24px; gap: 20px; }
          .service-visual { order: -1 !important; aspect-ratio: 16/9; }
        }
      ` }} />

      <Navbar onCartOpen={() => setCartOpen(true)} />

      <div className="hero-banner">
        {/* Suspended Brass Lamp on top of Our Services heading */}
        <div className={`exquisite-lamp catalog-lamp services-lamp ${lightOn ? 'on' : ''}`}>
          <div className="lamp-rod" />
          <div className="lamp-mount" />
          <div className="lamp-arm" />
          <div className="lamp-head">
            <div className={`lamp-bulb ${lightOn ? 'on' : ''}`} />
          </div>

          {/* Light beam */}
          <div className={`lamp-light-beam ${lightOn ? 'on' : ''}`} />
        </div>

        {servicesCms?.eyebrow && <span className="hero-eyebrow" style={{ color: "var(--accent)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.15em", display: "block", marginBottom: "8px" }}>{servicesCms.eyebrow}</span>}
        <h1 className="hero-title">{servicesCms?.heroTitle || servicesCms?.title || "Our Services"}</h1>
        <p className="hero-desc">
          {servicesCms?.heroSubtitle || servicesCms?.subtitle || "Handcrafted in Pakistan with archival materials, museum-grade glass, and century-tested woodworking precision."}
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

      <section className="services-section">
        <div className="services-container">
          {loading ? (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "100px 20px",
              gap: "20px"
            }}>
              <div style={{
                width: 44,
                height: 44,
                border: "2px solid rgba(201, 168, 76, 0.15)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              <span style={{
                fontFamily: "var(--font-typewriter)",
                fontSize: "12px",
                color: "var(--accent)",
                letterSpacing: "0.15em",
                textTransform: "uppercase"
              }}>
                Loading Studio Services...
              </span>
            </div>
          ) : servicesList && servicesList.length > 0 ? (
            servicesList.map((srv, idx) => {
              const rawSlug = srv.slug || "";
              const cleanSlug = rawSlug.replace(/^\//, '');
              const imgUrl = srv.featuredImage || srv.imageUrl || srv.mainImage?.url || "/images/bespoke_framing.png";
              const featBullets = (srv.features && srv.features.length > 0)
                ? srv.features.map(f => typeof f === 'string' ? f : (f.featureText || f))
                : [];

              return (
                <div key={srv.id || idx} className="service-card">
                  <div className="service-visual">
                    {cleanSlug === "photo-restoration" ? (
                      <BeforeAfterSlider
                        before="/images/restoration/couple_before.png"
                        after="/images/restoration/couple_after.png"
                        style={{ width: "100%", height: "100%", aspectRatio: "auto", border: "none", borderRadius: "0", boxShadow: "none" }}
                      />
                    ) : cleanSlug === "photo-editing" ? (
                      <BeforeAfterSlider
                        before="/images/restoration/child_before.png"
                        after="/images/restoration/child_after.png"
                        style={{ width: "100%", height: "100%", aspectRatio: "auto", border: "none", borderRadius: "0", boxShadow: "none" }}
                      />
                    ) : (
                      <img
                        src={imgUrl}
                        alt={srv.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </div>
                  <div className="service-info">
                    <h2 className="service-name">{srv.title}</h2>
                    <p className="service-desc">{srv.shortDesc || srv.detailedText}</p>
                    {featBullets.length > 0 && (
                      <ul className="service-features">
                        {featBullets.map((bullet, bIdx) => (
                          <li key={bIdx}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                    {srv.enableNavigationButton !== false && (
                      <a href={`/services/${cleanSlug}`} className="btn-service">
                        {(srv.ctaText ? srv.ctaText.replace(/Nikkah\s*Nama/gi, "Nikkahnama") : "Explore Details")} &rarr;
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", color: "var(--text2)", padding: "60px 0" }}>
              No services found.
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
