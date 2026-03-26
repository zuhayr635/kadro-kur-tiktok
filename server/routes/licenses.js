// server/routes/licenses.js
const router = require('express').Router();
const lm = require('../license-manager');
const { authMiddleware } = require('../auth');
const { getDb } = require('../database');

router.get('/', authMiddleware, (req, res) => {
  const query = { ...req.query, limit: Math.min(Number(req.query.limit) || 50, 200) };
  res.json({ success: true, data: lm.getLicenses(query) });
});

router.post('/', authMiddleware, (req, res) => {
  const lic = lm.createLicense(req.body);
  lm.logAction(lic.id, 'created', null, req.ip, req.headers['user-agent']);
  res.status(201).json({ success: true, data: lic });
});

router.get('/:id', authMiddleware, (req, res) => {
  const lic = getDb().prepare('SELECT * FROM licenses WHERE id=?').get(req.params.id);
  if (!lic) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lisans bulunamadi' } });
  res.json({ success: true, data: lic });
});

router.put('/:id', authMiddleware, (req, res) => {
  const lic = lm.updateLicense(Number(req.params.id), req.body);
  if (!lic) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lisans bulunamadi' } });
  res.json({ success: true, data: lic });
});

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const exists = getDb().prepare('SELECT id FROM licenses WHERE id=?').get(req.params.id);
    if (!exists) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lisans bulunamadi' } });
    // Iliskili kayitlari temizle
    const db = getDb();
    db.prepare('DELETE FROM license_logs WHERE license_id=?').run(req.params.id);
    db.prepare('DELETE FROM game_history WHERE license_id=?').run(req.params.id);
    db.prepare('DELETE FROM sessions WHERE license_id=?').run(req.params.id);
    lm.deleteLicense(Number(req.params.id));
    res.json({ success: true, data: null });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

router.post('/:id/suspend', authMiddleware, (req, res) => {
  const exists = getDb().prepare('SELECT id FROM licenses WHERE id=?').get(req.params.id);
  if (!exists) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lisans bulunamadi' } });
  const lic = lm.updateLicense(Number(req.params.id), { status: 'suspended' });
  lm.logAction(Number(req.params.id), 'suspended', null, req.ip);
  res.json({ success: true, data: lic });
});

router.post('/:id/activate', authMiddleware, (req, res) => {
  const exists = getDb().prepare('SELECT id FROM licenses WHERE id=?').get(req.params.id);
  if (!exists) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lisans bulunamadi' } });
  const lic = lm.updateLicense(Number(req.params.id), { status: 'active' });
  lm.logAction(Number(req.params.id), 'activated', null, req.ip);
  res.json({ success: true, data: lic });
});

router.post('/:id/extend', authMiddleware, (req, res) => {
  const days = Number(req.body.days);
  if (!days || days < 1 || !Number.isInteger(days)) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_DAYS', message: 'days pozitif tam sayi olmali' } });
  }
  const lic = getDb().prepare('SELECT * FROM licenses WHERE id=?').get(req.params.id);
  if (!lic) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lisans bulunamadi' } });
  const current = lic.expires_at ? new Date(lic.expires_at) : new Date();
  current.setDate(current.getDate() + days);
  const updated = lm.updateLicense(Number(req.params.id), { expires_at: current.toISOString() });
  lm.logAction(Number(req.params.id), 'extended', `${days} gun`, req.ip);
  res.json({ success: true, data: updated });
});

router.get('/:id/logs', authMiddleware, (req, res) => {
  const logs = getDb()
    .prepare('SELECT * FROM license_logs WHERE license_id=? ORDER BY created_at DESC LIMIT 100').all(req.params.id);
  res.json({ success: true, data: logs });
});

module.exports = router;
