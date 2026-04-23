import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import api from '@/api/axios'
import { AlbumCard } from '@/components/shared/AlbumCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { TrackCard } from '@/components/shared/TrackCard'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { normalizeAlbum, normalizeTrack } from '@/lib/music'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState({ tracks: [], albums: [], artists: [], playlists: [] })

  const q = searchParams.get('q') || ''

  useEffect(() => {
    const run = async () => {
      if (!q.trim()) {
        setResults({ tracks: [], albums: [], artists: [], playlists: [] })
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(q)}`)
        const data = res.data?.data || {}
        setResults({
          tracks: (data.tracks || []).map(normalizeTrack),
          albums: (data.albums || []).map(normalizeAlbum),
          artists: data.artists || [],
          playlists: data.playlists || [],
        })
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [q])

  const hasAnyResults =
    results.tracks.length || results.albums.length || results.artists.length || results.playlists.length

  return (
    <div className='space-y-8'>
      <div className='flex items-center gap-3'>
        <h1 className='text-2xl font-semibold'>Search</h1>
        <Badge variant='secondary'>{q || 'Type in top search bar'}</Badge>
      </div>

      {loading ? (
        <div className='grid gap-3 md:grid-cols-2'>
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className='h-20 rounded-lg' />
          ))}
        </div>
      ) : !q.trim() ? (
        <EmptyState title='Start searching' description='Find songs, albums, artists, and playlists.' />
      ) : hasAnyResults ? (
        <>
          <section className='space-y-3'>
            <h2 className='text-xl font-semibold'>Songs</h2>
            {results.tracks.length ? (
              <div className='grid gap-3 md:grid-cols-2'>
                {results.tracks.map((track) => (
                  <TrackCard key={track._id} track={track} queue={results.tracks} />
                ))}
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>No songs found.</p>
            )}
          </section>

          <section className='space-y-3'>
            <h2 className='text-xl font-semibold'>Albums</h2>
            {results.albums.length ? (
              <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
                {results.albums.map((album) => (
                  <AlbumCard key={album._id} album={album} />
                ))}
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>No albums found.</p>
            )}
          </section>

          <section className='space-y-3'>
            <h2 className='text-xl font-semibold'>Artists</h2>
            {results.artists.length ? (
              <div className='grid gap-3 md:grid-cols-2'>
                {results.artists.map((artist) => (
                  <div key={artist._id} className='rounded-lg border bg-card/60 p-3'>
                    <p className='font-medium'>{artist.name}</p>
                    <p className='text-sm text-muted-foreground'>@{artist.username} · {artist.role}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>No artists found.</p>
            )}
          </section>

          <section className='space-y-3'>
            <h2 className='text-xl font-semibold'>Playlists</h2>
            {results.playlists.length ? (
              <div className='grid gap-3 md:grid-cols-2'>
                {results.playlists.map((playlist) => (
                  <div key={playlist._id} className='rounded-lg border bg-card/60 p-3'>
                    <p className='font-medium'>{playlist.name}</p>
                    <p className='text-sm text-muted-foreground'>By {playlist.owner?.name || 'Unknown'} · {playlist.likes?.length || 0} likes</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>No playlists found.</p>
            )}
          </section>
        </>
      ) : (
        <EmptyState title='No results found' description='Try another search keyword.' />
      )}
    </div>
  )
}
