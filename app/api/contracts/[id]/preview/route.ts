import { type NextRequest, NextResponse } from "next/server"
import { getContractById, generateContractHTML as generateHTML } from "@/lib/contracts-db"
import { requireAdminAuth } from "@/lib/auth-middleware"

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if user is logged in via localStorage/cookies
    const adminToken = request.cookies.get('adminSessionToken')?.value
    const isAdminLoggedIn = request.cookies.get('adminLoggedIn')?.value
    
    // In development, allow bypass for easier testing
    if (process.env.NODE_ENV === 'development') {
      const devBypass = request.headers.get('x-dev-admin-bypass')
      if (!adminToken && !isAdminLoggedIn && devBypass !== 'dev-admin-access') {
        // Still require some form of auth in development
        const authError = requireAdminAuth(request)
        if (authError) return authError
      }
    } else {
      // Production: require proper admin authentication
      const authError = requireAdminAuth(request)
      if (authError) return authError
    }

    const contractId = parseInt(params.id)
    if (isNaN(contractId)) {
      return NextResponse.json({ error: "Invalid contract ID" }, { status: 400 })
    }

    const contract = await getContractById(contractId)
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    const htmlContent = await generateHTML(contractId)
    if (!htmlContent) {
      return NextResponse.json({ error: "Failed to generate contract preview" }, { status: 500 })
    }

    // Return HTML response
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error("Error in GET /api/contracts/[id]/preview:", error)
    return NextResponse.json(
      {
        error: "Failed to generate contract preview",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}