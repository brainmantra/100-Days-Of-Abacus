import pool from '../backend/db.js';

try {
  const { rows } = await pool.query('SELECT DISTINCT level, day_number, section FROM teacher_questions ORDER BY level, day_number');
  console.log('Existing teacher questions:', rows);
} catch (e) {
  console.error(e);
} finally {
  await pool.end();
}
