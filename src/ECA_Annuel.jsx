import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

const MOIS_LABELS = ["Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc","Jan"];

const DEFAULT_ROWS = MOIS_LABELS.map((mois) => ({
  mois,
  apport: 100,
  ponctuel: 0,
  taux: 2,
}));

const fmt  = (n) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n));
const fmtD = (n) => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);

// ─── RÈGLE : gains + apport 100€/mois + ponctuels s'accumulent dans la cagnotte
// Dès que la cagnotte atteint 1 000 €, un pack est acheté automatiquement
function simulate(rows, capitalDepart) {
  let cagnotte     = 0;              // gains + apports + ponctuels
  let capitalActif = capitalDepart;  // capital qui génère les gains (multiple de 1000)
  let totalVerse   = capitalDepart;

  return rows.map((row) => {
    // 1. Gains du mois sur le capital actif
    const gains = Math.round(capitalActif * (row.taux / 100));

    // 2. Tout s'accumule dans la même cagnotte : gains + apport 100€ + ponctuel
    cagnotte   += gains + row.apport + row.ponctuel;
    totalVerse += row.apport + row.ponctuel;

    // 3. Achat automatique dès que la cagnotte atteint 1 000 €
    const nouveauxPacks  = Math.floor(cagnotte / 1000);
    const resteCagnotte  = cagnotte - nouveauxPacks * 1000;
    const nouveauCapital = capitalActif + nouveauxPacks * 1000;

    // 4. Capital total = capital actif + reste cagnotte
    const capitalTotal = nouveauCapital + resteCagnotte;
    const perf = Math.round(((capitalTotal - totalVerse) / totalVerse) * 1000) / 10;

    // 5. Mise à jour si pack(s) acheté(s)
    if (nouveauxPacks > 0) {
      cagnotte     = resteCagnotte;
      capitalActif = nouveauCapital;
    }

    return {
      mois         : row.mois,
      capital      : Math.round(capitalTotal),
      gains,
      cagnotteGains: Math.round(cagnotte), // cumul cagnotte vers prochain pack
      apport       : row.apport,
      ponctuel     : row.ponctuel,
      taux         : row.taux,
      packs        : nouveauCapital / 1000,
      perf,
      nouveauxPacks,
      totalVerse   : Math.round(totalVerse),
      gainsNets    : Math.round(capitalTotal - totalVerse),
      progressPack : Math.min(100, Math.round((cagnotte / 1000) * 100)),
    };
  });
}

const ALL_COLS = [
  { key:"capital",       label:"Capital",              color:"#38bdf8", fmt: v => fmt(v)+" €" },
  { key:"gains",         label:"Gains / mois",         color:"#4ade80", fmt: v => "+"+fmt(v)+" €" },
  { key:"cagnotteGains", label:"Cagnotte gains",       color:"#86efac", fmt: v => fmt(v)+" €" },
  { key:"gainsNets",     label:"Gains nets cumulés",   color:"#34d399", fmt: v => "+"+fmt(v)+" €" },
  { key:"taux",          label:"Taux (%)",             color:"#a78bfa", fmt: v => v+"%" },
  { key:"apport",        label:"Apport mensuel",       color:"#94a3b8", fmt: v => fmt(v)+" €" },
  { key:"ponctuel",      label:"Apport ponctuel",      color:"#f59e0b", fmt: v => v>0?"+"+fmt(v)+" €":"—" },
  { key:"packs",         label:"Nb packs",             color:"#e2e8f0", fmt: v => v },
  { key:"perf",          label:"Performance",          color:"#fbbf24", fmt: v => fmtD(v)+"%" },
  { key:"totalVerse",    label:"Total versé",          color:"#64748b", fmt: v => fmt(v)+" €" },
  { key:"progressPack",  label:"Prochain pack",        color:"#f472b6", fmt: v => v+"%" },
];

const EDITABLE = ["taux","apport","ponctuel"];
const DEFAULT_VIS = ["capital","gains","cagnotteGains","taux","ponctuel","packs","perf"];

export default function ECAAnuel() {
  const [rows, setRows]         = useState(DEFAULT_ROWS);
  const [capital, setCapital]   = useState(5000);
  const [capInput, setCapInput] = useState("5000");
  const [editCell, setEditCell] = useState(null);
  const [editVal,  setEditVal]  = useState("");
  const [visCols,  setVisCols]  = useState(DEFAULT_VIS);
  const [colPicker,setColPicker]= useState(false);
  const [chartMode,setChartMode]= useState("area");
  const [chartKey, setChartKey] = useState("capital");

  const sim  = useMemo(() => simulate(rows, capital), [rows, capital]);
  const last = sim[sim.length - 1];
  const totalGains     = sim.reduce((s,d) => s + d.gains, 0);
  const totalPonctuels = rows.reduce((s,r) => s + r.ponctuel, 0);
  const packMois       = sim.filter(d => d.nouveauxPacks > 0);

  const updateCell = (ri, col, val) => {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) return;
    setRows(prev => prev.map((r,i) => i===ri ? { ...r, [col]: n } : r));
  };

  const startEdit = (ri, col, cur) => { setEditCell({row:ri,col}); setEditVal(String(cur)); };
  const commitEdit = () => { if (editCell) updateCell(editCell.row, editCell.col, editVal); setEditCell(null); };
  const toggleCol  = (k) => setVisCols(p => p.includes(k) ? p.filter(x=>x!==k) : [...p,k]);

  const visDefs = ALL_COLS.filter(c => visCols.includes(c.key));
  const chartDef = ALL_COLS.find(c => c.key===chartKey);
  const maxVal = Math.max(...sim.map(d => d[chartKey]));
  const minVal = Math.min(...sim.map(d => d[chartKey]));

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = sim.find(r => r.mois===label); if (!d) return null;
    return (
      <div style={{ background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:10, padding:"12px 16px", fontSize:12, minWidth:220 }}>
        <div style={{ color:"#38bdf8", fontWeight:800, marginBottom:8 }}>{label}</div>
        {ALL_COLS.filter(c => !["progressPack","totalVerse"].includes(c.key)).map(col => (
          <div key={col.key} style={{ display:"flex", justifyContent:"space-between", gap:16, marginBottom:3 }}>
            <span style={{ color:"#64748b" }}>{col.label}</span>
            <b style={{ color:col.color }}>{col.fmt(d[col.key])}</b>
          </div>
        ))}
        {/* Barre progression vers prochain pack */}
        <div style={{ marginTop:8, borderTop:"1px solid #1e3a5f", paddingTop:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:11 }}>
            <span style={{ color:"#64748b" }}>Prochain pack</span>
            <span style={{ color:"#f472b6", fontWeight:700 }}>{d.cagnotteGains} / 1 000 €</span>
          </div>
          <div style={{ background:"#1e3a5f", borderRadius:4, height:6, overflow:"hidden" }}>
            <div style={{ background:"linear-gradient(90deg,#f472b6,#ec4899)", height:"100%", width:d.progressPack+"%", borderRadius:4, transition:"width 0.3s" }} />
          </div>
        </div>
        {d.nouveauxPacks > 0 && (
          <div style={{ marginTop:8, background:"#1e3a5f", borderRadius:6, padding:"4px 10px", color:"#f59e0b", fontWeight:700, textAlign:"center" }}>
            🎉 +{d.nouveauxPacks} pack(s) acheté(s) ce mois !
          </div>
        )}
      </div>
    );
  };

  const btn = (active, color="#38bdf8") => ({
    background: active ? "#1e3a5f" : "transparent",
    border: "none", borderRadius: 8,
    color: active ? color : "#64748b",
    padding: "6px 13px", cursor: "pointer",
    fontSize: 11, fontWeight: active ? 700 : 400,
  });

  return (
    <div style={{ background:"#060d14", minHeight:"100vh", color:"#e2e8f0", fontFamily:"'Segoe UI',system-ui,sans-serif" }}
      onClick={() => { if (colPicker) setColPicker(false); }}>

      {/* HEADER */}
      <div style={{ background:"linear-gradient(135deg,#0a1628,#0d2137)", borderBottom:"1px solid #1e3a5f", padding:"14px 22px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:"#38bdf8" }}>📊 Simulation annuelle — Fév → Jan</div>
          <div style={{ color:"#475569", fontSize:11, marginTop:2 }}>
            1 pack acheté automatiquement dès <b style={{ color:"#f472b6" }}>1 000 € de gains cumulés</b> · cliquez une cellule pour modifier
          </div>
        </div>
        <div style={{ background:"#0f1923", border:"1px solid #1e3a5f", borderRadius:10, padding:"8px 14px", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ color:"#64748b", fontSize:12 }}>💰 Capital de départ :</span>
          <input type="number" value={capInput}
            onChange={e => setCapInput(e.target.value)}
            onBlur={() => { const v=parseInt(capInput); if(!isNaN(v)&&v>0) setCapital(v); }}
            onKeyDown={e => { if(e.key==="Enter"){const v=parseInt(capInput);if(!isNaN(v)&&v>0){setCapital(v);e.target.blur();}}}}
            style={{ width:90, background:"#060d14", border:"1px solid #38bdf8", borderRadius:8, color:"#38bdf8", padding:"6px 10px", fontSize:16, fontWeight:800, textAlign:"right", outline:"none" }} />
          <span style={{ color:"#38bdf8", fontWeight:800 }}>€</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, padding:"14px 22px 0" }}>
        {[
          { icon:"🏦", label:"Capital départ",    value:fmt(capital)+" €",        color:"#64748b" },
          { icon:"💰", label:"Capital final",     value:fmt(last.capital)+" €",   color:"#38bdf8" },
          { icon:"📈", label:"Gains totaux",      value:"+"+fmt(totalGains)+" €", color:"#4ade80" },
          { icon:"📦", label:"Packs achetés",     value:packMois.reduce((s,d)=>s+d.nouveauxPacks,0)+" pack(s)", color:"#f59e0b" },
          { icon:"🎯", label:"Performance",       value:fmtD(last.perf)+"%",      color:last.perf>=100?"#f59e0b":"#4ade80" },
        ].map(k => (
          <div key={k.label} style={{ background:"#0f1923", border:"1px solid #1e3a5f", borderRadius:10, padding:"11px 14px", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ fontSize:20 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:k.color }}>{k.value}</div>
              <div style={{ fontSize:10, color:"#64748b" }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* RÈGLE VISUELLE packs */}
      <div style={{ margin:"12px 22px 0", background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:10, padding:"10px 16px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
        <div style={{ fontSize:12, color:"#64748b", fontWeight:700 }}>🎯 Règle d'achat de packs :</div>
        <div style={{ fontSize:12, color:"#e2e8f0" }}>
          Chaque mois, <b style={{ color:"#4ade80" }}>les gains (taux × capital actif)</b> s'accumulent dans une cagnotte.
          Dès que cette cagnotte atteint <b style={{ color:"#f472b6" }}>1 000 €</b>, un nouveau pack est acheté automatiquement
          — le capital actif augmente de <b style={{ color:"#38bdf8" }}>1 000 €</b> et génère plus de gains le mois suivant.
        </div>
        {packMois.length > 0 && (
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {packMois.map(d => (
              <span key={d.mois} style={{ background:"#1e3a5f", border:"1px solid #f59e0b50", borderRadius:6, color:"#f59e0b", fontSize:11, fontWeight:700, padding:"2px 8px" }}>
                🎉 {d.mois} +{d.nouveauxPacks}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CHART CONTROLS */}
      <div style={{ display:"flex", gap:10, padding:"12px 22px", flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ background:"#0f1923", border:"1px solid #1e3a5f", borderRadius:10, padding:"4px 6px", display:"flex", flexWrap:"wrap", gap:2 }}>
          {ALL_COLS.filter(c => !["apport","ponctuel","totalVerse","progressPack"].includes(c.key)).map(col => (
            <button key={col.key} onClick={() => setChartKey(col.key)} style={btn(chartKey===col.key, col.color)}>{col.label}</button>
          ))}
        </div>
        <div style={{ background:"#0f1923", border:"1px solid #1e3a5f", borderRadius:10, padding:"4px", display:"flex" }}>
          {[["area","〜 Aire"],["bar","▐ Barres"]].map(([id,lbl]) => (
            <button key={id} onClick={() => setChartMode(id)} style={btn(chartMode===id)}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* GRAPHIQUE */}
      <div style={{ margin:"0 22px", background:"#0f1923", border:"1px solid #1e3a5f", borderRadius:12, padding:"16px 12px 8px" }}>
        <div style={{ marginBottom:8, fontSize:12 }}>
          <b style={{ color:chartDef?.color||"#38bdf8" }}>{chartDef?.label}</b>
          <span style={{ color:"#475569" }}> · capital départ <b style={{ color:"#38bdf8" }}>{fmt(capital)} €</b> · taux 2%/mois · achat pack à 1 000 € de gains</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          {chartMode==="area" ? (
            <AreaChart data={sim}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={chartDef?.color||"#38bdf8"} stopOpacity={0.35}/>
                  <stop offset="95%" stopColor={chartDef?.color||"#38bdf8"} stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false}/>
              <XAxis dataKey="mois" stroke="#475569" tick={{ fontSize:11, fontWeight:600 }}/>
              <YAxis stroke="#475569" tick={{ fontSize:9 }} tickFormatter={v => v>=1000?(v/1000).toFixed(1)+"k":v}/>
              <Tooltip content={<Tip/>}/>
              <Area type="monotone" dataKey={chartKey} stroke={chartDef?.color||"#38bdf8"} strokeWidth={2.5} fill="url(#grad)"
                dot={(props) => {
                  const d = sim[props.index];
                  if (!d?.nouveauxPacks) return <circle key={props.index} cx={props.cx} cy={props.cy} r={3} fill={chartDef?.color} stroke="none"/>;
                  return <circle key={props.index} cx={props.cx} cy={props.cy} r={7} fill="#f59e0b" stroke="#060d14" strokeWidth={2}/>;
                }}
                activeDot={{ r:7, strokeWidth:0 }}
              />
            </AreaChart>
          ) : (
            <BarChart data={sim}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false}/>
              <XAxis dataKey="mois" stroke="#475569" tick={{ fontSize:11, fontWeight:600 }}/>
              <YAxis stroke="#475569" tick={{ fontSize:9 }} tickFormatter={v => v>=1000?(v/1000).toFixed(1)+"k":v}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey={chartKey} radius={[4,4,0,0]} maxBarSize={40}>
                {sim.map((d,i) => {
                  const ratio = maxVal===minVal ? 1 : (d[chartKey]-minVal)/(maxVal-minVal);
                  const alpha = Math.round(80+ratio*175).toString(16).padStart(2,"0");
                  const fill = d.nouveauxPacks>0 ? "#f59e0b" : `${chartDef?.color||"#38bdf8"}${alpha}`;
                  return <Cell key={i} fill={fill}/>;
                })}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
        <div style={{ fontSize:10, color:"#475569", textAlign:"center", marginTop:4 }}>
          ● Les <span style={{ color:"#f59e0b" }}>points/barres oranges</span> indiquent les mois où un pack a été acheté
        </div>
      </div>

      {/* TABLEAU */}
      <div style={{ margin:"12px 22px 24px", background:"#0f1923", border:"1px solid #1e3a5f", borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"10px 16px", background:"#0a1628", borderBottom:"1px solid #1e3a5f", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
          <div style={{ fontSize:12, color:"#64748b", fontWeight:700 }}>
            📋 Données mensuelles —{" "}
            <span style={{ fontWeight:400 }}>
              colonnes <span style={{ color:"#a78bfa" }}>Taux</span>, <span style={{ color:"#94a3b8" }}>Apport</span>, <span style={{ color:"#f59e0b" }}>Ponctuel</span>{" "}
              éditables (clic direct)
            </span>
          </div>
          <div style={{ position:"relative" }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setColPicker(v=>!v)}
              style={{ background:colPicker?"#1e3a5f":"#0f1923", border:"1px solid #1e3a5f", borderRadius:8, color:"#38bdf8", padding:"6px 14px", cursor:"pointer", fontSize:12, fontWeight:700 }}>
              ⚙ Colonnes ({visCols.length}/{ALL_COLS.length})
            </button>
            {colPicker && (
              <div style={{ position:"absolute", right:0, top:"calc(100% + 6px)", zIndex:200, background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:10, padding:"10px 12px", minWidth:230, boxShadow:"0 8px 32px #00000090" }}>
                <div style={{ fontSize:11, color:"#475569", marginBottom:8, fontWeight:700 }}>Afficher / masquer les colonnes</div>
                {ALL_COLS.map(col => (
                  <label key={col.key} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 4px", cursor:"pointer", borderRadius:6 }}
                    onMouseEnter={e=>e.currentTarget.style.background="#0f1923"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <input type="checkbox" checked={visCols.includes(col.key)} onChange={()=>toggleCol(col.key)}
                      style={{ accentColor:col.color, width:14, height:14, cursor:"pointer" }}/>
                    <span style={{ fontSize:12, color:visCols.includes(col.key)?col.color:"#475569", fontWeight:visCols.includes(col.key)?600:400 }}>
                      {col.label}
                      {EDITABLE.includes(col.key) && <span style={{ color:"#475569", fontSize:10, marginLeft:4 }}>✏</span>}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid #1e3a5f" }}>
                <th style={{ padding:"8px 14px", textAlign:"left", color:"#64748b", fontWeight:700 }}>Mois</th>
                {visDefs.map(col => (
                  <th key={col.key} style={{ padding:"8px 12px", textAlign:"right", color:col.color, fontWeight:700, whiteSpace:"nowrap", opacity:0.85 }}>
                    {col.label}{EDITABLE.includes(col.key)&&<span style={{ color:"#475569", fontSize:9, marginLeft:3 }}>✏</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sim.map((d, i) => (
                <tr key={d.mois}
                  style={{ borderBottom:"1px solid #0a1220", background:d.nouveauxPacks>0?"#0d1e0d":i%2===0?"#0a1220":"transparent", transition:"background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background=d.nouveauxPacks>0?"#0f2a0f":"#0d1e30"}
                  onMouseLeave={e => e.currentTarget.style.background=d.nouveauxPacks>0?"#0d1e0d":i%2===0?"#0a1220":"transparent"}>

                  {/* Mois */}
                  <td style={{ padding:"7px 14px", color:d.nouveauxPacks>0?"#f59e0b":"#94a3b8", fontWeight:d.nouveauxPacks>0?800:400, whiteSpace:"nowrap" }}>
                    {d.mois}
                    {d.nouveauxPacks>0 && <span style={{ marginLeft:6, background:"#f59e0b20", border:"1px solid #f59e0b40", borderRadius:5, padding:"1px 6px", fontSize:10, color:"#f59e0b" }}>🎉 +{d.nouveauxPacks} pack</span>}
                  </td>

                  {/* Colonnes */}
                  {visDefs.map(col => {
                    const isEditing = editCell?.row===i && editCell?.col===col.key;
                    const isEditable = EDITABLE.includes(col.key);
                    const rawVal = col.key==="taux"?rows[i].taux : col.key==="apport"?rows[i].apport : col.key==="ponctuel"?rows[i].ponctuel : null;

                    // Barre de progression spéciale pour prochain pack
                    if (col.key==="progressPack") return (
                      <td key={col.key} style={{ padding:"7px 12px", textAlign:"right" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"flex-end" }}>
                          <div style={{ width:60, background:"#1e3a5f", borderRadius:3, height:5, overflow:"hidden" }}>
                            <div style={{ background:"linear-gradient(90deg,#f472b6,#ec4899)", height:"100%", width:d.progressPack+"%", borderRadius:3 }}/>
                          </div>
                          <span style={{ color:"#f472b6", fontSize:11, fontWeight:600, minWidth:30 }}>{d.progressPack}%</span>
                        </div>
                      </td>
                    );

                    return (
                      <td key={col.key}
                        onClick={() => isEditable && !isEditing && startEdit(i, col.key, rawVal)}
                        style={{ padding:"5px 12px", textAlign:"right", color:col.color, cursor:isEditable?"pointer":"default", whiteSpace:"nowrap" }}>
                        {isEditing ? (
                          <input autoFocus type="number" value={editVal}
                            onChange={e => setEditVal(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={e => { if(e.key==="Enter")commitEdit(); if(e.key==="Escape")setEditCell(null); }}
                            style={{ width:70, background:"#060d14", border:`1px solid ${col.color}`, borderRadius:6, color:col.color, padding:"4px 8px", fontSize:12, fontWeight:700, textAlign:"right", outline:"none" }}/>
                        ) : (
                          <span style={{ borderBottom:isEditable?`1px dashed ${col.color}40`:"none", paddingBottom:isEditable?1:0 }}>
                            {col.fmt(d[col.key])}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* TOTAL */}
              <tr style={{ borderTop:"2px solid #1e3a5f", background:"#0a1628" }}>
                <td style={{ padding:"9px 14px", color:"#38bdf8", fontWeight:800 }}>TOTAL / FIN</td>
                {visDefs.map(col => {
                  const v = {
                    capital:       <b style={{ color:"#38bdf8" }}>{fmt(last.capital)} €</b>,
                    gains:         <b style={{ color:"#4ade80" }}>+{fmt(totalGains)} €</b>,
                    gainsNets:     <b style={{ color:"#34d399" }}>+{fmt(last.gainsNets)} €</b>,
                    perf:          <b style={{ color:last.perf>=100?"#f59e0b":"#4ade80" }}>{fmtD(last.perf)}%</b>,
                    ponctuel:      <b style={{ color:"#f59e0b" }}>{totalPonctuels>0?"+"+fmt(totalPonctuels)+" €":"—"}</b>,
                    packs:         <b style={{ color:"#e2e8f0" }}>{last.packs}</b>,
                    totalVerse:    <b style={{ color:"#64748b" }}>{fmt(last.totalVerse)} €</b>,
                    cagnotteGains: <b style={{ color:"#86efac" }}>{fmt(last.cagnotteGains)} €</b>,
                  }[col.key] || "";
                  return <td key={col.key} style={{ padding:"9px 12px", textAlign:"right" }}>{v}</td>;
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
