import cron from 'node-cron'
import Student from '../models/Student.js'
import { applyStreak } from '../utils/streak.js'

/**
 * Runs every night at 00:05 (server time). For every active student, recalculates
 * their streak so that a day which elapsed without completion breaks the streak —
 * this also effectively "locks" any day link that was opened but never submitted,
 * since the frontend's isDayToday() check will naturally mark that day as past.
 */
export function startStreakCron() {
  cron.schedule('5 0 * * *', async () => {
    console.log('[cron] Running nightly streak recalculation…')
    try {
      const students = await Student.find({})
      let updated = 0
      for (const student of students) {
        const before = student.streak
        applyStreak(student)
        if (student.streak !== before) updated++
        await student.save()
      }
      console.log(`[cron] Streak recalculation complete. ${updated} streak(s) changed.`)
    } catch (err) {
      console.error('[cron] Streak recalculation failed:', err)
    }
  })
  console.log('[cron] Nightly streak job scheduled for 00:05')
}