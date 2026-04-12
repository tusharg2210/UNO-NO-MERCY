import React, { useState } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext.jsx';
import { Toaster } from 'react-hot-toast';
import Lobby from './components/Lobby/Lobby.jsx';
import GameBoard from './components/Game/GameBoard.jsx';
import AuthPage from './components/Auth/AuthPage.jsx';
import ConnectionStatus from './components/UI/ConnectionStatus.jsx';

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
    setGameStarted(false);
    setRoomCode('');
  };

  return (
    <div className="min-h-screen bg-uno-gradient">
      {/* ⚠️ Show connection status */}
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
            background: '#1E293B',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
      <AppContent />
    </SocketProvider>
  );
}

export default App;