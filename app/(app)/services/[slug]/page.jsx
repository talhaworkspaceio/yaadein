"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";


import { db } from "../../../lib/firebase";
import { ref, onValue } from "firebase/database";
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

const formatPrice = (priceNum) => `Rs. ${priceNum.toLocaleString()}`;

// Extract the "starts from Rs. X" figure out of the priceInfo sentence
const extractServicePrice = (priceInfo) => {
  const match = (priceInfo || "").match(/Rs\.?\s*([\d,]+)/);
  return match ? parseInt(match[1].replace(/,/g, ""), 10) : 0;
};

const parsePriceNum = (priceStr) => {
  if (!priceStr) return 0;
  return parseInt(priceStr.replace(/[^0-9]/g, "")) || 0;
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
  "photo-restoration": {
    title: "Old Photo Restoration",
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
    ],
    // Black & white vs. colorized pairs shown in the main frame swiper and the grid below
    colorPreviews: [
      {
        bw: "/images/restoration/couple_after.png",
        color: "/images/restoration/couple_color.png",
        title: "1940s Couple Portrait",
        desc: "Hand-tinted colorization applied to a black & white studio portrait."
      },
      {
        bw: "/images/restoration/family_bw.png",
        color: "/images/restoration/family_after.png",
        title: "Family Dinner Photo",
        desc: "Full color restored alongside a true black & white rendition."
      },
      {
        bw: "/images/restoration/soldier_bw.png",
        color: "/images/restoration/soldier_after.png",
        title: "Sepia Soldier Portrait",
        desc: "Vintage sepia tone compared with a neutral black & white version."
      },
      {
        bw: "/images/restoration/child_bw.png",
        color: "/images/restoration/child_after.png",
        title: "Childhood Garden Memory",
        desc: "Vivid color print compared with a true black & white rendition."
      },
      {
        bw: "/images/restoration/landscape_bw.png",
        color: "/images/restoration/landscape_after.png",
        title: "Vintage Landscape",
        desc: "Rebalanced natural color compared with a true black & white rendition."
      }
    ]
  },
  "nikkahnama-framing": {
    title: "Nikkah Nama Framing",
    // tagline: "Preserve Your Sacred Bond",
    desc: "Preserve the most sacred contract of your life in a premium handcrafted frame. We specialize in archival-grade Nikkah Nama framing, utilizing acid-free mounts and museum glass to ensure your signature bond stays protected and visually stunning for generations.",
    image: "/images/nikkahnama_images/sample1.jpeg",
    priceInfo: "Framing starts from Rs. 4,000 depending on dimensions and wood selection.",
    features: [
      "Custom-fit double mounting with elegant gold borders",
      "99% UV-protection museum glass options",
      "Selection of premium local and imported wood trims",
      "Dust and humidity-controlled rear framing seal",
      "Includes premium hanging hardware and mounting wire"
    ],
    detailedText: "Your Nikkah Nama is more than just a document — it is the celebration of a sacred vow. Our specialized Nikkah Nama framing service ensures this precious heirloom is protected from aging, moisture, and sunlight. We use 100% acid-free mats to prevent discoloration, and offer museum-grade conservation glass that blocks 99% of harmful UV rays. Each frame is custom-built by hand to perfectly match the size and aesthetic of your contract, completed with elegant gold accents and double matting for a truly royal look.",
    ctaText: "Upload & Frame Nikkah Nama",
    ctaLink: "/contact",
    gallery: [
      { img: "/images/paper.png", caption: "Archival Mounting & Matting" },
      { img: "/images/dummyImg.jpg", caption: "Premium Portrait Frame" },
      { img: "/images/wood-bg.png", caption: "Solid Cured Wood Backing" }
    ]
  },
  "photo-editing": {
    title: "Photo Editing Service",
    tagline: "Professional Digital Retouching",
    desc: "Enhance, retouch, and transform your digital photos before printing and framing. Whether you need background removal, beauty retouching, object removal, or professional color grading, our digital artists prepare your images to look their absolute best.",
    image: "/images/restoration/child_after.png",
    priceInfo: "Edits start from Rs. 1,000 per photo depending on level of retouching.",
    features: [
      "Professional beauty retouching and skin correction",
      "Background replacement and unwanted object removal",
      "Cinematic color grading and lighting adjustments",
      "High-resolution sharpening and upscaling",
      "Object manipulation and custom creative edits"
    ],
    detailedText: "Make every photo a masterpiece before it goes on your wall. Our professional digital editing service covers everything from subtle enhancements to major manipulations. Our skilled artists carefully adjust colors, exposure, and composition to give your photos a cinematic quality. We can remove distracting elements in the background, blend multiple photos, perform high-end skin and portrait retouching, and upscale lower resolution files so they print beautifully at larger sizes.",
    ctaText: "Upload Image for Editing",
    ctaLink: "/contact",
    gallery: [
      { img: "/images/restoration/child_after.png", caption: "Beauty Retouching & Enhancement" },
      { img: "/images/restoration/landscape_after.png", caption: "Color Correction & Grading" },
      { img: "/images/restoration/couple_color.png", caption: "Creative Image Adjustments" }
    ],
    previews: [
      {
        before: "/images/restoration/child_before.png",
        after: "/images/restoration/child_after.png",
        title: "Portrait Beauty Retouching",
        desc: "Smoothened skin textures, enhanced lighting, and removed background distractions."
      },
      {
        before: "/images/restoration/landscape_before.png",
        after: "/images/restoration/landscape_after.png",
        title: "Landscape Color Grading",
        desc: "Corrected exposure, enhanced colors, and brought out hidden cloud details."
      },
      {
        before: "/images/restoration/soldier_before.png",
        after: "/images/restoration/soldier_after.png",
        title: "Vintage Portrait Enhancement",
        desc: "Fixed contrast issues, sharpened facial details, and enhanced overall clarity."
      }
    ]
  },
  "instagram-mirror-selfie": {
    title: "Instagram Mirror Selfie Frame",
    tagline: "Viral Interactive Selfie Mirror",
    desc: "Transform your space with a custom-crafted Instagram Reel & Post mirror frame. Complete with personalized handle, verified badge, likes count, custom audio title, and high-clarity HD mirror center for unforgettable selfies.",
    image: "/images/instagram_mirror_selfie.jpg",
    priceInfo: "Custom mirror frames start from Rs. 4,999 depending on size and acrylic finishes.",
    features: [
      "Custom engraved Instagram Reel UI (Username, verified badge & audio)",
      "High-definition shatterproof studio acrylic mirror",
      "Interactive social stats: Likes, Comments, Shares & Bookmarks",
      "Perfect aesthetic focal point for cafés, boutiques, studios & bedrooms",
      "Includes solid wood back support and heavy-duty wall mounting hardware"
    ],
    detailedText: "Take your selfie game and interior decor to the next level with our handcrafted Instagram Mirror Selfie Frame. Designed to replicate an authentic Instagram Reel UI complete with your custom handle, blue verified checkmark, custom audio name, and engagement stats. Featuring a high-definition shatterproof mirror at its center, this frame turns everyday mirror selfies into viral social media moments. It is tailor-made for cafes, fashion boutiques, photo studios, and modern bedrooms looking to add a stylish, interactive aesthetic centerpiece.",
    ctaText: "Customize & Order Mirror",
    ctaLink: "/contact",
    gallery: [
      { img: "/images/instagram_mirror_selfie.jpg", caption: "Custom Instagram Mirror Frame" },
      { img: "/images/wood-bg.png", caption: "Solid Cured Wood Backing" },
      { img: "/images/window_light_frame.png", caption: "Studio Light Reflection" }
    ]
  }
};


// Lamp glow & particle system (identical structure to the product page, rendered via map)
const LampParticles = ({ lightOn }) => (
  <>
    {[...Array(6)].map((_, gi) => (
      <div key={gi} className={`lamp-glow-container exquisite-glow-container ${lightOn ? "on" : ""}`}>
        <div className="glow"></div>
        <div className="particles">
          <div className="rotate">
            {[...Array(5)].map((_, ai) => (
              <div key={ai} className="angle">
                <div className="size">
                  <div className="position">
                    <div className="pulse">
                      <div className="particle"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ))}
  </>
);

export default function ServiceDetailPage({ params }) {
  const resolvedParams = use(params);
  const rawSlug = resolvedParams?.slug || "";
  const slug = rawSlug.replace(/^\//, '');

  const [cmsService, setCmsService] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchCmsService() {
      if (!slug) return;
      try {
        const res = await fetch(`/api/services?where[or][0][slug][equals]=${slug}&where[or][1][slug][equals]=/${slug}&depth=2`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.docs && json.docs.length > 0 && isMounted) {
            setCmsService(json.docs[0]);
          }
        }
      } catch (err) {
        console.warn('[CMS Service] Error fetching service document:', err);
      }
    }
    fetchCmsService();
    return () => { isMounted = false; };
  }, [slug]);

  const fallbackService = SERVICES_DATA[slug];

  const service = cmsService ? {
    title: cmsService.title || fallbackService?.title || slug.replace(/-/g, ' ').toUpperCase(),
    tagline: cmsService.tagline || fallbackService?.tagline || "Custom Bespoke Service",
    desc: cmsService.shortDesc || cmsService.detailedText || fallbackService?.desc || "Handcrafted custom framing service designed to your exact specifications.",
    image: cmsService.mainImage?.url || cmsService.imageUrl || fallbackService?.image || "/images/bespoke_framing.png",
    priceInfo: cmsService.priceInfo ? (cmsService.priceInfo.includes("Rs.") ? cmsService.priceInfo : `Starting from Rs. ${cmsService.priceInfo}`) : (fallbackService?.priceInfo || "Starting from Rs. 2,500"),
    features: (cmsService.features && cmsService.features.length > 0)
      ? cmsService.features.map(f => typeof f === 'string' ? f : (f.featureText || f))
      : (fallbackService?.features || [
          "Handcrafted by master craftspeople in Pakistan",
          "Custom size and dimensions tailored to your request",
          "Archival quality materials and premium finishing"
        ]),
    detailedText: cmsService.detailedText || cmsService.shortDesc || fallbackService?.detailedText || "Each piece is individually built by hand in our workshop using premium local materials and traditional craftsmanship.",
    ctaText: cmsService.ctaText || fallbackService?.ctaText || "Order Service",
    ctaLink: cmsService.ctaLink || fallbackService?.ctaLink || "/contact",
    gallery: fallbackService?.gallery || [
      { img: cmsService.mainImage?.url || cmsService.imageUrl || "/images/bespoke_framing.png", caption: "Custom Service Showcase" }
    ],
    previews: fallbackService?.previews,
    colorPreviews: fallbackService?.colorPreviews,
  } : fallbackService;

  const [cartItems, setCartItems] = useState([]);


  const [cartOpen, setCartOpen] = useState(false);
  const [lightOn, setLightOn] = useState(true);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Frame selection (optional)
  const [frames, setFrames] = useState([]);
  const [selectedCustomFrame, setSelectedCustomFrame] = useState(null);
  const [frameModalOpen, setFrameModalOpen] = useState(false);

  // Custom photo upload
  const [userUploadedImage, setUserUploadedImage] = useState(null);
  const fileInputRef = useRef(null);

  // Active slide index for restoration swiper
  const [activeSlide, setActiveSlide] = useState(0);

  // Lock background page scroll while a modal (frame picker or cart drawer) is open.
  // The page scrolls via <html>, not <body>, so both must be locked.
  useEffect(() => {
    const shouldLock = frameModalOpen || cartOpen;
    document.documentElement.style.overflow = shouldLock ? "hidden" : "";
    document.body.style.overflow = shouldLock ? "hidden" : "";
    // Pause the always-on lamp glow/particle CSS animations while a modal covers
    // them — they're invisible but still repaint every frame, which forces the
    // modal's backdrop-filter to keep recompositing and jank/hang the scroll.
    document.body.classList.toggle("modal-open", shouldLock);
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
    };
  }, [frameModalOpen, cartOpen]);

  // Fetch all frames from Firebase database (for the optional frame picker)
  useEffect(() => {
    const framesRef = ref(db, "frames");
    const unsub = onValue(framesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const framesList = Object.entries(data).map(([key, val]) => ({
          id: key,
          docId: key,
          ...val
        }));
        setFrames(framesList.filter((f) => f.category !== "Board Games"));
      } else {
        setFrames([]);
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

  // ----- Pricing -----
  const servicePriceNum = extractServicePrice(service?.priceInfo);
  const framePriceNum = selectedCustomFrame ? parsePriceNum(selectedCustomFrame.price) : 0;
  const totalPriceNum = servicePriceNum + framePriceNum;
  const totalPriceStr = formatPrice(totalPriceNum);

  // ----- Photo & Frame preview -----
  const currentPhoto = userUploadedImage || service?.image;

  const getPaddings = () => {
    if (slug === "photo-restoration" && !selectedCustomFrame) {
      return { top: 7.22, left: 6.04, bottom: 7.06, right: 6.07 };
    }
    if (!selectedCustomFrame) return { top: 7, left: 7, bottom: 7, right: 7 };
    const p = selectedCustomFrame;
    return {
      top: Number(p.paddingTop) || 0,
      left: Number(p.paddingLeft) || 0,
      bottom: Number(p.paddingBottom) || 0,
      right: Number(p.paddingRight) || 0
    };
  };
  const paddings = getPaddings();

  // ----- Upload handlers -----
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setUserUploadedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => fileInputRef.current?.click();
  const removeCustomImage = () => setUserUploadedImage(null);

  // ----- Frame picker -----
  const handleSelectFrame = (frame) => {
    setSelectedCustomFrame(frame);
    setFrameModalOpen(false);
  };

  const clearSelectedFrame = () => {
    setSelectedCustomFrame(null);
    setFrameModalOpen(false);
  };

  // ----- Add to Cart -----
  const handleAddToCart = async () => {
    if (!service) return;

    let finalImage = currentPhoto;
    if (userUploadedImage) {
      try {
        finalImage = await resizeImage(userUploadedImage, 150, 150);
      } catch (err) {
        console.error("Error compressing user image:", err);
      }
    }

    const item = {
      id: `service-${slug}${selectedCustomFrame ? `-${selectedCustomFrame.id}` : ""}`,
      frameName: service.title,
      frameColor: selectedCustomFrame?.color || "",
      price: totalPriceStr,
      size: selectedCustomFrame ? selectedCustomFrame.name : "Service Only",
      orientation: "landscape",
      rotation: 0,
      image: finalImage
    };

    const cart = getCart();
    const existingIndex = cart.findIndex(
      (x) => x.id === item.id && x.size === item.size && x.image === item.image
    );

    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }
    saveCart(cart);
    setCartOpen(true);
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

  const descText = service.detailedText || service.desc;

  return (
    <div className={`service-page-root ${(slug === "photo-restoration" || slug === "photo-editing") ? "photo-restoration-page" : ""} ${slug === "nikkahnama-framing" ? "nikkahnama-page" : ""} ${slug === "instagram-mirror-selfie" ? "instagram-mirror-selfie-page" : ""}`}>

      <style dangerouslySetInnerHTML={{
        __html: `
        .service-page-root {
          font-family: var(--font-serif);
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
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
          max-width: 460px;
          padding-top: 180px;
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
          width: 550px;
          height: 550px;
          background: radial-gradient(circle, rgba(255, 238, 180, 0.22) 0%, rgba(255, 238, 180, 0.08) 50%, transparent 80%);
          filter: blur(32px);
          z-index: 1;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .exquisite-wall-glow.on { opacity: 1; }

        /* Picture Light structure (identical to product page) */
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
          height: 108px;
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
          width: 220px;
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
        .lamp-bulb.on { opacity: 1; }

        .lamp-light-beam {
          position: absolute;
          top: 110px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 650px;
          background: radial-gradient(ellipse at top, rgba(255, 238, 180, 0.45) 0%, rgba(255, 238, 180, 0.2) 35%, rgba(255, 238, 180, 0.06) 65%, transparent 85%);
          filter: blur(35px);
          pointer-events: none;
          z-index: 15;
          opacity: 0;
          transition: opacity 0.25s ease-in-out;
        }
        .lamp-light-beam.on { opacity: 1; }

        /* Freeze the always-running decorative background animations while a
           modal is open. They sit behind the modal's blurred overlay, so a
           repainting animation there forces the browser to keep recompositing
           the blur every frame — this is what made the frame picker feel like
           it hung when scrolling. */
        body.modal-open .glow,
        body.modal-open .rotate,
        body.modal-open .rotate .angle,
        body.modal-open .rotate .angle .size,
        body.modal-open .rotate .angle .size .position,
        body.modal-open .rotate .angle .size .position .pulse,
        body.modal-open .particle,
        body.modal-open .particle::before,
        body.modal-open .particle::after,
        body.modal-open .catalog-glow,
        body.modal-open .liquid-blob-1,
        body.modal-open .liquid-blob-2 {
          animation-play-state: paused !important;
        }

        /* GLOW & PARTICLES */
        .exquisite-glow-container { top: 108px !important; }
        .lamp-glow-container {
          position: absolute;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          pointer-events: none;
        }
        .glow { display: none; }
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
        .exquisite-glow-container.on .particles { opacity: 1; }
        .rotate {
          position: absolute;
          top: calc(50% - 5px);
          left: calc(50% - 5px);
          width: 10px;
          height: 10px;
          animation: rotate 120s linear 0s infinite alternate;
        }
        .angle { position: absolute; top: 0; left: 0; }
        .size { position: absolute; top: 0; left: 0; }
        .position { position: absolute; top: 0; left: 0; }
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
        @keyframes rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes angle { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes size { 0% { transform: scale(.2); } 100% { transform: scale(.6); } }
        @keyframes position {
          0% { transform: translate3d(0,0,0); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: translate3d(180px, 140px, 0); opacity: 0; }
        }
        @keyframes float-firefly-1 {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-100px, -80px, 0); }
        }
        @keyframes float-firefly-2 {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(100px, -120px, 0); }
        }
        @keyframes pulse { 0% { transform: scale(1); } 100% { transform: scale(.5); } }
        @keyframes particle-warm {
          0% { box-shadow: inset 0 0 10px 10px #D4AF37, 0 0 30px 5px #F59E0B, inset 0 0 40px 40px #FFF59D; }
          33.33% { box-shadow: inset 0 0 10px 10px #D4AF37, 0 0 60px 5px #F59E0B, inset 0 0 25px 25px #FFF59D; }
          33.34% { box-shadow: inset 0 0 10px 10px #FCD34D, 0 0 30px 5px #FCD34D, inset 0 0 40px 40px #FFF; }
          66.66% { box-shadow: inset 0 0 10px 10px #FCD34D, 0 0 60px 5px #FCD34D, inset 0 0 25px 25px #FFF; }
          66.67% { box-shadow: inset 0 0 10px 10px #D97706, 0 0 30px 5px #D97706, inset 0 0 40px 40px #FF8A00; }
          100% { box-shadow: inset 0 0 10px 10px #D97706, 0 0 60px 5px #D97706, inset 0 0 25px 25px #FF8A00; }
        }
        .rotate .angle:nth-child(1) { animation: angle 60s steps(5) 0s infinite; }
        .rotate .angle:nth-child(1) .size { animation: size 60s steps(5) 0s infinite; }
        .rotate .angle:nth-child(1) .particle { animation: particle-warm 8s linear infinite alternate; }
        .rotate .angle:nth-child(1) .position { animation: position 18s linear 0s infinite; }
        .rotate .angle:nth-child(2) { animation: angle 35s steps(3) -17s infinite; }
        .rotate .angle:nth-child(2) .size { animation: size 35s steps(3) -17s infinite alternate; }
        .rotate .angle:nth-child(2) .particle { animation: particle-warm 7s linear -4.6s infinite alternate; }
        .rotate .angle:nth-child(2) .position { animation: position 15s linear 0s infinite; }
        .rotate .angle:nth-child(3) { animation: angle 80s steps(8) -40s infinite; }
        .rotate .angle:nth-child(3) .size { animation: size 40s steps(4) -30s infinite alternate; }
        .rotate .angle:nth-child(3) .particle { animation: particle-warm 6.5s linear -2.2s infinite alternate; }
        .rotate .angle:nth-child(3) .position { animation: position 16s linear 0s infinite; }
        .rotate .angle:nth-child(4) { animation: angle 50s steps(6) -12s infinite; }
        .rotate .angle:nth-child(4) .size { animation: size 50s steps(6) -25s infinite alternate; }
        .rotate .angle:nth-child(4) .particle { animation: particle-warm 9s linear -3s infinite alternate; }
        .rotate .angle:nth-child(4) .position { animation: position 20s linear -5s infinite; }
        .rotate .angle:nth-child(5) { animation: angle 70s steps(7) -35s infinite; }
        .rotate .angle:nth-child(5) .size { animation: size 35s steps(5) -15s infinite alternate; }
        .rotate .angle:nth-child(5) .particle { animation: particle-warm 7.5s linear -5s infinite alternate; }
        .rotate .angle:nth-child(5) .position { animation: position 22s linear -8s infinite; }

        /* Landscape Picture Frame (always rotated like the product page landscape mode) */
        .exquisite-wood-frame {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 340px;
          aspect-ratio: 2 / 3; /* Keep portrait native ratio to avoid stretching texture, then rotate */
          box-shadow: 0 25px 50px rgba(0,0,0,0.85);
          overflow: hidden;
          background: #000;
          transform: rotate(90deg);
          margin: 60px 0;
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
        .exquisite-wood-frame.light-on::after { opacity: 1; }

        .wood-frame-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: fill;
          z-index: 12;
          pointer-events: none;
        }

        /* Default wooden border shown when no custom frame is selected */
        .default-frame-border {
          position: absolute;
          inset: 0;
          z-index: 12;
          pointer-events: none;
          border: 22px solid;
          border-image: linear-gradient(135deg, #2b1f0d 0%, #5e461b 25%, #8f723b 50%, #5e461b 75%, #2b1f0d 100%) 1;
          box-shadow: inset 0 0 12px rgba(0,0,0,0.85);
        }

        .exquisite-inner-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
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
        .exquisite-wood-frame.light-on .exquisite-inner-photo::after { opacity: 1; }

        .exquisite-inner-photo img {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 152% !important;
          height: 152% !important;
          object-fit: cover !important;
          display: block;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center center;
          transform: translate(-50%, -50%) rotate(-90deg); /* Counter-rotate photo inside landscape frame */
        }

        .glass-reflection {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%, rgba(255,255,255,0.01) 100%);
          z-index: 11;
          pointer-events: none;
        }

        /* --- Right Column: Paper Config Panel (embossed wrinkled paper) --- */
        .product-config-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-self: center;
          max-width: 460px;
          width: 100%;
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }

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
          align-self: center;
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
          font-size: 46px;
          font-weight: normal;
          color: #2c1e11;
          line-height: 1.1;
          text-shadow: 0.5px 0.5px 0px rgba(255, 255, 255, 0.6);
        }

        .product-price-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .product-price-val {
          font-family: var(--font-typewriter);
          font-size: 22px;
          font-weight: 700;
          color: #8b1e1e; /* Vintage red ink stamp */
          text-shadow: 0.5px 0.5px 0px rgba(255, 255, 255, 0.6);
        }

        .price-note {
          font-family: var(--font-typewriter);
          font-size: 10px;
          color: #8b5e3c;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .product-desc-text {
          font-family: var(--font-typewriter);
          font-size: 13px;
          line-height: 1.6;
          color: #2c1e11;
        }
        .product-desc-text.clamped {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .read-more-btn {
          background: none;
          border: none;
          color: #8b1e1e;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          padding: 4px 0;
          align-self: flex-start;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-family: var(--font-typewriter);
          margin-top: -6px;
          text-decoration: underline;
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

        /* Choose Frame Trigger Button */
        .choose-frame-btn {
          background: rgba(255, 255, 255, 0.35);
          border: 1px dashed rgba(139, 94, 60, 0.6);
          border-radius: 6px;
          color: #21160a;
          padding: 12px 16px;
          cursor: pointer;
          font-family: var(--font-typewriter);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.5);
          text-align: left;
        }
        .choose-frame-btn:hover {
          background: rgba(255, 255, 255, 0.85);
          border-color: #8b5e3c;
        }
        .choose-frame-btn .frame-selected-name {
          color: #8b5e3c;
          font-size: 11px;
        }
        .choose-frame-btn.has-frame {
          background: rgba(139, 94, 60, 0.12);
          border: 1.5px solid #8b5e3c;
        }

        .clear-frame-link {
          background: none;
          border: none;
          color: #8b1e1e;
          font-family: var(--font-typewriter);
          font-size: 10px;
          text-decoration: underline;
          cursor: pointer;
          align-self: flex-start;
          padding: 0;
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
          background: #2c1e11 !important;
          color: #f6f0df !important;
          font-family: var(--font-display) !important;
          font-weight: 700 !important;
          letter-spacing: 0.08em;
          box-shadow: 0 4px 12px rgba(44, 30, 17, 0.25);
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
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
          cursor: pointer;
        }
        .action-row .btn-premium-ghost:hover {
          background: rgba(44, 30, 17, 0.08) !important;
          transform: translateY(-2px);
        }

        /* Scoped Light Switch Styling (above paper card) */
        .light-control-panel {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(20, 17, 14, 0.6);
          border: 1.5px solid rgba(212, 175, 55, 0.25);
          padding: 8px 18px;
          border-radius: 999px;
          z-index: 30;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          transition: border-color 0.3s ease;
          width: fit-content;
        }
        .light-control-panel:hover { border-color: rgba(212, 175, 55, 0.5); }
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

        /* FRAME SELECTION MODAL */
        .frame-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .frame-modal-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }
        .frame-modal {
          background: linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%);
          border: 3px solid #1C0F07;
          outline: 1px solid var(--border);
          outline-offset: -4px;
          border-radius: var(--radius);
          width: 100%;
          max-width: 720px;
          max-height: 82vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 60px rgba(0,0,0,0.9);
          transform: translateY(20px) scale(0.98);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .frame-modal-overlay.open .frame-modal {
          transform: translateY(0) scale(1);
        }
        .frame-modal-header {
          padding: 20px 24px;
          border-bottom: 2px solid #1C0F07;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .frame-modal-header h3 {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--accent);
        }
        .frame-modal-close {
          background: none;
          border: none;
          color: var(--text2);
          font-size: 28px;
          cursor: pointer;
          line-height: 1;
          transition: color 0.15s ease;
        }
        .frame-modal-close:hover { color: var(--accent); }
        .frame-modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .frame-modal-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 18px;
        }
        .frame-option-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          background: var(--surface2);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          padding: 14px 10px;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: center;
        }
        .frame-option-card:hover {
          border-color: var(--accent);
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.5);
        }
        .frame-option-card.selected {
          border: 1.5px solid var(--accent);
          box-shadow: 0 0 12px rgba(212, 175, 55, 0.35);
        }
        .frame-option-thumb {
          width: 72px;
          height: 96px;
          border-radius: 4px;
          overflow: hidden;
          background: #111;
          border: 1px solid rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .frame-option-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .frame-option-thumb-placeholder {
          color: rgba(201, 168, 76, 0.25);
          font-size: 22px;
          font-family: var(--font-display);
        }
        .frame-option-name {
          font-family: var(--font-typewriter);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text);
          line-height: 1.4;
        }
        .frame-option-price {
          font-family: var(--font-typewriter);
          font-size: 11px;
          font-weight: 700;
          color: var(--accent);
        }
        .frame-modal-footer {
          padding: 16px 24px;
          border-top: 2px solid #1C0F07;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .frame-modal-none-btn {
          background: none;
          border: 1px solid var(--border2);
          border-radius: 6px;
          color: var(--text2);
          font-family: var(--font-typewriter);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 10px 18px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .frame-modal-none-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .frame-modal-empty {
          text-align: center;
          color: var(--text2);
          font-family: var(--font-typewriter);
          font-size: 12px;
          padding: 40px 0;
        }

        /* PRODUCT DETAIL SECTION WRAPPER & BACKDROP */
        .product-detail-section {
          position: relative;
          width: 100%;
          overflow: hidden;
          display: flex;
          flex: 1;
          align-items: center;
        }

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
          0% { transform: translate(0, 0) scale(1) rotate(0deg); border-radius: 43% 57% 51% 49% / 57% 40% 60% 43%; }
          33% { transform: translate(80px, -60px) scale(1.15) rotate(45deg); border-radius: 54% 46% 38% 62% / 49% 70% 30% 51%; }
          66% { transform: translate(-40px, 80px) scale(0.9) rotate(90deg); border-radius: 35% 65% 60% 40% / 50% 35% 65% 50%; }
          100% { transform: translate(0, 0) scale(1) rotate(180deg); border-radius: 43% 57% 51% 49% / 57% 40% 60% 43%; }
        }
        @keyframes liquid-move-2 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%; }
          50% { transform: translate(-100px, 50px) scale(1.2) rotate(120deg); border-radius: 38% 62% 62% 38% / 68% 48% 52% 32%; }
          100% { transform: translate(60px, -70px) scale(0.9) rotate(-60deg); border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%; }
        }

        /* BEFORE & AFTER PREVIEWS SECTION (unchanged) */
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
        .service-gallery-section { margin-top: 0; }
        .gallery-title {
          font-family: var(--font-display);
          font-size: 24px;
          color: var(--text);
          margin-bottom: 24px;
          letter-spacing: 0.02em;
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
        .cart-drawer-overlay.open { opacity: 1; pointer-events: auto; }
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
        .cart-drawer-body { flex: 1; overflow-y: auto; padding: 24px; }
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
        .cart-items-list { display: flex; flex-direction: column; gap: 20px; }
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
        .cart-item-details { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .cart-item-name { font-family: var(--font-display); font-size: 15px; color: var(--text); }
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
        .cart-item-qty-row { display: flex; align-items: center; gap: 12px; margin-top: 4px; }
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
        .qty-btn:hover { background: var(--accent); color: #1A1100; border-color: var(--accent); }
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
        .btn-checkout-primary { display: block; width: 100%; text-align: center; }

        /* Responsive */
        @media (max-width: 900px) {
          .product-container {
            grid-template-columns: 1fr;
            gap: 50px;
            padding: 40px 24px;
          }
          .product-visual-pane { padding-top: 90px; }
          .exquisite-wood-frame { max-width: 280px; margin: 40px 0; }
          .services-section { padding: 40px 20px; }
        }
        @media (max-width: 580px) {
          .product-title { font-size: 32px; }
          .product-price-val { font-size: 20px; }
          .exquisite-wood-frame { max-width: 230px; }
        }

        /* PHOTO RESTORATION CUSTOM LAYOUT & NEUTRAL LIGHTING */
        .photo-restoration-page .product-visual-pane {
          padding-top: 20px;
          align-items: center;
        }

        .photo-restoration-page .exquisite-frame-component {
          padding-top: 130px;
          max-width: 520px;
          width: 100%;
        }

        /* Shell around the frame — invisible to layout except on the restoration page,
           where it anchors the swiper arrows outside the frame */
        .restoration-frame-shell {
          display: contents;
        }
        .photo-restoration-page .restoration-frame-shell {
          display: block;
          position: relative;
          width: 100%;
          max-width: 480px;
          margin: 30px 0 0 0;
        }

        /* Prevent frame rotation and apply landscape proportions */
        .photo-restoration-page .exquisite-wood-frame.restoration-frame {
          transform: none !important;
          aspect-ratio: 1.5 !important;
          max-width: 480px !important;
          width: 100% !important;
          margin: 0 !important;
          box-shadow: 0 20px 45px rgba(0,0,0,0.85);
        }

        .photo-restoration-page .exquisite-wood-frame.restoration-frame .exquisite-inner-photo img {
          position: relative !important;
          top: auto !important;
          left: auto !important;
          transform: none !important;
          width: 100% !important;
          height: 100% !important;
        }

        /* Nikkah Nama frame — keep it upright (portrait), no 90deg rotation */
        .exquisite-wood-frame.nikkahnama-frame {
          transform: none !important;
          aspect-ratio: 2 / 3 !important;
          max-width: 300px;
          /* Top margin drops the frame below the lamp for breathing room;
             the larger bottom margin keeps the frame centred on the config panel */
          margin: 40px 0 130px 0;
        }
        .exquisite-wood-frame.nikkahnama-frame .exquisite-inner-photo img {
          position: relative !important;
          top: auto !important;
          left: auto !important;
          transform: none !important;
          width: 100% !important;
          height: 100% !important;
        }
        /* Tighten the lamp head-room so the upright frame sits under the lamp and
           aligns with the config panel instead of hanging low */
        .nikkahnama-page .product-visual-pane {
          padding-top: 40px;
        }
        .nikkahnama-page .exquisite-frame-component {
          padding-top: 150px;
        }

        /* Frameless mode for Photo Editing service */
        .exquisite-wood-frame.no-frame-border {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .exquisite-wood-frame.no-frame-border::after {
          display: none !important;
        }
        .exquisite-wood-frame.no-frame-border .exquisite-inner-photo {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 12px 35px rgba(0,0,0,0.6);
        }

        /* Instagram Mirror Selfie — upright portrait 9:16 ratio, frameless, full image */
        .exquisite-wood-frame.instagram-mirror-frame {
          transform: none !important;
          aspect-ratio: 9 / 16 !important;
          max-width: 320px !important;
          width: 100% !important;
          margin: 0px 0 60px 0 !important;
          background: transparent !important;
          border: none !important;
          border-image: none !important;
          box-shadow: none !important;
        }
        .exquisite-wood-frame.instagram-mirror-frame::after {
          display: none !important;
        }
        .exquisite-wood-frame.instagram-mirror-frame .default-frame-border {
          display: none !important;
        }
        .exquisite-wood-frame.instagram-mirror-frame .exquisite-inner-photo {
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 45px rgba(0,0,0,0.85);
        }
        .exquisite-wood-frame.instagram-mirror-frame .exquisite-inner-photo img {
          position: relative !important;
          top: auto !important;
          left: auto !important;
          transform: none !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
        }
        .instagram-mirror-selfie-page .product-visual-pane {
          padding-top: 10px;
        }
        .instagram-mirror-selfie-page .exquisite-frame-component {
          padding-top: 120px;
        }


        /* Swiper Carousel styles inside photo frame */
        .restoration-swiper-container {
          position: relative;
          width: 100%;
          height: 100%;
          background: #080605;
          overflow: hidden;
        }

        .restoration-slide {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s ease-in-out;
        }

        .restoration-slide.active {
          opacity: 1;
          pointer-events: auto;
          z-index: 2;
        }

        /* Swiper Prev/Next Arrows */
        .photo-restoration-page .swiper-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(28, 15, 7, 0.85);
          border: 1px solid #dfc38a;
          color: #dfc38a;
          font-size: 20px;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 30;
          transition: all 0.2s ease;
          padding: 0;
          line-height: 1;
        }

        .photo-restoration-page .swiper-arrow:hover {
          background: #dfc38a;
          color: #1c0f07;
          box-shadow: 0 0 10px rgba(223, 195, 138, 0.4);
        }

        .photo-restoration-page .swiper-arrow-prev {
          left: -48px;
        }

        .photo-restoration-page .swiper-arrow-next {
          right: -48px;
        }

        /* On narrow viewports there is no room beside the frame — tuck arrows inside */
        @media (max-width: 640px) {
          .photo-restoration-page .swiper-arrow-prev {
            left: 8px;
            background: rgba(28, 15, 7, 0.7);
          }
          .photo-restoration-page .swiper-arrow-next {
            right: 8px;
            background: rgba(28, 15, 7, 0.7);
          }
        }

        /* Pagination Dots */
        .photo-restoration-page .swiper-pagination {
          position: absolute;
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          z-index: 30;
          padding: 6px 10px;
          background: rgba(28, 15, 7, 0.55);
          border-radius: 999px;
        }

        .photo-restoration-page .swiper-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .photo-restoration-page .swiper-dot.active {
          background: #dfc38a;
          transform: scale(1.2);
          box-shadow: 0 0 6px #dfc38a;
        }
      ` }} />

      <Navbar onCartOpen={() => setCartOpen(true)} />

      <section className="product-detail-section">
        {/* Dynamic liquid backdrop elements */}
        <div className="catalog-glass-bg">
          <div className="liquid-blob-1" />
          <div className="liquid-blob-2" />
          <div className="catalog-glow" />
        </div>

        {/* Frosted Glass overlay sheet */}
        <div className="catalog-glass-pane" />

        <div className="product-container" style={{ position: "relative", zIndex: 3 }}>
          {/* LEFT COLUMN: LAMP + LANDSCAPE FRAME PREVIEW */}
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

                {/* Lamp glow & particle system */}
                <LampParticles lightOn={lightOn} />
              </div>

              {/* Landscape Picture Frame (shell lets swiper arrows sit outside the frame) */}
              <div className="restoration-frame-shell">
                <div className={`exquisite-wood-frame ${lightOn ? "light-on" : ""} ${(slug === "photo-restoration" || slug === "photo-editing") ? "restoration-frame" : ""} ${(slug === "photo-editing" || slug === "instagram-mirror-selfie") ? "no-frame-border" : ""} ${slug === "nikkahnama-framing" ? "nikkahnama-frame" : ""} ${slug === "instagram-mirror-selfie" ? "instagram-mirror-frame" : ""}`}>

                  {slug === "photo-editing" ? null : slug === "photo-restoration" ? (
                    <img
                      src={selectedCustomFrame?.imageUrl || "/frames/landscape/frame-04-correct-size.webp"}
                      alt={selectedCustomFrame?.name || "Landscape Oak Frame"}
                      className="wood-frame-overlay"
                    />
                  ) : slug === "nikkahnama-framing" ? (
                    <img
                      src={selectedCustomFrame?.imageUrl || "/frames/portrait/frame-01-correct-size.webp"}
                      alt={selectedCustomFrame?.name || "Portrait Oak Frame"}
                      className="wood-frame-overlay"
                    />
                  ) : selectedCustomFrame?.imageUrl ? (
                    <img
                      src={selectedCustomFrame.imageUrl}
                      alt={selectedCustomFrame.name}
                      className="wood-frame-overlay"
                    />
                  ) : (
                    <div className="default-frame-border" />
                  )}

                  {/* Photo opening */}
                  <div className="exquisite-inner-photo">
                    {(slug === "photo-restoration" || slug === "photo-editing") && !userUploadedImage ? (
                      <div className="restoration-swiper-container">
                        {(() => {
                          const items = slug === "photo-restoration"
                            ? (service.colorPreviews || []).slice(0, 3)
                            : (service.previews || []).slice(0, 3);
                          return items.map((item, idx) => (
                            <div
                              key={idx}
                              className={`restoration-slide ${idx === activeSlide ? "active" : ""}`}
                            >
                              <BeforeAfterSlider
                                before={slug === "photo-restoration" ? item.bw : item.before}
                                after={slug === "photo-restoration" ? item.color : item.after}
                                labelBefore={slug === "photo-restoration" ? "B&W" : "Before"}
                                labelAfter={slug === "photo-restoration" ? "Color" : "After"}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  aspectRatio: "auto",
                                  border: "none",
                                  borderRadius: "0",
                                  boxShadow: "none"
                                }}
                              />
                            </div>
                          ));
                        })()}

                        {/* Pagination indicators */}
                        <div className="swiper-pagination">
                          {(() => {
                            const items = slug === "photo-restoration"
                              ? (service.colorPreviews || []).slice(0, 3)
                              : (service.previews || []).slice(0, 3);
                            return items.map((_, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveSlide(idx);
                                }}
                                className={`swiper-dot ${idx === activeSlide ? "active" : ""}`}
                                aria-label={`Go to slide ${idx + 1}`}
                              />
                            ));
                          })()}
                        </div>
                      </div>
                    ) : (
                      <img src={currentPhoto} alt={`${service.title} preview`} />
                    )}
                    <div className="glass-reflection" />
                  </div>
                </div>

                {/* Swipe controls — outside the frame on either side.
                    Centered on the photo opening (not the outer frame box):
                    a frame's matting can be top/bottom-asymmetric (e.g. a
                    heavier bottom mat), which shifts the visible photo's
                    center away from the frame's raw 50% midpoint. */}
                {(slug === "photo-restoration" || slug === "photo-editing") && !userUploadedImage && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const items = slug === "photo-restoration"
                          ? (service.colorPreviews || []).slice(0, 3)
                          : (service.previews || []).slice(0, 3);
                        const count = items.length;
                        setActiveSlide((prev) => (prev === 0 ? count - 1 : prev - 1));
                      }}
                      className="swiper-arrow swiper-arrow-prev"
                      style={{ top: `${50 + (paddings.top - paddings.bottom) / 2}%` }}
                      aria-label="Previous image"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const items = slug === "photo-restoration"
                          ? (service.colorPreviews || []).slice(0, 3)
                          : (service.previews || []).slice(0, 3);
                        const count = items.length;
                        setActiveSlide((prev) => (prev === count - 1 ? 0 : prev + 1));
                      }}
                      className="swiper-arrow swiper-arrow-next"
                      style={{ top: `${50 + (paddings.top - paddings.bottom) / 2}%` }}
                      aria-label="Next image"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PAPER CONFIGURATION PANEL */}
          <div className="product-config-column">
            {/* Light Switch panel (placed above the paper card) */}
            <div className="light-control-panel" style={{ alignSelf: "center" }}>
              <span className="light-control-label">Studio Light</span>
              <button
                className={`light-switch-btn ${lightOn ? "on" : ""}`}
                onClick={() => setLightOn(!lightOn)}
                aria-label="Toggle Studio Light"
              >
                <span className="light-switch-knob" />
              </button>
            </div>

            <div className="product-config-pane">
              {/* Service Name + Price */}
              <div className="product-meta-header">
                <span className="product-tag">{service.tagline}</span>
                <h1 className="product-title">{service.title}</h1>
                <div className="product-price-row">
                  <span className="product-price-val">{totalPriceStr}</span>
                  <span className="price-note">
                    {selectedCustomFrame
                      ? `Service + ${selectedCustomFrame.name}`
                      : "Starting price"}
                  </span>
                </div>
              </div>

              {/* Description — 3-line clamp + Read More */}
              <div className="config-section">
                <span className="config-label">Service Description</span>
                <p className={`product-desc-text ${isDescExpanded ? "" : "clamped"}`}>
                  {descText}
                </p>
                {descText.length > 120 && (
                  <button
                    className="read-more-btn"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                  >
                    {isDescExpanded ? "Read Less" : "Read More"}
                  </button>
                )}
              </div>

              {/* Choose Frame */}
              {slug !== "photo-editing" && (
                <div className="config-section">
                  <span className="config-label">Choose Frame</span>
                  <button
                    className={`choose-frame-btn ${selectedCustomFrame ? "has-frame" : ""}`}
                    onClick={() => setFrameModalOpen(true)}
                  >
                    <span>
                      {selectedCustomFrame ? selectedCustomFrame.name : "Browse Frames"}
                    </span>
                    <span className="frame-selected-name">
                      {selectedCustomFrame
                        ? `+ ${formatPrice(framePriceNum)}`
                        : "›"}
                    </span>
                  </button>
                  {selectedCustomFrame && (
                    <button className="clear-frame-link" onClick={clearSelectedFrame}>
                      Remove Selected Frame
                    </button>
                  )}
                </div>
              )}

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
        </div>
      </section>

      {/* INTERACTIVE BLACK & WHITE / COLOR PREVIEWS */}
      {service.colorPreviews && (
        <section className="services-section">
          <div className="services-container">
            <div className="service-gallery-section">
              <h3 className="gallery-title">Interactive Black & White to Color Previews</h3>
              <p style={{ color: "var(--text2)", marginBottom: "32px", fontSize: "14px", fontFamily: "var(--font-serif)", lineHeight: "1.6" }}>
                Drag the slider handle to the right to reveal the colorized version (Left) compared with the original black & white photo (Right).
              </p>
              <div className="previews-grid" style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "32px"
              }}>
                {service.colorPreviews.map((item, idx) => (
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
                    <BeforeAfterSlider before={item.bw} after={item.color} labelBefore="B&W" labelAfter="Color" />
                    <div className="preview-info" style={{ textAlign: "left" }}>
                      <h4 className="preview-title" style={{ fontFamily: "var(--font-display)", color: "var(--accent)", fontSize: "16px", marginBottom: "4px", fontWeight: "600" }}>{item.title}</h4>
                      <p className="preview-desc" style={{ fontSize: "13px", color: "var(--text2)", lineHeight: "1.4", fontFamily: "var(--font-serif)" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* INTERACTIVE BEFORE & AFTER PREVIEWS (Photo Editing) */}
      {service.previews && slug === "photo-editing" && (
        <section className="services-section">
          <div className="services-container">
            <div className="service-gallery-section">
              <h3 className="gallery-title">Interactive Before & After Previews</h3>
              <p style={{ color: "var(--text2)", marginBottom: "32px", fontSize: "14px", fontFamily: "var(--font-serif)", lineHeight: "1.6" }}>
                Drag the slider handle to compare the original photo (Before) with the professionally edited version (After).
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
                    <BeforeAfterSlider before={item.before} after={item.after} labelBefore="Before" labelAfter="After" />
                    <div className="preview-info" style={{ textAlign: "left" }}>
                      <h4 className="preview-title" style={{ fontFamily: "var(--font-display)", color: "var(--accent)", fontSize: "16px", marginBottom: "4px", fontWeight: "600" }}>{item.title}</h4>
                      <p className="preview-desc" style={{ fontSize: "13px", color: "var(--text2)", lineHeight: "1.4", fontFamily: "var(--font-serif)" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />

      {/* FRAME SELECTION MODAL */}
      <div
        className={`frame-modal-overlay ${frameModalOpen ? "open" : ""}`}
        data-lenis-prevent
        onClick={(e) => {
          if (e.target === e.currentTarget) setFrameModalOpen(false);
        }}
      >
        <div className="frame-modal">
          <div className="frame-modal-header">
            <h3>Select a Frame</h3>
            <button className="frame-modal-close" onClick={() => setFrameModalOpen(false)}>×</button>
          </div>
          <div className="frame-modal-body">
            {frames.length === 0 ? (
              <div className="frame-modal-empty">Loading frames...</div>
            ) : (
              <div className="frame-modal-grid">
                {frames.map((f) => (
                  <div
                    key={f.id}
                    className={`frame-option-card ${selectedCustomFrame?.id === f.id ? "selected" : ""}`}
                    onClick={() => handleSelectFrame(f)}
                  >
                    <div className="frame-option-thumb">
                      {f.imageUrl ? (
                        <img src={f.imageUrl} alt={f.name} />
                      ) : (
                        <span className="frame-option-thumb-placeholder">Y</span>
                      )}
                    </div>
                    <span className="frame-option-name">{f.name}</span>
                    <span className="frame-option-price">{f.price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="frame-modal-footer">
            <button className="frame-modal-none-btn" onClick={clearSelectedFrame}>
              Continue Without Frame
            </button>
          </div>
        </div>
      </div>

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
                      {item.size ? `${item.size}${item.orientation ? " / " + item.orientation : ""}` : (item.rotation !== 0 ? `Rotated ${item.rotation}°` : "Portrait")}
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