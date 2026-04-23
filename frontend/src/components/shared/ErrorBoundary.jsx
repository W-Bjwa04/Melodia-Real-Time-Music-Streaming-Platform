import { Component } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='grid min-h-[60vh] place-items-center p-6'>
          <Card className='w-full max-w-md'>
            <CardHeader>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>The page crashed unexpectedly.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()}>Reload app</Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
