const path = require('path');
process.env.DB_PATH = ':memory:';
const { initDatabase, getDb } = require('../server/database');

beforeAll(() => { initDatabase(); });

test('tum tablolar olusturulur', () => {
  const db = getDb();
  const tables = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  ).all().map(r => r.name);
  const expected = [
    'admin','game_history','license_logs','licenses',
    'players','sessions','sound_settings','system_settings','used_players'
  ];
  expect(tables).toEqual(expected);
});

test('sistem ayarlari seed edilir', () => {
  const db = getDb();
  const layout = db.prepare("SELECT value FROM system_settings WHERE key='game_layout'").get();
  expect(layout.value).toBe('2x2');
  const threshold = db.prepare("SELECT value FROM system_settings WHERE key='like_threshold'").get();
  expect(threshold.value).toBe('50');
});

test('ses ayarlari seed edilir', () => {
  const db = getDb();
  const sounds = db.prepare("SELECT sound_key FROM sound_settings ORDER BY sound_key").all().map(r => r.sound_key);
  expect(sounds).toContain('card-elite');
  expect(sounds).toContain('card-bronze');
  expect(sounds.length).toBe(7);
});
