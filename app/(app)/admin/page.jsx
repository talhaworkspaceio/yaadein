"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    if (email.trim() === "yaadein.pk@gmail.com" && password === "Yaadein@123") {
      sessionStorage.setItem("fs_admin", "authenticated");
      window.location.href = "/admin/dashboard";
    } else {
      setError("Invalid admin credentials");
    }
  };

  return (
    <div className="admin-login-root">
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        
        :root {
          --bg: #0F0D0B;
          --surface: #171512;
          --surface2: #211E1A;
          --border: rgba(255,255,255,0.06);
          --border2: rgba(255,255,255,0.12);
          --text: #F5F0E8;
          --text2: #A8A08C;
          --accent: #C9A84C;
          --radius: 12px;
        }

        .admin-login-root {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 40px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-brand {
          font-family: 'DM Serif Display', serif;
          font-size: 28px;
          color: var(--accent);
          margin-bottom: 8px;
        }
        .login-brand span { color: var(--text); font-size: 24px; }
        .login-subtitle {
          font-size: 13px;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }
        .form-group label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text2);
        }
        .form-control {
          background: var(--surface2);
          border: 1px solid var(--border2);
          border-radius: 8px;
          color: var(--text);
          padding: 12px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .form-control:focus {
          border-color: var(--accent);
        }

        .error-msg {
          color: #FF5A5A;
          font-size: 13px;
          text-align: center;
          margin-bottom: 20px;
          background: rgba(255, 90, 90, 0.1);
          padding: 10px;
          border-radius: 8px;
        }

        .btn-login {
          width: 100%;
          background: var(--accent) !important;
          color: #0C0A08 !important;
          border: none !important;
          border-radius: 9999px !important;
          padding: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 4px 15px rgba(201, 168, 76, 0.25);
        }
        .btn-login:hover {
          background: #E8D48B !important;
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 24px rgba(201, 168, 76, 0.4);
        }
      ` }} />

      <div className="login-card">
        <div className="login-header">
          <div className="login-brand">Yaadein</div>
          <div className="login-subtitle">Admin Portal</div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div className="form-wrapper" onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(e); }}>
          <div className="form-group">
            <label>Admin Email</label>
            <input 
              type="email" 
              className="form-control" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yaadein.pk@gmail.com"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="button" onClick={handleLogin} className="btn-login">Secure Login</button>
        </div>
      </div>
    </div>
  );
}
