'use strict';

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./database');
const { validateLicense } = require('./license-manager');

// ---------------------------------------------------------------------------
// createSession
// ---------------------------------------------------------------------------
function createSession(licenseId, tiktokUsername) {
  const db = getDb();

  const license = db.prepare('SELECT * FROM licenses WHERE id = ?').get(licenseId);
  if (!license) throw new Error('Lisans bulunamadi');

  const activeCount = getActiveSessionCountForLicense(licenseId);
  const validation = validateLicense(license.license_key, activeCount);
  if (!validation.valid) throw new Error(validation.reason);

  const sessionId = uuidv4();

  const result = db.prepare(`
    INSERT INTO sessions (session_id, license_id, tiktok_username, status, game_state, team_settings, game_settings, undo_stack, layout)
    VALUES (?, ?, ?, 'active', '{}', '{}', '{}', '[]', '2x2')
  `).run(sessionId, licenseId, tiktokUsername);

  // Bump license usage
  db.prepare(`
    UPDATE licenses SET total_usage_count = total_usage_count + 1, last_used_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(licenseId);

  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid);
}

// ---------------------------------------------------------------------------
// stopSession
// ---------------------------------------------------------------------------
function stopSession(sessionId) {
  const db = getDb();
  const session = getSession(sessionId);
  if (!session) throw new Error('Session bulunamadi');

  let gameState = {};
  try { gameState = JSON.parse(session.game_state || '{}'); } catch (_) { /* ignore */ }

  // Calculate basic statistics for game_history
  const teams = gameState.teams || [];
  const finalScores = teams.map((t, i) => ({
    teamIndex: i,
    name: t.name || `Takim ${i + 1}`,
    score: (t.players || []).reduce((s, p) => s + (p && p.overall ? p.overall : 0), 0),
  }));

  const totalCards = teams.reduce((sum, t) => sum + (t.players || []).filter(Boolean).length, 0);

  const startedAt = session.started_at ? new Date(session.started_at) : new Date();
  const duration = Math.floor((Date.now() - startedAt.getTime()) / 1000);

  db.prepare(`
    INSERT INTO game_history (session_id, license_id, tiktok_username, final_scores, statistics, duration_seconds, total_cards_opened)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    session.id,
    session.license_id,
    session.tiktok_username,
    JSON.stringify(finalScores),
    JSON.stringify({ totalCards }),
    duration,
    totalCards,
  );

  db.prepare(`
    UPDATE sessions SET status = 'ended', ended_at = datetime('now') WHERE session_id = ?
  `).run(sessionId);

  return db.prepare('SELECT * FROM sessions WHERE session_id = ?').get(sessionId);
}

// ---------------------------------------------------------------------------
// getSession
// ---------------------------------------------------------------------------
function getSession(sessionId) {
  return getDb().prepare('SELECT * FROM sessions WHERE session_id = ?').get(sessionId) || null;
}

// ---------------------------------------------------------------------------
// getActiveSessions
// ---------------------------------------------------------------------------
function getActiveSessions() {
  return getDb().prepare("SELECT * FROM sessions WHERE status = 'active' ORDER BY started_at DESC").all();
}

// ---------------------------------------------------------------------------
// getActiveSessionCountForLicense
// ---------------------------------------------------------------------------
function getActiveSessionCountForLicense(licenseId) {
  const row = getDb().prepare(
    "SELECT COUNT(*) AS cnt FROM sessions WHERE license_id = ? AND status = 'active'"
  ).get(licenseId);
  return row ? row.cnt : 0;
}

// ---------------------------------------------------------------------------
// loadActiveSessions  --  startup cleanup: mark stale actives as ended
// ---------------------------------------------------------------------------
function loadActiveSessions() {
  try {
    const db = getDb();
    const stale = db.prepare("SELECT session_id FROM sessions WHERE status = 'active'").all();
    if (stale.length > 0) {
      db.prepare("UPDATE sessions SET status = 'ended', ended_at = datetime('now') WHERE status = 'active'").run();
      console.log(`[session-manager] ${stale.length} eski aktif session 'ended' olarak isaretlendi.`);
    }
  } catch (err) {
    console.error('[session-manager] loadActiveSessions hatasi:', err.message);
  }
}

// ---------------------------------------------------------------------------
// updateGameState
// ---------------------------------------------------------------------------
function updateGameState(sessionId, gameState) {
  const db = getDb();
  db.prepare('UPDATE sessions SET game_state = ? WHERE session_id = ?')
    .run(JSON.stringify(gameState), sessionId);
  return getSession(sessionId);
}

// ---------------------------------------------------------------------------
// updateTeamSettings
// ---------------------------------------------------------------------------
function updateTeamSettings(sessionId, settings) {
  const db = getDb();
  db.prepare('UPDATE sessions SET team_settings = ? WHERE session_id = ?')
    .run(JSON.stringify(settings), sessionId);
  return getSession(sessionId);
}

// ---------------------------------------------------------------------------
// updateGameSettings
// ---------------------------------------------------------------------------
function updateGameSettings(sessionId, settings) {
  const db = getDb();
  db.prepare('UPDATE sessions SET game_settings = ? WHERE session_id = ?')
    .run(JSON.stringify(settings), sessionId);
  return getSession(sessionId);
}

module.exports = {
  createSession,
  stopSession,
  getSession,
  getActiveSessions,
  getActiveSessionCountForLicense,
  loadActiveSessions,
  updateGameState,
  updateTeamSettings,
  updateGameSettings,
};
