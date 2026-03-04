// src/components/admin/StatusBadge.jsx
import { STATUS_MAP } from "../../utils/constants";

export default function StatusBadge({ status, size = "md" }) {
  const cfg = STATUS_MAP[status] || { color:"#94A3B8", bg:"rgba(148,163,184,0.12)", border:"rgba(148,163,184,0.3)", icon:"○" };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding: size === "sm" ? "3px 8px" : "5px 12px",
      borderRadius:20,
      background:cfg.bg, border:`1px solid ${cfg.border}`,
      color:cfg.color, fontSize: size === "sm" ? 11 : 12,
      fontWeight:700, whiteSpace:"nowrap", letterSpacing:"0.02em", fontFamily:"inherit",
    }}>
      <span style={{ fontSize: size === "sm" ? 7 : 8 }}>{cfg.icon}</span>
      {status}
    </span>
  );
}
