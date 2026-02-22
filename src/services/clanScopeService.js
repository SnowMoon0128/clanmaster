const { getUserClanIds } = require('../repositories/clanRepository');

async function resolveClanIdForUser({ userId, role, clanIdInput }) {
  if (role === 'site_admin') {
    if (!clanIdInput) {
      const error = new Error('site_admin must provide clanId');
      error.status = 400;
      throw error;
    }
    return Number(clanIdInput);
  }

  const clanIds = await getUserClanIds(Number(userId));
  if (clanIds.length === 0) {
    const error = new Error('No clan assigned');
    error.status = 403;
    throw error;
  }

  if (clanIds.length > 1) {
    const error = new Error('Multiple clans assigned. Please contact site admin.');
    error.status = 409;
    throw error;
  }

  return clanIds[0];
}

module.exports = { resolveClanIdForUser };
