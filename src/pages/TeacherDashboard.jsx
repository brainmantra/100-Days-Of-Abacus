import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { teacherApi } from '../utils/api'
import toast from 'react-hot-toast'

const LEVELS = ['l1','l2','l3','l4','l5','l6','l7','l8']
const LEVEL_LABELS = { l1:'Level 1',l2:'Level 2',l3:'Level 3',l4:'Level 4',l5:'Level 5',l6:'Level 6',l7:'Level 7',l8:'Level 8' }
const FIFTH_DAYS = Array.from({length: 20}, (_, i) => (i+1)*5)

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const [teacher, setTeacher] = useState(null)
  const [tab, setTab] = useState('levels')
  const [levels, setLevels] = useState([])
  const [students, setStudents] = useState([])
  const [activity, setActivity] = useState([])
  const [fifthDays, setFifthDays] = useState([])
  const [loading, setLoading] = useState(true)

  // Question Editor state
  const [qLevel, setQLevel] = useState('')
  const [qDay, setQDay] = useState('')
  const [qSection, setQSection] = useState('teacher_day')
  const [qText, setQText] = useState('')
  const [qAnswer, setQAnswer] = useState('')
  const [qSaving, setQSaving] = useState(false)
  const [savedQuestions, setSavedQuestions] = useState([])
  const [loadingQ, setLoadingQ] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('abacus_teacher')
    if (!stored) { navigate('/teacher'); return }
    const t = JSON.parse(stored)
    setTeacher(t)
    if (t.assigned_levels?.length) setQLevel(t.assigned_levels[0])
    loadData()
  }, [navigate])

  const loadData = async () => {
    try {
      const [lvRes, stuRes, actRes, fifthRes] = await Promise.all([
        teacherApi.get('/teachers/levels'),
        teacherApi.get('/teachers/students'),
        teacherApi.get('/teachers/activity'),
        teacherApi.get('/teachers/fifth-days'),
      ])
      setLevels(lvRes.data)
      setStudents(stuRes.data)
      setActivity(actRes.data)
      setFifthDays(fifthRes.data)
    } catch (err) {
      if (err.response?.status === 401) { navigate('/teacher'); return }
      toast.error('Could not load data.')
    } finally {
      setLoading(false)
    }
  }

  const loadQuestions = async () => {
    if (!qLevel) return
    setLoadingQ(true)
    try {
      const params = new URLSearchParams({ level: qLevel })
      if (qDay) params.append('day_number', qDay)
      const res = await teacherApi.get(`/teachers/questions?${params}`)
      setSavedQuestions(res.data)
    } catch {
      toast.error('Could not fetch questions.')
    } finally {
      setLoadingQ(false)
    }
  }

  useEffect(() => {
    if (tab === 'editor') loadQuestions()
  }, [tab, qLevel, qDay])

  const handleSaveQuestion = async (e) => {
    e.preventDefault()
    if (!qLevel || !qDay || !qText || !qAnswer) return toast.error('All fields required.')
    setQSaving(true)
    try {
      await teacherApi.post('/teachers/questions', {
        level: qLevel, day_number: parseInt(qDay), section: qSection,
        question: qText, answer: qAnswer,
      })
      toast.success('Question saved!')
      setQText(''); setQAnswer('')
      loadQuestions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save.')
    } finally {
      setQSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('abacus_teacher_token')
    localStorage.removeItem('abacus_teacher')
    navigate('/teacher')
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Loading...</p></div>

  const NAV = [
    { id: 'levels',   icon: '🎓', label: 'My Levels' },
    { id: 'editor',   icon: '✏',  label: 'Question Editor' },
    { id: 'students', icon: '👥',  label: 'Student Progress' },
    { id: 'activity', icon: '📋',  label: 'My Activity' },
  ]

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <h2 style={{ color: 'var(--teacher-primary)' }}>👨‍🏫 Teacher Portal</h2>
          <p>{teacher?.name}</p>
          <p style={{ fontSize: '0.7rem', marginTop: 2 }}>{teacher?.assigned_levels?.map(l => LEVEL_LABELS[l]).join(', ')}</p>
        </div>
        {NAV.map(n => (
          <button key={n.id}
            className={`admin-nav-item teacher-nav-item ${tab === n.id ? 'active' : ''}`}
            onClick={() => setTab(n.id)}
          >
            <span>{n.icon}</span> {n.label}
          </button>
        ))}
        <div style={{ position: 'absolute', bottom: '1.5rem', width: '100%', padding: '0 1rem' }}>
          <button className="btn btn-ghost btn-sm btn-block" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">

        {/* MY LEVELS */}
        {tab === 'levels' && (
          <div className="animate-slide-up">
            <h1 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>My Levels</h1>

            {/* Pending 5th-day alerts */}
            {levels.some(l => l.pendingFifthDays?.length > 0) && (
              <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
                <span>⚠️</span>
                <div>
                  <strong>Pending 5th-day questions:</strong>{' '}
                  {levels.flatMap(l =>
                    (l.pendingFifthDays || []).map(d => `${LEVEL_LABELS[l.level]} Day ${d}`)
                  ).join(', ')}
                  <br />
                  <span style={{ fontSize: '0.85rem' }}>Submit before midnight on each day.</span>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {levels.map(l => (
                <div key={l.level} className="card" style={{ borderColor: 'rgba(0,180,216,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ color: 'var(--teacher-primary)' }}>{LEVEL_LABELS[l.level]}</h3>
                    <span className="badge badge-info">{l.studentCount} students</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="report-metric" style={{ flex: 1 }}>
                      <div className="report-metric__val" style={{ fontSize: '1.5rem', color: 'var(--teacher-primary)' }}>{l.activeToday}</div>
                      <div className="report-metric__label">Active today</div>
                    </div>
                    <div className="report-metric" style={{ flex: 1 }}>
                      <div className="report-metric__val" style={{ fontSize: '1.5rem', color: 'var(--warning)' }}>{l.pendingFifthDays?.length ?? 0}</div>
                      <div className="report-metric__label">Pending 5th days</div>
                    </div>
                  </div>
                  {(l.pendingFifthDays?.length > 0) && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--warning)' }}>
                      ⚠ Days needing questions: {l.pendingFifthDays.join(', ')}
                    </div>
                  )}
                  <button
                    className="btn btn-sm btn-block"
                    style={{ marginTop: '1rem', background: 'rgba(0,180,216,0.15)', color: 'var(--teacher-primary)', border: '1px solid rgba(0,180,216,0.3)' }}
                    onClick={() => { setQLevel(l.level); setTab('editor') }}
                  >
                    Open Question Editor →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUESTION EDITOR */}
        {tab === 'editor' && (
          <div className="animate-slide-up">
            <h1 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>Question Editor</h1>

            {/* Filter row */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Level</label>
                  <select value={qLevel} onChange={e => setQLevel(e.target.value)}>
                    <option value="">Select level</option>
                    {(teacher?.assigned_levels || []).map(l => (
                      <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Day Number</label>
                  <input type="number" min="1" max="100" value={qDay} onChange={e => setQDay(e.target.value)} placeholder="e.g. 5" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Section</label>
                  <select value={qSection} onChange={e => setQSection(e.target.value)}>
                    <option value="teacher_day">🌟 Teacher Day (5th-day)</option>
                    <option value="teacher_input">👨‍🏫 Teacher Input</option>
                    <option value="tables">📋 Tables</option>
                    <option value="form_the_question">✏ Form The Question</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 5th-day guidance */}
            {qSection === 'teacher_day' && (
              <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
                <span>📅</span>
                <div>
                  <strong>Every-5th-day questions:</strong> Days 5, 10, 15, 20… 100 need a question submitted before midnight.
                  {fifthDays.filter(f => f.level === qLevel).length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                      Status for {LEVEL_LABELS[qLevel]}:{' '}
                      {fifthDays.filter(f => f.level === qLevel).map(f => (
                        <span key={f.day_number} style={{ marginRight: '0.5rem', color: f.submitted ? 'var(--success)' : 'var(--warning)' }}>
                          Day {f.day_number}: {f.submitted ? '✓' : '⏳'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Question form */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Add / Update Question</h3>
              <form onSubmit={handleSaveQuestion}>
                <div className="form-group">
                  <label className="form-label">Question Text</label>
                  <textarea
                    rows={3} placeholder="e.g. What is 7 × 8?"
                    value={qText} onChange={e => setQText(e.target.value)}
                    style={{ resize: 'vertical', minHeight: 80 }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Correct Answer</label>
                  <input
                    type="text" placeholder="e.g. 56"
                    value={qAnswer} onChange={e => setQAnswer(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-teacher" disabled={qSaving}>
                  {qSaving ? <><div className="spinner spinner-sm" /> Saving...</> : '💾 Save Question'}
                </button>
              </form>
            </div>

            {/* Saved questions */}
            <div>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                Saved Questions {qLevel && `(${LEVEL_LABELS[qLevel]})`}
              </h3>
              {loadingQ ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <div className="spinner" />
                </div>
              ) : savedQuestions.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  No saved questions yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {savedQuestions.map(q => (
                    <div key={q.id} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                          <span className="badge badge-info">Day {q.day_number}</span>
                          <span className="badge badge-muted">{q.section}</span>
                        </div>
                        <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{q.question}</p>
                        <p style={{ color: 'var(--success)', fontSize: '0.85rem' }}>Answer: {q.answer}</p>
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setQLevel(q.level); setQDay(String(q.day_number)); setQSection(q.section); setQText(q.question); setQAnswer(q.answer) }}
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STUDENT PROGRESS */}
        {tab === 'students' && (
          <div className="animate-slide-up">
            <h1 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>Student Progress</h1>
            <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Level</th><th>Days Done</th><th>Streak</th><th>XP</th><th>Last Active</th></tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td><span className="badge badge-info">{LEVEL_LABELS[s.level] || s.level}</span></td>
                      <td>{s.days_completed ?? 0}</td>
                      <td><span style={{ color: 'var(--warning)' }}>🔥 {s.streak}</span></td>
                      <td><span style={{ color: 'var(--accent-gold)' }}>⚡ {s.xp_total}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {s.last_active ? new Date(s.last_active).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No students yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MY ACTIVITY */}
        {tab === 'activity' && (
          <div className="animate-slide-up">
            <h1 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>My Activity</h1>
            <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Action</th><th>Level</th><th>Day</th><th>Section</th><th>Timestamp</th></tr>
                </thead>
                <tbody>
                  {activity.map(a => (
                    <tr key={a.id}>
                      <td><span className="badge badge-primary">{a.action.replace(/_/g, ' ')}</span></td>
                      <td>{a.level || '—'}</td>
                      <td>{a.day_number || '—'}</td>
                      <td>{a.section || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(a.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {activity.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No activity yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
