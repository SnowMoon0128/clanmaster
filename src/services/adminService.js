const { pool } = require('../db/pool');
const { hashPassword } = require('../utils/hash');
const { createUser, findUserByEmail, setUserBlocked } = require('../repositories/userRepository');
const { writeAction, createClan, addClanAdmin } = require('../repositories/clanRepository');
const {
  listClanManagersWithClans,
  listClansWithActiveMembers,
  topBlacklistedPlayers,
  listPendingOwnerRequestsRepo
} = require('../repositories/adminRepository');
const {
  findOwnerRequestById,
  markOwnerRequestApproved,
  markOwnerRequestRejected
} = require('../repositories/ownerRequestRepository');

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
    if (row.clan_id) map.get(row.user_id).clans.push({ clanId: row.clan_id, clanName: row.clan_name });
  }
  return Array.from(map.values());
}

function groupClans(rows) {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.clan_id)) {
      map.set(row.clan_id, { clanId: row.clan_id, clanName: row.clan_name, members: [] });
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

async function listPendingOwners() {
  return listPendingOwnerRequestsRepo();
}

async function approvePendingOwner({ actorId, requestId }) {
  const req = await findOwnerRequestById(requestId);
  if (!req || req.status !== 'pending') {
    const error = new Error('Pending request not found');
    error.status = 404;
    throw error;
  }

  const existing = await findUserByEmail(req.email);
  if (existing) {
    const error = new Error('Email already exists in app_users');
    error.status = 409;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = await createUser(client, {
      email: req.email,
      passwordHash: req.password_hash || (await hashPassword('temporary')),
      displayName: req.display_name,
      role: 'owner'
    });
    const clan = await createClan(client, {
      name: req.clan_name,
      ownerUserId: user.id,
      inviteCode: req.invite_code
    });
    await addClanAdmin(client, { clanId: clan.id, userId: user.id, addedBy: user.id });
    await markOwnerRequestApproved(client, { requestId, approvedBy: actorId });

    await writeAction(client, {
      actorUserId: null,
      actionType: 'OWNER_SIGNUP_APPROVED',
      targetType: 'owner_signup_request',
      targetId: requestId,
      payload: { ownerUserId: user.id, clanId: clan.id }
    });

    await client.query('COMMIT');
    return { approved: true, ownerUserId: user.id, clanId: clan.id, inviteCode: clan.invite_code };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function rejectPendingOwner({ actorId, requestId, reason }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const rejected = await markOwnerRequestRejected(client, {
      requestId,
      approvedBy: actorId,
      reason
    });
    if (!rejected) {
      const error = new Error('Request not found');
      error.status = 404;
      throw error;
    }
    await writeAction(client, {
      actorUserId: null,
      actionType: 'OWNER_SIGNUP_REJECTED',
      targetType: 'owner_signup_request',
      targetId: requestId,
      payload: { reason: reason || null }
    });
    await client.query('COMMIT');
    return rejected;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function blockUser({ actorId, userId, reason }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await setUserBlocked(client, { userId, blocked: true, reason });
    if (!updated) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await setUserBlocked(client, { userId, blocked: false, reason: null });
    if (!updated) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
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

module.exports = {
  overview,
  listPendingOwners,
  approvePendingOwner,
  rejectPendingOwner,
  blockUser,
  unblockUser
};
