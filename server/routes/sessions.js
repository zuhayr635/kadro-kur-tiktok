'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { authMiddleware } = require('../auth');
const lm = require('../license-manager');
const sm = require('../session-manager');

// POST /api/sessions/create - Public (license key required)
router.post('/create', async (req, res) => {
  try {
    const { license_key, tiktok_username } = req.body;
    if (!license_key || !tiktok_username) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'license_key ve tiktok_username zorunludur' } });
    }

    const activeCount = sm.getActiveSessionCountForLicense(license_key);
    const validation = lm.validateLicense(license_key, activeCount);
    if (!validation.valid) {
      return res.status(403).json({ success: false, error: { code: 'INVALID_LICENSE', message: validation.reason } });
    }

    const session = sm.createSession(validation.license.id, tiktok_username);
    lm.logAction(validation.license.id, 'session_created', `session: ${session.session_id}`, req.ip, req.headers['user-agent']);

    res.status(201).json({
      success: true,
      data: {
        session_id: session.session_id,
        game_url: `/game?s=${session.session_id}`
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// POST /api/sessions/stop - Public
router.post('/stop', async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'session_id zorunludur' } });
    }

    const result = sm.stopSession(session_id);
    if (!result) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session bulunamadi' } });
    }

    res.json({ success: true, data: { message: 'Session durduruldu' } });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// GET /api/sessions/active - Admin only
router.get('/active', authMiddleware, (req, res) => {
  try {
    const sessions = sm.getActiveSessions();
    res.json({ success: true, data: sessions });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// GET /api/sessions/:id - Admin only
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const session = sm.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session bulunamadi' } });
    }
    res.json({ success: true, data: session });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// DELETE /api/sessions/:id - Admin force stop
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const session = sm.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session bulunamadi' } });
    }

    sm.stopSession(req.params.id);
    res.json({ success: true, data: { message: 'Session zorla durduruldu' } });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// POST /api/license/validate - Public endpoint for panel login
// Mounted at /api/license in index.js, so path here is just /validate
router.post('/validate', async (req, res) => {
  try {
    const { license_key } = req.body;
    if (!license_key) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'license_key zorunludur' } });
    }

    const lic = lm.getLicenseByKey(license_key);
    if (!lic) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lisans bulunamadi' } });
    }

    if (lic.status !== 'active') {
      return res.status(403).json({ success: false, error: { code: 'LICENSE_INACTIVE', message: `Lisans durumu: ${lic.status}` } });
    }

    if (lic.expires_at && new Date(lic.expires_at) < new Date()) {
      return res.status(403).json({ success: false, error: { code: 'LICENSE_EXPIRED', message: 'Lisans suresi dolmus' } });
    }

    // Update last_used_at and total_usage_count
    getDb().prepare(
      'UPDATE licenses SET last_used_at=CURRENT_TIMESTAMP, last_used_ip=?, total_usage_count=total_usage_count+1, updated_at=CURRENT_TIMESTAMP WHERE id=?'
    ).run(req.ip, lic.id);

    lm.logAction(lic.id, 'login', null, req.ip, req.headers['user-agent']);

    // Re-fetch updated license
    const updated = getDb().prepare('SELECT * FROM licenses WHERE id=?').get(lic.id);

    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

module.exports = router;
