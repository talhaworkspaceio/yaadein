// "use client";

// import { useState, useEffect } from "react";
// import { db } from "../../lib/firebase";
// import { ref, push, set, onValue } from "firebase/database";
// import Navbar from "../components/Navbar";
// import Footer from "../components/Footer";

// const CLOUDINARY_CLOUD = "hpikhwjw";
// const CLOUDINARY_PRESET = "ml_default";

// const UPSELL_SERVICES = [
//   {
//     id: "editing",
//     name: "Photo Editing",
//     price: 499,
//     image: "/images/fine_art_printing.png",
//     desc: "Professional color grading, blemish removal, and brightness adjustment."
//   },
//   {
//     id: "restoration",
//     name: "Old Photo Restoration",
//     price: 1499,
//     image: "/images/photo_restoration.png",
//     desc: "Repair cracks, restore faded colors, and upscale resolutions."
//   },
//   {
//     id: "boardgames",
//     name: "Board Games",
//     price: 2499,
//     image: "/images/ludo.png",
//     desc: "Custom framing setup suited for game prints, puzzle setups, or cards."
//   },
//   {
//     id: "nikkah",
//     name: "Nikkah Naama",
//     price: 3999,
//     image: "/images/heritage_conservation.png",
//     desc: "Premium frame treatment with elegant marriage certificate matting style."
//   }
// ];

// // Persistent Cart LocalStorage Helpers
// const getCart = () => {
//   if (typeof window === "undefined") return [];
//   try {
//     return JSON.parse(localStorage.getItem("fs_cart") || "[]");
//   } catch (e) {
//     return [];
//   }
// };

// const clearCart = () => {
//   if (typeof window === "undefined") return;
//   localStorage.removeItem("fs_cart");
//   window.dispatchEvent(new Event("fs-cart-updated"));
// };

// const getWhatsAppNumber = (phone) => {
//   if (!phone) return "";
//   let clean = phone.replace(/\D/g, "");
//   if (clean.startsWith("0")) {
//     clean = "92" + clean.slice(1);
//   }
//   if (clean.length === 10 && !clean.startsWith("92")) {
//     clean = "92" + clean;
//   }
//   return clean;
// };

// export default function CheckoutPage() {
//   const [cartItems, setCartItems] = useState([]);
//   const [formData, setFormData] = useState({
//     name: "",
//     phone: "",
//     email: "",
//     address: "",
//     city: "",
//     state: "",
//     zip: "",
//   });
//   const [orderSuccess, setOrderSuccess] = useState(false);
//   const [orderId, setOrderId] = useState("");
//   const [errorMsg, setErrorMsg] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [selectedServices, setSelectedServices] = useState([]);
//   const [paymentMethod, setPaymentMethod] = useState("EasyPaisa");
//   const [paymentReceipt, setPaymentReceipt] = useState(null);
//   const [deliveryCharges, setDeliveryCharges] = useState(250);
//   const [cartOpen, setCartOpen] = useState(false);
//   const [lightOn, setLightOn] = useState(true);

//   useEffect(() => {
//     const settingsRef = ref(db, "settings/deliveryCharges");
//     const unsub = onValue(settingsRef, (snapshot) => {
//       const val = snapshot.val();
//       if (val !== null) {
//         setDeliveryCharges(parseInt(val) ?? 250);
//       }
//     });
//     return () => unsub();
//   }, []);

//   const toggleService = (service) => {
//     if (selectedServices.some(s => s.id === service.id)) {
//       setSelectedServices(selectedServices.filter(s => s.id !== service.id));
//     } else {
//       setSelectedServices([...selectedServices, service]);
//     }
//   };

//   const handleReceiptChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (uploadEvent) => {
//         setPaymentReceipt(uploadEvent.target.result);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const removeReceipt = () => {
//     setPaymentReceipt(null);
//   };

//   useEffect(() => {
//     const rawCart = getCart();
//     const normalizedCart = rawCart.map(item => {
//       if (item.price && item.price.includes("$")) {
//         const numeric = parseInt(item.price.replace(/[^0-9]/g, "")) || 0;
//         return { ...item, price: `Rs. ${(numeric * 100).toLocaleString()}` };
//       }
//       return item;
//     });
//     setCartItems(normalizedCart);
//   }, []);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const removeCartItem = (index) => {
//     const newCart = [...cartItems];
//     newCart.splice(index, 1);
//     setCartItems(newCart);
//     if (typeof window !== "undefined") {
//       localStorage.setItem("fs_cart", JSON.stringify(newCart));
//       window.dispatchEvent(new Event("fs-cart-updated"));
//     }
//   };

//   const updateCartItemQuantity = (index, delta) => {
//     const newCart = [...cartItems];
//     newCart[index].quantity = Math.max(1, (newCart[index].quantity || 1) + delta);
//     setCartItems(newCart);
//     if (typeof window !== "undefined") {
//       localStorage.setItem("fs_cart", JSON.stringify(newCart));
//       window.dispatchEvent(new Event("fs-cart-updated"));
//     }
//   };

//   const getCartSubtotal = () => {
//     return cartItems.reduce((acc, item) => {
//       const priceVal = parseInt((item.price || "0").replace(/[^0-9]/g, "")) || 0;
//       return acc + priceVal * item.quantity;
//     }, 0);
//   };

//   const framesSubtotal = getCartSubtotal();
//   const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
//   const subtotal = framesSubtotal + servicesTotal;
//   const shipping = framesSubtotal > 0 ? deliveryCharges : 0;
//   const total = subtotal + shipping;

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setErrorMsg("");

//     if (cartItems.length === 0) {
//       setErrorMsg("Your cart is empty. Please add a frame first!");
//       return;
//     }

//     if (
//       !formData.name.trim() ||
//       !formData.phone.trim() ||
//       !formData.email.trim() ||
//       !formData.address.trim() ||
//       !formData.city.trim() ||
//       !formData.state.trim() ||
//       !formData.zip.trim()
//     ) {
//       setErrorMsg("Please fill in all the shipping and contact information fields.");
//       return;
//     }

//     setIsSubmitting(true);
//     const randomId = "FS-" + Math.floor(100000 + Math.random() * 900000);

//     try {
//       // 1. Upload payment receipt screenshot if exists
//       let receiptUrl = "";
//       if (paymentReceipt) {
//         try {
//           const dataUpload = new FormData();
//           dataUpload.append("file", paymentReceipt);
//           dataUpload.append("upload_preset", CLOUDINARY_PRESET);
//           const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
//             method: "POST",
//             body: dataUpload,
//           });
//           if (!res.ok) {
//             throw new Error("Failed to upload payment receipt");
//           }
//           const result = await res.json();
//           receiptUrl = result.secure_url;
//           setPaymentReceipt(receiptUrl);
//         } catch (err) {
//           console.error("Receipt upload error:", err);
//           setErrorMsg("Failed to upload payment receipt screenshot securely. Please try again.");
//           setIsSubmitting(false);
//           return;
//         }
//       }

//       // 2. Process cart items
//       const processedItems = await Promise.all(
//         cartItems.map(async (item) => {
//           if (item.image && item.image.startsWith("data:image")) {
//             try {
//               const dataUpload = new FormData();
//               dataUpload.append("file", item.image);
//               dataUpload.append("upload_preset", CLOUDINARY_PRESET);
//               const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
//                 method: "POST",
//                 body: dataUpload,
//               });
//               if (!res.ok) {
//                 const errData = await res.json();
//                 throw new Error(errData.error?.message || "Failed to upload image to Cloudinary");
//               }
//               const result = await res.json();
//               return { ...item, image: result.secure_url };
//             } catch (err) {
//               console.error("Error uploading image to Cloudinary:", err);
//               return item;
//             }
//           }
//           return item;
//         })
//       );

//       const serviceItems = selectedServices.map(s => ({
//         id: `service-${s.id}`,
//         frameName: `${s.name} (Service Upgrade)`,
//         price: `Rs. ${s.price.toLocaleString()}`,
//         quantity: 1,
//         frameColor: "#1C0F07",
//         size: "Service Upgrade",
//         orientation: "N/A",
//         image: s.image
//       }));

//       const orderData = {
//         customer: {
//           ...formData,
//           fullName: formData.name
//         },
//         items: [...processedItems, ...serviceItems],
//         subtotal,
//         shipping,
//         total,
//         orderId: randomId,
//         paymentMethod,
//         paymentReceiptUrl: receiptUrl,
//         status: "Pending",
//         createdAt: Date.now(),
//       };

//       const ordersRef = ref(db, "orders");
//       const newOrderRef = push(ordersRef);
//       await set(newOrderRef, orderData);

//       setOrderId(randomId);
//       setOrderSuccess(true);

//       // Automated WhatsApp order confirmation message redirect (sends to Studio WhatsApp +923007001977)
//       try {
//         const messageText = `*Yaadein Order Confirmation* 🌟\n\n` +
//           `Order Reference: *${randomId}*\n` +
//           `Customer Name: *${formData.name}*\n` +
//           `Phone: *${formData.phone}*\n` +
//           `Address: *${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}*\n` +
//           `Payment Method: *${paymentMethod}*\n` +
//           `Grand Total: *Rs. ${total.toLocaleString()}*\n\n` +
//           `Please find the attached receipt screenshot below. Thank you!`;
//         const whatsappUrl = `https://wa.me/923007001977?text=${encodeURIComponent(messageText)}`;
//         if (typeof window !== "undefined") {
//           window.open(whatsappUrl, "_blank");
//         }
//       } catch (err) {
//         console.error("Error launching WhatsApp:", err);
//       }

//       // Save to recent orders list
//       if (typeof window !== "undefined") {
//         try {
//           const recent = JSON.parse(localStorage.getItem("recent_orders") || "[]");
//           if (!recent.includes(randomId)) {
//             recent.unshift(randomId);
//             localStorage.setItem("recent_orders", JSON.stringify(recent.slice(0, 5)));
//           }
//         } catch (e) {
//           console.error("Error storing order ID locally:", e);
//         }
//       }

//       clearCart();
//     } catch (err) {
//       console.error("Firebase Order Error:", err);
//       setErrorMsg("Failed to place order securely. Please try again.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="checkout-root">
//       <style dangerouslySetInnerHTML={{
//         __html: `
//         *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

//         .checkout-root {
//           font-family: var(--font-serif);
//           background: var(--bg);
//           color: var(--text);
//           min-height: 100vh;
//           display: flex;
//           flex-direction: column;
//           position: relative;
//         }

//         /* ── DYNAMIC LIQUID BACKDROP ── */
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
//           0% { transform: translate(-20%, -20%) scale(1); }
//           25% { transform: translate(100%, 10%) scale(1.2); }
//           50% { transform: translate(40%, 40%) scale(0.9); }
//           75% { transform: translate(-10%, 30%) scale(1.1); }
//           100% { transform: translate(-20%, -20%) scale(1); }
//         }

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
//           0% { transform: translate(0, 0) scale(1) rotate(0deg); border-radius: 43% 57% 51% 49% / 57% 40% 60% 43%; }
//           33% { transform: translate(80px, -60px) scale(1.15) rotate(45deg); border-radius: 54% 46% 38% 62% / 49% 70% 30% 51%; }
//           66% { transform: translate(-40px, 80px) scale(0.9) rotate(90deg); border-radius: 35% 65% 60% 40% / 50% 35% 65% 50%; }
//           100% { transform: translate(0, 0) scale(1) rotate(180deg); border-radius: 43% 57% 51% 49% / 57% 40% 60% 43%; }
//         }

//         @keyframes liquid-move-2 {
//           0% { transform: translate(0, 0) scale(1) rotate(0deg); border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%; }
//           50% { transform: translate(-100px, 50px) scale(1.2) rotate(120deg); border-radius: 38% 62% 62% 38% / 68% 48% 52% 32%; }
//           100% { transform: translate(60px, -70px) scale(0.9) rotate(-60deg); border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%; }
//         }

//         /* ── HERO BANNER ── */
//         .hero-banner {
//           position: relative;
//           padding: 170px 40px 60px;
//           text-align: center;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           gap: 20px;
//           z-index: 10;
//         }

//         .hero-title {
//           font-family: var(--font-display);
//           font-size: 52px;
//           color: var(--text);
//           letter-spacing: 0.05em;
//         }

//         .hero-title span {
//           color: var(--accent);
//         }

//         .hero-desc {
//           font-family: var(--font-serif);
//           font-size: 16px;
//           color: var(--text2);
//           max-width: 650px;
//           line-height: 1.7;
//         }

//         /* LIGHT SWITCH TOGGLE STYLING */
//         .light-control-panel {
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           background: rgba(20, 17, 14, 0.6);
//           border: 1.5px solid rgba(212, 175, 55, 0.25);
//           padding: 8px 18px;
//           border-radius: 999px;
//           z-index: 30;
//           margin-top: 10px;
//           box-shadow: 0 4px 12px rgba(0,0,0,0.5);
//           transition: border-color 0.3s ease;
//         }
//         .light-control-panel:hover {
//           border-color: rgba(212, 175, 55, 0.5);
//         }
//         .light-control-label {
//           font-family: var(--font-typewriter);
//           font-size: 11px;
//           text-transform: uppercase;
//           letter-spacing: 0.1em;
//           color: #dfc38a;
//           user-select: none;
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

//         /* Suspended Lamp structure */
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
//         .catalog-lamp .lamp-head {
//           width: 440px; /* Cover the title */
//         }
//         .lamp-rod {
//           width: 4px;
//           height: 100vh;
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
//           height: 108px;
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
//           background: linear-gradient(to bottom, #362710 0%, #8f723b 25%, #dfc38a 45%, #fae7b5 55%, #8f723b 75%, #362710 100%);
//           border: 1px solid #1a1205;
//           border-radius: 12px;
//           box-shadow: 0 8px 16px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.3);
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
//         .lamp-bulb {
//           position: absolute;
//           bottom: 0px;
//           left: 15%;
//           right: 15%;
//           height: 4px;
//           background: #fff;
//           border-radius: 2px;
//           box-shadow: 0 0 12px 3px #fae7b5, 0 0 24px 8px #fae7b5;
//           opacity: 0;
//           transition: opacity 0.25s ease;
//           z-index: 5;
//         }
//         .lamp-bulb.on { opacity: 1; }
//         .lamp-light-beam {
//           position: absolute;
//           top: 116px;
//           left: 50%;
//           transform: translateX(-50%);
//           width: 480px;
//           height: 480px;
//           background: radial-gradient(ellipse at top, rgba(255, 238, 180, 0.32) 0%, rgba(255, 238, 180, 0.12) 30%, rgba(255, 238, 180, 0.03) 55%, transparent 70%);
//           filter: blur(30px);
//           pointer-events: none;
//           z-index: 15;
//           opacity: 0;
//           transition: opacity 0.25s ease-in-out;
//         }
//         .lamp-light-beam.on { opacity: 1; }
//         .catalog-lamp .lamp-light-beam {
//           width: 650px;
//           height: 500px;
//           background: radial-gradient(ellipse at top, rgba(255, 238, 180, 0.38) 0%, rgba(255, 238, 180, 0.15) 35%, rgba(255, 238, 180, 0.04) 60%, transparent 75%);
//         }

//         /* GLOW & PARTICLES */
//         .exquisite-glow-container { top: 108px !important; }
//         .lamp-glow-container {
//           position: absolute;
//           left: 50%;
//           transform: translate(-50%, -50%);
//           width: 100px;
//           height: 100px;
//           pointer-events: none;
//         }
//         .glow { display: none !important; }
//         .particles {
//           position: absolute;
//           top: 0;
//           left: 0;
//           width: 100px;
//           height: 100px;
//           opacity: 0;
//           transition: opacity 0.5s ease;
//         }
//         .exquisite-glow-container.on .particles { opacity: 1; }
//         .rotate {
//           position: absolute;
//           top: calc(50% - 5px);
//           left: calc(50% - 5px);
//           width: 10px;
//           height: 10px;
//           animation: rotate 80s linear 0s infinite alternate;
//         }
//         .angle { position: absolute; top: 0; left: 0; }
//         .size { position: absolute; top: 0; left: 0; }
//         .position { position: absolute; top: 0; left: 0; }
//         .pulse { position: absolute; top: 0; left: 0; animation: pulse 4s linear 0s infinite alternate; }
//         .particle { position: absolute; top: calc(50% - 2.5px); left: calc(50% - 2.5px); width: 5px; height: 5px; border-radius: 50%; }
//         .particle::before, .particle::after { content: ''; position: absolute; border-radius: 50%; width: 4px; height: 4px; box-shadow: inherit; }
//         .particle::before { top: -30px; left: 25px; animation: float-firefly-1 15s ease-in-out infinite alternate; }
//         .particle::after { width: 3px; height: 3px; top: 35px; left: -30px; animation: float-firefly-2 18s ease-in-out infinite alternate; }
//         @keyframes rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
//         @keyframes pulse { 0% { transform: scale(1); } 100% { transform: scale(.5); } }
//         @keyframes float-firefly-1 { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-100px, -80px, 0); } }
//         @keyframes float-firefly-2 { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(100px, -120px, 0); } }
//         @keyframes particle-warm {
//           0% { box-shadow: inset 0 0 10px 10px #D4AF37, 0 0 30px 5px #F59E0B, inset 0 0 40px 40px #FFF59D; }
//           33.33% { box-shadow: inset 0 0 10px 10px #D4AF37, 0 0 60px 5px #F59E0B, inset 0 0 25px 25px #FFF59D; }
//           33.34% { box-shadow: inset 0 0 10px 10px #FCD34D, 0 0 30px 5px #FCD34D, inset 0 0 40px 40px #FFF; }
//           66.66% { box-shadow: inset 0 0 10px 10px #FCD34D, 0 0 60px 5px #FCD34D, inset 0 0 25px 25px #FFF; }
//           66.67% { box-shadow: inset 0 0 10px 10px #D97706, 0 0 30px 5px #D97706, inset 0 0 40px 40px #FF8A00; }
//           100% { box-shadow: inset 0 0 10px 10px #D97706, 0 0 60px 5px #D97706, inset 0 0 25px 25px #FF8A00; }
//         }
//         .rotate .angle:nth-child(1) { animation: angle 40s steps(5) 0s infinite; }
//         .rotate .angle:nth-child(1) .size { animation: size 40s steps(5) 0s infinite; }
//         .rotate .angle:nth-child(1) .particle { animation: particle-warm 6s linear infinite alternate; }
//         .rotate .angle:nth-child(1) .position { animation: position 12s linear 0s infinite; }
//         .rotate .angle:nth-child(2) { animation: angle 20s steps(3) -10s infinite; }
//         .rotate .angle:nth-child(2) .size { animation: size 20s steps(3) -10s infinite alternate; }
//         .rotate .angle:nth-child(2) .particle { animation: particle-warm 4.95s linear -3.3s infinite alternate; }
//         .rotate .angle:nth-child(2) .position { animation: position 10s linear 0s infinite; }
//         .rotate .angle:nth-child(3) { animation: angle 55s steps(8) -27.5s infinite; }
//         .rotate .angle:nth-child(3) .size { animation: size 6.88s steps(4) -5.16s infinite alternate; }
//         .rotate .angle:nth-child(3) .particle { animation: particle-warm 5.16s linear -1.72s infinite alternate; }
//         .rotate .angle:nth-child(3) .position { animation: position 1.72s linear 0s infinite; }

//         /* ── LAYOUT ── */
//         .checkout-container {
//           flex: 1;
//           max-width: 1200px;
//           width: 100%;
//           margin: 0 auto;
//           padding: 20px 40px 80px;
//           position: relative;
//           z-index: 10;
//         }

//         /* ── GRID ── */
//         .checkout-grid {
//           display: grid;
//           grid-template-columns: 1.2fr 0.8fr;
//           gap: 48px;
//           align-items: start;
//         }

//         /* ── FORM COLUMN ── */
//         .checkout-main {
//           display: flex;
//           flex-direction: column;
//           gap: 28px;
//         }
//         .checkout-card {
//           background: linear-gradient(135deg, var(--surface) 0%, #100D0B 100%);
//           border: 6px solid #1C0F07;
//           outline: 1px solid var(--accent);
//           outline-offset: -5px;
//           border-radius: var(--radius);
//           padding: 32px;
//           box-shadow: 0 8px 20px rgba(0,0,0,0.6);
//         }
//         .card-title {
//           font-family: var(--font-display);
//           font-size: 20px;
//           color: var(--accent);
//           margin-bottom: 22px;
//           border-bottom: 2px solid #1C0F07;
//           padding-bottom: 12px;
//           letter-spacing: 0.05em;
//         }

//         .form-row {
//           display: grid;
//           grid-template-columns: 1fr 1fr;
//           gap: 16px;
//           margin-bottom: 16px;
//         }
//         .form-group {
//           display: flex;
//           flex-direction: column;
//           gap: 8px;
//           margin-bottom: 16px;
//         }
//         .form-group label {
//           font-family: var(--font-display);
//           font-size: 11px;
//           font-weight: 700;
//           text-transform: uppercase;
//           letter-spacing: 0.08em;
//           color: var(--text2);
//         }
//         .form-control {
//           background: var(--surface2);
//           border: 1px solid var(--border2);
//           border-radius: var(--radius);
//           color: var(--text);
//           padding: 12px 16px;
//           font-family: var(--font-typewriter);
//           font-size: 15px;
//           outline: none;
//           transition: border-color 0.2s ease;
//           width: 100%;
//           -webkit-appearance: none;
//           appearance: none;
//         }
//         .form-control:focus { border-color: var(--accent); }

//         .sub-row {
//           display: grid;
//           grid-template-columns: 1fr 1fr;
//           gap: 12px;
//         }
//         .sub-row .form-group { margin-bottom: 0; }

//         .cod-badge {
//           background: rgba(212, 175, 55, 0.03);
//           border: 1.5px dashed var(--accent);
//           border-radius: var(--radius);
//           padding: 18px;
//           display: flex;
//           gap: 14px;
//           align-items: flex-start;
//           margin-top: 12px;
//         }
//         .cod-icon { font-size: 26px; color: var(--accent); line-height: 1; flex-shrink: 0; }
//         .cod-details h4 {
//           font-family: var(--font-display);
//           font-size: 15px;
//           color: var(--accent);
//           margin-bottom: 4px;
//         }
//         .cod-details p { font-size: 13px; line-height: 1.6; color: var(--text2); }

//         .btn-order {
//           max-width: 280px;
//           width: 100%;
//           margin: 22px auto 0;
//           display: block;
//           padding: 12px 24px !important;
//           border-radius: 9999px !important;
//           background: var(--accent) !important;
//           color: #1A1100 !important;
//           font-family: var(--font-display) !important;
//           font-weight: 700 !important;
//           letter-spacing: 0.08em;
//           text-align: center;
//           cursor: pointer;
//           border: none;
//           box-shadow: 0 4px 12px rgba(201, 168, 76, 0.2);
//           transition: all 0.3s ease;
//           text-transform: uppercase;
//         }
//         .btn-order:hover {
//           background: #dfc38a !important;
//           transform: translateY(-1px);
//         }
//         .btn-order:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }

//         /* ── SIDEBAR ── */
//         .checkout-sidebar {
//           background: linear-gradient(135deg, var(--surface) 0%, #100D0B 100%);
//           border: 6px solid #1C0F07;
//           outline: 1px solid var(--accent);
//           outline-offset: -5px;
//           border-radius: var(--radius);
//           padding: 28px;
//           display: flex;
//           flex-direction: column;
//           gap: 22px;
//           position: sticky;
//           top: 96px;
//           box-shadow: 0 8px 20px rgba(0,0,0,0.6);
//         }
//         .sidebar-title {
//           font-family: var(--font-display);
//           font-size: 18px;
//           color: var(--accent);
//           border-bottom: 2px solid #1C0F07;
//           padding-bottom: 12px;
//           letter-spacing: 0.05em;
//         }
//         .checkout-sidebar-col {
//           display: flex;
//           flex-direction: column;
//           gap: 24px;
//         }
//         .summary-items-list {
//           display: flex;
//           flex-direction: column;
//           gap: 14px;
//           max-height: 320px;
//           overflow-y: auto;
//           padding-right: 16px;
//         }

//         /* CUSTOM THIN SCROLLBAR */
//         .summary-items-list::-webkit-scrollbar {
//           width: 5px;
//         }
//         .summary-items-list::-webkit-scrollbar-track {
//           background: transparent;
//         }
//         .summary-items-list::-webkit-scrollbar-thumb {
//           background: var(--accent);
//           border-radius: 999px;
//         }
//         .summary-items-list::-webkit-scrollbar-thumb:hover {
//           background: #dfc38a;
//         }

//         .summary-item { 
//           display: flex; 
//           gap: 12px; 
//           align-items: center; 
//           background: var(--surface2);
//           border: 2px solid #1C0F07;
//           padding: 8px;
//           border-radius: var(--radius);
//           position: relative;
//         }

//         /* Quantity Counter in Summary */
//         .summary-qty-counter {
//           display: flex;
//           align-items: center;
//           gap: 6px;
//           background: rgba(0, 0, 0, 0.35);
//           border: 1px solid rgba(181, 139, 92, 0.25);
//           border-radius: 9999px;
//           padding: 2px 6px;
//           width: fit-content;
//         }
//         .qty-btn-minus, .qty-btn-plus {
//           background: none;
//           border: none;
//           color: var(--accent);
//           font-size: 13px;
//           cursor: pointer;
//           width: 18px;
//           height: 18px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           transition: all 0.2s ease;
//           outline: none;
//           user-select: none;
//         }
//         .qty-btn-minus:hover, .qty-btn-plus:hover {
//           color: var(--text);
//           transform: scale(1.15);
//         }
//         .qty-val {
//           font-family: var(--font-typewriter);
//           font-size: 11px;
//           color: var(--text);
//           font-weight: 700;
//           min-width: 14px;
//           text-align: center;
//         }
//         .summary-thumb {
//           width: 48px; height: 48px;
//           border-radius: var(--radius);
//           display: flex;
//           flex-shrink: 0;
//           padding: 3px;
//           box-shadow: 0 4px 8px rgba(0,0,0,0.3);
//           background: #111;
//         }
//         .summary-thumb img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius); }
//         .summary-thumb-placeholder {
//           flex: 1;
//           background: #2D2822;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 16px;
//           color: rgba(201,168,76,0.15);
//         }
//         .summary-details { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; padding-right: 20px; }
//         .summary-name {
//           font-family: var(--font-display);
//           font-size: 13px;
//           color: var(--text);
//           white-space: nowrap;
//           overflow: hidden;
//           text-overflow: ellipsis;
//         }
//         .summary-meta { font-family: var(--font-typewriter); font-size: 9px; color: var(--text2); text-transform: uppercase; }
//         .summary-price-row { display: flex; justify-content: space-between; font-size: 12px; color: var(--text2); }
//         .summary-price { font-family: var(--font-typewriter); color: var(--accent); font-weight: 700; }

//         .btn-summary-remove {
//           position: absolute;
//           top: 6px;
//           right: 8px;
//           background: none;
//           border: none;
//           color: rgba(255, 90, 90, 0.6);
//           font-size: 18px;
//           cursor: pointer;
//           line-height: 1;
//           transition: color 0.15s ease;
//           padding: 4px;
//           z-index: 10;
//         }
//         .btn-summary-remove:hover {
//           color: #FF5A5A;
//         }

//         .summary-totals {
//           border-top: 2px solid #1C0F07;
//           padding-top: 16px;
//           display: flex;
//           flex-direction: column;
//           gap: 10px;
//         }
//         .totals-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text2); }
//         .totals-row.grand {
//           font-family: var(--font-display);
//           font-size: 18px;
//           color: var(--text);
//           border-top: 2px solid #1C0F07;
//           padding-top: 12px;
//           margin-top: 4px;
//         }
//         .totals-row.grand span:last-child { font-family: var(--font-typewriter); color: var(--accent); }

//         .error-message {
//           background: rgba(255, 90, 90, 0.08);
//           border: 1px solid #FF5A5A;
//           color: #FF7777;
//           border-radius: var(--radius);
//           padding: 12px 16px;
//           font-size: 13px;
//           margin-bottom: 16px;
//           text-align: center;
//           font-family: var(--font-typewriter);
//         }

//         /* ── SUCCESS ── */
//         .success-card {
//           max-width: 560px;
//           margin: 52px auto;
//           background: linear-gradient(135deg, var(--surface) 0%, #100D0B 100%);
//           border: 6px solid #1C0F07;
//           outline: 1.5px solid var(--accent);
//           outline-offset: -5px;
//           border-radius: var(--radius);
//           padding: 48px;
//           text-align: center;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           gap: 18px;
//           box-shadow: 0 20px 50px rgba(0,0,0,0.7);
//         }
//         .success-icon { font-size: 52px; color: var(--accent); animation: scaleIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275); }
//         .success-title { font-family: var(--font-display); font-size: 30px; color: var(--accent); letter-spacing: 0.05em; }
//         .success-order-id {
//           font-family: var(--font-typewriter);
//           font-size: 12px; font-weight: 700;
//           color: var(--accent);
//           background: rgba(201,168,76,0.08);
//           padding: 8px 16px; border-radius: var(--radius);
//           border: 1px solid rgba(201,168,76,0.25);
//         }
//         .success-desc { font-size: 14px; line-height: 1.6; color: var(--text2); max-width: 420px; }
//         .success-summary {
//           width: 100%;
//           background: var(--surface2);
//           border: 3px solid #1C0F07;
//           outline: 1px solid var(--border);
//           outline-offset: -3px;
//           border-radius: var(--radius);
//           padding: 20px;
//           text-align: left;
//           display: flex;
//           flex-direction: column;
//           gap: 10px;
//           margin-top: 8px;
//         }
//         .success-summary h4 {
//           font-family: var(--font-display);
//           font-size: 15px; color: var(--accent);
//           border-bottom: 2px solid #1C0F07;
//           padding-bottom: 8px;
//           letter-spacing: 0.05em;
//         }
//         .success-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text2); gap: 12px; }
//         .success-row strong { color: var(--text); text-align: right; }
//         .btn-success {
//           margin-top: 8px;
//         }

//         @keyframes scaleIn {
//           from { transform: scale(0); }
//           to   { transform: scale(1); }
//         }

//         /* ── TABLET ── */
//         @media (max-width: 900px) {
//           .checkout-container { padding: 36px 28px; }
//           .checkout-grid {
//             grid-template-columns: 1fr;
//             gap: 24px;
//           }
//           .checkout-sidebar {
//             position: static;
//             order: -1;
//           }
//         }

//         /* ── MOBILE ── */
//         @media (max-width: 580px) {
//           .checkout-container {
//             padding: 20px 16px 48px;
//             display: flex;
//             flex-direction: column;
//             align-items: center;
//           }
//           .checkout-main-form { width: 100%; }
//           .checkout-grid {
//             width: 100%;
//             grid-template-columns: 1fr;
//             gap: 18px;
//           }
//           .checkout-card  { padding: 18px 16px; border-radius: var(--radius); }
//           .checkout-sidebar { padding: 18px 16px; border-radius: var(--radius); }
//           .card-title     { font-size: 18px; margin-bottom: 16px; }
//           .sidebar-title  { font-size: 17px; }
//           .form-row { grid-template-columns: 1fr !important; gap: 0; margin-bottom: 0; }
//           .sub-row { grid-template-columns: 1fr 1fr; gap: 10px; }
//           .form-group { margin-bottom: 14px; }
//           .form-group label { font-size: 10px; }
//           .form-control { padding: 13px 14px; }
//           .cod-badge { padding: 14px; gap: 12px; }
//           .cod-icon  { font-size: 22px; }
//           .cod-details h4 { font-size: 13px; }
//           .cod-details p  { font-size: 11px; }
//           .btn-order { padding: 12px 24px; font-size: 13px; margin-top: 18px; border-radius: 9999px !important; }
//           .summary-items-list { max-height: 190px; }
//           .totals-row.grand   { font-size: 17px; }
//           .success-card  { margin: 20px 0 40px; padding: 28px 18px; border-radius: var(--radius); gap: 14px; }
//           .success-title { font-size: 24px; }
//           .success-icon  { font-size: 42px; }
//           .success-summary { padding: 16px; }
//           .success-row   { font-size: 12px; }
//         }

//         /* ── RECEIPT UPLOADER ── */
//         .receipt-uploader-zone {
//           margin-top: 10px;
//           border: 2px dashed rgba(181, 139, 92, 0.3);
//           border-radius: var(--radius);
//           padding: 24px;
//           text-align: center;
//           background: rgba(30, 25, 20, 0.2);
//           transition: all 0.3s ease;
//           position: relative;
//           cursor: pointer;
//         }
//         .receipt-uploader-zone:hover {
//           border-color: var(--accent);
//           background: rgba(181, 139, 92, 0.03);
//         }
//         .upload-receipt-input {
//           position: absolute;
//           inset: 0;
//           width: 100%;
//           height: 100%;
//           opacity: 0;
//           cursor: pointer;
//           z-index: 10;
//         }
//         .uploader-prompt-content {
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           gap: 8px;
//           pointer-events: none;
//         }
//         .uploader-prompt-icon {
//           font-size: 32px;
//           color: var(--accent);
//         }
//         .uploader-prompt-title {
//           font-family: var(--font-display);
//           font-size: 14px;
//           font-weight: 600;
//           color: var(--text);
//         }
//         .uploader-prompt-desc {
//           font-size: 11px;
//           color: var(--text2);
//         }

//         .receipt-preview-container {
//           margin-top: 10px;
//           border: 2px solid rgba(181, 139, 92, 0.25);
//           border-radius: var(--radius);
//           background: rgba(30, 25, 20, 0.5);
//           overflow: hidden;
//           position: relative;
//         }
//         .receipt-preview-image-wrapper {
//           width: 100%;
//           max-height: 340px;
//           overflow: hidden;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           background: #0A0806;
//           cursor: pointer;
//           position: relative;
//         }
//         .receipt-preview-image-wrapper img {
//           width: 100%;
//           max-height: 340px;
//           object-fit: contain;
//           display: block;
//           transition: transform 0.3s ease;
//         }
//         .receipt-preview-image-wrapper:hover img {
//           transform: scale(1.02);
//         }
//         .receipt-preview-image-wrapper::after {
//           content: 'Click to view full size';
//           position: absolute;
//           bottom: 0;
//           left: 0;
//           right: 0;
//           padding: 8px;
//           background: linear-gradient(transparent, rgba(0,0,0,0.7));
//           color: rgba(255,255,255,0.5);
//           font-size: 10px;
//           text-align: center;
//           font-family: var(--font-display);
//           letter-spacing: 0.05em;
//           text-transform: uppercase;
//           opacity: 0;
//           transition: opacity 0.3s ease;
//         }
//         .receipt-preview-image-wrapper:hover::after {
//           opacity: 1;
//         }
//         .receipt-preview-footer {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           padding: 12px 16px;
//           border-top: 1px solid rgba(181, 139, 92, 0.15);
//           background: rgba(20, 17, 14, 0.6);
//         }
//         .receipt-preview-info {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//         }
//         .receipt-preview-check {
//           width: 24px;
//           height: 24px;
//           border-radius: 50%;
//           background: rgba(68, 212, 136, 0.12);
//           border: 1.5px solid #44D488;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 12px;
//           color: #44D488;
//           flex-shrink: 0;
//         }
//         .receipt-preview-details {
//           display: flex;
//           flex-direction: column;
//           gap: 2px;
//         }
//         .receipt-preview-title {
//           font-family: var(--font-display);
//           font-size: 12px;
//           font-weight: 600;
//           color: var(--text);
//         }
//         .receipt-preview-status {
//           font-size: 10px;
//           color: #44D488;
//           display: flex;
//           align-items: center;
//           gap: 4px;
//         }
//         .btn-remove-receipt {
//           background: none;
//           border: 1px solid rgba(255, 90, 90, 0.3);
//           color: #FF7777;
//           font-family: var(--font-display);
//           font-size: 10px;
//           font-weight: 700;
//           text-transform: uppercase;
//           letter-spacing: 0.05em;
//           padding: 6px 14px;
//           border-radius: var(--radius);
//           cursor: pointer;
//           transition: all 0.2s ease;
//           flex-shrink: 0;
//         }
//         .btn-remove-receipt:hover {
//           background: rgba(255, 90, 90, 0.08);
//           border-color: #FF5A5A;
//           color: #FF5A5A;
//         }

//         /* ── RECEIPT LIGHTBOX ── */
//         .receipt-lightbox-overlay {
//           position: fixed;
//           inset: 0;
//           z-index: 9999;
//           background: rgba(0, 0, 0, 0.9);
//           backdrop-filter: blur(8px);
//           -webkit-backdrop-filter: blur(8px);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           padding: 40px;
//           cursor: zoom-out;
//           animation: fadeInLightbox 0.25s ease;
//         }
//         .receipt-lightbox-overlay img {
//           max-width: 90vw;
//           max-height: 85vh;
//           object-fit: contain;
//           border-radius: var(--radius);
//           box-shadow: 0 20px 60px rgba(0,0,0,0.8);
//           border: 2px solid rgba(181, 139, 92, 0.3);
//         }
//         .receipt-lightbox-close {
//           position: absolute;
//           top: 20px;
//           right: 24px;
//           background: rgba(255,255,255,0.1);
//           border: 1px solid rgba(255,255,255,0.2);
//           color: #fff;
//           width: 36px;
//           height: 36px;
//           border-radius: 50%;
//           font-size: 18px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           cursor: pointer;
//           transition: all 0.2s ease;
//         }
//         .receipt-lightbox-close:hover {
//           background: rgba(255,255,255,0.2);
//         }
//         @keyframes fadeInLightbox {
//           from { opacity: 0; }
//           to { opacity: 1; }
//         }

//         /* ── DELIVERY NOTIFICATION ── */
//         .delivery-timeline-note {
//           background: rgba(181, 139, 92, 0.04);
//           border: 1px solid rgba(181, 139, 92, 0.2);
//           border-radius: var(--radius);
//           padding: 14px 18px;
//           margin-top: 18px;
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           text-align: left;
//         }
//         .delivery-timeline-icon {
//           font-size: 20px;
//           color: var(--accent);
//           flex-shrink: 0;
//         }
//         .delivery-timeline-text {
//           font-size: 12px;
//           line-height: 1.5;
//           color: var(--text2);
//         }
//         .delivery-timeline-text strong {
//           color: var(--accent);
//         }

//         /* ── ADDITIONAL SERVICES UPSELL ── */
//         .services-upsell-grid {
//           display: flex;
//           flex-direction: column;
//           gap: 12px;
//           margin-top: 10px;
//         }
//         .upsell-card {
//           background: rgba(30, 25, 20, 0.4);
//           border: 2px solid #1C0F07;
//           border-radius: var(--radius);
//           padding: 12px;
//           cursor: pointer;
//           transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
//           display: flex;
//           flex-direction: row;
//           gap: 14px;
//           align-items: center;
//           position: relative;
//           text-align: left;
//         }
//         .upsell-card:hover {
//           border-color: rgba(181, 139, 92, 0.4);
//           transform: translateY(-1px);
//           box-shadow: 0 4px 10px rgba(0,0,0,0.3);
//         }
//         .upsell-card.selected {
//           border-color: var(--accent);
//           background: rgba(181, 139, 92, 0.05);
//           box-shadow: 0 0 10px rgba(181, 139, 92, 0.1);
//         }
//         .upsell-header-image {
//           width: 70px;
//           height: 70px;
//           border-radius: 12px;
//           overflow: hidden;
//           flex-shrink: 0;
//         }
//         .upsell-header-image img {
//           width: 100%;
//           height: 100%;
//           object-fit: cover;
//         }
//         .upsell-details {
//           display: flex;
//           flex-direction: column;
//           gap: 4px;
//           flex-grow: 1;
//           min-width: 0;
//         }
//         .upsell-meta-row {
//           display: flex;
//           justify-content: space-between;
//           align-items: baseline;
//           gap: 8px;
//         }
//         .upsell-name {
//           font-family: var(--font-display);
//           font-size: 13px;
//           color: var(--text);
//           font-weight: 700;
//           white-space: nowrap;
//           overflow: hidden;
//           text-overflow: ellipsis;
//         }
//         .upsell-price-tag {
//           font-size: 12px;
//           font-weight: 700;
//           color: var(--accent);
//           flex-shrink: 0;
//         }
//         .upsell-desc {
//           font-size: 11px;
//           color: var(--text2);
//           line-height: 1.4;
//           display: -webkit-box;
//           -webkit-line-clamp: 2;
//           -webkit-box-orient: vertical;
//           overflow: hidden;
//           text-overflow: ellipsis;
//         }
//         .btn-upsell-action {
//           align-self: flex-start;
//           width: auto;
//           background: transparent;
//           border: 1px solid rgba(181, 139, 92, 0.3);
//           color: var(--accent);
//           font-family: var(--font-display);
//           font-size: 9px;
//           font-weight: 700;
//           text-transform: uppercase;
//           letter-spacing: 0.05em;
//           padding: 4px 10px;
//           border-radius: 9999px;
//           cursor: pointer;
//           transition: all 0.2s ease;
//           margin-top: 2px;
//           pointer-events: none;
//         }
//         .upsell-card:hover .btn-upsell-action {
//           background: rgba(181, 139, 92, 0.05);
//           border-color: var(--accent);
//         }
//         .upsell-card.selected .btn-upsell-action {
//           background: var(--accent);
//           color: #1A1100;
//           border-color: var(--accent);
//         }

//         /* ── PAYMENT TABS ── */
//         .payment-tabs {
//           display: grid;
//           grid-template-columns: repeat(3, 1fr);
//           gap: 12px;
//           margin-bottom: 20px;
//           margin-top: 12px;
//         }
//         .payment-tab-btn {
//           background: rgba(30, 25, 20, 0.4);
//           border: 2px solid #1C0F07;
//           color: var(--text2);
//           font-family: var(--font-display);
//           font-size: 12px;
//           font-weight: 600;
//           padding: 14px;
//           border-radius: var(--radius);
//           cursor: pointer;
//           transition: all 0.2s ease;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           gap: 6px;
//         }
//         .payment-tab-btn:hover {
//           border-color: rgba(181, 139, 92, 0.3);
//           color: var(--text);
//         }
//         .payment-tab-btn.active {
//           border-color: var(--accent);
//           background: rgba(181, 139, 92, 0.05);
//           color: var(--accent);
//         }
//         .payment-tab-icon {
//           font-size: 20px;
//         }

//         .payment-method-details-box {
//           background: rgba(20, 16, 12, 0.6);
//           border: 1px solid var(--border2);
//           border-radius: var(--radius);
//           padding: 20px;
//           margin-top: 16px;
//           text-align: left;
//         }
//         .payment-details-pane strong {
//           font-family: var(--font-display);
//           font-size: 14px;
//           color: var(--accent);
//           display: block;
//           margin-bottom: 8px;
//         }
//         .payment-details-pane p {
//           font-size: 13px;
//           line-height: 1.6;
//           color: var(--text2);
//           margin-bottom: 14px;
//         }
//         .pane-info-row {
//           display: flex;
//           justify-content: space-between;
//           font-size: 13px;
//           border-bottom: 1px dashed rgba(181,139,92,0.1);
//           padding: 8px 0;
//         }
//         .pane-info-row span {
//           color: var(--text2);
//         }
//         .pane-info-row strong {
//           font-family: var(--font-typewriter);
//           color: var(--text);
//           display: inline;
//           margin-bottom: 0;
//         }

//         /* ── SUCCESS SCREEN PAYMENT INSTRUCTIONS ── */
//         .payment-instructions-card {
//           width: 100%;
//           background: rgba(181, 139, 92, 0.04);
//           border: 2px dashed var(--accent);
//           border-radius: var(--radius);
//           padding: 20px;
//           text-align: left;
//           margin-top: 14px;
//           box-shadow: 0 4px 12px rgba(0,0,0,0.3);
//         }
//         .payment-instructions-card h4 {
//           font-family: var(--font-display);
//           font-size: 14px;
//           color: var(--accent);
//           margin-bottom: 12px;
//           text-transform: uppercase;
//           letter-spacing: 0.05em;
//         }
//         .payment-instructions-card p {
//           font-size: 13px;
//           line-height: 1.6;
//           color: var(--text2);
//           margin-bottom: 12px;
//         }
//         .account-info-box {
//           background: rgba(0,0,0,0.3);
//           border: 1px solid rgba(181, 139, 92, 0.2);
//           padding: 12px;
//           border-radius: var(--radius);
//           margin-bottom: 12px;
//           display: flex;
//           flex-direction: column;
//           gap: 6px;
//         }
//         .account-info-box div {
//           display: flex;
//           justify-content: space-between;
//           font-size: 13px;
//         }
//         .account-info-box div span {
//           color: var(--text2);
//         }
//         .account-info-box div strong {
//           color: var(--text);
//           font-family: var(--font-typewriter);
//         }
//         .instruction-note {
//           font-size: 12px !important;
//           line-height: 1.5;
//           color: var(--accent) !important;
//           font-style: italic;
//           margin-bottom: 0 !important;
//         }
//       ` }} />

//       {/* DYNAMIC LIQUID BACKDROP ELEMENTS */}
//       <div className="catalog-glass-bg">
//         <div className="liquid-blob-1" />
//         <div className="liquid-blob-2" />
//         <div className="catalog-glow" />
//       </div>

//       {/* Frosted Glass overlay sheet */}
//       <div className="catalog-glass-pane" />

//       {/* NAVBAR */}
//       <Navbar onCartOpen={() => setCartOpen(true)} />

//       {/* HERO BANNER BLOCK WITH TITLE & LAMP */}
//       <div className="hero-banner">
//         {/* Suspended Brass Lamp */}
//         <div className={`exquisite-lamp catalog-lamp ${lightOn ? 'on' : ''}`}>
//           <div className="lamp-rod" />
//           <div className="lamp-mount" />
//           <div className="lamp-arm" />
//           <div className="lamp-head">
//             <div className={`lamp-bulb ${lightOn ? 'on' : ''}`} />
//           </div>
//           <div className={`lamp-light-beam ${lightOn ? 'on' : ''}`} />
//           <div className={`lamp-glow-container exquisite-glow-container ${lightOn ? 'on' : ''}`}>
//             <div className="glow" style={{ display: 'none' }}></div>
//             <div className="particles">
//               <div className="rotate">
//                 <div className="angle"><div className="size"><div className="position"><div className="pulse"><div className="particle"></div></div></div></div></div>
//                 <div className="angle"><div className="size"><div className="position"><div className="pulse"><div className="particle"></div></div></div></div></div>
//                 <div className="angle"><div className="size"><div className="position"><div className="pulse"><div className="particle"></div></div></div></div></div>
//               </div>
//             </div>
//           </div>
//         </div>

//         <h1 className="hero-title">Secure <span>Checkout</span></h1>
//         <p className="hero-desc">
//           Review your order details and complete your prepaid digital transfer to initiate framing.
//         </p>
//         {/* Toggle switch panel */}
//         <div className="light-control-panel">
//           <span className="light-control-label">Light Switch</span>
//           <button
//             className={`light-switch-btn ${lightOn ? 'on' : ''}`}
//             onClick={() => setLightOn(!lightOn)}
//             type="button"
//             aria-label="Toggle Studio Light"
//           >
//             <span className="light-switch-knob" />
//           </button>
//         </div>
//       </div>

//       {/* BODY */}
//       <div className="checkout-container">
//         {orderSuccess ? (
//           <div className="success-card" style={{ position: "relative", zIndex: 10 }}>
//             <div className="success-icon">✓</div>
//             <h2 className="success-title">Order Placed!</h2>
//             <div className="success-order-id">Reference: {orderId}</div>
//             <p className="success-desc">
//               Thank you for framing with us. Our master craftsmen in Pakistan will begin hand-building your premium customized frames immediately.
//             </p>
//             <div className="success-summary">
//               <h4>Delivery Details</h4>
//               <div className="success-row">
//                 <span>Recipient:</span>
//                 <strong>{formData.name}</strong>
//               </div>
//               <div className="success-row">
//                 <span>Phone:</span>
//                 <strong>{formData.phone}</strong>
//               </div>
//               <div className="success-row">
//                 <span>Delivery Address:</span>
//                 <strong style={{ textAlign: "right", maxWidth: "220px" }}>
//                   {formData.address}, {formData.city}, {formData.state} {formData.zip}
//                 </strong>
//               </div>
//               <div className="success-row">
//                 <span>Payment Method:</span>
//                 <strong>{paymentMethod}</strong>
//               </div>
//               <div className="success-row" style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "4px" }}>
//                 <span>Amount Transferred:</span>
//                 <strong style={{ color: "var(--accent)", fontSize: "16px" }}>Rs. {total.toLocaleString()}</strong>
//               </div>
//             </div>

//             {paymentReceipt && (
//               <div className="success-summary" style={{ marginTop: "14px", textRendering: "optimizeLegibility" }}>
//                 <h4>Payment Receipt Submitted</h4>
//                 <div style={{ width: "100%", height: "140px", borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid rgba(181,139,92,0.2)", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                   <img src={paymentReceipt} alt="Receipt Screenshot" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
//                 </div>
//                 <p style={{ fontSize: "11px", color: "#44D488", marginTop: "6px", textAlign: "center" }}>✓ Screenshot attached and saved securely.</p>
//               </div>
//             )}

//             <div className="payment-instructions-card">
//               <h4>Prepaid Transfer Instructions</h4>
//               {paymentMethod === "EasyPaisa" && (
//                 <div className="instruction-details">
//                   <p>Please transfer the total of <strong>Rs. {total.toLocaleString()}</strong> to our EasyPaisa mobile account:</p>
//                   <div className="account-info-box">
//                     <div><span>Account Title:</span> <strong>Yaadein Art Studio</strong></div>
//                     <div><span>Mobile Number:</span> <strong>+92 311 8372465</strong></div>
//                   </div>
//                   <p className="instruction-note">Once paid, share the payment receipt screenshot with Reference ID <strong>{orderId}</strong> on WhatsApp at <strong>+92 311 8372465</strong>.</p>
//                 </div>
//               )}
//               {paymentMethod === "JazzCash" && (
//                 <div className="instruction-details">
//                   <p>Please transfer the total of <strong>Rs. {total.toLocaleString()}</strong> to our JazzCash mobile account:</p>
//                   <div className="account-info-box">
//                     <div><span>Account Title:</span> <strong>Yaadein Art Studio</strong></div>
//                     <div><span>Mobile Number:</span> <strong>0300-7654321</strong></div>
//                   </div>
//                   <p className="instruction-note">Once paid, share the payment receipt screenshot with Reference ID <strong>{orderId}</strong> on WhatsApp at <strong>+92 311 8372465</strong>.</p>
//                 </div>
//               )}
//               {paymentMethod === "Bank Transfer" && (
//                 <div className="instruction-details">
//                   <p>Please transfer the total of <strong>Rs. {total.toLocaleString()}</strong> to our Bank account via banking app or ATM:</p>
//                   <div className="account-info-box">
//                     <div><span>Bank Name:</span> <strong>Bank Alfalah</strong></div>
//                     <div><span>Account Title:</span> <strong>Yaadein Art Studio</strong></div>
//                     <div><span>Account Number:</span> <strong>0123-4567-8910-1112</strong></div>
//                     <div><span>IBAN:</span> <strong>PK12ALFH0123456789101112</strong></div>
//                   </div>
//                   <p className="instruction-note">Once paid, share the payment receipt screenshot with Reference ID <strong>{orderId}</strong> on WhatsApp at <strong>+92 311 8372465</strong>.</p>
//                 </div>
//               )}
//             </div>
//             <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", marginTop: "16px" }}>
//               <a
//                 href={`https://wa.me/923007001977?text=${encodeURIComponent(
//                   `*Yaadein Order Receipt* 🌟\n\n` +
//                   `Order Reference: *${orderId}*\n` +
//                   `Customer Name: *${formData.name}*\n` +
//                   `Phone: *${formData.phone}*\n` +
//                   `Grand Total: *Rs. ${total.toLocaleString()}*\n\n` +
//                   `Attached is my receipt screenshot reference. Please confirm my order status!`
//                 )}`}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="btn-success"
//                 style={{
//                   textAlign: "center",
//                   width: "100%",
//                   background: "#25D366",
//                   color: "#FFFFFF",
//                   boxShadow: "0 4px 15px rgba(37, 211, 102, 0.25)",
//                   display: "block",
//                   padding: "12px",
//                   borderRadius: "var(--radius)",
//                   textDecoration: "none",
//                   fontWeight: "bold"
//                 }}
//               >
//                 💬 Send Receipt Screenshot via WhatsApp
//               </a>
//               <a href={`/track-order?id=${orderId}`} className="btn-success" style={{ textAlign: "center", width: "100%", display: "block", padding: "12px", borderRadius: "var(--radius)", textDecoration: "none", background: "var(--accent)", color: "#1A1100", fontWeight: "bold" }}>
//                 Track Order Status
//               </a>
//               <a href="/" className="btn-success" style={{
//                 textAlign: "center",
//                 width: "100%",
//                 background: "rgba(20, 17, 14, 0.6)",
//                 border: "1.5px solid var(--accent)",
//                 color: "var(--accent)",
//                 boxShadow: "none",
//                 display: "block",
//                 padding: "12px",
//                 borderRadius: "var(--radius)",
//                 textDecoration: "none"
//               }}>
//                 Back to Gallery
//               </a>
//             </div>
//           </div>
//         ) : (
//           <form onSubmit={handleSubmit} className="checkout-main-form">
//             <div className="checkout-grid">

//               {/* ── LEFT: FORM ── */}
//               <div className="checkout-main">
//                 {errorMsg && <div className="error-message">{errorMsg}</div>}

//                 <div className="checkout-card">
//                   <h3 className="card-title">1. Delivery Information</h3>

//                   <div className="form-group">
//                     <label>Full Name</label>
//                     <input
//                       type="text" name="name" className="form-control"
//                       placeholder="e.g. Ali Khan"
//                       required
//                       value={formData.name} onChange={handleChange}
//                     />
//                   </div>

//                   <div className="form-row">
//                     <div className="form-group">
//                       <label>Email Address</label>
//                       <input
//                         type="email" name="email" className="form-control"
//                         placeholder="e.g. ali@example.com"
//                         required
//                         value={formData.email} onChange={handleChange}
//                       />
//                     </div>
//                     <div className="form-group">
//                       <label>Phone Number</label>
//                       <input
//                         type="tel" name="phone" className="form-control"
//                         placeholder="e.g. +92 300 1234567"
//                         required
//                         value={formData.phone} onChange={handleChange}
//                       />
//                     </div>
//                   </div>

//                   <div className="form-group">
//                     <label>Street Address</label>
//                     <input
//                       type="text" name="address" className="form-control"
//                       placeholder="House, Street, Area"
//                       required
//                       value={formData.address} onChange={handleChange}
//                     />
//                   </div>

//                   {/* City row */}
//                   <div className="form-row">
//                     <div className="form-group">
//                       <label>City</label>
//                       <input
//                         type="text" name="city" className="form-control"
//                         placeholder="e.g. Lahore"
//                         required
//                         value={formData.city} onChange={handleChange}
//                       />
//                     </div>

//                     {/* Province / State + ZIP Code */}
//                     <div className="sub-row">
//                       <div className="form-group">
//                         <label>Province</label>
//                         <input
//                           type="text" name="state" className="form-control"
//                           placeholder="e.g. Punjab"
//                           required
//                           value={formData.state} onChange={handleChange}
//                         />
//                       </div>
//                       <div className="form-group">
//                         <label>ZIP Code</label>
//                         <input
//                           type="text" name="zip" className="form-control"
//                           placeholder="ZIP"
//                           required
//                           value={formData.zip} onChange={handleChange}
//                         />
//                       </div>
//                     </div>
//                   </div>

//                   {/* Delivery Timeline Note */}
//                   <div className="delivery-timeline-note">
//                     <span className="delivery-timeline-icon">🚚</span>
//                     <p className="delivery-timeline-text">
//                       <strong>14-Day Standard Delivery:</strong> Because every frame is custom handcrafted to your specifications by our master craftsmen, please allow up to <strong>14 working days</strong> for production and shipment delivery.
//                     </p>
//                   </div>
//                 </div>

//                 {/* ── SECTION 2: PAYMENT OPTIONS ── */}
//                 <div className="checkout-card">
//                   <h3 className="card-title">2. Payment Method</h3>
//                   <p style={{ color: "var(--text2)", fontSize: "13px", marginBottom: "18px", textAlign: "left" }}>
//                     We support secure prepaid digital transfers. Please select your preferred method:
//                   </p>

//                   <div className="payment-tabs">
//                     <button
//                       type="button"
//                       className={`payment-tab-btn ${paymentMethod === 'EasyPaisa' ? 'active' : ''}`}
//                       onClick={() => setPaymentMethod('EasyPaisa')}
//                     >
//                       <span className="payment-tab-icon">📱</span>
//                       EasyPaisa
//                     </button>
//                     <button
//                       type="button"
//                       className={`payment-tab-btn ${paymentMethod === 'JazzCash' ? 'active' : ''}`}
//                       onClick={() => setPaymentMethod('JazzCash')}
//                     >
//                       <span className="payment-tab-icon">💸</span>
//                       JazzCash
//                     </button>
//                     <button
//                       type="button"
//                       className={`payment-tab-btn ${paymentMethod === 'Bank Transfer' ? 'active' : ''}`}
//                       onClick={() => setPaymentMethod('Bank Transfer')}
//                     >
//                       <span className="payment-tab-icon">🏦</span>
//                       Bank Transfer
//                     </button>
//                   </div>

//                   <div className="payment-method-details-box">
//                     {paymentMethod === 'EasyPaisa' && (
//                       <div className="payment-details-pane">
//                         <strong>EasyPaisa Mobile Wallet</strong>
//                         <p>Transfer the final invoice amount directly to our EasyPaisa account.</p>
//                         <div className="pane-info-row">
//                           <span>Account Title:</span> <strong>Yaadein Art Studio</strong>
//                         </div>
//                         <div className="pane-info-row">
//                           <span>Mobile Number:</span> <strong>+92 311 8372465</strong>
//                         </div>
//                       </div>
//                     )}
//                     {paymentMethod === 'JazzCash' && (
//                       <div className="payment-details-pane">
//                         <strong>JazzCash Mobile Wallet</strong>
//                         <p>Transfer the final invoice amount directly to our JazzCash account.</p>
//                         <div className="pane-info-row">
//                           <span>Account Title:</span> <strong>Yaadein Art Studio</strong>
//                         </div>
//                         <div className="pane-info-row">
//                           <span>Mobile Number:</span> <strong>0300-7654321</strong>
//                         </div>
//                       </div>
//                     )}
//                     {paymentMethod === 'Bank Transfer' && (
//                       <div className="payment-details-pane">
//                         <strong>Direct Bank Transfer</strong>
//                         <p>Transfer the final invoice amount to our Bank Alfalah business account via internet banking, ATM, or bank deposit.</p>
//                         <div className="pane-info-row">
//                           <span>Bank Name:</span> <strong>Bank Alfalah</strong>
//                         </div>
//                         <div className="pane-info-row">
//                           <span>Account Title:</span> <strong>Yaadein Art Studio</strong>
//                         </div>
//                         <div className="pane-info-row">
//                           <span>Account Number:</span> <strong>0123-4567-8910-1112</strong>
//                         </div>
//                         <div className="pane-info-row">
//                           <span>IBAN:</span> <strong>PK12ALFH0123456789101112</strong>
//                         </div>
//                       </div>
//                     )}
//                   </div>

//                   {/* Receipt screenshot uploader */}
//                   <div style={{ marginTop: "18px", padding: "16px", background: "rgba(20, 16, 12, 0.4)", border: "1px dashed rgba(181, 139, 92, 0.3)", borderRadius: "var(--radius)", textAlign: "left" }}>
//                     <p style={{ fontSize: "12px", lineHeight: "1.6", color: "var(--text2)", marginBottom: "12px" }}>
//                       💡 <strong>Verification Receipt:</strong> Upload your transfer screenshot below. Alternatively, if you are ordering from a PC, you can transfer from your phone and send the receipt screenshot to our WhatsApp at <strong>+92 311 8372465</strong> along with your name.
//                     </p>

//                     {!paymentReceipt ? (
//                       <div className="receipt-uploader-zone">
//                         <input
//                           type="file"
//                           accept="image/*"
//                           onChange={handleReceiptChange}
//                           className="upload-receipt-input"
//                           id="receipt-file-input"
//                         />
//                         <div className="uploader-prompt-content">
//                           <span className="uploader-prompt-icon">📸</span>
//                           <span className="uploader-prompt-title">Upload Payment Receipt Screenshot</span>
//                           <span className="uploader-prompt-desc">Tap or drag image here (Optional)</span>
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="receipt-preview-container">
//                         <div
//                           className="receipt-preview-image-wrapper"
//                           onClick={() => {
//                             const overlay = document.createElement('div');
//                             overlay.className = 'receipt-lightbox-overlay';
//                             overlay.onclick = () => overlay.remove();
//                             const closeBtn = document.createElement('button');
//                             closeBtn.className = 'receipt-lightbox-close';
//                             closeBtn.innerHTML = '✕';
//                             closeBtn.onclick = (e) => { e.stopPropagation(); overlay.remove(); };
//                             const img = document.createElement('img');
//                             img.src = paymentReceipt;
//                             img.alt = 'Payment Receipt Full View';
//                             overlay.appendChild(closeBtn);
//                             overlay.appendChild(img);
//                             document.body.appendChild(overlay);
//                           }}
//                         >
//                           <img src={paymentReceipt} alt="Payment Receipt Preview" />
//                         </div>
//                         <div className="receipt-preview-footer">
//                           <div className="receipt-preview-info">
//                             <div className="receipt-preview-check">✓</div>
//                             <div className="receipt-preview-details">
//                               <span className="receipt-preview-title">Receipt screenshot</span>
//                               <span className="receipt-preview-status">✓ Ready to submit</span>
//                             </div>
//                           </div>
//                           <button
//                             type="button"
//                             onClick={removeReceipt}
//                             className="btn-remove-receipt"
//                           >
//                             Remove
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>

//                   <button type="submit" className="btn-order" disabled={isSubmitting}>
//                     {isSubmitting ? "Placing Order..." : "Place Order"}
//                   </button>
//                 </div>
//               </div>

//               {/* ── RIGHT: SIDEBAR COLUMN ── */}
//               <div className="checkout-sidebar-col">
//                 <div className="checkout-sidebar">
//                   <h3 className="sidebar-title">Order Summary</h3>

//                   <div className="summary-items-list">
//                     {cartItems.length === 0 ? (
//                       <div style={{ color: "var(--text2)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
//                         No custom frames in order summary.
//                       </div>
//                     ) : (
//                       <>
//                         {cartItems.map((item, idx) => (
//                           <div key={idx} className="summary-item">
//                             <div className="summary-thumb" style={{ background: item.frameColor }}>
//                               {item.image ? (
//                                 <img src={item.image} alt={item.frameName} />
//                               ) : (
//                                 <div className="summary-thumb-placeholder">Y</div>
//                               )}
//                             </div>
//                             <div className="summary-details">
//                               <h4 className="summary-name">{item.frameName}</h4>
//                               <span className="summary-meta">{item.rotation !== 0 ? `Rotated ${item.rotation}°` : "Portrait"}</span>
//                               <div className="summary-price-row">
//                                 <div className="summary-qty-counter">
//                                   <button
//                                     type="button"
//                                     className="qty-btn-minus"
//                                     onClick={() => updateCartItemQuantity(idx, -1)}
//                                   >
//                                     –
//                                   </button>
//                                   <span className="qty-val">{item.quantity || 1}</span>
//                                   <button
//                                     type="button"
//                                     className="qty-btn-plus"
//                                     onClick={() => updateCartItemQuantity(idx, 1)}
//                                   >
//                                     +
//                                   </button>
//                                 </div>
//                                 <span className="summary-price">{item.price}</span>
//                               </div>
//                             </div>
//                             <button
//                               type="button"
//                               className="btn-summary-remove"
//                               onClick={() => removeCartItem(idx)}
//                               title="Remove Frame"
//                             >
//                               ×
//                             </button>
//                           </div>
//                         ))}
//                         {selectedServices.map((service, idx) => (
//                           <div key={`service-${idx}`} className="summary-item" style={{ borderStyle: "dashed", borderColor: "rgba(181, 139, 92, 0.3)" }}>
//                             <div className="summary-thumb">
//                               <img src={service.image} alt={service.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius)" }} />
//                             </div>
//                             <div className="summary-details">
//                               <h4 className="summary-name">{service.name}</h4>
//                               <span className="summary-meta">Service Upgrade</span>
//                               <div className="summary-price-row">
//                                 <span>Qty: 1</span>
//                                 <span className="summary-price">Rs. {service.price.toLocaleString()}</span>
//                               </div>
//                             </div>
//                             <button
//                               type="button"
//                               className="btn-summary-remove"
//                               onClick={() => toggleService(service)}
//                               title="Remove Service"
//                             >
//                               ×
//                             </button>
//                           </div>
//                         ))}
//                       </>
//                     )}
//                   </div>

//                   <div className="summary-totals">
//                     <div className="totals-row">
//                       <span>Subtotal</span>
//                       <span>Rs. {subtotal.toLocaleString()}</span>
//                     </div>
//                     <div className="totals-row">
//                       <span>Courier Delivery (14-day Standard)</span>
//                       <span>{shipping > 0 ? `Rs. ${shipping.toLocaleString()}` : "Rs. 0"}</span>
//                     </div>
//                     <div className="totals-row grand">
//                       <span>Grand Total</span>
//                       <span>Rs. {total.toLocaleString()}</span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* ── SECTION 3: ADDITIONAL SERVICES UPSELL (Enhance Your Memories) ── */}
//                 <div className="checkout-card">
//                   <h3 className="card-title">3. Enhance Your Memories</h3>
//                   <p style={{ color: "var(--text2)", fontSize: "13px", marginBottom: "18px", lineHeight: "1.5", textAlign: "left" }}>
//                     Select professional studio services to complement your premium handcrafted frames.
//                   </p>
//                   <div className="services-upsell-grid">
//                     {UPSELL_SERVICES.map((service) => {
//                       const isSelected = selectedServices.some(s => s.id === service.id);
//                       return (
//                         <div
//                           key={service.id}
//                           className={`upsell-card ${isSelected ? 'selected' : ''}`}
//                           onClick={() => toggleService(service)}
//                         >
//                           <div className="upsell-header-image">
//                             <img src={service.image} alt={service.name} />
//                           </div>
//                           <div className="upsell-details">
//                             <div className="upsell-meta-row">
//                               <h4 className="upsell-name">{service.name}</h4>
//                               <span className="upsell-price-tag">+Rs. {service.price.toLocaleString()}</span>
//                             </div>
//                             <p className="upsell-desc">{service.desc}</p>
//                             <button
//                               type="button"
//                               className={`btn-upsell-action ${isSelected ? 'added' : ''}`}
//                             >
//                               {isSelected ? "✓ Added" : "+ Add Service"}
//                             </button>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </div>
//               </div>

//             </div>
//           </form>
//         )}
//       </div>

//       <Footer />
//     </div>
//   );
// }


"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { ref, push, set, onValue } from "firebase/database";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const CLOUDINARY_CLOUD = "hpikhwjw";
const CLOUDINARY_PRESET = "ml_default";

const UPSELL_SERVICES = [
  {
    id: "editing",
    name: "Photo Editing",
    price: 499,
    image: "/images/fine_art_printing.png",
    desc: "Professional color grading, blemish removal, and brightness adjustment."
  },
  {
    id: "restoration",
    name: "Old Photo Restoration",
    price: 1499,
    image: "/images/photo_restoration.png",
    desc: "Repair cracks, restore faded colors, and upscale resolutions."
  },
  {
    id: "boardgames",
    name: "Board Games",
    price: 2499,
    image: "/images/ludo.png",
    desc: "Custom framing setup suited for game prints, puzzle setups, or cards."
  },
  {
    id: "nikkah",
    name: "Nikkah Naama",
    price: 3999,
    image: "/images/heritage_conservation.png",
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
  const [cartOpen, setCartOpen] = useState(false);
  const [lightOn, setLightOn] = useState(true);

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

  const removeCartItem = (index) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    setCartItems(newCart);
    if (typeof window !== "undefined") {
      localStorage.setItem("fs_cart", JSON.stringify(newCart));
      window.dispatchEvent(new Event("fs-cart-updated"));
    }
  };

  const updateCartItemQuantity = (index, delta) => {
    const newCart = [...cartItems];
    newCart[index].quantity = Math.max(1, (newCart[index].quantity || 1) + delta);
    setCartItems(newCart);
    if (typeof window !== "undefined") {
      localStorage.setItem("fs_cart", JSON.stringify(newCart));
      window.dispatchEvent(new Event("fs-cart-updated"));
    }
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

    if (cartItems.length === 0 && selectedServices.length === 0) {
      setErrorMsg("Your cart is empty. Please add a frame or service first!");
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
      setErrorMsg("Please upload your payment receipt screenshot before placing the order.");
      return;
    }

    setIsSubmitting(true);
    const randomId = "FS-" + Math.floor(100000 + Math.random() * 900000);

    try {
      // 1. Upload payment receipt screenshot if exists
      let receiptUrl = "";
      if (paymentReceipt) {
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
        image: s.image
      }));

      const orderData = {
        customer: {
          ...formData,
          fullName: formData.name
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

      // Automated WhatsApp order confirmation message redirect (sends to Studio WhatsApp +923007001977)
      try {
        const messageText = `*Yaadein Order Confirmation* 🌟\n\n` +
          `Order Reference: *${randomId}*\n` +
          `Customer Name: *${formData.name}*\n` +
          `Phone: *${formData.phone}*\n` +
          `Address: *${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}*\n` +
          `Payment Method: *${paymentMethod}*\n` +
          `Grand Total: *Rs. ${total.toLocaleString()}*\n\n` +
          `Please find the attached receipt screenshot below. Thank you!`;
        const whatsappUrl = `https://wa.me/923007001977?text=${encodeURIComponent(messageText)}`;
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
          position: relative;
        }

        /* ── DYNAMIC LIQUID BACKDROP ── */
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

        /* ── HERO BANNER ── */
        .hero-banner {
          position: relative;
          padding: 170px 40px 60px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          z-index: 10;
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

        /* Suspended Lamp structure */
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
        .catalog-lamp .lamp-head {
          width: 440px; /* Cover the title */
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
          background: linear-gradient(to bottom, #362710 0%, #8f723b 25%, #dfc38a 45%, #fae7b5 55%, #8f723b 75%, #362710 100%);
          border: 1px solid #1a1205;
          border-radius: 12px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.3);
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
        .lamp-light-beam.on { opacity: 1; }
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



        /* ── LAYOUT ── */
        .checkout-container {
          flex: 1;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 20px 40px 80px;
          position: relative;
          z-index: 10;
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

        .sub-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .sub-row .form-group { margin-bottom: 0; }

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
          max-width: 280px !important;
          width: 100% !important;
          height: 48px !important;
          margin: 18px auto 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-sizing: border-box !important;
          padding: 0 24px !important;
          border-radius: 9999px !important;
          background: var(--accent) !important;
          color: #1A1100 !important;
          font-family: var(--font-display) !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          letter-spacing: 0.08em !important;
          text-align: center !important;
          cursor: pointer !important;
          border: none !important;
          box-shadow: 0 4px 12px rgba(201, 168, 76, 0.2) !important;
          transition: all 0.3s ease !important;
          text-transform: uppercase !important;
          text-decoration: none !important;
          line-height: 1 !important;
        }
        .btn-order:hover:not(:disabled) {
          background: #dfc38a !important;
          transform: translateY(-1px);
        }
        .btn-order:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

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
        .checkout-sidebar-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .summary-items-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-height: 320px;
          overflow-y: auto;
          padding-right: 16px;
        }

        /* CUSTOM THIN SCROLLBAR */
        .summary-items-list::-webkit-scrollbar {
          width: 5px;
        }
        .summary-items-list::-webkit-scrollbar-track {
          background: transparent;
        }
        .summary-items-list::-webkit-scrollbar-thumb {
          background: var(--accent);
          border-radius: 999px;
        }
        .summary-items-list::-webkit-scrollbar-thumb:hover {
          background: #dfc38a;
        }

        .summary-item { 
          display: flex; 
          gap: 12px; 
          align-items: center; 
          background: var(--surface2);
          border: 2px solid #1C0F07;
          padding: 8px;
          border-radius: var(--radius);
          position: relative;
        }

        /* Quantity Counter in Summary */
        .summary-qty-counter {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(181, 139, 92, 0.25);
          border-radius: 9999px;
          padding: 2px 6px;
          width: fit-content;
        }
        .qty-btn-minus, .qty-btn-plus {
          background: none;
          border: none;
          color: var(--accent);
          font-size: 13px;
          cursor: pointer;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          outline: none;
          user-select: none;
        }
        .qty-btn-minus:hover, .qty-btn-plus:hover {
          color: var(--text);
          transform: scale(1.15);
        }
        .qty-val {
          font-family: var(--font-typewriter);
          font-size: 11px;
          color: var(--text);
          font-weight: 700;
          min-width: 14px;
          text-align: center;
        }
        .summary-thumb {
          width: 48px; height: 48px;
          border-radius: var(--radius);
          display: flex;
          flex-shrink: 0;
          padding: 3px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          background: #111;
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
        .summary-details { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; padding-right: 20px; }
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

        .btn-summary-remove {
          position: absolute;
          top: 6px;
          right: 8px;
          background: none;
          border: none;
          color: rgba(255, 90, 90, 0.6);
          font-size: 18px;
          cursor: pointer;
          line-height: 1;
          transition: color 0.15s ease;
          padding: 4px;
          z-index: 10;
        }
        .btn-summary-remove:hover {
          color: #FF5A5A;
        }

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
          .btn-order { padding: 12px 24px; font-size: 13px; margin-top: 18px; border-radius: 9999px !important; }
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
          margin-top: 10px;
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
          margin-top: 10px;
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
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 10px;
        }
        .upsell-card {
          background: rgba(30, 25, 20, 0.4);
          border: 2px solid #1C0F07;
          border-radius: var(--radius);
          padding: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
          display: flex;
          flex-direction: row;
          gap: 14px;
          align-items: center;
          position: relative;
          text-align: left;
        }
        .upsell-card:hover {
          border-color: rgba(181, 139, 92, 0.4);
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }
        .upsell-card.selected {
          border-color: var(--accent);
          background: rgba(181, 139, 92, 0.05);
          box-shadow: 0 0 10px rgba(181, 139, 92, 0.1);
        }
        .upsell-header-image {
          width: 70px;
          height: 70px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .upsell-header-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .upsell-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex-grow: 1;
          min-width: 0;
        }
        .upsell-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 8px;
        }
        .upsell-name {
          font-family: var(--font-display);
          font-size: 13px;
          color: var(--text);
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .upsell-price-tag {
          font-size: 12px;
          font-weight: 700;
          color: var(--accent);
          flex-shrink: 0;
        }
        .upsell-desc {
          font-size: 11px;
          color: var(--text2);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .btn-upsell-action {
          align-self: flex-start;
          width: auto;
          background: transparent;
          border: 1px solid rgba(181, 139, 92, 0.3);
          color: var(--accent);
          font-family: var(--font-display);
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 10px;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 2px;
          pointer-events: none;
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

      {/* DYNAMIC LIQUID BACKDROP ELEMENTS */}
      <div className="catalog-glass-bg">
        <div className="liquid-blob-1" />
        <div className="liquid-blob-2" />
        <div className="catalog-glow" />
      </div>

      {/* Frosted Glass overlay sheet */}
      <div className="catalog-glass-pane" />

      {/* NAVBAR */}
      <Navbar onCartOpen={() => setCartOpen(true)} />

      {/* HERO BANNER BLOCK WITH TITLE & LAMP */}
      <div className="hero-banner">
        {/* Suspended Brass Lamp */}
        <div className={`exquisite-lamp catalog-lamp ${lightOn ? 'on' : ''}`}>
          <div className="lamp-rod" />
          <div className="lamp-mount" />
          <div className="lamp-arm" />
          <div className="lamp-head">
            <div className={`lamp-bulb ${lightOn ? 'on' : ''}`} />
          </div>
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

        <h1 className="hero-title">Secure <span>Checkout</span></h1>
        <p className="hero-desc">
          Review your order details and complete your prepaid digital transfer to initiate framing.
        </p>
        {/* Toggle switch panel */}
        <div className="light-control-panel">
          <span className="light-control-label">Light Switch</span>
          <button
            className={`light-switch-btn ${lightOn ? 'on' : ''}`}
            onClick={() => setLightOn(!lightOn)}
            type="button"
            aria-label="Toggle Studio Light"
          >
            <span className="light-switch-knob" />
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="checkout-container">
        {orderSuccess ? (
          <div className="success-card" style={{ position: "relative", zIndex: 10 }}>
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
              </div>
              <div className="success-row">
                <span>Payment Method:</span>
                <strong>{paymentMethod}</strong>
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
                    <div><span>Mobile Number:</span> <strong>+92 311 8372465</strong></div>
                  </div>
                  <p className="instruction-note">Once paid, share the payment receipt screenshot with Reference ID <strong>{orderId}</strong> on WhatsApp at <strong>+92 311 8372465</strong>.</p>
                </div>
              )}
              {paymentMethod === "JazzCash" && (
                <div className="instruction-details">
                  <p>Please transfer the total of <strong>Rs. {total.toLocaleString()}</strong> to our JazzCash mobile account:</p>
                  <div className="account-info-box">
                    <div><span>Account Title:</span> <strong>Yaadein Art Studio</strong></div>
                    <div><span>Mobile Number:</span> <strong>0300-7654321</strong></div>
                  </div>
                  <p className="instruction-note">Once paid, share the payment receipt screenshot with Reference ID <strong>{orderId}</strong> on WhatsApp at <strong>+92 311 8372465</strong>.</p>
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
                  <p className="instruction-note">Once paid, share the payment receipt screenshot with Reference ID <strong>{orderId}</strong> on WhatsApp at <strong>+92 311 8372465</strong>.</p>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", marginTop: "16px" }}>
              <a
                href={`https://wa.me/923007001977?text=${encodeURIComponent(
                  `*Yaadein Order Receipt* 🌟\n\n` +
                  `Order Reference: *${orderId}*\n` +
                  `Customer Name: *${formData.name}*\n` +
                  `Phone: *${formData.phone}*\n` +
                  `Grand Total: *Rs. ${total.toLocaleString()}*\n\n` +
                  `Attached is my receipt screenshot reference. Please confirm my order status!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-success"
                style={{
                  textAlign: "center",
                  width: "100%",
                  background: "#25D366",
                  color: "#FFFFFF",
                  boxShadow: "0 4px 15px rgba(37, 211, 102, 0.25)",
                  display: "block",
                  padding: "12px",
                  borderRadius: "var(--radius)",
                  textDecoration: "none",
                  fontWeight: "bold"
                }}
              >
                💬 Send Receipt Screenshot via WhatsApp
              </a>
              <a href={`/track-order?id=${orderId}`} className="btn-success" style={{ textAlign: "center", width: "100%", display: "block", padding: "12px", borderRadius: "var(--radius)", textDecoration: "none", background: "var(--accent)", color: "#1A1100", fontWeight: "bold" }}>
                Track Order Status
              </a>
              <a href="/" className="btn-success" style={{
                textAlign: "center",
                width: "100%",
                background: "rgba(20, 17, 14, 0.6)",
                border: "1.5px solid var(--accent)",
                color: "var(--accent)",
                boxShadow: "none",
                display: "block",
                padding: "12px",
                borderRadius: "var(--radius)",
                textDecoration: "none"
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
                      required
                      value={formData.name} onChange={handleChange}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email" name="email" className="form-control"
                        placeholder="e.g. ali@example.com"
                        required
                        value={formData.email} onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel" name="phone" className="form-control"
                        placeholder="e.g. +92 300 1234567"
                        required
                        value={formData.phone} onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Street Address</label>
                    <input
                      type="text" name="address" className="form-control"
                      placeholder="House, Street, Area"
                      required
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
                        required
                        value={formData.city} onChange={handleChange}
                      />
                    </div>

                    {/* Province / State + ZIP Code */}
                    <div className="sub-row">
                      <div className="form-group">
                        <label>Province</label>
                        <input
                          type="text" name="state" className="form-control"
                          placeholder="e.g. Punjab"
                          required
                          value={formData.state} onChange={handleChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>ZIP Code</label>
                        <input
                          type="text" name="zip" className="form-control"
                          placeholder="ZIP"
                          required
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

                {/* ── SECTION 2: PAYMENT OPTIONS ── */}
                <div className="checkout-card">
                  <h3 className="card-title">2. Payment Method</h3>
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
                        <p>Transfer the final invoice amount directly to our EasyPaisa account.</p>
                        <div className="pane-info-row">
                          <span>Account Title:</span> <strong>Yaadein Art Studio</strong>
                        </div>
                        <div className="pane-info-row">
                          <span>Mobile Number:</span> <strong>+92 311 8372465</strong>
                        </div>
                      </div>
                    )}
                    {paymentMethod === 'JazzCash' && (
                      <div className="payment-details-pane">
                        <strong>JazzCash Mobile Wallet</strong>
                        <p>Transfer the final invoice amount directly to our JazzCash account.</p>
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
                  <div style={{ marginTop: "18px", padding: "16px", background: "rgba(20, 16, 12, 0.4)", border: "1px dashed rgba(181, 139, 92, 0.3)", borderRadius: "var(--radius)", textAlign: "left" }}>
                    <p style={{ fontSize: "12px", lineHeight: "1.6", color: "var(--text2)", marginBottom: "12px" }}>
                      💡 <strong>Verification Receipt:</strong> Upload your transfer screenshot below. Alternatively, if you are ordering from a PC, you can transfer from your phone and send the receipt screenshot to our WhatsApp at <strong>+92 311 8372465</strong> along with your name.
                    </p>
                    {!paymentReceipt ? (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReceiptChange}
                          id="receipt-file-input"
                          style={{ display: "none" }}
                        />
                        <label htmlFor="receipt-file-input" className="btn-order">
                          Upload Receipt
                        </label>
                      </>
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
                              <span className="receipt-preview-title">Receipt screenshot</span>
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
                  </div>

                  <button type="submit" className="btn-order" disabled={isSubmitting || !paymentReceipt}>
                    {isSubmitting ? "Placing Order..." : "Place Order"}
                  </button>
                </div>
              </div>

              {/* ── RIGHT: SIDEBAR COLUMN ── */}
              <div className="checkout-sidebar-col">
                <div className="checkout-sidebar">
                  <h3 className="sidebar-title">Order Summary</h3>

                  <div className="summary-items-list">
                    {cartItems.length === 0 && selectedServices.length === 0 ? (
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
                                <div className="summary-qty-counter">
                                  <button
                                    type="button"
                                    className="qty-btn-minus"
                                    onClick={() => updateCartItemQuantity(idx, -1)}
                                  >
                                    –
                                  </button>
                                  <span className="qty-val">{item.quantity || 1}</span>
                                  <button
                                    type="button"
                                    className="qty-btn-plus"
                                    onClick={() => updateCartItemQuantity(idx, 1)}
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="summary-price">{item.price}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn-summary-remove"
                              onClick={() => removeCartItem(idx)}
                              title="Remove Frame"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {selectedServices.map((service, idx) => (
                          <div key={`service-${idx}`} className="summary-item" style={{ borderStyle: "dashed", borderColor: "rgba(181, 139, 92, 0.3)" }}>
                            <div className="summary-thumb">
                              <img src={service.image} alt={service.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius)" }} />
                            </div>
                            <div className="summary-details">
                              <h4 className="summary-name">{service.name}</h4>
                              <span className="summary-meta">Service Upgrade</span>
                              <div className="summary-price-row">
                                <span>Qty: 1</span>
                                <span className="summary-price">Rs. {service.price.toLocaleString()}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn-summary-remove"
                              onClick={() => toggleService(service)}
                              title="Remove Service"
                            >
                              ×
                            </button>
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

                {/* ── SECTION 3: ADDITIONAL SERVICES UPSELL (Enhance Your Memories) ── */}
                <div className="checkout-card">
                  <h3 className="card-title">3. Enhance Your Memories</h3>
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
                          <div className="upsell-header-image">
                            <img src={service.image} alt={service.name} />
                          </div>
                          <div className="upsell-details">
                            <div className="upsell-meta-row">
                              <h4 className="upsell-name">{service.name}</h4>
                              <span className="upsell-price-tag">+Rs. {service.price.toLocaleString()}</span>
                            </div>
                            <p className="upsell-desc">{service.desc}</p>
                            <button
                              type="button"
                              className={`btn-upsell-action ${isSelected ? 'added' : ''}`}
                            >
                              {isSelected ? "✓ Added" : "+ Add Service"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </form>
        )}
      </div>

      <Footer />
    </div>
  );
}