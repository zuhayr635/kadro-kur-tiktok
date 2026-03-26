'use strict';

const path = require('path');
const Database = require('better-sqlite3');

let db = null;

function initDatabase() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'db', 'kadro.db');

  if (dbPath !== ':memory:') {
    const fs = require('fs');
    const dir = path.dirname(dbPath);
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);

  // WAL mode and foreign keys
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create all tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS licenses (
      id INTEGER PRIMARY KEY,
      license_key TEXT UNIQUE NOT NULL,
      owner_name TEXT,
      owner_email TEXT,
      owner_tiktok TEXT,
      plan TEXT NOT NULL CHECK(plan IN ('basic','pro','premium','unlimited')),
      status TEXT NOT NULL CHECK(status IN ('active','suspended','expired','revoked')),
      max_sessions INTEGER NOT NULL DEFAULT 1,
      allowed_features TEXT NOT NULL DEFAULT '{}',
      total_usage_count INTEGER NOT NULL DEFAULT 0,
      last_used_at TEXT,
      last_used_ip TEXT,
      activated_at TEXT,
      expires_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS license_logs (
      id INTEGER PRIMARY KEY,
      license_id INTEGER NOT NULL REFERENCES licenses(id),
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY,
      session_id TEXT UNIQUE NOT NULL,
      license_id INTEGER NOT NULL REFERENCES licenses(id),
      tiktok_username TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('active','paused','ended','error')),
      python_pid INTEGER,
      ws_port INTEGER,
      game_state TEXT NOT NULL DEFAULT '{}',
      team_settings TEXT NOT NULL DEFAULT '{}',
      game_settings TEXT NOT NULL DEFAULT '{}',
      undo_stack TEXT NOT NULL DEFAULT '[]',
      layout TEXT NOT NULL DEFAULT '2x2' CHECK(layout IN ('2x2','4col','focus')),
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT
    );

    CREATE TABLE IF NOT EXISTS game_history (
      id INTEGER PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES sessions(id),
      license_id INTEGER NOT NULL REFERENCES licenses(id),
      tiktok_username TEXT NOT NULL,
      final_scores TEXT,
      statistics TEXT,
      duration_seconds INTEGER,
      total_cards_opened INTEGER NOT NULL DEFAULT 0,
      total_participants INTEGER NOT NULL DEFAULT 0,
      screenshot_path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      position TEXT,
      nationality TEXT,
      nationality_flag TEXT,
      club TEXT,
      league TEXT,
      overall INTEGER CHECK(overall BETWEEN 50 AND 99),
      tier TEXT CHECK(tier IN ('bronze','silver','gold','elite')),
      stats TEXT NOT NULL DEFAULT '{}',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS used_players (
      id INTEGER PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES sessions(id),
      player_id INTEGER NOT NULL REFERENCES players(id),
      team_index INTEGER CHECK(team_index IN (0,1,2,3)),
      position TEXT,
      assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
      replaced_by INTEGER
    );

    CREATE TABLE IF NOT EXISTS sound_settings (
      id INTEGER PRIMARY KEY,
      sound_key TEXT UNIQUE NOT NULL,
      mode TEXT NOT NULL DEFAULT 'synth' CHECK(mode IN ('synth','custom')),
      custom_file_path TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed system_settings
  const seedSettings = db.prepare(
    "INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)"
  );
  const seedSettingsTx = db.transaction(() => {
    seedSettings.run('game_layout', '2x2');
    seedSettings.run('like_threshold', '50');
    seedSettings.run('max_concurrent_sessions', '50');
    seedSettings.run('session_timeout_minutes', '300');
    seedSettings.run('log_retention_days', '90');
    seedSettings.run('ws_port_start', '9001');
    seedSettings.run('ws_port_end', '9500');
  });
  seedSettingsTx();

  // Seed sound_settings
  const seedSound = db.prepare(
    "INSERT OR IGNORE INTO sound_settings (sound_key, mode) VALUES (?, 'synth')"
  );
  const seedSoundTx = db.transaction(() => {
    seedSound.run('notification');
    seedSound.run('card-bronze');
    seedSound.run('card-silver');
    seedSound.run('card-gold');
    seedSound.run('card-elite');
    seedSound.run('card-reject');
    seedSound.run('game-end');
  });
  seedSoundTx();
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

module.exports = { initDatabase, getDb };
