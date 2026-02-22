const express = require('express');
const { authRequired } = require('../middleware/auth');
const { listAdmins, addAdmin } = require('../controllers/clanController');

const router = express.Router();

router.get('/:clanId/admins', authRequired, listAdmins);
router.post('/:clanId/admins', authRequired, addAdmin);

module.exports = router;
