import { useState, useEffect, useRef } from "react";
import ECADashboard from "./ECA_Dashboard";
import ECAAnuel from "./ECA_Annuel";

// ─── 70 mois de données : Mar 2026 → Déc 2031 ────────────────────────────────
export const BASE_ROWS = [
  {mois:"Mar 26",apport:100,ponctuel:0,taux:2},{mois:"Avr 26",apport:100,ponctuel:0,taux:2},
  {mois:"Mai 26",apport:100,ponctuel:0,taux:2},{mois:"Jun 26",apport:100,ponctuel:0,taux:2},
  {mois:"Jul 26",apport:100,ponctuel:0,taux:2},{mois:"Aoû 26",apport:100,ponctuel:0,taux:2},
  {mois:"Sep 26",apport:100,ponctuel:0,taux:2},{mois:"Oct 26",apport:100,ponctuel:0,taux:2},
  {mois:"Nov 26",apport:100,ponctuel:0,taux:2},{mois:"Déc 26",apport:100,ponctuel:0,taux:2},
  {mois:"Jan 27",apport:100,ponctuel:0,taux:2},{mois:"Fév 27",apport:100,ponctuel:0,taux:2},
  {mois:"Mar 27",apport:100,ponctuel:0,taux:2},{mois:"Avr 27",apport:100,ponctuel:0,taux:2},
  {mois:"Mai 27",apport:100,ponctuel:0,taux:2},{mois:"Jun 27",apport:100,ponctuel:0,taux:2},
  {mois:"Jul 27",apport:100,ponctuel:0,taux:2},{mois:"Aoû 27",apport:100,ponctuel:0,taux:2},
  {mois:"Sep 27",apport:100,ponctuel:0,taux:2},{mois:"Oct 27",apport:100,ponctuel:0,taux:2},
  {mois:"Nov 27",apport:100,ponctuel:0,taux:2},{mois:"Déc 27",apport:100,ponctuel:0,taux:2},
  {mois:"Jan 28",apport:100,ponctuel:0,taux:2},{mois:"Fév 28",apport:100,ponctuel:0,taux:2},
  {mois:"Mar 28",apport:100,ponctuel:0,taux:2},{mois:"Avr 28",apport:100,ponctuel:0,taux:2},
  {mois:"Mai 28",apport:100,ponctuel:0,taux:2},{mois:"Jun 28",apport:100,ponctuel:0,taux:2},
  {mois:"Jul 28",apport:100,ponctuel:0,taux:2},{mois:"Aoû 28",apport:100,ponctuel:0,taux:2},
  {mois:"Sep 28",apport:100,ponctuel:0,taux:2},{mois:"Oct 28",apport:100,ponctuel:0,taux:2},
  {mois:"Nov 28",apport:100,ponctuel:0,taux:2},{mois:"Déc 28",apport:100,ponctuel:0,taux:2},
  {mois:"Jan 29",apport:100,ponctuel:0,taux:2},{mois:"Fév 29",apport:100,ponctuel:0,taux:2},
  {mois:"Mar 29",apport:100,ponctuel:0,taux:2},{mois:"Avr 29",apport:100,ponctuel:0,taux:2},
  {mois:"Mai 29",apport:100,ponctuel:0,taux:2},{mois:"Jun 29",apport:100,ponctuel:0,taux:2},
  {mois:"Jul 29",apport:100,ponctuel:0,taux:2},{mois:"Aoû 29",apport:100,ponctuel:0,taux:2},
  {mois:"Sep 29",apport:100,ponctuel:0,taux:2},{mois:"Oct 29",apport:100,ponctuel:0,taux:2},
  {mois:"Nov 29",apport:100,ponctuel:0,taux:2},{mois:"Déc 29",apport:100,ponctuel:0,taux:2},
  {mois:"Jan 30",apport:100,ponctuel:0,taux:2},{mois:"Fév 30",apport:100,ponctuel:0,taux:2},
  {mois:"Mar 30",apport:100,ponctuel:0,taux:2},{mois:"Avr 30",apport:100,ponctuel:0,taux:2},
  {mois:"Mai 30",apport:100,ponctuel:0,taux:2},{mois:"Jun 30",apport:100,ponctuel:0,taux:2},
  {mois:"Jul 30",apport:100,ponctuel:0,taux:2},{mois:"Aoû 30",apport:100,ponctuel:0,taux:2},
  {mois:"Sep 30",apport:100,ponctuel:0,taux:2},{mois:"Oct 30",apport:100,ponctuel:0,taux:2},
  {mois:"Nov 30",apport:100,ponctuel:0,taux:2},{mois:"Déc 30",apport:100,ponctuel:0,taux:2},
  {mois:"Jan 31",apport:100,ponctuel:0,taux:2},{mois:"Fév 31",apport:100,ponctuel:0,taux:2},
  {mois:"Mar 31",apport:100,ponctuel:0,taux:2},{mois:"Avr 31",apport:100,ponctuel:0,taux:2},
  {mois:"Mai 31",apport:100,ponctuel:0,taux:2},{mois:"Jun 31",apport:100,ponctuel:0,taux:2},
  {mois:"Jul 31",apport:100,ponctuel:0,taux:2},{mois:"Aoû 31",apport:100,ponctuel:0,taux:2},
  {mois:"Sep 31",apport:100,ponctuel:0,taux:2},{mois:"Oct 31",apport:100,ponctuel:0,taux:2},
  {mois:"Nov 31",apport:100,ponctuel:0,taux:2},{mois:"Déc 31",apport:100,ponctuel:0,taux:2},
];

export const CAPITAL_DEPART = 7000;
const STORAGE_KEY = "eca-app-v3";

export default function App() {
  const [activeView, setActiveView] = useState("mensuel"); // "mensuel" | "annuel"

  // ── État global partagé entre les deux vues ──
  const [rows,   setRows]   = useState(BASE_ROWS);
  const [past,   setPast]   = useState([]);
  const [future, setFuture] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,  setToast]  = useState(null);

  // ── Chargement persistant ──
  useEffect(() => {
    async function load() {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res?.value) {
          const s = JSON.parse(res.value);
          if (s.rows) setRows(s.rows);
          if (s.past) setPast(s.past);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  // ── Sauvegarde automatique ──
  const saveTimer = useRef(null);
  useEffect(() => {
    if (loading) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try { await window.storage.set(STORAGE_KEY, JSON.stringify({ rows, past })); } catch {}
    }, 600);
  }, [rows, past, loading]);

  // ── Toast global ──
  const showToast = (msg, color = "#4ade80") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2500);
  };

  // ── Commit (utilisé par les deux vues) ──
  const commit = (newRows, label) => {
    setPast(p => [...p.slice(-49), { rows, label, date: new Date().toLocaleTimeString("fr-FR") }]);
    setFuture([]);
    setRows(newRows);
  };

  const undo = () => {
    if (!past.length) return;
    const prev = past[past.length - 1];
    setFuture(f => [{ rows, label: "Rétablir", date: new Date().toLocaleTimeString("fr-FR") }, ...f.slice(0, 49)]);
    setRows(prev.rows);
    setPast(p => p.slice(0, -1));
    showToast(`↩ Annulé : ${prev.label}`, "#f59e0b");
  };

  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setPast(p => [...p.slice(-49), { rows, label: next.label, date: new Date().toLocaleTimeString("fr-FR") }]);
    setFuture(f => f.slice(1));
    setRows(next.rows);
    showToast("↪ Rétabli", "#a78bfa");
  };

  const reset = () => {
    if (!confirm("Réinitialiser toutes les données ?")) return;
    setPast(p => [...p.slice(-49), { rows, label: "Réinitialisation", date: new Date().toLocaleTimeString("fr-FR") }]);
    setFuture([]);
    setRows(BASE_ROWS);
    showToast("🔄 Données réinitialisées", "#f87171");
  };

  if (loading) return (
    <div style={{ background: "#060d14", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8", fontSize: 18, fontFamily: "system-ui" }}>
      Chargement…
    </div>
  );

  const sharedProps = { rows, commit, undo, redo, reset, past, future, showToast };

  return (
    <div style={{ background: "#060d14", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── TOAST GLOBAL ── */}
      {toast && (
        <div style={{ position: "fixed", top: 18, right: 18, zIndex: 2000, background: "#0f1923", border: `1.5px solid ${toast.color}`, borderRadius: 10, padding: "10px 18px", color: toast.color, fontWeight: 700, fontSize: 13, boxShadow: "0 4px 24px #00000090", pointerEvents: "none" }}>
          {toast.msg}
        </div>
      )}

      {/* ── BARRE DE NAVIGATION PRINCIPALE ── */}
      <div style={{ background: "#030912", borderBottom: "2px solid #1e3a5f", padding: "0 24px", display: "flex", alignItems: "center", gap: 0 }}>
        <div style={{ color: "#38bdf8", fontWeight: 900, fontSize: 15, marginRight: 32, letterSpacing: -0.5, padding: "14px 0" }}>
          ECA Simulator
        </div>
        {[
          ["mensuel",  "📈 Vue mensuelle",  "70 mois · Mar 26 → Déc 31"],
          ["annuel",   "📊 Vue annuelle",   "Par année · sélectionnable"],
        ].map(([id, label, sub]) => (
          <button key={id} onClick={() => setActiveView(id)}
            style={{
              background: "transparent", border: "none", borderBottom: activeView === id ? "3px solid #38bdf8" : "3px solid transparent",
              color: activeView === id ? "#38bdf8" : "#64748b", padding: "14px 20px", cursor: "pointer",
              fontSize: 13, fontWeight: activeView === id ? 800 : 400, transition: "all 0.15s",
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
            }}>
            <span>{label}</span>
            <span style={{ fontSize: 9, color: activeView === id ? "#38bdf880" : "#33415550", fontWeight: 400 }}>{sub}</span>
          </button>
        ))}

        {/* Indicateur de modifications */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {past.length > 0 && (
            <span style={{ fontSize: 11, color: "#475569", background: "#0f1923", border: "1px solid #1e3a5f", borderRadius: 6, padding: "3px 8px" }}>
              {past.length} modification{past.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── VUE ACTIVE ── */}
      {activeView === "mensuel" && <ECADashboard {...sharedProps} />}
      {activeView === "annuel"  && <ECAAnuel     {...sharedProps} />}
    </div>
  );
}
