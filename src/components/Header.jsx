import {
  TEAL, AMBER, RED,
  SURFACE_1, BORDER,
  TEXT, TEXT_DIM,
  FONT_MONO,
} from "../theme"
import { MODELS } from "../data/models"
import { formatMoney } from "../utils"

export default function Header({
  modelInput, setModelInput, showDrop, setShowDrop,
  setModel, dropModels, aircraft, forSale, ucAC, soldAC, selected,
  avgSold, avgAsk, sentiment, setSentiment, now, loading,
}) {
  return (
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
  )
}
