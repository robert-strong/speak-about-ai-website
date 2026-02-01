"use client"

import { useState, useEffect, useRef } from "react"
import { upload } from "@vercel/blob/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  User, Mail, Phone, Globe, Linkedin, Twitter, Youtube, Instagram,
  MapPin, Briefcase, GraduationCap, Award, Video, Mic, DollarSign,
  Calendar, Upload, Save, ChevronLeft, Plus, X, Check, CheckCircle,
  AlertCircle, Camera, Edit, Trash2, Link as LinkIcon, BookOpen,
  Target, Users, Star, TrendingUp, FileText, Loader2, Eye, Copy,
  Download, ExternalLink, Building, Shield, Lock, Info, Settings,
  CreditCard, Plane, Hotel, Car, Utensils, Heart, AlertTriangle,
  Contact, UserCheck, Key, FileSignature
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
  { value: "keynote", label: "Keynote Presentations" },
  { value: "workshop", label: "Workshops & Masterclasses" },
  { value: "panel", label: "Panel Discussions" },
  { value: "fireside", label: "Fireside Chats" },
  { value: "virtual", label: "Virtual Presentations" },
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

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Chinese (Mandarin)",
  "Japanese", "Korean", "Italian", "Portuguese", "Arabic", "Hindi", "Russian"
]

export default function SpeakerProfilePageRestructured() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("external")
  const [activeExternalSection, setActiveExternalSection] = useState("profile")
  const [activeInternalSection, setActiveInternalSection] = useState("contact")
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState("")
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showVideoDialog, setShowVideoDialog] = useState(false)
  const [newVideo, setNewVideo] = useState({ title: '', url: '', date: '' })
  const [editingVideoIndex, setEditingVideoIndex] = useState<number | null>(null)
  
  // Form states for editing
  const [editMode, setEditMode] = useState({
    profile: false,
    expertise: false,
    experience: false,
    media: false,
    contact: false,
    logistics: false,
    financial: false,
    health: false
  })

  // Check authentication and fetch profile
  useEffect(() => {
    const token = localStorage.getItem("speakerToken")
    if (!token) {
      router.push("/portal/speaker")
    } else {
      fetchProfile(token)
    }
  }, [router])

  const fetchProfile = async (token: string) => {
    try {
      const response = await fetch('/api/speakers/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile`)
      }
      
      const data = await response.json()
      setProfile(data.profile)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError(`Failed to load profile`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (section: string) => {
    setIsSaving(true)
    const token = localStorage.getItem("speakerToken")
    
    try {
      const response = await fetch('/api/speakers/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save profile')
      }
      
      setShowSuccess(true)
      setEditMode(prev => ({ ...prev, [section]: false }))
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const profileCompletionItems = profile ? [
    { label: "Public Profile", completed: !!(profile?.first_name && profile?.bio) },
    { label: "Expertise & Topics", completed: profile?.speaking_topics?.length > 0 },
    { label: "Media & Videos", completed: profile?.videos?.length > 0 },
    { label: "Contact Details", completed: !!(profile?.email && profile?.phone) },
    { label: "Travel Preferences", completed: !!profile?.travel_preferences },
    { label: "Technical Requirements", completed: !!profile?.technical_requirements }
  ] : []

  const completedItems = profileCompletionItems.filter(item => item.completed).length
  const totalItems = profileCompletionItems.length
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E68C6] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed to load profile</h2>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="bg-gradient-to-r from-[#1E68C6] to-blue-600 h-1"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link href="/speakers/dashboard">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1E68C6] to-blue-600 bg-clip-text text-transparent">
                  Profile Management
                </h1>
                <p className="text-sm text-gray-600">Manage your public and internal information</p>
              </div>
            </div>
            <Button 
              className="bg-gradient-to-r from-[#1E68C6] to-blue-600 hover:from-blue-700 hover:to-blue-800"
              size="sm"
              onClick={() => {
                const slug = profile ? 
                  `${profile.first_name}-${profile.last_name}`.toLowerCase().replace(/\s+/g, '-') : ''
                if (slug) {
                  window.open(`/speakers/${slug}`, '_blank')
                }
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Public Profile
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Card */}
        <Card className="border-0 shadow-xl mb-8 overflow-hidden">
          <div className="px-8 pt-8 pb-8">
            <div className="flex items-end mb-4">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                  <AvatarImage src={profile.headshot_url} alt={profile.first_name} />
                  <AvatarFallback className="text-3xl bg-gradient-to-r from-[#1E68C6] to-blue-600 text-white">
                    {profile.first_name?.[0]}{profile.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="ml-6 flex-1">
                <h2 className="text-3xl font-bold">
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-lg text-gray-600">
                  {profile.title} {profile.company && `at ${profile.company}`}
                </p>
                <div className="flex items-center gap-6 mt-2 text-sm text-gray-500">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </span>
                  )}
                  {profile.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="gap-1">
                    <Eye className="h-3 w-3" />
                    {profile.profile_views || 0} views
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Star className="h-3 w-3" />
                    {profile.avg_rating || 0} rating
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Profile Completion */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">Profile Completion</span>
                  <span className="text-sm font-bold text-[#1E68C6]">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {profileCompletionItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs">
                      {item.completed ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400" />
                      )}
                      <span className={item.completed ? "text-green-800" : "text-gray-600"}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </Card>

        {/* Success Alert */}
        {showSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your profile has been updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs - External vs Internal */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-white shadow-lg">
            <TabsTrigger 
              value="external" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
            >
              <Globe className="h-4 w-4 mr-2" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">External Info</span>
                <span className="text-xs opacity-80">Public Profile</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="internal" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <Shield className="h-4 w-4 mr-2" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">Internal Info</span>
                <span className="text-xs opacity-80">Operations Only</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* External Info Tab */}
          <TabsContent value="external" className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Globe className="h-5 w-5 text-green-600" />
                      Public Information
                    </CardTitle>
                    <CardDescription>Information visible on your public speaker profile</CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    <Eye className="h-3 w-3 mr-1" />
                    Publicly Visible
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={activeExternalSection} onValueChange={setActiveExternalSection}>
                  <TabsList className="w-full justify-start rounded-none border-b h-12 p-0 bg-transparent">
                    <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger value="expertise" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600">
                      <Target className="h-4 w-4 mr-2" />
                      Expertise
                    </TabsTrigger>
                    <TabsTrigger value="experience" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Experience
                    </TabsTrigger>
                    <TabsTrigger value="media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600">
                      <Video className="h-4 w-4 mr-2" />
                      Media
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-6">
                    {/* Profile Section */}
                    <TabsContent value="profile" className="mt-0 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="first_name">First Name</Label>
                          <Input
                            id="first_name"
                            value={profile.first_name || ''}
                            onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                            disabled={!editMode.profile}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="last_name">Last Name</Label>
                          <Input
                            id="last_name"
                            value={profile.last_name || ''}
                            onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                            disabled={!editMode.profile}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="title">Professional Title</Label>
                        <Input
                          id="title"
                          value={profile.title || ''}
                          onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                          disabled={!editMode.profile}
                          className="mt-2"
                          placeholder="e.g., AI Strategy Consultant, CEO, Keynote Speaker"
                        />
                      </div>

                      <div>
                        <Label htmlFor="company">Company/Organization</Label>
                        <Input
                          id="company"
                          value={profile.company || ''}
                          onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                          disabled={!editMode.profile}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="bio">Full Biography (Public)</Label>
                        <Textarea
                          id="bio"
                          rows={6}
                          value={profile.bio || ''}
                          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                          disabled={!editMode.profile}
                          className="mt-2"
                          placeholder="Your professional biography that will appear on your public profile..."
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          {(profile.bio || '').length} characters
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="short_bio">Short Bio (for introductions)</Label>
                        <Textarea
                          id="short_bio"
                          rows={2}
                          value={profile.short_bio || ''}
                          onChange={(e) => setProfile({ ...profile, short_bio: e.target.value })}
                          disabled={!editMode.profile}
                          className="mt-2"
                          placeholder="A brief 1-2 sentence bio for quick introductions..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profile.location || ''}
                          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                          disabled={!editMode.profile}
                          className="mt-2"
                          placeholder="City, State/Country"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        {editMode.profile ? (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditMode(prev => ({ ...prev, profile: false }))}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => handleSave('profile')}
                              disabled={isSaving}
                              className="bg-gradient-to-r from-green-600 to-emerald-600"
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button 
                            onClick={() => setEditMode(prev => ({ ...prev, profile: true }))}
                            variant="outline"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                        )}
                      </div>
                    </TabsContent>

                    {/* Expertise Section */}
                    <TabsContent value="expertise" className="mt-0 space-y-6">
                      <div>
                        <Label>Speaking Topics</Label>
                        <div className="mt-2 space-y-2">
                          {editMode.expertise ? (
                            <>
                              {profile.speaking_topics?.map((topic: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Input
                                    value={topic}
                                    onChange={(e) => {
                                      const newTopics = [...(profile.speaking_topics || [])];
                                      newTopics[idx] = e.target.value;
                                      setProfile({ ...profile, speaking_topics: newTopics });
                                    }}
                                    className="flex-1"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const newTopics = profile.speaking_topics?.filter((_: string, i: number) => i !== idx);
                                      setProfile({ ...profile, speaking_topics: newTopics });
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setProfile({ 
                                    ...profile, 
                                    speaking_topics: [...(profile.speaking_topics || []), ''] 
                                  });
                                }}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Topic
                              </Button>
                            </>
                          ) : (
                            profile.speaking_topics?.map((topic: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Badge variant="secondary" className="flex-1 justify-start">
                                  <Mic className="h-3 w-3 mr-1" />
                                  {topic}
                                </Badge>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>Areas of Expertise</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {editMode.expertise ? (
                            <>
                              {profile.expertise_areas?.map((area: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <Input
                                    value={area}
                                    onChange={(e) => {
                                      const newAreas = [...(profile.expertise_areas || [])];
                                      newAreas[idx] = e.target.value;
                                      setProfile({ ...profile, expertise_areas: newAreas });
                                    }}
                                    className="w-40"
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const newAreas = profile.expertise_areas?.filter((_: string, i: number) => i !== idx);
                                      setProfile({ ...profile, expertise_areas: newAreas });
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setProfile({ 
                                    ...profile, 
                                    expertise_areas: [...(profile.expertise_areas || []), ''] 
                                  });
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Area
                              </Button>
                            </>
                          ) : (
                            profile.expertise_areas?.map((area: string, idx: number) => (
                              <Badge key={idx} className="bg-green-100 text-green-800 border-green-200">
                                {area}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>Languages</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {editMode.expertise ? (
                            <>
                              {profile.languages?.map((lang: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <Input
                                    value={lang}
                                    onChange={(e) => {
                                      const newLangs = [...(profile.languages || [])];
                                      newLangs[idx] = e.target.value;
                                      setProfile({ ...profile, languages: newLangs });
                                    }}
                                    className="w-32"
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const newLangs = profile.languages?.filter((_: string, i: number) => i !== idx);
                                      setProfile({ ...profile, languages: newLangs });
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setProfile({ 
                                    ...profile, 
                                    languages: [...(profile.languages || []), ''] 
                                  });
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Language
                              </Button>
                            </>
                          ) : (
                            profile.languages?.map((lang: string, idx: number) => (
                              <Badge key={idx} variant="outline">
                                {lang}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        {editMode.expertise ? (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditMode(prev => ({ ...prev, expertise: false }))}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => handleSave('expertise')}
                              disabled={isSaving}
                              className="bg-gradient-to-r from-green-600 to-emerald-600"
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button 
                            onClick={() => setEditMode(prev => ({ ...prev, expertise: true }))}
                            variant="outline"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Expertise
                          </Button>
                        )}
                      </div>
                    </TabsContent>

                    {/* Experience Section */}
                    <TabsContent value="experience" className="mt-0 space-y-6">
                      {/* Past Events */}
                      <div>
                        <Label>Past Speaking Engagements</Label>
                        <div className="mt-2 space-y-3">
                          {editMode.experience ? (
                            <>
                              {(profile.past_events || []).map((event: any, index: number) => (
                                <div key={index} className="border rounded p-3 bg-gray-50">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 space-y-2">
                                      <Input
                                        value={event.eventName || ''}
                                        onChange={(e) => {
                                          const updated = [...(profile.past_events || [])]
                                          updated[index] = { ...event, eventName: e.target.value }
                                          setProfile({ ...profile, past_events: updated })
                                        }}
                                        placeholder="Event name"
                                      />
                                      <div className="grid grid-cols-2 gap-2">
                                        <Input
                                          value={event.eventType || ''}
                                          onChange={(e) => {
                                            const updated = [...(profile.past_events || [])]
                                            updated[index] = { ...event, eventType: e.target.value }
                                            setProfile({ ...profile, past_events: updated })
                                          }}
                                          placeholder="Event type"
                                        />
                                        <Input
                                          value={event.location || ''}
                                          onChange={(e) => {
                                            const updated = [...(profile.past_events || [])]
                                            updated[index] = { ...event, location: e.target.value }
                                            setProfile({ ...profile, past_events: updated })
                                          }}
                                          placeholder="Location"
                                        />
                                      </div>
                                      <Input
                                        value={event.date || ''}
                                        onChange={(e) => {
                                          const updated = [...(profile.past_events || [])]
                                          updated[index] = { ...event, date: e.target.value }
                                          setProfile({ ...profile, past_events: updated })
                                        }}
                                        placeholder="Date"
                                      />
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updated = (profile.past_events || []).filter((_: any, i: number) => i !== index)
                                        setProfile({ ...profile, past_events: updated })
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setProfile({
                                    ...profile,
                                    past_events: [...(profile.past_events || []), { eventName: '', eventType: '', location: '', date: '' }]
                                  })
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Past Event
                              </Button>
                            </>
                          ) : (
                            <div className="space-y-2">
                              {(profile.past_events || []).length > 0 ? (
                                (profile.past_events || []).map((event: any, index: number) => (
                                  <div key={index} className="border-l-4 border-green-600 pl-4 py-2">
                                    <h4 className="font-medium">{event.eventName}</h4>
                                    <p className="text-sm text-gray-600">
                                      {event.eventType && <span>{event.eventType}</span>}
                                      {event.location && <span> • {event.location}</span>}
                                      {event.date && <span> • {event.date}</span>}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500">No past events added yet</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Awards */}
                      <div>
                        <Label>Awards & Recognition</Label>
                        <div className="mt-2 space-y-3">
                          {editMode.experience ? (
                            <>
                              {(profile.awards || []).map((award: any, index: number) => (
                                <div key={index} className="border rounded p-3 bg-gray-50">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 space-y-2">
                                      <Input
                                        value={award.title || ''}
                                        onChange={(e) => {
                                          const updated = [...(profile.awards || [])]
                                          updated[index] = { ...award, title: e.target.value }
                                          setProfile({ ...profile, awards: updated })
                                        }}
                                        placeholder="Award title"
                                      />
                                      <div className="grid grid-cols-2 gap-2">
                                        <Input
                                          value={award.organization || ''}
                                          onChange={(e) => {
                                            const updated = [...(profile.awards || [])]
                                            updated[index] = { ...award, organization: e.target.value }
                                            setProfile({ ...profile, awards: updated })
                                          }}
                                          placeholder="Organization"
                                        />
                                        <Input
                                          value={award.year || ''}
                                          onChange={(e) => {
                                            const updated = [...(profile.awards || [])]
                                            updated[index] = { ...award, year: e.target.value }
                                            setProfile({ ...profile, awards: updated })
                                          }}
                                          placeholder="Year"
                                        />
                                      </div>
                                      <Textarea
                                        value={award.description || ''}
                                        onChange={(e) => {
                                          const updated = [...(profile.awards || [])]
                                          updated[index] = { ...award, description: e.target.value }
                                          setProfile({ ...profile, awards: updated })
                                        }}
                                        placeholder="Description (optional)"
                                        rows={2}
                                      />
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updated = (profile.awards || []).filter((_: any, i: number) => i !== index)
                                        setProfile({ ...profile, awards: updated })
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setProfile({
                                    ...profile,
                                    awards: [...(profile.awards || []), { title: '', organization: '', year: '', description: '' }]
                                  })
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Award
                              </Button>
                            </>
                          ) : (
                            <div className="space-y-2">
                              {(profile.awards || []).length > 0 ? (
                                (profile.awards || []).map((award: any, index: number) => (
                                  <div key={index} className="border-l-4 border-yellow-600 pl-4 py-2">
                                    <h4 className="font-medium">{award.title}</h4>
                                    <p className="text-sm text-gray-600">
                                      {award.organization && <span>{award.organization}</span>}
                                      {award.year && <span> • {award.year}</span>}
                                    </p>
                                    {award.description && <p className="text-sm text-gray-500 mt-1">{award.description}</p>}
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500">No awards added yet</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Publications */}
                      <div>
                        <Label>Publications</Label>
                        <div className="mt-2 space-y-3">
                          {editMode.experience ? (
                            <>
                              {(profile.publications || []).map((pub: any, index: number) => (
                                <div key={index} className="border rounded p-3 bg-gray-50">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 space-y-2">
                                      <Input
                                        value={pub.title || ''}
                                        onChange={(e) => {
                                          const updated = [...(profile.publications || [])]
                                          updated[index] = { ...pub, title: e.target.value }
                                          setProfile({ ...profile, publications: updated })
                                        }}
                                        placeholder="Publication title"
                                      />
                                      <div className="grid grid-cols-2 gap-2">
                                        <select
                                          value={pub.type || 'article'}
                                          onChange={(e) => {
                                            const updated = [...(profile.publications || [])]
                                            updated[index] = { ...pub, type: e.target.value }
                                            setProfile({ ...profile, publications: updated })
                                          }}
                                          className="w-full p-2 border rounded"
                                        >
                                          <option value="book">Book</option>
                                          <option value="article">Article</option>
                                          <option value="research">Research</option>
                                          <option value="whitepaper">Whitepaper</option>
                                        </select>
                                        <Input
                                          value={pub.publisher || ''}
                                          onChange={(e) => {
                                            const updated = [...(profile.publications || [])]
                                            updated[index] = { ...pub, publisher: e.target.value }
                                            setProfile({ ...profile, publications: updated })
                                          }}
                                          placeholder="Publisher"
                                        />
                                      </div>
                                      <Input
                                        value={pub.link || ''}
                                        onChange={(e) => {
                                          const updated = [...(profile.publications || [])]
                                          updated[index] = { ...pub, link: e.target.value }
                                          setProfile({ ...profile, publications: updated })
                                        }}
                                        placeholder="Link URL"
                                      />
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updated = (profile.publications || []).filter((_: any, i: number) => i !== index)
                                        setProfile({ ...profile, publications: updated })
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setProfile({
                                    ...profile,
                                    publications: [...(profile.publications || []), { title: '', type: 'article', publisher: '', link: '' }]
                                  })
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Publication
                              </Button>
                            </>
                          ) : (
                            <div className="space-y-2">
                              {(profile.publications || []).length > 0 ? (
                                (profile.publications || []).map((pub: any, index: number) => (
                                  <div key={index} className="border-l-4 border-blue-600 pl-4 py-2">
                                    <h4 className="font-medium">{pub.title}</h4>
                                    <p className="text-sm text-gray-600">
                                      <Badge variant="outline" className="mr-2">{pub.type}</Badge>
                                      {pub.publisher}
                                    </p>
                                    {pub.link && (
                                      <a href={pub.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1">
                                        View publication <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500">No publications added yet</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Client Logos */}
                      <div>
                        <Label>Client Organizations</Label>
                        <div className="mt-2 space-y-3">
                          {editMode.experience ? (
                            <>
                              {(profile.client_logos || []).map((client: any, index: number) => (
                                <div key={index} className="border rounded p-3 bg-gray-50">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 space-y-2">
                                      <Input
                                        value={client.name || ''}
                                        onChange={(e) => {
                                          const updated = [...(profile.client_logos || [])]
                                          updated[index] = { ...client, name: e.target.value }
                                          setProfile({ ...profile, client_logos: updated })
                                        }}
                                        placeholder="Organization name"
                                      />
                                      <Input
                                        value={client.logoUrl || ''}
                                        onChange={(e) => {
                                          const updated = [...(profile.client_logos || [])]
                                          updated[index] = { ...client, logoUrl: e.target.value }
                                          setProfile({ ...profile, client_logos: updated })
                                        }}
                                        placeholder="Logo URL (optional)"
                                      />
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updated = (profile.client_logos || []).filter((_: any, i: number) => i !== index)
                                        setProfile({ ...profile, client_logos: updated })
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setProfile({
                                    ...profile,
                                    client_logos: [...(profile.client_logos || []), { name: '', logoUrl: '' }]
                                  })
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Client
                              </Button>
                            </>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {(profile.client_logos || []).length > 0 ? (
                                (profile.client_logos || []).map((client: any, index: number) => (
                                  <div key={index} className="border rounded p-3 text-center">
                                    {client.logoUrl ? (
                                      <img src={client.logoUrl} alt={client.name} className="w-full h-12 object-contain" />
                                    ) : (
                                      <p className="text-sm font-medium">{client.name}</p>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500 col-span-4">No clients added yet</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Testimonials */}
                      <div>
                        <Label>Testimonials</Label>
                        <div className="mt-2 space-y-3">
                          {editMode.experience ? (
                            <>
                              {(profile.testimonials || []).map((testimonial: any, index: number) => (
                                <div key={index} className="border rounded p-3 bg-gray-50">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 space-y-2">
                                      <Textarea
                                        value={testimonial.quote || ''}
                                        onChange={(e) => {
                                          const updated = [...(profile.testimonials || [])]
                                          updated[index] = { ...testimonial, quote: e.target.value }
                                          setProfile({ ...profile, testimonials: updated })
                                        }}
                                        placeholder="Testimonial quote"
                                        rows={3}
                                      />
                                      <div className="grid grid-cols-2 gap-2">
                                        <Input
                                          value={testimonial.author || ''}
                                          onChange={(e) => {
                                            const updated = [...(profile.testimonials || [])]
                                            updated[index] = { ...testimonial, author: e.target.value }
                                            setProfile({ ...profile, testimonials: updated })
                                          }}
                                          placeholder="Author name"
                                        />
                                        <Input
                                          value={testimonial.position || ''}
                                          onChange={(e) => {
                                            const updated = [...(profile.testimonials || [])]
                                            updated[index] = { ...testimonial, position: e.target.value }
                                            setProfile({ ...profile, testimonials: updated })
                                          }}
                                          placeholder="Position"
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <Input
                                          value={testimonial.company || ''}
                                          onChange={(e) => {
                                            const updated = [...(profile.testimonials || [])]
                                            updated[index] = { ...testimonial, company: e.target.value }
                                            setProfile({ ...profile, testimonials: updated })
                                          }}
                                          placeholder="Company"
                                        />
                                        <Input
                                          value={testimonial.event || ''}
                                          onChange={(e) => {
                                            const updated = [...(profile.testimonials || [])]
                                            updated[index] = { ...testimonial, event: e.target.value }
                                            setProfile({ ...profile, testimonials: updated })
                                          }}
                                          placeholder="Event"
                                        />
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updated = (profile.testimonials || []).filter((_: any, i: number) => i !== index)
                                        setProfile({ ...profile, testimonials: updated })
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setProfile({
                                    ...profile,
                                    testimonials: [...(profile.testimonials || []), { quote: '', author: '', position: '', company: '', event: '' }]
                                  })
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Testimonial
                              </Button>
                            </>
                          ) : (
                            <div className="space-y-3">
                              {(profile.testimonials || []).length > 0 ? (
                                (profile.testimonials || []).map((testimonial: any, index: number) => (
                                  <div key={index} className="border-l-4 border-purple-600 pl-4 py-3 bg-gray-50 rounded">
                                    <blockquote className="text-gray-700 italic mb-2">"{testimonial.quote}"</blockquote>
                                    <div className="text-sm text-gray-600">
                                      <p className="font-medium">{testimonial.author}</p>
                                      {testimonial.position && <p>{testimonial.position}</p>}
                                      {testimonial.company && <p>{testimonial.company}</p>}
                                      {testimonial.event && <p className="text-gray-500">Event: {testimonial.event}</p>}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500">No testimonials added yet</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        {editMode.experience ? (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => setEditMode(prev => ({ ...prev, experience: false }))}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleSave('experience')}
                              disabled={isSaving}
                              className="bg-gradient-to-r from-green-600 to-emerald-600"
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => setEditMode(prev => ({ ...prev, experience: true }))}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Experience
                          </Button>
                        )}
                      </div>
                    </TabsContent>

                    {/* Media Section */}
                    <TabsContent value="media" className="mt-0 space-y-6">
                      <div>
                        <Label>Social Media Links</Label>
                        <div className="mt-2 space-y-2">
                          {editMode.media ? (
                            <>
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-gray-500" />
                                <Input
                                  value={profile.website || ''}
                                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                                  placeholder="Website URL"
                                  className="flex-1"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Linkedin className="h-4 w-4 text-gray-500" />
                                <Input
                                  value={profile.linkedin_url || ''}
                                  onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                                  placeholder="LinkedIn Profile URL"
                                  className="flex-1"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Twitter className="h-4 w-4 text-gray-500" />
                                <Input
                                  value={profile.twitter_url || ''}
                                  onChange={(e) => setProfile({ ...profile, twitter_url: e.target.value })}
                                  placeholder="Twitter/X Profile URL"
                                  className="flex-1"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              {profile.website && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Globe className="h-4 w-4 text-gray-500" />
                                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {profile.website}
                                  </a>
                                </div>
                              )}
                              {profile.linkedin_url && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Linkedin className="h-4 w-4 text-gray-500" />
                                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    LinkedIn Profile
                                  </a>
                                </div>
                              )}
                              {profile.twitter_url && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Twitter className="h-4 w-4 text-gray-500" />
                                  <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    Twitter/X Profile
                                  </a>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>Speaking Videos</Label>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {editMode.media ? (
                            <>
                              {profile.videos?.map((video: any, idx: number) => (
                                <Card key={idx} className="overflow-hidden">
                                  <CardContent className="pt-4">
                                    <Input
                                      value={video.title}
                                      onChange={(e) => {
                                        const newVideos = [...(profile.videos || [])];
                                        newVideos[idx] = { ...newVideos[idx], title: e.target.value };
                                        setProfile({ ...profile, videos: newVideos });
                                      }}
                                      placeholder="Video Title"
                                      className="mb-2"
                                    />
                                    <Input
                                      value={video.url || ''}
                                      onChange={(e) => {
                                        const newVideos = [...(profile.videos || [])];
                                        newVideos[idx] = { ...newVideos[idx], url: e.target.value };
                                        setProfile({ ...profile, videos: newVideos });
                                      }}
                                      placeholder="Video URL"
                                      className="mb-2"
                                    />
                                    <Input
                                      value={video.date || ''}
                                      onChange={(e) => {
                                        const newVideos = [...(profile.videos || [])];
                                        newVideos[idx] = { ...newVideos[idx], date: e.target.value };
                                        setProfile({ ...profile, videos: newVideos });
                                      }}
                                      placeholder="Date (e.g., March 2024)"
                                      className="mb-2"
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const newVideos = profile.videos?.filter((_: any, i: number) => i !== idx);
                                        setProfile({ ...profile, videos: newVideos });
                                      }}
                                      className="w-full"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Remove Video
                                    </Button>
                                  </CardContent>
                                </Card>
                              ))}
                              <Card className="overflow-hidden border-2 border-dashed">
                                <CardContent className="pt-4">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setProfile({ 
                                        ...profile, 
                                        videos: [...(profile.videos || []), { title: '', url: '', date: '' }] 
                                      });
                                    }}
                                    className="w-full h-full min-h-[150px]"
                                  >
                                    <Plus className="h-6 w-6 mr-2" />
                                    Add Video
                                  </Button>
                                </CardContent>
                              </Card>
                            </>
                          ) : (
                            profile.videos?.map((video: any, idx: number) => (
                              <Card key={idx} className="overflow-hidden">
                                <div className="aspect-video bg-gray-100 relative">
                                  <Video className="h-12 w-12 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <CardContent className="pt-4">
                                  <h4 className="font-medium">{video.title}</h4>
                                  <p className="text-sm text-gray-500">{video.date}</p>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        {editMode.media ? (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditMode(prev => ({ ...prev, media: false }))}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => handleSave('media')}
                              disabled={isSaving}
                              className="bg-gradient-to-r from-green-600 to-emerald-600"
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button 
                            onClick={() => setEditMode(prev => ({ ...prev, media: true }))}
                            variant="outline"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Media
                          </Button>
                        )}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Internal Info Tab */}
          <TabsContent value="internal" className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      Internal Information
                    </CardTitle>
                    <CardDescription>Private information for operational use only</CardDescription>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                    <Lock className="h-3 w-3 mr-1" />
                    Internal Only
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={activeInternalSection} onValueChange={setActiveInternalSection}>
                  <TabsList className="w-full justify-start rounded-none border-b h-12 p-0 bg-transparent">
                    <TabsTrigger value="contact" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                      <Contact className="h-4 w-4 mr-2" />
                      Contact
                    </TabsTrigger>
                    <TabsTrigger value="logistics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                      <Plane className="h-4 w-4 mr-2" />
                      Logistics
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Financial
                    </TabsTrigger>
                    <TabsTrigger value="health" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                      <Heart className="h-4 w-4 mr-2" />
                      Health & Safety
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-6">
                    {/* Contact Details Section */}
                    <TabsContent value="contact" className="mt-0 space-y-6">
                      <Alert className="border-blue-200 bg-blue-50">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          This information is private and only visible to internal staff for operational purposes.
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="email">Primary Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profile.email || ''}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            disabled={!editMode.contact}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Primary Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={profile.phone || ''}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            disabled={!editMode.contact}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="emergency_contact">Emergency Contact</Label>
                        <Textarea
                          id="emergency_contact"
                          rows={3}
                          value={profile.emergency_contact || ''}
                          onChange={(e) => setProfile({ ...profile, emergency_contact: e.target.value })}
                          disabled={!editMode.contact}
                          className="mt-2"
                          placeholder="Name, relationship, phone number, email..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="assistant_contact">Assistant/Manager Contact</Label>
                        <Textarea
                          id="assistant_contact"
                          rows={2}
                          value={profile.assistant_contact || ''}
                          onChange={(e) => setProfile({ ...profile, assistant_contact: e.target.value })}
                          disabled={!editMode.contact}
                          className="mt-2"
                          placeholder="Name, email, phone..."
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        {editMode.contact ? (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditMode(prev => ({ ...prev, contact: false }))}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => handleSave('contact')}
                              disabled={isSaving}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600"
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button 
                            onClick={() => setEditMode(prev => ({ ...prev, contact: true }))}
                            variant="outline"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Contact Info
                          </Button>
                        )}
                      </div>
                    </TabsContent>

                    {/* Logistics Section */}
                    <TabsContent value="logistics" className="mt-0 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="preferred_airport">Preferred Airport</Label>
                          <Input
                            id="preferred_airport"
                            value={profile.preferred_airport || ''}
                            onChange={(e) => setProfile({ ...profile, preferred_airport: e.target.value })}
                            disabled={!editMode.logistics}
                            className="mt-2"
                            placeholder="e.g., SFO - San Francisco International"
                          />
                        </div>

                        <div>
                          <Label htmlFor="alternate_airports">Alternate Airports</Label>
                          <Input
                            id="alternate_airports"
                            value={profile.alternate_airports || ''}
                            onChange={(e) => setProfile({ ...profile, alternate_airports: e.target.value })}
                            disabled={!editMode.logistics}
                            className="mt-2"
                            placeholder="e.g., OAK, SJC"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="travel_preferences">Travel Preferences</Label>
                        <Textarea
                          id="travel_preferences"
                          rows={3}
                          value={profile.travel_preferences || ''}
                          onChange={(e) => setProfile({ ...profile, travel_preferences: e.target.value })}
                          disabled={!editMode.logistics}
                          className="mt-2"
                          placeholder="Flight class preferences, airline preferences, seat preferences, TSA PreCheck/Global Entry..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="hotel_preferences">Hotel Preferences</Label>
                        <Textarea
                          id="hotel_preferences"
                          rows={3}
                          value={profile.hotel_preferences || ''}
                          onChange={(e) => setProfile({ ...profile, hotel_preferences: e.target.value })}
                          disabled={!editMode.logistics}
                          className="mt-2"
                          placeholder="Hotel chain preferences, room type, floor preferences..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="ground_transport">Ground Transportation Preferences</Label>
                        <Textarea
                          id="ground_transport"
                          rows={2}
                          value={profile.ground_transport || ''}
                          onChange={(e) => setProfile({ ...profile, ground_transport: e.target.value })}
                          disabled={!editMode.logistics}
                          className="mt-2"
                          placeholder="Rental car, rideshare, car service preferences..."
                        />
                      </div>

                      <Separator className="my-4" />

                      <div>
                        <Label htmlFor="av_requirements">A/V & Tech Requirements</Label>
                        <Textarea
                          id="av_requirements"
                          rows={4}
                          value={profile.av_requirements || ''}
                          onChange={(e) => setProfile({ ...profile, av_requirements: e.target.value })}
                          disabled={!editMode.logistics}
                          className="mt-2"
                          placeholder="Microphone type (lapel, handheld, headset), clicker/presentation remote, confidence monitor, lighting preferences..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="stage_requirements">Stage Setup Requirements</Label>
                        <Textarea
                          id="stage_requirements"
                          rows={3}
                          value={profile.stage_requirements || ''}
                          onChange={(e) => setProfile({ ...profile, stage_requirements: e.target.value })}
                          disabled={!editMode.logistics}
                          className="mt-2"
                          placeholder="Podium preference, stool/chair needs, table for materials, water placement..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="technical_requirements">Technical & Presentation Requirements</Label>
                        <Textarea
                          id="technical_requirements"
                          rows={3}
                          value={profile.technical_requirements || ''}
                          onChange={(e) => setProfile({ ...profile, technical_requirements: e.target.value })}
                          disabled={!editMode.logistics}
                          className="mt-2"
                          placeholder="Screen resolution, adapter needs, internet requirements, presentation software..."
                        />
                      </div>

                      <Separator className="my-4" />

                      <div>
                        <Label>Fee Structure by Event Type</Label>
                        <div className="mt-2 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="fee_keynote" className="text-sm">Keynote Speaking Fee</Label>
                              <Input
                                id="fee_keynote"
                                value={profile.fee_keynote || ''}
                                onChange={(e) => setProfile({ ...profile, fee_keynote: e.target.value })}
                                disabled={!editMode.logistics}
                                className="mt-1"
                                placeholder="e.g., $15,000 - $25,000"
                              />
                            </div>
                            <div>
                              <Label htmlFor="fee_workshop" className="text-sm">Workshop/Training Fee</Label>
                              <Input
                                id="fee_workshop"
                                value={profile.fee_workshop || ''}
                                onChange={(e) => setProfile({ ...profile, fee_workshop: e.target.value })}
                                disabled={!editMode.logistics}
                                className="mt-1"
                                placeholder="e.g., $10,000 - $15,000"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="fee_panel" className="text-sm">Panel Discussion Fee</Label>
                              <Input
                                id="fee_panel"
                                value={profile.fee_panel || ''}
                                onChange={(e) => setProfile({ ...profile, fee_panel: e.target.value })}
                                disabled={!editMode.logistics}
                                className="mt-1"
                                placeholder="e.g., $5,000 - $10,000"
                              />
                            </div>
                            <div>
                              <Label htmlFor="fee_virtual" className="text-sm">Virtual Presentation Fee</Label>
                              <Input
                                id="fee_virtual"
                                value={profile.fee_virtual || ''}
                                onChange={(e) => setProfile({ ...profile, fee_virtual: e.target.value })}
                                disabled={!editMode.logistics}
                                className="mt-1"
                                placeholder="e.g., $5,000 - $10,000"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Fee Adjustments by Location</Label>
                        <div className="mt-2 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="fee_local" className="text-sm">Local (within 100 miles)</Label>
                              <Input
                                id="fee_local"
                                value={profile.fee_local || ''}
                                onChange={(e) => setProfile({ ...profile, fee_local: e.target.value })}
                                disabled={!editMode.logistics}
                                className="mt-1"
                                placeholder="e.g., Standard rate"
                              />
                            </div>
                            <div>
                              <Label htmlFor="fee_domestic" className="text-sm">Domestic (US)</Label>
                              <Input
                                id="fee_domestic"
                                value={profile.fee_domestic || ''}
                                onChange={(e) => setProfile({ ...profile, fee_domestic: e.target.value })}
                                disabled={!editMode.logistics}
                                className="mt-1"
                                placeholder="e.g., +$2,500 travel fee"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="fee_international" className="text-sm">International</Label>
                              <Input
                                id="fee_international"
                                value={profile.fee_international || ''}
                                onChange={(e) => setProfile({ ...profile, fee_international: e.target.value })}
                                disabled={!editMode.logistics}
                                className="mt-1"
                                placeholder="e.g., +$5,000 travel fee"
                              />
                            </div>
                            <div>
                              <Label htmlFor="fee_nonprofit" className="text-sm">Non-Profit Discount</Label>
                              <Input
                                id="fee_nonprofit"
                                value={profile.fee_nonprofit || ''}
                                onChange={(e) => setProfile({ ...profile, fee_nonprofit: e.target.value })}
                                disabled={!editMode.logistics}
                                className="mt-1"
                                placeholder="e.g., 20% discount"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="booking_requirements">Booking Requirements</Label>
                        <Textarea
                          id="booking_requirements"
                          rows={3}
                          value={profile.booking_requirements || ''}
                          onChange={(e) => setProfile({ ...profile, booking_requirements: e.target.value })}
                          disabled={!editMode.logistics}
                          className="mt-2"
                          placeholder="Minimum notice period, contract requirements, cancellation policy..."
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        {editMode.logistics ? (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditMode(prev => ({ ...prev, logistics: false }))}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => handleSave('logistics')}
                              disabled={isSaving}
                              className="bg-gradient-to-r from-green-600 to-emerald-600"
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button 
                            onClick={() => setEditMode(prev => ({ ...prev, logistics: true }))}
                            variant="outline"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Logistics
                          </Button>
                        )}
                      </div>
                    </TabsContent>

                    {/* Financial Section */}
                    <TabsContent value="financial" className="mt-0 space-y-6">
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          Financial information is highly confidential and encrypted.
                        </AlertDescription>
                      </Alert>

                      <div>
                        <Label htmlFor="speaking_fee_range">Speaking Fee Range</Label>
                        <Select
                          value={profile.speaking_fee_range || ''}
                          onValueChange={(value) => setProfile({ ...profile, speaking_fee_range: value })}
                          disabled={!editMode.financial}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select fee range" />
                          </SelectTrigger>
                          <SelectContent>
                            {FEE_RANGES.map((range) => (
                              <SelectItem key={range} value={range}>
                                {range}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="payment_details">Payment Details</Label>
                        <Textarea
                          id="payment_details"
                          rows={3}
                          value={profile.payment_details || ''}
                          onChange={(e) => setProfile({ ...profile, payment_details: e.target.value })}
                          disabled={!editMode.financial}
                          className="mt-2"
                          placeholder="Preferred payment method, billing address, tax information..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="w9_status">W9/Tax Document Status</Label>
                        <Input
                          id="w9_status"
                          value={profile.w9_status || ''}
                          onChange={(e) => setProfile({ ...profile, w9_status: e.target.value })}
                          disabled={!editMode.financial}
                          className="mt-2"
                          placeholder="On file, needed, updated date..."
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        {editMode.financial ? (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => setEditMode(prev => ({ ...prev, financial: false }))}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleSave('financial')}
                              disabled={isSaving}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600"
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => setEditMode(prev => ({ ...prev, financial: true }))}
                            variant="outline"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Financial Info
                          </Button>
                        )}
                      </div>
                    </TabsContent>

                    {/* Health & Safety Section */}
                    <TabsContent value="health" className="mt-0 space-y-6">
                      <div>
                        <Label htmlFor="dietary_restrictions">Dietary Restrictions/Allergies</Label>
                        <Textarea
                          id="dietary_restrictions"
                          rows={3}
                          value={profile.dietary_restrictions || ''}
                          onChange={(e) => setProfile({ ...profile, dietary_restrictions: e.target.value })}
                          disabled={!editMode.health}
                          className="mt-2"
                          placeholder="Food allergies, dietary preferences, restrictions..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="medical_notes">Medical Notes</Label>
                        <Textarea
                          id="medical_notes"
                          rows={3}
                          value={profile.medical_notes || ''}
                          onChange={(e) => setProfile({ ...profile, medical_notes: e.target.value })}
                          disabled={!editMode.health}
                          className="mt-2"
                          placeholder="Any medical conditions or needs we should be aware of..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="accessibility_needs">Accessibility Requirements</Label>
                        <Textarea
                          id="accessibility_needs"
                          rows={3}
                          value={profile.accessibility_needs || ''}
                          onChange={(e) => setProfile({ ...profile, accessibility_needs: e.target.value })}
                          disabled={!editMode.health}
                          className="mt-2"
                          placeholder="Mobility assistance, visual/hearing accommodations..."
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        {editMode.health ? (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => setEditMode(prev => ({ ...prev, health: false }))}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleSave('health')}
                              disabled={isSaving}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600"
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => setEditMode(prev => ({ ...prev, health: true }))}
                            variant="outline"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Health & Safety
                          </Button>
                        )}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}