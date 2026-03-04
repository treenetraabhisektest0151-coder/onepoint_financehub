// src/pages/AdminDashboard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Main CRM dashboard. Owns page-level state (active page, auth).
// Renders AdminLayout shell + page-specific content.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import AdminLayout   from "../components/admin/AdminLayout";
import KPISection    from "../components/admin/KPISection";
import FiltersBar    from "../components/admin/FiltersBar";
import LeadsTable    from "../components/admin/LeadsTable";
import ChartsSection from "../components/admin/ChartsSection";
import StatusBadge   from "../components/admin/StatusBadge";
import useLeads      from "../hooks/useLeads";
import { addAgent }  from "../api/googleScript";
import { THEME, STATUS_MAP, LOAN_TYPES } from "../utils/constants";
import { formatCurrency, formatMobile, getInitials } from "../utils/formatters";

// ── Page: Dashboard Overview ─────────────────────────────────────────────────
function DashboardPage({ kpis, chartData, leads, agents, onStatusChange, onAgentChange }) {
  const recent = [...leads].slice(0, 5);
  return (
    <>
      <KPISection kpis={kpis} />
      <ChartsSection chartData={chartData} />

      {/* Recent leads preview */}
      <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${THEME.borderSub}`, borderRadius:16, padding:24 }}>
        <div style={{ fontSize:15, fontWeight:800, color:THEME.textPrimary, marginBottom:18 }}>Recent Leads</div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${THEME.borderSub}` }}>
              {["Lead ID","Name","Product","Amount","Status","Agent"].map(h=>(
                <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:10, fontWeight:700, color:THEME.textMuted, letterSpacing:"0.1em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map(l=>(
              <tr key={l.id} style={{ borderBottom:`1px solid rgba(255,255,255,0.03)` }}>
                <td style={{ padding:"11px 12px", fontSize:12, color:THEME.gold, fontWeight:700 }}>{l.id}</td>
                <td style={{ padding:"11px 12px", fontSize:13, color:THEME.textPrimary, fontWeight:600 }}>{l.fullName}</td>
                <td style={{ padding:"11px 12px", fontSize:12, color:THEME.textSub, textTransform:"capitalize" }}>{l.loanType}</td>
                <td style={{ padding:"11px 12px", fontSize:13, color:THEME.textPrimary }}>{formatCurrency(l.loanAmount)}</td>
                <td style={{ padding:"11px 12px" }}><StatusBadge status={l.status} size="sm" /></td>
                <td style={{ padding:"11px 12px", fontSize:12, color:THEME.textMuted }}>{l.assignedTo||"—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Page: Leads (full table + filters) ───────────────────────────────────────
function LeadsPage({ hook }) {
  return (
    <>
      <FiltersBar
        search={hook.search}     setSearch={hook.setSearch}
        statusF={hook.statusF}   setStatusF={hook.setStatusF}
        typeF={hook.typeF}       setTypeF={hook.setTypeF}
        dateF={hook.dateF}       setDateF={hook.setDateF}
        total={hook.leads.length} filtered={hook.filtered.length}
      />
      <LeadsTable
        leads={hook.filtered}
        agents={hook.agents}
        onStatusChange={hook.changeStatus}
        onAgentChange={hook.changeAgent}
      />
    </>
  );
}

// ── Page: Agents ──────────────────────────────────────────────────────────────
function AgentsPage({ agents, leads, addLocalAgent }) {
  const [form,   setForm]   = useState({ name:"", mobile:"", email:"", role:"Agent" });
  const [saving, setSaving] = useState(false);
  const [open,   setOpen]   = useState(false);

  const submit = async () => {
    if (!form.name || !form.mobile) return;
    setSaving(true);
    const agent = { id:`AGT-${String(agents.length+1).padStart(3,"0")}`, ...form, active:true };
    await addAgent(agent);
    addLocalAgent(agent);
    setForm({ name:"", mobile:"", email:"", role:"Agent" });
    setOpen(false);
    setSaving(false);
  };

  const inp = { padding:"10px 12px", background:"rgba(255,255,255,0.06)", border:`1px solid ${THEME.borderSub}`, borderRadius:10, color:THEME.textPrimary, fontSize:13, fontFamily:"inherit", width:"100%", boxSizing:"border-box" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div style={{ fontSize:14, color:THEME.textMuted }}>{agents.length} agents · {agents.filter(a=>a.active).length} active</div>
        <button onClick={()=>setOpen(!open)} style={{ padding:"10px 22px", background:`linear-gradient(135deg,${THEME.gold},${THEME.goldDim})`, border:"none", borderRadius:10, color:THEME.navy, fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>+ Add Agent</button>
      </div>

      {open && (
        <div style={{ background:`${THEME.gold}08`, border:`1px solid ${THEME.gold}33`, borderRadius:16, padding:24, marginBottom:24 }}>
          <div style={{ fontSize:14, fontWeight:800, color:THEME.textPrimary, marginBottom:16 }}>New Agent</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr auto", gap:12, alignItems:"flex-end" }}>
            {[["Full Name *","name"],["Mobile *","mobile"],["Email","email"],["Role","role"]].map(([lbl,key])=>(
              <div key={key}>
                <div style={{ fontSize:10, color:THEME.textMuted, fontWeight:700, marginBottom:6, letterSpacing:"0.08em" }}>{lbl.toUpperCase()}</div>
                <input value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} style={inp} placeholder={lbl.replace(" *","")} />
              </div>
            ))}
            <button onClick={submit} disabled={saving} style={{ padding:"10px 20px", background:`linear-gradient(135deg,${THEME.gold},${THEME.goldDim})`, border:"none", borderRadius:10, color:THEME.navy, fontWeight:800, cursor:"pointer", fontFamily:"inherit", opacity:saving?0.7:1 }}>
              {saving?"Saving…":"Save"}
            </button>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
        {agents.map(agent => {
          const agentLeads = leads.filter(l=>l.assignedTo===agent.name);
          const won        = agentLeads.filter(l=>["Approved","Disbursed"].includes(l.status)).length;
          return (
            <div key={agent.id} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${agent.active ? THEME.borderSub : "rgba(255,255,255,0.03)"}`, borderRadius:16, padding:24, opacity:agent.active?1:0.55 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
                <div style={{ width:48, height:48, background:`linear-gradient(135deg,${THEME.gold}33,${THEME.gold}11)`, border:`2px solid ${THEME.gold}44`, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, fontWeight:800, color:THEME.gold }}>{getInitials(agent.name)}</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:THEME.textPrimary }}>{agent.name}</div>
                  <div style={{ fontSize:12, color:THEME.gold, fontWeight:600 }}>{agent.role}</div>
                </div>
                <div style={{ marginLeft:"auto" }}>
                  <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:agent.active?"rgba(34,197,94,0.12)":"rgba(107,114,128,0.12)", color:agent.active?"#22C55E":"#6B7280", border:`1px solid ${agent.active?"rgba(34,197,94,0.3)":"rgba(107,114,128,0.3)"}` }}>
                    {agent.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                {[["Leads",agentLeads.length,"#3B82F6"],["Won",won,"#22C55E"],["Rate",agentLeads.length?Math.round(won/agentLeads.length*100)+"%":"0%",THEME.gold]].map(([lbl,val,col])=>(
                  <div key={lbl} style={{ background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"10px 12px", textAlign:"center" }}>
                    <div style={{ fontSize:18, fontWeight:900, color:col }}>{val}</div>
                    <div style={{ fontSize:10, color:THEME.textMuted, marginTop:3, fontWeight:600 }}>{lbl}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:14, fontSize:12, color:THEME.textMuted }}>{formatMobile(agent.mobile)}</div>
              <div style={{ fontSize:12, color:THEME.textMuted }}>{agent.email}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page: Analytics ───────────────────────────────────────────────────────────
function AnalyticsPage({ leads, kpis }) {
  const byType = LOAN_TYPES.map(t => ({
    ...t,
    count: leads.filter(l => l.loanType === t.value).length,
  })).filter(t => t.count > 0);
  const maxCount = Math.max(...byType.map(t=>t.count), 1);

  const statusBreakdown = Object.entries(STATUS_MAP).map(([status, cfg]) => ({
    status, cfg, count: leads.filter(l=>l.status===status).length,
  })).filter(x=>x.count>0).sort((a,b)=>b.count-a.count);

  return (
    <div>
      <KPISection kpis={kpis} />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>

        {/* Product breakdown */}
        <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${THEME.borderSub}`, borderRadius:16, padding:24 }}>
          <div style={{ fontSize:15, fontWeight:800, color:THEME.textPrimary, marginBottom:20 }}>Leads by Product</div>
          {byType.map(t => (
            <div key={t.value} style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:13 }}>
                <span style={{ color:THEME.textSub }}>{t.icon} {t.label}</span>
                <span style={{ color:THEME.gold, fontWeight:700 }}>{t.count}</span>
              </div>
              <div style={{ height:6, background:"rgba(255,255,255,0.05)", borderRadius:3 }}>
                <div style={{ height:"100%", width:`${(t.count/maxCount)*100}%`, background:`linear-gradient(90deg,${THEME.gold},${THEME.goldLight})`, borderRadius:3, transition:"width 0.8s ease" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Status breakdown */}
        <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${THEME.borderSub}`, borderRadius:16, padding:24 }}>
          <div style={{ fontSize:15, fontWeight:800, color:THEME.textPrimary, marginBottom:20 }}>Status Breakdown</div>
          {statusBreakdown.map(({status,cfg,count})=>(
            <div key={status} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
              <StatusBadge status={status} size="sm" />
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:80, height:4, background:"rgba(255,255,255,0.06)", borderRadius:2 }}>
                  <div style={{ height:"100%", width:`${(count/leads.length)*100}%`, background:cfg.color, borderRadius:2 }} />
                </div>
                <span style={{ fontSize:15, fontWeight:900, color:cfg.color, minWidth:24, textAlign:"right" }}>{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page: Settings ─────────────────────────────────────────────────────────────
function SettingsPage() {
  const [url, setUrl] = useState("https://script.google.com/macros/s/AKfycby.../exec");
  const [pwd, setPwd] = useState("");
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(()=>setSaved(false), 2000); };
  const inp  = { width:"100%", padding:"13px 16px", background:"rgba(255,255,255,0.05)", border:`1px solid ${THEME.borderSub}`, borderRadius:12, color:THEME.textPrimary, fontSize:13, fontFamily:"inherit", boxSizing:"border-box" };

  return (
    <div style={{ maxWidth:640 }}>
      {[
        { title:"Google Apps Script URL", desc:"Your deployed web app endpoint. Update after redeploying.", val:url, setter:setUrl },
        { title:"Admin Password", desc:"Change the admin login password. Use .env in production.", val:pwd, setter:setPwd, placeholder:"New password…", type:"password" },
      ].map(s => (
        <div key={s.title} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${THEME.borderSub}`, borderRadius:16, padding:24, marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:800, color:THEME.textPrimary, marginBottom:4 }}>{s.title}</div>
          <div style={{ fontSize:13, color:THEME.textMuted, marginBottom:14 }}>{s.desc}</div>
          <input type={s.type||"text"} value={s.val} onChange={e=>s.setter(e.target.value)} placeholder={s.placeholder} style={inp} />
        </div>
      ))}

      <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${THEME.borderSub}`, borderRadius:16, padding:24, marginBottom:20 }}>
        <div style={{ fontSize:15, fontWeight:800, color:THEME.textPrimary, marginBottom:16 }}>Architecture Notes</div>
        {[
          ["Current DB",     "Google Sheets via Apps Script"],
          ["Auth",           "localStorage session (hardcoded)"],
          ["Migration path", "Swap api/googleScript.js for REST/Supabase"],
          ["Real-time",      "Add WebSocket in useLeads.js loadLeads()"],
          ["Multi-lender",   "Use lendersAPI stubs in googleScript.js"],
        ].map(([k,v])=>(
          <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid rgba(255,255,255,0.04)`, fontSize:13 }}>
            <span style={{ color:THEME.textMuted, fontWeight:600 }}>{k}</span>
            <span style={{ color:THEME.textSub }}>{v}</span>
          </div>
        ))}
      </div>

      <button onClick={save} style={{ padding:"13px 32px", background:`linear-gradient(135deg,${THEME.gold},${THEME.goldDim})`, border:"none", borderRadius:12, color:THEME.navy, fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>
        {saved ? "✓ Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

// ── Root Dashboard Component ──────────────────────────────────────────────────
export default function AdminDashboard({ onLogout }) {
  const [page, setPage] = useState("dashboard");
  const hook = useLeads();

  const pages = {
    dashboard: <DashboardPage kpis={hook.kpis} chartData={hook.chartData} leads={hook.leads} agents={hook.agents} onStatusChange={hook.changeStatus} onAgentChange={hook.changeAgent} />,
    leads:     <LeadsPage hook={hook} />,
    agents:    <AgentsPage agents={hook.agents} leads={hook.leads} addLocalAgent={hook.addLocalAgent} />,
    analytics: <AnalyticsPage leads={hook.leads} kpis={hook.kpis} />,
    settings:  <SettingsPage />,
  };

  return (
    <AdminLayout
      page={page} setPage={setPage}
      loading={hook.loading}
      onRefresh={hook.loadLeads}
      onLogout={onLogout}
    >
      {hook.error && (
        <div style={{ padding:"10px 16px", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:10, color:"#F59E0B", fontSize:13, marginBottom:20 }}>
          ⚠ {hook.error}
        </div>
      )}
      {pages[page] || pages.dashboard}
    </AdminLayout>
  );
}
