const { pool } = require('../db/pool');

async function upsertPlayer(client, { gameUid, nickname }) {
  const q = `
    INSERT INTO players (game_uid, nickname)
    VALUES ($1, $2)
    ON CONFLICT (game_uid)
    DO UPDATE SET nickname = EXCLUDED.nickname
    RETURNING id, game_uid, nickname
  `;
  const { rows } = await client.query(q, [gameUid, nickname]);
  return rows[0];
}

async function closeActiveMembership(client, playerId) {
  const q = `
    UPDATE clan_memberships
    SET left_at = NOW()
    WHERE player_id = $1 AND left_at IS NULL
  `;
  await client.query(q, [playerId]);
}

async function createMembership(client, { playerId, clanId }) {
  const q = `
    INSERT INTO clan_memberships (player_id, clan_id)
    VALUES ($1, $2)
  `;
  await client.query(q, [playerId, clanId]);
}

async function getPlayerHistory(playerId) {
  const q = `
    SELECT
      p.id AS player_id,
      p.game_uid,
      p.nickname,
      c.id AS clan_id,
      c.name AS clan_name,
      m.joined_at,
      m.left_at
    FROM players p
    LEFT JOIN clan_memberships m ON m.player_id = p.id
    LEFT JOIN clans c ON c.id = m.clan_id
    WHERE p.id = $1
    ORDER BY m.joined_at DESC NULLS LAST
  `;
  const { rows } = await pool.query(q, [playerId]);
  return rows;
}

async function addBlacklist(client, { playerId, clanId, reason, createdBy }) {
  const q = `
    INSERT INTO blacklist_entries (player_id, clan_id, reason, created_by)
    VALUES ($1, $2, $3, $4)
    RETURNING id, player_id, clan_id, reason, created_by, created_at
  `;
  const { rows } = await client.query(q, [playerId, clanId, reason || null, createdBy]);
  return rows[0];
}

module.exports = {
  upsertPlayer,
  closeActiveMembership,
  createMembership,
  getPlayerHistory,
  addBlacklist
};
