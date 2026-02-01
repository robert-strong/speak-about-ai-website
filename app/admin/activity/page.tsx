"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useToast } from "@/hooks/use-toast"
import {
  History,
  RefreshCw,
  Loader2,
  User,
  Calendar,
  Filter,
  Search,
  Activity,
  TrendingUp,
  ArrowRight,
  Clock,
  Eye,
  Edit,
  FileText,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

interface UpdateLog {
  id: number
  speaker_id: number
  speaker_name: string
  speaker_email: string
  field_name: string
  old_value: string
  new_value: string
  changed_by: string
  change_type: string
  metadata: any
  created_at: string
  current_speaker_name?: string
}

interface SpeakerInfo {
  id: number
  name: string
  email: string
  headshot_url?: string
  update_count?: number
  last_update?: string
}

export default function AdminActivityPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [updates, setUpdates] = useState<UpdateLog[]>([])
  const [filteredUpdates, setFilteredUpdates] = useState<UpdateLog[]>([])
  const [speakers, setSpeakers] = useState<Map<number, SpeakerInfo>>(new Map())
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("all")
  const [selectedField, setSelectedField] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("all")
  const [showDetails, setShowDetails] = useState<Set<number>>(new Set())
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    loadUpdates()
  }, [router])

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadUpdates, 30000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  // Filter updates based on search and filters
  useEffect(() => {
    let filtered = [...updates]
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(update => 
        update.speaker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        update.speaker_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        update.field_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Speaker filter
    if (selectedSpeaker !== "all") {
      filtered = filtered.filter(update => 
        update.speaker_id.toString() === selectedSpeaker
      )
    }
    
    // Field filter
    if (selectedField !== "all") {
      filtered = filtered.filter(update => 
        update.field_name === selectedField
      )
    }
    
    // Date range filter
    if (dateRange !== "all") {
      const now = new Date()
      const cutoff = new Date()
      
      switch (dateRange) {
        case "today":
          cutoff.setHours(0, 0, 0, 0)
          break
        case "week":
          cutoff.setDate(now.getDate() - 7)
          break
        case "month":
          cutoff.setMonth(now.getMonth() - 1)
          break
      }
      
      if (dateRange !== "all") {
        filtered = filtered.filter(update => 
          new Date(update.created_at) >= cutoff
        )
      }
    }
    
    setFilteredUpdates(filtered)
  }, [updates, searchTerm, selectedSpeaker, selectedField, dateRange])

  const loadUpdates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/speakers/updates?limit=200')
      
      if (response.ok) {
        const data = await response.json()
        setUpdates(data.updates || [])
        
        // Build speaker info map
        const speakerMap = new Map<number, SpeakerInfo>()
        data.updates.forEach((update: UpdateLog) => {
          if (!speakerMap.has(update.speaker_id)) {
            speakerMap.set(update.speaker_id, {
              id: update.speaker_id,
              name: update.current_speaker_name || update.speaker_name,
              email: update.speaker_email,
              update_count: 0,
              last_update: update.created_at
            })
          }
          const speaker = speakerMap.get(update.speaker_id)!
          speaker.update_count = (speaker.update_count || 0) + 1
        })
        setSpeakers(speakerMap)
      } else {
        toast({
          title: "Error",
          description: "Failed to load activity log",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error loading updates:', error)
      toast({
        title: "Error",
        description: "Failed to load activity log",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatFieldName = (field: string) => {
    return field.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatValue = (value: string, field: string) => {
    if (!value || value === '') return '<empty>'
    if (field === 'topics' || field === 'industries' || field === 'programs') {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          return parsed.length > 0 ? parsed.join(', ') : '<empty list>'
        }
      } catch {
        return value
      }
    }
    if (value.length > 150) {
      return value.substring(0, 150) + '...'
    }
    return value
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const toggleDetails = (id: number) => {
    const newShowDetails = new Set(showDetails)
    if (newShowDetails.has(id)) {
      newShowDetails.delete(id)
    } else {
      newShowDetails.add(id)
    }
    setShowDetails(newShowDetails)
  }

  // Get unique field names for filter
  const uniqueFields = Array.from(new Set(updates.map(u => u.field_name)))

  // Calculate stats
  const todayUpdates = updates.filter(u => {
    const today = new Date()
    const updateDate = new Date(u.created_at)
    return updateDate.toDateString() === today.toDateString()
  }).length

  const activeSpekersToday = new Set(
    updates.filter(u => {
      const today = new Date()
      const updateDate = new Date(u.created_at)
      return updateDate.toDateString() === today.toDateString()
    }).map(u => u.speaker_id)
  ).size

  if (!isLoggedIn || loading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading activity log...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-[#1E68C6]" />
                <div>
                  <h1 className="text-3xl font-bold">Speaker Activity Log</h1>
                  <p className="text-gray-600 mt-1">Monitor all speaker profile updates in real-time</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={autoRefresh ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  {autoRefresh ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Auto-refreshing
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Auto-refresh off
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadUpdates}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Now
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Updates</p>
                      <p className="text-2xl font-bold">{updates.length}</p>
                    </div>
                    <History className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Updates Today</p>
                      <p className="text-2xl font-bold">{todayUpdates}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Speakers</p>
                      <p className="text-2xl font-bold">{speakers.size}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Today</p>
                      <p className="text-2xl font-bold">{activeSpekersToday}</p>
                    </div>
                    <Activity className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search by speaker name, email, or field..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="speaker">Speaker</Label>
                    <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                      <SelectTrigger id="speaker">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Speakers</SelectItem>
                        {Array.from(speakers.values()).map(speaker => (
                          <SelectItem key={speaker.id} value={speaker.id.toString()}>
                            {speaker.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="field">Field</Label>
                    <Select value={selectedField} onValueChange={setSelectedField}>
                      <SelectTrigger id="field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Fields</SelectItem>
                        {uniqueFields.map(field => (
                          <SelectItem key={field} value={field}>
                            {formatFieldName(field)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="dateRange">Date Range</Label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger id="dateRange">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">Last 30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Showing {filteredUpdates.length} update{filteredUpdates.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                {filteredUpdates.length !== updates.length && (
                  <Badge variant="secondary">
                    Filtered: {filteredUpdates.length} of {updates.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredUpdates.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No updates found matching your filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUpdates.map((update) => (
                    <div
                      key={update.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-r from-[#1E68C6] to-blue-600 text-white">
                              {update.speaker_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Link 
                                href={`/admin/speakers/${update.speaker_id}`}
                                className="font-medium text-blue-600 hover:underline"
                              >
                                {update.speaker_name}
                              </Link>
                              <span className="text-gray-500">•</span>
                              <Badge variant="outline" className="text-xs">
                                {formatFieldName(update.field_name)}
                              </Badge>
                              <span className="text-gray-500">•</span>
                              <span className="text-xs text-gray-500">
                                {formatDate(update.created_at)}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-2">
                              Updated by: {update.changed_by === 'self' ? 'Speaker (self)' : update.changed_by}
                            </div>
                            
                            {/* Value change preview or full details */}
                            {showDetails.has(update.id) ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                <div>
                                  <p className="text-xs font-medium text-gray-600 mb-1">Previous Value:</p>
                                  <p className="text-sm text-gray-800 bg-red-50 p-3 rounded border border-red-200">
                                    {formatValue(update.old_value, update.field_name)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-600 mb-1">New Value:</p>
                                  <p className="text-sm text-gray-800 bg-green-50 p-3 rounded border border-green-200">
                                    {formatValue(update.new_value, update.field_name)}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">
                                Changed from "{formatValue(update.old_value, update.field_name).substring(0, 50)}
                                {update.old_value.length > 50 ? '...' : ''}" 
                                to "{formatValue(update.new_value, update.field_name).substring(0, 50)}
                                {update.new_value.length > 50 ? '...' : ''}"
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleDetails(update.id)}
                          >
                            {showDetails.has(update.id) ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                Details
                              </>
                            )}
                          </Button>
                          <Link href={`/admin/speakers/${update.speaker_id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View Speaker
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}