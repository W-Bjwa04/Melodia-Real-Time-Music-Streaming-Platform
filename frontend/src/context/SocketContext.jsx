import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import api from '@/api/axios';
import { useAuth } from '@/hooks/useAuth';
import { connectSocket as createSocketConnection, disconnectSocket as closeSocketConnection } from '@/lib/socket';
import { SOCKET_EVENTS } from '@shared/socketEvents';

export const SocketContext = createContext(null);

/** Converts a persisted notification object into a polished toast message. */
function buildToastMessage(n) {
  const p = n?.payload || {};
  switch (n?.type) {
    case 'new_song':
      return {
        text: p.actorName ? `New release from ${p.actorName}` : 'New song released',
        description: p.songTitle || p.message || '',
      };
    case 'song_liked':
      return {
        text: p.actorName ? `${p.actorName} liked your track` : 'Someone liked your track',
        description: p.songTitle ? `"${p.songTitle}"${p.totalLikes ? ` · ${p.totalLikes} likes` : ''}` : '',
      };
    case 'new_comment':
      return {
        text: p.actorName ? `${p.actorName} left a comment` : 'New comment on your track',
        description: p.commentText
          ? `"${p.commentText.slice(0, 80)}${p.commentText.length > 80 ? '…' : ''}"`
          : p.songTitle || '',
      };
    default:
      return { text: p.message || 'New notification', description: '' };
  }
}

export function SocketProvider({ children }) {
  const { token, user, isAuthenticated } = useAuth();

  const socketRef = useRef(null);
  const trendingCallbackRef = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [listenerCounts, setListenerCounts] = useState({});
  const [subscribedArtistIds, setSubscribedArtistIds] = useState([]);

  const recalcUnread = useCallback((nextNotifications) => {
    setUnreadCount(nextNotifications.filter((n) => !n.read).length);
  }, []);

  const hydrateNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const res = await api.get('/notifications');
      const list = res.data?.data || [];
      setNotifications(list);
      recalcUnread(list);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, recalcUnread]);

  const hydrateSubscriptions = useCallback(async () => {
    if (!isAuthenticated) {
      setSubscribedArtistIds([]);
      return [];
    }

    try {
      const res = await api.get('/subscriptions');
      const artistIds = (res.data?.data || [])
        .map((item) => String(item.artistId?._id || item.artistId))
        .filter(Boolean);
      setSubscribedArtistIds(artistIds);
      return artistIds;
    } catch {
      setSubscribedArtistIds([]);
      return [];
    }
  }, [isAuthenticated]);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    closeSocketConnection();
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const connectSocket = useCallback(() => {
    if (!token || !isAuthenticated) return null;

    if (socketRef.current) {
      return socketRef.current;
    }

    const socket = createSocketConnection(token);
    socketRef.current = socket;
    setIsConnecting(true);

    const onConnect = async () => {
      setIsConnected(true);
      setIsConnecting(false);
      console.log('Socket connected');
      const artistIds = await hydrateSubscriptions();
      socket.emit(SOCKET_EVENTS.REJOIN_ROOMS, { artistIds });
    };

    const onDisconnect = (reason) => {
      setIsConnected(false);
      console.log('Socket disconnected:', reason);
    };

    const onConnectError = (error) => {
      setIsConnecting(false);
      console.error('Socket connect_error:', error?.message || error);
      if ((error?.message || '').toLowerCase().includes('authentication')) {
        disconnectSocket();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
      }
    };

    // Single handler for ALL notification types.
    // The backend emits NOTIFICATION_RECEIVED (persisted DB record) for every action,
    // AND also emits specific events (song_liked, new_song_uploaded, new_comment).
    // We only handle NOTIFICATION_RECEIVED to prevent duplicate notifications.
    const onNotificationReceived = (notification) => {
      setNotifications((prev) => {
        const next = [notification, ...prev].slice(0, 50);
        recalcUnread(next);
        return next;
      });
      // Show a professional, context-rich toast
      const msg = buildToastMessage(notification);
      toast(msg.text, { description: msg.description });
    };

    const onTrendingUpdated = (payload) => {
      if (typeof trendingCallbackRef.current === 'function') {
        trendingCallbackRef.current(payload);
      }
    };

    const onListenerCountUpdated = ({ songId, count }) => {
      if (!songId) return;
      setListenerCounts((prev) => ({ ...prev, [String(songId)]: count }));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on(SOCKET_EVENTS.NOTIFICATION_RECEIVED, onNotificationReceived);
    socket.on(SOCKET_EVENTS.TRENDING_UPDATED, onTrendingUpdated);
    socket.on(SOCKET_EVENTS.LISTENER_COUNT_UPDATED, onListenerCountUpdated);

    socket.__cleanup = () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off(SOCKET_EVENTS.NOTIFICATION_RECEIVED, onNotificationReceived);
      socket.off(SOCKET_EVENTS.TRENDING_UPDATED, onTrendingUpdated);
      socket.off(SOCKET_EVENTS.LISTENER_COUNT_UPDATED, onListenerCountUpdated);
    };

    return socket;
  }, [token, isAuthenticated, disconnectSocket, hydrateSubscriptions, recalcUnread]);

  useEffect(() => {
    hydrateNotifications();
    hydrateSubscriptions();
  }, [hydrateNotifications, hydrateSubscriptions]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current?.__cleanup) {
        socketRef.current.__cleanup();
      }
      disconnectSocket();
      return;
    }

    const pref = localStorage.getItem('notificationsEnabled');
    const shouldConnect = pref === null || pref === 'true';

    if (shouldConnect) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      // Fully disconnect so next connectSocket() call creates a fresh socket with listeners.
      // This is required for React StrictMode (double-invoke) and dependency re-runs.
      if (socketRef.current?.__cleanup) {
        socketRef.current.__cleanup();
      }
      disconnectSocket();
    };
  }, [isAuthenticated, token, connectSocket, disconnectSocket]);

  const setNotificationPreference = useCallback(
    async (enabled) => {
      localStorage.setItem('notificationsEnabled', enabled ? 'true' : 'false');
      await api.patch('/users/notification-preference', { notificationsEnabled: enabled }).catch(() => {});

      if (enabled) {
        connectSocket();
      } else {
        if (socketRef.current?.__cleanup) {
          socketRef.current.__cleanup();
        }
        disconnectSocket();
      }
    },
    [connectSocket, disconnectSocket]
  );

  const markAsRead = useCallback(async (notificationId) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n));
      recalcUnread(next);
      return next;
    });
    await api.patch(`/notifications/${notificationId}/read`).catch(() => {});
  }, [recalcUnread]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      recalcUnread(next);
      return next;
    });
    await api.patch('/notifications/read-all').catch(() => {});
  }, [recalcUnread]);

  const toggleArtistSubscription = useCallback(async (artistId) => {
    const target = String(artistId);
    const currentlySubscribed = subscribedArtistIds.includes(target);

    setSubscribedArtistIds((prev) =>
      currentlySubscribed ? prev.filter((id) => id !== target) : [...new Set([...prev, target])]
    );

    try {
      if (currentlySubscribed) {
        await api.delete(`/subscriptions/${target}`);
      } else {
        await api.post('/subscriptions', { artistId: target });
      }

      await setNotificationPreference(true);

      if (socketRef.current) {
        socketRef.current.emit(
          currentlySubscribed ? SOCKET_EVENTS.UNSUBSCRIBE_FROM_ARTIST : SOCKET_EVENTS.SUBSCRIBE_TO_ARTIST,
          { artistId: target }
        );
      }

      return !currentlySubscribed;
    } catch (error) {
      setSubscribedArtistIds((prev) =>
        currentlySubscribed ? [...new Set([...prev, target])] : prev.filter((id) => id !== target)
      );
      throw error;
    }
  }, [subscribedArtistIds, setNotificationPreference]);

  const setTrendingCallback = useCallback((fn) => {
    trendingCallbackRef.current = fn;
    return () => {
      if (trendingCallbackRef.current === fn) {
        trendingCallbackRef.current = null;
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      isConnected,
      isConnecting,
      notifications,
      unreadCount,
      listenerCounts,
      subscribedArtistIds,
      connectSocket,
      disconnectSocket,
      setNotificationPreference,
      markAsRead,
      markAllAsRead,
      toggleArtistSubscription,
      setTrendingCallback,
      user,
    }),
    [
      isConnected,
      isConnecting,
      notifications,
      unreadCount,
      listenerCounts,
      subscribedArtistIds,
      connectSocket,
      disconnectSocket,
      setNotificationPreference,
      markAsRead,
      markAllAsRead,
      toggleArtistSubscription,
      setTrendingCallback,
      user,
    ]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
