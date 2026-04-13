import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { getSocketIoUrl } from '../utils/serverUrl.js';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    const serverUrl = getSocketIoUrl();

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
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('connect_error', (err) => {
      setConnectionError(err.message);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('reconnect', () => {
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('reconnect_error', () => {});

    setSocket(newSocket);

    return () => {
      newSocket.close();
      setIsConnected(false);
    };
  }, []);

  const value = useMemo(
    () => ({ socket, isConnected, connectionError }),
    [socket, isConnected, connectionError]
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (ctx == null) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return ctx;
};
