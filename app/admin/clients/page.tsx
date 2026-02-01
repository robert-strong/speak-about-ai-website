"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Key,
  Eye,
  Edit,
  Plus,
  Search,
  RefreshCw,
  ExternalLink,
  Loader2,
  Shield,
  Clock,
  CheckCircle
} from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useToast } from "@/hooks/use-toast"

interface ClientAccount {
  id: number
  client_name: string
  client_email: string
  client_phone?: string
  company?: string
  access_token: string
  is_active: boolean
  created_at: string
  last_login?: string
  
  // Associated projects
  projects?: Array<{
    id: number
    event_title: string
    event_date: string
    status: string
  }>
}

interface SpeakerAccount {
  id: number
  speaker_id: number
  speaker_name: string
  speaker_email: string
  access_token: string
  is_active: boolean
  profile_status: "pending" | "approved" | "needs_review"
  created_at: string
  last_login?: string
  
  // Associated projects
  projects?: Array<{
    id: number
    event_title: string
    event_date: string
    status: string
  }>
}

interface EventPortalData {
  project_id: number
  event_title: string
  event_date: string
  event_location: string
  venue_details?: string
  
  // Client info
  client_name: string
  client_contact: string
  
  // Speaker info
  speaker_name?: string
  speaker_bio?: string
  speaker_headshot?: string
  travel_preferences?: string
  av_requirements?: string
  
  // Event logistics
  schedule?: string
  attendee_count?: number
  dress_code?: string
  special_requirements?: string
  
  // Documents
  press_pack_url?: string
  contract_url?: string
  invoice_url?: string
}

export default function ClientPortalPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>([])
  const [speakerAccounts, setSpeakerAccounts] = useState<SpeakerAccount[]>([])
  const [portalData, setPortalData] = useState<EventPortalData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("clients")
  const [selectedPortal, setSelectedPortal] = useState<EventPortalData | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [clientsResponse, speakersResponse, portalResponse] = await Promise.all([
        fetch("/api/client-accounts"),
        fetch("/api/speaker-accounts"),
        fetch("/api/event-portals")
      ])

      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json()
        setClientAccounts(clientsData)
      }

      if (speakersResponse.ok) {
        const speakersData = await speakersResponse.json()
        setSpeakerAccounts(speakersData)
      }

      if (portalResponse.ok) {
        const portalDataResponse = await portalResponse.json()
        setPortalData(portalDataResponse)
      }
    } catch (error) {
      console.error("Error loading portal data:", error)
      toast({
        title: "Error",
        description: "Failed to load portal data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClientAccount = async (projectId: number, clientEmail: string) => {
    try {
      const response = await fetch("/api/client-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          client_email: clientEmail
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Client account created successfully"
        })
        loadData()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to create client account",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating client account:", error)
      toast({
        title: "Error",
        description: "Failed to create client account",
        variant: "destructive"
      })
    }
  }

  const handleCreateSpeakerAccount = async (speakerId: number, speakerEmail: string) => {
    try {
      const response = await fetch("/api/speaker-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speaker_id: speakerId,
          speaker_email: speakerEmail
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Speaker account created successfully"
        })
        loadData()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to create speaker account",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating speaker account:", error)
      toast({
        title: "Error",
        description: "Failed to create speaker account",
        variant: "destructive"
      })
    }
  }

  const filteredClients = clientAccounts.filter(client =>
    client.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredSpeakers = speakerAccounts.filter(speaker =>
    speaker.speaker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    speaker.speaker_email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isLoggedIn) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading portal data...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 ml-72 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Client & Speaker Portals</h1>
              <p className="mt-2 text-gray-600">Manage client and speaker access to event information</p>
            </div>
            <div className="flex gap-4">
              <Button onClick={loadData} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Client Accounts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientAccounts.length}</div>
                <p className="text-xs text-muted-foreground">
                  {clientAccounts.filter(c => c.is_active).length} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Speaker Accounts</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{speakerAccounts.length}</div>
                <p className="text-xs text-muted-foreground">
                  {speakerAccounts.filter(s => s.is_active).length} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Event Portals</CardTitle>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portalData.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active event portals
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {speakerAccounts.filter(s => s.profile_status === "needs_review").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Profile updates
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-lg">
              <TabsTrigger value="clients">Client Accounts</TabsTrigger>
              <TabsTrigger value="speakers">Speaker Accounts</TabsTrigger>
              <TabsTrigger value="portals">Event Portals</TabsTrigger>
            </TabsList>

            {/* Client Accounts Tab */}
            <TabsContent value="clients" className="space-y-6">
              {/* Search */}
              <Card>
                <CardContent className="pt-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Client Accounts Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Portal Accounts</CardTitle>
                  <CardDescription>
                    Manage client access to event information and documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Projects</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className="font-medium">{client.client_name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-gray-500" />
                              {client.company || "No company"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-gray-500" />
                                {client.client_email}
                              </div>
                              {client.client_phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3 text-gray-500" />
                                  {client.client_phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {client.projects?.length || 0} projects
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={client.is_active ? "default" : "secondary"}
                              className={client.is_active ? "bg-green-500" : ""}
                            >
                              {client.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {client.last_login 
                              ? new Date(client.last_login).toLocaleDateString()
                              : "Never"
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Key className="h-4 w-4 mr-1" />
                                Portal
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Speaker Accounts Tab */}
            <TabsContent value="speakers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Speaker Portal Accounts</CardTitle>
                  <CardDescription>
                    Manage speaker access and profile edit permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Speaker</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Profile Status</TableHead>
                        <TableHead>Projects</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSpeakers.map((speaker) => (
                        <TableRow key={speaker.id}>
                          <TableCell>
                            <div className="font-medium">{speaker.speaker_name}</div>
                          </TableCell>
                          <TableCell>{speaker.speaker_email}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                speaker.profile_status === "approved" ? "default" :
                                speaker.profile_status === "needs_review" ? "destructive" :
                                "secondary"
                              }
                              className={
                                speaker.profile_status === "approved" ? "bg-green-500" :
                                speaker.profile_status === "needs_review" ? "bg-yellow-500" :
                                ""
                              }
                            >
                              {speaker.profile_status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                              {speaker.profile_status === "needs_review" && <Clock className="h-3 w-3 mr-1" />}
                              {speaker.profile_status.replace("_", " ").toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {speaker.projects?.length || 0} projects
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={speaker.is_active ? "default" : "secondary"}
                              className={speaker.is_active ? "bg-green-500" : ""}
                            >
                              {speaker.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {speaker.last_login 
                              ? new Date(speaker.last_login).toLocaleDateString()
                              : "Never"
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {speaker.profile_status === "needs_review" && (
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Review
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Event Portals Tab */}
            <TabsContent value="portals" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Information Portals</CardTitle>
                  <CardDescription>
                    Centralized event information accessible by clients and speakers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {portalData.map((portal) => (
                      <Card key={portal.project_id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{portal.event_title}</CardTitle>
                          <CardDescription>{portal.client_name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            {new Date(portal.event_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            {portal.event_location}
                          </div>
                          {portal.speaker_name && (
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-4 w-4 text-gray-500" />
                              {portal.speaker_name}
                            </div>
                          )}
                          <div className="pt-2 space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedPortal(portal)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Portal
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}