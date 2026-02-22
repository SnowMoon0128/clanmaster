const playerService = require('../services/playerService');

async function addPlayer(req, res, next) {
  try {
    const { clanId, gameUid, nickname } = req.body;
    if (!clanId || !gameUid || !nickname) {
      return res.status(400).json({ message: 'clanId, gameUid, nickname required' });
    }

    const result = await playerService.addOrUpdatePlayer({
      requesterId: req.user.sub,
      clanId: Number(clanId),
      gameUid,
      nickname
    });

    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function movePlayer(req, res, next) {
  try {
    const { clanId } = req.body;
    const playerId = Number(req.params.playerId);
    if (!clanId) return res.status(400).json({ message: 'clanId required' });

    const result = await playerService.movePlayer({
      requesterId: req.user.sub,
      clanId: Number(clanId),
      playerId
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function history(req, res, next) {
  try {
    const playerId = Number(req.params.playerId);
    const historyRows = await playerService.playerHistory(playerId);
    return res.json({ history: historyRows });
  } catch (error) {
    return next(error);
  }
}

async function blacklist(req, res, next) {
  try {
    const { clanId, playerId, reason } = req.body;
    if (!clanId || !playerId) {
      return res.status(400).json({ message: 'clanId and playerId required' });
    }

    const result = await playerService.addToBlacklist({
      requesterId: req.user.sub,
      clanId: Number(clanId),
      playerId: Number(playerId),
      reason
    });

    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function blacklistList(req, res, next) {
  try {
    const clanId = Number(req.query.clanId);
    if (!clanId) return res.status(400).json({ message: 'clanId query required' });
    const result = await playerService.blacklistList({
      requesterId: req.user.sub,
      clanId
    });
    return res.json({ blacklist: result });
  } catch (error) {
    return next(error);
  }
}

module.exports = { addPlayer, movePlayer, history, blacklist, blacklistList };
