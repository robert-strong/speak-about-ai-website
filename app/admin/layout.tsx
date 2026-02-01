"use client"

import { AdminSessionMonitor } from "@/components/admin-session-monitor"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Global session monitor for all admin pages */}
      <AdminSessionMonitor />
      {children}
    </>
  )
}
