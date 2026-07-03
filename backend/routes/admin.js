import express from 'express'
import multer from 'multer'
import * as xlsx from 'xlsx'
import pool from '../db.js'

const router = express.Router()

// Configure multer for memory storage (file buffer)
const upload = multer({ storage: multer.memoryStorage() })

// 1. Admin Login
router.post('/login', (req, res) => {
  const { password } = req.body
  const correctPassword = process.env.ADMIN_PASSWORD || 'admin123'
  
  if (password === correctPassword) {
    return res.json({ success: true, token: 'admin-token-xyz' })
  }
  return res.status(401).json({ message: 'Invalid password' })
})

// Middleware to mock check token
const checkAdmin = (req, res, next) => {
  const token = req.headers.authorization
  if (token !== 'Bearer admin-token-xyz') {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  next()
}

// 2. Upload Questions (Excel)
router.post('/upload', checkAdmin, upload.single('file'), async (req, res) => {
  try {
    const { level, day_number } = req.body
    
    if (!level || !day_number || !req.file) {
      return res.status(400).json({ message: 'Missing level, day_number, or file' })
    }

    const dayNum = parseInt(day_number, 10)

    // Read the Excel file buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    
    // Parse into JSON array
    const rows = xlsx.utils.sheet_to_json(sheet)
    
    if (!rows || rows.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty or formatted incorrectly' })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      
      // Delete existing questions for this level and day
      await client.query('DELETE FROM questions WHERE level = $1 AND day_number = $2', [level, dayNum])
      
      // Insert new questions
      // Expected columns: "Question", "Type" (optional, default 'math'), "Answer", "Format Example" (optional)
      const insertQuery = `
        INSERT INTO questions (level, day_number, question_text, question_type, expected_answer, format_example)
        VALUES ($1, $2, $3, $4, $5, $6)
      `
      
      for (const row of rows) {
        const questionText = row['Question'] || row['question']
        const expectedAnswer = row['Answer'] || row['answer']
        
        if (!questionText || expectedAnswer === undefined) {
          continue; // Skip invalid rows
        }

        const type = (row['Type'] || row['type'] || 'math').toLowerCase().trim()
        const formatExample = row['Format Example'] || row['format_example'] || null

        await client.query(insertQuery, [
          level, 
          dayNum, 
          String(questionText).trim(), 
          type, 
          String(expectedAnswer).trim(), 
          formatExample ? String(formatExample).trim() : null
        ])
      }
      
      await client.query('COMMIT')
      res.json({ success: true, message: `Successfully uploaded questions for Level ${level} Day ${dayNum}` })
    } catch (dbErr) {
      await client.query('ROLLBACK')
      throw dbErr
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('Error uploading excel:', err)
    res.status(500).json({ message: 'Internal server error processing Excel file' })
  }
})

// 3. Fetch Responses for Dashboard
router.get('/responses', checkAdmin, async (req, res) => {
  try {
    const { level, day_number } = req.query
    
    let query = `
      SELECT 
        s.name, 
        s.mobile, 
        s.level,
        d.day_number, 
        d.accuracy, 
        d.time_taken_seconds, 
        d.completed,
        d.completed_at
      FROM students s
      JOIN day_records d ON s.id = d.student_id
      WHERE d.completed = true
    `
    const params = []
    
    if (level) {
      params.push(level)
      query += ` AND s.level = $${params.length}`
    }
    
    if (day_number) {
      params.push(parseInt(day_number, 10))
      query += ` AND d.day_number = $${params.length}`
    }
    
    query += ' ORDER BY d.completed_at DESC'
    
    const { rows } = await pool.query(query, params)
    res.json(rows)
  } catch (err) {
    console.error('Error fetching responses:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
