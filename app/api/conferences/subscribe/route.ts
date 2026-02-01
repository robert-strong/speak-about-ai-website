import { NextRequest, NextResponse } from 'next/server'
import {
  createConferenceSubscriber,
  getConferenceSubscriberByEmail
} from '@/lib/conferences-db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, company, role, action } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if subscriber exists
    const existingSubscriber = await getConferenceSubscriberByEmail(email)

    if (action === 'login') {
      // Login: check if subscriber exists
      if (!existingSubscriber) {
        return NextResponse.json(
          { error: 'No account found with this email. Please sign up first.' },
          { status: 404 }
        )
      }

      // Update last login
      return NextResponse.json({
        success: true,
        subscriber: existingSubscriber,
        message: 'Login successful'
      })
    } else {
      // Signup: create or update subscriber
      const subscriber = await createConferenceSubscriber({
        email,
        name,
        company,
        role,
        subscription_status: 'active'
      })

      return NextResponse.json({
        success: true,
        subscriber,
        message: existingSubscriber ? 'Welcome back!' : 'Account created successfully'
      })
    }
  } catch (error) {
    console.error('Error processing conference subscription:', error)
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    )
  }
}
