// src/api/googleScript.js
// ─────────────────────────────────────────────────────────────────────────────
// Centralized API layer for ALL Google Apps Script communication.
//
// ARCHITECTURE DECISION:
// Components never call fetch() directly. They import from this file only.
// When you migrate to a real REST API / Supabase / Firebase, you replace
// only this file. Every component stays unchanged.
//
// CORS NOTE:
// Google Apps Script blocks application/json preflight requests.
// Fix: use mode:"no-cors" + Content-Type:"text/plain". Body is still JSON.
// Apps Script reads it via: JSON.parse(e.postData.contents)
// ─────────────────────────────────────────────────────────────────────────────

// Priority: 1) Runtime override (Settings page) → 2) .env → 3) hardcoded fallback
const ENV_URL   = (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_SCRIPT_URL) || "";
const FALLBACK  = "https://script.google.com/macros/s/AKfycbwenEBqhaESqQF926jsCIhZV9g1bmVqpTxw1OK9lEgA9XAA1jAJWBp5GPYQm5Cj1HBq/exec";

function getScriptUrl() {
  return localStorage.getItem("opfh_script_url") || ENV_URL || FALLBACK;
}

const ADMIN_TOKEN =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_ADMIN_TOKEN) || "onepointcrm2026secret";

// Called by Settings page when user updates the URL
export function saveScriptUrl(url) {
  localStorage.setItem("opfh_script_url", url.trim());
}

export function getSavedScriptUrl() {
  return getScriptUrl();
}

// ── Internal base functions ──────────────────────────────────────────────────

async function gasPost(payload) {
  try {
    await fetch(getScriptUrl(), {
      method:  "POST",
      mode:    "no-cors",          // required for Google Apps Script
      headers: { "Content-Type": "text/plain" }, // avoids CORS preflight
      body:    JSON.stringify(payload),
    });
    return { ok: true };
  } catch (err) {
    console.error("[API] POST failed:", err);
    throw new Error("Submission failed. Check network.");
  }
}

async function gasGet(params = {}) {
  try {
    const url = new URL(getScriptUrl());
    url.searchParams.set("token", ADMIN_TOKEN);
    Object.entries(params).forEach(([k, v]) => {
      if (v != null) url.searchParams.set(k, v);
    });
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("[API] GET failed:", err);
    throw new Error("Data load failed. Using cached data.");
  }
}

// ── Public website API (no token needed) ────────────────────────────────────

/** Called by loan / insurance forms on the public site */
export async function submitLead(data) {
  return gasPost({ ...data });
}

// ── Admin CRM API ────────────────────────────────────────────────────────────

/**
 * Fetch all leads from Google Sheet.
 * MIGRATION: Replace gasGet() with your REST API call here.
 * Return shape: { leads: [...], total: number }
 */
export async function fetchLeads(filters = {}) {
  return gasGet({ action: "getLeads", ...filters });
}

/** Update lead status column */
export async function updateLeadStatus(id, status) {
  return gasPost({ action: "updateStatus", token: ADMIN_TOKEN, id, status });
}

/** Assign agent to lead */
export async function assignAgent(id, agentName) {
  return gasPost({ action: "assignAgent", token: ADMIN_TOKEN, id, agentName });
}

/** Append a follow-up note */
export async function addLeadNote(id, note) {
  return gasPost({ action: "addNote", token: ADMIN_TOKEN, id, note });
}

/** Fetch agents list from Agents sheet */
export async function fetchAgents() {
  return gasGet({ action: "getAgents" });
}

/** Add new agent */
export async function addAgent(data) {
  return gasPost({ action: "addAgent", token: ADMIN_TOKEN, ...data });
}

// ── Future: Multi-lender integration stubs ───────────────────────────────────
// Add bank API functions here when integrating. Components stay unchanged.
export const lendersAPI = {
  hdfc:  (leadId) => gasPost({ action: "submitHDFC",  token: ADMIN_TOKEN, leadId }),
  icici: (leadId) => gasPost({ action: "submitICICI", token: ADMIN_TOKEN, leadId }),
  bajaj: (leadId) => gasPost({ action: "submitBajaj", token: ADMIN_TOKEN, leadId }),
};
