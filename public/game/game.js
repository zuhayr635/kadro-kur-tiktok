/* ===================================================================
   KADRO KUR - Game Overlay (OBS Browser Source)
   Connects via Socket.io, renders teams/formations, plays animations
   =================================================================== */

(function () {
  'use strict';

  // ---------------------------------------------------------------
  // CONFIG
  // ---------------------------------------------------------------
  const FORMATION_POSITIONS = {
    '4-3-3': [
      { pos: 'GK',  x: 50, y: 92 },
      { pos: 'LB',  x: 15, y: 72 },
      { pos: 'CB',  x: 38, y: 76 },
      { pos: 'CB',  x: 62, y: 76 },
      { pos: 'RB',  x: 85, y: 72 },
      { pos: 'CM',  x: 30, y: 50 },
      { pos: 'CM',  x: 50, y: 46 },
      { pos: 'CM',  x: 70, y: 50 },
      { pos: 'LW',  x: 20, y: 20 },
      { pos: 'ST',  x: 50, y: 14 },
      { pos: 'RW',  x: 80, y: 20 }
    ],
    '4-4-2': [
      { pos: 'GK',  x: 50, y: 92 },
      { pos: 'LB',  x: 15, y: 72 },
      { pos: 'CB',  x: 38, y: 76 },
      { pos: 'CB',  x: 62, y: 76 },
      { pos: 'RB',  x: 85, y: 72 },
      { pos: 'LM',  x: 15, y: 48 },
      { pos: 'CM',  x: 38, y: 50 },
      { pos: 'CM',  x: 62, y: 50 },
      { pos: 'RM',  x: 85, y: 48 },
      { pos: 'ST',  x: 38, y: 18 },
      { pos: 'ST',  x: 62, y: 18 }
    ],
    '3-5-2': [
      { pos: 'GK',  x: 50, y: 92 },
      { pos: 'CB',  x: 25, y: 76 },
      { pos: 'CB',  x: 50, y: 78 },
      { pos: 'CB',  x: 75, y: 76 },
      { pos: 'LM',  x: 10, y: 50 },
      { pos: 'CM',  x: 32, y: 52 },
      { pos: 'CDM', x: 50, y: 56 },
      { pos: 'CM',  x: 68, y: 52 },
      { pos: 'RM',  x: 90, y: 50 },
      { pos: 'ST',  x: 38, y: 18 },
      { pos: 'ST',  x: 62, y: 18 }
    ],
    '4-2-3-1': [
      { pos: 'GK',  x: 50, y: 92 },
      { pos: 'LB',  x: 15, y: 72 },
      { pos: 'CB',  x: 38, y: 76 },
      { pos: 'CB',  x: 62, y: 76 },
      { pos: 'RB',  x: 85, y: 72 },
      { pos: 'CDM', x: 38, y: 58 },
      { pos: 'CDM', x: 62, y: 58 },
      { pos: 'LAM', x: 22, y: 36 },
      { pos: 'CAM', x: 50, y: 34 },
      { pos: 'RAM', x: 78, y: 36 },
      { pos: 'ST',  x: 50, y: 14 }
    ],
    '3-4-3': [
      { pos: 'GK',  x: 50, y: 92 },
      { pos: 'CB',  x: 25, y: 76 },
      { pos: 'CB',  x: 50, y: 78 },
      { pos: 'CB',  x: 75, y: 76 },
      { pos: 'LM',  x: 15, y: 50 },
      { pos: 'CM',  x: 38, y: 52 },
      { pos: 'CM',  x: 62, y: 52 },
      { pos: 'RM',  x: 85, y: 50 },
      { pos: 'LW',  x: 20, y: 20 },
      { pos: 'ST',  x: 50, y: 14 },
      { pos: 'RW',  x: 80, y: 20 }
    ],
    '5-3-2': [
      { pos: 'GK',  x: 50, y: 92 },
      { pos: 'LWB', x: 8,  y: 66 },
      { pos: 'CB',  x: 28, y: 76 },
      { pos: 'CB',  x: 50, y: 78 },
      { pos: 'CB',  x: 72, y: 76 },
      { pos: 'RWB', x: 92, y: 66 },
      { pos: 'CM',  x: 30, y: 50 },
      { pos: 'CM',  x: 50, y: 48 },
      { pos: 'CM',  x: 70, y: 50 },
      { pos: 'ST',  x: 38, y: 18 },
      { pos: 'ST',  x: 62, y: 18 }
    ]
  };

  const TEAM_COLORS = ['#ff2d7c', '#00e5ff', '#39ff14', '#b64dff'];

  const PLAYER_SILHOUETTE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

  // ---------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------
  let socket = null;
  let sessionId = null;
  let gameState = null;
  let audioCtx = null;

  // ---------------------------------------------------------------
  // INIT
  // ---------------------------------------------------------------
  function init() {
    sessionId = new URLSearchParams(window.location.search).get('session');

    if (!sessionId) {
      document.getElementById('error-screen').classList.remove('hidden');
      return;
    }

    socket = io();

    socket.on('connect', () => {
      console.log('[KadroKur] Connected to server');
      socket.emit('join-session', sessionId);
      fetchGameState();
    });

    socket.on('disconnect', () => {
      console.log('[KadroKur] Disconnected');
    });

    // Event handlers
    socket.on('team-updated', handleTeamUpdated);
    socket.on('card-opened', handleCardOpened);
    socket.on('notification', handleNotification);
    socket.on('card-result', handleCardResult);
    socket.on('game-ended', handleGameEnded);
    socket.on('settings-changed', handleSettingsChanged);
    socket.on('game-state', handleGameState);
  }

  // ---------------------------------------------------------------
  // FETCH GAME STATE
  // ---------------------------------------------------------------
  async function fetchGameState() {
    try {
      const res = await fetch('/api/game/' + sessionId);
      if (!res.ok) throw new Error('Failed to fetch game state');
      const data = await res.json();
      gameState = data;
      renderTeams(gameState);
    } catch (err) {
      console.error('[KadroKur] Error fetching game state:', err);
      showNotification('Oyun durumu yuklenemedi', 'reject');
    }
  }

  // ---------------------------------------------------------------
  // SOCKET HANDLERS
  // ---------------------------------------------------------------
  function handleGameState(data) {
    gameState = data;
    renderTeams(gameState);
  }

  function handleTeamUpdated(data) {
    if (!gameState) return;
    const { teamIndex, team } = data;
    if (gameState.teams && gameState.teams[teamIndex]) {
      gameState.teams[teamIndex] = team;
    }
    renderTeams(gameState);
  }

  function handleCardOpened(data) {
    const { player, tier, teamIndex, position } = data;
    playCardAnimation(player, tier, teamIndex, position);
  }

  function handleNotification(data) {
    const { text, type } = data;
    showNotification(text, type || 'info');
  }

  function handleCardResult(data) {
    const { action, player, teamIndex } = data;
    let text = '';
    let type = 'info';

    if (action === 'added') {
      text = player.name + ' --> ' + (gameState.teams[teamIndex]?.name || 'Takim ' + (teamIndex + 1)) + ' eklendi!';
      type = 'success';
    } else if (action === 'replaced') {
      text = player.name + ' degistirme yapildi!';
      type = 'replace';
    } else if (action === 'rejected') {
      text = player.name + ' reddedildi!';
      type = 'reject';
    }

    showNotification(text, type);
  }

  function handleGameEnded(data) {
    showScoreboard(data.results || data);
  }

  function handleSettingsChanged(data) {
    if (data && data.gameState) {
      gameState = data.gameState;
      renderTeams(gameState);
    }
    showNotification('Ayarlar guncellendi', 'info');
  }

  // ---------------------------------------------------------------
  // RENDER TEAMS
  // ---------------------------------------------------------------
  function renderTeams(state) {
    if (!state || !state.teams) return;

    const teamAreas = document.querySelectorAll('.team-area');

    state.teams.forEach((team, index) => {
      if (index >= teamAreas.length) return;
      const area = teamAreas[index];

      // Update header
      const nameEl = area.querySelector('.team-name');
      const ovrEl = area.querySelector('.team-ovr');
      const fillEl = area.querySelector('.team-fill');
      const emblemEl = area.querySelector('.team-emblem');

      nameEl.textContent = team.name || ('Takim ' + (index + 1));

      const players = team.players || [];
      const totalOvr = players.reduce((sum, p) => sum + (p?.ovr || 0), 0);
      const avgOvr = players.length > 0 ? Math.round(totalOvr / players.length) : 0;
      ovrEl.textContent = 'OVR: ' + avgOvr;
      fillEl.textContent = players.length + '/11';

      // Emblem shows team initial
      emblemEl.textContent = (team.name || 'T')[0].toUpperCase();
      emblemEl.style.borderColor = TEAM_COLORS[index] || '#fff';
      emblemEl.style.color = TEAM_COLORS[index] || '#fff';

      // Render formation
      const formation = team.formation || '4-3-3';
      const slotsContainer = area.querySelector('.formation-slots');
      renderFormation(slotsContainer, formation, players, index);
    });
  }

  // ---------------------------------------------------------------
  // RENDER FORMATION
  // ---------------------------------------------------------------
  function renderFormation(container, formation, players, teamIndex) {
    container.innerHTML = '';

    const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3'];

    positions.forEach((slot, i) => {
      const el = document.createElement('div');
      el.className = 'card-slot';
      el.style.left = slot.x + '%';
      el.style.top = slot.y + '%';
      el.dataset.slotIndex = i;
      el.dataset.teamIndex = teamIndex;

      const player = players[i] || null;

      if (player) {
        el.appendChild(renderCard(player));
      } else {
        el.classList.add('empty');
        const posLabel = document.createElement('span');
        posLabel.className = 'slot-position';
        posLabel.textContent = slot.pos;
        el.appendChild(posLabel);
      }

      container.appendChild(el);
    });
  }

  // ---------------------------------------------------------------
  // RENDER CARD (FIFA Style)
  // ---------------------------------------------------------------
  function renderCard(player, large) {
    const tier = getTier(player.ovr);
    const card = document.createElement('div');
    card.className = 'player-card tier-' + tier;

    card.innerHTML =
      '<div class="card-top">' +
        '<span class="card-ovr">' + player.ovr + '</span>' +
        '<span class="card-position">' + (player.position || 'ST') + '</span>' +
      '</div>' +
      '<div class="card-avatar">' + PLAYER_SILHOUETTE_SVG + '</div>' +
      '<div class="card-name">' + escapeHtml(player.name || 'Unknown') + '</div>' +
      '<div class="card-meta">' +
        '<span>' + escapeHtml(player.nationality || '') + '</span>' +
        '<span>' + escapeHtml(player.club || '') + '</span>' +
      '</div>' +
      '<div class="card-stats">' +
        statHtml('PAC', player.pac) +
        statHtml('SHO', player.sho) +
        statHtml('PAS', player.pas) +
        statHtml('DRI', player.dri) +
        statHtml('DEF', player.def) +
        statHtml('PHY', player.phy) +
      '</div>';

    return card;
  }

  function statHtml(label, value) {
    return '<div class="stat-item">' +
      '<div class="stat-value">' + (value || '--') + '</div>' +
      '<div class="stat-label">' + label + '</div>' +
    '</div>';
  }

  function getTier(ovr) {
    if (!ovr) return 'bronze';
    if (ovr >= 88) return 'elite';
    if (ovr >= 80) return 'gold';
    if (ovr >= 70) return 'silver';
    return 'bronze';
  }

  // ---------------------------------------------------------------
  // CARD REVEAL ANIMATION
  // ---------------------------------------------------------------
  function playCardAnimation(player, tier, teamIndex, position) {
    if (!tier) tier = getTier(player.ovr);

    const overlay = document.getElementById('card-reveal-overlay');
    const packContainer = overlay.querySelector('.pack-container');
    const revealedCardEl = overlay.querySelector('.revealed-card');
    const tierEffectsEl = overlay.querySelector('.tier-effects');

    // Reset
    packContainer.className = 'pack-container';
    revealedCardEl.innerHTML = '';
    tierEffectsEl.className = 'tier-effects';
    overlay.classList.remove('hidden');

    // Play sound
    playSynthSound(tier);

    // Step 1: Pack appears (0 -> 500ms)
    packContainer.classList.add('anim-appear');

    setTimeout(() => {
      // Step 2: Pack shakes (500ms -> 1500ms)
      packContainer.classList.remove('anim-appear');
      packContainer.classList.add('anim-shake');
    }, 500);

    setTimeout(() => {
      // Step 3: 3D Flip (1500ms -> 2300ms)
      packContainer.classList.remove('anim-shake');
      packContainer.classList.add('anim-flip');

      // Prepare the card behind the pack
      const cardEl = renderCard(player, true);
      revealedCardEl.innerHTML = '';
      revealedCardEl.appendChild(cardEl);
    }, 1500);

    setTimeout(() => {
      // Step 4: Tier effects (2300ms+)
      tierEffectsEl.classList.add('tier-' + tier);

      if (tier === 'gold') {
        createGoldParticles(tierEffectsEl);
      }

      if (tier === 'elite') {
        document.getElementById('overlay').classList.add('screen-shake');
        setTimeout(() => {
          document.getElementById('overlay').classList.remove('screen-shake');
        }, 500);
      }
    }, 2300);

    setTimeout(() => {
      // Step 5: Fly card to position (4000ms)
      const targetSlot = findSlotElement(teamIndex, position);

      if (targetSlot) {
        flyCardToPosition(revealedCardEl, targetSlot, () => {
          overlay.classList.add('hidden');
          // Re-render teams to show the card in place
          if (gameState) renderTeams(gameState);
        });
      } else {
        overlay.classList.add('hidden');
        if (gameState) renderTeams(gameState);
      }
    }, 4000);
  }

  function findSlotElement(teamIndex, slotIndex) {
    const selector = '.team-area[data-team="' + teamIndex + '"] .card-slot[data-slot-index="' + slotIndex + '"]';
    return document.querySelector(selector);
  }

  function flyCardToPosition(sourceEl, targetSlot, onComplete) {
    const card = sourceEl.querySelector('.player-card');
    if (!card) {
      if (onComplete) onComplete();
      return;
    }

    const sourceRect = sourceEl.getBoundingClientRect();
    const targetRect = targetSlot.getBoundingClientRect();

    // Clone the card for flying animation
    const flyingCard = card.cloneNode(true);
    flyingCard.classList.add('card-flying');
    flyingCard.style.left = sourceRect.left + 'px';
    flyingCard.style.top = sourceRect.top + 'px';
    flyingCard.style.width = sourceRect.width + 'px';
    flyingCard.style.height = sourceRect.height + 'px';
    document.body.appendChild(flyingCard);

    // Animate to target
    requestAnimationFrame(() => {
      flyingCard.style.transition = 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)';
      flyingCard.style.left = targetRect.left + 'px';
      flyingCard.style.top = targetRect.top + 'px';
      flyingCard.style.width = targetRect.width + 'px';
      flyingCard.style.height = targetRect.height + 'px';
    });

    setTimeout(() => {
      if (flyingCard.parentNode) flyingCard.parentNode.removeChild(flyingCard);
      if (onComplete) onComplete();
    }, 800);
  }

  function createGoldParticles(container) {
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'gold-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (1.5 + Math.random() * 2) + 's';
      p.style.animationDelay = (Math.random() * 1) + 's';
      p.style.width = (2 + Math.random() * 4) + 'px';
      p.style.height = p.style.width;
      container.appendChild(p);
    }
  }

  // ---------------------------------------------------------------
  // NOTIFICATIONS
  // ---------------------------------------------------------------
  function showNotification(text, type) {
    const area = document.getElementById('notification-area');
    const notif = document.createElement('div');
    notif.className = 'notification type-' + (type || 'info');
    notif.textContent = text;
    area.appendChild(notif);

    // Remove after 5s
    setTimeout(() => {
      if (notif.parentNode) notif.parentNode.removeChild(notif);
    }, 5200);
  }

  // ---------------------------------------------------------------
  // SCOREBOARD
  // ---------------------------------------------------------------
  function showScoreboard(results) {
    const overlay = document.getElementById('scoreboard-overlay');
    const teamsContainer = overlay.querySelector('.scoreboard-teams');
    teamsContainer.innerHTML = '';

    // Sort by OVR descending
    const sorted = (Array.isArray(results) ? results : [])
      .map((r, i) => ({ ...r, originalIndex: i }))
      .sort((a, b) => (b.totalOvr || b.avgOvr || 0) - (a.totalOvr || a.avgOvr || 0));

    sorted.forEach((team, rank) => {
      const el = document.createElement('div');
      el.className = 'scoreboard-team' + (rank === 0 ? ' rank-1' : rank === 1 ? ' rank-2' : '');
      el.style.animationDelay = (rank * 0.15) + 's';
      el.style.borderColor = TEAM_COLORS[team.originalIndex] || '#fff';

      el.innerHTML =
        '<div class="scoreboard-rank">#' + (rank + 1) + '</div>' +
        '<div class="scoreboard-team-name">' + escapeHtml(team.name || 'Takim') + '</div>' +
        '<div class="scoreboard-team-ovr">' + (team.totalOvr || team.avgOvr || 0) + '</div>';

      teamsContainer.appendChild(el);
    });

    overlay.classList.remove('hidden');
  }

  // ---------------------------------------------------------------
  // WEB AUDIO SYNTH SOUNDS
  // ---------------------------------------------------------------
  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playSynthSound(tier) {
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;

      switch (tier) {
        case 'bronze':
          playTone(ctx, 800, 'sine', 0.15, now, 0.1, 0.2);
          break;

        case 'silver':
          playTone(ctx, 600, 'sine', 0.15, now, 0.08, 0.25);
          playTone(ctx, 800, 'sine', 0.15, now + 0.1, 0.08, 0.25);
          playTone(ctx, 1000, 'sine', 0.15, now + 0.2, 0.08, 0.3);
          break;

        case 'gold':
          // Majestic chord: C E G C
          playTone(ctx, 523.25, 'sine', 0.12, now, 0.05, 0.8);
          playTone(ctx, 659.25, 'sine', 0.12, now + 0.05, 0.05, 0.7);
          playTone(ctx, 783.99, 'sine', 0.12, now + 0.1, 0.05, 0.7);
          playTone(ctx, 1046.50, 'sine', 0.10, now + 0.15, 0.05, 0.6);
          break;

        case 'elite':
          // Dramatic buildup
          playTone(ctx, 200, 'sawtooth', 0.08, now, 0.01, 0.5);
          playTone(ctx, 300, 'sawtooth', 0.08, now + 0.1, 0.01, 0.5);
          playTone(ctx, 400, 'sawtooth', 0.10, now + 0.2, 0.01, 0.5);
          playTone(ctx, 500, 'sawtooth', 0.10, now + 0.3, 0.01, 0.4);
          playTone(ctx, 600, 'sawtooth', 0.12, now + 0.4, 0.01, 0.3);
          // Crash - white noise burst + chord
          playNoise(ctx, 0.15, now + 0.5, 0.01, 0.4);
          playTone(ctx, 523.25, 'sine', 0.15, now + 0.5, 0.02, 1.0);
          playTone(ctx, 659.25, 'sine', 0.13, now + 0.5, 0.02, 1.0);
          playTone(ctx, 783.99, 'sine', 0.13, now + 0.5, 0.02, 1.0);
          playTone(ctx, 1046.50, 'sine', 0.12, now + 0.55, 0.02, 0.9);
          break;

        case 'reject':
          playTone(ctx, 200, 'square', 0.1, now, 0.01, 0.3);
          playTone(ctx, 150, 'square', 0.1, now + 0.15, 0.01, 0.4);
          break;

        default:
          playTone(ctx, 440, 'sine', 0.1, now, 0.05, 0.2);
      }
    } catch (e) {
      console.warn('[KadroKur] Audio error:', e);
    }
  }

  function playTone(ctx, freq, type, volume, startTime, attack, duration) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  function playNoise(ctx, volume, startTime, attack, duration) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    source.connect(gain);
    gain.connect(ctx.destination);

    source.start(startTime);
    source.stop(startTime + duration + 0.05);
  }

  // ---------------------------------------------------------------
  // UTILITIES
  // ---------------------------------------------------------------
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------------------------------------------------------------
  // START
  // ---------------------------------------------------------------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
