import React from 'react';

const CardBack = ({ small = false }) => {
  return (
    <div
      className={`
        ${small ? 'w-8 h-12' : 'w-14 h-20'}
        rounded-lg border-2 border-white/20
        bg-gradient-to-br from-red-800 via-red-900 to-black
        flex items-center justify-center
        card-shadow relative overflow-hidden
      `}
    >
      <div className="absolute inset-1 rounded-md border border-white/10" />
      <div className="text-center">
        <span className={`${small ? 'text-[6px]' : 'text-[10px]'} font-black text-white/60 tracking-wider`}>
          UNO
        </span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent 
                      pointer-events-none rounded-lg" />
    </div>
  );
};

export default CardBack;