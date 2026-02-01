import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-middleware'
import mammoth from 'mammoth'

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authError = requireAdminAuth(request)
    if (authError) {
      return authError
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({
        error: 'No file provided'
      }, { status: 400 })
    }

    // Get file extension
    const fileName = file.name
    const fileExtension = fileName.split('.').pop()?.toLowerCase()

    let extractedText = ''

    try {
      if (fileExtension === 'txt' || fileExtension === 'md') {
        // Handle text files
        extractedText = await file.text()
      } else if (fileExtension === 'docx') {
        // Handle DOCX files using mammoth
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value

        if (result.messages && result.messages.length > 0) {
          console.log('Mammoth conversion messages:', result.messages)
        }
      } else {
        return NextResponse.json({
          error: `Unsupported file format: ${fileExtension}. Please upload a .txt, .md, or .docx file.`
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        text: extractedText,
        fileName: fileName,
        fileType: fileExtension
      })

    } catch (parseError) {
      console.error('Error parsing file:', parseError)
      return NextResponse.json({
        error: 'Failed to parse file content',
        details: parseError instanceof Error ? parseError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}
