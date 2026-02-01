// Utility functions for automatically determining project status based on event date

export type ProjectStatus = "2plus_months" | "1to2_months" | "less_than_month" | "final_week" | "completed" | "cancelled"

/**
 * Calculate the number of days between today and the event date
 */
export function calculateDaysUntilEvent(eventDate: string | Date): number | null {
  if (!eventDate) return null
  
  const event = new Date(eventDate)
  const today = new Date()
  
  // Reset time to start of day for accurate day calculation
  event.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  
  const diffTime = event.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Automatically determine project status based on days until event
 */
export function getAutomaticProjectStatus(eventDate: string | Date, currentStatus?: ProjectStatus): ProjectStatus {
  const daysUntilEvent = calculateDaysUntilEvent(eventDate)
  
  // If no event date, keep current status or default to 2plus_months
  if (daysUntilEvent === null) {
    return currentStatus || "2plus_months"
  }
  
  // Don't change status if already completed or cancelled
  if (currentStatus === "completed" || currentStatus === "cancelled") {
    return currentStatus
  }
  
  // Event has passed
  if (daysUntilEvent < 0) {
    return "completed"
  }
  
  // Automatic categorization based on days until event
  if (daysUntilEvent <= 7) {
    return "final_week"
  } else if (daysUntilEvent <= 30) {
    return "less_than_month"
  } else if (daysUntilEvent <= 60) {
    return "1to2_months"
  } else {
    return "2plus_months"
  }
}

/**
 * Get status label and color for display
 */
export function getProjectStatusInfo(status: ProjectStatus) {
  const statusMap = {
    "2plus_months": { label: "2+ Months Out", color: "bg-blue-100 text-blue-800", bgColor: "bg-blue-50" },
    "1to2_months": { label: "1-2 Months Out", color: "bg-green-100 text-green-800", bgColor: "bg-green-50" },
    "less_than_month": { label: "Less Than 1 Month", color: "bg-yellow-100 text-yellow-800", bgColor: "bg-yellow-50" },
    "final_week": { label: "Final Week", color: "bg-red-100 text-red-800", bgColor: "bg-red-50" },
    "completed": { label: "Completed", color: "bg-gray-100 text-gray-800", bgColor: "bg-gray-50" },
    "cancelled": { label: "Cancelled", color: "bg-gray-100 text-gray-600", bgColor: "bg-gray-50" }
  }
  
  return statusMap[status] || statusMap["2plus_months"]
}

/**
 * Check if a project needs status update based on its event date
 */
export function shouldUpdateProjectStatus(eventDate: string | Date, currentStatus: ProjectStatus): boolean {
  const autoStatus = getAutomaticProjectStatus(eventDate, currentStatus)
  return autoStatus !== currentStatus
}

/**
 * Get all projects that need status updates
 */
export function getProjectsNeedingStatusUpdate(projects: Array<{ event_date?: string | Date, status: ProjectStatus }>) {
  return projects.filter(project => 
    project.event_date && shouldUpdateProjectStatus(project.event_date, project.status)
  )
}