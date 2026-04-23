import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { SocketProvider } from '@/context/SocketContext'
import { PlayerProvider } from '@/context/PlayerContext'

document.documentElement.classList.add('dark')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <SocketProvider>
          <BrowserRouter>
            <PlayerProvider>
              <App />
            </PlayerProvider>
          </BrowserRouter>
        </SocketProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
)
