"use server"

export async function fetchRawSheetData() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY

  if (!spreadsheetId || !apiKey) {
    throw new Error("Missing Google Sheet ID or API Key in server environment")
  }

  const range = "Speakers!A:Z"
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`

  try {
    const response = await fetch(url, {
      next: { revalidate: 0 }, // Don't cache for debugging
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Google Sheets API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: data,
      headers: data.values?.[0] || [],
      sampleRow: data.values?.[1] || [],
      totalRows: data.values?.length || 0,
    }
  } catch (error) {
    console.error("Error fetching raw sheet data:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: null,
    }
  }
}
