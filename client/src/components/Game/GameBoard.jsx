import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext.jsx';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Card from '../Cards/Card.jsx';
import CardBack from '../Cards/CardBack.jsx';
import PlayerHand from '../Cards/PlayerHand.jsx';
import { getStackablePlayableFilter } from '../../utils/drawStack.js';
import ColorPicker from '../UI/ColorPicker.jsx';
import SwapPicker from '../UI/SwapPicker.jsx';
import OpponentRow from './OpponentRow.jsx';
import GameOverModal from '../UI/GameOverModal.jsx';
import EffectsBanner from '../UI/EffectsBanner.jsx';
import GameRulesPanel from './GameRulesPanel.jsx';

const GameBoard = ({ roomCode, user, onLeave }) => {
  const { socket, isConnected } = useSocket();
  const [gameState, setGameState] = useState(null);
  const [hand, setHand] = useState([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSwapPicker, setShowSwapPicker] = useState(false);
  const [pendingCard, setPendingCard] = useState(null);
  const [pendingSwapTargetId, setPendingSwapTargetId] = useState(null);
  const [pendingSevenCard, setPendingSevenCard] = useState(null);
  const [effects, setEffects] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [rulesDrawerOpen, setRulesDrawerOpen] = useState(false);
  // ⚠️ FIX: Add timeout for loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!gameState) {
        setLoadingTimeout(true);
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timer);
  }, [gameState]);

  // Rejoin after refresh or Socket.IO reconnect during an active match
  useEffect(() => {
    if (!socket || !roomCode || !user) return;

    const payload = () => ({
      roomCode,
      username: user.username,
      userId: user.id,
    });

    const tryRejoin = () => socket.emit('reconnect-game', payload());

    socket.on('connect', tryRejoin);
    if (socket.connected) tryRejoin();

    return () => socket.off('connect', tryRejoin);
  }, [socket, roomCode, user]);

  useEffect(() => {
    if (!socket) return;

    const handleGameStarted = ({ hand, gameState }) => {
      setHand(hand || []);
      setGameState(gameState);
      setGameOver(false);
      setWinner(null);
      setLoadingTimeout(false);
      toast('Game started', {
        icon: '',
        style: { background: '#16A34A', color: '#fff' },
      });
    };

    const handleGameStateUpdate = ({ hand, gameState }) => {
      if (hand) setHand(hand);
      if (gameState) setGameState(gameState);
      setLoadingTimeout(false);
    };

    const handleCardPlayed = ({ hand, gameState, effects, gameOver: isOver, winner: w, winnerUsername }) => {
      setHand(hand || []);
      setGameState(gameState);
      if (effects?.message) {
        setEffects(effects);
        setTimeout(() => setEffects(null), 3000);
      }
      if (isOver) {
        setGameOver(true);
        setWinner(w);
      }
    };

    const handleCardDrawn = ({
      hand,
      gameState,
      gameOver: isOver,
      winner: w,
    }) => {
      setHand(hand || []);
      setGameState(gameState);
      if (isOver) {
        setGameOver(true);
        setWinner(w);
      }
    };

    const handleUnoCalled = ({ username }) => {
      toast(`${username} said UNO`, {
        icon: '',
        style: { background: '#DC2626', color: '#fff' },
      });
    };

    const handleUnoCaught = ({
      hand,
      gameState,
      catcher,
      caught,
      gameOver: isOver,
      winner: w,
    }) => {
      setHand(hand || []);
      setGameState(gameState);
      if (isOver) {
        setGameOver(true);
        setWinner(w);
      }
      toast(`${catcher} caught ${caught}. +2 cards`, {
        icon: '',
        style: { background: '#DC2626', color: '#fff' },
      });
    };

    const handleError = ({ message }) => {
      toast.error(message);
    };



    const handleReconnected = ({ hand, gameState: gs }) => {
      if (hand) setHand(hand);
      if (gs) setGameState(gs);
      setLoadingTimeout(false);
    };

    const handlePeerReconnected = ({ username }) => {
      toast(`${username} reconnected`, { icon: '' });
    };
    socket.on('game-started', handleGameStarted);
    socket.on('game-state-update', handleGameStateUpdate);
    socket.on('card-played', handleCardPlayed);
    socket.on('card-drawn', handleCardDrawn);
    socket.on('uno-called', handleUnoCalled);
    socket.on('uno-caught', handleUnoCaught);
    socket.on('player-disconnected', ({ username }) => {
      toast(`${username} disconnected`, { icon: '' });
    });
    socket.on('game-over', ({ winner: w, winnerUsername, reason, gameState: gs, hand: h }) => {
      if (gs) setGameState(gs);
      if (h !== undefined) setHand(h);
      setGameOver(true);
      if (w != null) setWinner(w);
      toast(`Game over. ${winnerUsername} wins (${reason})`, { icon: '' });
    });
    socket.on('error', handleError);
    socket.on('reconnected', handleReconnected);
    socket.on('player-reconnected', handlePeerReconnected);

    return () => {
      socket.off('game-started', handleGameStarted);
      socket.off('game-state-update', handleGameStateUpdate);
      socket.off('card-played', handleCardPlayed);
      socket.off('card-drawn', handleCardDrawn);
      socket.off('uno-called', handleUnoCalled);
      socket.off('uno-caught', handleUnoCaught);
      socket.off('player-disconnected');
      socket.off('game-over');
      socket.off('error', handleError);
      socket.off('reconnected', handleReconnected);
      socket.off('player-reconnected', handlePeerReconnected);
    };
  }, [socket]);

  const isMyTurn = useCallback(() => {
    if (!gameState || !socket) return false;
    const me = gameState.players.find((p) => p.id === socket.id);
    if (me?.knockedOut) return false;
    return gameState.players[gameState.currentPlayerIndex]?.id === socket.id;
  }, [gameState, socket]);

  const getPlayableCards = useCallback(() => {
    if (!gameState || !isMyTurn()) return [];
    const topCard = gameState.topCard;

    return hand.filter(card => {
      if (gameState.drawStack > 0) {
        return getStackablePlayableFilter(topCard)(card);
      }
      if (!card.color) return true;
      if (card.type === 'discard_all') return card.color === gameState.currentColor;
      return card.color === gameState.currentColor ||
        card.value === topCard?.value ||
        card.type === topCard?.type;
    });
  }, [gameState, hand, isMyTurn]);

  const handlePlayCard = (card) => {
    if (!isMyTurn() || !gameState || !socket) return;
    const aliveOpp = gameState.players.filter(
      (p) => p.id !== socket.id && !p.knockedOut
    );
    const wildTypes = [
      'wild',
      'wild_draw_four',
      'wild_draw_six',
      'wild_draw_ten',
      'reverse_draw_four',
      'wild_color_roulette',
    ];
    if (card.type === 'number' && card.value === 7) {
      if (aliveOpp.length === 1) {
        socket.emit('play-card', {
          roomCode,
          cardId: card.id,
          swapTargetId: aliveOpp[0].id,
        });
        return;
      }
      setPendingSevenCard(card);
      setShowSwapPicker(true);
      return;
    }
    if (card.type === 'swap_hands') {
      if (aliveOpp.length === 1) {
        setPendingCard(card);
        setPendingSwapTargetId(aliveOpp[0].id);
        setShowColorPicker(true);
        return;
      }
      setPendingCard(card);
      setShowSwapPicker(true);
      return;
    }
    if (wildTypes.includes(card.type)) {
      setPendingCard(card);
      setShowColorPicker(true);
      return;
    }
    socket.emit('play-card', { roomCode, cardId: card.id });
  };

  const handleColorChoice = (color) => {
    if (pendingSwapTargetId && pendingCard?.type === 'swap_hands') {
      socket.emit('play-card', {
        roomCode,
        cardId: pendingCard.id,
        swapTargetId: pendingSwapTargetId,
        chosenColor: color,
      });
      setShowColorPicker(false);
      setPendingCard(null);
      setPendingSwapTargetId(null);
      return;
    }
    if (!pendingCard) return;
    socket.emit('play-card', {
      roomCode, cardId: pendingCard.id, chosenColor: color,
    });
    setShowColorPicker(false);
    setPendingCard(null);
  };

  const handleSwapChoice = (targetId) => {
    if (pendingSevenCard) {
      socket.emit('play-card', {
        roomCode,
        cardId: pendingSevenCard.id,
        swapTargetId: targetId,
      });
      setPendingSevenCard(null);
      setShowSwapPicker(false);
      return;
    }
    setPendingSwapTargetId(targetId);
    setShowSwapPicker(false);
    setShowColorPicker(true);
  };

  const handleDrawCard = useCallback(() => {
    if (!socket || !roomCode || !gameState) return;
    if (!isMyTurn()) return;
    const me = gameState.players.find((p) => p.id === socket.id);
    if (me?.knockedOut) {
      toast.error('You are out of this game.');
      return;
    }
    socket.emit('draw-card', { roomCode });
  }, [socket, roomCode, gameState, isMyTurn]);

  const handleSayUno = useCallback(() => {
    if (!socket || !roomCode) return;
    socket.emit('say-uno', { roomCode });
  }, [socket, roomCode]);

  const handleCatchUno = useCallback(
    (targetId) => {
      if (!socket || !roomCode) return;
      socket.emit('catch-uno', { roomCode, targetPlayerId: targetId });
    },
    [socket, roomCode]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (gameOver) return;
      const k = e.key.toLowerCase();
      if (k === 'u') {
        e.preventDefault();
        const me = gameState?.players.find((p) => p.id === socket?.id);
        if (me?.knockedOut || hand.length > 2) return;
        handleSayUno();
      }
      if (k === 'c') {
        e.preventDefault();
        if (!gameState || !socket) return;
        const me = gameState.players.find((p) => p.id === socket.id);
        if (me?.knockedOut) return;
        const target = gameState.players.find(
          (p) =>
            p.id !== socket.id &&
            !p.knockedOut &&
            p.cardCount === 1 &&
            !p.saidUno
        );
        if (target) handleCatchUno(target.id);
        else toast('No one to catch right now.', { icon: '' });
      }
      if (k === 'd') {
        e.preventDefault();
        handleDrawCard();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState, socket, hand.length, handleSayUno, handleCatchUno, handleDrawCard, gameOver]);

  if (!gameState) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center overflow-x-hidden bg-[radial-gradient(circle_at_top,#111827_0%,#020617_55%,#020617_100%)] px-4">
        <div className="animate-fade-in mx-auto max-w-md p-6 text-center">
          <div className="text-4xl mb-4 font-semibold tracking-wide text-slate-200">UNO</div>
          <p className="text-gray-300 text-lg mb-2">Loading game...</p>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? 'Connected to server' : 'Not connected'}
            </span>
          </div>

          {/* Progress bar */}
          {!loadingTimeout && (
            <div className="mt-4 w-48 h-1.5 bg-white/10 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse w-3/4" />
            </div>
          )}

          {/* ⚠️ Timeout - show error & options */}
          {loadingTimeout && (
            <div className="mt-6 glass p-4">
              <p className="text-red-400 font-semibold mb-2">Game loading timed out</p>
              <p className="text-gray-400 text-xs mb-4">
                The game-started event was not received. This usually means:
              </p>
              <ul className="text-gray-400 text-xs text-left space-y-1 mb-4">
                <li>• Backend server is sleeping (free tier) - wait and retry</li>
                <li>• Socket connection was lost during game start</li>
                <li>• Room may no longer exist</li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Try to re-request game state
                    socket?.emit('get-game-state', { roomCode });
                    setLoadingTimeout(false);
                    setTimeout(() => {
                      if (!gameState) setLoadingTimeout(true);
                    }, 10000);
                  }}
                  className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-xl 
                             text-sm font-semibold transition-all"
                >
                  Retry
                </button>
                <button
                  onClick={onLeave}
                  className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 rounded-xl 
                             text-sm font-semibold transition-all"
                >
                  ← Back to Lobby
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================
  // GAME BOARD (when gameState exists)
  // ============================
  const myPlayer = gameState.players.find(p => p.id === socket?.id);
  const imSpectating = !!myPlayer?.knockedOut;
  const opponents = gameState.players.filter(p => p.id !== socket?.id);
  const currentPlayerName = gameState.players[gameState.currentPlayerIndex]?.username;

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_top,#111827_0%,#020617_55%,#020617_100%)] pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex min-h-0 w-full max-w-[1920px] flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {/* Top Bar */}
          <div className="relative z-20 mx-2 mt-2 flex shrink-0 flex-col gap-2 rounded-xl glass-dark px-2 py-2 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <button onClick={onLeave}
                className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
                ← Leave
              </button>
              <span className="min-w-0 truncate text-xs text-gray-400 min-[380px]:text-sm">
                <span className="hidden min-[400px]:inline">Room: </span>
                <span className="font-mono text-white">{roomCode}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-[480px]:justify-end">
              <button
                type="button"
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-500/35 hover:bg-amber-500/30 transition-colors"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches) {
                    document.getElementById('game-rules-aside')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  } else {
                    setRulesDrawerOpen(true);
                  }
                }}
              >
                Rules
              </button>
              <div className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 sm:px-3">
                <span className={`inline-block text-base sm:text-lg ${gameState.direction === 1 ? '' : 'scale-x-[-1]'}`}>↻</span>
                <span className="hidden text-xs text-gray-400 sm:inline">{gameState.direction === 1 ? 'CW' : 'CCW'}</span>
              </div>
              {gameState.drawStack > 0 && (
                <div
                  className="bg-gradient-to-r from-red-700/90 to-orange-700/85 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold text-white border border-orange-400/40 shadow-lg shadow-red-900/30 animate-pulse tabular-nums"
                  title="Total cards the next player must draw if they do not stack"
                >
                  Stack +{gameState.drawStack}
                </div>
              )}
              <div className={`w-6 h-6 rounded-full border-2 border-white/30 ${gameState.currentColor === 'red' ? 'bg-red-500' :
                  gameState.currentColor === 'blue' ? 'bg-blue-500' :
                    gameState.currentColor === 'green' ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
            </div>
          </div>

          <AnimatePresence>{effects && <EffectsBanner effects={effects} />}</AnimatePresence>

          {imSpectating && (
            <div className="relative z-20 mx-2 mt-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-center text-xs leading-snug text-amber-100 sm:mx-4 sm:text-sm">
              You are out (Mercy: 25+ cards). Your cards were shuffled back into the draw pile. You can watch until the game ends.
            </div>
          )}

          {/* Opponents */}
          <div className="relative z-10 flex-shrink-0 px-2 py-2 sm:px-4 sm:py-3">
            <OpponentRow opponents={opponents} currentPlayerIndex={gameState.currentPlayerIndex}
              players={gameState.players} onCatchUno={handleCatchUno} />
          </div>

          {/* Table — draw & discard */}
          <div className="relative z-10 flex min-h-[180px] flex-1 items-center justify-center px-2 py-3 sm:px-3 sm:py-4">
            <div
              className="relative w-full max-w-xl rounded-3xl border border-emerald-800/50 bg-gradient-to-b from-emerald-950 via-emerald-950/92 to-[#042f1f] px-4 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_25px_50px_rgba(0,0,0,0.45)] sm:rounded-[2rem] sm:px-8 sm:py-10"
            >
              <div className="absolute inset-2 rounded-[1.65rem] border border-emerald-700/20 pointer-events-none" />
              {gameState.drawStack > 0 && (
                <div className="relative z-10 flex justify-center px-2 mb-1 sm:mb-2">
                  <div className="rounded-2xl border-2 border-orange-400/60 bg-gradient-to-b from-red-950/95 via-neutral-950/92 to-neutral-950/95 px-4 sm:px-6 py-2.5 text-center shadow-[0_12px_40px_rgba(185,28,28,0.25)] max-w-[min(100%,20rem)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-200/95">Draw stack</p>
                    <p className="text-2xl sm:text-3xl font-black tabular-nums text-white leading-tight mt-0.5">
                      +{gameState.drawStack} <span className="text-sm sm:text-base font-bold text-white/80">cards</span>
                    </p>
                    <p className="text-[10px] text-white/55 mt-1 leading-snug">
                      Keeps growing while players stack +2 / +4 / wild draws; resets when someone draws.
                    </p>
                  </div>
                </div>
              )}
              <div className="relative flex w-full flex-col items-center justify-center gap-8 min-[420px]:flex-row min-[420px]:gap-10 sm:gap-16">
                <button type="button" onClick={handleDrawCard} disabled={!isMyTurn() || imSpectating}
                  className={`relative flex flex-col items-center gap-1 ${isMyTurn() && !imSpectating ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-80'} transition-transform`}>
                  <CardBack deck className={isMyTurn() && !imSpectating ? 'border-emerald-400/50' : 'border-white/15'} />
                  <span className="max-w-[8rem] text-center text-[10px] font-medium tabular-nums text-emerald-200/70 min-[420px]:max-w-[6.5rem]">
                    {gameState.drawStack > 0 ? (
                      <>Draw stack · +{gameState.drawStack}</>
                    ) : (
                      <>Draw {typeof gameState.drawPile === 'number' ? `· ${gameState.drawPile}` : ''}</>
                    )}
                  </span>
                </button>
                {gameState.topCard && <Card card={gameState.topCard} />}

              </div>
            </div>
          </div>

          {/* Turn Indicator */}
          <div className="relative z-10 shrink-0 px-2 py-2 text-center">
            <div className={`inline-flex max-w-[calc(100vw-1rem)] items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold sm:px-4 sm:text-sm
          ${imSpectating ? 'bg-amber-500/15 text-amber-200/90 border border-amber-500/25'
                : isMyTurn() ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10'}`}>
              <div className={`h-2 w-2 shrink-0 rounded-full ${imSpectating ? 'bg-amber-400' : isMyTurn() ? 'animate-pulse bg-green-500' : 'bg-gray-600'}`} />
              <span className="min-w-0 truncate">
                {imSpectating ? 'Spectating' : isMyTurn() ? 'Your turn' : `${currentPlayerName}'s turn`}
              </span>
            </div>
            {!imSpectating && (
              <p className="mt-1.5 hidden text-[10px] text-gray-500 sm:block">
                Shortcuts: <kbd className="rounded bg-white/10 px-1">D</kbd> draw ·{' '}
                <kbd className="rounded bg-white/10 px-1">U</kbd> UNO ·{' '}
                <kbd className="rounded bg-white/10 px-1">C</kbd> catch UNO
              </p>
            )}
          </div>

          {/* Player Hand */}
          <div
            className="relative z-10 flex-shrink-0"
            style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
          >
            <div className="flex flex-wrap items-center justify-center gap-2 px-2 pb-2 sm:gap-3">
              {!imSpectating && hand.length <= 2 && (
                <button type="button" onClick={handleSayUno}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold text-base px-5 py-2 rounded-full
                transition-all duration-200">
                  UNO
                </button>
              )}
              <div className="bg-white/5 px-3 py-1 rounded-full text-xs text-gray-400">{hand.length} cards</div>
            </div>
            <div className="glass-dark mx-1 mb-1 flex min-h-[140px] items-end justify-center overflow-visible rounded-t-2xl py-2 min-[400px]:mx-2 min-[400px]:mb-2 min-[400px]:min-h-[180px]">
              <PlayerHand
                cards={hand}
                onPlayCard={handlePlayCard}
                isMyTurn={isMyTurn() && !imSpectating}
                playableCards={getPlayableCards()}
              />
            </div>
          </div>

        </div>
        <GameRulesPanel
          className="self-stretch"
          mobileOpen={rulesDrawerOpen}
          onMobileOpenChange={setRulesDrawerOpen}
        />
      </div>

      <AnimatePresence>
        {showColorPicker && (
          <ColorPicker
            onSelectColor={handleColorChoice}
            title={
              pendingCard?.type === 'wild_color_roulette'
                ? 'Wild Color Roulette'
                : pendingSwapTargetId
                  ? 'Choose color after swap'
                  : 'Choose a Color'
            }
            subtitle={
              pendingCard?.type === 'wild_color_roulette'
                ? 'Pick the color the next player must reveal until they draw from the pile.'
                : pendingSwapTargetId
                  ? 'Pick the active color for the discard pile after swapping hands.'
                  : 'Select the color for your wild card (including Reverse +4).'
            }
            allowCancel
            onClose={() => {
              setShowColorPicker(false);
              setPendingCard(null);
              setPendingSwapTargetId(null);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSwapPicker && (
          <SwapPicker
            title={pendingSevenCard ? '7 plus swap' : 'Swap Hands'}
            subtitle={
              pendingSevenCard
                ? 'Choose a player to swap your entire hand with.'
                : 'Choose a player to swap hands with.'
            }
            opponents={opponents.filter((o) => !o.knockedOut)}
            onSelectPlayer={handleSwapChoice}
            onClose={() => {
              setShowSwapPicker(false);
              setPendingCard(null);
              setPendingSwapTargetId(null);
              setPendingSevenCard(null);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {gameOver && <GameOverModal winner={winner} players={gameState.players} onLeave={onLeave} />}
      </AnimatePresence>
    </div>
  );
};

export default GameBoard;
