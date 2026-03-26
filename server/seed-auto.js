'use strict';

const { allPlayers } = require('./seed-players');

function seedPlayers(db) {
  const stmt = db.prepare(
    'INSERT INTO players (name, position, nationality, nationality_flag, club, league, overall, tier, stats) VALUES (?,?,?,?,?,?,?,?,?)'
  );

  const insertAll = db.transaction((players) => {
    for (const p of players) {
      const tier = p.overall >= 91 ? 'elite' : p.overall >= 85 ? 'gold' : p.overall >= 71 ? 'silver' : 'bronze';
      stmt.run(p.name, p.position, p.nationality, p.nationality_flag, p.club, p.league, p.overall, tier, p.stats);
    }
  });

  insertAll(allPlayers);
  console.log(`[seed-auto] ${allPlayers.length} oyuncu yuklendi.`);
}

module.exports = { seedPlayers };
