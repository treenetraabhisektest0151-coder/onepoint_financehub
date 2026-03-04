// src/components/admin/ChartsSection.jsx
// Uses recharts (already in Vite + React projects, or install: npm i recharts)
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { PIE_COLORS, THEME } from "../../utils/constants";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:THEME.navyCard, border:`1px solid ${THEME.border}`, borderRadius:10, padding:"10px 16px" }}>
      <div style={{ fontSize:12, color:THEME.textMuted, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:16, fontWeight:800, color:THEME.gold }}>{payload[0].value} leads</div>
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:THEME.navyCard, border:`1px solid ${THEME.border}`, borderRadius:10, padding:"10px 16px" }}>
      <div style={{ fontSize:13, fontWeight:700, color:THEME.textPrimary }}>{payload[0].name}</div>
      <div style={{ fontSize:15, fontWeight:800, color:payload[0].payload.fill }}>{payload[0].value} leads</div>
    </div>
  );
};

export default function ChartsSection({ chartData }) {
  const { leadsPerDay, pieData } = chartData;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:24, marginBottom:28 }}>

      {/* Line chart */}
      <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${THEME.borderSub}`, borderRadius:16, padding:"24px 24px 16px" }}>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:800, color:THEME.textPrimary }}>Leads Per Day</div>
          <div style={{ fontSize:12, color:THEME.textMuted, marginTop:2 }}>Last 7 days activity</div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={leadsPerDay} margin={{ top:5, right:10, bottom:5, left:-20 }}>
            <XAxis dataKey="date" tick={{ fill:THEME.textMuted, fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:THEME.textMuted, fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone" dataKey="count" stroke={THEME.gold} strokeWidth={2.5}
              dot={{ fill:THEME.gold, r:4, strokeWidth:0 }}
              activeDot={{ r:6, fill:THEME.gold, stroke:THEME.goldLight, strokeWidth:2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart */}
      <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${THEME.borderSub}`, borderRadius:16, padding:"24px 24px 16px" }}>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:800, color:THEME.textPrimary }}>Product Mix</div>
          <div style={{ fontSize:12, color:THEME.textMuted, marginTop:2 }}>Leads by loan type</div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
              {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<PieTooltip />} />
            <Legend
              formatter={(v) => <span style={{ color:THEME.textSub, fontSize:11 }}>{v}</span>}
              iconType="circle" iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
