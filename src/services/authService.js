const { pool } = require('../db/pool');
const { env } = require('../config/env');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signToken } = require('../utils/jwt');
const { createUser, findUserByEmail } = require('../repositories/userRepository');
const { createClan, addClanAdmin, writeAction } = require('../repositories/clanRepository');

async function registerOwner({ email, password, displayName, clanName }) {
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
    const user = await createUser(client, { email, passwordHash, displayName, role: 'owner' });
    const clan = await createClan(client, { name: clanName, ownerUserId: user.id });
    await addClanAdmin(client, { clanId: clan.id, userId: user.id, addedBy: user.id });

    await writeAction(client, {
      actorUserId: user.id,
      actionType: 'REGISTER_OWNER',
      targetType: 'clan',
      targetId: clan.id,
      payload: { clanName: clan.name }
    });

    await client.query('COMMIT');

    const token = signToken({ sub: user.id, email: user.email, role: user.role, clanId: clan.id });
    return { user, clan, token };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function registerManager({ email, password, displayName }) {
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
    await writeAction(client, {
      actorUserId: user.id,
      actionType: 'REGISTER_MANAGER',
      targetType: 'user',
      targetId: user.id,
      payload: null
    });
    await client.query('COMMIT');

    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    return { user, token };
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
