import { createContext, useRef, useState } from 'react'
import api from '@/api/axios'
import { getSocket } from '@/lib/socket'
import { SOCKET_EVENTS } from '@shared/socketEvents'

export const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const audioRef = useRef(null)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [queue, setQueue] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(70)

  const syncAudioSource = (track) => {
    if (!audioRef.current) return
    if (!track?.audioUrl) return

    if (audioRef.current.src !== track.audioUrl) {
      audioRef.current.src = track.audioUrl
    }
  }

  const play = async (track) => {
    const socket = getSocket()
    if (track) setCurrentTrack(track)
    const activeTrack = track || currentTrack
    if (!activeTrack || !audioRef.current) return

    if (currentTrack?._id && currentTrack._id !== activeTrack._id && socket) {
      socket.emit(SOCKET_EVENTS.SONG_STOPPED, { songId: currentTrack._id })
    }

    syncAudioSource(activeTrack)
    try {
      await audioRef.current.play()
      setIsPlaying(true)

      if (activeTrack?._id) {
        api.post(`/music/${activeTrack._id}/play`).catch(() => {})
        if (socket) {
          socket.emit(SOCKET_EVENTS.SONG_PLAYING, { songId: activeTrack._id })
        }
      }
    } catch {
      setIsPlaying(false)
    }
  }

  const pause = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    const socket = getSocket()
    if (socket && currentTrack?._id) {
      socket.emit(SOCKET_EVENTS.SONG_STOPPED, { songId: currentTrack._id })
    }
    setIsPlaying(false)
  }

  const playByIndex = (index) => {
    if (!queue.length) return
    const safeIndex = (index + queue.length) % queue.length
    const track = queue[safeIndex]
    setCurrentTrack(track)
    play(track)
  }

  const playNext = () => {
    if (!currentTrack || !queue.length) return
    const currentIndex = queue.findIndex((track) => track._id === currentTrack._id)
    playByIndex(currentIndex + 1)
  }

  const playPrev = () => {
    if (!currentTrack || !queue.length) return
    const currentIndex = queue.findIndex((track) => track._id === currentTrack._id)
    playByIndex(currentIndex - 1)
  }

  const onTimeUpdate = () => {
    if (!audioRef.current) return
    const current = audioRef.current.currentTime || 0
    const total = audioRef.current.duration || 0
    setDuration(total)
    if (total > 0) {
      setProgress((current / total) * 100)
    }
  }

  const seek = (value) => {
    if (!audioRef.current || !duration) return
    audioRef.current.currentTime = (value / 100) * duration
    setProgress(value)
  }

  const updateVolume = (value) => {
    setVolume(value)
    if (!audioRef.current) return
    audioRef.current.volume = value / 100
  }

  const value = {
    audioRef,
    currentTrack,
    queue,
    isPlaying,
    progress,
    duration,
    volume,
    play,
    pause,
    playNext,
    playPrev,
    setQueue,
    setProgress,
    seek,
    updateVolume,
    onTimeUpdate,
  }

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}
