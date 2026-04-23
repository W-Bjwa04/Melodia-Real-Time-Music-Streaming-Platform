import { useEffect, useState } from 'react'

import api from '@/api/axios'
import { AlbumCard } from '@/components/shared/AlbumCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { normalizeAlbum } from '@/lib/music'

export default function AlbumsPage() {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get('/music/albums')
        setAlbums((res.data?.data || []).map(normalizeAlbum))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <h1 className='text-2xl font-semibold'>Albums</h1>
        <Badge variant='secondary'>{albums.length}</Badge>
      </div>

      {loading ? (
        <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
          {Array.from({ length: 8 }).map((_, idx) => (
            <Skeleton key={idx} className='aspect-square rounded-xl' />
          ))}
        </div>
      ) : albums.length ? (
        <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
          {albums.map((album) => (
            <AlbumCard key={album._id} album={album} />
          ))}
        </div>
      ) : (
        <EmptyState title='No albums found' description='Artists can create albums from uploaded tracks.' />
      )}
    </div>
  )
}
