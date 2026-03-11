import {
  TEAL, RED,
  BORDER,
  TEXT, TEXT_DIM, TEXT_FAINT,
  FONT_MONO,
} from "../theme"
import { MODELS } from "../data/models"
import { VREF } from "../data/vref"
import { formatMoney } from "../utils"

export default function VrefDbTab({
  vrefOvr, setVrefOvr, vrefFilter, setVrefFilter,
  editCell, setEditCell, editVal, setEditVal,
  doEdit, vMrg, saveVref,
}) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
    </div>
  )
}
