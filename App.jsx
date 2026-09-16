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

const MEDICATION_CATALOG = [
  { name: "Amoxicilina", concentration: "500mg", form: "Sólido oral" },
  { name: "Amoxicilina + Ácido Clavulánico", concentration: "875/125mg", form: "Sólido oral" },
  { name: "Azitromicina", concentration: "500mg", form: "Sólido oral" },
  { name: "Penicilina Benzatínica", concentration: "1'200.000 UI", form: "Inyectable IM" },
  { name: "Cefuroxima", concentration: "500mg", form: "Sólido oral" },
  { name: "Ciprofloxacino", concentration: "500mg", form: "Sólido oral" },
  { name: "Dicloxacilina", concentration: "500mg", form: "Sólido oral" },
  { name: "Nitrofurantoína", concentration: "100mg", form: "Sólido oral" },
  { name: "Trimetoprim + Sulfametoxazol", concentration: "800/160mg", form: "Sólido oral" },
  { name: "Metronidazol", concentration: "500mg", form: "Sólido oral" },
  { name: "Fluconazol", concentration: "150mg", form: "Sólido oral" },
  { name: "Paracetamol", concentration: "500mg", form: "Sólido oral" },
  { name: "Ibuprofeno", concentration: "400mg", form: "Sólido oral" },
  { name: "Diclofenaco", concentration: "50mg", form: "Sólido oral" },
  { name: "Diclofenaco", concentration: "75mg", form: "Inyectable IM" },
  { name: "Ketorolaco", concentration: "10mg", form: "Sólido oral" },
  { name: "Metamizol (Novalgina)", concentration: "500mg", form: "Sólido oral" },
  { name: "Dexametasona", concentration: "4mg", form: "Inyectable IM" },
  { name: "Prednisona", concentration: "50mg", form: "Sólido oral" },
  { name: "Betametasona", concentration: "1mg", form: "Sólido oral" },
  { name: "Loratadina", concentration: "10mg", form: "Sólido oral" },
  { name: "Cetirizina", concentration: "10mg", form: "Sólido oral" },
  { name: "Omeprazol", concentration: "20mg", form: "Sólido oral" },
  { name: "Esomeprazol", concentration: "40mg", form: "Sólido oral" },
  { name: "Metoclopramida", concentration: "10mg", form: "Sólido oral" },
  { name: "Ondansetrón", concentration: "4mg", form: "Sólido oral" },
  { name: "Ambroxol", concentration: "30mg/5ml", form: "Jarabe" },
  { name: "Salbutamol", concentration: "100mcg", form: "Inhalador" },
  { name: "Complejo B", concentration: "—", form: "Inyectable IM" },
  { name: "Ácido Fólico", concentration: "5mg", form: "Sólido oral" },
  { name: "Sulfato Ferroso", concentration: "300mg", form: "Sólido oral" },
  { name: "Losartán", concentration: "50mg", form: "Sólido oral" },
  { name: "Amlodipino", concentration: "5mg", form: "Sólido oral" },
  { name: "Metformina", concentration: "850mg", form: "Sólido oral" },
  { name: "Levotiroxina", concentration: "50mcg", form: "Sólido oral" },
  { name: "Atorvastatina", concentration: "20mg", form: "Sólido oral" },
  { name: "Sertralina", concentration: "50mg", form: "Sólido oral" },
  { name: "Betahistina", concentration: "16mg", form: "Sólido oral" },
  { name: "Levetiracetam", concentration: "1000mg", form: "Sólido oral" },
  { name: "Carbamazepina", concentration: "400mg", form: "Sólido oral" },
  { name: "Clotrimazol", concentration: "1%", form: "Óvulo vaginal" },
];

const TABS = [
  { key: "home", label: "Inicio", icon: Home },
  { key: "patients", label: "Pacientes", icon: Users },
  { key: "appointments", label: "Citas", icon: CalendarDays },
  { key: "billing", label: "Facturación", icon: Receipt },
  { key: "doctors", label: "Médicos", icon: Stethoscope },
];

const HOME_CARDS = [
  { key: "patients", title: "Pacientes", desc: "Registro y fichas de admisión", icon: Users },
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
  const [attentionFlow, setAttentionFlow] = useState(null); // null | "choose" | "new" | "pick"
  const [autoOpenEntry, setAutoOpenEntry] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [installBannerDismissed, setInstallBannerDismissed] = useState(() => {
    try { return localStorage.getItem("hd_install_dismissed") === "1"; } catch { return false; }
  });
  const isStandalone = (() => {
    try {
      return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    } catch { return false; }
  })();
  const isIOS = (() => {
    try { return /iPhone|iPad|iPod/.test(window.navigator.userAgent); } catch { return false; }
  })();

  React.useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPromptEvent(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismissInstallBanner() {
    setInstallBannerDismissed(true);
    try { localStorage.setItem("hd_install_dismissed", "1"); } catch {}
  }

  async function handleInstallClick() {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      await installPromptEvent.userChoice;
      setInstallPromptEvent(null);
    }
  }

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

  function createPatientQuick(data) {
    const newId = uid("p");
    const nextNum = String(patients.length + 1).padStart(4, "0");
    const newPatient = { ...data, id: newId, historyNumber: data.historyNumber || `HC-${nextNum}`, createdAt: Date.now() };
    setPatients((prev) => [...prev, newPatient]);
    return newId;
  }

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
      <Header notifStatus={notifStatus} onEnableNotifications={enableNotifications} onLogout={onLogout} />
      {!isStandalone && !installBannerDismissed && (installPromptEvent || isIOS) && (
        <InstallBanner
          isIOS={isIOS}
          canPrompt={!!installPromptEvent}
          onInstall={handleInstallClick}
          onDismiss={dismissInstallBanner}
        />
      )}
      <div style={styles.body}>
        {tab !== "home" && (
          <Sidebar tab={tab} setTab={setTab} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} onLogout={onLogout} />
        )}
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
              onNewAttention={() => setAttentionFlow("choose")}
            />
          )}
          {tab === "patients" && (
            <PatientsView
              patients={patients} setPatients={setPatients} fullName={fullName} history={history}
              onOpenHistory={(id) => { setSelectedPatientId(id); setTab("history"); }}
              onOpenImport={() => setShowImport(true)}
              doctors={doctors} patientName={patientName}
              appointments={appointments} setAppointments={setAppointments}
            />
          )}
          {showImport && <ImportModal onImport={importBatch} onClose={() => setShowImport(false)} />}
          {attentionFlow === "choose" && (
            <AttentionChooserModal
              onPickNew={() => setAttentionFlow("new")}
              onPickExisting={() => setAttentionFlow("pick")}
              onClose={() => setAttentionFlow(null)}
            />
          )}
          {attentionFlow === "new" && (
            <PatientForm
              patient={{}}
              onCancel={() => setAttentionFlow(null)}
              onSave={(data) => {
                const newId = createPatientQuick(data);
                setSelectedPatientId(newId);
                setTab("history");
                setAutoOpenEntry(true);
                setAttentionFlow(null);
              }}
            />
          )}
          {attentionFlow === "pick" && (
            <QuickPatientPicker
              patients={patients}
              fullName={fullName}
              onClose={() => setAttentionFlow(null)}
              onSelect={(id) => {
                setSelectedPatientId(id);
                setTab("history");
                setAutoOpenEntry(true);
                setAttentionFlow(null);
              }}
            />
          )}
          {tab === "history" && (
            <HistoryView
              history={history} setHistory={setHistory}
              patients={patients} doctors={doctors}
              selectedPatientId={selectedPatientId} setSelectedPatientId={setSelectedPatientId}
              patientName={patientName} doctorName={doctorName}
              appointments={appointments} setAppointments={setAppointments}
              autoOpenEntry={autoOpenEntry} onAutoOpened={() => setAutoOpenEntry(false)}
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
function InstallBanner({ isIOS, canPrompt, onInstall, onDismiss }) {
  return (
    <div style={styles.installBanner}>
      <Download size={16} />
      {canPrompt ? (
        <>
          <span style={{ flex: 1 }}>Instala Home Doctor Ibarra como app en este dispositivo.</span>
          <button onClick={onInstall} style={styles.installBannerBtn}>Instalar</button>
        </>
      ) : (
        <span style={{ flex: 1 }}>
          Para instalarla: toca <strong>Compartir</strong> (⬆) abajo y luego <strong>"Añadir a pantalla de inicio"</strong>.
        </span>
      )}
      <button onClick={onDismiss} style={styles.installBannerClose}><X size={15} /></button>
    </div>
  );
}

function Header({ notifStatus, onEnableNotifications, onLogout }) {
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
        <button onClick={onLogout} title="Cerrar sesión" style={styles.headerLogoutBtn}>
          <LogOut size={16} />
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

function HomeView({ setTab, stats, onNewAttention }) {
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

      <button style={styles.newAttentionBtn} onClick={onNewAttention}>
        <Plus size={22} /> Nueva atención
      </button>

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

function AttentionChooserModal({ onPickNew, onPickExisting, onClose }) {
  return (
    <Modal title="Nueva atención" onClose={onClose}>
      <p style={{ fontSize: 13.5, color: "#5C574C", marginTop: 0 }}>¿Es un paciente nuevo o ya tiene historia clínica?</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={onPickNew} style={styles.attentionChoiceBtn}>
          <Plus size={20} color={MAGENTA} />
          <div>
            <div style={{ fontWeight: 700 }}>Paciente nuevo</div>
            <div style={{ fontSize: 12.5, color: "#8A8577" }}>Crear su ficha desde cero</div>
          </div>
          <ChevronRight size={18} color="#8A8577" style={{ marginLeft: "auto" }} />
        </button>
        <button onClick={onPickExisting} style={styles.attentionChoiceBtn}>
          <Search size={20} color={TEAL} />
          <div>
            <div style={{ fontWeight: 700 }}>Ya tiene historia</div>
            <div style={{ fontSize: 12.5, color: "#8A8577" }}>Buscarlo y agregar una nueva atención</div>
          </div>
          <ChevronRight size={18} color="#8A8577" style={{ marginLeft: "auto" }} />
        </button>
      </div>
    </Modal>
  );
}

function QuickPatientPicker({ patients, fullName, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const matches = query.trim()
    ? patients.filter((p) => fullName(p).toLowerCase().includes(query.trim().toLowerCase())).slice(0, 30)
    : [];

  return (
    <Modal title="Buscar paciente" onClose={onClose}>
      <div style={styles.searchRow}>
        <Search size={16} color="#8A8577" />
        <input
          autoFocus
          placeholder="Escribe un nombre…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>
      <div style={{ ...styles.compactList, maxHeight: 360, overflowY: "auto", marginTop: 10 }}>
        {matches.map((p) => (
          <button key={p.id} onClick={() => onSelect(p.id)} style={styles.abcRow}>
            <div style={styles.avatar}>{fullName(p).split(" ").map((s) => s[0]).slice(0, 2).join("")}</div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={styles.cardTitle}>{fullName(p)}</div>
              <div style={styles.cardMeta}>{p.historyNumber}</div>
            </div>
            <ChevronRight size={16} color="#8A8577" />
          </button>
        ))}
        {query.trim() && matches.length === 0 && <EmptyState text="No se encontraron pacientes." />}
      </div>
    </Modal>
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
function PatientsView({ patients, setPatients, onOpenHistory, fullName, history, onOpenImport, doctors, patientName, appointments, setAppointments }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [newApptFor, setNewApptFor] = useState(null);

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
                    {doctors && setAppointments && (
                      <Button variant="ghost" onClick={() => setNewApptFor(p.id)}>
                        <CalendarDays size={14} /> Nueva cita
                      </Button>
                    )}
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
      {newApptFor && doctors && (
        <AppointmentForm
          appt={{ patientId: newApptFor }}
          patients={patients} doctors={doctors} patientName={patientName}
          onCancel={() => setNewApptFor(null)}
          onSave={(data) => {
            if (data.id) setAppointments((prev) => prev.map((a) => (a.id === data.id ? data : a)));
            else setAppointments((prev) => [...prev, { ...data, id: uid("a") }]);
            setNewApptFor(null);
          }}
        />
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
function HistoryView({ history, setHistory, patients, doctors, selectedPatientId, setSelectedPatientId, patientName, doctorName, appointments, setAppointments, autoOpenEntry, onAutoOpened }) {
  const [editing, setEditing] = useState(null);
  const [showPrescription, setShowPrescription] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const entries = useMemo(() => {
    const list = selectedPatientId ? history.filter((h) => h.patientId === selectedPatientId) : history;
    return [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [history, selectedPatientId]);

  React.useEffect(() => {
    if (autoOpenEntry && selectedPatientId) {
      setEditing({ patientId: selectedPatientId });
      onAutoOpened && onAutoOpened();
    }
  }, [autoOpenEntry, selectedPatientId]);

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

          {selectedPatient && (
            <PatientSummaryCard
              patient={selectedPatient}
              patientName={patientName}
              onNewAppointment={() => setShowNewAppointment(true)}
            />
          )}

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
        <PrescriptionModal
          patient={selectedPatient} doctors={doctors} patientName={patientName}
          onClose={() => setShowPrescription(false)}
          initialCie10={entries[0]?.cie10 || ""}
        />
      )}
      {showCertificate && selectedPatient && (
        <CertificateModal patient={selectedPatient} doctors={doctors} patientName={patientName} onClose={() => setShowCertificate(false)} />
      )}
      {showNewAppointment && selectedPatient && (
        <AppointmentForm
          appt={{ patientId: selectedPatient.id }}
          patients={patients} doctors={doctors} patientName={patientName}
          onCancel={() => setShowNewAppointment(false)}
          onSave={(data) => {
            if (data.id) setAppointments((prev) => prev.map((a) => (a.id === data.id ? data : a)));
            else setAppointments((prev) => [...prev, { ...data, id: uid("a") }]);
            setShowNewAppointment(false);
          }}
        />
      )}
    </div>
  );
}

function PatientSummaryCard({ patient, patientName, onNewAppointment }) {
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
        {onNewAppointment && (
          <Button variant="ghost" onClick={onNewAppointment}><CalendarDays size={15} /> Nueva cita</Button>
        )}
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
              {entry.diagnosis && <p style={styles.value}><strong>Dx:</strong> {entry.diagnosis} {entry.cie10 && `(CIE-10: ${entry.cie10})`}</p>}
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
    cie10: entry.cie10 || "",
  });
  const [medPick, setMedPick] = useState("");
  const [medDose, setMedDose] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function addMedToTreatment() {
    if (!medPick.trim()) return;
    const found = MEDICATION_CATALOG.find((c) => c.name === medPick);
    const line = found
      ? `${found.name} ${found.concentration} (${found.form})${medDose ? ` — ${medDose}` : ""}`
      : `${medPick}${medDose ? ` — ${medDose}` : ""}`;
    setForm((prev) => ({ ...prev, treatment: prev.treatment ? `${prev.treatment}\n${line}` : line }));
    setMedPick("");
    setMedDose("");
  }

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
        <Field label="CIE-10 (código de enfermedad)"><Input value={form.cie10} onChange={set("cie10")} placeholder="Ej. J02.9" /></Field>
        <Field label="Diagnóstico" full><TextArea value={form.diagnosis} onChange={set("diagnosis")} /></Field>

        <Field label="Elegir medicamento para el tratamiento" full>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              list="med-catalog-history"
              placeholder="Escribe o elige un medicamento…"
              value={medPick}
              onChange={(e) => setMedPick(e.target.value)}
              style={{ ...styles.input, flex: 2, minWidth: 200 }}
            />
            <Input placeholder="Dosis / frecuencia (opcional)" value={medDose} onChange={(e) => setMedDose(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
            <Button variant="ghost" onClick={addMedToTreatment} type="button"><Plus size={15} /> Agregar al tratamiento</Button>
          </div>
          <datalist id="med-catalog-history">
            {MEDICATION_CATALOG.map((c) => <option key={c.name + c.concentration} value={c.name} />)}
          </datalist>
        </Field>

        <Field label="Tratamiento" full><TextArea value={form.treatment} onChange={set("treatment")} style={{ minHeight: 110 }} /></Field>
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
              <div style={styles.cardMeta}>{doctorName(a.doctorId)}{a.reason ? ` · ${a.reason}` : ""}{a.cie10 ? ` · CIE-10: ${a.cie10}` : ""}</div>
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
    id: appt.id, patientId: appt.patientId || patients[0]?.id, doctorId: appt.doctorId || doctors[0]?.id,
    date: appt.date || new Date().toISOString().slice(0, 10),
    time: appt.time || "09:00", status: appt.status || "pendiente",
    reason: appt.reason || "", cie10: appt.cie10 || "",
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
        <Field label="Motivo de consulta" full><Input placeholder="Ej. Control, dolor abdominal…" value={form.reason} onChange={set("reason")} /></Field>
        <Field label="CIE-10 (si ya se conoce)"><Input placeholder="Ej. J02.9" value={form.cie10} onChange={set("cie10")} /></Field>
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

function PrescriptionModal({ patient, doctors, patientName, onClose, initialCie10 }) {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [recipeNo, setRecipeNo] = useState("");
  const [cie10, setCie10] = useState(initialCie10 || "");
  const [meds, setMeds] = useState([{
    id: uid("m"), name: "", concentration: "", form: "Sólido oral", quantity: "",
    route: "Oral", dose: "", frequency: "", duration: "", morning: false, noon: false, evening: false, night: false,
  }]);
  const [warnings, setWarnings] = useState("");

  const doctor = doctors.find((d) => d.id === doctorId);

  const setMed = (id, key) => (e) => {
    const val = e && e.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setMeds((prev) => prev.map((m) => (m.id === id ? { ...m, [key]: val } : m)));
  };
  const pickFromCatalog = (id) => (e) => {
    const found = MEDICATION_CATALOG.find((c) => c.name === e.target.value);
    setMeds((prev) => prev.map((m) => (m.id === id ? { ...m, name: e.target.value, concentration: found?.concentration || m.concentration, form: found?.form || m.form } : m)));
  };
  const addMed = () => setMeds((prev) => [...prev, {
    id: uid("m"), name: "", concentration: "", form: "Sólido oral", quantity: "",
    route: "Oral", dose: "", frequency: "", duration: "", morning: false, noon: false, evening: false, night: false,
  }]);
  const removeMed = (id) => setMeds((prev) => prev.filter((m) => m.id !== id));

  const activeMeds = meds.filter((m) => m.name.trim());
  const age = calcAge(patient?.birthDate);

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
            <Field label="N° de receta"><Input placeholder="Ej. 1048" value={recipeNo} onChange={(e) => setRecipeNo(e.target.value)} /></Field>
            <Field label="CIE-10"><Input placeholder="Ej. G40" value={cie10} onChange={(e) => setCie10(e.target.value)} /></Field>
          </div>

          <SubHeading>Medicamentos</SubHeading>
          {meds.map((m) => (
            <div key={m.id} style={styles.medCard}>
              <div style={styles.medCardRow}>
                <Field label="Medicamento" style={{ flex: 2, minWidth: 220 }}>
                  <input
                    list="med-catalog"
                    placeholder="Escribe o elige de la lista…"
                    value={m.name}
                    onChange={pickFromCatalog(m.id)}
                    style={{ ...styles.input, fontSize: 15, padding: "12px 14px" }}
                  />
                </Field>
                <Field label="Concentración" style={{ flex: 1, minWidth: 130 }}>
                  <Input placeholder="Ej. 500mg" value={m.concentration} onChange={setMed(m.id, "concentration")} style={{ fontSize: 15, padding: "12px 14px" }} />
                </Field>
                <Field label="Forma" style={{ flex: 1, minWidth: 150 }}>
                  <Input placeholder="Sólido oral" value={m.form} onChange={setMed(m.id, "form")} style={{ fontSize: 15, padding: "12px 14px" }} />
                </Field>
                <Field label="Cantidad" style={{ flex: 1, minWidth: 110 }}>
                  <Input placeholder="Ej. 20" value={m.quantity} onChange={setMed(m.id, "quantity")} style={{ fontSize: 15, padding: "12px 14px" }} />
                </Field>
                <button style={{ ...styles.iconBtn, alignSelf: "flex-end", marginBottom: 4 }} onClick={() => removeMed(m.id)}><Trash2 size={16} /></button>
              </div>
              <div style={styles.medCardRow}>
                <Field label="Vía" style={{ flex: 1, minWidth: 110 }}>
                  <Input placeholder="Oral" value={m.route} onChange={setMed(m.id, "route")} style={{ fontSize: 15, padding: "12px 14px" }} />
                </Field>
                <Field label="Dosis" style={{ flex: 1, minWidth: 110 }}>
                  <Input placeholder="Ej. 1 tab" value={m.dose} onChange={setMed(m.id, "dose")} style={{ fontSize: 15, padding: "12px 14px" }} />
                </Field>
                <Field label="Frecuencia" style={{ flex: 1, minWidth: 110 }}>
                  <Input placeholder="Ej. c/12h" value={m.frequency} onChange={setMed(m.id, "frequency")} style={{ fontSize: 15, padding: "12px 14px" }} />
                </Field>
                <Field label="Duración" style={{ flex: 1, minWidth: 110 }}>
                  <Input placeholder="Ej. 7 días" value={m.duration} onChange={setMed(m.id, "duration")} style={{ fontSize: 15, padding: "12px 14px" }} />
                </Field>
              </div>
              <div style={styles.medCardCheckRow}>
                <label style={styles.medCheckLabel}><input type="checkbox" checked={m.morning} onChange={setMed(m.id, "morning")} /> Mañana</label>
                <label style={styles.medCheckLabel}><input type="checkbox" checked={m.noon} onChange={setMed(m.id, "noon")} /> Medio día</label>
                <label style={styles.medCheckLabel}><input type="checkbox" checked={m.evening} onChange={setMed(m.id, "evening")} /> Tarde</label>
                <label style={styles.medCheckLabel}><input type="checkbox" checked={m.night} onChange={setMed(m.id, "night")} /> Noche</label>
              </div>
            </div>
          ))}
          <Button variant="ghost" onClick={addMed} style={{ marginTop: 6 }}><Plus size={15} /> Agregar medicamento</Button>
          <datalist id="med-catalog">
            {MEDICATION_CATALOG.map((c) => <option key={c.name + c.concentration} value={c.name} />)}
          </datalist>

          <SubHeading>Advertencias / indicaciones generales</SubHeading>
          <TextArea value={warnings} onChange={(e) => setWarnings(e.target.value)} placeholder="Ej. Convulsiones, reposo, hidratación, signos de alarma…" />
        </div>

        <div id="print-area" style={styles.docPreview}>
          {/* HOJA 1: RECETA */}
          <div style={styles.rxSheet}>
            <PrintLetterheadRx doctor={doctor} recipeNo={recipeNo} dateStr={date} />
            <div style={styles.rxPatientRow}>
              <div style={styles.rxPatientCell}><span style={styles.printLabel}>NOMBRE Y APELLIDOS:</span> {patientName(patient.id)}</div>
              <div style={styles.rxPatientCell}><span style={styles.printLabel}>CIE 10:</span> {cie10 || "—"}</div>
              <div style={styles.rxPatientCell}><span style={styles.printLabel}>SEXO:</span> {patient?.sex === "M" ? "M ☒ F ☐" : patient?.sex === "F" ? "M ☐ F ☒" : "M ☐ F ☐"}</div>
              <div style={styles.rxPatientCell}><span style={styles.printLabel}>DOCUMENTO IDENTIDAD:</span> {patient?.cedula || "—"}</div>
              <div style={styles.rxPatientCell}><span style={styles.printLabel}>EDAD:</span> {age}</div>
            </div>
            <table style={styles.rxTable}>
              <thead>
                <tr>
                  <th style={styles.rxTh}>DATOS DEL MEDICAMENTO (DCI, concentración y forma farmacéutica)</th>
                  <th style={{ ...styles.rxTh, width: 140 }}>CANTIDAD</th>
                </tr>
              </thead>
              <tbody>
                {activeMeds.map((m) => (
                  <tr key={m.id}>
                    <td style={styles.rxTd}>{m.name} {m.concentration} — {m.form}</td>
                    <td style={styles.rxTd}>{m.quantity}</td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, 6 - activeMeds.length) }).map((_, i) => (
                  <tr key={"empty" + i}><td style={styles.rxTd}>&nbsp;</td><td style={styles.rxTd}>&nbsp;</td></tr>
                ))}
              </tbody>
            </table>
            <div style={styles.rxPrescriberBox}>
              <div style={{ flex: 1 }}>
                <span style={styles.printLabel}>DATOS DEL PRESCRIPTOR</span>
                <div style={{ marginTop: 6 }}>{doctor?.name}</div>
                <div style={{ fontSize: 11, color: "#666" }}>{doctor?.specialty}</div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <span style={styles.printLabel}>Firma y sello del prescriptor</span>
                <div style={styles.rxSignBox} />
              </div>
            </div>
          </div>

          {/* HOJA 2: INDICACIONES */}
          <div style={{ ...styles.rxSheet, pageBreakBefore: "always" }}>
            <PrintLetterheadRx doctor={doctor} recipeNo={recipeNo} dateStr={date} label="INDICACIONES" />
            <div style={styles.rxPatientRow}>
              <div style={{ ...styles.rxPatientCell, flex: 2 }}><span style={styles.printLabel}>NOMBRE DEL PACIENTE:</span> {patientName(patient.id)}</div>
            </div>
            <table style={styles.rxTable}>
              <thead>
                <tr>
                  <th style={styles.rxTh}>MEDICAMENTO</th>
                  <th style={styles.rxTh}>VÍA ADMIN</th>
                  <th style={styles.rxTh}>DOSIS</th>
                  <th style={styles.rxTh}>FRECUENCIA</th>
                  <th style={styles.rxTh}>DURACIÓN</th>
                  <th style={styles.rxThSmall}>MAÑANA</th>
                  <th style={styles.rxThSmall}>MEDIO DÍA</th>
                  <th style={styles.rxThSmall}>TARDE</th>
                  <th style={styles.rxThSmall}>NOCHE</th>
                </tr>
              </thead>
              <tbody>
                {activeMeds.map((m) => (
                  <tr key={m.id}>
                    <td style={styles.rxTd}>{m.name} {m.concentration}</td>
                    <td style={styles.rxTd}>{m.route}</td>
                    <td style={styles.rxTd}>{m.dose}</td>
                    <td style={styles.rxTd}>{m.frequency}</td>
                    <td style={styles.rxTd}>{m.duration}</td>
                    <td style={styles.rxTdCenter}>{m.morning ? "✓" : ""}</td>
                    <td style={styles.rxTdCenter}>{m.noon ? "✓" : ""}</td>
                    <td style={styles.rxTdCenter}>{m.evening ? "✓" : ""}</td>
                    <td style={styles.rxTdCenter}>{m.night ? "✓" : ""}</td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, 6 - activeMeds.length) }).map((_, i) => (
                  <tr key={"empty2" + i}>
                    {Array.from({ length: 9 }).map((__, j) => <td key={j} style={styles.rxTd}>&nbsp;</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={styles.rxPrescriberBox}>
              <div style={{ flex: 1 }}>
                <span style={styles.printLabel}>ADVERTENCIAS:</span>
                <div style={{ marginTop: 6, minHeight: 30 }}>{warnings || "—"}</div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <span style={styles.printLabel}>PRESCRIPTOR: {doctor?.name}</span>
                <div style={styles.rxSignBox}>FIRMA Y SELLO</div>
              </div>
            </div>
            <div style={styles.rxFooterNote}>Esta receta tiene validez para la entrega de medicamentos, un día.</div>
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

function PrintLetterheadRx({ doctor, recipeNo, dateStr, label }) {
  const [y, m, d] = (dateStr || "").split("-");
  return (
    <div style={styles.rxHeader}>
      <div style={styles.printLogoRow}>
        <svg width="34" height="34" viewBox="0 0 24 24">
          <clipPath id="crossClipPrintRx"><rect x="9" y="2" width="6" height="20" rx="3" /><rect x="2" y="9" width="20" height="6" rx="3" /></clipPath>
          <g clipPath="url(#crossClipPrintRx)">
            <polygon points="0,0 24,0 0,24" fill="#E31C79" />
            <polygon points="24,0 24,24 0,24" fill="#159E93" />
          </g>
        </svg>
        <div>
          <div style={styles.printClinicName}>HOME DOCTOR IBARRA</div>
          <div style={styles.printClinicTag}>La salud en su hogar</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700 }}>{doctor?.name}</div>
          <div style={{ fontSize: 11, color: "#666" }}>{doctor?.specialty}</div>
        </div>
      </div>
      <div style={styles.rxTitleRow}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{label ? `${label} Nro` : "RECETA N°"} {recipeNo && `N°${recipeNo}`}</div>
        <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
          <span>FECHA:DIA/ {d || "—"}</span><span>MES/ {m || "—"}</span><span>AÑO/ {y || "—"}</span>
        </div>
      </div>
    </div>
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
function Field({ label, children, full, style }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto", ...style }}>
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
  headerLogoutBtn: { marginLeft: 8, width: 34, height: 34, borderRadius: 8, border: "1px solid #E4E0D3", background: "#fff", color: "#9B3B2C", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  installBanner: { display: "flex", alignItems: "center", gap: 10, background: TEAL_DARK, color: "#fff", padding: "10px 16px", fontSize: 13 },
  installBannerBtn: { background: "#fff", color: TEAL_DARK, border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 700, cursor: "pointer" },
  installBannerClose: { background: "transparent", border: "none", color: "#fff", cursor: "pointer", opacity: 0.8 },
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
  newAttentionBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    margin: "0 auto 26px", padding: "16px 36px", borderRadius: 999, border: "none",
    background: `linear-gradient(90deg, ${MAGENTA}, ${TEAL})`, color: "#fff",
    fontSize: 17, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 18px rgba(227,28,121,0.25)",
  },
  attentionChoiceBtn: {
    display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 12,
    border: "1px solid #E4E0D3", background: "#fff", cursor: "pointer", textAlign: "left", width: "100%",
  },
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

  medCard: { border: "1px solid #E4E0D3", borderRadius: 10, padding: 12, marginBottom: 10, background: "#FAF8F2" },
  medCardRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8, alignItems: "flex-end" },
  medCardCheckRow: { display: "flex", gap: 16, flexWrap: "wrap", marginTop: 4 },
  medCheckLabel: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#5C574C" },

  rxSheet: { border: "1px solid #ccc", padding: 14, marginBottom: 14, fontSize: 12, color: "#111" },
  rxHeader: { borderBottom: "2px solid #159E93", paddingBottom: 8, marginBottom: 10 },
  rxTitleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  rxPatientRow: { display: "flex", flexWrap: "wrap", gap: 12, fontSize: 11.5, padding: "8px 0", borderBottom: "1px solid #ccc", marginBottom: 8 },
  rxPatientCell: { flex: 1, minWidth: 140 },
  rxTable: { width: "100%", borderCollapse: "collapse", fontSize: 11, marginBottom: 10 },
  rxTh: { border: "1px solid #999", padding: "6px 8px", background: "#F0EEE6", textAlign: "left", fontSize: 10.5 },
  rxThSmall: { border: "1px solid #999", padding: "6px 4px", background: "#F0EEE6", textAlign: "center", fontSize: 9.5, width: 44 },
  rxTd: { border: "1px solid #ccc", padding: "8px 8px", height: 18 },
  rxTdCenter: { border: "1px solid #ccc", padding: "8px 4px", textAlign: "center" },
  rxPrescriberBox: { display: "flex", gap: 16, borderTop: "1px solid #ccc", paddingTop: 10, fontSize: 11 },
  rxSignBox: { border: "1px dashed #999", height: 50, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, color: "#999" },
  rxFooterNote: { fontSize: 9.5, color: "#777", marginTop: 10, textAlign: "center" },
};
