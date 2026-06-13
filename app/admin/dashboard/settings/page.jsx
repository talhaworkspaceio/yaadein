"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../lib/firebase";
import { ref, onValue, set } from "firebase/database";

export default function SettingsPage() {
  const [deliveryCharges, setDeliveryCharges] = useState(250);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    const settingsRef = ref(db, "settings");
    const unsub = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.deliveryCharges !== undefined) {
          setDeliveryCharges(data.deliveryCharges);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await set(ref(db, "settings/deliveryCharges"), parseInt(deliveryCharges) || 0);
      setSaveStatus({ error: false, message: "Settings saved successfully!" });
    } catch (err) {
      console.error(err);
      setSaveStatus({ error: true, message: "Failed to save settings." });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite", color: "var(--accent)" }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .settings-card {
          max-width: 600px;
          margin-top: 12px;
          animation: fadeInUp 0.4s ease both;
        }
        .status-msg {
          margin-top: 16px; padding: 12px 16px; border-radius: 8px; font-size: 13px;
          display: flex; align-items: center; gap: 8px;
        }
        .status-msg.ok { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); color: #4ADE80; }
        .status-msg.err { background: rgba(255,90,90,0.08); border: 1px solid rgba(255,90,90,0.2); color: #FF7777; }
      ` }} />

      <div className="content-header">
        <div>
          <h2>Portal Settings</h2>
          <p className="content-header-sub">Configure system-wide constants, checkout configurations, and preferences</p>
        </div>
      </div>

      <div className="settings-card card animate-in animate-in-1">
        <h3 style={{ marginBottom: "20px", fontFamily: "'DM Serif Display', serif", fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
          ⚙️ General Settings
        </h3>
        
        <form onSubmit={handleSaveSettings}>
          <div className="form-group" style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text2)", letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>
              Standard Delivery Charges (Rs.)
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <span style={{ position: "absolute", left: "14px", color: "var(--text2)", fontSize: "14px", pointerEvents: "none" }}>Rs.</span>
              <input
                required
                type="number"
                min="0"
                className="form-control"
                value={deliveryCharges}
                onChange={(e) => setDeliveryCharges(e.target.value)}
                style={{ paddingLeft: "42px", width: "100%", maxWidth: "240px" }}
                placeholder="250"
              />
            </div>
            <p style={{ fontSize: "11px", color: "var(--text2)", opacity: 0.7, marginTop: "6px" }}>
              This shipping rate will be applied standard to all checkout calculations.
            </p>
          </div>

          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </form>

        {saveStatus && (
          <div className={`status-msg ${saveStatus.error ? "err" : "ok"}`}>
            <span>{saveStatus.error ? "❌" : "✅"}</span>
            {saveStatus.message}
          </div>
        )}
      </div>
    </>
  );
}
