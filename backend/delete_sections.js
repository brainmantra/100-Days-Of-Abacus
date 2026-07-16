import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query(`
      DELETE FROM teacher_questions 
      WHERE (level = 'l4' AND LOWER(REPLACE(section, ' ', '_')) = 'form_the_question') 
         OR (level IN ('l5', 'l8') AND LOWER(REPLACE(section, ' ', '_')) = 'cracking') 
         OR (level = 'l6' AND LOWER(REPLACE(section, ' ', '_')) = 'bodmas') 
      RETURNING *
    `);
    console.log('Deleted rows:', res.rowCount);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
