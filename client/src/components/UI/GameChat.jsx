import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_MESSAGES = [
  '🔥 No Mercy!',
  '😂 LOL',
  '😤 Seriously?!',
  '👋 GG',
  '🎉 UNO!',
  '😈 Get rekt!',
  '🙏 Please no...',
  '💀 I\'m dead',
];

const GameChat = ({ roomCode, username, isOpen, onToggle }) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('chat-message', ({ username, message, timestamp }) => {
      setMessages(prev => [...prev, { username, message, timestamp }]);
      if (!isOpen) setUnread(prev => prev + 1);
    });

    return () => socket.off('chat-message');
  }, [socket, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setUnread(0);
  }, [isOpen]);

  const sendMessage = (msg) => {
    const message = msg || input.trim();
    if (!message || !socket) return;

    socket.emit('chat-message', { roomCode, username, message });
    setInput('');
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full 
                   bg-gradient-to-br from-purple-600 to-blue-600 
                   flex items-center justify-center shadow-lg shadow-purple-500/25
                   hover:scale-110 active:scale-95 transition-all duration-200"
      >
        💬
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full 
                          text-xs flex items-center justify-center font-bold animate-bounce">
            {unread}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed right-0 top-0 bottom-0 w-80 z-50 
                       bg-uno-dark/95 backdrop-blur-lg border-l border-white/10
                       flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-bold text-lg">💬 Game Chat</h3>
              <button
                onClick={onToggle}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-8">
                  <span className="text-3xl block mb-2">💬</span>
                  No messages yet. Say something!
                </div>
              )}

              {messages.map((msg, i) => {
                const isMe = msg.username === username;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-gray-500 mb-0.5 px-1">
                      {isMe ? 'You' : msg.username}
                    </span>
                    <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm
                      ${isMe
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-tr-sm'
                        : 'bg-white/10 text-gray-200 rounded-tl-sm'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Messages */}
            <div className="px-4 py-2 border-t border-white/5">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_MESSAGES.map((msg) => (
                  <button
                    key={msg}
                    onClick={() => sendMessage(msg)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/15 rounded-full 
                              text-xs text-gray-300 hover:text-white transition-all
                              hover:scale-105 active:scale-95"
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/10 rounded-xl
                           text-sm text-white placeholder-gray-500 focus:outline-none
                           focus:ring-1 focus:ring-purple-500"
                  maxLength={100}
                />
                <button
                  onClick={() => sendMessage()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 
                           rounded-xl text-sm font-semibold hover:scale-105 
                           active:scale-95 transition-all"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GameChat;