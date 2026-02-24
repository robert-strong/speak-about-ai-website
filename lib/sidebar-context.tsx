"use client"

import { createContext, useContext } from "react"

// When true, the admin layout is already rendering the sidebar,
// so individual page-level <AdminSidebar /> calls should render nothing.
export const LayoutSidebarContext = createContext(false)

export function useLayoutSidebar() {
  return useContext(LayoutSidebarContext)
}
