// src/pages/AdminLogin.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Protected login gate for the admin CRM.
// Auth is localStorage-based for now.
// MIGRATION PATH: Replace handleLogin() with Firebase/Supabase signIn().
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { ADMIN_PASSWORD, SESSION_KEY, THEME } from "../utils/constants";

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [shake,    setShake]    = useState(false);
  const [show,     setShow]     = useState(false);

  const handleLogin = async () => {
    if (!password.trim()) { setError("Please enter your password."); return; }
    setLoading(true);

    // Simulate network delay (remove when using real auth)
    await new Promise(r => setTimeout(r, 600));

    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ loggedIn: true, ts: Date.now() }));
      onLogin();
    } else {
      setError("Incorrect password. Please try again.");
      setShake(true);
      setPassword("");
      setTimeout(() => setShake(false), 500);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:THEME.navy, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Sora','DM Sans',sans-serif", position:"relative", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&display=swap');
        @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shake    { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-10px)} 40%,80%{transform:translateX(10px)} }
        @keyframes orb      { 0%,100%{transform:translate(0,0)} 50%{transform:translate(40px,-30px)} }
        .login-input:focus  { border-color:${THEME.gold}!important; box-shadow:0 0 0 3px ${THEME.gold}22!important; outline:none; }
        .login-btn:hover    { transform:translateY(-1px); box-shadow:0 8px 32px ${THEME.gold}55!important; }
        .login-btn:active   { transform:translateY(0); }
      `}</style>

      {/* Background orbs */}
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:`radial-gradient(circle,${THEME.gold}08,transparent 70%)`, top:"-10%", left:"-5%", animation:"orb 8s ease-in-out infinite" }} />
      <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:`radial-gradient(circle,#3B82F608,transparent 70%)`, bottom:"5%", right:"5%", animation:"orb 10s ease-in-out infinite reverse" }} />

      <div style={{ width:400, animation:"fadeUp 0.5s ease", position:"relative", zIndex:1 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ width:68, height:68, background:`linear-gradient(135deg,${THEME.gold},${THEME.goldDim})`, borderRadius:20, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, fontWeight:900, color:THEME.navy, margin:"0 auto 16px", boxShadow:`0 8px 40px ${THEME.gold}44` }}>₹</div>
          <div style={{ fontSize:22, fontWeight:900, color:THEME.textPrimary, letterSpacing:"-0.02em" }}>OnePoint Finance Hub</div>
          <div style={{ fontSize:11, color:THEME.gold, fontWeight:700, letterSpacing:"0.12em", marginTop:4 }}>ADMIN CRM PANEL</div>
        </div>

        {/* Card */}
        <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${THEME.border}`, borderRadius:22, padding:36, backdropFilter:"blur(20px)", animation: shake ? "shake 0.4s ease" : "none" }}>
          <div style={{ fontSize:17, fontWeight:800, color:THEME.textPrimary, marginBottom:6, textAlign:"center" }}>Welcome back</div>
          <div style={{ fontSize:13, color:THEME.textMuted, textAlign:"center", marginBottom:28 }}>Sign in to access your CRM dashboard</div>

          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, fontWeight:700, color:THEME.textMuted, letterSpacing:"0.08em", display:"block", marginBottom:8 }}>PASSWORD</label>
            <div style={{ position:"relative" }}>
              <input
                className="login-input"
                type={show ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="Enter admin password"
                style={{ width:"100%", padding:"13px 48px 13px 16px", background:"rgba(255,255,255,0.06)", border:`1px solid ${THEME.borderSub}`, borderRadius:12, color:THEME.textPrimary, fontSize:14, fontFamily:"inherit", transition:"all 0.2s", boxSizing:"border-box" }}
              />
              <button onClick={() => setShow(!show)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:THEME.textMuted, cursor:"pointer", fontSize:16 }}>
                {show ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding:"10px 14px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, color:"#EF4444", fontSize:13, marginBottom:16 }}>
              ⚠ {error}
            </div>
          )}

          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={loading}
            style={{ width:"100%", padding:"14px", background:`linear-gradient(135deg,${THEME.gold},${THEME.goldDim})`, border:"none", borderRadius:12, color:THEME.navy, fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s", boxShadow:`0 4px 24px ${THEME.gold}33`, opacity:loading?0.8:1 }}
          >
            {loading ? "Verifying…" : "Enter Dashboard →"}
          </button>

          <div style={{ textAlign:"center", marginTop:20, fontSize:12, color:THEME.textMuted }}>
            Default: <code style={{ color:THEME.gold, background:`${THEME.gold}11`, padding:"2px 8px", borderRadius:6 }}>onepointadmin2026</code>
          </div>
        </div>

        <div style={{ textAlign:"center", marginTop:20, fontSize:11, color:THEME.textMuted }}>
          🔒 Move password to .env file before production deployment
        </div>
      </div>
    </div>
  );
}
