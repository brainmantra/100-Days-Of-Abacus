import { Router } from 'express'
import Student from '../models/Student.js'
import { getWeekStart, getWeekLabel } from '../utils/dateHelpers.js'

const router = Router()

// ── Weekly leaderboard: ranks students by accuracy (desc) then avg time (asc) ──
router.get('/weekly', async (req, res) => {
  try {
    const { level } = req.query
    const weekStart = getWeekStart()

    const match = {}
    if (level) match.level = level

    const students = await Student.find(match).lean()

    const leaders = students
      .map(s => {
        const weekDays = s.days.filter(d =>
          d.completed && d.completedAt && new Date(d.completedAt) >= weekStart &&
          typeof d.accuracy === 'number'
        )
        if (weekDays.length === 0) return null

        const avgAccuracy = weekDays.reduce((sum, d) => sum + d.accuracy, 0) / weekDays.length
        const timedDays = weekDays.filter(d => typeof d.timeTakenSeconds === 'number')
        const avgTime = timedDays.length
          ? timedDays.reduce((sum, d) => sum + d.timeTakenSeconds, 0) / timedDays.length
          : null

        return {
          _id: s._id,
          name: s.name,
          level: s.level,
          accuracy: Math.round(avgAccuracy),
          avgTime: avgTime !== null ? Math.round(avgTime) : '–',
          daysCompletedThisWeek: weekDays.length,
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy
        const at = typeof a.avgTime === 'number' ? a.avgTime : Infinity
        const bt = typeof b.avgTime === 'number' ? b.avgTime : Infinity
        return at - bt
      })

    res.json({
      leaders,
      weekLabel: getWeekLabel(),
    })
  } catch (err) {
    console.error('Leaderboard error:', err)
    res.status(500).json({ message: 'Server error fetching leaderboard' })
  }
})

export default router