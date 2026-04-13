import { logger } from '../utils/logger.js';
import User from '../models/User.js';
import Game from '../models/Game.js';

export function setupGameSocket(io, socket, connectedUsers, gameManager) {

  // ========================
  // PLAY CARD
  // ========================
  socket.on('play-card', ({ roomCode, cardId, chosenColor, swapTargetId }) => {
    try {
      const result = gameManager.playCard(
        roomCode,
        socket.id,
        cardId,
        chosenColor,
        swapTargetId
      );

      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      const game = result.game;

      // Notify all players
      game.players.forEach(player => {
        if (player.connected) {
          io.to(player.id).emit('card-played', {
            hand: player.hand,
            gameState: gameManager.sanitizeForPlayer(game, player.id),
            effects: result.effects,
            gameOver: result.gameOver || false,
            winner: result.winner || null,
            winnerUsername: result.winnerUsername || null,
            scores: result.scores || null,
          });
        }
      });

      // If game over, save to database
      if (result.gameOver) {
        saveGameToDatabase(game, result.scores);
        updatePlayerStats(game, result.winner);
      }
    } catch (error) {
      logger.error(`Play card error: ${error.message}`);
      socket.emit('error', { message: 'Failed to play card.' });
    }
  });

  // ========================
  // DRAW CARD
  // ========================
  socket.on('draw-card', ({ roomCode }) => {
    try {
      const result = gameManager.drawCard(roomCode, socket.id);

      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      const game = result.game;

      // Notify all players
      game.players.forEach(player => {
        if (player.connected) {
          io.to(player.id).emit('card-drawn', {
            hand: player.hand,
            gameState: gameManager.sanitizeForPlayer(game, player.id),
            drewCards: player.id === socket.id ? result.drawCount : 0,
            knockedOutPlayers: result.knockedOutPlayers || [],
            gameOver: result.gameOver || false,
            winner: result.winner || null,
            winnerUsername: result.winnerUsername || null,
            scores: result.scores || null,
          });
        }
      });

      if (result.gameOver) {
        saveGameToDatabase(game, result.scores);
        updatePlayerStats(game, result.winner);
      }
    } catch (error) {
      logger.error(`Draw card error: ${error.message}`);
      socket.emit('error', { message: 'Failed to draw card.' });
    }
  });

  // ========================
  // SAY UNO
  // ========================
  socket.on('say-uno', ({ roomCode }) => {
    try {
      const result = gameManager.sayUno(roomCode, socket.id);

      if (result.success) {
        io.to(roomCode).emit('uno-called', {
          username: result.username,
          playerId: socket.id,
        });
      } else {
        socket.emit('error', { message: result.error || 'Cannot say UNO.' });
      }
    } catch (error) {
      logger.error(`Say UNO error: ${error.message}`);
    }
  });

  // ========================
  // CATCH UNO
  // ========================
  socket.on('catch-uno', ({ roomCode, targetPlayerId }) => {
    try {
      const result = gameManager.catchUno(roomCode, socket.id, targetPlayerId);

      if (result.success) {
        const game = result.game;

        // Notify all players
        game.players.forEach(player => {
          if (player.connected) {
            io.to(player.id).emit('uno-caught', {
              hand: player.hand,
              gameState: gameManager.sanitizeForPlayer(game, player.id),
              catcher: result.catcher,
              caught: result.caught,
              knockedOutPlayers: result.knockedOutPlayers || [],
              gameOver: result.gameOver || false,
              winner: result.winner || null,
              winnerUsername: result.winnerUsername || null,
              scores: result.scores || null,
            });
          }
        });

        if (result.gameOver) {
          saveGameToDatabase(game, result.scores);
          updatePlayerStats(game, result.winner);
        }
      } else {
        socket.emit('error', { message: result.error || 'Cannot catch UNO.' });
      }
    } catch (error) {
      logger.error(`Catch UNO error: ${error.message}`);
    }
  });

  // ========================
  // GET GAME STATE (refresh)
  // ========================
  socket.on('get-game-state', ({ roomCode }) => {
    try {
      const game = gameManager.getGame(roomCode);
      if (!game) {
        socket.emit('error', { message: 'Game not found.' });
        return;
      }

      const player = game.players.find(p => p.id === socket.id);
      if (!player) {
        socket.emit('error', { message: 'You are not in this game.' });
        return;
      }

      socket.emit('game-state-update', {
        hand: player.hand,
        gameState: gameManager.sanitizeForPlayer(game, socket.id),
      });
    } catch (error) {
      logger.error(`Get game state error: ${error.message}`);
    }
  });

  // ========================
  // GET GAME LOG
  // ========================
  socket.on('get-game-log', ({ roomCode }) => {
    try {
      const game = gameManager.getGame(roomCode);
      if (!game) return;

      socket.emit('game-log', {
        log: game.gameLog.slice(-50), // Last 50 entries
      });
    } catch (error) {
      logger.error(`Get game log error: ${error.message}`);
    }
  });

  // ========================
  // REMATCH
  // ========================
  socket.on('request-rematch', ({ roomCode }) => {
    try {
      const game = gameManager.getGame(roomCode);
      if (!game || game.status !== 'finished') return;

      const userData = connectedUsers.get(socket.id);
      if (!userData) return;

      // Notify all players about rematch request
      socket.to(roomCode).emit('rematch-requested', {
        username: userData.username,
      });
    } catch (error) {
      logger.error(`Rematch request error: ${error.message}`);
    }
  });

  socket.on('accept-rematch', ({ roomCode }) => {
    try {
      const oldGame = gameManager.getGame(roomCode);
      if (!oldGame) return;

      // Create new game with same players
      const newRoomCode = roomCode; // Reuse room code
      
      // Reset game state
      oldGame.status = 'waiting';
      oldGame.drawPile = [];
      oldGame.discardPile = [];
      oldGame.currentPlayerIndex = 0;
      oldGame.direction = 1;
      oldGame.currentColor = null;
      oldGame.drawStack = 0;
      oldGame.pendingRoulette = null;
      oldGame.mercyReserve = [];
      oldGame.winner = null;
      oldGame.winnerUsername = null;
      oldGame.round += 1;
      oldGame.gameLog = [];

      oldGame.players.forEach(player => {
        player.hand = [];
        player.saidUno = false;
        player.knockedOut = false;
        player.cardsPlayed = 0;
      });

      // Notify all players
      io.to(roomCode).emit('rematch-accepted', {
        game: gameManager.sanitizeForPlayer(oldGame, null),
      });
    } catch (error) {
      logger.error(`Accept rematch error: ${error.message}`);
    }
  });
}

// ========================
// DATABASE HELPERS
// ========================

export async function saveGameToDatabase(gameState, scores) {
  try {
    const gameData = {
      roomCode: gameState.roomCode,
      host: gameState.hostId,
      players: gameState.players.map(p => ({
        user: p.userId,
        socketId: p.id,
        username: p.username,
        hand: p.hand,
        score: scores?.[p.id]?.points || 0,
        saidUno: p.saidUno,
        isConnected: p.connected,
      })),
      currentPlayerIndex: gameState.currentPlayerIndex,
      direction: gameState.direction,
      currentColor: gameState.currentColor,
      status: 'finished',
      winner: gameState.winner,
      winnerUsername: gameState.winnerUsername,
      settings: gameState.settings,
      gameLog: gameState.gameLog.slice(-50),
      round: gameState.round,
      startedAt: gameState.startedAt,
      finishedAt: gameState.finishedAt,
    };

    await Game.create(gameData);
    logger.info(`Game saved to database: ${gameState.roomCode}`);
  } catch (error) {
    logger.error(`Failed to save game: ${error.message}`);
  }
}

export async function updatePlayerStats(gameState, winnerId) {
  try {
    for (const player of gameState.players) {
      if (!player.userId) continue; // Skip guest players

      const isWinner = player.id === winnerId || player.userId === winnerId;

      const updateData = {
        $inc: {
          'stats.gamesPlayed': 1,
          'stats.totalCardsPlayed': player.cardsPlayed,
        },
      };

      if (isWinner) {
        updateData.$inc['stats.gamesWon'] = 1;
        updateData.$inc['stats.winStreak'] = 1;
      } else {
        updateData['stats.winStreak'] = 0;
      }

      const user = await User.findByIdAndUpdate(player.userId, updateData, { new: true });

      // Update best win streak
      if (user && user.stats.winStreak > user.stats.bestWinStreak) {
        await User.findByIdAndUpdate(player.userId, {
          'stats.bestWinStreak': user.stats.winStreak,
        });
      }
    }

    logger.info(`Player stats updated for game: ${gameState.roomCode}`);
  } catch (error) {
    logger.error(`Failed to update player stats: ${error.message}`);
  }
}

export default setupGameSocket;