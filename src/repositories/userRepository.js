const { pool } = require('../db/pool');

async function createUser(client, { email, passwordHash, displayName, role }) {
  const q = `
    INSERT INTO app_users (email, password_hash, display_name, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, display_name, role
  `;
  const { rows } = await client.query(q, [email, passwordHash, displayName, role]);
  return rows[0];
}

async function findUserByEmail(email) {
  const q = `
    SELECT id, email, password_hash, display_name, role, is_blocked, blocked_reason, blocked_at
    FROM app_users
    WHERE email = $1
  `;
  const { rows } = await pool.query(q, [email]);
  return rows[0] || null;
}

async function findUserById(userId) {
  const q = `
    SELECT id, email, display_name, role, is_blocked, blocked_reason, blocked_at
    FROM app_users
    WHERE id = $1
  `;
  const { rows } = await pool.query(q, [userId]);
  return rows[0] || null;
}

async function setUserBlocked(client, { userId, blocked, reason }) {
  const q = `
    UPDATE app_users
    SET is_blocked = $2,
        blocked_reason = CASE WHEN $2 THEN $3 ELSE NULL END,
        blocked_at = CASE WHEN $2 THEN NOW() ELSE NULL END
    WHERE id = $1
    RETURNING id, email, display_name, role, is_blocked, blocked_reason, blocked_at
  `;
  const { rows } = await client.query(q, [userId, blocked, reason || null]);
  return rows[0] || null;
}

module.exports = { createUser, findUserByEmail, findUserById, setUserBlocked };
