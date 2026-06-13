"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../lib/firebase";
import { ref, onValue, set, remove } from "firebase/database";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPayment, setFilterPayment] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    const ordersRef = ref(db, "orders");
    const unsub = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ordersList = Object.entries(data).map(([key, val]) => ({ docId: key, ...val }));
        ordersList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setOrders(ordersList);
      } else {
        setOrders([]);
      }
    });
    return () => unsub();
  }, []);

  const handleDeleteOrder = async (docId) => {
    if (!confirm("Are you sure you want to delete this order permanently?")) return;
    try {
      await remove(ref(db, `orders/${docId}`));
      alert("Order deleted successfully.");
    } catch (e) { console.error(e); alert("Failed to delete order."); }
  };

  const handleUpdateOrderStatus = async (docId, newStatus) => {
    try {
      await set(ref(db, `orders/${docId}/status`), newStatus);
    } catch (e) { console.error(e); alert("Failed to update status."); }
  };

  // Filtering logic
  const query = searchQuery.toLowerCase().trim();
  let filtered = orders.filter(o => {
    if (filterStatus !== "All" && (o.status || "Pending") !== filterStatus) return false;
    if (filterPayment !== "All" && o.paymentMethod !== filterPayment) return false;
    if (query) {
      const matchId = (o.orderId || "").toLowerCase().includes(query);
      const matchName = (o.customer?.name || "").toLowerCase().includes(query);
      const matchPhone = (o.customer?.phone || "").toLowerCase().includes(query);
      const matchEmail = (o.customer?.email || "").toLowerCase().includes(query);
      if (!matchId && !matchName && !matchPhone && !matchEmail) return false;
    }
    return true;
  });
  if (sortOrder === "oldest") filtered = [...filtered].reverse();

  return (
    <>
      <div className="content-header">
        <div>
          <h2>Customer Orders</h2>
          <p className="content-header-sub">Track, manage and fulfill incoming orders</p>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="order-filters-bar animate-in animate-in-1">
        <div className="filter-search-wrap">
          <span className="filter-search-icon">🔍</span>
          <input type="text" className="filter-search" placeholder="Search by Order ID or Customer Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="filter-group">
          <span className="filter-label">Status</span>
          <div className="filter-select-wrap">
            <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">Payment</span>
          <div className="filter-select-wrap">
            <select className="filter-select" value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
              <option value="All">All Methods</option>
              <option value="EasyPaisa">EasyPaisa</option>
              <option value="JazzCash">JazzCash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">Sort</span>
          <div className="filter-select-wrap">
            <select className="filter-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
        {(searchQuery || filterStatus !== "All" || filterPayment !== "All") && (
          <button className="filter-clear-btn" onClick={() => { setSearchQuery(""); setFilterStatus("All"); setFilterPayment("All"); setSortOrder("newest"); }}>
            ✕ Clear Filters
          </button>
        )}
      </div>

      {/* ── ORDER LIST ── */}
      {filtered.length === 0 ? (
        <div className="animate-in animate-in-2" style={{ textAlign: "center", padding: "60px 20px", color: "var(--text2)" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>📭</div>
          <p style={{ fontSize: "14px" }}>
            {orders.length === 0 ? "No orders have been placed yet." : "No orders match the current filters."}
          </p>
        </div>
      ) : (
        <div className="animate-in animate-in-2">
          <div style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "14px" }}>
            Showing <strong style={{ color: "var(--accent)" }}>{filtered.length}</strong> of {orders.length} order{orders.length !== 1 ? "s" : ""}
          </div>
          {filtered.map(o => (
            <div key={o.docId} className="order-card">
              <div className="order-header">
                <div>
                  <strong style={{ color: "var(--accent)", fontSize: "16px" }}>{o.orderId}</strong>
                  <span style={{ marginLeft: "12px", fontSize: "12px", color: "var(--text2)" }}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : "Just now"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <select
                    value={o.status || "Pending"}
                    onChange={(e) => handleUpdateOrderStatus(o.docId, e.target.value)}
                    style={{
                      background: "var(--surface2)", color: "var(--accent)",
                      border: "1px solid var(--border2)", padding: "6px 12px",
                      borderRadius: "6px", fontSize: "12px", fontWeight: "700",
                      textTransform: "uppercase", outline: "none", cursor: "pointer"
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <strong style={{ color: "#FFF" }}>Grand Total: Rs. {o.total?.toLocaleString()} ({o.paymentMethod || "COD"})</strong>
                  <button
                    onClick={() => handleDeleteOrder(o.docId)}
                    style={{
                      background: "none", border: "1px solid #FF5A5A", color: "#FF5A5A",
                      padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "700",
                      textTransform: "uppercase", cursor: "pointer", transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => { e.target.style.background = "#FF5A5A"; e.target.style.color = "#111"; }}
                    onMouseLeave={(e) => { e.target.style.background = "none"; e.target.style.color = "#FF5A5A"; }}
                  >
                    Delete 🗑️
                  </button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "24px" }}>
                <div>
                  <h4 style={{ fontSize: "12px", color: "var(--text2)", textTransform: "uppercase", marginBottom: "8px" }}>Customer Info</h4>
                  <p style={{ fontSize: "13px" }}><strong>{o.customer?.name}</strong></p>
                  <p style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span>{o.customer?.phone} | {o.customer?.email}</span>
                    <button
                      onClick={() => {
                        const getWhatsAppNumber = (phone) => {
                          if (!phone) return "";
                          let clean = phone.replace(/\D/g, "");
                          if (clean.startsWith("0")) clean = "92" + clean.slice(1);
                          if (clean.length === 10 && !clean.startsWith("92")) clean = "92" + clean;
                          return clean;
                        };
                        const messageText = `*Yaadein Order Confirmation* 🌟\n\n` +
                          `Order Reference: *${o.orderId}*\n` +
                          `Customer Name: *${o.customer?.name}*\n` +
                          `Phone: *${o.customer?.phone}*\n` +
                          `Address: *${o.customer?.address || ""}, ${o.customer?.city || ""}, ${o.customer?.state || ""} ${o.customer?.zip || ""}*\n` +
                          `Payment Method: *${o.paymentMethod || "Prepaid"}*\n` +
                          `Grand Total: *Rs. ${o.total?.toLocaleString()}*\n\n` +
                          `Thank you for framing with Yaadein! Your order is confirmed and currently processing.`;
                        window.open(`https://wa.me/${getWhatsAppNumber(o.customer?.phone)}?text=${encodeURIComponent(messageText)}`, "_blank");
                      }}
                      style={{
                        background: "rgba(37, 211, 102, 0.1)", border: "1px solid #25D366", color: "#25D366",
                        padding: "2px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer",
                        fontWeight: "bold", display: "inline-flex", alignItems: "center", transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#25D366"; e.currentTarget.style.color = "#FFF"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(37, 211, 102, 0.1)"; e.currentTarget.style.color = "#25D366"; }}
                    >
                      💬 WhatsApp Confirm
                    </button>
                  </p>
                  <p style={{ fontSize: "13px", marginTop: "8px", color: "var(--text2)" }}>
                    {o.customer?.address}<br />{o.customer?.city}, {o.customer?.state} {o.customer?.zip}
                  </p>

                  {/* Payment Info */}
                  <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed var(--border)" }}>
                    <h4 style={{ fontSize: "12px", color: "var(--text2)", textTransform: "uppercase", marginBottom: "6px" }}>Payment Info</h4>
                    <p style={{ fontSize: "13px" }}>Method: <strong style={{ color: "var(--accent)" }}>{o.paymentMethod || "N/A"}</strong></p>
                    {o.paymentReceiptUrl ? (
                      <div style={{ marginTop: "8px" }}>
                        <a href={o.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" style={{
                          color: "var(--accent)", textDecoration: "none", fontSize: "12px",
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          background: "rgba(201, 168, 76, 0.08)", padding: "4px 10px",
                          borderRadius: "6px", border: "1px solid rgba(201, 168, 76, 0.2)"
                        }}>📄 View Payment Receipt 🔗</a>
                        <div style={{
                          marginTop: "8px", width: "120px", height: "80px", borderRadius: "4px",
                          overflow: "hidden", border: "1px solid var(--border2)", background: "#000",
                          cursor: "pointer", transition: "all 0.2s ease"
                        }}
                          onClick={() => {
                            const overlay = document.createElement('div');
                            overlay.className = 'receipt-lightbox-overlay';
                            overlay.onclick = () => overlay.remove();
                            const closeBtn = document.createElement('button');
                            closeBtn.className = 'receipt-lightbox-close';
                            closeBtn.innerHTML = '✕';
                            closeBtn.onclick = (e) => { e.stopPropagation(); overlay.remove(); };
                            const img = document.createElement('img');
                            img.src = o.paymentReceiptUrl;
                            img.alt = 'Payment Receipt Full View';
                            overlay.appendChild(closeBtn);
                            overlay.appendChild(img);
                            document.body.appendChild(overlay);
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'scale(1)'; }}
                          title="Click to view full size"
                        >
                          <img src={o.paymentReceiptUrl} alt="Receipt Thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: "12px", color: "#FF7777", fontStyle: "italic", marginTop: "4px" }}>No receipt screenshot uploaded.</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: "12px", color: "var(--text2)", textTransform: "uppercase", marginBottom: "12px" }}>Order Items</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {o.items?.map((item, i) => (
                      <div key={i} style={{
                        display: "flex", gap: "16px", alignItems: "center",
                        background: "var(--bg)", border: "1px solid var(--border)",
                        borderRadius: "8px", padding: "10px 14px"
                      }}>
                        <div style={{
                          width: "60px", height: "60px", background: item.frameColor || "#333",
                          padding: "4px", borderRadius: "4px", display: "flex", flexShrink: 0,
                          boxShadow: "0 4px 10px rgba(0,0,0,0.3)", position: "relative"
                        }}>
                          {item.image ? (
                            <img src={item.image} alt={item.frameName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "2px" }} />
                          ) : (
                            <div style={{ flex: 1, background: "#2D2822", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "rgba(201,168,76,0.15)" }}>Y</div>
                          )}
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: "700", color: "#FFF", fontSize: "14px" }}>{item.quantity}x {item.frameName}</span>
                            <span style={{ color: "var(--accent)", fontWeight: "700", fontSize: "14px" }}>{item.price}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--text2)" }}>
                            <span>{item.size ? `${item.size} • ` : ""}{item.orientation === "landscape" ? "Landscape" : "Portrait"}{item.rotation ? ` • Rotated ${item.rotation}°` : ""}</span>
                            {item.image && (
                              <a href={item.image} target="_blank" rel="noopener noreferrer" style={{
                                color: "var(--accent)", textDecoration: "none", fontWeight: "500",
                                display: "inline-flex", alignItems: "center", gap: "4px",
                                background: "rgba(201,168,76,0.08)", padding: "3px 8px",
                                borderRadius: "12px", border: "1px solid rgba(201,168,76,0.2)"
                              }}>Live Image Link 🔗</a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
