'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const isAccessDenied = error === 'AccessDenied'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl">
            {isAccessDenied ? 'Access Denied' : 'Authentication Error'}
          </CardTitle>
          <CardDescription>
            {isAccessDenied
              ? 'Your email is not authorized to access this application. Please contact an administrator.'
              : 'An error occurred during authentication. Please try again.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            onClick={() => window.location.href = '/auth/signin'}
            variant="outline"
          >
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
