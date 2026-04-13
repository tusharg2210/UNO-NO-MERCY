import React from 'react';
import Card from './Card';

/**
 * Fixed-size cards in a single row; scroll horizontally when the hand is wider than the viewport.
 */
const PlayerHand = ({ cards, onPlayCard, isMyTurn, playableCards = [] }) => {
  return (
    <div
      className="w-full max-w-full overflow-x-auto overflow-y-visible scroll-smooth pb-3 pt-10"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div
        className="flex flex-nowrap items-end justify-center gap-2 sm:gap-2.5 w-max min-w-full px-2 sm:px-3 min-h-[9.75rem] sm:min-h-[11rem]"
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
