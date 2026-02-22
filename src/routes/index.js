const express = require('express');
const authRoutes = require('./authRoutes');
const clanRoutes = require('./clanRoutes');
const playerRoutes = require('./playerRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/clans', clanRoutes);
router.use('/', playerRoutes);

module.exports = router;
