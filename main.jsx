// src/main.jsx
// ─────────────────────────────────────────────────────────────────────────────
// App entry point with route-based mounting.
//
// /admin → AdminApp (CRM, protected)
// /*     → Your existing public website App.jsx (UNCHANGED)
//
// Install react-router-dom if not already:  npm i react-router-dom
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import ReactDOM from "react-dom/client";

// Route-based mounting — detect path without installing a router
// If you already have react-router-dom in your project, use the alternative below.
const isAdmin = window.location.pathname.startsWith("/admin");

async function mount() {
  const root = ReactDOM.createRoot(document.getElementById("root"));

  if (isAdmin) {
    // Lazy-load admin bundle so it never affects public site performance
    const { default: AdminApp } = await import("./AdminApp");
    root.render(<React.StrictMode><AdminApp /></React.StrictMode>);
  } else {
    const { default: App } = await import("./App");
    root.render(<React.StrictMode><App /></React.StrictMode>);
  }
}

mount();

// ─────────────────────────────────────────────────────────────────────────────
// ALTERNATIVE: If you already use react-router-dom in your project,
// replace the above with this instead:
//
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import App      from "./App";
// import AdminApp from "./AdminApp";
//
// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <BrowserRouter>
//       <Routes>
//         <Route path="/admin/*" element={<AdminApp />} />
//         <Route path="/*"       element={<App />} />
//       </Routes>
//     </BrowserRouter>
//   </React.StrictMode>
// );
// ─────────────────────────────────────────────────────────────────────────────
