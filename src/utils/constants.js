// src/utils/constants.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for ALL config, theme tokens, and status definitions.
// Change a color here → updates everywhere automatically.
// ─────────────────────────────────────────────────────────────────────────────

export const THEME = {
  gold:        "#C9A84C",
  goldLight:   "#F5D27A",
  goldDim:     "#B8862A",
  navy:        "#060C1A",
  navyMid:     "#0A0F1E",
  navyCard:    "#0D1530",
  border:      "rgba(201,168,76,0.15)",
  borderSub:   "rgba(255,255,255,0.07)",
  textPrimary: "#F0F4FF",
  textSub:     "#94A3B8",
  textMuted:   "#475569",
};

// Complete lead status pipeline.
// order = funnel position (reserved for future Kanban board view)
export const STATUS_MAP = {
  "New":          { color: "#3B82F6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)",  icon: "◉", order: 1 },
  "Contacted":    { color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  icon: "◎", order: 2 },
  "Doc Pending":  { color: "#F97316", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.3)",  icon: "◈", order: 3 },
  "Under Review": { color: "#A855F7", bg: "rgba(168,85,247,0.12)",  border: "rgba(168,85,247,0.3)",  icon: "◐", order: 4 },
  "Approved":     { color: "#22C55E", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.3)",   icon: "◉", order: 5 },
  "Disbursed":    { color: "#C9A84C", bg: "rgba(201,168,76,0.12)",  border: "rgba(201,168,76,0.3)",  icon: "★", order: 6 },
  "Rejected":     { color: "#EF4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   icon: "✕", order: 7 },
  "On Hold":      { color: "#6B7280", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.3)", icon: "⊘", order: 8 },
};

export const ALL_STATUSES = Object.keys(STATUS_MAP);
export const PIE_COLORS   = ["#C9A84C","#3B82F6","#22C55E","#A855F7","#F97316","#F59E0B"];

export const LOAN_TYPES = [
  { value: "personal",    label: "Personal Loan", icon: "👤" },
  { value: "business",    label: "Business Loan", icon: "🏢" },
  { value: "home",        label: "Home Loan",     icon: "🏠" },
  { value: "Insurance",   label: "Insurance",     icon: "🛡️" },
  { value: "Taxation",    label: "Taxation",      icon: "📋" },
  { value: "Mutual Fund", label: "Mutual Fund",   icon: "📈" },
];

// Sidebar nav — add new sections here only, no other file changes needed
export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard",  icon: "⊞" },
  { id: "leads",     label: "Leads",      icon: "◧" },
  { id: "agents",    label: "Agents",     icon: "◫" },
  { id: "analytics", label: "Analytics",  icon: "◰" },
  { id: "settings",  label: "Settings",   icon: "◳" },
];

// Auth — swap with Firebase/Supabase Auth in production
export const ADMIN_PASSWORD = "onepointadmin2026";
export const SESSION_KEY    = "opfh_admin_v1";
