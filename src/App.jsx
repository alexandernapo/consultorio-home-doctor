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
      
