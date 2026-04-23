import { Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import api from '@/api/axios'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePlayer } from '@/hooks/usePlayer'
import { normalizeAlbum } from '@/lib/music'

const fallbackCover = 'https://images.unsplash.com/photo-1461784180009-21121b2f204c?q=80&w=900&auto=format&fit=crop'

export default function AlbumDetailPage() {
  const { id } = useParams()
  const [album, setAlbum] = useState(null)
  const [loading, setLoading] = useState(true)
  const { setQueue, play } = usePlayer()

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get(`/music/album/${id}`)
        setAlbum(normalizeAlbum(res.data?.data))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [id])

  if (loading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-56 rounded-2xl' />
        <Skeleton className='h-80 rounded-xl' />
      </div>
    )
  }

  if (!album) {
    return <EmptyState title='Album not found' description='The album may have been removed.' />
  }

  return (
    <div className='space-y-6'>
      <section className='rounded-2xl border bg-card/60 p-6'>
        <div className='flex flex-col gap-6 md:flex-row'>
          <img src={album.albumCover || fallbackCover} alt={album.title} className='h-48 w-48 rounded-xl object-cover shadow-lg' />
          <div className='space-y-3'>
            <p className='text-xs uppercase tracking-[0.2em] text-primary'>Album</p>
            <h1 className='text-3xl font-bold'>{album.title}</h1>
            <p className='text-sm text-muted-foreground'>{album.music.length} tracks</p>
            <Button
              onClick={() => {
                if (!album.music.length) return
                setQueue(album.music)
                play(album.music[0])
              }}
            >
              <Play className='mr-2 h-4 w-4' />
              Play All
            </Button>
          </div>
        </div>
      </section>

      {album.music.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Cover</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className='text-right'>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {album.music.map((track, idx) => (
              <TableRow
                key={track._id}
                className='cursor-pointer'
                onClick={() => {
                  setQueue(album.music)
                  play(track)
                }}
              >
                <TableCell>{idx + 1}</TableCell>
                <TableCell>
                  <img src={track.coverImage || fallbackCover} alt={track.title} className='h-10 w-10 rounded-md object-cover' />
                </TableCell>
                <TableCell>{track.title}</TableCell>
                <TableCell>{track.duration || '--:--'}</TableCell>
                <TableCell className='text-right'>
                  <Button size='icon' variant='outline'>
                    <Play className='h-4 w-4' />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState title='No tracks in this album' description='Add tracks to this album to start listening.' />
      )}
    </div>
  )
}
