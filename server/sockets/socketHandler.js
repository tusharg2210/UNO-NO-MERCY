import { setupLobbySocket } from './lobbySocket.js';
import { setupGameSocket, saveGameToDatabase, updatePlayerStats } from './gameSocket.js';
import { setupChatSocket } from './chatSocket.js';
import gameManager from '../game-engine/GameManager.js';
import { logger } from '../utils/logger.js';

export function initializeSocket(io) {
  // Track connected users
  const connectedUsers = new Map(); // socketId -> { username, roomCode, userId }

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Setup all socket handlers
    setupLobbySocket(io, socket, connectedUsers, gameManager);
    setupGameSocket(io, socket, connectedUsers, gameManager);
    setupChatSocket(io, socket, connectedUsers);

    // Handle disconnect
    socket.on('disconnect', () => {
      const userData = connectedUsers.get(socket.id);

      if (userData?.roomCode) {
        const game = gameManager.getGame(userData.roomCode);
        const result =
          game?.status === 'playing'
            ? gameManager.markPlayerDisconnected(userData.roomCode, socket.id)
            : gameManager.removePlayer(userData.roomCode, socket.id);

        if (result && !result.removed) {
          const room = userData.roomCode;

          io.to(room).emit('player-disconnected', {
            username: userData.username,
            playerId: socket.id,
          });

          if (result.gameOver && result.game) {
            saveGameToDatabase(result.game, result.scores);
            updatePlayerStats(result.game, result.winner);
            result.game.players.forEach(player => {
              if (player.connected) {
                const gameState = gameManager.sanitizeForPlayer(result.game, player.id);
                io.to(player.id).emit('game-state-update', {
                  hand: player.hand,
                  gameState,
                });
                io.to(player.id).emit('game-over', {
                  winner: result.winner,
                  winnerUsername: result.winnerUsername,
                  reason: 'Opponent disconnected',
                  gameState,
                  hand: player.hand,
                });
              }
            });
          } else if (result.game && result.game.status === 'playing') {
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
      logger.info(`Socket disconnected: ${socket.id} (${userData?.username || 'unknown'})`);
    });

    // Rejoin after refresh or transport reconnect (new socket id)
    socket.on('reconnect-game', ({ roomCode, username, userId }) => {
      const game = gameManager.getGame(roomCode);
      if (!game) {
        socket.emit('error', { message: 'Game not found.' });
        return;
      }

      let player = game.players.find((p) => p.id === socket.id);
      if (player) {
        player.connected = true;
        player.socketId = socket.id;
        connectedUsers.set(socket.id, {
          username: player.username,
          roomCode,
          userId: player.userId,
        });
        socket.join(roomCode);
        socket.emit('reconnected', {
          hand: player.hand,
          gameState: gameManager.sanitizeForPlayer(game, socket.id),
        });
        logger.info(`Player ${player.username} resynced socket in room ${roomCode}`);
        return;
      }

      player = game.players.find((p) => {
        if (p.connected) return false;
        const idMatch =
          userId != null &&
          p.userId != null &&
          String(p.userId) === String(userId);
        if (idMatch) return true;
        return p.username === username;
      });

      if (!player) {
        socket.emit('error', {
          message:
            'No seat to reclaim in this room. The game may have ended or you left the match.',
        });
        return;
      }

      player.id = socket.id;
      player.socketId = socket.id;
      player.connected = true;

      connectedUsers.set(socket.id, {
        username: player.username,
        roomCode,
        userId: player.userId,
      });
      socket.join(roomCode);

      socket.emit('reconnected', {
        hand: player.hand,
        gameState: gameManager.sanitizeForPlayer(game, socket.id),
      });

      socket.to(roomCode).emit('player-reconnected', { username: player.username });

      game.players.forEach((p) => {
        if (p.connected && p.id !== socket.id) {
          io.to(p.id).emit('game-state-update', {
            hand: p.hand,
            gameState: gameManager.sanitizeForPlayer(game, p.id),
          });
        }
      });

      logger.info(`Player ${player.username} reconnected to room ${roomCode}`);
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
        logger.info(`Cleaned up stale room: ${roomCode}`);
      }

      // Remove finished games after 5 minutes
      if (game.status === 'finished' && game.finishedAt) {
        const finishedAge = now - new Date(game.finishedAt).getTime();
        if (finishedAge > 5 * 60 * 1000) {
          gameManager.removeGame(roomCode);
          logger.info(`Cleaned up finished game: ${roomCode}`);
        }
      }

      // Remove games with no connected players
      if (connectedPlayers.length === 0 && gameAge > 60000) {
        gameManager.removeGame(roomCode);
        logger.info(`Cleaned up empty room: ${roomCode}`);
      }
    });
  }, 60000); // Run every minute

  logger.info('Socket.IO initialized');
}

export default initializeSocket;
