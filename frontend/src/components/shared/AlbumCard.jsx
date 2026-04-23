import { Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useTheme } from '@/context/ThemeContext'

const fallbackCover = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=900&auto=format&fit=crop'

export function AlbumCard({ album }) {
  const navigate = useNavigate()
  const { theme, isArtist } = useTheme()

  return (
    <Card
      className={`group cursor-pointer overflow-hidden border transition-all duration-300 hover:scale-[1.02] ${theme.classes.cardBase} ${theme.classes.cardHover}`}
      onClick={() => navigate(`/albums/${album._id}`)}
    >
      <div className='relative aspect-square overflow-hidden'>
        <img
          src={album.albumCover || fallbackCover}
          alt={album.title}
          className='h-full w-full object-cover transition duration-500 group-hover:scale-105'
        />
        <div className={`absolute inset-0 bg-gradient-to-t opacity-0 transition group-hover:opacity-100 ${isArtist ? 'from-violet-950/80 via-transparent to-transparent' : 'from-emerald-950/70 via-transparent to-transparent'}`}>
          <Button size='icon' className={`absolute bottom-4 right-4 rounded-full ${theme.classes.primaryButton}`}>
            <Play className='h-4 w-4 fill-current' />
          </Button>
        </div>
      </div>
      <CardContent className='space-y-2 p-4'>
        <p className={`line-clamp-1 ${theme.fonts.headingWeight} ${theme.fonts.letterSpacing}`}>{album.title}</p>
        <Badge className={theme.classes.badge}>{(album.music || []).length} tracks</Badge>
      </CardContent>
    </Card>
  )
}
