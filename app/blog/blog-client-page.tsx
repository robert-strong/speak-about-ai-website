"use client"

import { useMemo, useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { SearchIcon, Filter, Grid3X3, List, TrendingUp } from "lucide-react"
import { ContentCard } from "@/components/content-card"
import { FeaturedContentHero } from "@/components/featured-content-hero"
import PaginationControls from "@/components/pagination-controls"
import type { ContentItem } from "@/lib/combined-content"

const POSTS_PER_PAGE = 9

interface BlogClientPageProps {
  initialContent: ContentItem[]
}

export default function BlogClientPage({ initialContent }: BlogClientPageProps) {
  const [content, setContent] = useState<ContentItem[]>(initialContent)
  const [loading, setLoading] = useState(false)
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Get featured content for hero section
  const featuredContent = useMemo(() => {
    const featured = content.filter((item) => item.featured || item.type === 'landing')
    return featured.slice(0, 3) // Show up to 3 featured items
  }, [content])

  const categories = useMemo(() => {
    const map = new Map<string, {slug: string, name: string}>()
    content.forEach((item) =>
      item.categories.forEach((c) => {
        map.set(c.slug, { slug: c.slug, name: c.name })
      }),
    )
    return Array.from(map.values())
  }, [content])

  // Enhanced tab system with better organization
  const primaryTabs = [
    { slug: "all", name: "All Content", icon: Grid3X3 },
    { slug: "blog", name: "Articles", icon: List },
    { slug: "tools", name: "Tools", icon: TrendingUp }
  ]
  
  const categoryTabs = categories.filter(cat => 
    cat.slug !== "tools-resources" && 
    ["AI Speakers", "Industry Insights", "Event Planning", "Speaker Spotlight", "Company News"].includes(cat.name)
  ).map(cat => ({ ...cat, icon: Filter }))
  
  const orderedTabs = [...primaryTabs, ...categoryTabs]

  const filteredContent = useMemo(() => {
    let list = content.filter((item) => !item.featured) // Exclude featured items from regular listing
    
    if (selectedCategorySlug === "blog") {
      list = list.filter((item) => item.type === 'blog')
    } else if (selectedCategorySlug === "tools") {
      list = list.filter((item) => item.type === 'landing')
    } else if (selectedCategorySlug !== "all") {
      list = list.filter((item) => item.categories.some((c) => c.slug === selectedCategorySlug))
    }
    
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.excerpt.toLowerCase().includes(q) ||
          item.author?.name?.toLowerCase().includes(q) ||
          item.categories.some((c) => c.name.toLowerCase().includes(q)),
      )
    }
    
    return list
  }, [content, selectedCategorySlug, searchTerm])

  const totalPages = Math.ceil(filteredContent.length / POSTS_PER_PAGE)
  const paginatedContent = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE
    return filteredContent.slice(start, start + POSTS_PER_PAGE)
  }, [filteredContent, currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getActiveTabLabel = () => {
    const activeTab = orderedTabs.find(tab => tab.slug === selectedCategorySlug)
    return activeTab?.name || "Content"
  }


  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Hero Header */}
      <header className="relative bg-gradient-to-b from-gray-50 to-white py-20 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#1E68C6]/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#1E68C6]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-[#1E68C6]/10 rounded-full text-[#1E68C6] text-sm font-montserrat font-medium">
              Resources
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 font-neue-haas">
            AI Insights & Tools
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-montserrat">
            Discover expert articles, cutting-edge tools, and premium resources for AI-powered events and speaker management
          </p>


          {/* Enhanced Search */}
          <div className="max-w-2xl mx-auto relative mt-8">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-[#1E68C6]" />
            <Input
              type="search"
              placeholder="Search articles, tools, and resources..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-12 pr-4 py-4 text-lg bg-white border-2 border-[#1E68C6]/30 text-black placeholder:text-gray-500 rounded-xl shadow-lg hover:shadow-xl focus:shadow-xl focus:border-[#1E68C6] transition-all font-montserrat"
              aria-label="Search content"
            />
          </div>
        </div>
      </header>

      {/* Featured Content Hero */}
      {featuredContent.length > 0 && (
        <FeaturedContentHero items={featuredContent} />
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        {/* Content Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {getActiveTabLabel()}
            </h2>
          </div>

          {/* Enhanced Tabs */}
          {orderedTabs.length > 1 && (
            <Tabs
              value={selectedCategorySlug}
              onValueChange={(v) => {
                setSelectedCategorySlug(v)
                setCurrentPage(1)
              }}
              className="w-full lg:w-auto"
            >
              <TabsList className="grid grid-cols-3 lg:flex lg:flex-wrap bg-white shadow-sm border border-gray-200 rounded-xl p-1">
                {orderedTabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <TabsTrigger 
                      key={tab.slug} 
                      value={tab.slug}
                      className="flex items-center gap-2 data-[state=active]:bg-[#1E68C6] data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium transition-all font-montserrat hover:bg-gray-100"
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span className="hidden sm:inline">{tab.name}</span>
                      <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </Tabs>
          )}
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading content...</p>
            </div>
          </div>
        ) : paginatedContent.length > 0 ? (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
              {paginatedContent.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </section>

            {totalPages > 1 && (
              <div className="flex justify-center">
                <PaginationControls 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  onPageChange={handlePageChange} 
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No content found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? `No results match "${searchTerm}". Try different keywords or browse all content.`
                  : "No content available in this category."
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("")
                    setCurrentPage(1)
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
