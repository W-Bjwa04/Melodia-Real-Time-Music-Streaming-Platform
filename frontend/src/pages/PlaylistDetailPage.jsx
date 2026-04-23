import { Play, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import api from '@/api/axios'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePlayer } from '@/hooks/usePlayer'
import { normalizeTrack } from '@/lib/music'

export default function PlaylistDetailPage() {
  const { id } = useParams()
  const { play, setQueue } = usePlayer()
  const [playlist, setPlaylist] = useState(null)
  const [allTracks, setAllTracks] = useState([])
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    try {
      const [playlistRes, tracksRes] = await Promise.all([api.get(`/playlists/${id}`), api.get('/music')])
      setPlaylist(playlistRes.data?.data || null)
      setAllTracks((tracksRes.data?.data || []).map(normalizeTrack))
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load playlist')
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const addTrack = async (trackId) => {
    try {
      const res = await api.post(`/playlists/${id}/tracks`, { trackId })
      setPlaylist(res.data?.data || playlist)
      toast.success('Track added to playlist')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not add track')
    }
  }

  const removeTrack = async (trackId) => {
    try {
      const res = await api.delete(`/playlists/${id}/tracks/${trackId}`)
      setPlaylist(res.data?.data || playlist)
      toast.success('Track removed from playlist')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not remove track')
    }
  }

  const playableTracks = (playlist?.tracks || []).map(normalizeTrack)

  const filteredTrackPool = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allTracks
    return allTracks.filter((t) => t.title.toLowerCase().includes(q) || (t.artist?.name || '').toLowerCase().includes(q))
  }, [allTracks, search])

  if (!playlist) {
    return <EmptyState title='Playlist not found' description='This playlist may be private or deleted.' />
  }

  return (
    <div className='space-y-8'>
      <section className='rounded-xl border bg-card/60 p-5'>
        <p className='text-xs uppercase tracking-[0.2em] text-primary'>Playlist</p>
        <h1 className='mt-2 text-3xl font-bold'>{playlist.name}</h1>
        <p className='mt-2 text-sm text-muted-foreground'>{playlist.description || 'No description'}</p>
        <div className='mt-4 flex gap-2'>
          <Button
            onClick={() => {
              if (!playableTracks.length) return
              setQueue(playableTracks)
              play(playableTracks[0])
            }}
          >
            <Play className='mr-2 h-4 w-4' /> Play Playlist
          </Button>
        </div>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Tracks in Playlist</h2>
        {(playlist.tracks || []).length ? (
          <div className='space-y-2'>
            {playableTracks.map((track) => (
              <div key={track._id} className='flex items-center justify-between rounded-lg border bg-card/60 p-3'>
                <div>
                  <p className='font-medium'>{track.title}</p>
                  <p className='text-sm text-muted-foreground'>{track.artist?.name || 'Unknown Artist'}</p>
                </div>
                <Button size='sm' variant='outline' onClick={() => removeTrack(track._id)}>
                  <Trash2 className='mr-2 h-4 w-4' /> Remove
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title='No tracks yet' description='Add tracks from the catalog below.' />
        )}
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Add More Tracks</h2>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search song to add' />
        <div className='grid gap-2'>
          {filteredTrackPool.map((track) => (
            <div key={track._id} className='flex items-center justify-between rounded-lg border bg-card/60 p-3'>
              <div>
                <p className='font-medium'>{track.title}</p>
                <p className='text-sm text-muted-foreground'>{track.artist?.name || 'Unknown Artist'}</p>
              </div>
              <Button size='sm' onClick={() => addTrack(track._id)}>
                <Plus className='mr-1 h-4 w-4' /> Add
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
