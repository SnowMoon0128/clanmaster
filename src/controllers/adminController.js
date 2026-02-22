const adminService = require('../services/adminService');

async function getOverview(_req, res, next) {
  try {
    const data = await adminService.overview();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function blockUser(req, res, next) {
  try {
    const { userId, reason } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });
    const result = await adminService.blockUser({
      actorId: req.user.sub,
      userId: Number(userId),
      reason
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function unblockUser(req, res, next) {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });
    const result = await adminService.unblockUser({
      actorId: req.user.sub,
      userId: Number(userId)
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function listPendingOwners(_req, res, next) {
  try {
    const rows = await adminService.listPendingOwners();
    return res.json({ pendingOwners: rows });
  } catch (error) {
    return next(error);
  }
}

async function approvePendingOwner(req, res, next) {
  try {
    const requestId = Number(req.params.requestId);
    const result = await adminService.approvePendingOwner({
      actorId: req.user.sub,
      requestId
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function rejectPendingOwner(req, res, next) {
  try {
    const requestId = Number(req.params.requestId);
    const result = await adminService.rejectPendingOwner({
      actorId: req.user.sub,
      requestId,
      reason: req.body.reason
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getOverview,
  blockUser,
  unblockUser,
  listPendingOwners,
  approvePendingOwner,
  rejectPendingOwner
};
