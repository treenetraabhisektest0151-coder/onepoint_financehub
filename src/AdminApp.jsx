// src/AdminApp.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin CRM entry point. Handles auth gate + session management.
// Mount this at /admin in your main.jsx or App.jsx router.
//
// DOES NOT affect your public website routes in any way.
//
// ARCHITECTURE:
// - Auth state lives in localStorage (SESSION_KEY)
// - On load: check localStorage → show Dashboard or Login
// - onLogin: write session → show Dashboard
// - onLogout: clear session → show Login
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import AdminLogin     from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import { SESSION_KEY } from "./utils/constants";

function isSessionValid() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const { loggedIn, ts } = JSON.parse(raw);
    // Auto-expire after 8 hours
    const EIGHT_HOURS = 8 * 60 * 60 * 1000;
    return loggedIn && (Date.now() - ts) < EIGHT_HOURS;
  } catch {
    return false;
  }
}

export default function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [ready,  setReady]  = useState(false);

  // Check existing session on mount
  useEffect(() => {
    setAuthed(isSessionValid());
    setReady(true);
  }, []);

  const handleLogin = () => setAuthed(true);
  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setAuthed(false);
  };

  // Avoid flash of login screen on initial load
  if (!ready) return (
    <div style={{ minHeight:"100vh", background:"#060C1A", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:"#C9A84C", fontSize:13 }}>Loading…</div>
    </div>
  );

  return authed
    ? <AdminDashboard onLogout={handleLogout} />
    : <AdminLogin     onLogin={handleLogin}   />;
}
