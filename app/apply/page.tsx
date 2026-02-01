"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { 
  Loader2, 
  CheckCircle, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Linkedin,
  MapPin,
  Briefcase,
  Mic,
  DollarSign,
  Plane,
  Video,
  Users,
  Star,
  Award,
  Target,
  BookOpen,
  AlertCircle,
  Twitter,
  Youtube,
  Instagram,
  ChevronRight,
  ChevronLeft
} from "lucide-react"
import Link from "next/link"

const EXPERTISE_AREAS = [
  "Artificial Intelligence & Machine Learning",
  "Generative AI & LLMs",
  "AI Strategy & Implementation", 
  "Business Strategy & Leadership",
  "Digital Transformation",
  "Innovation & Future Trends",
  "Data & Analytics",
  "Cybersecurity & AI Safety",
  "Ethics & Responsible AI",
  "Healthcare & Life Sciences",
  "Finance & Banking",
  "Retail & E-commerce",
  "Manufacturing & Supply Chain",
  "Education & Learning",
  "Marketing & Customer Experience",
  "Human Resources & Future of Work",
  "Sustainability & Climate Tech",
  "Government & Public Policy",
  "Media & Entertainment",
  "Transportation & Mobility"
]

const SPEAKING_FORMATS = [
  { value: "keynote", label: "Keynote Presentations (30-60 min)" },
  { value: "workshop", label: "Workshops & Masterclasses (Half/Full day)" },
  { value: "panel", label: "Panel Discussions" },
  { value: "fireside", label: "Fireside Chats" },
  { value: "virtual", label: "Virtual/Remote Presentations" },
  { value: "multi-day", label: "Multi-day Programs" },
  { value: "executive", label: "Executive Briefings" },
  { value: "media", label: "Media Appearances" }
]

const FEE_RANGES = [
  "Pro bono (selective)",
  "Under $5,000",
  "$5,000 - $10,000",
  "$10,000 - $25,000",
  "$25,000 - $50,000",
  "$50,000 - $75,000",
  "$75,000 - $100,000",
  "Above $100,000",
  "Varies by engagement"
]

const AUDIENCE_SIZES = [
  "Small groups (< 50)",
  "Medium audiences (50-200)",
  "Large audiences (200-500)",
  "Very large audiences (500-1000)",
  "Stadium/Arena (1000+)",
  "Any size"
]

const INDUSTRIES_SPOKEN = [
  "Technology",
  "Healthcare",
  "Finance",
  "Retail",
  "Manufacturing",
  "Education",
  "Government",
  "Non-profit",
  "Media",
  "Consulting",
  "Other"
]

export default function SpeakerApplicationPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    // Step 1: Qualification
    speaking_experience: "",
    notable_organizations: "",
    ai_expertise: "",
    unique_perspective: "",
    audience_size_preference: "",
    
    // Step 2: Personal Information
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    location: "",
    timezone: "",
    headshot_url: "",
    
    // Step 3: Professional Background
    title: "",
    company: "",
    bio: "",
    short_bio: "",
    achievements: "",
    education: "",
    certifications: "",
    
    // Step 4: Speaking Expertise
    expertise_areas: [] as string[],
    speaking_topics: "",
    signature_talks: "",
    industries_experience: [] as string[],
    case_studies: "",
    
    // Step 5: Speaking Experience
    years_speaking: "",
    total_engagements: "",
    previous_engagements: "",
    client_testimonials: "",
    video_links: [""],
    media_coverage: "",
    
    // Step 6: Digital Presence
    website: "",
    linkedin_url: "",
    twitter_url: "",
    youtube_url: "",
    instagram_url: "",
    blog_url: "",
    published_content: "",
    podcast_appearances: "",
    
    // Step 7: Logistics & Availability
    speaking_fee_range: "",
    travel_requirements: "",
    available_formats: [] as string[],
    booking_lead_time: "",
    availability_constraints: "",
    technical_requirements: "",
    
    // Step 8: References
    reference_contacts: "",
    past_client_references: "",
    speaker_bureau_experience: "",
    
    // Additional
    why_speak_about_ai: "",
    additional_info: "",
    agree_to_terms: false
  })

  const totalSteps = 8
  const progress = (currentStep / totalSteps) * 100

  const handleExpertiseChange = (area: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      expertise_areas: checked 
        ? [...prev.expertise_areas, area]
        : prev.expertise_areas.filter(a => a !== area)
    }))
  }

  const handleFormatChange = (format: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      available_formats: checked 
        ? [...prev.available_formats, format]
        : prev.available_formats.filter(f => f !== format)
    }))
  }

  const handleIndustryChange = (industry: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      industries_experience: checked 
        ? [...prev.industries_experience, industry]
        : prev.industries_experience.filter(i => i !== industry)
    }))
  }

  const addVideoLink = () => {
    setFormData(prev => ({
      ...prev,
      video_links: [...prev.video_links, ""]
    }))
  }

  const updateVideoLink = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      video_links: prev.video_links.map((link, i) => i === index ? value : link)
    }))
  }

  const removeVideoLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      video_links: prev.video_links.filter((_, i) => i !== index)
    }))
  }

  const validateStep = (step: number): boolean => {
    switch(step) {
      case 1:
        return !!(formData.speaking_experience && formData.ai_expertise && formData.unique_perspective)
      case 2:
        return !!(formData.first_name && formData.last_name && formData.email && formData.phone && formData.location)
      case 3:
        return !!(formData.title && formData.company && formData.bio && formData.bio.length >= 200)
      case 4:
        return !!(formData.expertise_areas.length > 0 && formData.speaking_topics)
      case 5:
        return !!(formData.years_speaking && formData.previous_engagements)
      case 6:
        return true // Digital presence is optional but recommended
      case 7:
        return !!(formData.speaking_fee_range && formData.available_formats.length > 0)
      case 8:
        return !!(formData.agree_to_terms)
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
      setError("")
    } else {
      setError("Please complete all required fields before proceeding")
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep(currentStep)) {
      setError("Please complete all required fields")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      // Filter out empty video links
      const cleanedData = {
        ...formData,
        video_links: formData.video_links.filter(link => link.trim() !== ""),
        years_speaking: formData.years_speaking ? parseInt(formData.years_speaking) : null
      }

      const response = await fetch("/api/speaker-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        setError(data.error || "Failed to submit application. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting application:", error)
      setError("An error occurred. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-xl">
            <CardContent className="pt-12 pb-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-r from-green-500 to-green-600">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-[#1E68C6] to-blue-600 bg-clip-text text-transparent mb-4">
                Application Submitted Successfully!
              </h2>
              <p className="text-gray-600 mb-6 text-lg">
                Thank you for applying to join Speak About AI.
              </p>
              <div className="bg-blue-50 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-[#1E68C6] mt-1">1.</span>
                    <span>We'll review your application over the next few weeks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#1E68C6] mt-1">2.</span>
                    <span>If we'd like to move forward, we'll reach out to book a time to chat face-to-face</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#1E68C6] mt-1">3.</span>
                    <span>If after the meeting we both decide it's a fit, we'll work on building you a page on the website and onboarding you with our platform</span>
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-500 mb-8">
                We'll contact you at the email address you provided with our decision.
              </p>
              <Link href="/">
                <Button className="bg-gradient-to-r from-[#1E68C6] to-blue-600 hover:from-blue-700 hover:to-blue-700">
                  Return to Homepage
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-r from-[#1E68C6] to-blue-600">
            <Mic className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1E68C6] to-blue-600 bg-clip-text text-transparent mb-4">
            Join Speak About AI
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Apply to become part of our exclusive network of AI and technology thought leaders
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm font-medium text-[#1E68C6]">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Qualification */}
          {currentStep === 1 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-[#1E68C6] to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Star className="h-5 w-5" />
                  Speaker Qualification
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Help us understand your speaking experience and expertise
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-[#1E68C6]" />
                  <AlertTitle className="text-blue-900">Why these questions matter</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    We maintain a curated network of exceptional speakers. These questions help us ensure 
                    you're a great fit for our clients' needs and can deliver outstanding value.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="speaking_experience">
                    How would you describe your speaking experience level? *
                  </Label>
                  <RadioGroup
                    value={formData.speaking_experience}
                    onValueChange={(value) => setFormData({...formData, speaking_experience: value})}
                    className="mt-3 space-y-2"
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="beginner" id="beginner" />
                      <Label htmlFor="beginner" className="cursor-pointer flex-1">
                        <span className="font-medium">Emerging Speaker</span>
                        <span className="block text-sm text-gray-600">1-2 years, less than 10 speaking engagements</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="intermediate" id="intermediate" />
                      <Label htmlFor="intermediate" className="cursor-pointer flex-1">
                        <span className="font-medium">Experienced Speaker</span>
                        <span className="block text-sm text-gray-600">3-5 years, 10-50 speaking engagements</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="advanced" id="advanced" />
                      <Label htmlFor="advanced" className="cursor-pointer flex-1">
                        <span className="font-medium">Seasoned Professional</span>
                        <span className="block text-sm text-gray-600">5-10 years, 50-100 speaking engagements</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="expert" id="expert" />
                      <Label htmlFor="expert" className="cursor-pointer flex-1">
                        <span className="font-medium">Veteran Keynote Speaker</span>
                        <span className="block text-sm text-gray-600">10+ years, 100+ speaking engagements</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="notable_organizations">
                    Name 3-5 notable organizations you've spoken for (if applicable)
                  </Label>
                  <Textarea
                    id="notable_organizations"
                    rows={3}
                    placeholder="e.g., Google, MIT, World Economic Forum, TED, Fortune 500 companies..."
                    value={formData.notable_organizations}
                    onChange={(e) => setFormData({...formData, notable_organizations: e.target.value})}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="ai_expertise">
                    Describe your specific expertise in AI/technology (be specific) *
                  </Label>
                  <Textarea
                    id="ai_expertise"
                    rows={4}
                    placeholder="e.g., 'I led the implementation of GPT-4 at a Fortune 500 company', 'I published research on AI ethics', 'I founded an AI startup that raised $10M'..."
                    value={formData.ai_expertise}
                    onChange={(e) => setFormData({...formData, ai_expertise: e.target.value})}
                    className="mt-2"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Be specific about your hands-on experience, achievements, and expertise</p>
                </div>

                <div>
                  <Label htmlFor="unique_perspective">
                    What unique perspective or insight do you bring to AI discussions? *
                  </Label>
                  <Textarea
                    id="unique_perspective"
                    rows={4}
                    placeholder="What makes your viewpoint different? What can audiences learn from you that they can't learn elsewhere?"
                    value={formData.unique_perspective}
                    onChange={(e) => setFormData({...formData, unique_perspective: e.target.value})}
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="audience_size_preference">
                    What size audiences are you comfortable speaking to?
                  </Label>
                  <Select
                    value={formData.audience_size_preference}
                    onValueChange={(value) => setFormData({...formData, audience_size_preference: value})}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select audience size preference" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUDIENCE_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-[#1E68C6] to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Your contact details and basic information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        required
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        required
                        className="pl-10"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">City, State/Country *</Label>
                    <div className="relative mt-2">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="location"
                        required
                        placeholder="e.g., San Francisco, CA"
                        className="pl-10"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      placeholder="e.g., PST, EST, GMT"
                      className="mt-2"
                      value={formData.timezone}
                      onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="headshot_url">Professional Headshot URL</Label>
                  <Input
                    id="headshot_url"
                    type="url"
                    placeholder="https://... (High-resolution professional photo)"
                    className="mt-2"
                    value={formData.headshot_url}
                    onChange={(e) => setFormData({...formData, headshot_url: e.target.value})}
                  />
                  <p className="text-sm text-gray-500 mt-1">Provide a link to a high-quality professional headshot</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Professional Background */}
          {currentStep === 3 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-[#1E68C6] to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Briefcase className="h-5 w-5" />
                  Professional Background
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Your current role and professional story
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Current Title/Position *</Label>
                    <Input
                      id="title"
                      required
                      placeholder="e.g., Chief AI Officer, Founder & CEO"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company/Organization *</Label>
                    <Input
                      id="company"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Full Biography * (minimum 200 characters)</Label>
                  <Textarea
                    id="bio"
                    rows={6}
                    required
                    placeholder="Tell your professional story. Include your background, key achievements, current focus, and what drives your passion for AI..."
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.bio.length}/200 characters (minimum)
                  </p>
                </div>

                <div>
                  <Label htmlFor="short_bio">Short Bio (1-2 sentences for introductions)</Label>
                  <Textarea
                    id="short_bio"
                    rows={2}
                    placeholder="A concise version for event introductions and marketing materials..."
                    value={formData.short_bio}
                    onChange={(e) => setFormData({...formData, short_bio: e.target.value})}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="achievements">Key Achievements & Recognition</Label>
                  <Textarea
                    id="achievements"
                    rows={4}
                    placeholder="Awards, publications, patents, notable projects, media features..."
                    value={formData.achievements}
                    onChange={(e) => setFormData({...formData, achievements: e.target.value})}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="education">Education Background</Label>
                    <Textarea
                      id="education"
                      rows={3}
                      placeholder="Degrees, universities, relevant coursework..."
                      value={formData.education}
                      onChange={(e) => setFormData({...formData, education: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="certifications">Relevant Certifications</Label>
                    <Textarea
                      id="certifications"
                      rows={3}
                      placeholder="Professional certifications, credentials..."
                      value={formData.certifications}
                      onChange={(e) => setFormData({...formData, certifications: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Speaking Expertise */}
          {currentStep === 4 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-[#1E68C6] to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="h-5 w-5" />
                  Speaking Expertise & Topics
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Define your areas of expertise and speaking topics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <Label>Areas of Expertise * (select all that apply)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                    {EXPERTISE_AREAS.map((area) => (
                      <div key={area} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                        <Checkbox
                          id={area}
                          checked={formData.expertise_areas.includes(area)}
                          onCheckedChange={(checked) => handleExpertiseChange(area, checked as boolean)}
                        />
                        <Label htmlFor={area} className="text-sm cursor-pointer flex-1">
                          {area}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="speaking_topics">
                    Specific Speaking Topics * (list 3-5 signature topics)
                  </Label>
                  <Textarea
                    id="speaking_topics"
                    rows={4}
                    required
                    placeholder="List your signature speaking topics, one per line. Be specific about what audiences will learn..."
                    value={formData.speaking_topics}
                    onChange={(e) => setFormData({...formData, speaking_topics: e.target.value})}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="signature_talks">
                    Signature Talk Titles & Descriptions
                  </Label>
                  <Textarea
                    id="signature_talks"
                    rows={5}
                    placeholder="Share 2-3 of your most popular or impactful presentation titles with brief descriptions..."
                    value={formData.signature_talks}
                    onChange={(e) => setFormData({...formData, signature_talks: e.target.value})}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Industries You've Spoken To (select all that apply)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                    {INDUSTRIES_SPOKEN.map((industry) => (
                      <div key={industry} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                        <Checkbox
                          id={industry}
                          checked={formData.industries_experience.includes(industry)}
                          onCheckedChange={(checked) => handleIndustryChange(industry, checked as boolean)}
                        />
                        <Label htmlFor={industry} className="text-sm cursor-pointer">
                          {industry}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="case_studies">
                    Case Studies or Success Stories
                  </Label>
                  <Textarea
                    id="case_studies"
                    rows={4}
                    placeholder="Share specific examples of impact from your speaking engagements..."
                    value={formData.case_studies}
                    onChange={(e) => setFormData({...formData, case_studies: e.target.value})}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Speaking Experience */}
          {currentStep === 5 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-[#1E68C6] to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Award className="h-5 w-5" />
                  Speaking Experience & Portfolio
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Share your speaking history and portfolio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="years_speaking">Years of Speaking Experience *</Label>
                    <Input
                      id="years_speaking"
                      type="number"
                      required
                      placeholder="e.g., 5"
                      value={formData.years_speaking}
                      onChange={(e) => setFormData({...formData, years_speaking: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="total_engagements">Approximate Total Speaking Engagements</Label>
                    <Input
                      id="total_engagements"
                      placeholder="e.g., 50+"
                      value={formData.total_engagements}
                      onChange={(e) => setFormData({...formData, total_engagements: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="previous_engagements">
                    Notable Past Speaking Engagements * (list 5-10)
                  </Label>
                  <Textarea
                    id="previous_engagements"
                    rows={5}
                    required
                    placeholder="List conference names, company events, universities, etc. Include dates if possible..."
                    value={formData.previous_engagements}
                    onChange={(e) => setFormData({...formData, previous_engagements: e.target.value})}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Video Links (speeches, interviews, podcasts)</Label>
                  <p className="text-sm text-gray-500 mb-2">Provide links to videos showcasing your speaking ability</p>
                  {formData.video_links.map((link, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <div className="relative flex-1">
                        <Video className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          type="url"
                          placeholder="https://youtube.com/..."
                          value={link}
                          onChange={(e) => updateVideoLink(index, e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {formData.video_links.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeVideoLink(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVideoLink}
                    className="mt-2"
                  >
                    Add Another Video
                  </Button>
                </div>

                <div>
                  <Label htmlFor="client_testimonials">Client Testimonials</Label>
                  <Textarea
                    id="client_testimonials"
                    rows={4}
                    placeholder="Share 2-3 testimonials from past clients or event organizers..."
                    value={formData.client_testimonials}
                    onChange={(e) => setFormData({...formData, client_testimonials: e.target.value})}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="media_coverage">Media Coverage & Press</Label>
                  <Textarea
                    id="media_coverage"
                    rows={3}
                    placeholder="List any media appearances, press coverage, or featured articles..."
                    value={formData.media_coverage}
                    onChange={(e) => setFormData({...formData, media_coverage: e.target.value})}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 6: Digital Presence */}
          {currentStep === 6 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-[#1E68C6] to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Globe className="h-5 w-5" />
                  Digital Presence & Content
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Your online presence and content portfolio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="website">Personal/Company Website</Label>
                    <div className="relative mt-2">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://..."
                        className="pl-10"
                        value={formData.website}
                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
                    <div className="relative mt-2">
                      <Linkedin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="linkedin_url"
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        className="pl-10"
                        value={formData.linkedin_url}
                        onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="twitter_url">Twitter/X Profile</Label>
                    <div className="relative mt-2">
                      <Twitter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="twitter_url"
                        type="url"
                        placeholder="https://twitter.com/..."
                        className="pl-10"
                        value={formData.twitter_url}
                        onChange={(e) => setFormData({...formData, twitter_url: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="youtube_url">YouTube Channel</Label>
                    <div className="relative mt-2">
                      <Youtube className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="youtube_url"
                        type="url"
                        placeholder="https://youtube.com/..."
                        className="pl-10"
                        value={formData.youtube_url}
                        onChange={(e) => setFormData({...formData, youtube_url: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="instagram_url">Instagram Profile</Label>
                    <div className="relative mt-2">
                      <Instagram className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="instagram_url"
                        type="url"
                        placeholder="https://instagram.com/..."
                        className="pl-10"
                        value={formData.instagram_url}
                        onChange={(e) => setFormData({...formData, instagram_url: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="blog_url">Blog or Newsletter</Label>
                    <div className="relative mt-2">
                      <BookOpen className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="blog_url"
                        type="url"
                        placeholder="https://..."
                        className="pl-10"
                        value={formData.blog_url}
                        onChange={(e) => setFormData({...formData, blog_url: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="published_content">Published Content (books, articles, research)</Label>
                  <Textarea
                    id="published_content"
                    rows={3}
                    placeholder="List any books, whitepapers, research papers, or major articles you've published..."
                    value={formData.published_content}
                    onChange={(e) => setFormData({...formData, published_content: e.target.value})}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="podcast_appearances">Podcast Appearances</Label>
                  <Textarea
                    id="podcast_appearances"
                    rows={3}
                    placeholder="List notable podcast appearances with links if available..."
                    value={formData.podcast_appearances}
                    onChange={(e) => setFormData({...formData, podcast_appearances: e.target.value})}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 7: Logistics & Availability */}
          {currentStep === 7 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-[#1E68C6] to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-white">
                  <DollarSign className="h-5 w-5" />
                  Logistics & Availability
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Your speaking requirements and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <Label htmlFor="speaking_fee_range">Speaking Fee Range *</Label>
                  <Select
                    value={formData.speaking_fee_range}
                    onValueChange={(value) => setFormData({...formData, speaking_fee_range: value})}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select your typical fee range" />
                    </SelectTrigger>
                    <SelectContent>
                      {FEE_RANGES.map((range) => (
                        <SelectItem key={range} value={range}>
                          {range}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">This helps us match you with appropriate opportunities</p>
                </div>

                <div>
                  <Label>Available Speaking Formats * (select all that apply)</Label>
                  <div className="space-y-2 mt-3">
                    {SPEAKING_FORMATS.map((format) => (
                      <div key={format.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                        <Checkbox
                          id={format.value}
                          checked={formData.available_formats.includes(format.value)}
                          onCheckedChange={(checked) => handleFormatChange(format.value, checked as boolean)}
                        />
                        <Label htmlFor={format.value} className="text-sm font-normal cursor-pointer flex-1">
                          {format.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="travel_requirements">Travel Requirements & Preferences</Label>
                  <Textarea
                    id="travel_requirements"
                    rows={3}
                    placeholder="Any specific travel requirements, restrictions, or preferences..."
                    value={formData.travel_requirements}
                    onChange={(e) => setFormData({...formData, travel_requirements: e.target.value})}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="booking_lead_time">Typical Booking Lead Time</Label>
                    <Input
                      id="booking_lead_time"
                      placeholder="e.g., 4-6 weeks minimum"
                      value={formData.booking_lead_time}
                      onChange={(e) => setFormData({...formData, booking_lead_time: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="availability_constraints">Availability Constraints</Label>
                    <Input
                      id="availability_constraints"
                      placeholder="e.g., Weekdays only, No August"
                      value={formData.availability_constraints}
                      onChange={(e) => setFormData({...formData, availability_constraints: e.target.value})}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="technical_requirements">Technical Requirements</Label>
                  <Textarea
                    id="technical_requirements"
                    rows={3}
                    placeholder="Any specific A/V, stage setup, or technical needs..."
                    value={formData.technical_requirements}
                    onChange={(e) => setFormData({...formData, technical_requirements: e.target.value})}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 8: References & Final */}
          {currentStep === 8 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-[#1E68C6] to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5" />
                  References & Additional Information
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Final details and references
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <Label htmlFor="reference_contacts">Professional References (2-3 contacts)</Label>
                  <Textarea
                    id="reference_contacts"
                    rows={4}
                    placeholder="Name, Title, Organization, Email/Phone for 2-3 references who can speak to your speaking abilities..."
                    value={formData.reference_contacts}
                    onChange={(e) => setFormData({...formData, reference_contacts: e.target.value})}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="past_client_references">Past Client References</Label>
                  <Textarea
                    id="past_client_references"
                    rows={3}
                    placeholder="Event organizers or clients we can contact for testimonials..."
                    value={formData.past_client_references}
                    onChange={(e) => setFormData({...formData, past_client_references: e.target.value})}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="speaker_bureau_experience">Other Speaker Bureau Experience</Label>
                  <Textarea
                    id="speaker_bureau_experience"
                    rows={2}
                    placeholder="List any other speaker bureaus you work with..."
                    value={formData.speaker_bureau_experience}
                    onChange={(e) => setFormData({...formData, speaker_bureau_experience: e.target.value})}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="why_speak_about_ai">Why do you want to join Speak About AI?</Label>
                  <Textarea
                    id="why_speak_about_ai"
                    rows={4}
                    placeholder="What attracts you to our platform specifically? How do you see us working together?"
                    value={formData.why_speak_about_ai}
                    onChange={(e) => setFormData({...formData, why_speak_about_ai: e.target.value})}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="additional_info">Anything else you'd like us to know?</Label>
                  <Textarea
                    id="additional_info"
                    rows={3}
                    placeholder="Any additional information that might be relevant..."
                    value={formData.additional_info}
                    onChange={(e) => setFormData({...formData, additional_info: e.target.value})}
                    className="mt-2"
                  />
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agree_to_terms"
                      checked={formData.agree_to_terms}
                      onCheckedChange={(checked) => setFormData({...formData, agree_to_terms: checked as boolean})}
                      className="mt-1"
                    />
                    <Label htmlFor="agree_to_terms" className="text-sm cursor-pointer">
                      I confirm that all information provided is accurate and I agree to the Speak About AI 
                      speaker terms and conditions. I understand that acceptance is not guaranteed and is 
                      based on client needs and speaker qualifications. *
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
            
            <div className={currentStep === 1 ? "ml-auto" : ""}>
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[#1E68C6] to-blue-600 hover:from-blue-700 hover:to-blue-800"
                >
                  Next Step
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !formData.agree_to_terms}
                  className="bg-gradient-to-r from-[#1E68C6] to-blue-600 hover:from-blue-700 hover:to-blue-800"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}