import Game from '../models/Game.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

// @desc    Get game by room code
// @route   GET /api/games/:roomCode
// @access  Private
export async function getGame(req, res, next) {
  try {
    const game = await Game.findOne({ roomCode: req.params.roomCode })
      .populate('players.user', 'username avatar')
      .populate('host', 'username avatar');

    if (!game) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    res.json({ game });
  } catch (error) {
    next(error);
  }
}

// @desc    Get active games list
// @route   GET /api/games
// @access  Private
export async function getActiveGames(req, res, next) {
  try {
    const games = await Game.find({ status: 'waiting' })
      .select('roomCode players settings status createdAt')
      .populate('host', 'username')
      .sort({ createdAt: -1 })
      .limit(20);

    const formattedGames = games.map(game => ({
      roomCode: game.roomCode,
      host: game.players[0]?.username || 'Unknown',
      playerCount: game.players.length,
      maxPlayers: game.settings.maxPlayers,
      noMercyMode: game.settings.noMercyMode,
      createdAt: game.createdAt,
    }));

    res.json({ games: formattedGames });
  } catch (error) {
    next(error);
  }
}

// @desc    Get game history for user
// @route   GET /api/games/history
// @access  Private
export async function getGameHistory(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const games = await Game.find({
      'players.user': req.user.id,
      status: 'finished',
    })
      .select('roomCode players winner winnerUsername finishedAt round')
      .sort({ finishedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Game.countDocuments({
      'players.user': req.user.id,
      status: 'finished',
    });

    res.json({
      games,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get leaderboard
// @route   GET /api/games/leaderboard
// @access  Public
export async function getLeaderboard(req, res, next) {
  try {
    const users = await User.find({ 'stats.gamesPlayed': { $gt: 0 } })
      .select('username avatar stats')
      .sort({ 'stats.gamesWon': -1 })
      .limit(50);

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      avatar: user.avatar,
      gamesPlayed: user.stats.gamesPlayed,
      gamesWon: user.stats.gamesWon,
      winRate: user.stats.gamesPlayed > 0
        ? ((user.stats.gamesWon / user.stats.gamesPlayed) * 100).toFixed(1)
        : 0,
      bestWinStreak: user.stats.bestWinStreak,
    }));

    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
}