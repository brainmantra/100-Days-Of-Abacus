import { Router } from 'express'
import Student from '../models/Student.js'
import { getChallengeDay, isSameCalendarDay } from '../utils/dateHelpers.js'
import { applyStreak } from '../utils/streak.js'
import { findInRegistrationSheet } from '../utils/googleSheet.js'

const router = Router()
const VALID_LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert']

// ── Register a new student ──────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, mobile, level } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' })
    if (!/^\d{10}$/.test(mobile || '')) return res.status(400).json({ message: 'Valid 10-digit mobile number is required' })
    if (!VALID_LEVELS.includes(level)) return res.status(400).json({ message: 'Invalid level' })

    const existing = await Student.findOne({ mobile })
    if (existing) {
      return res.status(409).json({ message: 'This mobile number is already registered' })
    }

    const student = await Student.create({
      name: name.trim(),
      mobile,
      level,
      registrationDate: new Date(),
    })

    res.status(201).json({ student })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ message: 'Server error during registration' })
  }
})

// ── Login (lookup by mobile) ────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { mobile } = req.body
    if (!/^\d{10}$/.test(mobile || '')) {
      return res.status(400).json({ message: 'Valid 10-digit mobile number is required' })
    }

    let student = await Student.findOne({ mobile })

    // Fallback: check the Google Form's published sheet, auto-import if found there
    if (!student && process.env.REGISTRATION_SHEET_CSV_URL) {
      try {
        const sheetRow = await findInRegistrationSheet(process.env.REGISTRATION_SHEET_CSV_URL, mobile)
        if (sheetRow && VALID_LEVELS.includes(sheetRow.level)) {
          student = await Student.create({
            name: sheetRow.name || 'Student',
            mobile,
            level: sheetRow.level,
            registrationDate: sheetRow.timestamp ? new Date(sheetRow.timestamp) : new Date(),
          })
        }
      } catch (sheetErr) {
        console.error('Sheet lookup failed:', sheetErr.message)
      }
    }

    if (!student) {
      return res.status(404).json({ message: 'No registration found for this mobile number' })
    }

    res.json({ student })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Server error during login' })
  }
})

// ── Get a student by ID (used to re-verify session on app load) ────────
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return res.status(404).json({ message: 'Student not found' })
    res.json(student)
  } catch (err) {
    res.status(400).json({ message: 'Invalid student id' })
  }
})

// ── Get full progress (all days + streak) ───────────────────────────────
router.get('/:id/progress', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return res.status(404).json({ message: 'Student not found' })

    applyStreak(student)
    await student.save()

    res.json({
      days: student.days,
      streak: student.streak,
      longestStreak: student.longestStreak,
      currentDay: getChallengeDay(student.registrationDate),
    })
  } catch (err) {
    console.error('Progress fetch error:', err)
    res.status(500).json({ message: 'Server error fetching progress' })
  }
})

// ── Get a single day's record ───────────────────────────────────────────
router.get('/:id/progress/:dayNumber', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return res.status(404).json({ message: 'Student not found' })

    const dayNumber = parseInt(req.params.dayNumber, 10)
    const record = student.days.find(d => d.dayNumber === dayNumber) || null
    res.json(record)
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching day' })
  }
})

// ── Mark a day as "opened" (one-time link consumption) ──────────────────
router.post('/:id/progress/:dayNumber/open', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return res.status(404).json({ message: 'Student not found' })

    const dayNumber = parseInt(req.params.dayNumber, 10)
    const currentDay = getChallengeDay(student.registrationDate)

    if (dayNumber !== currentDay) {
      return res.status(403).json({ message: 'This day is not currently active' })
    }

    let record = student.days.find(d => d.dayNumber === dayNumber)
    if (record?.opened) {
      return res.status(409).json({ message: 'This day has already been opened' })
    }

    if (!record) {
      record = { dayNumber, opened: true, openedAt: new Date(), completed: false }
      student.days.push(record)
    } else {
      record.opened = true
      record.openedAt = new Date()
    }

    await student.save()
    res.json(record)
  } catch (err) {
    console.error('Open day error:', err)
    res.status(500).json({ message: 'Server error opening day' })
  }
})

// ── Mark a day as "completed" (after form submission confirmation) ──────
router.post('/:id/progress/:dayNumber/complete', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return res.status(404).json({ message: 'Student not found' })

    const dayNumber = parseInt(req.params.dayNumber, 10)
    const { accuracy, timeTakenSeconds } = req.body || {}

    let record = student.days.find(d => d.dayNumber === dayNumber)
    if (!record) {
      return res.status(400).json({ message: 'Day must be opened before it can be completed' })
    }
    record.completed = true
    record.completedAt = new Date()
    if (typeof accuracy === 'number') record.accuracy = accuracy
    if (typeof timeTakenSeconds === 'number') record.timeTakenSeconds = timeTakenSeconds

    applyStreak(student)
    await student.save()

    res.json(record)
  } catch (err) {
    console.error('Complete day error:', err)
    res.status(500).json({ message: 'Server error completing day' })
  }
})

export default router