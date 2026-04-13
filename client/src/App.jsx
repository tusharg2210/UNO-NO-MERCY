import React, { useState } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext.jsx';
import { Toaster } from 'react-hot-toast';
import Lobby from './components/Lobby/Lobby.jsx';
import GameBoard from './components/Game/GameBoard.jsx';
import AuthPage from './components/Auth/AuthPage.jsx';
import ConnectionStatus from './components/UI/ConnectionStatus.jsx';

import { Analytics } from "@vercel/analytics/react"

function AppContent() {
  const { socket, isConnected, connectionError } = useSocket();
  const [user, setUser] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [roomCode, setRoomCode] = useState('');

  const handleGameStart = (room) => {
    setRoomCode(room);
    setGameStarted(true);
  };

  const handleLeaveGame = () => {
    if (socket && roomCode) {
      socket.emit('leave-room', { roomCode });
    }
    setGameStarted(false);
    setRoomCode('');
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[radial-gradient(circle_at_top,#111827_0%,#020617_55%,#020617_100%)]">
      {/* ⚠️ Show connection status */}
      <Analytics />
      <ConnectionStatus 
        isConnected={isConnected} 
        error={connectionError} 
      />

      {!user ? (
        <AuthPage onAuth={setUser} />
      ) : !gameStarted ? (
        <Lobby
          user={user}
          onGameStart={handleGameStart}
          onSignOut={() => setUser(null)}
        />
      ) : (
        <GameBoard 
          roomCode={roomCode} 
          user={user} 
          onLeave={handleLeaveGame} 
        />
      )}
    </div>
  );
}

function App() {
  return (
    <SocketProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#e2e8f0',
            border: '1px solid rgba(148,163,184,0.25)',
          },
        }}
      />
      <AppContent />
    </SocketProvider>
  );
}

export default App;