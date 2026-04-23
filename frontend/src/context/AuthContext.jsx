import { createContext, useMemo, useState } from 'react'

import api from '@/api/axios'

export const AuthContext = createContext(null)

function getInitialUser() {
  const raw = localStorage.getItem('user')
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser)
  const [token, setToken] = useState(localStorage.getItem('accessToken') || localStorage.getItem('token'))

  const login = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('accessToken', authToken)
    localStorage.setItem('token', authToken)
    if (typeof userData?.notificationsEnabled === 'boolean') {
      localStorage.setItem('notificationsEnabled', userData.notificationsEnabled ? 'true' : 'false')
    }
  }

  const clearAuthState = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('token')
    localStorage.removeItem('notificationsEnabled')
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Best effort logout call.
    } finally {
      clearAuthState()
    }
  }

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      clearAuthState,
      isAuthenticated: Boolean(token),
      isArtist: user?.role === 'artist',
    }),
    [user, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
