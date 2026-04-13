import React from 'react';
import logo from '../../assets/UNO_Logo.svg';

const CardBack = ({ small = false, deck = false, className = '' }) => {
  const size =
    small ? 'w-8 h-12 rounded-xl' : deck ? 'w-20 h-28 sm:w-24 sm:h-36 rounded-2xl' : 'w-14 h-20 rounded-xl';
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
          small ? 'w-5 h-5' : deck ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-10 h-10'
        } object-contain opacity-95`}
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent 
                      pointer-events-none rounded-xl" />
    </div>
  );
};

export default CardBack;
