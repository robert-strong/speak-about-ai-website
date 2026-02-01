"use client"

import { useState } from "react"
import { SpeakerDashboardLayout } from "@/components/speaker-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Download,
  ExternalLink,
  BookOpen,
  Video,
  Mic,
  Image,
  PresentationIcon,
  FileDown,
  Search,
  Filter,
  ChevronRight,
  Clock,
  Star,
  Users,
  Award,
  Briefcase,
  Camera,
  Megaphone,
  Lightbulb,
  Target,
  Zap,
  Calendar
} from "lucide-react"
import Link from "next/link"

interface Resource {
  id: number
  title: string
  description: string
  category: string
  type: string
  url?: string
  downloadUrl?: string
  icon: any
  featured?: boolean
  updated?: string
  fileSize?: string
  duration?: string
}

export default function SpeakerResources() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const resources: Resource[] = [
    // Speaking Materials
    {
      id: 1,
      title: "Professional Bio Template",
      description: "Customizable speaker bio template for various event types and audiences",
      category: "templates",
      type: "document",
      downloadUrl: "#",
      icon: FileText,
      featured: true,
      updated: "2 days ago",
      fileSize: "245 KB"
    },
    {
      id: 2,
      title: "Speaker One-Sheet Template",
      description: "Professional one-page speaker sheet with bio, topics, and testimonials",
      category: "templates",
      type: "document",
      downloadUrl: "#",
      icon: FileDown,
      featured: true,
      updated: "1 week ago",
      fileSize: "1.2 MB"
    },
    {
      id: 3,
      title: "High-Resolution Headshots",
      description: "Download your professional headshots in various formats and sizes",
      category: "media",
      type: "image",
      downloadUrl: "#",
      icon: Camera,
      updated: "1 month ago",
      fileSize: "15 MB"
    },
    {
      id: 4,
      title: "Speaker Introduction Scripts",
      description: "Pre-written introduction scripts for different speaking formats",
      category: "templates",
      type: "document",
      downloadUrl: "#",
      icon: Mic,
      updated: "2 weeks ago",
      fileSize: "125 KB"
    },
    
    // Training & Guides
    {
      id: 5,
      title: "Virtual Speaking Best Practices",
      description: "Complete guide to delivering engaging virtual presentations",
      category: "guides",
      type: "guide",
      url: "#",
      icon: Video,
      featured: true,
      updated: "1 week ago"
    },
    {
      id: 6,
      title: "Stage Presence Masterclass",
      description: "Video series on commanding the stage and engaging audiences",
      category: "training",
      type: "video",
      url: "#",
      icon: Award,
      duration: "2h 15m"
    },
    {
      id: 7,
      title: "Storytelling Techniques",
      description: "Learn how to craft and deliver compelling stories in your presentations",
      category: "guides",
      type: "guide",
      url: "#",
      icon: BookOpen,
      updated: "3 weeks ago"
    },
    {
      id: 8,
      title: "Handling Q&A Sessions",
      description: "Strategies for managing audience questions effectively",
      category: "guides",
      type: "guide",
      url: "#",
      icon: Users,
      updated: "1 month ago"
    },
    
    // Marketing Materials
    {
      id: 9,
      title: "Social Media Templates",
      description: "Ready-to-use social media posts for promoting your speaking engagements",
      category: "marketing",
      type: "template",
      downloadUrl: "#",
      icon: Megaphone,
      featured: true,
      updated: "5 days ago",
      fileSize: "3.5 MB"
    },
    {
      id: 10,
      title: "Email Signature Templates",
      description: "Professional email signatures highlighting your speaker brand",
      category: "marketing",
      type: "template",
      downloadUrl: "#",
      icon: FileText,
      updated: "2 weeks ago",
      fileSize: "85 KB"
    },
    {
      id: 11,
      title: "Speaker Reel Guidelines",
      description: "How to create an impactful speaker demo reel",
      category: "guides",
      type: "guide",
      url: "#",
      icon: Video,
      updated: "1 month ago"
    },
    
    // Business Resources
    {
      id: 12,
      title: "Speaking Fee Calculator",
      description: "Interactive tool to help determine your speaking fees",
      category: "tools",
      type: "tool",
      url: "#",
      icon: Target,
      featured: true
    },
    {
      id: 13,
      title: "Contract Templates",
      description: "Standard speaking engagement contract templates",
      category: "templates",
      type: "document",
      downloadUrl: "#",
      icon: Briefcase,
      updated: "2 weeks ago",
      fileSize: "450 KB"
    },
    {
      id: 14,
      title: "Invoice Templates",
      description: "Professional invoice templates for speaking engagements",
      category: "templates",
      type: "document",
      downloadUrl: "#",
      icon: FileText,
      updated: "3 weeks ago",
      fileSize: "125 KB"
    },
    {
      id: 15,
      title: "Technical Rider Template",
      description: "Document your A/V and technical requirements",
      category: "templates",
      type: "document",
      downloadUrl: "#",
      icon: Zap,
      updated: "1 month ago",
      fileSize: "95 KB"
    }
  ]

  const categories = [
    { value: "all", label: "All Resources", count: resources.length },
    { value: "templates", label: "Templates", count: resources.filter(r => r.category === "templates").length },
    { value: "guides", label: "Guides", count: resources.filter(r => r.category === "guides").length },
    { value: "training", label: "Training", count: resources.filter(r => r.category === "training").length },
    { value: "marketing", label: "Marketing", count: resources.filter(r => r.category === "marketing").length },
    { value: "media", label: "Media", count: resources.filter(r => r.category === "media").length },
    { value: "tools", label: "Tools", count: resources.filter(r => r.category === "tools").length }
  ]

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const featuredResources = resources.filter(r => r.featured)

  const getTypeColor = (type: string) => {
    switch (type) {
      case "document":
        return "bg-blue-100 text-blue-700"
      case "video":
        return "bg-purple-100 text-purple-700"
      case "guide":
        return "bg-green-100 text-green-700"
      case "template":
        return "bg-orange-100 text-orange-700"
      case "tool":
        return "bg-indigo-100 text-indigo-700"
      case "image":
        return "bg-pink-100 text-pink-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <SpeakerDashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Speaker Resources</h1>
          <p className="text-gray-600 mt-1">Tools, templates, and guides to enhance your speaking career</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Resources</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{resources.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Templates</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {resources.filter(r => r.category === "templates").length}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <FileDown className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Training Materials</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {resources.filter(r => r.category === "training" || r.category === "guides").length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Featured</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{featuredResources.length}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Resources */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Featured Resources
            </CardTitle>
            <CardDescription>Most popular and essential resources for speakers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredResources.map((resource) => {
                const Icon = resource.icon
                return (
                  <div key={resource.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="h-5 w-5 text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{resource.title}</h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{resource.description}</p>
                        <div className="flex items-center gap-2">
                          {resource.downloadUrl ? (
                            <Button size="sm" variant="outline" className="h-7">
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="h-7">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {resource.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Resources Section */}
        <div>
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {categories.map(category => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className="whitespace-nowrap"
                >
                  {category.label}
                  <Badge variant="secondary" className="ml-2 bg-white/20">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((resource) => {
              const Icon = resource.icon
              return (
                <Card key={resource.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <Icon className="h-6 w-6 text-gray-700" />
                      </div>
                      <Badge className={getTypeColor(resource.type)} variant="secondary">
                        {resource.type}
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">{resource.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{resource.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      {resource.updated && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated {resource.updated}
                        </div>
                      )}
                      {resource.fileSize && (
                        <span>{resource.fileSize}</span>
                      )}
                      {resource.duration && (
                        <span>{resource.duration}</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {resource.downloadUrl ? (
                        <Button size="sm" className="flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      ) : (
                        <Button size="sm" className="flex-1">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Access
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredResources.length === 0 && (
            <Card className="border-0 shadow-md">
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources found</h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Conference Directory CTA */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 overflow-hidden relative">
          <div className="absolute top-0 right-0 opacity-10">
            <Calendar className="h-64 w-64" />
          </div>
          <CardContent className="p-8 relative z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Resources for Event Professionals
                </h3>
              </div>
              <p className="text-white/90 text-lg mb-6 leading-relaxed">
                Planning an event and looking for AI speakers? Browse our comprehensive event industry conference directory to discover speaking opportunities, track call for proposals (CFPs), and connect with conference organizers worldwide.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/conference-directory">
                  <Button
                    size="lg"
                    className="bg-white text-purple-700 hover:bg-gray-100 font-semibold shadow-lg"
                  >
                    Browse Conference Directory
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/conference-directory/conferences">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 font-semibold"
                  >
                    View All Conferences
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Something Else?</h3>
                <p className="text-gray-600 mb-4">
                  Can't find what you're looking for? Contact our support team for assistance.
                </p>
                <Button variant="default">
                  Contact Support
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              <div className="hidden md:block">
                <Lightbulb className="h-24 w-24 text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SpeakerDashboardLayout>
  )
}