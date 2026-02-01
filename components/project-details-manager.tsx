"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  Plane,
  Hotel,
  MapPin,
  Users,
  Calendar,
  Clock,
  Mic,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  Save,
  FileText,
  Phone,
  Mail,
  Globe,
  Car,
  Building,
  User,
  Hash,
  Target,
  Info,
  Edit,
  Plus,
  Trash2
} from "lucide-react"
import { ProjectDetails, calculateProjectCompletion, generateTasksFromMissingFields } from "@/lib/project-details-schema"

interface ProjectDetailsManagerProps {
  projectId: number
  projectName: string
  initialDetails?: ProjectDetails
  onSave?: (details: ProjectDetails) => void
  onGenerateTasks?: (tasks: any[]) => void
}

export function ProjectDetailsManager({
  projectId,
  projectName,
  initialDetails = {},
  onSave,
  onGenerateTasks
}: ProjectDetailsManagerProps) {
  const [details, setDetails] = useState<ProjectDetails>(initialDetails)
  const [activeTab, setActiveTab] = useState("overview")
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Load project details when component mounts or projectId changes
  useEffect(() => {
    const loadProjectDetails = async () => {
      setLoading(true)
      try {
        console.log('Loading details for project:', projectId)
        const response = await fetch(`/api/projects/${projectId}/details`)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Received project details:', data)
          setDetails(data.details || {})
        } else {
          const errorText = await response.text()
          console.error('Failed to load project details:', response.status, errorText)
          setDetails({})
        }
      } catch (error) {
        console.error('Error loading project details:', error)
        setDetails({})
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      loadProjectDetails()
    } else {
      setDetails({})
      setLoading(false)
    }
  }, [projectId])

  // Calculate completion
  const completion = calculateProjectCompletion(details)

  // Update a nested field in the details object
  const updateField = (path: string, value: any) => {
    const keys = path.split('.')
    const newDetails = { ...details }
    let current: any = newDetails
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
    setDetails(newDetails)
    setUnsavedChanges(true)
  }

  // Save details
  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Project details saved successfully"
        })
        setUnsavedChanges(false)
        if (onSave) onSave(details)
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save project details",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Generate tasks from missing fields
  const handleGenerateTasks = () => {
    const tasks = generateTasksFromMissingFields(details, projectName)
    if (onGenerateTasks) {
      onGenerateTasks(tasks)
      toast({
        title: "Tasks Generated",
        description: `${tasks.length} tasks created based on missing information`
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Completion Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Details Completion</CardTitle>
              <CardDescription>
                Track and manage all event information
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold">{completion.percentage}%</div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
              {completion.missingCritical.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {completion.missingCritical.length} Critical Missing
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={completion.percentage} className="h-2 mb-4" />
          
          {completion.missingCritical.length > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Critical information missing:</strong>
                <ul className="mt-2 text-sm">
                  {completion.missingCritical.slice(0, 5).map(field => (
                    <li key={field}>• {field.replace(/\./g, ' → ')}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={handleGenerateTasks} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Generate Tasks from Missing Info
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!unsavedChanges || saving}
              size="sm"
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start rounded-none border-b overflow-x-auto flex-nowrap">
              {/* Firm Offer Sheet Core Tabs */}
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="program">Program</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger
                value="travel"
                disabled={details.overview?.event_classification === 'virtual' || details.overview?.event_classification === 'local'}
                className={(details.overview?.event_classification === 'virtual' || details.overview?.event_classification === 'local') ? 'opacity-50' : ''}
              >
                Travel {(details.overview?.event_classification === 'virtual' || details.overview?.event_classification === 'local') && '(N/A)'}
              </TabsTrigger>
              <TabsTrigger
                value="venue"
                disabled={details.overview?.event_classification === 'virtual'}
                className={details.overview?.event_classification === 'virtual' ? 'opacity-50' : ''}
              >
                Venue {details.overview?.event_classification === 'virtual' && '(N/A)'}
              </TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="confirmation">Confirmation</TabsTrigger>
              {/* Extended Details Tabs (post-contract) */}
              <TabsTrigger value="itinerary">Day-of</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
              <TabsTrigger value="speaker">Speaker Needs</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Overview
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Event Classification *</Label>
                    <Select
                      value={details.overview?.event_classification || ''}
                      onValueChange={(value) => {
                        updateField('overview.event_classification', value);
                        if (value === 'virtual') {
                          setDetails(prev => ({
                            ...prev,
                            travel: {},
                            venue: {}
                          }));
                          setUnsavedChanges(true);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="virtual">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            Virtual Event (No travel/venue required)
                          </div>
                        </SelectItem>
                        <SelectItem value="local">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Local Event (Venue required, no travel)
                          </div>
                        </SelectItem>
                        <SelectItem value="travel">
                          <div className="flex items-center gap-2">
                            <Plane className="h-4 w-4" />
                            Travel Required (Full logistics needed)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {details.overview?.event_classification === 'virtual' && (
                      <p className="text-sm text-blue-600 mt-1">
                        Travel and venue tabs are disabled for virtual events
                      </p>
                    )}
                    {details.overview?.event_classification === 'local' && (
                      <p className="text-sm text-blue-600 mt-1">
                        Travel tab is disabled for local events (no flights/hotel needed)
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>End Client Name</Label>
                    <Input
                      value={details.overview?.end_client_name || ''}
                      onChange={(e) => updateField('overview.end_client_name', e.target.value)}
                      placeholder="Name of the end client organization"
                    />
                  </div>
                  <div>
                    <Label>Event Name</Label>
                    <Input
                      value={details.overview?.event_name || ''}
                      onChange={(e) => updateField('overview.event_name', e.target.value)}
                      placeholder="Official event name"
                    />
                  </div>
                  <div>
                    <Label>Event Date</Label>
                    <Input
                      type="date"
                      value={details.overview?.event_date || ''}
                      onChange={(e) => updateField('overview.event_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Event Website/Link</Label>
                    <Input
                      value={details.overview?.event_website || ''}
                      onChange={(e) => updateField('overview.event_website', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Event Location</Label>
                    <Input
                      value={details.overview?.event_location || ''}
                      onChange={(e) => updateField('overview.event_location', e.target.value)}
                      placeholder="City, State"
                    />
                  </div>
                  <div>
                    <Label>Company/Organization (Client)</Label>
                    <Input
                      value={details.overview?.company_name || ''}
                      onChange={(e) => updateField('overview.company_name', e.target.value)}
                      placeholder="Booking client/agency name"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Speaker Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Speaker Name</Label>
                    <Input
                      value={details.overview?.speaker_name || ''}
                      onChange={(e) => updateField('overview.speaker_name', e.target.value)}
                      placeholder="Enter speaker name"
                    />
                  </div>
                  <div>
                    <Label>Speaker Title/Designation</Label>
                    <Input
                      value={details.overview?.speaker_title || ''}
                      onChange={(e) => updateField('overview.speaker_title', e.target.value)}
                      placeholder="e.g., CSP, PhD"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Travel & Accommodation Tab */}
            <TabsContent value="travel" className="p-6 space-y-6">
              {details.overview?.event_classification === 'virtual' && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Monitor className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Virtual Event</strong> - Travel and accommodation arrangements are not required for this event.
                  </AlertDescription>
                </Alert>
              )}
              {details.overview?.event_classification === 'local' && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Building className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Local Event</strong> - Flight and hotel arrangements are typically not required for local events.
                  </AlertDescription>
                </Alert>
              )}

              {/* Travel Dates */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Travel Dates
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Expected Fly-In Date</Label>
                    <Input
                      type="date"
                      value={details.travel?.fly_in_date || ''}
                      onChange={(e) => updateField('travel.fly_in_date', e.target.value)}
                      disabled={details.overview?.event_classification === 'virtual' || details.overview?.event_classification === 'local'}
                    />
                  </div>
                  <div>
                    <Label>Expected Fly-Out Date</Label>
                    <Input
                      type="date"
                      value={details.travel?.fly_out_date || ''}
                      onChange={(e) => updateField('travel.fly_out_date', e.target.value)}
                      disabled={details.overview?.event_classification === 'virtual' || details.overview?.event_classification === 'local'}
                    />
                  </div>
                  <div>
                    <Label>Nearest Airport</Label>
                    <Input
                      value={details.travel?.nearest_airport || ''}
                      onChange={(e) => updateField('travel.nearest_airport', e.target.value)}
                      placeholder="e.g., LAX, JFK, ORD"
                      disabled={details.overview?.event_classification === 'virtual' || details.overview?.event_classification === 'local'}
                    />
                  </div>
                </div>
              </div>

              {/* Transportation */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Transportation
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <Label className="font-medium mb-2 block">Airport to Hotel</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={details.travel?.airport_to_hotel?.provided_by_client || false}
                            onChange={(e) => updateField('travel.airport_to_hotel.provided_by_client', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Client will provide</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={details.travel?.airport_to_hotel?.speaker_arranges || false}
                            onChange={(e) => updateField('travel.airport_to_hotel.speaker_arranges', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Speaker to arrange</span>
                        </label>
                      </div>
                      <Input
                        value={details.travel?.airport_to_hotel?.details || ''}
                        onChange={(e) => updateField('travel.airport_to_hotel.details', e.target.value)}
                        placeholder="Additional details..."
                      />
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <Label className="font-medium mb-2 block">Hotel to Venue</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={details.travel?.hotel_to_venue?.provided_by_client || false}
                            onChange={(e) => updateField('travel.hotel_to_venue.provided_by_client', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Client will provide</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={details.travel?.hotel_to_venue?.speaker_arranges || false}
                            onChange={(e) => updateField('travel.hotel_to_venue.speaker_arranges', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Speaker to arrange</span>
                        </label>
                      </div>
                      <Input
                        value={details.travel?.hotel_to_venue?.details || ''}
                        onChange={(e) => updateField('travel.hotel_to_venue.details', e.target.value)}
                        placeholder="Additional details..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Flight Details */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  Flight Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Flight Details</Label>
                    <Textarea
                      value={details.travel?.flights?.notes || ''}
                      onChange={(e) => updateField('travel.flights.notes', e.target.value)}
                      placeholder="Enter flight details (airline, flight numbers, times, etc.)"
                      rows={3}
                      disabled={details.overview?.event_classification === 'virtual' || details.overview?.event_classification === 'local'}
                    />
                  </div>
                  <div>
                    <Label>Confirmation Numbers</Label>
                    <Input
                      value={details.travel?.flights?.confirmation_numbers?.join(', ') || ''}
                      onChange={(e) => updateField('travel.flights.confirmation_numbers', e.target.value.split(', ').filter(s => s))}
                      placeholder="Enter confirmation numbers"
                      disabled={details.overview?.event_classification === 'virtual' || details.overview?.event_classification === 'local'}
                    />
                  </div>
                </div>
              </div>

              {/* Hotel Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Hotel className="h-5 w-5" />
                  Hotel Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Hotel Name</Label>
                    <Input
                      value={details.travel?.hotel?.name || ''}
                      onChange={(e) => updateField('travel.hotel.name', e.target.value)}
                      placeholder="Hotel name"
                    />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={details.travel?.hotel?.phone || ''}
                      onChange={(e) => updateField('travel.hotel.phone', e.target.value)}
                      placeholder="Hotel phone"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Address</Label>
                    <Input
                      value={details.travel?.hotel?.address || ''}
                      onChange={(e) => updateField('travel.hotel.address', e.target.value)}
                      placeholder="Full hotel address"
                    />
                  </div>
                  <div>
                    <Label>City, State, ZIP</Label>
                    <Input
                      value={details.travel?.hotel?.city_state_zip || ''}
                      onChange={(e) => updateField('travel.hotel.city_state_zip', e.target.value)}
                      placeholder="City, ST 12345"
                    />
                  </div>
                  <div>
                    <Label>Room Type</Label>
                    <Input
                      value={details.travel?.hotel?.room_type || ''}
                      onChange={(e) => updateField('travel.hotel.room_type', e.target.value)}
                      placeholder="e.g., King, Suite"
                    />
                  </div>
                  <div>
                    <Label>Check-in Date</Label>
                    <Input
                      type="date"
                      value={details.travel?.hotel?.check_in_date || ''}
                      onChange={(e) => updateField('travel.hotel.check_in_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Check-out Date</Label>
                    <Input
                      type="date"
                      value={details.travel?.hotel?.check_out_date || ''}
                      onChange={(e) => updateField('travel.hotel.check_out_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Confirmation Number</Label>
                    <Input
                      value={details.travel?.hotel?.confirmation_number || ''}
                      onChange={(e) => updateField('travel.hotel.confirmation_number', e.target.value)}
                      placeholder="Confirmation #"
                    />
                  </div>
                  <div>
                    <Label>Secondary Confirmation # (if any)</Label>
                    <Input
                      value={details.travel?.hotel?.confirmation_number_2 || ''}
                      onChange={(e) => updateField('travel.hotel.confirmation_number_2', e.target.value)}
                      placeholder="Additional confirmation #"
                    />
                  </div>
                  <div>
                    <Label>Travel Time to Airport</Label>
                    <Input
                      value={details.travel?.hotel?.travel_time_to_airport || ''}
                      onChange={(e) => updateField('travel.hotel.travel_time_to_airport', e.target.value)}
                      placeholder="e.g., 10 miles / 20 minutes"
                    />
                  </div>
                  <div>
                    <Label>Travel Time to Venue</Label>
                    <Input
                      value={details.travel?.hotel?.travel_time_to_venue || ''}
                      onChange={(e) => updateField('travel.hotel.travel_time_to_venue', e.target.value)}
                      placeholder="e.g., 10 miles / 20 minutes"
                    />
                  </div>
                  <div>
                    <Label>Arranged By</Label>
                    <Select
                      value={details.travel?.hotel?.arranged_by || ''}
                      onValueChange={(value) => updateField('travel.hotel.arranged_by', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Who arranged?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sponsor">Sponsor/Client</SelectItem>
                        <SelectItem value="speaker">Speaker</SelectItem>
                        <SelectItem value="agency">Agency</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4">
                  <Label>Additional Hotel Information</Label>
                  <Textarea
                    value={details.travel?.hotel?.additional_info || ''}
                    onChange={(e) => updateField('travel.hotel.additional_info', e.target.value)}
                    placeholder="Any special notes about the hotel, amenities, etc."
                    rows={2}
                  />
                </div>
              </div>

              {/* Meals */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Meals
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Meals Provided</Label>
                    <Textarea
                      value={details.travel?.meals?.meals_provided || ''}
                      onChange={(e) => updateField('travel.meals.meals_provided', e.target.value)}
                      placeholder="Which meals will be provided? (breakfast, lunch, dinner, reception)"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Dietary Requirements</Label>
                    <Textarea
                      value={details.travel?.meals?.dietary_requirements || ''}
                      onChange={(e) => updateField('travel.meals.dietary_requirements', e.target.value)}
                      placeholder="Any special dietary requirements or allergies"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Guest List / VIP */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Guest List / VIP Opportunities
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Invited to Reception/Dinner?</Label>
                    <Select
                      value={details.travel?.guest_list?.invited_to_reception === true ? 'yes' : details.travel?.guest_list?.invited_to_reception === false ? 'no' : ''}
                      onValueChange={(value) => updateField('travel.guest_list.invited_to_reception', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Invited to Dinner?</Label>
                    <Select
                      value={details.travel?.guest_list?.invited_to_dinner === true ? 'yes' : details.travel?.guest_list?.invited_to_dinner === false ? 'no' : ''}
                      onValueChange={(value) => updateField('travel.guest_list.invited_to_dinner', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>VIP Meet & Greet?</Label>
                    <Select
                      value={details.travel?.guest_list?.vip_meet_greet === true ? 'yes' : details.travel?.guest_list?.vip_meet_greet === false ? 'no' : ''}
                      onValueChange={(value) => updateField('travel.guest_list.vip_meet_greet', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3">
                    <Label>Guest List Details</Label>
                    <Textarea
                      value={details.travel?.guest_list?.details || ''}
                      onChange={(e) => updateField('travel.guest_list.details', e.target.value)}
                      placeholder="Additional details about receptions, dinners, VIP meet & greets, etc."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Venue Tab */}
            <TabsContent value="venue" className="p-6 space-y-6">
              {details.overview?.event_classification === 'virtual' && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Monitor className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Virtual Event</strong> - Physical venue arrangements are not required for this event.
                  </AlertDescription>
                </Alert>
              )}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Venue Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Venue Name</Label>
                    <Input
                      value={details.venue?.name || ''}
                      onChange={(e) => updateField('venue.name', e.target.value)}
                      placeholder="Venue name"
                    />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={details.venue?.phone || ''}
                      onChange={(e) => updateField('venue.phone', e.target.value)}
                      placeholder="Venue phone"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Address</Label>
                    <Input
                      value={details.venue?.address || ''}
                      onChange={(e) => updateField('venue.address', e.target.value)}
                      placeholder="Full venue address"
                    />
                  </div>
                  <div>
                    <Label>City, State, ZIP</Label>
                    <Input
                      value={details.venue?.city_state_zip || ''}
                      onChange={(e) => updateField('venue.city_state_zip', e.target.value)}
                      placeholder="City, ST 12345"
                    />
                  </div>
                  <div>
                    <Label>Venue Website</Label>
                    <Input
                      value={details.venue?.venue_website || ''}
                      onChange={(e) => updateField('venue.venue_website', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Meeting Room Name</Label>
                    <Input
                      value={details.venue?.meeting_room_name || ''}
                      onChange={(e) => updateField('venue.meeting_room_name', e.target.value)}
                      placeholder="Room/hall name"
                    />
                  </div>
                  <div>
                    <Label>Room Capacity</Label>
                    <Input
                      type="number"
                      value={details.venue?.room_capacity || ''}
                      onChange={(e) => updateField('venue.room_capacity', parseInt(e.target.value))}
                      placeholder="Maximum capacity"
                    />
                  </div>
                  <div>
                    <Label>Room Setup</Label>
                    <Select
                      value={details.venue?.room_setup || ''}
                      onValueChange={(value) => updateField('venue.room_setup', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select setup" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="theater">Theater</SelectItem>
                        <SelectItem value="classroom">Classroom</SelectItem>
                        <SelectItem value="rounds">Rounds</SelectItem>
                        <SelectItem value="u-shape">U-Shape</SelectItem>
                        <SelectItem value="boardroom">Boardroom</SelectItem>
                        <SelectItem value="auditorium">Auditorium</SelectItem>
                        <SelectItem value="arena">Arena</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Closest Airport</Label>
                    <Input
                      value={details.venue?.closest_airport || ''}
                      onChange={(e) => updateField('venue.closest_airport', e.target.value)}
                      placeholder="Airport code (e.g., LAX)"
                    />
                  </div>
                  <div>
                    <Label>Distance from Airport</Label>
                    <Input
                      value={details.venue?.distance_from_airport || ''}
                      onChange={(e) => updateField('venue.distance_from_airport', e.target.value)}
                      placeholder="e.g., 10 miles / 20 minutes"
                    />
                  </div>
                </div>
              </div>

              {/* Venue Logistics */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Venue Logistics
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Parking Information</Label>
                    <Textarea
                      value={details.venue?.parking_info || ''}
                      onChange={(e) => updateField('venue.parking_info', e.target.value)}
                      placeholder="Describe parking options, costs, validation, etc."
                      rows={2}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Loading Dock / Equipment Access</Label>
                    <Textarea
                      value={details.venue?.loading_dock_info || ''}
                      onChange={(e) => updateField('venue.loading_dock_info', e.target.value)}
                      placeholder="Loading dock location, access restrictions, elevator availability"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Venue Contact */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Venue Contact Person
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={details.venue?.venue_contact?.name || ''}
                      onChange={(e) => updateField('venue.venue_contact.name', e.target.value)}
                      placeholder="Venue contact name"
                    />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={details.venue?.venue_contact?.title || ''}
                      onChange={(e) => updateField('venue.venue_contact.title', e.target.value)}
                      placeholder="Job title"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={details.venue?.venue_contact?.email || ''}
                      onChange={(e) => updateField('venue.venue_contact.email', e.target.value)}
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={details.venue?.venue_contact?.office_phone || ''}
                      onChange={(e) => updateField('venue.venue_contact.office_phone', e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="p-6 space-y-6">
              {/* Billing Contact */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Billing Contact
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={details.billing_contact?.name || ''}
                      onChange={(e) => updateField('billing_contact.name', e.target.value)}
                      placeholder="Billing contact name"
                    />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={details.billing_contact?.title || ''}
                      onChange={(e) => updateField('billing_contact.title', e.target.value)}
                      placeholder="Job title"
                    />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={details.billing_contact?.email || ''}
                      onChange={(e) => updateField('billing_contact.email', e.target.value)}
                      placeholder="billing@company.com"
                    />
                  </div>
                  <div>
                    <Label>Phone #</Label>
                    <Input
                      value={details.billing_contact?.phone || ''}
                      onChange={(e) => updateField('billing_contact.phone', e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Billing Address</Label>
                    <Textarea
                      value={details.billing_contact?.address || ''}
                      onChange={(e) => updateField('billing_contact.address', e.target.value)}
                      placeholder="Full billing address"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Logistics Contact */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Logistics Contact
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={details.logistics_contact?.name || ''}
                      onChange={(e) => updateField('logistics_contact.name', e.target.value)}
                      placeholder="Logistics contact name"
                    />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={details.logistics_contact?.email || ''}
                      onChange={(e) => updateField('logistics_contact.email', e.target.value)}
                      placeholder="logistics@company.com"
                    />
                  </div>
                  <div>
                    <Label>Phone #</Label>
                    <Input
                      value={details.logistics_contact?.phone || ''}
                      onChange={(e) => updateField('logistics_contact.phone', e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>

              {/* On-Site Contact */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Primary On-Site Contact
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={details.contacts?.on_site?.name || ''}
                      onChange={(e) => updateField('contacts.on_site.name', e.target.value)}
                      placeholder="Contact name"
                    />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={details.contacts?.on_site?.title || ''}
                      onChange={(e) => updateField('contacts.on_site.title', e.target.value)}
                      placeholder="Job title"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={details.contacts?.on_site?.email || ''}
                      onChange={(e) => updateField('contacts.on_site.email', e.target.value)}
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <Label>Cell Phone</Label>
                    <Input
                      value={details.contacts?.on_site?.cell_phone || ''}
                      onChange={(e) => updateField('contacts.on_site.cell_phone', e.target.value)}
                      placeholder="Mobile number"
                    />
                  </div>
                  <div>
                    <Label>Best Contact Method</Label>
                    <Select
                      value={details.contacts?.on_site?.best_contact_method || ''}
                      onValueChange={(value) => updateField('contacts.on_site.best_contact_method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Phone Call</SelectItem>
                        <SelectItem value="text">Text Message</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* A/V Contact */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Audio/Visual Contact
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={details.contacts?.av_contact?.name || ''}
                      onChange={(e) => updateField('contacts.av_contact.name', e.target.value)}
                      placeholder="A/V contact name"
                    />
                  </div>
                  <div>
                    <Label>Company</Label>
                    <Input
                      value={details.contacts?.av_contact?.company_name || ''}
                      onChange={(e) => updateField('contacts.av_contact.company_name', e.target.value)}
                      placeholder="A/V company"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={details.contacts?.av_contact?.email || ''}
                      onChange={(e) => updateField('contacts.av_contact.email', e.target.value)}
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={details.contacts?.av_contact?.cell_phone || ''}
                      onChange={(e) => updateField('contacts.av_contact.cell_phone', e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Itinerary Tab */}
            <TabsContent value="itinerary" className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Event Day Schedule
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Escort Person</Label>
                    <Input
                      value={details.itinerary?.escort_person || ''}
                      onChange={(e) => updateField('itinerary.escort_person', e.target.value)}
                      placeholder="Name of escort/handler"
                    />
                  </div>
                  <div>
                    <Label>Escort Phone</Label>
                    <Input
                      value={details.itinerary?.escort_phone || ''}
                      onChange={(e) => updateField('itinerary.escort_phone', e.target.value)}
                      placeholder="Escort contact number"
                    />
                  </div>
                  <div>
                    <Label>Doors Open Time</Label>
                    <Input
                      type="time"
                      value={details.itinerary?.doors_open_time || ''}
                      onChange={(e) => updateField('itinerary.doors_open_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Speaker Arrival Time</Label>
                    <Input
                      type="time"
                      value={details.itinerary?.speaker_arrival_time || ''}
                      onChange={(e) => updateField('itinerary.speaker_arrival_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Sound Check Time</Label>
                    <Input
                      type="time"
                      value={details.itinerary?.sound_check_time || ''}
                      onChange={(e) => updateField('itinerary.sound_check_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Speaking Slot Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={details.itinerary?.speaking_slot?.duration_minutes || ''}
                      onChange={(e) => updateField('itinerary.speaking_slot.duration_minutes', parseInt(e.target.value))}
                      placeholder="e.g., 60"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Speaking Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={details.itinerary?.speaking_slot?.start_time || ''}
                      onChange={(e) => updateField('itinerary.speaking_slot.start_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={details.itinerary?.speaking_slot?.end_time || ''}
                      onChange={(e) => updateField('itinerary.speaking_slot.end_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Includes Q&A?</Label>
                    <Select
                      value={details.itinerary?.speaking_slot?.includes_qa ? 'yes' : 'no'}
                      onValueChange={(value) => updateField('itinerary.speaking_slot.includes_qa', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Q&A Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={details.itinerary?.speaking_slot?.qa_duration_minutes || ''}
                      onChange={(e) => updateField('itinerary.speaking_slot.qa_duration_minutes', parseInt(e.target.value))}
                      placeholder="e.g., 15"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Audience Tab */}
            <TabsContent value="audience" className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Audience Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Expected Size</Label>
                    <Input
                      type="number"
                      value={details.audience?.expected_size || ''}
                      onChange={(e) => updateField('audience.expected_size', parseInt(e.target.value))}
                      placeholder="Expected attendance"
                    />
                  </div>
                  <div>
                    <Label>Actual Size (Post-Event)</Label>
                    <Input
                      type="number"
                      value={details.audience?.actual_size || ''}
                      onChange={(e) => updateField('audience.actual_size', parseInt(e.target.value))}
                      placeholder="Actual attendance"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Audience Description</Label>
                    <Textarea
                      value={details.audience?.audience_description || ''}
                      onChange={(e) => updateField('audience.audience_description', e.target.value)}
                      placeholder="Describe the audience composition, background, and expectations"
                      rows={3}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Attendee Roles/Titles</Label>
                    <Input
                      value={details.audience?.attendee_role || ''}
                      onChange={(e) => updateField('audience.attendee_role', e.target.value)}
                      placeholder="e.g., Senior executives, managers, engineers"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Demographics</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Age Range</Label>
                    <Input
                      value={details.audience?.demographics?.age_range || ''}
                      onChange={(e) => updateField('audience.demographics.age_range', e.target.value)}
                      placeholder="e.g., 30-70"
                    />
                  </div>
                  <div>
                    <Label>Geographic Profile</Label>
                    <Select
                      value={details.audience?.demographics?.geographic_profile || ''}
                      onValueChange={(value) => updateField('audience.demographics.geographic_profile', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select profile" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="regional">Regional</SelectItem>
                        <SelectItem value="national">National</SelectItem>
                        <SelectItem value="international">International</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Industry/Sector</Label>
                    <Input
                      value={details.audience?.demographics?.industry || ''}
                      onChange={(e) => updateField('audience.demographics.industry', e.target.value)}
                      placeholder="e.g., Technology, Healthcare"
                    />
                  </div>
                  <div>
                    <Label>Seniority Levels</Label>
                    <Input
                      value={details.audience?.demographics?.seniority_level?.join(', ') || ''}
                      onChange={(e) => updateField('audience.demographics.seniority_level', e.target.value.split(', '))}
                      placeholder="e.g., C-Suite, Directors, Managers"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Event Details Tab */}
            <TabsContent value="event" className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Event Title</Label>
                    <Input
                      value={details.event_details?.event_title || ''}
                      onChange={(e) => updateField('event_details.event_title', e.target.value)}
                      placeholder="Official event name"
                    />
                  </div>
                  <div>
                    <Label>Event Type</Label>
                    <Select
                      value={details.event_details?.event_type || ''}
                      onValueChange={(value) => updateField('event_details.event_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conference">Conference</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="seminar">Seminar</SelectItem>
                        <SelectItem value="corporate_meeting">Corporate Meeting</SelectItem>
                        <SelectItem value="association">Association Event</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Event Theme</Label>
                    <Input
                      value={details.event_details?.event_theme || ''}
                      onChange={(e) => updateField('event_details.event_theme', e.target.value)}
                      placeholder="Theme or focus area"
                    />
                  </div>
                  <div>
                    <Label>Is Annual Event?</Label>
                    <Select
                      value={details.event_details?.is_annual_event ? 'yes' : 'no'}
                      onValueChange={(value) => updateField('event_details.is_annual_event', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Event Purpose</Label>
                    <Textarea
                      value={details.event_details?.event_purpose || ''}
                      onChange={(e) => updateField('event_details.event_purpose', e.target.value)}
                      placeholder="Primary goals and objectives of the event"
                      rows={3}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Why This Speaker?</Label>
                    <Textarea
                      value={details.event_details?.speaker_selection_reason || ''}
                      onChange={(e) => updateField('event_details.speaker_selection_reason', e.target.value)}
                      placeholder="Reason for selecting this speaker"
                      rows={2}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Key Message Goals</Label>
                    <Textarea
                      value={details.event_details?.key_message_goals || ''}
                      onChange={(e) => updateField('event_details.key_message_goals', e.target.value)}
                      placeholder="What key messages should the audience take away?"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Additional Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Event Hashtag</Label>
                    <Input
                      value={details.event_details?.event_hashtag || ''}
                      onChange={(e) => updateField('event_details.event_hashtag', e.target.value)}
                      placeholder="#EventHashtag"
                    />
                  </div>
                  <div>
                    <Label>Can Publicize?</Label>
                    <Select
                      value={details.event_details?.can_publicize ? 'yes' : 'no'}
                      onValueChange={(value) => updateField('event_details.can_publicize', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Book Distribution?</Label>
                    <Select
                      value={details.event_details?.book_distribution ? 'yes' : 'no'}
                      onValueChange={(value) => updateField('event_details.book_distribution', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Book Signing?</Label>
                    <Select
                      value={details.event_details?.book_signing ? 'yes' : 'no'}
                      onValueChange={(value) => updateField('event_details.book_signing', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Speaker Requirements Tab */}
            <TabsContent value="speaker" className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Speaker Introduction
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Introduction Text</Label>
                    <Textarea
                      value={details.speaker_requirements?.introduction?.text || ''}
                      onChange={(e) => updateField('speaker_requirements.introduction.text', e.target.value)}
                      placeholder="Speaker introduction script"
                      rows={4}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Phonetic Name</Label>
                      <Input
                        value={details.speaker_requirements?.introduction?.phonetic_name || ''}
                        onChange={(e) => updateField('speaker_requirements.introduction.phonetic_name', e.target.value)}
                        placeholder="e.g., Hodak rhymes with Kodak"
                      />
                    </div>
                    <div>
                      <Label>Introducer Name</Label>
                      <Input
                        value={details.speaker_requirements?.introduction?.introducer_name || ''}
                        onChange={(e) => updateField('speaker_requirements.introduction.introducer_name', e.target.value)}
                        placeholder="Who will introduce the speaker"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  A/V Requirements
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Microphone Type</Label>
                    <Select
                      value={details.speaker_requirements?.av_needs?.microphone_type || ''}
                      onValueChange={(value) => updateField('speaker_requirements.av_needs.microphone_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lavalier">Lavalier</SelectItem>
                        <SelectItem value="countryman">Countryman</SelectItem>
                        <SelectItem value="handheld">Handheld</SelectItem>
                        <SelectItem value="headset">Headset</SelectItem>
                        <SelectItem value="podium">Podium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Presentation Format</Label>
                    <Select
                      value={details.speaker_requirements?.av_needs?.presentation_format || ''}
                      onValueChange={(value) => updateField('speaker_requirements.av_needs.presentation_format', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="powerpoint">PowerPoint</SelectItem>
                        <SelectItem value="keynote">Keynote</SelectItem>
                        <SelectItem value="mentimeter">Mentimeter</SelectItem>
                        <SelectItem value="prezi">Prezi</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Confidence Monitor?</Label>
                    <Select
                      value={details.speaker_requirements?.av_needs?.confidence_monitor ? 'yes' : 'no'}
                      onValueChange={(value) => updateField('speaker_requirements.av_needs.confidence_monitor', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Remote Clicker?</Label>
                    <Select
                      value={details.speaker_requirements?.av_needs?.remote_clicker ? 'yes' : 'no'}
                      onValueChange={(value) => updateField('speaker_requirements.av_needs.remote_clicker', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Internet Required?</Label>
                    <Select
                      value={details.speaker_requirements?.av_needs?.internet_required ? 'yes' : 'no'}
                      onValueChange={(value) => updateField('speaker_requirements.av_needs.internet_required', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Recording Permitted?</Label>
                    <Select
                      value={details.speaker_requirements?.presentation?.recording_permitted ? 'yes' : 'no'}
                      onValueChange={(value) => updateField('speaker_requirements.presentation.recording_permitted', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Attire & Preferences</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Recommended Attire</Label>
                    <Select
                      value={details.speaker_requirements?.recommended_attire || ''}
                      onValueChange={(value) => updateField('speaker_requirements.recommended_attire', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select attire" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business_formal">Business Formal</SelectItem>
                        <SelectItem value="business_casual">Business Casual</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="black_tie">Black Tie</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Water Preference</Label>
                    <Input
                      value={details.speaker_requirements?.av_needs?.water_preference || ''}
                      onChange={(e) => updateField('speaker_requirements.av_needs.water_preference', e.target.value)}
                      placeholder="e.g., Still, room temperature"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Program Details Tab */}
            <TabsContent value="program" className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Speaker Program Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Requested Speaker Name</Label>
                    <Input
                      value={details.program_details?.requested_speaker_name || ''}
                      onChange={(e) => updateField('program_details.requested_speaker_name', e.target.value)}
                      placeholder="Speaker's full name"
                    />
                  </div>
                  <div>
                    <Label>Program Topic</Label>
                    <Input
                      value={details.program_details?.program_topic || ''}
                      onChange={(e) => updateField('program_details.program_topic', e.target.value)}
                      placeholder="Topic/title of the presentation"
                    />
                  </div>
                  <div>
                    <Label>Program Type</Label>
                    <Select
                      value={details.program_details?.program_type || ''}
                      onValueChange={(value) => updateField('program_details.program_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select program type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keynote">Keynote</SelectItem>
                        <SelectItem value="fireside_chat">Fireside Chat</SelectItem>
                        <SelectItem value="panel_discussion">Panel Discussion</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="breakout_session">Breakout Session</SelectItem>
                        <SelectItem value="emcee">Emcee/Host</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {details.program_details?.program_type === 'other' && (
                    <div>
                      <Label>Program Type (Other)</Label>
                      <Input
                        value={details.program_details?.program_type_other || ''}
                        onChange={(e) => updateField('program_details.program_type_other', e.target.value)}
                        placeholder="Describe the program type"
                      />
                    </div>
                  )}
                  <div>
                    <Label>Audience Size</Label>
                    <Input
                      type="number"
                      value={details.program_details?.audience_size || ''}
                      onChange={(e) => updateField('program_details.audience_size', parseInt(e.target.value) || undefined)}
                      placeholder="Expected number of attendees"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Audience Demographics</Label>
                    <Textarea
                      value={details.program_details?.audience_demographics || ''}
                      onChange={(e) => updateField('program_details.audience_demographics', e.target.value)}
                      placeholder="Job titles, industries, experience levels, etc."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Speaker's Attire</Label>
                    <Select
                      value={details.program_details?.speaker_attire || ''}
                      onValueChange={(value) => updateField('program_details.speaker_attire', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select attire" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business_formal">Business Formal</SelectItem>
                        <SelectItem value="business_casual">Business Casual</SelectItem>
                        <SelectItem value="smart_casual">Smart Casual</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="black_tie">Black Tie</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {details.program_details?.speaker_attire === 'other' && (
                    <div>
                      <Label>Attire Notes</Label>
                      <Input
                        value={details.program_details?.attire_notes || ''}
                        onChange={(e) => updateField('program_details.attire_notes', e.target.value)}
                        placeholder="Describe the expected attire"
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Event Schedule
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Event Start Time</Label>
                    <Input
                      type="time"
                      value={details.event_schedule?.event_start_time || ''}
                      onChange={(e) => updateField('event_schedule.event_start_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Event End Time</Label>
                    <Input
                      type="time"
                      value={details.event_schedule?.event_end_time || ''}
                      onChange={(e) => updateField('event_schedule.event_end_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Speaker's Arrival Time at Venue</Label>
                    <Input
                      type="time"
                      value={details.event_schedule?.speaker_arrival_time || ''}
                      onChange={(e) => updateField('event_schedule.speaker_arrival_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Speaker's Departure Time from Venue</Label>
                    <Input
                      type="time"
                      value={details.event_schedule?.speaker_departure_time || ''}
                      onChange={(e) => updateField('event_schedule.speaker_departure_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Speaker's Program Start Time</Label>
                    <Input
                      type="time"
                      value={details.event_schedule?.program_start_time || ''}
                      onChange={(e) => updateField('event_schedule.program_start_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Timezone</Label>
                    <Input
                      value={details.event_schedule?.timezone || ''}
                      onChange={(e) => updateField('event_schedule.timezone', e.target.value)}
                      placeholder="e.g., EST, PST, CST"
                    />
                  </div>
                  <div>
                    <Label>Program Length (minutes)</Label>
                    <Input
                      type="number"
                      value={details.event_schedule?.program_length_minutes || ''}
                      onChange={(e) => updateField('event_schedule.program_length_minutes', parseInt(e.target.value) || undefined)}
                      placeholder="e.g., 45"
                    />
                  </div>
                  <div>
                    <Label>Q&A Length (minutes)</Label>
                    <Input
                      type="number"
                      value={details.event_schedule?.qa_length_minutes || ''}
                      onChange={(e) => updateField('event_schedule.qa_length_minutes', parseInt(e.target.value) || undefined)}
                      placeholder="e.g., 15"
                    />
                  </div>
                  <div>
                    <Label>Total Program Length (minutes)</Label>
                    <Input
                      type="number"
                      value={details.event_schedule?.total_program_length_minutes || ''}
                      onChange={(e) => updateField('event_schedule.total_program_length_minutes', parseInt(e.target.value) || undefined)}
                      placeholder="e.g., 60"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Detailed Event Timeline</h3>
                <Textarea
                  value={details.event_schedule?.detailed_timeline || ''}
                  onChange={(e) => updateField('event_schedule.detailed_timeline', e.target.value)}
                  placeholder="Full agenda with specific times and time zone. Example:
8:00 AM - Registration & Networking
9:00 AM - Opening Remarks
9:15 AM - Keynote Speaker (45 min + 15 min Q&A)
10:15 AM - Break
..."
                  rows={8}
                />
              </div>
            </TabsContent>

            {/* Technical Requirements Tab */}
            <TabsContent value="technical" className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  A/V Requirements
                </h3>
                <div className="md:col-span-2">
                  <Label>A/V Requirements</Label>
                  <Textarea
                    value={details.technical_requirements?.av_requirements || ''}
                    onChange={(e) => updateField('technical_requirements.av_requirements', e.target.value)}
                    placeholder="Microphone type, projector, screen size, lighting, confidence monitor, etc."
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Recording/Photography</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Recording Allowed?</Label>
                    <Select
                      value={details.technical_requirements?.recording_allowed === true ? 'yes' : details.technical_requirements?.recording_allowed === false ? 'no' : ''}
                      onValueChange={(value) => updateField('technical_requirements.recording_allowed', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {details.technical_requirements?.recording_allowed && (
                    <div>
                      <Label>Recording Purpose</Label>
                      <Input
                        value={details.technical_requirements?.recording_purpose || ''}
                        onChange={(e) => updateField('technical_requirements.recording_purpose', e.target.value)}
                        placeholder="Internal use, promotional, archival, etc."
                      />
                    </div>
                  )}
                  <div>
                    <Label>Live Streaming?</Label>
                    <Select
                      value={details.technical_requirements?.live_streaming === true ? 'yes' : details.technical_requirements?.live_streaming === false ? 'no' : ''}
                      onValueChange={(value) => updateField('technical_requirements.live_streaming', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Photography Allowed?</Label>
                    <Select
                      value={details.technical_requirements?.photography_allowed === true ? 'yes' : details.technical_requirements?.photography_allowed === false ? 'no' : ''}
                      onValueChange={(value) => updateField('technical_requirements.photography_allowed', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Tech Rehearsal</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tech Rehearsal Date</Label>
                    <Input
                      type="date"
                      value={details.technical_requirements?.tech_rehearsal_date || ''}
                      onChange={(e) => updateField('technical_requirements.tech_rehearsal_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Tech Rehearsal Time</Label>
                    <Input
                      type="time"
                      value={details.technical_requirements?.tech_rehearsal_time || ''}
                      onChange={(e) => updateField('technical_requirements.tech_rehearsal_time', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Tech Rehearsal Notes</Label>
                    <Textarea
                      value={details.technical_requirements?.tech_rehearsal_notes || ''}
                      onChange={(e) => updateField('technical_requirements.tech_rehearsal_notes', e.target.value)}
                      placeholder="Sound check details, equipment testing, etc."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Additional Information Tab */}
            <TabsContent value="additional" className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Additional Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Green Room/Holding Area Available?</Label>
                    <Select
                      value={details.additional_info?.green_room_available === true ? 'yes' : details.additional_info?.green_room_available === false ? 'no' : ''}
                      onValueChange={(value) => updateField('additional_info.green_room_available', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {details.additional_info?.green_room_available && (
                    <div>
                      <Label>Green Room Details</Label>
                      <Input
                        value={details.additional_info?.green_room_details || ''}
                        onChange={(e) => updateField('additional_info.green_room_details', e.target.value)}
                        placeholder="Location, amenities, etc."
                      />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <Label>Meet & Greet Opportunities</Label>
                    <Textarea
                      value={details.additional_info?.meet_greet_opportunities || ''}
                      onChange={(e) => updateField('additional_info.meet_greet_opportunities', e.target.value)}
                      placeholder="Before/after presentation, VIP reception, book signing, photo ops, etc."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Marketing/Promotion Use Allowed?</Label>
                    <Select
                      value={details.additional_info?.marketing_use_allowed === true ? 'yes' : details.additional_info?.marketing_use_allowed === false ? 'no' : ''}
                      onValueChange={(value) => updateField('additional_info.marketing_use_allowed', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes - Speaker name/bio can be used in event marketing</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Press/Media Present?</Label>
                    <Select
                      value={details.additional_info?.press_media_present === true ? 'yes' : details.additional_info?.press_media_present === false ? 'no' : ''}
                      onValueChange={(value) => updateField('additional_info.press_media_present', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {details.additional_info?.press_media_present && (
                    <div className="md:col-span-2">
                      <Label>Media Interview Requests</Label>
                      <Textarea
                        value={details.additional_info?.media_interview_requests || ''}
                        onChange={(e) => updateField('additional_info.media_interview_requests', e.target.value)}
                        placeholder="Details of media presence and any interview requests"
                        rows={2}
                      />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <Label>Special Requests or Considerations</Label>
                    <Textarea
                      value={details.additional_info?.special_requests || ''}
                      onChange={(e) => updateField('additional_info.special_requests', e.target.value)}
                      placeholder="Any special requirements, accommodations, or considerations"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Financial Details Tab */}
            <TabsContent value="financial" className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Financial Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Speaker Fee</Label>
                    <Input
                      type="number"
                      value={details.financial_details?.speaker_fee || ''}
                      onChange={(e) => updateField('financial_details.speaker_fee', parseFloat(e.target.value) || undefined)}
                      placeholder="Amount"
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Input
                      value={details.financial_details?.speaker_fee_currency || 'USD'}
                      onChange={(e) => updateField('financial_details.speaker_fee_currency', e.target.value)}
                      placeholder="USD"
                    />
                  </div>
                  <div>
                    <Label>Travel Expenses Type</Label>
                    <Select
                      value={details.financial_details?.travel_expenses_type || ''}
                      onValueChange={(value) => updateField('financial_details.travel_expenses_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat_buyout">Flat Travel Buyout</SelectItem>
                        <SelectItem value="actual_expenses">Actual Expenses (Reimbursed)</SelectItem>
                        <SelectItem value="client_books">Client Books Travel Directly</SelectItem>
                        <SelectItem value="included">Included in Speaker Fee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(details.financial_details?.travel_expenses_type === 'flat_buyout' || details.financial_details?.travel_expenses_type === 'actual_expenses') && (
                    <div>
                      <Label>Travel Expenses Amount</Label>
                      <Input
                        type="number"
                        value={details.financial_details?.travel_expenses_amount || ''}
                        onChange={(e) => updateField('financial_details.travel_expenses_amount', parseFloat(e.target.value) || undefined)}
                        placeholder="Amount"
                      />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <Label>Travel Expenses Notes</Label>
                    <Textarea
                      value={details.financial_details?.travel_expenses_notes || ''}
                      onChange={(e) => updateField('financial_details.travel_expenses_notes', e.target.value)}
                      placeholder="Ground transportation, accommodation, meals - what's included/covered"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Payment Terms</Label>
                    <Select
                      value={details.financial_details?.payment_terms || ''}
                      onValueChange={(value) => updateField('financial_details.payment_terms', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="net_30">Net 30</SelectItem>
                        <SelectItem value="net_15">Net 15</SelectItem>
                        <SelectItem value="upon_completion">Upon Completion</SelectItem>
                        <SelectItem value="deposit_balance">Deposit + Balance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {details.financial_details?.payment_terms === 'other' && (
                    <div>
                      <Label>Payment Terms (Other)</Label>
                      <Input
                        value={details.financial_details?.payment_terms_other || ''}
                        onChange={(e) => updateField('financial_details.payment_terms_other', e.target.value)}
                        placeholder="Describe payment terms"
                      />
                    </div>
                  )}
                  {details.financial_details?.payment_terms === 'deposit_balance' && (
                    <>
                      <div>
                        <Label>Deposit Amount</Label>
                        <Input
                          type="number"
                          value={details.financial_details?.deposit_amount || ''}
                          onChange={(e) => updateField('financial_details.deposit_amount', parseFloat(e.target.value) || undefined)}
                          placeholder="Deposit amount"
                        />
                      </div>
                      <div>
                        <Label>Deposit Due Date</Label>
                        <Input
                          type="date"
                          value={details.financial_details?.deposit_due_date || ''}
                          onChange={(e) => updateField('financial_details.deposit_due_date', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Balance Due Date</Label>
                        <Input
                          type="date"
                          value={details.financial_details?.balance_due_date || ''}
                          onChange={(e) => updateField('financial_details.balance_due_date', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Confirmation Details Tab */}
            <TabsContent value="confirmation" className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Confirmation Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Prep Call Requested?</Label>
                    <Select
                      value={details.confirmation_details?.prep_call_requested === true ? 'yes' : details.confirmation_details?.prep_call_requested === false ? 'no' : ''}
                      onValueChange={(value) => updateField('confirmation_details.prep_call_requested', value === 'yes')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {details.confirmation_details?.prep_call_requested && (
                    <>
                      <div>
                        <Label>Prep Call Date</Label>
                        <Input
                          type="date"
                          value={details.confirmation_details?.prep_call_date || ''}
                          onChange={(e) => updateField('confirmation_details.prep_call_date', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Prep Call Time</Label>
                        <Input
                          type="time"
                          value={details.confirmation_details?.prep_call_time || ''}
                          onChange={(e) => updateField('confirmation_details.prep_call_time', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Prep Call Notes</Label>
                        <Input
                          value={details.confirmation_details?.prep_call_notes || ''}
                          onChange={(e) => updateField('confirmation_details.prep_call_notes', e.target.value)}
                          placeholder="Time preferences, topics to cover, etc."
                        />
                      </div>
                    </>
                  )}
                  <div className="md:col-span-2">
                    <Label>Additional Notes</Label>
                    <Textarea
                      value={details.confirmation_details?.additional_notes || ''}
                      onChange={(e) => updateField('confirmation_details.additional_notes', e.target.value)}
                      placeholder="Any other important notes or details about this engagement"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}