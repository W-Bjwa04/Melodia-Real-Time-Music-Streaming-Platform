import { io } from 'socket.io-client';
import { SOCKET_NAMESPACE } from '@shared/socketEvents';

let socketInstance = null;

export const getSocket = () => socketInstance;

export const connectSocket = (token) => {
  if (!token) return null;

  if (socketInstance) return socketInstance;

  const baseUrl =
    import.meta.env.VITE_SOCKET_URL ||
    `${window.location.protocol}//${window.location.hostname}:3000`;

  console.log('[Socket] Connecting to', `${baseUrl}${SOCKET_NAMESPACE}`);
  socketInstance = io(`${baseUrl}${SOCKET_NAMESPACE}`, {
    auth: {
      token,
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    transports: ['websocket'],
    withCredentials: true,
  });

  socketInstance.on('connect', () => {
    console.log('[Socket] ✅ Connected. ID:', socketInstance.id);
  });

  socketInstance.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  socketInstance.on('test_ping', (data) => {
    console.log('[Socket] test_ping received ✅:', data);
  });

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
