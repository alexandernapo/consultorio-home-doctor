import React, { useState, useMemo } from "react";
import { supabase } from "./supabaseClient";
import {
  Users, ClipboardList, CalendarDays, Receipt, Stethoscope,
  Plus, Search, X, ChevronRight, Phone, Droplet, AlertTriangle,
  Trash2, Edit3, Check, Clock, DollarSign, Activity, Home, ChevronLeft, Menu,
  Bell, BellOff, FileText, FileCheck, Printer, Download, Upload, LogOut
} from "lucide-react";

// ---------- Utilidades ----------
const uid = (p) => `${p}${Math.random().toString(36).slice(2, 9)}`;

function calcAge(birthDate) {
  if (!birthDate) return "";
  const b = new Date(birthDate);
  if (isNaN(b)) return "";
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  let months = now.getMonth() - b.getMonth();
  if (now.getDate() < b.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years <= 0) return `${years * 12 + months}m`;
  return `${years}a ${months}m`;
}

// ---------- Datos iniciales ----------
const initialDoctors = []; // Los datos viven en Supabase (ver supabase/seed.sql)

const initialPatients = []; // Los datos viven en Supabase (ver supabase/seed.sql)

const initialHistory = []; // Los datos viven en Supabase (ver supabase/seed.sql)


const initialAppointments = []; // Los datos viven en Supabase (ver supabase/seed.sql)

const initialBilling = []; // Los datos viven en Supabase (ver supabase/seed.sql)

const TABS = [
  { key: "home", label: "Inicio", icon: Home },
  { key: "patients", label: "Pacientes", icon: Users },
  { key: "history", label: "Historial clínico", icon: ClipboardList },
  { key: "appointments", label: "Citas", icon: CalendarDays },
  { key: "billing", label: "Facturación", icon: Receipt },
  { key: "doctors", label: "Médicos", icon: Stethoscope },
];

const HOME_CARDS = [
  { key: "patients", title: "Pacientes", desc: "Registro y fichas de admisión", icon: Users },
  { key: "history", title: "Historial clínico", desc: "Consultas, diagnósticos y signos vitales", icon: ClipboardList },
  { key: "appointments", title: "Citas", desc: "Agenda de consultas programadas", icon: CalendarDays },
  { key: "billing", title: "Facturación", desc: "Cobros y estado de pagos", icon: Receipt },
  { key: "doctors", title: "Médicos", desc: "Equipo médico del consultorio", icon: Stethoscope },
];

function useSupabaseArray(table, enabled) {
  const [data, setDataRaw] = useState(null);
  const [ready, setReady] = useState(false);

  React.useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      const { data: rows, error } = await supabase.from(table).select("*");
      if (!cancelled) {
        if (error) { console.error(`Error cargando ${table}:`, error.message); setDataRaw([]); }
        else setDataRaw(rows || []);
        setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [enabled]);

  const setData = (updater) => {
    setDataRaw((prev) => {
      const base = prev || [];
      const next = typeof updater === "function" ? updater(base) : updater;

      const nextIds = new Set(next.map((r) => r.id));
      const removedIds = base.filter((r) => !nextIds.has(r.id)).map((r) => r.id);
      const changed = next.filter((r) => {
        const old = base.find((o) => o.id === r.id);
        return !old || JSON.stringify(old) !== JSON.stringify(r);
      });

      if (removedIds.length) {
        supabase.from(table).delete().in("id", removedIds).then(({ error }) => {
          if (error) console.error(`Error borrando en ${table}:`, error.message);
        });
      }
      if (changed.length) {
        supabase.from(table).upsert(changed).then(({ error }) => {
          if (error) console.error(`Error guardando en ${table}:`, error.message);
        });
      }
      return next;
    });
  };

  return [data, setData, ready];
}

function LoginScreen({ onLoggedIn }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const requiredInvite = import.meta.env.VITE_INVITE_CODE;

  async function handleLogin(e) {
    e.preventDefault();
    setError(""); setInfo(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError("Correo o contraseña incorrectos.");
    else onLoggedIn();
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError(""); setInfo(""); setLoading(true);

    if (requiredInvite && inviteCode.trim() !== requiredInvite) {
      setLoading(false);
      setError("Código de invitación incorrecto.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message.includes("already registered") ? "Ese correo ya tiene una cuenta." : "No se pudo crear la cuenta: " + error.message);
      return;
    }
    if (data.session) {
      onLoggedIn();
    } else {
      setInfo("Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión.");
      setMode("login");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", background: "#F7F5EF" }}>
      <form onSubmit={mode === "login" ? handleLogin : handleSignup} style={{ background: "#fff", padding: 32, borderRadius: 16, width: 320, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <h2 style={{ marginTop: 0, color: "#159E93" }}>Home Doctor Ibarra</h2>
        <p style={{ fontSize: 13, color: "#8A8577", marginTop: -8 }}>
          {mode === "login" ? "Inicia sesión para continuar" : "Crear una cuenta nueva"}
        </p>
        <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 8, border: "1px solid #E4E0D3", boxSizing: "border-box" }} required />
        <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 8, border: "1px solid #E4E0D3", boxSizing: "border-box" }} required minLength={6} />
        {mode === "signup" && requiredInvite && (
          <input type="text" placeholder="Código de invitación" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 8, border: "1px solid #E4E0D3", boxSizing: "border-box" }} required />
        )}
        {error && <p style={{ color: "#9B3B2C", fontSize: 13 }}>{error}</p>}
        {info && <p style={{ color: "#159E93", fontSize: 13 }}>{info}</p>}
        <button type="submit" disabled={loading}
          style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", background: "#159E93", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
          {loading ? "Un momento…" : mode === "login" ? "Ingresar" : "Crear cuenta"}
        </button>
        <button
          type="button"
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setInfo(""); }}
          style={{ width: "100%", padding: 10, marginTop: 10, borderRadius: 8, border: "none", background: "transparent", color: "#159E93", fontSize: 13, cursor: "pointer" }}
        >
          {mode === "login" ? "¿No tienes cuenta? Créala aquí" : "Ya tengo cuenta, iniciar sesión"}
        </button>
      </form>
    </div>
  );
}

export default function ClinicApp() {
  const [session, setSession] = useState(undefined);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", color: "#8A8577" }}>
        Cargando…
      </div>
    );
  }
  if (!session) {
    return <LoginScreen onLoggedIn={() => {}} />;
  }
  return <ClinicAppInner onLogout={() => supabase.auth.signOut()} />;
}

function ClinicAppInner({ onLogout }) {
  const [tab, setTab] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [doctors, setDoctors, doctorsReady] = useSupabaseArray("doctors", true);
  const [patients, setPatients, patientsReady] = useSupabaseArray("patients", true);
  const [history, setHistory, historyReady] = useSupabaseArray("history", true);
  const [appointments, setAppointments, apptReady] = useSupabaseArray("appointments", true);
  const [billing, setBilling, billingReady] = useSupabaseArray("billing", true);
  const allReady = doctorsReady && patientsReady && historyReady && apptReady && billingReady;
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [notifStatus, setNotifStatus] = useState(() => {
    try {
      return typeof Notification !== "undefined" ? Notification.permission : "unsupported";
    } catch {
      return "unsupported";
    }
  });
  const notifiedRef = React.useRef(new Set());

  const fullName = (p) => p ? `${p.lastNamePaternal} ${p.lastNameMaternal} ${p.firstNames}`.replace(/\s+/g, " ").trim() : "—";
  const patientName = (id) => fullName((patients || []).find((p) => p.id === id));
  const doctorName = (id) => (doctors || []).find((d) => d.id === id)?.name || "—";

  function importBatch(jsonText) {
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      return { ok: false, message: "El texto pegado no es un JSON válido." };
    }
    const mergeById = (current, incoming) => {
      if (!Array.isArray(incoming) || incoming.length === 0) return { list: current, count: 0 };
      const map = new Map(current.map((item) => [item.id, item]));
      incoming.forEach((item) => { if (item && item.id) map.set(item.id, item); });
      return { list: Array.from(map.values()), count: incoming.length };
    };
    const pRes = mergeById(patients, parsed.patients);
    const hRes = mergeById(history, parsed.history);
    const dRes = mergeById(doctors, parsed.doctors);
    if (pRes.count) setPatients(pRes.list);
    if (hRes.count) setHistory(hRes.list);
    if (dRes.count) setDoctors(dRes.list);
    return {
      ok: true,
      message: `Importado: ${pRes.count} pacientes, ${hRes.count} atenciones${dRes.count ? `, ${dRes.count} médicos` : ""}.`,
    };
  }

  async function enableNotifications() {
    try {
      if (typeof Notification === "undefined") return;
      const result = await Notification.requestPermission();
      setNotifStatus(result);
    } catch {
      setNotifStatus("unsupported");
    }
  }

  // Revisa cada 30s si hay citas próximas (dentro de los siguientes 30 min) y notifica.
  React.useEffect(() => {
    if (notifStatus !== "granted") return;
    const check = () => {
      try {
        const now = new Date();
        (appointments || []).forEach((a) => {
          if (a.status === "completada") return;
          const apptTime = new Date(`${a.date}T${a.time || "00:00"}`);
          const diffMin = (apptTime - now) / 60000;
          if (diffMin <= 30 && diffMin >= -5 && !notifiedRef.current.has(a.id)) {
            notifiedRef.current.add(a.id);
            new Notification("Cita próxima — Home Doctor Ibarra", {
              body: `${patientName(a.patientId)} a las ${a.time} (${doctorName(a.doctorId)})`,
            });
          }
        });
      } catch {
        // Entorno sin soporte de notificaciones; se ignora silenciosamente.
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [appointments, notifStatus, patients, doctors]);

  if (!allReady) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", color: "#8A8577" }}>
        Cargando consultorio…
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <style>{`
        @page { size: A4; margin: 15mm; }
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; top: 0; left: 0; width: 100%; padding: 0; }
        }
      `}</style>
      <Header notifStatus={notifStatus} onEnableNotifications={enableNotifications} />
      <div style={styles.body}>
        <Sidebar tab={tab} setTab={setTab} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} onLogout={onLogout} />
        <main style={styles.main}>
          {tab === "home" && (
            <HomeView
              setTab={setTab}
              stats={{
                patients: patients.length,
                appointments: appointments.filter((a) => a.status !== "completada").length,
                pendingBilling: billing.filter((b) => b.status === "pendiente").length,
                doctors: doctors.length,
              }}
            />
          )}
          {tab === "patients" && (
            <PatientsView
              patients={patients} setPatients={setPatients} fullName={fullName} history={history}
              onOpenHistory={(id) => { setSelectedPatientId(id); setTab("history"); }}
              onOpenImport={() => setShowImport(true)}
            />
          )}
          {showImport && <ImportModal onImport={importBatch} onClose={() => setShowImport(false)} />}
          {tab === "history" && (
            <HistoryView
              history={history} setHistory={setHistory}
              patients={patients} doctors={doctors}
              selectedPatientId={selectedPatientId} setSelectedPatientId={setSelectedPatientId}
              patientName={patientName} doctorName={doctorName}
            />
          )}
          {tab === "appointments" && (
            <AppointmentsView
              appointments={appointments} setAppointments={setAppointments}
              patients={patients} doctors={doctors}
              patientName={patientName} doctorName={doctorName}
            />
          )}
          {tab === "billing" && (
            <BillingView
              billing={billing} setBilling={setBilling}
              patients={patients} patientName={patientName}
            />
          )}
          {tab === "doctors" && (
            <DoctorsView doctors={doctors} setDoctors={setDoctors} />
          )}
        </main>
      </div>
    </div>
  );
}

// ---------- Layout ----------
function Header({ notifStatus, onEnableNotifications }) {
  const label = notifStatus === "granted" ? "Notificaciones activas"
    : notifStatus === "denied" ? "Notificaciones bloqueadas"
    : "Activar notificaciones de citas";
  return (
    <header style={styles.header}>
      <div style={styles.headerInner}>
        <div style={styles.brand}>
          <div style={styles.brandMark}>
            <svg width="22" height="22" viewBox="0 0 24 24">
              <clipPath id="crossClipHeader">
                <rect x="9" y="2" width="6" height="20" rx="3" />
                <rect x="2" y="9" width="20" height="6" rx="3" />
              </clipPath>
              <g clipPath="url(#crossClipHeader)">
                <polygon points="0,0 24,0 0,24" fill="#E31C79" />
                <polygon points="24,0 24,24 0,24" fill="#159E93" />
              </g>
            </svg>
          </div>
          <div>
            <div style={styles.brandTitle}>Home Doctor Ibarra</div>
            <div style={styles.brandSub}>La salud en su hogar</div>
          </div>
        </div>
        <button
          onClick={onEnableNotifications}
          disabled={notifStatus === "granted" || notifStatus === "denied" || notifStatus === "unsupported"}
          title={label}
          style={{
            ...styles.notifBtn,
            ...(notifStatus === "granted" ? styles.notifBtnActive : {}),
          }}
        >
          {notifStatus === "granted" ? <Bell size={16} /> : <BellOff size={16} />}
          <span>{label}</span>
        </button>
      </div>
    </header>
  );
}

function Sidebar({ tab, setTab, collapsed, setCollapsed, onLogout }) {
  return (
    <nav style={{ ...styles.sidebar, ...(collapsed ? styles.sidebarCollapsed : {}) }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{ ...styles.navItem, ...styles.sidebarToggle, justifyContent: collapsed ? "center" : "flex-start" }}
        title={collapsed ? "Expandir" : "Contraer"}
      >
        {collapsed ? <Menu size={17} /> : <ChevronLeft size={17} />}
        {!collapsed && <span>Contraer</span>}
      </button>
      {TABS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setTab(key)}
          title={collapsed ? label : undefined}
          style={{
            ...styles.navItem,
            ...(tab === key ? styles.navItemActive : {}),
            ...(collapsed ? styles.navItemCollapsed : {}),
          }}
        >
          <Icon size={17} strokeWidth={2} />
          {!collapsed && <span>{label}</span>}
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <button
        onClick={onLogout}
        title={collapsed ? "Cerrar sesión" : undefined}
        style={{ ...styles.navItem, ...(collapsed ? styles.navItemCollapsed : {}), color: "#9B3B2C" }}
      >
        <LogOut size={17} strokeWidth={2} />
        {!collapsed && <span>Cerrar sesión</span>}
      </button>
    </nav>
  );
}

const HOME_STATS_MAP = {
  patients: { label: "Pacientes activos" },
  appointments: { label: "Citas por atender" },
  pendingBilling: { label: "Cobros pendientes" },
  doctors: { label: "Médicos" },
};

function HomeView({ setTab, stats }) {
  return (
    <div style={styles.homeWrap}>
      <div style={styles.homeLogoBlock}>
        <div style={styles.homeLogoRing}>
          <div style={styles.homeLogoMark}>
            <svg width="72" height="72" viewBox="0 0 24 24">
              <defs>
                <linearGradient id="crossMagenta" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F0459A" />
                  <stop offset="100%" stopColor="#C21567" />
                </linearGradient>
                <linearGradient id="crossTeal" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1CB5A8" />
                  <stop offset="100%" stopColor="#0E7268" />
                </linearGradient>
                <clipPath id="crossClipHome">
                  <rect x="9" y="1.5" width="6" height="21" rx="3" />
                  <rect x="1.5" y="9" width="21" height="6" rx="3" />
                </clipPath>
              </defs>
              <g clipPath="url(#crossClipHome)">
                <polygon points="0,0 24,0 0,24" fill="url(#crossMagenta)" />
                <polygon points="24,0 24,24 0,24" fill="url(#crossTeal)" />
              </g>
            </svg>
          </div>
        </div>
        <div style={styles.homeTitle}>Home Doctor Ibarra</div>
        <div style={styles.homeDivider} />
        <div style={styles.homeSubtitle}>La salud en su hogar</div>
        <div style={styles.homeTagline}>Sistema de gestión de historiales clínicos</div>
      </div>

      <div style={styles.homeStatsRow}>
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} style={styles.homeStatCard}>
            <div style={styles.homeStatValue}>{value}</div>
            <div style={styles.homeStatLabel}>{HOME_STATS_MAP[key]?.label || key}</div>
          </div>
        ))}
      </div>

      <div style={styles.homeGrid}>
        {HOME_CARDS.map(({ key, title, desc, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={styles.homeCard}>
            <div style={styles.homeCardIcon}><Icon size={26} color="#fff" /></div>
            <div style={styles.homeCardTitle}>{title}</div>
            <div style={styles.homeCardDesc}>{desc}</div>
            <div style={styles.homeCardArrow}><ChevronRight size={18} /></div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={styles.sectionHeader}>
      <div>
        <h1 style={styles.sectionTitle}>{title}</h1>
        {subtitle && <p style={styles.sectionSubtitle}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", style, type = "button", disabled }) {
  const base = variant === "primary" ? styles.btnPrimary
    : variant === "danger" ? styles.btnDanger
    : styles.btnGhost;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}), ...style }}
    >
      {children}
    </button>
  );
}

function Input(props) {
  return <input {...props} style={{ ...styles.input, ...(props.style || {}) }} />;
}
function Select(props) {
  return <select {...props} style={{ ...styles.input, ...(props.style || {}) }} />;
}
function TextArea(props) {
  return <textarea {...props} style={{ ...styles.input, ...styles.textarea, ...(props.style || {}) }} />;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, ...(wide ? { maxWidth: 760 } : {}) }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>{title}</h3>
          <button onClick={onClose} style={styles.iconBtn}><X size={18} /></button>
        </div>
        <div style={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg: "#EDEAE1", fg: "#5C574C" },
    success: { bg: "#DCEBE0", fg: "#2E6B47" },
    warning: { bg: "#F7E7CE", fg: "#8A5A17" },
    danger: { bg: "#F5DEDA", fg: "#9B3B2C" },
    accent: { bg: "#DCE7E4", fg: "#2D5C52" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{ ...styles.badge, background: t.bg, color: t.fg }}>{children}</span>
  );
}

function SubHeading({ children }) {
  return <div style={styles.subHeading}>{children}</div>;
}

// ---------- Pacientes ----------
function PatientsView({ patients, setPatients, onOpenHistory, fullName, history, onOpenImport }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const hasQuery = query.trim().length > 0;
  const visitCountFor = (id) => history.filter((h) => h.patientId === id).length;

  const matches = hasQuery
    ? patients.filter((p) => fullName(p).toLowerCase().includes(query.trim().toLowerCase()))
    : [...patients].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);

  const shown = matches.slice(0, 40);

  function savePatient(data) {
    if (data.id) {
      setPatients((prev) => prev.map((p) => (p.id === data.id ? { ...data, createdAt: p.createdAt } : p)));
    } else {
      const nextNum = String(patients.length + 1).padStart(4, "0");
      setPatients((prev) => [
        ...prev,
        { ...data, id: uid("p"), historyNumber: data.historyNumber || `HC-${nextNum}`, createdAt: Date.now() },
      ]);
    }
    setEditing(null);
  }
  function removePatient(id) {
    setPatients((prev) => prev.filter((p) => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  return (
    <div>
      <SectionHeader
        title="Pacientes"
        subtitle={`${patients.length} registrados`}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="ghost" onClick={onOpenImport}><Upload size={16} /> Actualizar pacientes</Button>
            <Button onClick={() => setEditing({})}><Plus size={16} /> Nuevo paciente</Button>
          </div>
        }
      />
      <div style={styles.searchRow}>
        <Search size={16} color="#8A8577" />
        <input
          placeholder="Escribe un nombre para buscar…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setExpandedId(null); }}
          style={styles.searchInput}
        />
      </div>

      {!hasQuery && <div style={styles.lightHint}>Pacientes recientes · escribe arriba para buscar entre los {patients.length}</div>}

      <div style={styles.compactList}>
        {shown.map((p) => {
          const isOpen = expandedId === p.id;
          return (
            <div key={p.id} style={styles.compactWrap}>
              <button style={styles.compactRow} onClick={() => setExpandedId(isOpen ? null : p.id)}>
                <div style={styles.avatar}>{fullName(p).split(" ").map((s) => s[0]).slice(0, 2).join("")}</div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={styles.cardTitle}>{fullName(p)}</div>
                  <div style={styles.cardMeta}>{calcAge(p.birthDate)} · {p.historyNumber}</div>
                </div>
                {p.needsReview && <Badge tone="warning">Revisar PDF</Badge>}
                <ChevronRight size={18} color="#8A8577" style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
              </button>

              {isOpen && (
                <div style={styles.compactDetail}>
                  <div style={styles.cardDetails}>
                    <div style={styles.detailRow}><Phone size={14} color="#8A8577" /> {p.phone || "—"}</div>
                    <div style={styles.detailRow}>Cédula: {p.cedula || "—"}</div>
                    <div style={styles.detailRow}>{p.sex === "M" ? "Masculino" : p.sex === "F" ? "Femenino" : "—"}</div>
                    {p.allergies && p.allergies !== "N/R" && p.allergies !== "Ninguna" && p.allergies !== "Ninguno" && p.allergies !== "No refiere" && (
                      <div style={{ ...styles.detailRow, color: "#9B3B2C" }}>
                        <AlertTriangle size={14} /> Alergias: {p.allergies}
                      </div>
                    )}
                  </div>
                  <div style={styles.cardActions}>
                    <Badge tone="accent">{visitCountFor(p.id)} {visitCountFor(p.id) === 1 ? "atención" : "atenciones"}</Badge>
                    <Button variant="ghost" onClick={() => onOpenHistory(p.id)}>
                      Historial <ChevronRight size={14} />
                    </Button>
                    {p.sourceUrl && (
                      <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" style={styles.iconBtn} title="Ver historia original escaneada">
                        <FileText size={15} />
                      </a>
                    )}
                    <button style={styles.iconBtn} onClick={() => setEditing(p)}><Edit3 size={15} /></button>
                    <button style={styles.iconBtn} onClick={() => removePatient(p.id)}><Trash2 size={15} /></button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {hasQuery && matches.length === 0 && <EmptyState text="No se encontraron pacientes." />}
        {hasQuery && matches.length > shown.length && (
          <div style={styles.lightHint}>Mostrando los primeros {shown.length} de {matches.length} resultados. Afina la búsqueda para ver menos.</div>
        )}
      </div>

      {editing !== null && (
        <PatientForm patient={editing} onCancel={() => setEditing(null)} onSave={savePatient} />
      )}
    </div>
  );
}

function ImportModal({ onImport, onClose }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  function handleImport() {
    const res = onImport(text);
    setResult(res);
    if (res.ok) setText("");
  }

  return (
    <Modal title="Actualizar pacientes" onClose={onClose} wide>
      <p style={{ fontSize: 13, color: "#5C574C", lineHeight: 1.5, marginTop: 0 }}>
        Pega aquí el bloque de datos que te comparta (formato JSON con pacientes y atenciones nuevas).
        Se suma a lo que ya existe — no se borra nada. Un paciente con el mismo ID que uno existente
        se actualiza en vez de duplicarse.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='{"patients": [...], "history": [...]}'
        style={styles.importTextarea}
      />
      {result && (
        <div style={{ ...styles.reviewBanner, marginTop: 12, background: result.ok ? TEAL_LIGHT : "#F7D9D0", color: result.ok ? TEAL_DARK : "#9B3B2C" }}>
          {result.message}
        </div>
      )}
      <div style={styles.modalFooter}>
        <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        <Button onClick={handleImport} disabled={!text.trim()}>
          <Upload size={16} /> Cargar datos
        </Button>
      </div>
    </Modal>
  );
}

function PatientForm({ patient, onCancel, onSave }) {
  const [form, setForm] = useState({
    id: patient.id,
    historyNumber: patient.historyNumber || "",
    lastNamePaternal: patient.lastNamePaternal || "",
    lastNameMaternal: patient.lastNameMaternal || "",
    firstNames: patient.firstNames || "",
    cedula: patient.cedula || "",
    birthDate: patient.birthDate || "",
    sex: patient.sex || "F",
    maritalStatus: patient.maritalStatus || "S",
    occupation: patient.occupation || "",
    nationality: patient.nationality || "Ecuatoriana",
    phone: patient.phone || "",
    address: patient.address || "",
    canton: patient.canton || "",
    province: patient.province || "",
    companionName: patient.companionName || "",
    companionRelation: patient.companionRelation || "",
    companionPhone: patient.companionPhone || "",
    app: patient.app || "",
    aqx: patient.aqx || "",
    allergies: patient.allergies || "",
    apf: patient.apf || "",
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal title={patient.id ? "Editar paciente" : "Nuevo paciente"} onClose={onCancel} wide>
      {patient.sourceUrl && (
        <a href={patient.sourceUrl} target="_blank" rel="noopener noreferrer" style={styles.sourceLink}>
          <FileText size={14} /> Ver historia original escaneada
        </a>
      )}
      <SubHeading>1. Registro de admisión</SubHeading>
      <div style={styles.formGrid}>
        <Field label="No. historia clínica"><Input value={form.historyNumber} onChange={set("historyNumber")} placeholder="Se asigna automáticamente" /></Field>
        <Field label="No. de cédula"><Input value={form.cedula} onChange={set("cedula")} /></Field>
        <Field label="Apellido paterno"><Input value={form.lastNamePaternal} onChange={set("lastNamePaternal")} /></Field>
        <Field label="Apellido materno"><Input value={form.lastNameMaternal} onChange={set("lastNameMaternal")} /></Field>
        <Field label="Nombres" full><Input value={form.firstNames} onChange={set("firstNames")} /></Field>
        <Field label="Fecha de nacimiento"><Input type="date" value={form.birthDate} onChange={set("birthDate")} /></Field>
        <Field label="Edad (calculada)"><Input value={calcAge(form.birthDate)} disabled style={{ background: "#F3F1EA", color: "#8A8577" }} /></Field>
        <Field label="Sexo">
          <Select value={form.sex} onChange={set("sex")}>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
          </Select>
        </Field>
        <Field label="Estado civil">
          <Select value={form.maritalStatus} onChange={set("maritalStatus")}>
            <option value="S">Soltero/a</option>
            <option value="C">Casado/a</option>
            <option value="D">Divorciado/a</option>
            <option value="V">Viudo/a</option>
            <option value="UL">Unión libre</option>
          </Select>
        </Field>
        <Field label="Ocupación actual"><Input value={form.occupation} onChange={set("occupation")} /></Field>
        <Field label="Nacionalidad"><Input value={form.nationality} onChange={set("nationality")} /></Field>
        <Field label="No. teléfono"><Input value={form.phone} onChange={set("phone")} /></Field>
        <Field label="Dirección de residencia habitual" full><Input value={form.address} onChange={set("address")} /></Field>
        <Field label="Cantón"><Input value={form.canton} onChange={set("canton")} /></Field>
        <Field label="Provincia"><Input value={form.province} onChange={set("province")} /></Field>
      </div>

      <SubHeading>Acompañante</SubHeading>
      <div style={styles.formGrid}>
        <Field label="Nombre de acompañante"><Input value={form.companionName} onChange={set("companionName")} /></Field>
        <Field label="Parentesco"><Input value={form.companionRelation} onChange={set("companionRelation")} /></Field>
        <Field label="Teléfono"><Input value={form.companionPhone} onChange={set("companionPhone")} /></Field>
      </div>

      <SubHeading>2. Antecedentes personales y familiares</SubHeading>
      <div style={styles.formGrid}>
        <Field label="APP (antecedentes patológicos personales)"><Input value={form.app} onChange={set("app")} placeholder="N/R" /></Field>
        <Field label="AQX (antecedentes quirúrgicos)"><Input value={form.aqx} onChange={set("aqx")} placeholder="N/R" /></Field>
        <Field label="Alergias"><Input value={form.allergies} onChange={set("allergies")} placeholder="N/R" /></Field>
        <Field label="APF (antecedentes familiares)"><Input value={form.apf} onChange={set("apf")} placeholder="N/R" /></Field>
      </div>

      <div style={styles.modalFooter}>
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => (form.lastNamePaternal || form.firstNames) && onSave(form)}>
          <Check size={15} /> Guardar
        </Button>
      </div>
    </Modal>
  );
}

// ---------- Historial clínico ----------
function HistoryView({ history, setHistory, patients, doctors, selectedPatientId, setSelectedPatientId, patientName, doctorName }) {
  const [editing, setEditing] = useState(null);
  const [showPrescription, setShowPrescription] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const entries = useMemo(() => {
    const list = selectedPatientId ? history.filter((h) => h.patientId === selectedPatientId) : history;
    return [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [history, selectedPatientId]);

  function saveEntry(data) {
    if (data.id) setHistory((prev) => prev.map((h) => (h.id === data.id ? data : h)));
    else setHistory((prev) => [...prev, { ...data, id: uid("h") }]);
    setEditing(null);
  }
  function removeEntry(id) {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }

  const vitalsRow = (h) => [
    h.bp && `PA ${h.bp}`, h.hr && `FC ${h.hr}`, h.rr && `FR ${h.rr}`, h.temp && `T° ${h.temp}`,
    h.weight && `Peso ${h.weight}kg`, h.height && `Talla ${h.height}cm`, h.spo2 && `SpO2 ${h.spo2}%`, h.bmi && `IMC ${h.bmi}`,
  ].filter(Boolean).join(" · ");

  return (
    <div>
      <SectionHeader
        title="Historial clínico"
        subtitle={selectedPatientId ? `Paciente: ${patientName(selectedPatientId)} · ${entries.length} ${entries.length === 1 ? "atención" : "atenciones"}` : "Selecciona un paciente"}
        action={selectedPatientId
          ? <Button onClick={() => setEditing({ patientId: selectedPatientId })}><Plus size={16} /> Nueva entrada</Button>
          : null}
      />

      {!selectedPatientId && (
        <AlphabetPatientPicker patients={patients} patientName={patientName} onSelect={setSelectedPatientId} history={history} />
      )}

      {selectedPatientId && (
        <>
          <div style={styles.filterRow}>
            <Button variant="ghost" onClick={() => setSelectedPatientId(null)}>← Todos los pacientes</Button>
          </div>

          {selectedPatient && <PatientSummaryCard patient={selectedPatient} patientName={patientName} />}

          <div style={styles.timeline}>
            {entries.map((h) => (
              <VisitAccordionItem
                key={h.id}
                entry={h}
                doctorName={doctorName}
                vitalsRow={vitalsRow}
                onEdit={() => setEditing(h)}
                onDelete={() => removeEntry(h.id)}
              />
            ))}
            {entries.length === 0 && <EmptyState text="Este paciente aún no tiene entradas en su historial." />}
          </div>

          <div style={styles.bottomDocBar}>
            <Button variant="ghost" onClick={() => setShowPrescription(true)}><FileText size={16} /> Receta médica</Button>
            <Button variant="ghost" onClick={() => setShowCertificate(true)}><FileCheck size={16} /> Certificado médico</Button>
          </div>
        </>
      )}

      {editing !== null && (
        <HistoryForm entry={editing} patients={patients} doctors={doctors} patientName={patientName} onCancel={() => setEditing(null)} onSave={saveEntry} />
      )}
      {showPrescription && selectedPatient && (
        <PrescriptionModal patient={selectedPatient} doctors={doctors} patientName={patientName} onClose={() => setShowPrescription(false)} />
      )}
      {showCertificate && selectedPatient && (
        <CertificateModal patient={selectedPatient} doctors={doctors} patientName={patientName} onClose={() => setShowCertificate(false)} />
      )}
    </div>
  );
}

function PatientSummaryCard({ patient, patientName }) {
  const antecedentes = [
    { label: "APP", value: patient.app },
    { label: "AQX", value: patient.aqx },
    { label: "Alergias", value: patient.allergies },
    { label: "APF", value: patient.apf },
  ].filter((a) => a.value && a.value !== "—");

  return (
    <div style={styles.summaryCard}>
      {patient.needsReview && (
        <div style={styles.reviewBanner}>
          <AlertTriangle size={14} /> El PDF original puede tener más atenciones de las que aquí se muestran; revisa el documento para confirmar fechas y signos vitales.
        </div>
      )}
      <div style={styles.cardTopRow}>
        <div style={styles.avatar}>{patientName(patient.id).split(" ").map((s) => s[0]).slice(0, 2).join("")}</div>
        <div style={{ flex: 1 }}>
          <div style={styles.cardTitle}>{patientName(patient.id)}</div>
          <div style={styles.cardMeta}>
            {calcAge(patient.birthDate)} · {patient.sex === "M" ? "Masculino" : patient.sex === "F" ? "Femenino" : "—"} · C.I. {patient.cedula || "—"} · {patient.historyNumber}
          </div>
        </div>
        {patient.sourceUrl && (
          <a href={patient.sourceUrl} target="_blank" rel="noopener noreferrer" style={styles.btnGhost}>
            <FileText size={15} /> Ver PDF original
          </a>
        )}
      </div>
      <div style={styles.summaryGrid}>
        <div><span style={styles.label}>Teléfono</span><p style={styles.value}>{patient.phone || "—"}</p></div>
        <div><span style={styles.label}>Dirección</span><p style={styles.value}>{patient.address || "—"}{patient.canton ? `, ${patient.canton}` : ""}</p></div>
        {patient.companionName && (
          <div><span style={styles.label}>Acompañante</span><p style={styles.value}>{patient.companionName} ({patient.companionRelation})</p></div>
        )}
      </div>
      {antecedentes.length > 0 && (
        <div style={styles.antecedentesRow}>
          {antecedentes.map((a) => (
            <div key={a.label} style={styles.antecedenteChip}>
              <span style={styles.antecedenteLabel}>{a.label}</span> {a.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VisitAccordionItem({ entry, doctorName, vitalsRow, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const summary = vitalsRow(entry);

  return (
    <div style={styles.timelineItem}>
      <div style={styles.timelineDot} />
      <div style={styles.timelineCard}>
        <button style={styles.accordionHeader} onClick={() => setOpen(!open)}>
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={styles.cardTitle}>{entry.date} · {doctorName(entry.doctorId)}</div>
            <div style={styles.cardMeta}>{entry.reason}</div>
          </div>
          <ChevronRight size={18} color="#8A8577" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
        </button>

        {open && (
          <div style={styles.accordionBody}>
            <div style={styles.cardActions}>
              <button style={styles.iconBtn} onClick={onEdit}><Edit3 size={15} /></button>
              <button style={styles.iconBtn} onClick={onDelete}><Trash2 size={15} /></button>
            </div>

            {summary && (
              <div style={styles.vitalsBlock}>
                <div style={styles.label}>Signos vitales</div>
                <div style={styles.vitalsRow}>
                  <Activity size={14} color="#E31C79" />
                  <span>{summary}</span>
                </div>
              </div>
            )}

            <div style={styles.evolBlock}>
              <div style={styles.label}>Notas de evolución</div>
              <p style={styles.value}>{entry.reason}</p>
              {entry.diagnosis && <p style={styles.value}><strong>Dx:</strong> {entry.diagnosis}</p>}
              {entry.notes && <p style={styles.value}>{entry.notes}</p>}
            </div>

            {entry.treatment && (
              <div style={styles.rxBlock}>
                <div style={styles.label}>Prescripción médica (Rp)</div>
                <p style={styles.value}>{entry.treatment}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AlphabetPatientPicker({ patients, patientName, onSelect, history }) {
  const [query, setQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState(null);

  const hasQuery = query.trim().length > 0;

  const visible = useMemo(() => {
    if (hasQuery) {
      return patients.filter((p) => patientName(p.id).toLowerCase().includes(query.trim().toLowerCase()));
    }
    if (activeLetter) {
      return patients.filter((p) => (p.lastNamePaternal || p.firstNames || "#").trim().charAt(0).toUpperCase() === activeLetter);
    }
    return [];
  }, [patients, query, activeLetter, hasQuery]);

  const sorted = useMemo(
    () => [...visible].sort((a, b) => patientName(a.id).localeCompare(patientName(b.id))).slice(0, 60),
    [visible]
  );

  const allLetters = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
  const lettersWithPatients = useMemo(() => {
    const set = new Set();
    patients.forEach((p) => set.add((p.lastNamePaternal || p.firstNames || "#").trim().charAt(0).toUpperCase()));
    return set;
  }, [patients]);

  return (
    <div style={styles.abcWrap}>
      <div style={styles.abcListCol}>
        <div style={styles.searchRow}>
          <Search size={16} color="#8A8577" />
          <input
            placeholder="Escribe un nombre para buscar…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveLetter(null); }}
            style={styles.searchInput}
          />
        </div>
        {!hasQuery && !activeLetter && (
          <div style={styles.lightHint}>Escribe un nombre o toca una letra para ver los pacientes.</div>
        )}
        <div style={styles.abcListScroll}>
          {sorted.map((p) => (
            <button key={p.id} onClick={() => onSelect(p.id)} style={styles.abcRow}>
              <div style={styles.avatar}>{patientName(p.id).split(" ").map((s) => s[0]).slice(0, 2).join("")}</div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={styles.cardTitle}>{patientName(p.id)}</div>
                <div style={styles.cardMeta}>{p.historyNumber} · {history.filter((h) => h.patientId === p.id).length} at.</div>
              </div>
              <ChevronRight size={16} color="#8A8577" />
            </button>
          ))}
          {(hasQuery || activeLetter) && sorted.length === 0 && <EmptyState text="No se encontraron pacientes." />}
          {visible.length > sorted.length && (
            <div style={styles.lightHint}>Mostrando los primeros {sorted.length} de {visible.length}. Afina la búsqueda para ver menos.</div>
          )}
        </div>
      </div>
      <div style={styles.abcBar}>
        {allLetters.map((letter) => (
          <button
            key={letter}
            onClick={() => { setActiveLetter(activeLetter === letter ? null : letter); setQuery(""); }}
            disabled={!lettersWithPatients.has(letter)}
            style={{
              ...styles.abcBarLetter,
              ...(lettersWithPatients.has(letter) ? styles.abcBarLetterActive : styles.abcBarLetterDisabled),
              ...(activeLetter === letter ? styles.abcBarLetterSelected : {}),
            }}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
}

function HistoryForm({ entry, patients, doctors, patientName, onCancel, onSave }) {
  const [form, setForm] = useState({
    id: entry.id, patientId: entry.patientId || patients[0]?.id, doctorId: entry.doctorId || doctors[0]?.id,
    date: entry.date || new Date().toISOString().slice(0, 10),
    reason: entry.reason || "",
    bp: entry.bp || "", hr: entry.hr || "", rr: entry.rr || "", temp: entry.temp || "",
    weight: entry.weight || "", height: entry.height || "", spo2: entry.spo2 || "", bmi: entry.bmi || "",
    diagnosis: entry.diagnosis || "", treatment: entry.treatment || "", notes: entry.notes || "",
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal title={entry.id ? "Editar entrada" : "Nueva entrada de historial"} onClose={onCancel} wide>
      <div style={styles.formGrid}>
        <Field label="Paciente">
          <Select value={form.patientId} onChange={set("patientId")}>
            {patients.map((p) => <option key={p.id} value={p.id}>{patientName(p.id)}</option>)}
          </Select>
        </Field>
        <Field label="Médico">
          <Select value={form.doctorId} onChange={set("doctorId")}>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
        <Field label="Fecha"><Input type="date" value={form.date} onChange={set("date")} /></Field>
        <Field label="Enfermedad actual / motivo" full><Input value={form.reason} onChange={set("reason")} /></Field>
      </div>

      <SubHeading>Signos vitales</SubHeading>
      <div style={styles.vitalsGrid}>
        <Field label="Presión arterial"><Input value={form.bp} onChange={set("bp")} placeholder="120/80" /></Field>
        <Field label="F. cardiaca"><Input value={form.hr} onChange={set("hr")} placeholder="lpm" /></Field>
        <Field label="F. respiratoria"><Input value={form.rr} onChange={set("rr")} placeholder="rpm" /></Field>
        <Field label="Temperatura"><Input value={form.temp} onChange={set("temp")} placeholder="°C" /></Field>
        <Field label="Peso"><Input value={form.weight} onChange={set("weight")} placeholder="kg" /></Field>
        <Field label="Talla"><Input value={form.height} onChange={set("height")} placeholder="cm" /></Field>
        <Field label="Saturación O2"><Input value={form.spo2} onChange={set("spo2")} placeholder="%" /></Field>
        <Field label="IMC"><Input value={form.bmi} onChange={set("bmi")} /></Field>
      </div>

      <SubHeading>Evaluación</SubHeading>
      <div style={styles.formGrid}>
        <Field label="Diagnóstico" full><TextArea value={form.diagnosis} onChange={set("diagnosis")} /></Field>
        <Field label="Tratamiento" full><TextArea value={form.treatment} onChange={set("treatment")} /></Field>
        <Field label="Notas adicionales" full><TextArea value={form.notes} onChange={set("notes")} /></Field>
      </div>
      <div style={styles.modalFooter}>
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => form.reason && onSave(form)}><Check size={15} /> Guardar</Button>
      </div>
    </Modal>
  );
}

// ---------- Citas ----------
function AppointmentsView({ appointments, setAppointments, patients, doctors, patientName, doctorName }) {
  const [editing, setEditing] = useState(null);
  const sorted = [...appointments].sort((a, b) => (a.date + a.time > b.date + b.time ? 1 : -1));

  function saveAppt(data) {
    if (data.id) setAppointments((prev) => prev.map((a) => (a.id === data.id ? data : a)));
    else setAppointments((prev) => [...prev, { ...data, id: uid("a") }]);
    setEditing(null);
  }
  function removeAppt(id) { setAppointments((prev) => prev.filter((a) => a.id !== id)); }
  function toggleStatus(a) {
    const next = a.status === "pendiente" ? "confirmada" : a.status === "confirmada" ? "completada" : "pendiente";
    setAppointments((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: next } : x)));
  }
  const toneFor = (s) => s === "completada" ? "success" : s === "confirmada" ? "accent" : "warning";

  return (
    <div>
      <SectionHeader
        title="Citas"
        subtitle={`${appointments.length} programadas`}
        action={<Button onClick={() => setEditing({ patientId: patients[0]?.id, doctorId: doctors[0]?.id })}><Plus size={16} /> Nueva cita</Button>}
      />
      <div style={styles.list}>
        {sorted.map((a) => (
          <div key={a.id} style={styles.listRow}>
            <div style={styles.apptDate}>
              <Clock size={14} color="#8A8577" />
              <span>{a.date} · {a.time}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={styles.cardTitle}>{patientName(a.patientId)}</div>
              <div style={styles.cardMeta}>{doctorName(a.doctorId)}</div>
            </div>
            <button onClick={() => toggleStatus(a)} style={{ border: "none", background: "none", cursor: "pointer" }}>
              <Badge tone={toneFor(a.status)}>{a.status}</Badge>
            </button>
            <div style={styles.cardActions}>
              <button style={styles.iconBtn} onClick={() => setEditing(a)}><Edit3 size={15} /></button>
              <button style={styles.iconBtn} onClick={() => removeAppt(a.id)}><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && <EmptyState text="No hay citas programadas." />}
      </div>

      {editing !== null && (
        <AppointmentForm appt={editing} patients={patients} doctors={doctors} patientName={patientName} onCancel={() => setEditing(null)} onSave={saveAppt} />
      )}
    </div>
  );
}

function AppointmentForm({ appt, patients, doctors, patientName, onCancel, onSave }) {
  const [form, setForm] = useState({
    id: appt.id, patientId: appt.patientId, doctorId: appt.doctorId,
    date: appt.date || new Date().toISOString().slice(0, 10),
    time: appt.time || "09:00", status: appt.status || "pendiente",
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal title={appt.id ? "Editar cita" : "Nueva cita"} onClose={onCancel}>
      <div style={styles.formGrid}>
        <Field label="Paciente">
          <Select value={form.patientId} onChange={set("patientId")}>
            {patients.map((p) => <option key={p.id} value={p.id}>{patientName(p.id)}</option>)}
          </Select>
        </Field>
        <Field label="Médico">
          <Select value={form.doctorId} onChange={set("doctorId")}>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
        <Field label="Fecha"><Input type="date" value={form.date} onChange={set("date")} /></Field>
        <Field label="Hora"><Input type="time" value={form.time} onChange={set("time")} /></Field>
        <Field label="Estado">
          <Select value={form.status} onChange={set("status")}>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="completada">Completada</option>
          </Select>
        </Field>
      </div>
      <div style={styles.modalFooter}>
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSave(form)}><Check size={15} /> Guardar</Button>
      </div>
    </Modal>
  );
}

// ---------- Facturación ----------
function BillingView({ billing, setBilling, patients, patientName }) {
  const [editing, setEditing] = useState(null);
  const total = billing.reduce((s, b) => s + Number(b.amount || 0), 0);
  const pending = billing.filter((b) => b.status === "pendiente").reduce((s, b) => s + Number(b.amount || 0), 0);

  function saveBill(data) {
    if (data.id) setBilling((prev) => prev.map((b) => (b.id === data.id ? data : b)));
    else setBilling((prev) => [...prev, { ...data, id: uid("b") }]);
    setEditing(null);
  }
  function removeBill(id) { setBilling((prev) => prev.filter((b) => b.id !== id)); }
  function toggleStatus(b) {
    setBilling((prev) => prev.map((x) => x.id === b.id ? { ...x, status: x.status === "pagado" ? "pendiente" : "pagado" } : x));
  }

  return (
    <div>
      <SectionHeader
        title="Facturación"
        subtitle="Cobros por consulta"
        action={<Button onClick={() => setEditing({ patientId: patients[0]?.id })}><Plus size={16} /> Nuevo cobro</Button>}
      />
      <div style={styles.statsRow}>
        <div style={styles.statCard}><div style={styles.statLabel}>Total facturado</div><div style={styles.statValue}>${total.toFixed(2)}</div></div>
        <div style={styles.statCard}><div style={styles.statLabel}>Pendiente de pago</div><div style={{ ...styles.statValue, color: "#9B3B2C" }}>${pending.toFixed(2)}</div></div>
        <div style={styles.statCard}><div style={styles.statLabel}>Registros</div><div style={styles.statValue}>{billing.length}</div></div>
      </div>

      <div style={styles.list}>
        {billing.map((b) => (
          <div key={b.id} style={styles.listRow}>
            <div style={{ flex: 1 }}>
              <div style={styles.cardTitle}>{patientName(b.patientId)}</div>
              <div style={styles.cardMeta}>{b.concept}</div>
            </div>
            <div style={styles.amount}><DollarSign size={14} />{Number(b.amount).toFixed(2)}</div>
            <button onClick={() => toggleStatus(b)} style={{ border: "none", background: "none", cursor: "pointer" }}>
              <Badge tone={b.status === "pagado" ? "success" : "warning"}>{b.status}</Badge>
            </button>
            <div style={styles.cardActions}>
              <button style={styles.iconBtn} onClick={() => setEditing(b)}><Edit3 size={15} /></button>
              <button style={styles.iconBtn} onClick={() => removeBill(b.id)}><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {billing.length === 0 && <EmptyState text="No hay cobros registrados." />}
      </div>

      {editing !== null && (
        <BillingForm bill={editing} patients={patients} patientName={patientName} onCancel={() => setEditing(null)} onSave={saveBill} />
      )}
    </div>
  );
}

function BillingForm({ bill, patients, patientName, onCancel, onSave }) {
  const [form, setForm] = useState({
    id: bill.id, patientId: bill.patientId, concept: bill.concept || "",
    amount: bill.amount || "", status: bill.status || "pendiente",
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal title={bill.id ? "Editar cobro" : "Nuevo cobro"} onClose={onCancel}>
      <div style={styles.formGrid}>
        <Field label="Paciente">
          <Select value={form.patientId} onChange={set("patientId")}>
            {patients.map((p) => <option key={p.id} value={p.id}>{patientName(p.id)}</option>)}
          </Select>
        </Field>
        <Field label="Concepto"><Input value={form.concept} onChange={set("concept")} placeholder="Consulta general" /></Field>
        <Field label="Monto (USD)"><Input type="number" value={form.amount} onChange={set("amount")} /></Field>
        <Field label="Estado">
          <Select value={form.status} onChange={set("status")}>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
          </Select>
        </Field>
      </div>
      <div style={styles.modalFooter}>
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => form.concept && onSave({ ...form, amount: Number(form.amount) || 0 })}>
          <Check size={15} /> Guardar
        </Button>
      </div>
    </Modal>
  );
}

// ---------- Receta médica ----------
function PrintLetterhead({ patient, doctor, patientName, dateStr }) {
  return (
    <div style={styles.printHeader}>
      <div style={styles.printLogoRow}>
        <svg width="30" height="30" viewBox="0 0 24 24">
          <clipPath id="crossClipPrint">
            <rect x="9" y="2" width="6" height="20" rx="3" />
            <rect x="2" y="9" width="20" height="6" rx="3" />
          </clipPath>
          <g clipPath="url(#crossClipPrint)">
            <polygon points="0,0 24,0 0,24" fill="#E31C79" />
            <polygon points="24,0 24,24 0,24" fill="#159E93" />
          </g>
        </svg>
        <div>
          <div style={styles.printClinicName}>HOME DOCTOR IBARRA</div>
          <div style={styles.printClinicTag}>La salud en su hogar</div>
        </div>
      </div>
      <div style={styles.printMetaGrid}>
        <div><span style={styles.printLabel}>Paciente:</span> {patientName}</div>
        <div><span style={styles.printLabel}>Fecha:</span> {dateStr}</div>
        <div><span style={styles.printLabel}>Edad:</span> {calcAge(patient?.birthDate)}</div>
        <div><span style={styles.printLabel}>C.I.:</span> {patient?.cedula || "—"}</div>
        <div style={{ gridColumn: "1 / -1" }}><span style={styles.printLabel}>Médico:</span> {doctor?.name} — {doctor?.specialty}</div>
      </div>
    </div>
  );
}

function PrescriptionModal({ patient, doctors, patientName, onClose }) {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [meds, setMeds] = useState([{ id: uid("m"), name: "", dose: "", frequency: "", duration: "" }]);
  const [indications, setIndications] = useState("");

  const doctor = doctors.find((d) => d.id === doctorId);

  const setMed = (id, key) => (e) => setMeds((prev) => prev.map((m) => (m.id === id ? { ...m, [key]: e.target.value } : m)));
  const addMed = () => setMeds((prev) => [...prev, { id: uid("m"), name: "", dose: "", frequency: "", duration: "" }]);
  const removeMed = (id) => setMeds((prev) => prev.filter((m) => m.id !== id));

  return (
    <Modal title={`Receta médica — ${patientName(patient.id)}`} onClose={onClose} wide>
      <div style={styles.docLayout}>
        <div>
          <div style={styles.formGrid}>
            <Field label="Médico">
              <Select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Fecha"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          </div>

          <SubHeading>Medicamentos</SubHeading>
          {meds.map((m) => (
            <div key={m.id} style={styles.medRow}>
              <Input placeholder="Medicamento" value={m.name} onChange={setMed(m.id, "name")} style={{ flex: 2 }} />
              <Input placeholder="Dosis" value={m.dose} onChange={setMed(m.id, "dose")} style={{ flex: 1 }} />
              <Input placeholder="Frecuencia" value={m.frequency} onChange={setMed(m.id, "frequency")} style={{ flex: 1 }} />
              <Input placeholder="Duración" value={m.duration} onChange={setMed(m.id, "duration")} style={{ flex: 1 }} />
              <button style={styles.iconBtn} onClick={() => removeMed(m.id)}><Trash2 size={15} /></button>
            </div>
          ))}
          <Button variant="ghost" onClick={addMed} style={{ marginTop: 6 }}><Plus size={15} /> Agregar medicamento</Button>

          <SubHeading>Indicaciones generales</SubHeading>
          <TextArea value={indications} onChange={(e) => setIndications(e.target.value)} placeholder="Reposo, hidratación, signos de alarma…" />
        </div>

        <div id="print-area" style={styles.docPreview}>
          <PrintLetterhead patient={patient} doctor={doctor} patientName={patientName(patient.id)} dateStr={date} />
          <div style={styles.printRx}>Rp/</div>
          {meds.filter((m) => m.name).map((m) => (
            <div key={m.id} style={styles.printMedLine}>
              <strong>{m.name}</strong> — {m.dose} {m.frequency && `· ${m.frequency}`} {m.duration && `· ${m.duration}`}
            </div>
          ))}
          {meds.every((m) => !m.name) && <div style={styles.printPlaceholder}>Agrega medicamentos para verlos aquí.</div>}
          {indications && (
            <div style={styles.printIndications}>
              <span style={styles.printLabel}>Indicaciones:</span> {indications}
            </div>
          )}
          <div style={styles.printSignature}>
            <div style={styles.printSignLine} />
            <div style={styles.printSignName}>{doctor?.name}</div>
            <div style={styles.printClinicTag}>{doctor?.specialty}</div>
          </div>
        </div>
      </div>
      <div style={styles.modalFooter}>
        <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        <div style={styles.pdfHint}>Se abrirá el diálogo de impresión: elige "Guardar como PDF" como destino.</div>
        <Button onClick={() => window.print()}><Download size={15} /> Guardar como PDF (A4)</Button>
      </div>
    </Modal>
  );
}

// ---------- Certificado médico ----------
const CERT_TYPES = [
  { value: "reposo", label: "Reposo médico" },
  { value: "salud", label: "Certificado de buena salud" },
  { value: "asistencia", label: "Justificación de asistencia" },
];

function CertificateModal({ patient, doctors, patientName, onClose }) {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState("reposo");
  const [days, setDays] = useState("2");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const doctor = doctors.find((d) => d.id === doctorId);
  const typeLabel = CERT_TYPES.find((t) => t.value === type)?.label || "";

  const bodyText = () => {
    const name = patientName(patient.id);
    if (type === "reposo") {
      return `Certifico que el/la paciente ${name}, portador/a de C.I. ${patient?.cedula || "—"}, ha sido atendido/a en esta consulta y requiere ${days} día(s) de reposo médico a partir del ${date}, por motivo de: ${reason || "—"}.`;
    }
    if (type === "salud") {
      return `Certifico que el/la paciente ${name}, portador/a de C.I. ${patient?.cedula || "—"}, fue evaluado/a en esta fecha y se encuentra en buen estado de salud general. ${reason || ""}`;
    }
    return `Certifico que el/la paciente ${name}, portador/a de C.I. ${patient?.cedula || "—"}, acudió a consulta médica el día ${date} por motivo de: ${reason || "—"}, por lo que se justifica su inasistencia.`;
  };

  return (
    <Modal title={`Certificado médico — ${patientName(patient.id)}`} onClose={onClose} wide>
      <div style={styles.docLayout}>
        <div>
          <div style={styles.formGrid}>
            <Field label="Médico">
              <Select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Fecha"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Tipo de certificado">
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                {CERT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
            {type === "reposo" && (
              <Field label="Días de reposo"><Input type="number" value={days} onChange={(e) => setDays(e.target.value)} /></Field>
            )}
            <Field label="Motivo / diagnóstico" full><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
            <Field label="Notas adicionales" full><TextArea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          </div>
        </div>

        <div id="print-area" style={styles.docPreview}>
          <PrintLetterhead patient={patient} doctor={doctor} patientName={patientName(patient.id)} dateStr={date} />
          <div style={styles.printCertTitle}>{typeLabel.toUpperCase()}</div>
          <p style={styles.printCertBody}>{bodyText()}</p>
          {notes && <p style={styles.printCertBody}>{notes}</p>}
          <div style={styles.printSignature}>
            <div style={styles.printSignLine} />
            <div style={styles.printSignName}>{doctor?.name}</div>
            <div style={styles.printClinicTag}>{doctor?.specialty}</div>
          </div>
        </div>
      </div>
      <div style={styles.modalFooter}>
        <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        <div style={styles.pdfHint}>Se abrirá el diálogo de impresión: elige "Guardar como PDF" como destino.</div>
        <Button onClick={() => window.print()}><Download size={15} /> Guardar como PDF (A4)</Button>
      </div>
    </Modal>
  );
}

// ---------- Médicos ----------
function DoctorsView({ doctors, setDoctors }) {
  const [editing, setEditing] = useState(null);
  function saveDoctor(data) {
    if (data.id) setDoctors((prev) => prev.map((d) => (d.id === data.id ? data : d)));
    else setDoctors((prev) => [...prev, { ...data, id: uid("d") }]);
    setEditing(null);
  }
  function removeDoctor(id) { setDoctors((prev) => prev.filter((d) => d.id !== id)); }

  return (
    <div>
      <SectionHeader
        title="Médicos"
        subtitle={`${doctors.length} en el consultorio`}
        action={<Button onClick={() => setEditing({})}><Plus size={16} /> Nuevo médico</Button>}
      />
      <div style={styles.grid}>
        {doctors.map((d) => (
          <div key={d.id} style={styles.card}>
            <div style={styles.cardTopRow}>
              <div style={styles.avatarAlt}><Stethoscope size={18} color="#E31C79" /></div>
              <div style={{ flex: 1 }}>
                <div style={styles.cardTitle}>{d.name}</div>
                <div style={styles.cardMeta}>{d.specialty}</div>
              </div>
            </div>
            <div style={styles.cardActions}>
              <button style={styles.iconBtn} onClick={() => setEditing(d)}><Edit3 size={15} /></button>
              <button style={styles.iconBtn} onClick={() => removeDoctor(d.id)}><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>

      {editing !== null && (
        <DoctorForm doctor={editing} onCancel={() => setEditing(null)} onSave={saveDoctor} />
      )}
    </div>
  );
}

function DoctorForm({ doctor, onCancel, onSave }) {
  const [form, setForm] = useState({ id: doctor.id, name: doctor.name || "", specialty: doctor.specialty || "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal title={doctor.id ? "Editar médico" : "Nuevo médico"} onClose={onCancel}>
      <div style={styles.formGrid}>
        <Field label="Nombre"><Input value={form.name} onChange={set("name")} placeholder="Dr./Dra. Nombre Apellido" /></Field>
        <Field label="Especialidad"><Input value={form.specialty} onChange={set("specialty")} /></Field>
      </div>
      <div style={styles.modalFooter}>
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => form.name && onSave(form)}><Check size={15} /> Guardar</Button>
      </div>
    </Modal>
  );
}

// ---------- Utilitarios ----------
function Field({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto" }}>
      <label style={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}
function EmptyState({ text }) {
  return <div style={styles.empty}>{text}</div>;
}

// ---------- Estilos ----------
// Paleta tomada de la tarjeta "Home Doctor Ibarra": teal + magenta sobre blanco
const TEAL = "#159E93";
const TEAL_DARK = "#0E7268";
const MAGENTA = "#E31C79";
const MAGENTA_LIGHT = "#FCE3F0";
const TEAL_LIGHT = "#DFF3F1";

const styles = {
  app: { fontFamily: "'Segoe UI', -apple-system, sans-serif", background: "#FAFAF8", minHeight: "100vh", color: "#26312F" },
  header: { background: "#fff", padding: "14px 24px", position: "sticky", top: 0, zIndex: 10, borderBottom: `3px solid ${TEAL}`, backgroundImage: `linear-gradient(120deg, ${MAGENTA_LIGHT} 0%, #fff 22%, #fff 78%, ${TEAL_LIGHT} 100%)` },
  headerInner: { maxWidth: 1180, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  brandMark: { width: 38, height: 38, borderRadius: 10, background: "#fff", border: `1px solid #E4E0D3`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" },
  brandTitle: { color: TEAL_DARK, fontSize: 17, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase" },
  brandSub: { color: MAGENTA, fontSize: 12, fontWeight: 600 },
  notifBtn: { display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", border: "1px solid #E4E0D3", color: "#5C574C", padding: "8px 14px", borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  notifBtnActive: { background: TEAL_LIGHT, color: TEAL_DARK, border: `1px solid ${TEAL}` },
  body: { display: "flex", maxWidth: 1180, margin: "0 auto" },
  sidebar: { width: 220, padding: "24px 12px", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, transition: "width 0.18s ease" },
  sidebarCollapsed: { width: 60, padding: "24px 8px", alignItems: "center" },
  sidebarToggle: { color: "#8A8577", marginBottom: 10, borderBottom: "1px solid #EFEBDF", borderRadius: 0, paddingBottom: 14 },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: "none", background: "transparent", color: "#5C574C", fontSize: 14, cursor: "pointer", textAlign: "left" },
  navItemCollapsed: { padding: "10px", justifyContent: "center", width: 40 },
  navItemActive: { background: TEAL_LIGHT, color: TEAL_DARK, fontWeight: 700, boxShadow: `inset 3px 0 0 ${MAGENTA}` },
  main: { flex: 1, padding: "24px 24px 60px", minWidth: 0 },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  sectionTitle: { fontSize: 22, fontWeight: 700, margin: 0, color: TEAL_DARK, textTransform: "uppercase", letterSpacing: 0.3 },
  sectionSubtitle: { fontSize: 13, color: "#8A8577", margin: "4px 0 0" },
  btnPrimary: { display: "inline-flex", alignItems: "center", gap: 6, background: MAGENTA, color: "#fff", border: "none", padding: "9px 16px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" },
  btnGhost: { display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", color: TEAL_DARK, border: `1px solid ${TEAL}`, padding: "8px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnDanger: { display: "inline-flex", alignItems: "center", gap: 6, background: "#9B3B2C", color: "#fff", border: "none", padding: "9px 16px", borderRadius: 8, fontSize: 14, cursor: "pointer" },
  searchRow: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #E4E0D3", borderRadius: 8, padding: "8px 12px", marginBottom: 18, maxWidth: 340 },
  searchInput: { border: "none", outline: "none", fontSize: 14, flex: 1, background: "transparent" },
  filterRow: { marginBottom: 18 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 },
  card: { background: "#fff", border: "1px solid #E4E0D3", borderTop: `3px solid ${TEAL}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 },
  cardTopRow: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  avatar: { width: 42, height: 42, borderRadius: "50%", background: TEAL_LIGHT, color: TEAL_DARK, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 },
  avatarAlt: { width: 42, height: 42, borderRadius: 10, background: MAGENTA_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: TEAL_DARK },
  cardMeta: { fontSize: 13, color: "#8A8577", marginTop: 2 },
  cardDetails: { display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid #EFEBDF", paddingTop: 10 },
  detailRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#5C574C" },
  cardActions: { display: "flex", alignItems: "center", gap: 6, marginTop: "auto" },
  iconBtn: { border: "none", background: "transparent", color: "#8A8577", cursor: "pointer", padding: 6, borderRadius: 6, display: "flex" },
  badge: { fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20, textTransform: "capitalize" },
  empty: { color: "#8A8577", fontSize: 14, padding: "30px 0", textAlign: "center", gridColumn: "1 / -1" },
  overlay: { position: "fixed", inset: 0, background: "rgba(14,114,104,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 },
  modal: { background: "#fff", borderRadius: 14, width: "100%", maxWidth: 520, maxHeight: "88vh", overflow: "auto", boxShadow: "0 20px 50px rgba(0,0,0,0.2)", borderTop: `4px solid ${MAGENTA}` },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #EFEBDF", position: "sticky", top: 0, background: "#fff" },
  modalTitle: { fontSize: 16, fontWeight: 700, margin: 0, color: TEAL_DARK, textTransform: "uppercase", letterSpacing: 0.3 },
  modalBody: { padding: 20 },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 20px", borderTop: "1px solid #EFEBDF", alignItems: "center", flexWrap: "wrap" },
  importTextarea: { width: "100%", minHeight: 220, fontFamily: "monospace", fontSize: 12.5, padding: 12, borderRadius: 10, border: "1px solid #E4E0D3", resize: "vertical", boxSizing: "border-box" },
  pdfHint: { fontSize: 11.5, color: "#8A8577", marginRight: "auto" },
  sourceLink: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: TEAL_DARK, background: TEAL_LIGHT, padding: "6px 10px", borderRadius: 8, textDecoration: "none", fontWeight: 600, marginBottom: 4 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  vitalsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  subHeading: { fontSize: 12, fontWeight: 700, color: "#fff", background: MAGENTA, textTransform: "uppercase", letterSpacing: 0.4, padding: "6px 10px", borderRadius: 6, margin: "18px 0 12px" },
  fieldLabel: { display: "block", fontSize: 12.5, fontWeight: 600, color: "#5C574C", marginBottom: 6 },
  input: { width: "100%", border: "1px solid #DCD7C8", borderRadius: 8, padding: "9px 11px", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  textarea: { minHeight: 64, resize: "vertical" },
  timeline: { display: "flex", flexDirection: "column", gap: 0, position: "relative" },
  timelineItem: { display: "flex", gap: 14, position: "relative", paddingBottom: 18 },
  timelineDot: { width: 10, height: 10, borderRadius: "50%", background: MAGENTA, marginTop: 8, flexShrink: 0 },
  timelineCard: { flex: 1, background: "#fff", border: "1px solid #E4E0D3", borderLeft: `3px solid ${TEAL}`, borderRadius: 12, overflow: "hidden" },
  accordionHeader: { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: 16, border: "none", background: "transparent", cursor: "pointer" },
  accordionBody: { padding: "0 16px 16px", borderTop: "1px solid #EFEBDF", display: "flex", flexDirection: "column", gap: 12 },
  vitalsBlock: { display: "flex", flexDirection: "column", gap: 6, marginTop: 4 },
  evolBlock: { display: "flex", flexDirection: "column", gap: 4 },
  rxBlock: { display: "flex", flexDirection: "column", gap: 4, background: MAGENTA_LIGHT, borderRadius: 8, padding: "10px 12px" },
  summaryCard: { background: "#fff", border: "1px solid #E4E0D3", borderTop: `3px solid ${MAGENTA}`, borderRadius: 12, padding: 16, marginBottom: 18, display: "flex", flexDirection: "column", gap: 12 },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, borderTop: "1px solid #EFEBDF", paddingTop: 12 },
  antecedentesRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  antecedenteChip: { fontSize: 12.5, color: "#5C574C", background: TEAL_LIGHT, borderRadius: 20, padding: "6px 12px" },
  antecedenteLabel: { fontWeight: 700, color: TEAL_DARK, marginRight: 4 },
  reviewBanner: { display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#8A5A17", background: "#F7E7CE", borderRadius: 8, padding: "8px 12px" },
  lightHint: { fontSize: 12.5, color: "#8A8577", padding: "8px 4px 14px" },
  compactList: { display: "flex", flexDirection: "column", gap: 8 },
  compactWrap: { background: "#fff", border: "1px solid #E4E0D3", borderRadius: 10, overflow: "hidden" },
  compactRow: { display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", border: "none", background: "transparent", cursor: "pointer" },
  compactDetail: { padding: "0 14px 14px", borderTop: "1px solid #EFEBDF", display: "flex", flexDirection: "column", gap: 10 },
  historyGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12, borderTop: "1px solid #EFEBDF", paddingTop: 12 },
  vitalsRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#5C574C", marginTop: 12, background: TEAL_LIGHT, borderRadius: 8, padding: "8px 10px", flexWrap: "wrap" },
  bottomDocBar: { display: "flex", gap: 10, justifyContent: "center", marginTop: 24, paddingTop: 18, borderTop: "1px solid #E4E0D3", flexWrap: "wrap" },
  label: { fontSize: 11.5, fontWeight: 700, color: MAGENTA, textTransform: "uppercase", letterSpacing: 0.4 },
  value: { fontSize: 13.5, color: "#2C2A24", margin: "4px 0 0" },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  listRow: { display: "flex", alignItems: "center", gap: 16, background: "#fff", border: "1px solid #E4E0D3", borderRadius: 10, padding: "12px 16px" },
  apptDate: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#5C574C", minWidth: 150 },
  amount: { display: "flex", alignItems: "center", fontSize: 14, fontWeight: 700, color: TEAL_DARK },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 18 },
  statCard: { background: "#fff", border: "1px solid #E4E0D3", borderRadius: 12, padding: "14px 16px", borderTop: `3px solid ${MAGENTA}` },
  statLabel: { fontSize: 12.5, color: "#8A8577", marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: 700, color: TEAL_DARK },

  homeWrap: { display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0 10px" },
  homeLogoBlock: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 34 },
  homeLogoRing: { width: 168, height: 168, borderRadius: "50%", background: `linear-gradient(135deg, ${TEAL}, ${MAGENTA})`, padding: 4, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, boxShadow: "0 18px 40px rgba(21,158,147,0.22), 0 4px 14px rgba(227,28,121,0.12)" },
  homeLogoMark: { width: "100%", height: "100%", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.03)" },
  homeTitle: { fontSize: 32, fontWeight: 800, color: TEAL_DARK, textTransform: "uppercase", letterSpacing: 2.5 },
  homeDivider: { width: 54, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${TEAL}, ${MAGENTA})`, margin: "12px 0" },
  homeSubtitle: { fontSize: 16, fontWeight: 700, color: MAGENTA, letterSpacing: 0.5, fontStyle: "italic" },
  homeTagline: { fontSize: 13, color: "#8A8577", marginTop: 10 },
  homeStatsRow: { display: "flex", gap: 8, marginBottom: 30, flexWrap: "wrap", justifyContent: "center" },
  homeStatCard: { background: "#fff", border: "1px solid #E4E0D3", borderRadius: 6, padding: "5px 10px", textAlign: "center", minWidth: 62 },
  homeStatValue: { fontSize: 13, fontWeight: 800, color: TEAL_DARK },
  homeStatLabel: { fontSize: 7.5, color: "#8A8577", marginTop: 1, textTransform: "uppercase", letterSpacing: 0.15 },
  homeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, width: "100%", maxWidth: 900 },
  homeCard: { position: "relative", background: "#fff", border: "1px solid #E4E0D3", borderRadius: 16, padding: "28px 22px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, cursor: "pointer", textAlign: "left", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", transition: "transform 0.15s, box-shadow 0.15s" },
  homeCardIcon: { width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  homeCardTitle: { fontSize: 17, fontWeight: 700, color: TEAL_DARK },
  homeCardDesc: { fontSize: 13, color: "#8A8577", lineHeight: 1.4 },
  homeCardArrow: { position: "absolute", top: 22, right: 20, color: MAGENTA },

  abcWrap: { display: "flex", gap: 6, alignItems: "flex-start" },
  abcListCol: { flex: 1, minWidth: 0 },
  abcListScroll: { maxHeight: 520, overflowY: "auto", background: "#fff", border: "1px solid #E4E0D3", borderRadius: 12 },
  abcGroupLabel: { position: "sticky", top: 0, background: TEAL_LIGHT, color: TEAL_DARK, fontSize: 12, fontWeight: 800, padding: "5px 14px", letterSpacing: 0.5 },
  abcRow: { display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 14px", border: "none", borderBottom: "1px solid #F1EEE3", background: "transparent", cursor: "pointer", textAlign: "left" },
  abcBar: { display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "6px 4px", background: "#fff", border: "1px solid #E4E0D3", borderRadius: 20, position: "sticky", top: 90 },
  abcBarLetter: { border: "none", background: "transparent", fontSize: 10, width: 18, height: 14, cursor: "pointer", padding: 0, fontWeight: 700 },
  abcBarLetterActive: { color: MAGENTA },
  abcBarLetterDisabled: { color: "#D8D3C4", cursor: "default" },
  abcBarLetterSelected: { background: MAGENTA, color: "#fff", borderRadius: 4 },

  docLayout: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" },
  docForm: { background: "#fff", border: "1px solid #E4E0D3", borderRadius: 12, padding: 18 },
  docPreview: { background: "#fff", border: "1px solid #E4E0D3", borderRadius: 12, padding: 22, minHeight: 420 },
  medRow: { display: "flex", gap: 8, alignItems: "center", marginBottom: 8 },

  printHeader: { borderBottom: `2px solid ${TEAL}`, paddingBottom: 12, marginBottom: 16 },
  printLogoRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  printClinicName: { fontSize: 15, fontWeight: 800, color: TEAL_DARK, letterSpacing: 0.5 },
  printClinicTag: { fontSize: 11, color: MAGENTA, fontWeight: 600 },
  printMetaGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 13, color: "#26312F" },
  printLabel: { fontWeight: 700, color: TEAL_DARK },
  printRx: { fontSize: 20, fontWeight: 800, color: MAGENTA, marginBottom: 10 },
  printMedLine: { fontSize: 13.5, padding: "6px 0", borderBottom: "1px dashed #E4E0D3" },
  printPlaceholder: { fontSize: 13, color: "#B7B2A2", fontStyle: "italic" },
  printIndications: { fontSize: 13, marginTop: 16, lineHeight: 1.5 },
  printCertTitle: { fontSize: 16, fontWeight: 800, color: TEAL_DARK, textAlign: "center", margin: "10px 0 18px", letterSpacing: 0.5 },
  printCertBody: { fontSize: 13.5, lineHeight: 1.7, color: "#26312F", marginBottom: 12 },
  printSignature: { marginTop: 48, textAlign: "center" },
  printSignLine: { width: 220, borderTop: "1px solid #26312F", margin: "0 auto 6px" },
  printSignName: { fontSize: 13, fontWeight: 700, color: TEAL_DARK },
};
