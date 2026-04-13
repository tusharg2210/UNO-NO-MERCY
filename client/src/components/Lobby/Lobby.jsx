import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext.jsx';
import toast from 'react-hot-toast';

const MAX_PLAYERS_CAP = 10;

const SLOT_GRADIENTS = [
  'from-rose-500 to-red-700',
  'from-amber-400 to-orange-600',
  'from-emerald-400 to-teal-700',
  'from-sky-400 to-indigo-700',
  'from-violet-400 to-purple-800',
  'from-fuchsia-400 to-pink-700',
  'from-lime-400 to-green-700',
  'from-cyan-400 to-blue-700',
  'from-orange-400 to-red-600',
  'from-pink-400 to-rose-700',
];

const Lobby = ({ user, onGameStart, onSignOut }) => {
  const { socket, isConnected } = useSocket();
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [players, setPlayers] = useState([]);
  const [maxPlayers, setMaxPlayers] = useState(MAX_PLAYERS_CAP);
  const [copied, setCopied] = useState(false);
  const isHost = Boolean(socket && players[0]?.id === socket.id);
  const currentRoomRef = useRef('');

  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  useEffect(() => {
    if (!socket) return;

    const resolveCapacity = (fromPayload, game) => {
      const raw = fromPayload ?? game?.settings?.maxPlayers;
      const n = typeof raw === 'number' ? raw : Number(raw);
      if (Number.isFinite(n) && n >= 2 && n <= MAX_PLAYERS_CAP) return n;
      return MAX_PLAYERS_CAP;
    };

    const handleRoomCreated = ({ roomCode, game, maxPlayers: cap }) => {
      setCurrentRoom(roomCode);
      currentRoomRef.current = roomCode;
      setInRoom(true);
      setPlayers(game.players || []);
      setMaxPlayers(resolveCapacity(cap, game));
      toast.success(`Room ${roomCode} created!`);
    };

    const handleRoomJoined = ({ roomCode, game, maxPlayers: cap }) => {
      setCurrentRoom(roomCode);
      currentRoomRef.current = roomCode;
      setInRoom(true);
      setPlayers(game.players || []);
      setMaxPlayers(resolveCapacity(cap, game));
      toast.success(`Joined room ${roomCode}!`);
    };

    const handlePlayerJoined = ({ game, username, maxPlayers: cap }) => {
      setPlayers(game.players || []);
      setMaxPlayers(resolveCapacity(cap, game));
      toast(`${username} joined`);
    };

    const handleSettingsUpdated = ({ settings }) => {
      if (settings?.maxPlayers != null) {
        setMaxPlayers(resolveCapacity(settings.maxPlayers, { settings }));
      }
    };

    const handleGameStarted = () => {
      onGameStart(currentRoomRef.current);
    };

    const handlePlayerLeft = ({ username }) => {
      toast(`${username} left`);
    };

    const handleError = ({ message }) => {
      toast.error(message);
    };

    socket.on('room-created', handleRoomCreated);
    socket.on('room-joined', handleRoomJoined);
    socket.on('player-joined', handlePlayerJoined);
    socket.on('settings-updated', handleSettingsUpdated);
    socket.on('game-started', handleGameStarted);
    socket.on('player-left', handlePlayerLeft);
    socket.on('player-disconnected', handlePlayerLeft);
    socket.on('error', handleError);

    return () => {
      socket.off('room-created', handleRoomCreated);
      socket.off('room-joined', handleRoomJoined);
      socket.off('player-joined', handlePlayerJoined);
      socket.off('settings-updated', handleSettingsUpdated);
      socket.off('game-started', handleGameStarted);
      socket.off('player-left', handlePlayerLeft);
      socket.off('player-disconnected', handlePlayerLeft);
      socket.off('error', handleError);
    };
  }, [socket, onGameStart]);

  const createRoom = () => {
    if (!socket || !isConnected) {
      toast.error('Not connected to server. Please wait...');
      return;
    }
    socket.emit('create-room', { username: user.username, userId: user.id });
  };

  const joinRoom = () => {
    if (!socket || !isConnected) {
      toast.error('Not connected to server. Please wait...');
      return;
    }
    if (!roomCode.trim()) return toast.error('Enter a room code!');
    const code = roomCode.toUpperCase().trim();
    socket.emit('join-room', { roomCode: code, username: user.username, userId: user.id });
  };

  const startGame = () => {
    if (!socket || !isConnected) {
      toast.error('Not connected to server. Please wait...');
      return;
    }
    if (players.length < 2) return toast.error('Need at least 2 players!');
    socket.emit('start-game', { roomCode: currentRoom });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(currentRoom);
    setCopied(true);
    toast.success('Room code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inRoom) {
    return (
      <div
        className="landing-shell flex min-h-[100dvh] flex-col items-center justify-center p-4 sm:p-8"
        style={{
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-[90px]" />
        <div className="pointer-events-none absolute bottom-20 left-0 h-72 w-72 rounded-full bg-blue-500/10 blur-[80px]" />

        <div className="relative z-10 w-full min-w-0 max-w-xl">
          <div className="mx-auto mb-8 h-1 w-40 rounded-full uno-stripe opacity-90" />

          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.28em] text-cyan-200/70">Lobby</p>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl sm:leading-tight">
                Ready when{' '}
                <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">you are</span>
              </h1>
              <p className="mt-2 max-w-sm text-sm text-slate-400">
                <span className="font-medium text-slate-200">{user.username}</span>, host a table or drop in with a code.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium ${
                  isConnected
                    ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                    : 'border-red-500/35 bg-red-500/10 text-red-200'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isConnected ? 'animate-pulse bg-emerald-400' : 'bg-red-400'}`} />
                {isConnected ? 'Connected' : 'Connecting…'}
              </div>
              {typeof onSignOut === 'function' && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="py-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-300"
                >
                  Sign out
                </button>
              )}
            </div>
          </header>

          <div className="grid gap-4 sm:gap-5">
            <div className="chunky-card relative overflow-hidden p-6 sm:p-7">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/15 blur-2xl" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-700 text-lg font-semibold text-white shadow-lg shadow-emerald-900/40 ring-1 ring-white/20">
                  +
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-white sm:text-xl">New table</h2>
                  <p className="mt-0.5 text-sm text-slate-400">You are the host. Share the code from the next screen.</p>
                  <button
                    type="button"
                    onClick={createRoom}
                    disabled={!isConnected}
                    className="chunky-btn mt-5 w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500"
                  >
                    {isConnected ? 'Create room' : 'Wait for connection…'}
                  </button>
                </div>
              </div>
            </div>

            <div className="chunky-card relative overflow-hidden p-6 sm:p-7">
              <div className="pointer-events-none absolute -left-6 -bottom-6 h-28 w-28 rounded-full bg-sky-500/15 blur-2xl" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-700 text-lg font-semibold text-white shadow-lg shadow-indigo-900/40 ring-1 ring-white/20">
                  #
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-white sm:text-xl">Join a friend</h2>
                  <p className="mt-0.5 text-sm text-slate-400">Six-letter code, then you are in.</p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      className="chunky-input flex-1 text-center font-semibold uppercase tracking-[0.2em] sm:text-lg"
                      placeholder="CODE"
                      maxLength={6}
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                      disabled={!isConnected}
                    />
                    <button
                      type="button"
                      onClick={joinRoom}
                      disabled={!isConnected}
                      className="chunky-btn shrink-0 px-8 bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:from-sky-400 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-800"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="landing-shell flex min-h-[100dvh] flex-col items-center justify-center p-4 sm:p-8"
      style={{
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="pointer-events-none absolute top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-500/10 blur-[90px]" />

      <div className="relative z-10 w-full min-w-0 max-w-xl">
        <div className="mx-auto mb-6 h-1 w-40 rounded-full uno-stripe opacity-90" />

        <div className="chunky-card mb-5 p-6 text-center sm:p-7">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-amber-200/80">Room code</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            <span className="font-mono text-3xl font-semibold tracking-[0.25em] text-white tabular-nums sm:text-4xl sm:tracking-[0.35em]">
              {currentRoom}
            </span>
            <button
              type="button"
              onClick={copyRoomCode}
              className={`chunky-btn px-4 py-2.5 text-sm ${
                copied
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                  : 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900'
              }`}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-500">Send this code so friends can join your table.</p>
        </div>

        <div className="chunky-card mb-5 p-6 sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white sm:text-lg">Players</h3>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
              {players.length} / {maxPlayers}
            </span>
          </div>

          <ul className="space-y-2.5">
            {players.map((player, index) => {
              const grad = SLOT_GRADIENTS[index % SLOT_GRADIENTS.length];
              return (
                <li
                  key={player.id || index}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 backdrop-blur-sm sm:gap-4 sm:px-4"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-sm font-semibold text-white shadow-md ring-1 ring-white/15 sm:h-12 sm:w-12 sm:text-base ${grad}`}
                  >
                    {index === 0 ? '★' : player.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate font-medium text-white">{player.username}</p>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      {index === 0 ? 'Host' : 'Player'}
                    </p>
                  </div>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
                </li>
              );
            })}

            {Array.from({ length: Math.max(0, maxPlayers - players.length) }).map((_, i) => (
              <li
                key={`empty-${i}`}
                className="flex items-center gap-3 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-3 py-3 sm:px-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-slate-950/40 text-slate-600 sm:h-12 sm:w-12">
                  ?
                </div>
                <p className="text-sm text-slate-500">Open seat — share your code</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          {isHost ? (
            <button
              type="button"
              onClick={startGame}
              disabled={players.length < 2}
              className="chunky-btn w-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 text-slate-950 hover:from-amber-300 hover:via-orange-300 hover:to-rose-400 disabled:from-slate-800 disabled:via-slate-800 disabled:to-slate-800 disabled:text-slate-500"
            >
              {players.length >= 2 ? 'Start game' : 'Need at least 2 players'}
            </button>
          ) : (
            <div className="chunky-card py-8 text-center">
              <div className="inline-flex items-center gap-3 text-sm font-medium text-slate-400">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
                Waiting for host to start…
              </div>
            </div>
          )}
          {typeof onSignOut === 'function' && (
            <button
              type="button"
              onClick={onSignOut}
              className="w-full py-2 text-xs font-medium text-slate-600 transition-colors hover:text-slate-400"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
