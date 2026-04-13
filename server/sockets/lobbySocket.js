import { generateRoomCode } from '../utils/generateRoomCode.js';
import { logger } from '../utils/logger.js';
import { LIMITS } from '../utils/constants.js';
import { saveGameToDatabase, updatePlayerStats } from './gameSocket.js';

function lobbyMaxPlayers(game) {
  const n = game?.settings?.maxPlayers;
  if (typeof n === 'number' && n >= LIMITS.MIN_PLAYERS && n <= LIMITS.MAX_PLAYERS) return n;
  return LIMITS.MAX_PLAYERS;
}

export function setupLobbySocket(io, socket, connectedUsers, gameManager) {

  // ========================
  // CREATE ROOM
  // ========================
  socket.on('create-room', ({ username, userId, settings }) => {
    try {
      // Generate unique room code
      let roomCode;
      let attempts = 0;
      do {
        roomCode = generateRoomCode();
        attempts++;
      } while (gameManager.getGame(roomCode) && attempts < 100);

      if (attempts >= 100) {
        socket.emit('error', { message: 'Failed to create room. Try again.' });
        return;
      }

      // Create game
      const game = gameManager.createGame(roomCode, userId, settings);

      // Add host as first player
      const result = gameManager.addPlayer(roomCode, {
        id: socket.id,
        socketId: socket.id,
        username,
        userId,
      });

      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      // Join socket room
      socket.join(roomCode);

      // Track connected user
      connectedUsers.set(socket.id, { username, roomCode, userId });

      // Send response (top-level maxPlayers so the lobby UI does not depend on nested settings)
      socket.emit('room-created', {
        roomCode,
        maxPlayers: lobbyMaxPlayers(result.game),
        game: gameManager.sanitizeForPlayer(result.game, socket.id),
      });

      logger.info(`Room created: ${roomCode} by ${username}`);
    } catch (error) {
      logger.error(`Create room error: ${error.message}`);
      socket.emit('error', { message: 'Failed to create room.' });
    }
  });

  // ========================
  // JOIN ROOM
  // ========================
  socket.on('join-room', ({ roomCode, username, userId }) => {
    try {
      roomCode = roomCode.toUpperCase().trim();

      const game = gameManager.getGame(roomCode);
      if (!game) {
        socket.emit('error', { message: 'Room not found.' });
        return;
      }

      if (game.status !== 'waiting') {
        socket.emit('error', { message: 'Game already in progress.' });
        return;
      }

      // Add player
      const result = gameManager.addPlayer(roomCode, {
        id: socket.id,
        socketId: socket.id,
        username,
        userId,
      });

      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      // Join socket room
      socket.join(roomCode);

      // Track connected user
      connectedUsers.set(socket.id, { username, roomCode, userId });

      // Notify the joining player
      socket.emit('room-joined', {
        roomCode,
        maxPlayers: lobbyMaxPlayers(result.game),
        game: gameManager.sanitizeForPlayer(result.game, socket.id),
      });

      // Notify all players in room
      io.to(roomCode).emit('player-joined', {
        maxPlayers: lobbyMaxPlayers(result.game),
        game: gameManager.sanitizeForPlayer(result.game, socket.id),
        username,
        playerCount: result.game.players.length,
      });

      logger.info(`${username} joined room: ${roomCode}`);
    } catch (error) {
      logger.error(`Join room error: ${error.message}`);
      socket.emit('error', { message: 'Failed to join room.' });
    }
  });

  // ========================
  // LEAVE ROOM
  // ========================
  socket.on('leave-room', ({ roomCode }) => {
    try {
      const userData = connectedUsers.get(socket.id);
      if (!userData) return;

      const result = gameManager.removePlayer(roomCode, socket.id);

      // Leave socket room
      socket.leave(roomCode);

      // Clean up tracking
      connectedUsers.delete(socket.id);

      // Notify player
      socket.emit('room-left');

      if (result && !result.removed) {
        io.to(roomCode).emit('player-left', {
          username: userData.username,
          game: result.game ? gameManager.sanitizeForPlayer(result.game, null) : null,
        });

        if (result.gameOver && result.game) {
          saveGameToDatabase(result.game, result.scores);
          updatePlayerStats(result.game, result.winner);
          const winId = typeof result.winner === 'object' ? result.winner.id : result.winner;
          result.game.players.forEach((p) => {
            if (p.connected) {
              const gameState = gameManager.sanitizeForPlayer(result.game, p.id);
              io.to(p.id).emit('game-state-update', {
                hand: p.hand,
                gameState,
              });
              io.to(p.id).emit('game-over', {
                winner: winId,
                winnerUsername: result.winnerUsername,
                reason: 'Opponent left the game',
                gameState,
                hand: p.hand,
              });
            }
          });
        } else if (result.game && result.game.status === 'playing') {
          result.game.players.forEach((p) => {
            if (p.connected) {
              io.to(p.id).emit('game-state-update', {
                hand: p.hand,
                gameState: gameManager.sanitizeForPlayer(result.game, p.id),
              });
            }
          });
        }
      }

      logger.info(`${userData.username} left room: ${roomCode}`);
    } catch (error) {
      logger.error(`Leave room error: ${error.message}`);
    }
  });

  // ========================
  // START GAME
  // ========================
  socket.on('start-game', ({ roomCode }) => {
    try {
      const game = gameManager.getGame(roomCode);
      if (!game) {
        socket.emit('error', { message: 'Game not found.' });
        return;
      }

      // Verify host
      if (game.players[0]?.id !== socket.id) {
        socket.emit('error', { message: 'Only the host can start the game.' });
        return;
      }

      const result = gameManager.startGame(roomCode);

      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      // Send each player their hand and game state
      result.game.players.forEach(player => {
        io.to(player.id).emit('game-started', {
          hand: player.hand,
          gameState: gameManager.sanitizeForPlayer(result.game, player.id),
        });
      });

      logger.info(`Game started in room: ${roomCode}`);
    } catch (error) {
      logger.error(`Start game error: ${error.message}`);
      socket.emit('error', { message: 'Failed to start game.' });
    }
  });

  // ========================
  // UPDATE SETTINGS
  // ========================
  socket.on('update-settings', ({ roomCode, settings }) => {
    try {
      const game = gameManager.getGame(roomCode);
      if (!game) return;

      // Only host can update
      if (game.players[0]?.id !== socket.id) {
        socket.emit('error', { message: 'Only the host can change settings.' });
        return;
      }

      if (game.status !== 'waiting') return;

      // Update settings
      if (settings.maxPlayers) game.settings.maxPlayers = Math.min(Math.max(settings.maxPlayers, 2), 10);
      if (settings.cardsPerHand) game.settings.cardsPerHand = Math.min(Math.max(settings.cardsPerHand, 5), 10);
      if (typeof settings.drawStackEnabled === 'boolean') game.settings.drawStackEnabled = settings.drawStackEnabled;
      if (typeof settings.noMercyMode === 'boolean') game.settings.noMercyMode = settings.noMercyMode;
      if (settings.timePerTurn) game.settings.timePerTurn = Math.min(Math.max(settings.timePerTurn, 10), 120);

      io.to(roomCode).emit('settings-updated', { settings: game.settings });

      logger.info(`Settings updated for room: ${roomCode}`);
    } catch (error) {
      logger.error(`Update settings error: ${error.message}`);
    }
  });

  // ========================
  // GET ACTIVE ROOMS
  // ========================
  socket.on('get-active-rooms', () => {
    const rooms = gameManager.getActiveRooms().filter(r => r.status === 'waiting');
    socket.emit('active-rooms', { rooms });
  });
}

export default setupLobbySocket;