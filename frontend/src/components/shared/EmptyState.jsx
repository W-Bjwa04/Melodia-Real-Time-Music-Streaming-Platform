import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function EmptyState({ title, description, ctaLabel, onCta }) {
  return (
    <Card className='border-dashed bg-card/40'>
      <CardHeader className='text-center'>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {ctaLabel ? (
        <CardContent className='flex justify-center'>
          <Button onClick={onCta}>{ctaLabel}</Button>
        </CardContent>
      ) : null}
    </Card>
  )
}
