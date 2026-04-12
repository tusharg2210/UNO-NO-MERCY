import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5100';

    console.log('🔌 Connecting to:', serverUrl);

    const newSocket = io(serverUrl, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 30000,
      withCredentials: false,
      forceNew: true,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Connection error:', err.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
    });

    newSocket.on('reconnect_error', (err) => {
      console.error('🔄 Reconnection error:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);