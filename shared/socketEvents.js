export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  SUBSCRIBE_TO_ARTIST: 'subscribe_to_artist',
  UNSUBSCRIBE_FROM_ARTIST: 'unsubscribe_from_artist',
  REJOIN_ROOMS: 'rejoin_rooms',

  NEW_SONG_UPLOADED: 'new_song_uploaded',
  SONG_LIKED: 'song_liked',
  NEW_COMMENT: 'new_comment',
  NEW_COMMENT_BROADCAST: 'new_comment_broadcast',
  SONG_DELETED: 'song_deleted',

  TRENDING_UPDATED: 'trending_updated',

  SONG_PLAYING: 'song_playing',
  SONG_STOPPED: 'song_stopped',
  LISTENER_COUNT_UPDATED: 'listener_count_updated',

  NOTIFICATION_RECEIVED: 'notification_received',
}

export const SOCKET_NAMESPACE = '/notifications'

export const artistRoom = (artistId) => `artist_${artistId}`
export const userRoom = (userId) => `user_${userId}`
