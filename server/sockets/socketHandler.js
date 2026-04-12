import { setupLobbySocket } from './lobbySocket.js';
import { setupGameSocket } from './gameSocket.js';
import { setupChatSocket } from './chatSocket.js';
import gameManager from '../game-engine/GameManager.js';
import { logger } from '../utils/logger.js';

export function initializeSocket(io) {
  // Track connected users
  const connectedUsers = new Map(); // socketId -> { username, roomCode, userId }

  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);

    // Setup all socket handlers
    setupLobbySocket(io, socket, connectedUsers, gameManager);
    setupGameSocket(io, socket, connectedUsers, gameManager);
    setupChatSocket(io, socket, connectedUsers);

    // Handle disconnect
    socket.on('disconnect', () => {
      const userData = connectedUsers.get(socket.id);

      if (userData?.roomCode) {
        const result = gameManager.removePlayer(userData.roomCode, socket.id);

        if (result && !result.removed) {
          // Notify remaining players
          io.to(userData.roomCode).emit('player-disconnected', {
            username: userData.username,
            playerId: socket.id,
          });

          // If game ended due to disconnect
          if (result.gameOver) {
            io.to(userData.roomCode).emit('game-over', {
              winner: result.winner.id,
              winnerUsername: result.winner.username,
              reason: 'All other players disconnected',
            });
          }

          // Update game state for remaining players
          if (result.game && result.game.status === 'playing') {
            result.game.players.forEach(player => {
              if (player.connected) {
                io.to(player.id).emit('game-state-update', {
                  hand: player.hand,
                  gameState: gameManager.sanitizeForPlayer(result.game, player.id),
                });
              }
            });
          }
        }
      }

      connectedUsers.delete(socket.id);
      logger.info(`❌ Socket disconnected: ${socket.id} (${userData?.username || 'unknown'})`);
    });

    // Handle reconnection attempt
    socket.on('reconnect-game', ({ roomCode, username }) => {
      const game = gameManager.getGame(roomCode);
      if (!game) {
        socket.emit('error', { message: 'Game not found.' });
        return;
      }

      const player = game.players.find(p => p.username === username);
      if (!player) {
        socket.emit('error', { message: 'Player not found in game.' });
        return;
      }

      // Update socket id
      const oldSocketId = player.id;
      player.id = socket.id;
      player.socketId = socket.id;
      player.connected = true;

      // Track user
      connectedUsers.set(socket.id, { username, roomCode, userId: player.userId });
      socket.join(roomCode);

      // Send current game state
      socket.emit('reconnected', {
        hand: player.hand,
        gameState: gameManager.sanitizeForPlayer(game, socket.id),
      });

      // Notify others
      socket.to(roomCode).emit('player-reconnected', { username });

      logger.info(`🔄 Player ${username} reconnected to room ${roomCode}`);
    });

    // Get server stats
    socket.on('get-stats', () => {
      socket.emit('server-stats', gameManager.getStats());
    });

    // Ping/Pong for latency check
    socket.on('ping-server', () => {
      socket.emit('pong-server', { timestamp: Date.now() });
    });
  });

  // Periodic cleanup of stale games
  setInterval(() => {
    const now = Date.now();
    const staleTimeout = 30 * 60 * 1000; // 30 minutes

    gameManager.games.forEach((game, roomCode) => {
      const gameAge = now - new Date(game.createdAt).getTime();
      const connectedPlayers = game.players.filter(p => p.connected);

      // Remove stale waiting rooms (30 min old)
      if (game.status === 'waiting' && gameAge > staleTimeout) {
        gameManager.removeGame(roomCode);
        logger.info(`🗑️ Cleaned up stale room: ${roomCode}`);
      }

      // Remove finished games after 5 minutes
      if (game.status === 'finished' && game.finishedAt) {
        const finishedAge = now - new Date(game.finishedAt).getTime();
        if (finishedAge > 5 * 60 * 1000) {
          gameManager.removeGame(roomCode);
          logger.info(`🗑️ Cleaned up finished game: ${roomCode}`);
        }
      }

      // Remove games with no connected players
      if (connectedPlayers.length === 0 && gameAge > 60000) {
        gameManager.removeGame(roomCode);
        logger.info(`🗑️ Cleaned up empty room: ${roomCode}`);
      }
    });
  }, 60000); // Run every minute

  logger.info('⚡ Socket.IO initialized');
}

export default initializeSocket;