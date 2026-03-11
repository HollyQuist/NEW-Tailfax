import { TEAL, BORDER, TEXT_DIM, TEXT_FAINT } from "../theme"

export default function TabBar({ tab, setTab, selected, aircraft }) {
  return (
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
  )
}
