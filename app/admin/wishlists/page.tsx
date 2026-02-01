"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Heart,
  Users,
  Search,
  Calendar,
  RefreshCw,
  Eye,
  Trash2,
  AlertTriangle,
  Loader2,
  Star
} from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useToast } from "@/hooks/use-toast"

interface WishlistItem {
  id: number
  session_id: string
  visitor_id?: string
  speaker_id: number
  speaker_name: string
  speaker_headshot_url?: string
  added_at: string
  speaker_topics?: string[]
  speaker_location?: string
}

interface WishlistStats {
  totalWishlists: number
  uniqueSessions: number
  topSpeakers: Array<{
    speaker_id: number
    speaker_name: string
    wishlist_count: number
  }>
  recentActivity: WishlistItem[]
}

export default function AdminWishlistsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [wishlists, setWishlists] = useState<WishlistItem[]>([])
  const [stats, setStats] = useState<WishlistStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [timeRange, setTimeRange] = useState("30")
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    loadWishlists()
  }, [router, timeRange])

  const loadWishlists = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/wishlists?days=${timeRange}`)
      
      if (response.ok) {
        const data = await response.json()
        setWishlists(data.wishlists || [])
        setStats(data.stats || null)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to load wishlists",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading wishlists:", error)
      toast({
        title: "Error",
        description: "Failed to load wishlist data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWishlist = async (id: number) => {
    if (!confirm("Are you sure you want to delete this wishlist item?")) return

    try {
      const response = await fetch(`/api/wishlists/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setWishlists(wishlists.filter(w => w.id !== id))
        toast({
          title: "Success",
          description: "Wishlist item deleted successfully"
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete wishlist item",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting wishlist:", error)
      toast({
        title: "Error",
        description: "Failed to delete wishlist item",
        variant: "destructive"
      })
    }
  }

  const filteredWishlists = wishlists.filter(wishlist =>
    wishlist.speaker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wishlist.session_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isLoggedIn) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading wishlists...</span>
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
              <h1 className="text-3xl font-bold text-gray-900">Speaker Wishlists</h1>
              <p className="mt-2 text-gray-600">Track which speakers visitors are most interested in</p>
            </div>
            <div className="flex gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadWishlists} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {!stats ? (
            <Alert className="mb-8 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">No Wishlist Data</AlertTitle>
              <AlertDescription className="text-yellow-700">
                No wishlist data found. Visitors haven't started using the wishlist feature yet.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Wishlist Items</CardTitle>
                    <Heart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalWishlists.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique Sessions</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.uniqueSessions.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Items per Session</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.uniqueSessions > 0 ? (stats.totalWishlists / stats.uniqueSessions).toFixed(1) : "0"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Speakers */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Most Wishlisted Speakers</CardTitle>
                  <CardDescription>Speakers that visitors are most interested in</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Speaker</TableHead>
                        <TableHead>Wishlist Count</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.topSpeakers.map((speaker, index) => (
                        <TableRow key={speaker.speaker_id}>
                          <TableCell className="font-medium">{speaker.speaker_name}</TableCell>
                          <TableCell>{speaker.wishlist_count}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {((speaker.wishlist_count / stats.totalWishlists) * 100).toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Search and Filters */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by speaker name or session ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wishlist Items */}
              <Card>
                <CardHeader>
                  <CardTitle>All Wishlist Items</CardTitle>
                  <CardDescription>
                    Showing {filteredWishlists.length} of {wishlists.length} wishlist items
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Speaker</TableHead>
                        <TableHead>Session ID</TableHead>
                        <TableHead>Added Date</TableHead>
                        <TableHead>Topics</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWishlists.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            No wishlist items found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredWishlists.map((wishlist) => (
                          <TableRow key={wishlist.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {wishlist.speaker_headshot_url && (
                                  <img
                                    src={wishlist.speaker_headshot_url}
                                    alt={wishlist.speaker_name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                )}
                                <div>
                                  <div className="font-medium">{wishlist.speaker_name}</div>
                                  {wishlist.speaker_location && (
                                    <div className="text-sm text-gray-500">{wishlist.speaker_location}</div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {wishlist.session_id.substring(0, 8)}...
                            </TableCell>
                            <TableCell>
                              {new Date(wishlist.added_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {wishlist.speaker_topics && (
                                <div className="flex flex-wrap gap-1">
                                  {wishlist.speaker_topics.slice(0, 2).map((topic, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {topic}
                                    </Badge>
                                  ))}
                                  {wishlist.speaker_topics.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{wishlist.speaker_topics.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => router.push(`/admin/speakers/${wishlist.speaker_id}`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteWishlist(wishlist.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}