// src/components/admin/Sidebar.jsx
import { NAV_ITEMS, THEME } from "../../utils/constants";

export default function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  const w = collapsed ? 64 : 240;
  return (
    <aside style={{ width:w, minHeight:"100vh", background:"#040A14", borderRight:`1px solid ${THEME.border}`, display:"flex", flexDirection:"column", transition:"width 0.22s cubic-bezier(.4,0,.2,1)", flexShrink:0, overflow:"hidden" }}>

      {/* Logo */}
      <div style={{ height:64, display:"flex", alignItems:"center", gap:12, padding: collapsed ? "0 14px" : "0 20px", borderBottom:`1px solid ${THEME.borderSub}`, boxSizing:"border-box", overflow:"hidden" }}>
        <div style={{ width:36, height:36, flexShrink:0, background:`linear-gradient(135deg,${THEME.gold},${THEME.goldDim})`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:THEME.navy, fontSize:18, boxShadow:`0 4px 16px ${THEME.gold}44` }}>₹</div>
        {!collapsed && (
          <div style={{ overflow:"hidden" }}>
            <div style={{ fontSize:13, fontWeight:800, color:THEME.textPrimary, whiteSpace:"nowrap" }}>OnePoint Finance</div>
            <div style={{ fontSize:9, color:THEME.gold, fontWeight:700, letterSpacing:"0.12em", whiteSpace:"nowrap" }}>CRM ADMIN PANEL</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:"10px 0" }}>
        {NAV_ITEMS.map(item => {
          const on = active === item.id;
          return (
            <button key={item.id} onClick={() => setActive(item.id)} title={collapsed ? item.label : ""} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding: collapsed ? "13px 0" : "13px 20px", justifyContent: collapsed ? "center" : "flex-start", background: on ? `linear-gradient(90deg,${THEME.gold}18,transparent)` : "transparent", border:"none", borderLeft: on ? `3px solid ${THEME.gold}` : "3px solid transparent", color: on ? THEME.gold : THEME.textMuted, cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight: on ? 700 : 500, transition:"all 0.18s" }}>
              <span style={{ fontSize:17, flexShrink:0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && on && <span style={{ marginLeft:"auto", width:6, height:6, background:THEME.gold, borderRadius:"50%", boxShadow:`0 0 8px ${THEME.gold}` }} />}
            </button>
          );
        })}
      </nav>

      {/* Collapse */}
      <button onClick={() => setCollapsed(!collapsed)} style={{ margin:12, padding:"10px", background:"rgba(255,255,255,0.03)", border:`1px solid ${THEME.borderSub}`, borderRadius:10, color:THEME.textMuted, cursor:"pointer", fontSize:14, fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <span>{collapsed ? "→" : "←"}</span>
        {!collapsed && <span style={{ fontSize:12 }}>Collapse</span>}
      </button>
    </aside>
  );
}
