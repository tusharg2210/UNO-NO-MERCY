import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Card from '../Cards/Card.jsx';
import CardBack from '../Cards/CardBack.jsx';
import PlayerHand from '../Cards/PlayerHand.jsx';
import ColorPicker from '../UI/ColorPicker.jsx';
import SwapPicker from '../UI/SwapPicker.jsx';
import OpponentRow from './OpponentRow.jsx';
import GameOverModal from '../UI/GameOverModal.jsx';
import EffectsBanner from '../UI/EffectsBanner.jsx';

const GameBoard = ({ roomCode, user, onLeave }) => {
  const { socket, isConnected } = useSocket();
  const [gameState, setGameState] = useState(null);
  const [hand, setHand] = useState([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSwapPicker, setShowSwapPicker] = useState(false);
  const [pendingCard, setPendingCard] = useState(null);
  const [effects, setEffects] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const rouletteSelectionPending =
    gameState?.pendingRoulette?.targetPlayerId === socket?.id;

  // ⚠️ FIX: Add timeout for loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!gameState) {
        setLoadingTimeout(true);
        console.error('⏰ Game loading timed out. No game-started event received.');
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timer);
  }, [gameState]);

  // ⚠️ FIX: Request game state on mount
  useEffect(() => {
    if (!socket || !roomCode) return;

    console.log('📤 Requesting game state for room:', roomCode);

    // Try to get game state in case we missed the event
    socket.emit('get-game-state', { roomCode });
  }, [socket, roomCode]);

  useEffect(() => {
    if (!socket) return;

    const handleGameStarted = ({ hand, gameState }) => {
      console.log('🎮 game-started received!', { handSize: hand?.length, gameState: !!gameState });
      setHand(hand || []);
      setGameState(gameState);
      setLoadingTimeout(false);
      toast('Game started', {
        icon: '',
        style: { background: '#16A34A', color: '#fff' },
      });
    };

    const handleGameStateUpdate = ({ hand, gameState }) => {
      console.log('📦 game-state-update received!');
      if (hand) setHand(hand);
      if (gameState) setGameState(gameState);
      setLoadingTimeout(false);
    };

    const handleCardPlayed = ({ hand, gameState, effects, gameOver: isOver, winner: w, winnerUsername }) => {
      console.log('🃏 card-played received!');
      setHand(hand || []);
      setGameState(gameState);
      if (effects?.message) {
        setEffects(effects);
        setTimeout(() => setEffects(null), 3000);
        if (effects.type === 'roulette_pending') {
          toast('Wild roulette played. Next player must choose a color.', { icon: '' });
        }
      }
      if (isOver) {
        setGameOver(true);
        setWinner(w);
      }
    };

    const handleCardDrawn = ({ hand, gameState }) => {
      console.log('📥 card-drawn received!');
      setHand(hand || []);
      setGameState(gameState);
    };

    const handleUnoCalled = ({ username }) => {
      toast(`${username} said UNO`, {
        icon: '',
        style: { background: '#DC2626', color: '#fff' },
      });
    };

    const handleUnoCaught = ({ hand, gameState, catcher, caught }) => {
      setHand(hand || []);
      setGameState(gameState);
      toast(`${catcher} caught ${caught}. +4 penalty`, {
        icon: '',
        style: { background: '#DC2626', color: '#fff' },
      });
    };

    const handleError = ({ message }) => {
      console.error('❌ Game error:', message);
      toast.error(message);
    };

    // ⚠️ FIX: Listen for ALL relevant events
    socket.on('game-started', handleGameStarted);
    socket.on('game-state-update', handleGameStateUpdate);
    socket.on('card-played', handleCardPlayed);
    socket.on('card-drawn', handleCardDrawn);
    socket.on('uno-called', handleUnoCalled);
    socket.on('uno-caught', handleUnoCaught);
    socket.on('player-disconnected', ({ username }) => {
      toast(`${username} disconnected`, { icon: '' });
    });
    socket.on('game-over', ({ winnerUsername, reason }) => {
      setGameOver(true);
      toast(`Game over. ${winnerUsername} wins (${reason})`, { icon: '' });
    });
    socket.on('error', handleError);

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
    };
  }, [socket]);

  useEffect(() => {
    if (rouletteSelectionPending) {
      setShowColorPicker(true);
      setPendingCard(null);
    }
  }, [rouletteSelectionPending]);

  // ... (keep all existing handler functions same)

  const isMyTurn = useCallback(() => {
    if (!gameState) return false;
    return gameState.players[gameState.currentPlayerIndex]?.id === socket?.id;
  }, [gameState, socket]);

  const getPlayableCards = useCallback(() => {
    if (!gameState || !isMyTurn()) return [];
    const topCard = gameState.topCard;

    return hand.filter(card => {
      if (gameState.drawStack > 0) {
        return ['draw_two', 'draw_four', 'wild_draw_four', 'wild_draw_six',
                'wild_draw_ten', 'reverse_draw_four'].includes(card.type);
      }
      if (!card.color) return true;
      if (card.type === 'discard_all') return card.color === gameState.currentColor;
      return card.color === gameState.currentColor ||
             card.value === topCard?.value ||
             card.type === topCard?.type;
    });
  }, [gameState, hand, isMyTurn]);

  const handlePlayCard = (card) => {
    if (!isMyTurn()) return;
    const wildTypes = ['wild', 'wild_draw_four', 'wild_draw_six', 'wild_draw_ten'];
    if (card.type === 'swap_hands') {
      setPendingCard(card);
      setShowSwapPicker(true);
      return;
    }
    if (card.type === 'wild_color_roulette') {
      socket.emit('play-card', { roomCode, cardId: card.id });
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
    if (rouletteSelectionPending) {
      socket.emit('choose-roulette-color', { roomCode, chosenColor: color });
      setShowColorPicker(false);
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
    socket.emit('play-card', {
      roomCode, cardId: pendingCard.id, swapTargetId: targetId, chosenColor: 'red',
    });
    setShowSwapPicker(false);
    setPendingCard(null);
  };

  const handleDrawCard = () => {
    if (!isMyTurn()) return;
    socket.emit('draw-card', { roomCode });
  };

  const handleSayUno = () => {
    socket.emit('say-uno', { roomCode });
  };

  const handleCatchUno = (targetId) => {
    socket.emit('catch-uno', { roomCode, targetPlayerId: targetId });
  };

  // ⚠️ FIX: Better loading screen with debug info
  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,#111827_0%,#020617_55%,#020617_100%)]">
        <div className="text-center animate-fade-in max-w-md mx-auto p-6">
          <div className="text-4xl mb-4 font-semibold tracking-wide text-slate-200">UNO</div>
          <p className="text-gray-300 text-lg mb-2">Loading game...</p>
          
          {/* Connection Debug Info */}
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? 'Connected to server' : 'Not connected'}
              </span>
            </div>
            <p className="text-gray-500 text-xs">
              Room: {roomCode} | Socket: {socket?.id || 'none'}
            </p>
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
  const opponents = gameState.players.filter(p => p.id !== socket?.id);
  const currentPlayerName = gameState.players[gameState.currentPlayerIndex]?.username;
  const rouletteTargetName = gameState.pendingRoulette
    ? gameState.players.find((p) => p.id === gameState.pendingRoulette.targetPlayerId)?.username
    : null;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_top,#111827_0%,#020617_55%,#020617_100%)]">
      {/* ... rest of your game board UI stays the same ... */}
      
      {/* Top Bar */}
      <div className="relative z-20 flex items-center justify-between px-4 py-2 glass-dark mx-2 mt-2 rounded-xl">
        <div className="flex items-center gap-3">
          <button onClick={onLeave}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
            ← Leave
          </button>
          <span className="text-sm text-gray-400">Room: <span className="text-white font-mono">{roomCode}</span></span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full">
            <span className={`text-lg ${gameState.direction === 1 ? '' : 'scale-x-[-1]'} inline-block`}>↻</span>
            <span className="text-xs text-gray-400">{gameState.direction === 1 ? 'CW' : 'CCW'}</span>
          </div>
          {gameState.drawStack > 0 && (
            <div className="bg-red-600/80 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
              +{gameState.drawStack}
            </div>
          )}
          <div className={`w-6 h-6 rounded-full border-2 border-white/30 ${
            gameState.currentColor === 'red' ? 'bg-red-500' :
            gameState.currentColor === 'blue' ? 'bg-blue-500' :
            gameState.currentColor === 'green' ? 'bg-green-500' : 'bg-yellow-500'
          }`} />
        </div>
      </div>

      <AnimatePresence>{effects && <EffectsBanner effects={effects} />}</AnimatePresence>

      {/* Opponents */}
      <div className="relative z-10 flex-shrink-0 px-4 py-3">
        <OpponentRow opponents={opponents} currentPlayerIndex={gameState.currentPlayerIndex}
          players={gameState.players} onCatchUno={handleCatchUno} />
      </div>

      {/* Center Play Area */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="flex items-center gap-8 sm:gap-16">
          <button onClick={handleDrawCard} disabled={!isMyTurn()}
            className={`relative ${isMyTurn() ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'} transition-transform`}>
            <div className="relative w-20 h-28 sm:w-24 sm:h-36 rounded-xl bg-gradient-to-br from-red-800 via-red-900 to-black 
              border-2 ${isMyTurn() ? 'border-white/40' : 'border-white/20'} flex flex-col items-center justify-center card-shadow">
              <span className="text-white/60 font-black text-xs tracking-widest">UNO</span>
              <span className="text-white/40 text-[10px] mt-1">DRAW</span>
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">{gameState.drawPile} cards</p>
          </button>

          <div className="relative">
            {gameState.topCard && <Card card={gameState.topCard} />}
            <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold uppercase
              ${gameState.currentColor === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                gameState.currentColor === 'blue' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                gameState.currentColor === 'green' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
              {gameState.currentColor}
            </div>
          </div>
        </div>
      </div>

      {/* Turn Indicator */}
      <div className="relative z-10 text-center py-1">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold
          ${isMyTurn() ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                       : 'bg-white/5 text-gray-400 border border-white/10'}`}>
          <div className={`w-2 h-2 rounded-full ${isMyTurn() ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
          {isMyTurn() ? 'Your turn' : `${currentPlayerName}'s turn`}
        </div>
        {gameState.pendingRoulette && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <span>R</span>
            <span>Waiting for roulette color from {rouletteTargetName || 'next player'}</span>
          </div>
        )}
      </div>

      {/* Player Hand */}
      <div className="relative z-10 flex-shrink-0">
        <div className="flex items-center justify-center gap-3 pb-2">
          {hand.length <= 2 && (
            <button onClick={handleSayUno}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-base px-5 py-2 rounded-full
                transition-all duration-200">
              UNO
            </button>
          )}
          <div className="bg-white/5 px-3 py-1 rounded-full text-xs text-gray-400">{hand.length} cards</div>
        </div>
        <div className="glass-dark mx-2 mb-2 rounded-t-2xl py-3 min-h-[160px] flex items-center justify-center">
          <PlayerHand cards={hand} onPlayCard={handlePlayCard} isMyTurn={isMyTurn()} playableCards={getPlayableCards()} />
        </div>
      </div>

      <AnimatePresence>
        {showColorPicker && (
          <ColorPicker
            onSelectColor={handleColorChoice}
            title={rouletteSelectionPending ? 'Choose Roulette Color' : 'Choose a Color'}
            subtitle={
              rouletteSelectionPending
                ? 'You were targeted by Wild Roulette. Pick the color to resolve the draw.'
                : 'Select the color for your wild card'
            }
            allowCancel={!rouletteSelectionPending}
            onClose={() => {
              if (!rouletteSelectionPending) {
                setShowColorPicker(false);
                setPendingCard(null);
              }
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSwapPicker && <SwapPicker opponents={opponents} onSelectPlayer={handleSwapChoice} onClose={() => { setShowSwapPicker(false); setPendingCard(null); }} />}
      </AnimatePresence>
      <AnimatePresence>
        {gameOver && <GameOverModal winner={winner} players={gameState.players} onLeave={onLeave} />}
      </AnimatePresence>
    </div>
  );
};

export default GameBoard;