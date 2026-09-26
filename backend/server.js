const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { readDb, writeDb } = require('./db');
const { annotateReports } = require('./confidence');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

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

function createSession(db, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30;
  db.sessions = db.sessions.filter((session) => session.expiresAt > Date.now());
  db.sessions.push({ token, userId, expiresAt });
  return token;
}

function requireAuth(req, res, next) {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  const db = readDb();
  const session = db.sessions.find((item) => item.token === token && item.expiresAt > Date.now());
  const user = session && db.users.find((item) => item.id === session.userId);
  if (!user) return res.status(401).json({ error: 'Sign in is required.' });
  req.user = user;
  next();
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

// New accounts are always residents. Coordinator accounts must be provisioned by an admin.
app.post('/api/auth/register', (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return res.status(400).json({ error: 'Provide a name, a valid email address, and a password of at least 8 characters.' });
  }
  const db = readDb();
  if (db.users.some((user) => user.email === email)) {
    return res.status(409).json({ error: 'An account already exists for this email. Please sign in.' });
  }
  const user = { id: uid(), name: name.slice(0, 80), email, passwordHash: hashPassword(password), role: 'resident', createdAt: Date.now() };
  db.users.push(user);
  const token = createSession(db, user.id);
  writeDb(db);
  res.status(201).json({ token, user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const db = readDb();
  const user = db.users.find((item) => item.email === email);
  if (!user || !passwordMatches(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  const token = createSession(db, user.id);
  writeDb(db);
  res.json({ token, user: publicUser(user) });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// Return all reports, annotated with a confidence tier.
app.get('/api/reports', (req, res) => {
  const db = readDb();
  const annotated = annotateReports(db.reports);
  res.json({ reports: annotated });
});

// Create a new flood report.
app.post('/api/reports', requireAuth, (req, res) => {
  const { lat, lng, street, waterLevel, note, photo } = req.body;

  if (req.user.role !== 'resident') {
    return res.status(403).json({ error: 'Only resident accounts can create flood reports.' });
  }

  if (typeof lat !== 'number' || typeof lng !== 'number' || !street || !waterLevel) {
    return res.status(400).json({ error: 'lat, lng, street and waterLevel are required' });
  }
  const validLevels = ['ankle', 'knee', 'waist', 'chest'];
  if (!validLevels.includes(waterLevel)) {
    return res.status(400).json({ error: 'waterLevel must be one of ' + validLevels.join(', ') });
  }

  const db = readDb();
  const report = {
    id: uid(),
    lat,
    lng,
    street: String(street).slice(0, 140),
    waterLevel,
    note: note ? String(note).slice(0, 500) : '',
    photo: photo || null,
    reporter: req.user.name,
    reporterId: req.user.id,
    createdAt: Date.now(),
    status: 'active'
  };
  db.reports.push(report);
  writeDb(db);
  res.status(201).json({ report });
});

// Update a report's status (used by coordinators to resolve or flag).
app.patch('/api/reports/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'coordinator') {
    return res.status(403).json({ error: 'Only coordinator accounts can moderate reports.' });
  }
  const { status } = req.body;
  const validStatus = ['active', 'resolved', 'flagged'];
  if (!validStatus.includes(status)) {
    return res.status(400).json({ error: 'status must be one of ' + validStatus.join(', ') });
  }
  const db = readDb();
  const idx = db.reports.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'report not found' });
  db.reports[idx].status = status;
  writeDb(db);
  res.json({ report: db.reports[idx] });
});

app.listen(PORT, () => {
  console.log('Ulan Watch API listening on http://0.0.0.0:' + PORT);
  console.log('On your phone, use your computer\'s LAN IP instead of localhost, e.g. http://192.168.1.10:' + PORT);
});
