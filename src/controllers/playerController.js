const playerService = require('../services/playerService');
const { resolveClanIdForUser } = require('../services/clanScopeService');

async function addPlayer(req, res, next) {
  try {
    const { clanId, gameUid, nickname } = req.body;
    if (!gameUid || !nickname) {
      return res.status(400).json({ message: 'gameUid, nickname required' });
    }

    const scopedClanId = await resolveClanIdForUser({
      userId: req.user.sub,
      role: req.user.role,
      clanIdInput: clanId
    });

    const result = await playerService.addOrUpdatePlayer({
      requesterId: req.user.sub,
      clanId: scopedClanId,
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
    const scopedClanId = await resolveClanIdForUser({
      userId: req.user.sub,
      role: req.user.role,
      clanIdInput: clanId
    });

    const result = await playerService.movePlayer({
      requesterId: req.user.sub,
      clanId: scopedClanId,
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
    if (!playerId) {
      return res.status(400).json({ message: 'playerId required' });
    }

    const scopedClanId = await resolveClanIdForUser({
      userId: req.user.sub,
      role: req.user.role,
      clanIdInput: clanId
    });

    const result = await playerService.addToBlacklist({
      requesterId: req.user.sub,
      clanId: scopedClanId,
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
    const scopedClanId = await resolveClanIdForUser({
      userId: req.user.sub,
      role: req.user.role,
      clanIdInput: req.query.clanId
    });

    const result = await playerService.blacklistList({
      requesterId: req.user.sub,
      clanId: scopedClanId,
      role: req.user.role
    });
    return res.json({ blacklist: result });
  } catch (error) {
    return next(error);
  }
}

async function unblacklist(req, res, next) {
  try {
    const entryId = Number(req.params.entryId);
    if (!entryId) {
      return res.status(400).json({ message: 'entryId param required' });
    }

    const scopedClanId = await resolveClanIdForUser({
      userId: req.user.sub,
      role: req.user.role,
      clanIdInput: req.query.clanId
    });

    const result = await playerService.removeFromBlacklist({
      requesterId: req.user.sub,
      clanId: scopedClanId,
      entryId,
      role: req.user.role
    });
    return res.json({ removed: result });
  } catch (error) {
    return next(error);
  }
}

module.exports = { addPlayer, movePlayer, history, blacklist, blacklistList, unblacklist };
