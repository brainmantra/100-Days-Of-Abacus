/**
 * middleware/auth.js
 * JWT-based authentication middleware for admin and teacher routes.
 */
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'abacus_jwt_secret_change_in_production'

// ── Token helpers ──────────────────────────────────────────────────────────────
export function signAdminToken(admin) {
  return jwt.sign({ role: 'admin', id: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: '8h' })
}

export function signTeacherToken(teacher) {
  return jwt.sign(
    { role: 'teacher', id: teacher.id, email: teacher.email, levels: teacher.assigned_levels },
    JWT_SECRET,
    { expiresIn: '8h' }
  )
}

// ── Extract JWT from Authorization header or cookie ───────────────────────────
function extractToken(req) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  if (req.cookies?.token) return req.cookies.token
  return null
}

// ── Require admin role ────────────────────────────────────────────────────────
export function requireAdmin(req, res, next) {
  const token = extractToken(req)
  if (!token) return res.status(401).json({ message: 'Not authenticated.' })

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (payload.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' })
    req.admin = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

// ── Require teacher role ──────────────────────────────────────────────────────
export function requireTeacher(req, res, next) {
  const token = extractToken(req)
  if (!token) return res.status(401).json({ message: 'Not authenticated.' })

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (payload.role !== 'teacher' && payload.role !== 'admin') {
      return res.status(403).json({ message: 'Teacher access required.' })
    }
    req.teacher = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

// ── Require admin OR teacher ──────────────────────────────────────────────────
export function requireStaff(req, res, next) {
  const token = extractToken(req)
  if (!token) return res.status(401).json({ message: 'Not authenticated.' })

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (payload.role !== 'admin' && payload.role !== 'teacher') {
      return res.status(403).json({ message: 'Staff access required.' })
    }
    req.staff = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}
