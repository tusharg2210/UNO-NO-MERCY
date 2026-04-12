import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Card from '../Cards/Card';
import CardBack from '../Cards/CardBack';
import PlayerHand from '../Cards/PlayerHand';
import ColorPicker from '../UI/ColorPicker';
import SwapPicker from '../UI/SwapPicker';
import OpponentRow from './OpponentRow';
import GameOverModal from '../UI/GameOverModal';
import EffectsBanner from '../UI/EffectsBanner';
import GameChat from '../UI/GameChat';

const GameBoard = ({ roomCode, user, onLeave }) => {
    const socket = useSocket();
    const [gameState, setGameState] = useState(null);
    const [hand, setHand] = useState([]);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showSwapPicker, setShowSwapPicker] = useState(false);
    const [pendingCard, setPendingCard] = useState(null);
    const [effects, setEffects] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [showChat, setShowChat] = useState(false);

    useEffect(() => {
        if (!socket) return;

        socket.on('game-started', ({ hand, gameState }) => {
            setHand(hand);
            setGameState(gameState);
            toast('🎮 Game Started!', {
                icon: '🎴',
                style: { background: '#16A34A', color: '#fff' },
            });
        });

        socket.on('card-played', ({ hand, gameState, effects, gameOver: isOver, winner: w }) => {
            setHand(hand);
            setGameState(gameState);
            if (effects?.message) {
                setEffects(effects);
                setTimeout(() => setEffects(null), 3000);
            }
            if (isOver) {
                setGameOver(true);
                setWinner(w);
            }
        });

        socket.on('card-drawn', ({ hand, gameState }) => {
            setHand(hand);
            setGameState(gameState);
        });

        socket.on('uno-called', ({ username }) => {
            toast(`🔔 ${username} said UNO!`, {
                icon: '🔴',
                style: { background: '#DC2626', color: '#fff' },
            });
        });

        socket.on('uno-caught', ({ hand, gameState }) => {
            setHand(hand);
            setGameState(gameState);
            toast('😈 UNO not called! +4 penalty!', {
                icon: '💀',
                style: { background: '#DC2626', color: '#fff' },
            });
        });

        socket.on('player-disconnected', ({ username }) => {
            toast(`${username} disconnected`, { icon: '👋' });
        });

        socket.on('error', ({ message }) => {
            toast.error(message);
        });

        return () => {
            socket.off('game-started');
            socket.off('card-played');
            socket.off('card-drawn');
            socket.off('uno-called');
            socket.off('uno-caught');
            socket.off('player-disconnected');
            socket.off('error');
        };
    }, [socket]);

    const isMyTurn = useCallback(() => {
        if (!gameState) return false;
        return gameState.players[gameState.currentPlayerIndex]?.id === socket?.id;
    }, [gameState, socket]);

    const getPlayableCards = useCallback(() => {
        if (!gameState || !isMyTurn()) return [];
        const topCard = gameState.topCard;

        return hand.filter(card => {
            // If draw stack, only stackable cards
            if (gameState.drawStack > 0) {
                return ['draw_two', 'wild_draw_four', 'wild_draw_six',
                    'wild_draw_ten', 'reverse_draw_four'].includes(card.type);
            }
            // Wild cards always playable
            if (!card.color) return true;
            // Match color or value
            if (card.type === 'discard_all') return card.color === gameState.currentColor;
            return card.color === gameState.currentColor ||
                card.value === topCard?.value ||
                card.type === topCard?.type;
        });
    }, [gameState, hand, isMyTurn]);

    const handlePlayCard = (card) => {
        if (!isMyTurn()) return;

        const wildTypes = ['wild', 'wild_draw_four', 'wild_draw_six',
            'wild_draw_ten', 'wild_color_roulette'];

        if (card.type === 'swap_hands') {
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
        socket.emit('play-card', {
            roomCode,
            cardId: pendingCard.id,
            chosenColor: color,
        });
        setShowColorPicker(false);
        setPendingCard(null);
    };

    const handleSwapChoice = (targetId) => {
        socket.emit('play-card', {
            roomCode,
            cardId: pendingCard.id,
            swapTargetId: targetId,
            chosenColor: 'red', // default
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

    if (!gameState) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <div className="text-6xl mb-4 animate-bounce-slow">🎴</div>
                    <p className="text-gray-400 text-lg">Loading game...</p>
                    <div className="mt-4 w-32 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse w-3/4" />
                    </div>
                </div>
            </div>
        );
    }

    const myPlayer = gameState.players.find(p => p.id === socket?.id);
    const opponents = gameState.players.filter(p => p.id !== socket?.id);
    const currentPlayerName = gameState.players[gameState.currentPlayerIndex]?.username;

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-uno-gradient">
            {/* Background pattern */}
            <div className="fixed inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }} />
            </div>

            {/* Top Bar */}
            <div className="relative z-20 flex items-center justify-between px-4 py-2 glass-dark mx-2 mt-2 rounded-xl">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onLeave}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        ← Leave
                    </button>
                    <span className="text-sm text-gray-400">Room: <span className="text-white font-mono">{roomCode}</span></span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Direction indicator */}
                    <div className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full">
                        <span className={`text-lg ${gameState.direction === 1 ? '' : 'scale-x-[-1]'} inline-block transition-transform`}>
                            🔄
                        </span>
                        <span className="text-xs text-gray-400">
                            {gameState.direction === 1 ? 'CW' : 'CCW'}
                        </span>
                    </div>

                    {/* Draw Stack Warning */}
                    {gameState.drawStack > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-red-600/80 px-3 py-1 rounded-full text-sm font-bold animate-pulse-fast"
                        >
                            ⚠️ +{gameState.drawStack}
                        </motion.div>
                    )}

                    {/* Current Color */}
                    <div className={`w-6 h-6 rounded-full border-2 border-white/30 shadow-lg ${gameState.currentColor === 'red' ? 'bg-red-500' :
                            gameState.currentColor === 'blue' ? 'bg-blue-500' :
                                gameState.currentColor === 'green' ? 'bg-green-500' :
                                    'bg-yellow-500'
                        }`} />
                </div>
            </div>

            {/* Effects Banner */}
            <AnimatePresence>
                {effects && <EffectsBanner effects={effects} />}
            </AnimatePresence>

            {/* Opponents - Top Area */}
            <div className="relative z-10 flex-shrink-0 px-4 py-3">
                <OpponentRow
                    opponents={opponents}
                    currentPlayerIndex={gameState.currentPlayerIndex}
                    players={gameState.players}
                    onCatchUno={handleCatchUno}
                />
            </div>

            {/* Center - Play Area */}
            <div className="flex-1 flex items-center justify-center relative z-10">
                <div className="flex items-center gap-8 sm:gap-16">
                    {/* Draw Pile */}
                    <motion.button
                        whileHover={isMyTurn() ? { scale: 1.1 } : {}}
                        whileTap={isMyTurn() ? { scale: 0.95 } : {}}
                        onClick={handleDrawCard}
                        disabled={!isMyTurn()}
                        className={`relative group ${isMyTurn() ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    >
                        <div className="relative">
                            {/* Stacked cards effect */}
                            <div className="absolute top-1 left-1 w-20 h-28 sm:w-24 sm:h-36 rounded-xl 
                            bg-gradient-to-br from-red-900 to-black border border-white/10" />
                            <div className="absolute top-0.5 left-0.5 w-20 h-28 sm:w-24 sm:h-36 rounded-xl 
                            bg-gradient-to-br from-red-900 to-black border border-white/10" />
                            <div className={`relative w-20 h-28 sm:w-24 sm:h-36 rounded-xl 
                            bg-gradient-to-br from-red-800 via-red-900 to-black 
                            border-2 ${isMyTurn() ? 'border-white/40 group-hover:border-white' : 'border-white/20'}
                            flex flex-col items-center justify-center card-shadow
                            transition-all duration-300`}>
                                <span className="text-white/60 font-black text-xs tracking-widest">UNO</span>
                                <span className="text-white/40 text-[10px] mt-1">DRAW</span>
                            </div>
                        </div>
                        <p className="text-center text-xs text-gray-500 mt-2">
                            {gameState.drawPile} cards
                        </p>
                    </motion.button>

                    {/* Discard Pile */}
                    <div className="relative">
                        <AnimatePresence mode="popLayout">
                            {gameState.topCard && (
                                <motion.div
                                    key={gameState.topCard.id}
                                    initial={{ scale: 0, rotate: 180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                >
                                    <Card card={gameState.topCard} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Current Color Indicator */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                ${gameState.currentColor === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    gameState.currentColor === 'blue' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                        gameState.currentColor === 'green' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                }`}>
                                {gameState.currentColor}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Turn Indicator */}
            <div className="relative z-10 text-center py-1">
                <motion.div
                    animate={isMyTurn() ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold
            ${isMyTurn()
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/5 text-gray-400 border border-white/10'
                        }`}
                >
                    <div className={`w-2 h-2 rounded-full ${isMyTurn() ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                    {isMyTurn() ? "🟢 Your Turn!" : `⏳ ${currentPlayerName}'s turn`}
                </motion.div>
            </div>

            {/* Player's Hand - Bottom */}
            <div className="relative z-10 flex-shrink-0">
                {/* UNO & Actions */}
                <div className="flex items-center justify-center gap-3 pb-2">
                    {hand.length <= 2 && (
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleSayUno}
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800
                         text-white font-black text-lg px-6 py-2 rounded-full
                         shadow-lg shadow-red-500/30 hover:shadow-red-500/50
                         transition-all duration-200 animate-glow"
                        >
                            UNO! 🔴
                        </motion.button>
                    )}

                    {/* Card count */}
                    <div className="bg-white/5 px-3 py-1 rounded-full text-xs text-gray-400">
                        🃏 {hand.length} cards
                    </div>
                </div>

                {/* Hand */}
                <div className="glass-dark mx-2 mb-2 rounded-t-2xl py-3 min-h-[160px] flex items-center justify-center">
                    <PlayerHand
                        cards={hand}
                        onPlayCard={handlePlayCard}
                        isMyTurn={isMyTurn()}
                        playableCards={getPlayableCards()}
                    />
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showColorPicker && (
                    <ColorPicker
                        onSelectColor={handleColorChoice}
                        onClose={() => {
                            setShowColorPicker(false);
                            setPendingCard(null);
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSwapPicker && (
                    <SwapPicker
                        opponents={opponents}
                        onSelectPlayer={handleSwapChoice}
                        onClose={() => {
                            setShowSwapPicker(false);
                            setPendingCard(null);
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {gameOver && <GameOverModal winner={winner} players={gameState.players} onLeave={onLeave} />}
            </AnimatePresence>

            <GameChat
                roomCode={roomCode}
                username={user.username}
                isOpen={showChat}
                onToggle={() => setShowChat(!showChat)}
            />
        </div>
    );
};

export default GameBoard;