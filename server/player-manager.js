// server/player-manager.js
const { getDb } = require('./database');

function createPlayer({ name, position, nationality, nationality_flag, club, league, overall, stats }) {
  if (!name || !position || !overall) throw new Error('name, position, overall zorunlu');
  const tier = overall >= 91 ? 'elite' : overall >= 85 ? 'gold' : overall >= 71 ? 'silver' : 'bronze';
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO players (name, position, nationality, nationality_flag, club, league, overall, tier, stats) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run(name, position, nationality || null, nationality_flag || null, club || null, league || null, overall, tier, JSON.stringify(stats || {}));
  return db.prepare('SELECT * FROM players WHERE id=?').get(result.lastInsertRowid);
}

function updatePlayer(id, fields) {
  const allowed = ['name','position','nationality','nationality_flag','club','league','overall','tier','stats','is_active'];
  const sets = Object.keys(fields).filter(k => allowed.includes(k)).map(k => `${k}=?`);
  if (!sets.length) return null;
  const vals = sets.map(s => fields[s.split('=')[0]]);
  getDb().prepare(`UPDATE players SET ${sets.join(',')} WHERE id=?`).run(...vals, id);
  return getDb().prepare('SELECT * FROM players WHERE id=?').get(id);
}

function deletePlayer(id) {
  return getDb().prepare('UPDATE players SET is_active=0 WHERE id=?').run(id);
}

module.exports = { createPlayer, updatePlayer, deletePlayer };
