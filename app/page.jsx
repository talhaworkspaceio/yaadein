// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { db } from "../lib/firebase";
// import { ref, onValue, push, set } from "firebase/database";
// import Navbar from "./components/Navbar";
// import Footer from "./components/Footer";
// import CardDescription from "./components/CardDescription";

// // Persistent Cart LocalStorage Helpers
// const getCart = () => {
//   if (typeof window === "undefined") return [];
//   try {
//     return JSON.parse(localStorage.getItem("fs_cart") || "[]");
//   } catch (e) {
//     return [];
//   }
// };

// const saveCart = (cart) => {
//   if (typeof window === "undefined") return;
//   localStorage.setItem("fs_cart", JSON.stringify(cart));
//   window.dispatchEvent(new Event("fs-cart-updated"));
// };

// export default function HomePage() {
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [cartItems, setCartItems] = useState([]);
//   const [cartOpen, setCartOpen] = useState(false);
//   const [filter, setFilter] = useState("portrait");
//   const [products, setProducts] = useState([]);
//   const [catalogEntered, setCatalogEntered] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [showPromo, setShowPromo] = useState(false);
//   const [promoEmail, setPromoEmail] = useState("");
//   const [promoSubmitted, setPromoSubmitted] = useState(false);
//   const [isSubmittingPromo, setIsSubmittingPromo] = useState(false);
//   const [copiedCode, setCopiedCode] = useState(false);
//   const [lightOn, setLightOn] = useState(true);
//   const [currentSlide, setCurrentSlide] = useState(0);
//   const [currentReviewSlide, setCurrentReviewSlide] = useState(0);
//   const [currentSocialSlide, setCurrentSocialSlide] = useState(0);

//   // Auto-play: reviews carousel now moves left -> right (decrementing index
//   // instead of incrementing) so new cards slide in from the left.
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setCurrentReviewSlide((prev) => (prev - 1 + 2) % 2);
//     }, 7000);
//     return () => clearInterval(timer);
//   }, []);

//   // Auto-play: social feed carousel, same left -> right direction.
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setCurrentSocialSlide((prev) => (prev - 1 + 2) % 2);
//     }, 8000);
//     return () => clearInterval(timer);
//   }, []);

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const params = new URLSearchParams(window.location.search);
//       const query = params.get("search");
//       if (query) {
//         setSearchQuery(query);
//         setTimeout(() => {
//           const cat = document.getElementById("catalog");
//           if (cat) cat.scrollIntoView({ behavior: "smooth" });
//         }, 300);
//       }
//     }
//   }, []);

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const seen = localStorage.getItem("yaadein_seen_promo");
//       if (!seen) {
//         const timer = setTimeout(() => {
//           setShowPromo(true);
//         }, 1500);
//         return () => clearTimeout(timer);
//       }
//     }
//   }, []);

//   const handlePromoSubmit = async (e) => {
//     e.preventDefault();
//     if (!promoEmail.trim()) return;
//     setIsSubmittingPromo(true);
//     try {
//       const newsletterRef = ref(db, "newsletter");
//       const newSubscriberRef = push(newsletterRef);
//       await set(newSubscriberRef, {
//         email: promoEmail.trim(),
//         subscribedAt: Date.now()
//       });
//       setPromoSubmitted(true);
//       if (typeof window !== "undefined") {
//         localStorage.setItem("yaadein_seen_promo", "true");
//       }
//     } catch (err) {
//       console.error("Error saving newsletter subscription:", err);
//     } finally {
//       setIsSubmittingPromo(false);
//     }
//   };

//   const handleClosePromo = () => {
//     setShowPromo(false);
//     if (typeof window !== "undefined") {
//       localStorage.setItem("yaadein_seen_promo", "true");
//     }
//   };

//   const handleCopyPromoCode = () => {
//     if (typeof window !== "undefined") {
//       navigator.clipboard.writeText("MEMORIES10");
//       setCopiedCode(true);
//       setTimeout(() => setCopiedCode(false), 2000);
//     }
//   };

//   useEffect(() => {
//     const framesRef = ref(db, "frames");
//     const unsub = onValue(framesRef, (snapshot) => {
//       const data = snapshot.val();
//       if (data) {
//         const framesList = Object.entries(data).map(([key, val]) => ({
//           id: key,
//           ...val
//         }));
//         setProducts(framesList);
//       } else {
//         setProducts([]);
//       }
//     });
//     return () => unsub();
//   }, []);

//   useEffect(() => {
//     const catalogSec = document.getElementById("catalog");
//     if (!catalogSec) return;

//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) {
//           requestAnimationFrame(() => {
//             setCatalogEntered(true);
//           });
//           observer.disconnect();
//         }
//       },
//       { threshold: 0.15 }
//     );

//     observer.observe(catalogSec);
//     return () => {
//       observer.disconnect();
//     };
//   }, []);



//   const loadCart = useCallback(() => {
//     const rawCart = getCart();
//     // Normalize any old cart items that still have $ from previous session
//     const normalizedCart = rawCart.map(item => {
//       if (item.price && item.price.includes("$")) {
//         const numeric = parseInt(item.price.replace(/[^0-9]/g, "")) || 0;
//         return { ...item, price: `Rs. ${(numeric * 100).toLocaleString()}` };
//       }
//       return item;
//     });
//     setCartItems(normalizedCart);
//   }, []);

//   useEffect(() => {
//     loadCart();
//     window.addEventListener("fs-cart-updated", loadCart);
//     return () => {
//       window.removeEventListener("fs-cart-updated", loadCart);
//     };
//   }, [loadCart]);

//   const updateQuantity = (index, delta) => {
//     const cart = getCart();
//     cart[index].quantity = Math.max(1, cart[index].quantity + delta);
//     saveCart(cart);
//   };

//   const removeCartItem = (index) => {
//     const cart = getCart();
//     cart.splice(index, 1);
//     saveCart(cart);
//   };

//   const getCartSubtotal = () => {
//     return cartItems.reduce((acc, item) => {
//       const priceVal = parseInt((item.price || "0").replace(/[^0-9]/g, "")) || 0;
//       return acc + (priceVal * item.quantity);
//     }, 0);
//   };

//   const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

//   const portraitProducts = products.filter(p => p.orientation === 'portrait').slice(0, 3);
//   const landscapeProducts = products.filter(p => p.orientation === 'landscape').slice(0, 3);
//   const boardGames = products.filter(p => p.orientation === 'square').slice(0, 3);

//   const isNewArrival = (p) => {
//     if (!p) return false;
//     const createdAt = typeof p === "object" ? p.createdAt : null;
//     if (createdAt) {
//       const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
//       return (Date.now() - createdAt) < sevenDaysInMs;
//     }
//     const id = typeof p === "string" ? p : p.id;
//     return id === "antique-gold" || id === "gallery-landscape" || id === "landscape-oak";
//   };

//   const isFeatured = (id) => {
//     return id === "modern-black" || id === "classic-walnut" || id === "royal-gilt" || id === "colonial-pine";
//   };

//   const renderProductCard = (p) => {
//     const isLandscape = p.orientation === "landscape";

//     return (
//       <div key={p.id} className={`arrival-card ${isLandscape ? "landscape-card" : ""}`}>
//         {isNewArrival(p) ? (
//           <div className="ribbon">New Arrival</div>
//         ) : isFeatured(p.id) ? (
//           <div className="ribbon">Featured</div>
//         ) : null}

//         <div
//           className="card-thumb-wrap"
//           style={{
//             aspectRatio: isLandscape ? "3 / 2" : "4 / 5",
//             padding: isLandscape ? "8px" : "20px"
//           }}
//         >
//           <div
//             className="card-frame"
//             style={isLandscape ? {
//               /* Portrait frame image rotated -90deg to display as landscape.
//                  The pre-rotation height (= visual width after rotation) is
//                  derived from the wrap width; the frame's own width follows
//                  the image's natural aspect ratio, so no stretching. */
//               position: "absolute",
//               top: "50%",
//               left: "50%",
//               transform: "translate(-50%, -50%) rotate(-90deg)",
//               transformOrigin: "center center",
//               height: "calc(100% * 1.5 - 16px)",
//               width: "auto",
//               boxShadow: "0 10px 24px rgba(0,0,0,0.6)",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               overflow: "hidden"
//             } : {
//               position: "relative",
//               aspectRatio: p.aspectRatio || "2 / 3",
//               width: "auto",
//               height: "100%",
//               boxShadow: "0 10px 24px rgba(0,0,0,0.6)",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               overflow: "hidden",
//               margin: "0 auto"
//             }}
//           >
//             {p.imageUrl && (
//               <img
//                 src={p.imageUrl}
//                 alt={p.name}
//                 style={isLandscape ? {
//                   /* Natural ratio: height is pinned to the (rotated) frame box,
//                      width follows the image's real proportions. */
//                   width: "auto",
//                   height: "100%",
//                   display: "block",
//                   position: "relative",
//                   zIndex: p.imageUrl.endsWith('.png') ? 2 : 4,
//                   pointerEvents: "none"
//                 } : {
//                   width: "100%",
//                   height: "100%",
//                   objectFit: "fill",
//                   position: "absolute",
//                   inset: 0,
//                   zIndex: p.imageUrl.endsWith('.png') ? 2 : 4,
//                   pointerEvents: "none"
//                 }}
//               />
//             )}
//             <div
//               className="card-frame-inner"
//               style={{
//                 position: "absolute",
//                 top: `${p.paddingTop || 0}%`,
//                 left: `${p.paddingLeft || 0}%`,
//                 bottom: `${p.paddingBottom || 0}%`,
//                 right: `${p.paddingRight || 0}%`,
//                 zIndex: p.imageUrl && p.imageUrl.endsWith('.png') ? 4 : 2,
//                 background: "#2D2822",
//                 boxShadow: "inset 0 0 10px rgba(0,0,0,0.8)",
//                 overflow: "hidden"
//               }}
//             >
//               <img
//                 src={isLandscape ? "/images/nature.jpg" : "/images/dummyImg.jpg"}
//                 alt="Frame Art Preview"
//                 style={{
//                   width: isLandscape ? "152%" : "100%",
//                   height: isLandscape ? "152%" : "100%",
//                   objectFit: "cover",
//                   position: "absolute",
//                   top: "50%",
//                   left: "50%",
//                   /* Counter-rotate the photo so it reads upright inside the rotated frame */
//                   transform: isLandscape ? "translate(-50%, -50%) rotate(90deg)" : "translate(-50%, -50%)",
//                   objectPosition: "center center"
//                 }}
//               />
//             </div>
//           </div>
//         </div>

//         <div className="product-info">
//           <div className="product-header-row">
//             <h3 className="product-name">{p.name}</h3>
//             <span className="product-price">{p.price}</span>
//           </div>
//           <CardDescription desc={p.desc} />
//         </div>

//         <a href={`/product/${p.id}?orientation=${p.orientation || 'portrait'}`} className="btn-card">
//           {p.orientation === 'square' ? "View Game" : "View Frame"}
//         </a>
//       </div>
//     );
//   };

//   return (
//     <div className="home-root">
//       <style dangerouslySetInnerHTML={{
//         __html: `
//         .home-root {
//           position: relative;
//           font-family: var(--font-serif);
//           background: var(--bg);
//           color: var(--text);
//           min-height: 100vh;
//           overflow-x: hidden;
//           scroll-behavior: smooth;
//         }

//         /* NAVBAR */
//         .navbar {
//           position: absolute;
//           top: 0;
//           left: 0;
//           right: 0;
//           height: 80px;
//           background: linear-gradient(to bottom, rgba(12, 10, 8, 0.8) 0%, rgba(12, 10, 8, 0) 100%);
//           border-bottom: none;
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           padding: 0 40px;
//           z-index: 1000;
//           box-shadow: none;
//         }
//         .nav-brand {
//           display: flex;
//           align-items: center;
//           transition: transform 0.2s ease;
//         }
//         .nav-brand:hover {
//           transform: scale(1.03);
//         }
//         .nav-logo-img {
//           height: 38px;
//           width: auto;
//           display: block;
//         }

//         .nav-actions {
//           display: flex;
//           align-items: center;
//           gap: 24px;
//         }
//         .btn-nav-cart {
//           background: none;
//           border: none;
//           cursor: pointer;
//           position: relative;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           padding: 8px;
//           transition: transform 0.2s ease;
//           font-size: 20px;
//           color: var(--text);
//         }
//         .btn-nav-cart:hover {
//           transform: scale(1.1);
//           color: var(--accent);
//         }
//         .cart-badge {
//           position: absolute;
//           top: -2px;
//           right: -4px;
//           background: radial-gradient(circle, var(--accent2) 0%, var(--accent) 100%);
//           border: 1px solid #7E631F;
//           color: #1A1100;
//           font-family: var(--font-typewriter);
//           font-size: 10px;
//           font-weight: 700;
//           min-width: 16px;
//           height: 16px;
//           border-radius: 50%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           box-shadow: 0 2px 5px rgba(0,0,0,0.5);
//         }

//         .btn-nav-primary {
//           padding: 8px 18px !important;
//         }

//         .menu-btn {
//           display: none;
//           background: none;
//           border: none;
//           color: var(--text);
//           font-size: 24px;
//           cursor: pointer;
//         }

//         /* CATALOG SECTION */
//         .catalog-section {
//           background: #080605;
//           padding: 100px 40px;
//           position: relative;
//           overflow: hidden;
//         }

//         .catalog-glass-bg {
//           position: absolute;
//           inset: 0;
//           z-index: 1;
//           pointer-events: none;
//         }

//         .catalog-glass-pane {
//           position: absolute;
//           inset: 0;
//           z-index: 2;
//           background: rgba(12, 10, 8, 0.45);
//           backdrop-filter: blur(35px) saturate(140%);
//           -webkit-backdrop-filter: blur(35px) saturate(140%);
//           border-top: 1px solid rgba(181, 139, 92, 0.15);
//           border-bottom: 1px solid rgba(181, 139, 92, 0.15);
//           box-shadow: inset 0 20px 40px rgba(0, 0, 0, 0.5), inset 0 -20px 40px rgba(0, 0, 0, 0.5);
//           pointer-events: none;
//         }

//         .catalog-container {
//           max-width: 1300px;
//           margin: 0 auto;
//           position: relative;
//           z-index: 3;
//         }

//         .catalog-glow {
//           position: absolute;
//           top: 0;
//           left: 0;
//           width: 1000px;
//           height: 1000px;
//           background: radial-gradient(circle, rgba(181, 139, 92, 0.3) 0%, rgba(139, 94, 60, 0.1) 50%, rgba(0, 0, 0, 0) 80%);
//           pointer-events: none;
//           z-index: 1;
//           opacity: 1;
//           animation: catalog-glow-auto 10s infinite ease-in-out;
//         }

//         @keyframes catalog-glow-auto {
//           0% {
//             transform: translate(-20%, -20%) scale(1);
//           }
//           25% {
//             transform: translate(100%, 10%) scale(1.2);
//           }
//           50% {
//             transform: translate(40%, 40%) scale(0.9);
//           }
//           75% {
//             transform: translate(-10%, 30%) scale(1.1);
//           }
//           100% {
//             transform: translate(-20%, -20%) scale(1);
//           }
//         }

//         /* LIQUID BLOBS */
//         .liquid-blob-1 {
//           position: absolute;
//           top: -10%;
//           left: 10%;
//           width: 500px;
//           height: 500px;
//           background: radial-gradient(circle, rgba(181, 139, 92, 0.28) 0%, rgba(139, 94, 60, 0) 70%);
//           border-radius: 43% 57% 51% 49% / 57% 40% 60% 43%;
//           animation: liquid-move-1 25s infinite alternate ease-in-out;
//           pointer-events: none;
//           z-index: 1;
//         }

//         .liquid-blob-2 {
//           position: absolute;
//           bottom: -15%;
//           right: 5%;
//           width: 550px;
//           height: 550px;
//           background: radial-gradient(circle, rgba(139, 94, 60, 0.24) 0%, rgba(201, 168, 76, 0) 70%);
//           border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%;
//           animation: liquid-move-2 30s infinite alternate ease-in-out;
//           pointer-events: none;
//           z-index: 1;
//         }

//         @keyframes liquid-move-1 {
//           0% {
//             transform: translate(0, 0) scale(1) rotate(0deg);
//             border-radius: 43% 57% 51% 49% / 57% 40% 60% 43%;
//           }
//           33% {
//             transform: translate(80px, -60px) scale(1.15) rotate(45deg);
//             border-radius: 54% 46% 38% 62% / 49% 70% 30% 51%;
//           }
//           66% {
//             transform: translate(-40px, 80px) scale(0.9) rotate(90deg);
//             border-radius: 35% 65% 60% 40% / 50% 35% 65% 50%;
//           }
//           100% {
//             transform: translate(0, 0) scale(1) rotate(180deg);
//             border-radius: 43% 57% 51% 49% / 57% 40% 60% 43%;
//           }
//         }

//         @keyframes liquid-move-2 {
//           0% {
//             transform: translate(0, 0) scale(1) rotate(0deg);
//             border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%;
//           }
//           50% {
//             transform: translate(-100px, 50px) scale(1.2) rotate(120deg);
//             border-radius: 38% 62% 62% 38% / 68% 48% 52% 32%;
//           }
//           100% {
//             transform: translate(60px, -70px) scale(0.9) rotate(-60deg);
//             border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%;
//           }
//         }
//         .section-header {
//           text-align: center;
//           margin-bottom: 40px;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           gap: 16px;
//         }
//         .section-title {
//           font-family: var(--font-display);
//           font-size: 42px;
//           color: var(--accent);
//           letter-spacing: 0.05em;
//         }
//         .section-desc {
//           font-family: var(--font-serif);
//           font-size: 16px;
//           color: var(--text2);
//           max-width: 600px;
//           line-height: 1.7;
//         }

//         /* FILTERS */
//         .catalog-filters {
//           display: flex;
//           justify-content: center;
//           gap: 16px;
//           margin-bottom: 40px;
//         }
//         .filter-btn {
//           background: var(--surface2);
//           border: 1px solid var(--border2);
//           color: var(--text2);
//           padding: 10px 24px;
//           border-radius: var(--radius);
//           font-family: var(--font-display);
//           font-size: 13px;
//           font-weight: 700;
//           letter-spacing: 0.05em;
//           text-transform: uppercase;
//           cursor: pointer;
//           transition: all 0.2s ease;
//           box-shadow: 0 4px 8px rgba(0,0,0,0.3);
//         }
//         .filter-btn:hover {
//           color: var(--accent);
//           border-color: var(--accent);
//         }
//         .filter-btn.active {
//           background: var(--accent);
//           color: #1A1100;
//           border-color: var(--accent);
//           box-shadow: inset 0 0 4px rgba(0,0,0,0.5);
//         }

//         /* CAROUSEL SYSTEM */
//         .carousel-wrapper {
//           position: relative;
//           width: 100%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }

//         .carousel-viewport {
//           overflow: hidden;
//           width: 100%;
//           max-width: 1220px;
//           margin: 0 40px;
//         }

//         .carousel-track {
//           display: flex;
//           transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
//           width: 300%;
//         }

//         .carousel-slide {
//           width: 33.333%;
//           display: flex;
//           justify-content: center;
//           align-items: flex-start;
//           gap: 30px;
//           flex-shrink: 0;
//           padding: 12px 0;
//         }

//         /* CATALOG-STYLE ARRIVAL CARD (copied from catalog page) */
//         .arrival-card {
//           width: 340px;
//           background: linear-gradient(135deg, var(--surface2) 0%, #15110D 100%);
//           border: 6px solid #1C0F07;
//           outline: 1px solid var(--accent);
//           outline-offset: -5px;
//           padding: 24px;
//           display: flex;
//           flex-direction: column;
//           gap: 20px;
//           transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
//           position: relative;
//           box-shadow: 0 12px 30px rgba(0,0,0,0.6);
//         }

//         .arrival-card:hover {
//           transform: translateY(-8px);
//           border-color: #2D1A0F;
//           box-shadow: 0 20px 45px rgba(0,0,0,0.8), 0 0 15px rgba(212,175,55,0.2);
//         }

//         .carousel-slide .arrival-card {
//           width: calc((100% - 60px) / 3);
//           max-width: 360px;
//         }

//         .carousel-slide .arrival-card.landscape-card {
//           max-width: 390px;
//         }

//         .carousel-arrow {
//           background: rgba(20, 17, 14, 0.8);
//           border: 1px solid rgba(212, 175, 55, 0.3);
//           border-radius: 50%;
//           width: 44px;
//           height: 40px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           color: var(--accent);
//           cursor: pointer;
//           transition: all 0.3s ease;
//           z-index: 10;
//           box-shadow: 0 4px 10px rgba(0,0,0,0.5);
//         }

//         .carousel-arrow:hover {
//           background: var(--accent);
//           color: #000;
//           border-color: var(--accent);
//           transform: scale(1.1);
//         }

//         .carousel-indicators {
//           display: flex;
//           justify-content: center;
//           gap: 12px;
//           margin-top: 30px;
//         }

//         .carousel-dot {
//           width: 10px;
//           height: 10px;
//           border-radius: 50%;
//           background: rgba(255, 255, 255, 0.2);
//           border: none;
//           cursor: pointer;
//           transition: all 0.3s ease;
//           padding: 0;
//         }

//         .carousel-dot:hover {
//           background: rgba(255, 255, 255, 0.5);
//         }

//         .carousel-dot.active {
//           background: var(--accent);
//           transform: scale(1.2);
//           box-shadow: 0 0 8px var(--accent);
//         }

//         @media (max-width: 1100px) {
//           .carousel-viewport {
//             max-width: 960px;
//           }
//         }

//         @media (max-width: 1024px) {
//           .carousel-viewport {
//             max-width: 100%;
//             margin: 0;
//           }
//           .carousel-slide {
//             flex-direction: column;
//             align-items: center;
//             gap: 24px;
//           }
//           .carousel-slide .arrival-card {
//             width: 100%;
//             max-width: 340px;
//           }
//           .carousel-arrow {
//             display: none;
//           }
//         }

//         /* GRID */
//         .catalog-grid {
//           display: flex;
//           flex-wrap: wrap;
//           justify-content: center;
//           gap: 30px;
//         }

//         /* PRODUCT CARD - MINI WOODEN FRAME */
//         .product-card {
//           width: 290px;
//           background: linear-gradient(135deg, var(--surface2) 0%, #15110D 100%);
//           border: 6px solid #1C0F07; /* dark wood border */
//           outline: 1px solid var(--accent);
//           outline-offset: -5px;
//           padding: 24px;
//           display: flex;
//           flex-direction: column;
//           gap: 20px;
//           transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
//           position: relative;
//           overflow: hidden;
//           box-shadow: 0 8px 20px rgba(0,0,0,0.6);
//         }
//         .product-card:hover {
//           transform: translateY(-8px);
//           border-color: #2D1A0F;
//           box-shadow: 0 15px 35px rgba(0,0,0,0.8), 0 0 10px rgba(212,175,55,0.25);
//         }
//         .product-card.landscape-card {
//           width: 350px;
//         }

//         /* HANGING LAMPS */
//         .lamp-wrapper {
//           position: absolute;
//           top: -10px;
//           width: 240px;
//           height: 380px;
//           z-index: 5;
//           transform-origin: top center;
//           transform: rotate(45deg);
//           pointer-events: none;
//         }
//         .lamp-wrapper::after {
//           content: '';
//           position: absolute;
//           top: 0;
//           left: 50%;
//           transform: translateX(-50%);
//           width: 2px;
//           height: 120px;
//           background: #141414;
//           box-shadow: 1px 0 2px rgba(0,0,0,0.6);
//           z-index: 4;
//         }
//         .catalog-section.animate-lamps .lamp-wrapper {
//           animation: lamp-swing 3s forwards;
//         }
//         .lamp-wrapper.left {
//           left: -40px;
//         }
//         .lamp-wrapper.right {
//           right: -40px;
//         }

//         .lamp-img {
//           width: 240px;
//           height: 240px;
//           display: block;
//           object-fit: contain;
//           margin-top: 110px;
//         }



//         /* LAMP GLOW & PARTICLE SYSTEM */
//         .lamp-glow-container {
//           position: absolute;
//           top: 320px; /* center of bulb (shifted down 120px) */
//           left: 50%;
//           transform: translate(-50%, -50%);
//           width: 100px;
//           height: 100px;
//           pointer-events: none;
//         }

//         .glow {
//           display: none;
//         }
//         .catalog-section.animate-lamps .glow {
//           opacity: 1;
//           animation: glow-warm 3s linear infinite alternate;
//         }

//         .particles {
//           position: absolute;
//           top: 0;
//           left: 0;
//           width: 100px;
//           height: 100px;
//           opacity: 0;
//           transition: opacity 0.5s ease;
//         }
//         .catalog-section.animate-lamps .particles {
//           opacity: 1;
//         }

//         .rotate {
//           position: absolute;
//           top: calc(50% - 5px);
//           left: calc(50% - 5px);
//           width: 10px;
//           height: 10px;
//           animation: rotate 120s linear 0s infinite alternate;
//         }

//         .angle {
//           position: absolute;
//           top: 0;
//           left: 0;
//         }

//         .size {
//           position: absolute;
//           top: 0;
//           left: 0;
//           width: 100%;
//           height: 100%;
//         }

//         .position {
//           position: absolute;
//           top: 0;
//           left: 0;
//         }

//         .pulse {
//           position: absolute;
//           top: 0;
//           left: 0;
//           animation: pulse 6s linear 0s infinite alternate;
//         }

//         .particle {
//           position: absolute;
//           top: calc(50% - 2.5px);
//           left: calc(50% - 2.5px);
//           width: 5px;
//           height: 5px;
//           border-radius: 50%;
//         }
//         .particle::before, .particle::after {
//           content: '';
//           position: absolute;
//           border-radius: 50%;
//           width: 4px;
//           height: 4px;
//           box-shadow: inherit;
//         }
//         .particle::before {
//           top: -30px;
//           left: 25px;
//           animation: float-firefly-1 25s ease-in-out infinite alternate;
//         }
//         .particle::after {
//           width: 3px;
//           height: 3px;
//           top: 35px;
//           left: -30px;
//           animation: float-firefly-2 30s ease-in-out infinite alternate;
//         }

//         @keyframes glow-warm {
//           0% {
//             transform: translate(-50%, -50%) rotate(0deg);
//             box-shadow: 0 0 100px 35px rgba(251, 191, 36, 0.85), 35px 20px 75px 15px #fff, -5px -35px 45px 8px #fff;
//           }
//           100% {
//             transform: translate(-50%, -50%) rotate(5deg);
//             box-shadow: 0 0 140px 35px rgba(251, 191, 36, 0.95), 50px 30px 60px 15px #fff, -45px -45px 60px 8px #fff;
//           }
//         }

//         @keyframes rotate {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }

//         @keyframes angle {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }

//         @keyframes size {
//           0% { transform: scale(.2); }
//           100% { transform: scale(.6); }
//         }

//         @keyframes position {
//           0% {
//             transform: translate3d(0,0,0);
//             opacity: 1;
//           }
//           50% {
//             opacity: 1;
//           }
//           100% {
//             transform: translate3d(180px, 140px, 0);
//             opacity: 0;
//           }
//         }
//         @keyframes float-firefly-1 {
//           0% { transform: translate3d(0, 0, 0); }
//           100% { transform: translate3d(-100px, -80px, 0); }
//         }
//         @keyframes float-firefly-2 {
//           0% { transform: translate3d(0, 0, 0); }
//           100% { transform: translate3d(100px, -120px, 0); }
//         }

//         @keyframes pulse {
//           0% { transform: scale(1); }
//           100% { transform: scale(.5); }
//         }

//         @keyframes particle-warm {
//           0% {
//             box-shadow: inset 0 0 10px 10px #D4AF37, 0 0 30px 5px #F59E0B, inset 0 0 40px 40px #FFF59D;
//           }
//           33.33% {
//             box-shadow: inset 0 0 10px 10px #D4AF37, 0 0 60px 5px #F59E0B, inset 0 0 25px 25px #FFF59D;
//           }
//           33.34% {
//             box-shadow: inset 0 0 10px 10px #FCD34D, 0 0 30px 5px #FCD34D, inset 0 0 40px 40px #FFF;
//           }
//           66.66% {
//             box-shadow: inset 0 0 10px 10px #FCD34D, 0 0 60px 5px #FCD34D, inset 0 0 25px 25px #FFF;
//           }
//           66.67% {
//             box-shadow: inset 0 0 10px 10px #D97706, 0 0 30px 5px #D97706, inset 0 0 40px 40px #FF8A00;
//           }
//           100% {
//             box-shadow: inset 0 0 10px 10px #D97706, 0 0 60px 5px #D97706, inset 0 0 25px 25px #FF8A00;
//           }
//         }

//         .rotate .angle:nth-child(1) {
//           animation: angle 60s steps(5) 0s infinite;
//         }
//         .rotate .angle:nth-child(1) .size {
//           animation: size 60s steps(5) 0s infinite;
//         }
//         .rotate .angle:nth-child(1) .particle {
//           animation: particle-warm 8s linear infinite alternate;
//         }
//         .rotate .angle:nth-child(1) .position {
//           animation: position 18s linear 0s infinite;
//         }

//         .rotate .angle:nth-child(2) {
//           animation: angle 35s steps(3) -17s infinite;
//         }
//         .rotate .angle:nth-child(2) .size {
//           animation: size 35s steps(3) -17s infinite alternate;
//         }
//         .rotate .angle:nth-child(2) .particle {
//           animation: particle-warm 7s linear -4.6s infinite alternate;
//         }
//         .rotate .angle:nth-child(2) .position {
//           animation: position 15s linear 0s infinite;
//         }

//         .rotate .angle:nth-child(3) {
//           animation: angle 80s steps(8) -40s infinite;
//         }
//         .rotate .angle:nth-child(3) .size {
//           animation: size 40s steps(4) -30s infinite alternate;
//         }
//         .rotate .angle:nth-child(3) .particle {
//           animation: particle-warm 6.5s linear -2.2s infinite alternate;
//         }
//         .rotate .angle:nth-child(3) .position {
//           animation: position 16s linear 0s infinite;
//         }

//         .rotate .angle:nth-child(4) {
//           animation: angle 50s steps(6) -12s infinite;
//         }
//         .rotate .angle:nth-child(4) .size {
//           animation: size 50s steps(6) -25s infinite alternate;
//         }
//         .rotate .angle:nth-child(4) .particle {
//           animation: particle-warm 9s linear -3s infinite alternate;
//         }
//         .rotate .angle:nth-child(4) .position {
//           animation: position 20s linear -5s infinite;
//         }

//         .rotate .angle:nth-child(5) {
//           animation: angle 70s steps(7) -35s infinite;
//         }
//         .rotate .angle:nth-child(5) .size {
//           animation: size 35s steps(5) -15s infinite alternate;
//         }
//         .rotate .angle:nth-child(5) .particle {
//           animation: particle-warm 7.5s linear -5s infinite alternate;
//         }
//         .rotate .angle:nth-child(5) .position {
//           animation: position 22s linear -8s infinite;
//         }

//         @keyframes lamp-swing {
//           5% { transform: rotate(-45deg); }
//           10% { transform: rotate(35deg); }
//           15% { transform: rotate(-35deg); }
//           25% { transform: rotate(15deg); }
//           40% { transform: rotate(-15deg); }
//           65% { transform: rotate(3deg); }
//           85% { transform: rotate(-1deg); }
//           100% { transform: rotate(0deg); }
//         }

//         .card-thumb-wrap {
//           aspect-ratio: 4/5;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           position: relative;
//           overflow: hidden;
//           padding: 20px;
//         }
//         .card-frame {
//           border: 8px solid #2D1A0F; /* antique dark wood */
//           outline: 1px solid var(--accent);
//           outline-offset: -3px;
//           box-shadow: 0 8px 24px rgba(0,0,0,0.6);
//           display: flex;
//           position: relative;
//         }
//         .card-frame-inner {
//           flex: 1;
//           background: #2D2822;
//           box-shadow: inset 0 0 12px rgba(0,0,0,0.8);
//           position: relative;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }

//         .product-info {
//           display: flex;
//           flex-direction: column;
//           gap: 10px;
//           flex: 1;
//         }
//         .product-header-row {
//           display: flex;
//           align-items: flex-start;
//           justify-content: space-between;
//           gap: 8px;
//         }
//         .product-name {
//           font-family: var(--font-display);
//           font-size: 21px;
//           color: var(--text);
//         }
//         .product-price {
//           font-family: var(--font-typewriter);
//           font-size: 16px;
//           font-weight: 700;
//           color: var(--accent);
//         }
//         .product-tag {
//           font-family: var(--font-typewriter);
//           font-size: 10px;
//           color: var(--text2);
//           align-self: flex-start;
//           border-bottom: 1.5px solid var(--accent);
//           padding-bottom: 2px;
//         }
//         .product-desc {
//           font-family: var(--font-serif);
//           font-size: 14px;
//           line-height: 1.6;
//           color: var(--text2);
//         }
//         .btn-card {
//           width: 100%;
//           text-align: center;
//           padding: 12px;
//           margin-top: auto;
//         }

//         /* FOOTER */
//         .footer {
//           background: #080605;
//           border-top: 2px solid #1C0F07;
//           padding: 80px 40px 40px;
//         }
//         .footer-grid {
//           max-width: 1300px;
//           margin: 0 auto;
//           display: grid;
//           grid-template-columns: 1.5fr 1fr 1fr 1fr;
//           gap: 60px;
//           padding-bottom: 60px;
//           border-bottom: 1px solid var(--border);
//         }
//         .footer-brand-col {
//           display: flex;
//           flex-direction: column;
//           gap: 20px;
//         }
//         .footer-brand {
//           display: flex;
//           align-items: center;
//           transition: transform 0.2s ease;
//         }
//         .footer-brand:hover {
//           transform: scale(1.03);
//         }
//         .footer-logo-img {
//           height: 38px;
//           width: auto;
//           display: block;
//         }
//         .footer-tagline {
//           font-family: var(--font-serif);
//           font-size: 15px;
//           line-height: 1.7;
//           color: var(--text2);
//           max-width: 320px;
//         }
//         .footer-title {
//           font-family: var(--font-display);
//           font-size: 13px;
//           font-weight: 700;
//           letter-spacing: 0.1em;
//           text-transform: uppercase;
//           color: var(--accent);
//           margin-bottom: 24px;
//         }
//         .footer-links {
//           display: flex;
//           flex-direction: column;
//           gap: 14px;
//         }
//         .footer-link {
//           color: var(--text2);
//           text-decoration: none;
//           font-size: 14px;
//           transition: color 0.15s ease;
//         }
//         .footer-link:hover {
//           color: var(--accent);
//         }
//         .footer-bottom {
//           max-width: 1300px;
//           margin: 40px auto 0;
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           font-family: var(--font-typewriter);
//           font-size: 12px;
//           color: var(--text2);
//           letter-spacing: 0.05em;
//         }
//         .footer-bottom span {
//           color: var(--accent);
//         }

//         /* CART DRAWER SLIDE-OVER */
//         .cart-drawer-overlay {
//           position: fixed;
//           inset: 0;
//           background: rgba(0,0,0,0.85);
//           backdrop-filter: blur(8px);
//           -webkit-backdrop-filter: blur(8px);
//           z-index: 2000;
//           opacity: 0;
//           pointer-events: none;
//           transition: opacity 0.3s ease;
//         }
//         .cart-drawer-overlay.open {
//           opacity: 1;
//           pointer-events: auto;
//         }
//         .cart-drawer {
//           position: fixed;
//           top: 0;
//           right: 0;
//           bottom: 0;
//           width: 400px;
//           max-width: 100vw;
//           background: linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%);
//           border-left: 3px solid #1C0F07;
//           outline: 1px solid var(--border);
//           outline-offset: -4px;
//           z-index: 2001;
//           transform: translateX(100%);
//           transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
//           display: flex;
//           flex-direction: column;
//           box-shadow: -10px 0 40px rgba(0,0,0,0.8);
//         }
//         .cart-drawer.open {
//           transform: translateX(0);
//         }
//         .cart-drawer-header {
//           padding: 24px;
//           border-bottom: 2px solid #1C0F07;
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//         }
//         .cart-drawer-header h3 {
//           font-family: var(--font-display);
//           font-size: 20px;
//           color: var(--accent);
//         }
//         .cart-close-btn {
//           background: none;
//           border: none;
//           color: var(--text2);
//           font-size: 28px;
//           cursor: pointer;
//           line-height: 1;
//           transition: color 0.15s ease;
//         }
//         .cart-close-btn:hover {
//           color: var(--accent);
//         }
//         .cart-drawer-body {
//           flex: 1;
//           overflow-y: auto;
//           padding: 24px;
//         }
//         .cart-empty {
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           justify-content: center;
//           height: 100%;
//           text-align: center;
//           gap: 16px;
//           color: var(--text2);
//         }
//         .cart-empty-icon {
//           width: 48px;
//           height: 48px;
//           color: var(--accent);
//         }

//         .cart-items-list {
//           display: flex;
//           flex-direction: column;
//           gap: 20px;
//         }
//         .cart-item {
//           display: flex;
//           gap: 16px;
//           background: var(--surface2);
//           border: 3px solid #1C0F07;
//           outline: 1px solid var(--border);
//           outline-offset: -3px;
//           border-radius: var(--radius);
//           padding: 12px;
//           position: relative;
//           box-shadow: 0 4px 10px rgba(0,0,0,0.4);
//         }
//         .cart-item-thumb {
//           width: 70px;
//           height: 70px;
//           border-radius: var(--radius);
//           overflow: hidden;
//           box-shadow: 0 4px 10px rgba(0,0,0,0.5);
//           display: flex;
//           position: relative;
//           padding: 6px;
//         }
//         .cart-item-thumb img {
//           width: 100%;
//           height: 100%;
//           object-fit: cover;
//           border-radius: var(--radius);
//         }
//         .cart-item-thumb-placeholder {
//           flex: 1;
//           background: #2D2822;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           color: rgba(201, 168, 76, 0.2);
//           font-size: 24px;
//         }

//         .cart-item-details {
//           flex: 1;
//           display: flex;
//           flex-direction: column;
//           gap: 4px;
//         }
//         .cart-item-name {
//           font-family: var(--font-display);
//           font-size: 15px;
//           color: var(--text);
//         }
//         .cart-item-meta {
//           font-family: var(--font-typewriter);
//           font-size: 10px;
//           color: var(--text2);
//           text-transform: uppercase;
//         }
//         .cart-item-price {
//           font-family: var(--font-typewriter);
//           font-size: 14px;
//           font-weight: 700;
//           color: var(--accent);
//         }
//         .cart-item-qty-row {
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           margin-top: 4px;
//         }
//         .qty-btn {
//           width: 24px;
//           height: 24px;
//           background: var(--surface3);
//           border: 1px solid var(--border2);
//           border-radius: var(--radius);
//           color: var(--text);
//           cursor: pointer;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 14px;
//           line-height: 1;
//           transition: all 0.15s ease;
//         }
//         .qty-btn:hover {
//           background: var(--accent);
//           color: #1A1100;
//           border-color: var(--accent);
//         }
//         .qty-val {
//           font-family: var(--font-typewriter);
//           font-size: 12px;
//           font-weight: 500;
//           color: var(--text);
//         }

//         .cart-item-remove {
//           position: absolute;
//           top: 8px;
//           right: 8px;
//           background: none;
//           border: none;
//           color: var(--text2);
//           font-size: 18px;
//           cursor: pointer;
//           line-height: 1;
//           transition: color 0.15s ease;
//         }
//         .cart-item-remove:hover {
//           color: #FF5A5A;
//         }

//         .cart-drawer-footer {
//           padding: 24px;
//           border-top: 2px solid #1C0F07;
//           background: var(--surface);
//           display: flex;
//           flex-direction: column;
//           gap: 16px;
//         }
//         .cart-summary-row {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           font-size: 14px;
//           color: var(--text2);
//         }
//         .cart-summary-total {
//           font-family: var(--font-typewriter);
//           font-size: 22px;
//           color: var(--accent);
//         }
//         .cart-footer-note {
//           font-family: var(--font-serif);
//           font-size: 11px;
//           color: var(--text2);
//           text-align: center;
//           font-style: italic;
//         }
//         .btn-checkout-primary {
//           display: block;
//           width: 100%;
//           text-align: center;
//           padding: 14px;
//         }

//         /* EXQUISITE SHOWCASE SECTION */
//         .exquisite-section {
//           padding: 100px 40px;
//           background: #090706;
//           border-top: 2px solid #1C0F07;
//           border-bottom: 2px solid #1C0F07;
//           position: relative;
//           overflow: hidden;
//         }

//         .exquisite-container {
//           max-width: 1200px;
//           margin: 0 auto;
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 60px;
//           position: relative;
//           z-index: 3;
//         }

//         .exquisite-content {
//           flex: 1.2;
//           display: flex;
//           flex-direction: column;
//           align-items: flex-start;
//           gap: 24px;
//           position: relative;
//           z-index: 10;
//         }

//         .exquisite-tagline {
//           font-family: var(--font-typewriter);
//           font-size: 12px;
//           color: var(--accent);
//           letter-spacing: 0.15em;
//           text-transform: uppercase;
//         }

//         .exquisite-title {
//           font-family: var(--font-display);
//           font-size: 48px;
//           font-weight: 800;
//           line-height: 1.15;
//           color: var(--text);
//           letter-spacing: -0.01em;
//         }

//         .exquisite-desc {
//           font-family: var(--font-serif);
//           font-size: 16px;
//           line-height: 1.7;
//           color: var(--text2);
//         }

//         .exquisite-features {
//           display: flex;
//           flex-direction: column;
//           gap: 20px;
//           margin: 10px 0;
//         }

//         .feature-item {
//           display: flex;
//           gap: 16px;
//           align-items: flex-start;
//         }

//         .feature-icon {
//           color: var(--accent);
//           font-size: 18px;
//           line-height: 1.2;
//         }

//         .feature-item h4 {
//           font-family: var(--font-display);
//           font-size: 15px;
//           font-weight: 700;
//           color: var(--text);
//           margin-bottom: 4px;
//         }

//         .feature-item p {
//           font-family: var(--font-serif);
//           font-size: 13px;
//           color: var(--text2);
//           line-height: 1.5;
//         }

//         .exquisite-btn {
//           margin: 0;
//         }

//         .exquisite-visual {
//           flex: 1;
//           display: flex;
//           justify-content: center;
//           position: relative;
//           z-index: 1;
//         }

//         .exquisite-frame-component {
//           position: relative;
//           padding-top: 160px;
//           width: 320px;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           transition: transform 0.4s ease;
//           flex-shrink: 0;
//         }

//         .exquisite-frame-component:hover {
//           transform: translateY(-4px) scale(1.01);
//         }

//         /* Ambient wall glow behind the lamp */
//         .exquisite-wall-glow {
//           position: absolute;
//           top: -40px;
//           left: 50%;
//           transform: translateX(-50%);
//           width: 500px;
//           height: 500px;
//           background: radial-gradient(circle, rgba(255, 238, 180, 0.22) 0%, rgba(255, 238, 180, 0.06) 50%, transparent 80%);
//           filter: blur(30px);
//           z-index: 1;
//           pointer-events: none;
//           opacity: 0;
//           transition: opacity 0.25s ease;
//         }
//         .exquisite-wall-glow.on {
//           opacity: 1;
//         }

//         /* Realistic Brass Picture Light Lamp */
//         .exquisite-lamp {
//           position: absolute;
//           top: 0px;
//           left: 50%;
//           transform: translateX(-50%);
//           z-index: 20;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           width: 240px;
//         }

//         .exquisite-glow-container {
//           top: 108px !important;
//         }

//         .exquisite-glow-container.on .glow {
//           opacity: 1;
//           animation: glow-warm 3s linear infinite alternate;
//         }

//         .exquisite-glow-container.on .particles {
//           opacity: 1;
//         }

//         .lamp-rod {
//           width: 4px;
//           height: 220px;
//           background: linear-gradient(to right, #403014, #9c7f47 50%, #2b1f0d);
//           box-shadow: 1px 0 3px rgba(0,0,0,0.4);
//           position: absolute;
//           bottom: 100%;
//           left: 50%;
//           transform: translateX(-50%);
//           z-index: 10;
//         }

//         .lamp-mount {
//           width: 32px;
//           height: 18px;
//           background: linear-gradient(135deg, #2b1f0d, #8f723b 40%, #dfc38a 60%, #5e461b);
//           border: 1px solid #1a1205;
//           box-shadow: 0 4px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.2);
//           border-radius: 2px;
//           position: relative;
//           z-index: 12;
//         }

//         .lamp-arm {
//           width: 6px;
//           height: 78px;
//           background: linear-gradient(to right, #403014, #9c7f47 50%, #2b1f0d);
//           box-shadow: 2px 0 5px rgba(0,0,0,0.4);
//           position: relative;
//         }

//         .lamp-arm::after {
//           content: '';
//           position: absolute;
//           bottom: 0;
//           left: -4px;
//           width: 14px;
//           height: 6px;
//           background: #5e461b;
//           border-radius: 2px;
//         }

//         .lamp-head {
//           width: 180px;
//           height: 24px;
//           background: linear-gradient(to bottom, 
//             #362710 0%, 
//             #8f723b 25%, 
//             #dfc38a 45%, 
//             #fae7b5 55%, 
//             #8f723b 75%, 
//             #362710 100%
//           );
//           border: 1px solid #1a1205;
//           border-radius: 12px;
//           box-shadow: 
//             0 8px 16px rgba(0,0,0,0.6),
//             inset 0 1px 2px rgba(255,255,255,0.3);
//           position: relative;
//         }

//         .lamp-head::before, .lamp-head::after {
//           content: '';
//           position: absolute;
//           top: -1px;
//           width: 8px;
//           height: 24px;
//           background: linear-gradient(to bottom, #1a1205, #5e461b, #1a1205);
//           border: 1px solid #1a1205;
//           border-radius: 50%;
//         }
//         .lamp-head::before { left: -4px; }
//         .lamp-head::after { right: -4px; }

//         /* The hidden light bulb source glow */
//         .lamp-bulb {
//           position: absolute;
//           bottom: 0px;
//           left: 15%;
//           right: 15%;
//           height: 4px;
//           background: transparent;
//           border-radius: 2px;
//           box-shadow: 0 0 12px 3px #fae7b5, 0 0 24px 8px #fae7b5;
//           opacity: 0;
//           transition: opacity 0.25s ease;
//           z-index: 5;
//         }
//         .lamp-bulb.on {
//           opacity: 1;
//         }

//         .lamp-light-beam {
//           position: absolute;
//           top: 116px;
//           left: 50%;
//           transform: translateX(-50%);
//           width: 600px;
//           height: 600px;
//           background: radial-gradient(ellipse at top, rgba(255, 238, 180, 0.42) 0%, rgba(255, 238, 180, 0.16) 30%, rgba(255, 238, 180, 0.04) 60%, transparent 80%);
//           filter: blur(35px);
//           pointer-events: none;
//           z-index: 15;
//           opacity: 0;
//           transition: opacity 0.25s ease-in-out;
//         }
//         .lamp-light-beam.on {
//           opacity: 1;
//         }

//         /* Pull chain switch removed */

//         .chain-handle::after {
//           content: '';
//           position: absolute;
//           bottom: -4px;
//           left: 1px;
//           width: 4px;
//           height: 4px;
//           background: #8f723b;
//           border-radius: 50%;
//         }

//         /* Wood Frame styling mimicking the customizer */
//         .exquisite-wood-frame {
//           position: relative;
//           z-index: 10;
//           width: 320px;
//           height: 420px;
//           flex-shrink: 0;
//           box-shadow: 0 25px 50px rgba(0,0,0,0.85);
//           overflow: hidden;
//           background: #000;
//         }

//         /* Glossy reflection on the top outer wood border when lamp is ON */
//         .exquisite-wood-frame::after {
//           content: '';
//           position: absolute;
//           top: 0; left: 0; right: 0;
//           height: 14px;
//           background: linear-gradient(to bottom, rgba(255, 240, 180, 0.55) 0%, rgba(255, 240, 180, 0.15) 60%, transparent 100%);
//           z-index: 15;
//           opacity: 0;
//           transition: opacity 0.25s ease;
//           pointer-events: none;
//         }
//         .exquisite-wood-frame.light-on::after {
//           opacity: 1;
//         }

//         .wood-frame-overlay {
//           position: absolute;
//           inset: 0;
//           width: 100%;
//           height: 100%;
//           object-fit: fill;
//           z-index: 12;
//           pointer-events: none;
//         }

//         .exquisite-inner-photo {
//           position: absolute;
//           top: 9%;
//           left: 9%;
//           bottom: 9%;
//           right: 9%;
//           background: #111;
//           overflow: hidden;
//           box-shadow: inset 0 0 12px rgba(0,0,0,0.9);
//           z-index: 10;
//         }

//         /* Highlight at the top of the photo print when lamp is ON */
//         .exquisite-inner-photo::after {
//           content: '';
//           position: absolute;
//           top: 0; left: 0; right: 0;
//           height: 45px;
//           background: linear-gradient(to bottom, rgba(255, 240, 180, 0.25) 0%, transparent 100%);
//           z-index: 12;
//           opacity: 0;
//           transition: opacity 0.25s ease;
//           pointer-events: none;
//         }
//         .exquisite-wood-frame.light-on .exquisite-inner-photo::after {
//           opacity: 1;
//         }

//         .exquisite-inner-photo img {
//           width: 100% !important;
//           height: 100% !important;
//           object-fit: cover !important;
//           display: block;
//           transition: filter 0.35s ease;
//         }

//         .exquisite-inner-photo img.light-active {
//           filter: none;
//         }

//         .exquisite-inner-photo img.light-inactive {
//           filter: none;
//         }

//         .glass-reflection {
//           position: absolute;
//           inset: 0;
//           background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%, rgba(255,255,255,0.01) 100%);
//           z-index: 11;
//           pointer-events: none;
//         }

//         /* MOBILE STYLES */
//         @media (max-width: 1024px) {
//           .catalog-grid { justify-content: center; }
//         }

//         @media (max-width: 768px) {
//           .navbar { padding: 0 20px; }
//           .nav-links, .nav-actions { display: none; }
//           .menu-btn { display: block; }
//           .catalog-section { padding: 60px 20px; }
//           .section-title { font-size: 32px; }
//           .catalog-grid { gap: 20px; }
//           .product-card { width: 100%; max-width: 320px; }
//           .arrival-card { width: 100%; max-width: 340px; }
//           .lamp-wrapper { display: none; }
//           .exquisite-section { padding: 60px 20px; }
//           .exquisite-container { flex-direction: column; gap: 40px; text-align: center; }
//           .exquisite-actions {
//             flex-direction: column;
//             gap: 12px;
//             width: 100%;
//             align-items: center;
//             margin-bottom: 20px;
//           }
//           .exquisite-actions .exquisite-btn,
//           .exquisite-actions .light-control-panel {
//             width: 100% !important;
//             max-width: 280px !important;
//             justify-content: center;
//           }
//           .exquisite-title { font-size: 32px; }
//           .feature-item { flex-direction: column; align-items: center; gap: 8px; }
//           .exquisite-frame-component { width: 300px; flex-shrink: 0; }
//           .exquisite-wood-frame { width: 300px; height: 394px; flex-shrink: 0; }
//           .footer { padding: 60px 20px 20px; }
//           .footer-grid { grid-template-columns: 1fr; gap: 40px; }
//           .footer-bottom { flex-direction: column; gap: 16px; text-align: center; }
//         }

//         /* LIGHT SWITCH TOGGLE STYLING */
//         .product-card {
//           display: flex;
//           flex-direction: column;
//           background: rgba(20, 17, 14, 0.6);
//           border: 1.5px solid rgba(212, 175, 55, 0.2);
//           border-radius: var(--radius);
//           padding: 24px;
//           transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
//           min-height: 520px;
//           justify-content: space-between;
//           position: relative;
//         }

//         .ribbon {
//           position: absolute;
//           top: 15px;
//           left: 15px;
//           background: radial-gradient(circle, var(--accent2) 0%, var(--accent) 100%);
//           border: 1px solid #7E631F;
//           color: #1A1100;
//           font-family: var(--font-typewriter);
//           font-size: 10px;
//           font-weight: 700;
//           letter-spacing: 0.1em;
//           text-transform: uppercase;
//           padding: 4px 10px;
//           box-shadow: 0 4px 8px rgba(0,0,0,0.4);
//           z-index: 10;
//         }

//         .exquisite-actions {
//           display: flex;
//           align-items: center;
//           gap: 16px;
//           margin-top: 12px;
//           z-index: 30;
//         }

//         .light-control-panel {
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           gap: 12px;
//           background: rgba(20, 17, 14, 0.6);
//           border: 1.5px solid rgba(212, 175, 55, 0.3);
//           padding: 0 24px !important;
//           border-radius: 9999px !important;
//           cursor: pointer;
//           transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
//           box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
//           outline: none;
//           height: 56px !important;
//           box-sizing: border-box;
//           user-select: none;
//         }
//         .light-control-panel:hover {
//           border-color: rgba(212, 175, 55, 0.6);
//           transform: translateY(-2px) scale(1.02);
//           box-shadow: 0 8px 24px rgba(212, 175, 55, 0.2);
//         }
//         .light-control-panel:active {
//           transform: translateY(0) scale(0.98);
//         }
//         .light-control-label {
//           font-family: var(--font-display) !important;
//           font-size: 13px !important;
//           font-weight: 700 !important;
//           letter-spacing: 0.1em;
//           text-transform: uppercase;
//           color: #dfc38a;
//           user-select: none;
//           text-align: center;
//           line-height: 1.2 !important;
//         }
//         .light-switch-btn {
//           width: 46px;
//           height: 24px;
//           background: #1a1205;
//           border: 1.5px solid #5e461b;
//           border-radius: 999px;
//           position: relative;
//           cursor: pointer;
//           padding: 0;
//           outline: none;
//           transition: all 0.3s ease;
//         }
//         .light-switch-btn.on {
//           background: #5e461b;
//           border-color: #dfc38a;
//           box-shadow: 0 0 8px rgba(212, 175, 55, 0.4);
//         }
//         .light-switch-knob {
//           width: 16px;
//           height: 16px;
//           background: linear-gradient(135deg, #8f723b, #dfc38a);
//           border: 1px solid #1a1205;
//           border-radius: 50%;
//           position: absolute;
//           top: 2.5px;
//           left: 3px;
//           transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
//         }
//         .light-switch-btn.on .light-switch-knob {
//           transform: translateX(20px);
//           background: linear-gradient(135deg, #dfc38a, #fae7b5);
//         }

//         /* ── GOOGLE REVIEWS SECTION ── */
//         .reviews-section {
//           padding: 100px 40px;
//           background: #090706;
//           border-top: 2px solid #1C0F07;
//           position: relative;
//           overflow: hidden;
//         }
//         .reviews-container {
//           max-width: 1200px;
//           margin: 0 auto;
//           position: relative;
//           z-index: 3;
//         }
//         .reviews-header {
//           text-align: center;
//           margin-bottom: 16px;
//         }
//         .reviews-tagline {
//           font-family: var(--font-typewriter);
//           font-size: 12px;
//           color: var(--accent);
//           letter-spacing: 0.15em;
//           text-transform: uppercase;
//           margin-bottom: 12px;
//         }
//         .reviews-title {
//           font-family: var(--font-display);
//           font-size: 48px;
//           font-weight: 800;
//           color: var(--text);
//           letter-spacing: -0.01em;
//           line-height: 1.2;
//         }
//         .reviews-subtitle {
//           font-family: var(--font-serif);
//           font-size: 15px;
//           color: var(--text2);
//           line-height: 1.6;
//           max-width: 540px;
//           margin: 14px auto 0;
//         }
//         .reviews-summary-bar {
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           gap: 20px;
//           margin: 32px auto 48px;
//           padding: 20px 32px;
//           background: rgba(20, 17, 14, 0.6);
//           border: 1.5px solid rgba(212, 175, 55, 0.2);
//           border-radius: var(--radius);
//           max-width: 520px;
//         }
//         .reviews-google-icon {
//           font-size: 32px;
//         }
//         .reviews-avg-score {
//           font-family: var(--font-display);
//           font-size: 42px;
//           font-weight: 700;
//           color: var(--accent);
//           line-height: 1;
//         }
//         .reviews-avg-detail {
//           display: flex;
//           flex-direction: column;
//           gap: 4px;
//         }
//         .reviews-stars {
//           font-size: 18px;
//           letter-spacing: 2px;
//           color: #FBBF24;
//         }
//         .reviews-count {
//           font-family: var(--font-typewriter);
//           font-size: 11px;
//           color: var(--text2);
//         }
//         /* REVIEWS CAROUSEL SYSTEM */
//         .reviews-carousel-wrapper {
//           position: relative;
//           width: 100%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }

//         .reviews-carousel-viewport {
//           overflow: hidden;
//           width: 100%;
//           max-width: 1200px;
//           margin: 0 40px;
//         }

//         .reviews-carousel-track {
//           display: flex;
//           transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
//           width: 200%; /* 2 slides */
//         }

//         .reviews-carousel-slide {
//           width: 50%;
//           display: grid;
//           grid-template-columns: repeat(3, 1fr);
//           gap: 24px;
//           flex-shrink: 0;
//           padding: 10px 0;
//         }

//         .reviews-carousel-indicators {
//           display: flex;
//           justify-content: center;
//           gap: 12px;
//           margin-top: 30px;
//         }

//         @media (max-width: 1024px) {
//           .reviews-carousel-viewport {
//             max-width: 100%;
//             margin: 0;
//           }
//           .reviews-carousel-slide {
//             grid-template-columns: 1fr;
//             gap: 20px;
//           }
//         }
//         .review-card {
//           background: linear-gradient(135deg, rgba(20, 17, 14, 0.8) 0%, rgba(16, 13, 11, 0.9) 100%);
//           border: 1.5px solid rgba(212, 175, 55, 0.12);
//           border-radius: var(--radius);
//           padding: 28px 24px;
//           display: flex;
//           flex-direction: column;
//           gap: 16px;
//           transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
//           position: relative;
//           overflow: hidden;
//         }
//         .review-card::before {
//           content: '';
//           position: absolute;
//           top: 0; left: 0; right: 0;
//           height: 2px;
//           background: linear-gradient(90deg, transparent, rgba(201, 168, 76, 0.3), transparent);
//         }
//         .review-card:hover {
//           border-color: rgba(212, 175, 55, 0.3);
//           transform: translateY(-4px);
//           box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
//         }
//         .review-card-header {
//           display: flex;
//           align-items: center;
//           gap: 12px;
//         }
//         .review-avatar {
//           width: 44px;
//           height: 44px;
//           border-radius: 50%;
//           background: linear-gradient(135deg, var(--accent), #8B6914);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-family: var(--font-display);
//           font-size: 16px;
//           font-weight: 700;
//           color: #0C0A08;
//           flex-shrink: 0;
//         }
//         .review-author-info {
//           display: flex;
//           flex-direction: column;
//           gap: 2px;
//         }
//         .review-author-name {
//           font-family: var(--font-display);
//           font-size: 14px;
//           font-weight: 700;
//           color: var(--text);
//         }
//         .review-author-meta {
//           font-family: var(--font-typewriter);
//           font-size: 10px;
//           color: var(--text2);
//           display: flex;
//           align-items: center;
//           gap: 6px;
//         }
//         .review-stars-row {
//           font-size: 14px;
//           letter-spacing: 2px;
//           color: #FBBF24;
//         }
//         .review-text {
//           font-family: var(--font-serif);
//           font-size: 14px;
//           line-height: 1.7;
//           color: var(--text2);
//           flex: 1;
//         }
//         .review-google-badge {
//           display: flex;
//           align-items: center;
//           gap: 6px;
//           font-family: var(--font-typewriter);
//           font-size: 10px;
//           color: var(--text2);
//           opacity: 0.6;
//         }
//         .reviews-cta {
//           text-align: center;
//           margin-top: 40px;
//         }
//         .btn-review-cta {
//           display: inline-flex;
//           align-items: center;
//           gap: 8px;
//           padding: 14px 28px;
//           background: rgba(20, 17, 14, 0.6);
//           border: 1.5px solid rgba(212, 175, 55, 0.25);
//           border-radius: 9999px;
//           color: var(--accent);
//           font-family: var(--font-display);
//           font-size: 12px;
//           font-weight: 700;
//           letter-spacing: 0.06em;
//           text-transform: uppercase;
//           text-decoration: none;
//           transition: all 0.3s ease;
//         }
//         .btn-review-cta:hover {
//           background: rgba(201, 168, 76, 0.08);
//           border-color: var(--accent);
//           transform: translateY(-2px);
//           box-shadow: 0 8px 20px rgba(201, 168, 76, 0.15);
//         }

//         /* ── SOCIAL FEED SECTION ── */
//         .social-feed-section {
//           padding: 100px 40px;
//           background: var(--bg);
//           border-top: 2px solid #1C0F07;
//           position: relative;
//           overflow: hidden;
//         }
//         .social-feed-container {
//           max-width: 1200px;
//           margin: 0 auto;
//           position: relative;
//           z-index: 3;
//         }
//         .social-feed-header {
//           text-align: center;
//           margin-bottom: 48px;
//         }
//         .social-feed-tagline {
//           font-family: var(--font-typewriter);
//           font-size: 12px;
//           color: var(--accent);
//           letter-spacing: 0.15em;
//           text-transform: uppercase;
//           margin-bottom: 12px;
//         }
//         .social-feed-title {
//           font-family: var(--font-display);
//           font-size: 42px;
//           font-weight: 800;
//           color: var(--text);
//           letter-spacing: -0.01em;
//           line-height: 1.2;
//         }
//         .social-feed-subtitle {
//           font-family: var(--font-serif);
//           font-size: 15px;
//           color: var(--text2);
//           line-height: 1.6;
//           max-width: 500px;
//           margin: 14px auto 0;
//         }
//         /* SOCIAL FEED CAROUSEL SYSTEM */
//         .social-carousel-wrapper {
//           position: relative;
//           width: 100%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }

//         .social-carousel-viewport {
//           overflow: hidden;
//           width: 100%;
//           max-width: 1200px;
//           margin: 0 40px;
//         }

//         .social-carousel-track {
//           display: flex;
//           transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
//           width: 200%; /* 2 slides */
//         }

//         .social-carousel-slide {
//           width: 50%;
//           display: grid;
//           grid-template-columns: repeat(3, 1fr);
//           gap: 24px;
//           flex-shrink: 0;
//           padding: 10px 0;
//         }

//         .social-carousel-indicators {
//           display: flex;
//           justify-content: center;
//           gap: 12px;
//           margin-top: 30px;
//         }

//         @media (max-width: 1024px) {
//           .social-carousel-viewport {
//             max-width: 100%;
//             margin: 0;
//           }
//           .social-carousel-slide {
//             grid-template-columns: 1fr;
//             gap: 20px;
//           }
//         }
//         .social-post-card {
//           background: rgba(20, 17, 14, 0.6);
//           border: 1.5px solid rgba(212, 175, 55, 0.1);
//           border-radius: var(--radius);
//           overflow: hidden;
//           transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
//           cursor: pointer;
//         }
//         .social-post-card:hover {
//           border-color: rgba(212, 175, 55, 0.3);
//           transform: translateY(-6px);
//           box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
//         }
//         .social-post-image {
//           width: 100%;
//           aspect-ratio: 1;
//           background: #1A1714;
//           position: relative;
//           overflow: hidden;
//         }
//         .social-post-image img {
//           width: 100%;
//           height: 100%;
//           object-fit: cover;
//           transition: transform 0.5s ease;
//         }
//         .social-post-card:hover .social-post-image img {
//           transform: scale(1.08);
//         }
//         .social-post-overlay {
//           position: absolute;
//           inset: 0;
//           background: linear-gradient(transparent 50%, rgba(0,0,0,0.7) 100%);
//           display: flex;
//           align-items: flex-end;
//           padding: 14px;
//           opacity: 0;
//           transition: opacity 0.3s ease;
//         }
//         .social-post-card:hover .social-post-overlay {
//           opacity: 1;
//         }
//         .social-post-stats {
//           display: flex;
//           gap: 14px;
//           font-size: 12px;
//           color: #fff;
//           font-family: var(--font-typewriter);
//         }
//         .social-post-body {
//           padding: 16px;
//           display: flex;
//           flex-direction: column;
//           gap: 10px;
//         }
//         .social-post-author {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//         }
//         .social-post-author-avatar {
//           width: 28px;
//           height: 28px;
//           border-radius: 50%;
//           background: linear-gradient(135deg, #E1306C, #F77737, #FCAF45);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 11px;
//           font-weight: 700;
//           color: #fff;
//           flex-shrink: 0;
//         }
//         .social-post-author-name {
//           font-family: var(--font-display);
//           font-size: 12px;
//           font-weight: 700;
//           color: var(--text);
//         }
//         .social-post-platform {
//           font-family: var(--font-typewriter);
//           font-size: 9px;
//           color: var(--text2);
//           text-transform: uppercase;
//           letter-spacing: 0.06em;
//         }
//         .social-post-caption {
//           font-family: var(--font-serif);
//           font-size: 12px;
//           line-height: 1.6;
//           color: var(--text2);
//           display: -webkit-box;
//           -webkit-line-clamp: 3;
//           -webkit-box-orient: vertical;
//           overflow: hidden;
//         }
//         .social-post-date {
//           font-family: var(--font-typewriter);
//           font-size: 10px;
//           color: rgba(168, 160, 140, 0.5);
//         }
//         .social-feed-footer {
//           text-align: center;
//           margin-top: 48px;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           gap: 16px;
//         }
//         .social-handle {
//           font-family: var(--font-typewriter);
//           font-size: 14px;
//           color: var(--accent);
//           letter-spacing: 0.02em;
//         }
//         .social-links {
//           display: flex;
//           gap: 14px;
//         }
//         .social-link-btn {
//           display: inline-flex;
//           align-items: center;
//           gap: 8px;
//           padding: 12px 22px;
//           background: rgba(20, 17, 14, 0.6);
//           border: 1.5px solid rgba(212, 175, 55, 0.2);
//           border-radius: 9999px;
//           color: var(--text);
//           font-family: var(--font-display);
//           font-size: 11px;
//           font-weight: 700;
//           letter-spacing: 0.05em;
//           text-transform: uppercase;
//           text-decoration: none;
//           transition: all 0.3s ease;
//         }
//         .social-link-btn:hover {
//           border-color: var(--accent);
//           background: rgba(201, 168, 76, 0.06);
//           transform: translateY(-2px);
//           box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
//         }

//         .exquisite-actions .exquisite-btn,
// .exquisite-actions .light-control-panel {
//   display: inline-flex;
//   align-items: center;
//   justify-content: center;
//   text-align: center;
//   width: 250px !important;              /* Set equal fixed width for both buttons */
//   height: 56px !important;              /* Same height for both */
//   padding: 0 24px !important;           /* vertical centering comes from flex, not padding */
//   box-sizing: border-box;
//   font: inherit;             /* buttons don't inherit font by default */
//   line-height: 1.2 !important;
// }

//         @media (max-width: 768px) {
//           .reviews-section { padding: 60px 20px; }
//           .reviews-title { font-size: 32px; }
//           .reviews-grid { grid-template-columns: 1fr; gap: 16px; }
//           .reviews-carousel-slide { grid-template-columns: 1fr; gap: 16px; }
//           .reviews-summary-bar { flex-direction: column; gap: 12px; padding: 16px; }
//           .reviews-avg-score { font-size: 36px; }
//           .social-feed-section { padding: 60px 20px; }
//           .social-feed-title { font-size: 28px; }
//           .social-feed-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
//           .social-carousel-slide { grid-template-columns: 1fr; gap: 12px; }
//           .social-links { flex-direction: column; }
//         }
//       ` }} />

//       {/* NAVBAR */}
//       <Navbar
//         onCartOpen={() => setCartOpen(true)}
//         onSearchChange={setSearchQuery}
//         initialSearchValue={searchQuery}
//       />

//       {/* FULLSCREEN VIDEO HERO BANNER */}
//       <section className="hero-fullscreen-frame">
//         <video
//           src="/videos/yaadein.mp4"
//           autoPlay
//           loop
//           muted
//           playsInline
//           className="hero-video-bg"
//         />
//         <div className="hero-video-overlay" />

//         <div className="hero-fullscreen-content">

//           <h1 className="hero-fullscreen-title">
//             Turn Your Moments Into <br />
//             <span>Museum Art</span>
//           </h1>
//           <p className="hero-fullscreen-desc">
//             Experience bespoke picture framing handcrafted for your specific style. Customize details in real-time, and let our master artisans deliver it ready to hang.
//           </p>
//         </div>
//       </section>

//       {/* CURATED PRODUCTS CATALOG */}
//       <section className={`catalog-section ${catalogEntered ? "animate-lamps" : ""}`} id="catalog">
//         {/* Dynamic liquid backdrop elements */}
//         <div className="catalog-glass-bg">
//           <div className="liquid-blob-1" />
//           <div className="liquid-blob-2" />
//           <div id="catalog-glow" className="catalog-glow" />
//         </div>

//         {/* Frosted Glass overlay sheet */}
//         <div className="catalog-glass-pane" />

//         {/* Hanging Lamp Left */}
//         <div className="lamp-wrapper left">
//           <img src="/images/lamp.png" alt="Hanging Lamp" className="lamp-img" />
//           <div className="lamp-glow-container">
//             <div className="glow"></div>
//             <div className="particles">
//               <div className="rotate">
//                 <div className="angle">
//                   <div className="size">
//                     <div className="position">
//                       <div className="pulse">
//                         <div className="particle"></div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="angle">
//                   <div className="size">
//                     <div className="position">
//                       <div className="pulse">
//                         <div className="particle"></div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="angle">
//                   <div className="size">
//                     <div className="position">
//                       <div className="pulse">
//                         <div className="particle"></div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Hanging Lamp Right */}
//         <div className="lamp-wrapper right">
//           <img src="/images/lamp.png" alt="Hanging Lamp" className="lamp-img" />
//           <div className="lamp-glow-container">
//             <div className="glow"></div>
//             <div className="particles">
//               <div className="rotate">
//                 <div className="angle">
//                   <div className="size">
//                     <div className="position">
//                       <div className="pulse">
//                         <div className="particle"></div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="angle">
//                   <div className="size">
//                     <div className="position">
//                       <div className="pulse">
//                         <div className="particle"></div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="angle">
//                   <div className="size">
//                     <div className="position">
//                       <div className="pulse">
//                         <div className="particle"></div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="catalog-container">
//           <div className="section-header">

//             <h2 className="section-title">Featured Products</h2>
//             <p className="section-desc">
//               Choose from our bespoke frame profiles. Select a style to launch it instantly in our interactive studio builder.
//             </p>
//           </div>

//           {products.length === 0 ? (
//             <div style={{ textAlign: "center", color: "var(--text2)", padding: "40px 0", fontFamily: "var(--font-typewriter)" }}>
//               Loading catalog from database...
//             </div>
//           ) : searchQuery.trim() !== "" ? (
//             <div className="catalog-grid">
//               {products.filter(p =>
//                 p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                 p.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                 (p.tag && p.tag.toLowerCase().includes(searchQuery.toLowerCase()))
//               ).map((p) => renderProductCard(p))}
//             </div>
//           ) : (
//             <>
//               <div className="carousel-wrapper">
//                 <button
//                   className="carousel-arrow prev"
//                   onClick={() => setCurrentSlide((prev) => (prev - 1 + 3) % 3)}
//                   aria-label="Previous Slide"
//                 >
//                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <polyline points="15 18 9 12 15 6"></polyline>
//                   </svg>
//                 </button>

//                 <div className="carousel-viewport">
//                   <div className="carousel-track" style={{ transform: `translateX(-${currentSlide * 33.333}%)` }}>
//                     <div className="carousel-slide">
//                       {portraitProducts.map((p) => renderProductCard(p))}
//                     </div>
//                     <div className="carousel-slide">
//                       {landscapeProducts.map((p) => renderProductCard(p))}
//                     </div>
//                     <div className="carousel-slide">
//                       {boardGames.map((p) => renderProductCard(p))}
//                     </div>
//                   </div>
//                 </div>

//                 <button
//                   className="carousel-arrow next"
//                   onClick={() => setCurrentSlide((prev) => (prev + 1) % 3)}
//                   aria-label="Next Slide"
//                 >
//                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <polyline points="9 18 15 12 9 6"></polyline>
//                   </svg>
//                 </button>
//               </div>

//               <div className="carousel-indicators">
//                 {[0, 1, 2].map((idx) => (
//                   <button
//                     key={idx}
//                     className={`carousel-dot ${currentSlide === idx ? 'active' : ''}`}
//                     onClick={() => setCurrentSlide(idx)}
//                     aria-label={`Go to slide ${idx + 1}`}
//                   />
//                 ))}
//               </div>
//             </>
//           )}
//         </div>
//       </section>

//       {/* EXQUISITE SHOWCASE SECTION */}
//       <section className="exquisite-section" id="showcase">
//         {/* Dynamic liquid backdrop elements */}
//         <div className="catalog-glass-bg">
//           <div className="liquid-blob-1" />
//           <div className="liquid-blob-2" />
//           <div className="catalog-glow" />
//         </div>

//         {/* Frosted Glass overlay sheet */}
//         <div className="catalog-glass-pane" />

//         <div className="exquisite-container">
//           {/* Left Column: Content */}
//           <div className="exquisite-content">
//             <h2 className="exquisite-title">Where Memories Meet Nature's Light</h2>
//             <p className="exquisite-desc">
//               Every photograph is a story of shadows and highlights. Our bespoke frames are built to interact harmoniously with the ambient atmosphere. Watch as natural daylight from a nearby window shifts across the real-wood textures and museum matting, breathing organic life into your timeless moments.
//             </p>
//             <div className="exquisite-actions">
//               <a href="/catalog" className="btn-premium exquisite-btn ">
//                 Browse <br /> Catalouge
//               </a>

//               {/* Toggle switch button styled identical to Browse Catalog */}
//               <button
//                 className="light-control-panel"
//                 onClick={() => setLightOn(!lightOn)}
//                 aria-label="Toggle Light Switch"
//               >
//                 <span className="light-control-label">Light <br /> Switch</span>
//                 <div className={`light-switch-btn ${lightOn ? 'on' : ''}`}>
//                   <span className="light-switch-knob" />
//                 </div>
//               </button>
//             </div>
//           </div>

//           {/* Right Column: Visual */}
//           <div className="exquisite-visual">
//             <div className="exquisite-frame-component">
//               {/* Ambient wall glow behind the lamp */}
//               <div className={`exquisite-wall-glow ${lightOn ? 'on' : ''}`} />

//               {/* Picture light lamp */}
//               <div className="exquisite-lamp">
//                 <div className="lamp-rod" />
//                 <div className="lamp-mount" />
//                 <div className="lamp-arm" />
//                 <div className="lamp-head">
//                   <div className={`lamp-bulb ${lightOn ? 'on' : ''}`} />
//                 </div>

//                 {/* Light beam */}
//                 <div className={`lamp-light-beam ${lightOn ? 'on' : ''}`} />

//                 {/* Copied glow & particle effect */}
//                 <div className={`lamp-glow-container exquisite-glow-container ${lightOn ? 'on' : ''}`}>
//                   <div className="glow"></div>
//                   <div className="particles">
//                     <div className="rotate">
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className={`lamp-glow-container exquisite-glow-container ${lightOn ? 'on' : ''}`}>
//                   <div className="glow"></div>
//                   <div className="particles">
//                     <div className="rotate">
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className={`lamp-glow-container exquisite-glow-container ${lightOn ? 'on' : ''}`}>
//                   <div className="glow"></div>
//                   <div className="particles">
//                     <div className="rotate">
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className={`lamp-glow-container exquisite-glow-container ${lightOn ? 'on' : ''}`}>
//                   <div className="glow"></div>
//                   <div className="particles">
//                     <div className="rotate">
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className={`lamp-glow-container exquisite-glow-container ${lightOn ? 'on' : ''}`}>
//                   <div className="glow"></div>
//                   <div className="particles">
//                     <div className="rotate">
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className={`lamp-glow-container exquisite-glow-container ${lightOn ? 'on' : ''}`}>
//                   <div className="glow"></div>
//                   <div className="particles">
//                     <div className="rotate">
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="angle">
//                         <div className="size">
//                           <div className="position">
//                             <div className="pulse">
//                               <div className="particle"></div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* The frame wrapper */}
//               <div className={`exquisite-wood-frame ${lightOn ? 'light-on' : ''}`}>
//                 {/* Wood Frame Texture Image */}
//                 <img
//                   src="/frames/portrait/frame-01-correct-size.webp"
//                   alt="Antique Gold Frame"
//                   className="wood-frame-overlay"
//                 />

//                 {/* Inner photo area filling the frame space */}
//                 <div className="exquisite-inner-photo">
//                   <img
//                     src="/images/dummyImg.jpg"
//                     alt="Exhibited B&W Artwork"
//                     className={lightOn ? 'light-active' : 'light-inactive'}
//                   />
//                   <div className="glass-reflection" />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ── GOOGLE REVIEWS SECTION ── */}
//       <section className="reviews-section" id="reviews">
//         {/* Dynamic liquid backdrop elements */}
//         <div className="catalog-glass-bg">
//           <div className="liquid-blob-1" />
//           <div className="liquid-blob-2" />
//           <div className="catalog-glow" />
//         </div>

//         {/* Frosted Glass overlay sheet */}
//         <div className="catalog-glass-pane" />

//         <div className="reviews-container">
//           <div className="reviews-header">

//             <h2 className="reviews-title">What Our Clients Say</h2>
//             <p className="reviews-subtitle">
//               Real reviews from our verified customers on Google. Every frame tells a story — here's what they have to say.
//             </p>
//           </div>

//           <div className="reviews-summary-bar">
//             <span className="reviews-google-icon">🇬</span>
//             <span className="reviews-avg-score">4.9</span>
//             <div className="reviews-avg-detail">
//               <span className="reviews-stars">★★★★★</span>
//               <span className="reviews-count">Based on 127 Google Reviews</span>
//             </div>
//           </div>

//           <div className="reviews-carousel-wrapper">
//             <button
//               className="carousel-arrow prev"
//               onClick={() => setCurrentReviewSlide((prev) => (prev - 1 + 2) % 2)}
//               aria-label="Previous Reviews"
//             >
//               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <polyline points="15 18 9 12 15 6"></polyline>
//               </svg>
//             </button>

//             <div className="reviews-carousel-viewport">
//               <div className="reviews-carousel-track" style={{ transform: `translateX(-${currentReviewSlide * 50}%)` }}>
//                 {/* Slide 1 */}
//                 <div className="reviews-carousel-slide">
//                   <div className="review-card">
//                     <div className="review-card-header">
//                       <div className="review-avatar">AK</div>
//                       <div className="review-author-info">
//                         <span className="review-author-name">Ayesha Khan</span>
//                         <span className="review-author-meta">📍 Lahore • 2 weeks ago</span>
//                       </div>
//                     </div>
//                     <div className="review-stars-row">★★★★★</div>
//                     <p className="review-text">
//                       Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. The craftsmanship is absolutely stunning!
//                     </p>
//                     <div className="review-google-badge">🇬 Posted on Google</div>
//                   </div>

//                   <div className="review-card">
//                     <div className="review-card-header">
//                       <div className="review-avatar">HA</div>
//                       <div className="review-author-info">
//                         <span className="review-author-name">Hassan Ali</span>
//                         <span className="review-author-meta">📍 Islamabad • 1 month ago</span>
//                       </div>
//                     </div>
//                     <div className="review-stars-row">★★★★★</div>
//                     <p className="review-text">
//                       Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. The attention to detail in every frame is remarkable. Highly recommend Yaadein!
//                     </p>
//                     <div className="review-google-badge">🇬 Posted on Google</div>
//                   </div>

//                   <div className="review-card">
//                     <div className="review-card-header">
//                       <div className="review-avatar">SM</div>
//                       <div className="review-author-info">
//                         <span className="review-author-name">Sara Malik</span>
//                         <span className="review-author-meta">📍 Karachi • 3 weeks ago</span>
//                       </div>
//                     </div>
//                     <div className="review-stars-row">★★★★★</div>
//                     <p className="review-text">
//                       Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
//                     </p>
//                     <div className="review-google-badge">🇬 Posted on Google</div>
//                   </div>
//                 </div>

//                 {/* Slide 2 */}
//                 <div className="reviews-carousel-slide">
//                   <div className="review-card">
//                     <div className="review-card-header">
//                       <div className="review-avatar">OA</div>
//                       <div className="review-author-info">
//                         <span className="review-author-name">Omar Ahmed</span>
//                         <span className="review-author-meta">📍 Rawalpindi • 5 days ago</span>
//                       </div>
//                     </div>
//                     <div className="review-stars-row">★★★★☆</div>
//                     <p className="review-text">
//                       Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. Beautifully crafted frames, fast delivery too!
//                     </p>
//                     <div className="review-google-badge">🇬 Posted on Google</div>
//                   </div>

//                   <div className="review-card">
//                     <div className="review-card-header">
//                       <div className="review-avatar">FZ</div>
//                       <div className="review-author-info">
//                         <span className="review-author-name">Fatima Zahra</span>
//                         <span className="review-author-meta">📍 Faisalabad • 2 months ago</span>
//                       </div>
//                     </div>
//                     <div className="review-stars-row">★★★★★</div>
//                     <p className="review-text">
//                       Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit. The oak frame for my nikkah photo is absolutely divine.
//                     </p>
//                     <div className="review-google-badge">🇬 Posted on Google</div>
//                   </div>

//                   <div className="review-card">
//                     <div className="review-card-header">
//                       <div className="review-avatar">BI</div>
//                       <div className="review-author-info">
//                         <span className="review-author-name">Bilal Iqbal</span>
//                         <span className="review-author-meta">📍 Multan • 1 week ago</span>
//                       </div>
//                     </div>
//                     <div className="review-stars-row">★★★★★</div>
//                     <p className="review-text">
//                       Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse. Premium quality frames that turned my living room into a gallery.
//                     </p>
//                     <div className="review-google-badge">🇬 Posted on Google</div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <button
//               className="carousel-arrow next"
//               onClick={() => setCurrentReviewSlide((prev) => (prev + 1) % 2)}
//               aria-label="Next Reviews"
//             >
//               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <polyline points="9 18 15 12 9 6"></polyline>
//               </svg>
//             </button>
//           </div>

//           <div className="reviews-carousel-indicators">
//             {[0, 1].map((idx) => (
//               <button
//                 key={idx}
//                 className={`carousel-dot ${currentReviewSlide === idx ? 'active' : ''}`}
//                 onClick={() => setCurrentReviewSlide(idx)}
//                 aria-label={`Go to slide ${idx + 1}`}
//               />
//             ))}
//           </div>

//           <div className="reviews-cta">
//             <a
//               href="https://g.page/r/yaadein-art-studio/review"
//               target="_blank"
//               rel="noopener noreferrer"
//               className="btn-review-cta"
//             >
//               ⭐ Leave Us a Review on Google
//             </a>
//           </div>
//         </div>
//       </section>

//       {/* ── SOCIAL MEDIA FEED SECTION ── */}
//       <section className="social-feed-section" id="social">
//         {/* Dynamic liquid backdrop elements */}
//         <div className="catalog-glass-bg">
//           <div className="liquid-blob-1" />
//           <div className="liquid-blob-2" />
//           <div className="catalog-glow" />
//         </div>

//         {/* Frosted Glass overlay sheet */}
//         <div className="catalog-glass-pane" />

//         <div className="social-feed-container">
//           <div className="social-feed-header">
//             <p className="social-feed-tagline">Follow Our Journey</p>
//             <h2 className="social-feed-title">#YaadeinFrames</h2>
//             <p className="social-feed-subtitle">
//               See how our customers style their spaces. Tag us to get featured in our gallery.
//             </p>
//           </div>

//           <div className="social-carousel-wrapper">
//             <button
//               className="carousel-arrow prev"
//               onClick={() => setCurrentSocialSlide((prev) => (prev - 1 + 2) % 2)}
//               aria-label="Previous Posts"
//             >
//               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <polyline points="15 18 9 12 15 6"></polyline>
//               </svg>
//             </button>

//             <div className="social-carousel-viewport">
//               <div className="social-carousel-track" style={{ transform: `translateX(-${currentSocialSlide * 50}%)` }}>
//                 {/* Slide 1 */}
//                 <div className="social-carousel-slide">
//                   <div className="social-post-card">
//                     <div className="social-post-image">
//                       <img src="/images/dummyImg.jpg" alt="Customer frame setup" />
//                       <div className="social-post-overlay">
//                         <div className="social-post-stats">
//                           <span>❤️ 234</span>
//                           <span>💬 18</span>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="social-post-body">
//                       <div className="social-post-author">
//                         <div className="social-post-author-avatar">Y</div>
//                         <div>
//                           <div className="social-post-author-name">yaadein.pk</div>
//                           <div className="social-post-platform">Instagram</div>
//                         </div>
//                       </div>
//                       <p className="social-post-caption">
//                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed dignissim lacinia nunc. 🖼️✨ #YaadeinFrames #HomeDecor
//                       </p>
//                       <span className="social-post-date">2 days ago</span>
//                     </div>
//                   </div>

//                   <div className="social-post-card">
//                     <div className="social-post-image">
//                       <img src="/images/dummyImg.jpg" alt="Frame collection" style={{ objectPosition: "center 30%" }} />
//                       <div className="social-post-overlay">
//                         <div className="social-post-stats">
//                           <span>❤️ 189</span>
//                           <span>💬 12</span>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="social-post-body">
//                       <div className="social-post-author">
//                         <div className="social-post-author-avatar">A</div>
//                         <div>
//                           <div className="social-post-author-name">ayesha.interiors</div>
//                           <div className="social-post-platform">Instagram</div>
//                         </div>
//                       </div>
//                       <p className="social-post-caption">
//                         Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi. My living room transformation! 🏡 #InteriorDesign
//                       </p>
//                       <span className="social-post-date">5 days ago</span>
//                     </div>
//                   </div>

//                   <div className="social-post-card">
//                     <div className="social-post-image">
//                       <img src="/images/dummyImg.jpg" alt="Custom frame order" style={{ objectPosition: "center 70%" }} />
//                       <div className="social-post-overlay">
//                         <div className="social-post-stats">
//                           <span>❤️ 312</span>
//                           <span>💬 27</span>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="social-post-body">
//                       <div className="social-post-author">
//                         <div className="social-post-author-avatar">Y</div>
//                         <div>
//                           <div className="social-post-author-name">yaadein.pk</div>
//                           <div className="social-post-platform">Instagram</div>
//                         </div>
//                       </div>
//                       <p className="social-post-caption">
//                         Duis aute irure dolor in reprehenderit in voluptate velit esse cillum. New collection drop! 🎨 #ArtFraming #BespokeFrames
//                       </p>
//                       <span className="social-post-date">1 week ago</span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Slide 2 */}
//                 <div className="social-carousel-slide">
//                   <div className="social-post-card">
//                     <div className="social-post-image">
//                       <img src="/images/dummyImg.jpg" alt="Gallery wall" style={{ objectPosition: "20% center" }} />
//                       <div className="social-post-overlay">
//                         <div className="social-post-stats">
//                           <span>❤️ 156</span>
//                           <span>💬 9</span>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="social-post-body">
//                       <div className="social-post-author">
//                         <div className="social-post-author-avatar">H</div>
//                         <div>
//                           <div className="social-post-author-name">hassan.captures</div>
//                           <div className="social-post-platform">Instagram</div>
//                         </div>
//                       </div>
//                       <p className="social-post-caption">
//                         Excepteur sint occaecat cupidatat non proident, sunt in culpa. Gallery wall completed! 📸 #WallArt #Photography
//                       </p>
//                       <span className="social-post-date">2 weeks ago</span>
//                     </div>
//                   </div>

//                   <div className="social-post-card">
//                     <div className="social-post-image">
//                       <img src="/images/dummyImg.jpg" alt="Oak frames bedroom decor" style={{ objectPosition: "center center" }} />
//                       <div className="social-post-overlay">
//                         <div className="social-post-stats">
//                           <span>❤️ 245</span>
//                           <span>💬 19</span>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="social-post-body">
//                       <div className="social-post-author">
//                         <div className="social-post-author-avatar">Z</div>
//                         <div>
//                           <div className="social-post-author-name">zainab.frames</div>
//                           <div className="social-post-platform">Instagram</div>
//                         </div>
//                       </div>
//                       <p className="social-post-caption">
//                         Absolutely in love with the classic oak frame! It matches my bedroom aesthetic perfectly. 🌿✨ #AestheticHome #Decor
//                       </p>
//                       <span className="social-post-date">3 weeks ago</span>
//                     </div>
//                   </div>

//                   <div className="social-post-card">
//                     <div className="social-post-image">
//                       <img src="/images/dummyImg.jpg" alt="Art studio gallery" style={{ objectPosition: "center 40%" }} />
//                       <div className="social-post-overlay">
//                         <div className="social-post-stats">
//                           <span>❤️ 198</span>
//                           <span>💬 14</span>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="social-post-body">
//                       <div className="social-post-author">
//                         <div className="social-post-author-avatar">M</div>
//                         <div>
//                           <div className="social-post-author-name">maryam.spaces</div>
//                           <div className="social-post-platform">Instagram</div>
//                         </div>
//                       </div>
//                       <p className="social-post-caption">
//                         The gold frame detailing is even more beautiful in person. Handcrafted perfection! 💛 #ArtStudio #LuxuryHome
//                       </p>
//                       <span className="social-post-date">1 month ago</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <button
//               className="carousel-arrow next"
//               onClick={() => setCurrentSocialSlide((prev) => (prev + 1) % 2)}
//               aria-label="Next Posts"
//             >
//               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <polyline points="9 18 15 12 9 6"></polyline>
//               </svg>
//             </button>
//           </div>

//           <div className="social-carousel-indicators">
//             {[0, 1].map((idx) => (
//               <button
//                 key={idx}
//                 className={`carousel-dot ${currentSocialSlide === idx ? 'active' : ''}`}
//                 onClick={() => setCurrentSocialSlide(idx)}
//                 aria-label={`Go to slide ${idx + 1}`}
//               />
//             ))}
//           </div>

//           <div className="social-feed-footer">
//             <span className="social-handle">@yaadein.pk</span>
//             <div className="social-links">
//               <a href="https://instagram.com/yaadein.pk" target="_blank" rel="noopener noreferrer" className="social-link-btn">
//                 📸 Follow on Instagram
//               </a>
//               <a href="https://facebook.com/yaadein.pk" target="_blank" rel="noopener noreferrer" className="social-link-btn">
//                 👤 Follow on Facebook
//               </a>
//               <a href="https://tiktok.com/@yaadein.pk" target="_blank" rel="noopener noreferrer" className="social-link-btn">
//                 🎵 Follow on TikTok
//               </a>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* FOOTER */}
//       <Footer />

//       {/* CART DRAWER SLIDE-OVER */}
//       <div className={`cart-drawer-overlay ${cartOpen ? "open" : ""}`} onClick={() => setCartOpen(false)} />
//       <div className={`cart-drawer ${cartOpen ? "open" : ""}`}>
//         <div className="cart-drawer-header">
//           <h3>Shopping Cart</h3>
//           <button className="cart-close-btn" onClick={() => setCartOpen(false)}>×</button>
//         </div>
//         <div className="cart-drawer-body">
//           {cartItems.length === 0 ? (
//             <div className="cart-empty">
//               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="cart-empty-icon">
//                 <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a.75.75 0 1 0 0-1.5.75 0 0 0 0 1.5Zm6 0a.75.75 0 1 0 0-1.5.75 0 0 0 0 1.5Z" clipRule="evenodd" />
//               </svg>
//               <p>Your shopping cart is empty.</p>
//               <button className="btn-nav-primary" style={{ marginTop: "16px" }} onClick={() => setCartOpen(false)}>
//                 Explore Collections
//               </button>
//             </div>
//           ) : (
//             <div className="cart-items-list">
//               {cartItems.map((item, idx) => (
//                 <div key={idx} className="cart-item">
//                   <div className="cart-item-thumb" style={{ background: item.frameColor }}>
//                     {item.image ? (
//                       <img src={item.image} alt={item.frameName} />
//                     ) : (
//                       <div className="cart-item-thumb-placeholder">Y</div>
//                     )}
//                   </div>
//                   <div className="cart-item-details">
//                     <div className="cart-item-name">{item.frameName}</div>
//                     <div className="cart-item-meta">
//                       {item.rotation !== 0 ? `Rotated ${item.rotation}°` : "Portrait"}
//                     </div>
//                     <div className="cart-item-price">{item.price}</div>
//                     <div className="cart-item-qty-row">
//                       <button className="qty-btn" onClick={() => updateQuantity(idx, -1)}>–</button>
//                       <span className="qty-val">{item.quantity}</span>
//                       <button className="qty-btn" onClick={() => updateQuantity(idx, 1)}>+</button>
//                     </div>
//                   </div>
//                   <button className="cart-item-remove" onClick={() => removeCartItem(idx)} title="Remove Item">
//                     ×
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//         {cartItems.length > 0 && (
//           <div className="cart-drawer-footer">
//             <div className="cart-summary-row">
//               <span>Subtotal</span>
//               <span className="cart-summary-total">Rs. {getCartSubtotal().toLocaleString()}</span>
//             </div>
//             <p className="cart-footer-note">Shipping and taxes calculated at checkout.</p>
//             <a href="/checkout" className="btn-checkout-primary">
//               Proceed to Checkout
//             </a>
//           </div>
//         )}
//       </div>

//       {/* NEWSLETTER PROMO POPUP */}
//       {showPromo && (
//         <div className={`promo-overlay ${showPromo ? "open" : ""}`}>
//           <style dangerouslySetInnerHTML={{
//             __html: `
//             .promo-overlay {
//               position: fixed;
//               inset: 0;
//               background: rgba(0, 0, 0, 0.85);
//               backdrop-filter: blur(8px);
//               -webkit-backdrop-filter: blur(8px);
//               display: flex;
//               align-items: center;
//               justify-content: center;
//               z-index: 9999;
//               opacity: 0;
//               pointer-events: none;
//               transition: opacity 0.4s ease;
//             }
//             .promo-overlay.open {
//               opacity: 1;
//               pointer-events: auto;
//             }
//             .promo-modal {
//               position: relative;
//               background: linear-gradient(135deg, var(--surface) 0%, #100D0B 100%);
//               border: 6px solid #1C0F07;
//               outline: 1.5px solid var(--accent);
//               outline-offset: -5px;
//               padding: 48px 36px;
//               max-width: 500px;
//               width: 90%;
//               box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
//               transform: scale(0.9);
//               transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
//               text-align: center;
//             }
//             .promo-overlay.open .promo-modal {
//               transform: scale(1);
//             }
//             .promo-close {
//               position: absolute;
//               top: 12px;
//               right: 16px;
//               background: none;
//               border: none;
//               color: var(--text2);
//               font-size: 28px;
//               cursor: pointer;
//               line-height: 1;
//               transition: color 0.15s ease;
//             }
//             .promo-close:hover {
//               color: var(--accent);
//             }
//             .promo-icon {
//               font-size: 42px;
//               color: var(--accent);
//               margin-bottom: 12px;
//             }
//             .promo-content h3 {
//               font-family: var(--font-display);
//               font-size: 26px;
//               color: var(--accent);
//               margin-bottom: 12px;
//               letter-spacing: 0.05em;
//             }
//             .promo-content p {
//               font-family: var(--font-serif);
//               font-size: 14px;
//               color: var(--text2);
//               line-height: 1.6;
//               margin-bottom: 24px;
//             }
//             .promo-form {
//               display: flex;
//               flex-direction: column;
//               gap: 12px;
//             }
//             .promo-input {
//               background: var(--surface2);
//               border: 1px solid var(--border2);
//               color: var(--text);
//               padding: 14px;
//               font-family: var(--font-typewriter);
//               font-size: 14px;
//               outline: none;
//               border-radius: var(--radius);
//               text-align: center;
//             }
//             .promo-input:focus {
//               border-color: var(--accent);
//             }
//             .btn-promo-submit {
//               background: var(--accent) !important;
//               color: #0C0A08 !important;
//               border: none !important;
//               outline: none !important;
//               border-radius: 9999px !important;
//               padding: 14px;
//               font-family: var(--font-display);
//               font-weight: 700;
//               font-size: 13px;
//               letter-spacing: 0.05em;
//               text-transform: uppercase;
//               cursor: pointer;
//               box-shadow: 0 4px 15px rgba(181, 139, 92, 0.25);
//               transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
//             }
//             .btn-promo-submit:hover {
//               background: var(--accent2) !important;
//               transform: translateY(-2px) scale(1.02);
//               box-shadow: 0 8px 24px rgba(181, 139, 92, 0.4);
//             }
//             .promo-code-container {
//               display: flex;
//               align-items: center;
//               justify-content: center;
//               background: var(--surface2);
//               border: 1.5px dashed var(--accent);
//               padding: 12px 24px;
//               margin: 16px 0;
//               gap: 16px;
//             }
//             .promo-code {
//               font-family: var(--font-typewriter);
//               font-weight: 700;
//               font-size: 20px;
//               color: var(--accent);
//               letter-spacing: 0.05em;
//             }
//             .btn-copy-code {
//               background: var(--surface3);
//               border: 1px solid var(--border2);
//               color: var(--text);
//               padding: 6px 16px;
//               font-size: 12px;
//               font-family: var(--font-display);
//               cursor: pointer;
//               transition: all 0.2s ease;
//               border-radius: 9999px !important;
//             }
//             .btn-copy-code:hover {
//               background: rgba(181, 139, 92, 0.1) !important;
//               color: var(--accent2) !important;
//               border-color: var(--accent2) !important;
//             }
//             .btn-promo-success-close {
//               background: none;
//               border: 1px solid var(--border2);
//               color: var(--text2);
//               padding: 10px 20px;
//               font-family: var(--font-display);
//               font-size: 12px;
//               letter-spacing: 0.05em;
//               text-transform: uppercase;
//               cursor: pointer;
//               transition: all 0.2s ease;
//               margin-top: 12px;
//               border-radius: 9999px !important;
//             }
//             .btn-promo-success-close:hover {
//               color: var(--text);
//               border-color: var(--text);
//             }
//           ` }} />
//           <div className="promo-modal">
//             <button className="promo-close" onClick={handleClosePromo}>&times;</button>
//             <div className="promo-content">
//               <img src="/images/logo-white.png" alt="Yaadein Logo" className="newsletter-logo-img" style={{ height: "42px", width: "auto", margin: "0 auto 20px", display: "block" }} />
//               {!promoSubmitted ? (
//                 <>
//                   <h3>Join the Yaadein Circle</h3>
//                   <p>Subscribe to our newsletter for exclusive collections, art framing inspiration.</p>
//                   <form onSubmit={handlePromoSubmit} className="promo-form">
//                     <input
//                       type="email"
//                       placeholder="Enter your email address"
//                       value={promoEmail}
//                       onChange={(e) => setPromoEmail(e.target.value)}
//                       className="promo-input"
//                       required
//                     />
//                     <button type="submit" className="btn-promo-submit" disabled={isSubmittingPromo}>
//                       {isSubmittingPromo ? "Subscribing..." : "Subscribe"}
//                     </button>
//                   </form>
//                 </>
//               ) : (
//                 <div className="promo-success">
//                   <h3>You're Subscribed!</h3>
//                   <p>Use code below at checkout to enjoy 10% off your first frame:</p>
//                   <div className="promo-code-container">
//                     <span className="promo-code">MEMORIES10</span>
//                     <button className="btn-copy-code" onClick={handleCopyPromoCode}>
//                       {copiedCode ? "Copied!" : "Copy"}
//                     </button>
//                   </div>
//                   <p className="promo-success-note">We've saved your discount. Use it whenever you are ready.</p>
//                   <button className="btn-promo-success-close" onClick={handleClosePromo}>
//                     Explore Galleries
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "../lib/firebase";
import { ref, onValue, push, set } from "firebase/database";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CardDescription from "./components/CardDescription";

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

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [filter, setFilter] = useState("portrait");
  const [products, setProducts] = useState([]);
  const [catalogEntered, setCatalogEntered] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPromo, setShowPromo] = useState(false);
  const [promoEmail, setPromoEmail] = useState("");
  const [promoSubmitted, setPromoSubmitted] = useState(false);
  const [isSubmittingPromo, setIsSubmittingPromo] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [lightOn, setLightOn] = useState(true);
  const [servicesLightOn, setServicesLightOn] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentReviewSlide, setCurrentReviewSlide] = useState(0);
  const [currentSocialSlide, setCurrentSocialSlide] = useState(0);
  const [mobileCuratedIndex, setMobileCuratedIndex] = useState(0);
  const [mobileReviewIndex, setMobileReviewIndex] = useState(0);
  const [mobileSocialIndex, setMobileSocialIndex] = useState(0);

  // Auto-play: reviews carousel now moves left -> right (decrementing index
  // instead of incrementing) so new cards slide in from the left.
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReviewSlide((prev) => (prev - 1 + 2) % 2);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Auto-play: mobile reviews carousel (moves forward 0 -> 5)
  useEffect(() => {
    const timer = setInterval(() => {
      setMobileReviewIndex((prev) => (prev + 1) % 6);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Auto-play: social feed carousel, same left -> right direction.
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSocialSlide((prev) => (prev - 1 + 2) % 2);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const query = params.get("search");
      if (query) {
        setSearchQuery(query);
        setTimeout(() => {
          const cat = document.getElementById("catalog");
          if (cat) cat.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("yaadein_seen_promo");
      if (!seen) {
        const timer = setTimeout(() => {
          setShowPromo(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handlePromoSubmit = async (e) => {
    e.preventDefault();
    if (!promoEmail.trim()) return;
    setIsSubmittingPromo(true);
    try {
      const newsletterRef = ref(db, "newsletter");
      const newSubscriberRef = push(newsletterRef);
      await set(newSubscriberRef, {
        email: promoEmail.trim(),
        subscribedAt: Date.now()
      });
      setPromoSubmitted(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("yaadein_seen_promo", "true");
      }
    } catch (err) {
      console.error("Error saving newsletter subscription:", err);
    } finally {
      setIsSubmittingPromo(false);
    }
  };

  const handleClosePromo = () => {
    setShowPromo(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("yaadein_seen_promo", "true");
    }
  };

  const handleCopyPromoCode = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText("MEMORIES10");
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

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

  useEffect(() => {
    const catalogSec = document.getElementById("catalog");
    if (!catalogSec) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => {
            setCatalogEntered(true);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(catalogSec);
    return () => {
      observer.disconnect();
    };
  }, []);



  const loadCart = useCallback(() => {
    const rawCart = getCart();
    // Normalize any old cart items that still have $ from previous session
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
    return () => {
      window.removeEventListener("fs-cart-updated", loadCart);
    };
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

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const isBoardGame = (p) => {
    const cat = p?.category || "";
    return cat.toLowerCase().includes("board game");
  };

  const portraitProducts = products.filter(p => !isBoardGame(p) && p.orientation === 'portrait').slice(0, 3);
  const landscapeProducts = products.filter(p => !isBoardGame(p) && p.orientation === 'landscape').slice(0, 3);
  const boardGames = products.filter(p => isBoardGame(p)).slice(0, 3);

  const isNewArrival = (p) => {
    if (!p) return false;
    const createdAt = typeof p === "object" ? p.createdAt : null;
    if (createdAt) {
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      return (Date.now() - createdAt) < sevenDaysInMs;
    }
    const id = typeof p === "string" ? p : p.id;
    return id === "antique-gold" || id === "gallery-landscape" || id === "landscape-oak";
  };

  const isFeatured = (id) => {
    return id === "modern-black" || id === "classic-walnut" || id === "royal-gilt" || id === "colonial-pine";
  };

  const renderProductCard = (p) => {
    const isLandscape = p.orientation === "landscape";
    const isGame = isBoardGame(p);

    const getProductPreviewImage = (prod) => {
      const name = (prod.name || "").toLowerCase();
      if (name.includes("ludo")) return "/images/ludo.png";
      if (name.includes("chess")) return "/images/Chess.jpeg";
      if (name.includes("monopoly")) return "/images/monopoly.png";
      return prod.orientation === "landscape" ? "/images/nature.jpg" : "/images/dummyImg.jpg";
    };

    return (
      <div key={p.id} className={`arrival-card ${isLandscape ? "landscape-card" : isGame ? "square-card" : ""}`}>
        {isNewArrival(p) ? (
          <div className="ribbon">New Arrival</div>
        ) : isFeatured(p.id) ? (
          <div className="ribbon">Featured</div>
        ) : null}

        <div
          className="card-thumb-wrap"
          style={{
            aspectRatio: isLandscape ? "3 / 2" : isGame ? "1 / 1" : "4 / 5",
            padding: isLandscape ? "8px" : isGame ? "20px" : "20px"
          }}
        >
          <div
            className="card-frame"
            style={isLandscape ? {
              /* Portrait frame image rotated -90deg to display as landscape.
                 The pre-rotation height (= visual width after rotation) is
                 derived from the wrap width; the frame's own width follows
                 the image's natural aspect ratio, so no stretching. */
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(-90deg)",
              transformOrigin: "center center",
              height: "calc(100% * 1.5 - 16px)",
              width: "auto",
              boxShadow: "0 10px 24px rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            } : {
              position: "relative",
              aspectRatio: isGame ? "1 / 1" : (p.aspectRatio || "2 / 3"),
              width: "auto",
              height: "100%",
              maxWidth: "100%",
              boxShadow: "0 10px 24px rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              margin: "0 auto"
            }}
          >
            {p.imageUrl && (
              <img
                src={p.imageUrl}
                alt={p.name}
                style={isLandscape ? {
                  /* Natural ratio: height is pinned to the (rotated) frame box,
                     width follows the image's real proportions. */
                  width: "auto",
                  height: "100%",
                  display: "block",
                  position: "relative",
                  zIndex: p.imageUrl.endsWith('.png') ? 2 : 4,
                  pointerEvents: "none"
                } : {
                  width: "100%",
                  height: "100%",
                  objectFit: "fill",
                  position: "absolute",
                  inset: 0,
                  zIndex: p.imageUrl.endsWith('.png') ? 2 : 4,
                  pointerEvents: "none"
                }}
              />
            )}
            <div
              className="card-frame-inner"
              style={{
                position: "absolute",
                top: `${p.paddingTop || 0}%`,
                left: `${p.paddingLeft || 0}%`,
                bottom: `${p.paddingBottom || 0}%`,
                right: `${p.paddingRight || 0}%`,
                zIndex: p.imageUrl && p.imageUrl.endsWith('.png') ? 4 : 2,
                background: "#2D2822",
                boxShadow: "inset 0 0 10px rgba(0,0,0,0.8)",
                overflow: "hidden"
              }}
            >
              <img
                src={getProductPreviewImage(p)}
                alt="Frame Art Preview"
                style={{
                  width: isLandscape ? "152%" : "100%",
                  height: isLandscape ? "152%" : "100%",
                  objectFit: isGame ? "fill" : "cover",
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  /* Counter-rotate the photo so it reads upright inside the rotated frame */
                  transform: isLandscape ? "translate(-50%, -50%) rotate(90deg)" : "translate(-50%, -50%)",
                  objectPosition: "center center"
                }}
              />
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
    <div className="home-root">
      <style dangerouslySetInnerHTML={{
        __html: `
        .home-root {
          position: relative;
          font-family: var(--font-serif);
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          overflow-x: hidden;
          scroll-behavior: smooth;
        }

        /* NAVBAR */
        .navbar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 80px;
          background: linear-gradient(to bottom, rgba(12, 10, 8, 0.8) 0%, rgba(12, 10, 8, 0) 100%);
          border-bottom: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          z-index: 1000;
          box-shadow: none;
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
        
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .btn-nav-cart {
          background: none;
          border: none;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          transition: transform 0.2s ease;
          font-size: 20px;
          color: var(--text);
        }
        .btn-nav-cart:hover {
          transform: scale(1.1);
          color: var(--accent);
        }
        .cart-badge {
          position: absolute;
          top: -2px;
          right: -4px;
          background: radial-gradient(circle, var(--accent2) 0%, var(--accent) 100%);
          border: 1px solid #7E631F;
          color: #1A1100;
          font-family: var(--font-typewriter);
          font-size: 10px;
          font-weight: 700;
          min-width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        }

        .btn-nav-primary {
          padding: 8px 18px !important;
        }

        .menu-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text);
          font-size: 24px;
          cursor: pointer;
        }

        /* CATALOG SECTION */
        .catalog-section {
          background: #080605;
          padding: 100px 40px;
          position: relative;
          overflow: hidden;
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

        .catalog-container {
          max-width: 1300px;
          margin: 0 auto;
          position: relative;
          z-index: 3;
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
            transform: translate(0%, -10%) scale(1);
          }
          25% {
            transform: translate(20%, 5%) scale(1.1);
          }
          50% {
            transform: translate(10%, 25%) scale(0.95);
          }
          75% {
            transform: translate(-5%, 10%) scale(1.05);
          }
          100% {
            transform: translate(0%, -10%) scale(1);
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
        .section-header {
          text-align: center;
          margin-bottom: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .section-title {
          font-family: var(--font-display);
          font-size: 42px;
          color: var(--accent);
          letter-spacing: 0.05em;
        }
        .section-desc {
          font-family: var(--font-serif);
          font-size: 16px;
          color: var(--text2);
          max-width: 600px;
          line-height: 1.7;
        }
        
        /* FILTERS */
        .catalog-filters {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 40px;
        }
        .filter-btn {
          background: var(--surface2);
          border: 1px solid var(--border2);
          color: var(--text2);
          padding: 10px 24px;
          border-radius: var(--radius);
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .filter-btn:hover {
          color: var(--accent);
          border-color: var(--accent);
        }
        .filter-btn.active {
          background: var(--accent);
          color: #1A1100;
          border-color: var(--accent);
          box-shadow: inset 0 0 4px rgba(0,0,0,0.5);
        }

        /* CAROUSEL SYSTEM */
        .carousel-wrapper {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .carousel-viewport {
          overflow: hidden;
          width: 100%;
          max-width: 1220px;
          margin: 0 40px;
        }

        .carousel-track {
          display: flex;
          transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
          width: 300%;
        }

        .carousel-slide {
          width: 33.333%;
          display: flex;
          justify-content: center;
          align-items: stretch;
          gap: 30px;
          flex-shrink: 0;
          padding: 12px 0;
        }

        /* CATALOG-STYLE ARRIVAL CARD (copied from catalog page) */
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

        .carousel-slide .arrival-card {
          width: calc((100% - 60px) / 3);
          max-width: 360px;
        }

        .carousel-slide .arrival-card.landscape-card {
          max-width: 390px;
        }

        .carousel-arrow {
          background: rgba(20, 17, 14, 0.8);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 50%;
          width: 44px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 10;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        }

        .carousel-arrow:hover {
          background: var(--accent);
          color: #000;
          border-color: var(--accent);
          transform: scale(1.1);
        }

        .carousel-indicators {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 30px;
        }

        .carousel-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }

        .carousel-dot:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        .carousel-dot.active {
          background: var(--accent);
          transform: scale(1.2);
          box-shadow: 0 0 8px var(--accent);
        }

        @media (max-width: 1100px) {
          .carousel-viewport {
            max-width: 960px;
          }
        }

        @media (max-width: 1024px) {
          .carousel-viewport {
            max-width: 100%;
            margin: 0;
          }
          .carousel-slide {
            flex-direction: column;
            align-items: center;
            gap: 24px;
          }
          .carousel-slide .arrival-card {
            width: 100%;
            max-width: 340px;
          }
          .carousel-arrow {
            display: none;
          }
        }

        /* GRID */
        .catalog-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 30px;
        }

        /* PRODUCT CARD - MINI WOODEN FRAME */
        .product-card {
          width: 290px;
          background: linear-gradient(135deg, var(--surface2) 0%, #15110D 100%);
          border: 6px solid #1C0F07; /* dark wood border */
          outline: 1px solid var(--accent);
          outline-offset: -5px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(0,0,0,0.6);
        }
        .product-card:hover {
          transform: translateY(-8px);
          border-color: #2D1A0F;
          box-shadow: 0 15px 35px rgba(0,0,0,0.8), 0 0 10px rgba(212,175,55,0.25);
        }
        .product-card.landscape-card {
          width: 350px;
        }

        /* HANGING LAMPS */
        .lamp-wrapper {
          position: absolute;
          top: -10px;
          width: 240px;
          height: 380px;
          z-index: 5;
          transform-origin: top center;
          transform: rotate(45deg);
          pointer-events: none;
        }
        .lamp-wrapper::after {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 120px;
          background: #141414;
          box-shadow: 1px 0 2px rgba(0,0,0,0.6);
          z-index: 4;
        }
        .catalog-section.animate-lamps .lamp-wrapper {
          animation: lamp-swing 3s forwards;
        }
        .lamp-wrapper.left {
          left: -40px;
        }
        .lamp-wrapper.right {
          right: -40px;
        }

        .lamp-img {
          width: 240px;
          height: 240px;
          display: block;
          object-fit: contain;
          margin-top: 110px;
        }



        /* LAMP GLOW & PARTICLE SYSTEM */
        .lamp-glow-container {
          position: absolute;
          top: 320px; /* center of bulb (shifted down 120px) */
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          pointer-events: none;
        }

        .glow {
          display: none;
        }
        .catalog-section.animate-lamps .glow {
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
        .catalog-section.animate-lamps .particles {
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
          width: 100%;
          height: 100%;
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

        @keyframes lamp-swing {
          5% { transform: rotate(-45deg); }
          10% { transform: rotate(35deg); }
          15% { transform: rotate(-35deg); }
          25% { transform: rotate(15deg); }
          40% { transform: rotate(-15deg); }
          65% { transform: rotate(3deg); }
          85% { transform: rotate(-1deg); }
          100% { transform: rotate(0deg); }
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
          border: 8px solid #2D1A0F; /* antique dark wood */
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
          display: flex;
          align-items: center;
          justify-content: center;
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
          font-size: 10px;
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

        /* FOOTER */
        .footer {
          background: #080605;
          border-top: 2px solid #1C0F07;
          padding: 80px 40px 40px;
        }
        .footer-grid {
          max-width: 1300px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 60px;
          padding-bottom: 60px;
          border-bottom: 1px solid var(--border);
        }
        .footer-brand-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .footer-brand {
          display: flex;
          align-items: center;
          transition: transform 0.2s ease;
        }
        .footer-brand:hover {
          transform: scale(1.03);
        }
        .footer-logo-img {
          height: 38px;
          width: auto;
          display: block;
        }
        .footer-tagline {
          font-family: var(--font-serif);
          font-size: 15px;
          line-height: 1.7;
          color: var(--text2);
          max-width: 320px;
        }
        .footer-title {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 24px;
        }
        .footer-links {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .footer-link {
          color: var(--text2);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.15s ease;
        }
        .footer-link:hover {
          color: var(--accent);
        }
        .footer-bottom {
          max-width: 1300px;
          margin: 40px auto 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-typewriter);
          font-size: 12px;
          color: var(--text2);
          letter-spacing: 0.05em;
        }
        .footer-bottom span {
          color: var(--accent);
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
        .cart-footer-note {
          font-family: var(--font-serif);
          font-size: 11px;
          color: var(--text2);
          text-align: center;
          font-style: italic;
        }
        .btn-checkout-primary {
          display: block;
          width: 100%;
          text-align: center;
          padding: 14px;
        }

        /* EXQUISITE SHOWCASE SECTION */
        .exquisite-section {
          padding: 100px 40px;
          background: #090706;
          border-top: 2px solid #1C0F07;
          border-bottom: 2px solid #1C0F07;
          position: relative;
          overflow: hidden;
        }

        .exquisite-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 60px;
          position: relative;
          z-index: 3;
        }

        .exquisite-content {
          flex: 1.2;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 24px;
          position: relative;
          z-index: 10;
        }

        .exquisite-tagline {
          font-family: var(--font-typewriter);
          font-size: 12px;
          color: var(--accent);
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .exquisite-title {
          font-family: var(--font-display);
          font-size: 48px;
          font-weight: 800;
          line-height: 1.15;
          color: var(--text);
          letter-spacing: -0.01em;
        }

        .exquisite-desc {
          font-family: var(--font-serif);
          font-size: 16px;
          line-height: 1.7;
          color: var(--text2);
        }

        .exquisite-features {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin: 10px 0;
        }

        .feature-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .feature-icon {
          color: var(--accent);
          font-size: 18px;
          line-height: 1.2;
        }

        .feature-item h4 {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 4px;
        }

        .feature-item p {
          font-family: var(--font-serif);
          font-size: 13px;
          color: var(--text2);
          line-height: 1.5;
        }

        .exquisite-btn {
          margin: 0;
        }

        /* Services bullet list */
        .services-bullet-list {
          list-style: none;
          padding: 0;
          margin: 10px 0;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .services-bullet-list li {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-left: 20px;
          position: relative;
        }

        .services-bullet-list li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 6px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 6px rgba(181, 139, 92, 0.4);
        }

        .services-bullet-list li strong {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
        }

        .services-bullet-list li span {
          font-family: var(--font-serif);
          font-size: 13px;
          color: var(--text2);
          line-height: 1.5;
        }

        .exquisite-visual {
          flex: 1;
          display: flex;
          justify-content: center;
          position: relative;
          z-index: 1;
        }

        .exquisite-frame-component {
          position: relative;
          padding-top: 160px;
          width: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: transform 0.4s ease;
          flex-shrink: 0;
        }

        .exquisite-frame-component:hover {
          transform: translateY(-4px) scale(1.01);
        }

        /* Ambient wall glow behind the lamp */
        .exquisite-wall-glow {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(255, 238, 180, 0.22) 0%, rgba(255, 238, 180, 0.06) 50%, transparent 80%);
          filter: blur(30px);
          z-index: 1;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .exquisite-wall-glow.on {
          opacity: 1;
        }

        /* Realistic Brass Picture Light Lamp */
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

        .exquisite-glow-container {
          top: 108px !important;
        }
        
        .exquisite-glow-container.on .glow {
          opacity: 1;
          animation: glow-warm 3s linear infinite alternate;
        }

        .exquisite-glow-container.on .particles {
          opacity: 1;
        }

        .lamp-rod {
          width: 4px;
          height: 220px;
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

        /* The hidden light bulb source glow */
        .lamp-bulb {
          position: absolute;
          bottom: 0px;
          left: 15%;
          right: 15%;
          height: 4px;
          background: transparent;
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
          width: 600px;
          height: 600px;
          background: radial-gradient(ellipse at top, rgba(255, 238, 180, 0.42) 0%, rgba(255, 238, 180, 0.16) 30%, rgba(255, 238, 180, 0.04) 60%, transparent 80%);
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

        /* Wood Frame styling mimicking the customizer */
        .exquisite-wood-frame {
          position: relative;
          z-index: 10;
          width: 320px;
          height: 512px;
          flex-shrink: 0;
          box-shadow: 0 25px 50px rgba(0,0,0,0.85);
          overflow: hidden;
          background: #000;
        }

        /* Glossy reflection on the top outer wood border when lamp is ON */
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
          top: 9%;
          left: 9%;
          bottom: 9%;
          right: 9%;
          background: #111;
          overflow: hidden;
          box-shadow: inset 0 0 12px rgba(0,0,0,0.9);
          z-index: 10;
        }

        /* Highlight at the top of the photo print when lamp is ON */
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
          width: 97% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block;
          transition: filter 0.35s ease;
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

        /* ── SERVICES SECTION (mirrored exquisite layout) ── */
        .services-section {
          background: var(--bg);
        }

        /* Visual sits first in the DOM, so it renders on the LEFT. */
        .services-section .exquisite-visual {
          justify-content: center;
        }
        .services-section .exquisite-content {
          align-items: flex-start;
          text-align: left;
        }

        /* ── VINTAGE WRITTEN HERITAGE SECTION ── */
        .vintage-written-section {
          position: relative;
          background: url('/images/wrinkled_paper_bg.png') center center repeat;
          background-size: cover;
          padding: 80px 40px;
          border-top: 2px solid #1c1510;
          border-bottom: 2px solid #1c1510;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .vintage-written-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(12, 10, 8, 0.45); /* Subtle dark overlay for text readability */
          z-index: 1;
        }

        /* Deep vignette shadow to frame the wrinkled paper look */
        .vintage-written-section::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, transparent 40%, rgba(12, 10, 8, 0.85) 100%);
          pointer-events: none;
          z-index: 2;
        }

        .vintage-written-container {
          max-width: 1200px;
          width: 100%;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 60px;
          align-items: center;
          position: relative;
          z-index: 3;
        }

        .vintage-written-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
          color: #e5d5c5;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
          text-align: left;
        }

        .vintage-written-tagline {
          font-family: var(--font-typewriter);
          font-size: 12px;
          color: var(--accent);
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .vintage-heading-wrapper {
          position: relative;
          display: inline-block;
        }

        .vintage-written-title {
          font-family: 'Shelly', cursive, serif;
          font-size: 64px;
          line-height: 1.2;
          color: var(--accent);
          margin: 0;
        }

        .vintage-written-desc {
          font-family: 'EB Garamond', serif;
          font-size: 19px;
          line-height: 1.8;
          color: #dfd0c0;
          max-width: 650px;
        }

        .vintage-written-signature {
          margin-top: 10px;
        }

        .signature-text {
          font-family: 'Shelly', cursive, serif;
          font-size: 32px;
          color: #b58b5c;
        }

        .vintage-written-visual {
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        .vintage-new-pen-image {
          width: 100%;
          max-width: 420px;
          height: auto;
          filter: drop-shadow(5px 15px 20px rgba(0, 0, 0, 0.65));
          transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .vintage-new-pen-image:hover {
          transform: scale(1.03) translateY(-5px) rotate(1deg);
        }

        /* ── DESKTOP & MOBILE CAROUSEL VISIBILITY ── */
        .mobile-only-carousel {
          display: none !important;
        }

        /* MOBILE STYLES */
        @media (max-width: 1024px) {
          .catalog-grid { justify-content: center; }
          .desktop-only-carousel {
            display: none !important;
          }
          .mobile-only-carousel {
            display: block !important;
          }
          .catalog-mobile-carousel {
            display: flex !important;
          }

          /* Mobile Catalog Carousel */
          .catalog-mobile-carousel {
            flex-direction: column;
            align-items: center;
            width: 100%;
          }
          .carousel-viewport-mobile {
            overflow: hidden;
            width: 100%;
            max-width: 380px;
            margin: 0 auto;
            padding: 10px 0;
          }
          .carousel-track-mobile {
            display: flex;
            transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
            width: 900%; /* 9 products */
          }
          .carousel-slide-mobile {
            width: 11.111%; /* 1/9 of track */
            display: flex;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
            padding: 0 10px;
          }
          .carousel-slide-mobile .arrival-card {
            width: 100% !important;
            max-width: 340px !important;
            margin: 0 auto;
          }
          .mobile-carousel-controls {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            margin-top: 24px;
            z-index: 10;
          }
          .carousel-arrow-mobile {
            background: rgba(20, 17, 14, 0.8);
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 50%;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--accent);
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 24px;
            line-height: 1;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          }
          .carousel-arrow-mobile:hover, .carousel-arrow-mobile:active {
            background: var(--accent);
            color: #000;
            border-color: var(--accent);
          }
          .carousel-indicators-mobile {
            display: flex;
            gap: 8px;
            align-items: center;
          }
          .carousel-dot-mobile {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            padding: 0;
          }
          .carousel-dot-mobile.active {
            background: var(--accent);
            transform: scale(1.2);
            box-shadow: 0 0 6px var(--accent);
          }

          /* Mobile Reviews Carousel */
          .reviews-carousel-viewport.mobile-only-carousel {
            display: block !important;
            overflow: hidden;
            width: 100%;
          }
          .reviews-carousel-track-mobile {
            display: flex;
            transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
            width: 600%; /* 6 reviews */
          }
          .review-slide-mobile-wrapper {
            width: 16.666%; /* 1/6 of track */
            display: flex;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
            padding: 0 16px;
            box-sizing: border-box;
          }
          .review-slide-mobile-wrapper .review-card {
            width: 100%;
            max-width: 360px;
            margin: 0 auto;
          }

          /* Mobile Social Carousel */
          .social-mobile-carousel {
            display: block !important;
            overflow: hidden;
            width: 100%;
          }
          .social-carousel-track-mobile {
            display: flex;
            transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
            width: 600%; /* 6 posts */
          }
          .social-slide-mobile-wrapper {
            width: 16.666%; /* 1/6 of track */
            display: flex;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
            padding: 0 16px;
            box-sizing: border-box;
          }
          .social-slide-mobile-wrapper .social-post-card {
            width: 100%;
            max-width: 360px;
            margin: 0 auto;
          }

          /* Center all mobile indicators */
          .mobile-indicators-centered {
            display: flex !important;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
          }
          .reviews-carousel-indicators.mobile-only-carousel {
            display: flex !important;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
          }
        }

        @media (max-width: 768px) {
          .navbar { padding: 0 20px; }
          .nav-links, .nav-actions { display: none; }
          .menu-btn { display: block; }
          .catalog-section { padding: 60px 20px; }
          .section-title { font-size: 32px; }
          .catalog-grid { gap: 20px; }
          .product-card { width: 100%; max-width: 320px; }
          .arrival-card { width: 100%; max-width: 340px; }
          .lamp-wrapper { display: none; }
          .exquisite-section { padding: 60px 20px; }
          .exquisite-container { flex-direction: column; gap: 40px; text-align: center; }
          .exquisite-actions {
            flex-direction: column;
            gap: 12px;
            width: 100%;
            align-items: center;
            margin-bottom: 20px;
          }
          .exquisite-actions .exquisite-btn,
          .exquisite-actions .light-control-panel {
            width: 100% !important;
            max-width: 280px !important;
            justify-content: center;
          }
          .exquisite-title { font-size: 32px; }
          .feature-item { flex-direction: column; align-items: center; gap: 8px; }
          .exquisite-frame-component { width: 300px; flex-shrink: 0; }
          .lamp-rod { height: 60px; }
          .exquisite-wood-frame { width: 300px; height: 394px; flex-shrink: 0; }
          .services-section .exquisite-content {
            align-items: center;
            text-align: center;
          }
          .services-section .services-bullet-list {
            text-align: left;
            max-width: 450px;
            width: 100%;
          }
          .vintage-written-section {
            padding: 60px 20px;
          }
          .vintage-written-container {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 40px;
          }
          .vintage-written-content {
            align-items: center;
            text-align: center;
          }
          .vintage-written-title {
            font-size: 44px;
            padding-right: 0;
          }
          .vintage-written-desc {
            font-size: 17px;
            margin: 0 auto;
          }
          .vintage-new-pen-image {
            max-width: 280px;
          }
          .footer { padding: 60px 20px 20px; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
          .footer-bottom { flex-direction: column; gap: 16px; text-align: center; }
        }

        /* LIGHT SWITCH TOGGLE STYLING */
        .product-card {
          display: flex;
          flex-direction: column;
          background: rgba(20, 17, 14, 0.6);
          border: 1.5px solid rgba(212, 175, 55, 0.2);
          border-radius: var(--radius);
          padding: 24px;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          min-height: 520px;
          justify-content: space-between;
          position: relative;
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

        .exquisite-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 12px;
          z-index: 30;
        }

        .light-control-panel {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: rgba(20, 17, 14, 0.6);
          border: 1.5px solid rgba(212, 175, 55, 0.3);
          padding: 0 24px !important;
          border-radius: 9999px !important;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
          outline: none;
          height: 56px !important;
          box-sizing: border-box;
          user-select: none;
        }
        .light-control-panel:hover {
          border-color: rgba(212, 175, 55, 0.6);
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 24px rgba(212, 175, 55, 0.2);
        }
        .light-control-panel:active {
          transform: translateY(0) scale(0.98);
        }
        .light-control-label {
          font-family: var(--font-display) !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #dfc38a;
          user-select: none;
          text-align: center;
          line-height: 1.2 !important;
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

        /* ── GOOGLE REVIEWS SECTION ── */
        .reviews-section {
          padding: 100px 40px;
          background: #090706;
          border-top: 2px solid #1C0F07;
          position: relative;
          overflow: hidden;
        }
        .reviews-container {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 3;
        }
        .reviews-header {
          text-align: center;
          margin-bottom: 16px;
        }
        .reviews-tagline {
          font-family: var(--font-typewriter);
          font-size: 12px;
          color: var(--accent);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .reviews-title {
          font-family: var(--font-display);
          font-size: 48px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .reviews-subtitle {
          font-family: var(--font-serif);
          font-size: 15px;
          color: var(--text2);
          line-height: 1.6;
          max-width: 540px;
          margin: 14px auto 0;
        }
        .reviews-summary-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin: 32px auto 48px;
          padding: 20px 32px;
          background: rgba(20, 17, 14, 0.6);
          border: 1.5px solid rgba(212, 175, 55, 0.2);
          border-radius: var(--radius);
          max-width: 520px;
        }
        .reviews-google-icon {
          font-size: 32px;
        }
        .reviews-avg-score {
          font-family: var(--font-display);
          font-size: 42px;
          font-weight: 700;
          color: var(--accent);
          line-height: 1;
        }
        .reviews-avg-detail {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .reviews-stars {
          font-size: 18px;
          letter-spacing: 2px;
          color: #FBBF24;
        }
        .reviews-count {
          font-family: var(--font-typewriter);
          font-size: 11px;
          color: var(--text2);
        }
        /* REVIEWS CAROUSEL SYSTEM */
        .reviews-carousel-wrapper {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .reviews-carousel-viewport {
          overflow: hidden;
          width: 100%;
          max-width: 1200px;
          margin: 0 40px;
        }

        .reviews-carousel-track {
          display: flex;
          transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
          width: 200%; /* 2 slides */
        }

        .reviews-carousel-slide {
          width: 50%;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          flex-shrink: 0;
          padding: 10px 0;
        }

        .reviews-carousel-indicators {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 30px;
        }

        @media (max-width: 1024px) {
          .reviews-carousel-viewport {
            max-width: 100%;
            margin: 0;
          }
          .reviews-carousel-slide {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
        .review-card {
          background: linear-gradient(135deg, rgba(20, 17, 14, 0.8) 0%, rgba(16, 13, 11, 0.9) 100%);
          border: 1.5px solid rgba(212, 175, 55, 0.12);
          border-radius: var(--radius);
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          position: relative;
          overflow: hidden;
        }
        .review-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(201, 168, 76, 0.3), transparent);
        }
        .review-card:hover {
          border-color: rgba(212, 175, 55, 0.3);
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
        }
        .review-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .review-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), #8B6914);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          color: #0C0A08;
          flex-shrink: 0;
        }
        .review-author-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .review-author-name {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
        }
        .review-author-meta {
          font-family: var(--font-typewriter);
          font-size: 10px;
          color: var(--text2);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .review-stars-row {
          font-size: 14px;
          letter-spacing: 2px;
          color: #FBBF24;
        }
        .review-text {
          font-family: var(--font-serif);
          font-size: 14px;
          line-height: 1.7;
          color: var(--text2);
          flex: 1;
        }
        .review-google-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-typewriter);
          font-size: 10px;
          color: var(--text2);
          opacity: 0.6;
        }
        .reviews-cta {
          text-align: center;
          margin-top: 40px;
        }
        .btn-review-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: rgba(20, 17, 14, 0.6);
          border: 1.5px solid rgba(212, 175, 55, 0.25);
          border-radius: 9999px;
          color: var(--accent);
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .btn-review-cta:hover {
          background: rgba(201, 168, 76, 0.08);
          border-color: var(--accent);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(201, 168, 76, 0.15);
        }

        /* ── SOCIAL FEED SECTION ── */
        .social-feed-section {
          padding: 100px 40px;
          background: var(--bg);
          border-top: 2px solid #1C0F07;
          position: relative;
          overflow: hidden;
        }
        .social-feed-container {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 3;
        }
        .social-feed-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .social-feed-tagline {
          font-family: var(--font-typewriter);
          font-size: 18px;
          color: var(--accent);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .social-feed-title {
          font-family: var(--font-display);
          font-size: 42px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .social-feed-subtitle {
          font-family: var(--font-serif);
          font-size: 15px;
          color: var(--text2);
          line-height: 1.6;
          max-width: 500px;
          margin: 14px auto 0;
        }
        /* SOCIAL FEED CAROUSEL SYSTEM */
        .social-carousel-wrapper {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .social-carousel-viewport {
          overflow: hidden;
          width: 100%;
          max-width: 1200px;
          margin: 0 40px;
        }

        .social-carousel-track {
          display: flex;
          transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
          width: 200%; /* 2 slides */
        }

        .social-carousel-slide {
          width: 50%;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          flex-shrink: 0;
          padding: 10px 0;
        }

        .social-carousel-indicators {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 30px;
        }

        @media (max-width: 1024px) {
          .social-carousel-viewport {
            max-width: 100%;
            margin: 0;
          }
          .social-carousel-slide {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
        .social-post-card {
          background: rgba(20, 17, 14, 0.6);
          border: 1.5px solid rgba(212, 175, 55, 0.1);
          border-radius: var(--radius);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          cursor: pointer;
        }
        .social-post-card:hover {
          border-color: rgba(212, 175, 55, 0.3);
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
        }
        .social-post-image {
          width: 100%;
          aspect-ratio: 1;
          background: #1A1714;
          position: relative;
          overflow: hidden;
        }
        .social-post-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .social-post-card:hover .social-post-image img {
          transform: scale(1.08);
        }
        .social-post-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(transparent 50%, rgba(0,0,0,0.7) 100%);
          display: flex;
          align-items: flex-end;
          padding: 14px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .social-post-card:hover .social-post-overlay {
          opacity: 1;
        }
        .social-post-stats {
          display: flex;
          gap: 14px;
          font-size: 12px;
          color: #fff;
          font-family: var(--font-typewriter);
        }
        .social-post-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .social-post-author {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .social-post-author-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E1306C, #F77737, #FCAF45);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }
        .social-post-author-name {
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 700;
          color: var(--text);
        }
        .social-post-platform {
          font-family: var(--font-typewriter);
          font-size: 9px;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .social-post-caption {
          font-family: var(--font-serif);
          font-size: 12px;
          line-height: 1.6;
          color: var(--text2);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .social-post-date {
          font-family: var(--font-typewriter);
          font-size: 10px;
          color: rgba(168, 160, 140, 0.5);
        }
        .social-feed-footer {
          text-align: center;
          margin-top: 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .social-handle {
          font-family: var(--font-typewriter);
          font-size: 14px;
          color: var(--accent);
          letter-spacing: 0.02em;
        }
        .social-links {
          display: flex;
          gap: 14px;
        }
        .social-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          background: rgba(20, 17, 14, 0.6);
          border: 1.5px solid rgba(212, 175, 55, 0.2);
          border-radius: 9999px;
          color: var(--text);
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .social-link-btn:hover {
          border-color: var(--accent);
          background: rgba(201, 168, 76, 0.06);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }

        .exquisite-actions .exquisite-btn,
.exquisite-actions .light-control-panel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 250px !important;              /* Set equal fixed width for both buttons */
  height: 56px !important;              /* Same height for both */
  padding: 0 24px !important;           /* vertical centering comes from flex, not padding */
  box-sizing: border-box;
  font: inherit;             /* buttons don't inherit font by default */
  line-height: 1.2 !important;
}

        @media (max-width: 768px) {
          .reviews-section { padding: 60px 20px; }
          .reviews-title { font-size: 32px; }
          .reviews-grid { grid-template-columns: 1fr; gap: 16px; }
          .reviews-carousel-slide { grid-template-columns: 1fr; gap: 16px; }
          .reviews-summary-bar { flex-direction: column; gap: 12px; padding: 16px; }
          .reviews-avg-score { font-size: 36px; }
          .social-feed-section { padding: 60px 20px; }
          .social-feed-title { font-size: 28px; }
          .social-feed-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .social-carousel-slide { grid-template-columns: 1fr; gap: 12px; }
          .social-links { flex-direction: column; }
        }
      ` }} />

      {/* NAVBAR */}
      <Navbar
        onCartOpen={() => setCartOpen(true)}
        onSearchChange={setSearchQuery}
        initialSearchValue={searchQuery}
      />

      {/* FULLSCREEN VIDEO HERO BANNER */}
      <section className="hero-fullscreen-frame">
        <video
          src="/videos/yaadein.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="hero-video-bg"
        />
        <div className="hero-video-overlay" />

        <div className="hero-fullscreen-content">

          <h1 className="hero-fullscreen-title">
            Turn Your Moments Into <br />
            <span>Museum Art</span>
          </h1>
          <p className="hero-fullscreen-desc">
            Experience bespoke picture framing handcrafted for your specific style. Customize details in real-time, and let our master artisans deliver it ready to hang.
          </p>
        </div>
      </section>

      {/* CURATED PRODUCTS CATALOG */}
      <section className={`catalog-section ${catalogEntered ? "animate-lamps" : ""}`} id="catalog">
        {/* Dynamic liquid backdrop elements */}
        <div className="catalog-glass-bg">
          <div className="liquid-blob-1" />
          <div className="liquid-blob-2" />
          <div id="catalog-glow" className="catalog-glow" />
        </div>

        {/* Frosted Glass overlay sheet */}
        <div className="catalog-glass-pane" />

        {/* Hanging Lamp Left */}
        <div className="lamp-wrapper left">
          <img src="/images/lamp.png" alt="Hanging Lamp" className="lamp-img" />
          <div className="lamp-glow-container">
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

        {/* Hanging Lamp Right */}
        <div className="lamp-wrapper right">
          <img src="/images/lamp.png" alt="Hanging Lamp" className="lamp-img" />
          <div className="lamp-glow-container">
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

        <div className="catalog-container">
          <div className="section-header">

            <h2 className="section-title">Featured Products</h2>
            <p className="section-desc">
              Choose from our bespoke frame profiles. Select a style to launch it instantly in our interactive studio builder.
            </p>
          </div>

          {products.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text2)", padding: "40px 0", fontFamily: "var(--font-typewriter)" }}>
              Loading catalog from database...
            </div>
          ) : searchQuery.trim() !== "" ? (
            <div className="catalog-grid">
              {products.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.tag && p.tag.toLowerCase().includes(searchQuery.toLowerCase()))
              ).map((p) => renderProductCard(p))}
            </div>
          ) : (
            <>
              <div className="carousel-wrapper desktop-only-carousel">
                <button
                  className="carousel-arrow prev"
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + 3) % 3)}
                  aria-label="Previous Slide"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>

                <div className="carousel-viewport">
                  <div className="carousel-track" style={{ transform: `translateX(-${currentSlide * 33.333}%)` }}>
                    <div className="carousel-slide">
                      {portraitProducts.map((p) => renderProductCard(p))}
                    </div>
                    <div className="carousel-slide">
                      {landscapeProducts.map((p) => renderProductCard(p))}
                    </div>
                    <div className="carousel-slide">
                      {boardGames.map((p) => renderProductCard(p))}
                    </div>
                  </div>
                </div>

                <button
                  className="carousel-arrow next"
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % 3)}
                  aria-label="Next Slide"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>

              <div className="carousel-indicators desktop-only-carousel">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    className={`carousel-dot ${currentSlide === idx ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* MOBILE ONLY CAROUSEL (1 card at a time, flat list of 9 products) */}
              <div className="mobile-only-carousel catalog-mobile-carousel">
                <div className="carousel-viewport-mobile">
                  <div
                    className="carousel-track-mobile"
                    style={{ transform: `translateX(-${mobileCuratedIndex * (100 / 9)}%)` }}
                  >
                    {[...portraitProducts, ...landscapeProducts, ...boardGames].map((p) => (
                      <div key={`mob-${p.id}`} className="carousel-slide-mobile">
                        {renderProductCard(p)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile controls centered below the card */}
                <div className="mobile-carousel-controls">
                  <button
                    className="carousel-arrow-mobile prev"
                    onClick={() => setMobileCuratedIndex((prev) => (prev - 1 + 9) % 9)}
                    aria-label="Previous Slide"
                  >
                    ‹
                  </button>
                  <div className="carousel-indicators-mobile">
                    {[...Array(9)].map((_, idx) => (
                      <button
                        key={idx}
                        className={`carousel-dot-mobile ${mobileCuratedIndex === idx ? 'active' : ''}`}
                        onClick={() => setMobileCuratedIndex(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    className="carousel-arrow-mobile next"
                    onClick={() => setMobileCuratedIndex((prev) => (prev + 1) % 9)}
                    aria-label="Next Slide"
                  >
                    ›
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* EXQUISITE SHOWCASE SECTION */}
      <section className="exquisite-section" id="showcase">
        {/* Dynamic liquid backdrop elements */}
        <div className="catalog-glass-bg">
          <div className="liquid-blob-1" />
          <div className="liquid-blob-2" />
          <div className="catalog-glow" />
        </div>

        {/* Frosted Glass overlay sheet */}
        <div className="catalog-glass-pane" />

        <div className="exquisite-container">
          {/* Left Column: Content */}
          <div className="exquisite-content">
            <h2 className="exquisite-title">Where Memories Meet Nature's Light</h2>
            <p className="exquisite-desc">
              Every photograph is a story of shadows and highlights. Our bespoke frames are built to interact harmoniously with the ambient atmosphere. Watch as natural daylight from a nearby window shifts across the real-wood textures and museum matting, breathing organic life into your timeless moments.
            </p>
            <div className="exquisite-actions">
              <a href="/catalog" className="btn-premium exquisite-btn ">
                Browse <br /> Catalouge
              </a>

              {/* Toggle switch button styled identical to Browse Catalog */}
              <button
                className="light-control-panel"
                onClick={() => setLightOn(!lightOn)}
                aria-label="Toggle Light Switch"
              >
                <span className="light-control-label">Light <br /> Switch</span>
                <div className={`light-switch-btn ${lightOn ? 'on' : ''}`}>
                  <span className="light-switch-knob" />
                </div>
              </button>
            </div>
          </div>

          {/* Right Column: Visual */}
          <div className="exquisite-visual">
            <div className="exquisite-frame-component">
              {/* Ambient wall glow behind the lamp */}
              <div className={`exquisite-wall-glow ${lightOn ? 'on' : ''}`} />

              {/* Picture light lamp */}
              <div className="exquisite-lamp">
                <div className="lamp-rod" />
                <div className="lamp-mount" />
                <div className="lamp-arm" />
                <div className="lamp-head">
                  <div className={`lamp-bulb ${lightOn ? 'on' : ''}`} />
                </div>

                {/* Light beam */}
                <div className={`lamp-light-beam ${lightOn ? 'on' : ''}`} />

                {/* Copied glow & particle effect */}
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

              {/* The frame wrapper */}
              <div className={`exquisite-wood-frame ${lightOn ? 'light-on' : ''}`}>
                {/* Wood Frame Texture Image */}
                <img
                  src="/frames/portrait/frame-01-correct-size.webp"
                  alt="Antique Gold Frame"
                  className="wood-frame-overlay"
                />

                {/* Inner photo area filling the frame space */}
                <div className="exquisite-inner-photo">
                  <img
                    src="/images/dummyImg.jpg"
                    alt="Exhibited B&W Artwork"
                    className={lightOn ? 'light-active' : 'light-inactive'}
                  />
                  <div className="glass-reflection" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GOOGLE REVIEWS SECTION ── */}
      <section className="reviews-section" id="reviews">
        {/* Dynamic liquid backdrop elements */}
        <div className="catalog-glass-bg">
          <div className="liquid-blob-1" />
          <div className="liquid-blob-2" />
          <div className="catalog-glow" />
        </div>

        {/* Frosted Glass overlay sheet */}
        <div className="catalog-glass-pane" />

        <div className="reviews-container">
          <div className="reviews-header">

            <h2 className="reviews-title">What Our Clients Say</h2>
            <p className="reviews-subtitle">
              Real reviews from our verified customers on Google. Every frame tells a story — here's what they have to say.
            </p>
          </div>

          <div className="reviews-summary-bar">
            <span className="reviews-google-icon">🇬</span>
            <span className="reviews-avg-score">4.9</span>
            <div className="reviews-avg-detail">
              <span className="reviews-stars">★★★★★</span>
              <span className="reviews-count">Based on 127 Google Reviews</span>
            </div>
          </div>

          <div className="reviews-carousel-wrapper">
            <button
              className="carousel-arrow prev desktop-only-carousel"
              onClick={() => setCurrentReviewSlide((prev) => (prev - 1 + 2) % 2)}
              aria-label="Previous Reviews"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div className="reviews-carousel-viewport desktop-only-carousel">
              <div className="reviews-carousel-track" style={{ transform: `translateX(-${currentReviewSlide * 50}%)` }}>
                {/* Slide 1 */}
                <div className="reviews-carousel-slide">
                  <div className="review-card">
                    <div className="review-card-header">
                      <div className="review-avatar">AK</div>
                      <div className="review-author-info">
                        <span className="review-author-name">Ayesha Khan</span>
                        <span className="review-author-meta">📍 Lahore • 2 weeks ago</span>
                      </div>
                    </div>
                    <div className="review-stars-row">★★★★★</div>
                    <p className="review-text">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. The craftsmanship is absolutely stunning!
                    </p>
                    <div className="review-google-badge">🇬 Posted on Google</div>
                  </div>

                  <div className="review-card">
                    <div className="review-card-header">
                      <div className="review-avatar">HA</div>
                      <div className="review-author-info">
                        <span className="review-author-name">Hassan Ali</span>
                        <span className="review-author-meta">📍 Islamabad • 1 month ago</span>
                      </div>
                    </div>
                    <div className="review-stars-row">★★★★★</div>
                    <p className="review-text">
                      Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. The attention to detail in every frame is remarkable. Highly recommend Yaadein!
                    </p>
                    <div className="review-google-badge">🇬 Posted on Google</div>
                  </div>

                  <div className="review-card">
                    <div className="review-card-header">
                      <div className="review-avatar">SM</div>
                      <div className="review-author-info">
                        <span className="review-author-name">Sara Malik</span>
                        <span className="review-author-meta">📍 Karachi • 3 weeks ago</span>
                      </div>
                    </div>
                    <div className="review-stars-row">★★★★★</div>
                    <p className="review-text">
                      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
                    </p>
                    <div className="review-google-badge">🇬 Posted on Google</div>
                  </div>
                </div>

                {/* Slide 2 */}
                <div className="reviews-carousel-slide">
                  <div className="review-card">
                    <div className="review-card-header">
                      <div className="review-avatar">OA</div>
                      <div className="review-author-info">
                        <span className="review-author-name">Omar Ahmed</span>
                        <span className="review-author-meta">📍 Rawalpindi • 5 days ago</span>
                      </div>
                    </div>
                    <div className="review-stars-row">★★★★☆</div>
                    <p className="review-text">
                      Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. Beautifully crafted frames, fast delivery too!
                    </p>
                    <div className="review-google-badge">🇬 Posted on Google</div>
                  </div>

                  <div className="review-card">
                    <div className="review-card-header">
                      <div className="review-avatar">FZ</div>
                      <div className="review-author-info">
                        <span className="review-author-name">Fatima Zahra</span>
                        <span className="review-author-meta">📍 Faisalabad • 2 months ago</span>
                      </div>
                    </div>
                    <div className="review-stars-row">★★★★★</div>
                    <p className="review-text">
                      Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit. The oak frame for my nikkah photo is absolutely divine.
                    </p>
                    <div className="review-google-badge">🇬 Posted on Google</div>
                  </div>

                  <div className="review-card">
                    <div className="review-card-header">
                      <div className="review-avatar">BI</div>
                      <div className="review-author-info">
                        <span className="review-author-name">Bilal Iqbal</span>
                        <span className="review-author-meta">📍 Multan • 1 week ago</span>
                      </div>
                    </div>
                    <div className="review-stars-row">★★★★★</div>
                    <p className="review-text">
                      Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse. Premium quality frames that turned my living room into a gallery.
                    </p>
                    <div className="review-google-badge">🇬 Posted on Google</div>
                  </div>
                </div>
              </div>
            </div>

            <button
              className="carousel-arrow next desktop-only-carousel"
              onClick={() => setCurrentReviewSlide((prev) => (prev + 1) % 2)}
              aria-label="Next Reviews"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            {/* MOBILE ONLY REVIEWS CAROUSEL */}
            <div className="reviews-carousel-viewport mobile-only-carousel">
              <div
                className="reviews-carousel-track-mobile"
                style={{ transform: `translateX(-${mobileReviewIndex * (100 / 6)}%)` }}
              >
                {/* Slide 1 */}
                <div className="review-slide-mobile-wrapper">
                  <div className="review-card">
                    <div className="review-card-header">
                      <div className="review-avatar">AK</div>
                      <div className="review-author-info">
                        <span className="review-author-name">Ayesha Khan</span>
                        <span className="review-author-meta">📍 Lahore • 2 weeks ago</span>
                      </div>
                    </div>
                    <div className="review-stars-row">★★★★★</div>
                    <p className="review-text">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. The craftsmanship is absolutely stunning!
                    </p>
                    <div className="review-google-badge">🇬 Posted on Google</div>
                  </div>
                </div>

                {/* Slide 2 */}
                <div className="review-slide-mobile-wrapper">
                  <div className="review-card">
                    <div className="review-card-header">
                      <div className="review-avatar">HA</div>
                      <div className="review-author-info">
                        <span className="review-author-name">Hassan Ali</span>
                        <span className="review-author-meta">📍 Islamabad • 1 month ago</span>
                      </div>
                    </div>
                    <div className="review-stars-row">★★★★★</div>
                    <p className="review-text">
                      Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. The attention to detail in every frame is remarkable. Highly recommend Yaadein!
                    </p>
                    <div className="review-google-badge">🇬 Posted on Google</div>
                  </div>
                </div>

                {/* Slide 3 */}
                <div className="review-slide-mobile-wrapper">
                  <div className="review-card">
                    <div className="review-card-header">
                      <div className="review-avatar">SM</div>
                      <div className="review-author-info">
                        <span className="review-author-name">Sara Malik</span>
                        <span className="review-author-meta">📍 Karachi • 3 weeks ago</span>
                      </div>
                    </div>
                    <div className="review-stars-row">★★★★★</div>
                    <p className="review-text">
                      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
                    </p>
                    <div className="review-google-badge">🇬 Posted on Google</div>
                  </div>
                </div>

                {/* Slide 4 */}
                <div className="review-slide-mobile-wrapper">
                  <div className="review-card">
                    <div className="review-card-header">
                      <div className="review-avatar">OA</div>
                      <div className="review-author-info">
                        <span className="review-author-name">Omar Ahmed</span>
                        <span className="review-author-meta">📍 Rawalpindi • 5 days ago</span>
                      </div>
                    </div>
                    <div className="review-stars-row">★★★★☆</div>
                    <p className="review-text">
                      Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. Beautifully crafted frames, fast delivery too!
                    </p>
                    <div className="review-google-badge">🇬 Posted on Google</div>
                  </div>
                </div>

                {/* Slide 5 */}
                <div className="review-slide-mobile-wrapper">
                  <div className="review-card">
                    <div className="review-card-header">
                      <div className="review-avatar">FZ</div>
                      <div className="review-author-info">
                        <span className="review-author-name">Fatima Zahra</span>
                        <span className="review-author-meta">📍 Faisalabad • 2 months ago</span>
                      </div>
                    </div>
                    <div className="review-stars-row">★★★★★</div>
                    <p className="review-text">
                      Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit. The oak frame for my nikkah photo is absolutely divine.
                    </p>
                    <div className="review-google-badge">🇬 Posted on Google</div>
                  </div>
                </div>

                {/* Slide 6 */}
                <div className="review-slide-mobile-wrapper">
                  <div className="review-card">
                    <div className="review-card-header">
                      <div className="review-avatar">BI</div>
                      <div className="review-author-info">
                        <span className="review-author-name">Bilal Iqbal</span>
                        <span className="review-author-meta">📍 Multan • 1 week ago</span>
                      </div>
                    </div>
                    <div className="review-stars-row">★★★★★</div>
                    <p className="review-text">
                      Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse. Premium quality frames that turned my living room into a gallery.
                    </p>
                    <div className="review-google-badge">🇬 Posted on Google</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="reviews-carousel-indicators desktop-only-carousel">
            {[0, 1].map((idx) => (
              <button
                key={idx}
                className={`carousel-dot ${currentReviewSlide === idx ? 'active' : ''}`}
                onClick={() => setCurrentReviewSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Mobile indicators for reviews */}
          <div className="reviews-carousel-indicators mobile-only-carousel">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <button
                key={idx}
                className={`carousel-dot ${mobileReviewIndex === idx ? 'active' : ''}`}
                onClick={() => setMobileReviewIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="reviews-cta">
            <a
              href="https://g.page/r/yaadein-art-studio/review"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-review-cta"
            >
              ⭐ Leave Us a Review on Google
            </a>
          </div>
        </div>
      </section>

      {/* ── VINTAGE WRITTEN HERITAGE SECTION ── */}
      <section className="vintage-written-section" id="heritage">
        <div className="vintage-written-container">
          {/* Left Column: Content */}
          <div className="vintage-written-content">
            <span className="vintage-written-tagline">Preserving Memories</span>
            <div className="vintage-heading-wrapper">
              <h2 className="vintage-written-title">Written in Time</h2>
            </div>
            <p className="vintage-written-desc">
              Every frame we build, every photo we restore, is a testament to the moments that define us.
              Using traditional techniques and premium materials, we craft heirlooms that bridge generations.
              Let us help you write your story in wood and glass.
            </p>
            <div className="vintage-written-signature">
              <span className="signature-text">Yaadein Art Studio</span>
            </div>
          </div>

          {/* Right Column: Vintage Fountain Pen Visual */}
          <div className="vintage-written-visual">
            <img
              src="/images/pens/pen1.png"
              alt="Vintage Fountain Pen"
              className="vintage-new-pen-image"
            />
          </div>
        </div>
      </section>

      {/* ── OUR SERVICES SECTION (photo left, content right) ── */}
      <section className="exquisite-section services-section" id="services">
        {/* Dynamic liquid backdrop elements */}
        <div className="catalog-glass-bg">
          <div className="liquid-blob-1" />
          <div className="liquid-blob-2" />
          <div className="catalog-glow" />
        </div>

        {/* Frosted Glass overlay sheet */}
        <div className="catalog-glass-pane" />

        <div className="exquisite-container">
          {/* Left Column: Visual (frame + picture light) */}
          <div className="exquisite-visual">
            <div className="exquisite-frame-component">
              {/* Ambient wall glow behind the lamp */}
              <div className={`exquisite-wall-glow ${servicesLightOn ? 'on' : ''}`} />

              {/* Picture light lamp */}
              <div className="exquisite-lamp">
                <div className="lamp-rod" />
                <div className="lamp-mount" />
                <div className="lamp-arm" />
                <div className="lamp-head">
                  <div className={`lamp-bulb ${servicesLightOn ? 'on' : ''}`} />
                </div>

                {/* Light beam */}
                <div className={`lamp-light-beam ${servicesLightOn ? 'on' : ''}`} />

                {/* Glow & particle effect */}
                <div className={`lamp-glow-container exquisite-glow-container ${servicesLightOn ? 'on' : ''}`}>
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

              {/* The frame wrapper */}
              <div className={`exquisite-wood-frame ${servicesLightOn ? 'light-on' : ''}`}>
                {/* Wood Frame Texture Image */}
                <img
                  src="/frames/portrait/frame-01-correct-size.webp"
                  alt="Handcrafted Wooden Frame"
                  className="wood-frame-overlay"
                />

                {/* Inner photo area — swap this src for a services/workshop shot */}
                <div className="exquisite-inner-photo">
                  <img
                    src="/images/dummyImg.jpg"
                    alt="Framing Craftsmanship at Work"
                    className={servicesLightOn ? 'light-active' : 'light-inactive'}
                  />
                  <div className="glass-reflection" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="exquisite-content">
            <p className="exquisite-tagline">Our Services</p>
            <h2 className="exquisite-title">Crafted With Care, Delivered With Pride</h2>
            <p className="exquisite-desc">
              From the first cut of wood to the final placement on your wall, every step
              is handled by our in-house artisans. Whatever your framing need, we bring
              museum-grade craftsmanship to your doorstep.
            </p>

            <ul className="services-bullet-list">
              <li>
                <strong>Old Photo Restoration</strong>
                <span>Bring damaged, faded, or torn family photographs back to life with professional digital repair and colorization.</span>
              </li>
              <li>
                <strong>Nikkahnama Frame</strong>
                <span>Elegant custom-built frames designed specifically to preserve and display your Nikkahnama with timeless grace.</span>
              </li>
              <li>
                <strong>Board Games</strong>
                <span>Handcrafted luxury wooden board games — from Ludo to Chess — built for family fun and aesthetic value.</span>
              </li>
            </ul>

            <div className="exquisite-actions">
              <a href="/services" className="btn-premium exquisite-btn">
                Explore <br /> Services
              </a>

              {/* Light switch for this section's lamp */}
              <button
                className="light-control-panel"
                onClick={() => setServicesLightOn(!servicesLightOn)}
                aria-label="Toggle Light Switch"
              >
                <span className="light-control-label">Light <br /> Switch</span>
                <div className={`light-switch-btn ${servicesLightOn ? 'on' : ''}`}>
                  <span className="light-switch-knob" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL MEDIA FEED SECTION ── */}
      <section className="social-feed-section" id="social">
        {/* Dynamic liquid backdrop elements */}
        <div className="catalog-glass-bg">
          <div className="liquid-blob-1" />
          <div className="liquid-blob-2" />
          <div className="catalog-glow" />
        </div>

        {/* Frosted Glass overlay sheet */}
        <div className="catalog-glass-pane" />

        <div className="social-feed-container">
          <div className="social-feed-header">
            <p className="social-feed-tagline">Follow Our Journey</p>
            <h2 className="social-feed-title">#YaadeinFrames</h2>
            <p className="social-feed-subtitle">
              See how our customers style their spaces. Tag us to get featured in our gallery.
            </p>
          </div>

          <div className="social-carousel-wrapper">
            <button
              className="carousel-arrow prev desktop-only-carousel"
              onClick={() => setCurrentSocialSlide((prev) => (prev - 1 + 2) % 2)}
              aria-label="Previous Posts"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div className="social-carousel-viewport desktop-only-carousel">
              <div className="social-carousel-track" style={{ transform: `translateX(-${currentSocialSlide * 50}%)` }}>
                {/* Slide 1 */}
                <div className="social-carousel-slide">
                  <div className="social-post-card">
                    <div className="social-post-image">
                      <img src="/images/dummyImg.jpg" alt="Customer frame setup" />
                      <div className="social-post-overlay">
                        <div className="social-post-stats">
                          <span>❤️ 234</span>
                          <span>💬 18</span>
                        </div>
                      </div>
                    </div>
                    <div className="social-post-body">
                      <div className="social-post-author">
                        <div className="social-post-author-avatar">Y</div>
                        <div>
                          <div className="social-post-author-name">yaadein.pk</div>
                          <div className="social-post-platform">Instagram</div>
                        </div>
                      </div>
                      <p className="social-post-caption">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed dignissim lacinia nunc. 🖼️✨ #YaadeinFrames #HomeDecor
                      </p>
                      <span className="social-post-date">2 days ago</span>
                    </div>
                  </div>

                  <div className="social-post-card">
                    <div className="social-post-image">
                      <img src="/images/dummyImg.jpg" alt="Frame collection" style={{ objectPosition: "center 30%" }} />
                      <div className="social-post-overlay">
                        <div className="social-post-stats">
                          <span>❤️ 189</span>
                          <span>💬 12</span>
                        </div>
                      </div>
                    </div>
                    <div className="social-post-body">
                      <div className="social-post-author">
                        <div className="social-post-author-avatar">A</div>
                        <div>
                          <div className="social-post-author-name">ayesha.interiors</div>
                          <div className="social-post-platform">Instagram</div>
                        </div>
                      </div>
                      <p className="social-post-caption">
                        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi. My living room transformation! 🏡 #InteriorDesign
                      </p>
                      <span className="social-post-date">5 days ago</span>
                    </div>
                  </div>

                  <div className="social-post-card">
                    <div className="social-post-image">
                      <img src="/images/dummyImg.jpg" alt="Custom frame order" style={{ objectPosition: "center 70%" }} />
                      <div className="social-post-overlay">
                        <div className="social-post-stats">
                          <span>❤️ 312</span>
                          <span>💬 27</span>
                        </div>
                      </div>
                    </div>
                    <div className="social-post-body">
                      <div className="social-post-author">
                        <div className="social-post-author-avatar">Y</div>
                        <div>
                          <div className="social-post-author-name">yaadein.pk</div>
                          <div className="social-post-platform">Instagram</div>
                        </div>
                      </div>
                      <p className="social-post-caption">
                        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum. New collection drop! 🎨 #ArtFraming #BespokeFrames
                      </p>
                      <span className="social-post-date">1 week ago</span>
                    </div>
                  </div>
                </div>

                {/* Slide 2 */}
                <div className="social-carousel-slide">
                  <div className="social-post-card">
                    <div className="social-post-image">
                      <img src="/images/dummyImg.jpg" alt="Gallery wall" style={{ objectPosition: "20% center" }} />
                      <div className="social-post-overlay">
                        <div className="social-post-stats">
                          <span>❤️ 156</span>
                          <span>💬 9</span>
                        </div>
                      </div>
                    </div>
                    <div className="social-post-body">
                      <div className="social-post-author">
                        <div className="social-post-author-avatar">H</div>
                        <div>
                          <div className="social-post-author-name">hassan.captures</div>
                          <div className="social-post-platform">Instagram</div>
                        </div>
                      </div>
                      <p className="social-post-caption">
                        Excepteur sint occaecat cupidatat non proident, sunt in culpa. Gallery wall completed! 📸 #WallArt #Photography
                      </p>
                      <span className="social-post-date">2 weeks ago</span>
                    </div>
                  </div>

                  <div className="social-post-card">
                    <div className="social-post-image">
                      <img src="/images/dummyImg.jpg" alt="Oak frames bedroom decor" style={{ objectPosition: "center center" }} />
                      <div className="social-post-overlay">
                        <div className="social-post-stats">
                          <span>❤️ 245</span>
                          <span>💬 19</span>
                        </div>
                      </div>
                    </div>
                    <div className="social-post-body">
                      <div className="social-post-author">
                        <div className="social-post-author-avatar">Z</div>
                        <div>
                          <div className="social-post-author-name">zainab.frames</div>
                          <div className="social-post-platform">Instagram</div>
                        </div>
                      </div>
                      <p className="social-post-caption">
                        Absolutely in love with the classic oak frame! It matches my bedroom aesthetic perfectly. 🌿✨ #AestheticHome #Decor
                      </p>
                      <span className="social-post-date">3 weeks ago</span>
                    </div>
                  </div>

                  <div className="social-post-card">
                    <div className="social-post-image">
                      <img src="/images/dummyImg.jpg" alt="Art studio gallery" style={{ objectPosition: "center 40%" }} />
                      <div className="social-post-overlay">
                        <div className="social-post-stats">
                          <span>❤️ 198</span>
                          <span>💬 14</span>
                        </div>
                      </div>
                    </div>
                    <div className="social-post-body">
                      <div className="social-post-author">
                        <div className="social-post-author-avatar">M</div>
                        <div>
                          <div className="social-post-author-name">maryam.spaces</div>
                          <div className="social-post-platform">Instagram</div>
                        </div>
                      </div>
                      <p className="social-post-caption">
                        The gold frame detailing is even more beautiful in person. Handcrafted perfection! 💛 #ArtStudio #LuxuryHome
                      </p>
                      <span className="social-post-date">1 month ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              className="carousel-arrow next desktop-only-carousel"
              onClick={() => setCurrentSocialSlide((prev) => (prev + 1) % 2)}
              aria-label="Next Posts"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            {/* MOBILE ONLY SOCIAL CAROUSEL */}
            <div className="social-carousel-viewport mobile-only-carousel social-mobile-carousel">
              <div
                className="social-carousel-track-mobile"
                style={{ transform: `translateX(-${mobileSocialIndex * (100 / 6)}%)` }}
              >
                <div className="social-slide-mobile-wrapper">
                  <div className="social-post-card">
                    <div className="social-post-image"><img src="/images/dummyImg.jpg" alt="Customer frame setup" /></div>
                    <div className="social-post-body">
                      <div className="social-post-author"><div className="social-post-author-avatar">Y</div><div><div className="social-post-author-name">yaadein.pk</div><div className="social-post-platform">Instagram</div></div></div>
                      <p className="social-post-caption">Lorem ipsum dolor sit amet, consectetur adipiscing elit. 🖼️✨ #YaadeinFrames #HomeDecor</p>
                      <span className="social-post-date">2 days ago</span>
                    </div>
                  </div>
                </div>
                <div className="social-slide-mobile-wrapper">
                  <div className="social-post-card">
                    <div className="social-post-image"><img src="/images/dummyImg.jpg" alt="Frame collection" style={{ objectPosition: "center 30%" }} /></div>
                    <div className="social-post-body">
                      <div className="social-post-author"><div className="social-post-author-avatar">A</div><div><div className="social-post-author-name">ayesha.interiors</div><div className="social-post-platform">Instagram</div></div></div>
                      <p className="social-post-caption">My living room transformation! 🏡 #InteriorDesign</p>
                      <span className="social-post-date">5 days ago</span>
                    </div>
                  </div>
                </div>
                <div className="social-slide-mobile-wrapper">
                  <div className="social-post-card">
                    <div className="social-post-image"><img src="/images/dummyImg.jpg" alt="Custom frame order" style={{ objectPosition: "center 70%" }} /></div>
                    <div className="social-post-body">
                      <div className="social-post-author"><div className="social-post-author-avatar">Y</div><div><div className="social-post-author-name">yaadein.pk</div><div className="social-post-platform">Instagram</div></div></div>
                      <p className="social-post-caption">New collection drop! 🎨 #ArtFraming #BespokeFrames</p>
                      <span className="social-post-date">1 week ago</span>
                    </div>
                  </div>
                </div>
                <div className="social-slide-mobile-wrapper">
                  <div className="social-post-card">
                    <div className="social-post-image"><img src="/images/dummyImg.jpg" alt="Gallery wall" style={{ objectPosition: "20% center" }} /></div>
                    <div className="social-post-body">
                      <div className="social-post-author"><div className="social-post-author-avatar">H</div><div><div className="social-post-author-name">hassan.captures</div><div className="social-post-platform">Instagram</div></div></div>
                      <p className="social-post-caption">Gallery wall completed! 📸 #WallArt #Photography</p>
                      <span className="social-post-date">2 weeks ago</span>
                    </div>
                  </div>
                </div>
                <div className="social-slide-mobile-wrapper">
                  <div className="social-post-card">
                    <div className="social-post-image"><img src="/images/dummyImg.jpg" alt="Oak frames bedroom decor" /></div>
                    <div className="social-post-body">
                      <div className="social-post-author"><div className="social-post-author-avatar">Z</div><div><div className="social-post-author-name">zainab.frames</div><div className="social-post-platform">Instagram</div></div></div>
                      <p className="social-post-caption">Classic oak frame! 🌿✨ #AestheticHome #Decor</p>
                      <span className="social-post-date">3 weeks ago</span>
                    </div>
                  </div>
                </div>
                <div className="social-slide-mobile-wrapper">
                  <div className="social-post-card">
                    <div className="social-post-image"><img src="/images/dummyImg.jpg" alt="Art studio gallery" style={{ objectPosition: "center 40%" }} /></div>
                    <div className="social-post-body">
                      <div className="social-post-author"><div className="social-post-author-avatar">M</div><div><div className="social-post-author-name">maryam.spaces</div><div className="social-post-platform">Instagram</div></div></div>
                      <p className="social-post-caption">Handcrafted perfection! 💛 #ArtStudio #LuxuryHome</p>
                      <span className="social-post-date">1 month ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="social-carousel-indicators desktop-only-carousel">
            {[0, 1].map((idx) => (
              <button
                key={idx}
                className={`carousel-dot ${currentSocialSlide === idx ? 'active' : ''}`}
                onClick={() => setCurrentSocialSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Mobile social indicators */}
          <div className="social-carousel-indicators mobile-only-carousel mobile-indicators-centered">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <button
                key={idx}
                className={`carousel-dot ${mobileSocialIndex === idx ? 'active' : ''}`}
                onClick={() => setMobileSocialIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="social-feed-footer">
            <span className="social-handle">@yaadein.pk</span>
            <div className="social-links">
              <a href="https://instagram.com/yaadein.pk" target="_blank" rel="noopener noreferrer" className="social-link-btn">
                📸 Follow on Instagram
              </a>
              <a href="https://facebook.com/yaadein.pk" target="_blank" rel="noopener noreferrer" className="social-link-btn">
                👤 Follow on Facebook
              </a>
              <a href="https://tiktok.com/@yaadein.pk" target="_blank" rel="noopener noreferrer" className="social-link-btn">
                🎵 Follow on TikTok
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
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

      {/* NEWSLETTER PROMO POPUP */}
      {showPromo && (
        <div className={`promo-overlay ${showPromo ? "open" : ""}`}>
          <style dangerouslySetInnerHTML={{
            __html: `
            .promo-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.85);
              backdrop-filter: blur(8px);
              -webkit-backdrop-filter: blur(8px);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 9999;
              opacity: 0;
              pointer-events: none;
              transition: opacity 0.4s ease;
            }
            .promo-overlay.open {
              opacity: 1;
              pointer-events: auto;
            }
            .promo-modal {
              position: relative;
              background: linear-gradient(135deg, var(--surface) 0%, #100D0B 100%);
              border: 6px solid #1C0F07;
              outline: 1.5px solid var(--accent);
              outline-offset: -5px;
              padding: 48px 36px;
              max-width: 500px;
              width: 90%;
              box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
              transform: scale(0.9);
              transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              text-align: center;
            }
            .promo-overlay.open .promo-modal {
              transform: scale(1);
            }
            .promo-close {
              position: absolute;
              top: 12px;
              right: 16px;
              background: none;
              border: none;
              color: var(--text2);
              font-size: 28px;
              cursor: pointer;
              line-height: 1;
              transition: color 0.15s ease;
            }
            .promo-close:hover {
              color: var(--accent);
            }
            .promo-icon {
              font-size: 42px;
              color: var(--accent);
              margin-bottom: 12px;
            }
            .promo-content h3 {
              font-family: var(--font-display);
              font-size: 26px;
              color: var(--accent);
              margin-bottom: 12px;
              letter-spacing: 0.05em;
            }
            .promo-content p {
              font-family: var(--font-serif);
              font-size: 14px;
              color: var(--text2);
              line-height: 1.6;
              margin-bottom: 24px;
            }
            .promo-form {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            .promo-input {
              background: var(--surface2);
              border: 1px solid var(--border2);
              color: var(--text);
              padding: 14px;
              font-family: var(--font-typewriter);
              font-size: 14px;
              outline: none;
              border-radius: var(--radius);
              text-align: center;
            }
            .promo-input:focus {
              border-color: var(--accent);
            }
            .btn-promo-submit {
              background: var(--accent) !important;
              color: #0C0A08 !important;
              border: none !important;
              outline: none !important;
              border-radius: 9999px !important;
              padding: 14px;
              font-family: var(--font-display);
              font-weight: 700;
              font-size: 13px;
              letter-spacing: 0.05em;
              text-transform: uppercase;
              cursor: pointer;
              box-shadow: 0 4px 15px rgba(181, 139, 92, 0.25);
              transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .btn-promo-submit:hover {
              background: var(--accent2) !important;
              transform: translateY(-2px) scale(1.02);
              box-shadow: 0 8px 24px rgba(181, 139, 92, 0.4);
            }
            .promo-code-container {
              display: flex;
              align-items: center;
              justify-content: center;
              background: var(--surface2);
              border: 1.5px dashed var(--accent);
              padding: 12px 24px;
              margin: 16px 0;
              gap: 16px;
            }
            .promo-code {
              font-family: var(--font-typewriter);
              font-weight: 700;
              font-size: 20px;
              color: var(--accent);
              letter-spacing: 0.05em;
            }
            .btn-copy-code {
              background: var(--surface3);
              border: 1px solid var(--border2);
              color: var(--text);
              padding: 6px 16px;
              font-size: 12px;
              font-family: var(--font-display);
              cursor: pointer;
              transition: all 0.2s ease;
              border-radius: 9999px !important;
            }
            .btn-copy-code:hover {
              background: rgba(181, 139, 92, 0.1) !important;
              color: var(--accent2) !important;
              border-color: var(--accent2) !important;
            }
            .btn-promo-success-close {
              background: none;
              border: 1px solid var(--border2);
              color: var(--text2);
              padding: 10px 20px;
              font-family: var(--font-display);
              font-size: 12px;
              letter-spacing: 0.05em;
              text-transform: uppercase;
              cursor: pointer;
              transition: all 0.2s ease;
              margin-top: 12px;
              border-radius: 9999px !important;
            }
            .btn-promo-success-close:hover {
              color: var(--text);
              border-color: var(--text);
            }
          ` }} />
          <div className="promo-modal">
            <button className="promo-close" onClick={handleClosePromo}>&times;</button>
            <div className="promo-content">
              <img src="/images/logo-white.png" alt="Yaadein Logo" className="newsletter-logo-img" style={{ height: "42px", width: "auto", margin: "0 auto 20px", display: "block" }} />
              {!promoSubmitted ? (
                <>
                  <h3>Join the Yaadein Circle</h3>
                  <p>Subscribe to our newsletter for exclusive collections, art framing inspiration.</p>
                  <form onSubmit={handlePromoSubmit} className="promo-form">
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={promoEmail}
                      onChange={(e) => setPromoEmail(e.target.value)}
                      className="promo-input"
                      required
                    />
                    <button type="submit" className="btn-promo-submit" disabled={isSubmittingPromo}>
                      {isSubmittingPromo ? "Subscribing..." : "Subscribe"}
                    </button>
                  </form>
                </>
              ) : (
                <div className="promo-success">
                  <h3>You're Subscribed!</h3>
                  <p>Use code below at checkout to enjoy 10% off your first frame:</p>
                  <div className="promo-code-container">
                    <span className="promo-code">MEMORIES10</span>
                    <button className="btn-copy-code" onClick={handleCopyPromoCode}>
                      {copiedCode ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="promo-success-note">We've saved your discount. Use it whenever you are ready.</p>
                  <button className="btn-promo-success-close" onClick={handleClosePromo}>
                    Explore Galleries
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}