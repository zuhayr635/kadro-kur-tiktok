'use strict';

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server: SocketIO } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const { initDatabase, getDb } = require('./database');
const {
  loadActiveSessions,
  createSession,
  stopSession,
  getSession,
  getActiveSessions,
  updateGameState,
  updateTeamSettings,
  updateGameSettings,
} = require('./session-manager');
const {
  initGameState,
  drawCard,
  undoLastAction,
  endGame,
  getCardTier,
} = require('./game-engine');
const tiktokBridge = require('./tiktok-bridge');

// Route imports
const healthRouter = require('./routes/health');
const adminRouter = require('./routes/admin');
const licensesRouter = require('./routes/licenses');
const sessionsRouter = require('./routes/sessions');
const gameRouter = require('./routes/game');
const profileRouter = require('./routes/profile');
const statsRouter = require('./routes/stats');
const logsRouter = require('./routes/logs');

// JWT_SECRET check
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET env degiskeni tanimli degil');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server, { cors: { origin: '*' } });

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Static: data/uploads with CORS header for html2canvas
app.use(
  '/data/uploads',
  (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  },
  express.static(path.join(__dirname, '..', 'data', 'uploads'))
);

// Static: public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api/health', healthRouter);
app.use('/api/admin', adminRouter);
app.use('/api/licenses', licensesRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/license', sessionsRouter);
app.use('/api/game', gameRouter);
app.use('/api/profile', profileRouter);
app.use('/api/stats', statsRouter);
app.use('/api/logs', logsRouter);

// SPA fallback for game pages
const spaPages = ['game', 'panel', 'licensepanel', 'profile'];
spaPages.forEach((page) => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', page, 'index.html'));
  });
  app.get(`/${page}/*`, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', page, 'index.html'));
  });
});

// ---------------------------------------------------------------------------
// Socket.io  --  session rooms and panel commands
// ---------------------------------------------------------------------------
io.on('connection', (socket) => {

  // Join a session room
  socket.on('join-session', (sessionId) => {
    socket.join(`session_${sessionId}`);
    const session = getSession(sessionId);
    if (session) {
      socket.emit('session-state', {
        sessionId,
        gameState: JSON.parse(session.game_state || '{}'),
        teamSettings: JSON.parse(session.team_settings || '{}'),
        gameSettings: JSON.parse(session.game_settings || '{}'),
        status: session.status,
      });
    }
  });

  // Leave a session room
  socket.on('leave-session', (sessionId) => {
    socket.leave(`session_${sessionId}`);
  });

  // ------ Panel commands ------

  // Initialize game state for a session
  socket.on('init-game', (data, ack) => {
    try {
      const { sessionId, teamSettings } = data;
      const gameState = initGameState(teamSettings);
      updateGameState(sessionId, gameState);
      if (teamSettings) updateTeamSettings(sessionId, teamSettings);

      io.to(`session_${sessionId}`).emit('game-state-updated', {
        sessionId,
        gameState,
      });

      if (typeof ack === 'function') ack({ success: true, gameState });
    } catch (err) {
      if (typeof ack === 'function') ack({ success: false, error: err.message });
    }
  });

  // Assign card (draw)
  socket.on('assign-card', (data, ack) => {
    try {
      const { sessionId, teamIndex, tier } = data;
      const result = drawCard(sessionId, teamIndex, tier);
      const session = getSession(sessionId);
      const gameState = JSON.parse(session.game_state || '{}');

      io.to(`session_${sessionId}`).emit('card-assigned', {
        sessionId,
        result,
        gameState,
      });

      if (typeof ack === 'function') ack({ success: true, result });
    } catch (err) {
      if (typeof ack === 'function') ack({ success: false, error: err.message });
    }
  });

  // Undo last action
  socket.on('undo-action', (data, ack) => {
    try {
      const { sessionId } = data;
      const result = undoLastAction(sessionId);
      const session = getSession(sessionId);
      const gameState = JSON.parse(session.game_state || '{}');

      io.to(`session_${sessionId}`).emit('game-state-updated', {
        sessionId,
        gameState,
        undone: result,
      });

      if (typeof ack === 'function') ack({ success: true, result });
    } catch (err) {
      if (typeof ack === 'function') ack({ success: false, error: err.message });
    }
  });

  // End game
  socket.on('end-game', (data, ack) => {
    try {
      const { sessionId } = data;
      const result = endGame(sessionId);

      io.to(`session_${sessionId}`).emit('game-ended', {
        sessionId,
        rankings: result.rankings,
        gameState: result.gameState,
      });

      if (typeof ack === 'function') ack({ success: true, rankings: result.rankings });
    } catch (err) {
      if (typeof ack === 'function') ack({ success: false, error: err.message });
    }
  });

  // Update team settings
  socket.on('update-team-settings', (data, ack) => {
    try {
      const { sessionId, settings } = data;
      updateTeamSettings(sessionId, settings);

      io.to(`session_${sessionId}`).emit('team-settings-updated', {
        sessionId,
        settings,
      });

      if (typeof ack === 'function') ack({ success: true });
    } catch (err) {
      if (typeof ack === 'function') ack({ success: false, error: err.message });
    }
  });

  // Update game settings
  socket.on('update-game-settings', (data, ack) => {
    try {
      const { sessionId, settings } = data;
      updateGameSettings(sessionId, settings);

      io.to(`session_${sessionId}`).emit('game-settings-updated', {
        sessionId,
        settings,
      });

      if (typeof ack === 'function') ack({ success: true });
    } catch (err) {
      if (typeof ack === 'function') ack({ success: false, error: err.message });
    }
  });

  // Start TikTok connection
  socket.on('start-tiktok', async (data, ack) => {
    try {
      const { sessionId, tiktokUsername } = data;

      const onEvent = (event) => {
        io.to(`session_${sessionId}`).emit('tiktok-event', event);
      };

      const { wsPort, pid } = await tiktokBridge.startSession(sessionId, tiktokUsername, onEvent);

      // Update session with python pid and ws port
      getDb().prepare('UPDATE sessions SET python_pid = ?, ws_port = ? WHERE session_id = ?')
        .run(pid || null, wsPort, sessionId);

      io.to(`session_${sessionId}`).emit('tiktok-started', {
        sessionId,
        wsPort,
        pid,
      });

      if (typeof ack === 'function') ack({ success: true, wsPort, pid });
    } catch (err) {
      if (typeof ack === 'function') ack({ success: false, error: err.message });
    }
  });

  // Stop TikTok connection
  socket.on('stop-tiktok', (data, ack) => {
    try {
      const { sessionId } = data;
      tiktokBridge.stopSession(sessionId);

      io.to(`session_${sessionId}`).emit('tiktok-stopped', { sessionId });

      if (typeof ack === 'function') ack({ success: true });
    } catch (err) {
      if (typeof ack === 'function') ack({ success: false, error: err.message });
    }
  });

  // Stop entire session
  socket.on('stop-session', (data, ack) => {
    try {
      const { sessionId } = data;

      // Stop TikTok bridge if running
      if (tiktokBridge.isRunning(sessionId)) {
        tiktokBridge.stopSession(sessionId);
      }

      const session = stopSession(sessionId);

      io.to(`session_${sessionId}`).emit('session-ended', { sessionId });

      if (typeof ack === 'function') ack({ success: true, session });
    } catch (err) {
      if (typeof ack === 'function') ack({ success: false, error: err.message });
    }
  });
});

// Initialize DB, create default admin, seed players if empty, load active sessions
initDatabase();
adminRouter.ensureAdmin().catch(console.error);

// Auto-seed players if DB is empty
const playerCount = getDb().prepare('SELECT COUNT(*) as c FROM players').get().c;
if (playerCount === 0) {
  console.log('Oyuncu verisi bulunamadi, otomatik seed baslatiliyor...');
  try {
    // Dynamic require to avoid loading large arrays unless needed
    const seedModule = require('./seed-auto');
    seedModule.seedPlayers(getDb());
    console.log('Oyuncu verisi basariyla yuklendi.');
  } catch (e) {
    console.error('Oyuncu seed hatasi:', e.message);
    console.log('Manuel olarak "npm run seed" komutunu calistirin.');
  }
}

loadActiveSessions();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`KADRO KUR sunucu baslatildi: http://localhost:${PORT}`);
});

module.exports = { app, io, server };
