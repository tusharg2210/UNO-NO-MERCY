import React from 'react';
import { motion } from 'framer-motion';

const CARD_CONFIG = {
  number: { getDisplay: (card) => String(card.value), shortLabel: 'number' },
  skip: { getDisplay: () => 'SKIP', shortLabel: 'skip' },
  reverse: { getDisplay: () => 'REV', shortLabel: 'reverse' },
  draw_two: { getDisplay: () => '+2', shortLabel: 'draw two' },
  draw_four: { getDisplay: () => '+4', shortLabel: 'draw four' },
  wild: { getDisplay: () => 'WILD', shortLabel: 'wild' },
  wild_draw_four: { getDisplay: () => 'W+4', shortLabel: 'wild draw four' },
  skip_everyone: { getDisplay: () => 'SKIP ALL', shortLabel: 'skip everyone' },
  wild_draw_six: { getDisplay: () => 'W+6', shortLabel: 'wild draw six' },
  wild_draw_ten: { getDisplay: () => 'W+10', shortLabel: 'wild draw ten' },
  discard_all: { getDisplay: () => 'ALL', shortLabel: 'discard all' },
  reverse_draw_four: { getDisplay: () => 'R+4', shortLabel: 'reverse draw four' },
  swap_hands: { getDisplay: () => 'SWAP', shortLabel: 'swap hands' },
  wild_color_roulette: { getDisplay: () => 'ROUL', shortLabel: 'color roulette' },
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
  const config = CARD_CONFIG[card.type] || { getDisplay: () => '?', shortLabel: 'unknown' };
  const colorClass = COLOR_CLASSES[card.color] || 'card-gradient-wild';
  const display = config.getDisplay(card);

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
        rounded-2xl border-2
        ${playable 
          ? 'border-white/40 cursor-pointer hover:border-white hover:shadow-xl hover:shadow-white/25' 
          : 'border-white/20 opacity-70 cursor-not-allowed'
        }
        ${isNoMercy ? 'ring-2 ring-red-400/60' : ''}
        flex flex-col items-center justify-center
        relative overflow-hidden select-none
        card-shadow transition-all duration-200
      `}
    >
      <div className="absolute inset-1 rounded-xl border border-white/25 pointer-events-none" />

      {/* No Mercy indicator */}
      {isNoMercy && (
        <div className="absolute top-0 left-0 right-0 bg-red-600/80 text-[6px] sm:text-[8px] 
                        text-center font-bold tracking-wider py-0.5">
          NO MERCY
        </div>
      )}

      {/* Center value */}
      <span className={`${small ? 'text-sm' : 'text-xl sm:text-3xl'} font-black text-white tracking-wide drop-shadow-lg`}>
        {display}
      </span>

      {/* Type label */}
      <span className={`${small ? 'text-[5px]' : 'text-[7px] sm:text-[9px]'} text-white/70 
                        uppercase tracking-[0.18em] mt-1 font-semibold`}>
        {config.shortLabel}
      </span>

      {/* Corner values */}
      <span className="absolute top-1.5 left-2 text-[8px] sm:text-[11px] font-bold text-white/85">
        {display}
      </span>
      <span className="absolute bottom-1.5 right-2 text-[8px] sm:text-[11px] font-bold text-white/85 rotate-180">
        {display}
      </span>

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/10 pointer-events-none rounded-2xl" />
    </motion.div>
  );
};

export default Card;