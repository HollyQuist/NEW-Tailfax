import express from "express"
import cors from "cors"
import { execSync } from "child_process"

const app = express()
app.use(cors())

const MONDAY_TOKEN = process.env.VITE_MONDAY_TOKEN || ""

// Column ID → field name mapping (from the Monday.com board schema)
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
  // Also grab AFTT/landings from text columns as fallback
  text_mkpg3qnn: "aftt_text",
  text_mknyvvvh: "landings_text",
}

function parseColumnValue(colId, rawVal, textVal) {
  // Status/color columns - use text directly (Monday returns labels like "For Sale")
  if (colId.startsWith("color_")) {
    return textVal || ""
  }
  // Country columns
  if (colId.startsWith("country_")) {
    if (!rawVal) return textVal || ""
    try {
      const parsed = JSON.parse(rawVal)
      return parsed?.countryName || parsed?.countryCode || textVal || ""
    } catch { return textVal || "" }
  }
  // Dropdown columns - use text
  if (colId.startsWith("dropdown_")) {
    return textVal || ""
  }
  // Number columns
  if (colId.startsWith("numbers") || colId.startsWith("numeric_") || colId.startsWith("aftt_") || colId.startsWith("landings_")) {
    if (textVal) return parseFloat(textVal.replace(/[,$]/g, "")) || 0
    if (!rawVal) return 0
    try { return parseFloat(JSON.parse(rawVal)) || 0 } catch { return 0 }
  }
  // Date columns
  if (colId.startsWith("date")) {
    if (!rawVal) return textVal || ""
    try { return JSON.parse(rawVal)?.date || textVal || "" } catch { return textVal || "" }
  }
  // Text columns
  if (textVal) return textVal
  if (!rawVal) return ""
  try {
    const parsed = JSON.parse(rawVal)
    return typeof parsed === "string" ? parsed : ""
  } catch { return rawVal }
}

function fetchBoard(boardId) {
  const query = `{ boards(ids: [${boardId}]) { items_page(limit: 500) { items { name column_values { id value text } } } } }`
  const payload = JSON.stringify({ query })

  const result = execSync(
    `curl -s -X POST https://api.monday.com/v2 -H "Content-Type: application/json" -H "Authorization: ${MONDAY_TOKEN}" -H "API-Version: 2024-10" -d '${payload.replace(/'/g, "'\\''")}'`,
    { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
  )

  const data = JSON.parse(result.toString())
  if (data.errors) {
    throw new Error(`Monday GQL error: ${JSON.stringify(data.errors[0])}`)
  }

  const items = data?.data?.boards?.[0]?.items_page?.items || []

  return items.map(item => {
    const ac = { sn: item.name, year: "", reg: "", status: "", country: "", aftt: 0, landings: 0, ask: 0, sold: 0, eng: "", avionics: "", insp36: "", listDate: "", saleDate: "", pax: 0, wifi: "" }

    for (const col of item.column_values) {
      const field = COL_MAP[col.id]
      if (!field) continue

      const val = parseColumnValue(col.id, col.value, col.text)

      if (field === "aftt_text") {
        if (!ac.aftt && val) ac.aftt = parseFloat(val) || 0
      } else if (field === "landings_text") {
        if (!ac.landings && val) ac.landings = parseFloat(val) || 0
      } else if (val !== null && val !== undefined && val !== "") {
        ac[field] = val
      }
    }

    return ac
  })
}

app.get("/api/board/:boardId", (req, res) => {
  try {
    const aircraft = fetchBoard(req.params.boardId)
    res.json(aircraft)
  } catch (e) {
    console.error("Error fetching board:", e.message)
    res.status(500).json({ error: e.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`EMCJET API server running on http://localhost:${PORT}`)
})
