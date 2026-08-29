"use client";

// ---------------------------------------------------------------------------
// Customer order form for an approved custom-size quote.
//
// A custom size has no shelf price, so the customer cannot order it from the
// service page — they would only ever see the starting price. Once the studio
// has agreed a price with them, it allots a private form on this URL: the size,
// frame and amount are locked to what was agreed, and the customer fills in
// their own delivery details and places the order themselves.
// ---------------------------------------------------------------------------

import { use, useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import { ref, onValue, set, push } from "firebase/database";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import FrameLoader from "../../components/FrameLoader";

const CLOUDINARY_CLOUD = "hpikhwjw";
const CLOUDINARY_PRESET = "ml_default";

const PAYMENT_METHODS = ["Cash on Delivery", "EasyPaisa", "JazzCash", "Bank Transfer"];

// Methods that are paid up front, so a receipt is worth asking for.
const PREPAID = ["EasyPaisa", "JazzCash", "Bank Transfer"];

export default function OrderFormPage({ params }) {
  const { token } = use(params);

  const [record, setRecord] = useState(undefined); // undefined = still loading
  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    address: "", city: "", state: "", zip: "",
    paymentMethod: "Cash on Delivery", note: "",
  });
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [placedId, setPlacedId] = useState("");

  useEffect(() => {
    const unsub = onValue(ref(db, `order_forms/${token}`), (snap) => {
      const val = snap.val();
      setRecord(val || null);
      if (val?.prefill) {
        setForm((f) => ({
          ...f,
          name: val.prefill.name || "",
          phone: val.prefill.phone || "",
          email: val.prefill.email || "",
        }));
      }
    });
    return () => unsub();
  }, [token]);

  const locked = record?.locked;

  const submit = async (e) => {
    e.preventDefault();
    if (submitting || !record || !locked) return;

    if (!form.name.trim()) return setError("Please enter your name.");
    if (form.phone.replace(/\D/g, "").length < 7) return setError("Please enter a valid contact number.");
    if (!form.address.trim()) return setError("Please enter your delivery address.");
    if (!form.city.trim()) return setError("Please enter your city.");
    if (PREPAID.includes(form.paymentMethod) && !receipt) {
      return setError("Please attach your payment receipt screenshot, or choose Cash on Delivery.");
    }

    setError("");
    setSubmitting(true);
    const orderId = "FS-" + Math.floor(100000 + Math.random() * 900000);

    try {
      let receiptUrl = "";
      if (receipt) {
        const data = new FormData();
        data.append("file", receipt);
        data.append("upload_preset", CLOUDINARY_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
          method: "POST",
          body: data,
        });
        if (!res.ok) throw new Error("Receipt upload failed");
        receiptUrl = (await res.json()).secure_url;
      }

      // Same shape the checkout writes, so it lands in Incoming Orders and can
      // be tracked like any other order.
      const orderData = {
        customer: {
          name: form.name.trim(),
          fullName: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          zip: form.zip.trim(),
        },
        items: [{
          id: `service-${record.service?.slug || "custom"}-${record.quoteReference || token}`,
          frameName: locked.serviceTitle,
          price: `Rs. ${Number(locked.amount || 0).toLocaleString()}`,
          quantity: 1,
          frameColor: "#1C0F07",
          size: `Custom Size (${locked.sizeLabel})${locked.frameLabel ? ` • ${locked.frameLabel}` : ""}`,
          orientation: "portrait",
          image: record.photo || "",
        }],
        subtotal: Number(locked.amount || 0),
        shipping: Number(locked.shipping || 0),
        total: Number(locked.total || 0),
        orderId,
        paymentMethod: form.paymentMethod,
        paymentReceiptUrl: receiptUrl,
        status: "Pending",
        createdAt: Date.now(),
        // Placed by the customer against a quote the studio agreed with them.
        source: "quote-form",
        quoteReference: record.quoteReference || "",
        customerNote: form.note.trim(),
      };

      await set(push(ref(db, "orders")), orderData);
      await set(ref(db, `order_forms/${token}/status`), "Completed");
      await set(ref(db, `order_forms/${token}/orderId`), orderId);
      await set(ref(db, `order_forms/${token}/completedAt`), Date.now());
      if (record.quoteDocId) {
        await set(ref(db, `quote_requests/${record.quoteDocId}/convertedOrderId`), orderId);
        await set(ref(db, `quote_requests/${record.quoteDocId}/status`), "Closed");
      }

      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "order", orderData }),
      }).catch(() => {});

      setPlacedId(orderId);
    } catch (err) {
      console.error("Could not place the order:", err);
      setError("We could not place your order just now. Please try again, or contact the studio.");
    } finally {
      setSubmitting(false);
    }
  };

  const alreadyDone = record && record.status === "Completed" && !placedId;

  return (
    <div className="of-root">
      <Navbar />

      <main className="of-main">
        {record === undefined ? (
          <FrameLoader variant="page" label="Opening your order form" />
        ) : record === null ? (
          <div className="of-card of-message">
            <h1>This form is not available</h1>
            <p>
              The link may be incorrect or the form may have been withdrawn.
              Please contact the studio and we will send you a fresh one.
            </p>
            <a className="of-btn" href="/contact">Contact the studio</a>
          </div>
        ) : placedId || alreadyDone ? (
          <div className="of-card of-message">
            <div className="of-tick">✓</div>
            <h1>{placedId ? "Order placed" : "Already completed"}</h1>
            <p>
              {placedId
                ? "Thank you. Your order is with our studio and we will be in touch shortly."
                : "This form has already been used to place an order."}
            </p>
            <div className="of-ref">
              <span>Order reference</span>
              <strong>{placedId || record.orderId}</strong>
            </div>
            <a className="of-btn" href={`/track-order?id=${placedId || record.orderId}`}>Track your order</a>
          </div>
        ) : (
          <>
            <header className="of-head">
              <p className="of-eyebrow">Your Approved Quote</p>
              <h1>Complete your order</h1>
              <p className="of-sub">
                Your size, frame and price are already set from your conversation
                with our studio. Just add your delivery details below.
              </p>
            </header>

            <div className="of-grid">
              {/* Locked terms — shown, never editable. */}
              <aside className="of-card of-locked">
                <div className="of-locked-head">
                  <h2>Your order</h2>
                  <span className="of-lock">🔒 Agreed with the studio</span>
                </div>

                {record.photo && (
                  <img className="of-photo" src={record.photo} alt="Your artwork" />
                )}

                <dl className="of-terms">
                  <div><dt>Service</dt><dd>{locked.serviceTitle}</dd></div>
                  <div><dt>Frame size</dt><dd>{locked.sizeLabel}</dd></div>
                  {locked.frameLabel && <div><dt>Frame</dt><dd>{locked.frameLabel}</dd></div>}
                </dl>

                <div className="of-totals">
                  <div className="of-total-row">
                    <span>Framing</span>
                    <span>Rs. {Number(locked.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="of-total-row">
                    <span>Delivery</span>
                    <span>Rs. {Number(locked.shipping || 0).toLocaleString()}</span>
                  </div>
                  <div className="of-total-row of-grand">
                    <span>Total</span>
                    <span>Rs. {Number(locked.total || 0).toLocaleString()}</span>
                  </div>
                </div>

                <p className="of-locked-note">
                  These details were agreed for your custom size and cannot be
                  changed here. If something looks wrong, please contact the studio
                  before placing your order.
                </p>
              </aside>

              {/* What the customer fills in. */}
              <form className="of-card of-form" onSubmit={submit}>
                <h2>Your details</h2>

                <div className="of-row">
                  <div className="of-field">
                    <label htmlFor="of-name">Full name <em>*</em></label>
                    <input id="of-name" value={form.name} autoComplete="name"
                      onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="of-field">
                    <label htmlFor="of-phone">Phone <em>*</em></label>
                    <input id="of-phone" type="tel" value={form.phone} autoComplete="tel"
                      onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>

                <div className="of-field">
                  <label htmlFor="of-email">Email</label>
                  <input id="of-email" type="email" value={form.email} autoComplete="email"
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>

                <div className="of-field">
                  <label htmlFor="of-address">Delivery address <em>*</em></label>
                  <input id="of-address" value={form.address} autoComplete="street-address"
                    placeholder="House / street / area"
                    onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>

                <div className="of-row of-row-3">
                  <div className="of-field">
                    <label htmlFor="of-city">City <em>*</em></label>
                    <input id="of-city" value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="of-field">
                    <label htmlFor="of-state">Province</label>
                    <input id="of-state" value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })} />
                  </div>
                  <div className="of-field">
                    <label htmlFor="of-zip">Postal code</label>
                    <input id="of-zip" value={form.zip}
                      onChange={(e) => setForm({ ...form, zip: e.target.value })} />
                  </div>
                </div>

                <h2 className="of-h2-spaced">Payment</h2>
                <div className="of-pay">
                  {PAYMENT_METHODS.map((m) => (
                    <button type="button" key={m}
                      className={`of-pay-btn ${form.paymentMethod === m ? "active" : ""}`}
                      onClick={() => setForm({ ...form, paymentMethod: m })}>
                      {m}
                    </button>
                  ))}
                </div>

                {PREPAID.includes(form.paymentMethod) && (
                  <div className="of-field of-receipt">
                    <label htmlFor="of-receipt">Payment receipt screenshot <em>*</em></label>
                    <input id="of-receipt" type="file" accept="image/*"
                      onChange={(e) => setReceipt(e.target.files?.[0] || null)} />
                    <p className="of-hint">
                      Transfer Rs. {Number(locked.total || 0).toLocaleString()} and attach
                      the screenshot. Our studio will confirm once received.
                    </p>
                  </div>
                )}

                <div className="of-field">
                  <label htmlFor="of-note">Anything else?</label>
                  <textarea id="of-note" rows={2} value={form.note}
                    placeholder="Delivery instructions, preferred timing, anything else."
                    onChange={(e) => setForm({ ...form, note: e.target.value })} />
                </div>

                {error && <div className="of-error" role="alert">{error}</div>}

                <button type="submit" className="of-btn of-submit" disabled={submitting}>
                  {submitting ? "Placing your order…" : `Place order · Rs. ${Number(locked.total || 0).toLocaleString()}`}
                </button>
              </form>
            </div>
          </>
        )}
      </main>

      <Footer />

      <style dangerouslySetInnerHTML={{ __html: `
        .of-root { background: var(--bg); min-height: 100vh; }
        .of-main { max-width: 1080px; margin: 0 auto; padding: 120px 24px 90px; }

        .of-head { text-align: center; margin-bottom: 36px; }
        .of-eyebrow {
          font-family: var(--font-typewriter); font-size: 11px;
          letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent);
          margin-bottom: 12px;
        }
        .of-head h1 { font-family: var(--font-display); font-size: 40px; color: var(--text); }
        .of-sub {
          font-family: var(--font-typewriter); font-size: 13.5px; line-height: 1.7;
          color: var(--text2); max-width: 520px; margin: 12px auto 0;
        }

        .of-grid { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 24px; align-items: start; }

        .of-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 26px;
        }

        /* Locked panel */
        .of-locked { position: sticky; top: 100px; }
        .of-locked-head {
          display: flex; flex-direction: column; gap: 6px;
          padding-bottom: 14px; margin-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }
        .of-locked h2, .of-form h2 {
          font-family: var(--font-display); font-size: 21px; color: var(--accent);
        }
        .of-lock {
          font-family: var(--font-typewriter); font-size: 10px;
          text-transform: uppercase; letter-spacing: 0.1em; color: var(--text2);
        }
        .of-photo {
          width: 100%; border-radius: 8px; margin-bottom: 16px;
          border: 1px solid var(--border2);
        }
        .of-terms { display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px; }
        .of-terms > div { display: flex; justify-content: space-between; gap: 14px; align-items: baseline; }
        .of-terms dt {
          font-family: var(--font-typewriter); font-size: 10px;
          text-transform: uppercase; letter-spacing: 0.08em; color: var(--text2);
          white-space: nowrap;
        }
        .of-terms dd {
          font-family: var(--font-typewriter); font-size: 13px;
          color: var(--text); text-align: right;
        }
        .of-totals {
          border-top: 1px dashed var(--border2); padding-top: 14px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .of-total-row {
          display: flex; justify-content: space-between;
          font-family: var(--font-typewriter); font-size: 13px; color: var(--text2);
        }
        .of-grand {
          border-top: 1px solid var(--border2); margin-top: 6px; padding-top: 12px;
          font-size: 17px; color: var(--text);
        }
        .of-grand span:last-child { color: var(--accent); font-weight: 700; }
        .of-locked-note {
          margin-top: 16px; font-family: var(--font-typewriter);
          font-size: 11px; line-height: 1.6; color: var(--text2); opacity: 0.85;
        }

        /* Customer form */
        .of-h2-spaced { margin-top: 24px; }
        .of-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .of-row-3 { grid-template-columns: 1fr 1fr 1fr; }
        .of-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .of-field label {
          font-family: var(--font-typewriter); font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.07em; color: var(--text2);
        }
        .of-field label em { color: #E06A6A; font-style: normal; }
        .of-field input, .of-field textarea {
          background: rgba(0,0,0,0.28); border: 1px solid var(--border2);
          border-radius: 8px; padding: 11px 13px; color: var(--text);
          font-family: var(--font-typewriter); font-size: 13px;
          outline: none; width: 100%; resize: vertical;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .of-field input:focus, .of-field textarea:focus {
          border-color: var(--accent); box-shadow: 0 0 0 3px rgba(181,139,92,0.15);
        }
        .of-field input::placeholder, .of-field textarea::placeholder {
          color: var(--text2); opacity: 0.55;
        }
        .of-field input[type="file"] { padding: 9px; font-size: 12px; }

        .of-pay { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .of-pay-btn {
          background: rgba(0,0,0,0.25); border: 1px solid var(--border2);
          color: var(--text2); border-radius: 9999px; padding: 8px 16px;
          font-family: var(--font-typewriter); font-size: 12px; cursor: pointer;
          transition: all 0.2s ease;
        }
        .of-pay-btn:hover { border-color: var(--accent); color: var(--text); }
        .of-pay-btn.active {
          background: var(--accent); border-color: var(--accent); color: #14100A; font-weight: 700;
        }
        .of-hint {
          font-family: var(--font-typewriter); font-size: 11px;
          color: var(--text2); line-height: 1.55;
        }

        .of-error {
          background: rgba(224,106,106,0.1); border: 1px solid rgba(224,106,106,0.4);
          border-left: 3px solid #E06A6A; border-radius: 6px;
          padding: 10px 12px; margin-bottom: 14px;
          font-family: var(--font-typewriter); font-size: 12px; color: #F0A8A8;
        }

        .of-btn {
          display: inline-block; text-align: center; text-decoration: none;
          background: var(--accent); color: #14100A; border: none;
          border-radius: 9999px; padding: 13px 28px; cursor: pointer;
          font-family: var(--font-typewriter); font-size: 13px; font-weight: 700;
          letter-spacing: 0.05em; transition: all 0.25s ease;
        }
        .of-btn:hover { background: var(--accent2); transform: translateY(-1px); }
        .of-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
        .of-submit { width: 100%; margin-top: 8px; }

        /* Message states — a single centred column, so the reference and the
           action stack instead of sitting shoulder to shoulder. */
        .of-message {
          max-width: 440px; margin: 0 auto; padding: 40px 34px 34px;
          display: flex; flex-direction: column; align-items: center;
          text-align: center;
        }
        .of-message h1 {
          font-family: var(--font-display); font-size: 26px;
          color: var(--text); margin-bottom: 10px;
        }
        .of-message p {
          font-family: var(--font-typewriter); font-size: 13px;
          line-height: 1.7; color: var(--text2); margin: 0;
          max-width: 34ch;
        }
        .of-tick {
          width: 56px; height: 56px; margin-bottom: 20px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 25px; color: var(--accent);
          background: rgba(181,139,92,0.12); border: 1px solid var(--border2);
        }
        .of-ref {
          width: 100%;
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          padding: 14px 20px; margin: 24px 0 0;
          border: 1px dashed var(--border2); border-radius: 10px;
          background: rgba(181,139,92,0.06);
        }
        .of-ref span {
          font-family: var(--font-typewriter); font-size: 9.5px;
          text-transform: uppercase; letter-spacing: 0.14em; color: var(--text2);
        }
        .of-ref strong {
          font-family: var(--font-typewriter); font-size: 22px;
          letter-spacing: 0.08em; color: var(--accent);
        }
        .of-message .of-btn { width: 100%; margin-top: 22px; }

        @media (max-width: 900px) {
          .of-grid { grid-template-columns: 1fr; }
          .of-locked { position: static; }
        }
        @media (max-width: 560px) {
          .of-main { padding: 100px 16px 70px; }
          .of-head h1 { font-size: 30px; }
          .of-row, .of-row-3 { grid-template-columns: 1fr; gap: 0; }
        }
      ` }} />
    </div>
  );
}
