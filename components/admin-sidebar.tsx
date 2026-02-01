"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Users,
  DollarSign,
  CheckSquare,
  FileText,
  Database,
  Upload,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  Activity,
  Menu,
  X,
  Heart,
  Mail,
  TrendingUp,
  Wallet,
  FileSignature,
  Send,
  MessageSquare,
  ShoppingCart,
  Briefcase,
  Globe,
  Megaphone,
  Building2,
  Presentation,
  PenTool,
  Bot,
  Sparkles,
  Archive,
  FileEdit
} from "lucide-react"

interface AdminSidebarProps {
  className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(['sales', 'operations', 'website', 'marketing', 'tools'])
  const pathname = usePathname()
  const router = useRouter()

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("adminLoggedIn")
      localStorage.removeItem("adminSessionToken")
      localStorage.removeItem("adminUser")
      router.push("/admin")
    }
  }

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(s => s !== sectionName)
        : [...prev, sectionName]
    )
  }

  const navigationSections = [
    {
      title: "Master Panel",
      href: "/admin/manage",
      icon: Settings,
      description: "Operations Hub",
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      standalone: true
    },
    {
      title: "Sales",
      icon: ShoppingCart,
      sectionKey: "sales",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      items: [
        {
          title: "CRM",
          href: "/admin/crm",
          icon: BarChart3,
          description: "Active Deals",
          color: "text-blue-600",
          bgColor: "bg-blue-50"
        }
      ]
    },
    {
      title: "Operations",
      icon: Briefcase,
      sectionKey: "operations",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      items: [
        {
          title: "Project Management",
          href: "/admin/projects",
          icon: CheckSquare,
          description: "Live Projects",
          color: "text-orange-600",
          bgColor: "bg-orange-50"
        },
        {
          title: "Finances",
          href: "/admin/finances",
          icon: Wallet,
          description: "Revenue & Commissions",
          color: "text-emerald-600",
          bgColor: "bg-emerald-50"
        }
      ]
    },
    {
      title: "Website",
      icon: Globe,
      sectionKey: "website",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      items: [
        {
          title: "Page Editor",
          href: "/admin/website-editor",
          icon: FileEdit,
          description: "Edit Page Content",
          color: "text-cyan-600",
          bgColor: "bg-cyan-50"
        },
        {
          title: "Case Studies",
          href: "/admin/case-studies",
          icon: Building2,
          description: "Testimonials & Success Stories",
          color: "text-amber-600",
          bgColor: "bg-amber-50"
        },
        {
          title: "Speaker Management",
          href: "/admin/speakers",
          icon: Users,
          description: "Profiles & Content",
          color: "text-green-600",
          bgColor: "bg-green-50"
        },
        {
          title: "Analytics",
          href: "/admin/analytics",
          icon: TrendingUp,
          description: "Website Insights",
          color: "text-purple-600",
          bgColor: "bg-purple-50"
        },
        {
          title: "Workshops",
          href: "/admin/workshops",
          icon: Presentation,
          description: "Workshop Management",
          color: "text-amber-600",
          bgColor: "bg-amber-50"
        }
      ]
    },
    {
      title: "Marketing",
      icon: Megaphone,
      sectionKey: "marketing",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      items: [
        {
          title: "Newsletter",
          href: "/admin/newsletter",
          icon: Mail,
          description: "Subscriber Management",
          color: "text-pink-600",
          bgColor: "bg-pink-50"
        },
        {
          title: "Blog",
          href: "/admin/blog",
          icon: FileText,
          description: "Content & Outrank",
          color: "text-purple-600",
          bgColor: "bg-purple-50"
        },
        {
          title: "Vendor Directory",
          href: "/admin/directory",
          icon: Building2,
          description: "Vendor Management",
          color: "text-blue-600",
          bgColor: "bg-blue-50"
        },
        {
          title: "Landing Resources",
          href: "/admin/landing-resources",
          icon: Send,
          description: "Email Resources",
          color: "text-cyan-600",
          bgColor: "bg-cyan-50"
        },
        {
          title: "WhatsApp Group",
          href: "/admin/whatsapp-applications",
          icon: MessageSquare,
          description: "Event Pro Community",
          color: "text-green-600",
          bgColor: "bg-green-50"
        }
      ]
    },
        {
      title: "System",
      icon: Settings,
      sectionKey: "system",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      items: [
        {
          title: "Database",
          href: "/debug-neon",
          icon: Database,
          description: "System Debug",
          color: "text-red-600",
          bgColor: "bg-red-50"
        },
        {
          title: "Invoicing (BETA)",
          href: "/admin/invoicing",
          icon: DollarSign,
          description: "Invoice Management",
          color: "text-green-600",
          bgColor: "bg-green-50"
        }
      ]
    },
    {
      title: "Unfinished / Sunsetted",
      icon: Archive,
      sectionKey: "sunsetted",
      color: "text-slate-500",
      bgColor: "bg-slate-100",
      items: [
        {
          title: "Client Portal",
          href: "/admin/clients",
          icon: Users,
          description: "Client Access",
          color: "text-cyan-600",
          bgColor: "bg-cyan-50"
        },
        {
          title: "Leads",
          href: "/admin/leads",
          icon: Users,
          description: "SQL Leads",
          color: "text-purple-600",
          bgColor: "bg-purple-50"
        },
        {
          title: "Proposals",
          href: "/admin/proposals",
          icon: FileText,
          description: "Client Proposals",
          color: "text-indigo-600",
          bgColor: "bg-indigo-50"
        },
        {
          title: "Firm Offers",
          href: "/admin/firm-offers",
          icon: FileSignature,
          description: "Offer Sheets",
          color: "text-amber-600",
          bgColor: "bg-amber-50"
        },
        {
          title: "Contracts Hub",
          href: "/admin/contracts-hub",
          icon: FileSignature,
          description: "Contract Management",
          color: "text-emerald-600",
          bgColor: "bg-emerald-50"
        },
        {
          title: "Tasks & Follow-ups",
          href: "/admin/tasks",
          icon: CheckSquare,
          description: "Action Items",
          color: "text-green-600",
          bgColor: "bg-green-50"
        },
        {
          title: "Activity Log",
          href: "/admin/activity",
          icon: Activity,
          description: "Speaker Updates",
          color: "text-indigo-600",
          bgColor: "bg-indigo-50"
        },
        {
          title: "SEO Dashboard",
          href: "/admin/seo-analysis",
          icon: TrendingUp,
          description: "Semrush Analytics",
          color: "text-pink-600",
          bgColor: "bg-pink-50"
        },
        {
          title: "Content Studio",
          href: "/admin/tools/content-studio",
          icon: PenTool,
          description: "AI Blog Writer",
          color: "text-violet-600",
          bgColor: "bg-violet-50"
        },
        {
          title: "Speaker Chat",
          href: "/admin/tools/speaker-chat",
          icon: Bot,
          description: "AI Speaker Assistant",
          color: "text-emerald-600",
          bgColor: "bg-emerald-50"
        }
      ]
    }
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-900 text-white hover:bg-slate-800 shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[70]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "flex flex-col h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl transition-all duration-300 ease-in-out",
        // Desktop behavior
        "lg:relative lg:translate-x-0",
        collapsed ? "lg:w-16" : "lg:w-72",
        // Mobile behavior
        "fixed top-0 left-0 z-[80] w-72",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        className
      )}>
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10" />
          <div className="relative flex items-center justify-between p-6 border-b border-slate-700/50">
            {!collapsed && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Speak About AI</h2>
                  <p className="text-sm text-slate-400 font-medium">Admin Dashboard</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto">
              {/* Mobile Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileOpen(false)}
                className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
              >
                <X className="h-4 w-4" />
              </Button>
              {/* Desktop Collapse Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:block text-slate-400 hover:text-white hover:bg-slate-700/50 border-slate-600 transition-all duration-200"
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navigationSections.map((section) => {
          // Standalone items (like Master Panel)
          if (section.standalone) {
            const isActive = pathname === section.href
            return (
              <Link key={section.href} href={section.href}>
                <div
                  className={cn(
                    "group relative overflow-hidden rounded-xl transition-all duration-200 ease-in-out",
                    collapsed ? "p-3" : "p-4",
                    isActive 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg transform scale-105" 
                      : "hover:bg-slate-700/50 hover:transform hover:scale-102"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl" />
                  )}
                  
                  <div className="relative flex items-center">
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-white/20 text-white shadow-md" 
                        : `${section.bgColor} ${section.color} group-hover:scale-110`
                    )}>
                      <section.icon className="h-5 w-5" />
                    </div>
                    
                    {!collapsed && (
                      <div className="ml-4 flex-1 min-w-0">
                        <div className={cn(
                          "text-sm font-semibold transition-colors duration-200",
                          isActive ? "text-white" : "text-slate-200 group-hover:text-white"
                        )}>
                          {section.title}
                        </div>
                        <div className={cn(
                          "text-xs mt-0.5 transition-colors duration-200",
                          isActive ? "text-blue-100" : "text-slate-400 group-hover:text-slate-300"
                        )}>
                          {section.description}
                        </div>
                      </div>
                    )}
                    
                    {isActive && !collapsed && (
                      <div className="w-2 h-2 bg-white rounded-full shadow-lg animate-pulse" />
                    )}
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out" />
                </div>
              </Link>
            )
          }

          // Sections with items
          const isExpanded = expandedSections.includes(section.sectionKey!)
          const hasActiveChild = section.items?.some(item => pathname === item.href)
          
          return (
            <div key={section.sectionKey}>
              {/* Section Header */}
              <div
                onClick={() => !collapsed && toggleSection(section.sectionKey!)}
                className={cn(
                  "group relative overflow-hidden rounded-xl transition-all duration-200 ease-in-out cursor-pointer",
                  collapsed ? "p-3" : "p-3 mb-1",
                  hasActiveChild
                    ? "bg-slate-700/30"
                    : "hover:bg-slate-700/20"
                )}
              >
                <div className="relative flex items-center">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                    `${section.bgColor} ${section.color}`
                  )}>
                    <section.icon className="h-4 w-4" />
                  </div>
                  
                  {!collapsed && (
                    <>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-200">
                          {section.title}
                        </div>
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-slate-400 transition-transform duration-200",
                        isExpanded ? "transform rotate-180" : ""
                      )} />
                    </>
                  )}
                </div>
              </div>

              {/* Section Items */}
              {!collapsed && isExpanded && section.items && (
                <div className="ml-4 space-y-1 mt-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href === "/admin/contracts-hub" && pathname.startsWith("/admin/contracts-hub")) ||
                      (item.href === "/admin/invoicing" && pathname.startsWith("/admin/invoicing"))
                    
                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          className={cn(
                            "group relative overflow-hidden rounded-lg transition-all duration-200 ease-in-out p-3",
                            isActive 
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 shadow-md" 
                              : "hover:bg-slate-700/40"
                          )}
                        >
                          <div className="relative flex items-center">
                            <div className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200",
                              isActive 
                                ? "bg-white/20 text-white" 
                                : `${item.bgColor} ${item.color} group-hover:scale-110`
                            )}>
                              <item.icon className="h-4 w-4" />
                            </div>
                            
                            <div className="ml-3 flex-1 min-w-0">
                              <div className={cn(
                                "text-xs font-semibold transition-colors duration-200",
                                isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                              )}>
                                {item.title}
                              </div>
                              {item.description && (
                                <div className={cn(
                                  "text-xs mt-0.5 transition-colors duration-200",
                                  isActive ? "text-blue-100" : "text-slate-500 group-hover:text-slate-400"
                                )}>
                                  {item.description}
                                </div>
                              )}
                            </div>
                            
                            {isActive && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full shadow-lg animate-pulse" />
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "group w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-all duration-200 rounded-lg",
            collapsed ? "px-3" : "px-4 py-3"
          )}
          title={collapsed ? "Logout" : ""}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-all duration-200">
            <LogOut className="h-4 w-4" />
          </div>
          {!collapsed && (
            <span className="ml-3 font-medium">Logout</span>
          )}
        </Button>
      </div>
      </div>
    </>
  )
}