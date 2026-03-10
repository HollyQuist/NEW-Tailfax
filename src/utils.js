import { VREF } from "./data/vref"

/** Format a number as "$X.XXM", or "—" if falsy. */
export const formatMoney = (n, decimals = 2) => {
  const x = parseFloat(n)
  return (!x || isNaN(x)) ? "—" : "$" + x.toFixed(decimals) + "M"
}

/** Format an integer with locale grouping, or "—" if falsy. */
export const formatNumber = (n) => {
  const x = parseInt(n)
  return (!x || isNaN(x)) ? "—" : x.toLocaleString()
}

/**
 * Look up the closest VREF value for a model + year.
 * Returns the exact year match, or the nearest available year.
 */
export const vrefLookup = (model, year) => {
  const table = VREF[model]
  if (!table) return null
  const y = parseInt(year)
  if (table[y]) return table[y]
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b)
  if (!keys.length) return null
  return table[keys.reduce((a, b) => Math.abs(b - y) < Math.abs(a - y) ? b : a)]
}
