import 'dotenv/config'
import pool from '../Documents/Projects/Vatsal/Coding Based Upgraded/100-Days-Of-Abacus/api/db.js'

async function run() {
  try {
    await pool.query('ALTER TABLE day_records ADD COLUMN IF NOT EXISTS question_times JSONB;')
    console.log('Added question_times column')
  } catch(e) {
    console.error(e)
  }
  process.exit(0)
}
run()
