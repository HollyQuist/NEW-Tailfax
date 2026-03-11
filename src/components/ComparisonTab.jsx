import {
  TEAL, RED,
  BG, SURFACE_2, BORDER,
  TEXT, TEXT_DIM, TEXT_FAINT,
  FONT_MONO, statusColor,
} from "../theme"
import { formatMoney, formatNumber, vrefLookup } from "../utils"

export default function ComparisonTab({ selectedAC, selected, model, toggleSel, selectForVal }) {
  if (selectedAC.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 38, opacity: .07 }}>✈</div>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: .3 }}>SELECT AIRCRAFT TO COMPARE</div>
        <div style={{ fontSize: 11.5, color: TEXT_DIM, textAlign: "center", lineHeight: 2.3 }}>Choose up to 4 from the watchlist<br /><span style={{ color: TEXT_FAINT }}>Click to select · Double-click to valuate</span></div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "7px 14px", borderBottom: `1px solid ${BORDER}`, display: "flex", gap: 6, flexWrap: "wrap", background: "#0A0A0A", flexShrink: 0, alignItems: "center" }}>
        {selectedAC.map(ac => <div key={ac.sn} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 10px", border: `1px solid ${BORDER}`, borderRadius: 20, fontSize: 11 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor(ac.status) }} />
          <span style={{ fontWeight: 600 }}>{ac.reg || ac.sn}</span><span style={{ color: TEXT_DIM }}>·</span>
          <span style={{ color: TEXT_DIM }}>{ac.year}</span><span style={{ color: TEXT_DIM }}>·</span>
          <span style={{ color: statusColor(ac.status), fontSize: 9 }}>{ac.status}</span>
          <button onClick={() => toggleSel(ac.sn)} style={{ background: "none", border: "none", color: TEXT_DIM, cursor: "pointer", fontSize: 13, lineHeight: 1, padding: 0, opacity: .4, marginLeft: 1 }}>×</button>
        </div>)}
        {selected.length < 4 && <span style={{ fontSize: 10, color: TEXT_FAINT }}>+ click watchlist to add</span>}
      </div>
      <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", padding: 14 }}>
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
    </div>
  )
}
