"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../lib/firebase";
import { ref, onValue, set, push, remove } from "firebase/database";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [categoryFormName, setCategoryFormName] = useState("");
  const [categoryEditingId, setCategoryEditingId] = useState(null);

  useEffect(() => {
    const categoriesRef = ref(db, "categories");
    const unsub = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCategories(Object.entries(data).map(([key, val]) => ({ docId: key, name: val.name })));
      } else {
        const defaultCats = ["Portrait", "Landscape", "Service", "Board Game", "Nikkah Nama Frame"];
        defaultCats.forEach(cat => push(ref(db, "categories"), { name: cat }));
      }
    });
    return () => unsub();
  }, []);

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryFormName.trim()) return;
    try {
      if (categoryEditingId) {
        await set(ref(db, `categories/${categoryEditingId}`), { name: categoryFormName.trim() });
      } else {
        await set(push(ref(db, "categories")), { name: categoryFormName.trim() });
      }
      resetCategoryForm();
    } catch (err) { console.error(err); alert("Error saving category"); }
  };

  const editCategory = (c) => { setCategoryFormName(c.name); setCategoryEditingId(c.docId); };
  const resetCategoryForm = () => { setCategoryFormName(""); setCategoryEditingId(null); };

  const handleDeleteCategory = async (docId) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try { await remove(ref(db, `categories/${docId}`)); }
    catch (err) { console.error(err); alert("Failed to delete category"); }
  };

  return (
    <>
      <div className="content-header">
        <div>
          <h2>Product Categories</h2>
          <p className="content-header-sub">Organize your frames into browsable categories</p>
        </div>
      </div>

      <div className="grid">
        {/* ── CREATE / EDIT FORM ── */}
        <div className="card animate-in animate-in-1">
          <h3 style={{ marginBottom: "20px", fontFamily: "'DM Serif Display', serif", fontSize: "18px" }}>
            {categoryEditingId ? "✏️ Edit Category" : "➕ Create New Category"}
          </h3>
          <form onSubmit={handleSaveCategory}>
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label>Category Name</label>
              <input
                required className="form-control"
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
                <button type="button" className="btn-secondary" onClick={resetCategoryForm}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        {/* ── EXISTING CATEGORIES ── */}
        <div className="item-list animate-in animate-in-2">
          <h3 style={{ marginBottom: "12px", fontFamily: "'DM Serif Display', serif", fontSize: "18px" }}>
            Existing Categories ({categories.length})
          </h3>
          {categories.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text2)" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px", opacity: 0.3 }}>🏷️</div>
              <p style={{ fontSize: "13px" }}>No categories yet. Create your first one above.</p>
            </div>
          ) : (
            categories.map(c => (
              <div key={c.docId} className="list-item">
                <div className="item-title">{c.name}</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn-secondary" onClick={() => editCategory(c)}>Edit</button>
                  <button className="btn-secondary" style={{ color: "#FF5A5A" }} onClick={() => handleDeleteCategory(c.docId)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
