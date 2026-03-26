// server/routes/licenses.js
const router = require('express').Router();
const lm = require('../license-manager');
const { authMiddleware } = require('../auth');

router.get('/', authMiddleware, (req, res) => {
  res.json({ success: true, data: lm.getLicenses(req.query) });
});

router.post('/', authMiddleware, (req, res) => {
  const lic = lm.createLicense(req.body);
  lm.logAction(lic.id, 'created', null, req.ip, req.headers['user-agent']);
  res.status(201).json({ success: true, data: lic });
});

router.get('/:id', authMiddleware, (req, res) => {
  const lic = require('../database').getDb().prepare('SELECT * FROM licenses WHERE id=?').get(req.params.id);
  if (!lic) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lisans bulunamadi' } });
  res.json({ success: true, data: lic });
});

router.put('/:id', authMiddleware, (req, res) => {
  const lic = lm.updateLicense(Number(req.params.id), req.body);
  res.json({ success: true, data: lic });
});

router.delete('/:id', authMiddleware, (req, res) => {
  lm.deleteLicense(Number(req.params.id));
  res.json({ success: true, data: null });
});

router.post('/:id/suspend', authMiddleware, (req, res) => {
  const lic = lm.updateLicense(Number(req.params.id), { status: 'suspended' });
  lm.logAction(Number(req.params.id), 'suspended', null, req.ip);
  res.json({ success: true, data: lic });
});

router.post('/:id/activate', authMiddleware, (req, res) => {
  const lic = lm.updateLicense(Number(req.params.id), { status: 'active' });
  lm.logAction(Number(req.params.id), 'activated', null, req.ip);
  res.json({ success: true, data: lic });
});

router.post('/:id/extend', authMiddleware, (req, res) => {
  const { days } = req.body;
  const db = require('../database').getDb();
  const lic = db.prepare('SELECT * FROM licenses WHERE id=?').get(req.params.id);
  const current = lic.expires_at ? new Date(lic.expires_at) : new Date();
  current.setDate(current.getDate() + Number(days));
  const updated = lm.updateLicense(Number(req.params.id), { expires_at: current.toISOString() });
  lm.logAction(Number(req.params.id), 'extended', `${days} gun`, req.ip);
  res.json({ success: true, data: updated });
});

router.get('/:id/logs', authMiddleware, (req, res) => {
  const logs = require('../database').getDb()
    .prepare('SELECT * FROM license_logs WHERE license_id=? ORDER BY created_at DESC LIMIT 100').all(req.params.id);
  res.json({ success: true, data: logs });
});

module.exports = router;
