"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../lib/firebase";
import { ref, onValue } from "firebase/database";

export default function SalesAnalyticsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [deliveredPeriod, setDeliveredPeriod] = useState("Month"); // default to current month
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

  useEffect(() => {
    const ordersRef = ref(db, "orders");
    const unsub = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ordersList = Object.entries(data).map(([key, val]) => ({
          docId: key,
          ...val
        }));
        // Sort by newest first
        ordersList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setOrders(ordersList);
      } else {
        setOrders([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── FILTER STATUS ──
  const filteredByStatus = statusFilter === "All"
    ? orders
    : orders.filter(o => (o.status || "Pending") === statusFilter);

  // Compute overall stats for selected status
  const totalRevenue = filteredByStatus.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalSalesCount = filteredByStatus.length;
  const averageOrderValue = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;
  const totalItemsSold = filteredByStatus.reduce(
    (sum, o) => sum + (o.items?.reduce((iSum, item) => iSum + (item.quantity || 0), 0) || 0),
    0
  );

  // ── DELIVERED ORDERS TIME period FILTER ──
  const deliveredOrders = orders.filter(o => o.status === "Delivered");

  // Get delivered orders filtered by selected time period
  const getDeliveredPeriodFiltered = (list, period) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // Start of current calendar week (Monday)
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday).getTime();

    // Start of current calendar month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // Start of current calendar year
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

    return list.filter(o => {
      const t = o.createdAt || 0;
      if (period === "Today") return t >= todayStart;
      if (period === "Week") return t >= weekStart;
      if (period === "Month") return t >= monthStart;
      if (period === "Year") return t >= yearStart;
      return true; // All Time
    });
  };

  const periodDeliveredOrders = getDeliveredPeriodFiltered(deliveredOrders, deliveredPeriod);
  const periodRevenue = periodDeliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const periodCount = periodDeliveredOrders.length;

  // ── PREPARE SVG CHART DATA ──
  const prepareChartData = (list, period) => {
    const now = new Date();

    if (period === "Today") {
      // 6 blocks of 4 hours
      const labels = ["12am-4am", "4am-8am", "8am-12pm", "12pm-4pm", "4pm-8pm", "8pm-12am"];
      const sales = new Array(6).fill(0);
      const revenue = new Array(6).fill(0);

      list.forEach(o => {
        const date = new Date(o.createdAt);
        const hour = date.getHours();
        const index = Math.floor(hour / 4);
        if (index >= 0 && index < 6) {
          sales[index] += 1;
          revenue[index] += o.total || 0;
        }
      });

      return { labels, sales, revenue };
    }

    if (period === "Week") {
      // Mon-Sun of current week
      const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const sales = new Array(7).fill(0);
      const revenue = new Array(7).fill(0);

      const currentDay = now.getDay();
      const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday);
      // Strip hours/mins/secs
      startOfWeek.setHours(0, 0, 0, 0);

      list.forEach(o => {
        const date = new Date(o.createdAt);
        const diffTime = date.getTime() - startOfWeek.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          sales[diffDays] += 1;
          revenue[diffDays] += o.total || 0;
        }
      });

      return { labels, sales, revenue };
    }

    if (period === "Month") {
      // Group by 6 intervals of 5 days: 1-5, 6-10, 11-15, 16-20, 21-25, 26+
      const labels = ["1-5", "6-10", "11-15", "16-20", "21-25", "26+"];
      const sales = new Array(6).fill(0);
      const revenue = new Array(6).fill(0);

      list.forEach(o => {
        const date = new Date(o.createdAt);
        if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
          const dom = date.getDate();
          const index = Math.min(Math.floor((dom - 1) / 5), 5);
          sales[index] += 1;
          revenue[index] += o.total || 0;
        }
      });

      return { labels, sales, revenue };
    }

    if (period === "Year") {
      // 12 Months
      const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const sales = new Array(12).fill(0);
      const revenue = new Array(12).fill(0);

      list.forEach(o => {
        const date = new Date(o.createdAt);
        if (date.getFullYear() === now.getFullYear()) {
          const m = date.getMonth();
          sales[m] += 1;
          revenue[m] += o.total || 0;
        }
      });

      return { labels, sales, revenue };
    }

    // All Time (3 Calendar Years: Year-2, Year-1, CurrentYear)
    const currentYear = now.getFullYear();
    const startYear = currentYear - 2;
    const labels = [String(startYear), String(startYear + 1), String(currentYear)];
    const sales = new Array(3).fill(0);
    const revenue = new Array(3).fill(0);

    list.forEach(o => {
      const date = new Date(o.createdAt);
      const y = date.getFullYear();
      const index = y - startYear;
      if (index >= 0 && index < 3) {
        sales[index] += 1;
        revenue[index] += o.total || 0;
      }
    });

    return { labels, sales, revenue };
  };

  const chartData = prepareChartData(periodDeliveredOrders, deliveredPeriod);

  // ── RENDER SVG AREA CHART FOR REVENUE ──
  const renderAreaChart = (labels, dataValues) => {
    const width = 600;
    const height = 220;
    const padding = { top: 20, right: 30, bottom: 40, left: 65 };

    const maxVal = Math.max(...dataValues, 1000); // at least scale to 1000
    const n = dataValues.length;

    const points = dataValues.map((val, i) => {
      const x = padding.left + (i * (width - padding.left - padding.right)) / (n > 1 ? n - 1 : 1);
      const y = height - padding.bottom - (val * (height - padding.top - padding.bottom)) / maxVal;
      return { x, y, val, label: labels[i] };
    });

    let linePath = "";
    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    }

    let areaPath = "";
    if (points.length > 0) {
      areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;
    }

    const gridLines = [];
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
      const val = (maxVal / gridCount) * i;
      const y = height - padding.bottom - (val * (height - padding.top - padding.bottom)) / maxVal;
      gridLines.push({ y, val });
    }

    return (
      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((gl, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={gl.y}
                x2={width - padding.right}
                y2={gl.y}
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={gl.y + 3}
                textAnchor="end"
                fill="var(--text2)"
                fontSize="9"
                fontFamily="inherit"
              >
                Rs. {Math.round(gl.val).toLocaleString()}
              </text>
            </g>
          ))}

          {/* Area fill */}
          {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}

          {/* Area stroke */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Dots and interactive regions */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="var(--surface)"
                stroke="var(--accent)"
                strokeWidth="2.5"
                style={{ transition: "r 0.15s ease" }}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="16"
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          ))}

          {/* X labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={height - padding.bottom + 18}
              textAnchor="middle"
              fill="var(--text2)"
              fontSize="9.5"
              fontWeight="600"
            >
              {p.label}
            </text>
          ))}
        </svg>

        {hoveredPoint && (
          <div className="chart-tooltip" style={{
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100 - 18}%`
          }}>
            <div className="tooltip-title">{hoveredPoint.label}</div>
            <div className="tooltip-value">Rs. {hoveredPoint.val.toLocaleString()}</div>
          </div>
        )}
      </div>
    );
  };

  // ── RENDER SVG BAR CHART FOR SALES COUNT ──
  const renderBarChart = (labels, dataValues) => {
    const width = 600;
    const height = 220;
    const padding = { top: 20, right: 30, bottom: 40, left: 50 };

    const maxVal = Math.max(...dataValues, 5); // scale to at least 5
    const n = dataValues.length;
    const barPadding = n > 7 ? 6 : 12;
    const stepWidth = (width - padding.left - padding.right) / n;

    const bars = dataValues.map((val, i) => {
      const barWidth = Math.max(stepWidth - 2 * barPadding, 4);
      const barHeight = (val * (height - padding.top - padding.bottom)) / maxVal;
      const x = padding.left + i * stepWidth + barPadding;
      const y = height - padding.bottom - barHeight;
      return { x, y, width: barWidth, height: barHeight, val, label: labels[i] };
    });

    const gridLines = [];
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
      const val = (maxVal / gridCount) * i;
      const y = height - padding.bottom - (val * (height - padding.top - padding.bottom)) / maxVal;
      gridLines.push({ y, val });
    }

    return (
      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3898FF" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#3898FF" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((gl, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={gl.y}
                x2={width - padding.right}
                y2={gl.y}
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={gl.y + 3}
                textAnchor="end"
                fill="var(--text2)"
                fontSize="9"
              >
                {Math.round(gl.val)}
              </text>
            </g>
          ))}

          {/* Bars */}
          {bars.map((bar, i) => (
            <g key={i}>
              <rect
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={Math.max(bar.height, 1)}
                rx="3"
                fill="url(#barGrad)"
                style={{ transition: "all 0.2s ease", cursor: "pointer" }}
                onMouseEnter={() => setHoveredBar(bar)}
                onMouseLeave={() => setHoveredBar(null)}
              />
            </g>
          ))}

          {/* X labels */}
          {bars.map((bar, i) => (
            <text
              key={i}
              x={bar.x + bar.width / 2}
              y={height - padding.bottom + 18}
              textAnchor="middle"
              fill="var(--text2)"
              fontSize="9.5"
              fontWeight="600"
            >
              {bar.label}
            </text>
          ))}
        </svg>

        {hoveredBar && (
          <div className="chart-tooltip" style={{
            left: `${((hoveredBar.x + hoveredBar.width / 2) / width) * 100}%`,
            top: `${(hoveredBar.y / height) * 100 - 18}%`,
            borderColor: "#3898FF"
          }}>
            <div className="tooltip-title">{hoveredBar.label}</div>
            <div className="tooltip-value">{hoveredBar.val} Order{hoveredBar.val !== 1 ? "s" : ""}</div>
          </div>
        )}
      </div>
    );
  };

  // Status badge colors
  const STATUS_BADGES = {
    Pending: { bg: "rgba(255, 175, 56, 0.12)", text: "#FFAF38", border: "rgba(255, 175, 56, 0.25)" },
    Processing: { bg: "rgba(56, 152, 255, 0.12)", text: "#3898FF", border: "rgba(56, 152, 255, 0.25)" },
    Shipped: { bg: "rgba(139, 92, 246, 0.12)", text: "#8B5CF6", border: "rgba(139, 92, 246, 0.25)" },
    Delivered: { bg: "rgba(34, 197, 94, 0.12)", text: "#22C55E", border: "rgba(34, 197, 94, 0.25)" },
    Cancelled: { bg: "rgba(255, 90, 90, 0.12)", text: "#FF5A5A", border: "rgba(255, 90, 90, 0.25)" }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flex: 1, height: "60vh", alignItems: "center", justifyContent: "center", color: "var(--text2)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
              <circle cx="12" cy="12" r="10" stroke="rgba(201,168,76,0.15)" strokeWidth="3" />
              <path d="M12 2 a 10 10 0 0 1 10 10" />
            </svg>
          </div>
          <p style={{ fontSize: "14px", letterSpacing: "0.05em" }}>Analyzing sales records...</p>
        </div>
      </div>
    );
  }

  // Count metrics for status cards
  const statsByStatus = {
    Pending: orders.filter(o => (o.status || "Pending") === "Pending"),
    Processing: orders.filter(o => o.status === "Processing"),
    Shipped: orders.filter(o => o.status === "Shipped"),
    Delivered: orders.filter(o => o.status === "Delivered"),
    Cancelled: orders.filter(o => o.status === "Cancelled")
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        .anim-fade { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .anim-delay-1 { animation-delay: 0.05s; }
        .anim-delay-2 { animation-delay: 0.1s; }
        .anim-delay-3 { animation-delay: 0.15s; }
        .anim-delay-4 { animation-delay: 0.2s; }
        .anim-delay-5 { animation-delay: 0.25s; }

        /* ── STATS ROW ── */
        .analytics-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .analytics-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease, transform 0.2s ease;
        }
        .analytics-card:hover {
          border-color: rgba(201, 168, 76, 0.2);
          transform: translateY(-2px);
        }
        .analytics-card-label {
          font-size: 11px;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .analytics-card-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          letter-spacing: -0.01em;
        }
        .analytics-card-sub {
          font-size: 11px;
          color: var(--text2);
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* ── FILTER CHIPS ── */
        .status-chips-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
          padding: 12px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          align-items: center;
        }
        .status-chip-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text2);
          margin-right: 8px;
          margin-left: 4px;
        }
        .status-chip {
          background: var(--surface2);
          border: 1px solid var(--border2);
          color: var(--text2);
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .status-chip:hover {
          color: var(--text);
          border-color: var(--accent);
          background: rgba(201, 168, 76, 0.05);
        }
        .status-chip.active {
          color: var(--bg);
          background: var(--gradient-accent);
          border-color: var(--accent);
          font-weight: 700;
        }
        .status-chip-count {
          font-size: 10px;
          background: rgba(255, 255, 255, 0.1);
          color: inherit;
          padding: 1px 6px;
          border-radius: 10px;
          font-weight: 700;
        }
        .status-chip.active .status-chip-count {
          background: rgba(0, 0, 0, 0.15);
        }

        /* ── CHARTS CONTAINER ── */
        .charts-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        .chart-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 24px;
          min-height: 310px;
        }
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .chart-title {
          font-family: 'DM Serif Display', serif;
          font-size: 17px;
          font-weight: 400;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .chart-period-selector {
          display: flex;
          background: var(--surface2);
          padding: 3px;
          border-radius: 8px;
          border: 1px solid var(--border2);
        }
        .chart-period-btn {
          background: none;
          border: none;
          color: var(--text2);
          padding: 4px 10px;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .chart-period-btn.active {
          background: var(--surface3);
          color: var(--accent);
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }

        /* ── TOOLTIP ── */
        .chart-tooltip {
          position: absolute;
          transform: translate(-50%, -100%);
          background: #171512;
          border: 1.5px solid var(--accent);
          border-radius: 6px;
          padding: 6px 10px;
          pointer-events: none;
          z-index: 100;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.6);
          text-align: center;
          white-space: nowrap;
          animation: fadeInTooltip 0.12s ease-out;
        }
        @keyframes fadeInTooltip {
          from { opacity: 0; transform: translate(-50%, -90%); }
          to { opacity: 1; transform: translate(-50%, -100%); }
        }
        .tooltip-title {
          font-size: 10px;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 2px;
          font-weight: 700;
        }
        .tooltip-value {
          font-size: 12px;
          color: #FFF;
          font-weight: 700;
        }

        /* ── RECENT ORDERS LIST ── */
        .analytics-table-wrap {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }
        .table-header-bar {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .table-title {
          font-family: 'DM Serif Display', serif;
          font-size: 18px;
          font-weight: 400;
        }
        .analytics-table {
          width: 100%;
          border-collapse: collapse;
        }
        .analytics-table th {
          text-align: left;
          font-size: 10px;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
          padding: 12px 20px;
          border-bottom: 1px solid var(--border);
          background: rgba(255,255,255,0.01);
        }
        .analytics-table td {
          padding: 12px 20px;
          font-size: 13px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .analytics-table tr:last-child td {
          border-bottom: none;
        }
        .analytics-table tr {
          transition: background 0.15s ease;
        }
        .analytics-table tr:hover td {
          background: rgba(255,255,255,0.012);
        }
        .order-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 5px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border: 1px solid;
        }

        @media (max-width: 1200px) {
          .analytics-stats-row { grid-template-columns: repeat(2, 1fr); }
          .charts-container { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .analytics-stats-row { grid-template-columns: 1fr; }
        }
      ` }} />

      <div className="content-header anim-fade">
        <div>
          <h2>Sales Analytics</h2>
          <p className="content-header-sub">Monitor store performance, sales status and revenue statistics</p>
        </div>
      </div>

      {/* ── STATUS CHIPS BAR ── */}
      <div className="status-chips-bar anim-fade anim-delay-1">
        <span className="status-chip-label">Filter Status</span>
        <button className={`status-chip ${statusFilter === "All" ? "active" : ""}`} onClick={() => setStatusFilter("All")}>
          All Orders <span className="status-chip-count">{orders.length}</span>
        </button>
        {Object.entries(statsByStatus).map(([status, list]) => (
          <button
            key={status}
            className={`status-chip ${statusFilter === status ? "active" : ""}`}
            onClick={() => setStatusFilter(status)}
          >
            {status} <span className="status-chip-count">{list.length}</span>
          </button>
        ))}
      </div>

      {/* ── OVERALL STATS CARDS ── */}
      <div className="analytics-stats-row anim-fade anim-delay-2">
        <div className="analytics-card">
          <div className="analytics-card-label">Revenue ({statusFilter})</div>
          <div className="analytics-card-value" style={{ color: "var(--accent)" }}>
            Rs. {totalRevenue.toLocaleString()}
          </div>
          <div className="analytics-card-sub">
            Total cash flow generated
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-label">Sales Count ({statusFilter})</div>
          <div className="analytics-card-value">
            {totalSalesCount}
          </div>
          <div className="analytics-card-sub">
            Completed transactions count
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-label">Average Order Value</div>
          <div className="analytics-card-value">
            Rs. {Math.round(averageOrderValue).toLocaleString()}
          </div>
          <div className="analytics-card-sub">
            Average spent per order
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-label">Items Sold</div>
          <div className="analytics-card-value">
            {totalItemsSold}
          </div>
          <div className="analytics-card-sub">
            Quantity of photo frames ordered
          </div>
        </div>
      </div>

      {/* ── CHARTS CONTAINER ── */}
      <div className="charts-container anim-fade anim-delay-3">
        {/* Delivered Revenue Trend */}
        <div className="chart-box">
          <div className="chart-header">
            <h3 className="chart-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Delivered Revenue Trend
            </h3>
            <div className="chart-period-selector">
              {["Today", "Week", "Month", "Year", "All"].map((p) => (
                <button
                  key={p}
                  className={`chart-period-btn ${deliveredPeriod === p ? "active" : ""}`}
                  onClick={() => setDeliveredPeriod(p)}
                >
                  {p === "All" ? "All Time" : p}
                </button>
              ))}
            </div>
          </div>
          <div style={{ position: "relative", minHeight: "220px" }}>
            {periodDeliveredOrders.length === 0 ? (
              <div style={{ display: "flex", height: "200px", alignItems: "center", justifyContent: "center", color: "var(--text2)", fontSize: "12px" }}>
                No delivered orders in this period.
              </div>
            ) : (
              renderAreaChart(chartData.labels, chartData.revenue)
            )}
          </div>
        </div>

        {/* Delivered Sales Volume */}
        <div className="chart-box">
          <div className="chart-header">
            <h3 className="chart-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3898FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              Delivered Sales Volume
            </h3>
            <div className="chart-period-selector">
              {["Today", "Week", "Month", "Year", "All"].map((p) => (
                <button
                  key={p}
                  className={`chart-period-btn ${deliveredPeriod === p ? "active" : ""}`}
                  onClick={() => setDeliveredPeriod(p)}
                >
                  {p === "All" ? "All Time" : p}
                </button>
              ))}
            </div>
          </div>
          <div style={{ position: "relative", minHeight: "220px" }}>
            {periodDeliveredOrders.length === 0 ? (
              <div style={{ display: "flex", height: "200px", alignItems: "center", justifyContent: "center", color: "var(--text2)", fontSize: "12px" }}>
                No delivered orders in this period.
              </div>
            ) : (
              renderBarChart(chartData.labels, chartData.sales)
            )}
          </div>
        </div>
      </div>

      {/* ── DATA DETAILS TABLE ── */}
      <div className="analytics-table-wrap anim-fade anim-delay-4">
        <div className="table-header-bar">
          <h3 className="table-title">
            {statusFilter === "All" ? "All Orders Log" : `${statusFilter} Orders Log`}
            {statusFilter === "Delivered" && ` (${deliveredPeriod === "All" ? "All Time" : `Filtered: ${deliveredPeriod}`})`}
          </h3>
          <span style={{ fontSize: "12px", color: "var(--text2)" }}>
            Showing <strong>{statusFilter === "Delivered" ? periodDeliveredOrders.length : filteredByStatus.length}</strong> record(s)
          </span>
        </div>

        {(statusFilter === "Delivered" ? periodDeliveredOrders : filteredByStatus).length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "12px", opacity: 0.25 }}>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            </svg>
            <p style={{ fontSize: "13px" }}>No order records found for the current selection.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Date & Time</th>
                  <th>Customer Name</th>
                  <th>Contact Info</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(statusFilter === "Delivered" ? periodDeliveredOrders : filteredByStatus).map((o) => {
                  const status = o.status || "Pending";
                  const badge = STATUS_BADGES[status] || STATUS_BADGES.Pending;
                  return (
                    <tr key={o.docId}>
                      <td style={{ fontWeight: "700", color: "var(--accent)" }}>{o.orderId}</td>
                      <td style={{ color: "var(--text)" }}>
                        {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
                      </td>
                      <td style={{ fontWeight: "600" }}>{o.customer?.name || "—"}</td>
                      <td style={{ color: "var(--text2)", fontSize: "12px" }}>
                        {o.customer?.phone} <br /> {o.customer?.email}
                      </td>
                      <td style={{ fontWeight: "700" }}>Rs. {o.total?.toLocaleString() || "0"}</td>
                      <td>
                        <span className="order-status-badge" style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
