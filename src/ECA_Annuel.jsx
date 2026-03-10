import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { CAPITAL_DEPART } from "./App";

const fmt  = (n) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n));
const fmtD = (n) => new Intl.NumberFormat("fr-FR", { minimumFractionDigits:1, maximumFractionDigits:1 }).format(n);

// Simulation cumulative depuis le début (pour avoir le bon capital de départ par année)
function simulateAll(rows) {
  let cagnotte = 0;
  let capitalActif = CAPITAL_DEPART;
  let totalVerse = CAPITAL_DEPART;
  return rows.map((row) => {
    const gains = Math.round(capitalActif * (row.taux / 100));
    cagnotte += gains + row.apport + row.ponctuel;
    totalVerse += row.apport + row.ponctuel;
    const nouveauxPacks = Math.floor(cagnotte / 1000);
    const resteCagnotte = cagnotte - nouveauxPacks * 1000;
    const nouveauCapital = capitalActif + nouveauxPacks * 1000;
    const capitalTotal = nouveauCapital + resteCagnotte;
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

const ALL_COLS = [
  { key:"capital",      label:"Capital",            color:"#38bdf8", fmt: v => fmt(v)+" €" },
  { key:"gains",        label:"Gains / mois",       color:"#4ade80", fmt: v => "+"+fmt(v)+" €" },
  { key:"cagnotte",     label:"Cagnotte",           color:"#86efac", fmt: v => fmt(v)+" €" },
  { key:"gainsNets",    label:"Gains nets cumulés", color:"#34d399", fmt: v => "+"+fmt(v)+" €" },
  { key:"taux",         label:"Taux (%)",           color:"#a78bfa", fmt: v => v+"%" },
  { key:"apport",       label:"Apport mensuel",     color:"#94a3b8", fmt: v => fmt(v)+" €" },
  { key:"ponctuel",     label:"Apport ponctuel",    color:"#f59e0b", fmt: v => v>0?"+"+fmt(v)+" €":"—" },
  { key:"packs",        label:"Nb packs",           color:"#e2e8f0", fmt: v => v },
  { key:"perf",         label:"Performance",        color:"#fbbf24", fmt: v => fmtD(v)+"%" },
  { key:"totalVerse",   label:"Total versé",        color:"#64748b", fmt: v => fmt(v)+" €" },
  { key:"progressPack", label:"Prochain pack",      color:"#f472b6", fmt: v => v+"%" },
];
const EDITABLE = ["taux","apport","ponctuel"];
const DEFAULT_VIS = ["capital","gains","cagnotte","taux","ponctuel","packs","perf"];

export default function ECAAnuel({ rows, commit, undo, redo, reset, past, future, showToast }) {
  const [selectedYear, setSelectedYear] = useState(null); // null = auto (première année disponible)
  const [editCell,   setEditCell]   = useState(null);
  const [editVal,    setEditVal]    = useState("");
  const [visCols,    setVisCols]    = useState(DEFAULT_VIS);
  const [colPicker,  setColPicker]  = useState(false);
  const [chartMode,  setChartMode]  = useState("area");
  const [chartKey,   setChartKey]   = useState("capital");

  // Simulation complète
  const simAll = useMemo(() => simulateAll(rows), [rows]);

  // Années disponibles dans les données
  const years = useMemo(() => {
    const seen = new Set();
    // Groupe par année calendaire (ex: "26" → 2026)
    // Chaque "année" dans la vue annuelle = 12 mois consécutifs à partir de Jan
    // On regroupe par l'année qui apparaît dans le label mois (ex "Mar 26" → 26)
    rows.forEach(r => {
      const yr = r.mois.split(" ")[1];
      if (yr) seen.add(yr);
    });
    return [...seen].sort();
  }, [rows]);

  const activeYear = selectedYear || years[0];

  // Filtre les 12 mois de l'année sélectionnée
  const yearRows = useMemo(() => {
    const indices = rows.reduce((acc, r, i) => {
      if (r.mois.split(" ")[1] === activeYear) acc.push(i);
      return acc;
    }, []);
    return indices.map(i => ({ ...simAll[i], _idx: i }));
  }, [simAll, activeYear, rows]);

  // KPIs annuels
  const firstOfYear = yearRows[0];
  const lastOfYear  = yearRows[yearRows.length - 1];
  const totalGainsAn   = yearRows.reduce((s,d) => s + d.gains, 0);
  const totalPonctAn   = yearRows.reduce((s,d) => s + d.ponctuel, 0);
  const packsAchetes   = yearRows.reduce((s,d) => s + d.nouveauxPacks, 0);

  const updateCell = (globalIdx, col, val) => {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) return;
    const label = col==="taux" ? `Taux ${rows[globalIdx].mois} → ${n}%`
                : col==="ponctuel" ? `Ponctuel ${rows[globalIdx].mois} : +${fmt(n)} €`
                : `Apport ${rows[globalIdx].mois} → ${fmt(n)} €`;
    commit(rows.map((r,i) => i===globalIdx ? {...r,[col]:n} : r), label);
    showToast(`✏ ${label}`);
  };

  const startEdit = (globalIdx, col, cur) => { setEditCell({idx:globalIdx,col}); setEditVal(String(cur)); };
  const commitEdit = () => {
    if (editCell) updateCell(editCell.idx, editCell.col, editVal);
    setEditCell(null);
  };

  const toggleCol = (k) => setVisCols(p => p.includes(k) ? p.filter(x=>x!==k) : [...p,k]);
  const visDefs = ALL_COLS.filter(c => visCols.includes(c.key));
  const chartDef = ALL_COLS.find(c => c.key===chartKey);
  const maxVal = Math.max(...yearRows.map(d => d[chartKey]||0));
  const minVal = Math.min(...yearRows.map(d => d[chartKey]||0));

  const btn = (active, color="#38bdf8") => ({
    background: active?"#1e3a5f":"transparent", border:"none", borderRadius:8,
    color: active?color:"#64748b", padding:"6px 13px", cursor:"pointer",
    fontSize:11, fontWeight:active?700:400,
  });

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = yearRows.find(r => r.mois===label); if (!d) return null;
    return (
      <div style={{background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:10,padding:"12px 16px",fontSize:12,minWidth:210}}>
        <div style={{color:"#38bdf8",fontWeight:800,marginBottom:8}}>{label}</div>
        {ALL_COLS.filter(c=>!["progressPack","totalVerse"].includes(c.key)).map(col=>(
          <div key={col.key} style={{display:"flex",justifyContent:"space-between",gap:16,marginBottom:3}}>
            <span style={{color:"#64748b"}}>{col.label}</span>
            <b style={{color:col.color}}>{col.fmt(d[col.key])}</b>
          </div>
        ))}
        <div style={{marginTop:8,borderTop:"1px solid #1e3a5f",paddingTop:8}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:11}}>
            <span style={{color:"#64748b"}}>Prochain pack</span>
            <span style={{color:"#f472b6",fontWeight:700}}>{d.cagnotte} / 1 000 €</span>
          </div>
          <div style={{background:"#1e3a5f",borderRadius:4,height:6,overflow:"hidden"}}>
            <div style={{background:"linear-gradient(90deg,#f472b6,#ec4899)",height:"100%",width:d.progressPack+"%",borderRadius:4}}/>
          </div>
        </div>
        {d.nouveauxPacks>0&&<div style={{marginTop:8,background:"#1e3a5f",borderRadius:6,padding:"4px 10px",color:"#f59e0b",fontWeight:700,textAlign:"center"}}>🎉 +{d.nouveauxPacks} pack(s) acheté(s) !</div>}
      </div>
    );
  };

  return (
    <div style={{color:"#e2e8f0"}} onClick={()=>colPicker&&setColPicker(false)}>

      {/* HEADER */}
      <div style={{background:"linear-gradient(135deg,#0a1628,#0d2137)",borderBottom:"1px solid #1e3a5f",padding:"12px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:"#38bdf8"}}>📊 Vue Annuelle</div>
          <div style={{color:"#475569",fontSize:11,marginTop:2}}>Les modifications ici sont répercutées sur la vue mensuelle · cliquez une cellule pour modifier</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <button onClick={undo}  disabled={!past.length}   style={{border:"none",borderRadius:8,padding:"7px 14px",cursor:past.length?"pointer":"not-allowed",fontSize:13,fontWeight:700,background:past.length?"#1e3a5f":"#0f1923",color:past.length?"#38bdf8":"#334155"}}>↩ Annuler</button>
          <button onClick={redo}  disabled={!future.length} style={{border:"none",borderRadius:8,padding:"7px 14px",cursor:future.length?"pointer":"not-allowed",fontSize:13,fontWeight:700,background:future.length?"#1e3a5f":"#0f1923",color:future.length?"#a78bfa":"#334155"}}>↪ Rétablir</button>
          <button onClick={reset} style={{border:"1px solid #7f1d1d",borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:12,fontWeight:700,background:"transparent",color:"#f87171"}}>🔄 Reset</button>
        </div>
      </div>

      {/* SÉLECTEUR D'ANNÉE */}
      <div style={{padding:"12px 22px 0",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <span style={{color:"#64748b",fontSize:12,fontWeight:700}}>📅 Année :</span>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {years.map(yr => {
            const isActive = yr===activeYear;
            // Résumé rapide de l'année
            const yrRows = simAll.filter((_,i) => rows[i]?.mois.split(" ")[1]===yr);
            const yrGains = yrRows.reduce((s,d)=>s+d.gains,0);
            const yrPacks = yrRows.reduce((s,d)=>s+d.nouveauxPacks,0);
            return (
              <button key={yr} onClick={()=>setSelectedYear(yr)}
                style={{background:isActive?"#1e3a5f":"#0f1923",border:isActive?"1px solid #38bdf8":"1px solid #1e3a5f",borderRadius:10,padding:"8px 14px",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                <div style={{color:isActive?"#38bdf8":"#94a3b8",fontWeight:800,fontSize:14}}>20{yr}</div>
                <div style={{fontSize:10,color:isActive?"#38bdf880":"#475569",marginTop:2}}>
                  +{fmt(yrGains)} € gains{yrPacks>0?` · ${yrPacks} pack${yrPacks>1?"s":""}`:""}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPIs ANNUELS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,padding:"12px 22px 0"}}>
        {[
          {icon:"🏦",label:"Capital début année", value:firstOfYear?fmt(firstOfYear.capital)+" €":"—", color:"#64748b"},
          {icon:"💰",label:"Capital fin d'année",  value:lastOfYear?fmt(lastOfYear.capital)+" €":"—",  color:"#38bdf8"},
          {icon:"📈",label:"Gains sur l'année",    value:"+"+fmt(totalGainsAn)+" €",                  color:"#4ade80"},
          {icon:"📦",label:"Packs achetés",        value:packsAchetes+" pack"+(packsAchetes>1?"s":""), color:"#f59e0b"},
          {icon:"🎯",label:"Performance fin",      value:lastOfYear?fmtD(lastOfYear.perf)+"%":"—",     color:lastOfYear?.perf>=100?"#f59e0b":"#4ade80"},
        ].map(k=>(
          <div key={k.label} style={{background:"#0f1923",border:"1px solid #1e3a5f",borderRadius:10,padding:"11px 14px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:20}}>{k.icon}</div>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:k.color}}>{k.value}</div>
              <div style={{fontSize:10,color:"#64748b"}}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CHART CONTROLS */}
      <div style={{display:"flex",gap:10,padding:"12px 22px",flexWrap:"wrap",alignItems:"center"}}>
        <div style={{background:"#0f1923",border:"1px solid #1e3a5f",borderRadius:10,padding:"4px 6px",display:"flex",flexWrap:"wrap",gap:2}}>
          {ALL_COLS.filter(c=>!["apport","ponctuel","totalVerse","progressPack"].includes(c.key)).map(col=>(
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
          <span style={{color:"#475569"}}> · année 20{activeYear} · capital départ {fmt(CAPITAL_DEPART)} €</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          {chartMode==="area" ? (
            <AreaChart data={yearRows}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={chartDef?.color||"#38bdf8"} stopOpacity={0.35}/>
                  <stop offset="95%" stopColor={chartDef?.color||"#38bdf8"} stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false}/>
              <XAxis dataKey="mois" stroke="#475569" tick={{fontSize:11,fontWeight:600}}/>
              <YAxis stroke="#475569" tick={{fontSize:9}} tickFormatter={v=>v>=1000?(v/1000).toFixed(1)+"k":v}/>
              <Tooltip content={<Tip/>}/>
              <Area type="monotone" dataKey={chartKey} stroke={chartDef?.color||"#38bdf8"} strokeWidth={2.5} fill="url(#grad)"
                dot={(props)=>{
                  const d=yearRows[props.index];
                  if(!d?.nouveauxPacks) return <circle key={props.index} cx={props.cx} cy={props.cy} r={3} fill={chartDef?.color} stroke="none"/>;
                  return <circle key={props.index} cx={props.cx} cy={props.cy} r={7} fill="#f59e0b" stroke="#060d14" strokeWidth={2}/>;
                }}
                activeDot={{r:7,strokeWidth:0}}/>
            </AreaChart>
          ) : (
            <BarChart data={yearRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false}/>
              <XAxis dataKey="mois" stroke="#475569" tick={{fontSize:11,fontWeight:600}}/>
              <YAxis stroke="#475569" tick={{fontSize:9}} tickFormatter={v=>v>=1000?(v/1000).toFixed(1)+"k":v}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey={chartKey} radius={[4,4,0,0]} maxBarSize={40}>
                {yearRows.map((d,i)=>{
                  const ratio=maxVal===minVal?1:(d[chartKey]-minVal)/(maxVal-minVal);
                  const alpha=Math.round(80+ratio*175).toString(16).padStart(2,"0");
                  return <Cell key={i} fill={d.nouveauxPacks>0?"#f59e0b":`${chartDef?.color||"#38bdf8"}${alpha}`}/>;
                })}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
        <div style={{fontSize:10,color:"#475569",textAlign:"center",marginTop:4}}>
          ● <span style={{color:"#f59e0b"}}>Points/barres oranges</span> = mois avec achat de pack automatique
        </div>
      </div>

      {/* TABLEAU ÉDITABLE */}
      <div style={{margin:"12px 22px 24px",background:"#0f1923",border:"1px solid #1e3a5f",borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"10px 16px",background:"#0a1628",borderBottom:"1px solid #1e3a5f",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <div style={{fontSize:12,color:"#64748b",fontWeight:700}}>
            📋 20{activeYear} — <span style={{fontWeight:400}}>colonnes <span style={{color:"#a78bfa"}}>Taux</span>, <span style={{color:"#94a3b8"}}>Apport</span>, <span style={{color:"#f59e0b"}}>Ponctuel</span> éditables</span>
          </div>
          <div style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setColPicker(v=>!v)}
              style={{background:colPicker?"#1e3a5f":"#0f1923",border:"1px solid #1e3a5f",borderRadius:8,color:"#38bdf8",padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>
              ⚙ Colonnes ({visCols.length}/{ALL_COLS.length})
            </button>
            {colPicker&&(
              <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",zIndex:200,background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:10,padding:"10px 12px",minWidth:230,boxShadow:"0 8px 32px #00000090"}}>
                <div style={{fontSize:11,color:"#475569",marginBottom:8,fontWeight:700}}>Afficher / masquer</div>
                {ALL_COLS.map(col=>(
                  <label key={col.key} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 4px",cursor:"pointer",borderRadius:6}}
                    onMouseEnter={e=>e.currentTarget.style.background="#0f1923"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <input type="checkbox" checked={visCols.includes(col.key)} onChange={()=>toggleCol(col.key)}
                      style={{accentColor:col.color,width:14,height:14,cursor:"pointer"}}/>
                    <span style={{fontSize:12,color:visCols.includes(col.key)?col.color:"#475569",fontWeight:visCols.includes(col.key)?600:400}}>
                      {col.label}{EDITABLE.includes(col.key)&&<span style={{color:"#475569",fontSize:10,marginLeft:4}}>✏</span>}
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
                    {col.label}{EDITABLE.includes(col.key)&&<span style={{color:"#475569",fontSize:9,marginLeft:3}}>✏</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yearRows.map((d) => {
                const gi = d._idx; // index global dans rows[]
                return (
                  <tr key={d.mois}
                    style={{borderBottom:"1px solid #0a1220",background:d.nouveauxPacks>0?"#0d1e0d":gi%2===0?"#0a1220":"transparent",transition:"background 0.1s"}}
                    onMouseEnter={e=>e.currentTarget.style.background=d.nouveauxPacks>0?"#0f2a0f":"#0d1e30"}
                    onMouseLeave={e=>e.currentTarget.style.background=d.nouveauxPacks>0?"#0d1e0d":gi%2===0?"#0a1220":"transparent"}>
                    <td style={{padding:"7px 14px",color:d.nouveauxPacks>0?"#f59e0b":"#94a3b8",fontWeight:d.nouveauxPacks>0?800:400,whiteSpace:"nowrap"}}>
                      {d.mois}
                      {d.nouveauxPacks>0&&<span style={{marginLeft:6,background:"#f59e0b20",border:"1px solid #f59e0b40",borderRadius:5,padding:"1px 6px",fontSize:10,color:"#f59e0b"}}>🎉 +{d.nouveauxPacks}</span>}
                    </td>
                    {visDefs.map(col=>{
                      const isEditing = editCell?.idx===gi && editCell?.col===col.key;
                      const isEditable = EDITABLE.includes(col.key);
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
                        <td key={col.key}
                          onClick={()=>isEditable&&!isEditing&&startEdit(gi,col.key,rawVal)}
                          style={{padding:"5px 12px",textAlign:"right",color:col.color,cursor:isEditable?"pointer":"default",whiteSpace:"nowrap"}}>
                          {isEditing ? (
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

              {/* TOTAL ANNÉE */}
              <tr style={{borderTop:"2px solid #1e3a5f",background:"#0a1628"}}>
                <td style={{padding:"9px 14px",color:"#38bdf8",fontWeight:800}}>TOTAL 20{activeYear}</td>
                {visDefs.map(col=>{
                  const v = {
                    capital:    <b style={{color:"#38bdf8"}}>{lastOfYear?fmt(lastOfYear.capital)+" €":"—"}</b>,
                    gains:      <b style={{color:"#4ade80"}}>+{fmt(totalGainsAn)} €</b>,
                    gainsNets:  <b style={{color:"#34d399"}}>{lastOfYear?"+"+fmt(lastOfYear.gainsNets)+" €":"—"}</b>,
                    perf:       <b style={{color:lastOfYear?.perf>=100?"#f59e0b":"#4ade80"}}>{lastOfYear?fmtD(lastOfYear.perf)+"%":"—"}</b>,
                    ponctuel:   <b style={{color:"#f59e0b"}}>{totalPonctAn>0?"+"+fmt(totalPonctAn)+" €":"—"}</b>,
                    packs:      <b style={{color:"#e2e8f0"}}>{lastOfYear?.packs}</b>,
                    totalVerse: <b style={{color:"#64748b"}}>{lastOfYear?fmt(lastOfYear.totalVerse)+" €":"—"}</b>,
                    cagnotte:   <b style={{color:"#86efac"}}>{lastOfYear?fmt(lastOfYear.cagnotte)+" €":"—"}</b>,
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
