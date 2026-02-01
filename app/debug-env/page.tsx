export default function DebugEnvPage() {
  // This runs on the server, so we can access environment variables
  const sheetId = process.env.GOOGLE_SHEET_ID
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Environment Variables Debug</h1>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded">
          <h2 className="font-bold mb-2">Google Sheets Configuration:</h2>
          <p>
            <strong>GOOGLE_SHEET_ID:</strong>{" "}
            {sheetId ? `${sheetId.substring(0, 10)}...${sheetId.substring(sheetId.length - 10)}` : "❌ Not set"}
          </p>
          <p>
            <strong>GOOGLE_SHEETS_API_KEY:</strong> {apiKey ? `${apiKey.substring(0, 10)}...` : "❌ Not set"}
          </p>
        </div>

        <div className="p-4 bg-blue-50 rounded">
          <h2 className="font-bold mb-2">Expected Google Sheet URL:</h2>
          {sheetId ? (
            <a
              href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              https://docs.google.com/spreadsheets/d/{sheetId}/edit
            </a>
          ) : (
            <p className="text-red-600">Sheet ID not configured</p>
          )}
        </div>

        <div className="p-4 bg-yellow-50 rounded">
          <h2 className="font-bold mb-2">API Test URL:</h2>
          {sheetId && apiKey ? (
            <div>
              <p className="text-sm mb-2">This is the URL being used to fetch data:</p>
              <code className="text-xs bg-gray-100 p-2 rounded block break-all">
                https://sheets.googleapis.com/v4/spreadsheets/{sheetId}/values/Speakers!A:Z?key=
                {apiKey.substring(0, 10)}...
              </code>
            </div>
          ) : (
            <p className="text-red-600">Cannot construct API URL - missing configuration</p>
          )}
        </div>

        <div className="p-4 bg-green-50 rounded">
          <h2 className="font-bold mb-2">Next Steps:</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>Visit the Google Sheet URL above to verify it's the correct sheet</li>
            <li>Check that Katie McMahon and Gopi Kallayil are actually in the sheet</li>
            <li>Verify the sheet is published to the web (File → Share → Publish to web)</li>
            <li>Make sure the sheet tab is named "Speakers" (or update the range in the code)</li>
            <li>Check that the "listed" column is set to TRUE for both speakers</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
