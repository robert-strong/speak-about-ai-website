"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  User,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Search,
  MessageSquare,
  TrendingUp,
  Award,
  FileText,
  Briefcase,
  Star,
  Globe,
  Video,
  BarChart3,
  Clock,
  AlertTriangle
} from "lucide-react"

// Session timeout configuration (30 minutes)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000
const WARNING_BEFORE_TIMEOUT_MS = 5 * 60 * 1000
const LAST_ACTIVITY_KEY = "speakerLastActivity"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function SpeakerDashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [speakerName, setSpeakerName] = useState("")
  const [speakerEmail, setSpeakerEmail] = useState("")
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [stats, setStats] = useState({
    profileViews: 0,
    events: 0
  })
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const timeoutCheckRef = useRef<NodeJS.Timeout | null>(null)

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
    setShowTimeoutWarning(false)
  }, [])

  // Check session timeout
  const checkSessionTimeout = useCallback(() => {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY)
    const token = localStorage.getItem("speakerToken")

    if (!token) return

    if (!lastActivity) {
      updateActivity()
      return
    }

    const elapsed = Date.now() - parseInt(lastActivity)
    const remaining = SESSION_TIMEOUT_MS - elapsed

    if (remaining <= 0) {
      // Session expired - log out
      handleLogout()
    } else if (remaining <= WARNING_BEFORE_TIMEOUT_MS) {
      // Show warning
      setShowTimeoutWarning(true)
      setTimeRemaining(Math.ceil(remaining / 1000 / 60)) // minutes
    }
  }, [])

  // Extend session
  const extendSession = useCallback(() => {
    updateActivity()
    setShowTimeoutWarning(false)
  }, [updateActivity])

  useEffect(() => {
    const token = localStorage.getItem("speakerToken")
    const name = localStorage.getItem("speakerName")
    const email = localStorage.getItem("speakerEmail")

    if (!token) {
      router.push("/portal/speaker")
      return
    }

    // Initialize activity timestamp if not set
    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      updateActivity()
    }

    setSpeakerName(name || "Speaker")
    setSpeakerEmail(email || "")

    // Fetch profile data for completion percentage
    fetchProfileData(token)
    // Fetch analytics for stats
    fetchAnalytics(token)

    // Set up activity listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true })
    })

    // Check session timeout every minute
    timeoutCheckRef.current = setInterval(checkSessionTimeout, 60 * 1000)
    checkSessionTimeout() // Check immediately

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity)
      })
      if (timeoutCheckRef.current) {
        clearInterval(timeoutCheckRef.current)
      }
    }
  }, [router, updateActivity, checkSessionTimeout])
  
  // Refresh stats when pathname changes
  useEffect(() => {
    const token = localStorage.getItem("speakerToken")
    if (token) {
      fetchAnalytics(token)
    }
  }, [pathname])
  
  const fetchProfileData = async (token: string) => {
    try {
      const response = await fetch("/api/speakers/profile", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.profile) {
          // Calculate profile completion - must match dashboard calculation
          const profileCompletionItems = [
            !!(data.profile.first_name && data.profile.last_name && data.profile.email),
            !!(data.profile.title && data.profile.company),
            data.profile.speaking_topics?.length > 0,
            data.profile.videos?.length > 0,
            data.profile.publications?.length > 0,
            data.profile.testimonials?.length > 0,
            !!(data.profile.linkedin_url || data.profile.twitter_url),
            !!(data.profile.speaking_fee_range && data.profile.travel_preferences)
          ]
          
          const completedItems = profileCompletionItems.filter(item => item).length
          const totalItems = profileCompletionItems.length
          const completionPercentage = Math.round((completedItems / totalItems) * 100)
          
          setProfileCompletion(completionPercentage)
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }
  
  const fetchAnalytics = async (token: string) => {
    try {
      const response = await fetch("/api/speakers/me/analytics?range=30d", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.analytics) {
          setStats({
            profileViews: data.analytics.profileViews || 0,
            events: 3 // This would come from events API
          })
        }
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    }
  }

  const handleLogout = useCallback(() => {
    localStorage.removeItem("speakerToken")
    localStorage.removeItem("speakerEmail")
    localStorage.removeItem("speakerId")
    localStorage.removeItem("speakerName")
    localStorage.removeItem(LAST_ACTIVITY_KEY)
    if (timeoutCheckRef.current) {
      clearInterval(timeoutCheckRef.current)
    }
    router.push("/portal/speaker")
  }, [router])

  const navigation = [
    {
      name: "Dashboard",
      href: "/speakers/dashboard",
      icon: LayoutDashboard,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      current: pathname === "/speakers/dashboard"
    },
    {
      name: "Profile",
      href: "/speakers/dashboard/profile",
      icon: User,
      color: "text-[#1E68C6]",
      bgColor: "bg-blue-50",
      current: pathname === "/speakers/dashboard/profile"
    },
    {
      name: "Events",
      href: "/speakers/dashboard/events",
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-50",
      current: pathname === "/speakers/dashboard/events"
    },
    {
      name: "Analytics",
      href: "/speakers/dashboard/analytics",
      icon: BarChart3,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      current: pathname === "/speakers/dashboard/analytics"
    },
    {
      name: "Resources",
      href: "/speakers/dashboard/resources",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      current: pathname === "/speakers/dashboard/resources"
    },
    {
      name: "Settings",
      href: "/speakers/dashboard/settings",
      icon: Settings,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      current: pathname === "/speakers/dashboard/settings"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center ml-4 lg:ml-0">
                <Link href="/speakers/dashboard" className="flex items-center">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#1E68C6] to-blue-600 flex items-center justify-center">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <span className="ml-3 text-xl font-bold text-gray-900">Speaker Portal</span>
                </Link>
              </div>
            </div>

            {/* Right side items */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

{/* Profile dropdown */}
              <div className="relative">
                <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1E68C6] to-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {speakerName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">{speakerName}</p>
                    <p className="text-xs text-gray-500">{speakerEmail}</p>
                  </div>
                </button>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 pt-16 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full px-3 py-4 overflow-y-auto">
          {/* User info */}
          <div className="px-3 py-4 mb-4 bg-gradient-to-br from-blue-50 to-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#1E68C6] to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {speakerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{speakerName}</p>
                <p className="text-xs text-gray-500">Speaker Account</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs">
                <p className="text-gray-500">Profile Completion</p>
                <p className="font-semibold text-gray-900">{profileCompletion}%</p>
              </div>
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-[#1E68C6] to-blue-600 h-2 rounded-full" style={{ width: `${profileCompletion}%` }}></div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    item.current
                      ? "bg-gradient-to-r from-blue-50 to-gray-50 text-blue-700 border-l-4 border-[#1E68C6]"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <div className={cn(
                    "mr-3 p-2 rounded-lg",
                    item.current ? item.bgColor : "bg-gray-100 group-hover:bg-gray-200"
                  )}>
                    <Icon className={cn("h-4 w-4", item.current ? item.color : "text-gray-500")} />
                  </div>
                  {item.name}
                  {item.current && (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Quick Stats */}
          <div className="mt-8 px-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700">Profile Views</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.profileViews.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-700">Events</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.events}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 pt-16">
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  )
}