import { useState, useMemo, useEffect, useRef } from "react";
import {
  ComposedChart, AreaChart, Area, BarChart, Bar,
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from "recharts";

// ═══════════════════════════════════════════════════════
// DONNÉES & CONSTANTES
// ═══════════════════════════════════════════════════════
const CAPITAL_DEPART = 7000;
const STORAGE_KEY    = "eca-v4";

// 70 mois : Mar 2026 → Déc 2031
// Chaque mois porte un index global unique (gi) pour relier les deux vues
const BASE_ROWS = [
  "Mar 26","Avr 26","Mai 26","Jun 26","Jul 26","Aoû 26","Sep 26","Oct 26","Nov 26","Déc 26",
  "Jan 27","Fév 27","Mar 27","Avr 27","Mai 27","Jun 27","Jul 27","Aoû 27","Sep 27","Oct 27","Nov 27","Déc 27",
  "Jan 28","Fév 28","Mar 28","Avr 28","Mai 28","Jun 28","Jul 28","Aoû 28","Sep 28","Oct 28","Nov 28","Déc 28",
  "Jan 29","Fév 29","Mar 29","Avr 29","Mai 29","Jun 29","Jul 29","Aoû 29","Sep 29","Oct 29","Nov 29","Déc 29",
  "Jan 30","Fév 30","Mar 30","Avr 30","Mai 30","Jun 30","Jul 30","Aoû 30","Sep 30","Oct 30","Nov 30","Déc 30",
  "Jan 31","Fév 31","Mar 31","Avr 31","Mai 31","Jun 31","Jul 31","Aoû 31","Sep 31","Oct 31","Nov 31","Déc 31",
].map(mois => ({ mois, apport: 100, ponctuel: 0, taux: 2 }));

// ═══════════════════════════════════════════════════════
// SIMULATION
// Règle : gains + apport 100€ + ponctuel → cagnotte
// Dès 1000€ dans la cagnotte → achat automatique d'un pack
// ═══════════════════════════════════════════════════════
function simulate(rows) {
  let cagnotte     = 0;
  let capitalActif = CAPITAL_DEPART;
  let totalVerse   = CAPITAL_DEPART;

  return rows.map((row) => {
    const gains = Math.round(capitalActif * (row.taux / 100));
    cagnotte   += gains + row.apport + row.ponctuel;
    totalVerse += row.apport + row.ponctuel;

    const nouveauxPacks = Math.floor(cagnotte / 1000);
    const resteCagnotte = cagnotte - nouveauxPacks * 1000;
    const nouveauCapital = capitalActif + nouveauxPacks * 1000;
    const capitalTotal   = nouveauCapital + resteCagnotte;
    const perf = Math.round(((capitalTotal - totalVerse) / totalVerse) * 1000) / 10;

    if (nouveauxPacks > 0) { cagnotte = resteCagnotte; capitalActif = nouveauCapital; }

    return {
      mois: row.mois, capital: Math.round(capitalTotal), gains,
      apport: row.apport, ponctuel: row.ponctuel, taux: row.taux,
      packs: nouveauCapital / 1000, perf, nouveauxPacks,
      totalVerse: Math.round(totalVerse),
      gainsNets: Math.round(capitalTotal - totalVerse),
      cagnotte: Math.round(cagnotte),
      progressPack: Math.min(100, Math.round((cagnotte / 1000) * 100)),
    };
  });
}

// ═══════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════
const fmt  = n => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n));
const fmtD = n => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);

// Extraire l'année d'un label mois ("Mar 26" → "26")
const getYr = mois => mois.split(" ")[1];

// Années distinctes présentes dans les rows
function getYears(rows) {
  const seen = new Set();
  rows.forEach(r => seen.add(getYr(r.mois)));
  return [...seen].sort();
}

// ═══════════════════════════════════════════════════════
// APP — état global unique
// ═══════════════════════════════════════════════════════
export default function App() {
  const [view,    setView]    = useState("mensuel");
  const [rows,    setRows]    = useState(BASE_ROWS);
  const [past,    setPast]    = useState([]);
  const [future,  setFuture]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);

  // Persistance
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res?.value) {
          const s = JSON.parse(res.value);
          if (Array.isArray(s.rows) && s.rows.length) setRows(s.rows);
          if (Array.isArray(s.past))  setPast(s.past);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const saveTimer = useRef(null);
  useEffect(() => {
    if (loading) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try { await window.storage.set(STORAGE_KEY, JSON.stringify({ rows, past })); } catch {}
    }, 600);
  }, [rows, past, loading]);

  // Toast
  const showToast = (msg, color = "#4ade80") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2500);
  };

  // Commit — unique point d'écriture des rows
  const commit = (newRows, label) => {
    setPast(p => [...p.slice(-49), { rows, label, date: new Date().toLocaleTimeString("fr-FR") }]);
    setFuture([]);
    setRows(newRows);
  };

  const undo = () => {
    if (!past.length) return;
    const prev = past[past.length - 1];
    setFuture(f => [{ rows, label: prev.label, date: new Date().toLocaleTimeString("fr-FR") }, ...f.slice(0, 49)]);
    setRows(prev.rows);
    setPast(p => p.slice(0, -1));
    showToast(`↩ ${prev.label}`, "#f59e0b");
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
    commit(BASE_ROWS, "Réinitialisation");
    showToast("🔄 Réinitialisé", "#f87171");
  };

  // Simulation unique partagée
  const sim = useMemo(() => simulate(rows), [rows]);

  if (loading) return (
    <div style={{ background: "#060d14", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8", fontSize: 18, fontFamily: "system-ui" }}>
      Chargement…
    </div>
  );

  const sharedProps = { rows, sim, commit, undo, redo, reset, past, future, showToast };

  return (
    <div style={{ background: "#060d14", minHeight: "100vh", color: "#e2e8f0", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", top: 18, right: 18, zIndex: 2000, background: "#0f1923", border: `1.5px solid ${toast.color}`, borderRadius: 10, padding: "10px 18px", color: toast.color, fontWeight: 700, fontSize: 13, boxShadow: "0 4px 24px #00000090", pointerEvents: "none" }}>
          {toast.msg}
        </div>
      )}

      {/* NAVIGATION */}
      <div style={{ background: "#030912", borderBottom: "2px solid #1e3a5f", padding: "0 24px", display: "flex", alignItems: "stretch" }}>
        <div style={{ color: "#38bdf8", fontWeight: 900, fontSize: 15, marginRight: 28, display: "flex", alignItems: "center", letterSpacing: -0.5 }}>
          ECA
        </div>
        {[["mensuel", "📈 Vue mensuelle", "70 mois · Mar 26→Déc 31"], ["annuel", "📊 Vue annuelle", "Par année"], ["fiscalite", "💸 Fiscalité", "Flat tax 30%"]].map(([id, lbl, sub]) => (
          <button key={id} onClick={() => setView(id)} style={{
            background: "transparent", border: "none",
            borderBottom: view === id ? "3px solid #38bdf8" : "3px solid transparent",
            color: view === id ? "#38bdf8" : "#64748b",
            padding: "12px 20px", cursor: "pointer", fontSize: 13,
            fontWeight: view === id ? 800 : 400,
          }}>
            {lbl} <span style={{ fontSize: 9, color: "#334155", marginLeft: 6 }}>{sub}</span>
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={undo}  disabled={!past.length}   style={{ background: past.length?"#1e3a5f":"transparent",   border: "1px solid #1e3a5f", borderRadius: 7, color: past.length?"#38bdf8":"#334155",   padding: "5px 12px", cursor: past.length?"pointer":"not-allowed",   fontSize: 12, fontWeight: 700 }}>↩</button>
          <button onClick={redo}  disabled={!future.length} style={{ background: future.length?"#1e3a5f":"transparent", border: "1px solid #1e3a5f", borderRadius: 7, color: future.length?"#a78bfa":"#334155", padding: "5px 12px", cursor: future.length?"pointer":"not-allowed", fontSize: 12, fontWeight: 700 }}>↪</button>
          <button onClick={reset} style={{ background: "transparent", border: "1px solid #7f1d1d", borderRadius: 7, color: "#f87171", padding: "5px 12px", cursor: "pointer", fontSize: 12 }}>🔄</button>
          {past.length > 0 && <span style={{ fontSize: 10, color: "#334155" }}>{past.length} modif.</span>}
        </div>
      </div>

      {view === "mensuel"   && <VueMensuelle  {...sharedProps} />}
      {view === "annuel"    && <VueAnnuelle   {...sharedProps} />}
      {view === "fiscalite" && <VueFiscalite  {...sharedProps} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// VUE MENSUELLE
// ═══════════════════════════════════════════════════════
function VueMensuelle({ rows, sim, commit, showToast, past }) {
  const [selIdx,        setSelIdx]        = useState(null);
  const [inputPonctuel, setInputPonctuel] = useState("");
  const [editingTaux,   setEditingTaux]   = useState(false);
  const [vue,           setVue]           = useState("capital");

  const last = sim[sim.length - 1];
  const sel  = selIdx !== null ? sim[selIdx] : null;
  const totalPonctuels = rows.reduce((s, r) => s + r.ponctuel, 0);
  const tauxGlobal     = rows[0].taux;
  const tousIdentiques = rows.every(r => r.taux === tauxGlobal);

  const applyPonctuel = (val) => {
    const v = Number(val) || 0;
    commit(rows.map((r, i) => i === selIdx ? { ...r, ponctuel: v } : r),
      `Ponctuel ${rows[selIdx].mois} : +${fmt(v)} €`);
    showToast(`⚡ +${fmt(v)} € sur ${rows[selIdx].mois}`);
  };

  const applyTauxGlobal = (val) => {
    const t = Math.round(Math.min(10, Math.max(0.1, Number(val))) * 10) / 10;
    if (isNaN(t)) return;
    commit(rows.map(r => ({ ...r, taux: t })), `Taux global → ${t}%`);
    setEditingTaux(false);
    showToast(`📈 Taux global : ${t}%/mois`);
  };

  const applyTauxMois = (idx, val) => {
    const t = Math.round(Math.min(10, Math.max(0.1, Number(val))) * 10) / 10;
    if (isNaN(t)) return;
    commit(rows.map((r, i) => i === idx ? { ...r, taux: t } : r), `Taux ${rows[idx].mois} → ${t}%`);
    showToast(`📈 Taux ${rows[idx].mois} : ${t}%`);
  };

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = sim.find(r => r.mois === label); if (!d) return null;
    return (
      <div style={{ background: "#0c1a2e", border: "1px solid #1e3a5f", borderRadius: 10, padding: "12px 16px", fontSize: 12, minWidth: 190 }}>
        <div style={{ color: "#38bdf8", fontWeight: 800, marginBottom: 8 }}>{label}</div>
        {[["💰 Capital", fmt(d.capital)+" €", "#38bdf8"], ["📈 Gains", "+"+fmt(d.gains)+" €", "#4ade80"],
          ["📊 Taux", d.taux+"%", "#a78bfa"], ["💳 Apport", fmt(d.apport)+" €", "#94a3b8"],
          ...(d.ponctuel > 0 ? [["⚡ Ponctuel", "+"+fmt(d.ponctuel)+" €", "#f59e0b"]] : [])
        ].map(([l,v,c]) => <div key={l} style={{ display:"flex", justifyContent:"space-between", gap:16, marginBottom:3 }}><span style={{color:"#64748b"}}>{l}</span><b style={{color:c}}>{v}</b></div>)}
        {d.nouveauxPacks > 0 && <div style={{ marginTop:6, background:"#1e3a5f", borderRadius:6, padding:"3px 8px", color:"#f59e0b", fontWeight:700, textAlign:"center" }}>🎉 +{d.nouveauxPacks} pack(s) !</div>}
        <div style={{ borderTop:"1px solid #1e3a5f", paddingTop:4, marginTop:6, display:"flex", justifyContent:"space-between" }}>
          <span style={{color:"#64748b"}}>Performance</span><b style={{color:d.perf>=100?"#f59e0b":"#4ade80"}}>{d.perf}%</b>
        </div>
      </div>
    );
  };

  const barColor = (d, i) => {
    if (vue==="gains") return selIdx===i?"#22c55e":"#15803d";
    if (vue==="perf")  return d.perf>=100?"#d97706":selIdx===i?"#22c55e":"#15803d";
    return d.nouveauxPacks>0?"#1d4ed8":selIdx===i?"#0ea5e9":"#1e3a5f";
  };

  const btn = { border:"none", borderRadius:8, padding:"7px 14px", cursor:"pointer", fontSize:13, fontWeight:700 };

  return (
    <div>
      {/* HEADER */}
      <div style={{ background:"linear-gradient(135deg,#0a1628,#0d2137)", borderBottom:"1px solid #1e3a5f", padding:"12px 20px" }}>
        <div style={{ fontSize:16, fontWeight:800, color:"#38bdf8" }}>📈 Vue Mensuelle — Mar 2026 → Déc 2031</div>
        <div style={{ color:"#475569", fontSize:11, marginTop:2 }}>Cliquez sur un mois · modifications répercutées sur la vue annuelle</div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, padding:"14px 20px 0" }}>
        {[
          {icon:"💰", label:"Capital final",     value:fmt(last.capital)+" €",   color:"#38bdf8"},
          {icon:"📈", label:"Gains / mois",      value:fmt(last.gains)+" €",     color:"#4ade80"},
          {icon:"🎯", label:"Performance",       value:last.perf+"%",            color:last.perf>=100?"#f59e0b":"#4ade80"},
          {icon:"⚡", label:"Apports ponctuels", value:fmt(totalPonctuels)+" €", color:"#f59e0b"},
        ].map(k => (
          <div key={k.label} style={{background:"#0f1923",border:"1px solid #1e3a5f",borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:22}}>{k.icon}</div>
            <div><div style={{fontSize:16,fontWeight:800,color:k.color}}>{k.value}</div><div style={{fontSize:11,color:"#64748b"}}>{k.label}</div></div>
          </div>
        ))}
      </div>

      {/* CONTROLS */}
      <div style={{ display:"flex", gap:10, padding:"12px 20px", flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ background:"#0f1923", border:"1px solid #1e3a5f", borderRadius:10, padding:"10px 16px", display:"flex", alignItems:"center", gap:12, flex:1, minWidth:280 }}>
          <span style={{color:"#64748b",fontSize:12,whiteSpace:"nowrap"}}>📊 Taux global :</span>
          <input type="range" min="0.5" max="10" step="0.5" value={tousIdentiques?tauxGlobal:2}
            onChange={e=>{const t=Number(e.target.value);commit(rows.map(r=>({...r,taux:t})),`Taux global → ${t}%`);}}
            style={{flex:1,accentColor:"#38bdf8",cursor:"pointer"}}/>
          {editingTaux ? (
            <input autoFocus type="number" min="0.1" max="10" step="0.1" defaultValue={tousIdentiques?tauxGlobal:""}
              onBlur={e=>applyTauxGlobal(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")applyTauxGlobal(e.target.value);if(e.key==="Escape")setEditingTaux(false);}}
              style={{width:55,background:"#060d14",border:"1px solid #38bdf8",borderRadius:8,color:"#38bdf8",padding:"5px 8px",fontSize:15,fontWeight:800,textAlign:"center",outline:"none"}}/>
          ) : (
            <span onClick={()=>setEditingTaux(true)} style={{color:"#38bdf8",fontWeight:800,fontSize:16,minWidth:42,cursor:"pointer",background:"#060d14",border:"1px solid #1e3a5f",borderRadius:8,padding:"5px 8px",textAlign:"center"}}>
              {tousIdentiques?tauxGlobal:"~"}%
            </span>
          )}
          {!tousIdentiques && <span style={{fontSize:10,color:"#f59e0b",whiteSpace:"nowrap"}}>⚠ mixtes</span>}
        </div>
        <div style={{background:"#0f1923",border:"1px solid #1e3a5f",borderRadius:10,padding:"4px",display:"flex"}}>
          {[["capital","💰 Capital"],["gains","📈 Gains"],["perf","🎯 Perf."]].map(([id,lbl])=>(
            <button key={id} onClick={()=>setVue(id)} style={{...btn,background:vue===id?"#1e3a5f":"transparent",color:vue===id?"#38bdf8":"#64748b",padding:"7px 14px"}}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* GRAPHIQUE */}
      <div style={{margin:"0 20px",background:"#0f1923",border:"1px solid #1e3a5f",borderRadius:12,padding:"16px 12px 8px"}}>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={sim} onClick={e=>e?.activeTooltipIndex!=null&&setSelIdx(e.activeTooltipIndex)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false}/>
            <XAxis dataKey="mois" stroke="#475569" tick={{fontSize:9}} interval={5}/>
            <YAxis yAxisId="l" stroke="#475569" tick={{fontSize:9}} tickFormatter={v=>vue==="perf"?v+"%":v>=1000?(v/1000).toFixed(0)+"k":v}/>
            <YAxis yAxisId="r" orientation="right" stroke="#f59e0b" tick={{fontSize:9}} tickFormatter={v=>v>0?fmt(v)+" €":""}/>
            <Tooltip content={<Tip/>}/>
            <Bar yAxisId="l" dataKey={vue==="capital"?"capital":vue==="gains"?"gains":"perf"} radius={[3,3,0,0]} maxBarSize={12}>
              {sim.map((d,i)=><Cell key={i} fill={barColor(d,i)}/>)}
            </Bar>
            <Bar yAxisId="r" dataKey="ponctuel" fill="#f59e0b" radius={[3,3,0,0]} maxBarSize={8} opacity={0.85}/>
            <Line yAxisId="l" type="monotone" dataKey={vue==="capital"?"capital":vue==="gains"?"gains":"perf"} stroke="#38bdf8" strokeWidth={1.5} dot={false} legendType="none"/>
            {vue==="perf"&&<ReferenceLine yAxisId="l" y={100} stroke="#f59e0b" strokeDasharray="5 3" label={{value:"×2",fill:"#f59e0b",fontSize:10}}/>}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* PANNEAU MOIS */}
      {sel && (
        <div style={{margin:"12px 20px",background:"#0d2137",border:"2px solid #38bdf8",borderRadius:12,padding:"16px 20px",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:"#38bdf8",marginBottom:10}}>📅 {sel.mois}</div>
            <div style={{display:"grid",gridTemplateColumns:"auto auto",gap:"5px 20px",fontSize:12}}>
              {[["💰 Capital",fmt(sel.capital)+" €","#38bdf8"],["📈 Gains","+"+fmt(sel.gains)+" €","#4ade80"],
                ["📊 Taux",sel.taux+"%","#a78bfa"],["🎯 Perf.",sel.perf+"%",sel.perf>=100?"#f59e0b":"#4ade80"],
                ["📦 Packs",sel.packs,"#94a3b8"],["⚡ Ponctuel",sel.ponctuel>0?"+"+fmt(sel.ponctuel)+" €":"Aucun",sel.ponctuel>0?"#f59e0b":"#475569"]
              ].map(([l,v,c])=><span key={l} style={{display:"contents"}}><span style={{color:"#64748b"}}>{l} :</span><b style={{color:c}}>{v}</b></span>)}
            </div>
            {sel.nouveauxPacks>0&&<div style={{marginTop:8,background:"#1e3a5f",borderRadius:6,padding:"4px 10px",color:"#f59e0b",fontWeight:700,fontSize:12,display:"inline-block"}}>🎉 +{sel.nouveauxPacks} pack(s) !</div>}
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            {/* Ponctuel */}
            <div style={{background:"#060d14",border:"1px solid #1e3a5f",borderRadius:10,padding:"14px 16px",minWidth:220}}>
              <div style={{color:"#f59e0b",fontWeight:700,marginBottom:8,fontSize:13}}>⚡ Apport ponctuel</div>
              <div style={{display:"flex",gap:6,marginBottom:8}}>
                <input type="number" placeholder="Montant €" value={inputPonctuel}
                  onChange={e=>setInputPonctuel(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&applyPonctuel(inputPonctuel)}
                  style={{flex:1,background:"#0f1923",border:"1px solid #1e3a5f",borderRadius:8,color:"#e2e8f0",padding:"8px 10px",fontSize:14,fontWeight:700,outline:"none"}}/>
                <button onClick={()=>applyPonctuel(inputPonctuel)} style={{...btn,background:"#d97706",color:"#000",padding:"8px 12px"}}>✓</button>
                <button onClick={()=>{applyPonctuel(0);setInputPonctuel("");}} style={{...btn,background:"#7f1d1d",color:"#fca5a5",padding:"8px 10px"}}>✗</button>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {[500,1000,2000,5000].map(v=>(
                  <button key={v} onClick={()=>{applyPonctuel(v);setInputPonctuel(String(v));}}
                    style={{background:"#1e3a5f",border:"1px solid #2d5a8e",borderRadius:6,color:"#f59e0b",padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:700}}>
                    +{fmt(v)} €
                  </button>
                ))}
              </div>
            </div>
            {/* Taux du mois */}
            <div style={{background:"#060d14",border:"1px solid #1e3a5f",borderRadius:10,padding:"14px 16px",minWidth:200}}>
              <div style={{color:"#a78bfa",fontWeight:700,marginBottom:8,fontSize:13}}>📊 Taux pour {sel.mois}</div>
              <div style={{display:"flex",gap:6,marginBottom:6,alignItems:"center"}}>
                <input type="number" min="0.1" max="10" step="0.1" defaultValue={rows[selIdx]?.taux} key={selIdx}
                  onKeyDown={e=>e.key==="Enter"&&applyTauxMois(selIdx,e.target.value)}
                  onBlur={e=>{if(e.target.value!==String(rows[selIdx]?.taux))applyTauxMois(selIdx,e.target.value);}}
                  style={{flex:1,background:"#0f1923",border:"1px solid #a78bfa",borderRadius:8,color:"#a78bfa",padding:"8px 10px",fontSize:14,fontWeight:700,outline:"none"}}/>
                <span style={{color:"#a78bfa",fontWeight:800}}>%</span>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {[1,1.5,2,2.5,3].map(v=>(
                  <button key={v} onClick={()=>applyTauxMois(selIdx,v)}
                    style={{background:rows[selIdx]?.taux===v?"#312e81":"#1e3a5f",border:"1px solid #3730a3",borderRadius:6,color:"#a78bfa",padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:700}}>
                    {v}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABLEAU */}
      <div style={{margin:"12px 20px 24px",background:"#0f1923",border:"1px solid #1e3a5f",borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"10px 16px",background:"#0a1628",borderBottom:"1px solid #1e3a5f",fontSize:12,color:"#64748b",fontWeight:700}}>
          📋 Tableau mensuel — <span style={{fontWeight:400}}>cliquez une ligne pour modifier · 🔵 = nouveau pack</span>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{borderBottom:"1px solid #1e3a5f"}}>
                {["Mois","Capital","Gains/mois","Taux","Apport","⚡ Ponctuel","Packs","Perf."].map(h=>(
                  <th key={h} style={{padding:"8px 12px",textAlign:h==="Mois"?"left":"right",color:"#64748b",fontWeight:700,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sim.map((d,i)=>(
                <tr key={d.mois} onClick={()=>{setSelIdx(i);setInputPonctuel(rows[i].ponctuel>0?String(rows[i].ponctuel):"");}}
                  style={{borderBottom:"1px solid #0a1220",cursor:"pointer",background:selIdx===i?"#0d2137":i%2===0?"#0a1220":"transparent"}}
                  onMouseEnter={e=>{if(selIdx!==i)e.currentTarget.style.background="#0d1e30";}}
                  onMouseLeave={e=>{if(selIdx!==i)e.currentTarget.style.background=i%2===0?"#0a1220":"transparent";}}>
                  <td style={{padding:"6px 12px",color:selIdx===i?"#38bdf8":"#94a3b8",fontWeight:selIdx===i?700:400,whiteSpace:"nowrap"}}>
                    {d.mois}{d.nouveauxPacks>0&&<span style={{color:"#3b82f6",fontSize:8,marginLeft:3}}>●</span>}
                  </td>
                  <td style={{padding:"6px 12px",textAlign:"right",fontWeight:600}}>{fmt(d.capital)} €</td>
                  <td style={{padding:"6px 12px",textAlign:"right",color:"#4ade80"}}>+{fmt(d.gains)} €</td>
                  <td style={{padding:"6px 12px",textAlign:"right",color:d.taux!==tauxGlobal?"#f59e0b":"#a78bfa",fontWeight:d.taux!==tauxGlobal?700:400}}>{d.taux}%</td>
                  <td style={{padding:"6px 12px",textAlign:"right",color:"#64748b"}}>{fmt(d.apport)} €</td>
                  <td style={{padding:"6px 12px",textAlign:"right",color:d.ponctuel>0?"#f59e0b":"#334155",fontWeight:d.ponctuel>0?700:400}}>
                    {d.ponctuel>0?"+"+fmt(d.ponctuel)+" €":"—"}
                  </td>
                  <td style={{padding:"6px 12px",textAlign:"right"}}>{d.packs}</td>
                  <td style={{padding:"6px 12px",textAlign:"right",color:d.perf>=100?"#f59e0b":"#4ade80"}}>{d.perf}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// VUE ANNUELLE
// ═══════════════════════════════════════════════════════
const ALL_COLS = [
  {key:"capital",      label:"Capital",           color:"#38bdf8", fmt:v=>fmt(v)+" €"},
  {key:"gains",        label:"Gains/mois",        color:"#4ade80", fmt:v=>"+"+fmt(v)+" €"},
  {key:"cagnotte",     label:"Cagnotte",          color:"#86efac", fmt:v=>fmt(v)+" €"},
  {key:"gainsNets",    label:"Gains nets cumulés",color:"#34d399", fmt:v=>"+"+fmt(v)+" €"},
  {key:"taux",         label:"Taux (%)",          color:"#a78bfa", fmt:v=>v+"%"},
  {key:"apport",       label:"Apport mensuel",    color:"#94a3b8", fmt:v=>fmt(v)+" €"},
  {key:"ponctuel",     label:"Apport ponctuel",   color:"#f59e0b", fmt:v=>v>0?"+"+fmt(v)+" €":"—"},
  {key:"packs",        label:"Nb packs",          color:"#e2e8f0", fmt:v=>v},
  {key:"perf",         label:"Performance",       color:"#fbbf24", fmt:v=>fmtD(v)+"%"},
  {key:"progressPack", label:"Prochain pack",     color:"#f472b6", fmt:v=>v+"%"},
];
const EDITABLE_COLS = ["taux","apport","ponctuel"];
const DEFAULT_VIS   = ["capital","gains","cagnotte","taux","ponctuel","packs","perf"];

function VueAnnuelle({ rows, sim, commit, showToast }) {
  const years  = useMemo(() => getYears(rows), [rows]);
  const [selYear,  setSelYear]   = useState(() => getYears(BASE_ROWS)[0]);
  const [editCell, setEditCell]  = useState(null);
  const [editVal,  setEditVal]   = useState("");
  const [visCols,  setVisCols]   = useState(DEFAULT_VIS);
  const [colPick,  setColPick]   = useState(false);
  const [chartMode,setChartMode] = useState("area");
  const [chartKey, setChartKey]  = useState("capital");

  // S'assurer que l'année sélectionnée est toujours valide
  const activeYear = years.includes(selYear) ? selYear : years[0];

  // Filtrage des mois de l'année active, avec leur index global
  const yearEntries = useMemo(() =>
    sim.map((d, gi) => ({ ...d, gi })).filter(d => getYr(d.mois) === activeYear),
    [sim, activeYear]
  );

  const totalGainsAn = yearEntries.reduce((s,d) => s+d.gains, 0);
  const totalPonctAn = yearEntries.reduce((s,d) => s+d.ponctuel, 0);
  const packsAn      = yearEntries.reduce((s,d) => s+d.nouveauxPacks, 0);
  const firstRow     = yearEntries[0];
  const lastRow      = yearEntries[yearEntries.length-1];

  const updateCell = (gi, col, val) => {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) return;
    const label = col==="ponctuel" ? `Ponctuel ${rows[gi].mois} : +${fmt(n)} €`
                : col==="taux"    ? `Taux ${rows[gi].mois} → ${n}%`
                : `Apport ${rows[gi].mois} → ${fmt(n)} €`;
    commit(rows.map((r,i) => i===gi ? {...r,[col]:n} : r), label);
    showToast(`✏ ${label}`);
  };

  const startEdit  = (gi, col, cur) => { setEditCell({gi,col}); setEditVal(String(cur)); };
  const commitEdit = () => { if(editCell) updateCell(editCell.gi, editCell.col, editVal); setEditCell(null); };
  const toggleCol  = k => setVisCols(p => p.includes(k)?p.filter(x=>x!==k):[...p,k]);

  const visDefs = ALL_COLS.filter(c => visCols.includes(c.key));
  const chartDef = ALL_COLS.find(c => c.key===chartKey);
  const maxV = Math.max(...yearEntries.map(d=>d[chartKey]||0));
  const minV = Math.min(...yearEntries.map(d=>d[chartKey]||0));

  const Tip = ({active, payload, label}) => {
    if(!active||!payload?.length) return null;
    const d = yearEntries.find(r=>r.mois===label); if(!d) return null;
    return (
      <div style={{background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:10,padding:"12px 16px",fontSize:12,minWidth:210}}>
        <div style={{color:"#38bdf8",fontWeight:800,marginBottom:8}}>{label}</div>
        {ALL_COLS.filter(c=>c.key!=="progressPack").map(col=>(
          <div key={col.key} style={{display:"flex",justifyContent:"space-between",gap:16,marginBottom:3}}>
            <span style={{color:"#64748b"}}>{col.label}</span><b style={{color:col.color}}>{col.fmt(d[col.key])}</b>
          </div>
        ))}
        <div style={{marginTop:6,background:"#1e3a5f",borderRadius:4,height:5,overflow:"hidden"}}>
          <div style={{background:"linear-gradient(90deg,#f472b6,#ec4899)",height:"100%",width:d.progressPack+"%"}}/>
        </div>
        {d.nouveauxPacks>0&&<div style={{marginTop:6,background:"#1e3a5f",borderRadius:6,padding:"3px 8px",color:"#f59e0b",fontWeight:700,textAlign:"center"}}>🎉 +{d.nouveauxPacks} pack(s) !</div>}
      </div>
    );
  };

  const btn = (active,color="#38bdf8") => ({background:active?"#1e3a5f":"transparent",border:"none",borderRadius:8,color:active?color:"#64748b",padding:"6px 13px",cursor:"pointer",fontSize:11,fontWeight:active?700:400});

  return (
    <div onClick={()=>colPick&&setColPick(false)}>

      {/* HEADER */}
      <div style={{background:"linear-gradient(135deg,#0a1628,#0d2137)",borderBottom:"1px solid #1e3a5f",padding:"12px 22px"}}>
        <div style={{fontSize:16,fontWeight:800,color:"#38bdf8"}}>📊 Vue Annuelle</div>
        <div style={{color:"#475569",fontSize:11,marginTop:2}}>Modifications répercutées sur la vue mensuelle · cliquez une cellule pour éditer</div>
      </div>

      {/* SÉLECTEUR D'ANNÉE */}
      <div style={{padding:"14px 22px 0",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <span style={{color:"#64748b",fontSize:12,fontWeight:700}}>📅 Année :</span>
        {years.map(yr => {
          const isActive = yr === activeYear;
          const yrSim    = sim.filter((_,i) => getYr(rows[i]?.mois) === yr);
          const yrGains  = yrSim.reduce((s,d)=>s+d.gains,0);
          const yrPacks  = yrSim.reduce((s,d)=>s+d.nouveauxPacks,0);
          return (
            <button key={yr} onClick={()=>setSelYear(yr)} style={{
              background:isActive?"#1e3a5f":"#0f1923",
              border:`1px solid ${isActive?"#38bdf8":"#1e3a5f"}`,
              borderRadius:10, padding:"8px 16px", cursor:"pointer", textAlign:"left", transition:"all 0.15s",
            }}>
              <div style={{color:isActive?"#38bdf8":"#94a3b8",fontWeight:800,fontSize:15}}>20{yr}</div>
              <div style={{fontSize:10,color:isActive?"#38bdf880":"#475569",marginTop:2}}>
                +{fmt(yrGains)} €{yrPacks>0?` · ${yrPacks} pack${yrPacks>1?"s":""}` :""}
              </div>
            </button>
          );
        })}
      </div>

      {/* KPIs ANNUELS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,padding:"12px 22px 0"}}>
        {[
          {icon:"🏦",label:"Capital début",   value:firstRow?fmt(firstRow.capital)+" €":"—",  color:"#64748b"},
          {icon:"💰",label:"Capital fin",     value:lastRow?fmt(lastRow.capital)+" €":"—",    color:"#38bdf8"},
          {icon:"📈",label:"Gains sur l'an",  value:"+"+fmt(totalGainsAn)+" €",               color:"#4ade80"},
          {icon:"📦",label:"Packs achetés",   value:packsAn+" pack"+(packsAn!==1?"s":""),     color:"#f59e0b"},
          {icon:"🎯",label:"Performance fin", value:lastRow?fmtD(lastRow.perf)+"%":"—",       color:lastRow?.perf>=100?"#f59e0b":"#4ade80"},
        ].map(k=>(
          <div key={k.label} style={{background:"#0f1923",border:"1px solid #1e3a5f",borderRadius:10,padding:"11px 14px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:20}}>{k.icon}</div>
            <div><div style={{fontSize:14,fontWeight:800,color:k.color}}>{k.value}</div><div style={{fontSize:10,color:"#64748b"}}>{k.label}</div></div>
          </div>
        ))}
      </div>

      {/* CHART CONTROLS */}
      <div style={{display:"flex",gap:10,padding:"12px 22px",flexWrap:"wrap",alignItems:"center"}}>
        <div style={{background:"#0f1923",border:"1px solid #1e3a5f",borderRadius:10,padding:"4px 6px",display:"flex",flexWrap:"wrap",gap:2}}>
          {ALL_COLS.filter(c=>!["apport","ponctuel","progressPack"].includes(c.key)).map(col=>(
            <button key={col.key} onClick={()=>setChartKey(col.key)} style={btn(chartKey===col.key,col.color)}>{col.label}</button>
          ))}
        </div>
        <div style={{background:"#0f1923",border:"1px solid #1e3a5f",borderRadius:10,padding:"4px",display:"flex"}}>
          {[["area","〜 Aire"],["bar","▐ Barres"]].map(([id,lbl])=>(
            <button key={id} onClick={()=>setChartMode(id)} style={btn(chartMode===id)}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* GRAPHIQUE */}
      <div style={{margin:"0 22px",background:"#0f1923",border:"1px solid #1e3a5f",borderRadius:12,padding:"16px 12px 8px"}}>
        <div style={{marginBottom:8,fontSize:12}}>
          <b style={{color:chartDef?.color||"#38bdf8"}}>{chartDef?.label}</b>
          <span style={{color:"#475569"}}> · 20{activeYear}</span>
        </div>
        <ResponsiveContainer width="100%" height={230}>
          {chartMode==="area" ? (
            <AreaChart data={yearEntries}>
              <defs>
                <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={chartDef?.color||"#38bdf8"} stopOpacity={0.35}/>
                  <stop offset="95%" stopColor={chartDef?.color||"#38bdf8"} stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false}/>
              <XAxis dataKey="mois" stroke="#475569" tick={{fontSize:11}}/>
              <YAxis stroke="#475569" tick={{fontSize:9}} tickFormatter={v=>v>=1000?(v/1000).toFixed(1)+"k":v}/>
              <Tooltip content={<Tip/>}/>
              <Area type="monotone" dataKey={chartKey} stroke={chartDef?.color} strokeWidth={2.5} fill="url(#grad2)"
                dot={(props)=>{const d=yearEntries[props.index];if(!d?.nouveauxPacks)return <circle key={props.index} cx={props.cx} cy={props.cy} r={3} fill={chartDef?.color} stroke="none"/>;return <circle key={props.index} cx={props.cx} cy={props.cy} r={7} fill="#f59e0b" stroke="#060d14" strokeWidth={2}/>;}}
                activeDot={{r:7,strokeWidth:0}}/>
            </AreaChart>
          ) : (
            <BarChart data={yearEntries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false}/>
              <XAxis dataKey="mois" stroke="#475569" tick={{fontSize:11}}/>
              <YAxis stroke="#475569" tick={{fontSize:9}} tickFormatter={v=>v>=1000?(v/1000).toFixed(1)+"k":v}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey={chartKey} radius={[4,4,0,0]} maxBarSize={40}>
                {yearEntries.map((d,i)=>{const ratio=maxV===minV?1:(d[chartKey]-minV)/(maxV-minV);const alpha=Math.round(80+ratio*175).toString(16).padStart(2,"0");return <Cell key={i} fill={d.nouveauxPacks>0?"#f59e0b":`${chartDef?.color}${alpha}`}/>;}) }
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* TABLEAU ÉDITABLE */}
      <div style={{margin:"12px 22px 24px",background:"#0f1923",border:"1px solid #1e3a5f",borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"10px 16px",background:"#0a1628",borderBottom:"1px solid #1e3a5f",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <div style={{fontSize:12,color:"#64748b",fontWeight:700}}>
            📋 20{activeYear} — <span style={{fontWeight:400}}>colonnes <span style={{color:"#a78bfa"}}>Taux</span>, <span style={{color:"#94a3b8"}}>Apport</span>, <span style={{color:"#f59e0b"}}>Ponctuel</span> éditables</span>
          </div>
          <div style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setColPick(v=>!v)} style={{background:colPick?"#1e3a5f":"#0f1923",border:"1px solid #1e3a5f",borderRadius:8,color:"#38bdf8",padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>
              ⚙ Colonnes ({visCols.length}/{ALL_COLS.length})
            </button>
            {colPick&&(
              <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",zIndex:200,background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:10,padding:"10px 12px",minWidth:230,boxShadow:"0 8px 32px #00000090"}}>
                {ALL_COLS.map(col=>(
                  <label key={col.key} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 4px",cursor:"pointer",borderRadius:6}}
                    onMouseEnter={e=>e.currentTarget.style.background="#0f1923"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <input type="checkbox" checked={visCols.includes(col.key)} onChange={()=>toggleCol(col.key)} style={{accentColor:col.color,width:14,height:14,cursor:"pointer"}}/>
                    <span style={{fontSize:12,color:visCols.includes(col.key)?col.color:"#475569",fontWeight:visCols.includes(col.key)?600:400}}>
                      {col.label}{EDITABLE_COLS.includes(col.key)&&<span style={{color:"#475569",fontSize:10,marginLeft:4}}>✏</span>}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{borderBottom:"1px solid #1e3a5f"}}>
                <th style={{padding:"8px 14px",textAlign:"left",color:"#64748b",fontWeight:700}}>Mois</th>
                {visDefs.map(col=>(
                  <th key={col.key} style={{padding:"8px 12px",textAlign:"right",color:col.color,fontWeight:700,whiteSpace:"nowrap",opacity:0.85}}>
                    {col.label}{EDITABLE_COLS.includes(col.key)&&<span style={{color:"#475569",fontSize:9,marginLeft:3}}>✏</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yearEntries.map((d) => {
                const {gi} = d;
                return (
                  <tr key={d.mois}
                    style={{borderBottom:"1px solid #0a1220",background:d.nouveauxPacks>0?"#0d1e0d":gi%2===0?"#0a1220":"transparent",transition:"background 0.1s"}}
                    onMouseEnter={e=>e.currentTarget.style.background=d.nouveauxPacks>0?"#0f2a0f":"#0d1e30"}
                    onMouseLeave={e=>e.currentTarget.style.background=d.nouveauxPacks>0?"#0d1e0d":gi%2===0?"#0a1220":"transparent"}>
                    <td style={{padding:"7px 14px",color:d.nouveauxPacks>0?"#f59e0b":"#94a3b8",fontWeight:d.nouveauxPacks>0?800:400,whiteSpace:"nowrap"}}>
                      {d.mois}{d.nouveauxPacks>0&&<span style={{marginLeft:6,background:"#f59e0b20",border:"1px solid #f59e0b40",borderRadius:5,padding:"1px 6px",fontSize:10,color:"#f59e0b"}}>🎉 +{d.nouveauxPacks}</span>}
                    </td>
                    {visDefs.map(col=>{
                      const isEdit = editCell?.gi===gi && editCell?.col===col.key;
                      const isEditable = EDITABLE_COLS.includes(col.key);
                      const rawVal = col.key==="taux"?rows[gi].taux:col.key==="apport"?rows[gi].apport:col.key==="ponctuel"?rows[gi].ponctuel:null;

                      if(col.key==="progressPack") return (
                        <td key={col.key} style={{padding:"7px 12px",textAlign:"right"}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}>
                            <div style={{width:60,background:"#1e3a5f",borderRadius:3,height:5,overflow:"hidden"}}>
                              <div style={{background:"linear-gradient(90deg,#f472b6,#ec4899)",height:"100%",width:d.progressPack+"%",borderRadius:3}}/>
                            </div>
                            <span style={{color:"#f472b6",fontSize:11,fontWeight:600,minWidth:30}}>{d.progressPack}%</span>
                          </div>
                        </td>
                      );

                      return (
                        <td key={col.key} onClick={()=>isEditable&&!isEdit&&startEdit(gi,col.key,rawVal)}
                          style={{padding:"5px 12px",textAlign:"right",color:col.color,cursor:isEditable?"pointer":"default",whiteSpace:"nowrap"}}>
                          {isEdit ? (
                            <input autoFocus type="number" value={editVal}
                              onChange={e=>setEditVal(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={e=>{if(e.key==="Enter")commitEdit();if(e.key==="Escape")setEditCell(null);}}
                              style={{width:70,background:"#060d14",border:`1px solid ${col.color}`,borderRadius:6,color:col.color,padding:"4px 8px",fontSize:12,fontWeight:700,textAlign:"right",outline:"none"}}/>
                          ) : (
                            <span style={{borderBottom:isEditable?`1px dashed ${col.color}40`:"none",paddingBottom:isEditable?1:0}}>
                              {col.fmt(d[col.key])}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* TOTAL */}
              <tr style={{borderTop:"2px solid #1e3a5f",background:"#0a1628"}}>
                <td style={{padding:"9px 14px",color:"#38bdf8",fontWeight:800}}>TOTAL 20{activeYear}</td>
                {visDefs.map(col=>{
                  const v={
                    capital:   <b style={{color:"#38bdf8"}}>{lastRow?fmt(lastRow.capital)+" €":"—"}</b>,
                    gains:     <b style={{color:"#4ade80"}}>+{fmt(totalGainsAn)} €</b>,
                    gainsNets: <b style={{color:"#34d399"}}>{lastRow?"+"+fmt(lastRow.gainsNets)+" €":"—"}</b>,
                    perf:      <b style={{color:lastRow?.perf>=100?"#f59e0b":"#4ade80"}}>{lastRow?fmtD(lastRow.perf)+"%":"—"}</b>,
                    ponctuel:  <b style={{color:"#f59e0b"}}>{totalPonctAn>0?"+"+fmt(totalPonctAn)+" €":"—"}</b>,
                    packs:     <b style={{color:"#e2e8f0"}}>{lastRow?.packs}</b>,
                    cagnotte:  <b style={{color:"#86efac"}}>{lastRow?fmt(lastRow.cagnotte)+" €":"—"}</b>,
                  }[col.key]||"";
                  return <td key={col.key} style={{padding:"9px 12px",textAlign:"right"}}>{v}</td>;
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// VUE FISCALITÉ — Flat Tax 30%
// Scénario : retrait mensuel des gains nets, après 30% PFU
// ═══════════════════════════════════════════════════════
function VueFiscalite({ rows, sim }) {
  const FLAT_TAX = 0.30;
  const [tauxFiscal, setTauxFiscal] = useState(30); // modifiable
  const [modeRetrait, setModeRetrait] = useState("gains"); // "gains" | "partiel" | "total_fin"
  const [retraitPartiel, setRetraitPartiel] = useState(500);

  const taux = tauxFiscal / 100;

  // Simulation avec retrait fiscal mensuel
  const simFiscal = useMemo(() => {
    let cagnotte      = 0;
    let capitalActif  = CAPITAL_DEPART;
    let totalVerse    = CAPITAL_DEPART;
    let totalRetraits = 0;
    let totalImpots   = 0;

    return rows.map((row, i) => {
      const gains = Math.round(capitalActif * (row.taux / 100));
      cagnotte   += gains + row.apport + row.ponctuel;
      totalVerse += row.apport + row.ponctuel;

      const nouveauxPacks = Math.floor(cagnotte / 1000);
      const resteCagnotte = cagnotte - nouveauxPacks * 1000;
      const nouveauCapital = capitalActif + nouveauxPacks * 1000;
      const capitalBrut    = nouveauCapital + resteCagnotte;

      if (nouveauxPacks > 0) { cagnotte = resteCagnotte; capitalActif = nouveauCapital; }

      // Calcul du retrait selon le mode
      let retrait = 0;
      let impot   = 0;
      let netRetire = 0;

      if (modeRetrait === "gains") {
        // On retire les gains bruts du mois → impôt sur la plus-value
        const plusValue = Math.max(0, gains); // gains = plus-value mensuelle
        impot     = Math.round(plusValue * taux);
        retrait   = gains;
        netRetire = retrait - impot;
      } else if (modeRetrait === "partiel") {
        // Retrait fixe mensuel → on calcule la part de plus-value
        retrait   = Math.min(retraitPartiel, Math.max(0, capitalBrut - totalVerse));
        impot     = Math.round(retrait * taux);
        netRetire = retrait - impot;
      }
      // "total_fin" calculé séparément en dehors de la boucle

      totalRetraits += netRetire;
      totalImpots   += impot;

      // Capital après retrait (on ne retire QUE le net, l'impôt est prélevé)
      const capitalApresRetrait = capitalBrut - retrait;
      const gainsNets = Math.round(capitalBrut - totalVerse);
      const perf = totalVerse > 0 ? Math.round(((capitalApresRetrait - totalVerse) / totalVerse) * 1000) / 10 : 0;

      return {
        mois: row.mois,
        capitalBrut:    Math.round(capitalBrut),
        capitalNet:     Math.round(capitalApresRetrait),
        gains,
        impot,
        netRetire,
        totalRetraits:  Math.round(totalRetraits),
        totalImpots:    Math.round(totalImpots),
        gainsNets,
        perf,
        nouveauxPacks,
        taux: row.taux,
      };
    });
  }, [rows, taux, modeRetrait, retraitPartiel]);

  const last     = sim[sim.length - 1];       // simulation brute (sans retrait)
  const lastF    = simFiscal[simFiscal.length - 1];

  // Calcul du retrait total à la fin (scénario tout retirer en une fois)
  const gainsTotaux   = last.gainsNets;
  const impotFinal    = Math.round(gainsTotaux * taux);
  const netFinal      = gainsTotaux - impotFinal;
  const capitalFinal  = last.capital;
  const capitalApport = last.totalVerse;

  const fmt2 = n => fmt(Math.abs(n));

  // Données pour le graphique comparatif
  const chartData = sim.map((d, i) => ({
    mois:       d.mois,
    brut:       d.capital,
    apresImpot: simFiscal[i].capitalNet,
    impotCumul: simFiscal[i].totalImpots,
    netRetire:  simFiscal[i].totalRetraits,
  }));

  const scenarios = [
    {
      id: "gains",
      label: "Retrait mensuel des gains",
      desc: "Chaque mois, vous retirez tous les gains générés. Flat tax prélevée sur chaque retrait.",
      icon: "📅",
      color: "#38bdf8",
    },
    {
      id: "partiel",
      label: "Retrait mensuel fixe",
      desc: "Vous retirez un montant fixe chaque mois (si disponible en plus-value).",
      icon: "💳",
      color: "#a78bfa",
    },
    {
      id: "total_fin",
      label: "Tout retirer en fin de période",
      desc: "Pas de retrait mensuel. On calcule l'impôt sur la totalité des gains à la fin.",
      icon: "🏁",
      color: "#4ade80",
    },
  ];

  const activeScenario = scenarios.find(s => s.id === modeRetrait);

  return (
    <div style={{ color: "#e2e8f0" }}>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg,#1a0a0a,#2d1515)", borderBottom: "1px solid #7f1d1d", padding: "14px 22px" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#f87171" }}>💸 Fiscalité — Flat Tax (PFU)</div>
        <div style={{ color: "#6b3030", fontSize: 11, marginTop: 2 }}>
          Simulation de vos gains nets après imposition · basée sur vos données de la vue mensuelle
        </div>
      </div>

      {/* TAUX FISCAL + SCÉNARIO */}
      <div style={{ display: "flex", gap: 14, padding: "16px 22px 0", flexWrap: "wrap", alignItems: "stretch" }}>

        {/* Taux fiscal */}
        <div style={{ background: "#0f1923", border: "1px solid #7f1d1d", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, minWidth: 260 }}>
          <div>
            <div style={{ color: "#f87171", fontWeight: 700, fontSize: 12, marginBottom: 6 }}>⚖️ Taux d'imposition (PFU)</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="range" min="0" max="50" step="1" value={tauxFiscal}
                onChange={e => setTauxFiscal(Number(e.target.value))}
                style={{ width: 100, accentColor: "#f87171", cursor: "pointer" }} />
              <input type="number" min="0" max="50" value={tauxFiscal}
                onChange={e => setTauxFiscal(Math.min(50, Math.max(0, Number(e.target.value))))}
                style={{ width: 52, background: "#060d14", border: "1px solid #f87171", borderRadius: 8, color: "#f87171", padding: "5px 8px", fontSize: 18, fontWeight: 800, textAlign: "center", outline: "none" }} />
              <span style={{ color: "#f87171", fontWeight: 800, fontSize: 18 }}>%</span>
            </div>
            <div style={{ fontSize: 10, color: "#6b3030", marginTop: 4 }}>
              Flat Tax française (PFU) = 30% · modifiable
            </div>
          </div>
        </div>

        {/* Scénarios */}
        <div style={{ display: "flex", gap: 10, flex: 1, flexWrap: "wrap" }}>
          {scenarios.map(s => (
            <button key={s.id} onClick={() => setModeRetrait(s.id)}
              style={{ flex: 1, minWidth: 160, background: modeRetrait === s.id ? "#0d2137" : "#0f1923", border: `1.5px solid ${modeRetrait === s.id ? s.color : "#1e3a5f"}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ color: modeRetrait === s.id ? s.color : "#94a3b8", fontWeight: 700, fontSize: 12 }}>{s.label}</div>
              <div style={{ color: "#475569", fontSize: 10, marginTop: 3, lineHeight: 1.4 }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Retrait partiel — montant */}
      {modeRetrait === "partiel" && (
        <div style={{ margin: "12px 22px 0", background: "#0f1923", border: "1px solid #a78bfa", borderRadius: 10, padding: "12px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ color: "#a78bfa", fontSize: 12, fontWeight: 700 }}>💳 Montant retiré chaque mois :</span>
          <input type="number" min="0" value={retraitPartiel} onChange={e => setRetraitPartiel(Number(e.target.value) || 0)}
            style={{ width: 90, background: "#060d14", border: "1px solid #a78bfa", borderRadius: 8, color: "#a78bfa", padding: "6px 10px", fontSize: 16, fontWeight: 800, textAlign: "right", outline: "none" }} />
          <span style={{ color: "#a78bfa", fontWeight: 800 }}>€</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[100, 200, 500, 1000].map(v => (
              <button key={v} onClick={() => setRetraitPartiel(v)}
                style={{ background: retraitPartiel === v ? "#312e81" : "#1e3a5f", border: "1px solid #3730a3", borderRadius: 6, color: "#a78bfa", padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                {fmt(v)} €
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KPIs selon scénario */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, padding: "16px 22px 0" }}>
        {modeRetrait === "total_fin" ? [
          { icon: "💰", label: "Capital brut final",     value: fmt(capitalFinal) + " €",   color: "#38bdf8" },
          { icon: "📈", label: "Gains bruts totaux",     value: "+" + fmt(gainsTotaux) + " €", color: "#4ade80" },
          { icon: "🏛️", label: "Impôt total (" + tauxFiscal + "%)", value: "−" + fmt(impotFinal) + " €", color: "#f87171" },
          { icon: "✅", label: "Net encaissé",           value: "+" + fmt(netFinal) + " €", color: "#f59e0b" },
        ] : [
          { icon: "💰", label: "Capital restant",        value: fmt(lastF.capitalNet) + " €",   color: "#38bdf8" },
          { icon: "✅", label: "Total net encaissé",     value: "+" + fmt(lastF.totalRetraits) + " €", color: "#4ade80" },
          { icon: "🏛️", label: "Total impôts payés",    value: "−" + fmt(lastF.totalImpots) + " €",   color: "#f87171" },
          { icon: "📊", label: "Taux effectif réel",     value: lastF.totalImpots > 0 ? fmtD(lastF.totalImpots / (lastF.totalRetraits + lastF.totalImpots) * 100) + "%" : "0%", color: "#f59e0b" },
        ]}.map(k => (
          <div key={k.label} style={{ background: "#0f1923", border: "1px solid #1e3a5f", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 22 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* GRAPHIQUE COMPARATIF */}
      {modeRetrait !== "total_fin" && (
        <div style={{ margin: "14px 22px 0", background: "#0f1923", border: "1px solid #1e3a5f", borderRadius: 12, padding: "16px 12px 8px" }}>
          <div style={{ marginBottom: 8, fontSize: 12, color: "#64748b" }}>
            <b style={{ color: "#94a3b8" }}>Capital brut vs net après impôts</b>
            <span style={{ marginLeft: 12 }}><span style={{ color: "#38bdf8" }}>■</span> Capital brut</span>
            <span style={{ marginLeft: 10 }}><span style={{ color: "#4ade80" }}>■</span> Capital après retraits</span>
            <span style={{ marginLeft: 10 }}><span style={{ color: "#f87171" }}>■</span> Impôts cumulés</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gBrut"  x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/><stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/></linearGradient>
                <linearGradient id="gNet"   x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4ade80" stopOpacity={0.2}/><stop offset="95%" stopColor="#4ade80" stopOpacity={0}/></linearGradient>
                <linearGradient id="gImpot" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/><stop offset="95%" stopColor="#f87171" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false}/>
              <XAxis dataKey="mois" stroke="#475569" tick={{ fontSize: 9 }} interval={5}/>
              <YAxis stroke="#475569" tick={{ fontSize: 9 }} tickFormatter={v => v >= 1000 ? (v/1000).toFixed(0)+"k" : v}/>
              <Tooltip
                contentStyle={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 10, fontSize: 12 }}
                formatter={(value, name) => {
                  const labels = { brut: "Capital brut", apresImpot: "Capital après retraits", impotCumul: "Impôts cumulés", netRetire: "Net encaissé total" };
                  return [fmt(value) + " €", labels[name] || name];
                }}
              />
              <Area type="monotone" dataKey="brut"       stroke="#38bdf8" strokeWidth={1.5} fill="url(#gBrut)"  strokeDasharray="5 3"/>
              <Area type="monotone" dataKey="apresImpot" stroke="#4ade80" strokeWidth={2}   fill="url(#gNet)"/>
              <Area type="monotone" dataKey="impotCumul" stroke="#f87171" strokeWidth={1.5} fill="url(#gImpot)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* TABLEAU ANNUEL FISCAL */}
      <div style={{ margin: "14px 22px 24px", background: "#0f1923", border: "1px solid #1e3a5f", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", background: "#0a1628", borderBottom: "1px solid #1e3a5f", fontSize: 12, color: "#64748b", fontWeight: 700 }}>
          {modeRetrait === "total_fin"
            ? "📋 Récapitulatif — Retrait unique en fin de période"
            : "📋 Détail mensuel des retraits et impôts"}
        </div>

        {modeRetrait === "total_fin" ? (
          /* Tableau simple scénario fin */
          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {[
                { label: "Capital de départ (versé)",        value: fmt(CAPITAL_DEPART) + " €",      color: "#64748b" },
                { label: "Total apports versés",             value: fmt(last.totalVerse) + " €",     color: "#94a3b8" },
                { label: "Capital brut final",               value: fmt(capitalFinal) + " €",        color: "#38bdf8" },
                { label: "Gains bruts totaux",               value: "+" + fmt(gainsTotaux) + " €",   color: "#4ade80" },
                { label: `Impôt PFU ${tauxFiscal}% sur gains`, value: "−" + fmt(impotFinal) + " €", color: "#f87171" },
                { label: "Net encaissé après impôt",         value: "+" + fmt(netFinal) + " €",      color: "#f59e0b" },
                { label: "Patrimoine final net",             value: fmt(capitalApport + netFinal) + " €", color: "#fbbf24" },
                { label: "Performance nette",                value: fmtD(netFinal / last.totalVerse * 100) + "%", color: "#4ade80" },
                { label: "Manque à gagner vs sans impôt",    value: "−" + fmt(impotFinal) + " €",    color: "#f87171" },
              ].map(item => (
                <div key={item.label} style={{ background: "#060d14", border: "1px solid #1e3a5f", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ color: "#64748b", fontSize: 11, marginBottom: 6 }}>{item.label}</div>
                  <div style={{ color: item.color, fontWeight: 800, fontSize: 18 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Message récapitulatif */}
            <div style={{ marginTop: 16, background: "#0d2137", border: "1px solid #1e3a5f", borderRadius: 10, padding: "14px 18px", fontSize: 13, lineHeight: 1.7 }}>
              Sur <b style={{ color: "#38bdf8" }}>{fmt(gainsTotaux)} €</b> de gains bruts générés sur toute la période,
              la flat tax à <b style={{ color: "#f87171" }}>{tauxFiscal}%</b> prélèverait{" "}
              <b style={{ color: "#f87171" }}>{fmt(impotFinal)} €</b>.
              Il vous resterait <b style={{ color: "#f59e0b" }}>{fmt(netFinal)} €</b> nets,
              soit une performance nette de <b style={{ color: "#4ade80" }}>{fmtD(netFinal / last.totalVerse * 100)}%</b> sur vos apports.
            </div>
          </div>
        ) : (
          /* Tableau mensuel */
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e3a5f" }}>
                  {["Mois","Capital brut","Gains bruts","Retrait brut","Impôt ("+tauxFiscal+"%)","Net encaissé","Capital restant","Impôts cumulés","Net cumulé"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: h==="Mois"?"left":"right", color: "#64748b", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {simFiscal.map((d, i) => (
                  <tr key={d.mois}
                    style={{ borderBottom: "1px solid #0a1220", background: d.nouveauxPacks>0?"#0d1e0d":i%2===0?"#0a1220":"transparent" }}
                    onMouseEnter={e => e.currentTarget.style.background="#0d1e30"}
                    onMouseLeave={e => e.currentTarget.style.background=d.nouveauxPacks>0?"#0d1e0d":i%2===0?"#0a1220":"transparent"}>
                    <td style={{ padding: "6px 12px", color: "#94a3b8", whiteSpace: "nowrap" }}>
                      {d.mois}{d.nouveauxPacks>0&&<span style={{color:"#3b82f6",fontSize:8,marginLeft:3}}>●</span>}
                    </td>
                    <td style={{ padding: "6px 12px", textAlign: "right" }}>{fmt(d.capitalBrut)} €</td>
                    <td style={{ padding: "6px 12px", textAlign: "right", color: "#4ade80" }}>+{fmt(d.gains)} €</td>
                    <td style={{ padding: "6px 12px", textAlign: "right", color: "#94a3b8" }}>{d.netRetire > 0 ? fmt(d.gains || retraitPartiel) + " €" : "—"}</td>
                    <td style={{ padding: "6px 12px", textAlign: "right", color: d.impot > 0 ? "#f87171" : "#334155", fontWeight: d.impot > 0 ? 700 : 400 }}>
                      {d.impot > 0 ? "−" + fmt(d.impot) + " €" : "—"}
                    </td>
                    <td style={{ padding: "6px 12px", textAlign: "right", color: d.netRetire > 0 ? "#f59e0b" : "#334155", fontWeight: d.netRetire > 0 ? 700 : 400 }}>
                      {d.netRetire > 0 ? "+" + fmt(d.netRetire) + " €" : "—"}
                    </td>
                    <td style={{ padding: "6px 12px", textAlign: "right", color: "#38bdf8" }}>{fmt(d.capitalNet)} €</td>
                    <td style={{ padding: "6px 12px", textAlign: "right", color: "#f87171" }}>−{fmt(d.totalImpots)} €</td>
                    <td style={{ padding: "6px 12px", textAlign: "right", color: "#f59e0b", fontWeight: 600 }}>+{fmt(d.totalRetraits)} €</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #1e3a5f", background: "#0a1628" }}>
                  <td style={{ padding: "9px 12px", color: "#38bdf8", fontWeight: 800 }}>TOTAL</td>
                  <td style={{ padding: "9px 12px", textAlign: "right" }}></td>
                  <td style={{ padding: "9px 12px", textAlign: "right", color: "#4ade80", fontWeight: 700 }}>+{fmt(sim.reduce((s,d)=>s+d.gains,0))} €</td>
                  <td></td>
                  <td style={{ padding: "9px 12px", textAlign: "right", color: "#f87171", fontWeight: 700 }}>−{fmt(lastF.totalImpots)} €</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", color: "#f59e0b", fontWeight: 700 }}>+{fmt(lastF.totalRetraits)} €</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", color: "#38bdf8", fontWeight: 700 }}>{fmt(lastF.capitalNet)} €</td>
                  <td></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
