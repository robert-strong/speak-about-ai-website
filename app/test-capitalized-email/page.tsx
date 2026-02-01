"use client"

import { useState } from "react"
import { submitLandingPageForm } from "@/app/actions/submit-landing-page-form"

export default function TestCapitalizedEmailPage() {
  const [status, setStatus] = useState<string>("")
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simulate what Contentful sends - Email with capital E
    const testData = {
      Email: "test@example.com", // Capital E like Contentful
      sourceUrl: "https://example.com/lp/test",
      landingPageTitle: "Test Landing Page"
    }
    
    setStatus("Submitting...")
    console.log("Sending:", testData)
    
    const result = await submitLandingPageForm(testData as any)
    console.log("Result:", result)
    
    setStatus(result.success ? `✅ ${result.message}` : `❌ ${result.message}`)
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">Test Capitalized Email Field</h1>
          <p className="mb-6 text-gray-600">
            This tests the exact format Contentful sends: {`{Email: "..."}`} with capital E
          </p>
          
          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
            >
              Test Submit with Capital "Email"
            </button>
          </form>
          
          {status && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <pre className="text-sm">{status}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}