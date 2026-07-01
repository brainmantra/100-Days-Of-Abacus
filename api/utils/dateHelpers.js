/** Returns the challenge day number (1-indexed) for a given registration date, as of "now". */
export function getChallengeDay(registrationDate, now = new Date()) {
  const reg = new Date(registrationDate)
  const regDay = new Date(reg.getFullYear(), reg.getMonth(), reg.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((today - regDay) / 86400000)
  return diffDays + 1
}

export function isSameCalendarDay(a, b) {
  const da = new Date(a)
  const db = new Date(b)
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
}

export function startOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Monday-based start of the current ISO week. */
export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0) ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function getWeekLabel(date = new Date()) {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const fmt = (x) => x.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}