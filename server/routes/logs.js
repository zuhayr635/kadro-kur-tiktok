'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { authMiddleware } = require('../auth');

// GET /api/logs - Filtrelenebilir loglar
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { action, license_id, from, to, page = 1, limit = 50 } = req.query;

    let q = 'SELECT ll.*, l.license_key, l.owner_name FROM license_logs ll LEFT JOIN licenses l ON l.id = ll.license_id WHERE 1=1';
    const params = [];

    if (action) { q += ' AND ll.action = ?'; params.push(action); }
    if (license_id) { q += ' AND ll.license_id = ?'; params.push(Number(license_id)); }
    if (from) { q += ' AND ll.created_at >= ?'; params.push(from); }
    if (to) { q += ' AND ll.created_at <= ?'; params.push(to); }

    // Count
    const countQ = q.replace('SELECT ll.*, l.license_key, l.owner_name', 'SELECT COUNT(*) as c');
    const total = db.prepare(countQ).get(...params).c;

    // Paginate
    q += ' ORDER BY ll.created_at DESC LIMIT ? OFFSET ?';
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit)));
    params.push(limitNum, (pageNum - 1) * limitNum);

    const logs = db.prepare(q).all(...params);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          total_pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// GET /api/logs/export - CSV disa aktarim
router.get('/export', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { action, license_id, from, to } = req.query;

    let q = 'SELECT ll.*, l.license_key, l.owner_name FROM license_logs ll LEFT JOIN licenses l ON l.id = ll.license_id WHERE 1=1';
    const params = [];

    if (action) { q += ' AND ll.action = ?'; params.push(action); }
    if (license_id) { q += ' AND ll.license_id = ?'; params.push(Number(license_id)); }
    if (from) { q += ' AND ll.created_at >= ?'; params.push(from); }
    if (to) { q += ' AND ll.created_at <= ?'; params.push(to); }

    q += ' ORDER BY ll.created_at DESC LIMIT 10000';

    const logs = db.prepare(q).all(...params);

    // CSV header
    const header = 'id,license_key,owner_name,action,details,ip_address,user_agent,created_at';
    const rows = logs.map(l => {
      const escape = (v) => v == null ? '' : `"${String(v).replace(/"/g, '""')}"`;
      return [l.id, escape(l.license_key), escape(l.owner_name), escape(l.action), escape(l.details), escape(l.ip_address), escape(l.user_agent), escape(l.created_at)].join(',');
    });

    const csv = header + '\n' + rows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="logs_${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(csv);
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

module.exports = router;
