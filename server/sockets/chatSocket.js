import { logger } from '../utils/logger.js';

// Store chat history per room (last 50 messages)
const chatHistory = new Map();

// Bad words filter (basic)
const BLOCKED_WORDS = ['spam', 'hack'];

export function setupChatSocket(io, socket, connectedUsers) {

  // ========================
  // SEND MESSAGE
  // ========================
  socket.on('chat-message', ({ roomCode, username, message }) => {
    try {
      if (!roomCode || !username || !message) return;

      // Sanitize message
      const sanitizedMessage = message.trim().substring(0, 200);
      if (sanitizedMessage.length === 0) return;

      // Rate limiting (basic - 1 message per second)
      const now = Date.now();
      const lastMessageTime = socket._lastMessageTime || 0;
      if (now - lastMessageTime < 1000) {
        socket.emit('error', { message: 'Slow down! Wait a moment before sending.' });
        return;
      }
      socket._lastMessageTime = now;

      // Create message object
      const chatMessage = {
        id: `${socket.id}_${now}`,
        username,
        message: sanitizedMessage,
        timestamp: new Date().toISOString(),
        type: 'user',
      };

      // Store in history
      if (!chatHistory.has(roomCode)) {
        chatHistory.set(roomCode, []);
      }
      const history = chatHistory.get(roomCode);
      history.push(chatMessage);
      if (history.length > 50) {
        history.shift();
      }

      // Broadcast to room
      io.to(roomCode).emit('chat-message', chatMessage);
    } catch (error) {
      logger.error(`Chat message error: ${error.message}`);
    }
  });

  // ========================
  // SYSTEM MESSAGE
  // ========================
  socket.on('system-message', ({ roomCode, message }) => {
    try {
      const systemMessage = {
        id: `system_${Date.now()}`,
        username: 'System',
        message,
        timestamp: new Date().toISOString(),
        type: 'system',
      };

      io.to(roomCode).emit('chat-message', systemMessage);
    } catch (error) {
      logger.error(`System message error: ${error.message}`);
    }
  });

  // ========================
  // GET CHAT HISTORY
  // ========================
  socket.on('get-chat-history', ({ roomCode }) => {
    try {
      const history = chatHistory.get(roomCode) || [];
      socket.emit('chat-history', { messages: history });
    } catch (error) {
      logger.error(`Get chat history error: ${error.message}`);
    }
  });

  // ========================
  // EMOJI REACTION
  // ========================
  socket.on('emoji-reaction', ({ roomCode, emoji }) => {
    try {
      const userData = connectedUsers.get(socket.id);
      if (!userData) return;

      const allowedEmojis = ['👍', '👎', '😂', '😤', '🔥', '💀', '😈', '🎉', '😱', '❤️'];
      if (!allowedEmojis.includes(emoji)) return;

      io.to(roomCode).emit('emoji-reaction', {
        username: userData.username,
        emoji,
        playerId: socket.id,
      });
    } catch (error) {
      logger.error(`Emoji reaction error: ${error.message}`);
    }
  });

  // ========================
  // TYPING INDICATOR
  // ========================
  socket.on('typing-start', ({ roomCode }) => {
    const userData = connectedUsers.get(socket.id);
    if (!userData) return;
    socket.to(roomCode).emit('user-typing', { username: userData.username });
  });

  socket.on('typing-stop', ({ roomCode }) => {
    const userData = connectedUsers.get(socket.id);
    if (!userData) return;
    socket.to(roomCode).emit('user-stopped-typing', { username: userData.username });
  });
}

// Cleanup chat history for removed rooms
function cleanupChatHistory(roomCode) {
  chatHistory.delete(roomCode);
}

export { cleanupChatHistory };

export default setupChatSocket;