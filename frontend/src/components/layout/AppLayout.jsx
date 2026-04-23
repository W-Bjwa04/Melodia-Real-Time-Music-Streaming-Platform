import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { MusicPlayer } from '@/components/layout/MusicPlayer'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useTheme } from '@/context/ThemeContext'

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const { theme } = useTheme()

  return (
    // Outer shell: full viewport height, no overflow so only content scrolls
    <div className={`flex h-screen flex-col overflow-hidden ${theme.classes.appBg}`}>

      {/* Middle row: sidebar + main content */}
      <div className='flex flex-1 min-h-0 overflow-hidden'>

        {/* Desktop sidebar — scrolls independently */}
        <div className='hidden shrink-0 overflow-y-auto md:block' style={{ width: 'var(--sidebar-width)' }}>
          <Sidebar />
        </div>

        {/* Mobile sidebar in a Sheet */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side='left' className='w-[260px] p-0'>
            <Sidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Right column: topbar (sticky) + scrollable page content */}
        <div className='flex flex-1 flex-col overflow-hidden'>
          <Topbar onMenuOpen={() => setOpen(true)} />
          <main className='flex-1 overflow-y-auto px-4 py-6 md:px-8'>
            <Outlet />
          </main>
        </div>
      </div>

      {/* Player sits here — no fixed/z-index, never overlaps content */}
      <MusicPlayer />
    </div>
  )
}
