import React from 'react';
import Card from './Card';

/**
 * Fixed-size cards in a single row; scroll horizontally when the hand is wider than the viewport.
 */
const PlayerHand = ({ cards, onPlayCard, isMyTurn, playableCards = [] }) => {
  return (
    <div
      className="w-full max-w-full overflow-x-auto overflow-y-visible scroll-smooth pb-3 pt-6 min-[400px]:pt-10"
      style={{
        WebkitOverflowScrolling: 'touch',
        paddingLeft: 'max(0.25rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.25rem, env(safe-area-inset-right))',
      }}
    >
      <div
        className="flex w-max min-w-full min-h-[8.5rem] flex-nowrap items-end justify-center gap-1.5 px-1 min-[400px]:min-h-[9.75rem] min-[400px]:gap-2 sm:min-h-[11rem] sm:gap-2.5 sm:px-3"
      >
        {cards.map((card, index) => {
          const isPlayable = isMyTurn && playableCards.some((pc) => pc.id === card.id);
          return (
            <div key={card.id} className="flex-shrink-0 relative" style={{ zIndex: index + 1 }}>
              <Card
                card={card}
                onClick={onPlayCard}
                playable={isPlayable}
                index={index}
                small={false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerHand;
