"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../lib/firebase";
import { ref, onValue, set, push, remove } from "firebase/database";
import FrameLoader from "../../../components/FrameLoader";

const AVAILABLE_FRAME_IMAGES = [
  { value: "/frames/portrait/frame-01-correct-size.webp", label: "Portrait - Frame 01 (Oak)", orientation: "portrait", top: 8.97, left: 12.04, bottom: 9.03, right: 12.33, ratio: 0.6667 },
  { value: "/frames/portrait/frame-02-correct-size.webp", label: "Portrait - Frame 02 (Black)", orientation: "portrait", top: 12.61, left: 15.08, bottom: 13.19, right: 15.54, ratio: 0.6667 },
  { value: "/frames/portrait/frame-03-correct-size.webp", label: "Portrait - Frame 03 (Gold)", orientation: "portrait", top: 9.11, left: 10.94, bottom: 9.29, right: 11.20, ratio: 0.6667 },
  { value: "/frames/landscape/frame-04-correct-size.webp", label: "Landscape - Frame 04 (Oak)", orientation: "landscape", top: 7.22, left: 6.04, bottom: 7.06, right: 6.07, ratio: 1.5 },
  { value: "/frames/landscape/Irrelevant Image.png", label: "Landscape - Irrelevant Image", orientation: "landscape", top: 21.48, left: 12.89, bottom: 21.39, right: 12.89, ratio: 1.0 }
];



const DEFAULT_SIZES = [
  { label: "8x10", displayLabel: '8" x 10"', priceDelta: 0 },
  { label: "12x16", displayLabel: '12" x 16"', priceDelta: 1500 },
  { label: "16x20", displayLabel: '16" x 20"', priceDelta: 4000 },
  { label: "24x36", displayLabel: '24" x 36"', priceDelta: 8000 },
];

const INITIAL_FORM = {
  id: "", name: "", price: "Rs. ", category: "", color: "#8B5E3C", desc: "", tag: "",
  orientation: "portrait", imageUrl: "", thumbnailUrl: "", paddingTop: 0, paddingLeft: 0, paddingBottom: 0, paddingRight: 0, aspectRatio: 1.0,
  stock: 10,
  featured: false,
  sizes: [...DEFAULT_SIZES],
};

// ── SVG Icons ──
const IconPlus = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const IconEdit = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>);
const IconTrash = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>);
const IconDownload = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>);
const IconUpload = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>);
const IconImage = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>);
const IconX = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
const IconFrame = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><rect x="7" y="7" width="10" height="10" rx="1" /></svg>);
const IconCheck = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>);
const IconLoader = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" /></svg>);
const IconStar = ({ filled }) => (<svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>);
const IconSearch = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>);
const IconRuler = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.4 2.4 0 010 3.4l-2.6 2.6a2.4 2.4 0 01-3.4 0L2.7 8.7a2.4 2.4 0 010-3.4l2.6-2.6a2.4 2.4 0 013.4 0z" /><line x1="14.5" y1="12.5" x2="11" y2="16" /><line x1="11.5" y1="9.5" x2="8" y2="13" /><line x1="8.5" y1="6.5" x2="5" y2="10" /></svg>);
const IconPackage = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>);

export default function FramesPage() {
  const [frames, setFrames] = useState([]);
  const [loadingFrames, setLoadingFrames] = useState(true);
  const [categories, setCategories] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [csvStatus, setCsvStatus] = useState(null);
  const [frameSearch, setFrameSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  // Cloudinary
  const cloudinaryCloud = "hpikhwjw";
  const cloudinaryPreset = "ml_default";
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setIsEditing(false);
    setEditId(null);
    setSelectedTemplate("");
    setFormOpen(false);
  };

  useEffect(() => {
    const unsubFrames = onValue(ref(db, "frames"), (snap) => {
      const data = snap.val();
      setFrames(data ? Object.entries(data).map(([k, v]) => ({ docId: k, ...v })) : []);
      setLoadingFrames(false);
    });
    const unsubCats = onValue(ref(db, "categories"), (snap) => {
      const data = snap.val();
      if (data) {
        setCategories(Object.entries(data).map(([k, v]) => ({ docId: k, name: v.name })));
      } else {
        ["Portrait", "Landscape", "Service", "Board Game", "Nikkah Nama Frame"].forEach(c => push(ref(db, "categories"), { name: c }));
      }
    });
    return () => { unsubFrames(); unsubCats(); };
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const dataUpload = new FormData();
    dataUpload.append("file", file);
    dataUpload.append("upload_preset", cloudinaryPreset);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloud}/image/upload`, { method: "POST", body: dataUpload });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || "Upload failed"); }
      const result = await res.json();
      setFormData(prev => ({
        ...prev,
        imageUrl: result.secure_url,
        thumbnailUrl: prev.thumbnailUrl || result.secure_url
      }));
      alert("Frame overlay image uploaded successfully!");
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
      e.target.value = "";
    } finally { setUploadingImage(false); }
  };

  const handleThumbnailFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumbnail(true);
    const dataUpload = new FormData();
    dataUpload.append("file", file);
    dataUpload.append("upload_preset", cloudinaryPreset);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloud}/image/upload`, { method: "POST", body: dataUpload });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || "Thumbnail upload failed"); }
      const result = await res.json();
      setFormData(prev => ({ ...prev, thumbnailUrl: result.secure_url }));
      alert("Frame thumbnail uploaded successfully!");
    } catch (err) {
      alert(`Thumbnail upload failed: ${err.message}`);
      e.target.value = "";
    } finally { setUploadingThumbnail(false); }
  };

  const handleSelectTemplate = (e) => {
    const val = e.target.value;
    setSelectedTemplate(val);
    if (!val) return;
    const t = AVAILABLE_FRAME_IMAGES.find(x => x.value === val);
    if (t) setFormData(prev => ({ ...prev, orientation: t.orientation, paddingTop: t.top, paddingLeft: t.left, paddingBottom: t.bottom, paddingRight: t.right, aspectRatio: t.ratio }));
  };



  const handleFormChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // ── Sizes management ──
  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...(prev.sizes || []), { label: "", displayLabel: "", priceDelta: 0 }]
    }));
  };

  const updateSize = (index, field, value) => {
    setFormData(prev => {
      const sizes = [...(prev.sizes || [])];
      sizes[index] = { ...sizes[index], [field]: field === "priceDelta" ? (parseInt(value) || 0) : value };
      return { ...prev, sizes };
    });
  };

  const removeSize = (index) => {
    setFormData(prev => ({
      ...prev,
      sizes: (prev.sizes || []).filter((_, i) => i !== index)
    }));
  };

  const handleSaveFrame = async (e) => {
    e.preventDefault();
    if (!formData.imageUrl) { alert("Please upload an image first!"); return; }
    try {
      const data = {
        ...formData,
        stock: parseInt(formData.stock) || 0,
        featured: !!formData.featured,
        createdAt: formData.createdAt || Date.now()
      };
      if (isEditing) await set(ref(db, `frames/${editId}`), data);
      else await set(ref(db, `frames/${formData.id}`), data);
      resetForm();
    } catch (e) { alert("Error saving frame"); }
  };

  // One-click featuring from the list, so curating the catalog does not mean
  // opening and saving each frame.
  const toggleFeatured = async (f) => {
    try {
      await set(ref(db, `frames/${f.docId}/featured`), !f.featured);
    } catch (e) {
      alert("Could not update the featured flag.");
    }
  };

  const handleDeleteFrame = async (docId) => {
    if (!confirm("Delete this frame?")) return;
    await remove(ref(db, `frames/${docId}`));
  };

  const editFrame = (f) => {
    setFormData({
      ...f,
      stock: f.stock ?? 0,
      featured: !!f.featured,
      sizes: f.sizes || [...DEFAULT_SIZES],
    });
    setEditId(f.docId);
    setIsEditing(true);
    setFormOpen(true);
    const match = AVAILABLE_FRAME_IMAGES.find(img => img.value === f.imageUrl);
    setSelectedTemplate(match ? match.value : "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // CSV
  const parseCSV = (text) => {
    const lines = []; let row = [""]; let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i]; const next = text[i + 1];
      if (c === '"') { if (inQuotes && next === '"') { row[row.length - 1] += '"'; i++; } else inQuotes = !inQuotes; }
      else if (c === ',' && !inQuotes) row.push('');
      else if ((c === '\r' || c === '\n') && !inQuotes) { if (c === '\r' && next === '\n') i++; lines.push(row); row = ['']; }
      else row[row.length - 1] += c;
    }
    if (row.length > 1 || row[0] !== '') lines.push(row);
    return lines;
  };

  const handleDownloadCSVTemplate = () => {
    const headers = ["id", "name", "price", "category", "orientation", "desc", "color", "tag", "imageUrl", "paddingTop", "paddingLeft", "paddingBottom", "paddingRight", "aspectRatio", "stock", "featured"];
    const rows = [
      ["classic-oak", "Classic Oak", "Rs. 4,900", "Portrait", "portrait", "Warm traditional solid oak framing.", "#8B5E3C", "Artisanal Wood", "/frames/portrait/frame-01-correct-size.webp", "8.97", "12.04", "9.03", "12.33", "0.6667", "10"],
    ];
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url); link.setAttribute("download", "frames_upload_template.csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      try {
        const parsed = parseCSV(text);
        if (parsed.length < 2) throw new Error("CSV is empty.");
        const headers = parsed[0].map(h => h.trim().toLowerCase());
        for (const req of ["id", "name", "price"]) { if (!headers.includes(req)) throw new Error(`Missing header: ${req}`); }
        let ok = 0, skip = 0;
        for (let i = 1; i < parsed.length; i++) {
          const row = parsed[i];
          if (row.length === 1 && row[0] === "") continue;
          const fd = {};
          headers.forEach((h, idx) => {
            const v = row[idx]?.trim() || "";
            if (h === "aspectratio") fd.aspectRatio = parseFloat(v) || 1.0;
            else if (h === "paddingtop") fd.paddingTop = parseFloat(v) || 0;
            else if (h === "paddingleft") fd.paddingLeft = parseFloat(v) || 0;
            else if (h === "paddingbottom") fd.paddingBottom = parseFloat(v) || 0;
            else if (h === "paddingright") fd.paddingRight = parseFloat(v) || 0;
            else if (h === "imageurl") fd.imageUrl = v;
            else if (h === "stock") fd.stock = parseInt(v) || 0;
            else if (h === "featured") fd.featured = /^(1|true|yes|y)$/i.test(String(v).trim());
            else fd[h] = v;
          });
          if (!fd.id || !fd.name || !fd.price) { skip++; continue; }
          if (!fd.sizes) fd.sizes = DEFAULT_SIZES;
          if (fd.stock === undefined) fd.stock = 0;
          if (fd.featured === undefined) fd.featured = false;
          if (!fd.createdAt) fd.createdAt = Date.now();
          await set(ref(db, `frames/${fd.id}`), fd);
          ok++;
        }
        setCsvStatus({ error: false, message: `Imported ${ok} products.${skip ? ` Skipped ${skip}.` : ""}` });
      } catch (err) {
        setCsvStatus({ error: true, message: `Failed: ${err.message}` });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Filtered frames
  const filteredFrames = frames.filter(f => {
    if (!frameSearch.trim()) return true;
    const q = frameSearch.toLowerCase();
    return [f.name, f.id, f.category, f.tag].some(v => (v || "").toLowerCase().includes(q));
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── PAGE ── */
        .fp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .fp-title { font-family: 'DM Serif Display', serif; font-size: 26px; font-weight: 400; margin-bottom: 4px; }
        .fp-sub { font-size: 13px; color: var(--text2); }

        /* ── TOP BAR ── */
        .fp-topbar {
          display: flex; gap: 16px; margin-bottom: 32px;
          animation: fadeInUp 0.35s ease both;
        }
        .fp-topbar-card {
          flex: 1; display: flex; align-items: center; gap: 16px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; padding: 20px 24px;
          cursor: pointer; transition: all 0.2s ease;
        }
        .fp-topbar-card:hover { border-color: rgba(201,168,76,0.25); }
        .fp-topbar-icon {
          width: 44px; height: 44px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .fp-topbar-value { font-size: 22px; font-weight: 700; }
        .fp-topbar-label { font-size: 11px; color: var(--text2); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-top: 2px; }

        /* ── ADD BUTTON ── */
        .fp-add-btn {
          display: flex; align-items: center; gap: 8px;
          background: var(--accent); color: #0C0A08;
          border: none; padding: 12px 24px; border-radius: 12px;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(201, 168, 76, 0.25);
        }
        .fp-add-btn:hover { background: #E8D48B; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(201,168,76,0.4); }

        /* ── FORM PANEL ── */
        .fp-form-panel {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; overflow: hidden;
          margin-bottom: 32px;
          animation: fadeInUp 0.4s ease both;
        }
        .fp-form-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 28px; border-bottom: 1px solid var(--border);
          background: rgba(255,255,255,0.01);
        }
        .fp-form-title {
          display: flex; align-items: center; gap: 10px;
          font-family: 'DM Serif Display', serif; font-size: 17px;
        }
        .fp-form-title-icon {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.15);
          color: var(--accent);
        }
        .fp-form-body { padding: 28px; }
        .fp-form-footer {
          padding: 18px 28px; border-top: 1px solid var(--border);
          background: rgba(255,255,255,0.01);
          display: flex; gap: 12px; align-items: center;
        }
        .fp-cancel-btn {
          background: none; border: none; color: var(--text2);
          cursor: pointer; display: flex; align-items: center; gap: 5px;
          font-size: 12px; font-family: 'DM Sans', sans-serif;
          padding: 6px 12px; border-radius: 8px;
          transition: all 0.15s ease;
        }
        .fp-cancel-btn:hover { color: var(--text); background: rgba(255,255,255,0.03); }

        /* ── FORM SECTIONS ── */
        .fp-section { margin-bottom: 28px; }
        .fp-section:last-child { margin-bottom: 0; }
        .fp-section-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--text2);
          margin-bottom: 16px; padding-bottom: 10px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: 8px;
        }
        .fp-section-label svg { opacity: 0.5; }
        .fp-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px; }

        /* ── SIZES MANAGER ── */
        .fp-sizes-list { display: flex; flex-direction: column; gap: 10px; }
        .fp-size-row {
          display: grid; grid-template-columns: 1fr 1.2fr 0.8fr 36px; gap: 12px;
          align-items: end;
        }
        .fp-size-remove {
          width: 36px; height: 38px; display: flex; align-items: center; justify-content: center;
          background: none; border: 1px solid rgba(255,90,90,0.2); color: #FF7777;
          border-radius: 8px; cursor: pointer; transition: all 0.15s ease;
        }
        .fp-size-remove:hover { background: rgba(255,90,90,0.08); border-color: #FF5A5A; }
        .fp-add-size-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: none; border: 1px dashed var(--border2); color: var(--text2);
          padding: 10px 16px; border-radius: 10px; cursor: pointer;
          font-size: 12px; font-weight: 600;
          transition: all 0.15s ease; font-family: 'DM Sans', sans-serif;
          margin-top: 8px;
        }
        .fp-add-size-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(201,168,76,0.04); }

        /* ── IMAGE PREVIEW ── */
        .fp-img-preview {
          margin-top: 16px; padding: 16px;
          background: rgba(255,255,255,0.015); border: 1px dashed var(--border2);
          border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .fp-img-preview-label {
          font-size: 10px; color: var(--text2); text-transform: uppercase;
          letter-spacing: 0.08em; font-weight: 600; align-self: flex-start;
          display: flex; align-items: center; gap: 6px;
        }
        .fp-img-container {
          width: 100%; max-height: 140px; overflow: hidden;
          border-radius: 8px; display: flex; justify-content: center;
          align-items: center; background: rgba(0,0,0,0.3);
        }
        .fp-img-container img { max-width: 100%; max-height: 140px; object-fit: contain; }
        .fp-img-remove {
          display: flex; align-items: center; gap: 6px;
          background: none; border: 1px solid rgba(255,90,90,0.25); color: #FF7777;
          font-size: 11px; font-weight: 600; padding: 5px 12px;
          border-radius: 6px; cursor: pointer; transition: all 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .fp-img-remove:hover { background: rgba(255,90,90,0.08); }

        /* ── BOTTOM SECTION: CSV + FRAME LIST ── */
        .fp-bottom { display: grid; grid-template-columns: 300px 1fr; gap: 28px; animation: fadeInUp 0.4s 0.1s ease both; }

        /* ── CSV CARD ── */
        .fp-csv {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; overflow: hidden; height: fit-content;
          position: sticky; top: 96px;
        }
        .fp-csv-header {
          display: flex; align-items: center; gap: 10px;
          padding: 18px 20px; border-bottom: 1px solid var(--border);
          background: rgba(255,255,255,0.01);
        }
        .fp-csv-icon {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(56,152,255,0.1); border: 1px solid rgba(56,152,255,0.15); color: #60BFFF;
        }
        .fp-csv-title { font-family: 'DM Serif Display', serif; font-size: 15px; }
        .fp-csv-body { padding: 18px 20px; }
        .fp-csv-desc { font-size: 11px; color: var(--text2); line-height: 1.6; margin-bottom: 14px; }
        .fp-csv-actions { display: flex; flex-direction: column; gap: 8px; }
        .fp-csv-btn {
          display: flex; align-items: center; gap: 8px; width: 100%;
          background: var(--surface2); border: 1px solid var(--border2);
          color: var(--text); font-size: 12px; font-weight: 600;
          padding: 10px 14px; border-radius: 8px; cursor: pointer;
          transition: all 0.2s ease; font-family: 'DM Sans', sans-serif;
        }
        .fp-csv-btn:hover { border-color: var(--accent); }
        .fp-csv-status {
          margin-top: 12px; padding: 10px; border-radius: 8px;
          font-size: 11px; line-height: 1.5; display: flex; align-items: center; gap: 6px;
        }
        .fp-csv-status.ok { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.25); color: #4ADE80; }
        .fp-csv-status.err { background: rgba(255,90,90,0.08); border: 1px solid rgba(255,90,90,0.25); color: #FF7777; }

        /* ── FRAME LIST ── */
        .fp-list {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; overflow: hidden;
        }
        .fp-list-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 18px 24px; border-bottom: 1px solid var(--border);
          background: rgba(255,255,255,0.01);
        }
        .fp-list-header-left { display: flex; align-items: center; gap: 10px; }
        .fp-list-icon {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.15); color: var(--accent);
        }
        .fp-list-title { font-family: 'DM Serif Display', serif; font-size: 16px; }
        .fp-count {
          background: rgba(201,168,76,0.12); color: var(--accent);
          font-size: 11px; font-weight: 700; padding: 3px 10px;
          border-radius: 20px; border: 1px solid rgba(201,168,76,0.2);
        }
        .fp-list-search { padding: 16px 24px 0; }
        .fp-search-wrap { position: relative; }
        .fp-search-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          color: var(--text2); pointer-events: none; display: flex;
        }
        .fp-search-input {
          width: 100%; background: var(--surface2); border: 1px solid var(--border2);
          color: var(--text); padding: 10px 14px 10px 36px; border-radius: 10px;
          font-size: 13px; outline: none; transition: border-color 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .fp-search-input:focus { border-color: var(--accent); }
        .fp-search-input::placeholder { color: var(--text2); opacity: 0.5; }
        .fp-list-body { padding: 12px 16px 16px; }
        .fp-empty { text-align: center; padding: 40px 20px; color: var(--text2); }
        .fp-empty-icon { opacity: 0.2; margin-bottom: 10px; }

        /* ── FRAME ITEM ── */
        .fp-item {
          display: flex; align-items: center; gap: 16px;
          padding: 14px 16px; border-radius: 12px;
          transition: all 0.15s ease; border: 1px solid transparent;
        }
        .fp-item:hover { background: rgba(255,255,255,0.02); border-color: var(--border); }
        .fp-item + .fp-item { border-top: 1px solid var(--border); }
        .fp-item:hover + .fp-item { border-top-color: transparent; }
        .fp-item-thumb {
          width: 52px; height: 52px; border-radius: 10px; overflow: hidden;
          flex-shrink: 0; background: var(--surface2); border: 1px solid var(--border2);
          display: flex; align-items: center; justify-content: center;
        }
        .fp-item-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .fp-item-info { flex: 1; min-width: 0; }
        .fp-item-name {
          font-weight: 600; font-size: 14px; color: var(--text);
          margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .fp-item-meta {
          font-size: 11px; color: var(--text2);
          display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
        }
        .fp-item-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--text2); opacity: 0.4; }
        .fp-item-color {
          width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .fp-item-stock {
          font-size: 10px; font-weight: 700; padding: 2px 8px;
          border-radius: 12px; white-space: nowrap;
        }
        .fp-item-stock.in { background: rgba(34,197,94,0.1); color: #4ADE80; border: 1px solid rgba(34,197,94,0.2); }
        .fp-item-stock.out { background: rgba(255,90,90,0.1); color: #FF7777; border: 1px solid rgba(255,90,90,0.2); }

        .fp-item-featured {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(201,168,76,0.12); color: var(--accent);
          border: 1px solid rgba(201,168,76,0.35);
          border-radius: 9999px; padding: 4px 11px;
          font-size: 11px; font-weight: 700; white-space: nowrap;
        }
        .fp-action-btn.star { padding: 7px 9px; color: var(--text2); }
        .fp-action-btn.star:hover { color: var(--accent); border-color: rgba(201,168,76,0.4); }
        .fp-action-btn.star.on { color: var(--accent); border-color: rgba(201,168,76,0.45); background: rgba(201,168,76,0.1); }

        .fp-feature-toggle {
          display: flex; align-items: center; gap: 8px;
          background: var(--surface2); border: 1px solid var(--border2);
          color: var(--text2); border-radius: 10px; padding: 10px 14px;
          font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer;
          transition: all 0.2s ease; text-align: left; width: 100%;
        }
        .fp-feature-toggle:hover { border-color: rgba(201,168,76,0.4); color: var(--text); }
        .fp-feature-toggle.on {
          background: rgba(201,168,76,0.1);
          border-color: rgba(201,168,76,0.45);
          color: var(--accent); font-weight: 600;
        }
        .fp-item-price { font-size: 13px; font-weight: 700; color: var(--accent); white-space: nowrap; margin-right: 8px; }
        .fp-item-actions { display: flex; gap: 6px; flex-shrink: 0; }
        .fp-action-btn {
          display: flex; align-items: center; justify-content: center; gap: 5px;
          background: none; border: 1px solid var(--border2); color: var(--text2);
          padding: 7px 12px; border-radius: 8px; cursor: pointer;
          font-size: 11px; font-weight: 600; transition: all 0.15s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .fp-action-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(201,168,76,0.06); }
        .fp-action-btn.danger:hover { border-color: #FF5A5A; color: #FF5A5A; background: rgba(255,90,90,0.06); }

        .url-readonly { opacity: 0.6; cursor: not-allowed; font-size: 11px !important; font-family: monospace !important; }
      ` }} />

      {/* ── PAGE HEADER ── */}
      <div className="fp-header">
        <div>
          <h2 className="fp-title">Frame Catalog</h2>
          <p className="fp-sub">Manage your product frames, sizes, and inventory</p>
        </div>
        {!formOpen && !isEditing && (
          <button className="fp-add-btn" onClick={() => { setFormOpen(true); resetForm(); setFormOpen(true); }}>
            <IconPlus /> Add New Frame
          </button>
        )}
      </div>

      {/* ── SUMMARY BAR ── */}
      <div className="fp-topbar">
        <div className="fp-topbar-card">
          <div className="fp-topbar-icon" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.15)", color: "var(--accent)" }}><IconFrame /></div>
          <div>
            <div className="fp-topbar-value">{frames.length}</div>
            <div className="fp-topbar-label">Total Frames</div>
          </div>
        </div>
        <div className="fp-topbar-card">
          <div className="fp-topbar-icon" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.15)", color: "#4ADE80" }}><IconPackage /></div>
          <div>
            <div className="fp-topbar-value">{frames.reduce((s, f) => s + (parseInt(f.stock) || 0), 0)}</div>
            <div className="fp-topbar-label">Total Stock</div>
          </div>
        </div>
        <div className="fp-topbar-card">
          <div className="fp-topbar-icon" style={{ background: "rgba(255,90,90,0.1)", border: "1px solid rgba(255,90,90,0.15)", color: "#FF7777" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          </div>
          <div>
            <div className="fp-topbar-value">{frames.filter(f => (parseInt(f.stock) || 0) === 0).length}</div>
            <div className="fp-topbar-label">Out of Stock</div>
          </div>
        </div>
        <div className="fp-topbar-card">
          <div className="fp-topbar-icon" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.15)", color: "var(--accent)" }}><IconStar filled /></div>
          <div>
            <div className="fp-topbar-value">{frames.filter(f => f.featured).length}</div>
            <div className="fp-topbar-label">Featured</div>
          </div>
        </div>
      </div>

      {/* ── FORM PANEL (collapsible) ── */}
      {(formOpen || isEditing) && (
        <div className="fp-form-panel">
          <div className="fp-form-header">
            <div className="fp-form-title">
              <div className="fp-form-title-icon">{isEditing ? <IconEdit /> : <IconPlus />}</div>
              {isEditing ? "Edit Frame" : "Add New Frame"}
            </div>
            <button className="fp-cancel-btn" onClick={resetForm}><IconX /> Close</button>
          </div>
          <form onSubmit={handleSaveFrame}>
            <div className="fp-form-body">

              {/* Basic Info */}
              <div className="fp-section">
                <div className="fp-section-label"><IconFrame /> Basic Information</div>
                <div className="fp-3col">
                  <div className="form-group"><label>Unique ID</label><input required className="form-control" name="id" value={formData.id} onChange={handleFormChange} disabled={isEditing} placeholder="e.g. classic-oak" /></div>
                  <div className="form-group"><label>Name</label><input required className="form-control" name="name" value={formData.name} onChange={handleFormChange} placeholder="e.g. Classic Oak" /></div>
                  <div className="form-group"><label>Price (Base)</label><input required className="form-control" name="price" value={formData.price} onChange={handleFormChange} placeholder="Rs. 4,900" /></div>
                </div>
                <div className="fp-3col">
                  <div className="form-group"><label>Category</label>
                    <select className="form-control" name="category" value={formData.category || ""} onChange={handleFormChange} required>
                      <option value="">-- Select --</option>
                      {categories.map(c => <option key={c.docId} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Tag</label><input required className="form-control" name="tag" value={formData.tag} onChange={handleFormChange} placeholder="e.g. Artisanal Wood" /></div>
                  <div className="form-group"><label>Stock Quantity</label><input required type="number" min="0" className="form-control" name="stock" value={formData.stock} onChange={handleFormChange} placeholder="10" /></div>
                  {/* Featured frames get their own carousel at the top of the catalog. */}
                  <div className="form-group">
                    <label>Featured</label>
                    <button
                      type="button"
                      className={`fp-feature-toggle ${formData.featured ? "on" : ""}`}
                      onClick={() => setFormData(prev => ({ ...prev, featured: !prev.featured }))}
                    >
                      <IconStar filled={!!formData.featured} />
                      {formData.featured ? "Featured on the catalog" : "Not featured"}
                    </button>
                  </div>
                </div>
                <div className="form-group"><label>Description</label><textarea required className="form-control" name="desc" value={formData.desc} onChange={handleFormChange} style={{ minHeight: "68px", resize: "vertical" }} placeholder="Describe this frame..." /></div>
              </div>

              {/* Available Sizes */}
              <div className="fp-section">
                <div className="fp-section-label"><IconRuler /> Available Sizes</div>
                <div className="fp-sizes-list">
                  {/* Header */}
                  <div className="fp-size-row" style={{ marginBottom: 4 }}>
                    <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Size Key</div>
                    <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Display Label</div>
                    <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Price ±</div>
                    <div></div>
                  </div>
                  {(formData.sizes || []).map((size, i) => (
                    <div key={i} className="fp-size-row">
                      <div className="form-group">
                        <input className="form-control" value={size.label} onChange={(e) => updateSize(i, "label", e.target.value)} placeholder="8x10" />
                      </div>
                      <div className="form-group">
                        <input className="form-control" value={size.displayLabel} onChange={(e) => updateSize(i, "displayLabel", e.target.value)} placeholder='8" x 10"' />
                      </div>
                      <div className="form-group">
                        <input type="number" className="form-control" value={size.priceDelta} onChange={(e) => updateSize(i, "priceDelta", e.target.value)} placeholder="0" />
                      </div>
                      <button type="button" className="fp-size-remove" onClick={() => removeSize(i)}><IconX /></button>
                    </div>
                  ))}
                </div>
                <button type="button" className="fp-add-size-btn" onClick={addSize}><IconPlus /> Add Size</button>
              </div>

              {/* Appearance */}
              <div className="fp-section">
                <div className="fp-section-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a15 15 0 014 10 15 15 0 01-4 10A15 15 0 018 12 15 15 0 0112 2z" /></svg>
                  Appearance
                </div>
                <div className="fp-3col">
                  <div className="form-group"><label>Fallback Color</label>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input required className="form-control" name="color" value={formData.color} onChange={handleFormChange} style={{ flex: 1 }} />
                      <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: formData.color, border: "1px solid var(--border2)", flexShrink: 0 }} />
                    </div>
                  </div>
                  <div className="form-group"><label>Orientation</label>
                    <select className="form-control" name="orientation" value={formData.orientation} onChange={handleFormChange}>
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Aspect Ratio</label><input required type="number" step="any" className="form-control" name="aspectRatio" value={formData.aspectRatio || ""} onChange={handleFormChange} placeholder="0.6667" /></div>
                </div>
              </div>

              {/* Image & Thumbnail */}
              <div className="fp-section">
                <div className="fp-section-label"><IconImage /> Frame Picture & Thumbnail</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Image Template (Prefills Margins)</label>
                    <select className="form-control" onChange={handleSelectTemplate} value={selectedTemplate}>
                      <option value="">-- Custom / Select --</option>
                      {AVAILABLE_FRAME_IMAGES.map(img => <option key={img.value} value={img.value}>{img.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Frame Overlay Picture (Main Full Frame)</label>
                    <input type="file" accept="image/*" className="form-control" onChange={handleFileChange} disabled={uploadingImage} />
                    {uploadingImage && <div style={{ fontSize: "11px", color: "var(--accent)", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}><IconLoader /> Uploading Frame Overlay...</div>}
                  </div>
                </div>
                {formData.imageUrl && (
                  <div className="fp-img-preview" style={{ marginBottom: "14px" }}>
                    <div className="fp-img-preview-label"><IconCheck /> Frame Overlay Preview</div>
                    <div className="fp-img-container"><img src={formData.imageUrl} alt="Frame Overlay Preview" /></div>
                    <button type="button" className="fp-img-remove" onClick={() => setFormData(p => ({ ...p, imageUrl: "" }))}><IconX /> Remove Overlay</button>
                  </div>
                )}

                {/* Dedicated Frame Thumbnail Upload */}
                <div className="form-row" style={{ marginTop: "10px" }}>
                  <div className="form-group">
                    <label>Frame Thumbnail Photo (Catalog & Card Thumbnails)</label>
                    <input type="file" accept="image/*" className="form-control" onChange={handleThumbnailFileChange} disabled={uploadingThumbnail} />
                    {uploadingThumbnail && <div style={{ fontSize: "11px", color: "var(--accent)", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}><IconLoader /> Uploading Thumbnail...</div>}
                  </div>
                </div>
                {formData.thumbnailUrl && (
                  <div className="fp-img-preview">
                    <div className="fp-img-preview-label"><IconCheck /> Thumbnail Preview</div>
                    <div className="fp-img-container" style={{ maxHeight: "100px" }}><img src={formData.thumbnailUrl} alt="Thumbnail Preview" style={{ maxHeight: "100px" }} /></div>
                    <button type="button" className="fp-img-remove" onClick={() => setFormData(p => ({ ...p, thumbnailUrl: "" }))}><IconX /> Remove Thumbnail</button>
                  </div>
                )}

                <div className="form-row" style={{ marginTop: "16px" }}>
                  <div className="form-group"><label>Cloudinary Frame URL</label><input readOnly className="form-control url-readonly" value={formData.imageUrl || "No overlay uploaded"} /></div>
                  <div className="form-group"><label>Cloudinary Thumbnail URL</label><input readOnly className="form-control url-readonly" value={formData.thumbnailUrl || (formData.imageUrl || "No thumbnail uploaded")} /></div>
                </div>
              </div>

              {/* Padding */}
              <div className="fp-section" style={{ marginBottom: 0 }}>
                <div className="fp-section-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><rect x="7" y="7" width="10" height="10" rx="0" strokeDasharray="2 2" /></svg>
                  Padding (%)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
                  <div className="form-group"><label>Top</label><input required type="number" step="any" className="form-control" name="paddingTop" value={formData.paddingTop || 0} onChange={handleFormChange} /></div>
                  <div className="form-group"><label>Right</label><input required type="number" step="any" className="form-control" name="paddingRight" value={formData.paddingRight || 0} onChange={handleFormChange} /></div>
                  <div className="form-group"><label>Bottom</label><input required type="number" step="any" className="form-control" name="paddingBottom" value={formData.paddingBottom || 0} onChange={handleFormChange} /></div>
                  <div className="form-group"><label>Left</label><input required type="number" step="any" className="form-control" name="paddingLeft" value={formData.paddingLeft || 0} onChange={handleFormChange} /></div>
                </div>
              </div>
            </div>

            <div className="fp-form-footer">
              <button type="submit" className="btn-primary" disabled={uploadingImage || !formData.imageUrl} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {uploadingImage ? <><IconLoader /> Uploading...</> : isEditing ? <><IconCheck /> Update Frame</> : <><IconPlus /> Create Frame</>}
              </button>
              {isEditing && <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>}
            </div>
          </form>
        </div>
      )}

      {/* ── BOTTOM: CSV + FRAME LIST ── */}
      <div className="fp-bottom">
        {/* CSV */}
        <div className="fp-csv">
          <div className="fp-csv-header">
            <div className="fp-csv-icon"><IconUpload /></div>
            <div className="fp-csv-title">CSV Import</div>
          </div>
          <div className="fp-csv-body">
            <p className="fp-csv-desc">Import multiple frames from a CSV file. Sizes will default to standard set.</p>
            <div className="fp-csv-actions">
              <button type="button" className="fp-csv-btn" onClick={handleDownloadCSVTemplate}><IconDownload /> Download Template</button>
              <label className="fp-csv-btn" style={{ cursor: "pointer" }}>
                <IconUpload /> Upload CSV
                <input type="file" accept=".csv" onChange={handleCSVUpload} style={{ display: "none" }} />
              </label>
            </div>
            {csvStatus && (
              <div className={`fp-csv-status ${csvStatus.error ? "err" : "ok"}`}>
                {csvStatus.error ? <IconX /> : <IconCheck />} {csvStatus.message}
              </div>
            )}
          </div>
        </div>

        {/* Frame List */}
        <div className="fp-list">
          <div className="fp-list-header">
            <div className="fp-list-header-left">
              <div className="fp-list-icon"><IconFrame /></div>
              <div className="fp-list-title">All Frames</div>
            </div>
            <div className="fp-count">{frames.length}</div>
          </div>

          {frames.length > 3 && (
            <div className="fp-list-search">
              <div className="fp-search-wrap">
                <span className="fp-search-icon"><IconSearch /></span>
                <input type="text" className="fp-search-input" placeholder="Search frames..." value={frameSearch} onChange={(e) => setFrameSearch(e.target.value)} />
              </div>
            </div>
          )}

          <div className="fp-list-body">
            {loadingFrames ? (
              <FrameLoader variant="page" label="Loading frame catalog" />
            ) : filteredFrames.length === 0 ? (
              <div className="fp-empty">
                <div className="fp-empty-icon"><IconFrame /></div>
                <p style={{ fontSize: "13px" }}>{frames.length === 0 ? "No frames yet." : "No results."}</p>
              </div>
            ) : filteredFrames.map(f => {
              const stock = parseInt(f.stock) || 0;
              const sizesCount = (f.sizes || []).length;
              return (
                <div key={f.docId} className="fp-item">
                  <div className="fp-item-thumb">
                    {(f.thumbnailUrl || f.imageUrl) ? <img src={f.thumbnailUrl || f.imageUrl} alt={f.name} /> : <div style={{ color: "var(--text2)", opacity: 0.3 }}><IconImage /></div>}
                  </div>
                  <div className="fp-item-info">
                    <div className="fp-item-name">{f.name}</div>
                    <div className="fp-item-meta">
                      <div className="fp-item-color" style={{ background: f.color || "#8B5E3C" }} />
                      <span>{f.category || "—"}</span>
                      <span className="fp-item-dot" />
                      <span>{f.orientation}</span>
                      <span className="fp-item-dot" />
                      <span>{sizesCount} size{sizesCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  {f.featured && <span className="fp-item-featured"><IconStar filled /> Featured</span>}
                  <span className={`fp-item-stock ${stock > 0 ? "in" : "out"}`}>
                    {stock > 0 ? `${stock} in stock` : "Out of stock"}
                  </span>
                  <div className="fp-item-price">{f.price}</div>
                  <div className="fp-item-actions">
                    <button
                      className={`fp-action-btn star ${f.featured ? "on" : ""}`}
                      title={f.featured ? "Remove from featured" : "Mark as featured"}
                      onClick={() => toggleFeatured(f)}
                    >
                      <IconStar filled={!!f.featured} />
                    </button>
                    <button className="fp-action-btn" onClick={() => editFrame(f)}><IconEdit /> Edit</button>
                    <button className="fp-action-btn danger" onClick={() => handleDeleteFrame(f.docId)}><IconTrash /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
