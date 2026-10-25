import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 4000);
const isProduction = process.env.NODE_ENV === 'production';
const PgSession = connectPgSimple(session);

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL. Copy server/.env.example to server/.env and configure it.');
  process.exit(1);
}
if (!process.env.SESSION_SECRET) {
  console.error('Missing SESSION_SECRET. Add a long random secret to server/.env.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
if (isProduction) app.set('trust proxy', 1);
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: '20kb' }));
app.use(session({
  store: new PgSession({ pool, tableName: 'sessions', createTableIfMissing: true }),
  name: 'lovely.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected', app: 'Lovely Restaurants API' }); }
  catch { res.status(503).json({ status: 'error', database: 'unavailable' }); }
});

app.get('/api/menu', async (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  try {
    const result = await pool.query(
      `SELECT id, name, description, category, price::float AS price, image_url, featured
       FROM menu_items
       WHERE ($1 = '' OR category = $1)
         AND ($2 = '' OR name ILIKE '%' || $2 || '%' OR description ILIKE '%' || $2 || '%')
       ORDER BY featured DESC, id ASC`, [category, search]
    );
    res.json({ items: result.rows, count: result.rowCount });
  } catch (error) {
    console.error('Menu query failed:', error.message);
    res.status(500).json({ error: 'Unable to load the menu right now.' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 8 || password.length > 128) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query('INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email', [name, email, passwordHash]);
    req.session.user = result.rows[0];
    req.session.save(error => error ? res.status(500).json({ error: 'Account created, but session could not be saved. Please log in.' }) : res.status(201).json({ user: result.rows[0] }));
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'An account with this email already exists.' });
    console.error('Signup failed:', error.message);
    res.status(500).json({ error: 'Unable to create account right now.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  try {
    const result = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
    req.session.regenerate(error => {
      if (error) return res.status(500).json({ error: 'Unable to start a session.' });
      req.session.user = { id: user.id, name: user.name, email: user.email };
      req.session.save(saveError => saveError ? res.status(500).json({ error: 'Unable to save session.' }) : res.json({ user: req.session.user }));
    });
  } catch (error) {
    console.error('Login failed:', error.message);
    res.status(500).json({ error: 'Unable to log in right now.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(error => {
    if (error) return res.status(500).json({ error: 'Unable to log out.' });
    res.clearCookie('lovely.sid', { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });
    res.json({ message: 'Signed out successfully.' });
  });
});

app.get('/api/auth/me', (req, res) => res.json({ user: req.session.user || null }));

app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));
app.listen(port, () => console.log(`Lovely Restaurants API running at http://localhost:${port}`));
