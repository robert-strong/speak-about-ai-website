"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState("")
  const [project, setProject] = useState<any>(null)
  const [clientEmail, setClientEmail] = useState("")

  useEffect(() => {
    if (token) {
      validateInvitation()
    } else {
      setError("No invitation token provided")
      setLoading(false)
    }
  }, [token])

  const validateInvitation = async () => {
    try {
      const response = await fetch(`/api/client-portal/accept-invite?token=${token}`)
      const data = await response.json()
      
      if (response.ok && data.valid) {
        setProject(data.project)
        setClientEmail(data.clientEmail)
      } else {
        setError(data.error || "Invalid or expired invitation")
      }
    } catch (error) {
      setError("Failed to validate invitation")
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    setAccepting(true)
    setError("")
    
    try {
      const response = await fetch('/api/client-portal/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Store project access info in localStorage
        localStorage.setItem(`project_${data.projectId}_token`, data.projectToken)
        localStorage.setItem('client_portal_project_id', String(data.projectId))
        
        // Redirect to project dashboard
        router.push(`/portal/client/project/${data.projectId}`)
      } else {
        setError(data.error || "Failed to accept invitation")
      }
    } catch (error) {
      setError("An error occurred while accepting the invitation")
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Validating your invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <p className="mt-4 text-sm text-gray-600">
              If you believe this is an error, please contact your event coordinator.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Welcome to Your Event Portal</CardTitle>
          <CardDescription>
            You've been invited to manage event details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {project && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Event Details</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Event:</strong> {project.event_name || project.project_name}</p>
                  {project.event_date && (
                    <p><strong>Date:</strong> {new Date(project.event_date).toLocaleDateString()}</p>
                  )}
                  {project.event_location && (
                    <p><strong>Location:</strong> {project.event_location}</p>
                  )}
                  {project.company && (
                    <p><strong>Organization:</strong> {project.company}</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">What You Can Do</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Review and update venue information</li>
                  <li>• Provide logistics and contact details</li>
                  <li>• Specify technical requirements</li>
                  <li>• Add special requests or notes</li>
                  <li>• View speaker and program information</li>
                </ul>
              </div>

              {clientEmail && (
                <p className="text-sm text-gray-600">
                  Access will be granted to: <strong>{clientEmail}</strong>
                </p>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleAccept} 
                className="w-full"
                disabled={accepting}
              >
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting Invitation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept Invitation & Continue
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}