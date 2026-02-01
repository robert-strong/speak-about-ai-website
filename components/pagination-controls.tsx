"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null
  }

  const handlePrevious = () => {
    onPageChange(Math.max(1, currentPage - 1))
  }

  const handleNext = () => {
    onPageChange(Math.min(totalPages, currentPage + 1))
  }

  return (
    <div className="flex items-center justify-center space-x-4 mt-12">
      <Button onClick={handlePrevious} disabled={currentPage === 1} variant="outline" size="icon">
        <ChevronLeft className="h-5 w-5" />
        <span className="sr-only">Previous page</span>
      </Button>
      <span className="text-sm text-gray-700">
        Page {currentPage} of {totalPages}
      </span>
      <Button onClick={handleNext} disabled={currentPage === totalPages} variant="outline" size="icon">
        <ChevronRight className="h-5 w-5" />
        <span className="sr-only">Next page</span>
      </Button>
    </div>
  )
}

// Provide a default export for compatibility with default-import style
export default PaginationControls
