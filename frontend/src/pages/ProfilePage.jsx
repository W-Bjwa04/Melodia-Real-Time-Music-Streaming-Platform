import { useRef, useState } from 'react'
import { toast } from 'sonner'

import api from '@/api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'

export default function ProfilePage() {
  const { user, login, logout } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
  })
  const fileRef = useRef(null)

  const updateProfile = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body = new FormData()
      body.append('name', form.name)
      body.append('username', form.username)
      body.append('email', form.email)
      if (fileRef.current?.files?.[0]) {
        body.append('profilePicture', fileRef.current.files[0])
      }

      const res = await api.patch('/auth/me', body)
      const updated = res.data?.data
      const token = localStorage.getItem('accessToken')
      if (updated && token) {
        login(updated, token)
      }
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile')
    } finally {
      setSubmitting(false)
    }
  }

  const logoutAll = async () => {
    try {
      await api.post('/auth/logout-all')
      logout()
      toast.success('Logged out from all sessions')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to logout all sessions')
    }
  }

  return (
    <div className='mx-auto max-w-2xl'>
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className='space-y-4' onSubmit={updateProfile}>
            <Input placeholder='Name' value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <Input placeholder='Username' value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
            <Input placeholder='Email' value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            <Input type='file' accept='image/*' ref={fileRef} />
            <div className='flex flex-wrap gap-2'>
              <Button type='submit' disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
              <Button type='button' variant='outline' onClick={logoutAll}>Logout All Devices</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
