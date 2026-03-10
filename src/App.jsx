import { useState, useEffect, useCallback } from "react"
import {
  TEAL, AMBER, RED,
  BG, SURFACE_1, SURFACE_2, BORDER,
  TEXT, TEXT_DIM, TEXT_FAINT,
  statusColor, SENTIMENT,
  FONT_SANS, FONT_MONO,
} from "./theme"
import { MODELS } from "./data/models"
import { VREF } from "./data/vref"
import { ADJUSTMENTS, DEFAULT_ADJS } from "./data/adjustments"
import { formatMoney, formatNumber, vrefLookup } from "./utils"

export default function App() {
  const [model, setModel] = useState("G280")
  const [modelInput, setModelInput] = useState("G280")
  const [showDrop, setShowDrop] = useState(false)
  const [aircraft, setAircraft] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dbg, setDbg] = useState(null)
  const [selected, setSelected] = useState([])
  const [tab, setTab] = useState("comparison")
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [sentiment, setSentiment] = useState("neutral")
  const [vrefOvr, setVrefOvr] = useState({})
  const [vrefFilter, setVrefFilter] = useState("")
  const [editCell, setEditCell] = useState(null)
  const [editVal, setEditVal] = useState("")
  const [now, setNow] = useState(new Date())
  const [valAC, setValAC] = useState(null)
  const [vref, setVref] = useState("")
  const [adjs, setAdjs] = useState({ ...DEFAULT_ADJS })
  const [useM, setUseM] = useState(true)

  useEffect(() => {
    try { const s = localStorage.getItem("emc-v6"); if (s) setVrefOvr(JSON.parse(s)) } catch (e) {}
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const loadModel = useCallback(async (mdl) => {
    const info = MODELS[mdl]; if (!info) return
    setLoading(true); setError(null); setDbg(null); setAircraft([])
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          system: `You are a Monday.com data agent. Call get_board_items_page with boardId=${info.b}, includeColumns=true, limit=500. Return ONLY a raw JSON array. No markdown, no backticks, no text. Start with [ end with ]. Each item: {"sn":"<name>","year":"<text_mkr4dfxv or text_mkrvqp10>","reg":"<text_mknyb7mw>","status":"<color_mkny5szn label>","country":"<country_mkqpm9an>","aftt":<aftt_mkms9wnq>,"landings":<landings_mkmswqc6>,"ask":<numbers3>,"sold":<numeric_mkq21mk1>,"eng":"<eng_prog_mkmrv5f3>","avionics":"<dropdown_mkqpmryr>","insp36":"<36_month_inspection_mkmrvryb>","listDate":"<date4>","saleDate":"<date_mkrm73dv or date_mkr5v5r7>","pax":<numbers4>,"wifi":"<dropdown_mkqp3zhk>"} Status values: "For Sale","Under Contract","Recently Sold","Not for Sale". Use 0 for missing numbers, "" for missing strings.`,
          messages: [{ role: "user", content: `Fetch board ${info.b} for ${mdl}. JSON array only.` }],
          mcp_servers: [{ type: "url", url: "https://mcp.monday.com/mcp", name: "monday" }]
        })
      })
      if (!res.ok) { const t = await res.text(); setDbg({ status: res.status, body: t.slice(0, 800) }); throw new Error(`HTTP ${res.status}`) }
      const d = await res.json()
      if (d.error) throw new Error(d.error.message || JSON.stringify(d.error))
      const allText = (d.content || []).map(b => b.type === "text" ? b.text : b.type === "mcp_tool_result" ? (b.content || []).map(c => c.text || "").join("") : "").join("\n")
      setDbg({ stop: d.stop_reason, types: (d.content || []).map(b => b.type), preview: allText.slice(0, 500) })
      const m = allText.match(/\[[\s\S]*\]/)
      if (!m) throw new Error(`No JSON array. Preview: ${allText.slice(0, 200)}`)
      const parsed = JSON.parse(m[0])
      if (!Array.isArray(parsed)) throw new Error("Not an array")
      setAircraft(parsed)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { if (model) { loadModel(model); setSelected([]) } }, [model])

  const toggleSel = sn => setSelected(p => p.includes(sn) ? p.filter(x => x !== sn) : p.length >= 4 ? p : [...p, sn])
  const selectForVal = ac => {
    const v = vrefLookup(model, ac.year); setValAC(ac); if (v) setVref(String(v))
    setAdjs({
      engineProgram: ac.eng && ac.eng !== "0" && ac.eng !== "None" ? 0.5 : -1,
      inspection: 0, avionics: ac.avionics && ac.avionics !== "None" ? 0.3 : 0,
      interior: 0, exterior: 0, damage: 0, pedigree: 0,
    })
    setTab("valuation")
  }
  const saveVref = d => { try { localStorage.setItem("emc-v6", JSON.stringify(d)) } catch (e) {} }
  const doEdit = (m, y, v) => { const n = parseFloat(v); const u = { ...vrefOvr, [m]: { ...(vrefOvr[m] || {}), [y]: isNaN(n) ? undefined : n } }; if (isNaN(n)) delete u[m][y]; setVrefOvr(u); saveVref(u) }
  const vMrg = m => ({ ...(VREF[m] || {}), ...(vrefOvr[m] || {}) })
  const sentM = SENTIMENT[sentiment] || 1
  const base = parseFloat(vref) || 0, eb = useM ? (base * 0.98 * sentM) : (base * sentM)
  const tot = Object.values(adjs).reduce((s, x) => s + (parseFloat(x) || 0), 0)
  const emc = parseFloat((eb + tot).toFixed(3))
  const forSale = aircraft.filter(a => a.status === "For Sale")
  const ucAC = aircraft.filter(a => a.status === "Under Contract")
  const soldAC = aircraft.filter(a => a.status === "Recently Sold")
  const avgSold = soldAC.length ? soldAC.reduce((s, a) => s + (a.sold || 0), 0) / soldAC.length : 0
  const avgAsk = forSale.length ? forSale.reduce((s, a) => s + (a.ask || 0), 0) / forSale.length : 0
  const filtered = aircraft.filter(ac => {
    if (filter === "forSale" && ac.status !== "For Sale") return false
    if (filter === "sold" && ac.status !== "Recently Sold" && ac.status !== "Under Contract") return false
    if (search) { const q = search.toUpperCase(); if (!ac.reg?.toUpperCase().includes(q) && !ac.sn?.toUpperCase().includes(q)) return false }
    return true
  })
  const selectedAC = selected.map(sn => aircraft.find(a => a.sn === sn)).filter(Boolean)
  const tickerAC = aircraft.filter(a => a.ask > 0 || a.sold > 0)
  const dropModels = modelInput ? Object.keys(MODELS).filter(m => m.toLowerCase().includes(modelInput.toLowerCase())) : Object.keys(MODELS)

  return (
    <div style={{ fontFamily: FONT_SANS, background: BG, color: TEXT, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", fontSize: 13 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:${BG}}::-webkit-scrollbar-thumb{background:#282828}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:.2}50%{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
        .ri:hover{background:rgba(0,194,168,.07)!important;cursor:pointer}.ri.sel{background:rgba(0,194,168,.1)!important}
        .mo:hover{background:rgba(0,194,168,.12)!important;color:${TEAL}!important}
        .tb:hover{color:${TEXT}!important}.fb:hover{color:${TEXT}!important}
        .sb:hover{border-color:${TEAL}!important;color:${TEAL}!important}
        .vc:hover{background:rgba(0,194,168,.06)!important;cursor:pointer}
        .yb:hover{border-color:${TEAL}!important;color:${TEAL}!important}
        .rb:hover{border-color:${TEAL}!important;color:${TEAL}!important}
        input:focus{outline:none;border-color:${TEAL}!important}
      `}</style>

      {/* TICKER */}
      <div style={{ height: 26, background: "#050505", borderBottom: `1px solid ${BORDER}`, overflow: "hidden", flexShrink: 0, position: "relative", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 40, height: "100%", background: `linear-gradient(90deg,#050505,transparent)`, zIndex: 2, pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 0, top: 0, width: 40, height: "100%", background: `linear-gradient(270deg,#050505,transparent)`, zIndex: 2, pointerEvents: "none" }} />
        {tickerAC.length > 0
          ? <div style={{ display: "flex", whiteSpace: "nowrap", animation: `ticker ${Math.max(20, tickerAC.length * 2)}s linear infinite`, height: "100%", alignItems: "center", width: "max-content" }}>
            {[...tickerAC, ...tickerAC].map((ac, i) => {
              const price = ac.status === "For Sale" ? ac.ask : ac.sold
              return <span key={i} style={{ padding: "0 16px", borderRight: `1px solid ${BORDER}`, fontSize: 11, fontFamily: FONT_MONO, display: "flex", alignItems: "center", gap: 7, height: "100%" }}>
                <span style={{ color: statusColor(ac.status), fontWeight: 600 }}>{ac.reg || ac.sn}</span>
                <span style={{ color: TEXT_DIM, fontSize: 10 }}>{ac.year}</span>
                <span style={{ color: TEXT, fontWeight: 600 }}>{formatMoney(price, 2)}</span>
              </span>
            })}
          </div>
          : <div style={{ width: "100%", textAlign: "center", fontSize: 10, color: TEXT_DIM, letterSpacing: 2, fontFamily: FONT_MONO }}>
            {loading ? `LOADING ${model}…` : error ? "⚠ ERROR — SEE SIDEBAR" : "EMCJET VALUATION TERMINAL · SELECT A MODEL"}
          </div>
        }
      </div>

      {/* HEADER */}
      <div style={{ height: 46, background: SURFACE_1, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "stretch", flexShrink: 0 }}>
        <div style={{ padding: "0 16px", borderRight: `1px solid ${BORDER}`, display: "flex", alignItems: "center", minWidth: 120 }}>
          <div><div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 4, color: TEXT }}>EMCJET</div><div style={{ fontSize: 7, color: TEXT_DIM, letterSpacing: 2, marginTop: 1 }}>VALUATION TERMINAL</div></div>
        </div>
        <div style={{ padding: "0 12px", borderRight: `1px solid ${BORDER}`, display: "flex", alignItems: "center", position: "relative" }}>
          <input value={modelInput} onChange={e => { setModelInput(e.target.value); setShowDrop(true) }} onFocus={() => setShowDrop(true)} onBlur={() => setTimeout(() => setShowDrop(false), 160)}
            onKeyDown={e => { if (e.key === "Enter" && dropModels.length) { setModel(dropModels[0]); setModelInput(dropModels[0]); setShowDrop(false) } }}
            placeholder="Model…" style={{ background: "rgba(255,255,255,.04)", border: `1px solid ${BORDER}`, borderRadius: 3, padding: "5px 10px", color: TEXT, fontSize: 14, fontWeight: 700, width: 128, fontFamily: "inherit" }} />
          {showDrop && dropModels.length > 0 && <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 12, background: "#0D0D0D", border: `1px solid ${BORDER}`, borderRadius: 4, zIndex: 99, maxHeight: 260, overflowY: "auto", minWidth: 165, boxShadow: "0 10px 28px rgba(0,0,0,.9)" }}>
            {dropModels.slice(0, 30).map(m => <div key={m} className="mo" onMouseDown={() => { setModel(m); setModelInput(m); setShowDrop(false) }}
              style={{ padding: "7px 12px", cursor: "pointer", fontSize: 11.5, color: TEXT_DIM, borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", transition: "all .1s" }}>
              <span style={{ color: TEXT, fontWeight: 600 }}>{m}</span><span style={{ fontSize: 9.5, color: TEXT_DIM }}>{MODELS[m].m}</span>
            </div>)}
          </div>}
        </div>
        {aircraft.length > 0 && [["FOR SALE", forSale.length, TEAL], ["CONTRACT", ucAC.length, AMBER], ["SOLD", soldAC.length, RED], ["FLEET", aircraft.length, TEXT_DIM], ["COMPARING", selected.length, selected.length > 0 ? TEAL : TEXT_DIM]].map(([l, v, c]) =>
          <div key={l} style={{ padding: "0 11px", borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center", minWidth: 68 }}>
            <div style={{ fontSize: 7, color: TEXT_DIM, letterSpacing: 1.5, marginBottom: 2 }}>{l}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: c, fontFamily: FONT_MONO }}>{v}</div>
          </div>
        )}
        {avgSold > 0 && <div style={{ padding: "0 11px", borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
          <div style={{ fontSize: 7, color: TEXT_DIM, letterSpacing: 1.5, marginBottom: 2 }}>AVG SOLD</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: RED, fontFamily: FONT_MONO }}>{formatMoney(avgSold)}</div>
        </div>}
        {avgAsk > 0 && <div style={{ padding: "0 11px", borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
          <div style={{ fontSize: 7, color: TEXT_DIM, letterSpacing: 1.5, marginBottom: 2 }}>AVG ASK</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEAL, fontFamily: FONT_MONO }}>{formatMoney(avgAsk)}</div>
        </div>}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3, padding: "0 12px", borderLeft: `1px solid ${BORDER}` }}>
          {[["SOFT", "-3%", "soft"], ["NEUTRAL", "", "neutral"], ["FIRM", "+3%", "firm"]].map(([l, s, k]) =>
            <button key={k} className="sb" onClick={() => setSentiment(k)}
              style={{ padding: "3px 8px", background: sentiment === k ? "rgba(0,194,168,.1)" : "transparent", border: `1px solid ${sentiment === k ? TEAL : BORDER}`, borderRadius: 3, color: sentiment === k ? TEAL : TEXT_DIM, fontSize: 9, cursor: "pointer", fontFamily: "inherit", transition: "all .12s", letterSpacing: .5 }}>
              {l}{s ? ` ${s}` : ""}
            </button>
          )}
        </div>
        <div style={{ padding: "0 11px", borderLeft: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "right" }}>
          <div style={{ fontSize: 7.5, color: TEXT_DIM }}>{now.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}</div>
          <div style={{ fontSize: 11, color: TEXT, fontFamily: FONT_MONO }}>{now.toLocaleTimeString("en-US", { hour12: false })}</div>
        </div>
        <div style={{ padding: "0 10px", borderLeft: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 5 }}>
          {loading ? <div style={{ width: 7, height: 7, border: `1.5px solid ${TEAL}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .5s linear infinite" }} />
            : <div style={{ width: 6, height: 6, borderRadius: "50%", background: aircraft.length ? TEAL : TEXT_DIM, animation: aircraft.length ? "pulse 2.5s infinite" : "none" }} />}
          <span style={{ fontSize: 7.5, color: TEXT_DIM, letterSpacing: 1 }}>{loading ? "LOADING" : aircraft.length ? "LIVE" : "IDLE"}</span>
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: "#090909", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "stretch", height: 33, flexShrink: 0 }}>
        {[["comparison", "COMPARISON"], ["valuation", "VALUATION"], ["vrefdb", "VREF DATABASE"]].map(([k, l]) =>
          <button key={k} className="tb" onClick={() => setTab(k)}
            style={{ padding: "0 18px", background: "transparent", border: "none", borderBottom: tab === k ? `2px solid ${TEAL}` : "2px solid transparent", color: tab === k ? TEAL : TEXT_DIM, fontSize: 9.5, letterSpacing: 1.5, cursor: "pointer", fontFamily: "inherit", transition: "all .12s", fontWeight: tab === k ? 600 : 400, display: "flex", alignItems: "center", gap: 5 }}>
            {l}{k === "comparison" && selected.length > 0 && <span style={{ background: TEAL, color: "#000", borderRadius: 9, padding: "1px 5px", fontSize: 8, fontWeight: 700 }}>{selected.length}</span>}
          </button>
        )}
        <div style={{ marginLeft: "auto", padding: "0 13px", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 8, color: TEXT_FAINT, letterSpacing: 1 }}>MONDAY.COM RESEARCH</span>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: aircraft.length ? TEAL : TEXT_FAINT, animation: "pulse 2s infinite" }} />
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* SIDEBAR */}
        <div style={{ width: 238, background: SURFACE_1, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "9px 11px 7px", flexShrink: 0 }}>
            <div style={{ fontSize: 7.5, color: TEXT_DIM, letterSpacing: 2.5, marginBottom: 6, fontWeight: 600 }}>WATCHLIST</div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tail or S/N…"
              style={{ width: "100%", background: "rgba(255,255,255,.03)", border: `1px solid ${BORDER}`, borderRadius: 3, padding: "5px 9px", color: TEXT, fontSize: 11, fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            {[["all", "ALL"], ["forSale", "FOR SALE"], ["sold", "SOLD"]].map(([k, l]) =>
              <button key={k} className="fb" onClick={() => setFilter(k)}
                style={{ flex: 1, padding: "6px 0", background: "transparent", border: "none", borderBottom: filter === k ? `2px solid ${TEAL}` : "2px solid transparent", color: filter === k ? TEAL : TEXT_DIM, fontSize: 8, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1, transition: "all .1s", fontWeight: filter === k ? 600 : 400 }}>
                {l}
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading && !aircraft.length && <div style={{ padding: "18px 12px", color: TEXT_DIM, fontSize: 10.5, textAlign: "center" }}>Loading {model}…</div>}
            {!loading && error && <div style={{ padding: "10px" }}>
              <div style={{ color: RED, fontSize: 10.5, marginBottom: 6, lineHeight: 1.5 }}>⚠ {error}</div>
              {dbg && <details style={{ marginBottom: 6 }}><summary style={{ fontSize: 9, color: TEXT_DIM, cursor: "pointer", marginBottom: 3 }}>Debug ▾</summary>
                <pre style={{ fontSize: 8, color: TEXT_DIM, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-all", background: "#0A0A0A", padding: 6, borderRadius: 3, maxHeight: 180, overflow: "auto" }}>{JSON.stringify(dbg, null, 2)}</pre>
              </details>}
              <button className="rb" onClick={() => loadModel(model)} style={{ width: "100%", padding: "6px", border: `1px solid ${BORDER}`, background: "transparent", color: TEXT_DIM, fontSize: 10, cursor: "pointer", borderRadius: 3, fontFamily: "inherit", transition: "all .12s" }}>↻ Retry</button>
            </div>}
            {[{ label: "FOR SALE", items: filtered.filter(a => a.status === "For Sale"), c: TEAL }, { label: "PENDING", items: filtered.filter(a => a.status === "Under Contract"), c: AMBER }, { label: "RECENTLY SOLD", items: filtered.filter(a => a.status === "Recently Sold"), c: RED }, { label: "NOT ACTIVE", items: filtered.filter(a => a.status === "Not for Sale" || !a.status), c: TEXT_FAINT }].filter(g => g.items.length > 0).map(g => (
              <div key={g.label}>
                <div style={{ padding: "6px 11px 3px", fontSize: 7, color: g.c, letterSpacing: 2.5, fontWeight: 600, borderTop: `1px solid ${BORDER}`, opacity: .7 }}>{g.label}</div>
                {g.items.map(ac => {
                  const isSel = selected.includes(ac.sn), price = ac.ask > 0 ? ac.ask : ac.sold > 0 ? ac.sold : 0
                  return <div key={ac.sn} className={`ri${isSel ? " sel" : ""}`} onClick={() => toggleSel(ac.sn)} onDoubleClick={() => selectForVal(ac)}
                    style={{ display: "flex", alignItems: "center", padding: "7px 11px", borderBottom: `1px solid ${BORDER}`, gap: 8, transition: "background .1s" }}>
                    <div style={{ width: 13, height: 13, border: `1.5px solid ${isSel ? TEAL : TEXT_FAINT}`, borderRadius: 2, background: isSel ? TEAL : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .12s" }}>
                      {isSel && <svg width="7" height="5" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, lineHeight: 1.2 }}>{ac.reg || ac.sn}</div>
                      <div style={{ fontSize: 8.5, color: TEXT_DIM, marginTop: 1.5 }}>S/N {ac.sn}{ac.year ? ` · ${ac.year}` : ""}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor(ac.status) }} />
                      {price > 0 && <div style={{ fontSize: 8.5, color: TEXT_DIM, fontFamily: FONT_MONO }}>{formatMoney(price, 1)}</div>}
                    </div>
                  </div>
                })}
              </div>
            ))}
            {!loading && !error && aircraft.length === 0 && <div style={{ padding: "20px 14px", textAlign: "center", color: TEXT_DIM, fontSize: 10.5, lineHeight: 2 }}>No data yet</div>}
          </div>
          <div style={{ padding: "5px 11px", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", fontSize: 9, color: TEXT_DIM, flexShrink: 0 }}>
            <span>{aircraft.length} aircraft</span>
            {selected.length > 0 && <span style={{ color: TEAL, cursor: "pointer" }} onClick={() => setSelected([])}>{selected.length} selected · clear</span>}
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {tab === "comparison" && <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {selectedAC.length > 0 && <div style={{ padding: "7px 14px", borderBottom: `1px solid ${BORDER}`, display: "flex", gap: 6, flexWrap: "wrap", background: "#0A0A0A", flexShrink: 0, alignItems: "center" }}>
              {selectedAC.map(ac => <div key={ac.sn} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 10px", border: `1px solid ${BORDER}`, borderRadius: 20, fontSize: 11 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor(ac.status) }} />
                <span style={{ fontWeight: 600 }}>{ac.reg || ac.sn}</span><span style={{ color: TEXT_DIM }}>·</span>
                <span style={{ color: TEXT_DIM }}>{ac.year}</span><span style={{ color: TEXT_DIM }}>·</span>
                <span style={{ color: statusColor(ac.status), fontSize: 9 }}>{ac.status}</span>
                <button onClick={() => toggleSel(ac.sn)} style={{ background: "none", border: "none", color: TEXT_DIM, cursor: "pointer", fontSize: 13, lineHeight: 1, padding: 0, opacity: .4, marginLeft: 1 }}>×</button>
              </div>)}
              {selected.length < 4 && <span style={{ fontSize: 10, color: TEXT_FAINT }}>+ click watchlist to add</span>}
            </div>}
            {selectedAC.length === 0
              ? <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 38, opacity: .07 }}>✈</div>
                <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: .3 }}>SELECT AIRCRAFT TO COMPARE</div>
                <div style={{ fontSize: 11.5, color: TEXT_DIM, textAlign: "center", lineHeight: 2.3 }}>Choose up to 4 from the watchlist<br /><span style={{ color: TEXT_FAINT }}>Click to select · Double-click to valuate</span></div>
              </div>
              : <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", padding: 14 }}>
                <div style={{ display: "flex", gap: 11, minWidth: "max-content", alignItems: "flex-start" }}>
                  {selectedAC.map(ac => {
                    const vr = vrefLookup(model, ac.year) || 0, price = ac.status === "For Sale" ? ac.ask : ac.sold
                    const pct = vr && price > 0 ? ((price - vr) / vr * 100).toFixed(1) : null
                    return <div key={ac.sn} style={{ background: SURFACE_2, border: `1px solid ${BORDER}`, borderTop: `2px solid ${TEAL}`, borderRadius: 4, padding: 12, width: 222, animation: "fadeUp .2s ease", flexShrink: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>{ac.reg || ac.sn}</div>
                          <div style={{ fontSize: 9.5, color: TEXT_DIM, marginTop: 2 }}>{model} · {ac.year || "—"}</div>
                          <div style={{ fontSize: 8, color: TEXT_FAINT, marginTop: 1 }}>SN {ac.sn}</div>
                        </div>
                        <button onClick={() => toggleSel(ac.sn)} style={{ background: "none", border: "none", color: TEXT_DIM, cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
                      </div>
                      <div style={{ fontSize: 8, color: statusColor(ac.status), fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>{ac.status?.toUpperCase()}</div>
                      {price > 0 && <div style={{ padding: "8px", background: BG, borderRadius: 3, marginBottom: 8, textAlign: "center", border: `1px solid ${BORDER}` }}>
                        <div style={{ fontSize: 7, color: TEXT_DIM, letterSpacing: 1.5, marginBottom: 2 }}>{ac.status === "For Sale" ? "ASKING" : "SOLD FOR"}</div>
                        <div style={{ fontSize: 21, fontWeight: 800, color: statusColor(ac.status), fontFamily: FONT_MONO }}>{formatMoney(price)}</div>
                        {pct && <div style={{ fontSize: 9, color: parseFloat(pct) > 0 ? RED : TEAL, marginTop: 2, fontWeight: 600 }}>{parseFloat(pct) > 0 ? "+" : ""}{pct}% vs VREF</div>}
                      </div>}
                      {[["AFTT", formatNumber(ac.aftt)], ["LANDINGS", formatNumber(ac.landings)], ["ENGINE PROG", ac.eng && ac.eng !== "0" && ac.eng !== "None" ? ac.eng : "—"], ["AVIONICS", ac.avionics || "—"], ["36-MO", ac.insp36 || "—"], ["PAX", ac.pax > 0 ? ac.pax : "—"], ["WIFI", ac.wifi === "Y" ? "✓" : "—"], ["COUNTRY", ac.country || "—"]].map(([l, v]) =>
                        <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "3.5px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 10 }}>
                          <span style={{ color: TEXT_DIM }}>{l}</span>
                          <span style={{ color: l === "ENGINE PROG" && v !== "—" ? TEAL : l === "WIFI" && v !== "—" ? TEAL : TEXT, fontWeight: l === "ENGINE PROG" && v !== "—" ? 700 : 400 }}>{v}</span>
                        </div>
                      )}
                      {vr > 0 && <div style={{ marginTop: 8, padding: "7px", background: BG, borderRadius: 3, textAlign: "center", border: `1px solid ${BORDER}` }}>
                        <div style={{ fontSize: 7, color: TEXT_DIM, letterSpacing: 1, marginBottom: 2 }}>VREF {ac.year}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_DIM, fontFamily: FONT_MONO }}>{formatMoney(vr)}</div>
                      </div>}
                      <button onClick={() => selectForVal(ac)} style={{ marginTop: 8, width: "100%", padding: "6px", background: "rgba(0,194,168,.07)", border: `1px solid ${TEAL}`, borderRadius: 3, color: TEAL, fontSize: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, letterSpacing: .5 }}>Valuate →</button>
                    </div>
                  })}
                  {selected.length < 4 && <div style={{ width: 150, minHeight: 160, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 5, border: `1px dashed ${BORDER}`, borderRadius: 4, color: TEXT_FAINT, fontSize: 10, flexShrink: 0 }}>
                    <div style={{ fontSize: 22, opacity: .3 }}>+</div><div>Add position</div>
                  </div>}
                </div>
              </div>
            }
          </div>}

          {tab === "valuation" && <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div style={{ width: 286, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
              <div style={{ padding: "8px 12px", borderBottom: `1px solid ${BORDER}`, background: "#090909", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 9, color: TEXT_DIM, letterSpacing: 1, fontWeight: 600 }}>VALUATION INPUTS</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => setUseM(!useM)}>
                  <div style={{ width: 26, height: 14, borderRadius: 7, background: useM ? TEAL : BORDER, position: "relative", transition: "background .15s", flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: useM ? 14 : 2, transition: "left .15s" }} />
                  </div>
                  <span style={{ fontSize: 9, color: useM ? TEAL : TEXT_DIM }}>×0.98 EMC</span>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
                {valAC && <div style={{ padding: "6px 9px", background: "rgba(0,194,168,.04)", border: `1px solid rgba(0,194,168,.2)`, borderRadius: 3, marginBottom: 10 }}>
                  <div style={{ color: TEAL, fontWeight: 700, fontSize: 11, marginBottom: 2 }}>⚡ {valAC.reg || valAC.sn}</div>
                  <div style={{ color: TEXT_DIM, fontSize: 10 }}>{model} · {valAC.year || "—"}{valAC.aftt > 0 ? ` · ${formatNumber(valAC.aftt)} AFTT` : ""}</div>
                  <button onClick={() => setValAC(null)} style={{ fontSize: 9, color: TEXT_DIM, background: "none", border: "none", cursor: "pointer", marginTop: 3, padding: 0, fontFamily: "inherit" }}>Clear ×</button>
                </div>}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: TEXT_DIM, marginBottom: 5, fontWeight: 600 }}>VREF BASE VALUE ($M)</div>
                  <input value={vref} onChange={e => setVref(e.target.value)} type="number" step="0.1" placeholder="0.00"
                    style={{ width: "100%", background: "transparent", border: `1px solid ${BORDER}`, borderLeft: `3px solid ${TEAL}`, borderRadius: 2, padding: "7px 10px", color: TEAL, fontSize: 20, fontWeight: 800, fontFamily: FONT_MONO }} />
                  {useM && base > 0 && <div style={{ fontSize: 9, color: TEXT_DIM, marginTop: 3 }}>EMC base: {formatMoney(eb)}{sentiment !== "neutral" ? ` · ${sentiment}` : ""}</div>}
                </div>
                {model && VREF[model] && <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: TEXT_DIM, marginBottom: 4, fontWeight: 600 }}>QUICK-LOAD BY YEAR</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {Object.entries(vMrg(model)).sort(([a], [b]) => +a - (+b)).map(([yr, v]) =>
                      <button key={yr} className="yb" onClick={() => setVref(String(v))}
                        style={{ padding: "2px 6px", border: `1px solid ${parseFloat(vref) === v ? TEAL : BORDER}`, borderRadius: 2, background: parseFloat(vref) === v ? "rgba(0,194,168,.1)" : "transparent", color: parseFloat(vref) === v ? TEAL : TEXT_DIM, fontSize: 9, cursor: "pointer", fontFamily: "inherit", transition: "all .1s" }}>
                        {yr}: {formatMoney(v, 1)}
                      </button>
                    )}
                  </div>
                </div>}
                <div>
                  <div style={{ fontSize: 9, color: TEXT_DIM, marginBottom: 5, fontWeight: 600 }}>ADJUSTMENTS ($M)</div>
                  {ADJUSTMENTS.map(({ k, l, h }) => {
                    const v = parseFloat(adjs[k]) || 0
                    return <div key={k} title={h} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: `1px solid ${BORDER}` }}>
                      <span style={{ fontSize: 10, color: TEXT_DIM, flex: 1 }}>{l}</span>
                      <input value={adjs[k]} onChange={e => setAdjs(p => ({ ...p, [k]: e.target.value }))} type="number" step="0.05"
                        style={{ width: 68, background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 2, padding: "2px 5px", color: v > 0 ? TEAL : v < 0 ? RED : TEXT, fontSize: 11, fontFamily: FONT_MONO, textAlign: "right" }} />
                    </div>
                  })}
                </div>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 34 }}>
              {base > 0
                ? <div style={{ width: "100%", maxWidth: 390, animation: "fadeUp .2s ease" }}>
                  <div style={{ fontSize: 9, color: TEXT_DIM, letterSpacing: 2, marginBottom: 16, textAlign: "center" }}>{model} · EMC VALUATION</div>
                  <div style={{ background: SURFACE_2, border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden", marginBottom: 13 }}>
                    {[["VREF BASE", formatMoney(base), TEXT], ["EMC MULT (×0.98)", useM ? formatMoney(eb - base) : null, TEXT_DIM], ...ADJUSTMENTS.map(({ k, l }) => { const v = parseFloat(adjs[k]) || 0; return v !== 0 ? [l, (v > 0 ? "+" : "") + formatMoney(v, 2), v > 0 ? TEAL : RED] : null }).filter(Boolean)].filter(([, v]) => v !== null).map(([l, v, c], i) =>
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px", borderBottom: `1px solid ${BORDER}`, fontSize: 11 }}>
                        <span style={{ color: TEXT_DIM }}>{l}</span><span style={{ color: c, fontFamily: FONT_MONO, fontWeight: 600 }}>{v}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ background: SURFACE_2, border: `1px solid ${TEAL}`, borderRadius: 4, padding: "20px", textAlign: "center", marginBottom: 13 }}>
                    <div style={{ fontSize: 8.5, color: TEAL, letterSpacing: 3, marginBottom: 8, fontWeight: 700 }}>EMC VALUE</div>
                    <div style={{ fontSize: 48, fontWeight: 900, color: TEAL, fontFamily: FONT_MONO, lineHeight: 1 }}>{formatMoney(emc)}</div>
                    <div style={{ fontSize: 10, color: emc >= base ? RED : TEAL, marginTop: 8 }}>{emc >= base ? "+" : ""}{formatMoney(emc - base)} vs VREF · {sentiment !== "neutral" ? sentiment.toUpperCase() + " market" : "Neutral market"}</div>
                  </div>
                  {(avgSold > 0 || avgAsk > 0) && <div style={{ background: SURFACE_2, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "12px" }}>
                    <div style={{ fontSize: 8, color: TEXT_DIM, letterSpacing: 2, marginBottom: 8, fontWeight: 600 }}>MARKET POSITION — {model}</div>
                    {avgAsk > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 11 }}><span style={{ color: TEXT_DIM }}>Avg asking ({forSale.length})</span><span style={{ color: TEAL, fontFamily: FONT_MONO, fontWeight: 700 }}>{formatMoney(avgAsk)}</span></div>}
                    {avgSold > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 11 }}><span style={{ color: TEXT_DIM }}>Avg sold ({soldAC.length})</span><span style={{ color: RED, fontFamily: FONT_MONO, fontWeight: 700 }}>{formatMoney(avgSold)}</span></div>}
                    {avgSold > 0 && <div style={{ padding: "7px 10px", background: emc > avgSold ? "rgba(255,68,85,.07)" : "rgba(0,194,168,.07)", border: `1px solid ${emc > avgSold ? RED : TEAL}`, borderRadius: 3, fontSize: 11, color: emc > avgSold ? RED : TEAL, textAlign: "center", fontWeight: 700 }}>
                      {emc > avgSold ? `▲ ${formatMoney(emc - avgSold)} above avg sold` : `▼ ${formatMoney(avgSold - emc)} below avg sold`}
                    </div>}
                  </div>}
                </div>
                : <div style={{ textAlign: "center", color: TEXT_DIM, fontSize: 12, lineHeight: 2.5 }}>
                  <div style={{ fontSize: 32, opacity: .08, marginBottom: 8 }}>$</div>
                  {model ? <>Enter VREF above, or<br />double-click an aircraft in the watchlist</> : <>Select a model first</>}
                </div>
              }
            </div>
          </div>}

          {tab === "vrefdb" && <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "6px 13px", borderBottom: `1px solid ${BORDER}`, background: "#090909", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: TEXT_DIM }}>Click any cell to override · Teal = custom · Auto-saves</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {Object.keys(vrefOvr).length > 0 && <>
                  <span style={{ fontSize: 9, color: TEAL }}>{Object.values(vrefOvr).reduce((s, m) => s + Object.keys(m).length, 0)} custom</span>
                  <button onClick={() => { setVrefOvr({}); saveVref({}) }} style={{ padding: "2px 7px", border: `1px solid ${RED}`, background: "transparent", color: RED, fontSize: 9, cursor: "pointer", borderRadius: 2, fontFamily: "inherit" }}>Reset</button>
                </>}
                <input value={vrefFilter} onChange={e => setVrefFilter(e.target.value)} placeholder="Filter…"
                  style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 2, padding: "3px 7px", color: TEXT, fontSize: 10, fontFamily: "inherit", width: 110 }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {Object.keys(MODELS).filter(m => !vrefFilter || m.toLowerCase().includes(vrefFilter.toLowerCase())).map(mdl => {
                const merged = vMrg(mdl), years = Object.keys(merged).map(Number).sort((a, b) => a - b)
                if (!years.length) return null
                return <div key={mdl} style={{ display: "flex", alignItems: "center", padding: "4px 13px", borderBottom: `1px solid ${BORDER}`, gap: 3, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: vrefOvr[mdl] ? TEAL : TEXT, minWidth: 136 }}>{mdl}</span>
                  {years.map(yr => {
                    const val = merged[yr], isO = vrefOvr[mdl]?.[yr] !== undefined, isE = editCell === `${mdl}|${yr}`
                    return <div key={yr} className="vc" onClick={() => { setEditCell(`${mdl}|${yr}`); setEditVal(String(val)) }}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2px 4px", border: `1px solid ${isO ? TEAL : BORDER}`, borderRadius: 2, minWidth: 50, background: isO ? "rgba(0,194,168,.05)" : "transparent", transition: "all .1s" }}>
                      <span style={{ fontSize: 7.5, color: TEXT_FAINT }}>{yr}</span>
                      {isE
                        ? <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                          onBlur={() => { doEdit(mdl, yr, editVal); setEditCell(null) }}
                          onKeyDown={e => { if (e.key === "Enter" || e.key === "Tab") { doEdit(mdl, yr, editVal); setEditCell(null) } if (e.key === "Escape") setEditCell(null) }}
                          style={{ width: 44, background: "transparent", border: "none", color: TEAL, fontSize: 9.5, fontFamily: FONT_MONO, textAlign: "center", padding: 0, outline: "none" }} />
                        : <span style={{ fontSize: 9.5, color: isO ? TEAL : TEXT_DIM, fontFamily: FONT_MONO }}>{formatMoney(val, 1)}</span>
                      }
                    </div>
                  })}
                </div>
              })}
            </div>
            <div style={{ padding: "4px 13px", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", fontSize: 8.5, color: TEXT_FAINT, flexShrink: 0 }}>
              <span>Enter/Tab to save · Esc to cancel</span>
              <span>{Object.values(VREF).reduce((s, m) => s + Object.keys(m).length, 0)} pts · {Object.keys(VREF).length} models</span>
            </div>
          </div>}
        </div>
      </div>
    </div>
  )
}
