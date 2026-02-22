const { pool } = require('../db/pool');

async function getPlayerByGameUid(gameUid) {
  const q = `
    SELECT id, game_uid, nickname
    FROM players
    WHERE game_uid = $1
  `;
  const { rows } = await pool.query(q, [gameUid]);
  return rows[0] || null;
}

async function findPlayersByNickname(nickname) {
  const q = `
    SELECT id, game_uid, nickname
    FROM players
    WHERE nickname = $1
  `;
  const { rows } = await pool.query(q, [nickname]);
  return rows;
}

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

async function listBlacklistByClan(clanId) {
  const q = `
    SELECT
      b.id,
      b.clan_id,
      c.name AS clan_name,
      b.player_id,
      p.game_uid,
      p.nickname,
      b.reason,
      b.created_by,
      u.display_name AS created_by_name,
      b.created_at
    FROM blacklist_entries b
    JOIN players p ON p.id = b.player_id
    JOIN clans c ON c.id = b.clan_id
    JOIN app_users u ON u.id = b.created_by
    WHERE b.clan_id = $1
    ORDER BY b.created_at DESC
  `;
  const { rows } = await pool.query(q, [clanId]);
  return rows;
}

async function removeBlacklistEntry(client, { entryId, clanId }) {
  const q = `
    DELETE FROM blacklist_entries
    WHERE id = $1 AND clan_id = $2
    RETURNING id, player_id, clan_id, reason, created_by, created_at
  `;
  const { rows } = await client.query(q, [entryId, clanId]);
  return rows[0] || null;
}

async function writeIdentityEvent(client, payload) {
  const q = `
    INSERT INTO player_identity_events (
      player_id, game_uid, input_nickname, stored_nickname, event_type, actor_user_id, clan_id, note
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;
  await client.query(q, [
    payload.playerId || null,
    payload.gameUid,
    payload.inputNickname,
    payload.storedNickname || null,
    payload.eventType,
    payload.actorUserId || null,
    payload.clanId || null,
    payload.note || null
  ]);
}

module.exports = {
  getPlayerByGameUid,
  findPlayersByNickname,
  upsertPlayer,
  closeActiveMembership,
  createMembership,
  getPlayerHistory,
  addBlacklist,
  listBlacklistByClan,
  removeBlacklistEntry,
  writeIdentityEvent
};
