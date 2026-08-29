"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";


import { db } from "../../../lib/firebase";
import { ref, onValue, push, set } from "firebase/database";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BeforeAfterSlider from "../../components/BeforeAfterSlider";
import FrameLoader from "../../components/FrameLoader";

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
    videoUrl: "",
    gallery: [
      { img: "/images/instagram_mirror_selfie.jpg", caption: "Custom Instagram Mirror Frame" },
      { img: "/images/wood-bg.png", caption: "Solid Cured Wood Backing" },
      { img: "/images/window_light_frame.png", caption: "Studio Light Reflection" }
    ]
  }
};


// Optimized Lamp glow & particle system for smooth 60fps performance
const LampParticles = ({ lightOn }) => (
  <>
    {[...Array(2)].map((_, gi) => (
      <div key={gi} className={`lamp-glow-container exquisite-glow-container ${lightOn ? "on" : ""}`}>
        <div className="glow"></div>
        <div className="particles">
          <div className="rotate">
            {[...Array(2)].map((_, ai) => (
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

const SERVICE_DEFAULT_SIZES = [
  { label: "digital_only", displayLabel: "Digital Copy Only (Digital Delivery)", priceDelta: 0 },
  { label: "12x18", displayLabel: '12" x 18" (Standard)', priceDelta: 0 },
  { label: "16x24", displayLabel: '16" x 24"', priceDelta: 1500 },
  { label: "20x30", displayLabel: '20" x 30" (Large)', priceDelta: 3500 },
  { label: "24x36", displayLabel: '24" x 36" (Statement)', priceDelta: 6000 },
  { label: "custom", displayLabel: 'Custom Dimensions (Custom Quote)', priceDelta: 0 },
];

/**
 * The size dropdown is admin-editable per service. Options saved in the CMS win;
 * services that were never edited keep the built-in list, so nothing changes for
 * them until someone opens the modal.
 *
 * Saved options carry an absolute `price`; the built-in ones carry a `priceDelta`
 * added to the service's starting price. Both are flattened to a final price here
 * so the rest of the page only deals with one shape.
 */
function resolveSizeOptions(service, basePrice) {
  const saved = Array.isArray(service?.sizeOptions) ? service.sizeOptions.filter(Boolean) : null;

  if (saved && saved.length > 0) {
    return saved.map((opt, i) => {
      const kind = opt.kind || "fixed";
      return {
        value: opt.id || `size_${i}`,
        displayLabel: opt.label || `Option ${i + 1}`,
        kind,
        price: kind === "custom" ? basePrice : (parseInt(String(opt.price).replace(/[^0-9]/g, ""), 10) || 0),
      };
    });
  }

  return SERVICE_DEFAULT_SIZES.map((s) => ({
    value: s.label,
    displayLabel: s.displayLabel,
    kind: s.label === "custom" ? "custom" : s.label === "digital_only" ? "digital" : "fixed",
    price: basePrice + (parseInt(s.priceDelta) || 0),
  }));
}

export default function ServiceDetailPage({ params }) {
  const resolvedParams = use(params);
  const rawSlug = resolvedParams?.slug || "";
  const slug = rawSlug.replace(/^\//, '');

  const [cmsService, setCmsService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!slug) {
      setLoading(false);
      return;
    }
    try {
      const servicesRef = ref(db, "cms_services");
      const unsub = onValue(servicesRef, (snapshot) => {
        const val = snapshot.val();
        if (isMounted && val) {
          const list = Array.isArray(val) ? val : Object.values(val);
          const found = list.find(s => s.slug === slug || s.slug === `/${slug}` || s.id === slug);
          if (found) setCmsService(found);
        }
        if (isMounted) {
          setLoading(false);
        }
      });
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {
      console.warn("[Firebase Service Detail] Error fetching service:", e);
      if (isMounted) setLoading(false);
    }
  }, [slug]);

  const fallbackService = SERVICES_DATA[slug] || null;

  const rawImages = Array.isArray(cmsService?.images) && cmsService.images.length > 0
    ? cmsService.images
    : (cmsService?.imageUrl ? [cmsService.imageUrl] : (fallbackService?.image ? [fallbackService.image] : ["/images/bespoke_framing.png"]));

  const featuredImg = cmsService?.featuredImage || cmsService?.imageUrl || fallbackService?.image || rawImages[0] || "/images/bespoke_framing.png";

  // Ensure featuredImg is always at index 0 of the slider
  const serviceImages = rawImages.includes(featuredImg)
    ? [featuredImg, ...rawImages.filter(img => img !== featuredImg)]
    : [featuredImg, ...rawImages];

  const service = (cmsService || fallbackService) ? {
    title: cmsService?.title || fallbackService?.title || (slug ? slug.replace(/-/g, ' ').toUpperCase() : "CUSTOM SERVICE"),
    tagline: cmsService?.tagline || fallbackService?.tagline || "Custom Bespoke Service",
    desc: cmsService?.shortDesc || cmsService?.detailedText || fallbackService?.desc || "Handcrafted custom framing service designed to your exact specifications.",
    image: featuredImg,
    images: serviceImages,
    priceInfo: cmsService?.priceInfo ? (cmsService.priceInfo.includes("Rs.") ? cmsService.priceInfo : `Starting from Rs. ${cmsService.priceInfo}`) : (fallbackService?.priceInfo || "Starting from Rs. 2,500"),
    features: (cmsService?.features && cmsService.features.length > 0)
      ? cmsService.features.map(f => typeof f === 'string' ? f : (f.featureText || f))
      : (fallbackService?.features || [
        "Handcrafted by master craftspeople in Pakistan",
        "Custom size and dimensions tailored to your request",
        "Archival quality materials and premium finishing"
      ]),
    detailedText: cmsService?.detailedText || cmsService?.shortDesc || fallbackService?.detailedText || "Each piece is individually built by hand in our workshop using premium local materials and traditional craftsmanship.",
    ctaText: cmsService?.ctaText || fallbackService?.ctaText || "Order Service",
    ctaLink: cmsService?.ctaLink || fallbackService?.ctaLink || "/contact",
    videoUrl: cmsService?.videoUrl || fallbackService?.videoUrl || "",
    // Newer services store an ordered videos array; older ones a single videoUrl.
    videos: (() => {
      const list = (Array.isArray(cmsService?.videos) ? cmsService.videos : []).filter(Boolean);
      if (list.length > 0) return list;
      const single = cmsService?.videoUrl || fallbackService?.videoUrl || "";
      return single ? [single] : [];
    })(),
    orientation: cmsService?.orientation || (slug === "nikkahnama-framing" || slug === "instagram-mirror-selfie" ? "portrait" : "landscape"),
    enableUploadPhoto: cmsService?.enableUploadPhoto !== undefined ? cmsService.enableUploadPhoto : (slug !== "instagram-mirror-selfie"),
    enableChooseFrame: cmsService?.enableChooseFrame !== undefined ? cmsService.enableChooseFrame : (slug !== "photo-editing" && slug !== "instagram-mirror-selfie"),
    enableSelectSize: cmsService?.enableSelectSize !== undefined ? cmsService.enableSelectSize : true,
    // Admin-defined dropdown options; absent means fall back to the built-in list.
    sizeOptions: Array.isArray(cmsService?.sizeOptions) ? cmsService.sizeOptions : null,
    enableMultipleImages: cmsService?.enableMultipleImages !== undefined ? cmsService.enableMultipleImages : true,
    enableNavigationButton: cmsService?.enableNavigationButton !== undefined ? cmsService.enableNavigationButton : true,
    gallery: fallbackService?.gallery || [
      { img: featuredImg, caption: "Custom Service Showcase" }
    ],
    previews: fallbackService?.previews,
    colorPreviews: fallbackService?.colorPreviews,
  } : null;

  const [cartItems, setCartItems] = useState([]);
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState(null);

  // Size Selector States
  const [selectedSize, setSelectedSize] = useState("12x18");
  const [sizeInitialised, setSizeInitialised] = useState(false);
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [customUnit, setCustomUnit] = useState("inches");

  // Custom-size quote request. A custom size has no price, so it never enters
  // the cart — it becomes an enquiry the studio answers by hand.
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [quoteError, setQuoteError] = useState("");
  const [quoteSending, setQuoteSending] = useState(false);
  const [quoteRef, setQuoteRef] = useState("");


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

  // Wall gallery slider (the same showcase the product pages use), seeded from
  // the service's own photos so each service shows its own work.
  const [wallSlides, setWallSlides] = useState([]);

  // Frame currently shown on the studio stage. On framed services the swiper
  // arrows walk this through every available frame while the photo stays put.
  // Purely visual — pricing still follows the "Choose Frame" picker below.
  const [displayFrameId, setDisplayFrameId] = useState("__default__");

  // Natural pixel size of each showcase video (set once its metadata loads) — drives
  // both the 16:9 / 9:16 stage and the cap that stops the clip being upscaled.
  const [videoDimsMap, setVideoDimsMap] = useState({});
  const [activeVideo, setActiveVideo] = useState(0);
  const videoRefs = useRef([]);

  // Lock background page scroll while a modal (frame picker or cart drawer) is open.
  // The page scrolls via <html>, not <body>, so both must be locked.
  useEffect(() => {
    const shouldLock = frameModalOpen || cartOpen || quoteModalOpen;
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
  }, [frameModalOpen, cartOpen, quoteModalOpen]);

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
        // Filter out Board Games (Ludo, Chess, Monopoly, etc.) from frame picker
        const isBoardGame = (f) => {
          const name = (f.name || "").toLowerCase();
          const cat = (f.category || "").toLowerCase();
          const sub = (f.subCategory || "").toLowerCase();
          const desc = (f.description || "").toLowerCase();
          return (
            cat.includes("board") ||
            cat.includes("game") ||
            sub.includes("board") ||
            sub.includes("game") ||
            name.includes("ludo") ||
            name.includes("chess") ||
            name.includes("monopoly") ||
            name.includes("carrom") ||
            name.includes("scrabble") ||
            name.includes("board game") ||
            desc.includes("board game")
          );
        };
        setFrames(framesList.filter((f) => !isBoardGame(f)));
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

  // ----- Size and Pricing Calculation -----
  // The starting price from the CMS is the floor; each size option resolves to a
  // final price (admin-set, or base + the built-in delta).
  const servicePriceNum = extractServicePrice(service?.priceInfo);
  const sizeOptions = resolveSizeOptions(service, servicePriceNum);
  const sizeObj = sizeOptions.find((s) => s.value === selectedSize) || sizeOptions[0];
  const sizePrice = sizeObj ? sizeObj.price : servicePriceNum;
  const framePriceNum = selectedCustomFrame ? parsePriceNum(selectedCustomFrame.price) : 0;
  const totalPriceNum = sizePrice + (slug === "instagram-mirror-selfie" ? 0 : framePriceNum);
  const totalPriceStr = formatPrice(totalPriceNum);

  // ----- Photo & Frame preview -----
  const currentPhoto = userUploadedImage || selectedGalleryPhoto || service?.image;

  // Whether this service is presented in a frame follows the CMS toggle: if the
  // admin has turned off "Choose Frame", there is nothing to pick, so the studio
  // image is shown bare. A frame picked by hand always wins.
  const framingEnabled = service?.enableChooseFrame !== false;
  const isFramedService = framingEnabled || !!selectedCustomFrame;
  const isFramelessService = !isFramedService;

  const frameOrientation = service?.orientation === "landscape" ? "landscape" : "portrait";

  const defaultFrameVariant = {
    id: "__default__",
    name: "Standard Studio Frame",
    imageUrl: frameOrientation === "landscape"
      ? "/frames/landscape/frame-04-correct-size.webp"
      : "/frames/portrait/frame-01-correct-size.webp",
    paddingTop: slug === "photo-restoration" ? 7.22 : 7,
    paddingLeft: slug === "photo-restoration" ? 6.04 : 7,
    paddingBottom: slug === "photo-restoration" ? 7.06 : 7,
    paddingRight: slug === "photo-restoration" ? 6.07 : 7
  };

  // Every frame this service can be shown in — the studio default plus each
  // catalogue frame matching the service orientation.
  const frameVariants = (() => {
    if (!isFramedService) return [defaultFrameVariant];
    const matching = frames.filter(
      (f) => (f.orientation || "portrait") === frameOrientation && f.imageUrl
    );
    const list = [defaultFrameVariant, ...matching];
    // A frame picked from the modal may fall outside this orientation — keep it visible.
    if (selectedCustomFrame && !list.some((v) => String(v.id) === String(selectedCustomFrame.id))) {
      list.push(selectedCustomFrame);
    }
    return list;
  })();

  const displayFrameIndex = Math.max(
    0,
    frameVariants.findIndex((v) => String(v.id) === String(displayFrameId))
  );
  const displayFrame = frameVariants[displayFrameIndex] || defaultFrameVariant;

  const getPaddings = () => ({
    top: Number(displayFrame.paddingTop) || 0,
    left: Number(displayFrame.paddingLeft) || 0,
    bottom: Number(displayFrame.paddingBottom) || 0,
    right: Number(displayFrame.paddingRight) || 0
  });
  const paddings = getPaddings();

  // ----- Swiper stepping -----
  const stepFrameVariant = (dir) => {
    const len = frameVariants.length;
    if (len < 2) return;
    // Resolve from the live state so rapid clicks don't all read the same index.
    setDisplayFrameId((prevId) => {
      const idx = Math.max(0, frameVariants.findIndex((v) => String(v.id) === String(prevId)));
      return frameVariants[(idx + dir + len) % len].id;
    });
  };

  const stepImageSlide = (dir) => {
    if (!service) return;
    if (slug === "photo-restoration" || slug === "photo-editing") {
      const items = slug === "photo-restoration"
        ? (service.colorPreviews || []).slice(0, 3)
        : (service.previews || []).slice(0, 3);
      const count = items.length;
      if (count < 1) return;
      setActiveSlide((prev) => (prev + dir + count) % count);
      return;
    }
    const count = (service.images || []).length;
    if (count < 1) return;
    setActiveSlide((prev) => {
      const nextIdx = (prev + dir + count) % count;
      setSelectedGalleryPhoto(service.images[nextIdx]);
      return nextIdx;
    });
  };

  // On a framed service the arrows walk the frame variations; if the frame
  // catalogue is unavailable they fall back to swiping the photos as before.
  const framesCyclable = isFramedService && frameVariants.length > 1;
  const photosCyclable =
    (slug === "photo-restoration" || slug === "photo-editing") ||
    (service?.enableMultipleImages !== false && Array.isArray(service?.images) && service.images.length > 1);

  // Re-seed the wall slider whenever the service's photo list changes.
  useEffect(() => {
    const imgs = (service?.images || []).filter(Boolean);
    if (imgs.length === 0) {
      setWallSlides([]);
      return;
    }
    setWallSlides(
      imgs.map((img, i) => ({
        id: `${i}-${img}`,
        title: `${service.title} #${i + 1}`,
        description: service.tagline || "Handcrafted in our studio.",
        imageUrl: img,
      }))
    );
  }, [service?.images?.join("|"), service?.title, service?.tagline]);

  const nextWallSlide = () => setWallSlides((prev) => (prev.length < 2 ? prev : [...prev.slice(1), prev[0]]));
  const prevWallSlide = () => setWallSlides((prev) => (prev.length < 2 ? prev : [prev[prev.length - 1], ...prev.slice(0, -1)]));
  const clickWallSlide = (index) => {
    if (index <= 1) return;
    const shift = index - 1;
    setWallSlides((prev) => [...prev.slice(shift), ...prev.slice(0, shift)]);
  };

  // A service with custom options may not contain "12x18", so settle on a valid
  // choice once the options are known.
  useEffect(() => {
    if (sizeInitialised || sizeOptions.length === 0) return;
    if (!sizeOptions.some((o) => o.value === selectedSize)) {
      const firstFixed = sizeOptions.find((o) => o.kind === "fixed") || sizeOptions[0];
      setSelectedSize(firstFixed.value);
    }
    setSizeInitialised(true);
  }, [sizeOptions, selectedSize, sizeInitialised]);

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
    setDisplayFrameId(frame.id);
    setFrameModalOpen(false);
  };

  const clearSelectedFrame = () => {
    setSelectedCustomFrame(null);
    setDisplayFrameId("__default__");
    setFrameModalOpen(false);
  };

  // ----- Custom-size quote request -----
  // A custom size has no price, so instead of going to the cart it is sent to
  // the studio as an enquiry with the customer's contact details.
  const isCustomSize = sizeObj?.kind === "custom";

  const openQuoteModal = () => {
    setQuoteError("");
    setQuoteRef("");
    setQuoteModalOpen(true);
  };

  const closeQuoteModal = () => {
    setQuoteModalOpen(false);
    // Clear the form only once a request has actually gone through, so a
    // validation slip does not cost the customer everything they typed.
    if (quoteRef) setQuoteForm({ name: "", phone: "", email: "", notes: "" });
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (quoteSending) return;

    const name = quoteForm.name.trim();
    const phone = quoteForm.phone.trim();
    const email = quoteForm.email.trim();

    if (!name) return setQuoteError("Please enter your name so we know who to contact.");
    if (phone.replace(/\D/g, "").length < 7) return setQuoteError("Please enter a valid contact number.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setQuoteError("That email address does not look right.");
    if (!customWidth || !customHeight) return setQuoteError("Please enter both the width and the height you need.");

    setQuoteError("");
    setQuoteSending(true);

    // A short human-readable handle the customer can quote back to us.
    const reference = `QR-${Date.now().toString(36).toUpperCase().slice(-6)}`;

    let attachedPhoto = null;
    if (userUploadedImage) {
      try {
        attachedPhoto = await resizeImage(userUploadedImage, 320, 320);
      } catch (err) {
        console.error("Could not attach the uploaded photo to the quote:", err);
      }
    }

    const payload = {
      reference,
      status: "New",
      createdAt: Date.now(),
      service: { slug, title: service?.title || slug },
      dimensions: {
        width: String(customWidth),
        height: String(customHeight),
        unit: customUnit,
      },
      frame: selectedCustomFrame
        ? { id: selectedCustomFrame.id, name: selectedCustomFrame.name, price: selectedCustomFrame.price || "" }
        : null,
      startingPrice: servicePriceNum,
      customer: { name, phone, email },
      notes: quoteForm.notes.trim(),
      photo: attachedPhoto,
    };

    try {
      await set(push(ref(db, "quote_requests")), payload);

      // Same alert path the checkout uses, so a quote request reaches the
      // studio's phone rather than waiting to be noticed in the admin. The
      // photo is a base64 data URL and the alert only shows text, so it is
      // left out rather than posted for nothing.
      const { photo, ...alertData } = payload;
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "query", queryData: alertData }),
      }).catch((err) => console.error("ntfy notification error:", err));

      setQuoteRef(reference);
    } catch (err) {
      console.error("Failed to send the quote request:", err);
      setQuoteError("We could not send your request just now. Please try again, or reach us from the Contact page.");
    } finally {
      setQuoteSending(false);
    }
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

    // A custom size carries the starting price only — flag it so the caveat
    // travels with the item into the cart, checkout and the order record.
    const sizeDisplay = sizeObj?.kind === "custom"
      ? `Custom Size (${customWidth || "0"} x ${customHeight || "0"} ${customUnit}) \u2014 price to be quoted`
      : (sizeObj?.displayLabel || selectedSize);

    const frameDisplay = selectedCustomFrame
      ? selectedCustomFrame.name
      : (sizeObj?.kind === "digital" ? "No Physical Frame (Digital Delivery)" : "Standard Studio Frame");

    const item = {
      id: `service-${slug}${selectedCustomFrame ? `-${selectedCustomFrame.id}` : ""}-${selectedSize}`,
      frameName: service.title,
      frameColor: selectedCustomFrame?.color || "",
      price: totalPriceStr,
      size: `${sizeDisplay} • ${frameDisplay}`,
      orientation: "portrait",
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

  // ----- Showcase video stage (16:9 landscape / 9:16 portrait, never upscaled) -----
  // The stage is sized once for the whole carousel so it never resizes between
  // clips: the orientation comes from the first video, the width from the
  // narrowest one so no clip is ever blown up past its own pixels.
  const serviceVideos = service?.videos || [];
  const currentVideoIndex = serviceVideos.length > 0
    ? Math.min(activeVideo, serviceVideos.length - 1)
    : 0;

  const knownVideoDims = serviceVideos.map((_, i) => videoDimsMap[i]).filter(Boolean);
  const allVideoDimsKnown = serviceVideos.length > 0 && knownVideoDims.length === serviceVideos.length;
  const firstVideoDims = videoDimsMap[0];
  const isPortraitVideo = !!firstVideoDims && firstVideoDims.h > firstVideoDims.w;
  const narrowestVideoWidth = allVideoDimsKnown
    ? Math.min(...knownVideoDims.map((d) => d.w))
    : null;
  const videoStageMaxWidth = isPortraitVideo
    ? Math.min(narrowestVideoWidth || 420, 420)
    : Math.min(Math.max(narrowestVideoWidth || 1160, 720), 1160);

  const stepVideo = (dir) => {
    const count = serviceVideos.length;
    if (count < 2) return;
    setActiveVideo((prev) => (prev + dir + count) % count);
  };

  // Only the visible clip plays; the rest stay parked at their first frame.
  useEffect(() => {
    videoRefs.current.forEach((el, idx) => {
      if (!el) return;
      if (idx === currentVideoIndex) {
        const playback = el.play();
        if (playback && typeof playback.catch === "function") playback.catch(() => {});
      } else {
        el.pause();
      }
    });
  }, [currentVideoIndex, serviceVideos.length]);

  if (loading) {
    return (
      <div className="services-root" style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <Navbar onCartOpen={() => setCartOpen(true)} />
        <FrameLoader variant="page" label="Preparing studio experience" style={{ flex: 1 }} />
        <Footer />
      </div>
    );
  }

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

  const descText = service?.detailedText || service?.desc || "Each piece is individually built by hand in our workshop using premium local materials and traditional craftsmanship.";

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

        /* Custom-size quote notice, stamped on the paper card in the same
           vintage red ink as the price it is qualifying. */
        .custom-quote-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 12px;
          padding: 10px 11px;
          background: rgba(139, 30, 30, 0.07);
          border: 1px solid rgba(139, 30, 30, 0.28);
          border-left: 3px solid #8b1e1e;
          border-radius: 5px;
        }

        .custom-quote-note > svg {
          flex-shrink: 0;
          margin-top: 1px;
          color: #8b1e1e;
        }

        .custom-quote-note strong {
          display: block;
          font-family: var(--font-typewriter);
          font-size: 11px;
          font-weight: 700;
          color: #8b1e1e;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 3px;
        }

        .custom-quote-note p {
          margin: 0;
          font-family: var(--font-typewriter);
          font-size: 11px;
          line-height: 1.55;
          color: #2c1e11;
        }

        .custom-quote-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 7px;
          font-family: var(--font-typewriter);
          font-size: 11px;
          font-weight: 700;
          color: #8b1e1e;
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: opacity 0.2s ease;
        }

        .custom-quote-link:hover {
          opacity: 0.72;
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
        /* ── CUSTOM SIZE QUOTE MODAL ── */
        .quote-modal { max-width: 560px; }

        .quote-form, .quote-done { padding: 22px 24px 24px; }

        .quote-summary {
          background: rgba(181,139,92,0.07);
          border: 1px solid var(--border2);
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 16px;
        }
        .quote-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 16px;
          font-family: var(--font-typewriter);
          font-size: 12px;
        }
        .quote-summary-row + .quote-summary-row { margin-top: 8px; }
        .quote-summary-row span {
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 10px;
          white-space: nowrap;
        }
        .quote-summary-row strong { color: var(--accent2); text-align: right; }

        .quote-intro {
          font-family: var(--font-typewriter);
          font-size: 12.5px;
          line-height: 1.6;
          color: var(--text2);
          margin-bottom: 18px;
        }

        .quote-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .quote-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .quote-field label {
          font-family: var(--font-typewriter);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--text2);
        }
        .quote-field label em { color: #E06A6A; font-style: normal; }
        .quote-optional { text-transform: none; letter-spacing: 0; opacity: 0.7; }

        .quote-field input,
        .quote-field textarea {
          width: 100%;
          background: rgba(0,0,0,0.28);
          border: 1px solid var(--border2);
          border-radius: 8px;
          padding: 10px 12px;
          color: var(--text);
          font-family: var(--font-typewriter);
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          resize: vertical;
        }
        .quote-field input::placeholder,
        .quote-field textarea::placeholder { color: var(--text2); opacity: 0.55; }
        .quote-field input:focus,
        .quote-field textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(181,139,92,0.15);
        }

        .quote-error {
          background: rgba(224,106,106,0.1);
          border: 1px solid rgba(224,106,106,0.4);
          border-left: 3px solid #E06A6A;
          border-radius: 6px;
          padding: 9px 12px;
          margin-bottom: 14px;
          font-family: var(--font-typewriter);
          font-size: 12px;
          color: #F0A8A8;
        }

        .quote-actions { display: flex; gap: 12px; margin-top: 4px; flex-wrap: wrap; }
        .quote-actions .btn-premium { flex: 1; min-width: 150px; }

        .quote-privacy {
          margin-top: 12px;
          font-family: var(--font-typewriter);
          font-size: 10.5px;
          color: var(--text2);
          opacity: 0.75;
        }

        /* Confirmation state */
        .quote-done { text-align: center; }
        .quote-done-mark {
          width: 56px; height: 56px;
          margin: 6px auto 16px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--accent);
          background: rgba(181,139,92,0.12);
          border: 1px solid var(--border2);
        }
        .quote-done h4 {
          font-family: var(--font-display);
          font-size: 21px;
          color: var(--accent);
          margin-bottom: 10px;
        }
        .quote-done p {
          font-family: var(--font-typewriter);
          font-size: 13px;
          line-height: 1.65;
          color: var(--text2);
          max-width: 400px;
          margin: 0 auto;
        }
        .quote-done p strong { color: var(--text); }
        .quote-reference {
          display: inline-flex;
          flex-direction: column;
          gap: 4px;
          margin: 20px 0;
          padding: 12px 26px;
          border: 1px dashed var(--border2);
          border-radius: 8px;
          background: rgba(181,139,92,0.06);
        }
        .quote-reference span {
          font-family: var(--font-typewriter);
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text2);
        }
        .quote-reference strong {
          font-family: var(--font-typewriter);
          font-size: 19px;
          letter-spacing: 0.06em;
          color: var(--accent);
        }
        .quote-done .btn-premium { display: block; width: 100%; }

        @media (max-width: 520px) {
          .quote-field-row { grid-template-columns: 1fr; gap: 0; }
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
          background: rgba(12, 10, 8, 0.65);
          border-top: 1px solid rgba(181, 139, 92, 0.15);
          border-bottom: 1px solid rgba(181, 139, 92, 0.15);
          box-shadow: inset 0 20px 40px rgba(0, 0, 0, 0.5), inset 0 -20px 40px rgba(0, 0, 0, 0.5);
          pointer-events: none;
        }
        .catalog-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(181, 139, 92, 0.2) 0%, rgba(139, 94, 60, 0.05) 50%, transparent 75%);
          pointer-events: none;
          z-index: 1;
          opacity: 0.8;
          will-change: transform;
          animation: catalog-glow-auto 16s infinite ease-in-out;
        }
        @keyframes catalog-glow-auto {
          0% { transform: translate(-10%, -10%) scale(1); }
          50% { transform: translate(30%, 20%) scale(1.1); }
          100% { transform: translate(-10%, -10%) scale(1); }
        }
        .liquid-blob-1 {
          position: absolute;
          top: -10%;
          left: 10%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(181, 139, 92, 0.18) 0%, transparent 70%);
          border-radius: 43% 57% 51% 49% / 57% 40% 60% 43%;
          animation: liquid-move-1 25s infinite alternate ease-in-out;
          pointer-events: none;
          z-index: 1;
          will-change: transform;
        }
        .liquid-blob-2 {
          position: absolute;
          bottom: -15%;
          right: 5%;
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(139, 94, 60, 0.16) 0%, transparent 70%);
          border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%;
          animation: liquid-move-2 30s infinite alternate ease-in-out;
          pointer-events: none;
          z-index: 1;
          will-change: transform;
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

        /* PHOTO RESTORATION & PHOTO EDITING CUSTOM LAYOUT & LAMP SPACING */
        .photo-restoration-page .product-visual-pane {
          padding-top: 10px;
          align-items: center;
        }

        .photo-restoration-page .exquisite-frame-component {
          padding-top: 210px;
          max-width: 520px;
          width: 100%;
        }

        /* Shell around the frame — anchors swiper arrows to the left and right sides of the frame */
        .restoration-frame-shell {
          display: flex;
          position: relative;
          width: 100%;
          justify-content: center;
          align-items: center;
        }

        /* Dynamic CMS Studio Frame Orientation */
        .exquisite-wood-frame.service-orientation-portrait {
          transform: none !important;
          aspect-ratio: 2 / 3 !important;
          max-width: 320px !important;
          width: 100% !important;
          margin: 30px auto !important;
        }
        .exquisite-wood-frame.service-orientation-portrait .exquisite-inner-photo img {
          position: absolute !important;
          inset: 0 !important;
          top: 0 !important;
          left: 0 !important;
          transform: none !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }

        .exquisite-wood-frame.service-orientation-landscape {
          transform: none !important;
          aspect-ratio: 3 / 2 !important;
          max-width: 480px !important;
          width: 100% !important;
          margin: 30px auto !important;
        }
        .exquisite-wood-frame.service-orientation-landscape .exquisite-inner-photo img {
          position: absolute !important;
          inset: 0 !important;
          top: 0 !important;
          left: 0 !important;
          transform: none !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }

        /* Prevent frame rotation and apply landscape proportions */
        .photo-restoration-page .exquisite-wood-frame.restoration-frame {
          transform: none !important;
          aspect-ratio: 1.5 !important;
          max-width: 480px !important;
          width: 100% !important;
          margin: 30px auto 0 !important;
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
          margin-top: 20px !important;
        }
        .exquisite-wood-frame.no-frame-border::after {
          display: none !important;
        }
        .exquisite-wood-frame.no-frame-border .exquisite-inner-photo {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 12px 35px rgba(0,0,0,0.6);
        }

        /* Instagram Mirror Selfie — upright portrait 9:16 ratio, frameless, full image aligned with paper */
        .exquisite-wood-frame.instagram-mirror-frame {
          transform: none !important;
          aspect-ratio: 9 / 16 !important;
          max-width: 320px !important;
          width: 100% !important;
          margin: 0 !important;
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
          padding-top: 0px !important;
          align-items: center;
        }
        .instagram-mirror-selfie-page .exquisite-frame-component {
          padding-top: 210px !important;
        }
        .instagram-mirror-selfie-page .product-config-column {
          align-self: center;
          margin-top: 30px;
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

        .restoration-slide img {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          transform: none !important;
        }

        .wall-gallery-slider-section {
          position: relative;
          width: 100%;
          height: 650px;
          background: #090706;
          border-top: 2px solid #1C0F07;
          border-bottom: 2px solid #1C0F07;
          overflow: hidden;
          margin-top: 60px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        }

        .wall-slider-title-header {
          position: absolute;
          top: 30px;
          left: 40px;
          z-index: 10;
          pointer-events: none;
        }

        .wall-slider-heading {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.01em;
          text-shadow: 0 4px 10px rgba(0,0,0,0.9);
          margin-bottom: 4px;
        }

        .wall-slider-subheading {
          font-family: var(--font-serif);
          font-size: 14px;
          color: var(--text2);
          text-shadow: 0 2px 5px rgba(0,0,0,0.9);
        }

        .wall-slider-track {
          position: relative;
          width: 100%;
          height: 100%;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .wall-slider-item {
          width: 200px;
          height: 300px;
          position: absolute;
          top: 55%;
          transform: translateY(-50%);
          z-index: 1;
          background-position: center;
          background-size: cover;
          border-radius: 12px;
          border: 3px solid #1C0F07;
          outline: 1.5px solid rgba(212, 175, 55, 0.45);
          box-shadow: 0 12px 24px rgba(0,0,0,0.8);
          transition: transform 0.2s, left 0.75s, top 0.75s, width 0.75s, height 0.75s, opacity 0.75s;
          cursor: pointer;
        }

        .wall-slider-item:nth-child(1), .wall-slider-item:nth-child(2) {
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          transform: none;
          border-radius: 0;
          border: none;
          outline: none;
          box-shadow: none;
          opacity: 1;
          cursor: default;
        }

        .wall-slider-item:nth-child(3) { left: 50%; }
        .wall-slider-item:nth-child(4) { left: calc(50% + 220px); }
        .wall-slider-item:nth-child(5) { left: calc(50% + 440px); }
        .wall-slider-item:nth-child(6) { left: calc(50% + 660px); opacity: 0; }
        .wall-slider-item:nth-child(n+7) { left: calc(50% + 880px); opacity: 0; }

        /* Dark overlay on background items */
        .wall-slider-item::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, rgba(9, 7, 6, 0.75) 0%, rgba(9, 7, 6, 0.3) 40%, transparent 100%);
          z-index: 2;
          opacity: 0;
          transition: opacity 0.75s ease;
        }
        .wall-slider-item:nth-child(1)::before, .wall-slider-item:nth-child(2)::before {
          opacity: 1;
        }

        .wall-slider-content {
          width: min(85vw, 420px);
          position: absolute;
          top: 50%;
          left: 5%;
          transform: translateY(-50%);
          color: white;
          z-index: 5;
          opacity: 0;
          display: none;
        }

        .wall-slider-item:nth-of-type(2) .wall-slider-content {
          display: block;
          animation: showWallContent 0.75s ease-in-out 0.3s forwards;
        }

        @keyframes showWallContent {
          0% {
            filter: blur(8px);
            transform: translateY(calc(-50% + 75px));
            opacity: 0;
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: translateY(-50%);
          }
        }

        .wall-slider-content-title {
          font-family: var(--font-display);
          font-size: 36px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: -0.01em;
          color: #dfc38a;
          margin-bottom: 12px;
          text-shadow: 0 4px 8px rgba(0,0,0,0.8);
        }

        .wall-slider-content-description {
          font-family: var(--font-serif);
          font-size: 14.5px;
          line-height: 1.6;
          color: var(--text);
          text-shadow: 0 2px 4px rgba(0,0,0,0.9);
          margin-bottom: 20px;
        }

        .wall-slider-content-btn {
          font-family: var(--font-typewriter);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          background: rgba(212, 175, 55, 0.1);
          color: var(--accent);
          border: 1.5px solid var(--accent);
          border-radius: 4px;
          padding: 10px 20px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .wall-slider-content-btn:hover {
          background: var(--accent);
          color: #1A1100;
          box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
        }

        .wall-slider-nav {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          user-select: none;
          display: flex;
          gap: 12px;
        }

        .wall-slider-nav-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(12, 10, 8, 0.9);
          border: 1.5px solid rgba(212, 175, 55, 0.35);
          color: var(--accent);
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.6);
        }
        .wall-slider-nav-btn:hover {
          background: var(--accent);
          color: #0C0A08;
          border-color: var(--accent);
          box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
        }

        /* Responsive Media Queries */
        @media (max-width: 900px) {
          .wall-gallery-slider-section {
            height: 550px;
          }
          .wall-slider-item {
            width: 150px;
            height: 220px;
            top: 60%;
          }
          .wall-slider-item:nth-child(3) { left: 50%; }
          .wall-slider-item:nth-child(4) { left: calc(50% + 170px); }
          .wall-slider-item:nth-child(5) { left: calc(50% + 340px); }
          .wall-slider-item:nth-child(6) { left: calc(50% + 510px); opacity: 0; }
          .wall-slider-item:nth-child(n+7) { left: calc(50% + 680px); opacity: 0; }

          .wall-slider-content-title {
            font-size: 28px;
          }
          .wall-slider-content-description {
            font-size: 13px;
          }
        }

        @media (max-width: 650px) {
          .wall-gallery-slider-section {
            height: 480px;
          }
          .wall-slider-item {
            width: 100px;
            height: 150px;
            top: 65%;
          }
          .wall-slider-item:nth-child(3) { left: 45%; }
          .wall-slider-item:nth-child(4) { left: calc(45% + 120px); }
          .wall-slider-item:nth-child(5) { left: calc(45% + 240px); }
          .wall-slider-item:nth-child(6) { left: calc(45% + 360px); opacity: 0; }
          .wall-slider-item:nth-child(n+7) { left: calc(45% + 480px); opacity: 0; }

          .wall-slider-title-header {
            top: 20px;
            left: 20px;
          }
          .wall-slider-heading {
            font-size: 22px;
          }
          .wall-slider-content {
            left: 20px;
          }
          .wall-slider-content-title {
            font-size: 24px;
          }
        }

        /* Frame variation caption under the studio stage */
        .frame-variant-caption {
          position: absolute;
          left: 50%;
          bottom: -6px;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 14px;
          border-radius: 30px;
          background: rgba(28, 15, 7, 0.85);
          border: 1px solid rgba(223, 195, 138, 0.45);
          font-family: var(--font-typewriter);
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #dfc38a;
          white-space: nowrap;
          z-index: 30;
          pointer-events: none;
        }
        .frame-variant-caption .fv-count {
          color: rgba(223, 195, 138, 0.6);
        }

        /* Cinema stage clips — "contain" keeps the source pixels 1:1 inside the
           fixed 16:9 / 9:16 stage; "cover" was upscaling and cropping them. */
        .cinema-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          background: #000;
          opacity: 0;
          transition: opacity 0.35s ease;
          pointer-events: none;
        }
        .cinema-video.active {
          opacity: 1;
          pointer-events: auto;
        }

        /* Video carousel controls */
        .video-carousel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(28, 15, 7, 0.88);
          border: 1px solid #dfc38a;
          color: #dfc38a;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 5;
          padding: 0;
          transition: all 0.2s ease;
          box-shadow: 0 6px 18px rgba(0,0,0,0.7);
        }
        .video-carousel-arrow:hover {
          background: #dfc38a;
          color: #1c0f07;
          box-shadow: 0 0 16px rgba(223, 195, 138, 0.6);
        }
        .video-carousel-arrow.prev { left: -62px; }
        .video-carousel-arrow.next { right: -62px; }

        @media (max-width: 1320px) {
          .video-carousel-arrow.prev { left: 10px; }
          .video-carousel-arrow.next { right: 10px; }
        }

        .video-carousel-dots {
          position: relative;
          z-index: 2;
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 26px;
        }
        .video-carousel-dot {
          width: 9px;
          height: 9px;
          padding: 0;
          border-radius: 50%;
          border: 1px solid rgba(223, 195, 138, 0.6);
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .video-carousel-dot:hover { background: rgba(223, 195, 138, 0.45); }
        .video-carousel-dot.active {
          background: #dfc38a;
          border-color: #dfc38a;
          transform: scale(1.25);
        }

        /* Swiper Prev/Next Arrows (Left and Right sides of the frame) */
        .swiper-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(28, 15, 7, 0.85);
          border: 1px solid #dfc38a;
          color: #dfc38a;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 30;
          transition: all 0.2s ease;
          padding: 0;
          line-height: 1;
          box-shadow: 0 4px 12px rgba(0,0,0,0.6);
        }

        .swiper-arrow:hover {
          background: #dfc38a;
          color: #1c0f07;
          box-shadow: 0 0 14px rgba(223, 195, 138, 0.6);
        }

        .swiper-arrow-prev {
          left: -48px;
        }

        .swiper-arrow-next {
          right: -48px;
        }

        .instagram-mirror-selfie-page .swiper-arrow-prev {
          left: -54px;
        }
        .instagram-mirror-selfie-page .swiper-arrow-next {
          right: -54px;
        }

        /* On narrow viewports there is no room beside the frame — tuck arrows inside */
        @media (max-width: 640px) {
          .swiper-arrow-prev {
            left: 8px !important;
            background: rgba(28, 15, 7, 0.75);
          }
          .swiper-arrow-next {
            right: 8px !important;
            background: rgba(28, 15, 7, 0.75);
          }
        }

        /* Pagination Dots */
        .swiper-pagination {
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

              {/* Picture Frame Shell (Dynamic Portrait / Landscape Orientation from CMS) */}
              <div className="restoration-frame-shell">
                <div className={`exquisite-wood-frame ${lightOn ? "light-on" : ""} ${service.orientation === "portrait" ? "service-orientation-portrait" : "service-orientation-landscape"} ${(slug === "photo-restoration" || slug === "photo-editing") ? "restoration-frame" : ""} ${isFramelessService ? "no-frame-border" : ""} ${slug === "nikkahnama-framing" ? "nikkahnama-frame" : ""} ${slug === "instagram-mirror-selfie" ? "instagram-mirror-frame" : ""}`}>

                  {isFramedService && (
                    <img
                      key={displayFrame.id}
                      src={displayFrame.imageUrl}
                      alt={displayFrame.name || "Handcrafted Wood Frame"}
                      className="wood-frame-overlay"
                    />
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
                    ) : service.enableMultipleImages !== false && Array.isArray(service.images) && service.images.length > 1 && !userUploadedImage ? (
                      <div className="restoration-swiper-container">
                        {service.images.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            className={`restoration-slide ${idx === activeSlide ? "active" : ""}`}
                          >
                            <img src={imgUrl} alt={`${service.title} - Photo ${idx + 1}`} />
                          </div>
                        ))}

                        {/* Pagination indicators */}
                        <div className="swiper-pagination">
                          {service.images.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSlide(idx);
                                setSelectedGalleryPhoto(service.images[idx]);
                              }}
                              className={`swiper-dot ${idx === activeSlide ? "active" : ""}`}
                              aria-label={`Go to photo ${idx + 1}`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <img src={currentPhoto} alt={`${service.title} preview`} />
                    )}
                    <div className="glass-reflection" />
                  </div>
                </div>

                {/* Swipe controls — outside the frame on either side.
                    Framed services step through frame variations (the photo stays put);
                    frameless ones keep stepping through the photos themselves. */}
                {(framesCyclable || (photosCyclable && !userUploadedImage)) && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (framesCyclable) stepFrameVariant(-1);
                        else stepImageSlide(-1);
                      }}
                      className="swiper-arrow swiper-arrow-prev"
                      style={{ top: `${50 + (paddings.top - paddings.bottom) / 2}%` }}
                      aria-label={framesCyclable ? "Previous frame" : "Previous image"}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (framesCyclable) stepFrameVariant(1);
                        else stepImageSlide(1);
                      }}
                      className="swiper-arrow swiper-arrow-next"
                      style={{ top: `${50 + (paddings.top - paddings.bottom) / 2}%` }}
                      aria-label={framesCyclable ? "Next frame" : "Next image"}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Which frame the photo is currently sitting in */}
                {framesCyclable && (
                  <span className="frame-variant-caption">
                    {displayFrame.name}
                    <span className="fv-count">{displayFrameIndex + 1} / {frameVariants.length}</span>
                  </span>
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
                    {sizeObj?.kind === "custom"
                      ? "Starting price \u2014 custom sizes are quoted separately"
                      : selectedCustomFrame
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
                {descText && descText.length > 120 && (
                  <button
                    className="read-more-btn"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                  >
                    {isDescExpanded ? "Read Less" : "Read More"}
                  </button>
                )}
              </div>

              {/* Frame Size Selector (Conditionally enabled by admin) */}
              {service.enableSelectSize !== false && (
                <div className="config-section" style={{ marginTop: "4px" }}>
                  <span className="config-label">Choose Frame Size</span>
                  <div style={{ position: "relative" }}>
                    <select
                      className="premium-select"
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        fontFamily: "var(--font-typewriter)",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#2c1e11",
                        background: "rgba(255, 255, 255, 0.5)",
                        border: "1px dashed rgba(139, 94, 60, 0.6)",
                        borderRadius: "6px",
                        cursor: "pointer",
                        outline: "none"
                      }}
                    >
                      {sizeOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.kind === "custom" ? s.displayLabel : `${s.displayLabel} - ${formatPrice(s.price)}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Dimensions Form */}
                  {sizeObj?.kind === "custom" && (
                    <div style={{ marginTop: "12px", background: "rgba(255, 255, 255, 0.45)", border: "1px dashed rgba(139, 94, 60, 0.5)", borderRadius: "6px", padding: "12px" }}>
                      {/* A custom size has no fixed price, so say so up front rather
                          than letting the starting price read as the final one. */}
                      <div className="custom-quote-note">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="13" />
                          <line x1="12" y1="16.5" x2="12" y2="16.5" />
                        </svg>
                        <div>
                          <strong>This size needs a personal quote.</strong>
                          <p>
                            {`${totalPriceStr} is our starting price only. Share your exact measurements
                            and our studio will confirm the final price for your custom dimensions.`}
                          </p>
                          <button type="button" className="custom-quote-link" onClick={openQuoteModal}>
                            Request your quote
                            <span aria-hidden="true">&rsaquo;</span>
                          </button>
                        </div>
                      </div>

                      <span style={{ display: "block", fontFamily: "var(--font-typewriter)", fontSize: "10px", fontWeight: "700", color: "#8b5e3c", textTransform: "uppercase", marginBottom: "8px" }}>
                        Enter Custom Dimensions
                      </span>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "9px", fontFamily: "var(--font-typewriter)", color: "#2c1e11", marginBottom: "2px" }}>Width</label>
                          <input
                            type="number"
                            placeholder="e.g. 18"
                            value={customWidth}
                            onChange={(e) => setCustomWidth(e.target.value)}
                            style={{ width: "100%", padding: "6px 8px", background: "rgba(255,255,255,0.8)", border: "1px solid rgba(139,94,60,0.4)", borderRadius: "4px", fontSize: "11px", fontFamily: "var(--font-typewriter)" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "9px", fontFamily: "var(--font-typewriter)", color: "#2c1e11", marginBottom: "2px" }}>Height</label>
                          <input
                            type="number"
                            placeholder="e.g. 28"
                            value={customHeight}
                            onChange={(e) => setCustomHeight(e.target.value)}
                            style={{ width: "100%", padding: "6px 8px", background: "rgba(255,255,255,0.8)", border: "1px solid rgba(139,94,60,0.4)", borderRadius: "4px", fontSize: "11px", fontFamily: "var(--font-typewriter)" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "9px", fontFamily: "var(--font-typewriter)", color: "#2c1e11", marginBottom: "2px" }}>Unit</label>
                          <select
                            value={customUnit}
                            onChange={(e) => setCustomUnit(e.target.value)}
                            style={{ width: "100%", padding: "6px 8px", background: "rgba(255,255,255,0.8)", border: "1px solid rgba(139,94,60,0.4)", borderRadius: "4px", fontSize: "11px", fontFamily: "var(--font-typewriter)" }}
                          >
                            <option value="inches">Inches (in)</option>
                            <option value="cm">Centimeters (cm)</option>
                            <option value="feet">Feet (ft)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Choose Frame (Conditionally enabled by admin) */}
              {service.enableChooseFrame !== false && (
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

              {/* CTA Actions. A custom size has no price yet, so it is sent to the
                  studio as an enquiry instead of going into the cart. */}
              <div className="action-row">
                {isCustomSize ? (
                  <button className="btn-premium" onClick={openQuoteModal}>
                    Request a Quote
                  </button>
                ) : (
                  <button className="btn-premium" onClick={handleAddToCart}>
                    Add to Cart
                  </button>
                )}
                {service.enableUploadPhoto !== false && (
                  <button className="btn-premium-ghost" onClick={triggerFileUpload}>
                    Upload Photo
                  </button>
                )}
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

      {/* LUXURY THEATRICAL VIDEO SHOWCASE — single video plays full-width, several become a carousel */}
      {serviceVideos.length > 0 && (
        <section className="service-cinema-section" style={{
          position: "relative",
          width: "100%",
          padding: "90px 24px 50px",
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201, 168, 76, 0.08) 0%, #080605 70%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "hidden",
          borderTop: "1px solid rgba(201, 168, 76, 0.15)",
        }}>
          {/* Ambient Glow Background Accent */}
          <div style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "400px",
            background: "radial-gradient(circle, rgba(201, 168, 76, 0.12) 0%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
            zIndex: 1
          }} />

          {/* Section Header */}
          <div style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            maxWidth: "700px",
            marginBottom: "40px"
          }}>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 3.5vw, 36px)",
              color: "var(--text)",
              margin: "0 0 10px 0",
              letterSpacing: "0.02em"
            }}>
              {service.title} {serviceVideos.length > 1 ? "videos" : "video"}
            </h2>
            {serviceVideos.length > 1 && (
              <p style={{
                fontFamily: "var(--font-typewriter)",
                fontSize: "11px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--accent)",
                margin: 0
              }}>
                {currentVideoIndex + 1} / {serviceVideos.length}
              </p>
            )}
          </div>

          {/* Theatrical Video Screen Frame — snaps to 16:9 or 9:16 from the source video,
              and never renders wider than the clip's own pixels so it stays sharp. */}
          <div style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            maxWidth: `${videoStageMaxWidth}px`,
            margin: "0 auto",
          }}>
            {/* Outer Luxury Shadow & Border Card */}
            <div style={{
              position: "relative",
              borderRadius: "18px",
              padding: "10px",
              background: "linear-gradient(145deg, rgba(45, 34, 20, 0.9) 0%, rgba(18, 14, 10, 0.95) 100%)",
              border: "1.5px solid rgba(201, 168, 76, 0.4)",
              boxShadow: "0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(201, 168, 76, 0.15), inset 0 1px 2px rgba(255, 235, 180, 0.25)",
            }}>
              {/* Inner Cinema Bevel */}
              <div style={{
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
                background: "#000",
                border: "1px solid rgba(0, 0, 0, 0.8)",
                boxShadow: "inset 0 4px 20px rgba(0, 0, 0, 0.8)",
                aspectRatio: isPortraitVideo ? "9 / 16" : "16 / 9",
              }}>

                {/* Every clip is mounted so its dimensions are known up front and the
                    stage size never changes; only the active one is visible and playing. */}
                {serviceVideos.map((videoSrc, idx) => (
                  <video
                    key={`${videoSrc}-${idx}`}
                    ref={(el) => { videoRefs.current[idx] = el; }}
                    src={videoSrc}
                    autoPlay={idx === currentVideoIndex}
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    disablePictureInPicture
                    onLoadedMetadata={(e) => {
                      const v = e.currentTarget;
                      if (v.videoWidth && v.videoHeight) {
                        setVideoDimsMap((prev) => (
                          prev[idx] ? prev : { ...prev, [idx]: { w: v.videoWidth, h: v.videoHeight } }
                        ));
                      }
                    }}
                    className={`cinema-video ${idx === currentVideoIndex ? "active" : ""}`}
                  />
                ))}
              </div>
            </div>

            {/* Carousel controls — only once there is more than one clip */}
            {serviceVideos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => stepVideo(-1)}
                  className="video-carousel-arrow prev"
                  aria-label="Previous video"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => stepVideo(1)}
                  className="video-carousel-arrow next"
                  aria-label="Next video"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Carousel dots */}
          {serviceVideos.length > 1 && (
            <div className="video-carousel-dots">
              {serviceVideos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveVideo(idx)}
                  className={`video-carousel-dot ${idx === currentVideoIndex ? "active" : ""}`}
                  aria-label={`Play video ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* WALL GALLERY SLIDER — the same showcase the product pages use */}
      {wallSlides.length > 0 && (
        <section className="wall-gallery-slider-section">
          <ul className="wall-slider-track">
            {wallSlides.map((item, index) => (
              <li
                key={item.id}
                className="wall-slider-item"
                style={{ backgroundImage: `url('${item.imageUrl}')` }}
                onClick={() => clickWallSlide(index)}
              >
                <div className="wall-slider-content">
                  <h2 className="wall-slider-content-title">"{item.title}"</h2>
                  <p className="wall-slider-content-description">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
          {wallSlides.length > 1 && (
            <nav className="wall-slider-nav">
              <button className="wall-slider-nav-btn prev" onClick={prevWallSlide} aria-label="Previous">&larr;</button>
              <button className="wall-slider-nav-btn next" onClick={nextWallSlide} aria-label="Next">&rarr;</button>
            </nav>
          )}
        </section>
      )}

      <Footer />

      {/* CUSTOM SIZE QUOTE REQUEST MODAL */}
      <div
        className={`frame-modal-overlay ${quoteModalOpen ? "open" : ""}`}
        data-lenis-prevent
        onClick={(e) => {
          if (e.target === e.currentTarget) closeQuoteModal();
        }}
      >
        <div className="frame-modal quote-modal">
          <div className="frame-modal-header">
            <h3>{quoteRef ? "Request Received" : "Request a Custom Quote"}</h3>
            <button className="frame-modal-close" onClick={closeQuoteModal}>&times;</button>
          </div>

          {quoteRef ? (
            /* Confirmation — the studio replies by hand, so set that expectation. */
            <div className="frame-modal-body quote-done">
              <div className="quote-done-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h4>Thank you, {quoteForm.name.trim().split(" ")[0] || "friend"}.</h4>
              <p>
                Your request is with our studio. We will check availability for
                your dimensions and call you on <strong>{quoteForm.phone}</strong> with
                the exact price.
              </p>
              <div className="quote-reference">
                <span>Your reference</span>
                <strong>{quoteRef}</strong>
              </div>
              <button className="btn-premium" onClick={closeQuoteModal}>Done</button>
            </div>
          ) : (
            <form className="frame-modal-body quote-form" onSubmit={handleSubmitQuote}>
              {/* What is being quoted, so the customer can check it before sending. */}
              <div className="quote-summary">
                <div className="quote-summary-row">
                  <span>Service</span>
                  <strong>{service?.title}</strong>
                </div>
                <div className="quote-summary-row">
                  <span>Your size</span>
                  <strong>
                    {customWidth || "\u2014"} &times; {customHeight || "\u2014"} {customUnit}
                  </strong>
                </div>
                {selectedCustomFrame && (
                  <div className="quote-summary-row">
                    <span>Frame</span>
                    <strong>{selectedCustomFrame.name}</strong>
                  </div>
                )}
                {userUploadedImage && (
                  <div className="quote-summary-row">
                    <span>Your photo</span>
                    <strong>Attached to this request</strong>
                  </div>
                )}
              </div>

              <p className="quote-intro">
                Leave your name and number and our studio will confirm availability
                and the final price for this size.
              </p>

              <div className="quote-field">
                <label htmlFor="quote-name">Your Name <em>*</em></label>
                <input
                  id="quote-name"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Ayesha Khan"
                  value={quoteForm.name}
                  onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                />
              </div>

              <div className="quote-field-row">
                <div className="quote-field">
                  <label htmlFor="quote-phone">Contact Number <em>*</em></label>
                  <input
                    id="quote-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="e.g. 0300 1234567"
                    value={quoteForm.phone}
                    onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                  />
                </div>
                <div className="quote-field">
                  <label htmlFor="quote-email">Email <span className="quote-optional">(optional)</span></label>
                  <input
                    id="quote-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={quoteForm.email}
                    onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="quote-field">
                <label htmlFor="quote-notes">Anything else? <span className="quote-optional">(optional)</span></label>
                <textarea
                  id="quote-notes"
                  rows={3}
                  placeholder="Matting, glass type, deadline, or anything else we should know."
                  value={quoteForm.notes}
                  onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                />
              </div>

              {quoteError && <div className="quote-error" role="alert">{quoteError}</div>}

              <div className="quote-actions">
                <button type="submit" className="btn-premium" disabled={quoteSending}>
                  {quoteSending ? "Sending\u2026" : "Send Request"}
                </button>
                <button type="button" className="btn-premium-ghost" onClick={closeQuoteModal}>
                  Cancel
                </button>
              </div>

              <p className="quote-privacy">
                We use your number only to discuss this enquiry.
              </p>
            </form>
          )}
        </div>
      </div>

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
              <div className="frame-modal-empty"><FrameLoader label="Loading frames" size={44} /></div>
            ) : (
              <div className="frame-modal-grid">
                {frames.map((f) => (
                  <div
                    key={f.id}
                    className={`frame-option-card ${selectedCustomFrame?.id === f.id ? "selected" : ""}`}
                    onClick={() => handleSelectFrame(f)}
                  >
                    <div className="frame-option-thumb">
                      {(f.thumbnailUrl || f.imageUrl) ? (
                        <img src={f.thumbnailUrl || f.imageUrl} alt={f.name} />
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