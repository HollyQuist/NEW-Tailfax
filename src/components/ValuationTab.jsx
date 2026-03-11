import {
  TEAL, RED,
  SURFACE_2, BORDER,
  TEXT, TEXT_DIM,
  FONT_MONO,
} from "../theme"
import { VREF } from "../data/vref"
import { ADJUSTMENTS } from "../data/adjustments"
import { formatMoney, formatNumber } from "../utils"

export default function ValuationTab({
  model, valAC, setValAC, vref, setVref, adjs, setAdjs,
  useM, setUseM, base, eb, emc, sentiment,
  avgSold, avgAsk, forSale, soldAC, vMrg,
}) {
  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
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
    </div>
  )
}
