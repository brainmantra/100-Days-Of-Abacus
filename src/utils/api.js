import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})

api.interceptors.request.use(config => {
  const stored = localStorage.getItem('abacus_student')
  if (stored) {
    try {
      const { _id } = JSON.parse(stored)
      if (_id) config.headers['x-student-id'] = _id
    } catch {}
  }
  return config
})

export default api