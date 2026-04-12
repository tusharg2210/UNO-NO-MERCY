import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const cardSchema = new Schema({
id: Number,
type: {
type: String,
enum: [
'number', 'skip', 'reverse', 'draw_two',
'wild', 'wild_draw_four',
'skip_everyone', 'wild_draw_six', 'wild_draw_ten',
'discard_all', 'reverse_draw_four', 'swap_hands',
'wild_color_roulette',
],
},
color: {
type: String,
enum: ['red', 'blue', 'green', 'yellow', null],
default: null,
},
value: Schema.Types.Mixed,
}, { _id: false });

const playerSchema = new Schema({
user: {
type: Schema.Types.ObjectId,
ref: 'User',
},
socketId: String,
username: String,
hand: [cardSchema],
score: { type: Number, default: 0 },
saidUno: { type: Boolean, default: false },
isConnected: { type: Boolean, default: true },
cardsPlayed: { type: Number, default: 0 },
}, { _id: false });

const gameLogSchema = new Schema({
action: {
type: String,
enum: [
'play_card', 'draw_card', 'say_uno', 'catch_uno',
'swap_hands', 'skip', 'reverse', 'color_change',
'draw_stack', 'game_start', 'game_end', 'player_join',
'player_leave',
],
},
player: String,
card: cardSchema,
details: Schema.Types.Mixed,
timestamp: { type: Date, default: Date.now },
}, { _id: false });

const gameSchema = new Schema({
roomCode: {
type: String,
required: true,
unique: true, // ✅ already creates index
uppercase: true,
},
host: {
type: Schema.Types.ObjectId,
ref: 'User',
},
players: [playerSchema],
drawPile: [cardSchema],
discardPile: [cardSchema],
currentPlayerIndex: {
type: Number,
default: 0,
},
direction: {
type: Number,
default: 1,
enum: [1, -1],
},
currentColor: {
type: String,
enum: ['red', 'blue', 'green', 'yellow', null],
default: null,
},
drawStack: {
type: Number,
default: 0,
},
status: {
type: String,
enum: ['waiting', 'playing', 'paused', 'finished'],
default: 'waiting',
},
winner: {
type: Schema.Types.ObjectId,
ref: 'User',
},
winnerUsername: String,
settings: {
maxPlayers: { type: Number, default: 6, min: 2, max: 10 },
cardsPerHand: { type: Number, default: 7 },
drawStackEnabled: { type: Boolean, default: true },
noMercyMode: { type: Boolean, default: true },
timePerTurn: { type: Number, default: 30 },
},
gameLog: [gameLogSchema],
round: { type: Number, default: 1 },
startedAt: Date,
finishedAt: Date,
}, {
timestamps: true,
});

// Indexes
gameSchema.index({ status: 1 });
gameSchema.index({ createdAt: -1 });

// Auto-expire waiting games after 1 hour
gameSchema.index({ createdAt: 1 }, {
expireAfterSeconds: 3600,
partialFilterExpression: { status: 'waiting' },
});

export default model('Game', gameSchema);
