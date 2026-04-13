/** Matches server DRAW_AMOUNTS / stackable draw values */
export const DRAW_STACK_VALUES = {
  draw_two: 2,
  draw_four: 4,
  wild_draw_four: 4,
  reverse_draw_four: 4,
  wild_draw_six: 6,
  wild_draw_ten: 10,
};

export function getStackablePlayableFilter(topCard) {
  const topAmt = topCard ? DRAW_STACK_VALUES[topCard.type] || 0 : 0;
  return (card) => {
    const amt = DRAW_STACK_VALUES[card.type];
    if (!amt) return false;
    if (!topAmt) return true;
    return amt >= topAmt;
  };
}
