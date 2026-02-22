const express = require('express');
const { authRequired, siteAdminRequired } = require('../middleware/auth');
const {
  getOverview,
  blockUser,
  unblockUser,
  listPendingOwners,
  approvePendingOwner,
  rejectPendingOwner
} = require('../controllers/adminController');

const router = express.Router();

router.get('/overview', authRequired, siteAdminRequired, getOverview);
router.post('/block-user', authRequired, siteAdminRequired, blockUser);
router.post('/unblock-user', authRequired, siteAdminRequired, unblockUser);
router.get('/pending-owners', authRequired, siteAdminRequired, listPendingOwners);
router.post('/pending-owners/:requestId/approve', authRequired, siteAdminRequired, approvePendingOwner);
router.post('/pending-owners/:requestId/reject', authRequired, siteAdminRequired, rejectPendingOwner);

module.exports = router;
