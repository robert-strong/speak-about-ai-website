"use client"

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
        <AdminSidebar isLayoutInstance />
      </div>
      {/* Page content is rendered by children — each page keeps its own ml-72 wrapper */}
      {children}
    </LayoutSidebarContext.Provider>
  )
}
