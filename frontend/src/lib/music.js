export function normalizeTrack(track) {
  const audioUrl =
    track.uri ||
    track.audioUrl ||
    track.audioFile ||
    track.fileUrl ||
    track.url ||
    ''

  return {
    ...track,
    audioUrl,
    coverImage: track.poster || track.coverImage || track.coverUrl || '',
    likes: Number(track.likes || 0),
    listeners: 0,
    likedBy: Array.isArray(track.likedBy) ? track.likedBy : [],
    comments: Array.isArray(track.comments) ? track.comments : [],
    duration: Number(track.duration || 0),
    trackNumber: Number(track.trackNumber || 0),
    artist:
      typeof track.artist === 'string'
        ? { name: track.artist }
        : track.artist || { name: 'Unknown Artist' },
  }
}

export function formatDuration(seconds) {
  const total = Number(seconds || 0)
  if (!total || Number.isNaN(total)) return '0:00'
  const mins = Math.floor(total / 60)
  const secs = Math.floor(total % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export function normalizeAlbum(album) {
  const rawTracks = Array.isArray(album?.music)
    ? album.music
    : Array.isArray(album?.tracks)
      ? album.tracks
      : []
  return {
    ...album,
    albumCover: album?.albumCover || album?.coverImage || '',
    music: rawTracks.map(normalizeTrack),
  }
}
