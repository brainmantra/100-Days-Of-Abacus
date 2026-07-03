function getISTMidnightUTC(d = new Date()) {
  const date = new Date(d)
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' }
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date)
  const p = {}
  parts.forEach(({ type, value }) => { p[type] = parseInt(value, 10) })
  return Date.UTC(p.year, p.month - 1, p.day)
}

export function getChallengeDay(registrationDate, now = new Date()) {
  const regDay = getISTMidnightUTC(registrationDate)
  const today = getISTMidnightUTC(now)
  return Math.max(1, Math.round((today - regDay) / 86_400_000) + 1)
}

export function getDayDate(registrationDate, dayNumber) {
  // Return a Date object representing the midnight (UTC) of that day in IST,
  // adjusted so when displayed locally, it shows the correct day.
  // Actually, we can just create a Date object in local time that has the 
  // same year, month, day as the target IST day.
  const regDayUTC = getISTMidnightUTC(registrationDate)
  const targetDayUTC = regDayUTC + (dayNumber - 1) * 86_400_000
  return new Date(targetDayUTC) // This will be used by formatDate
}

export function isDayToday(registrationDate, dayNumber) {
  const currentDay = getChallengeDay(registrationDate)
  return dayNumber === currentDay
}

export function isDayPast(registrationDate, dayNumber) {
  const currentDay = getChallengeDay(registrationDate)
  return dayNumber < currentDay
}

export function formatDate(date) {
  // Assuming 'date' is a Date object representing midnight UTC of the target day.
  // We want to display its UTC date as local string.
  const d = new Date(date)
  // To avoid local timezone shifts changing the day, we format in UTC:
  return d.toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

export function getTimeUntilMidnight() {
  // Midnight in IST
  const now = new Date()
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' }
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now)
  const p = {}
  parts.forEach(({ type, value }) => { p[type] = parseInt(value, 10) })
  
  // Next midnight in IST
  const nextMidnightISTString = `${p.month}/${p.day + 1}/${p.year} 00:00:00`
  const nextMidnightDate = new Date(new Date(nextMidnightISTString).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  
  // More robust way to find next IST midnight:
  // Date.UTC of tomorrow's IST date, minus Date.UTC of today's IST date? No, time remaining is actual ms.
  // Let's use a simpler approach: get current time in IST, find ms to 24:00:00.
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  });
  const timeString = formatter.format(now); // "23:59:59" or "24:00:00"
  let [hours, minutes, seconds] = timeString.split(':').map(Number);
  if (hours === 24) hours = 0;
  
  const msPassedToday = (hours * 3600 + minutes * 60 + seconds) * 1000;
  const msInDay = 24 * 3600 * 1000;
  
  return msInDay - msPassedToday;
}
