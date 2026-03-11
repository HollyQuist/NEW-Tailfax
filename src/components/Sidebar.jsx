import {
  TEAL, AMBER, RED,
  SURFACE_1, BORDER,
  TEXT, TEXT_DIM, TEXT_FAINT,
  FONT_MONO, statusColor,
} from "../theme"
import { formatMoney } from "../utils"

export default function Sidebar({
  aircraft, filtered, selected, search, setSearch,
  filter, setFilter, loading, error, dbg, model,
  toggleSel, selectForVal, loadModel, setSelected,
}) {
  return (
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
  )
}
