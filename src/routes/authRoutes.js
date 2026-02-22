const express = require('express');
const {
  registerOwner,
  registerManager,
  login,
  siteAdminLogin,
  me
} = require('../controllers/authController');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.post('/register-owner', registerOwner);
router.post('/register-manager', registerManager);
router.post('/login', login);
router.post('/site-admin-login', siteAdminLogin);
router.get('/me', authRequired, me);

module.exports = router;
