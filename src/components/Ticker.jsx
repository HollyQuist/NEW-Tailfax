import { BORDER, TEXT, TEXT_DIM, FONT_MONO, statusColor } from "../theme"
import { formatMoney } from "../utils"

export default function Ticker({ tickerAC, loading, error, model }) {
  return (
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
  )
}
