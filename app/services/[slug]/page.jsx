"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BeforeAfterSlider from "../../components/BeforeAfterSlider";

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

const SERVICES_DATA = {
  "bespoke-framing": {
    title: "Bespoke Picture Framing",
    tagline: "Handcrafted To Perfection",
    desc: "Every frame is individually built by hand in our local workshop. We select high-grade local wood, cure it to prevent warping, and shape it with premium moulding profiles.",
    image: "/images/bespoke_framing.png",
    priceInfo: "Pricing starts from Rs. 2,500 depending on dimensions and wood selection.",
    features: [
      "Solid cured local pine, walnut, and oak mouldings",
      "Acid-free double mounting mats (matboards) to protect artwork",
      "Premium scratch-resistant acrylic and conservation glass choices",
      "Individually hand-assembled and quality-tested in our studio",
      "Includes premium hanging hardware and mounting wire"
    ],
    detailedText: "Our bespoke picture framing service is designed for those who appreciate the finer details. We don't believe in mass production. Each frame begins as raw lumber, which is carefully selected for grain consistency and strength. We cure the wood to ensure it will never warp or crack, even in humid climates. Our artisans then mill, join, and finish the frames using traditional techniques passed down through generations. Whether you are framing a family photograph, a modern art print, or a canvas painting, we customize the borders, dimensions, and depth to create a perfect museum-quality presentation.",
    ctaText: "Launch Studio Builder",
    ctaLink: "/customize",
    gallery: [
      { img: "/images/wood-bg.png", caption: "Premium Hardwood Selections" },
      { img: "/images/window_light_frame.png", caption: "Daylight Shadow Interaction" },
      { img: "/images/dummyImg.jpg", caption: "Traditional Joinery Work" }
    ]
  },
  "fine-art-printing": {
    title: "Giclée Fine Art Printing",
    tagline: "Archival Quality Prints",
    desc: "Send us your digital images. We print on museum-grade canvas or fine-textured paper using professional wide-format pigment plotters. Colors are perfectly calibrated.",
    image: "/images/fine_art_printing.png",
    priceInfo: "Printing starts from Rs. 1,200 depending on size and media type.",
    features: [
      "Archival 380gsm matte cotton canvas",
      "12-color Lucia PRO pigment inks (fade-proof for 100+ years)",
      "Digital color grading & image resolution upscaling by default",
      "Fine art textured papers (Hahnemühle style)",
      "Stretching and gallery wrapping services available"
    ],
    detailedText: "Transform your digital files into breathtaking tangible art. Our Giclée printing service utilizes museum-grade plotters with 12-color pigment-based ink systems. Unlike standard laser or inkjet prints, Giclée prints offer exceptional color depth, smooth gradients, and fade-resistance that lasts for over a century. We print on thick, archival cotton canvas and acid-free fine art papers. Before printing, our digital technicians inspect every file, performing color calibration and advanced image upscaling to ensure your artwork looks sharp and vibrant even at large scales.",
    ctaText: "Upload & Print Image",
    ctaLink: "/catalog",
    gallery: [
      { img: "/images/paper.png", caption: "Fine Textured Archival Stock" },
      { img: "/images/dummyImg.jpg", caption: "Calibration & Profiling" },
      { img: "/images/wood-bg.png", caption: "Canvas Wrapping Base" }
    ]
  },
  "gallery-walls": {
    title: "Gallery Wall Layouts",
    tagline: "Curated Space Design",
    desc: "Have a blank staircase, hallway, or living space? We design curated collections of frames that fit together in complete harmony to reflect your personal memories.",
    image: "/images/gallery_walls.png",
    priceInfo: "Custom consultations start from Rs. 5,000 including blueprints.",
    features: [
      "Custom multi-frame spacing blueprints and 3D renders",
      "Virtual render previews for your specific walls",
      "Includes absolute life-sized wall-hanging paper templates",
      "Curated wood trim matching for consistent aesthetics",
      "Expert alignment advice and layout optimization"
    ],
    detailedText: "A gallery wall is more than just a collection of pictures; it is a visual narrative of your life, travel, and tastes. Designing one can be overwhelming—which is why our experts are here to help. We analyze your wall dimensions, furniture placement, and lighting to design a perfectly balanced layout. We provide you with 3D digital renders showing exactly how the frames will look in your space. Once approved, we deliver the complete set of frames along with a life-sized paper hanging template that marks the exact screw locations, making installation incredibly easy and stress-free.",
    ctaText: "Consult Designer",
    ctaLink: "/contact",
    gallery: [
      { img: "/images/window_light_frame.png", caption: "Modern Hallway Arrangements" },
      { img: "/images/dummyImg.jpg", caption: "Aesthetic Matting Variations" },
      { img: "/images/wood-bg.png", caption: "Cohesive Material Palette" }
    ]
  },
  // "heritage-conservation": {
  //   title: "Heritage Conservation",
  //   tagline: "Preserving Family History",
  //   desc: "Preserve your original historical documents, hand-drawn sketches, vintage rugs, or family heirlooms. We package them securely inside acid-free preservation frames.",
  //   image: "/images/heritage_conservation.png",
  //   priceInfo: "Conservation assessments and custom preservation starts from Rs. 8,000.",
  //   features: [
  //     "Reversible mounting techniques (no adhesive damage)",
  //     "99% UV-blocking conservation museum acrylic",
  //     "Dust and humidity-controlled rear framing seal",
  //     "Acid-free buffered mounting boards to prevent yellowing",
  //     "Expert handling by certified preservation artisans"
  //   ],
  //   detailedText: "Valuable documents, historic heirlooms, and vintage objects deserve specialized care to protect them from environmental damage. Standard framing materials contain acid that yellow papers and degrade fabrics over time. Our heritage conservation framing uses 100% reversible mounting methods, acid-free mats, and specialized barrier boards. We use museum-grade acrylic that filters out 99% of harmful UV rays, protecting colors from fading and paper from becoming brittle. Rest assured that your family treasures will be safely preserved for future generations to cherish.",
  //   ctaText: "Book Assessment",
  //   ctaLink: "/contact",
  //   gallery: [
  //     { img: "/images/paper.png", caption: "Acid-Free Mounting Matting" },
  //     { img: "/images/dummyImg.jpg", caption: "UV-Blocking Shielding Glass" },
  //     { img: "/images/wood-bg.png", caption: "Humidity Controlled Sealed Backing" }
  //   ]
  // },
  "photo-restoration": {
    title: "Old Photo Restoration",
    tagline: "Resurrecting Your Memories",
    desc: "Bring your damaged, faded, or torn family photographs back to life. Our digital restoration specialists repair cracks, restore lost colors, and upscale resolutions for printing.",
    image: "/images/photo_restoration.png",
    priceInfo: "Restorations start from Rs. 1,499 per photo depending on level of damage.",
    features: [
      "Scratch, crease, and tear removal",
      "Advanced AI colorization of black & white photos",
      "High-fidelity upscaling and detail sharpening",
      "Digital delivery + premium printing options",
      "Water damage and stain reconstruction"
    ],
    detailedText: "Every photograph is a window to a moment in time, but physical prints degrade, fade, and tear. Our professional restoration service carefully reconstructs your cherished images pixel by pixel. We remove scratches, fix cracks, balance faded colors, and can even colorize monochrome photos to make them feel alive today. Combining state-of-the-art AI upscaling with meticulous digital painting, we ensure that the final result looks completely natural while retaining the vintage soul of the original capture.",
    ctaText: "Upload Image for Quote",
    ctaLink: "/contact",
    gallery: [
      { img: "/images/restoration/couple_after.png", caption: "Vintage Portrait Restored" },
      { img: "/images/restoration/family_after.png", caption: "Creases & Faded Colors Fixed" },
      { img: "/images/restoration/soldier_after.png", caption: "Water Damage Repaired" }
    ],
    previews: [
      {
        before: "/images/restoration/couple_before.png",
        after: "/images/restoration/couple_after.png",
        title: "1940s Couple Portrait",
        desc: "Removed deep scratches, yellowing, and creases while sharpening faces."
      },
      {
        before: "/images/restoration/family_before.png",
        after: "/images/restoration/family_after.png",
        title: "Faded Color Family Photo",
        desc: "Restored natural color tones, contrast, and fixed torn paper edges."
      },
      {
        before: "/images/restoration/soldier_before.png",
        after: "/images/restoration/soldier_after.png",
        title: "Sepia Soldier Portrait",
        desc: "Fixed heavy water stain damage and reconstructed missing corners."
      },
      {
        before: "/images/restoration/child_before.png",
        after: "/images/restoration/child_after.png",
        title: "Blurry Childhood Memory",
        desc: "AI upscaled, de-blurred, and enhanced facial details for printing."
      },
      {
        before: "/images/restoration/landscape_before.png",
        after: "/images/restoration/landscape_after.png",
        title: "Sun-Faded Vintage Landscape",
        desc: "Rebalanced color channels to remove yellow-blue shifts."
      }
    ]
  }
};

export default function ServiceDetailPage({ params }) {
  const { slug } = params;
  const service = SERVICES_DATA[slug];

  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [lightOn, setLightOn] = useState(true);

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

  if (!service) {
    return (
      <div className="services-root" style={{ padding: "120px 40px", textAlign: "center" }}>
        <Navbar onCartOpen={() => setCartOpen(true)} />
        <div style={{ margin: "100px auto", maxWidth: "600px" }}>
          <h1 className="hero-title">Service <span>Not Found</span></h1>
          <p className="hero-desc" style={{ margin: "24px auto" }}>
            The page you are looking for does not exist or has been moved.
          </p>
          <a href="/services" className="btn-premium">Back to Services</a>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="services-root">
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

        .services-lamp .lamp-head {
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
          top: 76px;
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

        /* GLOW & PARTICLES */
        .exquisite-glow-container {
          top: 68px !important;
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
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          opacity: 0;
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
          animation: rotate 20s linear 0s infinite alternate;
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
          animation: pulse 1.5s linear 0s infinite alternate;
        }

        .particle {
          position: absolute;
          top: calc(50% - 5px);
          left: calc(50% - 5px);
          width: 10px;
          height: 10px;
          border-radius: 50%;
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
            transform: translate3d(100px,100px,0);
            opacity: 0;
          }
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
          font-size: 48px;
          color: var(--text);
          letter-spacing: 0.05em;
          line-height: 1.2;
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
          margin: 0;
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
        
        /* Rounded borders on service cards */
        .service-card {
          background: linear-gradient(135deg, var(--surface) 0%, #100D0B 100%);
          border-radius: var(--radius);
          box-shadow: inset 0 0 0 1.5px var(--accent), 0 12px 30px rgba(0, 0, 0, 0.6);
          padding: 45px;
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 50px;
          align-items: center;
          position: relative;
          overflow: hidden;
        }
        
        /* Rounded borders on service visuals */
        .service-visual {
          background: #080605;
          border-radius: var(--radius);
          border: 1px solid var(--border2);
          overflow: hidden;
          aspect-ratio: 4/3;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: inset 0 0 15px rgba(0,0,0,0.8);
        }
        .service-visual img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .service-info {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .service-name {
          font-family: var(--font-display);
          font-size: 32px;
          color: var(--accent);
          letter-spacing: 0.02em;
        }

        .service-tagline {
          font-family: var(--font-typewriter);
          font-size: 13px;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: -8px;
        }
        
        .service-desc {
          font-family: var(--font-serif);
          font-size: 16px;
          line-height: 1.7;
          color: var(--text2);
        }

        .service-price-box {
          background: rgba(20, 17, 14, 0.6);
          border: 1px dashed rgba(212, 175, 55, 0.3);
          border-radius: 12px;
          padding: 16px 20px;
          font-family: var(--font-typewriter);
          font-size: 13px;
          color: var(--text);
          line-height: 1.5;
        }
        
        .service-features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 8px;
        }
        
        .service-features li {
          font-family: var(--font-serif);
          font-size: 14px;
          color: var(--text);
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        
        .service-features li::before {
          content: "✓";
          color: var(--accent);
          font-weight: bold;
          font-size: 15px;
        }

        .service-info .btn-group {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 10px;
        }

        /* Gallery/Related Images Section */
        .service-gallery-section {
          margin-top: 40px;
        }

        .gallery-title {
          font-family: var(--font-display);
          font-size: 24px;
          color: var(--text);
          margin-bottom: 24px;
          letter-spacing: 0.02em;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .gallery-card {
          background: var(--surface2);
          border-radius: var(--radius);
          border: 1px solid var(--border);
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(0,0,0,0.4);
          transition: all 0.3s ease;
        }

        .gallery-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent);
          box-shadow: 0 12px 30px rgba(0,0,0,0.6);
        }

        .gallery-img-wrap {
          aspect-ratio: 3/2;
          overflow: hidden;
          background: #080605;
          position: relative;
        }

        .gallery-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .gallery-card:hover .gallery-img-wrap img {
          transform: scale(1.05);
        }

        .gallery-caption {
          padding: 16px;
          font-family: var(--font-typewriter);
          font-size: 11px;
          color: var(--text2);
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.05em;
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
          0% { transform: translate(-20%, -20%) scale(1); }
          25% { transform: translate(100%, 10%) scale(1.2); }
          50% { transform: translate(40%, 40%) scale(0.9); }
          75% { transform: translate(-10%, 30%) scale(1.1); }
          100% { transform: translate(-20%, -20%) scale(1); }
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
        .cart-drawer.open { transform: translateX(0); }
        
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
        .cart-close-btn:hover { color: var(--accent); }
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
        .cart-empty-icon { font-size: 48px; }
        
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
        }
        .cart-item-remove:hover { color: #FF5A5A; }
        
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
        }

        @keyframes glow-warm {
          0% { box-shadow: 0 0 100px 35px rgba(251, 191, 36, 0.85), 35px 20px 75px 15px #fff, -5px -35px 45px 8px #fff; }
          100% { box-shadow: 0 0 140px 35px rgba(251, 191, 36, 0.95), 50px 30px 60px 15px #fff, -45px -45px 60px 8px #fff; }
        }

        @media (max-width: 850px) {
          .hero-title { font-size: 36px; }
          .services-section { padding: 40px 20px; }
          .service-card { grid-template-columns: 1fr; padding: 30px; gap: 30px; }
          .service-visual { aspect-ratio: 16/9; }
          .gallery-grid { grid-template-columns: 1fr; gap: 20px; }
          .service-info .btn-group { flex-direction: column; align-items: stretch; gap: 12px; }
        }
      ` }} />

      <Navbar onCartOpen={() => setCartOpen(true)} />

      <div className="hero-banner">
        {/* Suspended Brass Lamp on top of Our Services heading */}
        <div className={`exquisite-lamp services-lamp ${lightOn ? 'on' : ''}`}>
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
              </div>
            </div>
          </div>
        </div>

        <h1 className="hero-title">{service.title.split(" ").slice(0, -1).join(" ")} <span>{service.title.split(" ").slice(-1)}</span></h1>
        <p className="hero-desc">
          {service.tagline} — Premium handcrafting tailored for your specific gallery needs.
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
        {/* Dynamic liquid backdrop elements */}
        <div className="catalog-glass-bg">
          <div className="liquid-blob-1" />
          <div className="liquid-blob-2" />
          <div className="catalog-glow" />
        </div>

        {/* Frosted Glass overlay sheet */}
        <div className="catalog-glass-pane" />

        <div className="services-container">
          <div className="service-card">
            <div className="service-visual">
              <img src={service.image} alt={service.title} />
            </div>
            <div className="service-info">
              <h2 className="service-name">{service.title}</h2>
              <div className="service-tagline">{service.tagline}</div>
              <p className="service-desc">{service.detailedText}</p>

              <div className="service-price-box">
                <strong>Price Detail:</strong><br />
                {service.priceInfo}
              </div>

              <ul className="service-features">
                {service.features.map((feat, idx) => (
                  <li key={idx}>{feat}</li>
                ))}
              </ul>

              <div className="btn-group">
                <a href={service.ctaLink} className="btn-premium">{service.ctaText}</a>
                <a href="/services" className="btn-premium-ghost">All Services</a>
              </div>
            </div>
          </div>

          {/* Related Images / Process Section */}
          {service.previews && (
            <div className="service-gallery-section">
              <h3 className="gallery-title">Interactive Before & After Previews</h3>
              <p style={{ color: "var(--text2)", marginBottom: "32px", fontSize: "14px", fontFamily: "var(--font-serif)", lineHeight: "1.6" }}>
                Drag the slider handle on each image to compare the original damaged photo (Left) with our fully restored version (Right).
              </p>
              <div className="previews-grid" style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "32px"
              }}>
                {service.previews.map((item, idx) => (
                  <div key={idx} className="preview-card" style={{
                    background: "var(--surface2)",
                    borderRadius: "var(--radius)",
                    border: "1.5px solid var(--border)",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.4)"
                  }}>
                    <BeforeAfterSlider before={item.before} after={item.after} />
                    <div className="preview-info" style={{ textAlign: "left" }}>
                      <h4 className="preview-title" style={{ fontFamily: "var(--font-display)", color: "var(--accent)", fontSize: "16px", marginBottom: "4px", fontWeight: "600" }}>{item.title}</h4>
                      <p className="preview-desc" style={{ fontSize: "13px", color: "var(--text2)", lineHeight: "1.4", fontFamily: "var(--font-serif)" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
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
