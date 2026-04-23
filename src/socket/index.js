import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import subscriptionModel from '../models/subscription.model.js';
import { registerSocketHandlers } from './socketHandler.js';
import { SOCKET_NAMESPACE, userRoom, artistRoom } from '../../shared/socketEvents.js';

const listenerSockets = new Map();
const artistSockets = new Map();

let ioInstance = null;
let notificationNamespace = null;

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
      credentials: true,
    },
  });

  notificationNamespace = ioInstance.of(SOCKET_NAMESPACE);

  notificationNamespace.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    console.log('[Socket Auth] Token received:', token ? 'YES' : 'NO - REJECTING');

    if (!token) {
      return next(new Error('NO_TOKEN'));
    }

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      socket.userId = String(decoded.id || decoded._id);
      socket.userRole = decoded.role;
      console.log(`[Socket Auth] Authenticated: userId=${socket.userId}, role=${socket.userRole}`);
      return next();
    } catch (error) {
      console.log('[Socket Auth] JWT verification failed:', error.message);
      return next(new Error('INVALID_TOKEN'));
    }
  });

  notificationNamespace.on('connection', async (socket) => {
    console.log(`[Socket] Connected: userId=${socket.userId}, role=${socket.userRole}, socketId=${socket.id}`);

    if (socket.userRole === 'artist') {
      artistSockets.set(socket.userId, socket.id);
    } else {
      listenerSockets.set(socket.userId, socket.id);
    }

    socket.join(userRoom(socket.userId));
    console.log(`[Socket] Joined personal room: user_${socket.userId}`);

    if (socket.userRole === 'listener') {
      const subscriptions = await subscriptionModel.find({ listenerId: socket.userId }).select('artistId');
      subscriptions.forEach((sub) => socket.join(artistRoom(String(sub.artistId))));
      console.log(`[Socket] Rejoined ${subscriptions.length} subscription rooms for user ${socket.userId}`);
    }

    registerSocketHandlers({
      io: notificationNamespace,
      socket,
      onlineListeners: listenerSockets,
      onlineArtists: artistSockets,
    });
  });

  return ioInstance;
};

export const getIO = () => ioInstance;
export const getNotificationNamespace = () => notificationNamespace;
export const getListenerSockets = () => listenerSockets;
export const getArtistSockets = () => artistSockets;
