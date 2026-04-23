import { Bell, BellOff, Search, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import api from '@/api/axios'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from '@/context/ThemeContext'
import { useSocket } from '@/hooks/useSocket'

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=240&auto=format&fit=crop'

export default function ArtistSubscriptionsPage() {
  const { theme } = useTheme()
  const { subscribedArtistIds, toggleArtistSubscription } = useSocket()

  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [artists, setArtists] = useState([])
  const [subscribedArtists, setSubscribedArtists] = useState([])
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true)

  const loadSubscribedArtists = async () => {
    setLoadingSubscriptions(true)
    try {
      const res = await api.get('/subscriptions')
      const normalized = (res.data?.data || [])
        .map((item) => item.artistId)
        .filter(Boolean)
      setSubscribedArtists(normalized)
    } catch {
      setSubscribedArtists([])
    } finally {
      setLoadingSubscriptions(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSubscribedArtists()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      return
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setSearching(true)
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`)
        const found = (res.data?.data?.artists || []).filter((artist) => artist.role === 'artist')
        if (!cancelled) {
          setArtists(found)
        }
      } catch {
        if (!cancelled) {
          setArtists([])
        }
      } finally {
        if (!cancelled) {
          setSearching(false)
        }
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      setSearching(false)
    }
  }, [query])

  const subscribedCount = useMemo(() => subscribedArtistIds.length, [subscribedArtistIds])

  const handleToggle = async (artistId) => {
    try {
      const nowSubscribed = await toggleArtistSubscription(artistId)
      toast.success(nowSubscribed ? 'Subscribed to artist updates' : 'Unsubscribed from artist updates')
      await loadSubscribedArtists()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update subscription')
    }
  }

  const renderArtistCard = (artist) => {
    const subscribed = subscribedArtistIds.includes(String(artist._id))

    return (
      <Card key={artist._id} className={`p-4 ${theme.classes.cardBase} ${theme.classes.cardHover}`}>
        <div className='flex items-center justify-between gap-3'>
          <Link to={`/artist/${artist._id}`} className='min-w-0 flex items-center gap-3'>
            <img
              src={artist.profilePicture || FALLBACK_AVATAR}
              alt={artist.name}
              className='h-12 w-12 rounded-full object-cover ring-1 ring-border/60'
            />
            <div className='min-w-0'>
              <p className={`truncate text-sm ${theme.fonts.headingWeight}`}>{artist.name}</p>
              <p className='truncate text-xs text-muted-foreground'>@{artist.username}</p>
            </div>
          </Link>

          <Button
            size='sm'
            variant={subscribed ? 'default' : 'outline'}
            className={subscribed ? theme.classes.primaryButton : ''}
            onClick={() => handleToggle(artist._id)}
          >
            {subscribed ? <BellOff className='mr-1 h-4 w-4' /> : <Bell className='mr-1 h-4 w-4' />}
            {subscribed ? 'Subscribed' : 'Subscribe'}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className='space-y-8'>
      <section className={`rounded-2xl border p-6 ${theme.classes.cardBase}`}>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h1 className={`text-2xl ${theme.fonts.headingWeight} ${theme.fonts.letterSpacing}`}>Artist Subscriptions</h1>
            <p className='mt-1 text-sm text-muted-foreground'>Search artists and subscribe to get release notifications in one place.</p>
          </div>
          <span className={theme.classes.badge}>{subscribedCount} subscribed</span>
        </div>

        <div className='relative mt-5 max-w-xl'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className='pl-9'
            placeholder='Search artists by name or username...'
          />
        </div>
      </section>

      <section className='space-y-3'>
        <h2 className={`text-lg ${theme.fonts.headingWeight}`}>Search Results</h2>
        {searching ? (
          <div className='grid gap-3 md:grid-cols-2'>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className='h-20 rounded-xl' />
            ))}
          </div>
        ) : query.trim() ? (
          artists.length ? (
            <div className='grid gap-3 md:grid-cols-2'>
              {artists.map(renderArtistCard)}
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>No artists found for this search.</p>
          )
        ) : (
          <p className='text-sm text-muted-foreground'>Type an artist name above to search.</p>
        )}
      </section>

      <section className='space-y-3'>
        <h2 className={`text-lg ${theme.fonts.headingWeight}`}>Your Subscribed Artists</h2>
        {loadingSubscriptions ? (
          <div className='grid gap-3 md:grid-cols-2'>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className='h-20 rounded-xl' />
            ))}
          </div>
        ) : subscribedArtists.length ? (
          <div className='grid gap-3 md:grid-cols-2'>
            {subscribedArtists.map(renderArtistCard)}
          </div>
        ) : (
          <div className='rounded-xl border border-dashed p-8 text-center text-muted-foreground'>
            <UserRound className='mx-auto mb-2 h-6 w-6 opacity-60' />
            You have not subscribed to any artists yet.
          </div>
        )}
      </section>
    </div>
  )
}