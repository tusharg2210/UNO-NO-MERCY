import { Router } from 'express';
const router = Router();
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username avatar stats createdAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { username, avatar } = req.body;
    const updates = {};

    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: req.user.id } });
      if (existing) {
        return res.status(400).json({ error: 'Username already taken.' });
      }
      updates.username = username;
    }

    if (avatar) {
      updates.avatar = avatar;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user stats
// @route   GET /api/users/:id/stats
// @access  Private
router.get('/:id/stats', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('username stats');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      username: user.username,
      stats: user.stats,
      winRate: user.stats.gamesPlayed > 0
        ? ((user.stats.gamesWon / user.stats.gamesPlayed) * 100).toFixed(1)
        : 0,
    });
  } catch (error) {
    next(error);
  }
});

export default router;