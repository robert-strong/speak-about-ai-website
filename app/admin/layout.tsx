"use client"

import { Suspense, useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { AdminSessionMonitor } from "@/components/admin-session-monitor"
import { AdminSidebar } from "@/components/admin-sidebar"
import { LayoutSidebarContext } from "@/lib/sidebar-context"

// Pages that should NOT get the persistent sidebar
const NO_SIDEBAR_PATHS = ["/admin", "/admin/reset-password"]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = NO_SIDEBAR_PATHS.includes(pathname)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("adminUser") || "{}")
      setIsDemo(user.is_demo === true)
    } catch {}
  }, [])

  if (isLoginPage) {
    return (
      <>
        <AdminSessionMonitor />
        {children}
      </>
    )
  }

  return (
    <LayoutSidebarContext.Provider value={true}>
      <AdminSessionMonitor />
      {/* Persistent sidebar — rendered once, survives page navigations */}
      <div className="fixed left-0 top-0 h-full z-[60]">
        <Suspense>
          <AdminSidebar isLayoutInstance />
        </Suspense>
      </div>
      {/* Demo mode banner */}
      {isDemo && (
        <div className="fixed top-0 left-72 right-0 z-[55] bg-amber-500 text-white text-center py-1 text-sm font-medium">
          Demo Mode — Sample data only
        </div>
      )}
      {/* Page content is rendered by children — each page keeps its own ml-72 wrapper */}
      <div className={isDemo ? "pt-8" : ""}>
        {children}
      </div>
    </LayoutSidebarContext.Provider>
  )
}
