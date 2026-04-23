import { useEffect, useState } from 'react'

import api from '@/api/axios'
import { EmptyState } from '@/components/shared/EmptyState'
import { TrackCard } from '@/components/shared/TrackCard'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { normalizeTrack } from '@/lib/music'

export default function DiscoverPage() {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get('/music')
        setTracks((res.data?.data || []).map(normalizeTrack))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <h1 className='text-2xl font-semibold'>Discover</h1>
        <Badge variant='secondary'>{tracks.length}</Badge>
      </div>

      {loading ? (
        <div className='grid gap-3 md:grid-cols-2'>
          {Array.from({ length: 8 }).map((_, idx) => (
            <Skeleton key={idx} className='h-20 rounded-lg' />
          ))}
        </div>
      ) : tracks.length ? (
        <div className='grid gap-3 md:grid-cols-2'>
          {tracks.map((track) => (
            <TrackCard key={track._id} track={track} queue={tracks} />
          ))}
        </div>
      ) : (
        <EmptyState title='No tracks to discover' description='Check back soon for new music.' />
      )}
    </div>
  )
}
