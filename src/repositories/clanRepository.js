const { pool } = require('../db/pool');

async function createClan(client, { name, ownerUserId }) {
  const q = `
    INSERT INTO clans (name, owner_user_id)
    VALUES ($1, $2)
    RETURNING id, name, owner_user_id
  `;
  const { rows } = await client.query(q, [name, ownerUserId]);
  return rows[0];
}

async function addClanAdmin(client, { clanId, userId, addedBy }) {
  const q = `
    INSERT INTO clan_admins (clan_id, user_id, added_by)
    VALUES ($1, $2, $3)
    ON CONFLICT (clan_id, user_id) DO NOTHING
  `;
  await client.query(q, [clanId, userId, addedBy]);
}

async function isClanAdmin({ clanId, userId }) {
  const q = `SELECT 1 FROM clan_admins WHERE clan_id = $1 AND user_id = $2`;
  const { rows } = await pool.query(q, [clanId, userId]);
  return rows.length > 0;
}

async function listClanAdmins(clanId) {
  const q = `
    SELECT u.id, u.email, u.display_name, u.role
    FROM clan_admins ca
    JOIN app_users u ON u.id = ca.user_id
    WHERE ca.clan_id = $1
    ORDER BY ca.created_at ASC
  `;
  const { rows } = await pool.query(q, [clanId]);
  return rows;
}

async function writeAction(client, { actorUserId, actionType, targetType, targetId, payload }) {
  const q = `
    INSERT INTO admin_actions (actor_user_id, action_type, target_type, target_id, payload)
    VALUES ($1, $2, $3, $4, $5)
  `;
  await client.query(q, [actorUserId, actionType, targetType, String(targetId), payload || null]);
}

module.exports = { createClan, addClanAdmin, isClanAdmin, listClanAdmins, writeAction };
