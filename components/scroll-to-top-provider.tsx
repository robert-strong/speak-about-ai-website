"use client"

import type React from "react"

import { useScrollToTop } from "@/hooks/useScrollToTop"

export function ScrollToTopProvider({ children }: { children: React.ReactNode }) {
  useScrollToTop()
  return <>{children}</>
}
