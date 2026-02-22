const express = require('express');
const {
  registerOwner,
  registerManager,
  login,
  siteAdminLogin
} = require('../controllers/authController');

const router = express.Router();

router.post('/register-owner', registerOwner);
router.post('/register-manager', registerManager);
router.post('/login', login);
router.post('/site-admin-login', siteAdminLogin);

module.exports = router;
