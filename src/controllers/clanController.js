const clanService = require('../services/clanService');

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

module.exports = { listAdmins, addAdmin };
