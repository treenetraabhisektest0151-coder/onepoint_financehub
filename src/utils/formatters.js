// src/utils/formatters.js
// ─────────────────────────────────────────────────────────────────────────────
// Pure utility functions for display formatting.
// No side effects — safe to call anywhere.
// ─────────────────────────────────────────────────────────────────────────────

/** 500000 → ₹5,00,000 */
export const formatCurrency = (v) => {
  if (!v || isNaN(v)) return "—";
  return "₹" + Number(v).toLocaleString("en-IN");
};

/** 9876543210 → +91 98765 43210 */
export const formatMobile = (v) => {
  if (!v) return "—";
  const n = String(v).replace(/\D/g, "");
  return n.length === 10 ? `+91 ${n.slice(0,5)} ${n.slice(5)}` : v;
};

/** "Rahul Sharma" → "RS" */
export const getInitials = (name) =>
  name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";

/** ISO string → "04-Mar-2026 09:15 AM IST" */
export const formatIST = (iso) => {
  if (!iso) return "—";
  if (String(iso).includes("IST")) return iso; // already formatted
  try {
    const d   = new Date(new Date(iso).getTime() + 5.5 * 60 * 60 * 1000);
    const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    let   h   = d.getUTCHours();
    const ap  = h >= 12 ? "PM" : "AM";
    h = String(h % 12 || 12).padStart(2,"0");
    return `${String(d.getUTCDate()).padStart(2,"0")}-${mon[d.getUTCMonth()]}-${d.getUTCFullYear()} ${h}:${String(d.getUTCMinutes()).padStart(2,"0")} ${ap} IST`;
  } catch { return iso; }
};

/** "04-Mar-2026 09:15 AM IST" → "04-Mar-2026" */
export const formatDateShort = (ts) =>
  ts ? String(ts).split(" ")[0] : "—";

/** (approved, total) → "23.5%" */
export const conversionRate = (approved, total) =>
  total ? ((approved / total) * 100).toFixed(1) + "%" : "0%";
