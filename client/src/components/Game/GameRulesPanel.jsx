import React, { useState } from 'react';

const SECTIONS = [
  {
    title: 'Objective',
    body: 'Be the first to play your final card. You win the round when your last card hits the discard pile.',
  },
  {
    title: 'Calling UNO!',
    body: 'With exactly one card left, you must call UNO. If another player calls you out before the next player starts their turn, you draw 2 cards.',
  },
  {
    title: 'Winning',
    body: 'Win immediately when you play your last card. If everyone else is eliminated by the Mercy rule, the last player standing wins.',
  },
  {
    title: 'Stacking (draw cards)',
    body: '+2, +4, +6, and +10 (and matching wild draw cards) can stack. You may play a draw card of equal or higher value. Penalties add up (e.g. +4 then +6 = draw 10). If you cannot stack, you draw the full total and skip your turn.',
  },
  {
    title: 'Mercy rule',
    body: 'At 25+ cards you are eliminated. Your cards are shuffled back into the draw pile immediately. If only one player is still in the game (for example the other person in a 2-player match), they win immediately.',
  },
  {
    title: '7 plus swap',
    body: 'Play a 7 to swap your entire hand with a player you choose. With only one other player, the swap is automatic.',
  },
  {
    title: "0's pass",
    body: 'All active players pass hands to the next player in the current direction. With 2 players, you simply swap hands.',
  },
  {
    title: 'Action cards',
    body: 'Skip: next player skips. Reverse: flips direction; with 2 players it acts like a skip and you go again. Draw Two / Draw Four: add to the stack or resolve. Discard All: discard every card in your hand that matches that color. Skip Everyone: every other player is skipped — you take another turn immediately.',
  },
  {
    title: 'Wild cards',
    body: 'Wild Reverse +4: reverses direction, adds +4 to the stack (stacking rules apply). Wild +6 / +10: add to stack. Wild Color Roulette: you choose the color; the next player reveals from the draw pile until that color (wilds do not count) and keeps all revealed cards, then loses their turn.',
  },
  {
    title: '2-player notes',
    body: 'Reverse = skip (you go again). Skip = opponent skips (you go again). Skip Everyone = same as skip. Stacking still bounces penalties until someone cannot continue.',
  },
];

function RulesBody() {
  return (
    <>
      <div className="px-4 py-3 border-b border-white/10 shrink-0">
        <h2 className="text-sm font-bold uppercase tracking-widest text-white/90">UNO No Mercy</h2>
        <p className="text-[11px] text-gray-500 mt-0.5">Quick reference — same rules as the physical deck.</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h3 className="text-xs font-semibold text-amber-200/95 mb-1.5">{s.title}</h3>
            <p className="text-[11px] leading-relaxed text-gray-400">{s.body}</p>
          </section>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-white/10 text-[10px] text-gray-600 shrink-0">
        Keys: <kbd className="px-1 py-0.5 rounded bg-white/10 text-gray-400">D</kbd> Draw ·{' '}
        <kbd className="px-1 py-0.5 rounded bg-white/10 text-gray-400">U</kbd> UNO ·{' '}
        <kbd className="px-1 py-0.5 rounded bg-white/10 text-gray-400">C</kbd> Catch UNO
      </div>
    </>
  );
}

export default function GameRulesPanel({ className = '', mobileOpen, onMobileOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const drawerOpen = mobileOpen !== undefined ? mobileOpen : internalOpen;
  const setDrawerOpen = onMobileOpenChange ?? setInternalOpen;

  return (
    <>
      <aside
        id="game-rules-aside"
        className={`hidden xl:flex flex-col max-h-[min(calc(100dvh-2rem),calc(100vh-2rem))] rounded-2xl border border-white/10 bg-slate-950/85 backdrop-blur-md w-[min(100%,280px)] shrink-0 overflow-hidden ${className}`}
      >
        <RulesBody />
      </aside>

      {drawerOpen && (
        <div
          className="xl:hidden fixed inset-0 z-40 flex justify-end bg-black/60"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="flex h-full max-h-[100dvh] w-[min(100vw,320px)] flex-col overflow-hidden border-l border-white/10 bg-slate-950 shadow-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 shrink-0">
              <span className="text-sm font-semibold text-white">Rules</span>
              <button
                type="button"
                className="text-gray-400 text-lg leading-none px-2"
                onClick={() => setDrawerOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <RulesBody />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
