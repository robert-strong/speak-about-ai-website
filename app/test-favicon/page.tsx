import Image from "next/image"

export default function TestFaviconPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Favicon Test Page</h1>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Current Favicon</h2>
          <p className="mb-4">Check your browser tab to see the current favicon.</p>
          <p className="text-sm text-gray-600">
            The favicon should display the new AI logo with a blue circular background and white "AI" text.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Logo Preview</h2>
          <div className="border rounded-lg p-4 bg-gray-50">
            <Image src="/new-ai-logo.png" alt="Speak About AI Logo" width={64} height={64} className="rounded" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Different Sizes</h2>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <Image src="/new-ai-logo.png" alt="16x16" width={16} height={16} className="rounded" />
              <p className="text-xs mt-1">16x16</p>
            </div>
            <div className="text-center">
              <Image src="/new-ai-logo.png" alt="32x32" width={32} height={32} className="rounded" />
              <p className="text-xs mt-1">32x32</p>
            </div>
            <div className="text-center">
              <Image src="/new-ai-logo.png" alt="64x64" width={64} height={64} className="rounded" />
              <p className="text-xs mt-1">64x64</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Look at your browser tab - you should see the new AI logo</li>
            <li>If you still see the old favicon, try hard refreshing (Ctrl+F5 or Cmd+Shift+R)</li>
            <li>Clear your browser cache if the old favicon persists</li>
            <li>The favicon should appear on all pages of the site</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
