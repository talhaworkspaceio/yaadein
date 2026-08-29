"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>` },
  { href: "/admin/dashboard/reels", label: "Video Reels", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>` },
  { href: "/admin/dashboard/cms-services", label: "Services Content", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>` },
  { href: "/admin/dashboard/pages-builder", label: "Page Builder", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>` },
  { href: "/admin/dashboard/site-content", label: "Site Content & Policies", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>` },
  { href: "/admin/dashboard/frames", label: "Frame Catalog", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>` },
  { href: "/admin/dashboard/orders", label: "Incoming Orders", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>` },
  { href: "/admin/dashboard/customer-queries", label: "Customer Queries", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>` },
  { href: "/admin/dashboard/analytics", label: "Sales Analytics", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>` },
  { href: "/admin/dashboard/categories", label: "Categories", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>` },
  { href: "/admin/dashboard/settings", label: "Settings", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>` }
];


export default function AdminDashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("fs_admin") !== "authenticated") {
        router.push("/admin");
      } else {
        setAuthChecked(true);
      }
    }
  }, [router]);

  if (!authChecked) return null;

  const isActive = (href) => {
    if (href === "/admin/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="admin-root">
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{
        __html: `
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0F0D0B; --surface: #171512; --surface2: #211E1A; --surface3: #2A2620;
          --border: rgba(255,255,255,0.06); --border2: rgba(255,255,255,0.12);
          --text: #F5F0E8; --text2: #A8A08C; --accent: #C9A84C;
          --accent-glow: rgba(201,168,76,0.15); --radius: 12px;
          --gradient-accent: linear-gradient(135deg, #C9A84C 0%, #E8D48B 50%, #C9A84C 100%);
          --gradient-fire: linear-gradient(135deg, #FF3E6C 0%, #FF6B4A 50%, #FFAF38 100%);
        }

        .admin-root {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg); color: var(--text);
          min-height: 100vh; display: flex; flex-direction: column;
        }

        /* ── HEADER ── */
        .admin-header {
          height: 64px;
          background: rgba(23, 21, 18, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px;
          position: sticky; top: 0; z-index: 100;
        }
        .admin-brand {
          font-family: 'DM Serif Display', serif;
          font-size: 20px; color: var(--accent);
          display: flex; align-items: center; gap: 10px;
        }
        .admin-brand-badge {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: var(--bg); background: var(--gradient-accent);
          padding: 3px 8px; border-radius: 4px;
        }
        .admin-header-actions { display: flex; align-items: center; gap: 16px; }
        .admin-logout {
          color: var(--text2); cursor: pointer; border: 1px solid var(--border2);
          background: none; font-size: 12px; font-weight: 600;
          padding: 7px 16px; border-radius: 8px;
          transition: all 0.2s ease; font-family: 'DM Sans', sans-serif;
        }
        .admin-logout:hover { border-color: #FF5A5A; color: #FF7777; }

        /* ── LAYOUT ── */
        .admin-layout { display: flex; flex: 1; min-height: calc(100vh - 64px); }

        /* ── SIDEBAR ── */
        .admin-sidebar {
          width: 260px; background: var(--surface);
          border-right: 1px solid var(--border);
          padding: 24px 0; display: flex; flex-direction: column;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: sticky; top: 64px; height: calc(100vh - 64px);
          overflow-y: auto;
        }
        .sidebar-section-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.12em; color: var(--text2);
          padding: 0 24px; margin-bottom: 8px; margin-top: 8px;
          opacity: 0.6;
        }
        .nav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 24px; margin: 2px 12px;
          color: var(--text2); font-size: 13px; font-weight: 500;
          cursor: pointer; border: none; background: none;
          text-decoration: none; border-radius: 10px;
          transition: all 0.2s ease; position: relative;
          width: calc(100% - 24px); text-align: left;
        }
        .nav-link:hover {
          color: var(--text); background: rgba(255,255,255,0.03);
        }
        .nav-link.active {
          color: var(--accent); background: rgba(201,168,76,0.08);
          font-weight: 600;
        }
        .nav-link.active::before {
          content: ''; position: absolute; left: 0; top: 50%;
          transform: translateY(-50%); width: 3px; height: 20px;
          background: var(--accent); border-radius: 0 3px 3px 0;
        }
        .nav-icon { width: 24px; display: flex; align-items: center; justify-content: center; opacity: 0.8; }
        .sidebar-footer {
          margin-top: auto; padding: 20px 24px;
          border-top: 1px solid var(--border);
        }
        .sidebar-footer-text {
          font-size: 11px; color: var(--text2); opacity: 0.5;
          text-align: center;
        }

        /* ── CONTENT ── */
        .admin-content {
          flex: 1; padding: 32px 40px; overflow-y: auto;
          max-height: calc(100vh - 64px);
        }
        .content-header {
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 28px;
        }
        .content-header h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 26px; font-weight: 400;
        }
        .content-header-sub {
          font-size: 13px; color: var(--text2); margin-top: 4px;
        }

        /* ── SHARED BUTTON STYLES ── */
        .btn-primary {
          background: var(--accent) !important;
          color: #0C0A08 !important;
          border: none !important;
          padding: 10px 24px !important;
          border-radius: 9999px !important;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.05em; text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 4px 15px rgba(201, 168, 76, 0.25);
        }
        .btn-primary:hover {
          background: #E8D48B !important;
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 6px 20px rgba(201, 168, 76, 0.4);
        }
        .btn-primary:disabled {
          opacity: 0.5; cursor: not-allowed;
          transform: none !important;
        }
        .btn-secondary {
          background: var(--surface2) !important;
          color: var(--text) !important;
          border: 1px solid var(--border2) !important;
          padding: 10px 20px !important;
          border-radius: 9999px !important;
          cursor: pointer; font-weight: 700; font-size: 12px;
          text-transform: uppercase; letter-spacing: 0.05em;
          transition: all 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-secondary:hover {
          background: var(--surface3) !important;
          border-color: var(--accent) !important;
        }

        /* ── SHARED CARD / FORM STYLES ── */
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius); padding: 24px;
        }
        .card-glass {
          background: rgba(23, 21, 18, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          border-radius: var(--radius); padding: 24px;
        }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: start; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label {
          font-size: 11px; color: var(--text2);
          text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;
        }
        .form-control {
          background: var(--surface2); border: 1px solid var(--border2);
          color: var(--text); padding: 10px 14px; border-radius: 10px;
          font-size: 13px; outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .form-control:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
        }

        /* ── LIST ITEMS ── */
        .item-list { display: flex; flex-direction: column; gap: 12px; }
        .list-item {
          background: var(--surface2); border: 1px solid var(--border2);
          padding: 16px 20px; border-radius: 10px;
          display: flex; justify-content: space-between; align-items: center;
          transition: border-color 0.2s ease;
        }
        .list-item:hover { border-color: rgba(201,168,76,0.2); }
        .item-title {
          font-family: 'DM Serif Display', serif;
          font-size: 16px; color: var(--accent);
        }
        .item-sub { font-size: 12px; color: var(--text2); margin-top: 4px; }

        /* ── ORDER STYLES ── */
        .order-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 10px; padding: 24px; margin-bottom: 16px;
          transition: border-color 0.2s ease;
        }
        .order-card:hover { border-color: rgba(201,168,76,0.15); }
        .order-header {
          display: flex; justify-content: space-between;
          border-bottom: 1px solid var(--border);
          padding-bottom: 14px; margin-bottom: 14px;
          flex-wrap: wrap; gap: 12px;
        }

        /* ── FILTER STYLES ── */
        .order-filters-bar {
          display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
          margin-bottom: 24px; padding: 18px 20px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 10px;
        }
        .filter-search {
          flex: 1; min-width: 200px;
          background: var(--surface2); border: 1px solid var(--border2);
          color: var(--text); padding: 9px 14px 9px 36px;
          border-radius: 8px; font-size: 13px; outline: none;
          transition: border-color 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .filter-search:focus { border-color: var(--accent); }
        .filter-search::placeholder { color: var(--text2); opacity: 0.7; }
        .filter-search-wrap { position: relative; flex: 1; min-width: 200px; }
        .filter-search-icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); font-size: 14px;
          color: var(--text2); pointer-events: none;
        }
        .filter-select {
          background: var(--surface2); border: 1px solid var(--border2);
          color: var(--text); padding: 9px 14px;
          border-radius: 8px; font-size: 12px; font-weight: 600;
          outline: none; cursor: pointer;
          transition: border-color 0.2s ease;
          font-family: 'DM Sans', sans-serif;
          -webkit-appearance: none; appearance: none;
          min-width: 140px;
        }
        .filter-select:focus { border-color: var(--accent); }
        .filter-select-wrap { position: relative; }
        .filter-select-wrap::after {
          content: '▾'; position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%); font-size: 11px;
          color: var(--text2); pointer-events: none;
        }
        .filter-label {
          font-size: 10px; color: var(--text2); text-transform: uppercase;
          letter-spacing: 0.06em; font-weight: 700;
          margin-bottom: 4px; display: block;
        }
        .filter-group { display: flex; flex-direction: column; }
        .filter-clear-btn {
          background: none; border: 1px solid rgba(255, 90, 90, 0.3);
          color: #FF7777; font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.04em;
          padding: 8px 14px; border-radius: 8px; cursor: pointer;
          transition: all 0.2s ease; white-space: nowrap;
        }
        .filter-clear-btn:hover {
          background: rgba(255, 90, 90, 0.08);
          border-color: #FF5A5A; color: #FF5A5A;
        }

        /* ── LIGHTBOX ── */
        .receipt-lightbox-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0, 0, 0, 0.92);
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          padding: 40px; cursor: zoom-out;
          animation: fadeInLightbox 0.2s ease;
        }
        .receipt-lightbox-overlay img {
          max-width: 90vw; max-height: 85vh; object-fit: contain;
          border-radius: 8px; box-shadow: 0 20px 60px rgba(0,0,0,0.8);
          border: 2px solid rgba(201, 168, 76, 0.3);
        }
        .receipt-lightbox-close {
          position: absolute; top: 20px; right: 24px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff; width: 36px; height: 36px;
          border-radius: 50%; font-size: 18px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s ease;
        }
        .receipt-lightbox-close:hover { background: rgba(255,255,255,0.2); }

        /* ── ANIMATIONS ── */
        @keyframes fadeInLightbox { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-in {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-in-1 { animation-delay: 0.05s; }
        .animate-in-2 { animation-delay: 0.1s; }
        .animate-in-3 { animation-delay: 0.15s; }
        .animate-in-4 { animation-delay: 0.2s; }
        .animate-in-5 { animation-delay: 0.25s; }
      ` }} />

      {pathname === "/admin/dashboard/pages-builder" ? (
        children
      ) : (
        <>
          <header className="admin-header">
        <div className="admin-brand">
          Yaadein
          <span className="admin-brand-badge">Admin</span>
        </div>
        <div className="admin-header-actions">
          <button
            className="admin-logout"
            onClick={() => { sessionStorage.clear(); router.push('/admin'); }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="sidebar-section-label">Navigation</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.href}
              className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
              onClick={() => router.push(item.href)}
            >
              <span className="nav-icon" dangerouslySetInnerHTML={{ __html: item.icon }} />
              {item.label}
            </button>
          ))}
          <div className="sidebar-footer">
            <div className="sidebar-footer-text">Yaadein Admin v2.0</div>
          </div>
        </aside>

        <main className="admin-content">
          {children}
        </main>
      </div>
      </>
      )}
    </div>
  );
}
