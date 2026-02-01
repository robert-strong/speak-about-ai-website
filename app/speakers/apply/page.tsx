"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SpeakerApplicationRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the main application page
    router.replace("/apply")
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Redirecting...</h2>
        <p className="text-gray-600">Taking you to the speaker application form</p>
      </div>
    </div>
  )
}