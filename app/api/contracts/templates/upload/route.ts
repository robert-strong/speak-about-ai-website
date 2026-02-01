import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const templateId = formData.get("templateId") as string

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.docx')) {
      return NextResponse.json(
        { error: "Only .docx files are supported" },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob Storage
    const blob = await put(`contracts/templates/${templateId}-${Date.now()}.docx`, file, {
      access: "public",
    })

    // Store template metadata in database if needed
    // For now, we're storing in localStorage on the client

    return NextResponse.json({
      url: blob.url,
      fileName: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error uploading contract template:", error)
    return NextResponse.json(
      { error: "Failed to upload template" },
      { status: 500 }
    )
  }
}