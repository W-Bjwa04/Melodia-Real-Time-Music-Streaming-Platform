import { Heart, Pause, Pencil, Play, Plus, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { SongDetailDialog } from '@/components/shared/SongDetailDialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { usePlayer } from '@/hooks/usePlayer'

const fallbackCover = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop'

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function MusicPlayer() {
  const { theme, isArtist } = useTheme()
  const { user } = useAuth()
  const {
    audioRef,
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    play,
    pause,
    playNext,
    playPrev,
    seek,
    updateVolume,
    onTimeUpdate,
  } = usePlayer()

  const [detailOpen, setDetailOpen] = useState(false)
  const currentTime = (progress / 100) * (duration || 0)
  const ownsTrack = isArtist && String(currentTrack?.artist?._id || '') === String(user?.id || user?._id || '')

  return (
    <footer className={`relative shrink-0 ${theme.classes.playerBg}`}>
      {!isArtist && currentTrack?.coverImage ? (
        <div
          className='pointer-events-none absolute inset-0 opacity-35 blur-2xl'
          style={{ backgroundImage: `url(${currentTrack.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      ) : null}

      <audio
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onEnded={playNext}
        onLoadedMetadata={onTimeUpdate}
        preload='metadata'
      />

      <div className='relative mx-auto grid max-w-[1800px] grid-cols-1 items-center gap-3 px-3 py-3 sm:px-4 md:grid-cols-[minmax(180px,1fr)_minmax(360px,2fr)_minmax(220px,1fr)] md:gap-6 md:px-8'>

        {/* Left — track info (click to open song detail) */}
        <div
          className={`flex items-center gap-3 min-w-0 ${currentTrack ? 'cursor-pointer' : ''}`}
          onClick={() => currentTrack && setDetailOpen(true)}
          title={currentTrack ? 'View song details' : undefined}
        >
          <div className='relative shrink-0'>
            <img
              src={currentTrack?.coverImage || fallbackCover}
              alt={currentTrack?.title || ''}
              className={[
                'h-10 w-10 object-cover shadow-md sm:h-12 sm:w-12',
                isArtist ? 'rounded-md ring-1 ring-violet-800/40' : 'rounded-lg ring-1 ring-emerald-500/20',
              ].join(' ')}
            />
            {isPlaying && (
              <span className='absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background animate-pulse' />
            )}
          </div>

          {isArtist && isPlaying && currentTrack ? (
            <div className='flex h-8 items-end gap-1'>
              {[0, 1, 2, 3, 4].map((item) => (
                <span
                  key={item}
                  className='w-1.5 rounded-full bg-violet-500 animate-bounce'
                  style={{ height: `${12 + item * 2}px`, animationDelay: `${item * 90}ms` }}
                />
              ))}
            </div>
          ) : null}

          <div className='min-w-0'>
            <p className={`truncate text-xs leading-snug sm:text-sm ${theme.fonts.headingWeight}`}>
              {currentTrack?.title || 'No track selected'}
            </p>
            {isArtist ? (
              <p className='mt-0.5 truncate text-[11px] sm:text-xs'>
                {ownsTrack ? <span className={theme.classes.roleBadge}>YOUR TRACK</span> : currentTrack?.artist?.name || 'Melodia'}
              </p>
            ) : currentTrack?.artist?._id ? (
              <Link
                to={`/artist/${currentTrack.artist._id}`}
                onClick={(event) => event.stopPropagation()}
                className='mt-0.5 block truncate text-left text-xs text-emerald-400 underline-offset-2 hover:underline'
              >
                {currentTrack.artist?.name || 'Melodia'}
              </Link>
            ) : (
              <p className='mt-0.5 truncate text-xs text-emerald-400'>{currentTrack?.artist?.name || 'Melodia'}</p>
            )}
          </div>
        </div>

        {/* Center — controls + progress */}
        <div className='flex flex-col items-center gap-2 w-full'>
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8 text-muted-foreground hover:text-foreground sm:h-9 sm:w-9'
              onClick={playPrev}
              disabled={!currentTrack}
            >
              <SkipBack className='h-4 w-4' />
            </Button>

            <Button
              size='icon'
              className={`h-9 w-9 rounded-full shadow sm:h-10 sm:w-10 ${theme.classes.primaryButton}`}
              onClick={() => {
                if (!currentTrack) return
                isPlaying ? pause() : play()
              }}
              disabled={!currentTrack}
            >
              {isPlaying
                ? <Pause className='h-4 w-4' />
                : <Play className='h-4 w-4 translate-x-px' />}
            </Button>

            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8 text-muted-foreground hover:text-foreground sm:h-9 sm:w-9'
              onClick={playNext}
              disabled={!currentTrack}
            >
              <SkipForward className='h-4 w-4' />
            </Button>
          </div>

          {/* Progress bar with timestamps */}
          <div className='flex w-full items-center gap-2'>
            <span className='w-9 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground sm:w-10 sm:text-[11px]'>
              {formatTime(currentTime)}
            </span>
            <Slider
              className={[
                'w-full min-w-0 [&_[data-slot=slider-thumb]]:h-3 [&_[data-slot=slider-thumb]]:w-3',
                isArtist
                  ? '[&_[data-slot=slider-track]]:bg-violet-950/50 [&_[data-slot=slider-range]]:bg-violet-500 [&_[data-slot=slider-thumb]]:border-violet-300/80 [&_[data-slot=slider-thumb]]:shadow-[0_0_8px_rgba(124,58,237,0.8)]'
                  : '[&_[data-slot=slider-track]]:bg-emerald-950/50 [&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-300/70',
              ].join(' ')}
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={(vals) => seek(vals[0])}
              disabled={!currentTrack}
            />
            <span className='w-9 shrink-0 text-[10px] tabular-nums text-muted-foreground sm:w-10 sm:text-[11px]'>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right — volume */}
        <div className='hidden items-center justify-end gap-2 md:flex'>
          {isArtist ? (
            <Button variant='ghost' size='sm' className='text-violet-300 hover:bg-violet-900/30 hover:text-violet-200' onClick={() => toast.message('Edit metadata action coming soon')}>
              <Pencil className='mr-1 h-4 w-4' /> Edit
            </Button>
          ) : (
            <>
              <Button variant='ghost' size='icon' className='text-emerald-300 hover:bg-emerald-900/25 hover:text-emerald-200' onClick={() => toast.success('Added to favorites')}>
                <Heart className='h-4 w-4' />
              </Button>
              <Button variant='ghost' size='sm' className='text-emerald-300 hover:bg-emerald-900/25 hover:text-emerald-200' onClick={() => toast.success('Added to queue')}>
                <Plus className='mr-1 h-4 w-4' /> Queue
              </Button>
            </>
          )}
          <Button
            variant='ghost'
            size='icon'
            className={`h-8 w-8 shrink-0 ${isArtist ? 'text-amber-400 hover:text-amber-300' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => updateVolume(volume === 0 ? 70 : 0)}
          >
            {volume === 0
              ? <VolumeX className='h-4 w-4' />
              : <Volume2 className='h-4 w-4' />}
          </Button>
          <Slider
            className={isArtist
              ? 'w-24 [&_[data-slot=slider-track]]:bg-amber-900/30 [&_[data-slot=slider-range]]:bg-amber-400 [&_[data-slot=slider-thumb]]:border-amber-300/80'
              : 'w-24 [&_[data-slot=slider-track]]:bg-emerald-900/30 [&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-300/70'
            }
            value={[volume]}
            max={100}
            step={1}
            onValueChange={(vals) => updateVolume(vals[0])}
          />
        </div>
      </div>
      {currentTrack && (
        <SongDetailDialog
          key={currentTrack._id}
          song={currentTrack}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}
    </footer>
  )
}
