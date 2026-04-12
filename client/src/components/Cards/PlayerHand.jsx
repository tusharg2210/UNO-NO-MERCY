import React from 'react';
import Card from './Card';

const PlayerHand = ({ cards, onPlayCard, isMyTurn, playableCards = [] }) => {
  return (
    <div className="flex justify-center items-end gap-[-8px] flex-wrap px-4 pb-4 max-w-full overflow-x-auto">
      <div className="flex items-end" style={{ gap: cards.length > 10 ? '-12px' : '-4px' }}>
        {cards.map((card, index) => {
          const isPlayable = isMyTurn && playableCards.some(pc => pc.id === card.id);
          return (
            <div
              key={card.id}
              style={{
                marginLeft: index === 0 ? 0 : cards.length > 10 ? '-12px' : '-4px',
                zIndex: index,
              }}
            >
              <Card
                card={card}
                onClick={onPlayCard}
                playable={isPlayable}
                index={index}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerHand;