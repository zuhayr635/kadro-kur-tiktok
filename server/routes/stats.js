'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { authMiddleware } = require('../auth');
const os = require('os');

// GET /api/stats/overview - Genel istatistikler
router.get('/overview', authMiddleware, (req, res) => {
  try {
    const db = getDb();

    const totalLicenses = db.prepare('SELECT COUNT(*) as c FROM licenses').get().c;
    const activeLicenses = db.prepare("SELECT COUNT(*) as c FROM licenses WHERE status='active'").get().c;
    const suspendedLicenses = db.prepare("SELECT COUNT(*) as c FROM licenses WHERE status='suspended'").get().c;
    const expiredLicenses = db.prepare("SELECT COUNT(*) as c FROM licenses WHERE status='expired'").get().c;

    const activeSessions = db.prepare("SELECT COUNT(*) as c FROM sessions WHERE status='active'").get().c;
    const totalSessions = db.prepare('SELECT COUNT(*) as c FROM sessions').get().c;

    const totalGames = db.prepare('SELECT COUNT(*) as c FROM game_history').get().c;
    const totalCardsOpened = db.prepare('SELECT COALESCE(SUM(total_cards_opened),0) as c FROM game_history').get().c;
    const totalParticipants = db.prepare('SELECT COALESCE(SUM(total_participants),0) as c FROM game_history').get().c;
    const avgDuration = db.prepare('SELECT COALESCE(AVG(duration_seconds),0) as c FROM game_history').get().c;

    const totalPlayers = db.prepare('SELECT COUNT(*) as c FROM players WHERE is_active=1').get().c;

    // Bu ay yeni lisanslar
    const thisMonthLicenses = db.prepare(
      "SELECT COUNT(*) as c FROM licenses WHERE created_at >= date('now','start of month')"
    ).get().c;

    // Plan dagilimi
    const planDistribution = db.prepare(
      "SELECT plan, COUNT(*) as count FROM licenses GROUP BY plan"
    ).all();

    // En aktif kullanicilar (top 10)
    const topUsers = db.prepare(`
      SELECT l.owner_name, l.owner_tiktok, l.plan, COUNT(gh.id) as game_count,
             COALESCE(SUM(gh.total_cards_opened),0) as total_cards
      FROM licenses l
      LEFT JOIN game_history gh ON gh.license_id = l.id
      GROUP BY l.id
      ORDER BY game_count DESC
      LIMIT 10
    `).all();

    res.json({
      success: true,
      data: {
        licenses: { total: totalLicenses, active: activeLicenses, suspended: suspendedLicenses, expired: expiredLicenses, this_month: thisMonthLicenses },
        sessions: { active: activeSessions, total: totalSessions },
        games: { total: totalGames, total_cards_opened: totalCardsOpened, total_participants: totalParticipants, avg_duration_seconds: Math.round(avgDuration) },
        players: { total: totalPlayers },
        plan_distribution: planDistribution,
        top_users: topUsers
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// GET /api/stats/usage - Kullanim grafik verileri
router.get('/usage', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { days = 30 } = req.query;

    // Son N gun lisans aktivasyonu
    const dailyLicenses = db.prepare(`
      SELECT date(created_at) as day, COUNT(*) as count
      FROM licenses
      WHERE created_at >= date('now', '-' || ? || ' days')
      GROUP BY date(created_at)
      ORDER BY day
    `).all(Number(days));

    // Son N gun session sayisi
    const dailySessions = db.prepare(`
      SELECT date(started_at) as day, COUNT(*) as count
      FROM sessions
      WHERE started_at >= date('now', '-' || ? || ' days')
      GROUP BY date(started_at)
      ORDER BY day
    `).all(Number(days));

    // Son N gun oyun sayisi
    const dailyGames = db.prepare(`
      SELECT date(created_at) as day, COUNT(*) as count
      FROM game_history
      WHERE created_at >= date('now', '-' || ? || ' days')
      GROUP BY date(created_at)
      ORDER BY day
    `).all(Number(days));

    res.json({
      success: true,
      data: {
        daily_licenses: dailyLicenses,
        daily_sessions: dailySessions,
        daily_games: dailyGames
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// GET /api/stats/system - Sistem performansi
router.get('/system', authMiddleware, (req, res) => {
  try {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    res.json({
      success: true,
      data: {
        uptime_seconds: Math.round(uptime),
        memory: {
          rss_mb: Math.round(memUsage.rss / 1024 / 1024),
          heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
          heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024)
        },
        os: {
          platform: os.platform(),
          cpus: os.cpus().length,
          total_memory_mb: Math.round(os.totalmem() / 1024 / 1024),
          free_memory_mb: Math.round(os.freemem() / 1024 / 1024),
          load_avg: os.loadavg()
        },
        node_version: process.version
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

module.exports = router;
