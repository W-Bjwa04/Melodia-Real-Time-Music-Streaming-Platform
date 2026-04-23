import { zodResolver } from '@hookform/resolvers/zod'
import { UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'

import api from '@/api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const uploadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  genre: z.string().optional(),
  audioFile: z.instanceof(FileList).refine((f) => f.length > 0, 'Audio file is required'),
  coverImage: z.instanceof(FileList).optional(),
})

export default function UploadMusicPage() {
  const [submitting, setSubmitting] = useState(false)
  const [coverPreview, setCoverPreview] = useState('')
  const audioInputRef = useRef(null)
  const coverInputRef = useRef(null)

  const form = useForm({
    resolver: zodResolver(uploadSchema),
    defaultValues: { title: '', genre: '' },
  })
  const watchedAudioFile = useWatch({ control: form.control, name: 'audioFile' })

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      const body = new FormData()
      body.append('title', values.title)
      body.append('genre', values.genre || '')
      body.append('music', values.audioFile[0])
      if (values.coverImage?.[0]) body.append('poster', values.coverImage[0])

      await api.post('/music/upload', body)

      toast.success('Track uploaded successfully')
      form.reset({ title: '', genre: '' })
      setCoverPreview('')
      if (audioInputRef.current) audioInputRef.current.value = ''
      if (coverInputRef.current) coverInputRef.current.value = ''
    } catch (err) {
      const msg = err?.response?.data?.message || 'Upload failed. Please try again.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='mx-auto max-w-2xl'>
      <Card>
        <CardHeader>
          <CardTitle>Upload Music</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder='Track title' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='genre'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre</FormLabel>
                    <FormControl>
                      <Input placeholder='Genre (optional)' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='audioFile'
                render={({ field: { onChange, value: _value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Audio File</FormLabel>
                    <FormControl>
                      <label className='flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/40 p-6 text-center'>
                        <UploadCloud className='mb-2 h-6 w-6 text-primary' />
                        <span className='text-sm'>Drop or choose mp3/wav file</span>
                        <Input
                          type='file'
                          accept='audio/*'
                          className='hidden'
                          ref={audioInputRef}
                          onChange={(e) => onChange(e.target.files)}
                          {...field}
                        />
                      </label>
                    </FormControl>
                    {watchedAudioFile?.[0] ? <Badge>{watchedAudioFile[0].name}</Badge> : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='coverImage'
                render={({ field: { onChange, value: _value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Cover Image</FormLabel>
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
                    {coverPreview ? <img src={coverPreview} alt='cover preview' className='h-32 w-32 rounded-md object-cover' /> : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type='submit' className='w-full' disabled={submitting}>
                {submitting ? 'Uploading...' : 'Upload Track'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
