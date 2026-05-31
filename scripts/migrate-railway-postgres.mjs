import { readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is required to run Railway Postgres migrations.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false }
});

try {
  const schemaPath = path.join(process.cwd(), 'db', 'railway-postgres.sql');
  const schema = await readFile(schemaPath, 'utf8');
  await pool.query(schema);
  const result = await pool.query('select count(*)::int as requests from doctor_care_requests');
  console.log(`Railway Postgres schema is ready. doctor_care_requests=${result.rows[0].requests}`);
} finally {
  await pool.end();
}
