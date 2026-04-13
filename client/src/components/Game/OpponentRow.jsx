import React from 'react';
import { motion } from 'framer-motion';
import CardBack from '../Cards/CardBack';

const OpponentRow = ({ opponents, currentPlayerIndex, players, onCatchUno }) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
      {opponents.map((opponent, idx) => {
        const isCurrentPlayer = players[currentPlayerIndex]?.id === opponent.id;
        const hasOneCard = opponent.cardCount === 1;
        const isOut = opponent.knockedOut;

        return (
          <motion.div
            key={opponent.id}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`glass w-[10.25rem] max-w-[min(100%,calc(50vw-0.75rem))] shrink-0 p-2.5 transition-all duration-300 min-[400px]:w-44 sm:w-[11.25rem] sm:max-w-none sm:p-4
              ${isOut ? 'opacity-60 border-white/10' : ''}
              ${isCurrentPlayer && !isOut
                ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/10 bg-yellow-500/5' 
                : ''
              }
              ${hasOneCard && !isOut ? 'border-red-500/50' : ''}
            `}
          >
            {/* Player Info */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${isCurrentPlayer 
                  ? 'bg-gradient-to-br from-yellow-500 to-orange-500 animate-pulse' 
                  : 'bg-gradient-to-br from-gray-600 to-gray-700'
                }`}>
                {opponent.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{opponent.username}</p>
                <p className={`text-xs ${isOut ? 'text-amber-400/90' : isCurrentPlayer ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {isOut ? 'Out (Mercy)' : isCurrentPlayer ? 'Playing…' : `${opponent.cardCount} cards`}
                </p>
              </div>
            </div>

            {/* Cards */}
            <div className="flex items-center gap-0.5 justify-center">
              {isOut ? (
                <span className="text-xs text-gray-500">—</span>
              ) : opponent.cardCount <= 7 ? (
                Array(opponent.cardCount).fill(null).map((_, i) => (
                  <div key={i} style={{ marginLeft: i === 0 ? 0 : '-6px' }}>
                    <CardBack small />
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array(5).fill(null).map((_, i) => (
                      <div key={i} style={{ marginLeft: i === 0 ? 0 : '-6px' }}>
                        <CardBack small />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 font-bold">+{opponent.cardCount - 5}</span>
                </div>
              )}
            </div>

            {/* UNO Warning */}
            {hasOneCard && !isOut && !opponent.saidUno && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCatchUno(opponent.id)}
                className="mt-2 w-full py-1 bg-red-600/80 hover:bg-red-600 rounded-lg 
                           text-xs font-bold text-white transition-all duration-200
                           animate-pulse-fast"
              >
                🚨 CATCH UNO!
              </motion.button>
            )}

            {hasOneCard && !isOut && opponent.saidUno && (
              <div className="mt-2 text-center">
                <span className="text-xs text-red-400 font-bold animate-pulse">
                  🔴 UNO!
                </span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default OpponentRow;
