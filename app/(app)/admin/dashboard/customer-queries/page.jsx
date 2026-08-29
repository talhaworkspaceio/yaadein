"use client";

// ---------------------------------------------------------------------------
// Customer Queries.
//
// A custom frame size has no price on the shelf, so those requests never reach
// the cart — they land here instead, with the customer's name and number, for
// the studio to check availability and quote by hand.
// ---------------------------------------------------------------------------

import { useState, useEffect } from "react";
import { db } from "../../../../lib/firebase";
import { ref, onValue, set, remove, push } from "firebase/database";
import FrameLoader from "../../../components/FrameLoader";

const STATUSES = ["New", "Contacted", "Quoted", "Closed"];

const PAYMENT_METHODS = ["Cash on Delivery", "EasyPaisa", "JazzCash", "Bank Transfer"];

// What the studio locks in before handing the form to the customer. The size,
// frame and amount are settled on the call; the customer only supplies their
// own delivery details.
const EMPTY_PUNCH = {
  name: "", phone: "", email: "",
  sizeLabel: "", frameLabel: "",
  agreedPrice: "", shipping: "", note: "",
};

/** Digits only — the agreed price is typed freehand ("Rs. 14,500", "14500/-"). */
const priceToNumber = (v) => parseInt(String(v ?? "").replace(/[^0-9]/g, ""), 10) || 0;

const STATUS_COLOR = {
  New: "#4DA3FF",
  Contacted: "#C9A84C",
  Quoted: "#5BD99A",
  Closed: "#8B8378",
};

/** Local numbers need the country code before wa.me will accept them. */
const toWhatsApp = (phone) => {
  if (!phone) return "";
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0")) clean = "92" + clean.slice(1);
  if (clean.length === 10 && !clean.startsWith("92")) clean = "92" + clean;
  return clean;
};

const formatDims = (d) =>
  d ? `${d.width || "?"} × ${d.height || "?"} ${d.unit || ""}`.trim() : "—";

export default function CustomerQueriesPage() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");
  const [lightboxImage, setLightboxImage] = useState(null);
  // Draft quote prices, keyed by record — kept local until Save so typing does
  // not write to the database on every keystroke.
  const [priceDrafts, setPriceDrafts] = useState({});
  // Punch-an-order state: the query being converted, and the order details the
  // admin confirms on the phone before the order is created.
  const [punchFor, setPunchFor] = useState(null);
  const [punchForm, setPunchForm] = useState(EMPTY_PUNCH);
  const [punchError, setPunchError] = useState("");
  const [punchSaving, setPunchSaving] = useState(false);
  const [punchDone, setPunchDone] = useState("");
  const [deliveryCharges, setDeliveryCharges] = useState(250);

  useEffect(() => {
    const unsub = onValue(ref(db, "quote_requests"), (snapshot) => {
      const data = snapshot.val();
      const list = data
        ? Object.entries(data).map(([key, val]) => ({ docId: key, ...val }))
        : [];
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setQueries(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Same delivery charge the checkout applies, so a punched order is priced the
  // way the customer's own order would have been.
  useEffect(() => {
    const unsub = onValue(ref(db, "settings/deliveryCharges"), (snap) => {
      const val = snap.val();
      if (typeof val === "number") setDeliveryCharges(val);
    });
    return () => unsub();
  }, []);

  const updateStatus = async (docId, status) => {
    try {
      await set(ref(db, `quote_requests/${docId}/status`), status);
    } catch (e) {
      console.error(e);
      alert("Could not update the status.");
    }
  };

  const saveQuotedPrice = async (docId) => {
    const value = (priceDrafts[docId] ?? "").trim();
    try {
      await set(ref(db, `quote_requests/${docId}/quotedPrice`), value || null);
      setPriceDrafts((d) => {
        const next = { ...d };
        delete next[docId];
        return next;
      });
    } catch (e) {
      console.error(e);
      alert("Could not save the quoted price.");
    }
  };

  // ── Allot an order form to the customer ──
  // The customer only ever saw the starting price, so they cannot order from
  // the service page. Instead the studio locks the agreed size, frame and
  // amount into a form and sends them a private link: the locked details are
  // read-only, and the customer fills in their own delivery details and places
  // the order themselves.
  const openPunch = (q) => {
    setPunchError("");
    setPunchDone("");
    setPunchFor(q);
    setPunchForm({
      ...EMPTY_PUNCH,
      name: q.customer?.name || "",
      phone: q.customer?.phone || "",
      email: q.customer?.email || "",
      sizeLabel: formatDims(q.dimensions),
      frameLabel: q.frame?.name || "",
      agreedPrice: priceDrafts[q.docId] ?? q.quotedPrice ?? "",
      shipping: String(deliveryCharges),
    });
  };

  const closePunch = () => {
    setPunchFor(null);
    setPunchError("");
    setPunchDone("");
  };

  const allotForm = async (e) => {
    e.preventDefault();
    if (punchSaving || !punchFor) return;

    const f = punchForm;
    const agreed = priceToNumber(f.agreedPrice);
    const shipping = priceToNumber(f.shipping);

    if (!f.name.trim()) return setPunchError("The customer's name is required.");
    if (f.phone.replace(/\D/g, "").length < 7) return setPunchError("A valid contact number is required.");
    if (!f.sizeLabel.trim()) return setPunchError("Confirm the frame size you agreed.");
    if (agreed <= 0) return setPunchError("Enter the price you agreed with the customer.");

    setPunchError("");
    setPunchSaving(true);

    const q = punchFor;
    // Unguessable, so the link only works for whoever it was sent to.
    const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

    try {
      await set(ref(db, `order_forms/${token}`), {
        token,
        status: "Sent",
        createdAt: Date.now(),
        quoteDocId: q.docId,
        quoteReference: q.reference || q.docId,
        service: q.service || null,
        // Locked on the customer's form.
        locked: {
          serviceTitle: q.service?.title || "Custom Order",
          sizeLabel: f.sizeLabel.trim(),
          frameLabel: f.frameLabel.trim(),
          amount: agreed,
          shipping,
          total: agreed + shipping,
        },
        // Pre-filled but the customer can correct it.
        prefill: {
          name: f.name.trim(),
          phone: f.phone.trim(),
          email: f.email.trim(),
        },
        photo: q.photo || null,
        adminNote: f.note.trim(),
      });

      await set(ref(db, `quote_requests/${q.docId}/formToken`), token);
      await set(ref(db, `quote_requests/${q.docId}/quotedPrice`), `Rs. ${agreed.toLocaleString()}`);
      await set(ref(db, `quote_requests/${q.docId}/status`), "Quoted");
      setPunchDone(token);
    } catch (err) {
      console.error("Failed to allot the order form:", err);
      setPunchError("Could not create the form. Please try again.");
    } finally {
      setPunchSaving(false);
    }
  };

  const formUrl = (token) =>
    typeof window !== "undefined" ? `${window.location.origin}/order-form/${token}` : `/order-form/${token}`;

  const deleteQuery = async (docId) => {
    if (!confirm("Delete this query permanently? This cannot be undone.")) return;
    try {
      await remove(ref(db, `quote_requests/${docId}`));
    } catch (e) {
      console.error(e);
      alert("Could not delete the query.");
    }
  };

  const counts = STATUSES.reduce((acc, st) => {
    acc[st] = queries.filter((q) => (q.status || "New") === st).length;
    return acc;
  }, {});

  const term = searchQuery.toLowerCase().trim();
  let filtered = queries.filter((q) => {
    if (filterStatus !== "All" && (q.status || "New") !== filterStatus) return false;
    if (term) {
      const haystack = [
        q.reference,
        q.customer?.name,
        q.customer?.phone,
        q.customer?.email,
        q.service?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
  if (sortOrder === "oldest") filtered = [...filtered].reverse();

  const PUNCH_CSS = `
    .punch-overlay {
      position: fixed; inset: 0; z-index: 9998;
      background: rgba(0,0,0,0.82);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      padding: 32px 20px;
      animation: fadeInLightbox 0.2s ease;
    }
    .punch-modal {
      background: var(--surface);
      border: 1px solid var(--border2);
      border-radius: var(--radius);
      width: 100%; max-width: 620px; max-height: 88vh;
      display: flex; flex-direction: column;
      box-shadow: 0 24px 70px rgba(0,0,0,0.75);
      animation: fadeInUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .punch-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 16px; padding: 20px 24px;
      border-bottom: 1px solid var(--border);
    }
    .punch-header h3 { font-family: 'DM Serif Display', serif; font-size: 21px; color: var(--accent); }
    .punch-header p { font-size: 12px; color: var(--text2); margin-top: 3px; }
    .punch-close {
      background: none; border: none; color: var(--text2);
      font-size: 26px; line-height: 1; cursor: pointer; padding: 0 2px;
    }
    .punch-close:hover { color: var(--accent); }
    .punch-body { padding: 20px 24px 24px; overflow-y: auto; }
    .punch-recap {
      display: flex; flex-wrap: wrap; gap: 6px 18px;
      background: var(--surface2); border: 1px solid var(--border);
      border-radius: 8px; padding: 12px 14px; margin-bottom: 20px;
      font-size: 12px; color: var(--text2);
    }
    .punch-recap strong { color: var(--text); }
    .punch-section {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.1em; color: var(--accent);
      margin: 4px 0 10px;
    }
    .punch-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
    .punch-row-3 { grid-template-columns: 1fr 1fr 1fr; }
    .punch-total {
      display: flex; justify-content: space-between; align-items: baseline;
      padding: 12px 14px; margin-top: 4px;
      background: rgba(201,168,76,0.07);
      border: 1px solid rgba(201,168,76,0.28);
      border-radius: 8px;
    }
    .punch-total span {
      font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--text2); font-weight: 700;
    }
    .punch-total strong { font-family: 'DM Serif Display', serif; font-size: 21px; color: var(--accent); }
    .punch-hint {
      font-size: 11.5px; color: var(--text2);
      margin: -4px 0 12px; line-height: 1.5;
    }
    .punch-link {
      display: flex; align-items: center; gap: 10px;
      margin: 18px 0 4px; padding: 10px 12px;
      background: var(--surface2); border: 1px solid var(--border2);
      border-radius: 8px; text-align: left;
    }
    .punch-link code {
      flex: 1; font-size: 11.5px; color: var(--accent);
      overflow-wrap: anywhere; font-family: ui-monospace, monospace;
    }
    .punch-error {
      margin-top: 14px; padding: 10px 12px;
      background: rgba(255,90,90,0.09);
      border: 1px solid rgba(255,90,90,0.4);
      border-left: 3px solid #FF5A5A;
      border-radius: 6px; font-size: 12px; color: #FF9C9C;
    }
    .punch-actions { display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
    .punch-done { text-align: center; padding: 34px 24px 30px; }
    .punch-done-mark {
      width: 54px; height: 54px; margin: 0 auto 16px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 26px; color: #5BD99A;
      background: rgba(91,217,154,0.1); border: 1px solid rgba(91,217,154,0.4);
    }
    .punch-done p { font-size: 14px; }
    .punch-done p strong { color: var(--accent); }
    .punch-done-sub { font-size: 12px; color: var(--text2); margin-top: 6px; }
    .punch-done .punch-actions { justify-content: center; }
    @media (max-width: 560px) {
      .punch-row, .punch-row-3 { grid-template-columns: 1fr; gap: 0; }
      .punch-row .form-group, .punch-row-3 .form-group { margin-bottom: 14px; }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PUNCH_CSS }} />

      <div className="content-header">
        <div>
          <h2>Customer Queries</h2>
          <p className="content-header-sub">
            Custom-size requests waiting on a quote from the studio
          </p>
        </div>
      </div>

      {loading && <FrameLoader variant="page" label="Loading queries" />}

      {!loading && (
        <>
          {/* ── STATUS SUMMARY ── */}
          <div className="animate-in animate-in-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px", marginBottom: "24px" }}>
            {STATUSES.map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(filterStatus === st ? "All" : st)}
                className="card"
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  padding: "16px 18px",
                  borderColor: filterStatus === st ? STATUS_COLOR[st] : "var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "border-color 0.2s ease",
                }}
              >
                <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: STATUS_COLOR[st], fontWeight: 700 }}>
                  {st}
                </div>
                <div style={{ fontSize: "26px", fontFamily: "'DM Serif Display', serif", marginTop: "4px" }}>
                  {counts[st] || 0}
                </div>
              </button>
            ))}
          </div>

          {/* ── FILTER BAR ── */}
          <div className="order-filters-bar animate-in animate-in-2">
            <div className="filter-search-wrap">
              <span className="filter-search-icon">🔍</span>
              <input
                type="text"
                className="filter-search"
                placeholder="Search by reference, name, phone or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <span className="filter-label">Status</span>
              <div className="filter-select-wrap">
                <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="All">All Statuses</option>
                  {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </div>
            <div className="filter-group">
              <span className="filter-label">Sort</span>
              <div className="filter-select-wrap">
                <select className="filter-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>
            {(searchQuery || filterStatus !== "All" || sortOrder !== "newest") && (
              <button
                className="filter-clear-btn"
                onClick={() => { setSearchQuery(""); setFilterStatus("All"); setSortOrder("newest"); }}
              >
                ✕ Clear Filters
              </button>
            )}
          </div>

          {/* ── QUERY LIST ── */}
          {filtered.length === 0 ? (
            <div className="animate-in animate-in-3" style={{ textAlign: "center", padding: "60px 20px", color: "var(--text2)" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>📐</div>
              <p style={{ fontSize: "14px" }}>
                {queries.length === 0
                  ? "No custom-size queries yet. They arrive here when a customer requests a quote."
                  : "No queries match the current filters."}
              </p>
            </div>
          ) : (
            <div className="animate-in animate-in-3">
              <div style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "14px" }}>
                Showing <strong style={{ color: "var(--accent)" }}>{filtered.length}</strong> of {queries.length} quer{queries.length !== 1 ? "ies" : "y"}
              </div>

              {filtered.map((q) => {
                const status = q.status || "New";
                const wa = toWhatsApp(q.customer?.phone);
                const message =
                  `*Yaadein — Custom Size Quote* ✨\n\n` +
                  `Reference: *${q.reference || q.docId}*\n` +
                  `Service: *${q.service?.title || ""}*\n` +
                  `Size: *${formatDims(q.dimensions)}*\n` +
                  (q.frame?.name ? `Frame: *${q.frame.name}*\n` : "") +
                  `\nHello ${q.customer?.name || ""}, thank you for your enquiry. ` +
                  `We have checked availability for your dimensions and would like to share your quote.`;

                return (
                  <div key={q.docId} className="order-card">
                    <div className="order-header">
                      <div>
                        <strong style={{ color: "var(--accent)", fontSize: "16px" }}>
                          {q.reference || q.docId}
                        </strong>
                        <span style={{ marginLeft: "12px", fontSize: "12px", color: "var(--text2)" }}>
                          {q.createdAt ? new Date(q.createdAt).toLocaleString() : "Just now"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                          letterSpacing: "0.08em", color: STATUS_COLOR[status],
                          border: `1px solid ${STATUS_COLOR[status]}`, borderRadius: "9999px",
                          padding: "3px 10px",
                        }}>
                          {status}
                        </span>
                        <select
                          value={status}
                          onChange={(e) => updateStatus(q.docId, e.target.value)}
                          style={{
                            background: "var(--surface2)", color: "var(--accent)",
                            border: "1px solid var(--border2)", padding: "6px 12px",
                            borderRadius: "6px", fontSize: "12px", fontWeight: 700,
                            textTransform: "uppercase", outline: "none", cursor: "pointer",
                          }}
                        >
                          {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                        </select>
                        {q.convertedOrderId ? (
                          <span style={{
                            fontSize: "11px", fontWeight: 700, color: "#5BD99A",
                            border: "1px solid rgba(91,217,154,0.5)", background: "rgba(91,217,154,0.08)",
                            borderRadius: "6px", padding: "6px 12px",
                          }}>
                            ✓ Ordered {q.convertedOrderId}
                          </span>
                        ) : q.formToken ? (
                          <>
                            <span style={{
                              fontSize: "11px", fontWeight: 700, color: "#C9A84C",
                              border: "1px solid rgba(201,168,76,0.5)", background: "rgba(201,168,76,0.08)",
                              borderRadius: "6px", padding: "6px 12px",
                            }}>
                              Form sent · awaiting customer
                            </span>
                            <button
                              className="btn-secondary"
                              style={{ padding: "7px 14px !important", fontSize: "11px" }}
                              onClick={() => { navigator.clipboard?.writeText(formUrl(q.formToken)); alert("Form link copied."); }}
                            >
                              Copy Link
                            </button>
                            {toWhatsApp(q.customer?.phone) && (
                              <button
                                onClick={() => window.open(
                                  `https://wa.me/${toWhatsApp(q.customer.phone)}?text=${encodeURIComponent(
                                    `*Yaadein \u2014 Your Order Form* ✨\n\n` +
                                    `Hello ${q.customer?.name || ""}, thank you for approving your quote.\n\n` +
                                    `Please complete your order here:\n${formUrl(q.formToken)}\n\n` +
                                    `Your size and price are already filled in \u2014 just add your delivery details.`
                                  )}`, "_blank")}
                                style={{
                                  background: "rgba(37,211,102,0.1)", border: "1px solid #25D366",
                                  color: "#25D366", padding: "6px 12px", borderRadius: "6px",
                                  fontSize: "11px", fontWeight: 700, cursor: "pointer",
                                }}
                              >
                                Send on WhatsApp
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            className="btn-primary"
                            style={{ padding: "7px 16px !important", fontSize: "11px" }}
                            onClick={() => openPunch(q)}
                          >
                            Send Order Form
                          </button>
                        )}
                        <button
                          onClick={() => deleteQuery(q.docId)}
                          style={{
                            background: "none", border: "1px solid #FF5A5A", color: "#FF5A5A",
                            padding: "6px 12px", borderRadius: "6px", fontSize: "11px",
                            fontWeight: 700, textTransform: "uppercase", cursor: "pointer",
                          }}
                        >
                          Delete 🗑️
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: q.photo ? "1fr 1fr 160px" : "1fr 1fr", gap: "24px", alignItems: "start" }}>
                      {/* Who to call */}
                      <div>
                        <h4 style={{ fontSize: "12px", color: "var(--text2)", textTransform: "uppercase", marginBottom: "8px" }}>Customer</h4>
                        <p style={{ fontSize: "14px", fontWeight: 700 }}>{q.customer?.name || "—"}</p>
                        <p style={{ fontSize: "13px", color: "var(--text2)", marginTop: "2px" }}>{q.customer?.phone || "—"}</p>
                        {q.customer?.email && (
                          <p style={{ fontSize: "13px", color: "var(--text2)" }}>{q.customer.email}</p>
                        )}
                        <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                          {wa && (
                            <button
                              onClick={() => window.open(`https://wa.me/${wa}?text=${encodeURIComponent(message)}`, "_blank")}
                              style={{
                                background: "rgba(37,211,102,0.1)", border: "1px solid #25D366",
                                color: "#25D366", padding: "5px 12px", borderRadius: "6px",
                                fontSize: "11px", fontWeight: 700, cursor: "pointer",
                              }}
                            >
                              WhatsApp
                            </button>
                          )}
                          {q.customer?.phone && (
                            <a
                              href={`tel:${q.customer.phone}`}
                              style={{
                                background: "var(--surface2)", border: "1px solid var(--border2)",
                                color: "var(--text)", padding: "5px 12px", borderRadius: "6px",
                                fontSize: "11px", fontWeight: 700, textDecoration: "none",
                              }}
                            >
                              Call
                            </a>
                          )}
                          {q.customer?.email && (
                            <a
                              href={`mailto:${q.customer.email}?subject=${encodeURIComponent(`Your Yaadein quote — ${q.reference || ""}`)}`}
                              style={{
                                background: "var(--surface2)", border: "1px solid var(--border2)",
                                color: "var(--text)", padding: "5px 12px", borderRadius: "6px",
                                fontSize: "11px", fontWeight: 700, textDecoration: "none",
                              }}
                            >
                              Email
                            </a>
                          )}
                        </div>
                      </div>

                      {/* What they asked for */}
                      <div>
                        <h4 style={{ fontSize: "12px", color: "var(--text2)", textTransform: "uppercase", marginBottom: "8px" }}>Request</h4>
                        <p style={{ fontSize: "13px" }}>
                          <strong style={{ color: "var(--accent)" }}>{q.service?.title || "—"}</strong>
                        </p>
                        <p style={{ fontSize: "13px", marginTop: "4px" }}>
                          Size: <strong>{formatDims(q.dimensions)}</strong>
                        </p>
                        {q.frame?.name && (
                          <p style={{ fontSize: "13px", color: "var(--text2)" }}>Frame: {q.frame.name}</p>
                        )}
                        {typeof q.startingPrice === "number" && (
                          <p style={{ fontSize: "12px", color: "var(--text2)", marginTop: "2px" }}>
                            Starting price: Rs. {q.startingPrice.toLocaleString()}
                          </p>
                        )}
                        {q.notes && (
                          <p style={{ fontSize: "12.5px", color: "var(--text2)", marginTop: "8px", fontStyle: "italic", lineHeight: 1.55 }}>
                            “{q.notes}”
                          </p>
                        )}

                        {/* The quote itself, once the studio has worked it out. */}
                        <div style={{ display: "flex", gap: "8px", marginTop: "12px", alignItems: "center", flexWrap: "wrap" }}>
                          <input
                            className="form-control"
                            style={{ maxWidth: "170px", padding: "7px 12px", fontSize: "12px" }}
                            placeholder="Quoted price"
                            value={priceDrafts[q.docId] ?? q.quotedPrice ?? ""}
                            onChange={(e) => setPriceDrafts({ ...priceDrafts, [q.docId]: e.target.value })}
                          />
                          <button
                            className="btn-secondary"
                            style={{ padding: "7px 16px !important", fontSize: "11px" }}
                            onClick={() => saveQuotedPrice(q.docId)}
                            disabled={priceDrafts[q.docId] === undefined}
                          >
                            Save
                          </button>
                        </div>
                      </div>

                      {/* Their photo, if they attached one */}
                      {q.photo && (
                        <div>
                          <h4 style={{ fontSize: "12px", color: "var(--text2)", textTransform: "uppercase", marginBottom: "8px" }}>Photo</h4>
                          <img
                            src={q.photo}
                            alt="Customer upload"
                            onClick={() => setLightboxImage(q.photo)}
                            style={{
                              width: "100%", borderRadius: "8px", cursor: "zoom-in",
                              border: "1px solid var(--border2)",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── ALLOT ORDER FORM ── lock the agreed terms, then send it to the customer ── */}
      {punchFor && (
        <div className="punch-overlay" onClick={(e) => { if (e.target === e.currentTarget) closePunch(); }}>
          <div className="punch-modal">
            <div className="punch-header">
              <div>
                <h3>{punchDone ? "Form Ready to Send" : "Send Order Form"}</h3>
                <p>
                  {punchDone
                    ? "Share this private link with the customer."
                    : `Against quote ${punchFor.reference || punchFor.docId} \u2014 ${punchFor.service?.title || ""}`}
                </p>
              </div>
              <button className="punch-close" onClick={closePunch}>×</button>
            </div>

            {punchDone ? (
              <div className="punch-body punch-done">
                <div className="punch-done-mark">✓</div>
                <p>The order form for <strong>{punchForm.name}</strong> is ready.</p>
                <p className="punch-done-sub">
                  Size, frame and amount are locked. They only fill in their delivery
                  details and place the order themselves.
                </p>

                <div className="punch-link">
                  <code>{formUrl(punchDone)}</code>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { navigator.clipboard?.writeText(formUrl(punchDone)); alert("Form link copied."); }}
                  >
                    Copy
                  </button>
                </div>

                <div className="punch-actions">
                  {toWhatsApp(punchForm.phone) && (
                    <button
                      className="btn-primary"
                      onClick={() => window.open(
                        `https://wa.me/${toWhatsApp(punchForm.phone)}?text=${encodeURIComponent(
                          `*Yaadein \u2014 Your Order Form* ✨\n\n` +
                          `Hello ${punchForm.name}, thank you for approving your quote.\n\n` +
                          `Please complete your order here:\n${formUrl(punchDone)}\n\n` +
                          `Your size and price are already filled in \u2014 just add your delivery details.`
                        )}`, "_blank")}
                    >
                      Send on WhatsApp
                    </button>
                  )}
                  <button className="btn-secondary" onClick={closePunch}>Done</button>
                </div>
              </div>
            ) : (
              <form className="punch-body" onSubmit={allotForm}>
                <div className="punch-recap">
                  <span>{punchFor.service?.title}</span>
                  <span>Requested: <strong>{formatDims(punchFor.dimensions)}</strong></span>
                  {punchFor.notes && <span>“{punchFor.notes}”</span>}
                </div>

                <h4 className="punch-section">Who this form is for</h4>
                <div className="punch-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input className="form-control" value={punchForm.name}
                      onChange={(e) => setPunchForm({ ...punchForm, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input className="form-control" value={punchForm.phone}
                      onChange={(e) => setPunchForm({ ...punchForm, phone: e.target.value })} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: "18px" }}>
                  <label>Email</label>
                  <input className="form-control" value={punchForm.email}
                    onChange={(e) => setPunchForm({ ...punchForm, email: e.target.value })} />
                </div>

                <h4 className="punch-section">Locked on the customer's form</h4>
                <p className="punch-hint">
                  These are what you agreed on the call. The customer will see them
                  but cannot change them.
                </p>
                <div className="punch-row">
                  <div className="form-group">
                    <label>Frame size *</label>
                    <input className="form-control" placeholder='e.g. 22 × 34 inches'
                      value={punchForm.sizeLabel}
                      onChange={(e) => setPunchForm({ ...punchForm, sizeLabel: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Frame</label>
                    <input className="form-control" placeholder="e.g. Antique Gold Moulding"
                      value={punchForm.frameLabel}
                      onChange={(e) => setPunchForm({ ...punchForm, frameLabel: e.target.value })} />
                  </div>
                </div>
                <div className="punch-row">
                  <div className="form-group">
                    <label>Agreed amount *</label>
                    <input className="form-control" placeholder="e.g. 14500" value={punchForm.agreedPrice}
                      onChange={(e) => setPunchForm({ ...punchForm, agreedPrice: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Delivery</label>
                    <input className="form-control" value={punchForm.shipping}
                      onChange={(e) => setPunchForm({ ...punchForm, shipping: e.target.value })} />
                  </div>
                </div>

                <div className="punch-total">
                  <span>Customer pays</span>
                  <strong>
                    Rs. {(priceToNumber(punchForm.agreedPrice) + priceToNumber(punchForm.shipping)).toLocaleString()}
                  </strong>
                </div>

                <div className="form-group" style={{ marginTop: "14px" }}>
                  <label>Internal note</label>
                  <input className="form-control" placeholder="Anything agreed on the call"
                    value={punchForm.note}
                    onChange={(e) => setPunchForm({ ...punchForm, note: e.target.value })} />
                </div>

                {punchError && <div className="punch-error">{punchError}</div>}

                <div className="punch-actions">
                  <button type="submit" className="btn-primary" disabled={punchSaving}>
                    {punchSaving ? "Creating\u2026" : "Create Form Link"}
                  </button>
                  <button type="button" className="btn-secondary" onClick={closePunch}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {lightboxImage && (
        <div className="receipt-lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <button className="receipt-lightbox-close" onClick={() => setLightboxImage(null)}>×</button>
          <img src={lightboxImage} alt="Customer upload" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
