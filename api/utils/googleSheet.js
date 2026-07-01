import { parse } from 'csv-parse/sync'

/**
 * Fetches and parses the published-as-CSV Google Sheet behind the registration
 * Google Form. Used as a secondary check: if a mobile number isn't in our own
 * database but IS in the sheet, we can auto-import them instead of rejecting.
 *
 * Expected columns (case-insensitive, matched loosely): Name, Mobile/Phone, Level, Timestamp
 */
export async function fetchRegistrationSheet(csvUrl) {
  if (!csvUrl) return []
  const res = await fetch(csvUrl)
  if (!res.ok) throw new Error(`Failed to fetch registration sheet: ${res.status}`)
  const text = await res.text()
  const records = parse(text, { columns: true, skip_empty_lines: true, trim: true })

  return records.map(row => {
    const get = (keys) => {
      for (const k of Object.keys(row)) {
        if (keys.some(kk => k.toLowerCase().includes(kk))) return row[k]
      }
      return ''
    }
    return {
      name: get(['name']),
      mobile: (get(['mobile', 'phone']) || '').replace(/\D/g, '').slice(-10),
      level: (get(['level']) || '').toLowerCase().trim(),
      timestamp: get(['timestamp', 'date']),
    }
  }).filter(r => r.mobile)
}

/**
 * Looks up a mobile number in the registration sheet.
 */
export async function findInRegistrationSheet(csvUrl, mobile) {
  const rows = await fetchRegistrationSheet(csvUrl)
  return rows.find(r => r.mobile === mobile) || null
}