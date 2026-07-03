import { parse } from 'csv-parse/sync'

export async function fetchRegistrationSheet() {
  const csvUrl = process.env.REGISTRATION_SHEET_CSV_URL
  if (!csvUrl) {
    throw new Error('REGISTRATION_SHEET_CSV_URL is not set in api/.env')
  }

  const res = await fetch(csvUrl, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`Sheet fetch failed: HTTP ${res.status}`)

  const text = await res.text()
  const records = parse(text, { columns: true, skip_empty_lines: true, trim: true })

  const mobileCol = process.env.SHEET_MOBILE_COLUMN || 'Mobile Number'
  const nameCol   = process.env.SHEET_NAME_COLUMN   || 'Full Name'
  const levelCol  = process.env.SHEET_LEVEL_COLUMN  || 'Level'

  return records.map(row => ({
    name:   (row[nameCol]   || '').trim(),
    mobile: (row[mobileCol] || '').replace(/\D/g, '').slice(-10),
    level:  (row[levelCol]  || '').trim().toLowerCase(),
    raw:    row,
  })).filter(r => r.mobile.length === 10)
}

export async function findInSheet(mobile) {
  const rows = await fetchRegistrationSheet()
  return rows.find(r => r.mobile === mobile) ?? null
}

const VALID_LEVELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'beginner', 'elementary', 'intermediate', 'advanced', 'expert']

export function normaliseLevel(raw = '') {
  const s = raw.toLowerCase()
  
  // Extract number if it exists (e.g. "foundation level 3" -> "3")
  const match = s.match(/\d+/)
  if (match) {
    const num = match[0]
    if (VALID_LEVELS.includes(num)) return num
  }

  // Fallback for named levels
  if (s.includes('expert'))       return 'expert'
  if (s.includes('advanced'))     return 'advanced'
  if (s.includes('intermediate')) return 'intermediate'
  if (s.includes('elementary'))   return 'elementary'
  if (s.includes('beginner'))     return 'beginner'
  
  // Also accept exact IDs
  if (VALID_LEVELS.includes(s))   return s
  return null
}