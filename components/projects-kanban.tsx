"use client"

import { useState, useEffect, DragEvent } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, DollarSign, Clock, AlertTriangle, CheckCircle2, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Project {
  id: number
  project_name: string
  client_name: string
  client_email?: string
  company?: string
  project_type: string
  description?: string
  status: "2plus_months" | "1to2_months" | "less_than_month" | "final_week" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  start_date: string
  deadline?: string
  event_date?: string
  event_location?: string
  event_type?: string
  attendee_count?: number
  speaker_fee?: number
  budget: number
  spent: number
  completion_percentage: number
  tags?: string[]
  created_at: string
}

const STAGES = [
  { id: "2plus_months", title: "2+ Months Out", color: "bg-blue-500", description: "Early planning phase" },
  { id: "1to2_months", title: "1-2 Months Out", color: "bg-yellow-500", description: "Active preparation" },
  { id: "less_than_month", title: "< 1 Month Out", color: "bg-orange-500", description: "Final preparations" },
  { id: "final_week", title: "Final Week", color: "bg-red-500", description: "Last minute details" },
  { id: "completed", title: "Completed", color: "bg-green-500", description: "Event finished" },
  { id: "cancelled", title: "Cancelled", color: "bg-gray-500", description: "Event cancelled" },
]

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

export function ProjectsKanban() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedProject, setDraggedProject] = useState<Project | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(Array.isArray(data) ? data : [])
      } else {
        setProjects([])
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (e: DragEvent<HTMLDivElement>, project: Project) => {
    setDraggedProject(project)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>, newStatus: string) => {
    e.preventDefault()
    if (!draggedProject || draggedProject.status === newStatus) return

    const updatedProjects = projects.map(project =>
      project.id === draggedProject.id ? { ...project, status: newStatus as Project['status'] } : project
    )
    setProjects(updatedProjects)

    try {
      const response = await fetch(`/api/projects/${draggedProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        // Revert on error
        fetchProjects()
        toast({
          title: "Error",
          description: "Failed to update project status",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Success",
          description: `Project moved to ${STAGES.find(s => s.id === newStatus)?.title}`,
        })
      }
    } catch (error) {
      console.error("Error updating project status:", error)
      fetchProjects()
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive"
      })
    }

    setDraggedProject(null)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const calculateDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading projects...</div>
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex flex-col lg:flex-row gap-4 lg:min-w-max p-4">
        {STAGES.map(stage => {
          const stageProjects = (projects || []).filter(project => project.status === stage.id)
          const totalFees = stageProjects.reduce((sum, project) => sum + Number(project.speaker_fee || project.budget || 0), 0)

          return (
            <div
              key={stage.id}
              className="flex-1 lg:min-w-[320px] w-full"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                    {stage.title}
                  </h3>
                  <Badge variant="secondary">{stageProjects.length}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {stage.description}
                </p>
                {totalFees > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(totalFees)} total fees
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {stageProjects.map(project => {
                  const eventDate = project.event_date || project.deadline
                  const daysUntilEvent = calculateDaysUntilDeadline(eventDate)
                  const isOverdue = daysUntilEvent !== null && daysUntilEvent < 0
                  const isUrgent = daysUntilEvent !== null && daysUntilEvent <= 7 && daysUntilEvent >= 0

                  return (
                    <Card
                      key={project.id}
                      className={cn(
                        "cursor-move hover:shadow-lg transition-shadow",
                        isOverdue && "border-red-200 bg-red-50",
                        isUrgent && !isOverdue && "border-orange-200 bg-orange-50"
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, project)}
                      onClick={(e) => {
                        // Only navigate if not dragging
                        if (!e.defaultPrevented) {
                          router.push(`/admin/events/${project.id}`)
                        }
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{project.project_name}</CardTitle>
                          <div className="flex gap-1">
                            <Badge className={cn("text-xs", PRIORITY_COLORS[project.priority])}>
                              {project.priority}
                            </Badge>
                            {isOverdue && (
                              <Badge className="bg-red-500 text-white text-xs">
                                <AlertTriangle className="w-2 h-2 mr-1" />
                                OVERDUE
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <CardDescription className="text-sm">
                            {project.client_name} {project.company && `• ${project.company}`}
                          </CardDescription>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/admin/projects/${project.id}/edit`)
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Target className="h-3 w-3" />
                          {project.event_type || project.project_type}
                        </div>
                        {eventDate && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(eventDate)}
                            {daysUntilEvent !== null && (
                              <span className={cn(
                                "font-semibold ml-1",
                                isOverdue ? "text-red-600" : isUrgent ? "text-orange-600" : ""
                              )}>
                                ({Math.abs(daysUntilEvent)} days {isOverdue ? 'ago' : 'left'})
                              </span>
                            )}
                          </div>
                        )}
                        {project.event_location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {project.event_location}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2 text-sm">
                            {project.attendee_count && (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                {project.attendee_count} attendees
                              </>
                            )}
                          </div>
                          <div className="font-semibold text-sm">
                            {formatCurrency(Number(project.speaker_fee || project.budget || 0))}
                          </div>
                        </div>

                        {/* Tags */}
                        {project.tags && project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {project.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {project.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                +{project.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}