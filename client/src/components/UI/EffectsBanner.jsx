import React from 'react';
import { motion } from 'framer-motion';

const EffectsBanner = ({ effects }) => {
  const isNoMercy = effects.message?.includes('🔥') || effects.message?.includes('💀');

  return (
    <motion.div
      initial={{ opacity: 0, y: -100, scale: 0.5 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      transition={{ type: 'spring', damping: 12 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
    >
      <div
        className={`
          px-8 py-4 rounded-2xl text-center font-bold text-lg
          shadow-2xl border-2 backdrop-blur-md
          ${isNoMercy
            ? 'bg-gradient-to-r from-red-900/90 to-orange-900/90 border-red-500/50 text-red-100 shadow-red-500/30'
            : 'bg-gradient-to-r from-purple-900/90 to-blue-900/90 border-purple-500/50 text-purple-100 shadow-purple-500/30'
          }
        `}
      >
        {/* Animated background glow */}
        <div className={`absolute inset-0 rounded-2xl opacity-30 animate-pulse
          ${isNoMercy ? 'bg-red-500' : 'bg-purple-500'}`} 
        />
        
        <div className="relative z-10">
          <motion.p
            initial={{ scale: 0.8 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5 }}
            className="text-xl sm:text-2xl"
          >
            {effects.message}
          </motion.p>
        </div>

        {/* Sparkle particles */}
        {isNoMercy && (
          <>
            <motion.span
              animate={{ y: [-20, -60], opacity: [1, 0], x: [-10, -30] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute top-0 left-1/4 text-xl"
            >
              ✨
            </motion.span>
            <motion.span
              animate={{ y: [-20, -60], opacity: [1, 0], x: [10, 30] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              className="absolute top-0 right-1/4 text-xl"
            >
              💥
            </motion.span>
            <motion.span
              animate={{ y: [-20, -50], opacity: [1, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
              className="absolute top-0 left-1/2 text-xl"
            >
              🔥
            </motion.span>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default EffectsBanner;