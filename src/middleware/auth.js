const { verifyToken } = require('../utils/jwt');
const { findUserById } = require('../repositories/userRepository');

async function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: 'Token required' });

  try {
    req.user = verifyToken(token);
    if (req.user.role !== 'site_admin') {
      const dbUser = await findUserById(Number(req.user.sub));
      if (!dbUser) return res.status(401).json({ message: 'Invalid token user' });
      if (dbUser.is_blocked) return res.status(403).json({ message: 'Blocked user' });
    }
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function siteAdminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'site_admin') {
    return res.status(403).json({ message: 'Site admin only' });
  }
  return next();
}

module.exports = { authRequired, siteAdminRequired };
