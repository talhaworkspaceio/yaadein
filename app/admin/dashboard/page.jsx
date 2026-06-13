"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { ref, onValue } from "firebase/database";

// ── Animated counter hook ──
function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const start = prevTarget.current;
    const diff = target - start;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
    prevTarget.current = target;
  }, [target, duration]);

  return count;
}

// ── Status badge colors ──
const STATUS_COLORS = {
  Pending: { bg: "rgba(255, 175, 56, 0.12)", text: "#FFAF38", border: "rgba(255, 175, 56, 0.25)" },
  Processing: { bg: "rgba(56, 152, 255, 0.12)", text: "#3898FF", border: "rgba(56, 152, 255, 0.25)" },
  Shipped: { bg: "rgba(139, 92, 246, 0.12)", text: "#8B5CF6", border: "rgba(139, 92, 246, 0.25)" },
  Delivered: { bg: "rgba(34, 197, 94, 0.12)", text: "#22C55E", border: "rgba(34, 197, 94, 0.25)" },
  Cancelled: { bg: "rgba(255, 90, 90, 0.12)", text: "#FF5A5A", border: "rgba(255, 90, 90, 0.25)" },
};

export default function DashboardOverview() {
  const router = useRouter();
  const [frames, setFrames] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const unsubFrames = onValue(ref(db, "frames"), (snap) => {
      const d = snap.val();
      setFrames(d ? Object.entries(d).map(([k, v]) => ({ docId: k, ...v })) : []);
    });
    const unsubOrders = onValue(ref(db, "orders"), (snap) => {
      const d = snap.val();
      if (d) {
        const list = Object.entries(d).map(([k, v]) => ({ docId: k, ...v }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setOrders(list);
      } else setOrders([]);
    });
    const unsubCats = onValue(ref(db, "categories"), (snap) => {
      const d = snap.val();
      setCategories(d ? Object.entries(d).map(([k, v]) => ({ docId: k, name: v.name })) : []);
    });
    return () => { unsubFrames(); unsubOrders(); unsubCats(); };
  }, []);

  // ── Compute stats ──
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => (o.status || "Pending") === "Pending").length;
  const deliveredOrders = orders.filter(o => o.status === "Delivered").length;
  const recentOrders = orders.slice(0, 5);

  // Animated counts
  const animFrames = useCountUp(frames.length);
  const animOrders = useCountUp(orders.length);
  const animRevenue = useCountUp(totalRevenue);
  const animPending = useCountUp(pendingOrders);

  const STAT_CARDS = [
    { label: "Total Frames", value: animFrames, icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>`, gradient: "linear-gradient(135deg, #C9A84C, #E8D48B)", href: "/admin/dashboard/frames" },
    { label: "Total Orders", value: animOrders, icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`, gradient: "linear-gradient(135deg, #3898FF, #60BFFF)", href: "/admin/dashboard/orders" },
    { label: "Revenue", value: `Rs. ${animRevenue.toLocaleString()}`, icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`, gradient: "linear-gradient(135deg, #22C55E, #4ADE80)", href: "/admin/dashboard/orders" },
    { label: "Pending Orders", value: animPending, icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`, gradient: "linear-gradient(135deg, #FFAF38, #FFD166)", href: "/admin/dashboard/orders" },
  ];

  const QUICK_ACTIONS = [
    { label: "Manage Frames", desc: "Add, edit or remove frame products", icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>`, href: "/admin/dashboard/frames" },
    { label: "View Orders", desc: "Track and fulfill customer orders", icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`, href: "/admin/dashboard/orders" },
    { label: "Categories", desc: "Organize your product catalog", icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`, href: "/admin/dashboard/categories" },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* ── DASHBOARD SPECIFIC STYLES ── */
        .dash-greeting {
          margin-bottom: 32px;
        }
        .dash-greeting h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 28px; font-weight: 400;
          margin-bottom: 6px;
        }
        .dash-greeting p {
          font-size: 14px; color: var(--text2);
        }
        .dash-greeting span.accent { color: var(--accent); }

        /* ── STAT CARDS ── */
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 36px;
        }
        .stat-card {
          position: relative;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          border-radius: 16px 16px 0 0;
        }
        .stat-card:hover {
          border-color: rgba(201, 168, 76, 0.2);
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }
        .stat-card-icon {
          margin-bottom: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px; height: 48px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          color: var(--text);
        }
        .stat-card-value {
          font-family: 'DM Sans', sans-serif;
          font-size: 30px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }
        .stat-card-label {
          font-size: 12px;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
        }
        .stat-card-glow {
          position: absolute;
          bottom: -40px; right: -40px;
          width: 120px; height: 120px;
          border-radius: 50%;
          opacity: 0.06;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .stat-card:hover .stat-card-glow { opacity: 0.12; }

        /* ── BOTTOM GRID ── */
        .dash-bottom-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 24px;
        }

        /* ── RECENT ORDERS TABLE ── */
        .recent-orders-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
        }
        .recent-orders-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }
        .recent-orders-header h3 {
          font-family: 'DM Serif Display', serif;
          font-size: 18px; font-weight: 400;
        }
        .view-all-link {
          font-size: 12px; color: var(--accent);
          text-decoration: none; cursor: pointer;
          font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.06em; border: none; background: none;
          transition: opacity 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .view-all-link:hover { opacity: 0.7; }
        .recent-orders-table {
          width: 100%;
          border-collapse: collapse;
        }
        .recent-orders-table th {
          text-align: left;
          font-size: 10px;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
          padding: 12px 24px;
          border-bottom: 1px solid var(--border);
          background: rgba(255,255,255,0.01);
        }
        .recent-orders-table td {
          padding: 14px 24px;
          font-size: 13px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .recent-orders-table tr:last-child td { border-bottom: none; }
        .recent-orders-table tr {
          transition: background 0.15s ease;
        }
        .recent-orders-table tr:hover td {
          background: rgba(255,255,255,0.015);
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border: 1px solid;
        }
        .order-id-cell {
          font-weight: 600;
          color: var(--accent);
          font-size: 12px;
        }
        .empty-state {
          text-align: center;
          padding: 48px 24px;
          color: var(--text2);
        }
        .empty-state-icon {
          font-size: 40px;
          margin-bottom: 12px;
          opacity: 0.25;
        }
        .empty-state p { font-size: 13px; }

        /* ── QUICK ACTIONS ── */
        .quick-actions-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
        }
        .quick-actions-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }
        .quick-actions-header h3 {
          font-family: 'DM Serif Display', serif;
          font-size: 18px; font-weight: 400;
        }
        .quick-actions-list {
          padding: 12px;
        }
        .quick-action-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 12px;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          color: var(--text);
          transition: all 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .quick-action-item:hover {
          background: rgba(201, 168, 76, 0.06);
        }
        .quick-action-icon {
          width: 48px; height: 48px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: 12px;
          flex-shrink: 0;
          transition: all 0.2s ease;
          color: var(--text);
        }
        .quick-action-item:hover .quick-action-icon {
          background: rgba(201, 168, 76, 0.1);
          border-color: rgba(201, 168, 76, 0.25);
        }
        .quick-action-label {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .quick-action-desc {
          font-size: 12px;
          color: var(--text2);
        }
        .quick-action-arrow {
          margin-left: auto;
          font-size: 16px;
          color: var(--text2);
          opacity: 0;
          transform: translateX(-4px);
          transition: all 0.2s ease;
        }
        .quick-action-item:hover .quick-action-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* ── SUMMARY CARDS ── */
        .summary-strip {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding: 16px 24px 20px;
          border-top: 1px solid var(--border);
        }
        .summary-mini {
          text-align: center;
        }
        .summary-mini-value {
          font-size: 22px;
          font-weight: 700;
          color: var(--text);
        }
        .summary-mini-label {
          font-size: 10px;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 600;
          margin-top: 2px;
        }

        @media (max-width: 1200px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-bottom-grid { grid-template-columns: 1fr; }
        }
      ` }} />

      {/* ── GREETING ── */}
      <div className="dash-greeting animate-in">
        <h2>Welcome back <span className="accent">✦</span></h2>
        <p>Here's what's happening with your store today.</p>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="stat-grid">
        {STAT_CARDS.map((card, i) => (
          <div
            key={card.label}
            className={`stat-card animate-in animate-in-${i + 1}`}
            style={{ '--card-gradient': card.gradient }}
            onClick={() => router.push(card.href)}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: card.gradient, borderRadius: '16px 16px 0 0' }} />
            <div className="stat-card-icon" dangerouslySetInnerHTML={{ __html: card.icon }} />
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-label">{card.label}</div>
            <div className="stat-card-glow" style={{ background: card.gradient }} />
          </div>
        ))}
      </div>

      {/* ── BOTTOM: RECENT ORDERS + QUICK ACTIONS ── */}
      <div className="dash-bottom-grid">
        {/* Recent Orders */}
        <div className="recent-orders-card animate-in animate-in-4">
          <div className="recent-orders-header">
            <h3>Recent Orders</h3>
            <button className="view-all-link" onClick={() => router.push('/admin/dashboard/orders')}>
              View All →
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" dangerouslySetInnerHTML={{ __html: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>' }} />
              <p>No orders yet. They'll appear here once customers start ordering.</p>
            </div>
          ) : (
            <table className="recent-orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => {
                  const status = o.status || "Pending";
                  const sc = STATUS_COLORS[status] || STATUS_COLORS.Pending;
                  return (
                    <tr key={o.docId}>
                      <td className="order-id-cell">{o.orderId}</td>
                      <td style={{ color: "var(--text)" }}>{o.customer?.name || "—"}</td>
                      <td style={{ fontWeight: 600 }}>Rs. {o.total?.toLocaleString() || "0"}</td>
                      <td>
                        <span className="status-badge" style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ color: "var(--text2)", fontSize: "12px" }}>
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick Actions + Summary */}
        <div className="animate-in animate-in-5" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="quick-actions-card">
            <div className="quick-actions-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="quick-actions-list">
              {QUICK_ACTIONS.map(action => (
                <button key={action.label} className="quick-action-item" onClick={() => router.push(action.href)}>
                  <div className="quick-action-icon" dangerouslySetInnerHTML={{ __html: action.icon }} />
                  <div>
                    <div className="quick-action-label">{action.label}</div>
                    <div className="quick-action-desc">{action.desc}</div>
                  </div>
                  <span className="quick-action-arrow">→</span>
                </button>
              ))}
            </div>
            <div className="summary-strip">
              <div className="summary-mini">
                <div className="summary-mini-value">{categories.length}</div>
                <div className="summary-mini-label">Categories</div>
              </div>
              <div className="summary-mini">
                <div className="summary-mini-value">{deliveredOrders}</div>
                <div className="summary-mini-label">Delivered</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
