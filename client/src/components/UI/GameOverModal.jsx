import React from 'react';
import { motion } from 'framer-motion';

const GameOverModal = ({ winner, players, onLeave }) => {
  const winnerPlayer = players.find(p => p.id === winner);

  // Sort players by card count (fewer = better)
  const rankings = [...players].sort((a, b) => a.cardCount - b.cardCount);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, delay: 0.2 }}
        className="glass p-8 max-w-md w-full text-center relative overflow-hidden"
      >
        {/* Confetti-like background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {['🎉', '🎊', '⭐', '🏆', '✨', '🎴'].map((emoji, i) => (
            <motion.span
              key={i}
              initial={{ y: -20, x: Math.random() * 300, opacity: 0 }}
              animate={{
                y: [null, 400],
                opacity: [0, 1, 1, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.4,
              }}
              className="absolute text-2xl"
            >
              {emoji}
            </motion.span>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Trophy */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-7xl mb-4"
          >
            🏆
          </motion.div>

          <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            GAME OVER!
          </h2>

          <div className="mb-6">
            <p className="text-gray-400 text-sm">Winner</p>
            <motion.p
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-2xl font-bold text-yellow-400"
            >
              👑 {winnerPlayer?.username || 'Unknown'}
            </motion.p>
          </div>

          {/* Rankings */}
          <div className="space-y-2 mb-8">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Final Standings
            </h3>
            {rankings.map((player, index) => {
              const medals = ['🥇', '🥈', '🥉'];
              const medal = medals[index] || `#${index + 1}`;
              const isWinner = player.id === winner;

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.15 }}
                  className={`flex items-center gap-3 p-3 rounded-xl
                    ${isWinner
                      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                      : 'bg-white/5 border border-white/5'
                    }`}
                >
                  <span className="text-xl w-8">{medal}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${isWinner
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                      : 'bg-gradient-to-br from-gray-600 to-gray-700'
                    }`}>
                    {player.username?.[0]?.toUpperCase()}
                  </div>
                  <span className={`flex-1 text-left font-semibold ${isWinner ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {player.username}
                  </span>
                  <span className="text-sm text-gray-400">
                    {player.cardCount === 0 ? '🎉 Winner!' : `${player.cardCount} cards left`}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onLeave}
              className="flex-1 py-3 px-6 bg-white/10 hover:bg-white/20 rounded-xl 
                         font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
            >
              🏠 Back to Lobby
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 btn-primary"
            >
              🔄 Play Again
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GameOverModal;