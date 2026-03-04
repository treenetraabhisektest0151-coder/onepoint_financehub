// src/components/admin/FiltersBar.jsx
import { ALL_STATUSES, LOAN_TYPES, THEME } from "../../utils/constants";

const inp = {
  padding:"9px 14px", background:"rgba(255,255,255,0.05)",
  border:`1px solid ${THEME.borderSub}`, borderRadius:10,
  color:THEME.textPrimary, fontSize:13, fontFamily:"inherit",
  outline:"none", transition:"border 0.18s",
};

export default function FiltersBar({ search, setSearch, statusF, setStatusF, typeF, setTypeF, dateF, setDateF, total, filtered }) {
  const focus = e => e.target.style.borderColor = THEME.border;
  const blur  = e => e.target.style.borderColor = THEME.borderSub;

  return (
    <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", marginBottom:20 }}>

      {/* Search */}
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍  Search name, mobile, city, ID..."
        onFocus={focus} onBlur={blur}
        style={{ ...inp, minWidth:260 }}
      />

      {/* Status */}
      <select value={statusF} onChange={e => setStatusF(e.target.value)} onFocus={focus} onBlur={blur} style={inp}>
        <option value="All">All Statuses</option>
        {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* Loan type */}
      <select value={typeF} onChange={e => setTypeF(e.target.value)} onFocus={focus} onBlur={blur} style={inp}>
        <option value="All">All Products</option>
        {LOAN_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
      </select>

      {/* Date */}
      <input
        type="text" placeholder="Filter by date (e.g. Mar)"
        value={dateF} onChange={e => setDateF(e.target.value)}
        onFocus={focus} onBlur={blur}
        style={{ ...inp, width:160 }}
      />

      {/* Clear */}
      {(search || statusF !== "All" || typeF !== "All" || dateF) && (
        <button onClick={() => { setSearch(""); setStatusF("All"); setTypeF("All"); setDateF(""); }}
          style={{ padding:"9px 14px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, color:"#EF4444", cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>
          ✕ Clear
        </button>
      )}

      <div style={{ marginLeft:"auto", fontSize:13, color:THEME.textMuted, fontWeight:600 }}>
        {filtered} / {total} leads
      </div>
    </div>
  );
}
