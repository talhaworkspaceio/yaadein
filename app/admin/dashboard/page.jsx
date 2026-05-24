"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { ref, onValue, set, push, remove } from "firebase/database";

const AVAILABLE_FRAME_IMAGES = [
  { value: "/frames/portrait/frame-01-correct-size.webp", label: "Portrait - Frame 01 (Oak)", orientation: "portrait", top: 8.97, left: 12.04, bottom: 9.03, right: 12.33, ratio: 0.6667 },
  { value: "/frames/portrait/frame-02-correct-size.webp", label: "Portrait - Frame 02 (Black)", orientation: "portrait", top: 12.61, left: 15.08, bottom: 13.19, right: 15.54, ratio: 0.6667 },
  { value: "/frames/portrait/frame-03-correct-size.webp", label: "Portrait - Frame 03 (Gold)", orientation: "portrait", top: 9.11, left: 10.94, bottom: 9.29, right: 11.20, ratio: 0.6667 },
  { value: "/frames/landscape/frame-04-correct-size.webp", label: "Landscape - Frame 04 (Oak)", orientation: "landscape", top: 7.22, left: 6.04, bottom: 7.06, right: 6.07, ratio: 1.5 },
  { value: "/frames/landscape/Irrelevant Image.png", label: "Landscape - Irrelevant Image", orientation: "landscape", top: 21.48, left: 12.89, bottom: 21.39, right: 12.89, ratio: 1.0 }
];

const BASE_FRAMES = [
  { 
    id: "classic-oak", 
    name: "Classic Oak", 
    price: "Rs. 4,900", 
    color: "#8B5E3C", 
    desc: "Warm traditional solid oak, showcasing rich organic grain patterns.", 
    tag: "Artisanal Wood", 
    orientation: "portrait", 
    imageUrl: "/frames/portrait/frame-01-correct-size.webp",
    paddingTop: 8.97,
    paddingLeft: 12.04,
    paddingBottom: 9.03,
    paddingRight: 12.33,
    aspectRatio: 0.6667
  },
  { 
    id: "matte-black", 
    name: "Matte Black", 
    price: "Rs. 3,900", 
    color: "#1A1A1A", 
    desc: "Sleek, minimalist exhibition profile for modern photographic art.", 
    tag: "Gallery Classic", 
    orientation: "portrait", 
    imageUrl: "/frames/portrait/frame-02-correct-size.webp",
    paddingTop: 12.61,
    paddingLeft: 15.08,
    paddingBottom: 13.19,
    paddingRight: 15.54,
    aspectRatio: 0.6667
  },
  { 
    id: "antique-gold", 
    name: "Antique Gold", 
    price: "Rs. 7,900", 
    color: "#C9A84C", 
    desc: "Luxury baroque detailing finished with gold-leaf accents.", 
    tag: "Heritage Luxury", 
    orientation: "portrait", 
    imageUrl: "/frames/portrait/frame-03-correct-size.webp",
    paddingTop: 9.11,
    paddingLeft: 10.94,
    paddingBottom: 9.29,
    paddingRight: 11.20,
    aspectRatio: 0.6667
  },
  { 
    id: "landscape-oak", 
    name: "Landscape Oak", 
    price: "Rs. 4,900", 
    color: "#8B5E3C", 
    desc: "Warm traditional solid oak, wide landscape orientation.", 
    tag: "Artisanal Wood", 
    orientation: "landscape", 
    imageUrl: "/frames/landscape/frame-04-correct-size.webp",
    paddingTop: 7.22,
    paddingLeft: 6.04,
    paddingBottom: 7.06,
    paddingRight: 6.07,
    aspectRatio: 1.5
  },
  { 
    id: "gallery-landscape", 
    name: "Gallery Landscape", 
    price: "Rs. 5,900", 
    color: "#777570", 
    desc: "A wide landscape frame mockup set against a clean room background.", 
    tag: "Contemporary", 
    orientation: "landscape", 
    imageUrl: "/frames/landscape/Irrelevant Image.png",
    paddingTop: 21.48,
    paddingLeft: 12.89,
    paddingBottom: 21.39,
    paddingRight: 12.89,
    aspectRatio: 1.0
  }
];

const INITIAL_FORM = {
  id: "", name: "", price: "Rs. ", color: "#8B5E3C", desc: "", tag: "", 
  orientation: "portrait", imageUrl: "", paddingTop: 0, paddingLeft: 0, paddingBottom: 0, paddingRight: 0, aspectRatio: 1.0
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
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Cloudinary Upload Config (hardcoded)
  const cloudinaryCloud = "hpikhwjw";
  const cloudinaryPreset = "ml_default";
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const dataUpload = new FormData();
    dataUpload.append("file", file);
    dataUpload.append("upload_preset", cloudinaryPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloud}/image/upload`, {
        method: "POST",
        body: dataUpload,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to upload image to Cloudinary");
      }

      const result = await res.json();
      setFormData(prev => ({
        ...prev,
        imageUrl: result.secure_url
      }));
      alert("Image uploaded to Cloudinary successfully! URL stored in form.");
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      alert(`Cloudinary upload failed: ${err.message}`);
      e.target.value = "";
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteOrder = async (docId) => {
    if (!confirm("Are you sure you want to delete this order permanently?")) return;
    try {
      const orderRef = ref(db, `orders/${docId}`);
      await remove(orderRef);
      alert("Order deleted successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to delete order.");
    }
  };

  const handleSelectTemplate = (e) => {
    const val = e.target.value;
    setSelectedTemplate(val);
    if (!val) return;
    const template = AVAILABLE_FRAME_IMAGES.find(x => x.value === val);
    if (template) {
      setFormData(prev => ({
        ...prev,
        orientation: template.orientation,
        paddingTop: template.top,
        paddingLeft: template.left,
        paddingBottom: template.bottom,
        paddingRight: template.right,
        aspectRatio: template.ratio
      }));
    }
  };

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
    if (!formData.imageUrl) {
      alert("Please upload a local image to Cloudinary first!");
      return;
    }
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
    const match = AVAILABLE_FRAME_IMAGES.find(img => img.value === f.imageUrl);
    setSelectedTemplate(match ? match.value : "");
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setIsEditing(false);
    setEditId(null);
    setSelectedTemplate("");
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
                      <div className="form-group"><label>Fallback Hex Color</label><input required className="form-control" name="color" value={formData.color} onChange={handleFormChange} /></div>
                      <div className="form-group"><label>Tag</label><input required className="form-control" name="tag" value={formData.tag} onChange={handleFormChange} /></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Select Image Template (Prefills Margins)</label>
                        <select className="form-control" onChange={handleSelectTemplate} value={selectedTemplate}>
                          <option value="">-- Custom / Select Image --</option>
                          {AVAILABLE_FRAME_IMAGES.map(img => (
                            <option key={img.value} value={img.value}>{img.label}</option>
                          ))}
                        </select>
                        <span style={{ fontSize: "10px", color: "var(--text2)", marginTop: "4px" }}>Note: This pre-fills dimension settings. You must still select the file below to upload to Cloudinary.</span>
                      </div>
                      <div className="form-group">
                        <label>Select Local Image file (Upload to Cloudinary)</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="form-control" 
                          onChange={handleFileChange}
                          disabled={uploadingImage}
                          style={{ background: "var(--surface2)", color: "var(--text)" }}
                        />
                        {uploadingImage && <div style={{ fontSize: "11px", color: "var(--accent)", marginTop: "4px" }}>Uploading image to Cloudinary... ⌛</div>}
                      </div>
                    </div>
                    {formData.imageUrl && (
                      <div style={{
                        marginTop: "16px",
                        marginBottom: "16px",
                        padding: "12px",
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid var(--border2)",
                        borderRadius: "8px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        <span style={{ fontSize: "11px", color: "var(--text2)", alignSelf: "flex-start", textTransform: "uppercase" }}>Uploaded Image Preview</span>
                        <div style={{
                          width: "100%",
                          maxHeight: "150px",
                          overflow: "hidden",
                          borderRadius: "4px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          background: "#000"
                        }}>
                          <img 
                            src={formData.imageUrl} 
                            alt="Frame Preview" 
                            style={{ maxWidth: "100%", maxHeight: "150px", objectFit: "contain" }} 
                          />
                        </div>
                        <button 
                          type="button" 
                          className="btn-secondary" 
                          style={{ fontSize: "11px", padding: "4px 10px", color: "#FF5A5A", borderColor: "rgba(255, 90, 90, 0.2)" }} 
                          onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                    <div className="form-row">
                      <div className="form-group">
                        <label>Uploaded Live URL (From Cloudinary - Read Only)</label>
                        <input readOnly className="form-control" name="imageUrl" value={formData.imageUrl || ""} placeholder="No image uploaded yet" style={{ opacity: 0.7, cursor: "not-allowed" }} />
                      </div>
                      <div className="form-group"><label>Aspect Ratio (W/H)</label><input required type="number" step="any" className="form-control" name="aspectRatio" value={formData.aspectRatio || ""} onChange={handleFormChange} placeholder="0.6667" /></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Padding Top (%)</label><input required type="number" step="any" className="form-control" name="paddingTop" value={formData.paddingTop || 0} onChange={handleFormChange} /></div>
                      <div className="form-group"><label>Padding Left (%)</label><input required type="number" step="any" className="form-control" name="paddingLeft" value={formData.paddingLeft || 0} onChange={handleFormChange} /></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Padding Bottom (%)</label><input required type="number" step="any" className="form-control" name="paddingBottom" value={formData.paddingBottom || 0} onChange={handleFormChange} /></div>
                      <div className="form-group"><label>Padding Right (%)</label><input required type="number" step="any" className="form-control" name="paddingRight" value={formData.paddingRight || 0} onChange={handleFormChange} /></div>
                    </div>
                    <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                      <button 
                        type="submit" 
                        className="btn-primary" 
                        disabled={uploadingImage || !formData.imageUrl}
                        style={{
                          opacity: (uploadingImage || !formData.imageUrl) ? 0.5 : 1,
                          cursor: (uploadingImage || !formData.imageUrl) ? "not-allowed" : "pointer"
                        }}
                      >
                        {uploadingImage ? "Uploading image..." : isEditing ? "Update Frame" : "Create Frame"}
                      </button>
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
                        
                        {/* Delete Order button */}
                        <button
                          onClick={() => handleDeleteOrder(o.docId)}
                          style={{
                            background: "none",
                            border: "1px solid #FF5A5A",
                            color: "#FF5A5A",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            marginLeft: "10px"
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
