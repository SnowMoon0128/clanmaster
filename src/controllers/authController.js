const authService = require('../services/authService');

async function registerOwner(req, res, next) {
  try {
    const { email, password, displayName, clanName } = req.body;
    if (!email || !password || !displayName || !clanName) {
      return res.status(400).json({ message: 'email, password, displayName, clanName required' });
    }
    const result = await authService.registerOwner({ email, password, displayName, clanName });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function registerManager(req, res, next) {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ message: 'email, password, displayName required' });
    }
    const result = await authService.registerManager({ email, password, displayName });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password, adminName, adminId } = req.body;

    if (adminName && adminId && password) {
      const adminResult = await authService.siteAdminLogin({ adminName, adminId, password });
      return res.json(adminResult);
    }

    if (!email || !password) {
      return res.status(400).json({ message: 'email/password or adminName/adminId/password required' });
    }
    const result = await authService.login({ email, password });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function siteAdminLogin(req, res, next) {
  try {
    const { adminName, adminId, password } = req.body;
    if (!adminName || !adminId || !password) {
      return res.status(400).json({ message: 'adminName, adminId, password required' });
    }
    const result = await authService.siteAdminLogin({ adminName, adminId, password });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = { registerOwner, registerManager, login, siteAdminLogin };
