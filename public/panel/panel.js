/* ======================================================
   KADRO KUR - Broadcaster Control Panel (panel.js)
   ====================================================== */

(function () {
  'use strict';

  // ---- State ----
  const state = {
    licenseKey: null,
    licenseInfo: null,
    sessionId: null,
    socket: null,
    tiktokConnected: false,
    gameStatus: 'idle', // idle | running | paused | ended
    teams: [
      { name: 'Takim 1', color: '#e94560', formation: '4-3-3', emblemFile: null },
      { name: 'Takim 2', color: '#3498db', formation: '4-3-3', emblemFile: null },
      { name: 'Takim 3', color: '#2ecc71', formation: '4-3-3', emblemFile: null },
      { name: 'Takim 4', color: '#f1c40f', formation: '4-3-3', emblemFile: null },
    ],
    requestQueue: [],
    selectedRequest: null,
    actionLog: [],
    teamPlayers: [[], [], [], []],
    totalLikes: 0,
    totalCards: 0,
    totalViewers: 0,
    bestOvr: 0,
  };

  const FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '3-4-3', '5-3-2'];
  const TIER_NAMES = ['Bronz', 'Gumus', 'Altin', 'Elmas'];

  // Formation position maps (percentage-based x,y on mini pitch)
  const FORMATION_POSITIONS = {
    '4-3-3': [
      [50,90],
      [15,70],[38,70],[62,70],[85,70],
      [25,45],[50,45],[75,45],
      [20,20],[50,15],[80,20],
    ],
    '4-4-2': [
      [50,90],
      [15,70],[38,70],[62,70],[85,70],
      [15,45],[38,45],[62,45],[85,45],
      [35,18],[65,18],
    ],
    '3-5-2': [
      [50,90],
      [25,70],[50,70],[75,70],
      [10,45],[30,42],[50,38],[70,42],[90,45],
      [35,18],[65,18],
    ],
    '4-2-3-1': [
      [50,90],
      [15,72],[38,72],[62,72],[85,72],
      [35,55],[65,55],
      [20,35],[50,30],[80,35],
      [50,14],
    ],
    '3-4-3': [
      [50,90],
      [25,70],[50,70],[75,70],
      [15,45],[40,45],[60,45],[85,45],
      [20,20],[50,15],[80,20],
    ],
    '5-3-2': [
      [50,90],
      [10,70],[30,70],[50,70],[70,70],[90,70],
      [25,45],[50,42],[75,45],
      [35,18],[65,18],
    ],
  };

  // ---- DOM Helpers ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function show(el) { if (typeof el === 'string') el = $(el); if (el) el.style.display = ''; }
  function hide(el) { if (typeof el === 'string') el = $(el); if (el) el.style.display = 'none'; }

  function formatTime(d) {
    if (!d) d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return h + ':' + m + ':' + s;
  }

  // ---- API Helper ----
  async function api(method, path, body) {
    const opts = {
      method,
      headers: {},
    };
    if (body && !(body instanceof FormData)) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      opts.body = body;
    }
    if (state.licenseKey) {
      opts.headers['x-license-key'] = state.licenseKey;
    }
    try {
      const res = await fetch(path, opts);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.message || (typeof data.error === 'string' ? data.error : 'API hatasi'));
      return data;
    } catch (err) {
      console.error('API Error:', method, path, err);
      throw err;
    }
  }

  // ---- License Login ----
  function initLogin() {
    const input = $('#license-input');
    const btn = $('#login-btn');
    const errorEl = $('#login-error');

    // Auto-format license key input
    input.addEventListener('input', function () {
      let v = this.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const parts = [];
      for (let i = 0; i < v.length && parts.length < 4; i += 4) {
        parts.push(v.substring(i, i + 4));
      }
      this.value = parts.join('-');
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') btn.click();
    });

    btn.addEventListener('click', async function () {
      const key = input.value.trim();
      if (!key) return;

      hide(errorEl);
      btn.disabled = true;
      btn.textContent = 'Dogrulaniyor...';

      try {
        const data = await api('POST', '/api/license/validate', { license_key: key });
        state.licenseKey = key;
        state.licenseInfo = data;
        hide('#login-screen');
        show('#main-panel');
        afterLogin();
      } catch (err) {
        errorEl.textContent = err.message || 'Lisans dogrulanamadi.';
        show(errorEl);
      } finally {
        btn.disabled = false;
        btn.innerHTML =
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Giris Yap';
      }
    });
  }

  // ---- After Login: Create Session & Socket ----
  async function afterLogin() {
    try {
      const data = await api('POST', '/api/sessions/create', {
        license_key: state.licenseKey,
        tiktok_username: state.licenseInfo?.data?.owner_tiktok || state.licenseInfo?.owner_tiktok || 'unknown'
      });
      state.sessionId = data.data?.session_id || data.session_id || data.sessionId || data.id;
      const origin = window.location.origin;
      const obsUrl = origin + '/game?session=' + state.sessionId;
      $('#obs-url').textContent = obsUrl;
      connectSocket();
      buildTeamCards();
      buildTeamButtons();
      buildFormations();
      setSessionStatus(true);
    } catch (err) {
      console.error('Session create failed:', err);
      addLog('Oturum olusturulamadi: ' + err.message);
    }
  }

  // ---- Socket.io ----
  function connectSocket() {
    if (state.socket) state.socket.disconnect();
    const socket = io({ query: { session_id: state.sessionId } });
    state.socket = socket;

    socket.on('connect', function () {
      socket.emit('join-session', { session_id: state.sessionId });
      setSessionStatus(true);
      addLog('Sunucuya baglandi.');
    });

    socket.on('disconnect', function () {
      setSessionStatus(false);
      addLog('Sunucu baglantisi kesildi.');
    });

    socket.on('new-request', function (data) {
      addRequest(data);
    });

    socket.on('like-update', function (data) {
      state.totalLikes = data.total || state.totalLikes;
    });

    socket.on('tiktok-status', function (data) {
      setTikTokStatus(data.connected);
    });

    socket.on('card-result', function (data) {
      showCardResult(data);
      updateFormations(data);
      state.totalCards++;
      if (data.player && data.player.ovr > state.bestOvr) {
        state.bestOvr = data.player.ovr;
      }
    });

    socket.on('game-state', function (data) {
      if (data.status) {
        state.gameStatus = data.status;
        updateGameControls();
      }
      if (data.teamPlayers) {
        state.teamPlayers = data.teamPlayers;
        rebuildFormations();
      }
      if (data.remaining !== undefined) {
        $('#remaining-count').textContent = data.remaining;
      }
    });
  }

  function setSessionStatus(online) {
    const el = $('#session-status');
    const txt = $('#session-status-text');
    if (online) {
      el.className = 'status-badge status-online';
      txt.textContent = 'Bagli';
    } else {
      el.className = 'status-badge status-offline';
      txt.textContent = 'Baglanti yok';
    }
  }

  // ---- Tab Navigation ----
  function initTabs() {
    $$('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const target = this.dataset.tab;
        $$('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        $$('.tab-content').forEach(function (c) { c.classList.remove('active'); });
        this.classList.add('active');
        const panel = document.getElementById(target);
        if (panel) panel.classList.add('active');
      });
    });
  }

  // ---- Copy OBS URL ----
  function initCopyObs() {
    $('#copy-obs-btn').addEventListener('click', function () {
      const url = $('#obs-url').textContent;
      if (!url || url === '--') return;
      navigator.clipboard.writeText(url).then(function () {
        const btn = $('#copy-obs-btn');
        btn.title = 'Kopyalandi!';
        setTimeout(function () { btn.title = 'Kopyala'; }, 2000);
      });
    });
  }

  // ---- TAB 1: Team Settings ----
  function buildTeamCards() {
    const grid = $('#teams-grid');
    grid.innerHTML = '';

    state.teams.forEach(function (team, i) {
      const card = document.createElement('div');
      card.className = 'team-card';
      card.innerHTML =
        '<div class="team-card-header">' +
          '<span class="team-number">' + (i + 1) + '</span>' +
          'Takim ' + (i + 1) +
        '</div>' +
        '<label>Takim Adi</label>' +
        '<input type="text" class="team-name-input" data-index="' + i + '" value="' + escHtml(team.name) + '" placeholder="Takim adi" />' +
        '<label>Amblem</label>' +
        '<div class="emblem-upload">' +
          '<label class="emblem-upload-btn" for="emblem-' + i + '">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
            ' Yukle' +
          '</label>' +
          '<input type="file" id="emblem-' + i + '" accept="image/*" data-index="' + i + '" />' +
          '<img class="emblem-preview" id="emblem-preview-' + i + '" alt="" />' +
        '</div>' +
        '<label>Renk</label>' +
        '<div class="team-card-color-row">' +
          '<input type="color" class="team-color-input" data-index="' + i + '" value="' + team.color + '" />' +
          '<span>' + team.color + '</span>' +
        '</div>' +
        '<label>Formasyon</label>' +
        '<select class="team-formation-select" data-index="' + i + '">' +
          FORMATIONS.map(function (f) {
            return '<option value="' + f + '"' + (f === team.formation ? ' selected' : '') + '>' + f + '</option>';
          }).join('') +
        '</select>';

      grid.appendChild(card);
    });

    // Event listeners
    $$('.team-name-input').forEach(function (inp) {
      inp.addEventListener('input', function () {
        state.teams[this.dataset.index].name = this.value;
      });
    });
    $$('.team-color-input').forEach(function (inp) {
      inp.addEventListener('input', function () {
        const idx = this.dataset.index;
        state.teams[idx].color = this.value;
        this.parentElement.querySelector('span').textContent = this.value;
      });
    });
    $$('.team-formation-select').forEach(function (sel) {
      sel.addEventListener('change', function () {
        state.teams[this.dataset.index].formation = this.value;
      });
    });
    $$('input[type="file"][id^="emblem-"]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        const idx = this.dataset.index;
        const file = this.files[0];
        if (!file) return;
        state.teams[idx].emblemFile = file;
        const preview = $('#emblem-preview-' + idx);
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
      });
    });

    // Save & Preview
    $('#save-teams-btn').addEventListener('click', saveTeams);
    $('#preview-teams-btn').addEventListener('click', function () {
      addLog('Takim onizlemesi gonderildi.');
      if (state.socket) {
        state.socket.emit('preview-teams', { teams: state.teams.map(sanitizeTeam) });
      }
    });
  }

  function sanitizeTeam(t) {
    return { name: t.name, color: t.color, formation: t.formation };
  }

  async function saveTeams() {
    if (!state.sessionId) return;
    try {
      for (let i = 0; i < state.teams.length; i++) {
        const t = state.teams[i];
        const fd = new FormData();
        fd.append('name', t.name);
        fd.append('color', t.color);
        fd.append('formation', t.formation);
        if (t.emblemFile) fd.append('emblem', t.emblemFile);
        await api('POST', '/api/game/' + state.sessionId + '/team', fd);
      }
      addLog('Takim ayarlari kaydedildi.');
      buildTeamButtons();
      buildFormations();
    } catch (err) {
      addLog('Takim kaydi hatasi: ' + err.message);
    }
  }

  // ---- TAB 2: Game Settings ----
  function initSettings() {
    // TikTok connect
    $('#tiktok-connect-btn').addEventListener('click', function () {
      const username = $('#tiktok-username').value.trim().replace(/^@/, '');
      if (!username) return;
      if (state.socket) {
        state.socket.emit('connect-tiktok', { username: username, session_id: state.sessionId });
        addLog('TikTok baglantisi istendi: @' + username);
      }
    });

    $('#tiktok-disconnect-btn').addEventListener('click', function () {
      if (state.socket) {
        state.socket.emit('disconnect-tiktok', { session_id: state.sessionId });
        addLog('TikTok baglantisi kesildi.');
      }
    });

    // Save settings
    $('#save-settings-btn').addEventListener('click', saveSettings);
  }

  function setTikTokStatus(connected) {
    state.tiktokConnected = connected;
    const dot = $('#tiktok-status').querySelector('.status-dot-sm');
    const txt = $('#tiktok-status-text');
    if (connected) {
      dot.className = 'status-dot-sm status-dot-green';
      txt.textContent = 'Bagli';
      hide('#tiktok-connect-btn');
      show('#tiktok-disconnect-btn');
    } else {
      dot.className = 'status-dot-sm status-dot-red';
      txt.textContent = 'Bagli degil';
      show('#tiktok-connect-btn');
      hide('#tiktok-disconnect-btn');
    }
  }

  async function saveSettings() {
    if (!state.sessionId) return;
    const leagues = [];
    $$('.league-checkboxes input[type="checkbox"]').forEach(function (cb) {
      if (cb.checked) leagues.push(cb.value);
    });

    const payload = {
      like_threshold: parseInt($('#like-threshold').value, 10) || 50,
      tiers: [
        { min: parseInt($('#tier1-min').value, 10), max: parseInt($('#tier1-max').value, 10) },
        { min: parseInt($('#tier2-min').value, 10), max: parseInt($('#tier2-max').value, 10) },
        { min: parseInt($('#tier3-min').value, 10), max: parseInt($('#tier3-max').value, 10) },
        { min: parseInt($('#tier4-min').value, 10), max: parseInt($('#tier4-max').value, 10) },
      ],
      leagues: leagues,
    };

    try {
      const data = await api('POST', '/api/game/' + state.sessionId + '/settings', payload);
      if (data.totalCards !== undefined) {
        $('#total-cards-count').textContent = data.totalCards;
      }
      addLog('Oyun ayarlari kaydedildi.');
    } catch (err) {
      addLog('Ayar kaydi hatasi: ' + err.message);
    }
  }

  // ---- TAB 3: Card Distribution ----
  function initCards() {
    $('#game-start-btn').addEventListener('click', async function () {
      try {
        await api('POST', '/api/game/' + state.sessionId + '/start', {});
        state.gameStatus = 'running';
        updateGameControls();
        addLog('Oyun baslatildi.');
      } catch (err) { addLog('Baslat hatasi: ' + err.message); }
    });

    $('#game-pause-btn').addEventListener('click', async function () {
      try {
        await api('POST', '/api/game/' + state.sessionId + '/pause', {});
        state.gameStatus = state.gameStatus === 'paused' ? 'running' : 'paused';
        updateGameControls();
        addLog(state.gameStatus === 'paused' ? 'Oyun duraklatildi.' : 'Oyun devam ediyor.');
      } catch (err) { addLog('Duraklat hatasi: ' + err.message); }
    });

    $('#game-end-btn').addEventListener('click', async function () {
      if (!confirm('Oyunu bitirmek istediginize emin misiniz?')) return;
      endGame();
    });

    // Undo
    $('#undo-btn').addEventListener('click', async function () {
      if (!state.sessionId) return;
      try {
        await api('POST', '/api/game/' + state.sessionId + '/undo', {});
        addLog('Son islem geri alindi.');
      } catch (err) { addLog('Geri alma hatasi: ' + err.message); }
    });

    // Popup close
    $('#popup-close').addEventListener('click', function () {
      hide('#card-result-popup');
    });
  }

  function updateGameControls() {
    const startBtn = $('#game-start-btn');
    const pauseBtn = $('#game-pause-btn');
    const endBtn = $('#game-end-btn');

    switch (state.gameStatus) {
      case 'idle':
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        endBtn.disabled = true;
        break;
      case 'running':
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        pauseBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Duraklat';
        endBtn.disabled = false;
        enableTeamButtons(true);
        break;
      case 'paused':
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        pauseBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> Devam';
        endBtn.disabled = false;
        enableTeamButtons(false);
        break;
      case 'ended':
        startBtn.disabled = true;
        pauseBtn.disabled = true;
        endBtn.disabled = true;
        enableTeamButtons(false);
        break;
    }
  }

  function enableTeamButtons(enabled) {
    $$('.team-assign-btn').forEach(function (btn) {
      btn.disabled = !enabled;
    });
  }

  function addRequest(data) {
    state.requestQueue.push(data);
    renderQueue();
    state.totalViewers++;
  }

  function renderQueue() {
    const el = $('#request-queue');
    if (state.requestQueue.length === 0) {
      el.innerHTML = '<div class="queue-empty">Henuz istek yok</div>';
      return;
    }

    el.innerHTML = '';
    state.requestQueue.forEach(function (req, i) {
      const item = document.createElement('div');
      item.className = 'queue-item' + (state.selectedRequest === i ? ' selected' : '');
      const tierClass = 'tier-badge tier-badge-' + (req.tier || 1);
      item.innerHTML =
        '<span class="' + tierClass + '">' + TIER_NAMES[(req.tier || 1) - 1] + '</span>' +
        '<span class="queue-item-user">' + escHtml(req.username || 'Anonim') + '</span>' +
        '<span class="queue-item-comment">' + escHtml(req.comment || '') + '</span>';
      item.addEventListener('click', function () {
        state.selectedRequest = i;
        renderQueue();
      });
      el.appendChild(item);
    });

    // Auto-select first if none selected
    if (state.selectedRequest === null && state.requestQueue.length > 0) {
      state.selectedRequest = 0;
      renderQueue();
    }

    el.scrollTop = el.scrollHeight;
  }

  // Team assign buttons
  function buildTeamButtons() {
    const container = $('#team-buttons');
    container.innerHTML = '';

    state.teams.forEach(function (team, i) {
      const btn = document.createElement('button');
      btn.className = 'team-assign-btn';
      btn.style.background = team.color;
      btn.textContent = team.name;
      btn.disabled = state.gameStatus !== 'running';
      btn.addEventListener('click', function () {
        assignCard(i);
      });
      container.appendChild(btn);
    });
  }

  async function assignCard(teamIndex) {
    if (state.selectedRequest === null || !state.requestQueue[state.selectedRequest]) {
      addLog('Lutfen kuyruktan bir istek secin.');
      return;
    }

    const req = state.requestQueue[state.selectedRequest];
    try {
      const data = await api('POST', '/api/game/' + state.sessionId + '/draw', {
        team_index: teamIndex,
        tier: req.tier || 1,
        username: req.username,
        request_id: req.id,
      });

      // Remove from queue
      state.requestQueue.splice(state.selectedRequest, 1);
      state.selectedRequest = state.requestQueue.length > 0 ? 0 : null;
      renderQueue();

      // Update remaining
      if (data.remaining !== undefined) {
        $('#remaining-count').textContent = data.remaining;
      }

      showCardResult(data);
      addLog(req.username + ' -> ' + state.teams[teamIndex].name + (data.player ? ' (' + data.player.name + ' ' + data.player.ovr + ')' : ''));
    } catch (err) {
      addLog('Kart atama hatasi: ' + err.message);
    }
  }

  function showCardResult(data) {
    const popup = $('#card-result-popup');
    const inner = popup.querySelector('.popup-inner');
    const iconEl = $('#popup-icon');
    const titleEl = $('#popup-title');
    const detailEl = $('#popup-detail');

    inner.className = 'popup-inner';

    if (data.action === 'added' || data.result === 'added') {
      inner.classList.add('popup-added');
      iconEl.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
      titleEl.textContent = 'Eklendi!';
      detailEl.textContent = data.player ? data.player.name + ' (OVR ' + data.player.ovr + ')' : 'Oyuncu eklendi.';
    } else if (data.action === 'replaced' || data.result === 'replaced') {
      inner.classList.add('popup-replaced');
      iconEl.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f1c40f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
      titleEl.textContent = 'Degistirildi!';
      const oldName = data.oldPlayer ? data.oldPlayer.name + ' (OVR ' + data.oldPlayer.ovr + ')' : '?';
      const newName = data.player ? data.player.name + ' (OVR ' + data.player.ovr + ')' : '?';
      detailEl.textContent = oldName + '  -->  ' + newName;
    } else if (data.action === 'rejected' || data.result === 'rejected') {
      inner.classList.add('popup-rejected');
      iconEl.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
      titleEl.textContent = 'Reddedildi';
      detailEl.textContent = data.reason || 'Kart atanamadi.';
    } else {
      // Default
      iconEl.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
      titleEl.textContent = 'Sonuc';
      detailEl.textContent = data.message || JSON.stringify(data);
    }

    show(popup);

    // Auto-hide after 3 seconds
    setTimeout(function () { hide(popup); }, 3000);
  }

  // ---- Formations ----
  function buildFormations() {
    const row = $('#formations-row');
    row.innerHTML = '';

    state.teams.forEach(function (team, i) {
      const div = document.createElement('div');
      div.className = 'formation-mini';
      div.innerHTML =
        '<div class="formation-mini-title" style="color:' + team.color + ';">' + escHtml(team.name) + '</div>' +
        '<div class="mini-pitch" id="pitch-' + i + '"></div>' +
        '<div class="formation-mini-count" id="pitch-count-' + i + '">0/11</div>';
      row.appendChild(div);
      renderPitch(i, team.formation, team.color);
    });
  }

  function renderPitch(teamIdx, formation, color) {
    const pitch = document.getElementById('pitch-' + teamIdx);
    if (!pitch) return;
    pitch.innerHTML = '';
    const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3'];
    const players = state.teamPlayers[teamIdx] || [];

    positions.forEach(function (pos, pi) {
      const dot = document.createElement('div');
      dot.className = 'mini-dot';
      if (pi < players.length) dot.classList.add('filled');
      dot.style.left = pos[0] + '%';
      dot.style.top = pos[1] + '%';
      if (pi < players.length) {
        dot.style.background = color;
        dot.style.boxShadow = '0 0 8px ' + color;
        dot.title = players[pi].name + ' (' + players[pi].ovr + ')';
      }
      pitch.appendChild(dot);
    });

    const countEl = document.getElementById('pitch-count-' + teamIdx);
    if (countEl) {
      countEl.textContent = players.length + '/11';
    }
  }

  function updateFormations(data) {
    if (data.team_index !== undefined && data.player) {
      const idx = data.team_index;
      if (!state.teamPlayers[idx]) state.teamPlayers[idx] = [];
      if (data.action === 'replaced' && data.position !== undefined) {
        state.teamPlayers[idx][data.position] = data.player;
      } else if (data.action !== 'rejected') {
        state.teamPlayers[idx].push(data.player);
      }
      const team = state.teams[idx];
      renderPitch(idx, team.formation, team.color);
    }
  }

  function rebuildFormations() {
    state.teams.forEach(function (team, i) {
      renderPitch(i, team.formation, team.color);
    });
  }

  // ---- Action Log ----
  function addLog(msg) {
    state.actionLog.push({ time: new Date(), msg: msg });
    renderLog();
  }

  function renderLog() {
    const el = $('#action-log');
    if (state.actionLog.length === 0) {
      el.innerHTML = '<div class="log-empty">Henuz islem yok</div>';
      return;
    }

    el.innerHTML = '';
    // Show last 100
    const items = state.actionLog.slice(-100);
    items.forEach(function (entry) {
      const div = document.createElement('div');
      div.className = 'log-item';
      div.innerHTML =
        '<span class="log-time">' + formatTime(entry.time) + '</span>' +
        '<span class="log-msg">' + escHtml(entry.msg) + '</span>';
      el.appendChild(div);
    });
    el.scrollTop = el.scrollHeight;
  }

  // ---- TAB 4: Score & Final ----
  function initScore() {
    $('#end-game-final-btn').addEventListener('click', function () {
      if (!confirm('Oyunu bitirmek istediginize emin misiniz?')) return;
      endGame();
    });

    $('#save-profile-btn').addEventListener('click', async function () {
      try {
        await api('POST', '/api/game/' + state.sessionId + '/save-profile', {});
        addLog('Oyun profile kaydedildi.');
      } catch (err) {
        addLog('Profil kaydi hatasi: ' + err.message);
      }
    });

    $('#screenshot-btn').addEventListener('click', takeScreenshot);

    $('#new-game-btn').addEventListener('click', function () {
      if (!confirm('Yeni oyun baslatilacak. Emin misiniz?')) return;
      resetGame();
    });
  }

  async function endGame() {
    try {
      const data = await api('POST', '/api/game/' + state.sessionId + '/end', {});
      state.gameStatus = 'ended';
      updateGameControls();
      addLog('Oyun sona erdi.');
      renderScoreTable(data);
      renderFinalStats();
      // Switch to score tab
      $$('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      $$('.tab-content').forEach(function (c) { c.classList.remove('active'); });
      document.querySelector('[data-tab="tab-score"]').classList.add('active');
      $('#tab-score').classList.add('active');
    } catch (err) {
      addLog('Oyun bitirme hatasi: ' + err.message);
    }
  }

  function renderScoreTable(data) {
    const tbody = $('#score-tbody');

    // Build team scores
    const teamScores = state.teams.map(function (team, i) {
      const players = state.teamPlayers[i] || [];
      const totalOvr = players.reduce(function (sum, p) { return sum + (p.ovr || 0); }, 0);
      const avgOvr = players.length > 0 ? (totalOvr / players.length).toFixed(1) : 0;
      return {
        name: team.name,
        color: team.color,
        totalOvr: totalOvr,
        avgOvr: avgOvr,
        count: players.length,
      };
    });

    // Use server data if available
    if (data && data.rankings) {
      tbody.innerHTML = '';
      data.rankings.forEach(function (r, i) {
        const rankClass = i < 3 ? 'rank-' + (i + 1) : '';
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td class="' + rankClass + '">' + (i + 1) + '.</td>' +
          '<td>' + escHtml(r.name || r.team) + '</td>' +
          '<td>' + (r.totalOvr || r.total_ovr || 0) + '</td>' +
          '<td>' + (r.avgOvr || r.avg_ovr || 0) + '</td>' +
          '<td>' + (r.count || r.players || 0) + '</td>';
        tbody.appendChild(tr);
      });
      return;
    }

    // Fallback: sort by totalOvr descending
    teamScores.sort(function (a, b) { return b.totalOvr - a.totalOvr; });

    tbody.innerHTML = '';
    teamScores.forEach(function (ts, i) {
      const rankClass = i < 3 ? 'rank-' + (i + 1) : '';
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="' + rankClass + '">' + (i + 1) + '.</td>' +
        '<td><span style="color:' + ts.color + ';">' + escHtml(ts.name) + '</span></td>' +
        '<td>' + ts.totalOvr + '</td>' +
        '<td>' + ts.avgOvr + '</td>' +
        '<td>' + ts.count + '</td>';
      tbody.appendChild(tr);
    });
  }

  function renderFinalStats() {
    $('#stat-total-cards').textContent = state.totalCards;
    $('#stat-total-likes').textContent = state.totalLikes;
    $('#stat-total-viewers').textContent = state.totalViewers;
    $('#stat-best-ovr').textContent = state.bestOvr || '--';
  }

  async function takeScreenshot() {
    // Load html2canvas from CDN if not available
    if (typeof html2canvas === 'undefined') {
      addLog('html2canvas yukleniyor...');
      await new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    try {
      const canvas = await html2canvas(document.querySelector('#tab-score'), {
        backgroundColor: '#1a1a2e',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = 'kadro-kur-sonuc-' + Date.now() + '.png';
      link.href = canvas.toDataURL();
      link.click();
      addLog('Ekran goruntusu indirildi.');
    } catch (err) {
      addLog('Ekran goruntusu hatasi: ' + err.message);
    }
  }

  function resetGame() {
    state.gameStatus = 'idle';
    state.requestQueue = [];
    state.selectedRequest = null;
    state.teamPlayers = [[], [], [], []];
    state.totalCards = 0;
    state.totalLikes = 0;
    state.totalViewers = 0;
    state.bestOvr = 0;
    state.actionLog = [];

    updateGameControls();
    renderQueue();
    renderLog();
    rebuildFormations();

    $('#remaining-count').textContent = '0';
    $('#score-tbody').innerHTML = '<tr><td colspan="5" class="empty-row">Oyun bitmedi</td></tr>';

    // Switch to teams tab
    $$('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
    $$('.tab-content').forEach(function (c) { c.classList.remove('active'); });
    document.querySelector('[data-tab="tab-teams"]').classList.add('active');
    $('#tab-teams').classList.add('active');

    // Create new session
    afterLogin();
    addLog('Yeni oyun baslatildi.');
  }

  // ---- TAB 5: Profile ----
  function initProfile() {
    loadProfile();
  }

  async function loadProfile() {
    try {
      const licId = state.licenseInfo?.data?.id || state.licenseInfo?.id;
      if (!licId) return;
      const data = await api('GET', '/api/profile/' + licId, null);
      if (data.games && Array.isArray(data.games)) {
        renderPastGames(data.games);
      }
      if (data.stats) {
        $('#profile-total-games').textContent = data.stats.totalGames || 0;
        $('#profile-total-cards').textContent = data.stats.totalCards || 0;
        $('#profile-total-likes').textContent = data.stats.totalLikes || 0;
      }
    } catch (err) {
      // Profile may not exist yet, silently ignore
    }
  }

  function renderPastGames(games) {
    const list = $('#past-games-list');
    if (!games.length) {
      list.innerHTML = '<div class="queue-empty">Henuz oyun kaydedilmedi</div>';
      return;
    }
    list.innerHTML = '';
    games.forEach(function (g) {
      const item = document.createElement('div');
      item.className = 'past-game-item';
      const d = new Date(g.date || g.created_at);
      item.innerHTML =
        '<span class="past-game-date">' + d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + '</span>' +
        '<span class="past-game-info">' + (g.totalCards || 0) + ' kart</span>' +
        '<span class="past-game-winner">' + escHtml(g.winner || '--') + '</span>';
      list.appendChild(item);
    });
  }

  // ---- Utility ----
  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---- Init ----
  function init() {
    initLogin();
    initTabs();
    initCopyObs();
    initSettings();
    initCards();
    initScore();
    initProfile();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
