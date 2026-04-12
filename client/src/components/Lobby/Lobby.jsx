import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const Lobby = ({ user, onGameStart }) => {
  const socket = useSocket();
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('room-created', ({ roomCode, game }) => {
      setCurrentRoom(roomCode);
      setInRoom(true);
      setIsHost(true);
      setPlayers(game.players);
      toast.success(`Room ${roomCode} created!`);
    });

    socket.on('player-joined', ({ game, username }) => {
      setPlayers(game.players);
      toast(`🎮 ${username} joined!`, { icon: '👋' });
    });

    socket.on('game-started', () => {
      onGameStart(currentRoom);
    });

    socket.on('player-disconnected', ({ username }) => {
      toast(`${username} left the room`, { icon: '👋' });
    });

    socket.on('error', ({ message }) => {
      toast.error(message);
    });

    return () => {
      socket.off('room-created');
      socket.off('player-joined');
      socket.off('game-started');
      socket.off('player-disconnected');
      socket.off('error');
    };
  }, [socket, currentRoom, onGameStart]);

  const createRoom = () => {
    socket.emit('create-room', { username: user.username, userId: user.id });
  };

  const joinRoom = () => {
    if (!roomCode.trim()) return toast.error('Enter a room code!');
    socket.emit('join-room', { roomCode: roomCode.toUpperCase(), username: user.username });
    setCurrentRoom(roomCode.toUpperCase());
    setInRoom(true);
  };

  const startGame = () => {
    if (players.length < 2) return toast.error('Need at least 2 players!');
    socket.emit('start-game', { roomCode: currentRoom });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(currentRoom);
    setCopied(true);
    toast.success('Room code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  // MAIN LOBBY
  if (!inRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg animate-fade-in">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-6xl font-black bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 bg-clip-text text-transparent">
              UNO
            </h1>
            <p className="text-3xl font-bold text-red-500 tracking-widest">NO MERCY 🔥</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/5 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-300 text-sm">Welcome, {user.username}</span>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Create Room Card */}
            <div className="glass p-6 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🏠</span>
                <div>
                  <h2 className="text-xl font-bold">Create Room</h2>
                  <p className="text-gray-400 text-sm">Start a new game and invite friends</p>
                </div>
              </div>
              <button onClick={createRoom} className="btn-primary w-full">
                ✨ Create New Room
              </button>
            </div>

            {/* Join Room Card */}
            <div className="glass p-6 hover:border-blue-500/30 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🚪</span>
                <div>
                  <h2 className="text-xl font-bold">Join Room</h2>
                  <p className="text-gray-400 text-sm">Enter a room code to join a game</p>
                </div>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  className="input-field flex-1 uppercase tracking-widest text-center text-lg"
                  placeholder="ROOM CODE"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                />
                <button onClick={joinRoom} className="btn-primary">
                  Join →
                </button>
              </div>
            </div>

            {/* Rules Card */}
            <div className="glass p-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                🔥 No Mercy Rules
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { icon: '💀', name: '+10 Card', desc: 'Draw 10 cards!' },
                  { icon: '🔥', name: '+6 Card', desc: 'Draw 6 cards!' },
                  { icon: '🚫', name: 'Skip Everyone', desc: 'Play again!' },
                  { icon: '🔀', name: 'Swap Hands', desc: 'Trade cards!' },
                  { icon: '🎰', name: 'Color Roulette', desc: 'Random color!' },
                  { icon: '💣', name: 'Discard All', desc: 'Dump matching!' },
                ].map((rule) => (
                  <div key={rule.name} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                    <span className="text-xl">{rule.icon}</span>
                    <div>
                      <p className="font-semibold text-xs">{rule.name}</p>
                      <p className="text-gray-400 text-xs">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // WAITING ROOM
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Room Header */}
        <div className="glass p-6 mb-6 text-center">
          <p className="text-gray-400 text-sm mb-2">Room Code</p>
          <div className="flex items-center justify-center gap-3 mb-3">
            <h2 className="text-4xl font-black tracking-[0.3em] text-white">
              {currentRoom}
            </h2>
            <button
              onClick={copyRoomCode}
              className={`p-2 rounded-lg transition-all duration-300 ${
                copied 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
              }`}
            >
              {copied ? '✅' : '📋'}
            </button>
          </div>
          <p className="text-gray-400 text-sm">Share this code with your friends!</p>
        </div>

        {/* Players List */}
        <div className="glass p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Players</h3>
            <span className="bg-white/10 px-3 py-1 rounded-full text-sm">
              {players.length}/6
            </span>
          </div>

          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={player.id || index}
                className="flex items-center gap-3 bg-white/5 rounded-xl p-3 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                  ${index === 0 
                    ? 'bg-gradient-to-br from-yellow-500 to-orange-500' 
                    : 'bg-gradient-to-br from-purple-500 to-blue-500'
                  }`}
                >
                  {index === 0 ? '👑' : player.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{player.username}</p>
                  <p className="text-xs text-gray-400">
                    {index === 0 ? 'Host' : 'Player'}
                  </p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            ))}

            {/* Empty Slots */}
            {Array(6 - players.length).fill(null).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3 border border-dashed border-white/10 rounded-xl p-3"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="text-gray-600 text-xl">+</span>
                </div>
                <p className="text-gray-600 text-sm">Waiting for player...</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isHost && (
            <button
              onClick={startGame}
              disabled={players.length < 2}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300
                ${players.length >= 2
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 active:scale-95 text-white'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
            >
              {players.length >= 2 ? '🚀 Start Game!' : '⏳ Need at least 2 players'}
            </button>
          )}

          {!isHost && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Waiting for host to start...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;