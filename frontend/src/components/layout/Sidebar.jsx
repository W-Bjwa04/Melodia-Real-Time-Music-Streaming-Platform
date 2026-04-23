import { BarChart3, ChevronLeft, ChevronRight, Disc3, Home, LibraryBig, ListMusic, LogOut, PlusCircle, Search, Upload, UserRound, UsersRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { usePlayer } from '@/hooks/usePlayer'

const commonLinks = [
  { label: 'Home', to: '/home', icon: Home },
  { label: 'Discover', to: '/discover', icon: Search },
  { label: 'Albums', to: '/albums', icon: LibraryBig },
  { label: 'Artists', to: '/artists', icon: UsersRound },
  { label: 'Playlists', to: '/playlists', icon: ListMusic },
  { label: 'Profile', to: '/profile', icon: UserRound },
]

const artistLinks = [
  { label: 'Upload Track', to: '/upload', icon: Upload },
  { label: 'Create Album', to: '/create-album', icon: Disc3 },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
]

export function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth()
  const { theme, isArtist } = useTheme()
  const { isPlaying, currentTrack } = usePlayer()
  const navigate = useNavigate()
  const [artistCollapsed, setArtistCollapsed] = useState(false)

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', theme.sidebar.width)
  }, [theme.sidebar.width])

  useEffect(() => {
    const targetWidth = isArtist ? (artistCollapsed ? '92px' : '260px') : theme.sidebar.width
    document.documentElement.style.setProperty('--sidebar-width', targetWidth)
  }, [artistCollapsed, isArtist, theme.sidebar.width])

  const initials = useMemo(() => {
    const name = user?.name || 'Guest'
    return name
      .split(' ')
      .map((chunk) => chunk[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [user?.name])

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  if (isArtist) {
    const showLabels = !artistCollapsed

    return (
      <aside className={cn('flex h-full w-full flex-col backdrop-blur-xl', theme.classes.sidebarBg)}>
        <div className='px-4 pb-4 pt-6'>
          <div className='flex items-center gap-2'>
            <div className='grid h-10 w-10 place-items-center rounded-xl border border-violet-500/40 bg-violet-500/15 text-violet-200'>
              <Disc3 className='h-5 w-5' />
            </div>
            {showLabels ? (
              <div className='min-w-0'>
                <p className='text-[11px] uppercase tracking-[0.22em] text-violet-300/70'>♪ MELODIA</p>
                <p className='inline-block border-b border-violet-500/50 pb-1 text-xl font-black tracking-tight text-white shadow-[0_1px_8px_rgba(124,58,237,0.6)]'>
                  STUDIO
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <nav className='flex-1 space-y-3 px-3'>
          {showLabels ? <p className='px-2 text-[10px] font-bold tracking-[0.2em] text-violet-400/50'>N A V I G A T I O N</p> : null}
          {commonLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink key={link.to} to={link.to} onClick={onNavigate}>
                {({ isActive }) => (
                  <div className='relative'>
                    {isActive ? <span className='absolute inset-y-2 left-0 w-0.5 rounded-full bg-violet-400' /> : null}
                    <Button
                      variant='ghost'
                      className={cn(
                        'h-11 w-full justify-start px-3',
                        showLabels ? 'gap-3' : 'justify-center px-0',
                        isActive ? theme.classes.sidebarActiveLink : theme.classes.sidebarInactiveLink,
                      )}
                    >
                      <Icon className='h-4 w-4 shrink-0' />
                      {showLabels ? <span className='text-sm'>{link.label}</span> : null}
                      {isActive && showLabels ? <span className='ml-auto h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(124,58,237,0.8)]' /> : null}
                    </Button>
                  </div>
                )}
              </NavLink>
            )
          })}

          <Separator className='bg-violet-900/50' />
          {showLabels ? <p className='px-2 text-[10px] font-bold tracking-[0.2em] text-violet-400/50'>C R E A T I V E T O O L S</p> : null}
          {artistLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink key={link.to} to={link.to} onClick={onNavigate}>
                {({ isActive }) => (
                  <div className='relative'>
                    {isActive ? <span className='absolute inset-y-2 left-0 w-0.5 rounded-full bg-violet-400' /> : null}
                    <Button
                      variant='ghost'
                      className={cn(
                        'h-11 w-full justify-start px-3',
                        showLabels ? 'gap-3' : 'justify-center px-0',
                        isActive ? theme.classes.sidebarActiveLink : theme.classes.sidebarInactiveLink,
                      )}
                    >
                      <Icon className='h-4 w-4 shrink-0' />
                      {showLabels ? <span className='text-sm'>{link.label}</span> : null}
                      {showLabels && link.label === 'Upload Track' ? (
                        <span className='ml-auto rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[9px] text-amber-400'>NEW</span>
                      ) : null}
                    </Button>
                  </div>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className='space-y-3 border-t border-violet-900/50 p-3'>
          <div className='flex items-center gap-3 rounded-xl border border-violet-800/30 bg-violet-900/10 p-3'>
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            {showLabels ? (
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold text-violet-50'>{user?.name || 'Guest'}</p>
                <p className='truncate text-xs text-violet-200/70'>@{user?.username || 'listener'}</p>
                <span className={cn('mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold', theme.classes.roleBadge)}>
                  ARTIST
                </span>
              </div>
            ) : null}
          </div>
          <div className='flex items-center gap-2 border-t border-violet-900/40 pt-2'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => setArtistCollapsed((value) => !value)}
              className='flex-1 justify-center text-violet-200 hover:bg-violet-900/30'
            >
              {showLabels ? <ChevronLeft className='mr-2 h-4 w-4' /> : <ChevronRight className='mr-2 h-4 w-4' />}
              {showLabels ? 'Collapse' : 'Expand'}
            </Button>
            <div className='h-5 w-px bg-violet-900/40' />
            <Button variant='ghost' onClick={handleLogout} className='flex-1 justify-center text-violet-200 hover:bg-violet-900/30'>
              <LogOut className='mr-2 h-4 w-4' />
              {showLabels ? 'Logout' : null}
            </Button>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <TooltipProvider delayDuration={120}>
      <aside className={cn('flex h-full w-full flex-col items-center py-4', theme.classes.sidebarBg)}>
        <div className='grid h-10 w-10 place-items-center rounded-xl border border-emerald-700/50 bg-emerald-900/20 text-emerald-300'>
          <Disc3 className='h-5 w-5' />
        </div>

        <div className='mt-6 flex w-full flex-1 flex-col items-center gap-2 px-2'>
          {commonLinks.map((link) => {
            const Icon = link.icon
            return (
              <Tooltip key={link.to}>
                <TooltipTrigger asChild>
                  <NavLink to={link.to} onClick={onNavigate} className='w-full'>
                    {({ isActive }) => (
                      <div className={cn('relative rounded-2xl', isActive ? 'border-l-2 border-emerald-400/90 pl-0.5' : '')}>
                        <Button
                          variant='ghost'
                          className={cn(
                            'h-11 w-full rounded-2xl p-0',
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_0_16px_rgba(16,185,129,0.15)]'
                              : theme.classes.sidebarInactiveLink,
                          )}
                        >
                          <Icon className='h-4 w-4' />
                        </Button>
                      </div>
                    )}
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side='right' sideOffset={12} className='border border-emerald-900/40 bg-[#0F1A1A] text-emerald-200'>
                  {link.label}
                </TooltipContent>
              </Tooltip>
            )
          })}

          <Separator className='my-2 bg-emerald-900/40 opacity-30' />
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink to='/discover' onClick={onNavigate} className='w-full'>
                {({ isActive }) => (
                  <div className={cn('relative rounded-2xl', isActive ? 'border-l-2 border-emerald-400/90 pl-0.5' : '')}>
                    <Button
                      variant='ghost'
                      className={cn(
                        'h-11 w-full rounded-2xl p-0',
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_0_16px_rgba(16,185,129,0.15)]'
                          : theme.classes.sidebarInactiveLink,
                      )}
                    >
                      <PlusCircle className='h-4 w-4' />
                    </Button>
                  </div>
                )}
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side='right' sideOffset={12} className='border border-emerald-900/40 bg-[#0F1A1A] text-emerald-200'>
              Discovery Mode
            </TooltipContent>
          </Tooltip>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type='button'
              className={cn(
                'mt-auto rounded-full border border-emerald-700/60 p-1.5 transition hover:border-emerald-500/70 hover:bg-emerald-900/30',
                isPlaying && currentTrack ? 'ring-2 ring-emerald-500/30 animate-pulse' : '',
              )}
            >
              <Avatar className='h-9 w-9'>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          </PopoverTrigger>
          <PopoverContent className='w-64 border-emerald-800/60 bg-[#0F1A1A] text-emerald-50'>
            <p className='text-sm font-semibold'>{user?.name || 'Guest'}</p>
            <p className='text-xs text-emerald-200/70'>@{user?.username || 'listener'}</p>
            <div className='mt-3 flex items-center justify-between rounded-md border border-emerald-900/50 bg-emerald-900/20 p-2'>
              <span className='text-xs text-emerald-300'>Lounge listener</span>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', theme.classes.roleBadge)}>LISTENER</span>
            </div>
            <Button variant='outline' className='mt-3 w-full border-emerald-700/40 bg-emerald-900/20' onClick={handleLogout}>
              <LogOut className='mr-2 h-4 w-4' />
              Logout
            </Button>
          </PopoverContent>
        </Popover>
      </aside>
    </TooltipProvider>
  )
}
