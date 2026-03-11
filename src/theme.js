/**
 * EMCJET Valuation Terminal — Theme Constants
 *
 * Central source of truth for all colors, spacing, and visual tokens
 * used throughout the application.
 */

// ── Core palette ──────────────────────────────────────────────
export const TEAL        = "#00C2A8"  // Primary accent / positive
export const AMBER       = "#FFAA00"  // Warning / under-contract
export const RED         = "#FF4455"  // Danger / sold

// ── Backgrounds ───────────────────────────────────────────────
export const BG          = "#080808"  // App background
export const SURFACE_1   = "#0C0C0C"  // Sidebar / header background
export const SURFACE_2   = "#101010"  // Card background
export const BORDER      = "#1A1A1A"  // Default border

// ── Text ──────────────────────────────────────────────────────
export const TEXT        = "#EEEEEE"  // Primary text
export const TEXT_DIM    = "#666666"  // Secondary / muted text
export const TEXT_FAINT  = "#2E2E2E"  // Tertiary / very muted text

// ── Status color resolver ─────────────────────────────────────
export const statusColor = (status) =>
  status === "For Sale"       ? TEAL  :
  status === "Under Contract" ? AMBER :
  status === "Recently Sold"  ? RED   :
  TEXT_DIM

// ── Sentiment multipliers ─────────────────────────────────────
export const SENTIMENT = {
  soft:    0.97,
  neutral: 1.00,
  firm:    1.03,
}

// ── Shared font stack ─────────────────────────────────────────
export const FONT_SANS  = "-apple-system, BlinkMacSystemFont, sans-serif"
export const FONT_MONO  = "'JetBrains Mono', monospace"
