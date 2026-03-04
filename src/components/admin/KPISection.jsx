// src/components/admin/KPISection.jsx
import { THEME } from "../../utils/constants";

function KPICard({ label, value, icon, color, sub }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid rgba(255,255,255,0.06)`, borderRadius:16, padding:"22px 24px", borderTop:`3px solid ${color}`, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:16, right:20, fontSize:26, opacity:0.15 }}>{icon}</div>
      <div style={{ fontSize:11, fontWeight:700, color:THEME.textMuted, letterSpacing:"0.1em", marginBottom:10 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize:34, fontWeight:900, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:THEME.textMuted, marginTop:8 }}>{sub}</div>}
    </div>
  );
}

export default function KPISection({ kpis }) {
  const cards = [
    { label:"Total Leads",   value:kpis.total,     icon:"◧", color:THEME.gold,     sub:`${kpis.disbursed} disbursed` },
    { label:"New Leads",     value:kpis.newL,      icon:"◉", color:"#3B82F6",      sub:"Awaiting contact" },
    { label:"In Process",    value:kpis.inProcess, icon:"◐", color:"#A855F7",      sub:"Active pipeline" },
    { label:"Approved",      value:kpis.approved,  icon:"◉", color:"#22C55E",      sub:"Ready to disburse" },
    { label:"Rejected",      value:kpis.rejected,  icon:"✕", color:"#EF4444",      sub:"Closed lost" },
    { label:"Conversion",    value:kpis.rate+"%",  icon:"★", color:THEME.goldLight, sub:"Approved + Disbursed" },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:16, marginBottom:28 }}>
      {cards.map(c => <KPICard key={c.label} {...c} />)}
    </div>
  );
}
