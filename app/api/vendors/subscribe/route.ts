import { NextRequest, NextResponse } from "next/server"
import { 
  subscribeToDirectory,
  getSubscriberByEmail,
  updateSubscriberLogin
} from "@/lib/vendors-db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, company, phone, action } = body
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }
    
    // If action is login, update last login
    if (action === "login") {
      const subscriber = await getSubscriberByEmail(email)
      
      if (!subscriber) {
        return NextResponse.json(
          { error: "Email not found. Please sign up first." },
          { status: 404 }
        )
      }
      
      if (subscriber.subscription_status !== 'active') {
        return NextResponse.json(
          { error: "Your subscription is not active" },
          { status: 403 }
        )
      }
      
      await updateSubscriberLogin(email)
      
      return NextResponse.json({ 
        success: true,
        subscriber: {
          email: subscriber.email,
          name: subscriber.name,
          company: subscriber.company,
          access_level: subscriber.access_level
        }
      })
    }
    
    // Otherwise, create/update subscription
    const subscriber = await subscribeToDirectory({
      email,
      name,
      company,
      phone
    })
    
    return NextResponse.json({ 
      success: true,
      subscriber: {
        email: subscriber.email,
        name: subscriber.name,
        company: subscriber.company,
        access_level: subscriber.access_level
      }
    })
  } catch (error) {
    console.error("Error processing subscription:", error)
    return NextResponse.json(
      { error: "Failed to process subscription" },
      { status: 500 }
    )
  }
}