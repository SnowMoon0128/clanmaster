const express = require('express');
const { authRequired } = require('../middleware/auth');
const {
  addPlayer,
  movePlayer,
  history,
  blacklist,
  blacklistList,
  unblacklist
} = require('../controllers/playerController');

const router = express.Router();

router.post('/players', authRequired, addPlayer);
router.post('/players/:playerId/move', authRequired, movePlayer);
router.get('/players/:playerId/history', authRequired, history);
router.post('/blacklist', authRequired, blacklist);
router.get('/blacklist', authRequired, blacklistList);
router.delete('/blacklist/:entryId', authRequired, unblacklist);

module.exports = router;
