import { Bell, Loader2, Menu, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import api from '@/api/axios';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

function SearchGroup({ title, items, onPick, formatter }) {
  if (!items?.length) return null;

  return (
    <div className='space-y-1'>
      <p className='px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'>{title}</p>
      {items.map((item) => (
        <button
          key={item._id}
          type='button'
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onPick(item)}
          className='w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted'
        >
          {formatter(item)}
        </button>
      ))}
    </div>
  );
}

export function Topbar({ onMenuOpen }) {
  const { user, logout } = useAuth();
  const { theme, isArtist } = useTheme();
  const {
    notifications,
    unreadCount,
    isConnected,
    isConnecting,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    setNotificationPreference,
  } = useSocket();

  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false);
  const [searchResults, setSearchResults] = useState({ tracks: [], albums: [], artists: [] });
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults({ tracks: [], albums: [], artists: [] });
        return;
      }

      try {
        const res = await api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`);
        const data = res.data?.data || {};
        setSearchResults({
          tracks: data.tracks || [],
          albums: data.albums || [],
          artists: data.artists || [],
        });
      } catch {
        setSearchResults({ tracks: [], albums: [], artists: [] });
      }
    };

    run();
  }, [debouncedQuery]);

  const hasResults = useMemo(
    () => searchResults.tracks.length || searchResults.albums.length || searchResults.artists.length,
    [searchResults]
  );

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const onNotificationClick = async (notification) => {
    await markAsRead(notification._id);
    setNotificationSheetOpen(false);

    const songId = notification?.payload?.songId;
    if (songId) {
      navigate('/discover');
    }
  };

  return (
    <header className={`sticky top-0 z-30 flex h-16 items-center gap-3 px-4 md:px-6 ${theme.classes.topbarBg}`}>
      <Button variant='outline' size='icon' className='md:hidden' onClick={onMenuOpen}>
        <Menu className='h-4 w-4' />
      </Button>

      <div className='relative max-w-xl flex-1'>
        <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isArtist ? 'text-violet-400/50' : 'text-emerald-400/50'}`} />
        <Input
          className={[
            'pl-9',
            isArtist
              ? 'w-72 bg-violet-900/10 border-violet-800/30 text-violet-100 placeholder:text-violet-400/30 focus:border-violet-500/50 focus-visible:ring-violet-500/40'
              : 'w-80 rounded-full bg-emerald-900/10 border-emerald-800/20 text-emerald-100 placeholder:text-emerald-400/25 focus:border-emerald-500/40 focus-visible:ring-emerald-500/30',
          ].join(' ')}
          placeholder={isArtist ? 'Search your tracks, albums...' : 'Search songs, albums, artists...'}
          value={query}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 120)}
          onChange={(e) => setQuery(e.target.value)}
        />

        {searchOpen && query.trim() ? (
          <div className={`absolute z-50 mt-2 w-full rounded-lg border bg-card p-2 shadow-lg ${theme.classes.cardBase}`}>
            <ScrollArea className='max-h-72 [&>[data-radix-scroll-area-viewport]]:scrollbar-none'>
              {hasResults ? (
                <div className='space-y-3'>
                  <SearchGroup
                    title='Songs'
                    items={searchResults.tracks}
                    onPick={() => {
                      navigate('/discover');
                      setSearchOpen(false);
                    }}
                    formatter={(item) => `${item.title} · ${item.artist?.name || 'Unknown Artist'}`}
                  />
                  <SearchGroup
                    title='Albums'
                    items={searchResults.albums}
                    onPick={(item) => {
                      navigate(`/albums/${item._id}`);
                      setSearchOpen(false);
                    }}
                    formatter={(item) => item.title}
                  />
                  <SearchGroup
                    title='Artists'
                    items={searchResults.artists}
                    onPick={(item) => {
                      navigate(`/artist/${item._id}`);
                      setSearchOpen(false);
                    }}
                    formatter={(item) => `${item.name} (@${item.username})`}
                  />
                </div>
              ) : (
                <p className='px-2 py-2 text-sm text-muted-foreground'>No matches found</p>
              )}
            </ScrollArea>
          </div>
        ) : null}
      </div>

      <Sheet open={notificationSheetOpen} onOpenChange={setNotificationSheetOpen}>
        {/* Bell trigger — primary color when live, muted when offline */}
        <SheetTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className={`relative transition-colors ${isConnected ? theme.classes.accentText : 'text-muted-foreground'}`}
          >
            {isConnecting ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Bell className='h-4 w-4' />
            )}
            {unreadCount ? (
              <Badge className='absolute -right-1 -top-1 h-5 min-w-5 px-1 text-[10px]'>{unreadCount}</Badge>
            ) : null}
          </Button>
        </SheetTrigger>

        {/* Notification panel — flex column so header stays fixed and list scrolls */}
        <SheetContent side='right' className='flex h-full flex-col p-0'>
          {/* Header — pr-12 keeps content away from the Sheet's close (X) button */}
          <div className='shrink-0 border-b px-4 pb-3 pt-4 pr-12'>
            <div className='flex items-center gap-2'>
              <SheetTitle className='text-sm font-semibold leading-none'>Notifications</SheetTitle>
              <SheetDescription className='sr-only'>View and manage your real-time notifications</SheetDescription>
              <span
                className={`ml-1 h-2 w-2 rounded-full ${
                  isConnected ? 'bg-emerald-500' : isConnecting ? 'bg-amber-500 animate-pulse' : 'bg-zinc-400'
                }`}
              />
              <span className='text-xs text-muted-foreground'>
                {isConnected ? 'Live' : isConnecting ? 'Connecting...' : 'Offline'}
              </span>
            </div>
            <div className='mt-3 flex items-center gap-1.5'>
              <Button
                size='sm'
                variant='ghost'
                className='h-7 px-2 text-xs'
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
              <Button
                size='sm'
                variant='ghost'
                className='h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10'
                onClick={clearAllNotifications}
              >
                Clear
              </Button>
              <div className='ml-auto flex items-center gap-1.5'>
                {/* Enable is highlighted (default) when already connected */}
                <Button
                  size='sm'
                  variant={isConnected ? 'default' : 'outline'}
                  className={`h-7 px-3 text-xs ${isConnected ? theme.classes.primaryButton : ''}`}
                  onClick={() => setNotificationPreference(true)}
                >
                  Enable
                </Button>
                {/* Disable is highlighted when disconnected (showing current state) */}
                <Button
                  size='sm'
                  variant={!isConnected ? 'default' : 'outline'}
                  className={`h-7 px-3 text-xs ${!isConnected ? theme.classes.primaryButton : ''}`}
                  onClick={() => setNotificationPreference(false)}
                >
                  Disable
                </Button>
              </div>
            </div>
          </div>

          {/* Scrollable notification list */}
          <ScrollArea className='flex-1 [&>[data-radix-scroll-area-viewport]]:scrollbar-none'>
            {notifications.length ? (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  type='button'
                  onClick={() => onNotificationClick(notification)}
                  className={`w-full border-b px-4 py-3 text-left transition-colors hover:bg-muted ${notification.read ? '' : 'bg-primary/5'}`}
                >
                  <p className='text-sm font-medium'>{notification.payload?.message || notification.type}</p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </button>
              ))
            ) : (
              <div className='flex flex-col items-center justify-center py-16 text-muted-foreground'>
                <Bell className='mb-3 h-10 w-10 opacity-20' />
                <p className='text-sm'>No notifications yet</p>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className={`h-10 gap-2 px-2 ${theme.fonts.bodyWeight}`}>
            <Avatar className='h-8 w-8'>
              <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <span className='hidden text-sm md:block'>{user?.name || 'User'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem>{user?.email || 'No email available'}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>Edit Profile</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
