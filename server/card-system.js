'use strict';

const { getDb } = require('./database');

// ---------------------------------------------------------------------------
// Tier OVR ranges
// ---------------------------------------------------------------------------
const TIER_RANGES = {
  bronze: { min: 50, max: 70 },
  silver: { min: 71, max: 84 },
  gold:   { min: 85, max: 90 },
  elite:  { min: 91, max: 99 },
};

// ---------------------------------------------------------------------------
// Formations  (position list ordered GK -> DEF -> MID -> FWD)
// ---------------------------------------------------------------------------
const FORMATIONS = {
  '4-3-3': ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW'],
  '4-4-2': ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST'],
  '3-5-2': ['GK', 'CB', 'CB', 'CB', 'LM', 'CM', 'CDM', 'CM', 'RM', 'ST', 'ST'],
  '4-2-3-1': ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CDM', 'LW', 'CAM', 'RW', 'ST'],
  '3-4-3': ['GK', 'CB', 'CB', 'CB', 'LM', 'CM', 'CM', 'RM', 'LW', 'ST', 'RW'],
  '5-3-2': ['GK', 'LWB', 'CB', 'CB', 'CB', 'RWB', 'CM', 'CM', 'CM', 'ST', 'ST'],
};

// ---------------------------------------------------------------------------
// getFormationSlots  --  returns [{index, position}]
// ---------------------------------------------------------------------------
function getFormationSlots(formation) {
  const positions = FORMATIONS[formation];
  if (!positions) throw new Error(`Bilinmeyen formasyon: ${formation}`);
  return positions.map((pos, idx) => ({ index: idx, position: pos }));
}

// ---------------------------------------------------------------------------
// getRandomPlayerForTier
//   tier       - 'bronze' | 'silver' | 'gold' | 'elite'
//   excludeIds - array of player ids already used in this session
//   leagueFilter - optional league name to narrow pool
// ---------------------------------------------------------------------------
function getRandomPlayerForTier(tier, excludeIds = [], leagueFilter = null) {
  const db = getDb();
  const range = TIER_RANGES[tier];
  if (!range) throw new Error(`Gecersiz tier: ${tier}`);

  let sql = `SELECT * FROM players WHERE is_active = 1 AND overall >= ? AND overall <= ?`;
  const params = [range.min, range.max];

  if (excludeIds.length > 0) {
    const placeholders = excludeIds.map(() => '?').join(',');
    sql += ` AND id NOT IN (${placeholders})`;
    params.push(...excludeIds);
  }

  if (leagueFilter) {
    sql += ' AND league = ?';
    params.push(leagueFilter);
  }

  const candidates = db.prepare(sql).all(...params);
  if (candidates.length === 0) return null;

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return pick;
}

// ---------------------------------------------------------------------------
// calculateTeamScore  --  sum of OVR values from an array of player objects
// ---------------------------------------------------------------------------
function calculateTeamScore(players) {
  if (!players || !Array.isArray(players)) return 0;
  return players.reduce((sum, p) => sum + (p && p.overall ? p.overall : 0), 0);
}

module.exports = {
  TIER_RANGES,
  FORMATIONS,
  getFormationSlots,
  getRandomPlayerForTier,
  calculateTeamScore,
};
