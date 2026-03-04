// src/components/admin/AdminLayout.jsx
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar  from "./Topbar";
import { THEME } from "../../utils/constants";

export default function AdminLayout({ children, page, setPage, loading, onRefresh, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:THEME.navyMid, fontFamily:"'Sora', 'DM Sans', sans-serif", color:THEME.textPrimary }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.2); border-radius:3px; }
        select option { background: #0D1530; color: #F0F4FF; }
      `}</style>

      <Sidebar active={page} setActive={setPage} collapsed={collapsed} setCollapsed={setCollapsed} />

      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
        <Topbar page={page} loading={loading} onRefresh={onRefresh} onLogout={onLogout} />
        <main style={{ flex:1, padding:"28px 32px", overflowY:"auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
