import { createDeck, shuffleDeck, calculateHandPoints } from './card.js';
import {
    canPlayCard, canStackDraw, getDrawAmount, requiresColorChoice, isValidColor, validatePlayAction,
} from './validators.js';
import { CARD_TYPES, COLORS, LIMITS } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

class GameManager {
  constructor() {
    this.games = new Map(); // roomCode -> gameState
  }

  // ========================
  // ROOM MANAGEMENT
  // ========================

  createGame(roomCode, hostId, settings = {}) {
    const gameState = {
      roomCode,
      hostId,
      players: [],
      drawPile: [],
      discardPile: [],
      currentPlayerIndex: 0,
      direction: 1,
      currentColor: null,
      status: 'waiting',
      drawStack: 0,
      winner: null,
      winnerUsername: null,
      round: 1,
      pendingRoulette: null,
      mercyReserve: [],
      gameLog: [],
      settings: {
        maxPlayers: settings.maxPlayers || LIMITS.MAX_PLAYERS,
        cardsPerHand: settings.cardsPerHand || 7,
        drawStackEnabled: settings.drawStackEnabled !== false,
        noMercyMode: settings.noMercyMode !== false,
        timePerTurn: settings.timePerTurn || 30,
      },
      turnTimer: null,
      createdAt: new Date(),
    };

    this.games.set(roomCode, gameState);
    logger.info(`Game created: ${roomCode}`);
    return gameState;
  }

  getGame(roomCode) {
    return this.games.get(roomCode);
  }

  removeGame(roomCode) {
    const game = this.games.get(roomCode);
    if (game?.turnTimer) {
      clearTimeout(game.turnTimer);
    }
    this.games.delete(roomCode);
    logger.info(`Game removed: ${roomCode}`);
  }

  addPlayer(roomCode, player) {
    const game = this.games.get(roomCode);
    if (!game) return { success: false, error: 'Game not found.' };
    if (game.status !== 'waiting') return { success: false, error: 'Game already started.' };
    if (game.players.length >= game.settings.maxPlayers) {
      return { success: false, error: 'Room is full.' };
    }

    // Check if player already in game
    const existingPlayer = game.players.find(p => p.id === player.id);
    if (existingPlayer) {
      existingPlayer.connected = true;
      existingPlayer.socketId = player.socketId;
      return { success: true, game, reconnected: true };
    }

    game.players.push({
      id: player.id,
      socketId: player.socketId,
      username: player.username,
      userId: player.userId || null,
      hand: [],
      saidUno: false,
      connected: true,
      knockedOut: false,
      cardsPlayed: 0,
    });

    this.addLog(game, 'player_join', player.username);
    logger.info(`Player ${player.username} joined room ${roomCode}`);

    return { success: true, game };
  }

  removePlayer(roomCode, playerId) {
    const game = this.games.get(roomCode);
    if (!game) return null;

    const playerIndex = game.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return null;

    const player = game.players[playerIndex];
    player.connected = false;

    this.addLog(game, 'player_leave', player.username);

    if (game.status === 'waiting') {
      game.players.splice(playerIndex, 1);
      if (game.players.length === 0) {
        this.removeGame(roomCode);
        return { removed: true };
      }
      if (game.hostId === playerId && game.players[0]) {
        game.hostId = game.players[0].id;
      }
      return { game };
    }

    if (game.status === 'playing') {
      const handBack = [...player.hand];
      player.hand = [];
      if (handBack.length > 0) {
        game.drawPile = shuffleDeck([...game.drawPile, ...handBack]);
      }

      const wasCurrentTurn = game.currentPlayerIndex === playerIndex;
      game.players.splice(playerIndex, 1);

      if (game.players.length === 0) {
        this.removeGame(roomCode);
        return { removed: true };
      }

      if (wasCurrentTurn) {
        game.currentPlayerIndex =
          playerIndex >= game.players.length ? 0 : playerIndex;
      } else if (playerIndex < game.currentPlayerIndex) {
        game.currentPlayerIndex--;
      }

      const n = game.players.length;
      game.currentPlayerIndex = ((game.currentPlayerIndex % n) + n) % n;

      if (game.hostId === playerId && game.players[0]) {
        game.hostId = game.players[0].id;
      }

      if (n === 1) {
        return this.handleWin(game, game.players[0], {
          skipNext: true,
          type: 'disconnect',
          message: 'Opponent disconnected — you win!',
        });
      }

      this.ensureCurrentPlayerActive(game);
      return { game };
    }

    const connectedPlayers = game.players.filter(p => p.connected);
    if (connectedPlayers.length === 0) {
      this.removeGame(roomCode);
      return { removed: true };
    }

    if (game.status === 'playing' && game.currentPlayerIndex >= game.players.length) {
      game.currentPlayerIndex = 0;
    }

    return { game };
  }

  /**
   * Socket dropped (tab close, network) while a match is in progress: keep the seat and hand
   * so the same player can call reconnect-game with a new socket id.
   * Does not remove the player from the room.
   * Lobby / waiting rooms still use removePlayer() so the seat opens for others.
   */
  markPlayerDisconnected(roomCode, socketId) {
    const game = this.games.get(roomCode);
    if (!game) return null;

    const playerIndex = game.players.findIndex((p) => p.id === socketId);
    if (playerIndex === -1) return null;

    if (game.status !== 'playing') {
      return this.removePlayer(roomCode, socketId);
    }

    const player = game.players[playerIndex];
    player.connected = false;
    this.addLog(game, 'player_disconnect', player.username);

    const notKnocked = game.players.filter((p) => !p.knockedOut);
    const stillIn = notKnocked.filter((p) => p.connected);
    if (notKnocked.length === 2 && stillIn.length === 1) {
      const winner = stillIn[0];
      return this.handleWin(game, winner, {
        skipNext: true,
        type: 'disconnect',
        message: 'Opponent disconnected — you win!',
      });
    }

    this.ensureCurrentPlayerActive(game);
    return { game };
  }

  // ========================
  // GAME FLOW
  // ========================

  startGame(roomCode) {
    const game = this.games.get(roomCode);
    if (!game) return { success: false, error: 'Game not found.' };
    if (game.players.length < 2) return { success: false, error: 'Need at least 2 players.' };
    if (game.status !== 'waiting') return { success: false, error: 'Game already started.' };

    // Create and shuffle deck
    game.drawPile = shuffleDeck(createDeck());
    game.mercyReserve = [];
    game.status = 'playing';
    game.startedAt = new Date();

    // Deal cards to each player
    const cardsPerHand = game.settings.cardsPerHand;
    game.players.forEach(player => {
      player.hand = game.drawPile.splice(0, cardsPerHand);
      player.saidUno = false;
      player.knockedOut = false;
    });

    // Flip first card - ensure it's a number card
    let firstCard;
    let attempts = 0;
    do {
      firstCard = game.drawPile.shift();
      if (firstCard.type !== CARD_TYPES.NUMBER) {
        game.drawPile.push(firstCard);
        game.drawPile = shuffleDeck(game.drawPile);
      }
      attempts++;
    } while (firstCard.type !== CARD_TYPES.NUMBER && attempts < 100);

    game.discardPile.push(firstCard);
    game.currentColor = firstCard.color;
    game.currentPlayerIndex = 0;

    this.addLog(game, 'game_start', null, firstCard);

    logger.info(`Game started: ${roomCode} with ${game.players.length} players`);
    return { success: true, game };
  }

  // ========================
  // CARD PLAY
  // ========================

  playCard(roomCode, playerId, cardId, chosenColor = null, swapTargetId = null) {
    const game = this.games.get(roomCode);
    if (!game) return { success: false, error: 'Game not found.' };

    // Validate action
    const validation = validatePlayAction(game, playerId, cardId);
    if (!validation.valid) return { success: false, error: validation.error };

    const { card, cardIndex } = validation;
    const currentPlayer = game.players[game.currentPlayerIndex];

    let effectiveSwapId = swapTargetId;
    if (
      (card.type === CARD_TYPES.NUMBER && card.value === 7) ||
      card.type === CARD_TYPES.SWAP_HANDS
    ) {
      const others = game.players.filter(
        p => p.id !== currentPlayer.id && this.isPlayerActive(p)
      );
      if (others.length === 1) {
        effectiveSwapId = others[0].id;
      }
      if (!effectiveSwapId) {
        return {
          success: false,
          error:
            card.type === CARD_TYPES.SWAP_HANDS
              ? 'Choose a player to swap hands with.'
              : 'You must choose a player to swap hands with on 7.',
        };
      }
      const swapTarget = game.players.find(
        p =>
          p.id === effectiveSwapId &&
          p.id !== currentPlayer.id &&
          this.isPlayerActive(p)
      );
      if (!swapTarget) {
        return { success: false, error: 'Invalid swap target.' };
      }
    }

    // Validate color choice for wild cards only.
    if (requiresColorChoice(card)) {
      if (!chosenColor || !isValidColor(chosenColor)) {
        return { success: false, error: 'Must choose a valid color.' };
      }
    }

    // Remove card from hand
    currentPlayer.hand.splice(cardIndex, 1);
    game.discardPile.push(card);
    currentPlayer.cardsPlayed++;

    // Process card effects
    const effects = this.processCardEffect(game, card, chosenColor, effectiveSwapId);
    const mercyState = this.applyMercyRule(game);
    if (mercyState.knockedOutPlayers.length > 0) {
      effects.knockedOutPlayers = mercyState.knockedOutPlayers;
    }

    // Add to game log
    this.addLog(game, 'play_card', currentPlayer.username, card, {
      chosenColor,
      swapTargetId: effectiveSwapId,
      effects: effects.message,
    });

    // Reset UNO state
    if (currentPlayer.hand.length === 1) {
      currentPlayer.saidUno = false;
    }

    const mercyWin = this.resolveMercyWin(game, effects);
    if (mercyWin) return mercyWin;

    // Check win condition (mercy knockout clears the hand — that is not a win)
    if (!currentPlayer.knockedOut && currentPlayer.hand.length === 0) {
      return this.handleWin(game, currentPlayer, effects);
    }

    // Move to next player (unless skip effects handled it)
    if (!effects.skipNext) {
      this.nextTurn(game);
    }

    return { success: true, game, effects };
  }

  processCardEffect(game, card, chosenColor, swapTargetId) {
    const effects = { skipNext: false, message: '', type: 'normal' };

    switch (card.type) {
      case CARD_TYPES.NUMBER:
        game.currentColor = card.color;
        if (card.value === 7) {
          const currentP = game.players[game.currentPlayerIndex];
          const targetP = game.players.find(
            p => p.id === swapTargetId && p.id !== currentP.id && p.connected && !p.knockedOut
          );
          if (targetP) {
            const tempHand = [...currentP.hand];
            currentP.hand = [...targetP.hand];
            targetP.hand = tempHand;
            effects.message = `🔀 7-rule: swapped hands with ${targetP.username}!`;
            effects.type = 'swap';
            effects.swappedWith = targetP.id;
          }
        } else if (card.value === 0) {
          this.passHandsByDirection(game);
          effects.message = '↪️ 0-rule: all players passed hands!';
          effects.type = 'pass_hands';
        }
        break;

      case CARD_TYPES.SKIP: {
        game.currentColor = card.color;
        const skippedIdx = this.getNextPlayerIndex(game);
        const skippedName = game.players[skippedIdx].username;
        this.nextTurn(game);
        if (this.getActivePlayers(game).length === 2) {
          this.nextTurn(game);
        }
        effects.skipNext = true;
        effects.message = `Skip: ${skippedName} loses this turn`;
        effects.type = 'skip';
        break;
      }

      case CARD_TYPES.REVERSE:
        game.direction *= -1;
        game.currentColor = card.color;
        effects.message = `🔄 Direction reversed!`;
        effects.type = 'reverse';
        if (this.getActivePlayers(game).length === 2) {
          this.nextTurn(game);
          effects.skipNext = true;
        }
        break;

      case CARD_TYPES.DRAW_TWO:
        game.drawStack += 2;
        game.currentColor = card.color;
        this.resolveDrawStack(game);
        effects.skipNext = true;
        effects.message = `+2! Draw stack: ${game.drawStack}`;
        effects.type = 'draw';
        break;

      case CARD_TYPES.DRAW_FOUR:
        game.drawStack += 4;
        game.currentColor = card.color;
        this.resolveDrawStack(game);
        effects.skipNext = true;
        effects.message = `+4! Draw stack: ${game.drawStack}`;
        effects.type = 'draw';
        break;

      case CARD_TYPES.WILD:
        game.currentColor = chosenColor;
        effects.message = `🌈 Color changed to ${chosenColor}`;
        effects.type = 'wild';
        break;

      case CARD_TYPES.WILD_DRAW_FOUR:
        game.drawStack += 4;
        game.currentColor = chosenColor;
        this.resolveDrawStack(game);
        effects.skipNext = true;
        effects.message = `+4! Color: ${chosenColor}`;
        effects.type = 'draw';
        break;

      // === NO MERCY CARDS ===

      case CARD_TYPES.SKIP_EVERYONE:
        game.currentColor = card.color;
        effects.skipNext = true;
        effects.message = `🔥 SKIP EVERYONE! Play again!`;
        effects.type = 'no_mercy';
        break;

      case CARD_TYPES.WILD_DRAW_SIX:
        game.drawStack += 6;
        game.currentColor = chosenColor;
        this.resolveDrawStack(game);
        effects.skipNext = true;
        effects.message = `🔥 +6 NO MERCY! Color: ${chosenColor}`;
        effects.type = 'no_mercy';
        break;

      case CARD_TYPES.WILD_DRAW_TEN:
        game.drawStack += 10;
        game.currentColor = chosenColor;
        this.resolveDrawStack(game);
        effects.skipNext = true;
        effects.message = `💀 +10 ABSOLUTELY NO MERCY!`;
        effects.type = 'no_mercy';
        break;

      case CARD_TYPES.DISCARD_ALL: {
        const currentPlayer = game.players[game.currentPlayerIndex];
        const matchingCards = currentPlayer.hand.filter(c => c.color === card.color);
        currentPlayer.hand = currentPlayer.hand.filter(c => c.color !== card.color);
        game.discardPile.push(...matchingCards);
        game.currentColor = card.color;
        effects.message = `💣 Discarded ${matchingCards.length + 1} ${card.color} cards!`;
        effects.type = 'no_mercy';
        break;
      }

      case CARD_TYPES.REVERSE_DRAW_FOUR:
        game.direction *= -1;
        game.currentColor = chosenColor;
        game.drawStack += 4;
        this.resolveDrawStack(game);
        effects.skipNext = true;
        effects.message = `Reverse + Draw 4! Color: ${chosenColor}`;
        effects.type = 'no_mercy';
        break;

      case CARD_TYPES.SWAP_HANDS: {
        if (swapTargetId) {
          const currentP = game.players[game.currentPlayerIndex];
          const targetP = game.players.find(p => p.id === swapTargetId);
          if (targetP) {
            const tempHand = [...currentP.hand];
            currentP.hand = [...targetP.hand];
            targetP.hand = tempHand;
            effects.message = `🔀 Swapped hands with ${targetP.username}!`;
            effects.swappedWith = targetP.id;
          }
        }
        game.currentColor = chosenColor;
        effects.type = 'no_mercy';
        break;
      }

      case CARD_TYPES.WILD_COLOR_ROULETTE: {
        const nextIndex = this.getNextPlayerIndex(game);
        const rouletteResult = this.resolveColorRouletteForPlayer(game, nextIndex, chosenColor);
        game.currentColor = chosenColor;
        game.currentPlayerIndex = nextIndex;
        this.nextTurn(game);
        effects.message = `Roulette (${String(chosenColor).toUpperCase()}): ${rouletteResult.targetUsername} drew ${rouletteResult.drawnCount} cards`;
        effects.type = 'no_mercy';
        effects.rouletteColor = chosenColor;
        effects.rouletteTarget = rouletteResult.targetId;
        effects.rouletteDrawnCount = rouletteResult.drawnCount;
        effects.skipNext = true;
        break;
      }

      default:
        game.currentColor = card.color || game.currentColor;
        break;
    }

    return effects;
  }

  // ========================
  // DRAW LOGIC
  // ========================

  resolveDrawStack(game) {
    const nextIndex = this.getNextPlayerIndex(game);
    const nextPlayer = game.players[nextIndex];

    // Check if next player can stack (if draw stacking is enabled)
    if (game.settings.drawStackEnabled) {
      const canStack = nextPlayer.hand.some(card => canStackDraw(card));
      if (canStack) {
        // Move to next player - they decide to stack or draw
        game.currentPlayerIndex = nextIndex;
        return;
      }
    }

    // Next player must draw all stacked cards
    this.drawCards(game, nextIndex, game.drawStack);
    game.drawStack = 0;
    this.applyMercyRule(game);
    const stillIn = this.getActivePlayers(game);
    if (stillIn.length <= 1) {
      return;
    }
    game.currentPlayerIndex = nextIndex;
    this.nextTurn(game);
  }

  drawCards(game, playerIndex, count) {
    const player = game.players[playerIndex];
    const drawnCards = [];

    for (let i = 0; i < count; i++) {
      if (game.drawPile.length === 0) {
        this.reshuffleDiscardPile(game);
      }
      if (game.drawPile.length > 0) {
        const card = game.drawPile.shift();
        player.hand.push(card);
        drawnCards.push(card);
      }
    }

    return drawnCards;
  }

  drawCard(roomCode, playerId) {
    const game = this.games.get(roomCode);
    if (!game) return { success: false, error: 'Game not found.' };
    if (game.status !== 'playing') {
      return { success: false, error: 'Game is not in progress.' };
    }

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer.knockedOut) {
      return { success: false, error: 'You are out of the game (Mercy rule).' };
    }
    if (currentPlayer.id !== playerId) {
      return { success: false, error: 'Not your turn.' };
    }

    // Draw stack penalty or single draw
    const drawCount = game.drawStack > 0 ? game.drawStack : 1;
    const drawnCards = this.drawCards(game, game.currentPlayerIndex, drawCount);

    this.addLog(game, 'draw_card', currentPlayer.username, null, {
      count: drawCount,
    });

    game.drawStack = 0;
    const mercyState = this.applyMercyRule(game);
    const mercyWin = this.resolveMercyWin(game, {
      skipNext: false,
      type: 'draw',
      message: '',
      knockedOutPlayers: mercyState.knockedOutPlayers,
    });
    if (mercyWin) {
      return {
        ...mercyWin,
        drawnCards,
        drawCount,
      };
    }
    const drawerKnockedOut = mercyState.knockedOutPlayers.some(k => k.id === playerId);
    if (!drawerKnockedOut) {
      this.nextTurn(game);
    }

    return {
      success: true,
      game,
      drawnCards,
      drawCount,
      knockedOutPlayers: mercyState.knockedOutPlayers,
    };
  }

  reshuffleDiscardPile(game) {
    if (game.discardPile.length <= 1) return;

    const topCard = game.discardPile.pop();
    game.drawPile = shuffleDeck([...game.drawPile, ...game.discardPile]);
    game.discardPile = [topCard];

    logger.info(`Reshuffled discard pile in room ${game.roomCode}`);
  }

  // ========================
  // UNO MECHANICS
  // ========================

  sayUno(roomCode, playerId) {
    const game = this.games.get(roomCode);
    if (!game) return { success: false, error: 'Game not found.' };

    const player = game.players.find(p => p.id === playerId);
    if (!player) return { success: false, error: 'Player not found.' };

    if (player.hand.length <= 2) {
      player.saidUno = true;
      this.addLog(game, 'say_uno', player.username);
      return { success: true, username: player.username };
    }

    return { success: false, error: 'Cannot say UNO with more than 2 cards.' };
  }

  catchUno(roomCode, catcherId, targetPlayerId) {
    const game = this.games.get(roomCode);
    if (!game) return { success: false, error: 'Game not found.' };

    const target = game.players.find(p => p.id === targetPlayerId);
    const catcher = game.players.find(p => p.id === catcherId);

    if (!target || !catcher) return { success: false, error: 'Player not found.' };

    if (target.hand.length === 1 && !target.saidUno) {
      const targetIndex = game.players.findIndex(p => p.id === targetPlayerId);
      const drawnCards = this.drawCards(game, targetIndex, LIMITS.UNO_PENALTY_CARDS);
      const mercyState = this.applyMercyRule(game);
      const mercyWin = this.resolveMercyWin(game, {
        skipNext: false,
        type: 'uno_penalty',
        message: '',
        knockedOutPlayers: mercyState.knockedOutPlayers,
      });
      if (mercyWin) {
        return {
          ...mercyWin,
          catcher: catcher.username,
          caught: target.username,
          drawnCards,
        };
      }

      this.addLog(game, 'catch_uno', catcher.username, null, {
        caught: target.username,
        penalty: LIMITS.UNO_PENALTY_CARDS,
      });

      return {
        success: true,
        game,
        catcher: catcher.username,
        caught: target.username,
        drawnCards,
        knockedOutPlayers: mercyState.knockedOutPlayers,
      };
    }

    return { success: false, error: 'Cannot catch this player.' };
  }

  // ========================
  // TURN MANAGEMENT
  // ========================

  getNextPlayerIndex(game) {
    return this.getNextPlayablePlayerIndex(game, game.currentPlayerIndex);
  }

  nextTurn(game) {
    game.currentPlayerIndex = this.getNextPlayerIndex(game);

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (!currentPlayer) return;
    if (currentPlayer.hand.length !== 1) {
      currentPlayer.saidUno = false;
    }
  }

  // ========================
  // WIN HANDLING
  // ========================

  handleWin(game, winner, effects) {
    game.status = 'finished';
    game.winner = winner.userId || winner.id;
    game.winnerUsername = winner.username;
    game.finishedAt = new Date();

    // Calculate scores
    const scores = {};
    game.players.forEach(player => {
      scores[player.id] = {
        username: player.username,
        cardsLeft: player.hand.length,
        points: calculateHandPoints(player.hand),
        cardsPlayed: player.cardsPlayed,
      };
    });

    this.addLog(game, 'game_end', winner.username, null, { scores });

    logger.info(`Game ${game.roomCode} won by ${winner.username}`);

    return {
      success: true,
      game,
      effects,
      gameOver: true,
      winner: winner.id,
      winnerUsername: winner.username,
      scores,
    };
  }

  // ========================
  // UTILITY
  // ========================

  addLog(game, action, player, card = null, details = null) {
    game.gameLog.push({
      action,
      player,
      card,
      details,
      timestamp: new Date(),
    });

    // Keep last 100 log entries
    if (game.gameLog.length > 100) {
      game.gameLog = game.gameLog.slice(-100);
    }
  }

  /**
   * Sanitize game state - hide other players' cards
   */
  sanitizeForPlayer(game, playerId) {
    return {
      roomCode: game.roomCode,
      players: game.players.map(p => ({
        id: p.id,
        username: p.username,
        cardCount: p.hand.length,
        hand: p.id === playerId ? p.hand : [],
        saidUno: p.saidUno,
        connected: p.connected,
        knockedOut: !!p.knockedOut,
        cardsPlayed: p.cardsPlayed,
      })),
      topCard: game.discardPile[game.discardPile.length - 1],
      discardPileCount: game.discardPile.length,
      drawPile: game.drawPile.length,
      mercyReserveCount: game.mercyReserve?.length ?? 0,
      currentPlayerIndex: game.currentPlayerIndex,
      direction: game.direction,
      currentColor: game.currentColor,
      drawStack: game.drawStack,
      pendingRoulette: null,
      status: game.status,
      settings: game.settings,
      round: game.round,
    };
  }

  /**
   * Get all active room codes
   */
  getActiveRooms() {
    const rooms = [];
    this.games.forEach((game, roomCode) => {
      rooms.push({
        roomCode,
        playerCount: game.players.length,
        maxPlayers: game.settings.maxPlayers,
        status: game.status,
        host: game.players[0]?.username || 'Unknown',
      });
    });
    return rooms;
  }

  /**
   * Get total active games count
   */
  getStats() {
    let waiting = 0;
    let playing = 0;
    let totalPlayers = 0;

    this.games.forEach(game => {
      if (game.status === 'waiting') waiting++;
      if (game.status === 'playing') playing++;
      totalPlayers += game.players.filter(p => p.connected).length;
    });

    return { waiting, playing, totalPlayers, totalRooms: this.games.size };
  }

  getNextPlayablePlayerIndex(game, fromIndex) {
    const totalPlayers = game.players.length;
    let nextIndex = fromIndex;

    let attempts = 0;
    do {
      nextIndex = ((nextIndex + game.direction) % totalPlayers + totalPlayers) % totalPlayers;
      attempts++;
    } while (
      !this.isPlayerActive(game.players[nextIndex]) &&
      attempts < totalPlayers
    );

    return nextIndex;
  }

  isPlayerActive(player) {
    return player.connected && !player.knockedOut;
  }

  getActivePlayers(game) {
    return game.players.filter(player => this.isPlayerActive(player));
  }

  passHandsByDirection(game) {
    const activeIndices = [];
    let idx = game.currentPlayerIndex;
    const visited = new Set();

    while (!visited.has(idx)) {
      visited.add(idx);
      if (this.isPlayerActive(game.players[idx])) {
        activeIndices.push(idx);
      }
      idx = ((idx + game.direction) % game.players.length + game.players.length) % game.players.length;
    }

    if (activeIndices.length <= 1) return;

    const oldHands = new Map(activeIndices.map(i => [i, [...game.players[i].hand]]));
    for (let i = 0; i < activeIndices.length; i++) {
      const giver = activeIndices[i];
      const receiver = activeIndices[(i + 1) % activeIndices.length];
      game.players[receiver].hand = oldHands.get(giver);
    }
  }

  resolveColorRouletteForPlayer(game, targetIndex, rouletteColor) {
    const targetPlayer = game.players[targetIndex];
    const revealed = [];

    while (true) {
      if (game.drawPile.length === 0) {
        this.reshuffleDiscardPile(game);
      }
      if (game.drawPile.length === 0) break;

      const nextCard = game.drawPile.shift();
      revealed.push(nextCard);

      const matchesColor =
        nextCard.type !== CARD_TYPES.WILD &&
        nextCard.color === rouletteColor;
      if (matchesColor) break;
    }

    targetPlayer.hand.push(...revealed);

    return {
      targetId: targetPlayer.id,
      targetUsername: targetPlayer.username,
      drawnCount: revealed.length,
    };
  }

  /**
   * Mercy: at 25+ cards, player is out; their hand is shuffled back into the draw pile now.
   * If only one active player remains (e.g. 2-player game), resolveMercyWin ends the game.
   */
  applyMercyRule(game) {
    const knockedOutPlayers = [];
    for (const player of game.players) {
      if (!player.knockedOut && player.hand.length >= 25) {
        const count = player.hand.length;
        const returned = [...player.hand];
        player.hand = [];
        player.knockedOut = true;
        if (returned.length > 0) {
          game.drawPile = shuffleDeck([...game.drawPile, ...returned]);
        }
        knockedOutPlayers.push({
          id: player.id,
          username: player.username,
          cards: count,
        });
      }
    }
    if (knockedOutPlayers.length > 0) {
      if (game.mercyReserve?.length) {
        game.drawPile = shuffleDeck([...game.drawPile, ...game.mercyReserve]);
        game.mercyReserve = [];
      }
      this.ensureCurrentPlayerActive(game);
    }
    return { knockedOutPlayers };
  }

  /** If the current player is knocked out, advance to the next active player. */
  ensureCurrentPlayerActive(game) {
    if (game.status !== 'playing') return;
    let guard = 0;
    while (
      guard++ < game.players.length &&
      !this.isPlayerActive(game.players[game.currentPlayerIndex])
    ) {
      game.currentPlayerIndex = this.getNextPlayablePlayerIndex(game, game.currentPlayerIndex);
    }
  }

  resolveMercyWin(game, effects) {
    if (game.status !== 'playing') return null;
    const survivors = game.players.filter(p => !p.knockedOut);
    if (survivors.length === 1) {
      return this.handleWin(game, survivors[0], effects);
    }
    return null;
  }
}

// Singleton instance
export default new GameManager();
