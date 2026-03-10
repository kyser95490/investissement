import { useState, useMemo } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from "recharts";
import { CAPITAL_DEPART } from "./App";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n));

function simulate(rows) {
  let cagnotte = 0;
  let capitalActif = CAPITAL_DEPART;
  let totalApports = CAPITAL_DEPART;
  return rows.map((row) => {
    const gains = Math.round(capitalActif * (row.taux / 100));
    cagnotte += gains + row.apport + row.ponctuel;
    totalApports += row.apport + row.ponctuel;
    const nouveauxPacks = Math.floor(cagnotte / 1000);
    const reste = cagnotte - nouveauxPacks * 1000;
    const nouveauCapital = capitalActif + nouveauxPacks * 1000;
    const capitalTotal = nouveauCapital + reste;
    const perf = Math.round(((capitalTotal - totalApports) / totalApports) * 1000) / 10;
    if (nouveauxPacks > 0) { cagnotte = reste; capitalActif = nouveauCapital; }
    return { mois: row.mois, capital: Math.round(capitalTotal), gains, apport: row.apport, ponctuel: row.ponctuel, taux: row.taux, packs: nouveauCapital / 1000, perf, nouveauxPacks };
  });
}

export default function ECADashboard({ rows, commit, undo, redo, reset, past, future, showToast }) {
  const [selectedIdx,  setSelectedIdx]  = useState(null);
  const [inputPonctuel,setInputPonctuel]= useState("");
  const [inputTaux,    setInputTaux]    = useState("2");
  const [editingTaux,  setEditingTaux]  = useState(false);
  const [vue,          setVue]          = useState("capital");
  const [showHistory,  setShowHistory]  = useState(false);

  const sim  = useMemo(() => simulate(rows), [rows]);
  const last = sim[sim.length - 1];
  const sel  = selectedIdx !== null ? sim[selectedIdx] : null;
  const totalPonctuels = rows.reduce((s, r) => s + r.ponctuel, 0);
  const tauxGlobal = rows[0].taux;
  const tousIdentiques = rows.every(r => r.taux === tauxGlobal);

  const applyPonctuel = (val) => {
    const v = Number(val) || 0;
    commit(rows.map((r, i) => i === selectedIdx ? { ...r, ponctuel: v } : r),
      `Ponctuel ${rows[selectedIdx].mois} : +${fmt(v)} €`);
    showToast(`⚡ +${fmt(v)} € sur ${rows[selectedIdx].mois}`);
  };

  const applyTauxGlobal = (val) => {
    const t = Math.round(Math.min(10, Math.max(0.1, Number(val))) * 10) / 10;
    if (isNaN(t)) return;
    commit(rows.map(r => ({ ...r, taux: t })), `Taux global → ${t}%`);
    setInputTaux(String(t)); setEditingTaux(false);
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
      <div style={{ background:"#0c1a2e", border:"1px solid #1e3a5f", borderRadius:10, padding:"12px 16px", fontSize:12, minWidth:190 }}>
        <div style={{ color:"#38bdf8", fontWeight:800, marginBottom:8 }}>{label}</div>
        {[["💰 Capital",fmt(d.capital)+" €","#38bdf8"],["📈 Gains","+"+fmt(d.gains)+" €","#4ade80"],["📊 Taux",d.taux+"%","#a78bfa"],["💳 Apport",fmt(d.apport)+" €","#94a3b8"],...(d.ponctuel>0?[["⚡ Ponctuel","+"+fmt(d.ponctuel)+" €","#f59e0b"]]:[])]
          .map(([l,v,c]) => <div key={l} style={{ display:"flex",justifyContent:"space-between",gap:16,marginBottom:3 }}><span style={{color:"#64748b"}}>{l}</span><b style={{color:c}}>{v}</b></div>)}
        {d.nouveauxPacks>0 && <div style={{marginTop:6,background:"#1e3a5f",borderRadius:6,padding:"3px 8px",color:"#f59e0b",fontWeight:700,textAlign:"center"}}>🎉 +{d.nouveauxPacks} pack(s) !</div>}
        <div style={{borderTop:"1px solid #1e3a5f",paddingTop:4,marginTop:6,display:"flex",justifyContent:"space-between"}}><span style={{color:"#64748b"}}>Performance</span><b style={{color:d.perf>=100?"#f59e0b":"#4ade80"}}>{d.perf}%</b></div>
      </div>
    );
  };

  const barColor = (d, i) => {
    if (vue==="gains") return selectedIdx===i?"#22c55e":"#15803d";
    if (vue==="perf")  return d.perf>=100?"#d97706":selectedIdx===i?"#22c55e":"#15803d";
    return d.nouveauxPacks>0?"#1d4ed8":selectedIdx===i?"#0ea5e9":"#1e3a5f";
  };

  const btn = { border:"none", borderRadius:8, padding:"7px 14px", cursor:"pointer", fontSize:13, fontWeight:700 };

  return (
    <div style={{ color:"#e2e8f0" }}>

      {/* HEADER VUE */}
      <div style={{ background:"linear-gradient(135deg,#0a1628,#0d2137)", borderBottom:"1px solid #1e3a5f", padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:"#38bdf8" }}>📈 Vue Mensuelle — Mar 2026 → Déc 2031</div>
          <div style={{ color:"#475569", fontSize:11, marginTop:2 }}>Cliquez sur un mois pour modifier l'apport ponctuel ou le taux · les modifications sont partagées avec la vue annuelle</div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button onClick={undo}  disabled={!past.length}   style={{...btn, background:past.length?"#1e3a5f":"#0f1923",   color:past.length?"#38bdf8":"#334155",   cursor:past.length?"pointer":"not-allowed"}}>↩ Annuler</button>
          <button onClick={redo}  disabled={!future.length} style={{...btn, background:future.length?"#1e3a5f":"#0f1923", color:future.length?"#a78bfa":"#334155", cursor:future.length?"pointer":"not-allowed"}}>↪ Rétablir</button>
          <button onClick={() => setShowHistory(v=>!v)} style={{...btn, background:showHistory?"#1e3a5f":"transparent", border:"1px solid #1e3a5f", color:"#64748b"}}>🕐 {past.length>0?`(${past.length})`:"Historique"}</button>
          <button onClick={reset} style={{...btn, background:"transparent", border:"1px solid #7f1d1d", color:"#f87171"}}>🔄 Reset</button>
        </div>
      </div>

      {/* HISTORIQUE */}
      {showHistory && (
        <div style={{ margin:"10px 20px 0", background:"#0f1923", border:"1px solid #1e3a5f", borderRadius:12, overflow:"hidden", maxHeight:200, overflowY:"auto" }}>
          <div style={{ padding:"8px 14px", background:"#0a1628", borderBottom:"1px solid #1e3a5f", fontSize:11, color:"#64748b", fontWeight:700 }}>
            🕐 {past.length} modification{past.length>1?"s":""} — cliquez pour naviguer
          </div>
          <div style={{ padding:"6px 14px", borderBottom:"1px solid #0a1220", background:"#0d2137", fontSize:12 }}>
            <span style={{ color:"#38bdf8", fontWeight:700 }}>▶ État actuel</span>
          </div>
          {[...past].reverse().map((h, ri) => {
            const realIdx = past.length - 1 - ri;
            return (
              <div key={ri} onClick={() => {
                // Navigation dans l'historique
                const kept = past.slice(0, realIdx);
                const newFuture = [...past.slice(realIdx), ...(future||[])].slice(0,49);
                commit(h.rows, h.label);
                showToast(`⏪ ${h.label}`, "#f59e0b");
                setShowHistory(false);
              }} style={{ padding:"7px 14px", borderBottom:"1px solid #0a1220", display:"flex", justifyContent:"space-between", cursor:"pointer", fontSize:12, color:"#64748b" }}
                onMouseEnter={e=>e.currentTarget.style.background="#0d1e30"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span>{h.label}</span><span style={{color:"#334155"}}>{h.date}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, padding:"14px 20px 0" }}>
        {[
          {icon:"💰",label:"Capital final",     value:fmt(last.capital)+" €",  color:"#38bdf8"},
          {icon:"📈",label:"Gains / mois",      value:fmt(last.gains)+" €",    color:"#4ade80"},
          {icon:"🎯",label:"Performance",       value:last.perf+"%",           color:last.perf>=100?"#f59e0b":"#4ade80"},
          {icon:"⚡",label:"Apports ponctuels", value:fmt(totalPonctuels)+" €",color:"#f59e0b"},
        ].map(k => (
          <div key={k.label} style={{background:"#0f1923",border:"1px solid #1e3a5f",borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:22}}>{k.icon}</div>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:k.color}}>{k.value}</div>
              <div style={{fontSize:11,color:"#64748b"}}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* TAUX + VUE */}
      <div style={{ display:"flex", gap:10, padding:"12px 20px", flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ background:"#0f1923", border:"1px solid #1e3a5f", borderRadius:10, padding:"10px 16px", display:"flex", alignItems:"center", gap:12, flex:1, minWidth:280 }}>
          <span style={{color:"#64748b",fontSize:12,whiteSpace:"nowrap"}}>📊 Taux global :</span>
          <input type="range" min="0.5" max="10" step="0.5" value={tousIdentiques?tauxGlobal:2}
            onChange={e=>{const t=Number(e.target.value);commit(rows.map(r=>({...r,taux:t})),`Taux global → ${t}%`);setInputTaux(String(t));}}
            style={{flex:1,accentColor:"#38bdf8",cursor:"pointer"}}/>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            {editingTaux ? (
              <input autoFocus type="number" min="0.1" max="10" step="0.1" defaultValue={tousIdentiques?tauxGlobal:""}
                onBlur={e=>applyTauxGlobal(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")applyTauxGlobal(e.target.value);if(e.key==="Escape")setEditingTaux(false);}}
                style={{width:55,background:"#060d14",border:"1px solid #38bdf8",borderRadius:8,color:"#38bdf8",padding:"5px 8px",fontSize:15,fontWeight:800,textAlign:"center",outline:"none"}}/>
            ) : (
              <span onClick={()=>setEditingTaux(true)} title="Cliquez pour saisir"
                style={{color:"#38bdf8",fontWeight:800,fontSize:16,minWidth:42,cursor:"pointer",background:"#060d14",border:"1px solid #1e3a5f",borderRadius:8,padding:"5px 8px",textAlign:"center"}}>
                {tousIdentiques?tauxGlobal:"~"}%
              </span>
            )}
          </div>
          {!tousIdentiques && <span style={{fontSize:10,color:"#f59e0b",whiteSpace:"nowrap"}}>⚠ Taux mixtes</span>}
        </div>
        <div style={{background:"#0f1923",border:"1px solid #1e3a5f",borderRadius:10,padding:"4px",display:"flex"}}>
          {[["capital","💰 Capital"],["gains","📈 Gains"],["perf","🎯 Perf."]].map(([id,lbl])=>(
            <button key={id} onClick={()=>setVue(id)}
              style={{...btn,background:vue===id?"#1e3a5f":"transparent",color:vue===id?"#38bdf8":"#64748b",padding:"7px 14px"}}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* GRAPHIQUE */}
      <div style={{margin:"0 20px",background:"#0f1923",border:"1px solid #1e3a5f",borderRadius:12,padding:"16px 12px 8px"}}>
        <div style={{marginBottom:6,fontSize:11,color:"#64748b"}}>
          <b style={{color:"#94a3b8",fontSize:12}}>{vue==="capital"?"Capital mois par mois":vue==="gains"?"Gains générés chaque mois":"Performance globale (%)"}</b>
          {"  ·  "}<span style={{color:"#3b82f6"}}>■</span> nouveau pack{"  "}<span style={{color:"#f59e0b"}}>■</span> apport ponctuel
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={sim} onClick={e=>e?.activeTooltipIndex!==undefined&&setSelectedIdx(e.activeTooltipIndex)}>
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

      {/* PANNEAU MOIS SÉLECTIONNÉ */}
      {sel && (
        <div style={{margin:"12px 20px",background:"#0d2137",border:"2px solid #38bdf8",borderRadius:12,padding:"16px 20px",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:"#38bdf8",marginBottom:10}}>📅 {sel.mois}</div>
            <div style={{display:"grid",gridTemplateColumns:"auto auto",gap:"5px 20px",fontSize:12}}>
              {[["💰 Capital",fmt(sel.capital)+" €","#38bdf8"],["📈 Gains","+"+fmt(sel.gains)+" €","#4ade80"],["📊 Taux",sel.taux+"%","#a78bfa"],["🎯 Perf.",sel.perf+"%",sel.perf>=100?"#f59e0b":"#4ade80"],["📦 Packs",sel.packs,"#94a3b8"],["⚡ Ponctuel",sel.ponctuel>0?"+"+fmt(sel.ponctuel)+" €":"Aucun",sel.ponctuel>0?"#f59e0b":"#475569"]]
                .map(([l,v,c])=><span key={l} style={{display:"contents"}}><span style={{color:"#64748b"}}>{l} :</span><b style={{color:c}}>{v}</b></span>)}
            </div>
            {sel.nouveauxPacks>0&&<div style={{marginTop:8,background:"#1e3a5f",borderRadius:6,padding:"4px 10px",color:"#f59e0b",fontWeight:700,fontSize:12,display:"inline-block"}}>🎉 +{sel.nouveauxPacks} pack(s) !</div>}
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            {/* Apport ponctuel */}
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
                <input type="number" min="0.1" max="10" step="0.1" defaultValue={rows[selectedIdx]?.taux} key={selectedIdx}
                  onKeyDown={e=>e.key==="Enter"&&applyTauxMois(selectedIdx,e.target.value)}
                  onBlur={e=>{if(e.target.value!==String(rows[selectedIdx]?.taux))applyTauxMois(selectedIdx,e.target.value);}}
                  style={{flex:1,background:"#0f1923",border:"1px solid #a78bfa",borderRadius:8,color:"#a78bfa",padding:"8px 10px",fontSize:14,fontWeight:700,outline:"none"}}/>
                <span style={{color:"#a78bfa",fontWeight:800}}>%</span>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:6}}>
                {[1,1.5,2,2.5,3].map(v=>(
                  <button key={v} onClick={()=>applyTauxMois(selectedIdx,v)}
                    style={{background:rows[selectedIdx]?.taux===v?"#312e81":"#1e3a5f",border:"1px solid #3730a3",borderRadius:6,color:"#a78bfa",padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:700}}>
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
          📋 Tableau mensuel — <span style={{fontWeight:400}}>cliquez sur une ligne pour modifier · 🔵 = nouveau pack</span>
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
                <tr key={d.mois} onClick={()=>{setSelectedIdx(i);setInputPonctuel(rows[i].ponctuel>0?String(rows[i].ponctuel):"");}}
                  style={{borderBottom:"1px solid #0a1220",cursor:"pointer",background:selectedIdx===i?"#0d2137":i%2===0?"#0a1220":"transparent"}}
                  onMouseEnter={e=>{if(selectedIdx!==i)e.currentTarget.style.background="#0d1e30";}}
                  onMouseLeave={e=>{if(selectedIdx!==i)e.currentTarget.style.background=i%2===0?"#0a1220":"transparent";}}>
                  <td style={{padding:"6px 12px",color:selectedIdx===i?"#38bdf8":"#94a3b8",fontWeight:selectedIdx===i?700:400,whiteSpace:"nowrap"}}>
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
