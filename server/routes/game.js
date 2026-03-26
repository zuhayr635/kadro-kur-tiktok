'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const sm = require('../session-manager');
const ge = require('../game-engine');

// GET /api/game/:session_id - Get game state
router.get('/:session_id', (req, res) => {
  try {
    const session = sm.getSession(req.params.session_id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session bulunamadi' } });
    }

    const gameState = typeof session.game_state === 'string' ? JSON.parse(session.game_state) : session.game_state;
    const teamSettings = typeof session.team_settings === 'string' ? JSON.parse(session.team_settings) : session.team_settings;
    const gameSettings = typeof session.game_settings === 'string' ? JSON.parse(session.game_settings) : session.game_settings;

    res.json({
      success: true,
      data: {
        session_id: session.session_id,
        status: session.status,
        game_state: gameState,
        team_settings: teamSettings,
        game_settings: gameSettings,
        layout: session.layout,
        started_at: session.started_at
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// POST /api/game/:session_id/settings - Update game settings
router.post('/:session_id/settings', (req, res) => {
  try {
    const session = sm.getSession(req.params.session_id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session bulunamadi' } });
    }

    const { like_threshold, tier_ranges, formations, league_filter } = req.body;
    const settings = {};
    if (like_threshold !== undefined) settings.like_threshold = like_threshold;
    if (tier_ranges !== undefined) settings.tier_ranges = tier_ranges;
    if (formations !== undefined) settings.formations = formations;
    if (league_filter !== undefined) settings.league_filter = league_filter;

    const updated = sm.updateGameSettings(req.params.session_id, settings);
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// POST /api/game/:session_id/team - Update team settings
router.post('/:session_id/team', (req, res) => {
  try {
    const session = sm.getSession(req.params.session_id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session bulunamadi' } });
    }

    const { teams } = req.body;
    if (!teams || !Array.isArray(teams)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DATA', message: 'teams bir dizi olmalidir' } });
    }

    const updated = sm.updateTeamSettings(req.params.session_id, { teams });
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// POST /api/game/:session_id/draw - Draw card and assign to team
router.post('/:session_id/draw', (req, res) => {
  try {
    const session = sm.getSession(req.params.session_id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session bulunamadi' } });
    }

    const { team_index, tier, username } = req.body;
    if (team_index === undefined || !tier) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'team_index ve tier zorunludur' } });
    }

    const card = ge.drawCard(session, tier, team_index);
    if (!card) {
      return res.status(404).json({ success: false, error: { code: 'NO_CARD', message: 'Uygun oyuncu bulunamadi' } });
    }

    // Save to used_players
    getDb().prepare(
      'INSERT INTO used_players (session_id, player_id, team_index, position) VALUES (?,?,?,?)'
    ).run(session.id, card.player_id, team_index, card.position || null);

    // Update game state
    const gameState = typeof session.game_state === 'string' ? JSON.parse(session.game_state) : (session.game_state || {});
    if (!gameState.cards) gameState.cards = [];
    gameState.cards.push({
      player_id: card.player_id,
      team_index,
      tier,
      username: username || null,
      drawn_at: new Date().toISOString()
    });
    sm.updateGameState(req.params.session_id, gameState);

    res.json({ success: true, data: card });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// POST /api/game/:session_id/undo - Undo last action
router.post('/:session_id/undo', (req, res) => {
  try {
    const session = sm.getSession(req.params.session_id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session bulunamadi' } });
    }

    const result = ge.undoLastAction(session);
    if (!result) {
      return res.status(400).json({ success: false, error: { code: 'NOTHING_TO_UNDO', message: 'Geri alinacak islem yok' } });
    }

    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// POST /api/game/:session_id/end - End game, save history
router.post('/:session_id/end', (req, res) => {
  try {
    const session = sm.getSession(req.params.session_id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session bulunamadi' } });
    }

    const result = ge.endGame(session);

    // Calculate duration
    const startedAt = new Date(session.started_at);
    const durationSeconds = Math.round((Date.now() - startedAt.getTime()) / 1000);

    // Count cards and participants
    const usedPlayers = getDb().prepare('SELECT COUNT(*) as c FROM used_players WHERE session_id=?').get(session.id);
    const participants = getDb().prepare('SELECT COUNT(DISTINCT team_index) as c FROM used_players WHERE session_id=?').get(session.id);

    // Save to game_history
    getDb().prepare(`
      INSERT INTO game_history (session_id, license_id, tiktok_username, final_scores, statistics, duration_seconds, total_cards_opened, total_participants)
      VALUES (?,?,?,?,?,?,?,?)
    `).run(
      session.id,
      session.license_id,
      session.tiktok_username,
      JSON.stringify(result.final_scores || {}),
      JSON.stringify(result.statistics || {}),
      durationSeconds,
      usedPlayers.c,
      participants.c
    );

    // Stop the session
    sm.stopSession(req.params.session_id);

    res.json({ success: true, data: { message: 'Oyun bitti', ...result, duration_seconds: durationSeconds } });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// GET /api/game/:session_id/queue - Get pending card requests
router.get('/:session_id/queue', (req, res) => {
  try {
    const session = sm.getSession(req.params.session_id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session bulunamadi' } });
    }

    const gameState = typeof session.game_state === 'string' ? JSON.parse(session.game_state) : (session.game_state || {});
    const queue = gameState.queue || [];

    res.json({ success: true, data: queue });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

module.exports = router;
