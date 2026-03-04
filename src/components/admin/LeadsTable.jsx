// src/components/admin/LeadsTable.jsx
import { useState } from "react";
import StatusBadge from "./StatusBadge";
import { STATUS_MAP, ALL_STATUSES, THEME } from "../../utils/constants";
import { formatCurrency, formatMobile, formatDateShort, getInitials } from "../../utils/formatters";

// Slide-in detail drawer
function LeadDrawer({ lead, agents, onClose, onStatusChange, onAgentChange }) {
  const [status,     setStatus]     = useState(lead.status);
  const [assignedTo, setAssignedTo] = useState(lead.assignedTo || "");
  const [note,       setNote]       = useState("");
  const [saving,     setSaving]     = useState(false);

  const save = async () => {
    setSaving(true);
    await onStatusChange(lead.id, status);
    await onAgentChange(lead.id, assignedTo);
    setSaving(false);
  };

  const rows = [
    ["Lead ID",       lead.id],
    ["Mobile",        formatMobile(lead.mobile)],
    ["Email",         lead.email || "—"],
    ["City",          lead.city  || "—"],
    ["Product",       lead.loanType],
    ["Amount",        formatCurrency(lead.loanAmount)],
    ["Monthly Income",formatCurrency(lead.monthlyIncome)],
    ["Company/Biz",   lead.companyBusiness || "—"],
    ["Source",        lead.source || "Website"],
    ["Notes",         lead.notes  || "—"],
  ];

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:200, backdropFilter:"blur(4px)" }} />
      <div style={{ position:"fixed", right:0, top:0, bottom:0, width:420, background:THEME.navyCard, borderLeft:`1px solid ${THEME.border}`, zIndex:201, display:"flex", flexDirection:"column", overflow:"hidden", animation:"slideIn 0.22s ease" }}>
        <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* Header */}
        <div style={{ padding:"20px 24px", borderBottom:`1px solid ${THEME.borderSub}`, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
              <div style={{ width:40, height:40, background:`linear-gradient(135deg,${THEME.gold}33,${THEME.gold}11)`, border:`2px solid ${THEME.gold}44`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:THEME.gold }}>{getInitials(lead.fullName)}</div>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:THEME.textPrimary }}>{lead.fullName}</div>
                <div style={{ fontSize:12, color:THEME.textMuted }}>{lead.id}</div>
              </div>
            </div>
            <StatusBadge status={lead.status} />
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)", border:"none", borderRadius:8, width:32, height:32, cursor:"pointer", color:THEME.textSub, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:24 }}>
          {/* Edit status + agent */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
            {[
              { label:"STATUS", val:status, setter:setStatus, opts:ALL_STATUSES.map(s => ({v:s,l:s})) },
              { label:"ASSIGN TO", val:assignedTo, setter:setAssignedTo, opts:[{v:"",l:"Unassigned"},...agents.filter(a=>a.active).map(a=>({v:a.name,l:a.name}))] },
            ].map(({label,val,setter,opts}) => (
              <div key={label}>
                <div style={{ fontSize:10, fontWeight:700, color:THEME.textMuted, letterSpacing:"0.1em", marginBottom:6 }}>{label}</div>
                <select value={val} onChange={e=>setter(e.target.value)} style={{ width:"100%", padding:"9px 10px", background:THEME.navyMid, border:`1px solid ${THEME.borderSub}`, borderRadius:10, color:THEME.textPrimary, fontSize:13, fontFamily:"inherit" }}>
                  {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button onClick={save} disabled={saving} style={{ width:"100%", padding:"12px", background:`linear-gradient(135deg,${THEME.gold},${THEME.goldDim})`, border:"none", borderRadius:10, color:THEME.navy, fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"inherit", marginBottom:24, opacity:saving?0.7:1 }}>
            {saving ? "Saving…" : "💾 Save Changes"}
          </button>

          {/* Details */}
          <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${THEME.borderSub}`, borderRadius:12, padding:16, marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:THEME.gold, letterSpacing:"0.1em", marginBottom:12 }}>LEAD DETAILS</div>
            {rows.map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid rgba(255,255,255,0.03)`, fontSize:13 }}>
                <span style={{ color:THEME.textMuted, fontWeight:600 }}>{k}</span>
                <span style={{ color:"#CBD5E1", maxWidth:200, textAlign:"right" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Add note */}
          <div style={{ fontSize:10, fontWeight:700, color:THEME.textMuted, letterSpacing:"0.1em", marginBottom:8 }}>ADD NOTE</div>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Follow-up note..." style={{ width:"100%", padding:"11px 13px", background:"rgba(255,255,255,0.04)", border:`1px solid ${THEME.borderSub}`, borderRadius:10, color:THEME.textPrimary, fontSize:13, fontFamily:"inherit", resize:"vertical", minHeight:72, boxSizing:"border-box" }} />
          <button onClick={() => setNote("")} style={{ marginTop:8, padding:"8px 16px", background:`${THEME.gold}18`, border:`1px solid ${THEME.gold}44`, borderRadius:8, color:THEME.gold, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            + Save Note
          </button>
        </div>
      </div>
    </>
  );
}

export default function LeadsTable({ leads, agents, onStatusChange, onAgentChange }) {
  const [selected, setSelected] = useState(null);
  const [sortKey,  setSortKey]  = useState("timestamp");
  const [sortDir,  setSortDir]  = useState("desc");

  const sorted = [...leads].sort((a, b) => {
    const av = a[sortKey] || "", bv = b[sortKey] || "";
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const th = (label, key) => (
    <th key={key} onClick={() => { setSortKey(key); setSortDir(s => s === "asc" ? "desc" : "asc"); }}
      style={{ padding:"11px 14px", textAlign:"left", fontSize:10, fontWeight:700, color:THEME.textMuted, letterSpacing:"0.1em", whiteSpace:"nowrap", cursor:"pointer", userSelect:"none" }}>
      {label} {sortKey===key ? (sortDir==="asc"?"↑":"↓") : ""}
    </th>
  );

  if (!leads.length) return (
    <div style={{ textAlign:"center", padding:"64px 0", color:THEME.textMuted }}>
      <div style={{ fontSize:40, marginBottom:12 }}>◧</div>
      <div style={{ fontSize:16, fontWeight:700 }}>No leads found</div>
      <div style={{ fontSize:13, marginTop:6 }}>Try adjusting your filters</div>
    </div>
  );

  return (
    <>
      <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${THEME.borderSub}`, borderRadius:16, overflow:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:1000 }}>
          <thead>
            <tr style={{ background:"rgba(255,255,255,0.03)", borderBottom:`1px solid ${THEME.borderSub}` }}>
              {th("Lead ID","id")}
              {th("Date","timestamp")}
              {th("Name","fullName")}
              <th style={{ padding:"11px 14px", fontSize:10, fontWeight:700, color:THEME.textMuted, letterSpacing:"0.1em" }}>Mobile</th>
              {th("City","city")}
              {th("Product","loanType")}
              <th style={{ padding:"11px 14px", fontSize:10, fontWeight:700, color:THEME.textMuted, letterSpacing:"0.1em" }}>Amount</th>
              <th style={{ padding:"11px 14px", fontSize:10, fontWeight:700, color:THEME.textMuted, letterSpacing:"0.1em" }}>Status</th>
              <th style={{ padding:"11px 14px", fontSize:10, fontWeight:700, color:THEME.textMuted, letterSpacing:"0.1em" }}>Agent</th>
              <th style={{ padding:"11px 14px", fontSize:10, fontWeight:700, color:THEME.textMuted, letterSpacing:"0.1em" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(lead => (
              <tr key={lead.id}
                style={{ borderBottom:`1px solid rgba(255,255,255,0.03)`, transition:"background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.025)"}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}
              >
                <td style={{ padding:"13px 14px", fontSize:12, color:THEME.gold, fontWeight:700 }}>{lead.id}</td>
                <td style={{ padding:"13px 14px", fontSize:12, color:THEME.textMuted, whiteSpace:"nowrap" }}>{formatDateShort(lead.timestamp)}</td>
                <td style={{ padding:"13px 14px" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:THEME.textPrimary }}>{lead.fullName}</div>
                  {lead.email && <div style={{ fontSize:11, color:THEME.textMuted, marginTop:2 }}>{lead.email}</div>}
                </td>
                <td style={{ padding:"13px 14px", fontSize:12, color:THEME.textSub, whiteSpace:"nowrap" }}>{formatMobile(lead.mobile)}</td>
                <td style={{ padding:"13px 14px", fontSize:13, color:THEME.textSub }}>{lead.city}</td>
                <td style={{ padding:"13px 14px", fontSize:12, color:THEME.textSub, textTransform:"capitalize" }}>{lead.loanType}</td>
                <td style={{ padding:"13px 14px", fontSize:13, fontWeight:600, color:THEME.textPrimary }}>{formatCurrency(lead.loanAmount)}</td>
                <td style={{ padding:"13px 14px" }}>
                  <select
                    value={lead.status}
                    onChange={e => onStatusChange(lead.id, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ padding:"5px 8px", background:STATUS_MAP[lead.status]?.bg||"transparent", border:`1px solid ${STATUS_MAP[lead.status]?.border||"#666"}`, borderRadius:20, color:STATUS_MAP[lead.status]?.color||"#fff", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}
                  >
                    {ALL_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ padding:"13px 14px" }}>
                  <select
                    value={lead.assignedTo||""}
                    onChange={e => onAgentChange(lead.id, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ padding:"5px 8px", background:"rgba(255,255,255,0.04)", border:`1px solid ${THEME.borderSub}`, borderRadius:8, color:THEME.textSub, fontSize:12, cursor:"pointer", fontFamily:"inherit", maxWidth:130 }}
                  >
                    <option value="">Unassigned</option>
                    {agents.filter(a=>a.active).map(a=><option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                </td>
                <td style={{ padding:"13px 14px" }}>
                  <button onClick={() => setSelected(lead)} style={{ padding:"6px 14px", background:`${THEME.gold}14`, border:`1px solid ${THEME.gold}44`, borderRadius:8, color:THEME.gold, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                    View →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <LeadDrawer
          lead={selected}
          agents={agents}
          onClose={() => setSelected(null)}
          onStatusChange={async (id,s) => { await onStatusChange(id,s); setSelected(p=>({...p,status:s})); }}
          onAgentChange={async (id,a) => { await onAgentChange(id,a); setSelected(p=>({...p,assignedTo:a})); }}
        />
      )}
    </>
  );
}
