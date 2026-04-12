// Card Colors
export const COLORS = ['red', 'blue', 'green', 'yellow'];

// Card Types
export const CARD_TYPES = {
  // Standard UNO Cards
  NUMBER: 'number',
  SKIP: 'skip',
  REVERSE: 'reverse',
  DRAW_TWO: 'draw_two',
  WILD: 'wild',
  WILD_DRAW_FOUR: 'wild_draw_four',

  // No Mercy Special Cards
  SKIP_EVERYONE: 'skip_everyone',
  WILD_DRAW_SIX: 'wild_draw_six',
  WILD_DRAW_TEN: 'wild_draw_ten',
  DISCARD_ALL: 'discard_all',
  REVERSE_DRAW_FOUR: 'reverse_draw_four',
  SWAP_HANDS: 'swap_hands',
  WILD_COLOR_ROULETTE: 'wild_color_roulette',
};

// Cards that can be stacked on draw pile
export const STACKABLE_DRAW_TYPES = [
  CARD_TYPES.DRAW_TWO,
  CARD_TYPES.WILD_DRAW_FOUR,
  CARD_TYPES.WILD_DRAW_SIX,
  CARD_TYPES.WILD_DRAW_TEN,
  CARD_TYPES.REVERSE_DRAW_FOUR,
];

// Draw amounts per card type
export const DRAW_AMOUNTS = {
  [CARD_TYPES.DRAW_TWO]: 2,
  [CARD_TYPES.WILD_DRAW_FOUR]: 4,
  [CARD_TYPES.REVERSE_DRAW_FOUR]: 4,
  [CARD_TYPES.WILD_DRAW_SIX]: 6,
  [CARD_TYPES.WILD_DRAW_TEN]: 10,
};

// Game statuses
export const GAME_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  PAUSED: 'paused',
  FINISHED: 'finished',
};

// Socket events
export const SOCKET_EVENTS = {
  // Lobby
  CREATE_ROOM: 'create-room',
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  START_GAME: 'start-game',
  ROOM_CREATED: 'room-created',
  ROOM_JOINED: 'room-joined',
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  SETTINGS_UPDATED: 'settings-updated',

  // Game
  GAME_STARTED: 'game-started',
  PLAY_CARD: 'play-card',
  CARD_PLAYED: 'card-played',
  DRAW_CARD: 'draw-card',
  CARD_DRAWN: 'card-drawn',
  SAY_UNO: 'say-uno',
  UNO_CALLED: 'uno-called',
  CATCH_UNO: 'catch-uno',
  UNO_CAUGHT: 'uno-caught',
  GAME_OVER: 'game-over',
  GAME_STATE_UPDATE: 'game-state-update',

  // Chat
  CHAT_MESSAGE: 'chat-message',
  EMOJI_REACTION: 'emoji-reaction',

  // Connection
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect-game',
  PLAYER_DISCONNECTED: 'player-disconnected',
  PLAYER_RECONNECTED: 'player-reconnected',

  // General
  ERROR: 'error',
};

// Validation limits
export const LIMITS = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 10,
  MIN_CARDS_PER_HAND: 5,
  MAX_CARDS_PER_HAND: 10,
  DEFAULT_CARDS_PER_HAND: 7,
  MIN_TURN_TIME: 10,
  MAX_TURN_TIME: 120,
  DEFAULT_TURN_TIME: 30,
  MAX_CHAT_MESSAGE_LENGTH: 200,
  ROOM_CODE_LENGTH: 6,
  UNO_PENALTY_CARDS: 4,
};

export default {
  COLORS,
  CARD_TYPES,
  STACKABLE_DRAW_TYPES,
  DRAW_AMOUNTS,
  GAME_STATUS,
  SOCKET_EVENTS,
  LIMITS,
};