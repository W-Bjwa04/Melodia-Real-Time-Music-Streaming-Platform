import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { toast } from 'sonner'

import api from '@/api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function LoginPage() {
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  })

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      const res = await api.post('/auth/login', values)
      const token = res.data?.data?.accessToken
      const user = res.data?.data?.user

      if (!token || !user) {
        throw new Error('Invalid login response')
      }

      login(user, token)
      toast.success('Welcome back')
      navigate('/home')
    } catch {
      toast.error('Login failed. Check your credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='grid min-h-screen lg:grid-cols-2'>
      <div className='hidden bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 p-10 lg:flex lg:flex-col lg:justify-between'>
        <div>
          <p className='text-xs uppercase tracking-[0.24em] text-primary'>Melodia</p>
          <h1 className='mt-4 max-w-md text-5xl font-bold leading-tight text-white'>Music platform for listeners and artists.</h1>
        </div>
        <p className='text-sm text-slate-300'>Immerse in premium sound, discovery, and seamless publishing.</p>
      </div>

      <div className='grid place-items-center p-6'>
        <Card className='w-full max-w-md'>
          <CardContent className='p-6'>
            <h2 className='mb-1 text-2xl font-semibold'>Login</h2>
            <p className='mb-6 text-sm text-muted-foreground'>Sign in to continue listening.</p>

            <Form {...form}>
              <form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name='identifier'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username or Email</FormLabel>
                      <FormControl>
                        <Input placeholder='waleed_602 or email' {...field} />
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

                <Button type='submit' className='w-full' disabled={submitting}>
                  {submitting ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Sign in'}
                </Button>
              </form>
            </Form>

            <p className='mt-4 text-center text-sm text-muted-foreground'>
              New here?{' '}
              <Link to='/register' className='text-primary underline-offset-4 hover:underline'>
                Create account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
