import { BarChart3, Headphones, Heart, Pause, Pencil, Play, Plus, Share2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import api from '@/api/axios'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useTheme } from '@/context/ThemeContext'
import { usePlayer } from '@/hooks/usePlayer'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'
import { formatDuration } from '@/lib/music'

const fallbackCover = 'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?q=80&w=600&auto=format&fit=crop'

export function TrackCard({ track, queue = [] }) {
  const { currentTrack, isPlaying, play, pause, setQueue } = usePlayer()
  const { user, isArtist: authArtist } = useAuth()
  const { theme, isArtist } = useTheme()
  const { listenerCounts } = useSocket()
  const [likesCount, setLikesCount] = useState(Number(track.likes || 0))

  const [isLikedByMe, setIsLikedByMe] = useState(
    () => (track.likedBy || []).some((id) => String(id) === String(user?.id)),
  )

  const active = currentTrack?._id === track._id

  const onPlayToggle = () => {
    setQueue(queue.length ? queue : [track])
    if (active && isPlaying) {
      pause()
      return
    }
    play(track)
  }

  const toggleLike = async () => {
    try {
      const res = await api.post(`/music/${track._id}/like`)
      setLikesCount(res.data?.data?.likesCount ?? likesCount)
      setIsLikedByMe(Boolean(res.data?.data?.liked))
      toast.success(res.data?.message || 'Updated')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update like')
    }
  }

  return (
    <Card className={`space-y-3 border p-3 transition-all duration-300 ${theme.classes.cardBase} ${theme.classes.cardHover}`}>
      <div className='flex items-center gap-4'>
        <img src={track.coverImage || fallbackCover} alt={track.title} className='h-14 w-14 rounded-md object-cover' />
        <div className='min-w-0 flex-1'>
          <p className={`truncate ${theme.fonts.headingWeight}`}>{track.title}</p>
          <p className='truncate text-sm text-muted-foreground'>{track.artist?.name || 'Unknown Artist'}</p>
        </div>
        <p className='hidden text-xs text-muted-foreground sm:block'>{formatDuration(track.duration)}</p>
        <Button size='icon' variant={active ? 'default' : 'outline'} onClick={onPlayToggle} className={active ? theme.classes.primaryButton : ''}>
          {active && isPlaying ? <Pause className='h-4 w-4' /> : <Play className='h-4 w-4' />}
        </Button>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        {isArtist || authArtist ? (
          <>
            <Button size='sm' variant='outline' onClick={() => toast.message('Track metadata editor coming soon')}>
              <Pencil className='mr-1 h-4 w-4' /> Edit
            </Button>
            <Button size='sm' variant='outline' onClick={() => toast.message('Delete flow will be connected to moderation API')}>
              <Trash2 className='mr-1 h-4 w-4' /> Delete
            </Button>
            <Button size='sm' variant='outline' onClick={() => toast.message('Analytics panel available in profile dashboard')}>
              <BarChart3 className='mr-1 h-4 w-4' /> Stats
            </Button>
          </>
        ) : (
          <>
            <Button size='sm' variant={isLikedByMe ? 'default' : 'outline'} onClick={toggleLike} className={isLikedByMe ? theme.classes.primaryButton : ''}>
              <Heart className='mr-1.5 h-4 w-4' /> {likesCount}
            </Button>
            <div className='flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400'>
              <Headphones className='h-3.5 w-3.5' />
              {listenerCounts[String(track._id)] || 0}
            </div>
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                setQueue(queue.length ? queue : [track])
                toast.success('Added to queue')
              }}
            >
              <Plus className='mr-1 h-4 w-4' /> Queue
            </Button>
            <Button size='sm' variant='outline' onClick={() => toast.success('Share link copied')}>
              <Share2 className='mr-1 h-4 w-4' /> Share
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}
