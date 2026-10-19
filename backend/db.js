const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set to a PostgreSQL connection string.');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: Number(row.created_at)
  };
}

function mapReport(row) {
  return {
    id: row.id,
    lat: row.lat,
    lng: row.lng,
    street: row.street,
    waterLevel: row.water_level,
    note: row.note,
    photo: row.photo_url,
    reporter: row.reporter,
    reporterId: row.reporter_id,
    createdAt: Number(row.created_at),
    status: row.status
  };
}

async function checkDatabase() {
  await pool.query('SELECT 1');
}

async function findUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return mapUser(result.rows[0]);
}

async function insertUser(user) {
  const result = await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role, created_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [user.id, user.name, user.email, user.passwordHash, user.role, user.createdAt]
  );
  return mapUser(result.rows[0]);
}

async function insertSession(tokenHash, userId, expiresAt) {
  await pool.query('DELETE FROM sessions WHERE expires_at <= $1', [Date.now()]);
  await pool.query(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [tokenHash, userId, expiresAt]
  );
}

async function findUserBySession(tokenHash) {
  const result = await pool.query(
    `SELECT users.* FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = $1 AND sessions.expires_at > $2`,
    [tokenHash, Date.now()]
  );
  return mapUser(result.rows[0]);
}

async function listReports() {
  const result = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
  return result.rows.map(mapReport);
}

async function insertReport(report) {
  const result = await pool.query(
    `INSERT INTO reports
       (id, lat, lng, street, water_level, note, photo_url, reporter, reporter_id, created_at, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [report.id, report.lat, report.lng, report.street, report.waterLevel, report.note,
      report.photo, report.reporter, report.reporterId, report.createdAt, report.status]
  );
  return mapReport(result.rows[0]);
}

async function updateReportStatus(id, status) {
  const result = await pool.query(
    'UPDATE reports SET status = $2 WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0] ? mapReport(result.rows[0]) : null;
}

module.exports = {
  checkDatabase,
  findUserByEmail,
  insertUser,
  insertSession,
  findUserBySession,
  listReports,
  insertReport,
  updateReportStatus
};
