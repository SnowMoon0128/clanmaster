const { pool } = require('../db/pool');
const {
  isClanAdmin,
  isClanOwner,
  listClanAdmins,
  addClanAdmin,
  removeClanAdmin,
  writeAction
} = require('../repositories/clanRepository');
const { findUserByEmail } = require('../repositories/userRepository');

async function getAdmins(clanId, requesterId) {
  const allowed = await isClanAdmin({ clanId, userId: requesterId });
  if (!allowed) {
    const error = new Error('Forbidden');
    error.status = 403;
    throw error;
  }
  return listClanAdmins(clanId);
}

async function inviteAdmin({ clanId, requesterId, email }) {
  const ownerOnly = await isClanOwner({ clanId, userId: requesterId });
  if (!ownerOnly) {
    const error = new Error('Only clan owner can invite sub-admin');
    error.status = 403;
    throw error;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('User not found by email');
    error.status = 404;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await addClanAdmin(client, { clanId, userId: user.id, addedBy: requesterId });
    await writeAction(client, {
      actorUserId: requesterId,
      actionType: 'ADD_ADMIN',
      targetType: 'user',
      targetId: user.id,
      payload: { clanId }
    });
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return { addedUserId: user.id, email: user.email };
}

async function removeAdminFromClan({ clanId, requesterId, userId }) {
  const ownerOnly = await isClanOwner({ clanId, userId: requesterId });
  if (!ownerOnly) {
    const error = new Error('Only clan owner can remove sub-admin');
    error.status = 403;
    throw error;
  }

  const ownerTarget = await isClanOwner({ clanId, userId });
  if (ownerTarget) {
    const error = new Error('Owner cannot be removed');
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const removed = await removeClanAdmin(client, { clanId, userId });
    if (!removed) {
      const error = new Error('Clan admin not found');
      error.status = 404;
      throw error;
    }
    await writeAction(client, {
      actorUserId: requesterId,
      actionType: 'REMOVE_ADMIN',
      targetType: 'user',
      targetId: userId,
      payload: { clanId }
    });
    await client.query('COMMIT');
    return { removed: true, userId, clanId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { getAdmins, inviteAdmin, removeAdminFromClan };
