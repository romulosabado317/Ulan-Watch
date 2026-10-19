require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const {
  checkDatabase,
  findUserByEmail,
  insertUser,
  insertSession,
  findUserBySession,
  listReports,
  insertReport,
  updateReportStatus
} = require('./db');
const { uploadReportPhoto } = require('./storage');
const { annotateReports } = require('./confidence');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '8mb' }));

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return salt + ':' + hash;
}

function passwordMatches(password, stored) {
  const [salt, savedHash] = String(stored || '').split(':');
  if (!salt || !savedHash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(savedHash, 'hex'));
}

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await insertSession(tokenHash, userId, expiresAt);
  return token;
}

const requireAuth = asyncRoute(async (req, res, next) => {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  const tokenHash = token ? crypto.createHash('sha256').update(token).digest('hex') : '';
  const user = await findUserBySession(tokenHash);
  if (!user) return res.status(401).json({ error: 'Sign in is required.' });
  req.user = user;
  next();
});

app.get('/api/health', asyncRoute(async (req, res) => {
  await checkDatabase();
  res.json({ ok: true, time: Date.now() });
}));

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return res.status(400).json({ error: 'Provide a name, a valid email address, and a password of at least 8 characters.' });
  }
  const existing = await findUserByEmail(email);
  if (existing) return res.status(409).json({ error: 'An account already exists for this email. Please sign in.' });

  const user = await insertUser({
    id: crypto.randomUUID(),
    name: name.slice(0, 80),
    email,
    passwordHash: hashPassword(password),
    role: 'resident',
    createdAt: Date.now()
  });
  const token = await createSession(user.id);
  res.status(201).json({ token, user: publicUser(user) });
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = await findUserByEmail(email);
  if (!user || !passwordMatches(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  const token = await createSession(user.id);
  res.json({ token, user: publicUser(user) });
}));

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.get('/api/reports', asyncRoute(async (req, res) => {
  const reports = await listReports();
  res.json({ reports: annotateReports(reports) });
}));

app.post('/api/reports', requireAuth, asyncRoute(async (req, res) => {
  const { lat, lng, street, waterLevel, note, photo } = req.body;
  if (req.user.role !== 'resident') {
    return res.status(403).json({ error: 'Only resident accounts can create flood reports.' });
  }
  if (typeof lat !== 'number' || lat < -90 || lat > 90 || typeof lng !== 'number' || lng < -180 || lng > 180 || !street || !waterLevel) {
    return res.status(400).json({ error: 'A valid location, street and waterLevel are required.' });
  }
  const validLevels = ['ankle', 'knee', 'waist', 'chest'];
  if (!validLevels.includes(waterLevel)) {
    return res.status(400).json({ error: 'waterLevel must be one of ' + validLevels.join(', ') });
  }

  const id = crypto.randomUUID();
  const photoUrl = photo ? await uploadReportPhoto(photo, id) : null;
  const report = await insertReport({
    id,
    lat,
    lng,
    street: String(street).slice(0, 140),
    waterLevel,
    note: note ? String(note).slice(0, 500) : '',
    photo: photoUrl,
    reporter: req.user.name,
    reporterId: req.user.id,
    createdAt: Date.now(),
    status: 'active'
  });
  res.status(201).json({ report });
}));

app.patch('/api/reports/:id', requireAuth, asyncRoute(async (req, res) => {
  if (req.user.role !== 'coordinator') {
    return res.status(403).json({ error: 'Only coordinator accounts can moderate reports.' });
  }
  const { status } = req.body;
  const validStatus = ['active', 'resolved', 'flagged'];
  if (!validStatus.includes(status)) {
    return res.status(400).json({ error: 'status must be one of ' + validStatus.join(', ') });
  }
  const report = await updateReportStatus(req.params.id, status);
  if (!report) return res.status(404).json({ error: 'report not found' });
  res.json({ report });
}));

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  if (err.code === '23505') {
    return res.status(409).json({ error: 'An account already exists for this email. Please sign in.' });
  }
  res.status(500).json({ error: 'The server could not complete the request.' });
});

async function start() {
  await checkDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log('Ulan Watch API listening on port ' + PORT);
  });
}

start().catch((error) => {
  console.error('Could not start the API. Check DATABASE_URL and the database schema.', error);
  process.exit(1);
});
