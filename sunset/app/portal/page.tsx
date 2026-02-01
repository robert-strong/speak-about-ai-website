"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar,
  Mic,
  Users,
  ArrowRight,
  Building2,
  CheckCircle2,
  LogIn,
  UserPlus,
  Sparkles
} from "lucide-react"

export default function EventHubPortal() {
  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    const clientLoggedIn = localStorage.getItem("clientLoggedIn")
    const speakerLoggedIn = localStorage.getItem("speakerAuth")
    
    if (clientLoggedIn) {
      router.push("/portal/dashboard")
    } else if (speakerLoggedIn) {
      router.push("/portal/speaker")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              Event Hub Portal
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Your Central Hub for
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> AI Speaking Events</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              Connect with world-class AI speakers, manage your events, and access exclusive resources all in one place
            </p>

            {/* Role Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Event Organizer Card */}
              <Card 
                className="relative overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-2 hover:border-blue-200"
                onClick={() => router.push("/portal/client")}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                
                <CardHeader className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">Event Organizers</CardTitle>
                  <CardDescription>
                    Manage your events and speaker bookings
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>Access event details & logistics</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>View speaker information</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>Track contracts & invoices</span>
                  </div>
                  
                  <Button className="w-full mt-4" variant="outline">
                    <LogIn className="mr-2 h-4 w-4" />
                    Access Client Portal
                  </Button>
                </CardContent>
              </Card>

              {/* Speaker Card */}
              <Card 
                className="relative overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-2 hover:border-purple-200"
                onClick={() => router.push("/portal/speaker")}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                
                <CardHeader className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Mic className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">Speakers</CardTitle>
                  <CardDescription>
                    Manage your profile and engagements
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    <span>View upcoming engagements</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    <span>Update profile & materials</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    <span>Access event information</span>
                  </div>
                  
                  <Button className="w-full mt-4" variant="outline">
                    <LogIn className="mr-2 h-4 w-4" />
                    Access Speaker Portal
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join the premier platform for AI speaking events
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => router.push("/contact")}
            >
              <Building2 className="mr-2 h-5 w-5" />
              Book a Speaker
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20"
              onClick={() => router.push("/apply")}
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Become a Speaker
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}