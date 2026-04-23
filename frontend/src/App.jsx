import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AppLayout } from '@/components/layout/AppLayout'
import { ArtistRoute } from '@/components/shared/ArtistRoute'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import AlbumDetailPage from '@/pages/AlbumDetailPage'
import AlbumsPage from '@/pages/AlbumsPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import ArtistProfilePage from '@/pages/ArtistProfilePage'
import ArtistSubscriptionsPage from '@/pages/ArtistSubscriptionsPage'
import CreateAlbumPage from '@/pages/CreateAlbumPage'
import DiscoverPage from '@/pages/DiscoverPage'
import HomePage from '@/pages/HomePage'
import PlaylistDetailPage from '@/pages/PlaylistDetailPage'
import PlaylistsPage from '@/pages/PlaylistsPage'
import ProfilePage from '@/pages/ProfilePage'
import SearchPage from '@/pages/SearchPage'
import UploadMusicPage from '@/pages/UploadMusicPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'

function DefaultRedirect() {
  const { isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? '/home' : '/login'} replace />
}

function Guarded({ children }) {
  return (
    <ProtectedRoute>
      <ErrorBoundary>{children}</ErrorBoundary>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<DefaultRedirect />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />

          <Route
            element={
              <Guarded>
                <AppLayout />
              </Guarded>
            }
          >
            <Route path='/home' element={<HomePage />} />
            <Route path='/discover' element={<DiscoverPage />} />
            <Route path='/search' element={<SearchPage />} />
            <Route path='/albums' element={<AlbumsPage />} />
            <Route path='/albums/:id' element={<AlbumDetailPage />} />
            <Route path='/artists' element={<ArtistSubscriptionsPage />} />
            <Route path='/artist/:artistId' element={<ArtistProfilePage />} />
            <Route path='/playlists' element={<PlaylistsPage />} />
            <Route path='/playlists/:id' element={<PlaylistDetailPage />} />
            <Route path='/profile' element={<ProfilePage />} />
            <Route
              path='/analytics'
              element={
                <ArtistRoute>
                  <AnalyticsPage />
                </ArtistRoute>
              }
            />
            <Route
              path='/upload'
              element={
                <ArtistRoute>
                  <UploadMusicPage />
                </ArtistRoute>
              }
            />
            <Route
              path='/create-album'
              element={
                <ArtistRoute>
                  <CreateAlbumPage />
                </ArtistRoute>
              }
            />
          </Route>

        <Route path='*' element={<DefaultRedirect />} />
      </Routes>
      <Toaster richColors position='top-right' />
    </>
  )
}
