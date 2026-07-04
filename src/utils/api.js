import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || '/api'

// ── Student API ────────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: BASE, timeout: 15000 })

api.interceptors.request.use(config => {
  const stored = localStorage.getItem('abacus_student')
  if (stored) {
    try {
      const { id } = JSON.parse(stored)
      if (id) config.headers['x-student-id'] = id
    } catch { /* ignore */ }
  }
  return config
})

// ── Admin API (JWT Bearer token) ──────────────────────────────────────────────
export const adminApi = axios.create({ baseURL: BASE, timeout: 15000 })

adminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('abacus_admin_token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

// ── Teacher API (JWT Bearer token) ────────────────────────────────────────────
export const teacherApi = axios.create({ baseURL: BASE, timeout: 15000 })

teacherApi.interceptors.request.use(config => {
  const token = localStorage.getItem('abacus_teacher_token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

export default api
