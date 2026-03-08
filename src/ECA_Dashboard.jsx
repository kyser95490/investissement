import { useState, useMemo } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from "recharts";

const INITIAL_DATA = [
  {mois:"Mar 26",capital:7000,apport:100,ponctuel:0},{mois:"Avr 26",capital:7000,apport:100,ponctuel:0},
  {mois:"Mai 26",capital:7000,apport:100,ponctuel:0},{mois:"Jun 26",capital:7000,apport:100,ponctuel:0},
  {mois:"Jul 26",capital:7000,apport:100,ponctuel:0},{mois:"Aoû 26",capital:8000,apport:100,ponctuel:0},
  {mois:"Sep 26",capital:8000,apport:100,ponctuel:0},{mois:"Oct 26",capital:8000,apport:100,ponctuel:0},
  {mois:"Nov 26",capital:8000,apport:100,ponctuel:0},{mois:"Déc 26",capital:9000,apport:100,ponctuel:0},
  {mois:"Jan 27",capital:9000,apport:100,ponctuel:0},{mois:"Fév 27",capital:9000,apport:100,ponctuel:0},
  {mois:"Mar 27",capital:10000,apport:100,ponctuel:0},{mois:"Avr 27",capital:10000,apport:100,ponctuel:0},
  {mois:"Mai 27",capital:10000,apport:100,ponctuel:0},{mois:"Jun 27",capital:10000,apport:100,ponctuel:0},
  {mois:"Jul 27",capital:11000,apport:100,ponctuel:0},{mois:"Aoû 27",capital:11000,apport:100,ponctuel:0},
  {mois:"Sep 27",capital:11000,apport:100,ponctuel:0},{mois:"Oct 27",capital:12000,apport:100,ponctuel:0},
  {mois:"Nov 27",capital:12000,apport:100,ponctuel:0},{mois:"Déc 27",capital:12000,apport:100,ponctuel:0},
  {mois:"Jan 28",capital:13000,apport:100,ponctuel:0},{mois:"Fév 28",capital:13000,apport:100,ponctuel:0},
  {mois:"Mar 28",capital:13000,apport:100,ponctuel:0},{mois:"Avr 28",capital:14000,apport:100,ponctuel:0},
  {mois:"Mai 28",capital:14000,apport:100,ponctuel:0},{mois:"Jun 28",capital:15000,apport:100,ponctuel:0},
  {mois:"Jul 28",capital:15000,apport:100,ponctuel:0},{mois:"Aoû 28",capital:15000,apport:100,ponctuel:0},
  {mois:"Sep 28",capital:16000,apport:100,ponctuel:0},{mois:"Oct 28",capital:16000,apport:100,ponctuel:0},
  {mois:"Nov 28",capital:17000,apport:100,ponctuel:0},{mois:"Déc 28",capital:17000,apport:100,ponctuel:0},
  {mois:"Jan 29",capital:18000,apport:100,ponctuel:0},{mois:"Fév 29",capital:18000,apport:100,ponctuel:0},
  {mois:"Mar 29",capital:18000,apport:100,ponctuel:0},{mois:"Avr 29",capital:19000,apport:100,ponctuel:0},
  {mois:"Mai 29",capital:19000,apport:100,ponctuel:0},{mois:"Jun 29",capital:20000,apport:100,ponctuel:0},
  {mois:"Jul 29",capital:20000,apport:100,ponctuel:0},{mois:"Aoû 29",capital:21000,apport:100,ponctuel:0},
  {mois:"Sep 29",capital:21000,apport:100,ponctuel:0},{mois:"Oct 29",capital:22000,apport:100,ponctuel:0},
  {mois:"Nov 29",capital:22000,apport:100,ponctuel:0},{mois:"Déc 29",capital:23000,apport:100,ponctuel:0},
  {mois:"Jan 30",capital:24000,apport:100,ponctuel:0},{mois:"Fév 30",capital:24000,apport:100,ponctuel:0},
  {mois:"Mar 30",capital:25000,apport:100,ponctuel:0},{mois:"Avr 30",capital:25000,apport:100,ponctuel:0},
  {mois:"Mai 30",capital:26000,apport:100,ponctuel:0},{mois:"Jun 30",capital:27000,apport:100,ponctuel:0},
  {mois:"Jul 30",capital:27000,apport:100,ponctuel:0},{mois:"Aoû 30",capital:28000,apport:100,ponctuel:0},
  {mois:"Sep 30",capital:28000,apport:100,ponctuel:0},{mois:"Oct 30",capital:29000,apport:100,ponctuel:0},
  {mois:"Nov 30",capital:30000,apport:100,ponctuel:0},{mois:"Déc 30",capital:31000,apport:100,ponctuel:0},
  {mois:"Jan 31",capital:31000,apport:100,ponctuel:0},{mois:"Fév 31",capital:32000,apport:100,ponctuel:0},
  {mois:"Mar 31",capital:33000,apport:100,ponctuel:0},{mois:"Avr 31",capital:33000,apport:100,ponctuel:0},
  {mois:"Mai 31",capital:34000,apport:100,ponctuel:0},{mois:"Jun 31",capital:35000,apport:100,ponctuel:0},
  {mois:"Jul 31",capital:36000,apport:100,ponctuel:0},{mois:"Aoû 31",capital:37000,apport:100,ponctuel:0},
  {mois:"Sep 31",capital:37000,apport:100,ponctuel:0},{mois:"Oct 31",capital:38000,apport:100,ponctuel:0},
  {mois:"Nov 31",capital:39000,apport:100,ponctuel:0},{mois:"Déc 31",capital:40000,apport:100,ponctuel:0},
];

const fmt = (n) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n));

function simulate(rows, taux) {
  const rate = taux / 100;
  let cagnotte = 0;
  let capitalActif = rows[0].capital;
  let totalApports = rows[0].capital;
  return rows.map((row) => {
    const gains = Math.round(capitalActif * rate);
    cagnotte += gains + row.apport + row.ponctuel;
    totalApports += row.apport + row.ponctuel;
    const nouveauxPacks = Math.floor(cagnotte / 1000);
    const reste = cagnotte - nouveauxPacks * 1000;
    const nouveauCapital = capitalActif + nouveauxPacks * 1000;
    const capitalTotal = nouveauCapital + reste;
    const perf = Math.round(((capitalTotal - totalApports) / totalApports) * 1000) / 10;
    if (nouveauxPacks > 0) { cagnotte = reste; capitalActif = nouveauCapital; }
    return { mois: row.mois, capital: Math.round(capitalTotal), gains, apport: row.apport, ponctuel: row.ponctuel, packs: nouveauCapital / 1000, perf, nouveauxPacks };
  });
}

export default function ECASimple() {
  const [rows, setRows] = useState(INITIAL_DATA);
  const [taux, setTaux] = useState(2);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [inputPonctuel, setInputPonctuel] = useState("");
  const [vue, setVue] = useState("capital");

  const sim = useMemo(() => simulate(rows, taux), [rows, taux]);
  const last = sim[sim.length - 1];
  const totalPonctuels = rows.reduce((s, r) => s + r.ponctuel, 0);
  const sel = selectedIdx !== null ? sim[selectedIdx] : null;

  const applyPonctuel = (val) => {
    setRows(prev => { const n = [...prev]; n[selectedIdx] = { ...n[selectedIdx], ponctuel: Number(val) || 0 }; return n; });
  };

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = sim.find(r => r.mois === label);
    if (!d) return null;
    return (
      <div style={{ background: "#0c1a2e", border: "1px solid #1e3a5f", borderRadius: 10, padding: "12px 16px", fontSize: 12 }}>
        <div style={{ color: "#38bdf8", fontWeight: 800, marginBottom: 8 }}>{label}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}><span style={{ color: "#94a3b8" }}>💰 Capital</span><b style={{ color: "#38bdf8" }}>{fmt(d.capital)} €</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}><span style={{ color: "#94a3b8" }}>📈 Gains</span><b style={{ color: "#4ade80" }}>+{fmt(d.gains)} €</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}><span style={{ color: "#94a3b8" }}>💳 Apport</span><b style={{ color: "#a78bfa" }}>{fmt(d.apport)} €</b></div>
          {d.ponctuel > 0 && <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}><span style={{ color: "#94a3b8" }}>⚡ Ponctuel</span><b style={{ color: "#f59e0b" }}>+{fmt(d.ponctuel)} €</b></div>}
          {d.nouveauxPacks > 0 && <div style={{ marginTop: 4, background: "#1e3a5f", borderRadius: 6, padding: "3px 8px", color: "#f59e0b", fontWeight: 700, textAlign: "center" }}>🎉 +{d.nouveauxPacks} nouveau(x) pack(s) !</div>}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20, borderTop: "1px solid #1e3a5f", paddingTop: 4, marginTop: 2 }}><span style={{ color: "#94a3b8" }}>Performance</span><b style={{ color: d.perf >= 100 ? "#f59e0b" : "#4ade80" }}>{d.perf}%</b></div>
        </div>
      </div>
    );
  };

  const barColor = (d, i) => {
    if (vue === "gains") return selectedIdx === i ? "#22c55e" : "#15803d";
    if (vue === "perf") return d.perf >= 100 ? "#d97706" : selectedIdx === i ? "#22c55e" : "#15803d";
    return d.nouveauxPacks > 0 ? "#1d4ed8" : selectedIdx === i ? "#0ea5e9" : "#1e3a5f";
  };

  return (
    <div style={{ background: "#060d14", minHeight: "100vh", color: "#e2e8f0", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg,#0a1628,#0d2137)", borderBottom: "1px solid #1e3a5f", padding: "16px 24px" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#38bdf8" }}>📈 Simulateur ECA — Vue Mensuelle</div>
        <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>Cliquez sur un mois dans le graphique ou le tableau pour ajouter un apport ponctuel</div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, padding: "16px 24px 0" }}>
        {[
          { icon: "💰", label: "Capital final", value: fmt(last.capital) + " €", color: "#38bdf8" },
          { icon: "📈", label: "Gains / mois", value: fmt(last.gains) + " €", color: "#4ade80" },
          { icon: "🎯", label: "Performance", value: last.perf + "%", color: last.perf >= 100 ? "#f59e0b" : "#4ade80" },
          { icon: "⚡", label: "Apports ponctuels", value: fmt(totalPonctuels) + " €", color: "#f59e0b" },
        ].map(k => (
          <div key={k.label} style={{ background: "#0f1923", border: "1px solid #1e3a5f", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 24 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", gap: 12, padding: "14px 24px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ background: "#0f1923", border: "1px solid #1e3a5f", borderRadius: 10, padding: "8px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#64748b", fontSize: 12 }}>Taux mensuel :</span>
          <input type="range" min="1" max="5" step="0.5" value={taux} onChange={e => setTaux(Number(e.target.value))} style={{ width: 90, accentColor: "#38bdf8", cursor: "pointer" }} />
          <span style={{ color: "#38bdf8", fontWeight: 800, fontSize: 16, minWidth: 34 }}>{taux}%</span>
        </div>
        <div style={{ background: "#0f1923", border: "1px solid #1e3a5f", borderRadius: 10, padding: "4px", display: "flex" }}>
          {[["capital","💰 Capital"],["gains","📈 Gains"],["perf","🎯 Perf."]].map(([id,lbl]) => (
            <button key={id} onClick={() => setVue(id)} style={{ background: vue===id?"#1e3a5f":"transparent", border:"none", borderRadius:8, color:vue===id?"#38bdf8":"#64748b", padding:"7px 14px", cursor:"pointer", fontSize:12, fontWeight:vue===id?700:400 }}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* GRAPHIQUE */}
      <div style={{ margin: "0 24px", background: "#0f1923", border: "1px solid #1e3a5f", borderRadius: 12, padding: "18px 14px 10px" }}>
        <div style={{ marginBottom: 6, fontSize: 12, color: "#64748b" }}>
          <span style={{ color: "#94a3b8", fontWeight: 700 }}>
            {vue === "capital" ? "Capital mois par mois" : vue === "gains" ? "Gains générés par mois" : "Performance globale (%)"}
          </span>
          {"  "}·{"  "}
          <span style={{ color: "#1d4ed8" }}>■</span> mois avec nouveau pack{"  "}
          <span style={{ color: "#f59e0b" }}>■</span> apport ponctuel
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={sim} onClick={e => e?.activeTooltipIndex !== undefined && setSelectedIdx(e.activeTooltipIndex)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
            <XAxis dataKey="mois" stroke="#475569" tick={{ fontSize: 9 }} interval={5} />
            <YAxis yAxisId="l" stroke="#475569" tick={{ fontSize: 9 }} tickFormatter={v => vue==="perf" ? v+"%" : v>=1000 ? (v/1000).toFixed(0)+"k" : v} />
            <YAxis yAxisId="r" orientation="right" stroke="#f59e0b" tick={{ fontSize: 9 }} tickFormatter={v => v>0 ? fmt(v)+" €" : ""} />
            <Tooltip content={<Tip />} />
            <Bar yAxisId="l" dataKey={vue==="capital"?"capital":vue==="gains"?"gains":"perf"} name={vue==="capital"?"Capital":vue==="gains"?"Gains/mois":"Perf %"} radius={[3,3,0,0]} maxBarSize={12}>
              {sim.map((d,i) => <Cell key={i} fill={barColor(d,i)} />)}
            </Bar>
            <Bar yAxisId="r" dataKey="ponctuel" name="Ponctuel" fill="#f59e0b" radius={[3,3,0,0]} maxBarSize={8} opacity={0.85} />
            <Line yAxisId="l" type="monotone" dataKey={vue==="capital"?"capital":vue==="gains"?"gains":"perf"} stroke="#38bdf8" strokeWidth={1.5} dot={false} legendType="none" />
            {vue==="perf" && <ReferenceLine yAxisId="l" y={100} stroke="#f59e0b" strokeDasharray="5 3" label={{ value:"×2", fill:"#f59e0b", fontSize:10 }} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* PANNEAU APPORT PONCTUEL */}
      {sel && (
        <div style={{ margin: "14px 24px", background: "#0d2137", border: "2px solid #38bdf8", borderRadius: 12, padding: "18px 22px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          {/* Détail mois */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#38bdf8", marginBottom: 10 }}>📅 {sel.mois}</div>
            <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "5px 20px", fontSize: 12 }}>
              {[["💰 Capital",fmt(sel.capital)+" €","#38bdf8"],["📈 Gains","+"+fmt(sel.gains)+" €","#4ade80"],["💳 Apport mensuel",fmt(sel.apport)+" €","#a78bfa"],["🎯 Performance",sel.perf+"%",sel.perf>=100?"#f59e0b":"#4ade80"],["📦 Packs",sel.packs,"#94a3b8"],["⚡ Ponctuel actuel",sel.ponctuel>0?"+"+fmt(sel.ponctuel)+" €":"Aucun",sel.ponctuel>0?"#f59e0b":"#475569"]].map(([l,v,c])=>(
                <><span style={{color:"#64748b"}}>{l} :</span><b style={{color:c}}>{v}</b></>
              ))}
            </div>
            {sel.nouveauxPacks > 0 && <div style={{ marginTop: 8, background: "#1e3a5f", borderRadius: 6, padding: "5px 10px", color: "#f59e0b", fontWeight: 700, fontSize: 12, display: "inline-block" }}>🎉 +{sel.nouveauxPacks} nouveau(x) pack(s) ce mois !</div>}
          </div>

          {/* Saisie */}
          <div style={{ background: "#060d14", border: "1px solid #1e3a5f", borderRadius: 10, padding: "16px 18px", minWidth: 250 }}>
            <div style={{ color: "#f59e0b", fontWeight: 700, marginBottom: 10, fontSize: 13 }}>⚡ Apport ponctuel pour {sel.mois}</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input type="number" placeholder="Montant en €" value={inputPonctuel} onChange={e => setInputPonctuel(e.target.value)}
                style={{ flex: 1, background: "#0f1923", border: "1px solid #1e3a5f", borderRadius: 8, color: "#e2e8f0", padding: "9px 12px", fontSize: 15, fontWeight: 700, outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button onClick={() => { applyPonctuel(inputPonctuel); }}
                style={{ flex: 1, background: "#d97706", border: "none", borderRadius: 8, color: "#000", fontWeight: 800, padding: "9px", cursor: "pointer", fontSize: 13 }}>✓ Appliquer</button>
              <button onClick={() => { applyPonctuel(0); setInputPonctuel(""); }}
                style={{ background: "#1e3a5f", border: "none", borderRadius: 8, color: "#94a3b8", fontWeight: 700, padding: "9px 14px", cursor: "pointer" }}>✗</button>
            </div>
            <div style={{ color: "#475569", fontSize: 11, marginBottom: 6 }}>Montants rapides :</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[500,1000,2000,5000].map(v => (
                <button key={v} onClick={() => { applyPonctuel(v); setInputPonctuel(v.toString()); }}
                  style={{ background: "#1e3a5f", border: "1px solid #2d5a8e", borderRadius: 6, color: "#f59e0b", padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                  +{fmt(v)} €
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TABLEAU */}
      <div style={{ margin: "14px 24px 24px", background: "#0f1923", border: "1px solid #1e3a5f", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", background: "#0a1628", borderBottom: "1px solid #1e3a5f", fontWeight: 700, color: "#64748b", fontSize: 12 }}>
          📋 Tableau mensuel — <span style={{ fontWeight: 400 }}>cliquez sur une ligne pour modifier l'apport ponctuel · 🔵 = nouveau pack</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e3a5f" }}>
                {["Mois","Capital","Gains/mois","Apport mensuel","⚡ Ponctuel","Packs","Perf."].map(h => (
                  <th key={h} style={{ padding: "8px 14px", textAlign: h==="Mois"?"left":"right", color: "#64748b", fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sim.map((d, i) => (
                <tr key={d.mois} onClick={() => { setSelectedIdx(i); setInputPonctuel(rows[i].ponctuel > 0 ? rows[i].ponctuel.toString() : ""); }}
                  style={{ borderBottom: "1px solid #0a1220", cursor: "pointer", background: selectedIdx===i ? "#0d2137" : i%2===0 ? "#0a1220" : "transparent" }}
                  onMouseEnter={e => { if(selectedIdx!==i) e.currentTarget.style.background="#0d1e30"; }}
                  onMouseLeave={e => { if(selectedIdx!==i) e.currentTarget.style.background=i%2===0?"#0a1220":"transparent"; }}>
                  <td style={{ padding: "7px 14px", color: selectedIdx===i?"#38bdf8":"#94a3b8", fontWeight: selectedIdx===i?700:400 }}>
                    {d.mois} {d.nouveauxPacks > 0 && <span title="Nouveau pack ce mois" style={{ color: "#3b82f6", fontSize: 8 }}>●</span>}
                  </td>
                  <td style={{ padding: "7px 14px", textAlign: "right", fontWeight: 600 }}>{fmt(d.capital)} €</td>
                  <td style={{ padding: "7px 14px", textAlign: "right", color: "#4ade80" }}>+{fmt(d.gains)} €</td>
                  <td style={{ padding: "7px 14px", textAlign: "right", color: "#a78bfa" }}>{fmt(d.apport)} €</td>
                  <td style={{ padding: "7px 14px", textAlign: "right", color: d.ponctuel>0?"#f59e0b":"#475569", fontWeight: d.ponctuel>0?700:400 }}>
                    {d.ponctuel > 0 ? "+"+fmt(d.ponctuel)+" €" : "—"}
                  </td>
                  <td style={{ padding: "7px 14px", textAlign: "right" }}>{d.packs}</td>
                  <td style={{ padding: "7px 14px", textAlign: "right", color: d.perf>=100?"#f59e0b":"#4ade80" }}>{d.perf}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
