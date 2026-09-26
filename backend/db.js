const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.ULAN_WATCH_DB_PATH || path.join(__dirname, 'db.json');

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { reports: [], users: [], sessions: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  try {
    const data = JSON.parse(raw);
    // Keep existing demo data usable after introducing accounts.
    return {
      reports: Array.isArray(data.reports) ? data.reports : [],
      users: Array.isArray(data.users) ? data.users : [],
      sessions: Array.isArray(data.sessions) ? data.sessions : []
    };
  } catch (e) {
    return { reports: [], users: [], sessions: [] };
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { readDb, writeDb };
