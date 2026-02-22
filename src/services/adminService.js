const { pool } = require('../db/pool');
const { writeAction } = require('../repositories/clanRepository');
const { findUserById, setUserBlocked } = require('../repositories/userRepository');
const {
  listClanManagersWithClans,
  listClansWithActiveMembers,
  topBlacklistedPlayers
} = require('../repositories/adminRepository');

function groupManagers(rows) {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.user_id)) {
      map.set(row.user_id, {
        userId: row.user_id,
        email: row.email,
        displayName: row.display_name,
        role: row.role,
        isBlocked: row.is_blocked,
        clans: []
      });
    }
    if (row.clan_id) {
      map.get(row.user_id).clans.push({ clanId: row.clan_id, clanName: row.clan_name });
    }
  }
  return Array.from(map.values());
}

function groupClans(rows) {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.clan_id)) {
      map.set(row.clan_id, {
        clanId: row.clan_id,
        clanName: row.clan_name,
        members: []
      });
    }
    if (row.player_id) {
      map.get(row.clan_id).members.push({
        playerId: row.player_id,
        gameUid: row.game_uid,
        nickname: row.nickname
      });
    }
  }
  return Array.from(map.values());
}

async function overview() {
  const managerRows = await listClanManagersWithClans();
  const clanRows = await listClansWithActiveMembers();
  const top = await topBlacklistedPlayers(10);

  return {
    clanManagers: groupManagers(managerRows),
    clans: groupClans(clanRows),
    topBlacklistedPlayers: top
  };
}

async function blockUser({ actorId, userId, reason }) {
  const targetUser = await findUserById(userId);
  if (!targetUser) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await setUserBlocked(client, { userId, blocked: true, reason });
    await writeAction(client, {
      actorUserId: null,
      actionType: 'SITE_BLOCK_USER',
      targetType: 'user',
      targetId: userId,
      payload: { actorId, reason: reason || null }
    });
    await client.query('COMMIT');
    return updated;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function unblockUser({ actorId, userId }) {
  const targetUser = await findUserById(userId);
  if (!targetUser) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await setUserBlocked(client, { userId, blocked: false, reason: null });
    await writeAction(client, {
      actorUserId: null,
      actionType: 'SITE_UNBLOCK_USER',
      targetType: 'user',
      targetId: userId,
      payload: { actorId }
    });
    await client.query('COMMIT');
    return updated;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { overview, blockUser, unblockUser };
