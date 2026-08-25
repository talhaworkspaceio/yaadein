"use client";

import { use, useState, useEffect, useCallback, useRef, Suspense } from "react";

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

const DEFAULT_SIZES = [
  { label: "4x6", displayLabel: '4" x 6"', priceDelta: 0 },
  { label: "5x7", displayLabel: '5" x 7"', priceDelta: 500 },
  { label: "6x8", displayLabel: '6" x 8"', priceDelta: 1000 },
  { label: "8x10", displayLabel: '8" x 10"', priceDelta: 2000 },
  { label: "8x12", displayLabel: '8" x 12"', priceDelta: 2000 },
  { label: "10x12", displayLabel: '10" x 12"', priceDelta: 3000 },
  { label: "12x12", displayLabel: '12" x 12"', priceDelta: 3000 },
  { label: "12x14", displayLabel: '12" x 14"', priceDelta: 4000 },
  { label: "12x16", displayLabel: '12" x 16"', priceDelta: 6000 },
  { label: "12x18", displayLabel: '12" x 18"', priceDelta: 6000 },
  { label: "16x20", displayLabel: '16" x 20"', priceDelta: 8000 },
  { label: "18x18", displayLabel: '18" x 18"', priceDelta: 8000 },
  { label: "18x24", displayLabel: '18" x 24"', priceDelta: 10000 },
  { label: "16x24", displayLabel: '16" x 24"', priceDelta: 13000 },
  { label: "20x30", displayLabel: '20" x 30"', priceDelta: 16000 },
  { label: "24x36", displayLabel: '24" x 36"', priceDelta: 18000 },
];

const matchFrame = (f, targetId) => {
  if (!f || !targetId) return false;
  const tId = decodeURIComponent(targetId).trim().toLowerCase().replace(/[-_]/g, ' ');
  const fid = (f.id || "").toString().trim().toLowerCase().replace(/[-_]/g, ' ');
  const fdocid = (f.docId || "").toString().trim().toLowerCase().replace(/[-_]/g, ' ');
  return fid === tId || fdocid === tId;
};

const ProductPageLoader = () => (
  <div style={{
    minHeight: "100vh",
    background: "#0C0A08",
    color: "var(--accent)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-serif)"
  }}>
    <style dangerouslySetInnerHTML={{
      __html: `
      @keyframes loaderSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}} />
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: "loaderSpin 1.2s linear infinite" }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
    <span style={{ fontSize: "12px", letterSpacing: "0.08em", color: "var(--text2)", textTransform: "uppercase" }}>Loading product details...</span>
  </div>
);

function ProductDetailContent({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams?.id;

  const router = useRouter();
  const searchParams = useSearchParams();

  const [frames, setFrames] = useState([]);
  const [selectedFrame, setSelectedFrame] = useState(null);

  const isBoardGame = (f) => {
    const cat = f?.category || "";
    return cat.toLowerCase().includes("board game");
  };

  // Switcher shows board games if selected is a game, otherwise normal frames
  const onlyFrames = frames.filter((f) => {
    const selectedIsGame = selectedFrame && isBoardGame(selectedFrame);
    return selectedIsGame ? isBoardGame(f) : !isBoardGame(f);
  });

  // Set orientation initially based on query parameters if present, defaulting to portrait
  const [orientation, setOrientation] = useState(searchParams?.get("orientation") || "portrait");
  const [selectedSize, setSelectedSize] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const [userUploadedImage, setUserUploadedImage] = useState(null);
  const [lightOn, setLightOn] = useState(true);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Wall gallery slider items
  const [sliderItems, setSliderItems] = useState([
    {
      id: 1,
      title: "Rustic Living",
      description: "Our premium textured oak frame transforms simple spaces into organic sanctuaries of memory.",
      imageUrl: "/images/wall_frame_1.png"
    },
    {
      id: 2,
      title: "Artist's Atelier",
      description: "Vintage studio paneled walls decorated with museum-grade walnut and gilt frames.",
      imageUrl: "/images/wall_frame_2.png"
    },
    {
      id: 3,
      title: "Exhibition Hall",
      description: "Sleek gallery black borders casting elegant shadows under minimalist spotlight beams.",
      imageUrl: "/images/wall_frame_3.png"
    },
    {
      id: 4,
      title: "Bohemian Console",
      description: "Intricately carved wood consoles supporting timeless gold leaf detailing.",
      imageUrl: "/images/wall_frame_4.png"
    },
    {
      id: 5,
      title: "Collector's Library",
      description: "Deep mahogany casework paired with classical portraiture borders.",
      imageUrl: "/images/wall_frame_5.png"
    },
    {
      id: 6,
      title: "Serene Plaster",
      description: "Panoramic horizon perspectives nested above serene master bedroom suites.",
      imageUrl: "/images/wall_frame_6.png"
    },
    {
      id: 7,
      title: "Wall Gallery",
      description: "Bright gallery walls with a dynamic collection of custom sized frames.",
      imageUrl: "/images/wall_frame_7.png"
    }
  ]);

  const handleNextWallSlide = () => {
    setSliderItems(prev => {
      const [first, ...rest] = prev;
      return [...rest, first];
    });
  };

  const handlePrevWallSlide = () => {
    setSliderItems(prev => {
      const last = prev[prev.length - 1];
      const rest = prev.slice(0, prev.length - 1);
      return [last, ...rest];
    });
  };

  const handleItemClick = (index) => {
    if (index <= 1) return;
    const shiftCount = index - 1;
    setSliderItems(prev => {
      const firstPart = prev.slice(0, shiftCount);
      const secondPart = prev.slice(shiftCount);
      return [...secondPart, ...firstPart];
    });
  };

  // Sync carousel index to show selected frame in center
  useEffect(() => {
    if (onlyFrames.length > 0 && selectedFrame) {
      const idx = onlyFrames.findIndex((f) => matchFrame(f, selectedFrame.id));
      if (idx !== -1) {
        const targetStart = (idx - 1 + onlyFrames.length) % onlyFrames.length;
        setCarouselIndex(targetStart);
      } else {
        setCarouselIndex(0);
      }
    }
  }, [frames, selectedFrame]);

  const handlePrevFrame = () => {
    if (onlyFrames.length === 0) return;
    setCarouselIndex((prev) => (prev - 1 + onlyFrames.length) % onlyFrames.length);
  };

  const handleNextFrame = () => {
    if (onlyFrames.length === 0) return;
    setCarouselIndex((prev) => (prev + 1) % onlyFrames.length);
  };

  // Fetch all frames from Firebase database
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
      const matched = frames.find((f) => matchFrame(f, id));
      if (matched) {
        setSelectedFrame(matched);
        const queryOrientation = searchParams?.get("orientation");
        const isGame = matched.category?.toLowerCase() === "board game" || matched.category?.toLowerCase() === "board games";
        setOrientation(isGame ? "square" : (queryOrientation || matched.orientation || "portrait"));

        // Auto-select initial (first/smallest) size
        const sizes = matched.sizes && matched.sizes.length > 0 ? matched.sizes : DEFAULT_SIZES;
        if (sizes.length > 0) {
          setSelectedSize(sizes[0].label);
        }
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
    const matched = frames.find((f) => matchFrame(f, frameId));
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
          const matched = frames.find((f) => matchFrame(f, frameId));
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

  // Size specifications and price additions dynamically based on selected frame's settings
  const frameSizes = selectedFrame?.sizes && selectedFrame.sizes.length > 0
    ? selectedFrame.sizes
    : DEFAULT_SIZES;

  const getSizePremium = (sizeLabel) => {
    const sizeObj = frameSizes.find(s => s.label === sizeLabel);
    return sizeObj ? (parseInt(sizeObj.priceDelta) || 0) : 0;
  };

  const getSizeLabel = (sizeLabel) => {
    const sizeObj = frameSizes.find(s => s.label === sizeLabel);
    return sizeObj ? sizeObj.displayLabel : 'Choose Size';
  };

  const basePriceNum = parsePrice(selectedFrame?.price);
  const sizePremium = getSizePremium(selectedSize);
  const calculatedPriceNum = basePriceNum + sizePremium;
  const calculatedPriceStr = formatPrice(calculatedPriceNum);
  const isGame = selectedFrame && isBoardGame(selectedFrame);

  // Dynamic inner photo loader: uses custom uploaded thumbnail photo if present, otherwise alternating orientation artwork
  const getDummyPhoto = () => {
    if (selectedFrame?.thumbnailUrl) {
      return selectedFrame.thumbnailUrl;
    }
    if (orientation === "landscape") {
      return "/images/nature.jpg";
    }
    return "/images/dummyImg.jpg";
  };

  const currentPhoto = userUploadedImage || getDummyPhoto();

  // Get visible frames for the switcher carousel
  const getVisibleFrames = () => {
    if (onlyFrames.length === 0) return [];
    const visible = [];
    for (let i = 0; i < 3; i++) {
      const idx = (carouselIndex + i) % onlyFrames.length;
      visible.push(onlyFrames[idx]);
    }
    return visible;
  };
  const visibleFrames = getVisibleFrames();

  // Swapped inner padding logic for rotated frames - simplified to native paddings since frame rotates
  const getPaddings = () => {
    if (!selectedFrame) return { top: 4.5, left: 6.8, bottom: 4.5, right: 6.8 };
    const p = selectedFrame;
    return {
      top: p.paddingTop !== undefined && p.paddingTop > 0 ? p.paddingTop : 4.5,
      left: p.paddingLeft !== undefined && p.paddingLeft > 0 ? p.paddingLeft : 6.8,
      bottom: p.paddingBottom !== undefined && p.paddingBottom > 0 ? p.paddingBottom : 4.5,
      right: p.paddingRight !== undefined && p.paddingRight > 0 ? p.paddingRight : 6.8
    };
  };

  const paddings = getPaddings();
  const aspectRatio = "2 / 3"; // Always keep native portrait aspect ratio to avoid stretching the texture

  // Calculate dynamic inner container aspect ratio for rotated landscape frames
  const containerHeightPct = 100 - paddings.top - paddings.bottom;
  const containerWidthPct = 100 - paddings.left - paddings.right;
  const innerRatio = 1.5 * (containerHeightPct / (containerWidthPct || 1));
  const landscapeImgWidth = `${(innerRatio * 100).toFixed(4)}%`;
  const landscapeImgHeight = `${((1 / innerRatio) * 100).toFixed(4)}%`;

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
    if (selectedFrame.stock !== undefined && parseInt(selectedFrame.stock) === 0) {
      alert("This frame is currently out of stock!");
      return;
    }
    const isGame = selectedFrame && isBoardGame(selectedFrame);
    if (!isGame && !selectedSize) {
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
      size: isGame ? (selectedSize ? getSizeLabel(selectedSize) : "Standard") : getSizeLabel(selectedSize),
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
    return <ProductPageLoader />;
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
        .exquisite-wood-frame.square-frame {
          aspect-ratio: 1 / 1;
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
        .exquisite-wood-frame.light-on .exquisite-inner-photo::after {
          opacity: 1;
        }

        .exquisite-inner-photo img {
          width: 100% !important;
          height: 100% !important;
          object-fit: ${isGame ? 'fill' : 'cover'} !important;
          display: block;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), filter 0.35s ease;
          transform-origin: center center;
        }
        .exquisite-inner-photo img.rotated-landscape-img {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 152% !important;
          height: 152% !important;
          transform: translate(-50%, -50%) rotate(-90deg) !important;
        }

        .exquisite-inner-photo img.light-active {
          filter: none;
        }

        .exquisite-inner-photo img.light-inactive {
          filter: none;
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
          align-self: center;
          transform: translateY(0);
        }

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
          flex-wrap: wrap;
        }

        .product-price-val {
          font-family: var(--font-typewriter);
          font-size: 22px;
          font-weight: 700;
          color: #8b1e1e; /* Vintage red ink stamp */
          text-shadow: 0.5px 0.5px 0px rgba(255, 255, 255, 0.6);
        }

        .stock-badge {
          font-family: var(--font-typewriter);
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .stock-badge.in-stock {
          background: rgba(34, 197, 94, 0.1);
          color: #166534;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .stock-badge.out-of-stock {
          background: rgba(239, 68, 68, 0.1);
          color: #991b1b;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .action-row .btn-premium:disabled {
          background: #cccccc !important;
          color: #666666 !important;
          cursor: not-allowed !important;
          transform: none !important;
          box-shadow: none !important;
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

        /* PRODUCT DETAIL SECTION WRAPPER & BACKDROP GLOW Styles */
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

        /* Scoped Switch Styling for details card */
        .product-config-pane .light-control-panel {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(44, 30, 17, 0.05);
          border: 1px dashed rgba(139, 94, 60, 0.45);
          padding: 6px 14px;
          border-radius: 999px;
          z-index: 30;
          margin-top: 0px;
          margin-bottom: 6px;
          box-shadow: none;
          transition: all 0.3s ease;
          width: fit-content;
          align-self: flex-start;
        }
        .product-config-pane .light-control-panel:hover {
          border-color: rgba(139, 94, 60, 0.8);
          background: rgba(44, 30, 17, 0.1);
        }
        .product-config-pane .light-control-label {
          font-family: var(--font-typewriter);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #2c1e11;
          user-select: none;
        }
        .product-config-pane .light-switch-btn {
          width: 42px;
          height: 22px;
          background: #f6f0df;
          border: 1.5px solid #8b5e3c;
          border-radius: 999px;
          position: relative;
          cursor: pointer;
          padding: 0;
          outline: none;
          transition: all 0.3s ease;
        }
        .product-config-pane .light-switch-btn.on {
          background: #8b5e3c;
          border-color: #2c1e11;
          box-shadow: 0 0 6px rgba(139, 94, 60, 0.3);
        }
        .product-config-pane .light-switch-knob {
          width: 14px;
          height: 14px;
          background: linear-gradient(135deg, #dfc38a, #8f723b);
          border: 1px solid #2c1e11;
          border-radius: 50%;
          position: absolute;
          top: 2.5px;
          left: 3px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .product-config-pane .light-switch-btn.on .light-switch-knob {
          transform: translateX(18px);
          background: linear-gradient(135deg, #f6f0df, #dfc38a);
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
          overflow: visible;
          justify-content: center;
          flex: 1;
          padding: 8px 0;
        }
        .carousel-thumb-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
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
          overflow: visible;
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
          margin-top: 16px;
          margin-bottom: 10px;
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

        /* WALL GALLERY SLIDER SECTION */
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

              {/* Picture Frame */}
              <div className={`exquisite-wood-frame ${lightOn ? "light-on" : ""} ${orientation === "landscape" ? "rotated-landscape" : ""} ${orientation === "square" ? "square-frame" : ""}`}>
                {selectedFrame.imageUrl && (
                  <img
                    src={selectedFrame.imageUrl}
                    alt={selectedFrame.name}
                    className="wood-frame-overlay"
                  />
                )}

                {/* Photo opening */}
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
              {!isGame && onlyFrames.length > 0 && (
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
                            {(f.thumbnailUrl || f.imageUrl) ? (
                              <img src={f.thumbnailUrl || f.imageUrl} alt={f.name} />
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
                    {onlyFrames.map((f) => (
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
          <div className="product-config-column">
            {/* Light Switch panel (Placed above the paper card) */}
            <div className="light-control-panel" style={{ alignSelf: "center", marginTop: 0, marginBottom: 0 }}>
              <span className="light-control-label">Light Switch</span>
              <button
                className={`light-switch-btn ${lightOn ? 'on' : ''}`}
                onClick={() => setLightOn(!lightOn)}
                aria-label="Toggle Light Switch"
              >
                <span className="light-switch-knob" />
              </button>
            </div>

            <div className="product-config-pane">

              <div className="product-meta-header">
                {/* Title moved to top position, removing tag header */}
                <h1 className="product-title">{selectedFrame.name}</h1>

                {/* Stock status badge moved to the place of the main heading */}
                {selectedFrame.stock !== undefined && (
                  <div style={{ marginTop: "4px" }}>
                    <span className={`stock-badge ${parseInt(selectedFrame.stock) > 0 ? "in-stock" : "out-of-stock"}`}>
                      {parseInt(selectedFrame.stock) > 0 ? `${selectedFrame.stock} in stock` : "Out of stock"}
                    </span>
                  </div>
                )}

                {/* Price below stock badge */}
                <div className="product-price-row" style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
                  <span className="product-price-val">{calculatedPriceStr}</span>
                </div>
              </div>

              {/* Description */}
              <div className="config-section">
                <span className="config-label">Molding Description</span>
                <p className={`product-desc-text ${isDescExpanded ? "" : "clamped"}`}>
                  {selectedFrame.desc || "Exquisitely designed wooden moulding frame, handcrafted to highlight contrast, depth, and the natural grain details of original timber prints."}
                </p>
                {(selectedFrame.desc || "Exquisitely designed wooden moulding frame, handcrafted to highlight contrast, depth, and the natural grain details of original timber prints.").length > 120 && (
                  <button
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent)",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      padding: "4px 0",
                      alignSelf: "flex-start",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontFamily: "var(--font-typewriter)",
                      marginTop: "-6px"
                    }}
                  >
                    {isDescExpanded ? "Read Less" : "Read More"}
                  </button>
                )}
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
                    {frameSizes.map((size) => {
                      const delta = parseInt(size.priceDelta) || 0;
                      const deltaText = delta === 0 && " (Base Price)";
                      return (
                        <option key={size.label} value={size.label}>
                          {size.displayLabel}{deltaText}
                        </option>
                      );
                    })}
                  </select>
                  <span className="select-arrow">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
                {sizeError && <span className="size-error-msg">Please select a size</span>}
              </div>

              {/* Orientation selection */}
              {!isBoardGame(selectedFrame) && (
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
              )}

              {/* CTA Actions */}
              <div className="action-row">
                {!(selectedFrame.stock !== undefined && parseInt(selectedFrame.stock) === 0) && (
                  <button
                    className="btn-premium"
                    onClick={handleAddToCart}
                  >
                    Add to Cart
                  </button>
                )}
                {!isBoardGame(selectedFrame) && (
                  <button className="btn-premium-ghost" onClick={triggerFileUpload}>
                    Upload Photo
                  </button>
                )}
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
        </div>
      </section>

      {/* Wall Gallery Slider Section */}
      <section className="wall-gallery-slider-section">

        <ul className="wall-slider-track">
          {sliderItems.map((item, index) => (
            <li
              key={item.id}
              className="wall-slider-item"
              style={{ backgroundImage: `url('${item.imageUrl}')` }}
              onClick={() => handleItemClick(index)}
            >
              <div className="wall-slider-content">
                <h2 className="wall-slider-content-title">"{item.title}"</h2>
                <p className="wall-slider-content-description">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
        <nav className="wall-slider-nav">
          <button className="wall-slider-nav-btn prev" onClick={handlePrevWallSlide}>
            &larr;
          </button>
          <button className="wall-slider-nav-btn next" onClick={handleNextWallSlide}>
            &rarr;
          </button>
        </nav>
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
    <Suspense fallback={<ProductPageLoader />}>
      <ProductDetailContent params={params} />
    </Suspense>
  );
}
