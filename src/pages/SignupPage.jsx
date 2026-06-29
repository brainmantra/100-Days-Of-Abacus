import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LEVELS, REGISTRATION_FORM_URL } from '../utils/formsConfig'
import api from '../utils/api'
import toast from 'react-hot-toast'
import './SignupPage.css'

export default function SignupPage() {
  const { login, student } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('register') // 'register' | 'login'
  const [form, setForm] = useState({ name: '', mobile: '', level: '' })
  const [loginMobile, setLoginMobile] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Already logged in
  if (student) {
    navigate('/challenge', { replace: true })
    return null
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = 'Enter a valid 10-digit mobile number'
    if (!form.level) e.level = 'Please select your level'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await api.post('/students/register', {
        name: form.name.trim(),
        mobile: form.mobile,
        level: form.level,
      })
      login(res.data.student)
      toast.success(`Welcome, ${res.data.student.name}! 🎉`)
      navigate('/welcome')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.'
      if (err.response?.status === 409) {
        toast.error('This mobile number is already registered. Please log in.')
        setTab('login')
        setLoginMobile(form.mobile)
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!/^[6-9]\d{9}$/.test(loginMobile)) {
      toast.error('Enter a valid 10-digit mobile number')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/students/login', { mobile: loginMobile })
      login(res.data.student)
      toast.success(`Welcome back, ${res.data.student.name}!`)
      navigate('/welcome')
    } catch (err) {
      const status = err.response?.status
      if (status === 404) {
        toast.error('No account found. Please register first.')
        setTab('register')
      } else {
        toast.error('Login failed. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-page">
      {/* Background abacus beads decoration */}
      <div className="bead-row bead-row--top" aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className={`deco-bead deco-bead--${i % 3}`} style={{ '--delay': `${i * 0.15}s` }} />
        ))}
      </div>

      <div className="signup-layout">
        {/* Left brand panel */}
        <div className="signup-brand animate-fade">
          <div className="brand-logo">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              {/* Stylized abacus icon */}
              <rect width="52" height="52" rx="14" fill="#f5a623"/>
              <rect x="10" y="14" width="32" height="3" rx="1.5" fill="#1a2340"/>
              <rect x="10" y="24.5" width="32" height="3" rx="1.5" fill="#1a2340"/>
              <rect x="10" y="35" width="32" height="3" rx="1.5" fill="#1a2340"/>
              <circle cx="19" cy="15.5" r="5" fill="#1a2340"/>
              <circle cx="29" cy="26" r="5" fill="#1a2340"/>
              <circle cx="22" cy="36.5" r="5" fill="#1a2340"/>
              <circle cx="35" cy="15.5" r="5" fill="white" opacity="0.5"/>
              <circle cx="14" cy="26" r="5" fill="white" opacity="0.5"/>
              <circle cx="36" cy="36.5" r="5" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <h1 className="brand-title">100 Days of<br/>Abacus</h1>
          <p className="brand-tagline">Build lightning-fast mental math skills, one day at a time.</p>
          <div className="brand-stats">
            <div className="stat"><span className="stat-num">100</span><span className="stat-label">Daily challenges</span></div>
            <div className="stat"><span className="stat-num">5</span><span className="stat-label">Skill levels</span></div>
            <div className="stat"><span className="stat-num">🔥</span><span className="stat-label">Daily streaks</span></div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="signup-form-panel animate-pop" style={{ animationDelay: '0.1s' }}>
          <div className="signup-tabs">
            <button
              className={`signup-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => setTab('register')}
            >New Student</button>
            <button
              className={`signup-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => setTab('login')}
            >Already Enrolled</button>
          </div>

          {tab === 'register' ? (
            <form onSubmit={handleRegister} noValidate>
              <h2 className="form-title">Start your journey</h2>
              <p className="form-subtitle">Fill in your details to begin the 100-day challenge.</p>

              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  className="form-input"
                  type="text"
                  placeholder="e.g. Aryan Sharma"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mobile">Mobile Number</label>
                <input
                  id="mobile"
                  className="form-input"
                  type="tel"
                  placeholder="10-digit mobile"
                  maxLength={10}
                  value={form.mobile}
                  onChange={e => setForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, '') }))}
                />
                {errors.mobile && <span className="form-error">{errors.mobile}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="level">Current Level</label>
                <select
                  id="level"
                  className="form-input form-select"
                  value={form.level}
                  onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                >
                  <option value="">Select your level…</option>
                  {LEVELS.map(l => (
                    <option key={l.id} value={l.id}>{l.label} — {l.description}</option>
                  ))}
                </select>
                {errors.level && <span className="form-error">{errors.level}</span>}
              </div>

              <button type="submit" className="btn btn-primary signup-submit" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : null}
                {loading ? 'Registering…' : 'Start the Challenge →'}
              </button>

              <p className="signup-note">
                By registering, your data is stored securely on our servers.<br/>
                Already filled in our <a href={REGISTRATION_FORM_URL} target="_blank" rel="noopener noreferrer" className="signup-link">registration form</a>? Use "Already Enrolled" tab.
              </p>
            </form>
          ) : (
            <form onSubmit={handleLogin} noValidate>
              <h2 className="form-title">Welcome back!</h2>
              <p className="form-subtitle">Enter your mobile number to continue where you left off.</p>

              <div className="form-group" style={{ marginBottom: 28 }}>
                <label className="form-label" htmlFor="login-mobile">Mobile Number</label>
                <input
                  id="login-mobile"
                  className="form-input"
                  type="tel"
                  placeholder="Registered mobile number"
                  maxLength={10}
                  value={loginMobile}
                  onChange={e => setLoginMobile(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <button type="submit" className="btn btn-primary signup-submit" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : null}
                {loading ? 'Checking…' : 'Continue Challenge →'}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="bead-row bead-row--bottom" aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className={`deco-bead deco-bead--${(i + 1) % 3}`} style={{ '--delay': `${i * 0.12}s` }} />
        ))}
      </div>
    </div>
  )
}