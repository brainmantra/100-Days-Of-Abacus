import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isDayToday } from '../utils/dateUtils'
import { getFormUrl } from '../utils/formsConfig'
import api from '../utils/api'
import toast from 'react-hot-toast'
import './DayModal.css'

/**
 * Flow:
 * 1. On mount, verify this day is today and not already opened/completed.
 * 2. If valid -> show a "Ready to start?" confirmation (since opening = consuming the one-time link).
 * 3. On confirm -> mark day as "opened" on backend, then render the embedded Google Form.
 * 4. We cannot directly detect Google Form submission from a cross-origin iframe (no postMessage
 *    access by default), so we ask the student to click "I've submitted the form" which marks
 *    completed=true. We also detect a likely submission via the iframe's afterSubmit param trick
 *    when possible (see handleIframeLoad heuristic comment below).
 */
export default function DayModal() {
  const { dayNumber } = useParams()
  const dayNum = parseInt(dayNumber, 10)
  const { student } = useAuth()
  const navigate = useNavigate()

  const [phase, setPhase] = useState('checking') // checking | blocked | confirm | form | submitted | error
  const [dayRecord, setDayRecord] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const iframeRef = useRef(null)
  const loadCountRef = useRef(0)

  const formUrl = getFormUrl(student?.level, dayNum)

  useEffect(() => {
    let mounted = true
    async function check() {
      if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 100) {
        setPhase('error')
        return
      }
      const today = isDayToday(student.registrationDate, dayNum)
      try {
        const res = await api.get(`/students/${student._id}/progress/${dayNum}`)
        if (!mounted) return
        const record = res.data || null
        setDayRecord(record)

        if (record?.completed) {
          setPhase('submitted')
          return
        }
        if (!today) {
          // Past or future day — show informational blocked screen
          setPhase('blocked')
          return
        }
        if (record?.opened) {
          // Already opened today but not submitted — link is "used up", cannot reopen the form
          setPhase('blocked')
          return
        }
        setPhase('confirm')
      } catch (err) {
        if (!mounted) return
        toast.error('Could not verify this day. Please try again.')
        setPhase('error')
      }
    }
    check()
    return () => { mounted = false }
  }, [dayNum, student])

  const handleStart = async () => {
    setSubmitting(true)
    try {
      await api.post(`/students/${student._id}/progress/${dayNum}/open`)
      setPhase('form')
    } catch (err) {
      toast.error('Could not start this day. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmSubmitted = async () => {
    setSubmitting(true)
    try {
      const res = await api.post(`/students/${student._id}/progress/${dayNum}/complete`)
      setDayRecord(res.data)
      setPhase('submitted')
      toast.success('Day marked complete! 🎉')
    } catch (err) {
      toast.error('Could not confirm submission. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Heuristic: Google Forms appends "formResponse" or shows a "Your response has been recorded"
  // page after submit, but cross-origin iframes block reading that content. Counting iframe loads
  // (form loads once initially, and Google often reloads internally to its confirmation page after
  // submit) gives a soft hint, but we still require explicit confirmation for accuracy.
  const handleIframeLoad = () => {
    loadCountRef.current += 1
  }

  const handleClose = () => navigate('/challenge')

  if (phase === 'checking') {
    return (
      <div className="day-modal-overlay">
        <div className="day-modal-loading"><div className="spinner" /></div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="day-modal-overlay" onClick={handleClose}>
        <div className="day-modal-card animate-pop" onClick={e => e.stopPropagation()}>
          <h2 className="day-modal-title">Something went wrong</h2>
          <p className="day-modal-text">We couldn't load Day {dayNum}. Please go back and try again.</p>
          <button className="btn btn-primary" onClick={handleClose}>Back to Challenge</button>
        </div>
      </div>
    )
  }

  if (phase === 'blocked') {
    const today = isDayToday(student.registrationDate, dayNum)
    const missedNotSubmitted = !today && dayRecord?.opened && !dayRecord?.completed
    const neverOpened = !today && !dayRecord?.opened

    return (
      <div className="day-modal-overlay" onClick={handleClose}>
        <div className="day-modal-card animate-pop" onClick={e => e.stopPropagation()}>
          <div className="day-modal-icon day-modal-icon--warn">⚠</div>
          <h2 className="day-modal-title">Day {dayNum} is unavailable</h2>
          {today && dayRecord?.opened && (
            <p className="day-modal-text">
              You've already opened today's questionnaire. It can only be accessed once.
              {dayRecord?.completed ? '' : ' If you haven\'t submitted it yet, please do so from the tab where you opened it.'}
            </p>
          )}
          {missedNotSubmitted && (
            <p className="day-modal-text">
              You opened this day's challenge but didn't submit it in time. The link is now locked.
              Don't worry — keep going with today's challenge to rebuild your streak!
            </p>
          )}
          {neverOpened && (
            <p className="day-modal-text">
              This day has passed and you didn't attempt it. The link is locked, but you can see it here for your records.
            </p>
          )}
          <button className="btn btn-primary" onClick={handleClose}>Back to Challenge</button>
        </div>
      </div>
    )
  }

  if (phase === 'confirm') {
    return (
      <div className="day-modal-overlay" onClick={handleClose}>
        <div className="day-modal-card animate-pop" onClick={e => e.stopPropagation()}>
          <div className="day-modal-icon day-modal-icon--ready">🧮</div>
          <h2 className="day-modal-title">Ready for Day {dayNum}?</h2>
          <p className="day-modal-text">
            This link can only be opened <strong>once</strong>. Make sure you're ready to focus —
            once you start, you won't be able to come back to this question set later.
          </p>
          <div className="day-modal-actions">
            <button className="btn btn-ghost" onClick={handleClose} disabled={submitting}>Not yet</button>
            <button className="btn btn-primary" onClick={handleStart} disabled={submitting}>
              {submitting ? 'Starting…' : "I'm ready, start →"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'submitted') {
    return (
      <div className="day-modal-overlay" onClick={handleClose}>
        <div className="day-modal-card animate-pop" onClick={e => e.stopPropagation()}>
          <div className="day-modal-icon day-modal-icon--done">✓</div>
          <h2 className="day-modal-title">Day {dayNum} Completed!</h2>
          <p className="day-modal-text">Great job! Your response has been recorded. Come back tomorrow for Day {dayNum + 1}.</p>
          <button className="btn btn-primary" onClick={handleClose}>Back to Challenge</button>
        </div>
      </div>
    )
  }

  // phase === 'form'
  return (
    <div className="day-modal-overlay day-modal-overlay--form">
      <div className="day-modal-form-card animate-pop">
        <div className="day-modal-form-header">
          <h3>Day {dayNum} Questionnaire</h3>
          <span className="badge badge-amber">In Progress</span>
        </div>

        <div className="day-modal-iframe-wrap">
          {formUrl ? (
            <iframe
              ref={iframeRef}
              src={formUrl}
              title={`Day ${dayNum} Form`}
              onLoad={handleIframeLoad}
              className="day-modal-iframe"
            >
              Loading form…
            </iframe>
          ) : (
            <div className="day-modal-text" style={{ padding: 40, textAlign: 'center' }}>
              No form configured for this level yet. Please contact your instructor.
            </div>
          )}
        </div>

        <div className="day-modal-form-footer">
          <p className="day-modal-form-hint">
            Once you've submitted the form above, click the button below to mark this day complete.
          </p>
          <button className="btn btn-primary" onClick={handleConfirmSubmitted} disabled={submitting}>
            {submitting ? 'Confirming…' : "I've submitted the form ✓"}
          </button>
        </div>
      </div>
    </div>
  )
}