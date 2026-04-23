import { AlertCircle } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function ArtistRoute({ children }) {
  const { isArtist } = useAuth()

  if (!isArtist) {
    return (
      <div className='mx-auto mt-24 max-w-2xl'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Access denied</AlertTitle>
          <AlertDescription>You need an artist account to view this section.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return children
}
