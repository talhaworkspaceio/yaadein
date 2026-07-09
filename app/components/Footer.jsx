"use client";

export default function Footer() {
  return (
    <footer className="global-footer">
      <style dangerouslySetInnerHTML={{
        __html: `
        .global-footer {
          background: #080605;
          border-top: 2px solid #1C0F07;
          padding: 80px 40px 40px;
          position: relative;
          z-index: 10;
        }
        .footer-grid {
          max-width: 1300px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 60px;
          padding-bottom: 60px;
          border-bottom: 1px solid var(--border);
        }
        .footer-brand-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .footer-brand {
          display: flex;
          align-items: center;
          transition: transform 0.2s ease;
          text-decoration: none;
        }
        .footer-brand:hover {
          transform: scale(1.03);
        }
        .footer-logo-img {
          height: 75px;
          width: auto;
          display: block;
        }
        .footer-tagline {
          font-family: var(--font-serif);
          font-size: 15px;
          line-height: 1.7;
          color: var(--text2);
          max-width: 320px;
        }
        .footer-title {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 24px;
        }
        .footer-links {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .footer-link {
          color: var(--text2);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.15s ease;
          cursor: pointer;
        }
        .footer-link:hover {
          color: var(--accent);
        }
        .footer-bottom {
          max-width: 1300px;
          margin: 40px auto 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-typewriter);
          font-size: 12px;
          color: var(--text2);
          letter-spacing: 0.05em;
        }
        .footer-bottom span {
          color: var(--accent);
        }

        @media (max-width: 768px) {
          .global-footer { padding: 60px 20px 20px; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
          .footer-bottom { flex-direction: column; gap: 16px; text-align: center; }
        }
      ` }} />

      <div className="footer-grid">
        <div className="footer-brand-col">
          <a href="/" className="footer-brand">
            <img src="/images/logo-white-orig.png" alt="Yaadein Logo" className="footer-logo-img" />
          </a>
          <p className="footer-tagline">
            Masterpiece picture framing handcrafted for your unique memories. Designed digitally by you, hand-finished by master craftspeople in Pakistan.
          </p>
        </div>

        <div>
          <h4 className="footer-title">Explore</h4>
          <div className="footer-links">
            <a href="/" className="footer-link">Home</a>
            <a href="/catalog" className="footer-link">Catalog</a>
            <a href="/services" className="footer-link">Services</a>
            <a href="/contact" className="footer-link">Contact</a>
          </div>
        </div>

        <div>
          <h4 className="footer-title">Policies</h4>
          <div className="footer-links">
            <a href="/terms-and-conditions" className="footer-link">Terms & Conditions</a>
            <a href="/refund-policy" className="footer-link">Refund Policy</a>
            <a href="/privacy-policy" className="footer-link">Privacy Policy</a>
          </div>
        </div>

        <div>
          <h4 className="footer-title">Studio Info</h4>
          <div className="footer-links">
            <span className="footer-link" style={{ cursor: "default" }}>Mon - Fri: 9:00 AM - 6:00 PM</span>
            <span className="footer-link" style={{ cursor: "default" }}>Support: team@yaadein.com</span>
            <span className="footer-link" style={{ cursor: "default" }}>Designed in Pakistan</span>
            <a href="https://www.linkedin.com/in/talharshad/" target="_blank" rel="noopener noreferrer" className="footer-link">Developer LinkedIn</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Yaadein. All rights reserved.</p>
        <p>Crafted with <span>♥</span> for timeless memories.</p>
      </div>
    </footer>
  );
}
