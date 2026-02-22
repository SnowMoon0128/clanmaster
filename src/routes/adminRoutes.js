const express = require('express');
const { authRequired, siteAdminRequired } = require('../middleware/auth');
const { getOverview, blockUser, unblockUser } = require('../controllers/adminController');

const router = express.Router();

router.get('/overview', authRequired, siteAdminRequired, getOverview);
router.post('/block-user', authRequired, siteAdminRequired, blockUser);
router.post('/unblock-user', authRequired, siteAdminRequired, unblockUser);

module.exports = router;
