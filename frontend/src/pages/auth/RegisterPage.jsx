import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UploadCloud, UserCircle2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { toast } from 'sonner'

import api from '@/api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3).regex(/^[a-z0-9_]+$/, 'Lowercase, numbers, underscores only'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['artist', 'listener']),
  profilePicture: z.instanceof(FileList).optional(),
})

export default function RegisterPage() {
  const [submitting, setSubmitting] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [previewRole, setPreviewRole] = useState('listener')
  const avatarInputRef = useRef(null)
  const navigate = useNavigate()

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', username: '', email: '', password: '', role: 'listener' },
  })

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      const body = new FormData()
      body.append('name', values.name)
      body.append('username', values.username)
      body.append('email', values.email)
      body.append('password', values.password)
      body.append('role', values.role)
      if (values.profilePicture?.[0]) body.append('profilePicture', values.profilePicture[0])

      await api.post('/auth/register', body)
      toast.success('Account created successfully')
      navigate('/login')
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed. Try different credentials.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const previewStyles = {
    artist: 'border-violet-500/40 shadow-[0_0_60px_rgba(124,58,237,0.2)]',
    listener: 'border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.15)]',
  }

  return (
    <div className='grid min-h-screen lg:grid-cols-2'>
      <div className={`hidden p-10 transition-all duration-700 lg:flex lg:flex-col lg:justify-between ${previewRole === 'artist' ? 'bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900' : 'bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950'}`}>
        <div>
          <p className={`text-xs uppercase tracking-[0.24em] ${previewRole === 'artist' ? 'text-violet-300' : 'text-emerald-300'}`}>Melodia</p>
          <h1 className='mt-4 max-w-md text-5xl font-bold leading-tight text-white'>
            {previewRole === 'artist' ? 'Build in the studio. Release without limits.' : 'Step into the lounge. Find your next favorite track.'}
          </h1>
        </div>
        <p className='text-sm text-slate-300'>Listeners discover more. Artists publish faster.</p>
      </div>

      <div className='grid place-items-center p-6'>
        <Card className={`w-full max-w-md border transition-all duration-700 ${previewStyles[previewRole]}`}>
          <CardContent className='p-6'>
            <h2 className='mb-1 text-2xl font-semibold'>Register</h2>
            <p className='mb-6 text-sm text-muted-foreground'>Create your Melodia profile.</p>

            <Form {...form}>
              <form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>

                {/* Profile picture picker */}
                <FormField
                  control={form.control}
                  name='profilePicture'
                  render={({ field: { onChange, ...field } }) => (
                    <FormItem className='flex flex-col items-center'>
                      <FormLabel className='self-start'>Profile Picture <span className='text-muted-foreground'>(optional)</span></FormLabel>
                      <FormControl>
                        <label className='group relative cursor-pointer'>
                          <div className='flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-primary/40 bg-muted transition-colors group-hover:border-primary'>
                            {avatarPreview
                              ? <img src={avatarPreview} alt='avatar preview' className='h-full w-full object-cover' />
                              : <UserCircle2 className='h-10 w-10 text-muted-foreground' />}
                          </div>
                          <span className='absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow'>
                            <UploadCloud className='h-3 w-3' />
                          </span>
                          <input
                            type='file'
                            accept='image/*'
                            className='sr-only'
                            ref={avatarInputRef}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) setAvatarPreview(URL.createObjectURL(file))
                              onChange(e.target.files)
                            }}
                            {...field}
                          />
                        </label>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Waleed Shahid' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='username'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder='waleed_602' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type='email' placeholder='waleed602@example.com' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type='password' placeholder='••••••••' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='role'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          setPreviewRole(value)
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select a role' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='artist'>Artist</SelectItem>
                          <SelectItem value='listener'>Listener</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type='submit' className='w-full' disabled={submitting}>
                  {submitting ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Create account'}
                </Button>
              </form>
            </Form>

            <p className='mt-4 text-center text-sm text-muted-foreground'>
              Already registered?{' '}
              <Link to='/login' className='text-primary underline-offset-4 hover:underline'>
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ...existing code...
