const express = require('express');
const { authRequired } = require('../middleware/auth');
const { addPlayer, movePlayer, history, blacklist } = require('../controllers/playerController');

const router = express.Router();

router.post('/players', authRequired, addPlayer);
router.post('/players/:playerId/move', authRequired, movePlayer);
router.get('/players/:playerId/history', authRequired, history);
router.post('/blacklist', authRequired, blacklist);

module.exports = router;
