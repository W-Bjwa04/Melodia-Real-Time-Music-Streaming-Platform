import { Heart, Pause, Play, Send } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import api from '@/api/axios'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/useAuth'
import { usePlayer } from '@/hooks/usePlayer'
import { formatDuration } from '@/lib/music'

const fallback =
  'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?q=80&w=600&auto=format&fit=crop'

export function SongDetailDialog({ song, open, onOpenChange }) {
  const { currentTrack, isPlaying, play, pause, setQueue } = usePlayer()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [likesCount, setLikesCount] = useState(Number(song?.likes || 0))
  const [isLiked, setIsLiked] = useState(() =>
    (song?.likedBy || []).some(
      (id) => String(id) === String(user?.id || user?._id),
    ),
  )
  const [comments, setComments] = useState(song?.comments || [])
  const [commentText, setCommentText] = useState('')

  if (!song) return null

  const active = currentTrack?._id === song._id

  const handlePlay = () => {
    if (active && isPlaying) return pause()
    setQueue([song])
    play(song)
  }

  const handleLike = async () => {
    try {
      const res = await api.post(`/music/${song._id}/like`)
      setLikesCount(res.data?.data?.likesCount ?? likesCount)
      setIsLiked(Boolean(res.data?.data?.liked))
    } catch {
      toast.error('Could not update like')
    }
  }

  const handleComment = async () => {
    if (!commentText.trim()) return
    try {
      const res = await api.post(`/music/${song._id}/comments`, { text: commentText })
      setComments(res.data?.data || [])
      setCommentText('')
    } catch {
      toast.error('Could not post comment')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-sm gap-0 overflow-hidden p-0 sm:max-w-md'>
        <DialogTitle className='sr-only'>{song.title}</DialogTitle>

        {/* Cover art */}
        <div className='relative aspect-square w-full overflow-hidden'>
          <img
            src={song.coverImage || fallback}
            alt={song.title}
            className='h-full w-full object-cover'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />

          {/* Play button */}
          <button
            onClick={handlePlay}
            className='absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg transition-transform hover:scale-105 active:scale-95'
          >
            {active && isPlaying ? (
              <Pause className='h-5 w-5 fill-primary-foreground text-primary-foreground' />
            ) : (
              <Play className='h-5 w-5 translate-x-px fill-primary-foreground text-primary-foreground' />
            )}
          </button>

          {/* Title + artist over image */}
          <div className='absolute bottom-0 left-0 p-4 pr-20'>
            <p className='truncate text-lg font-bold leading-tight text-white'>{song.title}</p>
            <button
              className='mt-0.5 text-sm text-white/70 transition-colors hover:text-white'
              onClick={() => {
                if (song.artist?._id) {
                  onOpenChange(false)
                  navigate(`/artist/${song.artist._id}`)
                }
              }}
            >
              {song.artist?.name || 'Unknown Artist'}
            </button>
          </div>
        </div>

        {/* Details */}
        <div className='space-y-4 bg-card p-5'>
          {/* Meta + like */}
          <div className='flex flex-wrap items-center gap-2'>
            {song.genre ? (
              <Badge variant='secondary' className='text-xs'>
                {song.genre}
              </Badge>
            ) : null}
            {song.duration ? (
              <span className='text-xs text-muted-foreground'>{formatDuration(song.duration)}</span>
            ) : null}
            <div className='ml-auto'>
              <Button
                size='sm'
                variant={isLiked ? 'default' : 'outline'}
                className='h-8 gap-1.5 px-3'
                onClick={handleLike}
              >
                <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
                <span className='text-xs'>{likesCount}</span>
              </Button>
            </div>
          </div>

          {/* Comments list */}
          {comments.length > 0 && (
            <ScrollArea className='max-h-32 rounded-md border p-2'>
              <div className='space-y-2'>
                {comments.map((c, i) => (
                  <div key={c._id || i} className='flex gap-2 text-sm'>
                    <span className='shrink-0 font-medium text-foreground'>
                      {c.user?.name || 'User'}:
                    </span>
                    <span className='text-muted-foreground'>{c.text}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Add comment */}
          <div className='flex gap-2'>
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              placeholder='Add a comment...'
              className='h-9 text-sm'
            />
            <Button size='icon' className='h-9 w-9 shrink-0' onClick={handleComment}>
              <Send className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
