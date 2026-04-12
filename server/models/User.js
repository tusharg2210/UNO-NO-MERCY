import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const { Schema, model } = mongoose;
const { genSalt, hash, compare } = bcryptjs;

const userSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  avatar: {
    type: String,
    default: 'default',
    enum: ['default', 'fire', 'ice', 'thunder', 'earth', 'shadow', 'light'],
  },
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    totalCardsPlayed: { type: Number, default: 0 },
    noMercyCardsPlayed: { type: Number, default: 0 },
    unosCalled: { type: Number, default: 0 },
    unosCaught: { type: Number, default: 0 },
    winStreak: { type: Number, default: 0 },
    bestWinStreak: { type: Number, default: 0 },
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await genSalt(12);
  this.password = await hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await compare(candidatePassword, this.password);
};

// Transform JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Virtual for win rate
userSchema.virtual('winRate').get(function () {
  if (this.stats.gamesPlayed === 0) return 0;
  return ((this.stats.gamesWon / this.stats.gamesPlayed) * 100).toFixed(1);
});

userSchema.set('toJSON', { virtuals: true });

export default model('User', userSchema);