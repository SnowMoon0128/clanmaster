const { pool } = require('../db/pool');

async function findOwnerRequestByEmail(email) {
  const q = `
    SELECT *
    FROM owner_signup_requests
    WHERE email = $1
  `;
  const { rows } = await pool.query(q, [email]);
  return rows[0] || null;
}

async function createOwnerRequest(client, payload) {
  const q = `
    INSERT INTO owner_signup_requests (
      email, password_hash, display_name, clan_name, invite_code, status
    )
    VALUES ($1, $2, $3, $4, $5, 'pending')
    ON CONFLICT (email)
    DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      display_name = EXCLUDED.display_name,
      clan_name = EXCLUDED.clan_name,
      invite_code = EXCLUDED.invite_code,
      status = 'pending',
      approved_by = NULL,
      reject_reason = NULL,
      processed_at = NULL,
      created_at = NOW()
    RETURNING id, email, display_name, clan_name, invite_code, status, created_at
  `;
  const { rows } = await client.query(q, [
    payload.email,
    payload.passwordHash,
    payload.displayName,
    payload.clanName,
    payload.inviteCode
  ]);
  return rows[0];
}

async function listPendingOwnerRequests() {
  const q = `
    SELECT id, email, display_name, clan_name, invite_code, status, created_at
    FROM owner_signup_requests
    WHERE status = 'pending'
    ORDER BY created_at ASC
  `;
  const { rows } = await pool.query(q);
  return rows;
}

async function findOwnerRequestById(requestId) {
  const q = `
    SELECT *
    FROM owner_signup_requests
    WHERE id = $1
  `;
  const { rows } = await pool.query(q, [requestId]);
  return rows[0] || null;
}

async function markOwnerRequestApproved(client, { requestId, approvedBy }) {
  const q = `
    UPDATE owner_signup_requests
    SET status = 'approved',
        approved_by = $2,
        processed_at = NOW(),
        reject_reason = NULL
    WHERE id = $1
    RETURNING *
  `;
  const { rows } = await client.query(q, [requestId, approvedBy]);
  return rows[0] || null;
}

async function markOwnerRequestRejected(client, { requestId, approvedBy, reason }) {
  const q = `
    UPDATE owner_signup_requests
    SET status = 'rejected',
        approved_by = $2,
        reject_reason = $3,
        processed_at = NOW()
    WHERE id = $1
    RETURNING id, email, status, reject_reason, processed_at
  `;
  const { rows } = await client.query(q, [requestId, approvedBy, reason || null]);
  return rows[0] || null;
}

module.exports = {
  findOwnerRequestByEmail,
  createOwnerRequest,
  listPendingOwnerRequests,
  findOwnerRequestById,
  markOwnerRequestApproved,
  markOwnerRequestRejected
};
