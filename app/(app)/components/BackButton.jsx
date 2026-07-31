"use client";

import { usePathname, useRouter } from "next/navigation";

const NAVBAR_TAB_PATHS = ["/", "/catalog", "/services", "/track-order", "/contact"];

export default function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (NAVBAR_TAB_PATHS.includes(pathname)) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .btn-page-back {
          position: fixed;
          top: 96px;
          left: 24px;
          z-index: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--border2);
          color: var(--text);
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .btn-page-back:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: translateX(-2px);
        }
        @media (max-width: 580px) {
          .btn-page-back {
            top: 84px;
            left: 16px;
            width: 36px;
            height: 36px;
          }
        }
      ` }} />
      <button
        type="button"
        className="btn-page-back"
        onClick={() => router.back()}
        title="Go back"
        aria-label="Go back"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px" }}>
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>
    </>
  );
}
