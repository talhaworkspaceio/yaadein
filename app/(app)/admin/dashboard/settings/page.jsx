"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../lib/firebase";
import { ref, onValue, set } from "firebase/database";

export default function SettingsPage() {
  const [deliveryCharges, setDeliveryCharges] = useState(250);
  const [ntfyTopic, setNtfyTopic] = useState("yaadein-orders");
  const [ntfyServerUrl, setNtfyServerUrl] = useState("https://ntfy.sh");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const [isTestingNtfy, setIsTestingNtfy] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  useEffect(() => {
    const settingsRef = ref(db, "settings");
    const unsub = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.deliveryCharges !== undefined) {
          setDeliveryCharges(data.deliveryCharges);
        }
        if (data.ntfyTopic) {
          setNtfyTopic(data.ntfyTopic);
        }
        if (data.ntfyServerUrl) {
          setNtfyServerUrl(data.ntfyServerUrl);
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
      await set(ref(db, "settings"), {
        deliveryCharges: parseInt(deliveryCharges) || 0,
        ntfyTopic: ntfyTopic.trim() || "yaadein-orders",
        ntfyServerUrl: ntfyServerUrl.trim() || "https://ntfy.sh",
      });
      setSaveStatus({ error: false, message: "Settings saved successfully!" });
    } catch (err) {
      console.error(err);
      setSaveStatus({ error: true, message: "Failed to save settings." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNtfy = async () => {
    setIsTestingNtfy(true);
    setTestStatus(null);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          topic: ntfyTopic.trim() || "yaadein-orders",
          serverUrl: ntfyServerUrl.trim() || "https://ntfy.sh",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestStatus({ error: false, message: `Test push notification delivered to "${ntfyTopic}"!` });
      } else {
        setTestStatus({ error: true, message: data.error || "Failed to deliver test notification." });
      }
    } catch (err) {
      setTestStatus({ error: true, message: err.message || "Network error when testing notification." });
    } finally {
      setIsTestingNtfy(false);
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
        .settings-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 650px;
          margin-top: 12px;
        }
        .settings-card {
          animation: fadeInUp 0.4s ease both;
        }
        .status-msg {
          margin-top: 16px; padding: 12px 16px; border-radius: 8px; font-size: 13px;
          display: flex; align-items: center; gap: 8px;
        }
        .status-msg.ok { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); color: #4ADE80; }
        .status-msg.err { background: rgba(255,90,90,0.08); border: 1px solid rgba(255,90,90,0.2); color: #FF7777; }
        .ntfy-instruction {
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed var(--border, #333);
          border-radius: 8px;
          padding: 14px 16px;
          margin-bottom: 20px;
          font-size: 12px;
          line-height: 1.6;
          color: var(--text2, #aaa);
        }
        .ntfy-instruction code {
          background: rgba(255,255,255,0.1);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--accent, #e5a854);
        }
      ` }} />

      <div className="content-header">
        <div>
          <h2>Portal Settings</h2>
          <p className="content-header-sub">Configure system constants, delivery rates, and ntfy push notification preferences</p>
        </div>
      </div>

      <div className="settings-container">
        <form onSubmit={handleSaveSettings}>
          <div className="settings-card card">
            <h3 style={{ marginBottom: "20px", fontFamily: "'DM Serif Display', serif", fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
              ⚙️ General Store Settings
            </h3>

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
          </div>

          <div className="settings-card card" style={{ marginTop: "20px" }}>
            <h3 style={{ marginBottom: "16px", fontFamily: "'DM Serif Display', serif", fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
              🔔 ntfy App Push Notifications
            </h3>

            <div className="ntfy-instruction">
              💡 <strong>How to receive order push notifications on your phone/desktop:</strong>
              <ol style={{ margin: "8px 0 0 16px", padding: 0 }}>
                <li>Install the <strong>ntfy app</strong> on your phone (iOS / Android) or open <code>https://ntfy.sh</code> in browser.</li>
                <li>Tap <strong>+ Subscribe to topic</strong>.</li>
                <li>Enter topic name: <code>{ntfyTopic || "yaadein-orders"}</code>.</li>
                <li>Whenever a customer places an order, your phone will chime instantly with order details!</li>
              </ol>
            </div>

            <div className="form-group" style={{ marginBottom: "18px" }}>
              <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text2)", letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>
                ntfy Topic Name
              </label>
              <input
                required
                type="text"
                className="form-control"
                value={ntfyTopic}
                onChange={(e) => setNtfyTopic(e.target.value)}
                style={{ width: "100%", maxWidth: "340px" }}
                placeholder="yaadein-orders"
              />
              <p style={{ fontSize: "11px", color: "var(--text2)", opacity: 0.7, marginTop: "6px" }}>
                Unique topic name to subscribe to in your ntfy mobile/desktop app.
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text2)", letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>
                ntfy Server URL
              </label>
              <input
                required
                type="url"
                className="form-control"
                value={ntfyServerUrl}
                onChange={(e) => setNtfyServerUrl(e.target.value)}
                style={{ width: "100%", maxWidth: "340px" }}
                placeholder="https://ntfy.sh"
              />
              <p style={{ fontSize: "11px", color: "var(--text2)", opacity: 0.7, marginTop: "6px" }}>
                Default is <code>https://ntfy.sh</code>. Change only if using a custom self-hosted ntfy server.
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <button type="submit" className="btn-primary" disabled={isSaving}>
                {isSaving ? "Saving Settings..." : "Save Settings"}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleTestNtfy}
                disabled={isTestingNtfy}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                {isTestingNtfy ? "Sending Test..." : "⚡ Send Test Notification"}
              </button>
            </div>

            {saveStatus && (
              <div className={`status-msg ${saveStatus.error ? "err" : "ok"}`}>
                <span>{saveStatus.error ? "❌" : "✅"}</span>
                {saveStatus.message}
              </div>
            )}

            {testStatus && (
              <div className={`status-msg ${testStatus.error ? "err" : "ok"}`}>
                <span>{testStatus.error ? "❌" : "🔔"}</span>
                {testStatus.message}
              </div>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
