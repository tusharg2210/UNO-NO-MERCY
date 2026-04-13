import React from 'react';
import logo from '../../assets/UNO_Logo.svg';

const CardBack = ({ small = false, deck = false, className = '' }) => {
  const size =
    small
      ? 'w-8 h-12 rounded-xl'
      : deck
        ? 'w-[4.5rem] h-[6.75rem] rounded-2xl sm:w-20 sm:h-28 md:w-24 md:h-36'
        : 'w-14 h-20 rounded-xl';
  return (
    <div
      className={`
        ${size}
        border-2 border-white/20
        bg-gradient-to-br from-slate-900 via-red-950/80 to-black
        flex items-center justify-center
        card-shadow relative overflow-hidden
        ${className}
      `}
    >
      <div className="absolute inset-1 rounded-lg border border-white/15" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_45%)]" />
      <img
        src={logo}
        alt=""
        className={`${
          small ? 'w-5 h-5' : deck ? 'w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20' : 'w-10 h-10'
        } object-contain opacity-95`}
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent 
                      pointer-events-none rounded-xl" />
    </div>
  );
};

export default CardBack;
