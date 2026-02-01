"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Calendar,
  Mail,
  MapPin,
  Building,
  User,
  Phone,
  DollarSign,
  MessageSquare,
  CheckCircle,
  Users,
  Sparkles,
  Clock,
  Target,
  X,
  Search,
  ChevronDown,
  Loader2,
  Send,
  Newspaper,
  Mic,
  GraduationCap
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Turnstile } from '@marsidev/react-turnstile'

interface Speaker {
  id: number
  name: string
  title?: string
  oneLiner?: string
}

interface Workshop {
  id: number
  title: string
  slug: string
  short_description?: string
  speaker_name?: string
  speaker_slug?: string
  format?: string
  price_range?: string
}

interface ContactPageContent {
  keynoteTitle: string
  workshopTitle: string
  keynoteSubtitle: string
  workshopSubtitle: string
  keynoteTabLabel: string
  workshopTabLabel: string
  formTitle: string
  formDescription: string
  contactSectionTitle: string
  eventSectionTitle: string
  additionalSectionTitle: string
  // Keynote-specific
  speakerSectionTitle: string
  speakerSectionDesc: string
  noSpeakerText: string
  budgetSectionTitle: string
  // Workshop-specific
  workshopSectionTitle: string
  workshopSectionDesc: string
  noWorkshopText: string
  participantsTitle: string
  skillLevelTitle: string
  formatTitle: string
  // Help
  needHelpTitle: string
  callLabel: string
  phone: string
  emailLabel: string
  email: string
  newsletterTitle: string
  newsletterDescription: string
  successTitle: string
  successMessage: string
  submitButtonText: string
}

interface CustomContactFormProps {
  preselectedSpeaker?: string
  preselectedWorkshopId?: string
  initialTab?: 'keynote' | 'workshop'
  content: ContactPageContent
}

export function CustomContactForm({
  preselectedSpeaker,
  preselectedWorkshopId,
  initialTab = 'keynote',
  content
}: CustomContactFormProps) {
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'keynote' | 'workshop'>(initialTab)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Speaker state
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [loadingSpeakers, setLoadingSpeakers] = useState(true)
  const [selectedSpeakers, setSelectedSpeakers] = useState<Speaker[]>([])
  const [speakerSearchTerm, setSpeakerSearchTerm] = useState('')
  const [showSpeakerDropdown, setShowSpeakerDropdown] = useState(false)
  const [hasNoSpeakerInMind, setHasNoSpeakerInMind] = useState(false)
  const speakerDropdownRef = useRef<HTMLDivElement>(null)

  // Workshop state
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loadingWorkshops, setLoadingWorkshops] = useState(true)
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null)
  const [workshopSearchTerm, setWorkshopSearchTerm] = useState('')
  const [showWorkshopDropdown, setShowWorkshopDropdown] = useState(false)
  const [hasNoWorkshopInMind, setHasNoWorkshopInMind] = useState(false)
  const workshopDropdownRef = useRef<HTMLDivElement>(null)

  const [eventDates, setEventDates] = useState<string[]>([''])
  const [turnstileToken, setTurnstileToken] = useState<string>('')

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    phone: '',
    organizationName: '',
    eventLocation: '',
    eventBudget: '',
    additionalInfo: '',
    newsletterOptIn: false,
    // Workshop-specific fields
    numberOfParticipants: '',
    participantSkillLevel: '',
    preferredFormat: ''
  })

  const budgetOptions = [
    { value: 'under-10k', label: 'Under $10,000' },
    { value: '10k-25k', label: '$10,000 - $25,000' },
    { value: '25k-50k', label: '$25,000 - $50,000' },
    { value: '50k-100k', label: '$50,000 - $100,000' },
    { value: 'over-100k', label: 'Over $100,000' },
    { value: 'discuss', label: "Let's discuss" }
  ]

  const participantOptions = [
    { value: '1-10', label: '1-10 participants' },
    { value: '11-25', label: '11-25 participants' },
    { value: '26-50', label: '26-50 participants' },
    { value: '51-100', label: '51-100 participants' },
    { value: '100+', label: '100+ participants' }
  ]

  const skillLevelOptions = [
    { value: 'beginner', label: 'Beginner - New to AI' },
    { value: 'intermediate', label: 'Intermediate - Some AI experience' },
    { value: 'advanced', label: 'Advanced - Experienced with AI' },
    { value: 'mixed', label: 'Mixed levels' }
  ]

  const formatOptions = [
    { value: 'in-person', label: 'In-Person' },
    { value: 'virtual', label: 'Virtual / Online' },
    { value: 'hybrid', label: 'Hybrid (In-Person + Virtual)' },
    { value: 'flexible', label: 'Flexible / To be determined' }
  ]

  useEffect(() => {
    fetchSpeakers()
    fetchWorkshops()
  }, [])

  // Click outside handler for speaker dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (speakerDropdownRef.current && !speakerDropdownRef.current.contains(event.target as Node)) {
        setShowSpeakerDropdown(false)
      }
    }

    if (showSpeakerDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showSpeakerDropdown])

  // Click outside handler for workshop dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workshopDropdownRef.current && !workshopDropdownRef.current.contains(event.target as Node)) {
        setShowWorkshopDropdown(false)
      }
    }

    if (showWorkshopDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showWorkshopDropdown])

  useEffect(() => {
    // Auto-select speaker if passed as prop
    if (preselectedSpeaker && speakers.length > 0 && selectedSpeakers.length === 0) {
      const speaker = speakers.find(s => s.name === preselectedSpeaker)
      if (speaker) {
        setSelectedSpeakers([speaker])
      }
    }
  }, [preselectedSpeaker, speakers])

  useEffect(() => {
    // Auto-select workshop if passed as prop
    if (preselectedWorkshopId && workshops.length > 0 && !selectedWorkshop) {
      const workshop = workshops.find(w => w.id.toString() === preselectedWorkshopId || w.slug === preselectedWorkshopId)
      if (workshop) {
        setSelectedWorkshop(workshop)
      }
    }
  }, [preselectedWorkshopId, workshops])

  const fetchSpeakers = async () => {
    try {
      const response = await fetch('/api/speakers')
      const data = await response.json()
      if (data.success) {
        setSpeakers(data.speakers || [])
      }
    } catch (error) {
      console.error('Error fetching speakers:', error)
    } finally {
      setLoadingSpeakers(false)
    }
  }

  const fetchWorkshops = async () => {
    try {
      const response = await fetch('/api/workshops')
      const data = await response.json()
      // Handle both response formats: { workshops: [...] } or direct array
      const workshopsData = data.workshops || data || []
      setWorkshops(workshopsData)
    } catch (error) {
      console.error('Error fetching workshops:', error)
    } finally {
      setLoadingWorkshops(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const toggleSpeaker = (speaker: Speaker) => {
    // If selecting a speaker, clear "no speaker in mind"
    if (hasNoSpeakerInMind) {
      setHasNoSpeakerInMind(false)
    }
    setSelectedSpeakers(prev => {
      const exists = prev.find(s => s.id === speaker.id)
      if (exists) {
        return prev.filter(s => s.id !== speaker.id)
      }
      return [...prev, speaker]
    })
  }

  const handleNoSpeakerInMind = () => {
    setHasNoSpeakerInMind(true)
    setSelectedSpeakers([])
    setShowSpeakerDropdown(false)
  }

  const removeSpeaker = (speakerId: number) => {
    setSelectedSpeakers(prev => prev.filter(s => s.id !== speakerId))
  }

  const selectWorkshop = (workshop: Workshop) => {
    if (hasNoWorkshopInMind) {
      setHasNoWorkshopInMind(false)
    }
    setSelectedWorkshop(workshop)
    setShowWorkshopDropdown(false)
  }

  const handleNoWorkshopInMind = () => {
    setHasNoWorkshopInMind(true)
    setSelectedWorkshop(null)
    setShowWorkshopDropdown(false)
  }

  const clearWorkshop = () => {
    setSelectedWorkshop(null)
  }

  const filteredSpeakers = speakers.filter(speaker =>
    speaker.name.toLowerCase().includes(speakerSearchTerm.toLowerCase())
  )

  const filteredWorkshops = workshops.filter(workshop =>
    workshop.title.toLowerCase().includes(workshopSearchTerm.toLowerCase()) ||
    (workshop.speaker_name && workshop.speaker_name.toLowerCase().includes(workshopSearchTerm.toLowerCase()))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clientName || !formData.clientEmail || !formData.organizationName) {
      toast({
        title: "Required fields missing",
        description: "Please fill in your name, email address, and organization.",
        variant: "destructive"
      })
      return
    }

    if (!turnstileToken) {
      toast({
        title: "CAPTCHA required",
        description: "Please complete the CAPTCHA verification to continue.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Build submission data based on active tab
      const submissionData = {
        ...formData,
        eventDates: eventDates.filter(date => date !== ''),
        requestType: activeTab,
        turnstileToken,
        // Keynote-specific
        specificSpeaker: activeTab === 'keynote'
          ? (hasNoSpeakerInMind ? 'No specific speaker in mind' : selectedSpeakers.map(s => s.name).join(', '))
          : undefined,
        hasNoSpeakerInMind: activeTab === 'keynote' ? hasNoSpeakerInMind : undefined,
        // Workshop-specific
        selectedWorkshop: activeTab === 'workshop'
          ? (hasNoWorkshopInMind ? 'Help me find a workshop' : selectedWorkshop?.title)
          : undefined,
        selectedWorkshopId: activeTab === 'workshop' && selectedWorkshop ? selectedWorkshop.id : undefined,
        hasNoWorkshopInMind: activeTab === 'workshop' ? hasNoWorkshopInMind : undefined,
        numberOfParticipants: activeTab === 'workshop' ? formData.numberOfParticipants : undefined,
        participantSkillLevel: activeTab === 'workshop' ? formData.participantSkillLevel : undefined,
        preferredFormat: activeTab === 'workshop' ? formData.preferredFormat : undefined
      }

      // Submit the main contact form
      const response = await fetch('/api/submit-deal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      })

      const result = await response.json()

      if (response.ok) {
        // If newsletter opt-in is checked, subscribe them
        if (formData.newsletterOptIn) {
          try {
            await fetch('/api/newsletter/signup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: formData.clientEmail,
                name: formData.clientName,
                company: formData.organizationName,
                source: 'contact_form'
              })
            })
          } catch (error) {
            console.log('Newsletter signup failed:', error)
            // Don't block the form submission if newsletter fails
          }
        }

        setIsSuccess(true)
        toast({
          title: "Request submitted successfully!",
          description: result.message || "We'll be in touch within 24 hours."
        })

        // Reset form
        setFormData({
          clientName: '',
          clientEmail: '',
          phone: '',
          organizationName: '',
          eventLocation: '',
          eventBudget: '',
          additionalInfo: '',
          newsletterOptIn: false,
          numberOfParticipants: '',
          participantSkillLevel: '',
          preferredFormat: ''
        })
        setSelectedSpeakers([])
        setSelectedWorkshop(null)
        setEventDates([''])
        setTurnstileToken('')
        setHasNoSpeakerInMind(false)
        setHasNoWorkshopInMind(false)
      } else {
        throw new Error(result.error || 'Failed to submit')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Please try again or contact us directly.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-8">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">{content.successTitle}</h2>
            <p className="text-gray-600 mb-6">
              {content.successMessage}
            </p>
            <Button onClick={() => setIsSuccess(false)} variant="outline">
              Submit Another Request
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          {activeTab === 'keynote' ? content.keynoteTitle : content.workshopTitle}
        </h1>
        <p className="text-lg text-gray-600">
          {activeTab === 'keynote' ? content.keynoteSubtitle : content.workshopSubtitle}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('keynote')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all",
              activeTab === 'keynote'
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Mic className="h-4 w-4" />
            {content.keynoteTabLabel}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('workshop')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all",
              activeTab === 'workshop'
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <GraduationCap className="h-4 w-4" />
            {content.workshopTabLabel}
          </button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">
            {content.formTitle}
          </CardTitle>
          <CardDescription>
            {content.formDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">{content.contactSectionTitle}</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Your Name *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    placeholder="John Smith"
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email Address *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                    placeholder="person@company.com"
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization *</Label>
                  <Input
                    id="organizationName"
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange('organizationName', e.target.value)}
                    placeholder="Company"
                    required
                    className="h-12"
                  />
                </div>
              </div>
            </div>

            {/* Speaker Selection (Keynote Tab) */}
            {activeTab === 'keynote' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4">{content.speakerSectionTitle}</h3>

                <div className="space-y-2">
                  <Label>Speakers You're Interested In</Label>
                  <div className="relative" ref={speakerDropdownRef}>
                    <div
                      className={cn(
                        "min-h-[48px] w-full rounded-lg border bg-white px-3 py-2 cursor-pointer",
                        "hover:border-gray-400 transition-colors",
                        showSpeakerDropdown && "border-blue-500 ring-2 ring-blue-100"
                      )}
                      onClick={() => setShowSpeakerDropdown(!showSpeakerDropdown)}
                    >
                      {hasNoSpeakerInMind ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-gray-600">{content.noSpeakerText}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setHasNoSpeakerInMind(false)
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : selectedSpeakers.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedSpeakers.map(speaker => (
                            <Badge
                              key={speaker.id}
                              variant="secondary"
                              className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              {speaker.name}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeSpeaker(speaker.id)
                                }}
                                className="ml-1 hover:text-blue-900"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-gray-500">
                          <span>Select speakers or browse all options</span>
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {showSpeakerDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-xl max-h-80 overflow-hidden">
                        <div className="sticky top-0 bg-white border-b p-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              type="text"
                              placeholder="Search speakers..."
                              value={speakerSearchTerm}
                              onChange={(e) => setSpeakerSearchTerm(e.target.value)}
                              className="pl-10"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-60">
                          {/* No speaker in mind option */}
                          <div
                            className={cn(
                              "px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b",
                              hasNoSpeakerInMind && "bg-blue-50"
                            )}
                            onClick={handleNoSpeakerInMind}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-700">{content.noSpeakerText}</div>
                                <div className="text-sm text-gray-500">{content.speakerSectionDesc}</div>
                              </div>
                              {hasNoSpeakerInMind && (
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                          </div>
                          {loadingSpeakers ? (
                            <div className="p-8 text-center">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                              <p className="text-sm text-gray-500 mt-2">Loading speakers...</p>
                            </div>
                          ) : filteredSpeakers.length > 0 ? (
                            filteredSpeakers.map(speaker => {
                              const isSelected = selectedSpeakers.find(s => s.id === speaker.id)
                              return (
                                <div
                                  key={speaker.id}
                                  className={cn(
                                    "px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors",
                                    isSelected && "bg-blue-50"
                                  )}
                                  onClick={() => toggleSpeaker(speaker)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium">{speaker.name}</div>
                                      {speaker.title && (
                                        <div className="text-sm text-gray-500">{speaker.title}</div>
                                      )}
                                    </div>
                                    {isSelected && (
                                      <CheckCircle className="h-5 w-5 text-blue-600" />
                                    )}
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <div className="p-8 text-center text-gray-500">
                              No speakers found matching "{speakerSearchTerm}"
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Can't find who you're looking for? Describe your ideal speaker in the additional information section below.
                  </p>
                </div>
              </div>
            )}

            {/* Workshop Selection (Workshop Tab) */}
            {activeTab === 'workshop' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4">{content.workshopSectionTitle}</h3>

                <div className="space-y-2">
                  <Label>Workshop You're Interested In</Label>
                  <div className="relative" ref={workshopDropdownRef}>
                    <div
                      className={cn(
                        "min-h-[48px] w-full rounded-lg border bg-white px-3 py-2 cursor-pointer",
                        "hover:border-gray-400 transition-colors",
                        showWorkshopDropdown && "border-blue-500 ring-2 ring-blue-100"
                      )}
                      onClick={() => setShowWorkshopDropdown(!showWorkshopDropdown)}
                    >
                      {hasNoWorkshopInMind ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-gray-600">{content.noWorkshopText}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setHasNoWorkshopInMind(false)
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : selectedWorkshop ? (
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium text-gray-900">{selectedWorkshop.title}</div>
                            {selectedWorkshop.speaker_name && (
                              <div className="text-sm text-gray-500">by {selectedWorkshop.speaker_name}</div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              clearWorkshop()
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-gray-500">
                          <span>Select a workshop or let us help you find one</span>
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {showWorkshopDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-xl max-h-80 overflow-hidden">
                        <div className="sticky top-0 bg-white border-b p-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              type="text"
                              placeholder="Search workshops..."
                              value={workshopSearchTerm}
                              onChange={(e) => setWorkshopSearchTerm(e.target.value)}
                              className="pl-10"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-60">
                          {/* Help me find a workshop option */}
                          <div
                            className={cn(
                              "px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b",
                              hasNoWorkshopInMind && "bg-blue-50"
                            )}
                            onClick={handleNoWorkshopInMind}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-700">{content.noWorkshopText}</div>
                                <div className="text-sm text-gray-500">{content.workshopSectionDesc}</div>
                              </div>
                              {hasNoWorkshopInMind && (
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                          </div>
                          {loadingWorkshops ? (
                            <div className="p-8 text-center">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                              <p className="text-sm text-gray-500 mt-2">Loading workshops...</p>
                            </div>
                          ) : filteredWorkshops.length > 0 ? (
                            filteredWorkshops.map(workshop => {
                              const isSelected = selectedWorkshop?.id === workshop.id
                              return (
                                <div
                                  key={workshop.id}
                                  className={cn(
                                    "px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors",
                                    isSelected && "bg-blue-50"
                                  )}
                                  onClick={() => selectWorkshop(workshop)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium">{workshop.title}</div>
                                      <div className="text-sm text-gray-500">
                                        {workshop.speaker_name && `by ${workshop.speaker_name}`}
                                        {workshop.format && workshop.speaker_name && ' • '}
                                        {workshop.format}
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <CheckCircle className="h-5 w-5 text-blue-600" />
                                    )}
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <div className="p-8 text-center text-gray-500">
                              No workshops found matching "{workshopSearchTerm}"
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Not sure which workshop is right? Select "Help me find a workshop" and describe your needs below.
                  </p>
                </div>

                {/* Workshop-specific fields */}
                <div className="grid md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="numberOfParticipants">{content.participantsTitle}</Label>
                    <Select
                      value={formData.numberOfParticipants}
                      onValueChange={(value) => handleInputChange('numberOfParticipants', value)}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select group size" />
                      </SelectTrigger>
                      <SelectContent>
                        {participantOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="participantSkillLevel">{content.skillLevelTitle}</Label>
                    <Select
                      value={formData.participantSkillLevel}
                      onValueChange={(value) => handleInputChange('participantSkillLevel', value)}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select skill level" />
                      </SelectTrigger>
                      <SelectContent>
                        {skillLevelOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="preferredFormat">{content.formatTitle}</Label>
                    <Select
                      value={formData.preferredFormat}
                      onValueChange={(value) => handleInputChange('preferredFormat', value)}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select format preference" />
                      </SelectTrigger>
                      <SelectContent>
                        {formatOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Event Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">
                {content.eventSectionTitle}
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">
                    {activeTab === 'keynote' ? 'Event Date(s)' : 'Preferred Date(s)'}
                  </Label>
                  <div className="space-y-2">
                    {eventDates.map((date, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type="date"
                            value={date}
                            onChange={(e) => {
                              const newDates = [...eventDates]
                              newDates[index] = e.target.value
                              setEventDates(newDates)
                            }}
                            className="h-12 pl-10"
                          />
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                        {eventDates.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setEventDates(eventDates.filter((_, i) => i !== index))
                            }}
                            className="h-12 w-12"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEventDates([...eventDates, ''])}
                      className="w-full"
                    >
                      Add Another Date
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventLocation">
                    {activeTab === 'keynote' ? 'Event Location' : 'Workshop Location'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="eventLocation"
                      value={formData.eventLocation}
                      onChange={(e) => handleInputChange('eventLocation', e.target.value)}
                      placeholder="City, State or Virtual"
                      className="h-12 pl-10"
                    />
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventBudget">
                  {activeTab === 'keynote' ? content.budgetSectionTitle : 'Workshop Budget Range'}
                </Label>
                <Select value={formData.eventBudget} onValueChange={(value) => handleInputChange('eventBudget', value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select your budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">{content.additionalSectionTitle}</h3>

              <div className="space-y-2">
                <Label htmlFor="additionalInfo">
                  Tell us more about your {activeTab === 'keynote' ? 'event' : 'training needs'}
                </Label>
                <Textarea
                  id="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                  placeholder={activeTab === 'keynote'
                    ? "Share details about your audience, event theme, specific topics of interest, or any special requirements..."
                    : "Share details about your team, learning objectives, specific AI tools or technologies you want to focus on, or any special requirements..."
                  }
                  rows={5}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Newsletter Opt-in */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="newsletterOptIn"
                  checked={formData.newsletterOptIn}
                  onCheckedChange={(checked) => handleInputChange('newsletterOptIn', checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="newsletterOptIn"
                    className="text-base font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Newspaper className="h-4 w-4 text-blue-600" />
                    {content.newsletterTitle}
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {content.newsletterDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* CAPTCHA Verification */}
            <div className="flex justify-center py-4">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken('')}
                onExpire={() => setTurnstileToken('')}
                options={{
                  theme: 'light',
                  size: 'normal'
                }}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !turnstileToken}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                content.submitButtonText
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Contact Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{content.needHelpTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{content.callLabel}</p>
                <a href={`tel:${content.phone.replace(/[^0-9+]/g, '')}`} className="text-blue-600 hover:underline">
                  {content.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{content.emailLabel}</p>
                <a href={`mailto:${content.email}`} className="text-blue-600 hover:underline">
                  {content.email}
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
