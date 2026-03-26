'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// GET /api/profile/:license_id - Get profile data (public)
router.get('/:license_id', (req, res) => {
  try {
    const db = getDb();
    const license = db.prepare('SELECT id, owner_name, owner_tiktok, plan, status, created_at FROM licenses WHERE id=?').get(req.params.license_id);
    if (!license) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Profil bulunamadi' } });
    }

    // Stats summary
    const totalGames = db.prepare('SELECT COUNT(*) as c FROM game_history WHERE license_id=?').get(license.id).c;
    const totalCards = db.prepare('SELECT COALESCE(SUM(total_cards_opened),0) as c FROM game_history WHERE license_id=?').get(license.id).c;
    const totalDuration = db.prepare('SELECT COALESCE(SUM(duration_seconds),0) as c FROM game_history WHERE license_id=?').get(license.id).c;
    const totalParticipants = db.prepare('SELECT COALESCE(SUM(total_participants),0) as c FROM game_history WHERE license_id=?').get(license.id).c;

    res.json({
      success: true,
      data: {
        profile: {
          name: license.owner_name,
          tiktok: license.owner_tiktok,
          plan: license.plan,
          member_since: license.created_at
        },
        stats: {
          total_games: totalGames,
          total_cards_opened: totalCards,
          total_duration_seconds: totalDuration,
          total_participants: totalParticipants
        }
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// GET /api/profile/:license_id/history - Get game history (public)
router.get('/:license_id/history', (req, res) => {
  try {
    const db = getDb();
    const license = db.prepare('SELECT id FROM licenses WHERE id=?').get(req.params.license_id);
    if (!license) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Profil bulunamadi' } });
    }

    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    const history = db.prepare(
      'SELECT id, tiktok_username, final_scores, statistics, duration_seconds, total_cards_opened, total_participants, created_at FROM game_history WHERE license_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(license.id, limitNum, (pageNum - 1) * limitNum);

    // Parse JSON fields
    const parsed = history.map(h => ({
      ...h,
      final_scores: h.final_scores ? JSON.parse(h.final_scores) : {},
      statistics: h.statistics ? JSON.parse(h.statistics) : {}
    }));

    const total = db.prepare('SELECT COUNT(*) as c FROM game_history WHERE license_id=?').get(license.id).c;

    res.json({
      success: true,
      data: {
        games: parsed,
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

module.exports = router;
