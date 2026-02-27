"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, FileText } from "lucide-react"

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [clientName, setClientName] = useState("")
  const [company, setCompany] = useState("")

  useEffect(() => {
    // Skip auth check on login page
    if (pathname === "/client-portal/login") return

    const token = localStorage.getItem("clientToken")
    if (!token) {
      router.push("/client-portal/login")
      return
    }

    // Decode JWT to get client name (without verification - server verifies)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      setClientName(payload.name || "")
      setCompany(payload.company || "")
    } catch {
      router.push("/client-portal/login")
    }
  }, [pathname, router])

  const handleLogout = () => {
    localStorage.removeItem("clientToken")
    localStorage.removeItem("clientName")
    localStorage.removeItem("clientCompany")
    router.push("/client-portal/login")
  }

  // Don't show header on login page
  if (pathname === "/client-portal/login") {
    return <div className="min-h-screen bg-gray-50">{children}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img
                src="/speak-about-ai-logo.png"
                alt="Speak About AI"
                className="h-8"
              />
              <div className="hidden sm:block">
                <span className="text-sm font-medium text-gray-500">
                  Client Portal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{clientName}</p>
                {company && (
                  <p className="text-xs text-gray-500">{company}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
