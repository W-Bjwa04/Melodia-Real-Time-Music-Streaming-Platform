import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Headphones, Users, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import api from '@/api/axios'
import { AlbumCard } from '@/components/shared/AlbumCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { SongDetailDialog } from '@/components/shared/SongDetailDialog'
import { TrackCard } from '@/components/shared/TrackCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { usePlayer } from '@/hooks/usePlayer'
import { normalizeAlbum, normalizeTrack } from '@/lib/music'
import { useTrendingSocket } from '@/hooks/useTrendingSocket'
import { useSocket } from '@/hooks/useSocket'

export default function HomePage() {
  const [albums, setAlbums] = useState([])
  const [tracks, setTracks] = useState([])
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSong, setSelectedSong] = useState(null)
  const [songDialogOpen, setSongDialogOpen] = useState(false)
  const navigate = useNavigate()
  const { theme, isArtist } = useTheme()
  const { user } = useAuth()
  const { currentTrack } = usePlayer()
  const { listenerCounts } = useSocket()

  const openSongDetail = (song) => {
    setSelectedSong(song)
    setSongDialogOpen(true)
  }

  useEffect(() => {
    const run = async () => {
      try {
        const [musicRes, albumsRes, trendingRes] = await Promise.all([
          api.get('/music'),
          api.get('/music/albums'),
          api.get('/songs/trending'),
        ])
        setTracks((musicRes.data?.data || []).map(normalizeTrack))
        setAlbums((albumsRes.data?.data || []).map(normalizeAlbum))
        setTrending((trendingRes.data?.data || []).map(normalizeTrack))
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  useTrendingSocket((payload) => {
    const songs = Array.isArray(payload?.songs) ? payload.songs : []
    setTrending(songs.map(normalizeTrack))
  })

  const totalTrackLikes = tracks.reduce((sum, item) => sum + Number(item.likes || 0), 0)

  return (
    <div className={isArtist ? 'space-y-10' : 'space-y-7'}>
      <section className={[
        'relative overflow-hidden rounded-2xl border p-8',
        isArtist ? 'border-violet-500/30' : 'border-emerald-500/25',
        `bg-gradient-to-r ${theme.classes.gradientHero}`,
      ].join(' ')}>
        {isArtist ? (
          <>
            <div
              className='pointer-events-none absolute inset-0 opacity-[0.03]'
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cg fill='%23fff'%3E%3Ccircle cx='6' cy='12' r='1'/%3E%3Ccircle cx='44' cy='36' r='1'/%3E%3Ccircle cx='92' cy='18' r='1'/%3E%3Ccircle cx='130' cy='42' r='1'/%3E%3Ccircle cx='20' cy='84' r='1'/%3E%3Ccircle cx='68' cy='98' r='1'/%3E%3Ccircle cx='116' cy='88' r='1'/%3E%3Ccircle cx='148' cy='118' r='1'/%3E%3Ccircle cx='34' cy='138' r='1'/%3E%3Ccircle cx='78' cy='146' r='1'/%3E%3Ccircle cx='126' cy='150' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
              }}
            />
            <div className='pointer-events-none absolute -left-20 -top-16 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl' />
          </>
        ) : (
          <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(16,185,129,0.08),transparent_55%)]' />
        )}

        <div className='max-w-3xl space-y-5'>
          {isArtist ? (
            <Badge className='relative inline-flex items-center gap-2 border-violet-500/30 bg-violet-700/15 text-violet-200'>
              <span className='h-2 w-2 rounded-full bg-violet-400 animate-pulse' />
              Welcome back, creator
            </Badge>
          ) : (
            <p className='text-sm italic uppercase tracking-[0.2em] text-emerald-400/70'>Curated for your mood</p>
          )}

          {isArtist ? (
            <>
              <p className='text-sm text-violet-200/85'>Welcome back, {user?.name || 'Artist'}</p>
              <h1 className={`text-4xl md:text-5xl ${theme.classes.pageHeading}`}>YOUR STUDIO IS READY</h1>
              <div className='h-px w-16 bg-violet-500' />
              <div className='flex flex-wrap gap-3'>
                <Button className={theme.classes.primaryButton} onClick={() => navigate('/upload')}>⬆ Upload Track</Button>
                <Button variant='secondary' onClick={() => navigate('/create-album')}>📀 Create Album</Button>
                <Button variant='outline' onClick={() => navigate('/profile')}>📊 Analytics</Button>
              </div>
              <div className='mt-3 grid gap-2 text-sm sm:grid-cols-3'>
                <div className='rounded-xl border border-violet-800/30 bg-violet-900/10 px-4 py-3'>
                  <p className='text-lg'>🎵</p>
                  <p className='text-xl font-black text-violet-50'>{tracks.length}</p>
                  <p className='text-xs text-violet-300/70'>Tracks</p>
                </div>
                <div className='rounded-xl border border-violet-800/30 bg-violet-900/10 px-4 py-3'>
                  <p className='text-lg'>💿</p>
                  <p className='text-xl font-black text-violet-50'>{albums.length}</p>
                  <p className='text-xs text-violet-300/70'>Albums</p>
                </div>
                <div className='rounded-xl border border-violet-800/30 bg-violet-900/10 px-4 py-3'>
                  <p className='text-lg'>👁</p>
                  <p className='text-xl font-black text-violet-50'>{(totalTrackLikes * 8 || 1200).toLocaleString()}</p>
                  <p className='text-xs text-violet-300/70'>Total Plays</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className='text-sm text-emerald-100/80'>Good evening, {user?.name || 'Listener'} 🌙</p>
              <h1 className={`text-3xl leading-tight md:text-4xl ${theme.classes.pageHeading}`}>
                What do you want
                <br />
                to listen to?
              </h1>
              <div className='flex flex-wrap gap-3'>
                <Button className={theme.classes.primaryButton} onClick={() => navigate('/discover')}>▶ Continue Listening</Button>
                <Button variant='outline' className='border-emerald-700/30 text-emerald-200 hover:bg-emerald-900/20' onClick={() => navigate('/discover')}>
                  🔍 Discover New Music
                </Button>
              </div>
              {currentTrack ? (
                <div className='mt-2 flex items-center gap-2 text-xs text-emerald-300/70'>
                  <span className='uppercase tracking-[0.18em]'>Now Playing</span>
                  <span className='h-px flex-1 bg-emerald-700/40' />
                  <span className='truncate max-w-[180px]'>{currentTrack.title}</span>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <section className='space-y-4'>
        <div className='flex items-center justify-between'>
          {isArtist ? (
            <div className='flex items-center gap-3'>
              <div className='h-5 w-1 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(124,58,237,0.6)]' />
              <h2 className='text-lg font-black tracking-tight text-white'>Trending Right Now</h2>
            </div>
          ) : (
            <h2 className='text-lg font-semibold tracking-wide text-emerald-50'>Trending Right Now</h2>
          )}
          {isArtist ? <Badge className={theme.classes.badge}>Top 10</Badge> : <span className='text-xs uppercase tracking-widest text-emerald-400/60'>Top 10</span>}
        </div>

        {loading ? (
          <div className='grid gap-3 md:grid-cols-2'>
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className='h-20 rounded-lg' />
            ))}
          </div>
        ) : (
          <div className='space-y-2'>
            <AnimatePresence>
              {trending.map((song, index) => (
                <div
                  key={song._id}
                  className='flex cursor-pointer items-center gap-3 rounded-lg border bg-card/60 p-3 transition-colors hover:bg-card'
                  onClick={() => openSongDetail(song)}
                >
                  <span className='w-8 text-sm font-semibold text-muted-foreground'>
                    #{index + 1}
                  </span>
                  <img
                    src={song.coverImage || 'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?q=80&w=200'}
                    alt={song.title}
                    className='h-12 w-12 rounded-md object-cover'
                  />
                  <div className='min-w-0 flex-1'>
                    <p className='truncate font-medium'>{song.title}</p>
                    <p className='truncate text-xs text-muted-foreground'>{song.artist?.name || 'Unknown Artist'}</p>
                  </div>
                  <div className='flex items-center gap-3 text-sm font-medium'>
                    <div className='flex items-center gap-1 text-emerald-400'>
                      <Headphones className='h-3.5 w-3.5' />
                      <span>{listenerCounts[String(song._id)] || 0}</span>
                    </div>
                    <span className='text-muted-foreground/50'>•</span>
                    <span className='text-muted-foreground'>
                      {song.likes} likes
                    </span>
                  </div>
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <section className='space-y-4'>
        <div className='flex items-center justify-between'>
          {isArtist ? (
            <div className='flex items-center gap-3'>
              <div className='h-5 w-1 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(124,58,237,0.6)]' />
              <h2 className='text-lg font-black tracking-tight text-white'>Featured Albums</h2>
            </div>
          ) : (
            <h2 className='text-lg font-semibold tracking-wide text-emerald-50'>Featured Albums</h2>
          )}
          <Button variant='ghost' onClick={() => navigate('/albums')}>View all</Button>
        </div>

        {loading ? (
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className='aspect-square rounded-xl' />
            ))}
          </div>
        ) : albums.length ? (
          <ScrollArea className='w-full whitespace-nowrap [&>[data-radix-scroll-area-viewport]]:scrollbar-none'>
            <div className='flex gap-4 pb-4'>
              {albums.map((album) => (
                <div key={album._id} className='w-48 shrink-0 md:w-56'>
                  <AlbumCard album={album} />
                </div>
              ))}
            </div>
            <ScrollBar orientation='horizontal' />
          </ScrollArea>
        ) : (
          isArtist ? (
            <div className='py-12 text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-700/30 bg-violet-900/30 shadow-[0_0_30px_rgba(124,58,237,0.2)]'>
                <Upload className='h-7 w-7 text-violet-400' />
              </div>
              <h3 className='mb-1 font-bold text-white'>Your discography starts here</h3>
              <p className='mb-4 text-sm text-violet-300/50'>Upload your first track to get started</p>
              <Button className='bg-violet-600 hover:bg-violet-500' onClick={() => navigate('/upload')}>Upload First Track</Button>
            </div>
          ) : (
            <div className='py-12 text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-700/20 bg-emerald-900/20 shadow-[0_0_24px_rgba(16,185,129,0.15)]'>
                <Headphones className='h-7 w-7 text-emerald-400' />
              </div>
              <h3 className='mb-1 font-semibold text-emerald-50'>Nothing here yet</h3>
              <p className='mb-4 text-sm text-emerald-300/40'>Artists will upload music that appears here</p>
              <Button variant='outline' className='border-emerald-700/40 text-emerald-400 hover:bg-emerald-900/20' onClick={() => navigate('/discover')}>
                Explore Discover
              </Button>
            </div>
          )
        )}
      </section>

      <section className='space-y-4'>
        <div className='flex items-center justify-between'>
          {isArtist ? (
            <div className='flex items-center gap-3'>
              <div className='h-5 w-1 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(124,58,237,0.6)]' />
              <h2 className='text-lg font-black tracking-tight text-white'>Recently Added</h2>
            </div>
          ) : (
            <h2 className='text-lg font-semibold tracking-wide text-emerald-50'>Recently Added</h2>
          )}
          {isArtist ? <Badge className={theme.classes.badge}>{tracks.length}</Badge> : <span className='text-xs uppercase tracking-widest text-emerald-400/60'>{tracks.length}</span>}
        </div>

        {loading ? (
          <div className='grid gap-3 md:grid-cols-2'>
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className='h-20 rounded-lg' />
            ))}
          </div>
        ) : tracks.length ? (
          <div className='grid gap-3 md:grid-cols-2'>
            {tracks.slice(0, 8).map((track) => (
              <TrackCard key={track._id} track={track} queue={tracks} />
            ))}
          </div>
        ) : (
          <EmptyState title='No tracks available' description='Tracks uploaded by artists will appear here.' />
        )}
      </section>

      {selectedSong && (
        <SongDetailDialog
          key={selectedSong._id}
          song={selectedSong}
          open={songDialogOpen}
          onOpenChange={setSongDialogOpen}
        />
      )}
    </div>
  )
}
