import jsonwebtoken from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const { sign } = jsonwebtoken;

// Generate JWT Token
const generateToken = (id) => {
  return sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email already registered.' });
      }
      return res.status(400).json({ error: 'Username already taken.' });
    }

    // Create user
    const user = await User.create({ username, email, password });
    const token = generateToken(user._id);

    logger.info(`New user registered: ${username}`);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        stats: user.stats,
      },
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    logger.info(`User logged in: ${user.username}`);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        stats: user.stats,
      },
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export async function logout(req, res, next) {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      isOnline: false,
      lastSeen: new Date(),
    });

    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
}