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

module.exports = { getOverview, blockUser, unblockUser };
