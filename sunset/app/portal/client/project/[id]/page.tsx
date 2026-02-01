"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  Building2,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  LogOut,
  MapPin,
  Mic,
  Monitor,
  Phone,
  Plane,
  Save,
  User,
  Users,
  CheckCircle,
  AlertCircle,
  Mail,
  Home
} from "lucide-react"

interface ProjectField {
  key: string
  label: string
  type: 'text' | 'email' | 'tel' | 'textarea' | 'date' | 'time' | 'number' | 'checkbox'
  editable: boolean
  value: any
  section: string
  icon?: any
}

export default function ClientProjectPortal() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const projectId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [project, setProject] = useState<any>(null)
  const [editedFields, setEditedFields] = useState<Record<string, any>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem(`project_${projectId}_token`)
      
      const response = await fetch(`/api/client-portal/projects/${projectId}`, {
        headers: token ? { 'X-Project-Token': token } : {}
      })
      
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else if (response.status === 401 || response.status === 403) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this project",
          variant: "destructive"
        })
        router.push('/portal/client')
      } else {
        throw new Error('Failed to fetch project')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (key: string, value: any) => {
    setEditedFields(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      const token = localStorage.getItem(`project_${projectId}_token`)
      
      const response = await fetch(`/api/client-portal/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'X-Project-Token': token } : {})
        },
        body: JSON.stringify(editedFields)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setProject(data.project)
        setEditedFields({})
        setHasChanges(false)
        toast({
          title: "Success",
          description: `Updated ${data.updatedFields.length} field(s) successfully`
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save changes",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(`project_${projectId}_token`)
    localStorage.removeItem('client_portal_project_id')
    router.push('/portal/client')
  }

  // Define field configurations
  const getFieldConfig = (): ProjectField[] => {
    if (!project) return []
    
    const editableFields = project.client_editable_fields || []
    const viewOnlyFields = project.client_view_only_fields || []
    
    return [
      // Overview - View Only
      { key: 'project_name', label: 'Project Name', type: 'text', editable: false, value: project.project_name, section: 'overview', icon: FileText },
      { key: 'event_name', label: 'Event Name', type: 'text', editable: false, value: project.event_name, section: 'overview', icon: Calendar },
      { key: 'event_date', label: 'Event Date', type: 'date', editable: false, value: project.event_date, section: 'overview', icon: Calendar },
      { key: 'event_location', label: 'Event Location', type: 'text', editable: false, value: project.event_location, section: 'overview', icon: MapPin },
      { key: 'event_type', label: 'Event Type', type: 'text', editable: false, value: project.event_type, section: 'overview', icon: FileText },
      { key: 'budget', label: 'Budget', type: 'text', editable: false, value: project.budget, section: 'overview', icon: DollarSign },
      
      // Venue - Editable
      { key: 'venue_name', label: 'Venue Name', type: 'text', editable: editableFields.includes('venue_name'), value: project.venue_name, section: 'venue', icon: Building2 },
      { key: 'venue_address', label: 'Venue Address', type: 'textarea', editable: editableFields.includes('venue_address'), value: project.venue_address, section: 'venue', icon: MapPin },
      { key: 'venue_contact_name', label: 'Venue Contact Name', type: 'text', editable: editableFields.includes('venue_contact_name'), value: project.venue_contact_name, section: 'venue', icon: User },
      { key: 'venue_contact_email', label: 'Venue Contact Email', type: 'email', editable: editableFields.includes('venue_contact_email'), value: project.venue_contact_email, section: 'venue', icon: Mail },
      { key: 'venue_contact_phone', label: 'Venue Contact Phone', type: 'tel', editable: editableFields.includes('venue_contact_phone'), value: project.venue_contact_phone, section: 'venue', icon: Phone },
      
      // Schedule - Editable
      { key: 'event_start_time', label: 'Event Start Time', type: 'time', editable: editableFields.includes('event_start_time'), value: project.event_start_time, section: 'schedule', icon: Clock },
      { key: 'event_end_time', label: 'Event End Time', type: 'time', editable: editableFields.includes('event_end_time'), value: project.event_end_time, section: 'schedule', icon: Clock },
      { key: 'program_start_time', label: 'Program Start Time', type: 'time', editable: editableFields.includes('program_start_time'), value: project.program_start_time, section: 'schedule', icon: Clock },
      { key: 'program_length', label: 'Program Length (minutes)', type: 'number', editable: editableFields.includes('program_length'), value: project.program_length, section: 'schedule', icon: Clock },
      { key: 'qa_length', label: 'Q&A Length (minutes)', type: 'number', editable: editableFields.includes('qa_length'), value: project.qa_length, section: 'schedule', icon: Mic },
      
      // Logistics - Editable
      { key: 'airport_transport_details', label: 'Airport Transport Details', type: 'textarea', editable: editableFields.includes('airport_transport_details'), value: project.airport_transport_details, section: 'logistics', icon: Plane },
      { key: 'venue_transport_details', label: 'Venue Transport Details', type: 'textarea', editable: editableFields.includes('venue_transport_details'), value: project.venue_transport_details, section: 'logistics', icon: Building2 },
      { key: 'hotel_dates_needed', label: 'Hotel Dates Needed', type: 'text', editable: editableFields.includes('hotel_dates_needed'), value: project.hotel_dates_needed, section: 'logistics', icon: Home },
      { key: 'guest_list_details', label: 'Guest List Details', type: 'textarea', editable: editableFields.includes('guest_list_details'), value: project.guest_list_details, section: 'logistics', icon: Users },
      
      // Technical - Editable
      { key: 'av_requirements', label: 'AV Requirements', type: 'textarea', editable: editableFields.includes('av_requirements'), value: project.av_requirements, section: 'technical', icon: Monitor },
      { key: 'recording_purpose', label: 'Recording Purpose', type: 'text', editable: editableFields.includes('recording_purpose'), value: project.recording_purpose, section: 'technical', icon: Monitor },
      { key: 'tech_rehearsal_date', label: 'Tech Rehearsal Date', type: 'date', editable: editableFields.includes('tech_rehearsal_date'), value: project.tech_rehearsal_date, section: 'technical', icon: Calendar },
      { key: 'tech_rehearsal_time', label: 'Tech Rehearsal Time', type: 'time', editable: editableFields.includes('tech_rehearsal_time'), value: project.tech_rehearsal_time, section: 'technical', icon: Clock },
      
      // Contacts - Editable
      { key: 'billing_contact_name', label: 'Billing Contact Name', type: 'text', editable: editableFields.includes('billing_contact_name'), value: project.billing_contact_name, section: 'contacts', icon: User },
      { key: 'billing_contact_email', label: 'Billing Contact Email', type: 'email', editable: editableFields.includes('billing_contact_email'), value: project.billing_contact_email, section: 'contacts', icon: Mail },
      { key: 'billing_contact_phone', label: 'Billing Contact Phone', type: 'tel', editable: editableFields.includes('billing_contact_phone'), value: project.billing_contact_phone, section: 'contacts', icon: Phone },
      { key: 'billing_address', label: 'Billing Address', type: 'textarea', editable: editableFields.includes('billing_address'), value: project.billing_address, section: 'contacts', icon: MapPin },
      { key: 'logistics_contact_name', label: 'Logistics Contact Name', type: 'text', editable: editableFields.includes('logistics_contact_name'), value: project.logistics_contact_name, section: 'contacts', icon: User },
      { key: 'logistics_contact_email', label: 'Logistics Contact Email', type: 'email', editable: editableFields.includes('logistics_contact_email'), value: project.logistics_contact_email, section: 'contacts', icon: Mail },
      { key: 'logistics_contact_phone', label: 'Logistics Contact Phone', type: 'tel', editable: editableFields.includes('logistics_contact_phone'), value: project.logistics_contact_phone, section: 'contacts', icon: Phone },
      
      // Additional - Editable
      { key: 'audience_demographics', label: 'Audience Demographics', type: 'textarea', editable: editableFields.includes('audience_demographics'), value: project.audience_demographics, section: 'additional', icon: Users },
      { key: 'meet_greet_opportunities', label: 'Meet & Greet Opportunities', type: 'textarea', editable: editableFields.includes('meet_greet_opportunities'), value: project.meet_greet_opportunities, section: 'additional', icon: Users },
      { key: 'media_interview_requests', label: 'Media Interview Requests', type: 'textarea', editable: editableFields.includes('media_interview_requests'), value: project.media_interview_requests, section: 'additional', icon: Mic },
      { key: 'special_requests', label: 'Special Requests', type: 'textarea', editable: editableFields.includes('special_requests'), value: project.special_requests, section: 'additional', icon: FileText },
      { key: 'prep_call_requested', label: 'Prep Call Requested', type: 'checkbox', editable: editableFields.includes('prep_call_requested'), value: project.prep_call_requested, section: 'additional', icon: Phone },
      { key: 'prep_call_date', label: 'Prep Call Date', type: 'date', editable: editableFields.includes('prep_call_date'), value: project.prep_call_date, section: 'additional', icon: Calendar },
      { key: 'prep_call_time', label: 'Prep Call Time', type: 'time', editable: editableFields.includes('prep_call_time'), value: project.prep_call_time, section: 'additional', icon: Clock },
      { key: 'additional_notes', label: 'Additional Notes', type: 'textarea', editable: editableFields.includes('additional_notes'), value: project.additional_notes, section: 'additional', icon: FileText },
    ]
  }

  const renderField = (field: ProjectField) => {
    const currentValue = editedFields[field.key] !== undefined ? editedFields[field.key] : field.value
    const Icon = field.icon
    
    return (
      <div key={field.key} className="space-y-2">
        <Label htmlFor={field.key} className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-gray-500" />}
          {field.label}
          {!field.editable && <Badge variant="secondary" className="ml-2 text-xs">View Only</Badge>}
        </Label>
        
        {field.type === 'textarea' ? (
          <Textarea
            id={field.key}
            value={currentValue || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            disabled={!field.editable}
            className={!field.editable ? 'bg-gray-50' : ''}
            rows={3}
          />
        ) : field.type === 'checkbox' ? (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              checked={currentValue || false}
              onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
              disabled={!field.editable}
            />
            <label htmlFor={field.key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {field.label}
            </label>
          </div>
        ) : (
          <Input
            id={field.key}
            type={field.type}
            value={currentValue || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            disabled={!field.editable}
            className={!field.editable ? 'bg-gray-50' : ''}
          />
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card>
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-center text-gray-600">Project not found or access denied</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fields = getFieldConfig()
  const sections = {
    overview: fields.filter(f => f.section === 'overview'),
    venue: fields.filter(f => f.section === 'venue'),
    schedule: fields.filter(f => f.section === 'schedule'),
    logistics: fields.filter(f => f.section === 'logistics'),
    technical: fields.filter(f => f.section === 'technical'),
    contacts: fields.filter(f => f.section === 'contacts'),
    additional: fields.filter(f => f.section === 'additional'),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Event Portal</h1>
              <p className="text-sm text-gray-600">{project.event_name || project.project_name}</p>
            </div>
            <div className="flex items-center gap-4">
              {hasChanges && (
                <Badge variant="default" className="bg-yellow-500">
                  Unsaved Changes
                </Badge>
              )}
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasChanges && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have unsaved changes. Click the Save button to persist your updates.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="venue">Venue</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="logistics">Logistics</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="additional">Additional</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Event Overview</CardTitle>
                <CardDescription>Basic information about your event (read-only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sections.overview.map(renderField)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="venue">
            <Card>
              <CardHeader>
                <CardTitle>Venue Information</CardTitle>
                <CardDescription>Update venue details and contacts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sections.venue.map(renderField)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Event Schedule</CardTitle>
                <CardDescription>Define event timing and program details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sections.schedule.map(renderField)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logistics">
            <Card>
              <CardHeader>
                <CardTitle>Logistics</CardTitle>
                <CardDescription>Transportation and accommodation details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {sections.logistics.map(renderField)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technical">
            <Card>
              <CardHeader>
                <CardTitle>Technical Requirements</CardTitle>
                <CardDescription>AV and technical setup information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {sections.technical.map(renderField)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Billing and logistics contacts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sections.contacts.map(renderField)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="additional">
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Special requests and other details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {sections.additional.map(renderField)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        {hasChanges && (
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleSave}
              disabled={saving}
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}