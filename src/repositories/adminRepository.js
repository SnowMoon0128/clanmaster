const { pool } = require('../db/pool');

async function listClanManagersWithClans() {
  const q = `
    SELECT
      u.id AS user_id,
      u.email,
      u.display_name,
      u.role,
      u.is_blocked,
      c.id AS clan_id,
      c.name AS clan_name
    FROM app_users u
    LEFT JOIN clan_admins ca ON ca.user_id = u.id
    LEFT JOIN clans c ON c.id = ca.clan_id
    WHERE u.role IN ('owner', 'manager')
    ORDER BY u.id ASC, c.id ASC
  `;
  const { rows } = await pool.query(q);
  return rows;
}

async function listClansWithActiveMembers() {
  const q = `
    SELECT
      c.id AS clan_id,
      c.name AS clan_name,
      p.id AS player_id,
      p.game_uid,
      p.nickname
    FROM clans c
    LEFT JOIN clan_memberships m ON m.clan_id = c.id AND m.left_at IS NULL
    LEFT JOIN players p ON p.id = m.player_id
    ORDER BY c.id ASC, p.id ASC
  `;
  const { rows } = await pool.query(q);
  return rows;
}

async function topBlacklistedPlayers(limit = 10) {
  const q = `
    SELECT
      p.id AS player_id,
      p.game_uid,
      p.nickname,
      COUNT(*)::INT AS blacklist_count
    FROM blacklist_entries b
    JOIN players p ON p.id = b.player_id
    GROUP BY p.id, p.game_uid, p.nickname
    ORDER BY blacklist_count DESC, p.id ASC
    LIMIT $1
  `;
  const { rows } = await pool.query(q, [limit]);
  return rows;
}

module.exports = { listClanManagersWithClans, listClansWithActiveMembers, topBlacklistedPlayers };
