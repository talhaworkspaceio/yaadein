"use client";

import { useNavigationContent } from "../../lib/cms";

export default function Footer() {
  const { data: navigation } = useNavigationContent();

  const tagline = navigation?.tagline || navigation?.footerBrand?.tagline || "Masterpiece picture framing handcrafted for your unique memories. Designed digitally by you, hand-finished by master craftspeople in Pakistan.";
  const logoSrc = navigation?.footerBrand?.footerLogo?.url || "/images/logo-white-orig.png";
  const workingHours = navigation?.studioHours || navigation?.studioInfo?.workingHours || "Mon - Fri: 9:00 AM - 6:00 PM";
  const supportEmail = navigation?.supportEmail || navigation?.studioInfo?.supportEmail || "team@yaadein.com";
  const locationText = navigation?.location || navigation?.studioInfo?.locationText || "Designed in Pakistan";
  const devLinkText = navigation?.studioInfo?.developerLinkText || "Developer LinkedIn";
  const devLinkUrl = navigation?.developerLink || navigation?.studioInfo?.developerLinkUrl || "https://www.linkedin.com/in/talharshad/";
  const copyrightText = navigation?.copyrightText || navigation?.footerBottom?.copyrightText || `© ${new Date().getFullYear()} Yaadein. All rights reserved.`;
  const craftedText = navigation?.footerBottom?.craftedText || "Crafted with ♥ for timeless memories.";


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
          height: 100px;
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
            <img src={logoSrc} alt="Yaadein Logo" className="footer-logo-img" />
          </a>
          <p className="footer-tagline">
            {tagline}
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
          <h4 className="footer-title">Studio Info & Social</h4>
          <div className="footer-links">
            <span className="footer-link" style={{ cursor: "default" }}>{workingHours}</span>
            <span className="footer-link" style={{ cursor: "default" }}>
              {supportEmail.includes(":") ? supportEmail : `Support: ${supportEmail}`}
            </span>
            <span className="footer-link" style={{ cursor: "default" }}>{locationText}</span>
            <a href="https://www.instagram.com/yaadein.pk/" target="_blank" rel="noopener noreferrer" className="footer-link">Instagram: @yaadein.pk</a>
            <a href="https://www.facebook.com/yaadein.pk" target="_blank" rel="noopener noreferrer" className="footer-link">Facebook: yaadein.pk</a>
            <a href="https://www.tiktok.com/@yaadein.pk.official" target="_blank" rel="noopener noreferrer" className="footer-link">TikTok: @yaadein.pk.official</a>
            <a href={devLinkUrl} target="_blank" rel="noopener noreferrer" className="footer-link">{devLinkText}</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>{copyrightText}</p>
        <p>{craftedText}</p>
      </div>
    </footer>
  );
}
