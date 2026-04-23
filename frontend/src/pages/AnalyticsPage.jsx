import { BarChart3, Headphones, Heart, MessageSquare, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import api from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useTheme } from '@/context/ThemeContext';
import { normalizeTrack } from '@/lib/music';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { listenerCounts } = useSocket();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalListeners: 0,
    totalLikes: 0,
    totalComments: 0,
    tracks: [],
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetching artist profile to get their tracks and general stats
        const res = await api.get(`/artists/${user?._id || user?.id}/profile`);
        const data = res.data?.data;
        
        if (data) {
          const tracks = (data.singles || []).map(normalizeTrack);
          const totalLikes = tracks.reduce((sum, t) => sum + (t.likes || 0), 0);
          const totalComments = tracks.reduce((sum, t) => sum + (t.comments?.length || 0), 0);
          const totalListeners = tracks.reduce((sum, t) => sum + (t.listeners || 0), 0);

          setStats({
            totalListeners: data.totalPlays || totalListeners,
            totalLikes,
            totalComments,
            tracks,
          });
        }
      } catch (err) {
        toast.error('Failed to load analytics data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='grid gap-4 md:grid-cols-3'>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className='h-32 rounded-xl' />
          ))}
        </div>
        <Skeleton className='h-[400px] rounded-xl' />
      </div>
    );
  }

  return (
    <div className='space-y-8 animate-in fade-in duration-500'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Studio Analytics</h1>
          <p className='text-muted-foreground'>Performance overview for your music</p>
        </div>
        <div className='hidden sm:block'>
          <div className='flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium'>
            <TrendingUp className='h-4 w-4 text-emerald-500' />
            <span>Growth: +12% this month</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card className='relative overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Total Listeners</CardTitle>
            <Headphones className='h-4 w-4 text-violet-400' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalListeners.toLocaleString()}</div>
            <p className='text-xs text-muted-foreground mt-1'>+2.5% from last week</p>
          </CardContent>
          <div className='absolute -right-2 -bottom-2 h-16 w-16 opacity-5'>
            <Headphones className='h-full w-full' />
          </div>
        </Card>

        <Card className='relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Total Likes</CardTitle>
            <Heart className='h-4 w-4 text-emerald-400' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalLikes.toLocaleString()}</div>
            <p className='text-xs text-muted-foreground mt-1'>Across all tracks</p>
          </CardContent>
          <div className='absolute -right-2 -bottom-2 h-16 w-16 opacity-5'>
            <Heart className='h-full w-full' />
          </div>
        </Card>

        <Card className='relative overflow-hidden border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Engagement</CardTitle>
            <MessageSquare className='h-4 w-4 text-blue-400' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalComments.toLocaleString()}</div>
            <p className='text-xs text-muted-foreground mt-1'>Total comments received</p>
          </CardContent>
          <div className='absolute -right-2 -bottom-2 h-16 w-16 opacity-5'>
            <MessageSquare className='h-full w-full' />
          </div>
        </Card>
      </div>

      {/* Tracks Detailed List */}
      <Card className='border-violet-500/10 bg-card/50 backdrop-blur-sm'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5 text-violet-400' />
            Track Performance
          </CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <ScrollArea className='h-[400px]'>
            <div className='min-w-[600px]'>
              <div className='grid grid-cols-12 border-b border-white/5 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                <div className='col-span-6'>Track</div>
                <div className='col-span-2 text-center'>Listeners</div>
                <div className='col-span-2 text-center'>Likes</div>
                <div className='col-span-2 text-center'>Comments</div>
              </div>
              
              {stats.tracks.length > 0 ? (
                stats.tracks.map((track) => (
                  <div key={track._id} className='grid grid-cols-12 items-center px-6 py-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0'>
                    <div className='col-span-6 flex items-center gap-3'>
                      <img 
                        src={track.coverImage || 'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?q=80&w=100'} 
                        alt='' 
                        className='h-10 w-10 rounded-md object-cover'
                      />
                      <div className='min-w-0'>
                        <p className='truncate font-medium text-sm'>{track.title}</p>
                        <p className='truncate text-xs text-muted-foreground'>Released: {new Date(track.createdAt || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className='col-span-2 text-center text-sm font-semibold text-violet-100'>
                      {(listenerCounts[String(track._id)] || 0).toLocaleString()}
                    </div>
                    <div className='col-span-2 text-center text-sm font-semibold text-emerald-100'>
                      {(track.likes || 0).toLocaleString()}
                    </div>
                    <div className='col-span-2 text-center text-sm font-semibold text-blue-100'>
                      {(track.comments?.length || 0).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className='py-20 text-center text-muted-foreground'>
                  No tracks found. Start uploading to see analytics!
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
