import { CARD_TYPES, COLORS, STACKABLE_DRAW_TYPES } from '../utils/constants.js';

/**
 * Check if a card can be played on the current game state
 */
export function canPlayCard(game, card) {
  const topCard = game.discardPile[game.discardPile.length - 1];

  // If there's a draw stack, only stackable draw cards can be played
  if (game.drawStack > 0) {
    return canStackDraw(card);
  }

  // Wild cards can always be played
  if (!card.color) return true;

  // Discard All: can play if color matches current color
  if (card.type === CARD_TYPES.DISCARD_ALL) {
    return card.color === game.currentColor;
  }

  // Match by color
  if (card.color === game.currentColor) return true;

  // Match by value/type
  if (card.value === topCard.value) return true;
  if (card.type === topCard.type && card.type !== CARD_TYPES.NUMBER) return true;

  return false;
}

/**
 * Check if a card can be stacked on draw pile
 */
export function canStackDraw(card) {
  return STACKABLE_DRAW_TYPES.includes(card.type);
}

/**
 * Get draw amount for a card type
 */
export function getDrawAmount(cardType) {
  const drawAmounts = {
    [CARD_TYPES.DRAW_TWO]: 2,
    [CARD_TYPES.WILD_DRAW_FOUR]: 4,
    [CARD_TYPES.REVERSE_DRAW_FOUR]: 4,
    [CARD_TYPES.WILD_DRAW_SIX]: 6,
    [CARD_TYPES.WILD_DRAW_TEN]: 10,
  };
  return drawAmounts[cardType] || 0;
}

/**
 * Check if a card requires color selection
 */
export function requiresColorChoice(card) {
  const wildTypes = [
    CARD_TYPES.WILD,
    CARD_TYPES.WILD_DRAW_FOUR,
    CARD_TYPES.WILD_DRAW_SIX,
    CARD_TYPES.WILD_DRAW_TEN,
    CARD_TYPES.SWAP_HANDS,
  ];
  return wildTypes.includes(card.type);
}

/**
 * Validate color choice
 */
export function isValidColor(color) {
  return COLORS.includes(color);
}

/**
 * Check if game state is valid for a play action
 */
export function validatePlayAction(game, playerId, cardId) {
  // Check game is in progress
  if (game.status !== 'playing') {
    return { valid: false, error: 'Game is not in progress.' };
  }

  // Check it's the player's turn
  const currentPlayer = game.players[game.currentPlayerIndex];
  if (currentPlayer.id !== playerId) {
    return { valid: false, error: 'Not your turn.' };
  }

  // Check card exists in player's hand
  const cardIndex = currentPlayer.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) {
    return { valid: false, error: 'Card not in your hand.' };
  }

  const card = currentPlayer.hand[cardIndex];

  // Check if card can be played
  if (!canPlayCard(game, card)) {
    return { valid: false, error: 'Cannot play this card.' };
  }

  return { valid: true, card, cardIndex };
}

export default {
  canPlayCard,
  canStackDraw,
  getDrawAmount,
  requiresColorChoice,
  isValidColor,
  validatePlayAction,
};