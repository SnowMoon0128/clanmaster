const { pool } = require('../db/pool');
const { isClanAdmin, writeAction } = require('../repositories/clanRepository');
const {
  upsertPlayer,
  closeActiveMembership,
  createMembership,
  getPlayerHistory,
  addBlacklist,
  listBlacklistByClan
} = require('../repositories/playerRepository');

async function addOrUpdatePlayer({ requesterId, clanId, gameUid, nickname }) {
  const allowed = await isClanAdmin({ clanId, userId: requesterId });
  if (!allowed) {
    const error = new Error('Forbidden');
    error.status = 403;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const player = await upsertPlayer(client, { gameUid, nickname });
    await closeActiveMembership(client, player.id);
    await createMembership(client, { playerId: player.id, clanId });

    await writeAction(client, {
      actorUserId: requesterId,
      actionType: 'UPSERT_PLAYER',
      targetType: 'player',
      targetId: player.id,
      payload: { clanId }
    });

    await client.query('COMMIT');
    return player;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function movePlayer({ requesterId, clanId, playerId }) {
  const allowed = await isClanAdmin({ clanId, userId: requesterId });
  if (!allowed) {
    const error = new Error('Forbidden');
    error.status = 403;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await closeActiveMembership(client, playerId);
    await createMembership(client, { playerId, clanId });

    await writeAction(client, {
      actorUserId: requesterId,
      actionType: 'MOVE_PLAYER',
      targetType: 'player',
      targetId: playerId,
      payload: { clanId }
    });

    await client.query('COMMIT');
    return { moved: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function addToBlacklist({ requesterId, clanId, playerId, reason }) {
  const allowed = await isClanAdmin({ clanId, userId: requesterId });
  if (!allowed) {
    const error = new Error('Forbidden');
    error.status = 403;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const row = await addBlacklist(client, { playerId, clanId, reason, createdBy: requesterId });

    await writeAction(client, {
      actorUserId: requesterId,
      actionType: 'BLACKLIST_PLAYER',
      targetType: 'player',
      targetId: playerId,
      payload: { clanId, reason: reason || null }
    });

    await client.query('COMMIT');
    return row;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function playerHistory(playerId) {
  return getPlayerHistory(playerId);
}

async function blacklistList({ requesterId, clanId }) {
  const allowed = await isClanAdmin({ clanId, userId: requesterId });
  if (!allowed) {
    const error = new Error('Forbidden');
    error.status = 403;
    throw error;
  }
  return listBlacklistByClan(clanId);
}

module.exports = { addOrUpdatePlayer, movePlayer, addToBlacklist, playerHistory, blacklistList };
