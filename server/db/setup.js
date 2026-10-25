import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL. Copy .env.example to .env and configure your database.');
  process.exit(1);
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});
try {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(schema);
  await pool.query(`CREATE TABLE IF NOT EXISTS sessions (
    sid varchar NOT NULL COLLATE "default",
    sess json NOT NULL,
    expire timestamp(6) NOT NULL,
    CONSTRAINT session_pkey PRIMARY KEY (sid)
  );
  CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);`);
  console.log('Database schema created successfully.');
} catch (error) {
  console.error('Could not create schema:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
