'use strict';

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server: SocketIO } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const { initDatabase } = require('./database');
const { loadActiveSessions } = require('./session-manager');

// Route imports
const healthRouter = require('./routes/health');
const adminRouter = require('./routes/admin');
const licensesRouter = require('./routes/licenses');
const sessionsRouter = require('./routes/sessions');
const gameRouter = require('./routes/game');
const profileRouter = require('./routes/profile');

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
app.use('/api/game', gameRouter);
app.use('/api/profile', profileRouter);

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

// Socket.io
io.on('connection', (socket) => {
  socket.on('join-session', (sessionId) => {
    socket.join(`session_${sessionId}`);
  });
});

// Initialize DB and load active sessions
initDatabase();
loadActiveSessions();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`KADRO KUR sunucu baslatildi: http://localhost:${PORT}`);
});

module.exports = { app, io };
