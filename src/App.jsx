import { useState, useEffect, useRef } from "react";

// ─── GOOGLE APPS SCRIPT ENDPOINT ────────────────────────────────────────────
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyjwCYGp0GZ_AVO__UUgqsBFgifrHZpHJPcVAkZcRDHvxzW70ARl_zLAOfmZ20a9bYi/exec";

// ─── THEME & GLOBALS ────────────────────────────────────────────────────────
const GOLD = "#C9A84C";
const NAVY = "#0A0F1E";
const NAVY2 = "#0D1530";
const GLASS = "rgba(255,255,255,0.04)";

const BANKS = [
  { name: "HDFC Bank", domain: "hdfcbank.com" },
  { name: "ICICI Bank", domain: "icicibank.com" },
  { name: "Axis Bank", domain: "axisbank.com" },
  { name: "Kotak Mahindra", domain: "kotak.com" },
  { name: "IndusInd Bank", domain: "indusind.com" },
  { name: "Yes Bank", domain: "yesbank.in" },
  { name: "IDFC First Bank", domain: "idfcfirstbank.com" },
  { name: "RBL Bank", domain: "rblbank.com" },
];

const NBFCS = [
  { name: "Bajaj Finserv", domain: "bajajfinserv.in" },
  { name: "Tata Capital", domain: "tatacapital.com" },
  { name: "Aditya Birla Finance", domain: "adityabirlacapital.com" },
  { name: "L&T Finance", domain: "ltfs.com" },
  { name: "SMFG India Credit", domain: "smfgindiacredit.com" },
  { name: "Poonawala Fincorp", domain: "poonawallafincorp.com" },
  { name: "Hero Fincorp", domain: "herofincorp.com" },
];

const LOAN_DOCS = {
  personal: ["Aadhar + PAN (KYC)", "3 Months Salary Slips", "6 Months Bank Statement", "Latest Form 16"],
  business: ["KYC of Directors", "GST Certificate", "GST Returns (1 Year)", "ITR (Last 3 Years)", "Audited Financials (3 Years)", "P&L Statement", "Balance Sheet", "12 Months Bank Statement"],
  home: ["KYC Documents", "Income Proof", "6 Months Bank Statement", "Sale Agreement", "Title Deed", "Approved Plan", "Down Payment Proof"],
};

function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function calcEMI(principal, rate, months) {
  if (!principal || !rate || !months) return { emi: 0, total: 0, interest: 0, schedule: [] };
  const r = rate / 12 / 100;
  const emi = principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
  const total = emi * months;
  const interest = total - principal;
  let balance = principal;
  const schedule = [];
  for (let i = 1; i <= Math.min(months, 12); i++) {
    const int = balance * r;
    const prin = emi - int;
    balance -= prin;
    schedule.push({ month: i, emi: emi.toFixed(0), interest: int.toFixed(0), principal: prin.toFixed(0), balance: Math.max(balance, 0).toFixed(0) });
  }
  return { emi: emi.toFixed(0), total: total.toFixed(0), interest: interest.toFixed(0), schedule };
}

function getCibilCategory(score) {
  if (score >= 750) return { label: "Excellent", color: "#22c55e", chance: 95 };
  if (score >= 700) return { label: "Good", color: "#86efac", chance: 80 };
  if (score >= 650) return { label: "Fair", color: "#facc15", chance: 60 };
  if (score >= 600) return { label: "Poor", color: "#f97316", chance: 35 };
  return { label: "Very Poor", color: "#ef4444", chance: 10 };
}

function calcSIP(monthly, rate, years) {
  const n = years * 12;
  const r = rate / 12 / 100;
  const fv = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  return { fv: fv.toFixed(0), invested: (monthly * n).toFixed(0), returns: (fv - monthly * n).toFixed(0) };
}

const WA_NUMBER = "919876543210";
function waLink(msg) { return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`; }
function fmt(n) { return Number(n).toLocaleString("en-IN"); }

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeSection, setActiveSection] = useState("home");
  const [activeLoan, setActiveLoan] = useState("personal");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", mobile: "", email: "", loanType: "personal", amount: "", city: "", income: "", employment: "", companyName: "", businessName: "", businessType: "", propertyType: "", propertyLocation: "", propertyValue: "" });
  const [subDsaForm, setSubDsaForm] = useState({ name: "", mobile: "", email: "", city: "", experience: "", leads: "", tieups: "" });
  const [emiForm, setEmiForm] = useState({ principal: 500000, rate: 12, tenure: 36 });
  const [cibilScore, setCibilScore] = useState(750);
  const [sipForm, setSipForm] = useState({ monthly: 5000, rate: 12, years: 10 });
  const [insuranceForm, setInsuranceForm] = useState({ name: "", mobile: "", city: "", insuranceType: "health", age: "", sumAssured: "", existingPolicy: "no" });
  const [insuranceSubmitted, setInsuranceSubmitted] = useState(false);
  const [activeInsurance, setActiveInsurance] = useState("health");
  const [formStep, setFormStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState(null);

  const emi = calcEMI(emiForm.principal, emiForm.rate, emiForm.tenure);
  const cibil = getCibilCategory(cibilScore);
  const sip = calcSIP(sipForm.monthly, sipForm.rate, sipForm.years);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const navLinks = [
    { id: "home", label: "Home" },
    { id: "loans", label: "Loans" },
    { id: "emi", label: "EMI Calc" },
    { id: "cibil", label: "CIBIL" },
    { id: "tax", label: "Taxation" },
    { id: "mf", label: "Mutual Funds" },
    { id: "insurance", label: "Insurance" },
    { id: "partners", label: "Partners" },
    { id: "subdsa", label: "Partner With Us" },
  ];

  const scrollTo = (id) => {
    setActiveSection(id);
    setMobileMenu(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const bg = darkMode ? NAVY : "#F0F4FF";
  const textMain = darkMode ? "#F0F4FF" : "#0A0F1E";
  const textSub = darkMode ? "#94A3B8" : "#475569";
  const cardBg = darkMode ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)";
  const cardBorder = darkMode ? "rgba(201,168,76,0.18)" : "rgba(10,15,30,0.10)";
  const inputBg = darkMode ? "rgba(255,255,255,0.07)" : "rgba(10,15,30,0.06)";

  const styles = {
    app: { minHeight: "100vh", background: bg, color: textMain, fontFamily: "'Sora', 'DM Sans', sans-serif", transition: "background 0.4s, color 0.4s", overflowX: "hidden" },
    nav: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 999, background: darkMode ? "rgba(10,15,30,0.92)" : "rgba(240,244,255,0.92)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${cardBorder}`, padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" },
    logo: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
    logoText: { fontSize: 19, fontWeight: 800, background: `linear-gradient(135deg, ${GOLD}, #F5D27A)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    navLinks: { display: "flex", gap: 4, alignItems: "center" },
    navLink: (active) => ({ padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", background: active ? `linear-gradient(135deg, ${GOLD}22, ${GOLD}11)` : "transparent", color: active ? GOLD : textSub, border: active ? `1px solid ${GOLD}44` : "1px solid transparent", transition: "all 0.2s" }),
    goldBtn: { background: `linear-gradient(135deg, ${GOLD}, #B8862A)`, color: "#0A0F1E", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: `0 4px 20px ${GOLD}44`, transition: "all 0.2s", fontFamily: "inherit" },
    glassCard: { background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 20, backdropFilter: "blur(20px)", padding: 28, boxShadow: darkMode ? "0 8px 40px rgba(0,0,0,0.4)" : "0 8px 40px rgba(10,15,30,0.08)" },
    section: { padding: "100px 24px 80px", maxWidth: 1200, margin: "0 auto" },
    sectionTitle: { fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 12 },
    goldGrad: { background: `linear-gradient(135deg, ${GOLD}, #F5D27A)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    input: { width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${cardBorder}`, background: inputBg, color: textMain, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border 0.2s" },
    label: { fontSize: 13, fontWeight: 600, color: textSub, marginBottom: 6, display: "block" },
    tag: { display: "inline-block", padding: "4px 12px", borderRadius: 20, background: `${GOLD}18`, border: `1px solid ${GOLD}44`, color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em" },
  };

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
        #root, #app { width: 100% !important; max-width: 100% !important; margin: 0 !important; }
        ::-webkit-scrollbar { width: 6px; } 
        ::-webkit-scrollbar-track { background: ${NAVY}; }
        ::-webkit-scrollbar-thumb { background: ${GOLD}66; border-radius: 3px; }
        html { scroll-behavior: smooth; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes shimmer { 0%{background-position:-200%} 100%{background-position:200%} }
        @keyframes pulseGold { 0%,100%{box-shadow:0 0 0 0 ${GOLD}44} 50%{box-shadow:0 0 0 14px ${GOLD}00} }
        @keyframes pulseGreen { 0%,100%{box-shadow:0 0 0 0 rgba(37,211,102,0.5)} 50%{box-shadow:0 0 0 14px rgba(37,211,102,0)} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes heroGlow { 0%,100%{opacity:0.5; transform:scale(1)} 50%{opacity:1; transform:scale(1.08)} }
        @keyframes progressFill { from{width:0} to{width:var(--w)} }
        @keyframes countTick { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes badgePop { 0%{opacity:0;transform:scale(0.8) translateY(6px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes borderPulse { 0%,100%{border-color:${GOLD}33} 50%{border-color:${GOLD}88} }
        @keyframes slideInLeft { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideUpIn { from{opacity:0;transform:translateY(60px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeUp 0.7s ease forwards; }
        .float { animation: float 4s ease-in-out infinite; }
        .hover-card:hover { transform: translateY(-4px); box-shadow: 0 16px 50px rgba(201,168,76,0.15) !important; }
        .hover-card { transition: transform 0.3s, box-shadow 0.3s; }
        .gold-hover:hover { background: linear-gradient(135deg, #D4A84C, #C9A84C) !important; transform: scale(1.03); }
        .bank-logo:hover { filter: none !important; transform: scale(1.08); }
        .bank-logo { filter: grayscale(100%) opacity(0.6); transition: all 0.3s; }
        input:focus, select:focus, textarea:focus { border-color: ${GOLD}88 !important; outline: none !important; box-shadow: 0 0 0 2px ${GOLD}22 !important; }
        select { background-color: #0f172a !important; color: #F0F4FF !important; -webkit-appearance: none; appearance: none; }
        select option { background-color: #0f172a !important; color: #F0F4FF !important; }
        .wa-float { position: fixed; bottom: 96px; right: 20px; z-index: 1000; animation: pulseGreen 2s infinite; }
        .section-reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.8s, transform 0.8s; }
        .section-reveal.visible { opacity: 1; transform: translateY(0); }
        .trust-badge { animation: badgePop 0.5s ease forwards; opacity: 0; }
        .progress-bar-fill { animation: progressFill 1.4s cubic-bezier(.4,0,.2,1) forwards; }
        .hero-glow { animation: heroGlow 6s ease-in-out infinite; }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-card { display: none !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .hiw-grid { grid-template-columns: 1fr 1fr !important; }
          .why-grid { grid-template-columns: 1fr 1fr !important; }
          .loan-grid { grid-template-columns: 1fr !important; }
          .emi-grid { grid-template-columns: 1fr !important; }
          .cibil-grid { grid-template-columns: 1fr !important; }
          .tax-grid { grid-template-columns: 1fr !important; }
          .mf-grid { grid-template-columns: 1fr !important; }
          .fund-grid { grid-template-columns: 1fr 1fr !important; }
          .bank-grid { grid-template-columns: repeat(4,1fr) !important; }
          .nbfc-grid { grid-template-columns: repeat(2,1fr) !important; }
          .seo-grid { grid-template-columns: 1fr 1fr !important; }
          .subdsa-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
          .mobile-sticky-bar { display: flex !important; }
          .section-pad { padding: 70px 16px 60px !important; }
          .trust-grid { grid-template-columns: 1fr 1fr !important; }
          .sticky-mobile-cta { display: flex !important; }
          .ins-cat-grid { grid-template-columns: repeat(2,1fr) !important; }
          .ins-compare-grid { grid-template-columns: 1fr !important; }
          .ins-benefit-grid { grid-template-columns: 1fr !important; }
          .ins-form-grid { grid-template-columns: 1fr !important; }
          .ins-provider-grid { grid-template-columns: repeat(3,1fr) !important; }
          .ins-seo-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
          .mobile-sticky-bar { display: none !important; }
          .sticky-mobile-cta { display: none !important; }
        }
      `}</style>

      {/* ── NAVIGATION ── */}
      <nav style={styles.nav}>
        <div style={styles.logo} onClick={() => scrollTo("home")}>
          <div style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${GOLD}, #B8862A)`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#0A0F1E", fontSize: 16 }}>₹</div>
          <div>
            <div style={styles.logoText}>One Point Finance Hub</div>
            <div style={{ fontSize: 10, color: textSub, marginTop: -2, letterSpacing: "0.08em" }}>SERVING CLIENTS ACROSS PAN INDIA</div>
          </div>
        </div>
        <div className="desktop-nav" style={styles.navLinks}>
          {navLinks.map(l => <button key={l.id} style={styles.navLink(activeSection === l.id)} onClick={() => scrollTo(l.id)}>{l.label}</button>)}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button style={{ background: "transparent", border: `1px solid ${cardBorder}`, borderRadius: 8, padding: "7px 12px", cursor: "pointer", color: textMain, fontSize: 18 }} onClick={() => setDarkMode(!darkMode)}>{darkMode ? "☀️" : "🌙"}</button>
          <a href={waLink("Hi! I'm interested in a loan.")} target="_blank" rel="noreferrer" style={{ ...styles.goldBtn, textDecoration: "none", padding: "8px 16px", fontSize: 13 }} className="gold-hover">📱 WhatsApp</a>
          <button className="mobile-menu-btn" style={{ background: "transparent", border: `1px solid ${cardBorder}`, borderRadius: 8, padding: 8, cursor: "pointer", color: textMain, display: "none" }} onClick={() => setMobileMenu(!mobileMenu)}>☰</button>
        </div>
      </nav>

      {mobileMenu && (
        <div style={{ position: "fixed", top: 64, left: 0, right: 0, zIndex: 998, background: darkMode ? "rgba(10,15,30,0.98)" : "rgba(240,244,255,0.98)", padding: 20, borderBottom: `1px solid ${cardBorder}`, backdropFilter: "blur(20px)" }}>
          {navLinks.map(l => <button key={l.id} style={{ ...styles.navLink(activeSection === l.id), display: "block", width: "100%", textAlign: "left", marginBottom: 8, padding: "12px 16px" }} onClick={() => scrollTo(l.id)}>{l.label}</button>)}
        </div>
      )}

      <HeroSection styles={styles} scrollTo={scrollTo} darkMode={darkMode} textSub={textSub} GOLD={GOLD} />
      <TrustSection styles={styles} darkMode={darkMode} textSub={textSub} GOLD={GOLD} cardBorder={cardBorder} />
      <StatsSection styles={styles} darkMode={darkMode} textSub={textSub} GOLD={GOLD} cardBorder={cardBorder} />
      <HowItWorksSection styles={styles} darkMode={darkMode} textSub={textSub} GOLD={GOLD} cardBorder={cardBorder} />
      <WhyChooseSection styles={styles} darkMode={darkMode} textSub={textSub} GOLD={GOLD} cardBorder={cardBorder} />
      <TestimonialSection styles={styles} darkMode={darkMode} textSub={textSub} GOLD={GOLD} cardBorder={cardBorder} />
      <LoanSection id="loans" styles={styles} darkMode={darkMode} textSub={textSub} GOLD={GOLD} cardBorder={cardBorder} activeLoan={activeLoan} setActiveLoan={setActiveLoan} leadForm={leadForm} setLeadForm={setLeadForm} formStep={formStep} setFormStep={setFormStep} submitted={submitted} setSubmitted={setSubmitted} showToast={showToast} scrollTo={scrollTo} inputBg={styles.input} />
      <EMISection id="emi" styles={styles} darkMode={darkMode} textSub={textSub} GOLD={GOLD} cardBorder={cardBorder} emiForm={emiForm} setEmiForm={setEmiForm} emi={emi} />
      <CIBILSection id="cibil" styles={styles} darkMode={darkMode} textSub={textSub} GOLD={GOLD} cardBorder={cardBorder} cibilScore={cibilScore} setCibilScore={setCibilScore} cibil={cibil} />
      <TaxSection id="tax" styles={styles} darkMode={darkMode} textSub={textSub} GOLD={GOLD} cardBorder={cardBorder} showToast={showToast} />
      <MFSection id="mf" styles={styles} darkMode={darkMode} textSub={textSub} GOLD={GOLD} cardBorder={cardBorder} sipForm={sipForm} setSipForm={setSipForm} sip={sip} showToast={showToast} />
      <InsuranceSection id="insurance" styles={styles} darkMode={darkMode} textSub={textSub} GOLD={GOLD} cardBorder={cardBorder} activeInsurance={activeInsurance} setActiveInsurance={setActiveInsurance} insuranceForm={insuranceForm} setInsuranceForm={setInsuranceForm} insuranceSubmitted={insuranceSubmitted} setInsuranceSubmitted={setInsuranceSubmitted} showToast={showToast} scrollTo={scrollTo} />
      <BankSection id="partners" styles={styles} darkMode={darkMode} textSub={textSub} GOLD={GOLD} cardBorder={cardBorder} />
      <StrategicPartnerSection styles={styles} darkMode={darkMode} textSub={textSub} GOLD={GOLD} cardBorder={cardBorder} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "12px 0 48px" }}>
          <div style={{ flex: 1, height: 1, background: darkMode ? "linear-gradient(90deg, transparent, rgba(201,168,76,0.25), transparent)" : "linear-gradient(90deg, transparent, rgba(10,15,30,0.12), transparent)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 18px", borderRadius: 20, background: darkMode ? "rgba(201,168,76,0.07)" : "rgba(201,168,76,0.1)", border: `1px solid ${GOLD}30`, whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 14 }}>🗺️</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: "0.1em" }}>OUR COVERAGE</span>
          </div>
          <div style={{ flex: 1, height: 1, background: darkMode ? "linear-gradient(90deg, transparent, rgba(201,168,76,0.25), transparent)" : "linear-gradient(90deg, transparent, rgba(10,15,30,0.12), transparent)" }} />
        </div>
      </div>

      <SEOSection styles={styles} darkMode={darkMode} textSub={textSub} GOLD={GOLD} cardBorder={cardBorder} />
      <SubDSASection id="subdsa" styles={styles} darkMode={darkMode} textSub={textSub} GOLD={GOLD} cardBorder={cardBorder} subDsaForm={subDsaForm} setSubDsaForm={setSubDsaForm} showToast={showToast} />
      <Footer styles={styles} darkMode={darkMode} textSub={textSub} GOLD={GOLD} cardBorder={cardBorder} scrollTo={scrollTo} />
      <ContactWidget GOLD={GOLD} />
      <StickyMobileCTA GOLD={GOLD} scrollTo={scrollTo} />

      {toast && (
        <div style={{ position: "fixed", bottom: 100, right: 28, zIndex: 9999, background: toast.type === "success" ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", padding: "14px 22px", borderRadius: 12, fontWeight: 600, fontSize: 14, boxShadow: "0 8px 30px rgba(0,0,0,0.3)", animation: "fadeUp 0.4s ease" }}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HERO SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function HeroSection({ styles, scrollTo, darkMode, textSub, GOLD }) {
  const [ref, inView] = useInView(0.1);
  const approvalCount = useCounter(947, 1800, inView);
  const loanCount = useCounter(100, 1600, inView);

  const trustBadges = [
    { icon: "🔒", label: "SSL Secured" },
    { icon: "✦", label: "No Hidden Charges" },
    { icon: "⚡", label: "24–48 Hr Processing" },
    { icon: "🏦", label: "Multi-Bank Network" },
  ];

  const loanRows = [
    { type: "Personal Loan", amt: "₹15L", color: "#3B82F6", w: "72%" },
    { type: "Business Loan", amt: "₹25L", color: GOLD, w: "88%" },
    { type: "Home Loan",     amt: "₹8L",  color: "#A855F7", w: "55%" },
  ];

  return (
    <section id="home" ref={ref} style={{ minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", position: "relative", paddingTop: 80 }}>
      <div className="hero-glow" style={{ position: "absolute", top: "10%", right: "5%", width: 520, height: 520, background: `radial-gradient(circle, ${GOLD}12 0%, transparent 70%)`, borderRadius: "50%", zIndex: 0, pointerEvents: "none" }} />
      <div className="hero-glow" style={{ position: "absolute", bottom: "5%", left: "-5%", width: 400, height: 400, background: `radial-gradient(circle, #1E3A6E33 0%, transparent 70%)`, borderRadius: "50%", zIndex: 0, animationDelay: "3s", pointerEvents: "none" }} />
      <div className="hero-glow" style={{ position: "absolute", top: "50%", left: "40%", width: 300, height: 300, background: `radial-gradient(circle, ${GOLD}08 0%, transparent 70%)`, borderRadius: "50%", zIndex: 0, animationDelay: "1.5s", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: darkMode ? `linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)` : `linear-gradient(rgba(10,15,30,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(10,15,30,0.04) 1px, transparent 1px)`, backgroundSize: "60px 60px", zIndex: 0 }} />
      <div style={{ ...styles.section, paddingTop: 120, zIndex: 1, width: "100%" }}>
        <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 40, alignItems: "center" }}>
          <div className={inView ? "fade-in" : ""}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${GOLD}14`, border: `1px solid ${GOLD}44`, borderRadius: 24, padding: "6px 16px", marginBottom: 22, animation: inView ? "slideInLeft 0.6s ease forwards" : "none" }}>
              <span style={{ fontSize: 14 }}>🏆</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: "0.05em" }}>Odisha's Trusted Loan Advisory Platform · Pan India</span>
            </div>
            <h1 style={{ fontSize: "clamp(28px, 4.5vw, 58px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 14 }}>
              Fast Loan Approvals<br />
              <span style={{ background: `linear-gradient(135deg, ${GOLD}, #F5D27A, ${GOLD})`, backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 4s linear infinite" }}>
                in Pan India
              </span>{" "}—{" "}
              <span style={{ color: darkMode ? "#F0F4FF" : "#0A0F1E" }}>Multi-Bank</span>
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "10px 16px", background: darkMode ? "rgba(34,197,94,0.08)" : "rgba(34,197,94,0.1)", borderRadius: 10, border: "1px solid rgba(34,197,94,0.2)", width: "fit-content" }}>
              <div style={{ width: 8, height: 8, background: "#22c55e", borderRadius: "50%", boxShadow: "0 0 6px #22c55e", flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: darkMode ? "#86efac" : "#16a34a" }}>
                {inView ? loanCount : 0}+ Loans Disbursed Monthly · Trusted Loan Advisory Partner
              </span>
            </div>
            <p style={{ fontSize: 16, color: textSub, lineHeight: 1.75, marginBottom: 32, maxWidth: 460 }}>
              Rooted in Odisha, serving Pan India. We match you with the right lending partner for the fastest approvals — Personal, Business, and Home Loans at competitive rates.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
              <button style={{ ...styles.goldBtn, padding: "14px 28px", fontSize: 15, borderRadius: 12, boxShadow: `0 6px 28px ${GOLD}55` }} className="gold-hover" onClick={() => scrollTo("loans")}>🚀 Apply Now</button>
              <button style={{ ...styles.goldBtn, background: "transparent", color: GOLD, border: `1.5px solid ${GOLD}66`, boxShadow: "none", padding: "14px 24px", fontSize: 15, borderRadius: 12 }} onClick={() => scrollTo("cibil")}>✅ Check Eligibility</button>
              <a href={`https://wa.me/919876543210?text=${encodeURIComponent("Hi! I want to apply for a loan.")}`} target="_blank" rel="noreferrer" style={{ ...styles.goldBtn, background: "linear-gradient(135deg,#25D366,#128C7E)", textDecoration: "none", padding: "14px 24px", fontSize: 15, borderRadius: 12, boxShadow: "0 6px 24px rgba(37,211,102,0.35)" }}>💬 WhatsApp Now</a>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {trustBadges.map((b, i) => (
                <div key={i} className="trust-badge" style={{ animationDelay: `${0.5 + i * 0.12}s`, display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 8, background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(10,15,30,0.06)", border: `1px solid ${darkMode ? "rgba(201,168,76,0.2)" : "rgba(10,15,30,0.1)"}` }}>
                  <span style={{ fontSize: 13, color: GOLD }}>{b.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: textSub, whiteSpace: "nowrap" }}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-card" style={{ display: "flex", justifyContent: "center" }}>
            <div className="float" style={{ ...styles.glassCard, maxWidth: 390, width: "100%", position: "relative", border: `1px solid ${GOLD}33`, boxShadow: `0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 ${GOLD}22` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 11, color: textSub, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>APPROVAL PROBABILITY</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#22c55e", lineHeight: 1.2, letterSpacing: "-0.01em" }}>High Approval<br/>Probability</div>
                  <div style={{ fontSize: 10, color: textSub, marginTop: 6, fontStyle: "italic" }}>For eligible profiles</div>
                  <div style={{ fontSize: 10, color: textSub, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>🔒 Subject to lender eligibility criteria</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 52, height: 52, background: `linear-gradient(135deg, ${GOLD}, #B8862A)`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: `0 6px 20px ${GOLD}44` }}>₹</div>
                  <div style={{ fontSize: 10, color: GOLD, fontWeight: 700 }}>SECURED</div>
                </div>
              </div>
              <div style={{ background: darkMode ? "rgba(34,197,94,0.08)" : "rgba(34,197,94,0.1)", borderRadius: 12, padding: "12px 14px", marginBottom: 18, border: "1px solid rgba(34,197,94,0.15)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: textSub, fontWeight: 600 }}>Total Disbursed (2024)</span>
                  <span style={{ color: "#22c55e", fontWeight: 800 }}>₹12 Cr+</span>
                </div>
                <div style={{ height: 7, background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)", borderRadius: 4 }}>
                  <div className={inView ? "progress-bar-fill" : ""} style={{ "--w": "88%", height: "100%", width: inView ? "88%" : "0%", background: "linear-gradient(90deg,#22c55e,#16a34a)", borderRadius: 4, transition: "width 1.4s cubic-bezier(.4,0,.2,1)" }} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                {loanRows.map(({ type, amt, color, w }) => (
                  <div key={type}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, background: color, borderRadius: "50%", boxShadow: `0 0 6px ${color}88`, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{type}</span>
                      </div>
                      <span style={{ fontSize: 13, color, fontWeight: 800 }}>{amt}</span>
                    </div>
                    <div style={{ height: 5, background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)", borderRadius: 3 }}>
                      <div className={inView ? "progress-bar-fill" : ""} style={{ "--w": w, height: "100%", width: inView ? w : "0%", background: color, borderRadius: 3, opacity: 0.75, transition: "width 1.4s cubic-bezier(.4,0,.2,1)", transitionDelay: "0.3s" }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: `1px solid ${GOLD}18` }}>
                <div style={{ display: "flex", align: "center", gap: 6, fontSize: 12, color: textSub }}>
                  <span>🔒</span> <span style={{ fontWeight: 600 }}>Bank-Grade Encryption</span>
                </div>
                <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, background: `${GOLD}14`, padding: "3px 9px", borderRadius: 6 }}>VERIFIED ✓</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function StatsSection({ styles, darkMode, textSub, GOLD, cardBorder }) {
  const [ref, inView] = useInView(0.3);
  const loans = useCounter(500, 2000, inView);
  const customers = useCounter(1200, 2200, inView);
  const approval = useCounter(94, 2000, inView);
  const cities = useCounter(28, 1800, inView);
  const stats = [
    { value: loans, suffix: "+", label: "Loans Facilitated", icon: "💰" },
    { value: customers, suffix: "+", label: "Customers Served", icon: "👥" },
    { value: approval, suffix: "%", label: "Approval Rate", icon: "✅" },
    { value: cities, suffix: " States", label: "Pan India Coverage", icon: "🇮🇳" },
  ];
  return (
    <div ref={ref} style={{ background: darkMode ? "rgba(201,168,76,0.05)" : "rgba(201,168,76,0.08)", borderTop: `1px solid ${cardBorder}`, borderBottom: `1px solid ${cardBorder}`, padding: "60px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
        {stats.map((s, i) => (
          <div key={i} className={`hover-card ${inView ? "fade-in" : ""}`} style={{ textAlign: "center", animationDelay: `${i * 0.1}s` }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, background: `linear-gradient(135deg, ${GOLD}, #F5D27A)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.value}{s.suffix}</div>
            <div style={{ fontSize: 14, color: textSub, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOW IT WORKS
// ═══════════════════════════════════════════════════════════════════════════════
function HowItWorksSection({ styles, darkMode, textSub, GOLD, cardBorder }) {
  const [ref, inView] = useInView(0.15);
  const steps = [
    { num: "01", icon: "📝", title: "Apply Online", desc: "Fill our 2-minute form with basic details and loan requirement. 100% digital.", color: "#3B82F6", time: "2 min" },
    { num: "02", icon: "📁", title: "Submit Documents", desc: "Upload KYC, income proof, and bank statements via WhatsApp or our secure portal.", color: GOLD, time: "Same day" },
    { num: "03", icon: "🏦", title: "Lender Matching", desc: "We match your profile with the best-fit lender and submit your application for review.", color: "#A855F7", time: "Within 4 hrs" },
    { num: "04", icon: "✅", title: "Loan Approved", desc: "Get your approval letter. We negotiate the best rate and terms on your behalf.", color: "#22c55e", time: "24–48 hrs" },
    { num: "05", icon: "💰", title: "Funds Disbursed", desc: "Money hits your bank account. We follow up until disbursal is complete.", color: "#f97316", time: "3–7 days" },
  ];
  return (
    <section ref={ref} style={{ ...styles.section, paddingBottom: 60 }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div style={{ ...styles.tag, marginBottom: 16 }}>PROCESS</div>
        <h2 style={styles.sectionTitle}>How It <span style={styles.goldGrad}>Works</span></h2>
        <p style={{ color: textSub, fontSize: 16, maxWidth: 500, margin: "0 auto" }}>From application to disbursal — a simple 5-step journey</p>
      </div>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: 44, left: "10%", right: "10%", height: 2, zIndex: 0, background: `linear-gradient(90deg, #3B82F644, ${GOLD}66, #A855F744, #22c55e66, #f9731644)` }} />
        <div className="hiw-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20, position: "relative", zIndex: 1 }}>
          {steps.map((s, i) => (
            <div key={i} className={`hover-card ${inView ? "fade-in" : ""}`} style={{ ...styles.glassCard, textAlign: "center", padding: "24px 16px", animationDelay: `${i * 0.13}s`, borderTop: `3px solid ${s.color}` }}>
              <div style={{ width: 60, height: 60, background: `${s.color}18`, border: `2px solid ${s.color}55`, borderRadius: "50%", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: `0 0 20px ${s.color}22` }}>{s.icon}</div>
              <div style={{ fontSize: 10, color: s.color, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 6 }}>STEP {s.num}</div>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8, lineHeight: 1.3 }}>{s.title}</div>
              <div style={{ color: textSub, fontSize: 12, lineHeight: 1.65, marginBottom: 12 }}>{s.desc}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${s.color}14`, border: `1px solid ${s.color}33`, borderRadius: 12, padding: "4px 10px" }}>
                <span style={{ fontSize: 10, color: s.color, fontWeight: 700 }}>⏱ {s.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 40, padding: "20px 32px", background: darkMode ? `linear-gradient(135deg, ${GOLD}0A, ${GOLD}05)` : `linear-gradient(135deg, ${GOLD}10, ${GOLD}06)`, borderRadius: 16, border: `1px solid ${GOLD}33`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>Ready to get started?</div>
          <div style={{ fontSize: 14, color: textSub }}>Join 1,200+ customers who got their loan approved through us.</div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button style={{ ...styles.goldBtn, padding: "12px 28px" }} className="gold-hover" onClick={() => { const el = document.getElementById("loans"); if (el) el.scrollIntoView({ behavior: "smooth" }); }}>Apply Now →</button>
          <a href="https://wa.me/919876543210?text=Hi!%20I%20want%20to%20apply%20for%20a%20loan." target="_blank" rel="noreferrer" style={{ ...styles.goldBtn, background: "linear-gradient(135deg,#25D366,#128C7E)", textDecoration: "none", padding: "12px 24px" }}>💬 WhatsApp Us</a>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WHY CHOOSE US
// ═══════════════════════════════════════════════════════════════════════════════
function WhyChooseSection({ styles, darkMode, textSub, GOLD, cardBorder }) {
  const [ref, inView] = useInView(0.15);
  const features = [
    { emoji: "🏦", title: "Robust Multi-Lender Processing", desc: "Seamless multi-lender coordination across leading banks and NBFCs to improve approval probability and reduce processing time.", color: "#3B82F6", glow: "rgba(59,130,246,0.12)" },
    { emoji: "🤝", title: "Dedicated Relationship Support", desc: "Personalized guidance from application to disbursal, ensuring clarity at every stage of the process.", color: GOLD, glow: "rgba(201,168,76,0.12)" },
    { emoji: "💬", title: "WhatsApp-First Assistance", desc: "Instant updates, quick responses, and real-time coordination through WhatsApp for faster communication.", color: "#25D366", glow: "rgba(37,211,102,0.12)" },
    { emoji: "🔍", title: "Transparent Advisory Process", desc: "Clear communication on eligibility, documentation, and lender criteria with no hidden surprises.", color: "#A855F7", glow: "rgba(168,85,247,0.12)" },
    { emoji: "⚡", title: "Fast-Track Approvals", desc: "Optimized profile matching for eligible applicants to accelerate pre-approval timelines.", color: "#f97316", glow: "rgba(249,115,22,0.12)" },
    { emoji: "🔒", title: "Bank-Grade Data Security", desc: "Encrypted documentation handling and secure digital processing to protect your financial information.", color: "#22c55e", glow: "rgba(34,197,94,0.12)" },
  ];
  return (
    <section ref={ref} style={{ ...styles.section, background: darkMode ? "rgba(201,168,76,0.025)" : "rgba(201,168,76,0.04)", borderRadius: 32, margin: "0 24px 60px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-20%", right: "-10%", width: 500, height: 500, background: `radial-gradient(circle, ${GOLD}07 0%, transparent 65%)`, borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: 400, height: 400, background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ ...styles.tag, marginBottom: 16 }}>WHY US</div>
          <h2 style={{ ...styles.sectionTitle, marginBottom: 16 }}>Why Choose <span style={styles.goldGrad}>One Point Finance Hub</span></h2>
          <p style={{ color: textSub, fontSize: 16, maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>A structured multi-lender advisory platform built for speed, transparency, and reliability.</p>
        </div>
        <div className="why-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, alignItems: "stretch" }}>
          {features.map((f, i) => (
            <div key={i} className={inView ? "fade-in" : ""} style={{ ...styles.glassCard, animationDelay: `${i * 0.1}s`, border: `1px solid ${f.color}22`, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", cursor: "default", transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 20px 56px ${f.glow}, 0 0 0 1px ${f.color}44`; e.currentTarget.style.borderColor = `${f.color}55`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = darkMode ? "0 8px 40px rgba(0,0,0,0.4)" : "0 8px 40px rgba(10,15,30,0.08)"; e.currentTarget.style.borderColor = `${f.color}22`; }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${f.color}88, transparent)` }} />
              <div style={{ width: 60, height: 60, borderRadius: 18, background: `linear-gradient(135deg, ${f.color}22, ${f.color}0a)`, border: `1px solid ${f.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 20, boxShadow: `0 4px 16px ${f.glow}`, flexShrink: 0 }}>{f.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10, lineHeight: 1.3, color: darkMode ? "#F0F4FF" : "#0A0F1E" }}>{f.title}</div>
                <div style={{ color: textSub, fontSize: 13.5, lineHeight: 1.72 }}>{f.desc}</div>
              </div>
              <div style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 5, background: `${f.color}12`, border: `1px solid ${f.color}30`, borderRadius: 8, padding: "5px 10px", width: "fit-content" }}>
                <div style={{ width: 6, height: 6, background: f.color, borderRadius: "50%", flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: f.color, letterSpacing: "0.04em" }}>ONE POINT ADVANTAGE</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 44, padding: "20px 32px", background: darkMode ? `linear-gradient(135deg, ${GOLD}0A, ${GOLD}05)` : `linear-gradient(135deg, ${GOLD}12, ${GOLD}07)`, borderRadius: 16, border: `1px solid ${GOLD}33`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>Ready to get started?</div>
            <div style={{ fontSize: 14, color: textSub }}>Speak with our advisory team today — no commitment required.</div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button style={{ ...styles.goldBtn, padding: "12px 28px" }} className="gold-hover" onClick={() => { const el = document.getElementById("loans"); if (el) el.scrollIntoView({ behavior: "smooth" }); }}>Apply Now →</button>
            <a href="https://wa.me/919876543210?text=Hi!%20I%20want%20to%20apply%20for%20a%20loan." target="_blank" rel="noreferrer" style={{ ...styles.goldBtn, background: "linear-gradient(135deg,#25D366,#128C7E)", textDecoration: "none", padding: "12px 24px" }}>💬 WhatsApp Us</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOAN SECTION — ALL FIXES APPLIED
// ═══════════════════════════════════════════════════════════════════════════════
function LoanSection({ id, styles, darkMode, textSub, GOLD, cardBorder, activeLoan, setActiveLoan, leadForm, setLeadForm, formStep, setFormStep, submitted, setSubmitted, showToast, scrollTo }) {
  const [ref, inView] = useInView(0.1);
  const docs = LOAN_DOCS[activeLoan];

  // Dark select style — overrides browser default white background
  const selectStyle = {
    ...styles.input,
    cursor: "pointer",
    backgroundColor: "#0f172a",
    color: "#F0F4FF",
    WebkitAppearance: "none",
    MozAppearance: "none",
    appearance: "none",
  };

  const eligibility = {
    personal: { min: "₹25,000/mo salary", cibil: "700+", age: "21-58 years", amount: "₹50K – ₹40L" },
    business: { min: "₹5L annual turnover", cibil: "680+", age: "25-65 years", amount: "₹1L – ₹5Cr" },
    home: { min: "₹35,000/mo income", cibil: "720+", age: "21-65 years", amount: "₹5L – ₹5Cr" },
  };
  const el = eligibility[activeLoan];

  const handleSubmit = async () => {
    if (!leadForm.name || !leadForm.mobile) { showToast("Please fill required fields", "error"); return; }

    if (activeLoan === "personal") {
      if (!(leadForm.companyName || "").trim()) { showToast("Please enter your Company Name (Current Employer)", "error"); return; }
    }
    if (activeLoan === "business") {
      if (!(leadForm.businessName || "").trim()) { showToast("Please enter your Business Name", "error"); return; }
      if (!leadForm.businessType) { showToast("Please select your Business Type", "error"); return; }
    }
    if (activeLoan === "home") {
      if (!leadForm.income || !leadForm.employment) { showToast("Please fill Employment details", "error"); return; }
      if (leadForm.employment === "salaried" && !(leadForm.companyName || "").trim()) { showToast("Please enter your Company Name", "error"); return; }
      if ((leadForm.employment === "self-employed" || leadForm.employment === "business") && (!(leadForm.businessName || "").trim() || !leadForm.businessType)) { showToast("Please fill all Business details", "error"); return; }
      if (!leadForm.propertyType || !(leadForm.propertyLocation || "").trim() || !(leadForm.propertyValue || "").trim()) { showToast("Please fill all Property details", "error"); return; }
    }

    const crmPayload = {
      timestamp: new Date().toISOString(),
      fullName: leadForm.name, mobile: leadForm.mobile, email: leadForm.email || "",
      city: leadForm.city, productType: "Loan", loanType: activeLoan, loanAmount: leadForm.amount,
      monthlyIncome: leadForm.income || "", employmentType: leadForm.employment || "",
      companyName: leadForm.companyName || "", businessName: leadForm.businessName || "",
      businessType: leadForm.businessType || "", propertyType: leadForm.propertyType || "",
      propertyLocation: leadForm.propertyLocation || "", propertyValue: leadForm.propertyValue || "",
      leadSource: "Website", leadStatus: "New", assignedAgent: "", followUpDate: "",
      notes: `Loan: ${activeLoan}, Amount: ${leadForm.amount}`,
    };
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(crmPayload),
      });
    } catch (err) {
      console.error("Loan form submission error:", err);
    }
    showToast("Application submitted! Our team will contact you shortly.");
    setSubmitted(true);
  };

  return (
    <section id={id} ref={ref} style={styles.section}>
      <div style={{ textAlign: "center", marginBottom: 50 }}>
        <div style={{ ...styles.tag, marginBottom: 16 }}>LOAN PRODUCTS</div>
        <h2 style={styles.sectionTitle}>Apply for a <span style={styles.goldGrad}>Loan</span></h2>
        <p style={{ color: textSub, fontSize: 16, maxWidth: 500, margin: "0 auto" }}>Choose your loan type and get started in minutes</p>
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 40, flexWrap: "wrap" }}>
        {[["personal", "👤 Personal Loan"], ["business", "🏢 Business Loan"], ["home", "🏠 Home Loan"]].map(([type, label]) => (
          <button key={type} onClick={() => setActiveLoan(type)} style={{ padding: "12px 28px", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit", border: activeLoan === type ? `2px solid ${GOLD}` : `1px solid ${cardBorder}`, background: activeLoan === type ? `linear-gradient(135deg, ${GOLD}22, ${GOLD}11)` : "transparent", color: activeLoan === type ? GOLD : textSub, transition: "all 0.2s" }}>
            {label}
          </button>
        ))}
      </div>

      <div className="loan-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        {/* Left: Form */}
        <div style={styles.glassCard} className="hover-card">
          {submitted ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 60, marginBottom: 20 }}>🎉</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Application Submitted!</div>
              <div style={{ color: textSub, marginBottom: 24 }}>Our team will contact you within 2 hours.</div>
              <a href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hi! I just applied for a ${activeLoan} loan through One Point Finance Hub. My name is ${leadForm.name}.`)}`} target="_blank" rel="noreferrer" style={{ ...styles.goldBtn, textDecoration: "none", background: "linear-gradient(135deg,#25D366,#128C7E)" }}>Track on WhatsApp</a>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Apply for {activeLoan.charAt(0).toUpperCase() + activeLoan.slice(1)} Loan</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

                {/* Core fields */}
                <div>
                  <label style={styles.label}>Full Name *</label>
                  <input style={styles.input} value={leadForm.name} onChange={e => setLeadForm({ ...leadForm, name: e.target.value })} placeholder="Your full name" />
                </div>
                <div>
                  <label style={styles.label}>Mobile Number *</label>
                  <input style={styles.input} value={leadForm.mobile} onChange={e => setLeadForm({ ...leadForm, mobile: e.target.value })} placeholder="10-digit number" maxLength={10} />
                </div>
                <div>
                  <label style={styles.label}>Email</label>
                  <input style={styles.input} value={leadForm.email} onChange={e => setLeadForm({ ...leadForm, email: e.target.value })} placeholder="your@email.com" />
                </div>
                <div>
                  <label style={styles.label}>City</label>
                  <input style={styles.input} value={leadForm.city} onChange={e => setLeadForm({ ...leadForm, city: e.target.value })} placeholder="Bhubaneswar" />
                </div>

                {/* FIX 2: Personal Loan — Company Name after City */}
                {activeLoan === "personal" && (
                  <div style={{ gridColumn: "1/-1", animation: "fadeSlideIn 0.25s ease forwards" }}>
                    <label style={styles.label}>Company Name (Current Employer) *</label>
                    <input style={styles.input} value={leadForm.companyName} onChange={e => setLeadForm({ ...leadForm, companyName: e.target.value })} placeholder="Enter your employer / company name" />
                  </div>
                )}

                {/* FIX 3: Business Loan — Business Name + Business Type after City */}
                {activeLoan === "business" && <>
                  <div style={{ animation: "fadeSlideIn 0.25s ease forwards" }}>
                    <label style={styles.label}>Business Name *</label>
                    <input style={styles.input} value={leadForm.businessName} onChange={e => setLeadForm({ ...leadForm, businessName: e.target.value })} placeholder="Enter your business name" />
                  </div>
                  <div style={{ animation: "fadeSlideIn 0.25s ease 0.06s both" }}>
                    <label style={styles.label}>Business Type *</label>
                    <select style={selectStyle} value={leadForm.businessType} onChange={e => setLeadForm({ ...leadForm, businessType: e.target.value })}>
                      <option value="">Select type</option>
                      <option value="Proprietorship">Proprietorship</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Private Limited">Private Limited</option>
                      <option value="LLP">LLP</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </>}

                <div style={{ gridColumn: "1/-1" }}>
                  <label style={styles.label}>Loan Amount Required</label>
                  <input style={styles.input} value={leadForm.amount} onChange={e => setLeadForm({ ...leadForm, amount: e.target.value })} placeholder="e.g. 5,00,000" />
                </div>

                {/* FIX 4: Home Loan employment + conditional fields */}
                {activeLoan === "home" && <>
                  <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 12, margin: "8px 0 2px" }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.28)" }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#C9A84C", letterSpacing: "0.12em", whiteSpace: "nowrap" }}>EMPLOYMENT DETAILS</span>
                    <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.28)" }} />
                  </div>

                  <div>
                    <label style={styles.label}>Monthly Income *</label>
                    <input style={styles.input} value={leadForm.income} onChange={e => setLeadForm({ ...leadForm, income: e.target.value })} placeholder="e.g. ₹60,000" />
                  </div>
                  <div>
                    <label style={styles.label}>Employment Type *</label>
                    <select style={selectStyle} value={leadForm.employment} onChange={e => setLeadForm({ ...leadForm, employment: e.target.value, companyName: "", businessName: "", businessType: "" })}>
                      <option value="">Select type</option>
                      <option value="salaried">Salaried</option>
                      <option value="self-employed">Self-Employed</option>
                      <option value="business">Business Owner</option>
                      <option value="professional">Professional</option>
                    </select>
                  </div>

                  {leadForm.employment === "salaried" && (
                    <div style={{ gridColumn: "1/-1", animation: "fadeSlideIn 0.28s ease forwards" }}>
                      <label style={styles.label}>Company Name (Current Employer) *</label>
                      <input style={styles.input} value={leadForm.companyName} onChange={e => setLeadForm({ ...leadForm, companyName: e.target.value })} placeholder="Enter employer name" />
                    </div>
                  )}

                  {/* FIX 4: Business Owner now also shows business fields */}
                  {(leadForm.employment === "self-employed" || leadForm.employment === "business") && <>
                    <div style={{ animation: "fadeSlideIn 0.28s ease forwards" }}>
                      <label style={styles.label}>Business Name *</label>
                      <input style={styles.input} value={leadForm.businessName} onChange={e => setLeadForm({ ...leadForm, businessName: e.target.value })} placeholder="Enter business name" />
                    </div>
                    <div style={{ animation: "fadeSlideIn 0.28s ease 0.08s both" }}>
                      <label style={styles.label}>Business Type *</label>
                      <select style={selectStyle} value={leadForm.businessType} onChange={e => setLeadForm({ ...leadForm, businessType: e.target.value })}>
                        <option value="">Select type</option>
                        <option value="Proprietorship">Proprietorship</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Private Limited">Private Limited</option>
                        <option value="LLP">LLP</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </>}

                  <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 12, margin: "8px 0 2px" }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.28)" }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#C9A84C", letterSpacing: "0.12em", whiteSpace: "nowrap" }}>PROPERTY DETAILS</span>
                    <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.28)" }} />
                  </div>

                  <div>
                    <label style={styles.label}>Property Type *</label>
                    <select style={selectStyle} value={leadForm.propertyType} onChange={e => setLeadForm({ ...leadForm, propertyType: e.target.value })}>
                      <option value="">Select type</option>
                      <option value="Flat">Flat</option>
                      <option value="Independent House">Independent House</option>
                      <option value="Plot">Plot</option>
                      <option value="Under Construction">Under Construction</option>
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Property Location *</label>
                    <input style={styles.input} value={leadForm.propertyLocation} onChange={e => setLeadForm({ ...leadForm, propertyLocation: e.target.value })} placeholder="City where property is located" />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label style={styles.label}>Property Value (Approx) *</label>
                    <input style={styles.input} value={leadForm.propertyValue} onChange={e => setLeadForm({ ...leadForm, propertyValue: e.target.value })} placeholder="e.g. ₹50,00,000" />
                  </div>
                </>}

              </div>
              <button style={{ ...styles.goldBtn, width: "100%", padding: "14px", fontSize: 16, marginTop: 8 }} className="gold-hover" onClick={handleSubmit}>Submit Application →</button>
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <a href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hi! I need a ${activeLoan} loan. Can you help?`)}`} target="_blank" rel="noreferrer" style={{ color: "#25D366", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>💬 Or apply via WhatsApp</a>
              </div>
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={styles.glassCard}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><span>📊</span> Eligibility Preview</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["Min Income", el.min], ["CIBIL Score", el.cibil], ["Age Criteria", el.age], ["Loan Amount", el.amount]].map(([k, v]) => (
                <div key={k} style={{ padding: 12, background: darkMode ? "rgba(201,168,76,0.06)" : "rgba(201,168,76,0.1)", borderRadius: 10, border: `1px solid ${GOLD}22` }}>
                  <div style={{ fontSize: 11, color: textSub, fontWeight: 600, marginBottom: 4 }}>{k}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: GOLD }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={styles.glassCard}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><span>📁</span> Required Documents</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {docs.map((doc, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, padding: "8px 12px", background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", borderRadius: 8 }}>
                  <div style={{ width: 6, height: 6, background: GOLD, borderRadius: "50%", flexShrink: 0 }} />{doc}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!submitted && <CrossSellBanner activeLoan={activeLoan} GOLD={GOLD} darkMode={darkMode} scrollTo={scrollTo} />}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMI CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════════
function EMISection({ id, styles, darkMode, textSub, GOLD, cardBorder, emiForm, setEmiForm, emi }) {
  const [ref, inView] = useInView(0.2);
  const pieAngle = emi.total > 0 ? (emi.interest / emi.total) * 360 : 0;
  const r = 80, cx = 100, cy = 100;
  const getArc = (start, angle) => {
    const rad = (a) => (a - 90) * Math.PI / 180;
    const x1 = cx + r * Math.cos(rad(start)); const y1 = cy + r * Math.sin(rad(start));
    const x2 = cx + r * Math.cos(rad(start + angle)); const y2 = cy + r * Math.sin(rad(start + angle));
    const la = angle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${la} 1 ${x2} ${y2} Z`;
  };
  return (
    <section id={id} ref={ref} style={{ ...styles.section, background: darkMode ? "rgba(201,168,76,0.03)" : "rgba(201,168,76,0.04)", borderRadius: 32, margin: "0 24px 60px", padding: "80px 60px" }}>
      <div style={{ textAlign: "center", marginBottom: 50 }}>
        <div style={{ ...styles.tag, marginBottom: 16 }}>CALCULATOR</div>
        <h2 style={styles.sectionTitle}>EMI <span style={styles.goldGrad}>Calculator</span></h2>
        <p style={{ color: textSub, fontSize: 16 }}>Plan your loan repayment instantly</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        <div style={styles.glassCard}>
          <style>{`
            .slider { -webkit-appearance: none; width: 100%; height: 6px; border-radius: 3px; background: linear-gradient(90deg, ${GOLD} var(--val, 50%), rgba(255,255,255,0.1) var(--val, 50%)); outline: none; cursor: pointer; }
            .slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: ${GOLD}; border-radius: 50%; box-shadow: 0 0 8px ${GOLD}66; }
          `}</style>
          {[
            { label: "Loan Amount", key: "principal", min: 50000, max: 5000000, step: 50000, prefix: "₹", fmt: true },
            { label: "Interest Rate (%)", key: "rate", min: 6, max: 30, step: 0.5, suffix: "%" },
            { label: "Tenure (Months)", key: "tenure", min: 6, max: 360, step: 6, suffix: " mo" },
          ].map(({ label, key, min, max, step, prefix = "", suffix = "", fmt: doFmt }) => (
            <div key={key} style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <label style={styles.label}>{label}</label>
                <span style={{ fontWeight: 800, color: GOLD, fontSize: 16 }}>{prefix}{doFmt ? Number(emiForm[key]).toLocaleString("en-IN") : emiForm[key]}{suffix}</span>
              </div>
              <input type="range" className="slider" min={min} max={max} step={step} value={emiForm[key]} style={{ "--val": `${((emiForm[key] - min) / (max - min)) * 100}%` }} onChange={e => setEmiForm({ ...emiForm, [key]: Number(e.target.value) })} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: textSub, marginTop: 4 }}>
                <span>{prefix}{doFmt ? Number(min).toLocaleString("en-IN") : min}{suffix}</span>
                <span>{prefix}{doFmt ? Number(max).toLocaleString("en-IN") : max}{suffix}</span>
              </div>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 8 }}>
            {[["Monthly EMI", `₹${Number(emi.emi).toLocaleString("en-IN")}`, "#22c55e"], ["Total Interest", `₹${Number(emi.interest).toLocaleString("en-IN")}`, "#f97316"], ["Total Amount", `₹${Number(emi.total).toLocaleString("en-IN")}`, GOLD]].map(([label, val, color]) => (
              <div key={label} style={{ textAlign: "center", padding: 14, background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: textSub, marginBottom: 4 }}>{label}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={styles.glassCard} className="hover-card">
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Payment Breakdown</div>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <svg width={200} height={200} viewBox="0 0 200 200">
                <path d={getArc(0, 360 - pieAngle)} fill={GOLD} />
                <path d={getArc(360 - pieAngle, pieAngle)} fill="#f97316" />
                <circle cx={cx} cy={cy} r={50} fill={darkMode ? NAVY : "#F0F4FF"} />
                <text x={cx} y={cy - 6} textAnchor="middle" fill={GOLD} fontSize={13} fontWeight="800">EMI</text>
                <text x={cx} y={cy + 12} textAnchor="middle" fill={GOLD} fontSize={12} fontWeight="700">₹{Number(emi.emi).toLocaleString("en-IN")}</text>
              </svg>
              <div>
                {[["Principal", `₹${Number(emiForm.principal).toLocaleString("en-IN")}`, GOLD], ["Interest", `₹${Number(emi.interest).toLocaleString("en-IN")}`, "#f97316"]].map(([l, v, c]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 12, height: 12, background: c, borderRadius: 3 }} />
                    <div><div style={{ fontSize: 12, color: textSub }}>{l}</div><div style={{ fontWeight: 700, color: c }}>{v}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {emi.schedule.length > 0 && (
            <div style={{ ...styles.glassCard, maxHeight: 220, overflowY: "auto" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Amortization Schedule</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ color: GOLD }}>{["Mo", "EMI", "Principal", "Interest", "Balance"].map(h => <th key={h} style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {emi.schedule.map(row => (
                    <tr key={row.month} style={{ borderTop: `1px solid ${cardBorder}` }}>
                      {[row.month, `₹${Number(row.emi).toLocaleString("en-IN")}`, `₹${Number(row.principal).toLocaleString("en-IN")}`, `₹${Number(row.interest).toLocaleString("en-IN")}`, `₹${Number(row.balance).toLocaleString("en-IN")}`].map((v, i) => (
                        <td key={i} style={{ padding: "7px 8px", textAlign: "right", color: i === 0 ? GOLD : textSub }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CIBIL SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function CIBILSection({ id, styles, darkMode, textSub, GOLD, cardBorder, cibilScore, setCibilScore, cibil }) {
  const [form, setForm] = useState({ name: "", pan: "", mobile: "", dob: "" });
  const [checked, setChecked] = useState(false);
  const angle = ((cibilScore - 300) / (900 - 300)) * 180;
  const genScore = () => { const s = Math.floor(Math.random() * 400) + 500; setCibilScore(s); setChecked(true); };
  return (
    <section id={id} style={styles.section}>
      <div style={{ textAlign: "center", marginBottom: 50 }}>
        <div style={{ ...styles.tag, marginBottom: 16 }}>CREDIT CHECK</div>
        <h2 style={styles.sectionTitle}>Check Your <span style={styles.goldGrad}>CIBIL Score</span></h2>
        <p style={{ color: textSub, fontSize: 16 }}>Demo credit score analyzer — API-ready structure</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ ...styles.glassCard, textAlign: "center" }} className="hover-card">
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 24 }}>Credit Score Gauge</div>
          <div style={{ position: "relative", display: "inline-block" }}>
            <svg width={260} height={160} viewBox="0 0 260 160">
              <defs><linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#ef4444" /><stop offset="40%" stopColor="#facc15" /><stop offset="70%" stopColor="#86efac" /><stop offset="100%" stopColor="#22c55e" /></linearGradient></defs>
              <path d="M 20 140 A 110 110 0 0 1 240 140" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={20} strokeLinecap="round" />
              <path d="M 20 140 A 110 110 0 0 1 240 140" fill="none" stroke="url(#gaugeGrad)" strokeWidth={20} strokeLinecap="round" strokeDasharray={`${(angle / 180) * 345} 345`} />
              <line x1={130} y1={140} x2={130 + 90 * Math.cos((angle - 180) * Math.PI / 180)} y2={140 + 90 * Math.sin((angle - 180) * Math.PI / 180)} stroke={cibil.color} strokeWidth={3} strokeLinecap="round" />
              <circle cx={130} cy={140} r={8} fill={cibil.color} />
              <text x={130} y={120} textAnchor="middle" fill={cibil.color} fontSize={32} fontWeight="900">{cibilScore}</text>
              <text x={130} y={152} textAnchor="middle" fill={cibil.color} fontSize={13} fontWeight="700">{cibil.label}</text>
            </svg>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: textSub, margin: "8px 20px 0" }}><span>300 - Poor</span><span>750+ - Excellent</span></div>
          <div style={{ marginTop: 20, padding: 14, background: `${cibil.color}15`, borderRadius: 12, border: `1px solid ${cibil.color}44` }}>
            <div style={{ fontWeight: 700, color: cibil.color }}>Loan Approval Probability: {cibil.chance}%</div>
            <div style={{ fontSize: 12, color: textSub, marginTop: 4 }}>{cibil.chance > 80 ? "Excellent profile! High chance of approval at competitive rates." : cibil.chance > 60 ? "Good profile. Some lenders may offer you a loan." : "Work on improving your score for better offers."}</div>
          </div>
        </div>
        <div style={styles.glassCard}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>Check Your Score</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[["Full Name", "name", "text", "As per PAN"], ["PAN Number", "pan", "text", "ABCDE1234F"], ["Mobile Number", "mobile", "tel", "10-digit"], ["Date of Birth", "dob", "date", ""]].map(([label, key, type, placeholder]) => (
              <div key={key}><label style={styles.label}>{label}</label><input type={type} style={styles.input} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} /></div>
            ))}
            <button style={{ ...styles.goldBtn, width: "100%", padding: "13px", marginTop: 8, fontSize: 15 }} className="gold-hover" onClick={genScore}>🔍 Check Score (Demo)</button>
          </div>
          {checked && (
            <div style={{ marginTop: 16, padding: 14, background: `${GOLD}0F`, borderRadius: 12, border: `1px solid ${GOLD}33`, fontSize: 13 }}>
              <div style={{ fontWeight: 700, color: GOLD, marginBottom: 6 }}>Score Report Ready</div>
              <div style={{ color: textSub, lineHeight: 1.6 }}>Score: <strong style={{ color: cibil.color }}>{cibilScore}</strong> | Category: <strong style={{ color: cibil.color }}>{cibil.label}</strong><br />Best suited for: {cibil.chance > 70 ? "Personal, Business & Home Loans" : cibil.chance > 50 ? "Secured Loans, Gold Loans" : "Secured Loans with guarantor"}</div>
            </div>
          )}
          <div style={{ marginTop: 14, fontSize: 12, color: textSub, lineHeight: 1.5, padding: "10px 14px", background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)", borderRadius: 8 }}>⚠️ This is a demo CIBIL checker. Actual scores are fetched via TransUnion CIBIL API in production.</div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAXATION SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function TaxSection({ id, styles, darkMode, textSub, GOLD, cardBorder, showToast }) {
  const [active, setActive] = useState("itr");
  const [form, setForm] = useState({ name: "", mobile: "", email: "", message: "" });
  const services = [
    { id: "itr", icon: "📋", title: "ITR Filing", desc: "Income Tax Return filing for individuals, salaried, and self-employed. All ITR forms covered.", price: "From ₹499" },
    { id: "gst-reg", icon: "🏛️", title: "GST Registration", desc: "Complete GST registration for new businesses. GSTIN in 3-7 working days.", price: "From ₹999" },
    { id: "gst-return", icon: "📊", title: "GST Return Filing", desc: "Monthly, quarterly, and annual GST return filing. GSTR-1, GSTR-3B, GSTR-9.", price: "From ₹599/mo" },
    { id: "tax-plan", icon: "💡", title: "Tax Planning", desc: "Advanced tax saving strategies. Maximize deductions under 80C, 80D, HRA, and more.", price: "From ₹1,499" },
    { id: "roc", icon: "🏢", title: "ROC Compliance", desc: "Annual return filing, director KYC, and company compliance for Pvt Ltd firms.", price: "From ₹3,999" },
  ];
  const current = services.find(s => s.id === active);
  const handleEnquiry = () => { if (!form.name || !form.mobile) { showToast("Please fill required fields", "error"); return; } showToast("Enquiry submitted! Our tax expert will contact you soon."); setForm({ name: "", mobile: "", email: "", message: "" }); };
  return (
    <section id={id} style={{ ...styles.section, background: darkMode ? "rgba(59,130,246,0.04)" : "rgba(59,130,246,0.04)", borderRadius: 32, margin: "0 24px 60px", padding: "80px 60px" }}>
      <div style={{ textAlign: "center", marginBottom: 50 }}>
        <div style={{ ...styles.tag, marginBottom: 16 }}>TAXATION</div>
        <h2 style={styles.sectionTitle}>Tax & <span style={styles.goldGrad}>Compliance Services</span></h2>
        <p style={{ color: textSub, fontSize: 16 }}>End-to-end taxation solutions for individuals and businesses</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {services.map(s => (
              <div key={s.id} onClick={() => setActive(s.id)} className="hover-card" style={{ ...styles.glassCard, padding: "16px 20px", cursor: "pointer", border: active === s.id ? `1px solid ${GOLD}66` : `1px solid ${cardBorder}`, background: active === s.id ? `linear-gradient(135deg, ${GOLD}0A, ${GOLD}05)` : (darkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.85)") }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: active === s.id ? GOLD : undefined }}>{s.title}</div>
                      {active === s.id && <div style={{ fontSize: 12, color: textSub, marginTop: 4, lineHeight: 1.5 }}>{s.desc}</div>}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, whiteSpace: "nowrap" }}>{s.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={styles.glassCard}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{current.icon} {current.title}</div>
          <div style={{ fontSize: 13, color: textSub, marginBottom: 20, lineHeight: 1.6 }}>{current.desc}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label style={styles.label}>Full Name *</label><input style={styles.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" /></div>
            <div><label style={styles.label}>Mobile *</label><input style={styles.input} value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} placeholder="10-digit mobile" /></div>
            <div><label style={styles.label}>Email</label><input style={styles.input} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" /></div>
            <div><label style={styles.label}>Message</label><textarea style={{ ...styles.input, minHeight: 80, resize: "vertical" }} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Describe your requirement..." /></div>
          </div>
          <button style={{ ...styles.goldBtn, width: "100%", marginTop: 16, padding: "13px" }} className="gold-hover" onClick={handleEnquiry}>📨 Send Enquiry</button>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MUTUAL FUND / SIP SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function MFSection({ id, styles, darkMode, textSub, GOLD, cardBorder, sipForm, setSipForm, sip, showToast }) {
  const [riskProfile, setRiskProfile] = useState("moderate");
  const [form, setForm] = useState({ name: "", mobile: "", amount: "" });
  const funds = [
    { type: "equity", icon: "📈", name: "Equity Funds", risk: "High", returns: "12-15% p.a.", desc: "Market-linked returns. Best for 5+ year horizon.", color: "#3B82F6" },
    { type: "debt", icon: "🏛️", name: "Debt Funds", risk: "Low", returns: "6-8% p.a.", desc: "Stable returns. Ideal for short-medium term goals.", color: "#22c55e" },
    { type: "hybrid", icon: "⚖️", name: "Hybrid Funds", risk: "Medium", returns: "9-12% p.a.", desc: "Balance of equity and debt. Moderate risk profile.", color: GOLD },
    { type: "elss", icon: "🎯", name: "ELSS Funds", risk: "High", returns: "12-15% p.a.", desc: "Tax saving under 80C. 3-year lock-in period.", color: "#A855F7" },
  ];
  const handleEnquiry = () => { if (!form.name || !form.mobile) { showToast("Please fill required fields", "error"); return; } showToast("Investment enquiry submitted! We'll connect you with a certified advisor."); setForm({ name: "", mobile: "", amount: "" }); };
  const years = sipForm.years;
  const bars = Array.from({ length: Math.min(years, 10) }, (_, i) => { const y = Math.floor((i + 1) * years / Math.min(years, 10)); const res = calcSIP(sipForm.monthly, sipForm.rate, y); return { year: y, fv: Number(res.fv), invested: Number(res.invested) }; });
  const maxFV = Math.max(...bars.map(b => b.fv), 1);
  return (
    <section id={id} style={styles.section}>
      <div style={{ textAlign: "center", marginBottom: 50 }}>
        <div style={{ ...styles.tag, marginBottom: 16 }}>INVESTMENTS</div>
        <h2 style={styles.sectionTitle}>Mutual Funds <span style={styles.goldGrad}>& SIP</span></h2>
        <p style={{ color: textSub, fontSize: 16 }}>Build long-term wealth with disciplined investing</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 50 }}>
        {funds.map(f => (
          <div key={f.type} className="hover-card" style={{ ...styles.glassCard, borderTop: `3px solid ${f.color}` }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: f.color }}>{f.name}</div>
            <div style={{ fontSize: 12, color: textSub, marginBottom: 12, lineHeight: 1.5 }}>{f.desc}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ background: `${f.color}18`, padding: "3px 8px", borderRadius: 6, color: f.color, fontWeight: 700 }}>Risk: {f.risk}</span>
              <span style={{ fontWeight: 700, color: f.color }}>{f.returns}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        <div style={styles.glassCard}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 24 }}>📊 SIP Calculator</div>
          <style>{`.sip-slider { -webkit-appearance: none; width: 100%; height: 6px; border-radius: 3px; background: linear-gradient(90deg, #A855F7 var(--val, 50%), rgba(255,255,255,0.1) var(--val, 50%)); outline: none; cursor: pointer; } .sip-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #A855F7; border-radius: 50%; }`}</style>
          {[{ label: "Monthly SIP", key: "monthly", min: 500, max: 100000, step: 500, prefix: "₹", fmt: true }, { label: "Expected Returns (%)", key: "rate", min: 6, max: 30, step: 0.5, suffix: "%" }, { label: "Investment Period", key: "years", min: 1, max: 40, step: 1, suffix: " yrs" }].map(({ label, key, min, max, step, prefix = "", suffix = "", fmt: doFmt }) => (
            <div key={key} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <label style={styles.label}>{label}</label>
                <span style={{ fontWeight: 800, color: "#A855F7", fontSize: 16 }}>{prefix}{doFmt ? Number(sipForm[key]).toLocaleString("en-IN") : sipForm[key]}{suffix}</span>
              </div>
              <input type="range" className="sip-slider" min={min} max={max} step={step} value={sipForm[key]} style={{ "--val": `${((sipForm[key] - min) / (max - min)) * 100}%` }} onChange={e => setSipForm({ ...sipForm, [key]: Number(e.target.value) })} />
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 8 }}>
            {[["Invested", `₹${Number(sip.invested).toLocaleString("en-IN")}`, GOLD], ["Returns", `₹${Number(sip.returns).toLocaleString("en-IN")}`, "#22c55e"], ["Future Value", `₹${Number(sip.fv).toLocaleString("en-IN")}`, "#A855F7"]].map(([l, v, c]) => (
              <div key={l} style={{ textAlign: "center", padding: 12, background: `${c}12`, borderRadius: 10, border: `1px solid ${c}33` }}>
                <div style={{ fontSize: 11, color: textSub, marginBottom: 3 }}>{l}</div>
                <div style={{ fontWeight: 800, fontSize: 13, color: c }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={styles.glassCard} className="hover-card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Growth Projection</div>
            <div style={{ display: "flex", gap: 6, height: 150, alignItems: "flex-end" }}>
              {bars.map((b, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ width: "100%", height: (b.fv / maxFV) * 130, background: `linear-gradient(0deg, #A855F766, #A855F7)`, borderRadius: "4px 4px 0 0", minHeight: 4 }} />
                  <div style={{ fontSize: 9, color: textSub }}>{b.year}y</div>
                </div>
              ))}
            </div>
          </div>
          <div style={styles.glassCard}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Investment Enquiry</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label style={styles.label}>Name *</label><input style={styles.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" /></div>
              <div><label style={styles.label}>Mobile *</label><input style={styles.input} value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} placeholder="Mobile number" /></div>
              <div><label style={styles.label}>Monthly SIP Amount</label><input style={styles.input} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g. ₹5,000" /></div>
            </div>
            <button style={{ ...styles.goldBtn, background: "linear-gradient(135deg,#A855F7,#7C3AED)", width: "100%", marginTop: 14, padding: "13px" }} onClick={handleEnquiry}>📈 Start Investing</button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BANK PARTNERS
// ═══════════════════════════════════════════════════════════════════════════════
function BankSection({ id, styles, darkMode, textSub, GOLD, cardBorder }) {
  const [ref, inView] = useInView(0.2);
  return (
    <section id={id} ref={ref} style={{ ...styles.section, background: darkMode ? "rgba(255,255,255,0.02)" : "rgba(10,15,30,0.03)", borderRadius: 32, margin: "0 24px 60px", padding: "80px 60px" }}>
      <div style={{ textAlign: "center", marginBottom: 50 }}>
        <div style={{ ...styles.tag, marginBottom: 16 }}>NETWORK</div>
        <h2 style={styles.sectionTitle}>Our <span style={styles.goldGrad}>Lending Partners</span></h2>
        <p style={{ color: textSub, fontSize: 16 }}>We work with India's leading banks and financial institutions to find you the best offer</p>
      </div>
      <div style={{ marginBottom: 30 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: "0.08em", marginBottom: 18 }}>BANKS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 16 }}>
          {BANKS.slice(0, 8).map((b, i) => (
            <div key={b.name} className={`hover-card ${inView ? "fade-in" : ""}`} style={{ ...styles.glassCard, padding: 16, textAlign: "center", animationDelay: `${i * 0.05}s` }}>
              <img src={`https://logo.clearbit.com/${b.domain}`} alt={b.name} className="bank-logo" style={{ width: 48, height: 48, objectFit: "contain", margin: "0 auto 8px", display: "block" }} onError={e => { e.target.style.display = "none"; }} />
              <div style={{ fontSize: 10, color: textSub, fontWeight: 600, lineHeight: 1.3 }}>{b.name}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: "0.08em", marginBottom: 18 }}>NBFC</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {NBFCS.map((b, i) => (
            <div key={b.name} className={`hover-card ${inView ? "fade-in" : ""}`} style={{ ...styles.glassCard, padding: 20, textAlign: "center", animationDelay: `${i * 0.08}s` }}>
              <img src={`https://logo.clearbit.com/${b.domain}`} alt={b.name} className="bank-logo" style={{ width: 56, height: 56, objectFit: "contain", margin: "0 auto 10px", display: "block" }} onError={e => { e.target.style.display = "none"; }} />
              <div style={{ fontSize: 12, color: textSub, fontWeight: 600 }}>{b.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGIC PARTNER
// ═══════════════════════════════════════════════════════════════════════════════
function StrategicPartnerSection({ styles, darkMode, textSub, GOLD, cardBorder }) {
  return (
    <section style={{ padding: "0 24px 60px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", background: `linear-gradient(135deg, ${GOLD}12, ${GOLD}06, rgba(10,15,30,0.4))`, border: `1px solid ${GOLD}44`, borderRadius: 28, padding: "50px 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: `${GOLD}08`, borderRadius: "50%", filter: "blur(40px)" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${GOLD}18`, border: `1px solid ${GOLD}44`, borderRadius: 20, padding: "6px 16px", marginBottom: 20 }}>
              <span style={{ fontSize: 16 }}>⭐</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: GOLD, letterSpacing: "0.08em" }}>STRATEGIC ADVISORY PARTNER</span>
            </div>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 900, marginBottom: 14, letterSpacing: "-0.02em" }}>
              Bright Worth Advisors<br />
              <span style={{ background: `linear-gradient(135deg, ${GOLD}, #F5D27A)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Private Limited</span>
            </h2>
            <p style={{ color: textSub, fontSize: 15, lineHeight: 1.7, maxWidth: 540 }}>A premier financial advisory firm providing strategic guidance on wealth management, corporate finance, and business growth. Our partnership ensures clients receive end-to-end financial consulting alongside loan facilitation services.</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 120, height: 120, background: `linear-gradient(135deg, ${GOLD}, #B8862A)`, borderRadius: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: `0 12px 40px ${GOLD}44` }}>
              <div style={{ fontSize: 36 }}>🏆</div>
              <div style={{ fontSize: 11, color: "#0A0F1E", fontWeight: 800, marginTop: 6 }}>CERTIFIED</div>
              <div style={{ fontSize: 10, color: "#0A0F1E", fontWeight: 700 }}>PARTNER</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEO / COVERAGE SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function SEOSection({ styles, darkMode, textSub, GOLD, cardBorder }) {
  const [cardRef, cardInView] = useInView(0.12);
  const [panRef, panInView] = useInView(0.15);
  const cDistricts = useCounter(30, 1600, cardInView);
  const cLoans = useCounter(500, 1800, cardInView);
  const cCustomers = useCounter(1200, 2000, cardInView);
  const cApproval = useCounter(94, 1600, cardInView);
  const odishaCities = ["Bhubaneswar", "Cuttack", "Puri", "Rourkela", "Sambalpur", "Berhampur", "Balasore", "Brahmapur"];
  const odishaServices = [
    { icon: "👤", label: "Personal Loan", detail: "₹50K – ₹40L · From 10.5% p.a." },
    { icon: "🏢", label: "Business Loan", detail: "₹1L – ₹5Cr · Collateral-free" },
    { icon: "🏠", label: "Home Loan", detail: "₹5L – ₹5Cr · Low EMI" },
  ];
  const stats = [
    { val: cDistricts, suffix: "+", label: "Districts", sub: "All of Odisha" },
    { val: cLoans, suffix: "+", label: "Loans", sub: "Facilitated" },
    { val: cCustomers, suffix: "+", label: "Customers", sub: "Satisfied" },
    { val: cApproval, suffix: "%", label: "Approval", sub: "Success Rate" },
  ];
  const panIndiaCities = [
    { name: "Delhi NCR", flag: "🏛️" }, { name: "Mumbai", flag: "🌊" }, { name: "Bengaluru", flag: "💻" },
    { name: "Hyderabad", flag: "💎" }, { name: "Chennai", flag: "🏭" }, { name: "Kolkata", flag: "🎨" },
    { name: "Pune", flag: "🎓" }, { name: "Ahmedabad", flag: "🏗️" }, { name: "Jaipur", flag: "🏯" },
    { name: "Lucknow", flag: "🕌" }, { name: "Surat", flag: "💍" }, { name: "Indore", flag: "📦" },
    { name: "Chandigarh", flag: "🌿" }, { name: "Kochi", flag: "⚓" }, { name: "Nagpur", flag: "🍊" },
    { name: "Patna", flag: "🌾" }, { name: "Bhopal", flag: "🏞️" }, { name: "Visakhapatnam", flag: "⚓" },
    { name: "Coimbatore", flag: "🏭" }, { name: "Vadodara", flag: "🎭" },
  ];
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 100px" }}>
      <div ref={cardRef} style={{ position: "relative", borderRadius: 32, overflow: "hidden", background: darkMode ? "linear-gradient(145deg, #0D1530 0%, #0A0F1E 55%, #111827 100%)" : "linear-gradient(145deg, #F8F9FF 0%, #F0F4FF 100%)", border: `1px solid ${GOLD}30`, boxShadow: darkMode ? `0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px ${GOLD}10, inset 0 1px 0 ${GOLD}15` : `0 20px 60px rgba(10,15,30,0.10), 0 0 0 1px ${GOLD}15`, marginBottom: 56 }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 360, height: 360, background: `radial-gradient(circle, ${GOLD}12 0%, transparent 65%)`, borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 260, height: 260, background: `radial-gradient(circle, ${GOLD}08 0%, transparent 65%)`, borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent 0%, ${GOLD}88 30%, ${GOLD} 50%, ${GOLD}88 70%, transparent 100%)` }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 0, minHeight: 420 }}>
          <div style={{ padding: "52px 52px 52px 56px", borderRight: `1px solid ${GOLD}15` }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${GOLD}16`, border: `1px solid ${GOLD}40`, borderRadius: 24, padding: "5px 15px", marginBottom: 24 }}>
              <span style={{ fontSize: 13 }}>🏠</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: "0.1em" }}>ODISHA HEADQUARTERS</span>
            </div>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 8 }}>
              Serving All{" "}
              <span style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #F5D27A 50%, ${GOLD} 100%)`, backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 5s linear infinite" }}>30 Districts</span>
              {" "}of Odisha
            </h2>
            <p style={{ fontSize: 15, fontWeight: 600, color: darkMode ? "#94A3B8" : "#64748B", marginBottom: 24, letterSpacing: "0.01em" }}>Headquartered in Bhubaneswar. Trusted Across India.</p>
            <p style={{ fontSize: 14, color: textSub, lineHeight: 1.8, maxWidth: 540, marginBottom: 32 }}>One Point Finance Hub is Odisha's most trusted multi-bank loan advisory platform — connecting salaried professionals, self-employed individuals, and business owners with the right loan offers from HDFC Bank, ICICI Bank, Axis Bank, Bajaj Finserv, and 8+ more lenders. Loan amounts from ₹50,000 to ₹5 Crore, with approval in as fast as 24–48 hours across all 30 districts.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 30 }}>
              {odishaCities.map((city, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 15px", borderRadius: 24, background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(10,15,30,0.05)", border: `1px solid ${GOLD}28`, fontSize: 13, fontWeight: 600, color: darkMode ? "#CBD5E1" : "#334155", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${GOLD}66`; e.currentTarget.style.color = GOLD; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `${GOLD}28`; e.currentTarget.style.color = darkMode ? "#CBD5E1" : "#334155"; }}>
                  <span style={{ width: 5, height: 5, background: GOLD, borderRadius: "50%", flexShrink: 0, opacity: 0.8 }} />{city}
                </span>
              ))}
              <span style={{ display: "inline-flex", alignItems: "center", padding: "7px 15px", borderRadius: 24, background: `${GOLD}12`, border: `1px solid ${GOLD}44`, fontSize: 13, fontWeight: 700, color: GOLD }}>+ 22 more districts</span>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 36 }}>
              {odishaServices.map((s, i) => (
                <div key={i} style={{ padding: "10px 18px", borderRadius: 12, background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "rgba(10,15,30,0.09)"}`, backdropFilter: "blur(12px)" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 3 }}>{s.icon} {s.label}</div>
                  <div style={{ fontSize: 11, color: textSub }}>{s.detail}</div>
                </div>
              ))}
            </div>
            <button style={{ ...styles.goldBtn, padding: "13px 32px", fontSize: 15, borderRadius: 12, boxShadow: `0 6px 24px ${GOLD}44`, letterSpacing: "0.01em" }} className="gold-hover" onClick={() => { const el = document.getElementById("loans"); if (el) el.scrollIntoView({ behavior: "smooth" }); }}>Apply for a Loan in Odisha →</button>
          </div>
          <div style={{ padding: "52px 32px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16, background: darkMode ? "rgba(255,255,255,0.02)" : "rgba(201,168,76,0.03)" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: "0.1em", marginBottom: 8, textAlign: "center" }}>TRACK RECORD</div>
            {stats.map(({ val, suffix, label, sub }, i) => (
              <div key={i} style={{ padding: "18px 20px", borderRadius: 16, textAlign: "center", background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)", border: `1px solid ${GOLD}20`, backdropFilter: "blur(16px)", boxShadow: darkMode ? `0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 ${GOLD}12` : `0 2px 12px rgba(201,168,76,0.08)`, transition: "all 0.25s", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${GOLD}55`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${GOLD}20`; e.currentTarget.style.transform = "none"; }}>
                <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, background: `linear-gradient(135deg, ${GOLD}, #F5D27A)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{val}{suffix}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 5, color: darkMode ? "#E2E8F0" : "#1E293B" }}>{label}</div>
                <div style={{ fontSize: 11, color: textSub, marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div ref={panRef}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: "0.1em", marginBottom: 7 }}>🇮🇳 PAN INDIA PRESENCE</div>
            <h3 style={{ fontSize: "clamp(18px, 2.2vw, 26px)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.2 }}>We Also Serve Across India</h3>
          </div>
          <p style={{ fontSize: 13, color: textSub, maxWidth: 340, lineHeight: 1.65, textAlign: "right" }}>Fully digital and remote-friendly. Serving all major metros, Tier-2 cities, and beyond.</p>
        </div>
        <div style={{ height: 1, background: darkMode ? `linear-gradient(90deg, transparent, ${GOLD}22, transparent)` : `linear-gradient(90deg, transparent, rgba(10,15,30,0.1), transparent)`, marginBottom: 28 }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
          {panIndiaCities.map((city, i) => (
            <div key={i} className={panInView ? "fade-in" : ""} style={{ animationDelay: `${i * 0.035}s` }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 50, background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(10,15,30,0.04)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "rgba(10,15,30,0.08)"}`, fontSize: 13, fontWeight: 600, color: darkMode ? "#94A3B8" : "#475569", cursor: "default", transition: "all 0.18s", whiteSpace: "nowrap" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${GOLD}50`; e.currentTarget.style.background = darkMode ? `${GOLD}0D` : `${GOLD}0A`; e.currentTarget.style.color = GOLD; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = darkMode ? "rgba(255,255,255,0.08)" : "rgba(10,15,30,0.08)"; e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.04)" : "rgba(10,15,30,0.04)"; e.currentTarget.style.color = darkMode ? "#94A3B8" : "#475569"; }}>
                <span style={{ fontSize: 13, lineHeight: 1 }}>{city.flag}</span>{city.name}
              </span>
            </div>
          ))}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 50, background: `${GOLD}14`, border: `1px solid ${GOLD}44`, fontSize: 13, fontWeight: 700, color: GOLD }}>🗺️ All 28 States &amp; 8 UTs</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderRadius: 14, flexWrap: "wrap", gap: 12, background: darkMode ? "rgba(255,255,255,0.025)" : "rgba(10,15,30,0.03)", border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(10,15,30,0.07)"}` }}>
          <span style={{ fontSize: 13, color: textSub }}>Don't see your city?{" "}<a href="https://wa.me/919876543210?text=Hi! I need a loan in my city." target="_blank" rel="noreferrer" style={{ color: "#25D366", fontWeight: 700, textDecoration: "none" }}>WhatsApp us — we serve you anyway.</a></span>
          <div style={{ display: "flex", gap: 16, fontSize: 12, color: textSub }}>
            {["Personal Loan", "Business Loan", "Home Loan"].map(l => (
              <span key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 5, height: 5, background: GOLD, borderRadius: "50%", display: "inline-block", opacity: 0.7 }} />{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-DSA SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function SubDSASection({ id, styles, darkMode, textSub, GOLD, cardBorder, subDsaForm, setSubDsaForm, showToast }) {
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = () => { if (!subDsaForm.name || !subDsaForm.mobile || !subDsaForm.email) { showToast("Please fill all required fields", "error"); return; } showToast("Partnership application submitted! We'll contact you within 24 hours."); setSubmitted(true); };
  const benefits = ["Competitive commission structure", "Access to 12+ lending partners", "Training & onboarding support", "Dedicated relationship manager", "Marketing collateral provided", "Real-time lead tracking portal"];
  return (
    <section id={id} style={{ ...styles.section, background: darkMode ? "rgba(201,168,76,0.04)" : "rgba(201,168,76,0.06)", borderRadius: 32, margin: "0 24px 60px", padding: "80px 60px" }}>
      <div style={{ textAlign: "center", marginBottom: 50 }}>
        <div style={{ ...styles.tag, marginBottom: 16 }}>GROW WITH US</div>
        <h2 style={styles.sectionTitle}>Partner With Us — <span style={styles.goldGrad}>Join Our Loan Partner Network</span></h2>
        <p style={{ color: textSub, fontSize: 16, maxWidth: 600, margin: "0 auto" }}>Join our growing network of loan advisory partners across Odisha and earn attractive commissions on every successful loan disbursal.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        <div>
          <div style={{ ...styles.glassCard, marginBottom: 24 }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Why Join Our Partner Network?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {benefits.map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: darkMode ? "rgba(201,168,76,0.06)" : "rgba(201,168,76,0.1)", borderRadius: 10 }}>
                  <span style={{ color: GOLD, fontWeight: 900, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: textSub, lineHeight: 1.5 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...styles.glassCard, background: `linear-gradient(135deg, ${GOLD}0A, ${GOLD}05)`, border: `1px solid ${GOLD}33` }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>💰</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Earn Up to ₹50,000/Month</div>
            <div style={{ color: textSub, fontSize: 14, lineHeight: 1.6 }}>Top-performing partners in our network earn ₹30,000–₹50,000 per month by referring just 5–8 loans. Commission paid within 7 days of disbursal.</div>
          </div>
        </div>
        <div style={styles.glassCard}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 60, marginBottom: 20 }}>🤝</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Application Received!</div>
              <div style={{ color: textSub, marginBottom: 24 }}>Our partnership team will connect with you within 24 hours.</div>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 24 }}>Loan Partner Application Form</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[["Full Name", "name", "text", true], ["Mobile Number", "mobile", "tel", true], ["Email Address", "email", "email", true], ["City", "city", "text", false]].map(([label, key, type, required]) => (
                  <div key={key}>
                    <label style={styles.label}>{label} {required && "*"}</label>
                    <input type={type} style={styles.input} value={subDsaForm[key]} onChange={e => setSubDsaForm({ ...subDsaForm, [key]: e.target.value })} placeholder={label} />
                  </div>
                ))}
                <div>
                  <label style={styles.label}>Experience in Loan Sales</label>
                  <select style={{ ...styles.input, cursor: "pointer", backgroundColor: "#0f172a", color: "#F0F4FF" }} value={subDsaForm.experience} onChange={e => setSubDsaForm({ ...subDsaForm, experience: e.target.value })}>
                    <option value="">Select experience</option>
                    <option>Fresher (0-1 year)</option>
                    <option>1-3 years</option>
                    <option>3-5 years</option>
                    <option>5+ years</option>
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Current Monthly Leads</label>
                  <select style={{ ...styles.input, cursor: "pointer", backgroundColor: "#0f172a", color: "#F0F4FF" }} value={subDsaForm.leads} onChange={e => setSubDsaForm({ ...subDsaForm, leads: e.target.value })}>
                    <option value="">Select range</option>
                    <option>1-5 leads/month</option>
                    <option>5-15 leads/month</option>
                    <option>15-30 leads/month</option>
                    <option>30+ leads/month</option>
                  </select>
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={styles.label}>Existing Lender Connections (Optional)</label>
                  <input style={styles.input} value={subDsaForm.tieups} onChange={e => setSubDsaForm({ ...subDsaForm, tieups: e.target.value })} placeholder="e.g. HDFC, Bajaj, etc." />
                </div>
              </div>
              <button style={{ ...styles.goldBtn, width: "100%", marginTop: 20, padding: "14px", fontSize: 16 }} className="gold-hover" onClick={handleSubmit}>🤝 Submit Partnership Application</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTACT WIDGET
// ═══════════════════════════════════════════════════════════════════════════════
function ContactWidget({ GOLD }) {
  const [open, setOpen] = useState(false);
  const actions = [
    { icon: "📞", label: "Call Us", sub: "+91 98765 43210", href: "tel:+919876543210", bg: "linear-gradient(135deg,#3B82F6,#1D4ED8)", shadow: "rgba(59,130,246,0.45)" },
    { icon: "💬", label: "WhatsApp", sub: "Chat instantly", href: "https://wa.me/919876543210?text=Hi! I need financial assistance.", bg: "linear-gradient(135deg,#25D366,#128C7E)", shadow: "rgba(37,211,102,0.45)" },
    { icon: "✉️", label: "Email Us", sub: "info@onepointfinancehub.com", href: "mailto:info@onepointfinancehub.com", bg: "linear-gradient(135deg,#F59E0B,#D97706)", shadow: "rgba(245,158,11,0.45)" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 28, right: 24, zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
      {open && actions.map((a, i) => (
        <a key={i} href={a.href} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", cursor: "pointer", animation: `fadeUp 0.25s ease ${i * 0.06}s both` }}>
          <div style={{ padding: "8px 16px", borderRadius: 24, background: "rgba(10,15,30,0.88)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F0F4FF", lineHeight: 1.2 }}>{a.label}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>{a.sub}</div>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: `0 6px 20px ${a.shadow}`, transition: "transform 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            {a.icon}
          </div>
        </a>
      ))}
      <button onClick={() => setOpen(!open)} style={{ width: 58, height: 58, borderRadius: "50%", border: "none", cursor: "pointer", background: open ? "linear-gradient(135deg,#475569,#334155)" : `linear-gradient(135deg, ${GOLD}, #B8862A)`, boxShadow: open ? "0 6px 24px rgba(0,0,0,0.4)" : `0 6px 28px ${GOLD}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, transition: "all 0.3s cubic-bezier(.4,0,.2,1)", transform: open ? "rotate(45deg)" : "rotate(0deg)", animation: open ? "none" : "pulseGold 2.5s infinite" }}>
        {open ? "✕" : "₹"}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRUST PILLARS
// ═══════════════════════════════════════════════════════════════════════════════
function TrustSection({ styles, darkMode, textSub, GOLD, cardBorder }) {
  const [ref, inView] = useInView(0.15);
  const pillars = [
    { icon: "🏦", title: "Multi-Lender Network Access", desc: "Access to leading banks and NBFCs for better approval chances.", color: "#3B82F6", glow: "rgba(59,130,246,0.15)" },
    { icon: "🤝", title: "Dedicated Relationship Manager", desc: "Personalized support from application to disbursal.", color: GOLD, glow: "rgba(201,168,76,0.15)" },
    { icon: "🔒", title: "100% Digital & Secure Process", desc: "End-to-end encrypted documentation and processing.", color: "#22c55e", glow: "rgba(34,197,94,0.15)" },
    { icon: "🛡️", title: "End-to-End Support", desc: "Assistance until loan disbursal and post-approval guidance.", color: "#A855F7", glow: "rgba(168,85,247,0.15)" },
  ];
  return (
    <section ref={ref} style={{ padding: "80px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ ...styles.tag, marginBottom: 16 }}>OUR PROMISE</div>
        <h2 style={styles.sectionTitle}>Why Choose <span style={styles.goldGrad}>One Point Finance Hub?</span></h2>
        <p style={{ color: textSub, fontSize: 16, maxWidth: 500, margin: "0 auto" }}>Your trusted financial advisory partner across Pan India</p>
      </div>
      <div className="trust-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
        {pillars.map((p, i) => (
          <div key={p.title} className="hover-card" style={{ ...styles.glassCard, padding: "32px 24px", textAlign: "center", position: "relative", overflow: "hidden", border: `1px solid ${p.color}22`, animation: inView ? `fadeUp 0.6s ease ${i * 0.12}s forwards` : "none", opacity: inView ? 1 : 0, cursor: "default", transition: "transform 0.3s, box-shadow 0.3s, border-color 0.3s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 16px 50px ${p.glow}`; e.currentTarget.style.borderColor = `${p.color}55`; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = darkMode ? "0 8px 40px rgba(0,0,0,0.4)" : "0 8px 40px rgba(10,15,30,0.08)"; e.currentTarget.style.borderColor = `${p.color}22`; }}>
            <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", width: 100, height: 100, background: `radial-gradient(circle, ${p.glow} 0%, transparent 70%)`, borderRadius: "50%", pointerEvents: "none" }} />
            <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg, ${p.color}22, ${p.color}0d)`, border: `1px solid ${p.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px", boxShadow: `0 4px 20px ${p.glow}` }}>{p.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10, lineHeight: 1.3 }}>{p.title}</div>
            <div style={{ fontSize: 13, color: textSub, lineHeight: 1.65 }}>{p.desc}</div>
            <div style={{ position: "absolute", bottom: 0, left: "20%", right: "20%", height: 2, background: `linear-gradient(90deg, transparent, ${p.color}66, transparent)`, borderRadius: 2 }} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTIMONIALS
// ═══════════════════════════════════════════════════════════════════════════════
function TestimonialSection({ styles, darkMode, textSub, GOLD, cardBorder }) {
  const [ref, inView] = useInView(0.1);
  const [active, setActive] = useState(0);
  const touchStart = useRef(null);
  const testimonials = [
    { name: "Rahul S.", city: "Bhubaneswar", loanType: "Personal Loan", text: "Smooth process, quick approval, and excellent support throughout. Got my loan disbursed within 3 days of application.", rating: 5, avatar: "RS", color: "#3B82F6" },
    { name: "Priya M.", city: "Cuttack", loanType: "Home Loan", text: "Got the best interest rate through their multi-bank network. The team was incredibly professional and guided me at every step.", rating: 5, avatar: "PM", color: GOLD },
    { name: "Amit K.", city: "Rourkela", loanType: "Business Loan", text: "Professional team and fast processing. My business loan was approved despite a complex financial structure.", rating: 5, avatar: "AK", color: "#22c55e" },
    { name: "Sunita R.", city: "Bhubaneswar", loanType: "Personal Loan", text: "One Point Finance Hub made the entire loan process hassle-free. Very transparent and no hidden charges whatsoever.", rating: 5, avatar: "SR", color: "#A855F7" },
    { name: "Deepak N.", city: "Sambalpur", loanType: "Home Loan", text: "Excellent advisory service. They matched me with the right lender for my profile and saved me significantly on interest.", rating: 5, avatar: "DN", color: "#f97316" },
  ];
  useEffect(() => { if (!inView) return; const t = setInterval(() => setActive(a => (a + 1) % testimonials.length), 3500); return () => clearInterval(t); }, [inView]);
  const handleTouchStart = e => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = e => { if (!touchStart.current) return; const diff = touchStart.current - e.changedTouches[0].clientX; if (Math.abs(diff) > 50) setActive(a => diff > 0 ? (a + 1) % testimonials.length : (a - 1 + testimonials.length) % testimonials.length); touchStart.current = null; };
  return (
    <section ref={ref} style={{ padding: "80px 24px", background: darkMode ? "rgba(201,168,76,0.025)" : "rgba(201,168,76,0.04)", borderTop: `1px solid ${cardBorder}`, borderBottom: `1px solid ${cardBorder}` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ ...styles.tag, marginBottom: 16 }}>CLIENT STORIES</div>
          <h2 style={styles.sectionTitle}>What Our <span style={styles.goldGrad}>Clients Say</span></h2>
          <p style={{ color: textSub, fontSize: 16, maxWidth: 500, margin: "0 auto" }}>Real experiences from real customers across Pan India</p>
        </div>
        <div style={{ position: "relative" }}>
          <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[0, 1, 2].map(offset => {
              const idx = (active + offset) % testimonials.length;
              const t = testimonials[idx];
              const isCenter = offset === 1;
              return (
                <div key={idx} className="hover-card" style={{ ...styles.glassCard, padding: "28px 24px", border: isCenter ? `2px solid ${GOLD}55` : `1px solid ${cardBorder}`, transform: isCenter ? "scale(1.03)" : "scale(0.97)", opacity: isCenter ? 1 : 0.75, transition: "all 0.4s ease", boxShadow: isCenter ? `0 16px 50px ${GOLD}20` : undefined }}>
                  <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>{[...Array(t.rating)].map((_, i) => <span key={i} style={{ color: GOLD, fontSize: 16 }}>★</span>)}</div>
                  <div style={{ fontSize: 32, color: `${GOLD}33`, fontFamily: "Georgia, serif", lineHeight: 1, marginBottom: 4 }}>"</div>
                  <p style={{ fontSize: 14, color: textSub, lineHeight: 1.75, marginBottom: 20, fontStyle: "italic" }}>{t.text}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16, borderTop: `1px solid ${cardBorder}` }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${t.color}33, ${t.color}11)`, border: `1px solid ${t.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: t.color }}>{t.avatar}</div>
                    <div><div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div><div style={{ fontSize: 12, color: textSub }}>{t.city} · <span style={{ color: GOLD, fontWeight: 600 }}>{t.loanType}</span></div></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 28 }}>
            {testimonials.map((_, i) => <button key={i} onClick={() => setActive(i)} style={{ width: active === i ? 24 : 8, height: 8, borderRadius: 4, border: "none", cursor: "pointer", transition: "all 0.3s", background: active === i ? GOLD : `${GOLD}44` }} />)}
          </div>
          <button onClick={() => setActive(a => (a - 1 + testimonials.length) % testimonials.length)} style={{ position: "absolute", left: -20, top: "45%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", border: `1px solid ${cardBorder}`, background: darkMode ? "rgba(10,15,30,0.8)" : "rgba(240,244,255,0.9)", color: GOLD, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}>‹</button>
          <button onClick={() => setActive(a => (a + 1) % testimonials.length)} style={{ position: "absolute", right: -20, top: "45%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", border: `1px solid ${cardBorder}`, background: darkMode ? "rgba(10,15,30,0.8)" : "rgba(240,244,255,0.9)", color: GOLD, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}>›</button>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STICKY MOBILE CTA
// ═══════════════════════════════════════════════════════════════════════════════
function StickyMobileCTA({ GOLD, scrollTo }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const onScroll = () => setVisible(window.scrollY > 300); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll); }, []);
  return (
    <div className="sticky-mobile-cta" style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 998, background: "rgba(10,15,30,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(201,168,76,0.25)", padding: "10px 16px", gap: 10, transform: visible ? "translateY(0)" : "translateY(100%)", transition: "transform 0.35s cubic-bezier(.4,0,.2,1)" }}>
      <button onClick={() => scrollTo("loans")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", background: `linear-gradient(135deg, ${GOLD}, #B8862A)`, border: "none", borderRadius: 12, fontWeight: 800, fontSize: 14, color: "#0A0F1E", cursor: "pointer", fontFamily: "inherit", boxShadow: `0 4px 18px ${GOLD}44` }}>🚀 Apply Now</button>
      <a href="https://wa.me/919876543210?text=Hi!%20I%20need%20a%20loan." target="_blank" rel="noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", background: "linear-gradient(135deg,#25D366,#128C7E)", borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: 14, color: "#fff", boxShadow: "0 4px 18px rgba(37,211,102,0.35)" }}>💬 WhatsApp Us</a>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CROSS-SELL BANNER
// ═══════════════════════════════════════════════════════════════════════════════
function CrossSellBanner({ activeLoan, GOLD, darkMode, scrollTo }) {
  const banners = {
    personal: { icon: "🛡️", text: "Approved for loan? Secure your family with Term Insurance.", cta: "Explore Term Insurance" },
    home: { icon: "🏠", text: "Protect your property with Home Insurance coverage.", cta: "Get Home Insurance" },
    business: { icon: "🏢", text: "Safeguard your business with SME Insurance.", cta: "Explore Business Insurance" },
  };
  const b = banners[activeLoan] || banners.personal;
  return (
    <div style={{ marginTop: 28, padding: "18px 24px", background: `linear-gradient(135deg, ${GOLD}12, ${GOLD}06)`, border: `1px solid ${GOLD}33`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 26 }}>{b.icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: darkMode ? "#F0F4FF" : "#0A0F1E" }}>{b.text}</div>
          <div style={{ fontSize: 12, color: GOLD, marginTop: 2 }}>Advisory Services · One Point Finance Hub</div>
        </div>
      </div>
      <button onClick={() => scrollTo("insurance")} style={{ background: `linear-gradient(135deg, ${GOLD}, #B8862A)`, color: "#0A0F1E", border: "none", borderRadius: 9, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>{b.cta} →</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSURANCE SECTION
// ═══════════════════════════════════════════════════════════════════════════════
const INSURANCE_PROVIDERS = [
  { name: "HDFC Life", domain: "hdfclife.com", color: "#E8192C", glow: "rgba(232,25,44,0.2)" },
  { name: "ICICI Prudential", domain: "iciciprulife.com", color: "#F58220", glow: "rgba(245,130,32,0.2)" },
  { name: "Tata AIA", domain: "tataaia.com", color: "#00539B", glow: "rgba(0,83,155,0.2)" },
  { name: "Max Life", domain: "maxlifeinsurance.com", color: "#E31837", glow: "rgba(227,24,55,0.2)" },
  { name: "SBI Life", domain: "sbilife.co.in", color: "#2D6DB5", glow: "rgba(45,109,181,0.2)" },
  { name: "Star Health", domain: "starhealth.in", color: "#E8192C", glow: "rgba(232,25,44,0.2)" },
  { name: "Niva Bupa", domain: "nivabupa.com", color: "#00A651", glow: "rgba(0,166,81,0.2)" },
];

function InsuranceSection({ id, styles, darkMode, textSub, GOLD, cardBorder, activeInsurance, setActiveInsurance, insuranceForm, setInsuranceForm, insuranceSubmitted, setInsuranceSubmitted, showToast, scrollTo }) {
  const [ref, inView] = useInView(0.1);
  const [activeFaq, setActiveFaq] = useState(null);
  const insuranceTypes = [
    { key: "health", icon: "❤️", label: "Health Insurance", color: "#22c55e", desc: "Individual, Family Floater & Senior Citizen Plans" },
    { key: "term", icon: "🛡️", label: "Term Life Insurance", color: "#3B82F6", desc: "Pure Term, High Coverage & Income Replacement" },
    { key: "motor", icon: "🚗", label: "Motor Insurance", color: GOLD, desc: "Car, Bike & Renewal Assistance" },
    { key: "business", icon: "🏢", label: "Business Insurance", color: "#A855F7", desc: "SME, Liability & Shop Insurance" },
  ];
  const details = {
    health: {
      subTypes: ["Individual Plan", "Family Floater", "Senior Citizen"],
      benefits: ["Cashless hospitalisation at 10,000+ network hospitals", "Pre & post-hospitalisation coverage", "No-claim bonus up to 50%", "Day-care procedures covered", "Annual health check-up included"],
      comparisons: [
        { name: "Individual Plan", coverage: "₹3L – ₹1Cr", premium: "Starting from ₹4,500/yr", features: ["Single person coverage", "Portable across jobs", "Tax benefit u/s 80D"], idealFor: "Young professionals" },
        { name: "Family Floater", coverage: "₹5L – ₹1Cr", premium: "Starting from ₹12,000/yr", features: ["Entire family on one policy", "Shared sum insured", "Cost-effective option"], idealFor: "Families with 2-4 members" },
        { name: "Super Top-Up", coverage: "₹10L – ₹2Cr", premium: "Starting from ₹3,500/yr", features: ["Activates after deductible", "Low premium, high coverage", "Ideal as base plan booster"], idealFor: "Those with existing base cover" },
      ],
      faqs: [
        { q: "Is pre-existing disease covered?", a: "Most health insurance plans cover pre-existing diseases after a waiting period of 2–4 years, depending on the insurer and plan." },
        { q: "Can I buy health insurance for my parents?", a: "Yes, most insurers offer senior citizen health plans. Our advisors can help you compare options with the best coverage for your parents' age and health profile." },
        { q: "What is the ideal sum insured for a family of 4?", a: "For a family of 4 in a metro city, we recommend a minimum sum insured of ₹10–15 Lakhs, given rising medical costs." },
      ],
    },
    term: {
      subTypes: ["Pure Term Plan", "Return of Premium", "Income Replacement"],
      benefits: ["High life cover at low premium", "Income tax benefit u/s 80C & 10(10D)", "Critical illness rider available", "Accidental death benefit", "Premium waiver on disability"],
      comparisons: [
        { name: "Pure Term Plan", coverage: "₹50L – ₹10Cr", premium: "Starting from ₹6,000/yr", features: ["Highest coverage, lowest cost", "Death benefit to nominee", "Tax-free payout"], idealFor: "Young earning individuals" },
        { name: "Return of Premium", coverage: "₹50L – ₹5Cr", premium: "Starting from ₹14,000/yr", features: ["All premiums returned on survival", "Life cover + savings element", "Zero net cost if you survive"], idealFor: "Risk-averse policyholders" },
        { name: "Income Replacement", coverage: "Monthly payout", premium: "Starting from ₹8,500/yr", features: ["Monthly income to family", "Replaces salary post death", "Can be combined with lump sum"], idealFor: "Primary breadwinners" },
      ],
      faqs: [
        { q: "How much term cover do I need?", a: "A general thumb rule is 10–15x your annual income. Our advisors will help calculate the right amount based on your liabilities and family needs." },
        { q: "Is term insurance purely a death benefit?", a: "Standard term plans provide death benefit only. However, Return of Premium (ROP) variants return all premiums paid if you survive the policy term." },
        { q: "Can NRIs buy term insurance in India?", a: "Yes, most insurers offer term plans to NRIs subject to eligibility norms and medical underwriting." },
      ],
    },
    motor: {
      subTypes: ["Car Insurance", "Bike Insurance", "Renewal Support"],
      benefits: ["Third-party liability (mandatory by law)", "Own damage protection", "Zero depreciation add-on available", "Roadside assistance", "Cashless garage network"],
      comparisons: [
        { name: "Third Party Cover", coverage: "As per Motor Act", premium: "Starting from ₹2,094/yr", features: ["Legally mandatory", "Covers damage to third party", "Fixed govt. premium rates"], idealFor: "Budget-conscious vehicle owners" },
        { name: "Comprehensive Cover", coverage: "Market/IDV value", premium: "Starting from ₹5,500/yr", features: ["Own damage + third party", "Theft & fire coverage", "Natural calamity protection"], idealFor: "New car / bike owners" },
        { name: "Zero Depreciation", coverage: "Full repair cost", premium: "Starting from ₹8,000/yr", features: ["No depreciation deduction", "Higher claim value", "Best for new vehicles"], idealFor: "Premium vehicle owners" },
      ],
      faqs: [
        { q: "Is motor insurance mandatory in India?", a: "Yes, third-party motor insurance is mandatory under the Motor Vehicles Act. Driving without it can lead to fines and legal action." },
        { q: "What is IDV in motor insurance?", a: "Insured Declared Value (IDV) is the current market value of your vehicle and represents the maximum claim amount for total loss or theft." },
        { q: "Can I renew an expired policy?", a: "Yes, but you may need a vehicle inspection. We assist in quick renewal even for lapsed policies." },
      ],
    },
    business: {
      subTypes: ["SME Insurance", "Liability Insurance", "Shop Insurance"],
      benefits: ["Protection against fire & natural disasters", "Burglary & theft coverage", "Public liability protection", "Business interruption coverage", "Stock & inventory protection"],
      comparisons: [
        { name: "SME Package Policy", coverage: "₹10L – ₹5Cr", premium: "Starting from ₹8,000/yr", features: ["Property + liability combo", "Multi-location coverage", "Customisable sum insured"], idealFor: "Small & medium enterprises" },
        { name: "Liability Insurance", coverage: "₹25L – ₹10Cr", premium: "Starting from ₹12,000/yr", features: ["Third-party bodily injury", "Property damage cover", "Legal defence costs"], idealFor: "Service businesses, consultants" },
        { name: "Shopkeeper Policy", coverage: "₹2L – ₹1Cr", premium: "Starting from ₹3,500/yr", features: ["Retail shop all-risk cover", "Cash & stock protection", "Plate glass coverage"], idealFor: "Retail shop owners" },
      ],
      faqs: [
        { q: "Is business insurance tax deductible?", a: "Yes, business insurance premiums are generally deductible as a business expense under Income Tax provisions. Consult your CA for specifics." },
        { q: "What does business interruption cover?", a: "It compensates for loss of income if your business operations are disrupted due to an insured event like fire or flood." },
        { q: "Can a home-based business get coverage?", a: "Yes, specific policies cover home-based businesses. Standard home insurance typically does not cover business equipment or liability." },
      ],
    },
  };
  const currentDetail = details[activeInsurance];
  const currentType = insuranceTypes.find(t => t.key === activeInsurance);
  const handleInsSubmit = async () => {
    if (!insuranceForm.name || !insuranceForm.mobile) { showToast("Please fill required fields", "error"); return; }
    const crmPayload = { timestamp: new Date().toISOString(), fullName: insuranceForm.name, mobile: insuranceForm.mobile, city: insuranceForm.city, productType: "Insurance", loanType: insuranceForm.insuranceType, monthlyIncome: "", employmentType: "", leadSource: "Website", leadStatus: "New", assignedAgent: "", followUpDate: "", notes: `Age: ${insuranceForm.age}, Sum Assured: ${insuranceForm.sumAssured}, Existing Policy: ${insuranceForm.existingPolicy}` };
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(crmPayload),
      });
    } catch (err) {
      console.error("Insurance form submission error:", err);
    }
    showToast("Enquiry submitted! Our advisor will contact you shortly.");
    setInsuranceSubmitted(true);
  };
  return (
    <section id={id} ref={ref} style={styles.section}>
      <div style={{ textAlign: "center", marginBottom: 50 }}>
        <div style={{ ...styles.tag, marginBottom: 16 }}>INSURANCE ADVISORY SERVICES</div>
        <h2 style={styles.sectionTitle}>Protect What <span style={styles.goldGrad}>Matters Most</span></h2>
        <p style={{ color: textSub, fontSize: 16, maxWidth: 540, margin: "0 auto 28px" }}>Compare insurance options from leading providers with expert advisory support.</p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => document.getElementById("ins-form").scrollIntoView({ behavior: "smooth" })} style={{ ...styles.goldBtn, padding: "13px 28px", fontSize: 15, borderRadius: 12 }}>🎯 Get Free Quote</button>
          <a href="https://wa.me/919876543210?text=Hi!%20I%20need%20insurance%20advisory%20services." target="_blank" rel="noreferrer" style={{ ...styles.goldBtn, background: "linear-gradient(135deg,#25D366,#128C7E)", textDecoration: "none", padding: "13px 28px", fontSize: 15, borderRadius: 12 }}>💬 Talk to Advisor</a>
        </div>
      </div>
      <div className="ins-cat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 48 }}>
        {insuranceTypes.map((t) => (
          <div key={t.key} onClick={() => setActiveInsurance(t.key)} className="hover-card" style={{ ...styles.glassCard, cursor: "pointer", border: activeInsurance === t.key ? `2px solid ${t.color}` : `1px solid ${cardBorder}`, background: activeInsurance === t.key ? `${t.color}10` : undefined, textAlign: "center", padding: "28px 20px", transition: "all 0.3s" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{t.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6, color: activeInsurance === t.key ? t.color : undefined }}>{t.label}</div>
            <div style={{ fontSize: 12, color: textSub, lineHeight: 1.5 }}>{t.desc}</div>
            {activeInsurance === t.key && <div style={{ marginTop: 10, fontSize: 11, color: t.color, fontWeight: 700 }}>▼ SELECTED</div>}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 36 }}>
        {currentDetail.subTypes.map(sub => <div key={sub} style={{ padding: "7px 16px", borderRadius: 20, background: `${currentType.color}15`, border: `1px solid ${currentType.color}44`, fontSize: 13, fontWeight: 600, color: currentType.color }}>{sub}</div>)}
      </div>
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Compare Plans</div>
        <div className="ins-compare-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {currentDetail.comparisons.map((plan, i) => (
            <div key={plan.name} className="hover-card" style={{ ...styles.glassCard, border: i === 1 ? `2px solid ${GOLD}` : `1px solid ${cardBorder}`, position: "relative", overflow: "hidden" }}>
              {i === 1 && <div style={{ position: "absolute", top: 0, right: 0, background: `linear-gradient(135deg,${GOLD},#B8862A)`, color: "#0A0F1E", fontSize: 10, fontWeight: 800, padding: "4px 12px", borderBottomLeftRadius: 10 }}>POPULAR</div>}
              <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>{plan.name}</div>
              <div style={{ fontSize: 13, color: textSub, marginBottom: 16 }}>Ideal for: <span style={{ color: GOLD, fontWeight: 600 }}>{plan.idealFor}</span></div>
              <div style={{ padding: "10px 14px", background: "rgba(34,197,94,0.08)", borderRadius: 10, marginBottom: 12, border: "1px solid rgba(34,197,94,0.2)" }}>
                <div style={{ fontSize: 11, color: textSub, marginBottom: 2 }}>COVERAGE</div>
                <div style={{ fontWeight: 800, color: "#22c55e", fontSize: 16 }}>{plan.coverage}</div>
              </div>
              <div style={{ padding: "10px 14px", background: `${GOLD}0d`, borderRadius: 10, marginBottom: 16, border: `1px solid ${GOLD}22` }}>
                <div style={{ fontSize: 11, color: textSub, marginBottom: 2 }}>ESTIMATED PREMIUM</div>
                <div style={{ fontWeight: 700, color: GOLD, fontSize: 14 }}>{plan.premium}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18 }}>
                {plan.features.map(f => <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: textSub }}><span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0 }}>✓</span>{f}</div>)}
              </div>
              <div style={{ fontSize: 11, color: textSub, padding: "8px 12px", background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)", borderRadius: 8, marginBottom: 16 }}>📊 Claim settlement data available from IRDAI public disclosures</div>
              <button onClick={() => document.getElementById("ins-form").scrollIntoView({ behavior: "smooth" })} style={{ ...styles.goldBtn, width: "100%", padding: "11px", fontSize: 14, borderRadius: 10 }}>Get Quote →</button>
            </div>
          ))}
        </div>
      </div>
      <div className="ins-benefit-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 48 }}>
        <div style={styles.glassCard}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}><span style={{ color: currentType.color }}>{currentType.icon}</span> Key Benefits</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {currentDetail.benefits.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px", background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderRadius: 10 }}>
                <div style={{ width: 22, height: 22, background: `${currentType.color}20`, border: `1px solid ${currentType.color}44`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, color: currentType.color, fontWeight: 800 }}>{i + 1}</div>
                <span style={{ fontSize: 13, lineHeight: 1.6, color: textSub }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={styles.glassCard}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Why Choose Our Advisory?</div>
          {[{ icon: "🔍", title: "Unbiased Comparison", desc: "We compare plans across multiple insurers to find the best fit." }, { icon: "📞", title: "Dedicated Advisor", desc: "One point of contact for all your insurance needs." }, { icon: "⚡", title: "Fast Processing", desc: "Policy issuance assistance within 24–48 hours." }, { icon: "🔒", title: "Claim Support", desc: "We assist you throughout the claim process." }, { icon: "📋", title: "Documentation Help", desc: "Our team handles paperwork so you don't have to." }].map(item => (
            <div key={item.title} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: textSub, lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Frequently Asked Questions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {currentDetail.faqs.map((faq, i) => (
            <div key={i} style={{ ...styles.glassCard, padding: "18px 22px", cursor: "pointer" }} onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, fontSize: 15 }}>
                {faq.q}
                <span style={{ color: GOLD, fontSize: 18, transition: "transform 0.3s", display: "inline-block", transform: activeFaq === i ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
              </div>
              {activeFaq === i && <div style={{ marginTop: 12, fontSize: 14, color: textSub, lineHeight: 1.7, borderTop: `1px solid ${cardBorder}`, paddingTop: 12 }}>{faq.a}</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...styles.glassCard, marginBottom: 48 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Access to Leading Insurance Providers</div>
          <div style={{ fontSize: 13, color: textSub }}>Policies facilitated through our advisory network.</div>
        </div>
        <div className="ins-provider-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 14, marginBottom: 16 }}>
          {INSURANCE_PROVIDERS.map(p => (
            <div key={p.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "18px 10px", borderRadius: 16, background: darkMode ? `linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))` : `linear-gradient(145deg, #ffffff, #f8f9ff)`, border: `1.5px solid ${p.color}44`, boxShadow: `0 4px 20px ${p.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`, transition: "all 0.25s ease", cursor: "default", position: "relative", overflow: "hidden" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 32px ${p.glow}, 0 0 0 1.5px ${p.color}88`; e.currentTarget.style.borderColor = `${p.color}88`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 20px ${p.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`; e.currentTarget.style.borderColor = `${p.color}44`; }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${p.color}99, transparent)`, borderRadius: "16px 16px 0 0" }} />
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${p.color}12`, border: `1px solid ${p.color}30`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <img src={`https://logo.clearbit.com/${p.domain}`} alt={p.name} width={32} height={32} style={{ objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: darkMode ? "#E2E8F0" : "#1E293B", textAlign: "center", lineHeight: 1.4 }}>{p.name}</span>
              <div style={{ width: 20, height: 2, background: `linear-gradient(90deg, transparent, ${p.color}, transparent)`, borderRadius: 2 }} />
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: textSub, fontStyle: "italic" }}>⚠️ We act as advisory partners. Final policy issuance and underwriting is subject to insurer approval.</div>
      </div>
      <div id="ins-form" style={{ ...styles.glassCard, border: `1px solid ${GOLD}33` }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Get a Free Insurance Quote</div>
          <div style={{ fontSize: 14, color: textSub }}>Our advisor will reach out within 2 hours</div>
        </div>
        {insuranceSubmitted ? (
          <div style={{ textAlign: "center", padding: "30px 20px" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Enquiry Received!</div>
            <div style={{ color: textSub, marginBottom: 20 }}>Our insurance advisor will contact you within 2 hours.</div>
            <a href="https://wa.me/919876543210?text=Hi!%20I%20submitted%20an%20insurance%20enquiry." target="_blank" rel="noreferrer" style={{ ...styles.goldBtn, textDecoration: "none", background: "linear-gradient(135deg,#25D366,#128C7E)" }}>Track on WhatsApp</a>
          </div>
        ) : (
          <div className="ins-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div><label style={styles.label}>Full Name *</label><input style={styles.input} value={insuranceForm.name} onChange={e => setInsuranceForm({ ...insuranceForm, name: e.target.value })} placeholder="Your full name" /></div>
            <div><label style={styles.label}>Mobile Number *</label><input style={styles.input} value={insuranceForm.mobile} onChange={e => setInsuranceForm({ ...insuranceForm, mobile: e.target.value })} placeholder="10-digit number" maxLength={10} /></div>
            <div><label style={styles.label}>City</label><input style={styles.input} value={insuranceForm.city} onChange={e => setInsuranceForm({ ...insuranceForm, city: e.target.value })} placeholder="Bhubaneswar" /></div>
            <div><label style={styles.label}>Insurance Type</label><select style={{ ...styles.input, cursor: "pointer", backgroundColor: "#0f172a", color: "#F0F4FF" }} value={insuranceForm.insuranceType} onChange={e => setInsuranceForm({ ...insuranceForm, insuranceType: e.target.value })}><option value="health">Health Insurance</option><option value="term">Term Life Insurance</option><option value="motor">Motor Insurance</option><option value="business">Business Insurance</option></select></div>
            <div><label style={styles.label}>Age</label><input style={styles.input} value={insuranceForm.age} onChange={e => setInsuranceForm({ ...insuranceForm, age: e.target.value })} placeholder="e.g. 32" type="number" min={18} max={80} /></div>
            <div><label style={styles.label}>Sum Assured Required</label><input style={styles.input} value={insuranceForm.sumAssured} onChange={e => setInsuranceForm({ ...insuranceForm, sumAssured: e.target.value })} placeholder="e.g. ₹50 Lakh" /></div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={styles.label}>Do you have an existing policy?</label>
              <div style={{ display: "flex", gap: 14 }}>
                {[["yes", "Yes, I have"], ["no", "No, first time"]].map(([val, label]) => (
                  <button key={val} onClick={() => setInsuranceForm({ ...insuranceForm, existingPolicy: val })} style={{ flex: 1, padding: "11px", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit", border: insuranceForm.existingPolicy === val ? `2px solid ${GOLD}` : `1px solid ${cardBorder}`, background: insuranceForm.existingPolicy === val ? `${GOLD}18` : "transparent", color: insuranceForm.existingPolicy === val ? GOLD : textSub, transition: "all 0.2s" }}>{label}</button>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <button style={{ ...styles.goldBtn, width: "100%", padding: "15px", fontSize: 16, borderRadius: 12 }} className="gold-hover" onClick={handleInsSubmit}>🎯 Submit Enquiry & Get Quote →</button>
              <div style={{ textAlign: "center", marginTop: 10 }}><a href="https://wa.me/919876543210?text=Hi!%20I%20need%20insurance%20advisory." target="_blank" rel="noreferrer" style={{ color: "#25D366", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>💬 Or enquire via WhatsApp</a></div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════════════════════
function Footer({ styles, darkMode, textSub, GOLD, cardBorder, scrollTo }) {
  const links = {
    "Services": ["Personal Loan", "Business Loan", "Home Loan", "ITR Filing", "GST Registration", "Mutual Funds"],
    "Company": ["About Us", "Our Team", "Careers", "Blog", "Press", "Contact Us"],
    "Legal": ["Privacy Policy", "Terms of Service", "Disclaimer", "Refund Policy", "Cookie Policy"],
  };
  return (
    <footer style={{ background: "#060C1A", color: "#94A3B8", padding: "80px 24px 0", marginTop: 40 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 56 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, background: `linear-gradient(135deg, ${GOLD}, #B8862A)`, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#0A0F1E", fontSize: 20 }}>₹</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#F0F4FF" }}>One Point Finance Hub</div>
                <div style={{ fontSize: 10, color: GOLD, letterSpacing: "0.08em" }}>TRUSTED LOAN ADVISORY · PAN INDIA</div>
              </div>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 20, maxWidth: 300, color: "#64748B" }}>Connecting India with the best loan products. Headquartered in Bhubaneswar, Odisha. 500+ loans facilitated. 1,200+ satisfied customers.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
              {[["📍", "123, Saheed Nagar, Bhubaneswar, Odisha – 751007"], ["📞", "+91 98765 43210"], ["✉️", "info@onepointfinancehub.com"], ["🌐", "www.onepointfinancehub.com"]].map(([icon, val]) => (
                <div key={val} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#64748B" }}>
                  <span style={{ flexShrink: 0, marginTop: 1 }}>{icon}</span><span>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {["📘", "📸", "💼", "🐦"].map((icon, i) => (
                <div key={i} style={{ width: 36, height: 36, background: "rgba(255,255,255,0.05)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}20`; e.currentTarget.style.borderColor = `${GOLD}44`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
                  {icon}
                </div>
              ))}
            </div>
          </div>
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <div style={{ fontWeight: 800, color: "#CBD5E1", marginBottom: 18, fontSize: 13, letterSpacing: "0.04em" }}>{section.toUpperCase()}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {items.map(item => (
                  <a key={item} href="#" style={{ color: "#64748B", textDecoration: "none", fontSize: 13, transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = GOLD} onMouseLeave={e => e.target.style.color = "#64748B"}>{item}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginBottom: 36, paddingBottom: 32, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {[["🔒", "SSL Secured"], ["🏦", "RBI Compliant"], ["✅", "CIBIL Integrated"], ["📋", "Zero Hidden Charges"], ["⚡", "24–48 Hr Approval"]].map(([icon, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8 }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "24px 28px", background: "rgba(255,255,255,0.025)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", marginBottom: 32 }}>
          <div style={{ fontWeight: 800, color: "#94A3B8", fontSize: 12, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><span>⚠️</span> REGULATORY DISCLOSURE</div>
          <p style={{ fontSize: 12, lineHeight: 1.8, color: "#475569", margin: 0 }}>
            <strong style={{ color: "#64748B" }}>One Point Finance Hub</strong> operates as a registered Direct Selling Agent (DSA) and loan referral intermediary. We are <strong style={{ color: "#94A3B8" }}>not a bank, financial institution, or licensed lender</strong>. We do not lend money directly, accept deposits, or guarantee loan approvals. All loan products are offered, sanctioned, and disbursed solely by the respective financial institutions, subject to their eligibility criteria and credit policies. Interest rates, fees, and terms are set exclusively by the lender. We are not liable for any credit decisions or outcomes. Insurance Advisory: We act as advisory partners. Final policy issuance and underwriting is subject to insurer approval. Customers are advised to review all documents carefully.{" "}
            <a href="#" style={{ color: GOLD, textDecoration: "none" }}>Privacy Policy</a> ·{" "}
            <a href="#" style={{ color: GOLD, textDecoration: "none" }}>Terms of Service</a> ·{" "}
            <a href="#" style={{ color: GOLD, textDecoration: "none" }}>Disclaimer</a>
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", borderTop: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", gap: 12, marginBottom: 0 }}>
          <div style={{ fontSize: 12, color: "#475569" }}>© {new Date().getFullYear()} One Point Finance Hub. All rights reserved. · Advisory Partner: <strong style={{ color: "#64748B" }}>Bright Worth Advisors Private Limited</strong></div>
          <div style={{ display: "flex", gap: 16, fontSize: 12, flexWrap: "wrap" }}>
            <a href="#" style={{ color: "#475569", textDecoration: "none" }} onMouseEnter={e => e.target.style.color = GOLD} onMouseLeave={e => e.target.style.color = "#475569"}>Privacy Policy</a>
            <a href="#" style={{ color: "#475569", textDecoration: "none" }} onMouseEnter={e => e.target.style.color = GOLD} onMouseLeave={e => e.target.style.color = "#475569"}>Terms</a>
            <a href="#" style={{ color: "#475569", textDecoration: "none" }} onMouseEnter={e => e.target.style.color = GOLD} onMouseLeave={e => e.target.style.color = "#475569"}>Disclaimer</a>
          </div>
        </div>
        <div style={{ height: 72 }} className="mobile-sticky-bar" />
      </div>
      <div className="mobile-sticky-bar" style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 997, background: "#060C1A", borderTop: "1px solid rgba(201,168,76,0.25)", padding: "10px 16px", gap: 10, backdropFilter: "blur(20px)" }}>
        <a href="https://wa.me/919876543210?text=Hi!%20I%20need%20a%20loan." target="_blank" rel="noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", background: "linear-gradient(135deg,#25D366,#128C7E)", borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: 14, color: "#fff", boxShadow: "0 4px 18px rgba(37,211,102,0.35)" }}>💬 WhatsApp Us</a>
        <button onClick={() => { const el = document.getElementById("loans"); if (el) el.scrollIntoView({ behavior: "smooth" }); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", background: `linear-gradient(135deg, ${GOLD}, #B8862A)`, border: "none", borderRadius: 12, fontWeight: 800, fontSize: 14, color: "#0A0F1E", cursor: "pointer", fontFamily: "inherit", boxShadow: `0 4px 18px ${GOLD}44` }}>🚀 Apply Now</button>
      </div>
    </footer>
  );
}
