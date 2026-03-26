'use strict';

const { spawn } = require('child_process');
const path = require('path');
const net = require('net');
const WebSocket = require('ws');

// ---------------------------------------------------------------------------
// TikTokBridge  --  manages Python TikTok connector child processes
// ---------------------------------------------------------------------------
class TikTokBridge {
  constructor() {
    /** @type {Map<string, {process: ChildProcess, wsServer: WebSocket.Server, wsPort: number}>} */
    this.processes = new Map();
    this._nextPort = 9001;
  }

  // -------------------------------------------------------------------------
  // startSession
  //   sessionId      - uuid
  //   tiktokUsername  - TikTok live username
  //   onEvent         - callback(event) where event = { type, data, session_id }
  // -------------------------------------------------------------------------
  async startSession(sessionId, tiktokUsername, onEvent) {
    if (this.processes.has(sessionId)) {
      throw new Error(`Session zaten calisiyor: ${sessionId}`);
    }

    const wsPort = await this.getAvailablePort();

    // Create internal WebSocket server for Python -> Node communication
    const wsServer = new WebSocket.Server({ port: wsPort });

    wsServer.on('connection', (ws) => {
      ws.on('message', (raw) => {
        try {
          const event = JSON.parse(raw.toString());
          event.session_id = sessionId;
          if (typeof onEvent === 'function') {
            onEvent(event);
          }
        } catch (err) {
          console.error(`[tiktok-bridge] WS parse hatasi (session ${sessionId}):`, err.message);
        }
      });
    });

    wsServer.on('error', (err) => {
      console.error(`[tiktok-bridge] WS server hatasi (session ${sessionId}):`, err.message);
    });

    // Spawn Python connector process
    const pythonScript = path.join(__dirname, '..', 'python', 'tiktok_connector.py');

    const pyProcess = spawn(process.platform === 'win32' ? 'python' : 'python3', [
      pythonScript,
      tiktokUsername,
      String(wsPort),
      sessionId,
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    // Log stdout / stderr from Python
    if (pyProcess.stdout) {
      pyProcess.stdout.on('data', (data) => {
        console.log(`[tiktok-py:${sessionId}] ${data.toString().trim()}`);
      });
    }

    if (pyProcess.stderr) {
      pyProcess.stderr.on('data', (data) => {
        console.error(`[tiktok-py:${sessionId}] STDERR: ${data.toString().trim()}`);
      });
    }

    // Handle process exit
    pyProcess.on('exit', (code, signal) => {
      console.log(`[tiktok-bridge] Python process cikti (session ${sessionId}), code=${code}, signal=${signal}`);
      this._cleanup(sessionId);

      if (typeof onEvent === 'function') {
        onEvent({
          type: 'process_exit',
          data: { code, signal },
          session_id: sessionId,
        });
      }
    });

    pyProcess.on('error', (err) => {
      console.error(`[tiktok-bridge] Python spawn hatasi (session ${sessionId}):`, err.message);
      this._cleanup(sessionId);

      if (typeof onEvent === 'function') {
        onEvent({
          type: 'process_error',
          data: { message: err.message },
          session_id: sessionId,
        });
      }
    });

    this.processes.set(sessionId, {
      process: pyProcess,
      wsServer,
      wsPort,
    });

    return { wsPort, pid: pyProcess.pid };
  }

  // -------------------------------------------------------------------------
  // stopSession
  // -------------------------------------------------------------------------
  stopSession(sessionId) {
    const entry = this.processes.get(sessionId);
    if (!entry) return false;

    // Kill the python process
    try {
      if (entry.process && !entry.process.killed) {
        entry.process.kill('SIGTERM');
        // Force kill after 3 seconds if still alive
        setTimeout(() => {
          try {
            if (entry.process && !entry.process.killed) {
              entry.process.kill('SIGKILL');
            }
          } catch (_) { /* ignore */ }
        }, 3000);
      }
    } catch (err) {
      console.error(`[tiktok-bridge] Kill hatasi (session ${sessionId}):`, err.message);
    }

    // Close WS server
    this._closeWsServer(entry.wsServer);

    this.processes.delete(sessionId);
    return true;
  }

  // -------------------------------------------------------------------------
  // isRunning
  // -------------------------------------------------------------------------
  isRunning(sessionId) {
    const entry = this.processes.get(sessionId);
    if (!entry) return false;
    return entry.process && !entry.process.killed;
  }

  // -------------------------------------------------------------------------
  // getAvailablePort  --  find unused TCP port starting from _nextPort
  // -------------------------------------------------------------------------
  async getAvailablePort() {
    const startPort = this._nextPort;
    const endPort = 9500;

    for (let port = startPort; port <= endPort; port++) {
      const available = await this._isPortFree(port);
      if (available) {
        this._nextPort = port + 1;
        if (this._nextPort > endPort) this._nextPort = 9001;
        return port;
      }
    }

    // Wrap around and try from 9001
    for (let port = 9001; port < startPort; port++) {
      const available = await this._isPortFree(port);
      if (available) {
        this._nextPort = port + 1;
        return port;
      }
    }

    throw new Error('Kullanilabilir port bulunamadi (9001-9500)');
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------
  _isPortFree(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close(() => resolve(true));
      });
      server.listen(port, '127.0.0.1');
    });
  }

  _closeWsServer(wsServer) {
    if (!wsServer) return;
    try {
      // Close all connected clients
      wsServer.clients.forEach((client) => {
        try { client.terminate(); } catch (_) { /* ignore */ }
      });
      wsServer.close();
    } catch (err) {
      console.error('[tiktok-bridge] WS server kapatma hatasi:', err.message);
    }
  }

  _cleanup(sessionId) {
    const entry = this.processes.get(sessionId);
    if (!entry) return;
    this._closeWsServer(entry.wsServer);
    this.processes.delete(sessionId);
  }
}

// Export singleton
module.exports = new TikTokBridge();
