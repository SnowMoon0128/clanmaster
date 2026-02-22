const clanService = require('../services/clanService');
const { resolveClanIdForUser } = require('../services/clanScopeService');
const { getClanById } = require('../repositories/clanRepository');

async function listAdmins(req, res, next) {
  try {
    const clanId = Number(req.params.clanId);
    const admins = await clanService.getAdmins(clanId, req.user.sub);
    return res.json({ admins });
  } catch (error) {
    return next(error);
  }
}

async function addAdmin(req, res, next) {
  try {
    const clanId = Number(req.params.clanId);
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email required' });

    const result = await clanService.inviteAdmin({ clanId, requesterId: req.user.sub, email });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function listMyClanAdmins(req, res, next) {
  try {
    const clanId = await resolveClanIdForUser({
      userId: req.user.sub,
      role: req.user.role,
      clanIdInput: req.query.clanId
    });
    const admins = await clanService.getAdmins(clanId, req.user.sub);
    const clan = await getClanById(clanId);
    return res.json({ admins, clanId, clan });
  } catch (error) {
    return next(error);
  }
}

async function addMyClanAdmin(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email required' });
    const clanId = await resolveClanIdForUser({
      userId: req.user.sub,
      role: req.user.role,
      clanIdInput: req.body.clanId
    });
    const result = await clanService.inviteAdmin({ clanId, requesterId: req.user.sub, email });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function removeMyClanAdmin(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ message: 'userId param required' });
    const clanId = await resolveClanIdForUser({
      userId: req.user.sub,
      role: req.user.role,
      clanIdInput: req.query.clanId
    });
    const result = await clanService.removeAdminFromClan({
      clanId,
      requesterId: req.user.sub,
      userId
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = { listAdmins, addAdmin, listMyClanAdmins, addMyClanAdmin, removeMyClanAdmin };
