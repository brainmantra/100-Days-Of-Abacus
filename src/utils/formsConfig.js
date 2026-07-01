/**
 * CONFIGURATION FILE
 * Replace the placeholder URLs with your actual Google Form embed URLs.
 *
 * To get a Google Form embed URL:
 * Open Form → Click Send → Embed tab → copy the src from the iframe code.
 * It looks like: https://docs.google.com/forms/d/e/FORM_ID/viewform?embedded=true
 *
 * Each level can have different forms per day, or one form repeated.
 * If you want a single form per level for all 100 days, set defaultFormUrl.
 * For day-specific forms, populate the `days` object.
 */

export const LEVELS = [
  { id: '1', label: '1', description: 'Levels 1–2 · Ages 5–7' },
  { id: '2', label: '2', description: 'Levels 1–2 · Ages 5–7' },
  { id: '3', label: '3', description: 'Levels 3–4 · Ages 7–9' },
  { id: '4', label: '4', description: 'Levels 3–4 · Ages 7–9' },
  { id: '5', label: '5', description: 'Levels 5–6 · Ages 9–11' },
  { id: '6', label: '6', description: 'Levels 5–6 · Ages 9–11' },
  { id: '7', label: '7', description: 'Levels 7–8 · Ages 11+' },
  { id: '8', label: '8', description: 'Levels 7–8 · Ages 11+' },
  { id: '9', label: '9', description: 'Levels 9–10 · Masters' },
  { id: '10', label: '10', description: 'Levels 9–10 · Masters' },
]

// ─── REPLACE THESE URLS WITH YOUR ACTUAL GOOGLE FORM EMBED URLS ────────────
export const FORM_CONFIG = {
  '1': {
    defaultFormUrl: 'https://docs.google.com/forms/d/e/YOUR_LEVEL_1_FORM_ID/viewform?embedded=true',
    days: {
      // Override for specific days: 1: 'https://...',
    }
  },
  '2': {
    defaultFormUrl: 'https://docs.google.com/forms/d/e/YOUR_LEVEL_2_FORM_ID/viewform?embedded=true',
    days: {}
  },
  '3': {
    defaultFormUrl: 'https://docs.google.com/forms/d/e/YOUR_LEVEL_3_FORM_ID/viewform?embedded=true',
    days: {}
  },
  '4': {
    defaultFormUrl: 'https://docs.google.com/forms/d/e/YOUR_LEVEL_4_FORM_ID/viewform?embedded=true',
    days: {}
  },
  '5': {
    defaultFormUrl: 'https://docs.google.com/forms/d/e/YOUR_LEVEL_5_FORM_ID/viewform?embedded=true',
    days: {}
  },
  '6': {
    defaultFormUrl: 'https://docs.google.com/forms/d/e/YOUR_LEVEL_6_FORM_ID/viewform?embedded=true',
    days: {}
  },
  '7': {
    defaultFormUrl: 'https://docs.google.com/forms/d/e/YOUR_LEVEL_7_FORM_ID/viewform?embedded=true',
    days: {}
  },
  '8': {
    defaultFormUrl: 'https://docs.google.com/forms/d/e/YOUR_LEVEL_8_FORM_ID/viewform?embedded=true',
    days: {}
  },
  '9': {
    defaultFormUrl: 'https://docs.google.com/forms/d/e/YOUR_LEVEL_9_FORM_ID/viewform?embedded=true',
    days: {}
  },
  '10': {
    defaultFormUrl: 'https://docs.google.com/forms/d/e/YOUR_LEVEL_10_FORM_ID/viewform?embedded=true',
    days: {}
  },
}

/**
 * Get the Google Form URL for a specific level and day.
 */
export function getFormUrl(level, dayNumber) {
  const config = FORM_CONFIG[level]
  if (!config) return null
  return config.days[dayNumber] || config.defaultFormUrl
}

// ─── REGISTRATION FORM ───────────────────────────────────────────────────────
// URL of the Google Form used for registration (used as fallback/redirect)
export const REGISTRATION_FORM_URL = 'https://docs.google.com/forms/d/e/YOUR_REGISTRATION_FORM_ID/viewform'

// Spreadsheet published as CSV (File → Share → Publish to web → CSV)
// Used to verify registrations. Format expected: Name, Mobile, Level, Timestamp columns
export const REGISTRATION_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID/pub?output=csv'