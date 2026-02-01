"use server"

import { neon } from '@neondatabase/serverless'
import { headers } from 'next/headers'
import { getEmailResourceForPageAsync } from '@/lib/email-resources-config'

interface FormData {
  name?: string
  email: string
  phone?: string
  organizationName?: string
  company?: string
  specificSpeaker?: string
  eventDate?: string
  eventLocation?: string
  eventBudget?: string
  additionalInfo?: string
  message?: string
  newsletterOptOut?: boolean
  sourceUrl?: string // Track which landing page this came from
  landingPageTitle?: string // Title of the landing page for context
  [key: string]: any // Allow additional fields from dynamic forms
}

// Initialize Resend if available
let resend: any = null
try {
  const { Resend } = require('resend')
  resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
} catch (error) {
  console.warn('Resend not available for email notifications')
}

// Generate email content based on the landing page using configuration
async function getResourceEmailContent(formData: FormData): Promise<{ subject: string; html: string }> {
  // Get resources from configuration (now async to support database)
  const resources = await getEmailResourceForPageAsync(formData.sourceUrl, formData.landingPageTitle)
  
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1E68C6;">Thank you for your interest!</h2>
      
      ${resources.resourceContent}
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <h3>🚀 Ready to Take Your Events to the Next Level?</h3>
      <p>Book world-class AI keynote speakers for your next event:</p>
      <ul>
        <li>Leading AI researchers and practitioners</li>
        <li>Fortune 500 AI executives</li>
        <li>Bestselling authors on AI and technology</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://speakabout.ai/speakers" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Browse AI Speakers →
        </a>
      </div>
      
      <p>Best regards,<br><strong>The Speak About AI Team</strong></p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #666; font-size: 12px; text-align: center;">
        Speak About AI | Premier AI Keynote Speakers Bureau<br>
        <a href="https://speakabout.ai" style="color: #1E68C6;">speakabout.ai</a> | 
        <a href="mailto:human@speakabout.ai" style="color: #1E68C6;">human@speakabout.ai</a>
      </p>
    </div>
  `
  
  return { subject: resources.subject, html }
}

async function sendConfirmationEmail(formData: FormData) {
  if (!resend) {
    console.log('Resend not configured - skipping email')
    return false
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'hello@speakabout.ai'
  
  try {
    // Send client confirmation with resources only (no admin notification)
    const emailContent = await getResourceEmailContent(formData)
    await resend.emails.send({
      from: fromEmail,
      to: formData.email,
      subject: emailContent.subject,
      html: emailContent.html
    })

    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export async function submitLandingPageForm(formData: FormData): Promise<{ success: boolean; message: string }> {
  console.log("[Server Action] submitLandingPageForm called with:", JSON.stringify(formData, null, 2))
  console.log("[Server Action] Form data keys:", Object.keys(formData))

  // Normalize field names (handle both lowercase and capitalized versions)
  const normalizedData: FormData = {
    email: formData.email || formData.Email || formData.EMAIL || '',
    name: formData.name || formData.Name || formData.NAME,
    phone: formData.phone || formData.Phone || formData.PHONE,
    organizationName: formData.organizationName || formData.OrganizationName || formData.company || formData.Company,
    message: formData.message || formData.Message || formData.MESSAGE,
    additionalInfo: formData.additionalInfo || formData.AdditionalInfo,
    sourceUrl: formData.sourceUrl,
    landingPageTitle: formData.landingPageTitle,
    newsletterOptOut: formData.newsletterOptOut,
    ...formData // Keep any other fields
  }

  console.log("[Server Action] Normalized data:", JSON.stringify(normalizedData, null, 2))
  
  // Use normalized data from here on
  formData = normalizedData

  // Validate required email field
  if (!formData.email) {
    console.error('[Server Action] No email provided in form data')
    return {
      success: false,
      message: "Email address is required. Please provide a valid email."
    }
  }

  try {
    // Get request headers for tracking
    let userAgent = ''
    let referer = ''
    let ip = null
    
    try {
      const headersList = await headers()
      userAgent = headersList.get('user-agent') || ''
      referer = headersList.get('referer') || ''
      const forwardedFor = headersList.get('x-forwarded-for')
      const realIp = headersList.get('x-real-ip')
      ip = forwardedFor || realIp || null
    } catch (headerError) {
      console.log('Could not get headers:', headerError)
    }

    // Database connection - must use environment variable
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not configured')
    }
    const sql = neon(databaseUrl)

    // Save to form_submissions table
    const [submission] = await sql`
      INSERT INTO form_submissions (
        submission_type,
        source_url,
        name,
        email,
        phone,
        organization_name,
        specific_speaker,
        event_date,
        event_location,
        event_budget,
        message,
        additional_info,
        form_data,
        newsletter_opt_in,
        ip_address,
        user_agent,
        referrer,
        status
      ) VALUES (
        'landing_page',
        ${formData.sourceUrl || referer},
        ${formData.name || 'Website Visitor'},
        ${formData.email.toLowerCase()},
        ${formData.phone || null},
        ${formData.organizationName || formData.company || null},
        ${formData.specificSpeaker || null},
        ${formData.eventDate || null},
        ${formData.eventLocation || null},
        ${formData.eventBudget || null},
        ${formData.message || null},
        ${formData.additionalInfo || null},
        ${JSON.stringify(formData)},
        ${!formData.newsletterOptOut},
        ${ip},
        ${userAgent},
        ${referer},
        'new'
      )
      RETURNING id
    `
    
    console.log('[Server Action] Form submission saved with ID:', submission.id)

    // Track ALL landing page signups (regardless of newsletter status)
    try {
      let pageSlug = 'direct'
      try {
        if (formData.sourceUrl) {
          const url = new URL(formData.sourceUrl)
          pageSlug = url.pathname.split('/').pop() || 'homepage'
        }
      } catch (e) {
        pageSlug = 'direct'
      }
      
      await sql`
        INSERT INTO landing_page_signups (
          email,
          name,
          company,
          landing_page_url,
          landing_page_title,
          page_slug,
          newsletter_opted_in,
          ip_address
        ) VALUES (
          ${formData.email.toLowerCase()},
          ${formData.name || 'Website Visitor'},
          ${formData.organizationName || formData.company || null},
          ${formData.sourceUrl || referer},
          ${formData.landingPageTitle || null},
          ${pageSlug},
          ${!formData.newsletterOptOut},
          ${ip}
        )
        ON CONFLICT (email, landing_page_url, created_at) DO NOTHING
      `
      console.log('[Server Action] Tracked landing page signup for analytics')
    } catch (trackingError) {
      console.error('[Server Action] Failed to track landing page signup:', trackingError)
      // Don't fail the submission if tracking fails
    }

    // Add to newsletter if opted in
    console.log('[Server Action] Newsletter opt-out status:', formData.newsletterOptOut)
    console.log('[Server Action] Will add to newsletter:', !formData.newsletterOptOut)
    
    if (!formData.newsletterOptOut) {
      try {
        // Check if email already exists
        const existing = await sql`
          SELECT id, status FROM newsletter_signups 
          WHERE email = ${formData.email.toLowerCase()}
        `
        
        console.log('[Server Action] Existing newsletter entries:', existing.length)
        
        if (existing.length === 0) {
          // New subscriber
          // Get the source page info for tracking
          let pageSlug = 'direct'
          try {
            if (formData.sourceUrl) {
              const url = new URL(formData.sourceUrl)
              pageSlug = url.pathname.split('/').pop() || 'homepage'
            }
          } catch (e) {
            pageSlug = 'direct'
          }
          const sourceLabel = formData.landingPageTitle ? 
            `LP: ${formData.landingPageTitle}` 
            : `landing_page: ${pageSlug}`
          
          console.log('[Server Action] Adding to newsletter with source:', sourceLabel)
            
          await sql`
            INSERT INTO newsletter_signups (
              email, name, company, status, source, ip_address
            ) VALUES (
              ${formData.email.toLowerCase()},
              ${formData.name || 'Website Visitor'},
              ${formData.organizationName || formData.company || null},
              'active',
              ${sourceLabel},
              ${ip}
            )
          `
          console.log('[Server Action] Successfully added to newsletter')
        } else if (existing[0].status === 'unsubscribed') {
          // Reactivate unsubscribed user
          let pageSlug = 'direct'
          try {
            if (formData.sourceUrl) {
              const url = new URL(formData.sourceUrl)
              pageSlug = url.pathname.split('/').pop() || 'homepage'
            }
          } catch (e) {
            pageSlug = 'direct'
          }
          const sourceLabel = formData.landingPageTitle ? 
            `LP: ${formData.landingPageTitle}` 
            : `landing_page: ${pageSlug}`
            
          await sql`
            UPDATE newsletter_signups 
            SET status = 'active', 
                subscribed_at = CURRENT_TIMESTAMP,
                unsubscribed_at = NULL,
                name = ${formData.name || 'Website Visitor'},
                company = ${formData.organizationName || formData.company || null},
                source = ${sourceLabel}
            WHERE id = ${existing[0].id}
          `
          console.log('[Server Action] Reactivated newsletter subscription for:', existing[0].id)
        } else {
          // Update source for existing active subscriber to track landing page
          let pageSlug = 'direct'
          try {
            if (formData.sourceUrl) {
              const url = new URL(formData.sourceUrl)
              pageSlug = url.pathname.split('/').pop() || 'homepage'
            }
          } catch (e) {
            pageSlug = 'direct'
          }
          const sourceLabel = formData.landingPageTitle ? 
            `LP: ${formData.landingPageTitle}` 
            : `landing_page: ${pageSlug}`
          
          await sql`
            UPDATE newsletter_signups 
            SET source = ${sourceLabel},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${existing[0].id}
          `
          console.log('[Server Action] Updated source for existing subscriber:', existing[0].id, 'to:', sourceLabel)
        }
      } catch (error) {
        console.error('[Server Action] Newsletter signup error:', error)
        // Don't fail the form submission if newsletter signup fails
      }
    }

    // Send email notifications
    const emailSent = await sendConfirmationEmail(formData)
    if (!emailSent) {
      console.log('Email notifications could not be sent, but form was saved')
    }

    return { 
      success: true, 
      message: "Thank you! Your submission has been received. We'll get back to you within 24 hours." 
    }
    
  } catch (error: any) {
    console.error('[Server Action] Form submission error:', error)
    console.error('[Server Action] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return {
      success: false,
      message: "We're sorry, but there was an error processing your submission. Please try again or contact us directly."
    }
  }
}