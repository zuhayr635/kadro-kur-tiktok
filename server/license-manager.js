// server/license-manager.js
const { getDb } = require('./database');
const { v4: uuidv4 } = require('uuid');

const PLAN_MAX_SESSIONS = { basic: 1, pro: 3, premium: 5, unlimited: 999999 };

function generateKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]).join('');
  return `HIRA-${seg()}-${seg()}-${seg()}`;
}

function createLicense({ owner_name, plan = 'basic', owner_email, owner_tiktok, expires_at, notes }) {
  const db = getDb();
  let key;
  do { key = generateKey(); } while (db.prepare('SELECT id FROM licenses WHERE license_key=?').get(key));
  const max_sessions = PLAN_MAX_SESSIONS[plan];
  const result = db.prepare(`
    INSERT INTO licenses (license_key, owner_name, owner_email, owner_tiktok, plan, status, max_sessions, expires_at, notes, activated_at)
    VALUES (?,?,?,?,?,'active',?,?,?,CURRENT_TIMESTAMP)
  `).run(key, owner_name, owner_email || null, owner_tiktok || null, plan, max_sessions, expires_at || null, notes || null);
  return db.prepare('SELECT * FROM licenses WHERE id=?').get(result.lastInsertRowid);
}

function getLicenseByKey(key) {
  return getDb().prepare('SELECT * FROM licenses WHERE license_key=?').get(key);
}

function getLicenses({ plan, status, page = 1, limit = 50 } = {}) {
  let q = 'SELECT * FROM licenses WHERE 1=1';
  const params = [];
  if (plan) { q += ' AND plan=?'; params.push(plan); }
  if (status) { q += ' AND status=?'; params.push(status); }
  q += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);
  return getDb().prepare(q).all(...params);
}

function updateLicense(id, fields) {
  const allowed = ['owner_name','owner_email','owner_tiktok','plan','status','expires_at','notes','max_sessions'];
  const keys = Object.keys(fields).filter(k => allowed.includes(k));
  if (!keys.length) return null;
  const sets = keys.map(k => `${k}=?`);
  const vals = keys.map(k => fields[k]);
  getDb().prepare(`UPDATE licenses SET ${sets.join(',')}, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(...vals, id);
  return getDb().prepare('SELECT * FROM licenses WHERE id=?').get(id);
}

function deleteLicense(id) {
  return getDb().prepare('DELETE FROM licenses WHERE id=?').run(id);
}

function validateLicense(key, activeSessionCount) {
  const lic = getLicenseByKey(key);
  if (!lic) return { valid: false, reason: 'Lisans bulunamadi' };
  if (lic.status !== 'active') return { valid: false, reason: `Lisans durumu: ${lic.status}` };
  if (lic.expires_at && new Date(lic.expires_at) < new Date()) return { valid: false, reason: 'Lisans suresi dolmus' };
  if (activeSessionCount >= lic.max_sessions) return { valid: false, reason: 'Maksimum session sayisina ulasildi' };
  return { valid: true, license: lic };
}

function logAction(license_id, action, details, ip, ua) {
  getDb().prepare(
    'INSERT INTO license_logs (license_id, action, details, ip_address, user_agent) VALUES (?,?,?,?,?)'
  ).run(license_id, action, details || null, ip || null, ua || null);
}

module.exports = { generateKey, createLicense, getLicenseByKey, getLicenses, updateLicense, deleteLicense, validateLicense, logAction };
