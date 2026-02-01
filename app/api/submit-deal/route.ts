import { NextRequest, NextResponse } from 'next/server'
import { createDeal, getDealById } from '@/lib/deals-utils'
import { sendNewInquiryEmail } from '@/lib/email-service-new'
// import { getWishlist, clearWishlist, transferWishlistToVisitor } from '@/lib/wishlist-utils'
import { recordEvent } from '@/lib/analytics-db'
import { verifyTurnstileToken, getClientIP } from '@/lib/turnstile'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()

    // Validate required fields
    if (!formData.clientName || !formData.clientEmail) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Verify Turnstile token (spam protection)
    const turnstileToken = formData.turnstileToken
    if (!turnstileToken) {
      return NextResponse.json(
        { error: 'CAPTCHA verification required. Please complete the CAPTCHA.' },
        { status: 400 }
      )
    }

    const clientIP = getClientIP(request)
    const verification = await verifyTurnstileToken(turnstileToken, clientIP)

    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error || 'CAPTCHA verification failed. Please try again.' },
        { status: 403 }
      )
    }

    // Get session info
    const sessionId = request.cookies.get('session_id')?.value
    const visitorId = request.cookies.get('visitor_id')?.value

    // Get wishlist speakers from session
    let wishlistSpeakers: Array<{id: number, name: string}> = []
    if (sessionId) {
      // const wishlist = await getWishlist(sessionId)
      const wishlist: any[] = []
      wishlistSpeakers = wishlist.map(item => ({
        id: item.speakerId,
        name: item.speaker?.name || `Speaker ${item.speakerId}`
      }))
    }

    // Prepare deal data - handle multiple event dates
    const eventDates = formData.eventDates || (formData.eventDate ? [formData.eventDate] : [])
    const dealData = {
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      phone: formData.phone,
      organizationName: formData.organizationName,
      specificSpeaker: formData.specificSpeaker,
      eventDate: eventDates.length > 0 ? eventDates[0] : '', // Primary date for compatibility
      eventDates: eventDates, // All dates
      eventLocation: formData.eventLocation,
      eventBudget: formData.eventBudget,
      additionalInfo: formData.additionalInfo,
      wishlistSpeakers,
      // Workshop-specific fields
      requestType: formData.requestType,
      selectedWorkshop: formData.selectedWorkshop,
      selectedWorkshopId: formData.selectedWorkshopId,
      hasNoWorkshopInMind: formData.hasNoWorkshopInMind,
      numberOfParticipants: formData.numberOfParticipants,
      participantSkillLevel: formData.participantSkillLevel,
      preferredFormat: formData.preferredFormat
    }

    // Create the deal
    const dealId = await createDeal(dealData, sessionId)

    if (!dealId) {
      return NextResponse.json(
        { error: 'Failed to create deal' },
        { status: 500 }
      )
    }

    // Get the created deal for email notification
    const deal = await getDealById(dealId)
    if (!deal) {
      return NextResponse.json(
        { error: 'Deal created but failed to retrieve details' },
        { status: 500 }
      )
    }

    // Send email notifications
    try {
      await sendNewInquiryEmail(deal, dealData)
    } catch (emailError) {
      console.error('Failed to send email notifications:', emailError)
      // Don't fail the request if email fails
    }

    // Transfer wishlist to visitor if we have visitor ID
    if (sessionId && visitorId) {
      try {
        // await transferWishlistToVisitor(sessionId, visitorId)
      } catch (transferError) {
        console.error('Failed to transfer wishlist:', transferError)
      }
    }

    // Clear wishlist after successful submission
    if (sessionId) {
      try {
        // await clearWishlist(sessionId)
      } catch (clearError) {
        console.error('Failed to clear wishlist:', clearError)
      }
    }

    // Track conversion event
    if (sessionId && visitorId) {
      try {
        await recordEvent({
          sessionId,
          visitorId,
          eventName: 'deal_submission',
          eventCategory: 'conversion',
          eventValue: deal.dealValue || 15000,
          pagePath: '/contact',
          metadata: {
            dealId: dealId,
            speakersCount: wishlistSpeakers.length,
            organizationName: formData.organizationName,
            eventBudget: formData.eventBudget
          }
        })
      } catch (analyticsError) {
        console.error('Failed to track conversion:', analyticsError)
      }
    }

    return NextResponse.json({
      success: true,
      dealId,
      message: 'Your request has been submitted successfully! We\'ll be in touch within 24 hours.'
    })

  } catch (error) {
    console.error('Deal submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit deal. Please try again.' },
      { status: 500 }
    )
  }
}