'use strict';

const { getDb } = require('./database');
const { FORMATIONS, getFormationSlots, getRandomPlayerForTier, calculateTeamScore } = require('./card-system');
const { getSession, updateGameState } = require('./session-manager');

// ---------------------------------------------------------------------------
// Default game settings thresholds
// ---------------------------------------------------------------------------
const DEFAULT_GAME_SETTINGS = {
  likeThreshold: 50,
  bronzeGiftDiamonds: 1,
  silverGiftDiamonds: 20,
  goldGiftDiamonds: 50,
  eliteGiftDiamonds: 100,
};

// ---------------------------------------------------------------------------
// initGameState  --  creates a fresh game state for 4 teams
// ---------------------------------------------------------------------------
function initGameState(teamSettings) {
  const settings = teamSettings || {};
  const teams = [];

  for (let i = 0; i < 4; i++) {
    const teamCfg = (settings.teams && settings.teams[i]) || {};
    const formation = teamCfg.formation || '4-3-3';
    const slots = getFormationSlots(formation);

    teams.push({
      index: i,
      name: teamCfg.name || `Takim ${i + 1}`,
      color: teamCfg.color || ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f'][i],
      formation: formation,
      players: new Array(slots.length).fill(null),   // 11 slots, all empty
    });
  }

  return {
    teams,
    status: 'waiting',   // waiting | running | ended
    totalCardsOpened: 0,
    startedAt: null,
  };
}

// ---------------------------------------------------------------------------
// drawCard
//   Assigns a random player of given tier to the specified team.
//   Logic:
//     1. Pick a random player from DB for that tier (excluding already-used).
//     2. Find an empty slot in the team's formation that matches the player's position.
//        - If multiple slots for the same position: fill empty first.
//        - If all matching slots full: compare OVR with the weakest occupant.
//          New > Old -> replace.  New <= Old -> reject.
//        - If no matching position at all, try any empty slot.
//     3. Record in used_players, push to undo_stack.
// ---------------------------------------------------------------------------
function drawCard(sessionId, teamIndex, tier) {
  const db = getDb();
  const session = getSession(sessionId);
  if (!session) throw new Error('Session bulunamadi');

  let gameState;
  try { gameState = JSON.parse(session.game_state || '{}'); } catch (_) { gameState = {}; }
  if (!gameState.teams) throw new Error('Oyun baslatilmamis');

  const team = gameState.teams[teamIndex];
  if (!team) throw new Error(`Takim bulunamadi: ${teamIndex}`);

  // Gather already-used player ids for this session
  const usedRows = db.prepare('SELECT player_id FROM used_players WHERE session_id = ?').all(session.id);
  const excludeIds = usedRows.map(r => r.player_id);

  // Get random player for tier
  const player = getRandomPlayerForTier(tier, excludeIds);
  if (!player) {
    return { action: 'no_player', message: 'Bu tier icin uygun oyuncu bulunamadi' };
  }

  const formation = team.formation || '4-3-3';
  const slots = getFormationSlots(formation);

  // Find matching slot indexes for this player's position
  const matchingIndexes = slots
    .map((s, idx) => ({ idx, position: s.position }))
    .filter(s => s.position === player.position);

  let targetIdx = -1;
  let oldPlayer = null;
  let action = 'added';

  if (matchingIndexes.length > 0) {
    // First try empty matching slots
    const emptyMatch = matchingIndexes.find(s => team.players[s.idx] === null);
    if (emptyMatch) {
      targetIdx = emptyMatch.idx;
    } else {
      // All matching slots occupied -> find the weakest
      let weakestIdx = -1;
      let weakestOvr = Infinity;
      for (const s of matchingIndexes) {
        const occupant = team.players[s.idx];
        if (occupant && occupant.overall < weakestOvr) {
          weakestOvr = occupant.overall;
          weakestIdx = s.idx;
        }
      }
      if (weakestIdx !== -1 && player.overall > weakestOvr) {
        targetIdx = weakestIdx;
        oldPlayer = team.players[weakestIdx];
        action = 'replaced';
      } else {
        // Rejected - new player not stronger
        return {
          action: 'rejected',
          player: { id: player.id, name: player.name, overall: player.overall, position: player.position, tier },
          team: { index: teamIndex, name: team.name },
          reason: 'Yeni oyuncu mevcut oyuncudan dusuk veya esit OVR',
        };
      }
    }
  } else {
    // No matching position -- try any empty slot
    const anyEmpty = team.players.findIndex(p => p === null);
    if (anyEmpty !== -1) {
      targetIdx = anyEmpty;
    } else {
      return {
        action: 'rejected',
        player: { id: player.id, name: player.name, overall: player.overall, position: player.position, tier },
        team: { index: teamIndex, name: team.name },
        reason: 'Takimda bos pozisyon yok',
      };
    }
  }

  // Place the player
  const assignedPosition = slots[targetIdx].position;

  const playerData = {
    id: player.id,
    name: player.name,
    position: player.position,
    nationality: player.nationality,
    nationality_flag: player.nationality_flag,
    club: player.club,
    league: player.league,
    overall: player.overall,
    tier: player.tier,
    stats: player.stats,
  };

  team.players[targetIdx] = playerData;
  gameState.totalCardsOpened = (gameState.totalCardsOpened || 0) + 1;

  if (gameState.status === 'waiting') {
    gameState.status = 'running';
    gameState.startedAt = new Date().toISOString();
  }

  // Push to undo_stack
  let undoStack = [];
  try { undoStack = JSON.parse(session.undo_stack || '[]'); } catch (_) { /* ignore */ }
  undoStack.push({
    teamIndex,
    slotIndex: targetIdx,
    newPlayer: playerData,
    oldPlayer: oldPlayer || null,
    action,
    timestamp: new Date().toISOString(),
  });

  // Record used_player
  db.prepare(
    'INSERT INTO used_players (session_id, player_id, team_index, position) VALUES (?, ?, ?, ?)'
  ).run(session.id, player.id, teamIndex, assignedPosition);

  // If replaced, mark old used_player as replaced
  if (oldPlayer && oldPlayer.id) {
    db.prepare(
      'UPDATE used_players SET replaced_by = ? WHERE session_id = ? AND player_id = ? AND team_index = ? AND replaced_by IS NULL'
    ).run(player.id, session.id, oldPlayer.id, teamIndex);
  }

  // Persist state
  db.prepare('UPDATE sessions SET game_state = ?, undo_stack = ? WHERE session_id = ?')
    .run(JSON.stringify(gameState), JSON.stringify(undoStack), sessionId);

  return {
    action,
    player: playerData,
    oldPlayer: oldPlayer || null,
    team: { index: teamIndex, name: team.name },
    position: assignedPosition,
    slotIndex: targetIdx,
  };
}

// ---------------------------------------------------------------------------
// getAvailablePlayer  --  pick a random player from tier, excluding given ids
// ---------------------------------------------------------------------------
function getAvailablePlayer(sessionId, tier, excludedPlayerIds = []) {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session bulunamadi');

  const db = getDb();
  const usedRows = db.prepare('SELECT player_id FROM used_players WHERE session_id = ?').all(session.id);
  const allExcluded = [...new Set([...excludedPlayerIds, ...usedRows.map(r => r.player_id)])];

  return getRandomPlayerForTier(tier, allExcluded);
}

// ---------------------------------------------------------------------------
// undoLastAction
// ---------------------------------------------------------------------------
function undoLastAction(sessionId) {
  const db = getDb();
  const session = getSession(sessionId);
  if (!session) throw new Error('Session bulunamadi');

  let undoStack = [];
  try { undoStack = JSON.parse(session.undo_stack || '[]'); } catch (_) { /* ignore */ }
  if (undoStack.length === 0) throw new Error('Geri alinacak islem yok');

  let gameState;
  try { gameState = JSON.parse(session.game_state || '{}'); } catch (_) { gameState = {}; }

  const lastAction = undoStack.pop();
  const team = gameState.teams[lastAction.teamIndex];
  if (!team) throw new Error('Takim bulunamadi');

  // Remove current player from used_players
  if (lastAction.newPlayer && lastAction.newPlayer.id) {
    db.prepare(
      'DELETE FROM used_players WHERE session_id = ? AND player_id = ? AND team_index = ?'
    ).run(session.id, lastAction.newPlayer.id, lastAction.teamIndex);
  }

  // Restore old player (or null)
  team.players[lastAction.slotIndex] = lastAction.oldPlayer || null;
  gameState.totalCardsOpened = Math.max(0, (gameState.totalCardsOpened || 1) - 1);

  // If old player was replaced, restore their used_players record
  if (lastAction.oldPlayer && lastAction.oldPlayer.id) {
    db.prepare(
      'UPDATE used_players SET replaced_by = NULL WHERE session_id = ? AND player_id = ? AND team_index = ?'
    ).run(session.id, lastAction.oldPlayer.id, lastAction.teamIndex);
  }

  db.prepare('UPDATE sessions SET game_state = ?, undo_stack = ? WHERE session_id = ?')
    .run(JSON.stringify(gameState), JSON.stringify(undoStack), sessionId);

  return {
    undone: lastAction,
    restoredPlayer: lastAction.oldPlayer || null,
    team: { index: lastAction.teamIndex, name: team.name },
    slotIndex: lastAction.slotIndex,
  };
}

// ---------------------------------------------------------------------------
// endGame  --  calculate final scores and rankings
// ---------------------------------------------------------------------------
function endGame(sessionId) {
  const session = getSession(sessionId);
  if (!session) throw new Error('Session bulunamadi');

  let gameState;
  try { gameState = JSON.parse(session.game_state || '{}'); } catch (_) { gameState = {}; }
  if (!gameState.teams) throw new Error('Oyun baslatilmamis');

  const rankings = gameState.teams.map((team, idx) => {
    const activePlayers = (team.players || []).filter(Boolean);
    const score = calculateTeamScore(activePlayers);
    return {
      teamIndex: idx,
      name: team.name,
      score,
      playerCount: activePlayers.length,
    };
  }).sort((a, b) => b.score - a.score);

  // Assign ranks
  rankings.forEach((r, i) => { r.rank = i + 1; });

  gameState.status = 'ended';
  gameState.endedAt = new Date().toISOString();
  gameState.rankings = rankings;

  const db = getDb();
  db.prepare('UPDATE sessions SET game_state = ? WHERE session_id = ?')
    .run(JSON.stringify(gameState), sessionId);

  return { rankings, gameState };
}

// ---------------------------------------------------------------------------
// getCardTier  --  determine tier from TikTok event
// ---------------------------------------------------------------------------
function getCardTier(eventType, value, gameSettings) {
  const s = gameSettings || DEFAULT_GAME_SETTINGS;

  if (eventType === 'like') {
    return 'bronze';
  }

  if (eventType === 'gift') {
    const diamonds = Number(value) || 0;
    if (diamonds >= (s.eliteGiftDiamonds || 100)) return 'elite';
    if (diamonds >= (s.goldGiftDiamonds || 50)) return 'gold';
    if (diamonds >= (s.silverGiftDiamonds || 20)) return 'silver';
    return 'bronze';
  }

  // Default fallback
  return 'bronze';
}

module.exports = {
  DEFAULT_GAME_SETTINGS,
  initGameState,
  drawCard,
  getAvailablePlayer,
  undoLastAction,
  endGame,
  getCardTier,
};
