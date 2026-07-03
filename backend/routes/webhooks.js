import { Router } from 'express'
import pool from '../db.js'
import { getChallengeDay } from '../utils/dateHelpers.js'
import { recalculateStreak } from '../utils/streak.js'

const router = Router()

/**
 * POST /api/webhooks/form-submit
 * Receives webhook payloads from Google Apps Script when a student submits a Google Form.
 * Payload should contain { mobile }
 */
router.post('/form-submit', async (req, res) => {
  try {
    let { mobile } = req.body
    
    // Normalize mobile to 10 digits
    mobile = (mobile || '').toString().replace(/\D/g, '').slice(-10)

    if (!mobile || mobile.length !== 10) {
      return res.status(400).json({ message: 'Invalid or missing mobile number' })
    }

    console.log(`[webhook] Received form submission for mobile: ${mobile}`)

    // 1. Find the student
    const { rows: students } = await pool.query('SELECT * FROM students WHERE mobile = $1', [mobile])
    const student = students[0]

    if (!student) {
      console.warn(`[webhook] Unknown mobile number: ${mobile}`)
      return res.status(404).json({ message: 'Student not found' })
    }

    // 2. Find the most recently opened day that isn't completed yet
    const { rows: openDays } = await pool.query(
      `SELECT day_number FROM day_records 
       WHERE student_id = $1 AND opened = TRUE AND completed = FALSE
       ORDER BY day_number DESC LIMIT 1`,
      [student.id]
    )

    if (openDays.length === 0) {
      console.warn(`[webhook] Student ${student.id} submitted form, but has no open, incomplete days.`)
      return res.status(409).json({ message: 'No open incomplete day found' })
    }

    const targetDay = openDays[0].day_number

    // 3. Mark the target day as completed
    await pool.query(
      `UPDATE day_records
          SET completed = TRUE, 
              completed_at = NOW(),
              updated_at = NOW()
        WHERE student_id = $1 AND day_number = $2
        RETURNING *`,
      [student.id, targetDay]
    )

    // 4. Recalculate streak
    await recalculateStreak(student.id, student.registration_date)
    
    console.log(`[webhook] Successfully verified and completed Day ${targetDay} for student ${student.id}`)
    return res.status(200).json({ message: 'Success' })

  } catch (err) {
    console.error('[webhook] Error processing form submission:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
