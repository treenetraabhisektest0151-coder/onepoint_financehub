// src/hooks/useLeads.js
// ─────────────────────────────────────────────────────────────────────────────
// Custom hook that owns ALL lead data: fetching, filtering, mutation.
// Components NEVER call the API directly — they use this hook only.
//
// ARCHITECTURE BENEFIT:
// Swap data source (Sheets → Supabase → REST) by editing this file only.
// All components stay unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchLeads, fetchAgents, updateLeadStatus, assignAgent } from "../api/googleScript";

// Seed data — shown while Google Sheet loads (or if CORS blocks GET)
// Replace with real API call once Apps Script doGet is deployed
const SEED = [
  { id:"LEAD-1001", timestamp:"04-Mar-2026 09:15 AM IST", fullName:"Rahul Sharma",   mobile:"9876543210", email:"rahul@email.com",  city:"Bhubaneswar", loanType:"personal",    companyBusiness:"Infosys",          monthlyIncome:"65000",  loanAmount:"500000",  status:"New",          assignedTo:"",          notes:"Urgent requirement"          },
  { id:"LEAD-1002", timestamp:"04-Mar-2026 10:30 AM IST", fullName:"Priya Mohanty",  mobile:"9876543211", email:"priya@email.com",  city:"Cuttack",     loanType:"home",        companyBusiness:"Govt. Employee",   monthlyIncome:"80000",  loanAmount:"3500000", status:"Contacted",    assignedTo:"Amit Kumar",  notes:"Site visit scheduled"        },
  { id:"LEAD-1003", timestamp:"04-Mar-2026 11:00 AM IST", fullName:"Suresh Panda",   mobile:"9876543212", email:"suresh@email.com", city:"Rourkela",    loanType:"business",    companyBusiness:"Panda Traders",    monthlyIncome:"120000", loanAmount:"2000000", status:"Doc Pending",  assignedTo:"Neha Singh",  notes:"Yearly Turnover: ₹25L"       },
  { id:"LEAD-1004", timestamp:"04-Mar-2026 12:45 PM IST", fullName:"Anita Das",      mobile:"9876543213", email:"anita@email.com",  city:"Bhubaneswar", loanType:"personal",    companyBusiness:"TCS",              monthlyIncome:"55000",  loanAmount:"300000",  status:"Approved",     assignedTo:"Amit Kumar",  notes:""                            },
  { id:"LEAD-1005", timestamp:"04-Mar-2026 02:00 PM IST", fullName:"Deepak Nayak",   mobile:"9876543214", email:"deepak@email.com", city:"Sambalpur",   loanType:"home",        companyBusiness:"Self-Employed",    monthlyIncome:"95000",  loanAmount:"4500000", status:"Under Review", assignedTo:"Neha Singh",  notes:"Property verified"           },
  { id:"LEAD-1006", timestamp:"04-Mar-2026 03:30 PM IST", fullName:"Kavita Mishra",  mobile:"9876543215", email:"",                 city:"Puri",        loanType:"Insurance",   companyBusiness:"",                 monthlyIncome:"",       loanAmount:"",        status:"New",          assignedTo:"",          notes:"Health Insurance, Age: 35"   },
  { id:"LEAD-1007", timestamp:"03-Mar-2026 04:00 PM IST", fullName:"Rajesh Jena",    mobile:"9876543216", email:"rajesh@email.com", city:"Berhampur",   loanType:"business",    companyBusiness:"Jena Enterprises", monthlyIncome:"200000", loanAmount:"5000000", status:"Rejected",     assignedTo:"Amit Kumar",  notes:"Low CIBIL score"             },
  { id:"LEAD-1008", timestamp:"03-Mar-2026 05:15 PM IST", fullName:"Smita Sahoo",    mobile:"9876543217", email:"smita@email.com",  city:"Bhubaneswar", loanType:"Taxation",    companyBusiness:"",                 monthlyIncome:"",       loanAmount:"1000",    status:"Disbursed",    assignedTo:"Neha Singh",  notes:"ITR Filing completed"        },
  { id:"LEAD-1009", timestamp:"03-Mar-2026 06:00 PM IST", fullName:"Amit Pradhan",   mobile:"9876543218", email:"amit@email.com",   city:"Bhubaneswar", loanType:"personal",    companyBusiness:"Wipro",            monthlyIncome:"72000",  loanAmount:"800000",  status:"On Hold",      assignedTo:"Amit Kumar",  notes:"Waiting for salary slip"     },
  { id:"LEAD-1010", timestamp:"02-Mar-2026 09:00 AM IST", fullName:"Sunita Rath",    mobile:"9876543219", email:"sunita@email.com", city:"Cuttack",     loanType:"Mutual Fund", companyBusiness:"",                 monthlyIncome:"60000",  loanAmount:"5000",    status:"Contacted",    assignedTo:"Neha Singh",  notes:"SIP ₹5000/month interested"  },
];

const SEED_AGENTS = [
  { id:"AGT-001", name:"Amit Kumar", mobile:"9111111111", email:"amit@opfh.com",   role:"Senior Agent", active:true  },
  { id:"AGT-002", name:"Neha Singh", mobile:"9222222222", email:"neha@opfh.com",   role:"Agent",        active:true  },
  { id:"AGT-003", name:"Vikram Rao", mobile:"9333333333", email:"vikram@opfh.com", role:"Agent",        active:false },
];

export default function useLeads() {
  const [leads,      setLeads]      = useState([]);
  const [agents,     setAgents]     = useState(SEED_AGENTS);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [usingCache, setUsingCache] = useState(false);

  // Filter state
  const [search,  setSearch]  = useState("");
  const [statusF, setStatusF] = useState("All");
  const [typeF,   setTypeF]   = useState("All");
  const [dateF,   setDateF]   = useState("");

  // ── Load from Google Sheet ───────────────────────────────────────────────
  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingCache(false);
    try {
      // Load leads and agents in parallel
      const [leadsData, agentsData] = await Promise.allSettled([
        fetchLeads(),
        fetchAgents(),
      ]);

      // Handle leads
      if (leadsData.status === "fulfilled" && leadsData.value?.leads?.length) {
        setLeads(leadsData.value.leads);
      } else {
        setLeads(SEED);
        setUsingCache(true);
        setError("Live data unavailable — showing demo data. Check your Google Apps Script URL in Settings.");
      }

      // Handle agents
      if (agentsData.status === "fulfilled" && agentsData.value?.agents?.length) {
        setAgents(agentsData.value.agents);
      }
    } catch (err) {
      setLeads(SEED);
      setUsingCache(true);
      setError("Connection failed — showing demo data. Check your Google Apps Script URL in Settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLeads(); }, []); // eslint-disable-line

  // ── Optimistic status update ─────────────────────────────────────────────
  const changeStatus = useCallback(async (leadId, newStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    try { await updateLeadStatus(leadId, newStatus); }
    catch { loadLeads(); } // rollback on failure
  }, [loadLeads]);

  // ── Optimistic agent assignment ──────────────────────────────────────────
  const changeAgent = useCallback(async (leadId, agentName) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, assignedTo: agentName } : l));
    try { await assignAgent(leadId, agentName); }
    catch { loadLeads(); }
  }, [loadLeads]);

  const addLocalAgent = useCallback((agent) => {
    setAgents(prev => [...prev, agent]);
  }, []);

  // ── Client-side filtering (instant, no API calls) ────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l => {
      const matchSearch  = !search || [l.fullName,l.mobile,l.city,l.id].join(" ").toLowerCase().includes(q);
      const matchStatus  = statusF === "All" || l.status   === statusF;
      const matchType    = typeF   === "All" || l.loanType === typeF;
      const matchDate    = !dateF  || (l.timestamp||"").includes(dateF);
      return matchSearch && matchStatus && matchType && matchDate;
    });
  }, [leads, search, statusF, typeF, dateF]);

  // ── KPI computation ──────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total     = leads.length;
    const newL      = leads.filter(l => l.status === "New").length;
    const inProcess = leads.filter(l => ["Contacted","Doc Pending","Under Review"].includes(l.status)).length;
    const approved  = leads.filter(l => l.status === "Approved").length;
    const disbursed = leads.filter(l => l.status === "Disbursed").length;
    const rejected  = leads.filter(l => l.status === "Rejected").length;
    const rate      = total ? (((approved + disbursed) / total) * 100).toFixed(1) : "0";
    return { total, newL, inProcess, approved, disbursed, rejected, rate };
  }, [leads]);

  // ── Chart data ───────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    // Leads per day — last 7 days
    const days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-IN", { day:"2-digit", month:"short" });
      days[key] = 0;
    }
    leads.forEach(l => {
      const ts = l.timestamp || "";
      const match = ts.match(/^(\d{2}-[A-Za-z]+-\d{4})/);
      if (match) {
        const [dd, mm, yyyy] = match[1].split("-");
        const key = `${dd} ${mm}`;
        if (days[key] !== undefined) days[key]++;
      }
    });
    const leadsPerDay = Object.entries(days).map(([date, count]) => ({ date, count }));

    // Loan type pie
    const typeCount = {};
    leads.forEach(l => { const t = l.loanType||"Other"; typeCount[t]=(typeCount[t]||0)+1; });
    const pieData = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

    return { leadsPerDay, pieData };
  }, [leads]);

  return {
    leads, filtered, agents, kpis, chartData,
    loading, error, usingCache,
    search, setSearch,
    statusF, setStatusF,
    typeF,   setTypeF,
    dateF,   setDateF,
    changeStatus, changeAgent, addLocalAgent, loadLeads,
  };
}
