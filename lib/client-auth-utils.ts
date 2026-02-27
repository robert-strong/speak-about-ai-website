import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

export interface ClientAuth {
  clientId: number
  email: string
  name: string
  company: string
}

/**
 * Verify client JWT token from Authorization header.
 * Returns decoded client info or null if invalid.
 */
export function verifyClientToken(request: NextRequest): ClientAuth | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.replace("Bearer ", "")

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
    if (decoded.type !== "client" || !decoded.clientId) {
      return null
    }
    return {
      clientId: decoded.clientId,
      email: decoded.email,
      name: decoded.name || "",
      company: decoded.company || "",
    }
  } catch {
    return null
  }
}
