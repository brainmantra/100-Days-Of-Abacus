import pool from './db.js';
pool.query("SELECT constraint_name FROM information_schema.key_column_usage WHERE table_name = 'students' AND column_name = 'mobile';").then(res => { console.log(res.rows); pool.end(); })
