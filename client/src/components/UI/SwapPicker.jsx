import React from 'react';
import { motion } from 'framer-motion';

const SwapPicker = ({
  opponents,
  onSelectPlayer,
  onClose,
  title = 'Swap Hands',
  subtitle = 'Choose a player to swap hands with',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-2 backdrop-blur-sm min-[480px]:items-center min-[480px]:p-4"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.5, y: 50 }}
        transition={{ type: 'spring', damping: 15 }}
        className="glass w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-t-2xl p-4 min-[480px]:rounded-2xl min-[480px]:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <span className="text-4xl mb-2 block">🔀</span>
          <h3 className="text-2xl font-bold">{title}</h3>
          <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
        </div>

        <div className="space-y-3">
          {opponents.map((opponent, idx) => (
            <motion.button
              key={opponent.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.03, x: 5 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectPlayer(opponent.id)}
              className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10
                         rounded-xl border border-white/10 hover:border-purple-500/50
                         transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500
                            flex items-center justify-center text-lg font-bold
                            group-hover:from-purple-400 group-hover:to-blue-400 transition-all">
                {opponent.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                  {opponent.username}
                </p>
                <p className="text-xs text-gray-400">
                  {opponent.cardCount} cards in hand
                </p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-2xl">🃏</span>
                <span className="text-lg font-bold text-purple-400">{opponent.cardCount}</span>
              </div>
              <span className="text-gray-600 group-hover:text-white transition-colors text-xl">
                →
              </span>
            </motion.button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 text-gray-400 hover:text-white text-sm 
                     transition-colors border border-white/10 rounded-xl hover:bg-white/5"
        >
          ✕ Cancel
        </button>
      </motion.div>
    </motion.div>
  );
};

export default SwapPicker;