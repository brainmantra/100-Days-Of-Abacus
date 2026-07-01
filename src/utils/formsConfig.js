/**
 * FORMS CONFIGURATION
 * ===================
 * Each level has exactly 100 Google Form embed URLs — one per challenge day.
 *
 * HOW TO GET AN EMBED URL FOR A GOOGLE FORM:
 *   1. Open the Google Form.
 *   2. Click "Send" (top-right).
 *   3. Click the "<>" (Embed) tab.
 *   4. Copy the URL from the src="..." attribute in the iframe code.
 *      It ends with: ?embedded=true
 *
 * HOW TO FILL THIS FILE:
 *   - Replace every 'null' with the matching form's embed URL string.
 *   - Day index is 1-based: forms[0] = Day 1, forms[99] = Day 100.
 *   - If a particular day's form is the same as the previous day, just
 *     repeat that URL. Never leave null in production — DayModal will
 *     show an error message if the URL for the current day is null.
 *
 * EXAMPLE (one entry):
 *   'https://docs.google.com/forms/d/e/1FAIpQLSc.../viewform?embedded=true'
 */

// Helper: build a placeholder array of 100 nulls for levels not yet configured.
const todo = () => Array(100).fill(null)

export const LEVELS = [
  { id: '1',     label: '1',     description: 'Level 1'},
  { id: '2',   label: '2',   description: 'Level 2'},
  { id: '3', label: '3', description: 'Level 3'},
  { id: '4', label: '4', description: 'Level 4'},
  { id: '5', label: '5', description: 'Level 5'},
  { id: '6', label: '6', description: 'Level 6'},
  { id: '7', label: '7', description: 'Level 7'},
  { id: '8', label: '8', description: 'Level 8'},
]

// ─────────────────────────────────────────────────────────────────────────────
//  BEGINNER  (100 form URLs, one per day)
// ─────────────────────────────────────────────────────────────────────────────
const Level1_FORMS = [
  // Day 1  – Day 10
  null, null, null, null, null, null, null, null, null, null,
  // Day 11 – Day 20
  null, null, null, null, null, null, null, null, null, null,
  // Day 21 – Day 30
  null, null, null, null, null, null, null, null, null, null,
  // Day 31 – Day 40
  null, null, null, null, null, null, null, null, null, null,
  // Day 41 – Day 50
  null, null, null, null, null, null, null, null, null, null,
  // Day 51 – Day 60
  null, null, null, null, null, null, null, null, null, null,
  // Day 61 – Day 70
  null, null, null, null, null, null, null, null, null, null,
  // Day 71 – Day 80
  null, null, null, null, null, null, null, null, null, null,
  // Day 81 – Day 90
  null, null, null, null, null, null, null, null, null, null,
  // Day 91 – Day 100
  null, null, null, null, null, null, null, null, null, null,
]

// ─────────────────────────────────────────────────────────────────────────────
//  Master lookup map
// ─────────────────────────────────────────────────────────────────────────────
const FORM_MAP = {
  '1':     Level1_FORMS,
  '2':     Level2_FORMS,
  '3':     Level3_FORMS,
  '4':     Level4_FORMS,
  '5':     Level5_FORMS,
  '6':     Level6_FORMS,
  '7':     Level7_FORMS,
  '8':     Level8_FORMS,
}

/**
 * Returns the Google Form embed URL for a given level and day number (1-based).
 * Returns null if not yet configured.
 */
export function getFormUrl(level, dayNumber) {
  const forms = FORM_MAP[level]
  if (!forms) return null
  return forms[dayNumber - 1] ?? null   // dayNumber is 1-based; array is 0-based
}

/**
 * Returns true if the form for a given level + day has been configured.
 */
export function isFormConfigured(level, dayNumber) {
  return getFormUrl(level, dayNumber) !== null
}

// URL of the Google Form used for initial registration (linked on the login page).
// Students fill this out once; it populates the Google Sheet used for verification.
export const REGISTRATION_FORM_URL =
  'https://docs.google.com/forms/d/e/17uasmqIXH7XWxIMDA9b4UeF8KQRR4kwQVSvSEsgjElQ/viewform'