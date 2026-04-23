import { Heart, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import api from '@/api/axios'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function PlaylistsPage() {
  const [myPlaylists, setMyPlaylists] = useState([])
  const [publicPlaylists, setPublicPlaylists] = useState([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [mineRes, publicRes] = await Promise.all([api.get('/playlists/mine'), api.get('/playlists/public')])
      setMyPlaylists(mineRes.data?.data || [])
      setPublicPlaylists(publicRes.data?.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const createPlaylist = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      await api.post('/playlists', {
        name,
        description,
        isPublic: true,
      })
      toast.success('Playlist created')
      setName('')
      setDescription('')
      fetchData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create playlist')
    }
  }

  const likePlaylist = async (playlistId) => {
    try {
      await api.post(`/playlists/${playlistId}/like`)
      fetchData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to like playlist')
    }
  }

  return (
    <div className='space-y-8'>
      <Card>
        <CardHeader>
          <CardTitle>Create Playlist</CardTitle>
        </CardHeader>
        <CardContent>
          <form className='grid gap-3 md:grid-cols-[1fr_2fr_auto]' onSubmit={createPlaylist}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='Playlist name' />
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder='Description (optional)' />
            <Button type='submit'>
              <Plus className='mr-2 h-4 w-4' />
              Create
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>My Playlists</h2>
        {!loading && !myPlaylists.length ? (
          <EmptyState title='No playlists yet' description='Create your first playlist to start organizing songs.' />
        ) : (
          <div className='grid gap-3 md:grid-cols-2'>
            {myPlaylists.map((playlist) => (
              <Card key={playlist._id}>
                <CardContent className='space-y-2 p-4'>
                  <div className='flex items-center justify-between'>
                    <Link className='font-semibold hover:underline' to={`/playlists/${playlist._id}`}>
                      {playlist.name}
                    </Link>
                    <Button size='sm' variant='ghost' onClick={() => likePlaylist(playlist._id)}>
                      <Heart className='mr-1 h-4 w-4' /> {playlist.likes?.length || 0}
                    </Button>
                  </div>
                  <p className='text-sm text-muted-foreground'>{playlist.description || 'No description'}</p>
                  <p className='text-xs text-muted-foreground'>{playlist.tracks?.length || 0} tracks</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Public Playlists</h2>
        {!loading && !publicPlaylists.length ? (
          <EmptyState title='No public playlists' description='Public playlists from users will appear here.' />
        ) : (
          <div className='grid gap-3 md:grid-cols-2'>
            {publicPlaylists.map((playlist) => (
              <Card key={playlist._id}>
                <CardContent className='space-y-2 p-4'>
                  <div className='flex items-center justify-between'>
                    <Link className='font-semibold hover:underline' to={`/playlists/${playlist._id}`}>
                      {playlist.name}
                    </Link>
                    <Button size='sm' variant='ghost' onClick={() => likePlaylist(playlist._id)}>
                      <Heart className='mr-1 h-4 w-4' /> {playlist.likes?.length || 0}
                    </Button>
                  </div>
                  <p className='text-sm text-muted-foreground'>By {playlist.owner?.name || 'Unknown'}</p>
                  <p className='text-xs text-muted-foreground'>{playlist.tracks?.length || 0} tracks</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
