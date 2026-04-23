import subscriptionModel from '../models/subscription.model.js';
import { SOCKET_EVENTS, artistRoom } from '../../shared/socketEvents.js';

const activeSongListeners = new Map();

const emitListenerCountUpdated = (io, songId) => {
  const listeners = activeSongListeners.get(String(songId));
  io.emit(SOCKET_EVENTS.LISTENER_COUNT_UPDATED, {
    songId: String(songId),
    count: listeners ? listeners.size : 0,
  });
};

export const registerSocketHandlers = ({ io, socket, onlineListeners, onlineArtists }) => {
  socket.on(SOCKET_EVENTS.SUBSCRIBE_TO_ARTIST, async ({ artistId }) => {
    if (!artistId) return;

    await subscriptionModel.findOneAndUpdate(
      { listenerId: socket.userId, artistId: String(artistId) },
      { listenerId: socket.userId, artistId: String(artistId) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    socket.join(artistRoom(String(artistId)));
    console.log(`[Socket] ${socket.userId} subscribed and joined room artist_${artistId}`);
  });

  socket.on(SOCKET_EVENTS.UNSUBSCRIBE_FROM_ARTIST, async ({ artistId }) => {
    if (!artistId) return;

    await subscriptionModel.findOneAndDelete({
      listenerId: socket.userId,
      artistId: String(artistId),
    });

    socket.leave(artistRoom(String(artistId)));
    console.log(`[Socket] ${socket.userId} unsubscribed from room artist_${artistId}`);
  });

  socket.on(SOCKET_EVENTS.REJOIN_ROOMS, async () => {
    if (socket.userRole !== 'listener') return;

    const subscriptions = await subscriptionModel.find({ listenerId: socket.userId }).select('artistId');
    subscriptions.forEach((sub) => socket.join(artistRoom(String(sub.artistId))));
    console.log(`[Socket] Rejoined ${subscriptions.length} rooms for user ${socket.userId}`);
  });

  socket.on(SOCKET_EVENTS.SONG_PLAYING, ({ songId }) => {
    if (!songId) return;

    const key = String(songId);
    if (!activeSongListeners.has(key)) {
      activeSongListeners.set(key, new Set());
    }
    activeSongListeners.get(key).add(String(socket.userId));
    const count = activeSongListeners.get(key).size;
    console.log(`[Socket] Song ${key} now has ${count} live listeners`);
    emitListenerCountUpdated(io, key);
  });

  socket.on(SOCKET_EVENTS.SONG_STOPPED, ({ songId }) => {
    if (!songId) return;

    const key = String(songId);
    const listeners = activeSongListeners.get(key);
    if (!listeners) return;

    listeners.delete(String(socket.userId));
    if (!listeners.size) {
      activeSongListeners.delete(key);
    }
    const count = listeners.size;
    console.log(`[Socket] Song ${key} now has ${count} live listeners`);
    emitListenerCountUpdated(io, key);
  });

  socket.on('disconnect', (reason) => {
    onlineListeners.delete(String(socket.userId));
    onlineArtists.delete(String(socket.userId));

    for (const [songId, listeners] of activeSongListeners.entries()) {
      listeners.delete(String(socket.userId));
      if (!listeners.size) {
        activeSongListeners.delete(songId);
      }
      emitListenerCountUpdated(io, songId);
    }

    console.log(`[Socket] Disconnected: userId=${socket.userId}, reason=${reason}`);
  });
};
