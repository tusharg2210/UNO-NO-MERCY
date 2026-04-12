import { COLORS, CARD_TYPES } from '../utils/constants.js';

/**
 * Creates a full UNO No Mercy deck
 * @returns {Array} Array of card objects
 */
export function createDeck() {
  const deck = [];
  let id = 0;

  COLORS.forEach(color => {
    // === STANDARD CARDS ===

    // One 0 per color
    deck.push({
      id: id++,
      type: CARD_TYPES.NUMBER,
      color,
      value: 0,
    });

    // Two of each 1-9 per color
    for (let num = 1; num <= 9; num++) {
      deck.push({ id: id++, type: CARD_TYPES.NUMBER, color, value: num });
      deck.push({ id: id++, type: CARD_TYPES.NUMBER, color, value: num });
    }

    // Two Skip per color
    for (let i = 0; i < 2; i++) {
      deck.push({ id: id++, type: CARD_TYPES.SKIP, color, value: 'skip' });
    }

    // Two Reverse per color
    for (let i = 0; i < 2; i++) {
      deck.push({ id: id++, type: CARD_TYPES.REVERSE, color, value: 'reverse' });
    }

    // Two Draw Two per color
    for (let i = 0; i < 2; i++) {
      deck.push({ id: id++, type: CARD_TYPES.DRAW_TWO, color, value: 'draw_two' });
    }

    // === NO MERCY COLORED CARDS ===

    // Skip Everyone (1 per color)
    deck.push({
      id: id++,
      type: CARD_TYPES.SKIP_EVERYONE,
      color,
      value: 'skip_everyone',
    });

    // Discard All (1 per color)
    deck.push({
      id: id++,
      type: CARD_TYPES.DISCARD_ALL,
      color,
      value: 'discard_all',
    });

    // Reverse Draw Four (1 per color)
    deck.push({
      id: id++,
      type: CARD_TYPES.REVERSE_DRAW_FOUR,
      color,
      value: 'reverse_draw_four',
    });
  });

  // === WILD CARDS (No color) ===

  // Standard Wild (4)
  for (let i = 0; i < 4; i++) {
    deck.push({ id: id++, type: CARD_TYPES.WILD, color: null, value: 'wild' });
  }

  // Wild Draw Four (4)
  for (let i = 0; i < 4; i++) {
    deck.push({ id: id++, type: CARD_TYPES.WILD_DRAW_FOUR, color: null, value: 'wild_draw_four' });
  }

  // === NO MERCY WILD CARDS ===

  // Wild Draw Six (2)
  for (let i = 0; i < 2; i++) {
    deck.push({ id: id++, type: CARD_TYPES.WILD_DRAW_SIX, color: null, value: 'wild_draw_six' });
  }

  // Wild Draw Ten (2)
  for (let i = 0; i < 2; i++) {
    deck.push({ id: id++, type: CARD_TYPES.WILD_DRAW_TEN, color: null, value: 'wild_draw_ten' });
  }

  // Swap Hands (2)
  for (let i = 0; i < 2; i++) {
    deck.push({ id: id++, type: CARD_TYPES.SWAP_HANDS, color: null, value: 'swap_hands' });
  }

  // Wild Color Roulette (2)
  for (let i = 0; i < 2; i++) {
    deck.push({ id: id++, type: CARD_TYPES.WILD_COLOR_ROULETTE, color: null, value: 'wild_color_roulette' });
  }

  return deck;
}

/**
 * Fisher-Yates shuffle algorithm
 * @param {Array} deck - Array of cards to shuffle
 * @returns {Array} Shuffled deck
 */
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Calculate point value of a card
 * @param {Object} card - Card object
 * @returns {Number} Point value
 */
function getCardPoints(card) {
  switch (card.type) {
    case CARD_TYPES.NUMBER:
      return card.value;
    case CARD_TYPES.SKIP:
    case CARD_TYPES.REVERSE:
    case CARD_TYPES.DRAW_TWO:
      return 20;
    case CARD_TYPES.WILD:
    case CARD_TYPES.WILD_DRAW_FOUR:
      return 50;
    case CARD_TYPES.SKIP_EVERYONE:
    case CARD_TYPES.DISCARD_ALL:
    case CARD_TYPES.REVERSE_DRAW_FOUR:
      return 40;
    case CARD_TYPES.WILD_DRAW_SIX:
    case CARD_TYPES.WILD_DRAW_TEN:
      return 60;
    case CARD_TYPES.SWAP_HANDS:
    case CARD_TYPES.WILD_COLOR_ROULETTE:
      return 50;
    default:
      return 0;
  }
}

/**
 * Calculate total points in a hand
 * @param {Array} hand - Array of card objects
 * @returns {Number} Total points
 */
export function calculateHandPoints(hand) {
  return hand.reduce((total, card) => total + getCardPoints(card), 0);
}

export default {
  createDeck,
  shuffleDeck,
  getCardPoints,
  calculateHandPoints,
};