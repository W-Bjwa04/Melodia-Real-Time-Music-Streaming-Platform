import { Bell, BellOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

import api from '@/api/axios';
import { AlbumCard } from '@/components/shared/AlbumCard';
import { TrackCard } from '@/components/shared/TrackCard';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/hooks/useSocket';
export default function ArtistProfilePage() {
  const { artistId } = useParams();
  const { subscribedArtistIds, toggleArtistSubscription } = useSocket();
  const [profile, setProfile] = useState(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const profileRes = await api.get(`/artists/${artistId}/profile`);

        setProfile(profileRes.data?.data || null);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load artist profile');
      }
    };

    run();
  }, [artistId]);

  const subscribed = useMemo(() => subscribedArtistIds.includes(String(artistId)), [subscribedArtistIds, artistId]);

  const toggleSubscribe = async () => {
    setSubscribing(true);
    try {
      await toggleArtistSubscription(artistId);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Subscription failed');
    } finally {
      setSubscribing(false);
    }
  };

  if (!profile) {
    return <div className='rounded-lg border bg-card/60 p-5 text-sm text-muted-foreground'>Loading artist profile...</div>;
  }

  return (
    <div className='space-y-8'>
      <section className='overflow-hidden rounded-2xl border bg-card/60'>
        <div className='h-40 bg-gradient-to-r from-indigo-600/40 via-sky-600/30 to-cyan-600/20' />
        <div className='-mt-12 px-6 pb-6'>
          <div className='flex flex-wrap items-end justify-between gap-3'>
            <div>
              <img
                src={profile.artist?.profilePicture || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=200'}
                alt={profile.artist?.name || 'Artist'}
                className='h-24 w-24 rounded-full border-4 border-background object-cover'
              />
              <h1 className='mt-3 text-3xl font-bold'>{profile.artist?.name}</h1>
              <p className='text-muted-foreground'>@{profile.artist?.username}</p>
              <p className='mt-2 max-w-xl text-sm text-muted-foreground'>{profile.artist?.bio || 'No bio added yet.'}</p>
            </div>
            <Button variant={subscribed ? 'default' : 'outline'} onClick={toggleSubscribe} disabled={subscribing}>
              {subscribed ? <BellOff className='mr-2 h-4 w-4' /> : <Bell className='mr-2 h-4 w-4' />}
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </Button>
          </div>

          <div className='mt-5 grid gap-3 sm:grid-cols-3'>
            <div className='rounded-lg border p-3'>
              <p className='text-xs text-muted-foreground'>Followers</p>
              <p className='text-xl font-semibold'>{profile.followerCount || 0}</p>
            </div>
            <div className='rounded-lg border p-3'>
              <p className='text-xs text-muted-foreground'>Total Plays</p>
              <p className='text-xl font-semibold'>{profile.totalPlays || 0}</p>
            </div>
            <div className='rounded-lg border p-3'>
              <p className='text-xs text-muted-foreground'>Singles</p>
              <p className='text-xl font-semibold'>{profile.singles?.length || 0}</p>
            </div>
          </div>
        </div>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Discography - Albums</h2>
        <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
          {(profile.albums || []).map((album) => (
            <AlbumCard key={album._id} album={album} />
          ))}
        </div>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Singles</h2>
        <div className='grid gap-3 md:grid-cols-2'>
          {(profile.singles || []).map((track) => (
            <TrackCard key={track._id} track={track} queue={profile.singles || []} />
          ))}
        </div>
      </section>
    </div>
  );
}
