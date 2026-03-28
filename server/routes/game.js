'use strict';

const express = require('express');
const { getDb } = require('../database');
const sm = require('../session-manager');
const ge = require('../game-engine');

// Factory: accepts io so routes can emit socket events
module.exports = function createGameRouter(io) {
const router = express.Router();

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
// Accepts either { teams: [...] } or single team { name, color, formation }
router.post('/:session_id/team', (req, res) => {
  try {
    const session = sm.getSession(req.params.session_id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session bulunamadi' } });
    }

    const { teams, name, color, formation } = req.body;

    if (teams && Array.isArray(teams)) {
      // Bulk update: { teams: [{name, color, formation}, ...] }
      const updated = sm.updateTeamSettings(req.params.session_id, { teams });
      return res.json({ success: true, data: updated });
    }

    if (name || color || formation) {
      // Single team update - merge into existing settings
      const existing = typeof session.team_settings === 'string' ? JSON.parse(session.team_settings || '{}') : (session.team_settings || {});
      if (!existing.teams) existing.teams = [{}, {}, {}, {}];
      // Find first team without a name or append
      const teamData = { name: name || undefined, color: color || undefined, formation: formation || undefined };
      // For single updates, update the team settings directly
      const updated = sm.updateTeamSettings(req.params.session_id, { ...existing, singleUpdate: teamData });
      return res.json({ success: true, data: updated });
    }

    res.status(400).json({ success: false, error: { code: 'INVALID_DATA', message: 'teams dizisi veya name/color/formation gerekli' } });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// POST /api/game/:session_id/start - Start game
router.post('/:session_id/start', (req, res) => {
  try {
    const session = sm.getSession(req.params.session_id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session bulunamadi' } });
    }

    // Auto-init if needed
    let gameState;
    try { gameState = JSON.parse(session.game_state || '{}'); } catch (_) { gameState = {}; }
    if (!gameState.teams) {
      const teamSettings = typeof session.team_settings === 'string' ? JSON.parse(session.team_settings || '{}') : (session.team_settings || {});
      gameState = ge.initGameState(teamSettings);
    }
    gameState.status = 'running';
    gameState.startedAt = gameState.startedAt || new Date().toISOString();
    sm.updateGameState(req.params.session_id, gameState);

    res.json({ success: true, data: { status: 'running', gameState } });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// POST /api/game/:session_id/pause - Pause/resume game
router.post('/:session_id/pause', (req, res) => {
  try {
    const session = sm.getSession(req.params.session_id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session bulunamadi' } });
    }

    let gameState;
    try { gameState = JSON.parse(session.game_state || '{}'); } catch (_) { gameState = {}; }
    gameState.status = gameState.status === 'paused' ? 'running' : 'paused';
    sm.updateGameState(req.params.session_id, gameState);

    res.json({ success: true, data: { status: gameState.status } });
  } catch (e) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// POST /api/game/:session_id/init - Initialize game state
router.post('/:session_id/init', (req, res) => {
  try {
    const session = sm.getSession(req.params.session_id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session bulunamadi' } });
    }

    const teamSettings = typeof session.team_settings === 'string' ? JSON.parse(session.team_settings) : (session.team_settings || {});
    const gameState = ge.initGameState(teamSettings);
    sm.updateGameState(req.params.session_id, gameState);

    res.json({ success: true, data: gameState });
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

    // Auto-init game if not started yet
    let gameState;
    try { gameState = JSON.parse(session.game_state || '{}'); } catch (_) { gameState = {}; }
    if (!gameState.teams) {
      const teamSettings = typeof session.team_settings === 'string' ? JSON.parse(session.team_settings) : (session.team_settings || {});
      const initState = ge.initGameState(teamSettings);
      sm.updateGameState(req.params.session_id, initState);
    }

    const { team_index, tier, username } = req.body;
    if (team_index === undefined || !tier) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'team_index ve tier zorunludur' } });
    }

    const result = ge.drawCard(req.params.session_id, team_index, tier);
    if (!result) {
      return res.status(404).json({ success: false, error: { code: 'NO_CARD', message: 'Uygun oyuncu bulunamadi' } });
    }

    // Emit socket events so overlay and panel update in real-time
    const sessionId = req.params.session_id;
    const updatedSession = sm.getSession(sessionId);
    const updatedGameState = updatedSession ? JSON.parse(updatedSession.game_state || '{}') : {};
    if (io) {
      io.to('session_' + sessionId).emit('card-result', {
        action: result.action,
        player: result.player,
        oldPlayer: result.oldPlayer,
        teamIndex: result.team ? result.team.index : team_index,
        position: result.position,
      });
      io.to('session_' + sessionId).emit('game-state-updated', {
        sessionId,
        gameState: updatedGameState,
      });
    }

    res.json({ success: true, data: result });
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

    const undone = ge.undoLastAction(req.params.session_id);
    if (!undone) {
      return res.status(400).json({ success: false, error: { code: 'NOTHING_TO_UNDO', message: 'Geri alinacak islem yok' } });
    }

    res.json({ success: true, data: undone });
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

    // Auto-init if game not started
    let gameState;
    try { gameState = JSON.parse(session.game_state || '{}'); } catch (_) { gameState = {}; }
    if (!gameState.teams) {
      const teamSettings = typeof session.team_settings === 'string' ? JSON.parse(session.team_settings || '{}') : (session.team_settings || {});
      const initState = ge.initGameState(teamSettings);
      sm.updateGameState(req.params.session_id, initState);
    }

    const result = ge.endGame(req.params.session_id);

    res.json({ success: true, data: { message: 'Oyun bitti', ...result } });
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

return router;
}; // end createGameRouter
