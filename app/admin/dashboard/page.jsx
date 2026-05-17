"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { ref, onValue, set, push, remove } from "firebase/database";

const BASE_FRAMES = [
  { id: "classic", name: "Classic Oak", price: "Rs. 4,900", color: "#8B5E3C", desc: "Warm traditional solid oak, showcasing rich organic grain patterns.", tag: "Artisanal Wood", orientation: "portrait", border: "24px", accent: "#6B4423", innerShadow: "inset 0 0 8px rgba(0,0,0,0.35)", outerShadow: "0 8px 32px rgba(0,0,0,0.28)", grain: true },
  { id: "modern", name: "Matte Black", price: "Rs. 3,900", color: "#1A1A1A", desc: "Sleek, minimalist exhibition profile for modern photographic art.", tag: "Gallery Classic", orientation: "portrait", border: "16px", accent: "#333", innerShadow: "inset 0 0 6px rgba(0,0,0,0.5)", outerShadow: "0 12px 40px rgba(0,0,0,0.4)", grain: false },
  { id: "gold", name: "Antique Gold", price: "Rs. 7,900", color: "#C9A84C", desc: "Luxury baroque detailing finished with gold-leaf accents.", tag: "Heritage Luxury", orientation: "portrait", border: "28px", accent: "#A07830", innerShadow: "inset 0 0 10px rgba(0,0,0,0.3)", outerShadow: "0 10px 36px rgba(180,140,40,0.3)", grain: false },
  { id: "white", name: "Gallery White", price: "Rs. 4,500", color: "#F0EDE8", desc: "Clean, pristine warm white profile for bright architectural prints.", tag: "Contemporary", orientation: "portrait", border: "20px", accent: "#D5D0C8", innerShadow: "inset 0 0 6px rgba(0,0,0,0.12)", outerShadow: "0 8px 28px rgba(0,0,0,0.18)", grain: false },
  { id: "silver", name: "Brushed Silver", price: "Rs. 5,500", color: "#B8BCC4", desc: "Sleek, industrial anodized steel look with a fine brushed texture.", tag: "Industrial Modern", orientation: "portrait", border: "18px", accent: "#8E9298", innerShadow: "inset 0 0 8px rgba(0,0,0,0.2)", outerShadow: "0 8px 30px rgba(0,0,0,0.22)", grain: false },
  { id: "rustic", name: "Rustic Walnut", price: "Rs. 5,900", color: "#5C3D2E", desc: "Textured dark country walnut, adding rustic depth to landscapes.", tag: "Rustic Elegance", orientation: "portrait", border: "30px", accent: "#3E2417", innerShadow: "inset 0 0 12px rgba(0,0,0,0.4)", outerShadow: "0 10px 38px rgba(0,0,0,0.3)", grain: true },
  { id: "maple", name: "Natural Maple", price: "Rs. 4,900", color: "#D2B48C", desc: "Light blonde scandinavian maple wood, organic and minimalist.", tag: "Scandinavian", orientation: "portrait", border: "22px", accent: "#BC8F8F", innerShadow: "inset 0 0 6px rgba(0,0,0,0.2)", outerShadow: "0 8px 30px rgba(0,0,0,0.15)", grain: true },
  { id: "obsidian", name: "Obsidian Steel", price: "Rs. 6,900", color: "#2C2C2C", desc: "Deep dark graphite steel finish with a matte metallic feel.", tag: "Industrial Luxe", orientation: "portrait", border: "12px", accent: "#111", innerShadow: "inset 0 0 4px rgba(255,255,255,0.05)", outerShadow: "0 10px 35px rgba(0,0,0,0.5)", grain: false },
  { id: "classic-landscape", name: "Landscape Oak", price: "Rs. 4,900", color: "#8B5E3C", desc: "Warm traditional solid oak, wide landscape orientation.", tag: "Artisanal Wood", orientation: "landscape", border: "24px", accent: "#6B4423", innerShadow: "inset 0 0 8px rgba(0,0,0,0.35)", outerShadow: "0 8px 32px rgba(0,0,0,0.28)", grain: true },
  { id: "modern-landscape", name: "Landscape Black", price: "Rs. 3,900", color: "#1A1A1A", desc: "Sleek, minimalist exhibition profile, wide landscape orientation.", tag: "Gallery Classic", orientation: "landscape", border: "16px", accent: "#333", innerShadow: "inset 0 0 6px rgba(0,0,0,0.5)", outerShadow: "0 12px 40px rgba(0,0,0,0.4)", grain: false },
  { id: "gold-landscape", name: "Landscape Gold", price: "Rs. 7,900", color: "#C9A84C", desc: "Luxury baroque detailing, wide landscape orientation.", tag: "Heritage Luxury", orientation: "landscape", border: "28px", accent: "#A07830", innerShadow: "inset 0 0 10px rgba(0,0,0,0.3)", outerShadow: "0 10px 36px rgba(180,140,40,0.3)", grain: false },
  { id: "white-landscape", name: "Landscape White", price: "Rs. 4,500", color: "#F0EDE8", desc: "Clean, pristine warm white profile, wide landscape orientation.", tag: "Contemporary", orientation: "landscape", border: "20px", accent: "#D5D0C8", innerShadow: "inset 0 0 6px rgba(0,0,0,0.12)", outerShadow: "0 8px 28px rgba(0,0,0,0.18)", grain: false },
  { id: "silver-landscape", name: "Landscape Silver", price: "Rs. 5,500", color: "#B8BCC4", desc: "Sleek, industrial anodized steel look, wide landscape orientation.", tag: "Industrial Modern", orientation: "landscape", border: "18px", accent: "#8E9298", innerShadow: "inset 0 0 8px rgba(0,0,0,0.2)", outerShadow: "0 8px 30px rgba(0,0,0,0.22)", grain: false },
  { id: "rustic-landscape", name: "Landscape Walnut", price: "Rs. 5,900", color: "#5C3D2E", desc: "Textured dark country walnut, wide landscape orientation.", tag: "Rustic Elegance", orientation: "landscape", border: "30px", accent: "#3E2417", innerShadow: "inset 0 0 12px rgba(0,0,0,0.4)", outerShadow: "0 10px 38px rgba(0,0,0,0.3)", grain: true },
  { id: "maple-landscape", name: "Landscape Maple", price: "Rs. 4,900", color: "#D2B48C", desc: "Light blonde scandinavian maple wood, wide landscape orientation.", tag: "Scandinavian", orientation: "landscape", border: "22px", accent: "#BC8F8F", innerShadow: "inset 0 0 6px rgba(0,0,0,0.2)", outerShadow: "0 8px 30px rgba(0,0,0,0.15)", grain: true },
  { id: "obsidian-landscape", name: "Landscape Steel", price: "Rs. 6,900", color: "#2C2C2C", desc: "Deep dark graphite steel finish, wide landscape orientation.", tag: "Industrial Luxe", orientation: "landscape", border: "12px", accent: "#111", innerShadow: "inset 0 0 4px rgba(255,255,255,0.05)", outerShadow: "0 10px 35px rgba(0,0,0,0.5)", grain: false }
];

const INITIAL_FORM = {
  id: "", name: "", price: "Rs. ", color: "#000000", desc: "", tag: "", 
  orientation: "portrait", border: "16px", accent: "#333", 
  innerShadow: "inset 0 0 6px rgba(0,0,0,0.5)", outerShadow: "0 8px 24px rgba(0,0,0,0.3)", grain: false
};

export default function AdminDashboard() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState("frames"); // 'frames' | 'orders'
  
  // Data
  const [frames, setFrames] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Frame Form
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("fs_admin") !== "authenticated") {
        router.push("/admin");
      } else {
        setAuthChecked(true);
      }
    }
  }, [router]);

  // Listeners
  useEffect(() => {
    if (!authChecked) return;
    const framesRef = ref(db, "frames");
    const unsubFrames = onValue(framesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const framesList = Object.entries(data).map(([key, val]) => ({
          docId: key,
          ...val
        }));
        setFrames(framesList);
      } else {
        setFrames([]);
      }
    });
    
    const ordersRef = ref(db, "orders");
    const unsubOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ordersList = Object.entries(data).map(([key, val]) => ({
          docId: key,
          ...val
        }));
        ordersList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setOrders(ordersList);
      } else {
        setOrders([]);
      }
    });

    return () => {
      unsubFrames();
      unsubOrders();
    };
  }, [authChecked]);

  const handleSeed = async () => {
    if (!confirm("Seed default 16 frames?")) return;
    try {
      for (const f of BASE_FRAMES) {
        const frameRef = ref(db, `frames/${f.id}`);
        await set(frameRef, f);
      }
      alert("Seeded successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to seed.");
    }
  };

  const handleFormChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSaveFrame = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const frameRef = ref(db, `frames/${editId}`);
        await set(frameRef, formData);
      } else {
        const frameRef = ref(db, `frames/${formData.id}`);
        await set(frameRef, formData);
      }
      resetForm();
    } catch (e) {
      console.error(e);
      alert("Error saving frame");
    }
  };

  const handleDeleteFrame = async (docId) => {
    if (!confirm("Are you sure?")) return;
    const frameRef = ref(db, `frames/${docId}`);
    await remove(frameRef);
  };

  const handleUpdateOrderStatus = async (docId, newStatus) => {
    try {
      const statusRef = ref(db, `orders/${docId}/status`);
      await set(statusRef, newStatus);
    } catch (e) {
      console.error(e);
      alert("Failed to update status.");
    }
  };

  const editFrame = (f) => {
    setFormData(f);
    setEditId(f.docId);
    setIsEditing(true);
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setIsEditing(false);
    setEditId(null);
  };

  if (!authChecked) return null;

  return (
    <div className="admin-root">
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0F0D0B; --surface: #171512; --surface2: #211E1A;
          --border: rgba(255,255,255,0.06); --border2: rgba(255,255,255,0.12);
          --text: #F5F0E8; --text2: #A8A08C; --accent: #C9A84C; --radius: 12px;
        }

        .admin-root {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg); color: var(--text);
          min-height: 100vh; display: flex; flex-direction: column;
        }

        .admin-header {
          height: 68px; background: var(--surface); border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between; padding: 0 40px;
        }
        .admin-brand { font-family: 'DM Serif Display', serif; font-size: 20px; color: var(--accent); }
        .admin-brand span { color: var(--text); }
        .admin-logout { color: var(--text2); cursor: pointer; border: none; background: none; font-size: 13px; }

        .admin-layout { display: flex; flex: 1; }
        .admin-sidebar { width: 240px; background: var(--surface); border-right: 1px solid var(--border); padding: 20px 0; }
        .tab-btn {
          width: 100%; text-align: left; background: none; border: none; padding: 16px 30px;
          color: var(--text2); font-size: 14px; font-weight: 500; cursor: pointer; border-left: 3px solid transparent;
        }
        .tab-btn.active { color: var(--accent); border-left-color: var(--accent); background: rgba(201,168,76,0.05); }

        .admin-content { flex: 1; padding: 40px; overflow-y: auto; }
        .content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        h2 { font-family: 'DM Serif Display', serif; font-size: 28px; }

        .btn-primary { background: var(--accent); color: #1A1100; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; }
        .btn-secondary { background: var(--surface2); color: var(--text); border: 1px solid var(--border2); padding: 10px 20px; border-radius: 8px; cursor: pointer; }

        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: start; }
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; }
        
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 11px; color: var(--text2); text-transform: uppercase; }
        .form-control { background: var(--surface2); border: 1px solid var(--border2); color: var(--text); padding: 10px; border-radius: 6px; font-size: 13px; }

        .item-list { display: flex; flex-direction: column; gap: 12px; }
        .list-item { background: var(--surface2); border: 1px solid var(--border2); padding: 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
        .item-title { font-family: 'DM Serif Display', serif; font-size: 16px; color: var(--accent); }
        .item-sub { font-size: 12px; color: var(--text2); margin-top: 4px; }
        
        .order-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 20px; margin-bottom: 16px; }
        .order-header { display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 12px; }
      `}</style>

      <header className="admin-header">
        <div className="admin-brand">❧ <span>Frame</span>Studio Admin</div>
        <button className="admin-logout" onClick={() => { sessionStorage.clear(); router.push('/admin'); }}>Logout</button>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <button className={`tab-btn ${activeTab === 'frames' ? 'active' : ''}`} onClick={() => setActiveTab('frames')}>Frame Catalog</button>
          <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Incoming Orders</button>
        </aside>

        <main className="admin-content">
          {activeTab === 'frames' && (
            <>
              <div className="content-header">
                <h2>Manage Frames</h2>
                {frames.length === 0 && <button className="btn-primary" onClick={handleSeed}>Seed Default Frames</button>}
              </div>
              <div className="grid">
                <div className="card">
                  <h3 style={{ marginBottom: "20px" }}>{isEditing ? "Edit Frame" : "Add New Frame"}</h3>
                  <form onSubmit={handleSaveFrame}>
                    <div className="form-row">
                      <div className="form-group"><label>Unique ID</label><input required className="form-control" name="id" value={formData.id} onChange={handleFormChange} disabled={isEditing} /></div>
                      <div className="form-group"><label>Name</label><input required className="form-control" name="name" value={formData.name} onChange={handleFormChange} /></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Price</label><input required className="form-control" name="price" value={formData.price} onChange={handleFormChange} placeholder="Rs. 4,900" /></div>
                      <div className="form-group"><label>Orientation</label>
                        <select className="form-control" name="orientation" value={formData.orientation} onChange={handleFormChange}>
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Landscape</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: "16px" }}><label>Description</label><textarea required className="form-control" name="desc" value={formData.desc} onChange={handleFormChange} /></div>
                    <div className="form-row">
                      <div className="form-group"><label>Hex Color</label><input required className="form-control" name="color" value={formData.color} onChange={handleFormChange} /></div>
                      <div className="form-group"><label>Tag</label><input required className="form-control" name="tag" value={formData.tag} onChange={handleFormChange} /></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Border Thickness</label><input required className="form-control" name="border" value={formData.border} onChange={handleFormChange} placeholder="24px" /></div>
                      <div className="form-group"><label>Accent Color</label><input required className="form-control" name="accent" value={formData.accent} onChange={handleFormChange} /></div>
                    </div>
                    <div className="form-group" style={{ marginBottom: "16px" }}>
                      <label><input type="checkbox" name="grain" checked={formData.grain} onChange={handleFormChange} /> Wood Grain Texture overlay</label>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Inner Shadow</label><input required className="form-control" name="innerShadow" value={formData.innerShadow} onChange={handleFormChange} /></div>
                      <div className="form-group"><label>Outer Shadow</label><input required className="form-control" name="outerShadow" value={formData.outerShadow} onChange={handleFormChange} /></div>
                    </div>
                    <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                      <button type="submit" className="btn-primary">{isEditing ? "Update Frame" : "Create Frame"}</button>
                      {isEditing && <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>}
                    </div>
                  </form>
                </div>

                <div className="item-list">
                  <h3 style={{ marginBottom: "12px" }}>Existing Frames ({frames.length})</h3>
                  {frames.map(f => (
                    <div key={f.docId} className="list-item">
                      <div>
                        <div className="item-title">{f.name}</div>
                        <div className="item-sub">{f.id} • {f.orientation} • {f.price}</div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn-secondary" onClick={() => editFrame(f)}>Edit</button>
                        <button className="btn-secondary" style={{ color: "#FF5A5A" }} onClick={() => handleDeleteFrame(f.docId)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <>
              <div className="content-header">
                <h2>Customer Orders</h2>
              </div>
              {orders.length === 0 ? <p style={{ color: "var(--text2)" }}>No orders have been placed yet.</p> : (
                orders.map(o => (
                  <div key={o.docId} className="order-card">
                    <div className="order-header">
                      <div>
                        <strong style={{ color: "var(--accent)", fontSize: "16px" }}>{o.orderId}</strong>
                        <span style={{ marginLeft: "12px", fontSize: "12px", color: "var(--text2)" }}>
                          {o.createdAt ? new Date(o.createdAt).toLocaleString() : "Just now"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <select 
                          value={o.status || "Pending"} 
                          onChange={(e) => handleUpdateOrderStatus(o.docId, e.target.value)}
                          style={{
                            background: "var(--surface2)",
                            color: "var(--accent)",
                            border: "1px solid var(--border2)",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            outline: "none",
                            cursor: "pointer"
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <strong style={{ color: "#FFF" }}>Grand Total: Rs. {o.total?.toLocaleString()} (COD)</strong>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "24px" }}>
                      <div>
                        <h4 style={{ fontSize: "12px", color: "var(--text2)", textTransform: "uppercase", marginBottom: "8px" }}>Customer Info</h4>
                        <p style={{ fontSize: "13px" }}><strong>{o.customer?.name}</strong></p>
                        <p style={{ fontSize: "13px" }}>{o.customer?.phone} | {o.customer?.email}</p>
                        <p style={{ fontSize: "13px", marginTop: "8px", color: "var(--text2)" }}>
                          {o.customer?.address}<br/>{o.customer?.city}, {o.customer?.state} {o.customer?.zip}
                        </p>
                      </div>
                      <div>
                        <h4 style={{ fontSize: "12px", color: "var(--text2)", textTransform: "uppercase", marginBottom: "12px" }}>Order Items</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                          {o.items?.map((item, i) => (
                            <div key={i} style={{ 
                              display: "flex", 
                              gap: "16px", 
                              alignItems: "center", 
                              background: "var(--bg)", 
                              border: "1px solid var(--border)", 
                              borderRadius: "8px", 
                              padding: "10px 14px" 
                            }}>
                              {/* Customer Image Live Preview & Link */}
                              <div style={{
                                width: "60px",
                                height: "60px",
                                background: item.frameColor || "#333",
                                padding: "4px",
                                borderRadius: "4px",
                                display: "flex",
                                flexShrink: 0,
                                boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                                position: "relative"
                              }}>
                                {item.image ? (
                                  <img 
                                    src={item.image} 
                                    alt={item.frameName} 
                                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "2px" }} 
                                  />
                                ) : (
                                  <div style={{ flex: 1, background: "#2D2822", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "rgba(201,168,76,0.15)" }}>❧</div>
                                )}
                              </div>
                              
                              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontWeight: "700", color: "#FFF", fontSize: "14px" }}>{item.quantity}x {item.frameName}</span>
                                  <span style={{ color: "var(--accent)", fontWeight: "700", fontSize: "14px" }}>{item.price}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--text2)" }}>
                                  <span>{item.rotation === 0 ? "Portrait" : `Rotated ${item.rotation}°`}</span>
                                  {item.image && (
                                    <a 
                                      href={item.image} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      style={{ 
                                        color: "var(--accent)", 
                                        textDecoration: "none", 
                                        fontWeight: "500", 
                                        display: "inline-flex", 
                                        alignItems: "center", 
                                        gap: "4px",
                                        background: "rgba(201,168,76,0.08)",
                                        padding: "3px 8px",
                                        borderRadius: "12px",
                                        border: "1px solid rgba(201,168,76,0.2)"
                                      }}
                                    >
                                      Live Image Link 🔗
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
