import React, { useState } from 'react';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import Lobby from './components/Lobby/Lobby';
import GameBoard from './components/Game/GameBoard';
import AuthPage from './components/Auth/AuthPage';

function App() {
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
      <div className="min-h-screen bg-uno-gradient">
        {!user ? (
          <AuthPage onAuth={setUser} />
        ) : !gameStarted ? (
          <Lobby user={user} onGameStart={handleGameStart} />
        ) : (
          <GameBoard roomCode={roomCode} user={user} onLeave={handleLeaveGame} />
        )}
      </div>
    </SocketProvider>
  );
}

export default App;