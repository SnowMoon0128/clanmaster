const crypto = require('crypto');
const { pool } = require('../db/pool');
const { env } = require('../config/env');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signToken } = require('../utils/jwt');
const {
  createUser,
  findUserByEmail,
  countUserClanAssignments
} = require('../repositories/userRepository');
const { createClan, addClanAdmin, writeAction, findClanByInviteCode } = require('../repositories/clanRepository');
const {
  findOwnerRequestByEmail,
  createOwnerRequest
} = require('../repositories/ownerRequestRepository');

function generateInviteCode() {
  return crypto.randomBytes(3).toString('hex');
}

async function registerOwner({ email, password, displayName, clanName }) {
  const exists = await findUserByEmail(email);
  if (exists) {
    const error = new Error('Email already exists');
    error.status = 409;
    throw error;
  }

  const reqExists = await findOwnerRequestByEmail(email);
  if (reqExists && reqExists.status === 'pending') {
    return {
      status: 'pending',
      message: `Owner signup already pending. Contact site admin: ${env.siteAdminEmail}`
    };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const passwordHash = await hashPassword(password);
    const inviteCode = generateInviteCode();
    const request = await createOwnerRequest(client, {
      email,
      passwordHash,
      displayName,
      clanName,
      inviteCode
    });

    await writeAction(client, {
      actorUserId: null,
      actionType: 'OWNER_SIGNUP_REQUESTED',
      targetType: 'owner_signup_request',
      targetId: request.id,
      payload: { email, clanName, inviteCode }
    });

    await client.query('COMMIT');
    return {
      status: 'pending',
      requestId: request.id,
      message: `Signup pending approval. Contact site admin: ${env.siteAdminEmail}`
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function registerManager({ email, password, displayName, inviteCode }) {
  if (!inviteCode) {
    const error = new Error('inviteCode required');
    error.status = 400;
    throw error;
  }

  const clan = await findClanByInviteCode(inviteCode);
  if (!clan) {
    const error = new Error('Invalid invite code');
    error.status = 404;
    throw error;
  }

  const exists = await findUserByEmail(email);
  if (exists) {
    const error = new Error('Email already exists');
    error.status = 409;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const passwordHash = await hashPassword(password);
    const user = await createUser(client, { email, passwordHash, displayName, role: 'manager' });
    await addClanAdmin(client, { clanId: clan.id, userId: user.id, addedBy: clan.owner_user_id });
    await writeAction(client, {
      actorUserId: null,
      actionType: 'REGISTER_MANAGER_WITH_CODE',
      targetType: 'user',
      targetId: user.id,
      payload: { clanId: clan.id, inviteCode }
    });
    await client.query('COMMIT');

    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    return { user, token, clan: { id: clan.id, name: clan.name } };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function login({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  const ok = await comparePassword(password, user.password_hash);
  if (!ok) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  if (user.is_blocked) {
    const error = new Error('Blocked user');
    error.status = 403;
    throw error;
  }

  if (user.role === 'manager') {
    const cnt = await countUserClanAssignments(user.id);
    if (cnt <= 0) {
      const error = new Error('No clan assigned. Login blocked.');
      error.status = 403;
      throw error;
    }
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role
    }
  };
}

async function siteAdminLogin({ adminName, adminId, password }) {
  if (
    adminName !== env.siteAdminName ||
    adminId !== env.siteAdminId ||
    password !== env.siteAdminPassword
  ) {
    const error = new Error('Invalid site admin credentials');
    error.status = 401;
    throw error;
  }

  const token = signToken({
    sub: `site-admin:${env.siteAdminId}`,
    role: 'site_admin',
    adminName: env.siteAdminName
  });

  return {
    token,
    user: {
      id: env.siteAdminId,
      displayName: env.siteAdminName,
      role: 'site_admin'
    }
  };
}

module.exports = { registerOwner, registerManager, login, siteAdminLogin };
