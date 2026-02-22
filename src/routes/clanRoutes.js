const express = require('express');
const { authRequired } = require('../middleware/auth');
const {
  listAdmins,
  addAdmin,
  listMyClanAdmins,
  addMyClanAdmin,
  removeMyClanAdmin
} = require('../controllers/clanController');

const router = express.Router();

router.get('/:clanId/admins', authRequired, listAdmins);
router.post('/:clanId/admins', authRequired, addAdmin);
router.get('/admins/me', authRequired, listMyClanAdmins);
router.post('/admins/me', authRequired, addMyClanAdmin);
router.delete('/admins/me/:userId', authRequired, removeMyClanAdmin);

module.exports = router;
