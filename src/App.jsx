import { useState, useEffect, useCallback } from "react"
import { BG, TEXT, SENTIMENT, FONT_SANS } from "./theme"
import { MODELS } from "./data/models"
import { VREF } from "./data/vref"
import { DEFAULT_ADJS } from "./data/adjustments"
import { vrefLookup } from "./utils"
import GlobalStyles from "./components/GlobalStyles"
import Ticker from "./components/Ticker"
import Header from "./components/Header"
import TabBar from "./components/TabBar"
import Sidebar from "./components/Sidebar"
import ComparisonTab from "./components/ComparisonTab"
import ValuationTab from "./components/ValuationTab"
import VrefDbTab from "./components/VrefDbTab"

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
  const base = parseFloat(vref) || 0
  const eb = useM ? (base * 0.98 * sentM) : (base * sentM)
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
      <GlobalStyles />
      <Ticker tickerAC={tickerAC} loading={loading} error={error} model={model} />
      <Header
        modelInput={modelInput} setModelInput={setModelInput}
        showDrop={showDrop} setShowDrop={setShowDrop}
        setModel={setModel} dropModels={dropModels}
        aircraft={aircraft} forSale={forSale} ucAC={ucAC} soldAC={soldAC}
        selected={selected} avgSold={avgSold} avgAsk={avgAsk}
        sentiment={sentiment} setSentiment={setSentiment}
        now={now} loading={loading}
      />
      <TabBar tab={tab} setTab={setTab} selected={selected} aircraft={aircraft} />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <Sidebar
          aircraft={aircraft} filtered={filtered} selected={selected}
          search={search} setSearch={setSearch}
          filter={filter} setFilter={setFilter}
          loading={loading} error={error} dbg={dbg} model={model}
          toggleSel={toggleSel} selectForVal={selectForVal}
          loadModel={loadModel} setSelected={setSelected}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {tab === "comparison" && (
            <ComparisonTab
              selectedAC={selectedAC} selected={selected}
              model={model} toggleSel={toggleSel} selectForVal={selectForVal}
            />
          )}
          {tab === "valuation" && (
            <ValuationTab
              model={model} valAC={valAC} setValAC={setValAC}
              vref={vref} setVref={setVref} adjs={adjs} setAdjs={setAdjs}
              useM={useM} setUseM={setUseM}
              base={base} eb={eb} emc={emc} sentiment={sentiment}
              avgSold={avgSold} avgAsk={avgAsk}
              forSale={forSale} soldAC={soldAC} vMrg={vMrg}
            />
          )}
          {tab === "vrefdb" && (
            <VrefDbTab
              vrefOvr={vrefOvr} setVrefOvr={setVrefOvr}
              vrefFilter={vrefFilter} setVrefFilter={setVrefFilter}
              editCell={editCell} setEditCell={setEditCell}
              editVal={editVal} setEditVal={setEditVal}
              doEdit={doEdit} vMrg={vMrg} saveVref={saveVref}
            />
          )}
        </div>
      </div>
    </div>
  )
}
