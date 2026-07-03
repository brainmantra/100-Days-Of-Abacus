import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as xlsx from 'xlsx'
import api from '../utils/api'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('upload') // 'upload' or 'responses'
  const navigate = useNavigate()

  // For Upload Tab
  const [level, setLevel] = useState('1')
  const [day, setDay] = useState(1)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  // For Responses Tab
  const [responses, setResponses] = useState([])
  const [loadingRes, setLoadingRes] = useState(false)
  const [filterLevel, setFilterLevel] = useState('')
  const [filterDay, setFilterDay] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      navigate('/admin')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/admin')
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Please select an Excel file')
    
    setUploading(true)
    const formData = new FormData()
    formData.append('level', level)
    formData.append('day_number', day)
    formData.append('file', file)

    try {
      const token = localStorage.getItem('adminToken')
      const res = await api.post('/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      })
      toast.success(res.data.message)
      setFile(null)
      e.target.reset()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error uploading file')
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    const fetchResponses = async () => {
      setLoadingRes(true)
      try {
        const token = localStorage.getItem('adminToken')
        const params = new URLSearchParams()
        if (filterLevel) params.append('level', filterLevel)
        if (filterDay) params.append('day_number', filterDay)

        const res = await api.get(`/admin/responses?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        setResponses(res.data)
      } catch (err) {
        toast.error('Failed to fetch responses')
      } finally {
        setLoadingRes(false)
      }
    }

    if (activeTab === 'responses') {
      fetchResponses()
    }
  }, [activeTab, filterLevel, filterDay])

  const exportToExcel = () => {
    if (responses.length === 0) return toast.error('No data to export')
    
    const worksheet = xlsx.utils.json_to_sheet(responses.map(r => ({
      Name: r.name,
      Mobile: r.mobile,
      Level: r.level,
      Day: r.day_number,
      'Accuracy %': r.accuracy,
      'Time (s)': r.time_taken_seconds,
      Completed: new Date(r.completed_at).toLocaleString()
    })))
    
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Responses')
    xlsx.writeFile(workbook, `Abacus_Responses.xlsx`)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--navy)' }}>Admin Dashboard</h1>
        <button onClick={handleLogout} className="btn btn-ghost" style={{ border: '1px solid #ccc' }}>Logout</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          className={activeTab === 'upload' ? 'btn btn-primary' : 'btn btn-ghost'} 
          onClick={() => setActiveTab('upload')}
          style={activeTab !== 'upload' ? { border: '1px solid #ccc' } : {}}
        >
          Upload Questions
        </button>
        <button 
          className={activeTab === 'responses' ? 'btn btn-primary' : 'btn btn-ghost'} 
          onClick={() => setActiveTab('responses')}
          style={activeTab !== 'responses' ? { border: '1px solid #ccc' } : {}}
        >
          View Responses
        </button>
      </div>

      {activeTab === 'upload' && (
        <div style={{ background: '#f5f7fa', padding: '2rem', borderRadius: '12px' }}>
          <h2 style={{ marginBottom: '1rem' }}>Upload Excel Questions</h2>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>
            Excel Columns Required: <strong>Question</strong>, <strong>Type</strong> (math/steps), <strong>Answer</strong>. Optional: <strong>Format Example</strong>
          </p>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Level</label>
                <select value={level} onChange={e => setLevel(e.target.value)} style={{ width: '100%', padding: '0.5rem' }}>
                  {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>Level {i+1}</option>)}
                  <option value="beginner">Beginner</option>
                  <option value="elementary">Elementary</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Day Number</label>
                <input type="number" min="1" max="100" value={day} onChange={e => setDay(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Excel File (.xlsx)</label>
              <input type="file" accept=".xlsx,.xls" onChange={e => setFile(e.target.files[0])} style={{ padding: '0.5rem', background: '#fff', width: '100%' }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Questions'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'responses' && (
        <div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>Filter by Level</label>
              <input type="text" placeholder="e.g. 1" value={filterLevel} onChange={e => setFilterLevel(e.target.value)} style={{ padding: '0.5rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>Filter by Day</label>
              <input type="number" placeholder="e.g. 15" value={filterDay} onChange={e => setFilterDay(e.target.value)} style={{ padding: '0.5rem' }} />
            </div>
            <button className="btn btn-primary" onClick={exportToExcel} style={{ marginLeft: 'auto' }}>
              Export to Excel
            </button>
          </div>

          {loadingRes ? <p>Loading...</p> : (
            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f5f7fa', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px' }}>Name</th>
                    <th style={{ padding: '12px' }}>Mobile</th>
                    <th style={{ padding: '12px' }}>Level</th>
                    <th style={{ padding: '12px' }}>Day</th>
                    <th style={{ padding: '12px' }}>Accuracy</th>
                    <th style={{ padding: '12px' }}>Time (s)</th>
                    <th style={{ padding: '12px' }}>Completed At</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>{r.name}</td>
                      <td style={{ padding: '12px' }}>{r.mobile}</td>
                      <td style={{ padding: '12px' }}>{r.level}</td>
                      <td style={{ padding: '12px' }}>{r.day_number}</td>
                      <td style={{ padding: '12px' }}>{r.accuracy}%</td>
                      <td style={{ padding: '12px' }}>{r.time_taken_seconds}s</td>
                      <td style={{ padding: '12px', fontSize: '0.9rem', color: '#666' }}>{new Date(r.completed_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {responses.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#666' }}>No responses found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
