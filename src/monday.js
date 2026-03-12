/**
 * Direct Monday.com GraphQL client — runs in the browser.
 * No backend needed; Monday.com allows CORS from any origin.
 */

const MONDAY_TOKEN = import.meta.env.VITE_MONDAY_TOKEN || ""

// Column ID → field name mapping
const COL_MAP = {
  text_mkr4dfxv: "year",
  text_mkrvqp10: "year",
  text_mknyb7mw: "reg",
  color_mkny5szn: "status",
  country_mkqpm9an: "country",
  aftt_mkms9wnq: "aftt",
  landings_mkmswqc6: "landings",
  numbers3: "ask",
  numeric_mkq21mk1: "sold",
  eng_prog_mkmrv5f3: "eng",
  dropdown_mkqpmryr: "avionics",
  "36_month_inspection_mkmrvryb": "insp36",
  date4: "listDate",
  date_mkrm73dv: "saleDate",
  date_mkr5v5r7: "saleDate",
  numbers4: "pax",
  dropdown_mkqp3zhk: "wifi",
  // AFTT/landings fallback text columns
  text_mkpg3qnn: "aftt_text",
  text_mknyvvvh: "landings_text",
}

function parseCol(colId, rawVal, textVal) {
  if (colId.startsWith("color_")) return textVal || ""
  if (colId.startsWith("country_")) {
    if (!rawVal) return textVal || ""
    try { return JSON.parse(rawVal)?.countryName || textVal || "" } catch { return textVal || "" }
  }
  if (colId.startsWith("dropdown_")) return textVal || ""
  if (colId.startsWith("numbers") || colId.startsWith("numeric_") || colId.startsWith("aftt_") || colId.startsWith("landings_")) {
    if (textVal) return parseFloat(textVal.replace(/[,$]/g, "")) || 0
    if (!rawVal) return 0
    try { return parseFloat(JSON.parse(rawVal)) || 0 } catch { return 0 }
  }
  if (colId.startsWith("date")) {
    if (!rawVal) return textVal || ""
    try { return JSON.parse(rawVal)?.date || textVal || "" } catch { return textVal || "" }
  }
  if (textVal) return textVal
  if (!rawVal) return ""
  try { const p = JSON.parse(rawVal); return typeof p === "string" ? p : "" } catch { return rawVal }
}

export async function fetchBoard(boardId) {
  const query = `{ boards(ids: [${boardId}]) { items_page(limit: 500) { items { name column_values { id value text } } } } }`

  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": MONDAY_TOKEN,
      "API-Version": "2024-10",
    },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Monday API ${res.status}: ${text.slice(0, 300)}`)
  }

  const data = await res.json()
  if (data.errors) throw new Error(data.errors[0]?.message || JSON.stringify(data.errors[0]))

  const items = data?.data?.boards?.[0]?.items_page?.items || []

  return items.map(item => {
    const ac = { sn: item.name, year: "", reg: "", status: "", country: "", aftt: 0, landings: 0, ask: 0, sold: 0, eng: "", avionics: "", insp36: "", listDate: "", saleDate: "", pax: 0, wifi: "" }

    for (const col of item.column_values) {
      const field = COL_MAP[col.id]
      if (!field) continue
      const val = parseCol(col.id, col.value, col.text)
      if (field === "aftt_text") { if (!ac.aftt && val) ac.aftt = parseFloat(val) || 0 }
      else if (field === "landings_text") { if (!ac.landings && val) ac.landings = parseFloat(val) || 0 }
      else if (val !== null && val !== undefined && val !== "") ac[field] = val
    }

    return ac
  })
}
