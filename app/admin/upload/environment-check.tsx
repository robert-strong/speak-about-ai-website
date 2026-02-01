export default function EnvironmentCheck() {
  // This is a server component, so it can access environment variables
  const blobTokenSet = !!process.env.BLOB_READ_WRITE_TOKEN
  const tokenFirstChars = blobTokenSet ? process.env.BLOB_READ_WRITE_TOKEN.substring(0, 5) : "none"

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h2 className="font-bold mb-2">Environment Check (Server-Side):</h2>
      <div className="space-y-1">
        <p>
          BLOB_READ_WRITE_TOKEN: {blobTokenSet ? "✅ Set" : "❌ Not set"}
          {blobTokenSet && <span className="ml-2 text-gray-500 text-sm">(starts with: {tokenFirstChars}...)</span>}
        </p>
        <p>Environment: {process.env.NODE_ENV}</p>
        <p>Vercel Environment: {process.env.VERCEL_ENV || "Not Vercel"}</p>

        {!blobTokenSet && (
          <div className="mt-2 p-3 bg-yellow-100 text-yellow-800 rounded">
            <strong>Warning:</strong> The Blob token is not set. File uploads will fail.
            <ul className="list-disc ml-5 mt-1 text-sm">
              <li>Make sure you've added the Vercel Blob integration</li>
              <li>Check that BLOB_READ_WRITE_TOKEN is set in your environment variables</li>
              <li>If running locally, ensure you have a .env.local file with the token</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
