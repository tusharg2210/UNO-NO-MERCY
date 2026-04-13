import React from 'react';

const CardBack = ({ small = false }) => {
  return (
    <div
      className={`
        ${small ? 'w-8 h-12' : 'w-14 h-20'}
        rounded-xl border-2 border-white/20
        bg-gradient-to-br from-slate-900 via-indigo-950 to-black
        flex items-center justify-center
        card-shadow relative overflow-hidden
      `}
    >
      <div className="absolute inset-1 rounded-lg border border-white/15" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_45%)]" />
      <div className="text-center">
        <span className={`${small ? 'text-[6px]' : 'text-[10px]'} font-black text-white/70 tracking-[0.2em]`}>
          UNO
        </span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent 
                      pointer-events-none rounded-xl" />
    </div>
  );
};

export default CardBack;