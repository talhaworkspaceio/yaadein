// "use client";

// import { useState, useEffect } from "react";
// import { usePathname, useRouter } from "next/navigation";

// const getCart = () => {
//   if (typeof window === "undefined") return [];
//   try {
//     return JSON.parse(localStorage.getItem("fs_cart") || "[]");
//   } catch (e) {
//     return [];
//   }
// };

// export default function Navbar({ onCartOpen, onSearchChange, initialSearchValue = "" }) {
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [cartCount, setCartCount] = useState(0);
//   const [searchVal, setSearchVal] = useState(initialSearchValue);
//   const [scrolled, setScrolled] = useState(false);
//   const pathname = usePathname();
//   const router = useRouter();

//   // Dynamic scroll listener for transparent navbar on homepage
//   useEffect(() => {
//     if (pathname !== "/") {
//       setScrolled(false);
//       return;
//     }
//     const handleScroll = () => {
//       if (window.scrollY > 50) {
//         setScrolled(true);
//       } else {
//         setScrolled(false);
//       }
//     };
//     handleScroll();
//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, [pathname]);

//   // Load and sync cart count
//   useEffect(() => {
//     const updateCount = () => {
//       const cart = getCart();
//       const count = cart.reduce((acc, item) => acc + item.quantity, 0);
//       setCartCount(count);
//     };
//     updateCount();
//     window.addEventListener("fs-cart-updated", updateCount);
//     return () => window.removeEventListener("fs-cart-updated", updateCount);
//   }, []);

//   // Update local search state if initialSearchValue changes
//   useEffect(() => {
//     setSearchVal(initialSearchValue);
//   }, [initialSearchValue]);

//   const handleSearchSubmit = (e) => {
//     e.preventDefault();
//     if (pathname === "/") {
//       if (onSearchChange) {
//         onSearchChange(searchVal);
//       }
//     } else {
//       router.push(`/?search=${encodeURIComponent(searchVal)}`);
//     }
//   };

//   const handleSearchInputChange = (e) => {
//     const val = e.target.value;
//     setSearchVal(val);
//     if (pathname === "/" && onSearchChange) {
//       onSearchChange(val);
//     }
//   };

//   const handleNavClick = (e, path) => {
//     if (path.startsWith("/#") && pathname === "/") {
//       e.preventDefault();
//       const id = path.substring(2);
//       const el = document.getElementById(id);
//       if (el) {
//         el.scrollIntoView({ behavior: "smooth" });
//       }
//       setMobileMenuOpen(false);
//     } else {
//       setMobileMenuOpen(false);
//     }
//   };

//   return (
//     <>
//       <style dangerouslySetInnerHTML={{
//         __html: `
//         .global-navbar {
//           position: sticky;
//           top: 0;
//           left: 0;
//           right: 0;
//           height: 80px;
//           background: rgba(0, 0, 0, 0.95);
//           backdrop-filter: blur(12px);
//           -webkit-backdrop-filter: blur(12px);

//           display: grid;
//           grid-template-columns: 1fr auto 1fr;
//           align-items: center;
//           padding: 0 40px;
//           z-index: 1000;
//           box-shadow: 0 4px 20px rgba(0,0,0,0.5);
//           transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
//         }
//         .global-navbar.transparent {
//           position: absolute;
//           background: transparent !important;
//           box-shadow: none;
//           backdrop-filter: none;
//           -webkit-backdrop-filter: none;
//         }
//         .nav-brand {
//           display: flex;
//           align-items: center;
//           transition: transform 0.2s ease;
//           text-decoration: none;
//           justify-self: start;
//         }
//         .nav-brand:hover {
//           transform: scale(1.03);
//         }
//         .nav-logo-img {
//           height: 38px;
//           width: auto;
//           display: block;
//         }
//         .nav-links-center {
//           display: flex;
//           align-items: center;
//           gap: 28px;
//           justify-self: center;
//         }
//         .nav-link-item {
//           color: var(--text2) !important;
//           text-decoration: none;
//           font-family: var(--font-display);
//           font-weight: 600;
//           font-size: 13px !important;
//           letter-spacing: 0.08em;
//           text-transform: uppercase;
//           transition: color 0.2s ease;
//           cursor: pointer;
//         }
//         .nav-link-item:hover, .nav-link-item.active {
//           color: var(--accent) !important;
//         }

//         .nav-actions-right {
//           display: flex;
//           align-items: center;
//           gap: 20px;
//           justify-self: end;
//         }

//         /* SEARCH CONTAINER */
//         .search-container {
//           position: relative;
//           display: flex;
//           align-items: center;
//           background: rgba(30, 30, 30, 0.7);
//           border: 1px solid var(--border2);
//           border-radius: var(--radius);
//           padding: 6px 12px;
//           transition: all 0.3s ease;
//         }
//         .search-container:focus-within {
//           border-color: var(--accent);
//           box-shadow: 0 0 8px rgba(181, 139, 92, 0.25);
//         }
//         .search-input {
//           background: transparent;
//           border: none;
//           outline: none;
//           color: var(--text);
//           font-family: var(--font-serif);
//           font-size: 13px;
//           width: 130px;
//           transition: width 0.3s ease;
//         }
//         .search-input:focus {
//           width: 180px;
//         }
//         .search-input::placeholder {
//           color: var(--text2);
//           opacity: 0.6;
//         }
//         .search-btn-icon {
//           background: none;
//           border: none;
//           color: var(--text2);
//           cursor: pointer;
//           font-size: 14px;
//           padding: 0;
//           margin-left: 6px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }
//         .search-btn-icon:hover {
//           color: var(--accent);
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
//           color: var(--text);
//         }
//         .btn-nav-cart:hover {
//           transform: scale(1.1);
//         }
//         .cart-icon-svg {
//           width: 22px;
//           height: 22px;
//           color: #FFF;
//           fill: currentColor;
//           display: block;
//         }
//         .cart-badge {
//           position: absolute;
//           top: -2px;
//           right: -4px;
//           background: #FFFFFF;
//           border: 1px solid #000000;
//           color: #000000;
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

//         .menu-btn {
//           display: none;
//           background: none;
//           border: none;
//           color: var(--text);
//           font-size: 24px;
//           cursor: pointer;
//         }

//         /* MOBILE MENU DRAWER */
//         .mobile-menu-drawer {
//           position: fixed;
//           top: 80px;
//           left: 0;
//           right: 0;
//           background: #000000;
//           border-bottom: 3px solid #1a1a1a;
//           box-shadow: 0 10px 30px rgba(0,0,0,0.8);
//           z-index: 999;
//           display: flex;
//           flex-direction: column;
//           padding: 24px 40px;
//           gap: 20px;
//           transform: translateY(-120%);
//           transition: transform 0.3s ease-in-out;
//         }
//         .mobile-menu-drawer.open {
//           transform: translateY(0);
//         }
//         .mobile-nav-link {
//           color: var(--text2) !important;
//           text-decoration: none;
//           font-family: var(--font-display);
//           font-weight: 600;
//           font-size: 15px;
//           letter-spacing: 0.1em;
//           text-transform: uppercase;
//           padding: 8px 0;
//           border-bottom: 1px solid rgba(181, 139, 92, 0.08);
//         }
//         .mobile-nav-link:hover {
//           color: var(--accent) !important;
//         }

//         @media (max-width: 900px) {
//           .global-navbar {
//             padding: 0 24px;
//           }
//           .nav-links-center {
//             display: none;
//           }
//           .menu-btn {
//             display: block;
//           }
//         }

//         @media (max-width: 580px) {
//           .search-input {
//             width: 80px;
//           }
//           .search-input:focus {
//             width: 110px;
//           }
//           .global-navbar {
//             padding: 0 16px;
//             height: 70px;
//           }
//           .mobile-menu-drawer {
//             top: 70px;
//             padding: 20px 24px;
//           }
//         }
//       ` }} />

//     <nav className={`global-navbar ${pathname === "/" && !scrolled ? "transparent" : ""}`}>
//       {/* Actual nav content start */}
//       <a href="/" className="nav-brand">
//         <img src="/images/logo-white.png" alt="Yaadein Logo" className="nav-logo-img" />
//       </a>

//       <div className="nav-links-center">
//         <a href="/" onClick={(e) => handleNavClick(e, "/")} className={`nav-link-item ${pathname === "/" && !searchVal ? "active" : ""}`}>Home</a>
//         <a href="/catalog" className={`nav-link-item ${pathname === "/catalog" ? "active" : ""}`}>Catalog</a>
//         <a href="/new-arrivals" className={`nav-link-item ${pathname === "/new-arrivals" ? "active" : ""}`}>New Arrivals</a>
//         <a href="/services" className={`nav-link-item ${pathname === "/services" ? "active" : ""}`}>Services</a>
//         <a href="/track-order" className={`nav-link-item ${pathname === "/track-order" ? "active" : ""}`}>Track</a>
//         <a href="/contact" className={`nav-link-item ${pathname === "/contact" ? "active" : ""}`}>Contact</a>
//       </div>

//       <div className="nav-actions-right">
//         <form onSubmit={handleSearchSubmit} className="search-container">
//           <input
//             type="text"
//             placeholder="Search"
//             value={searchVal}
//             onChange={handleSearchInputChange}
//             className="search-input"
//           />
//           <button type="submit" className="search-btn-icon" title="Search">
//             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "15px", height: "15px" }}>
//               <circle cx="11" cy="11" r="8"></circle>
//               <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
//             </svg>
//           </button>
//         </form>

//         <button className="btn-nav-cart" onClick={onCartOpen} title="View Cart">
//           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="cart-icon-svg">
//             <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a.75.75 0 1 0 0-1.5.75 0 0 0 0 1.5Zm6 0a.75.75 0 1 0 0-1.5.75 0 0 0 0 1.5Z" clipRule="evenodd" />
//           </svg>
//           <span className="cart-badge">{cartCount}</span>
//         </button>

//         <button className="menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
//           {mobileMenuOpen ? "✕" : "☰"}
//         </button>
//       </div>

//       <div className={`mobile-menu-drawer ${mobileMenuOpen ? "open" : ""}`}>
//         <a href="/" onClick={(e) => handleNavClick(e, "/")} className="mobile-nav-link">Home</a>
//         <a href="/catalog" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Catalog</a>
//         <a href="/new-arrivals" className="mobile-nav-link">New Arrivals</a>
//         <a href="/services" className="mobile-nav-link">Services</a>
//         <a href="/track-order" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Track</a>
//         <a href="/contact" className="mobile-nav-link">Contact</a>
//       </div>
//     </nav>
//     </>
//   );
// }


"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const getCart = () => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("fs_cart") || "[]");
  } catch (e) {
    return [];
  }
};

export default function Navbar({ onCartOpen, onSearchChange, initialSearchValue = "" }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchVal, setSearchVal] = useState(initialSearchValue);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Dynamic scroll listener for transparent navbar on homepage
  useEffect(() => {
    if (pathname !== "/") {
      setScrolled(true); // non-home pages always use the solid navbar look
      return;
    }
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  // Load and sync cart count
  useEffect(() => {
    const updateCount = () => {
      const cart = getCart();
      const count = cart.reduce((acc, item) => acc + item.quantity, 0);
      setCartCount(count);
    };
    updateCount();
    window.addEventListener("fs-cart-updated", updateCount);
    return () => window.removeEventListener("fs-cart-updated", updateCount);
  }, []);

  // Update local search state if initialSearchValue changes
  useEffect(() => {
    setSearchVal(initialSearchValue);
  }, [initialSearchValue]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (pathname === "/") {
      if (onSearchChange) {
        onSearchChange(searchVal);
      }
    } else {
      router.push(`/?search=${encodeURIComponent(searchVal)}`);
    }
  };

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchVal(val);
    if (pathname === "/" && onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleNavClick = (e, path) => {
    if (path.startsWith("/#") && pathname === "/") {
      e.preventDefault();
      const id = path.substring(2);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
      setMobileMenuOpen(false);
    } else {
      setMobileMenuOpen(false);
    }
  };

  // Only the homepage renders its own fullscreen hero that the transparent
  // navbar should overlay. Every other page needs a spacer so its content
  // doesn't get hidden under the now-permanently-fixed navbar.
  const isHome = pathname === "/";

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .global-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 80px;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);

          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 0 40px;
          z-index: 1000;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          transition: background 0.3s ease, box-shadow 0.3s ease, backdrop-filter 0.3s ease;
        }
        .global-navbar.transparent {
          background: transparent !important;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        .nav-spacer {
          height: 80px;
        }
        .nav-brand {
          display: flex;
          align-items: center;
          transition: transform 0.2s ease;
          text-decoration: none;
          justify-self: start;
        }
        .nav-brand:hover {
          transform: scale(1.03);
        }
        .nav-logo-img {
          height: 38px;
          width: auto;
          display: block;
        }
        .nav-links-center {
          display: flex;
          align-items: center;
          gap: 28px;
          justify-self: center;
        }
        .nav-link-item {
          color: var(--text2) !important;
          text-decoration: none;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 13px !important;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: color 0.2s ease;
          cursor: pointer;
        }
        .nav-link-item:hover, .nav-link-item.active {
          color: var(--accent) !important;
        }

        .nav-actions-right {
          display: flex;
          align-items: center;
          gap: 20px;
          justify-self: end;
        }

        /* SEARCH CONTAINER */
        .search-container {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(30, 30, 30, 0.7);
          border: 1px solid var(--border2);
          border-radius: var(--radius);
          padding: 6px 12px;
          transition: all 0.3s ease;
        }
        .search-container:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 8px rgba(181, 139, 92, 0.25);
        }
        .search-input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text);
          font-family: var(--font-serif);
          font-size: 13px;
          width: 130px;
          transition: width 0.3s ease;
        }
        .search-input:focus {
          width: 180px;
        }
        .search-input::placeholder {
          color: var(--text2);
          opacity: 0.6;
        }
        .search-btn-icon {
          background: none;
          border: none;
          color: var(--text2);
          cursor: pointer;
          font-size: 14px;
          padding: 0;
          margin-left: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .search-btn-icon:hover {
          color: var(--accent);
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
          color: var(--text);
        }
        .btn-nav-cart:hover {
          transform: scale(1.1);
        }
        .cart-icon-svg {
          width: 22px;
          height: 22px;
          color: #FFF;
          fill: currentColor;
          display: block;
        }
        .cart-badge {
          position: absolute;
          top: -2px;
          right: -4px;
          background: #FFFFFF;
          border: 1px solid #000000;
          color: #000000;
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

        .menu-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text);
          font-size: 24px;
          cursor: pointer;
        }

        /* MOBILE MENU DRAWER */
        .mobile-menu-drawer {
          position: fixed;
          left: 0;
          right: 0;
          background: #000000;
          border-bottom: 3px solid #1a1a1a;
          box-shadow: 0 10px 30px rgba(0,0,0,0.8);
          z-index: 999;
          display: flex;
          flex-direction: column;
          padding: 24px 40px;
          gap: 20px;
          transform: translateY(-120%);
          transition: transform 0.3s ease-in-out;
        }
        .mobile-menu-drawer.open {
          transform: translateY(0);
        }
        .mobile-nav-link {
          color: var(--text2) !important;
          text-decoration: none;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 15px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 8px 0;
          border-bottom: 1px solid rgba(181, 139, 92, 0.08);
        }
        .mobile-nav-link:hover {
          color: var(--accent) !important;
        }

        @media (max-width: 900px) {
          .global-navbar {
            padding: 0 24px;
          }
          .nav-links-center {
            display: none;
          }
          .menu-btn {
            display: block;
          }
        }

        @media (max-width: 580px) {
          .search-input {
            width: 80px;
          }
          .search-input:focus {
            width: 110px;
          }
          .global-navbar {
            padding: 0 16px;
            height: 70px;
          }
          .nav-spacer {
            height: 70px;
          }
          .mobile-menu-drawer {
            top: 70px;
            padding: 20px 24px;
          }
        }
      ` }} />

      <nav className={`global-navbar ${isHome && !scrolled ? "transparent" : ""}`}>
        {/* Actual nav content start */}
        <a href="/" className="nav-brand">
          <img src="/images/logo-white.png" alt="Yaadein Logo" className="nav-logo-img" />
        </a>

        <div className="nav-links-center">
          <a href="/" onClick={(e) => handleNavClick(e, "/")} className={`nav-link-item ${pathname === "/" && !searchVal ? "active" : ""}`}>Home</a>
          <a href="/catalog" className={`nav-link-item ${pathname === "/catalog" ? "active" : ""}`}>Catalog</a>
          <a href="/services" className={`nav-link-item ${pathname === "/services" ? "active" : ""}`}>Services</a>
          <a href="/track-order" className={`nav-link-item ${pathname === "/track-order" ? "active" : ""}`}>Track</a>
          <a href="/contact" className={`nav-link-item ${pathname === "/contact" ? "active" : ""}`}>Contact</a>
        </div>

        <div className="nav-actions-right">
          <form onSubmit={handleSearchSubmit} className="search-container">
            <input
              type="text"
              placeholder="Search"
              value={searchVal}
              onChange={handleSearchInputChange}
              className="search-input"
            />
            <button type="submit" className="search-btn-icon" title="Search">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "15px", height: "15px" }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>

          <button className="btn-nav-cart" onClick={onCartOpen} title="View Cart">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="cart-icon-svg">
              <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a.75.75 0 1 0 0-1.5.75 0 0 0 0 1.5Zm6 0a.75.75 0 1 0 0-1.5.75 0 0 0 0 1.5Z" clipRule="evenodd" />
            </svg>
            <span className="cart-badge">{cartCount}</span>
          </button>

          <button className="menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        <div className={`mobile-menu-drawer ${mobileMenuOpen ? "open" : ""}`}>
          <a href="/" onClick={(e) => handleNavClick(e, "/")} className="mobile-nav-link">Home</a>
          <a href="/catalog" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Catalog</a>
          <a href="/services" className="mobile-nav-link">Services</a>
          <a href="/track-order" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Track</a>
          <a href="/contact" className="mobile-nav-link">Contact</a>
        </div>
      </nav>

      {/* Spacer: reserves the navbar's height in normal document flow so
        page content isn't hidden behind the now-fixed navbar. Skipped on
        the homepage because the hero section is fullscreen and meant to
        sit behind the transparent navbar. */}
      {!isHome && <div className="nav-spacer" />}
    </>
  );
}