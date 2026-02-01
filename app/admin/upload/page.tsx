import { Suspense } from "react"
import UploadForm from "./upload-form"
import EnvironmentCheck from "./environment-check"

export default function UploadPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Speaker Images</h1>

      {/* Environment Check - Server Component */}
      <Suspense fallback={<div className="p-4 bg-gray-100 rounded">Checking environment...</div>}>
        <EnvironmentCheck />
      </Suspense>

      {/* Upload Form - Client Component */}
      <div className="mt-6">
        <UploadForm />
      </div>
    </div>
  )
}
