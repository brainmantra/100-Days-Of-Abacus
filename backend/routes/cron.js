import { Router } from 'express'
import pool from '../db.js'
import { recalculateStreak } from '../utils/streak.js'

const router = Router()

/**
 * GET /api/cron/streak
 * Webhook for Vercel Cron to trigger nightly streak recalculations.
 * Should be called once a day (e.g., at 00:05).
 */
router.get('/streak', async (req, res) => {
  // Optional: Verify Vercel Cron Secret here if needed
  // if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return res.status(401).json({ message: 'Unauthorized' })
  // }

  console.log('[cron] Starting streak recalculation via webhook...')
  try {
    const { rows: students } = await pool.query(
      'SELECT id, registration_date, streak FROM students'
    )
    
    let changed = 0
    for (const s of students) {
      const { streak } = await recalculateStreak(s.id, s.registration_date)
      if (streak !== s.streak) changed++
    }
    
    console.log(`[cron] Done. ${changed} streak(s) updated out of ${students.length} students.`)
    res.json({ message: 'Streak recalculation completed', studentsChecked: students.length, updated: changed })
  } catch (err) {
    console.error('[cron] Streak recalculation failed:', err)
    res.status(500).json({ message: 'Error recalculating streaks' })
  }
})

/**
 * GET /api/cron/migrate
 * Safely adds any missing columns to the production database.
 * Safe to call multiple times (uses ADD COLUMN IF NOT EXISTS).
 */
router.get('/migrate', async (req, res) => {
  try {
    const migrations = [
      `ALTER TABLE students ADD COLUMN IF NOT EXISTS xp_total INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
      `ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
      `ALTER TABLE students ADD COLUMN IF NOT EXISTS streak INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE students ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE students ADD COLUMN IF NOT EXISTS last_streak_check TIMESTAMPTZ`,
      `ALTER TABLE day_records ADD COLUMN IF NOT EXISTS total_marks INTEGER`,
      `ALTER TABLE day_records ADD COLUMN IF NOT EXISTS xp_earned INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE day_records ADD COLUMN IF NOT EXISTS question_times JSONB`,
      `ALTER TABLE day_records ADD COLUMN IF NOT EXISTS answers JSONB`,
      `ALTER TABLE day_records ADD COLUMN IF NOT EXISTS section_data JSONB`,
    ]

    const results = []
    for (const sql of migrations) {
      try {
        await pool.query(sql)
        results.push({ ok: true, sql: sql.slice(0, 60) })
      } catch (e) {
        results.push({ ok: false, sql: sql.slice(0, 60), error: e.message })
      }
    }

    console.log('[cron/migrate] Done:', results)
    res.json({ message: 'Migration complete', results })
  } catch (err) {
    console.error('[cron/migrate] Failed:', err)
    res.status(500).json({ message: 'Migration failed: ' + err.message })
  }
})

export default router
