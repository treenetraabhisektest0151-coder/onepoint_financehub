import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchLeads, fetchAgents, updateLeadStatus, assignAgent } from "../api/googleScript";

const SEED_AGENTS = [];
 

export default function useLeads() {
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState(SEED_AGENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingCache, setUsingCache] = useState(false);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("All");
  const [typeF, setTypeF] = useState("All");
  const [dateF, setDateF] = useState("");

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingCache(false);
    try {
      const [leadsData, agentsData] = await Promise.allSettled([
        fetchLeads(),
        fetchAgents(),
      ]);

      if (leadsData.status === "fulfilled" && leadsData.value?.leads?.length) {
        const mapped = leadsData.value.leads.map(r => ({
          id:              r["Lead ID"]                 || "",
          timestamp:       r["Timestamp"]               || "",
          fullName:        r["Full Name"]               || "",
          mobile:          String(r["Mobile"]           || ""),
          email:           r["Email"]                   || "",
          city:            r["City"]                    || "",
          loanType:        r["Loan Type"]               || "",
          companyBusiness: r["Company / Business Name"] || "",
          monthlyIncome:   String(r["Monthly Income"]   || ""),
          loanAmount:      String(r["Loan Amount"]      || ""),
          status:          r["Status"]                  || "New",
          assignedTo:      r["Assigned To"]             || "",
          notes:           r["Notes"]                   || "",
        }));
        setLeads(mapped);
      } else {
        setLeads([]);
        setUsingCache(true);
        setError("Live data unavailable. Check your Google Apps Script URL in Settings.");
      }

      if (agentsData.status === "fulfilled" && agentsData.value?.agents?.length) {
        setAgents(agentsData.value.agents);
      }
    } catch (err) {
      setLeads([]);
      setUsingCache(true);
      setError("Connection failed. Check your Google Apps Script URL in Settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLeads(); }, []); // eslint-disable-line

  const changeStatus = useCallback(async (leadId, newStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    try { await updateLeadStatus(leadId, newStatus); }
    catch { loadLeads(); }
  }, [loadLeads]);

  const changeAgent = useCallback(async (leadId, agentName) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, assignedTo: agentName } : l));
    try { await assignAgent(leadId, agentName); }
    catch { loadLeads(); }
  }, [loadLeads]);

  const addLocalAgent = useCallback((agent) => {
    setAgents(prev => [...prev, agent]);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l => {
      const matchSearch = !search || [l.fullName, l.mobile, l.city, l.id].join(" ").toLowerCase().includes(q);
      const matchStatus = statusF === "All" || l.status === statusF;
      const matchType   = typeF === "All" || l.loanType === typeF;
      const matchDate   = !dateF || (l.timestamp || "").includes(dateF);
      return matchSearch && matchStatus && matchType && matchDate;
    });
  }, [leads, search, statusF, typeF, dateF]);

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

  const chartData = useMemo(() => {
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
        const [dd, mm] = match[1].split("-");
        const key = `${dd} ${mm}`;
        if (days[key] !== undefined) days[key]++;
      }
    });
    const leadsPerDay = Object.entries(days).map(([date, count]) => ({ date, count }));
    const typeCount = {};
    leads.forEach(l => { const t = l.loanType || "Other"; typeCount[t] = (typeCount[t] || 0) + 1; });
    const pieData = Object.entries(typeCount).map(([name, value]) => ({ name, value }));
    return { leadsPerDay, pieData };
  }, [leads]);

  return {
    leads, filtered, agents, kpis, chartData,
    loading, error, usingCache,
    search, setSearch,
    statusF, setStatusF,
    typeF, setTypeF,
    dateF, setDateF,
    changeStatus, changeAgent, addLocalAgent, loadLeads,
  };
}