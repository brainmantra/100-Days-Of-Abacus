import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
import { getSectionsForLevelAsync, getTeacherQuestion } from './utils/questionSelector.js';
import { recalculateStreak } from './utils/streak.js';

// Replicating constants from backend
const TEACHER_INPUT_SECTIONS = new Set(['teacher_custom_1', 'teacher_custom_2', 'teacher_custom_3', 'power_exercise']);
const LEVEL_SECTIONS = {
  beginner: ['abacus', 'visual', 'activity', 'power_exercise'],
  l1: ['abacus', 'visual', 'activity', 'power_exercise'],
  l2: ['abacus', 'visual', 'multiplication', 'division', 'power_exercise'],
  l3: ['abacus', 'visual', 'multiplication', 'division', 'power_exercise'],
  l4: ['abacus', 'visual', 'multiplication', 'division', 'decimals', 'power_exercise'],
  l5: ['abacus', 'visual', 'multiplication', 'division', 'decimals', 'power_exercise'],
  l6: ['abacus', 'visual', 'multiplication', 'division', 'decimals', 'power_exercise'],
  l7: ['abacus', 'visual', 'multiplication', 'division', 'decimals', 'bodmas', 'power_exercise'],
  l8: ['abacus', 'visual', 'multiplication', 'division', 'decimals', 'bodmas', 'power_exercise'],
  gm: ['abacus', 'visual', 'multiplication', 'division', 'decimals', 'bodmas', 'cracking', 'power_exercise'],
  alumni: ['abacus', 'visual', 'multiplication', 'division', 'decimals', 'bodmas', 'cracking', 'power_exercise'],
};

function normalizeStudentLevel(level) {
  if (!level) return 'l1';
  const str = String(level).toLowerCase().trim();
  if (str.includes('beginner')) return 'beginner';
  if (str.includes('alumni')) return 'alumni';
  if (str.includes('gm') || str.includes('grand')) return 'gm';
  
  if (str.includes('level 1') || str === 'l1') return 'l1';
  if (str.includes('level 2') || str.includes('elementary') || str === 'l2') return 'l2';
  if (str.includes('level 3') || str.includes('intermediate') || str === 'l3') return 'l3';
  if (str.includes('level 4') || str.includes('advanced') || str === 'l4') return 'l4';
  if (str.includes('level 5') || str.includes('expert') || str === 'l5') return 'l5';
  if (str.includes('level 6') || str === 'l6') return 'l6';
  if (str.includes('level 7') || str === 'l7') return 'l7';
  if (str.includes('level 8') || str === 'l8') return 'l8';
  return 'l1';
}

async function run() {
  let updatedCount = 0;
  try {
    // 1. Get all incomplete day records that actually have section data
    const { rows: records } = await pool.query(`
      SELECT dr.student_id, dr.day_number, dr.section_data, s.level, s.first_login_date, s.registration_date 
      FROM day_records dr
      JOIN students s ON s.id = dr.student_id
      WHERE dr.completed = false AND dr.section_data IS NOT NULL
    `);
    
    console.log(`Found ${records.length} incomplete day records. Checking if any are fully done...`);

    for (const record of records) {
      const { student_id, day_number, section_data, level: rawLevel, first_login_date, registration_date } = record;
      const level = normalizeStudentLevel(rawLevel) || rawLevel;
      const sections = await getSectionsForLevelAsync(level, day_number);

      const validSections = [];
      for (const sec of sections) {
        if (TEACHER_INPUT_SECTIONS.has(sec)) {
          const tq = await getTeacherQuestion(level, day_number, sec);
          if (!tq || !tq.question) continue;
          let validQs = 0;
          let qs = [];
          if (typeof tq.question === 'string') {
            try { qs = JSON.parse(tq.question) } catch(e){}
          } else {
            qs = tq.question;
          }
          if (!Array.isArray(qs)) qs = [qs];
          if (qs.length === 1 && qs[0].questions) qs = qs[0].questions;
          for (const q of qs) {
            const qText = (q.question || q.question_text || q.questionText || '').trim();
            const img = (q.image || '').trim();
            if (qText !== '' || img !== '') validQs++;
          }
          if (validQs === 0) continue;
        }
        validSections.push(sec);
      }

      const allDone = validSections.length > 0 && validSections.every(sec => section_data[sec]?.status === 'done');
      
      if (allDone) {
        console.log(`Student ${student_id} Day ${day_number} is fully completed. Backfilling...`);
        let totalMarks = 0, totalXp = 0, totalTime = 0, totalCorrect = 0, totalQs = 0;

        for (const sec of validSections) {
          const sd = section_data[sec] || {};
          totalMarks += sd.marks || 0;
          totalXp += sd.xpEarned || 0;
          totalTime += sd.timeTaken || 0;
          totalCorrect += sd.correct || 0;
          totalQs += sd.questionCount || 0;
        }

        const paperAccuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;

        const streakResult = await recalculateStreak(student_id, first_login_date || registration_date);
        const streakBonus = streakResult.streak * 5;
        totalXp += streakBonus;

        let tableName = `responses_l${level.replace('l', '')}`;
        if (level === 'alumni') tableName = 'responses_alumni';
        else if (level === 'beginner') tableName = 'responses_beginner';
        else if (level === 'gm') tableName = 'responses_gm';

        const { rows: studentResponses } = await pool.query(
          `SELECT section_name, question_snapshot, correct_answer, student_answer, is_correct, time_taken_seconds, xp_earned, answered_at 
           FROM ${tableName} 
           WHERE student_id = $1 AND day_number = $2
           ORDER BY answered_at ASC`,
          [student_id, day_number]
        );

        await pool.query(
          `UPDATE day_records
           SET completed = TRUE, completed_at = NOW(), total_marks = $1, accuracy = $2,
               time_taken_seconds = $3, xp_earned = $4, answers = $5
           WHERE student_id = $6 AND day_number = $7`,
          [totalMarks, paperAccuracy, Math.round(totalTime), totalXp, JSON.stringify(studentResponses), student_id, day_number]
        );

        await pool.query(
          `UPDATE students SET xp_total = xp_total + $1, streak = $2, longest_streak = GREATEST(longest_streak, $3), updated_at = NOW()
           WHERE id = $4`,
          [streakBonus, streakResult.streak, streakResult.longestStreak, student_id]
        );
        updatedCount++;
      }
    }

    console.log(`Successfully backfilled ${updatedCount} papers!`);

  } catch (err) {
    console.error('Error backfilling:', err);
  } finally {
    pool.end();
  }
}
run();
