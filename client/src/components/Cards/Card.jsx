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
  wild_color_roulette: { getDisplay: () => 'ROULETTE', shortLabel: 'color roulette' },
};

const COLOR_CLASSES = {
  red: 'card-gradient-red',
  blue: 'card-gradient-blue',
  green: 'card-gradient-green',
  yellow: 'card-gradient-yellow',
  null: 'card-gradient-wild',
  undefined: 'card-gradient-wild',
};

/** Compact index glyphs — keeps corners clear of the center title. */
function cornerGlyph(card) {
  if (card.type === 'number') return String(card.value);
  const g = {
    skip: 'S',
    reverse: 'R',
    draw_two: '2',
    draw_four: '4',
    wild: 'W',
    wild_draw_four: '4',
    skip_everyone: 'SE',
    wild_draw_six: '6',
    wild_draw_ten: '10',
    discard_all: 'A',
    reverse_draw_four: 'R4',
    swap_hands: 'X',
    wild_color_roulette: 'Rt',
  };
  return g[card.type] ?? '?';
}

const Card = ({ card, onClick, playable = false, index = 0, small = false }) => {
  const config = CARD_CONFIG[card.type] || { getDisplay: () => '?', shortLabel: 'unknown' };
  const colorClass = COLOR_CLASSES[card.color] || 'card-gradient-wild';
  const display = config.getDisplay(card);
  const shortLabel =
    card.type === 'number' && card.value === 7 ? '7 plus swap' : config.shortLabel;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.02,
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={playable ? { y: -12, scale: 1.05, zIndex: 50 } : {}}
      whileTap={playable ? { scale: 0.98 } : {}}
      onClick={() => playable && onClick?.(card)}
      className={`
        ${small ? 'w-14 h-20' : 'w-[4.1rem] h-[6.35rem] min-[400px]:w-[4.75rem] min-[400px]:h-[7.25rem] sm:w-24 sm:h-36'}
        ${colorClass}
        rounded-2xl border-2
        ${playable
          ? 'border-white/40 cursor-pointer hover:border-white hover:shadow-xl hover:shadow-white/25'
          : 'border-white/20 opacity-70 cursor-not-allowed'
        }
        flex flex-col items-center justify-center relative overflow-hidden select-none
        px-1 pt-5 pb-5 card-shadow transition-all duration-200
      `}
    >
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/25 via-transparent to-black/10 pointer-events-none rounded-2xl" />
      <div className="absolute inset-1 rounded-xl border border-white/25 pointer-events-none z-10" />

      <div className="relative z-20 flex flex-col items-center justify-center px-0.5 min-h-0 w-full">
        <span
          className={`${small ? 'text-sm' : 'text-[10px] sm:text-xs'} font-black text-white text-center tracking-tight drop-shadow-md leading-tight w-full px-0.5 break-words hyphens-auto`}
        >
          {display}
        </span>
        <span
          className={`${small ? 'text-[5px]' : 'text-[6px] sm:text-[8px]'} text-white/80 mt-1 font-semibold px-1 text-center leading-snug w-full
            ${card.type === 'number' && card.value === 7 ? 'normal-case' : 'uppercase'}`}
        >
          {shortLabel}
        </span>
      </div>

      <span className="absolute top-1 left-1 z-20 text-[7px] sm:text-[9px] font-bold text-white/90 leading-none">
        {cornerGlyph(card)}
      </span>
      <span className="absolute bottom-1 right-1 z-20 text-[7px] sm:text-[9px] font-bold text-white/90 leading-none rotate-180">
        {cornerGlyph(card)}
      </span>
    </motion.div>
  );
};

export default Card;