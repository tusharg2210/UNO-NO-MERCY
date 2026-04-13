import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const CONFETTI = ['\uD83C\uDF89', '\uD83C\uDF8A', '\u2B50', '\uD83C\uDFC6', '\u2728', '\uD83C\uDFA8'];

const GameOverModal = ({ winner, players, onLeave }) => {
  const winnerPlayer = players.find(
    (p) => p.id === winner || String(p.id) === String(winner)
  );

  const { rankedActive, mercyOut } = useMemo(() => {
    const active = players.filter((p) => !p.knockedOut);
    const mercy = players.filter((p) => p.knockedOut);
    const winEntry =
      winner != null ? active.find((p) => p.id === winner || String(p.id) === String(winner)) : null;
    const others = active
      .filter((p) => !winEntry || p.id !== winEntry.id)
      .sort((a, b) => a.cardCount - b.cardCount);
    const rankedActive = winEntry ? [winEntry, ...others] : [...active].sort((a, b) => a.cardCount - b.cardCount);
    return { rankedActive, mercyOut: mercy };
  }, [players, winner]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-2 backdrop-blur-md min-[480px]:items-center min-[480px]:p-4"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, delay: 0.2 }}
        className="glass relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl p-4 text-center min-[480px]:rounded-2xl min-[480px]:p-8"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {CONFETTI.map((emoji, i) => (
            <motion.span
              key={i}
              initial={{ y: -20, x: (i * 47) % 280, opacity: 0 }}
              animate={{
                y: [null, 400],
                opacity: [0, 1, 1, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 3 + (i % 3) * 0.6,
                repeat: Infinity,
                delay: i * 0.4,
              }}
              className="absolute text-2xl"
            >
              {emoji}
            </motion.span>
          ))}
        </div>

        <div className="relative z-10">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-7xl mb-4"
            aria-hidden
          >
            {'\uD83C\uDFC6'}
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
              {'\uD83D\uDC51'} {winnerPlayer?.username || 'Unknown'}
            </motion.p>
          </div>

          <div className="space-y-2 mb-6 text-left">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 text-center">
              Final standings
            </h3>
            {rankedActive.map((player, index) => {
              const medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
              const medal = medals[index] || `#${index + 1}`;
              const isWinner =
                winner != null && (player.id === winner || String(player.id) === String(winner));

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
                  <span className="text-xl w-8 text-center shrink-0">{medal}</span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isWinner
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                      : 'bg-gradient-to-br from-gray-600 to-gray-700'
                    }`}
                  >
                    {player.username?.[0]?.toUpperCase()}
                  </div>
                  <span
                    className={`flex-1 text-left font-semibold min-w-0 truncate ${isWinner ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    {player.username}
                  </span>
                  <span className="text-sm text-gray-400 shrink-0 text-right">
                    {isWinner ? 'Winner!' : `${player.cardCount} cards left`}
                  </span>
                </motion.div>
              );
            })}

            {mercyOut.length > 0 && (
              <>
                <h4 className="text-xs font-semibold text-amber-200/80 uppercase tracking-wider pt-4 pb-1 text-center">
                  Out (Mercy — 25+ cards)
                </h4>
                {mercyOut.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (rankedActive.length + index) * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/25"
                  >
                    <span className="text-sm w-8 text-center shrink-0 font-semibold text-amber-200/90">—</span>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-amber-900/60 text-amber-100">
                      {player.username?.[0]?.toUpperCase()}
                    </div>
                    <span className="flex-1 text-left font-semibold text-amber-100/95 min-w-0 truncate">
                      {player.username}
                    </span>
                    <span className="text-sm text-amber-200/80 shrink-0 text-right whitespace-nowrap">
                      Out (Mercy)
                    </span>
                  </motion.div>
                ))}
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onLeave}
              className="flex-1 py-3 px-6 bg-white/10 hover:bg-white/20 rounded-xl 
                         font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Back to Lobby
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 btn-primary"
            >
              Play Again
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GameOverModal;
