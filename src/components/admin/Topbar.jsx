// src/components/admin/Topbar.jsx
import { THEME } from "../../utils/constants";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  leads:     "Lead Management",
  agents:    "Agent Management",
  analytics: "Analytics & Reports",
  settings:  "Settings",
};

export default function Topbar({ page, loading, onRefresh, onLogout }) {
  return (
    <header style={{ height:64, background:"rgba(4,10,20,0.95)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${THEME.borderSub}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", flexShrink:0, position:"sticky", top:0, zIndex:50 }}>

      {/* Left: title */}
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ fontSize:18, fontWeight:800, color:THEME.textPrimary }}>{PAGE_TITLES[page] || "Admin"}</div>
        {loading && (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px", background:"rgba(201,168,76,0.1)", border:`1px solid ${THEME.border}`, borderRadius:20 }}>
            <div style={{ width:6, height:6, background:THEME.gold, borderRadius:"50%", animation:"pulse 1s infinite" }} />
            <span style={{ fontSize:11, color:THEME.gold, fontWeight:700 }}>Syncing</span>
          </div>
        )}
      </div>

      {/* Right: controls */}
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ fontSize:12, color:THEME.textMuted, display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ color:"#22C55E", fontSize:8 }}>●</span>
          Live · Google Sheets
        </div>
        <button onClick={onRefresh} style={{ padding:"7px 14px", background:"rgba(255,255,255,0.04)", border:`1px solid ${THEME.borderSub}`, borderRadius:8, color:THEME.textSub, cursor:"pointer", fontSize:13, fontFamily:"inherit", transition:"all 0.18s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = THEME.border}
          onMouseLeave={e => e.currentTarget.style.borderColor = THEME.borderSub}
        >↻ Refresh</button>
        <button onClick={onLogout} style={{ padding:"7px 16px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:8, color:"#EF4444", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>
          Logout
        </button>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </header>
  );
}
