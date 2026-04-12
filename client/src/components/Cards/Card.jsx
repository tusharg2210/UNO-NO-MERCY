import React from 'react';
import { motion } from 'framer-motion';

const CARD_CONFIG = {
  number: { getDisplay: (card) => card.value, emoji: '' },
  skip: { getDisplay: () => '⊘', emoji: '🚫' },
  reverse: { getDisplay: () => '⇄', emoji: '🔄' },
  draw_two: { getDisplay: () => '+2', emoji: '' },
  wild: { getDisplay: () => 'W', emoji: '🌈' },
  wild_draw_four: { getDisplay: () => '+4', emoji: '' },
  skip_everyone: { getDisplay: () => '⊘✕', emoji: '🚫' },
  wild_draw_six: { getDisplay: () => '+6', emoji: '🔥' },
  wild_draw_ten: { getDisplay: () => '+10', emoji: '💀' },
  discard_all: { getDisplay: () => 'ALL', emoji: '💣' },
  reverse_draw_four: { getDisplay: () => '⇄+4', emoji: '🔥' },
  swap_hands: { getDisplay: () => '⇋', emoji: '🔀' },
  wild_color_roulette: { getDisplay: () => '?', emoji: '🎰' },
};

const COLOR_CLASSES = {
  red: 'card-gradient-red',
  blue: 'card-gradient-blue',
  green: 'card-gradient-green',
  yellow: 'card-gradient-yellow',
  null: 'card-gradient-wild',
  undefined: 'card-gradient-wild',
};

const Card = ({ card, onClick, playable = false, index = 0, small = false }) => {
  const config = CARD_CONFIG[card.type] || { getDisplay: () => '?', emoji: '' };
  const colorClass = COLOR_CLASSES[card.color] || 'card-gradient-wild';

  const isNoMercy = [
    'skip_everyone', 'wild_draw_six', 'wild_draw_ten',
    'discard_all', 'reverse_draw_four', 'swap_hands', 'wild_color_roulette'
  ].includes(card.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotate: Math.random() * 20 - 10 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
      whileHover={playable ? { y: -30, scale: 1.15, zIndex: 50 } : {}}
      whileTap={playable ? { scale: 0.95 } : {}}
      onClick={() => playable && onClick?.(card)}
      className={`
        ${small ? 'w-14 h-20' : 'w-20 h-28 sm:w-24 sm:h-36'}
        ${colorClass} 
        rounded-xl border-2 
        ${playable 
          ? 'border-white/40 cursor-pointer hover:border-white hover:shadow-lg hover:shadow-white/20' 
          : 'border-white/20 opacity-70 cursor-not-allowed'
        }
        ${isNoMercy ? 'ring-2 ring-red-500/50' : ''}
        flex flex-col items-center justify-center
        relative overflow-hidden select-none
        card-shadow transition-colors duration-200
      `}
    >
      {/* Inner white border effect */}
      <div className="absolute inset-1 rounded-lg border border-white/20 pointer-events-none" />

      {/* No Mercy indicator */}
      {isNoMercy && (
        <div className="absolute top-0 left-0 right-0 bg-red-600/80 text-[6px] sm:text-[8px] 
                        text-center font-bold tracking-wider py-0.5">
          NO MERCY
        </div>
      )}

      {/* Card Value */}
      <span className={`${small ? 'text-lg' : 'text-2xl sm:text-4xl'} font-black text-white drop-shadow-lg`}>
        {config.getDisplay(card)}
      </span>

      {/* Emoji */}
      {config.emoji && (
        <span className={`${small ? 'text-xs' : 'text-sm sm:text-base'} mt-0.5`}>
          {config.emoji}
        </span>
      )}

      {/* Type label */}
      <span className={`${small ? 'text-[5px]' : 'text-[7px] sm:text-[9px]'} text-white/70 
                        uppercase tracking-wider mt-1 font-semibold`}>
        {card.type.replace(/_/g, ' ')}
      </span>

      {/* Corner values */}
      <span className="absolute top-1 left-1.5 text-[8px] sm:text-xs font-bold text-white/80">
        {config.getDisplay(card)}
      </span>
      <span className="absolute bottom-1 right-1.5 text-[8px] sm:text-xs font-bold text-white/80 rotate-180">
        {config.getDisplay(card)}
      </span>

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent 
                      pointer-events-none rounded-xl" />
    </motion.div>
  );
};

export default Card;