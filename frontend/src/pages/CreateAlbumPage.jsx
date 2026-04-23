import { zodResolver } from '@hookform/resolvers/zod'
import { UploadCloud } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'

import api from '@/api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { normalizeTrack } from '@/lib/music'

const albumSchema = z.object({
  title: z.string().min(1, 'Album title is required'),
  albumCover: z.instanceof(FileList).refine((f) => f.length > 0, 'Cover image is required'),
  music: z.array(z.string()).min(1, 'Select at least one track'),
})

export default function CreateAlbumPage() {
  const [tracks, setTracks] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [coverPreview, setCoverPreview] = useState('')
  const coverInputRef = useRef(null)

  const form = useForm({
    resolver: zodResolver(albumSchema),
    defaultValues: { title: '', music: [] },
  })

  useEffect(() => {
    const run = async () => {
      const res = await api.get('/music')
      setTracks((res.data?.data || []).map(normalizeTrack))
    }
    run()
  }, [])

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      const body = new FormData()
      body.append('title', values.title)
      body.append('albumCover', values.albumCover[0])
      body.append('music', JSON.stringify(values.music))

      await api.post('/music/create-album', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      toast.success('Album created successfully')
      form.reset({ title: '', music: [] })
      setCoverPreview('')
      if (coverInputRef.current) coverInputRef.current.value = ''
    } catch {
      toast.error('Album creation failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='mx-auto max-w-3xl'>
      <Card>
        <CardHeader>
          <CardTitle>Create Album</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Album Title</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter album title' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='albumCover'
                render={({ field: { onChange, value: _value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Album Cover</FormLabel>
                    <FormControl>
                      <label className='flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/40 p-6 text-center'>
                        <UploadCloud className='mb-2 h-6 w-6 text-primary' />
                        <span className='text-sm'>Drop or choose cover image</span>
                        <Input
                          type='file'
                          accept='image/*'
                          className='hidden'
                          ref={coverInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) setCoverPreview(URL.createObjectURL(file))
                            onChange(e.target.files)
                          }}
                          {...field}
                        />
                      </label>
                    </FormControl>
                    {coverPreview ? <img src={coverPreview} alt='album preview' className='h-36 w-36 rounded-md object-cover' /> : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='music'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Tracks</FormLabel>
                    <div className='space-y-2 rounded-md border p-4'>
                      {tracks.length ? (
                        tracks.map((track) => {
                          const checked = field.value.includes(track._id)
                          return (
                            <label key={track._id} className='flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted/40'>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(state) => {
                                  if (state) {
                                    field.onChange([...field.value, track._id])
                                  } else {
                                    field.onChange(field.value.filter((id) => id !== track._id))
                                  }
                                }}
                              />
                              <span className='text-sm'>{track.title}</span>
                            </label>
                          )
                        })
                      ) : (
                        <p className='text-sm text-muted-foreground'>No tracks found to include.</p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type='submit' className='w-full' disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Album'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
