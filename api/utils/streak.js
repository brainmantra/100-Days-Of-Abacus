import { getChallengeDay, isSameCalendarDay } from './dateHelpers.js'

/**
 * Recalculates a student's current and longest streak based on their day records.
 * Streak rule: counts consecutive completed days ending at "yesterday or today".
 * If the most recently elapsed challenge day (today, or yesterday if today not yet
 * completed) was missed (past, not completed), the streak resets to 0.
 *
 * This is called:
 *  - whenever a day is marked completed
 *  - by the nightly cron job to break streaks for students who missed "today" once
 *    that day has fully elapsed
 */
export function recalculateStreak(student, now = new Date()) {
  const currentDay = getChallengeDay(student.registrationDate, now)
  const dayMap = new Map(student.days.map(d => [d.dayNumber, d]))

  let streak = 0
  let longest = student.longestStreak || 0
  let runningStreak = 0

  // Walk from day 1 up to the last fully-elapsed day (currentDay - 1 if today not over,
  // but since cron runs after midnight, "currentDay - 1" is effectively "yesterday").
  const lastElapsedDay = Math.min(currentDay, 100)

  for (let d = 1; d <= lastElapsedDay; d++) {
    const rec = dayMap.get(d)
    if (rec?.completed) {
      runningStreak += 1
      longest = Math.max(longest, runningStreak)
    } else {
      // A past, non-completed day breaks the streak — unless it's "today" and still in progress
      const isToday = d === currentDay
      if (isToday) {
        // Don't penalize yet; today isn't over
        break
      }
      runningStreak = 0
    }
  }

  streak = runningStreak
  return { streak, longestStreak: longest }
}

/**
 * Applies streak recalculation to a student doc in-place and returns it (not saved).
 */
export function applyStreak(student, now = new Date()) {
  const { streak, longestStreak } = recalculateStreak(student, now)
  student.streak = streak
  student.longestStreak = longestStreak
  student.lastStreakCheckDate = now
  return student
}