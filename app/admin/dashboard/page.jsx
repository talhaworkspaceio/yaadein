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
  id: "", name: "", price: "Rs. ", category: "", color: "#8B5E3C", desc: "", tag: "",
  orientation: "portrait", imageUrl: "", paddingTop: 0, paddingLeft: 0, paddingBottom: 0, paddingRight: 0, aspectRatio: 1.0
};

export default function AdminDashboard() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState("frames"); // 'frames' | 'orders'

  // Data
  const [frames, setFrames] = useState([]);
  const [orders, setOrders] = useState([]);

  // Order Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPayment, setFilterPayment] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");

  // Frame Form
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Categories state
  const [categories, setCategories] = useState([]);
  const [categoryFormName, setCategoryFormName] = useState("");
  const [categoryEditingId, setCategoryEditingId] = useState(null);

  // CSV state
  const [csvStatus, setCsvStatus] = useState(null);

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

    const categoriesRef = ref(db, "categories");
    const unsubCategories = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const catList = Object.entries(data).map(([key, val]) => ({
          docId: key,
          name: val.name
        }));
        setCategories(catList);
      } else {
        // Automatically seed default categories if empty
        const defaultCats = ["Portrait", "Landscape", "Service", "Board Game", "Nikkah Nama Frame"];
        defaultCats.forEach(cat => {
          push(ref(db, "categories"), { name: cat });
        });
      }
    });

    return () => {
      unsubFrames();
      unsubOrders();
      unsubCategories();
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

  // CSV helper
  const parseCSV = (text) => {
    const lines = [];
    let row = [""];
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i+1];
      
      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++; // skip next double quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push('');
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') {
          i++; // skip \n
        }
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }
    return lines;
  };

  const handleDownloadCSVTemplate = () => {
    const headers = [
      "id", "name", "price", "category", "orientation", "desc", "color", "tag", "imageUrl", "paddingTop", "paddingLeft", "paddingBottom", "paddingRight", "aspectRatio"
    ];
    
    const rows = [
      [
        "classic-oak", "Classic Oak", "Rs. 4,900", "Portrait", "portrait", "Warm traditional solid oak framing.", "#8B5E3C", "Artisanal Wood", "/frames/portrait/frame-01-correct-size.webp", "8.97", "12.04", "9.03", "12.33", "0.6667"
      ],
      [
        "landscape-oak", "Landscape Oak", "Rs. 4,900", "Landscape", "landscape", "Wide landscape orientation frame.", "#8B5E3C", "Artisanal Wood", "/frames/landscape/frame-04-correct-size.webp", "7.22", "6.04", "7.06", "6.07", "1.5"
      ]
    ];
    
    const csvString = [headers.join(","), ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "frames_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      try {
        const parsed = parseCSV(text);
        if (parsed.length < 2) {
          throw new Error("CSV file is empty or only contains header row.");
        }
        
        const headers = parsed[0].map(h => h.trim().toLowerCase());
        const requiredHeaders = ["id", "name", "price"];
        for (const req of requiredHeaders) {
          if (!headers.includes(req)) {
            throw new Error(`Missing required header: ${req}`);
          }
        }
        
        let successCount = 0;
        let skipCount = 0;
        const errors = [];
        
        for (let i = 1; i < parsed.length; i++) {
          const row = parsed[i];
          if (row.length === 1 && row[0] === "") continue; // skip blank lines
          
          const frameData = {};
          headers.forEach((header, index) => {
            const val = row[index] ? row[index].trim() : "";
            if (header === "aspectratio") frameData.aspectRatio = parseFloat(val) || 1.0;
            else if (header === "paddingtop") frameData.paddingTop = parseFloat(val) || 0;
            else if (header === "paddingleft") frameData.paddingLeft = parseFloat(val) || 0;
            else if (header === "paddingbottom") frameData.paddingBottom = parseFloat(val) || 0;
            else if (header === "paddingright") frameData.paddingRight = parseFloat(val) || 0;
            else if (header === "imageurl") frameData.imageUrl = val;
            else frameData[header] = val;
          });
          
          if (!frameData.id || !frameData.name || !frameData.price) {
            errors.push(`Row ${i + 1}: Missing required fields.`);
            skipCount++;
            continue;
          }
          
          const frameRef = ref(db, `frames/${frameData.id}`);
          await set(frameRef, frameData);
          successCount++;
        }
        
        setCsvStatus({
          error: false,
          message: `Import complete! Successfully imported ${successCount} products.${skipCount > 0 ? ` Skipped ${skipCount} rows.` : ""}`
        });
        alert(`Import successful: ${successCount} products imported.`);
      } catch (err) {
        console.error(err);
        setCsvStatus({
          error: true,
          message: `Import failed: ${err.message}`
        });
        alert(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Category handlers
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryFormName.trim()) return;
    try {
      if (categoryEditingId) {
        const catRef = ref(db, `categories/${categoryEditingId}`);
        await set(catRef, { name: categoryFormName.trim() });
      } else {
        const catRef = ref(db, "categories");
        const newCatRef = push(catRef);
        await set(newCatRef, { name: categoryFormName.trim() });
      }
      resetCategoryForm();
    } catch (err) {
      console.error(err);
      alert("Error saving category");
    }
  };

  const editCategory = (c) => {
    setCategoryFormName(c.name);
    setCategoryEditingId(c.docId);
  };

  const resetCategoryForm = () => {
    setCategoryFormName("");
    setCategoryEditingId(null);
  };

  const handleDeleteCategory = async (docId) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const catRef = ref(db, `categories/${docId}`);
      await remove(catRef);
    } catch (err) {
      console.error(err);
      alert("Failed to delete category");
    }
  };

  if (!authChecked) return null;

  return (
    <div className="admin-root">
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{
        __html: `
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

        .btn-primary {
          padding: 10px 20px !important;
          border-radius: 9999px !important;
        }
        .btn-secondary {
          background: var(--surface2) !important;
          color: var(--text) !important;
          border: 1px solid var(--border2) !important;
          padding: 10px 20px !important;
          border-radius: 9999px !important;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.2s ease;
        }
        .btn-secondary:hover {
          background: var(--surface3) !important;
          border-color: var(--accent) !important;
        }

        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: start; }
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; }
        
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 11px; color: var(--text2); text-transform: uppercase; }
        .form-control { background: var(--surface2); border: 1px solid var(--border2); color: var(--text); padding: 10px; border-radius: var(--radius); font-size: 13px; }

        .item-list { display: flex; flex-direction: column; gap: 12px; }
        .list-item { background: var(--surface2); border: 1px solid var(--border2); padding: 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
        .item-title { font-family: 'DM Serif Display', serif; font-size: 16px; color: var(--accent); }
        .item-sub { font-size: 12px; color: var(--text2); margin-top: 4px; }
        
        .order-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 20px; margin-bottom: 16px; }
        .order-header { display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 12px; }

        /* ── ORDER FILTERS ── */
        .order-filters-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-bottom: 24px;
          padding: 18px 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
        }
        .filter-search {
          flex: 1;
          min-width: 200px;
          background: var(--surface2);
          border: 1px solid var(--border2);
          color: var(--text);
          padding: 9px 14px 9px 36px;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .filter-search:focus { border-color: var(--accent); }
        .filter-search::placeholder { color: var(--text2); opacity: 0.7; }
        .filter-search-wrap {
          position: relative;
          flex: 1;
          min-width: 200px;
        }
        .filter-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 14px;
          color: var(--text2);
          pointer-events: none;
        }
        .filter-select {
          background: var(--surface2);
          border: 1px solid var(--border2);
          color: var(--text);
          padding: 9px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s ease;
          font-family: 'DM Sans', sans-serif;
          -webkit-appearance: none;
          appearance: none;
          min-width: 140px;
        }
        .filter-select:focus { border-color: var(--accent); }
        .filter-select-wrap {
          position: relative;
        }
        .filter-select-wrap::after {
          content: '▾';
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 11px;
          color: var(--text2);
          pointer-events: none;
        }
        .filter-label {
          font-size: 10px;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 700;
          margin-bottom: 4px;
          display: block;
        }
        .filter-group {
          display: flex;
          flex-direction: column;
        }
        .filter-results-count {
          font-size: 12px;
          color: var(--text2);
          margin-left: auto;
          white-space: nowrap;
          font-weight: 500;
        }
        .filter-clear-btn {
          background: none;
          border: 1px solid rgba(255, 90, 90, 0.3);
          color: #FF7777;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .filter-clear-btn:hover {
          background: rgba(255, 90, 90, 0.08);
          border-color: #FF5A5A;
          color: #FF5A5A;
        }

        .receipt-lightbox-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.92);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          cursor: zoom-out;
          animation: fadeInLightbox 0.2s ease;
        }
        .receipt-lightbox-overlay img {
          max-width: 90vw;
          max-height: 85vh;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8);
          border: 2px solid rgba(201, 168, 76, 0.3);
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
      ` }} />

      <header className="admin-header">
        <div className="admin-brand">Yaadein Admin</div>
        <button className="admin-logout" onClick={() => { sessionStorage.clear(); router.push('/admin'); }}>Logout</button>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <button className={`tab-btn ${activeTab === 'frames' ? 'active' : ''}`} onClick={() => setActiveTab('frames')}>Frame Catalog</button>
          <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Incoming Orders</button>
          <button className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>Manage Categories</button>
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
                      <div className="form-group"><label>Category</label>
                        <select className="form-control" name="category" value={formData.category || ""} onChange={handleFormChange} required>
                          <option value="">-- Select Category --</option>
                          {categories.map(c => (
                            <option key={c.docId} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: "16px" }}><label>Description</label><textarea required className="form-control" name="desc" value={formData.desc} onChange={handleFormChange} /></div>
                    <div className="form-row">
                      <div className="form-group"><label>Fallback Hex Color</label><input required className="form-control" name="color" value={formData.color} onChange={handleFormChange} /></div>
                      <div className="form-group"><label>Orientation</label>
                        <select className="form-control" name="orientation" value={formData.orientation} onChange={handleFormChange}>
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Landscape</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
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
                  {/* Bulk CSV Import */}
                  <div className="card" style={{ marginBottom: "24px" }}>
                    <h3 style={{ marginBottom: "16px" }}>Bulk CSV Import</h3>
                    <p style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "16px", lineHeight: "1.5" }}>
                      Upload an Excel-compatible CSV file to import multiple products at once. Make sure to map categories correctly.
                    </p>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                      <button type="button" className="btn-secondary" onClick={handleDownloadCSVTemplate} style={{ fontSize: "11px", padding: "8px 16px" }}>
                        📥 Download Template
                      </button>
                      <label className="btn-secondary" style={{ fontSize: "11px", padding: "8px 16px", cursor: "pointer", display: "inline-block" }}>
                        📁 Upload CSV File
                        <input 
                          type="file" 
                          accept=".csv" 
                          onChange={handleCSVUpload} 
                          style={{ display: "none" }} 
                        />
                      </label>
                    </div>
                    {csvStatus && (
                      <div style={{
                        padding: "12px",
                        background: csvStatus.error ? "rgba(255, 90, 90, 0.08)" : "rgba(201, 168, 76, 0.08)",
                        border: `1px solid ${csvStatus.error ? "#FF5A5A" : "rgba(201, 168, 76, 0.3)"}`,
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: csvStatus.error ? "#FF7777" : "var(--text)",
                        lineHeight: "1.5"
                      }}>
                        {csvStatus.message}
                      </div>
                    )}
                  </div>

                  <h3 style={{ marginBottom: "12px" }}>Existing Frames ({frames.length})</h3>
                  {frames.map(f => (
                    <div key={f.docId} className="list-item">
                      <div>
                        <div className="item-title">{f.name}</div>
                        <div className="item-sub">{f.id} • {f.category || "No Category"} • {f.orientation} • {f.price}</div>
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

          {activeTab === 'categories' && (
            <>
              <div className="content-header">
                <h2>Product Categories</h2>
              </div>
              <div className="grid">
                <div className="card">
                  <h3 style={{ marginBottom: "20px" }}>{categoryEditingId ? "Edit Category" : "Create New Category"}</h3>
                  <form onSubmit={handleSaveCategory}>
                    <div className="form-group" style={{ marginBottom: "16px" }}>
                      <label>Category Name</label>
                      <input 
                        required 
                        className="form-control" 
                        value={categoryFormName} 
                        onChange={(e) => setCategoryFormName(e.target.value)}
                        placeholder="e.g. Nikkah Nama Frame"
                      />
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button type="submit" className="btn-primary">
                        {categoryEditingId ? "Update Category" : "Create Category"}
                      </button>
                      {categoryEditingId && (
                        <button type="button" className="btn-secondary" onClick={resetCategoryForm}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
                
                <div className="item-list">
                  <h3 style={{ marginBottom: "12px" }}>Existing Categories ({categories.length})</h3>
                  {categories.map(c => (
                    <div key={c.docId} className="list-item">
                      <div className="item-title">{c.name}</div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn-secondary" onClick={() => editCategory(c)}>Edit</button>
                        <button className="btn-secondary" style={{ color: "#FF5A5A" }} onClick={() => handleDeleteCategory(c.docId)}>Delete</button>
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

              {/* ── FILTER BAR ── */}
              <div className="order-filters-bar">
                <div className="filter-search-wrap">
                  <span className="filter-search-icon">🔍</span>
                  <input
                    type="text"
                    className="filter-search"
                    placeholder="Search by Order ID or Customer Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
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
                  <button
                    className="filter-clear-btn"
                    onClick={() => { setSearchQuery(""); setFilterStatus("All"); setFilterPayment("All"); setSortOrder("newest"); }}
                  >
                    ✕ Clear Filters
                  </button>
                )}
              </div>

              {(() => {
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

                if (sortOrder === "oldest") {
                  filtered = [...filtered].reverse();
                }

                if (filtered.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text2)" }}>
                      <div style={{ fontSize: "36px", marginBottom: "12px", opacity: 0.4 }}>📭</div>
                      <p style={{ fontSize: "14px" }}>
                        {orders.length === 0
                          ? "No orders have been placed yet."
                          : "No orders match the current filters."}
                      </p>
                    </div>
                  );
                }

                return (
                  <>
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
                            <strong style={{ color: "#FFF" }}>Grand Total: Rs. {o.total?.toLocaleString()} ({o.paymentMethod || "COD"})</strong>

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
                            <p style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <span>{o.customer?.phone} | {o.customer?.email}</span>
                              <button
                                onClick={() => {
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
                                  const messageText = `*Yaadein Order Confirmation* 🌟\n\n` +
                                    `Order Reference: *${o.orderId}*\n` +
                                    `Customer Name: *${o.customer?.name}*\n` +
                                    `Phone: *${o.customer?.phone}*\n` +
                                    `Address: *${o.customer?.address || ""}, ${o.customer?.city || ""}, ${o.customer?.state || ""} ${o.customer?.zip || ""}*\n` +
                                    `Payment Method: *${o.paymentMethod || "Prepaid"}*\n` +
                                    `Grand Total: *Rs. ${o.total?.toLocaleString()}*\n\n` +
                                    `Thank you for framing with Yaadein! Your order is confirmed and currently processing.`;
                                  const whatsappUrl = `https://wa.me/${getWhatsAppNumber(o.customer?.phone)}?text=${encodeURIComponent(messageText)}`;
                                  window.open(whatsappUrl, "_blank");
                                }}
                                style={{
                                  background: "rgba(37, 211, 102, 0.1)",
                                  border: "1px solid #25D366",
                                  color: "#25D366",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  cursor: "pointer",
                                  fontWeight: "bold",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  transition: "all 0.2s ease"
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
                              <p style={{ fontSize: "13px" }}>
                                Method: <strong style={{ color: "var(--accent)" }}>{o.paymentMethod || "N/A"}</strong>
                              </p>
                              {o.paymentReceiptUrl ? (
                                <div style={{ marginTop: "8px" }}>
                                  <a
                                    href={o.paymentReceiptUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: "var(--accent)",
                                      textDecoration: "none",
                                      fontSize: "12px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      background: "rgba(201, 168, 76, 0.08)",
                                      padding: "4px 10px",
                                      borderRadius: "6px",
                                      border: "1px solid rgba(201, 168, 76, 0.2)"
                                    }}
                                  >
                                    📄 View Payment Receipt 🔗
                                  </a>
                                  <div style={{
                                    marginTop: "8px",
                                    width: "120px",
                                    height: "80px",
                                    borderRadius: "4px",
                                    overflow: "hidden",
                                    border: "1px solid var(--border2)",
                                    background: "#000",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
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
                                    <img
                                      src={o.paymentReceiptUrl}
                                      alt="Receipt Thumbnail"
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
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
                    ))}

                  </>
                );
              })()}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
