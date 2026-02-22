const { pool } = require('../db/pool');
const { isClanAdmin, writeAction } = require('../repositories/clanRepository');
const {
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
    const existing = await getPlayerByGameUid(gameUid);
    const sameNickPlayers = await findPlayersByNickname(nickname);

    const player = await upsertPlayer(client, { gameUid, nickname });
    await closeActiveMembership(client, player.id);
    await createMembership(client, { playerId: player.id, clanId });

    if (!existing) {
      await writeIdentityEvent(client, {
        playerId: player.id,
        gameUid,
        inputNickname: nickname,
        storedNickname: nickname,
        eventType: 'FIRST_SEEN',
        actorUserId: requesterId,
        clanId,
        note: 'first registration'
      });
    } else if (existing.nickname !== nickname) {
      await writeIdentityEvent(client, {
        playerId: player.id,
        gameUid,
        inputNickname: nickname,
        storedNickname: existing.nickname,
        eventType: 'NICKNAME_CHANGED',
        actorUserId: requesterId,
        clanId,
        note: 'same game_uid with different nickname'
      });
    }

    const reusedByOtherId = sameNickPlayers.find((p) => p.game_uid !== gameUid);
    if (reusedByOtherId) {
      await writeIdentityEvent(client, {
        playerId: player.id,
        gameUid,
        inputNickname: nickname,
        storedNickname: nickname,
        eventType: 'NICKNAME_DUPLICATED_ACROSS_UID',
        actorUserId: requesterId,
        clanId,
        note: `nickname already used by game_uid ${reusedByOtherId.game_uid}`
      });
    }

    await writeAction(client, {
      actorUserId: requesterId,
      actionType: 'UPSERT_PLAYER',
      targetType: 'player',
      targetId: player.id,
      payload: {
        clanId,
        gameUid,
        nickname,
        previousNickname: existing ? existing.nickname : null
      }
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

async function blacklistList({ requesterId, clanId, role }) {
  if (role !== 'site_admin') {
    const allowed = await isClanAdmin({ clanId, userId: requesterId });
    if (!allowed) {
      const error = new Error('Forbidden');
      error.status = 403;
      throw error;
    }
  }
  return listBlacklistByClan(clanId);
}

async function removeFromBlacklist({ requesterId, clanId, entryId, role }) {
  if (role !== 'site_admin') {
    const allowed = await isClanAdmin({ clanId, userId: requesterId });
    if (!allowed) {
      const error = new Error('Forbidden');
      error.status = 403;
      throw error;
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const removed = await removeBlacklistEntry(client, { entryId, clanId });
    if (!removed) {
      const error = new Error('Blacklist entry not found');
      error.status = 404;
      throw error;
    }

    await writeAction(client, {
      actorUserId: role === 'site_admin' ? null : requesterId,
      actionType: 'UNBLACKLIST_PLAYER',
      targetType: 'blacklist_entry',
      targetId: entryId,
      payload: { clanId, playerId: removed.player_id, byRole: role }
    });

    await client.query('COMMIT');
    return removed;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  addOrUpdatePlayer,
  movePlayer,
  addToBlacklist,
  playerHistory,
  blacklistList,
  removeFromBlacklist
};
