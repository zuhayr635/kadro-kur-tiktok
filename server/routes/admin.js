// server/routes/admin.js
const router = require('express').Router();
const bcrypt = require('bcrypt');
const { getDb } = require('../database');
const { signToken, hashPassword, comparePassword, authMiddleware } = require('../auth');
const lm = require('../license-manager');
const pm = require('../player-manager');

// Ilk admin olustur (index.js'den DB init sonrasi cagirilir)
async function ensureAdmin() {
  const db = getDb();
  const exists = db.prepare('SELECT id FROM admin WHERE username=?').get('admin');
  if (!exists) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
    db.prepare('INSERT INTO admin (username, password_hash) VALUES (?,?)').run('admin', hash);
    console.log('Varsayilan admin olusturuldu. Giris bilgileri icin .env dosyasina bakin.');
  }
}

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = getDb().prepare('SELECT * FROM admin WHERE username=?').get(username);
  if (!admin || !(await comparePassword(password, admin.password_hash))) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Gecersiz kullanici adi veya sifre' } });
  }
  const token = await signToken({ sub: admin.id, username: admin.username, role: 'admin' });
  res.json({ success: true, data: { token } });
});

// GET /api/admin/dashboard
router.get('/dashboard', authMiddleware, (req, res) => {
  const db = getDb();
  const totalLicenses = db.prepare('SELECT COUNT(*) as c FROM licenses').get().c;
  const activeLicenses = db.prepare("SELECT COUNT(*) as c FROM licenses WHERE status='active'").get().c;
  const activeSessions = db.prepare("SELECT COUNT(*) as c FROM sessions WHERE status='active'").get().c;
  const totalPlayers = db.prepare('SELECT COUNT(*) as c FROM players WHERE is_active=1').get().c;
  res.json({ success: true, data: { totalLicenses, activeLicenses, activeSessions, totalPlayers } });
});

// POST /api/admin/change-password
router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = getDb().prepare('SELECT * FROM admin WHERE id=?').get(req.admin.sub);
  if (!admin) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Admin bulunamadi' } });
  if (!(await comparePassword(currentPassword, admin.password_hash))) {
    return res.status(400).json({ success: false, error: { code: 'WRONG_PASSWORD', message: 'Mevcut sifre yanlis' } });
  }
  const hash = await hashPassword(newPassword);
  getDb().prepare('UPDATE admin SET password_hash=? WHERE id=?').run(hash, admin.id);
  if (req.body.newUsername) {
    getDb().prepare('UPDATE admin SET username=? WHERE id=?').run(req.body.newUsername, admin.id);
  }
  res.json({ success: true, data: { message: 'Bilgiler guncellendi' } });
});

// GET/PUT /api/admin/settings
router.get('/settings', authMiddleware, (req, res) => {
  const rows = getDb().prepare('SELECT * FROM system_settings').all();
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json({ success: true, data: settings });
});

router.put('/settings/:key', authMiddleware, (req, res) => {
  const ALLOWED_KEYS = ['game_layout','like_threshold','max_concurrent_sessions','session_timeout_minutes','log_retention_days','ws_port_start','ws_port_end'];
  const { key } = req.params;
  const { value } = req.body;
  if (!ALLOWED_KEYS.includes(key)) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_KEY', message: 'Gecersiz ayar anahtari' } });
  }
  getDb().prepare('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?,?,CURRENT_TIMESTAMP)').run(key, String(value));
  res.json({ success: true, data: { key, value } });
});

// GET /api/admin/sounds, PUT /api/admin/sounds/:key
router.get('/sounds', authMiddleware, (req, res) => {
  const sounds = getDb().prepare('SELECT * FROM sound_settings').all();
  res.json({ success: true, data: sounds });
});

router.put('/sounds/:key', authMiddleware, (req, res) => {
  const { key } = req.params;
  const { mode } = req.body;
  if (!['synth', 'custom'].includes(mode)) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_MODE', message: 'Mode synth veya custom olmali' } });
  }
  getDb().prepare('UPDATE sound_settings SET mode=?, updated_at=CURRENT_TIMESTAMP WHERE sound_key=?').run(mode, key);
  res.json({ success: true, data: { sound_key: key, mode } });
});

// Oyuncu yonetimi: GET/POST/PUT/DELETE /api/admin/players
router.get('/players', authMiddleware, (req, res) => {
  const { league, tier, position, page = 1, limit = 100 } = req.query;
  let q = 'SELECT * FROM players WHERE 1=1';
  const params = [];
  if (league) { q += ' AND league=?'; params.push(league); }
  if (tier) { q += ' AND tier=?'; params.push(tier); }
  if (position) { q += ' AND position=?'; params.push(position); }
  q += ' ORDER BY overall DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));
  res.json({ success: true, data: getDb().prepare(q).all(...params) });
});

router.post('/players', authMiddleware, (req, res) => {
  try {
    const player = pm.createPlayer(req.body);
    res.status(201).json({ success: true, data: player });
  } catch (e) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: e.message } });
  }
});

router.put('/players/:id', authMiddleware, (req, res) => {
  const player = pm.updatePlayer(Number(req.params.id), req.body);
  res.json({ success: true, data: player });
});

router.delete('/players/:id', authMiddleware, (req, res) => {
  pm.deletePlayer(Number(req.params.id));
  res.json({ success: true, data: null });
});

router.ensureAdmin = ensureAdmin;
module.exports = router;
