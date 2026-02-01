"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CheckSquare, RefreshCw, Calendar, AlertCircle, Plus, Check, X, User, Briefcase, Sparkles } from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"

interface Task {
  id: number
  title: string
  description: string
  due_date: string
  related_to_type: string
  lead_id: number
  deal_id: number
  task_type: string
  status: string
  priority: string
  notes: string
  created_at: string
  updated_at: string
  completed_at: string
  lead_name: string
  lead_email: string
  lead_company: string
  deal_client_name: string
  deal_event_title: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [autoGenerating, setAutoGenerating] = useState(false)

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    due_date: "",
    task_type: "follow_up",
    priority: "medium",
    notes: ""
  })

  const loadTasks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (filterType !== "all") params.append("related_to_type", filterType)

      const response = await fetch(`/api/tasks?${params.toString()}`)
      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [filterStatus, filterType])

  const createTask = async () => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      })

      if (response.ok) {
        setCreateDialogOpen(false)
        setNewTask({
          title: "",
          description: "",
          due_date: "",
          task_type: "follow_up",
          priority: "medium",
          notes: ""
        })
        loadTasks()
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus })
      })
      loadTasks()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      await fetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE'
      })
      loadTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const autoGenerateTasks = async () => {
    setAutoGenerating(true)
    try {
      const response = await fetch('/api/tasks/auto-generate', {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        const total = data.results.leads.tasksCreated + data.results.deals.tasksCreated + data.results.projects.tasksCreated
        alert(`Auto-generated ${total} new tasks!\n\nLeads: ${data.results.leads.tasksCreated}\nDeals: ${data.results.deals.tasksCreated}\nProjects: ${data.results.projects.tasksCreated}`)
        loadTasks()
      }
    } catch (error) {
      console.error('Error auto-generating tasks:', error)
      alert('Failed to auto-generate tasks')
    } finally {
      setAutoGenerating(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-orange-100 text-orange-800',
      'low': 'bg-yellow-100 text-yellow-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  const getTaskTypeColor = (taskType: string) => {
    const colors: Record<string, string> = {
      'follow_up': 'bg-blue-100 text-blue-800',
      'proposal': 'bg-purple-100 text-purple-800',
      'meeting': 'bg-green-100 text-green-800',
      'contract': 'bg-indigo-100 text-indigo-800',
      'other': 'bg-gray-100 text-gray-800'
    }
    return colors[taskType] || 'bg-gray-100 text-gray-800'
  }

  const isOverdue = (date: string) => {
    if (!date) return false
    return new Date(date) < new Date()
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const overdueTasks = pendingTasks.filter(t => t.due_date && isOverdue(t.due_date))
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const todayTasks = pendingTasks.filter(t => {
    if (!t.due_date) return false
    const today = new Date().toDateString()
    return new Date(t.due_date).toDateString() === today
  })

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-72 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <CheckSquare className="w-10 h-10 text-blue-600" />
                Tasks & Follow-ups
              </h1>
              <p className="text-gray-600">Manage tasks for leads and deals</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={autoGenerateTasks} disabled={autoGenerating} variant="outline">
                <Sparkles className={`w-4 h-4 mr-2 ${autoGenerating ? 'animate-spin' : ''}`} />
                {autoGenerating ? 'Generating...' : 'Auto-Generate'}
              </Button>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                      Add a new task for follow-up or action item
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="Task title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        placeholder="Task description"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="task_type">Type</Label>
                        <Select
                          value={newTask.task_type}
                          onValueChange={(value) => setNewTask({ ...newTask, task_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="follow_up">Follow-up</SelectItem>
                            <SelectItem value="proposal">Proposal</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={newTask.priority}
                          onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input
                        id="due_date"
                        type="datetime-local"
                        value={newTask.due_date}
                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={newTask.notes}
                        onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                        placeholder="Additional notes"
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createTask} disabled={!newTask.title}>
                      Create Task
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={loadTasks} disabled={loading} variant="outline">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{tasks.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-600">{pendingTasks.length}</p>
                <p className="text-xs text-gray-500 mt-1">Need action</p>
              </CardContent>
            </Card>
            <Card className={overdueTasks.length > 0 ? 'border-red-200' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  {overdueTasks.length > 0 && <AlertCircle className="w-4 h-4 text-red-600" />}
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${overdueTasks.length > 0 ? 'text-red-600' : ''}`}>
                  {overdueTasks.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Past due date</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Due Today</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">{todayTasks.length}</p>
                <p className="text-xs text-gray-500 mt-1">Priority focus</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-4">
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Related To</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="deal">Deals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Loading tasks...</p>
                </CardContent>
              </Card>
            ) : tasks.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No tasks found. Create your first task to get started.</p>
                </CardContent>
              </Card>
            ) : (
              tasks.map((task) => {
                const taskIsOverdue = task.status === 'pending' && task.due_date && isOverdue(task.due_date)

                return (
                  <Card
                    key={task.id}
                    className={`hover:shadow-lg transition-shadow ${taskIsOverdue ? 'border-red-300 bg-red-50/30' : ''} ${task.status === 'completed' ? 'opacity-60' : ''}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        {/* Checkbox */}
                        <div className="pt-1">
                          <Button
                            size="sm"
                            variant={task.status === 'completed' ? 'default' : 'outline'}
                            onClick={() => updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                            className={task.status === 'completed' ? 'bg-green-600 hover:bg-green-700' : ''}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Task Info */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className={`text-xl font-semibold flex items-center gap-2 ${task.status === 'completed' ? 'line-through' : ''}`}>
                                {task.title}
                                {taskIsOverdue && (
                                  <AlertCircle className="w-5 h-5 text-red-600" />
                                )}
                              </h3>
                              {task.description && (
                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteTask(task.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority} priority
                            </Badge>
                            <Badge className={getTaskTypeColor(task.task_type)}>
                              {task.task_type.replace('_', ' ')}
                            </Badge>
                            {task.related_to_type && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                {task.related_to_type === 'lead' ? (
                                  <User className="w-3 h-3" />
                                ) : (
                                  <Briefcase className="w-3 h-3" />
                                )}
                                {task.related_to_type === 'lead'
                                  ? `Lead: ${task.lead_name || 'Unknown'}`
                                  : `Deal: ${task.deal_client_name || 'Unknown'}`
                                }
                              </Badge>
                            )}
                          </div>

                          {/* Notes */}
                          {task.notes && (
                            <div className="bg-blue-50 p-3 rounded-lg mb-3">
                              <p className="text-sm text-gray-700">{task.notes}</p>
                            </div>
                          )}

                          {/* Timeline */}
                          <div className="flex gap-4 text-sm text-gray-600">
                            {task.due_date && (
                              <div className={`flex items-center gap-2 ${taskIsOverdue ? 'text-red-600 font-semibold' : ''}`}>
                                <Calendar className="w-4 h-4" />
                                Due: {new Date(task.due_date).toLocaleString()}
                                {taskIsOverdue && ' (OVERDUE)'}
                              </div>
                            )}
                            {task.completed_at && (
                              <div className="flex items-center gap-2 text-green-600">
                                <Check className="w-4 h-4" />
                                Completed: {new Date(task.completed_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
