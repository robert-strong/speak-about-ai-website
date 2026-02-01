"use server"

import { neon } from '@neondatabase/serverless'

interface FormData {
  name: string
  email: string
  phone: string
  organizationName: string
  specificSpeaker: string
  eventDate: string
  eventLocation: string
  eventBudget: string
  additionalInfo: string
  newsletterOptOut: boolean
}

interface SubmissionData extends FormData {
  wantsNewsletter: boolean
  submittedAt: string
  source: string
}

export async function submitContactForm(formData: FormData): Promise<{ success: boolean; message: string }> {
  console.log("Server Action: submitContactForm called with formData:", formData)

  const wantsNewsletter = !formData.newsletterOptOut

  const submissionData: SubmissionData = {
    ...formData,
    wantsNewsletter,
    submittedAt: new Date().toISOString(),
    source: "contact-2-single-step-form-v3-opt-out-server-action", // Updated source
  }

  try {
    const zapierWebhookUrl = "https://hooks.zapier.com/hooks/catch/23536588/ubtw516/"
    console.log("Server Action: Sending data to Zapier:", submissionData)

    const response = await fetch(zapierWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submissionData),
    })

    console.log("Server Action: Zapier response status:", response.status)
    const responseBody = await response.text()
    console.log("Server Action: Zapier response body:", responseBody)

    if (response.ok) {
      console.log("Server Action: Successfully submitted to Zapier.")
      
      // If user wants newsletter, save to our database
      if (wantsNewsletter && process.env.DATABASE_URL) {
        try {
          const sql = neon(process.env.DATABASE_URL)
          
          // Check if email already exists
          const existing = await sql`
            SELECT id, status FROM newsletter_signups 
            WHERE email = ${formData.email.toLowerCase()}
          `
          
          if (existing.length === 0) {
            // New subscriber
            await sql`
              INSERT INTO newsletter_signups (
                email, name, company, status, source
              ) VALUES (
                ${formData.email.toLowerCase()},
                ${formData.name},
                ${formData.organizationName},
                'active',
                'high_converting_contact_form'
              )
            `
            console.log("Server Action: Added to newsletter database")
          } else if (existing[0].status === 'unsubscribed') {
            // Reactivate unsubscribed user
            await sql`
              UPDATE newsletter_signups 
              SET status = 'active', 
                  subscribed_at = CURRENT_TIMESTAMP,
                  unsubscribed_at = NULL,
                  name = ${formData.name},
                  company = ${formData.organizationName}
              WHERE id = ${existing[0].id}
            `
            console.log("Server Action: Reactivated newsletter subscription")
          }
        } catch (error) {
          console.error("Server Action: Error saving newsletter signup:", error)
          // Don't fail the form submission if newsletter signup fails
        }
      }
      
      return { success: true, message: "Form submitted successfully!" }
    } else {
      console.error("Server Action: Zapier submission failed. Status:", response.status, "Response Body:", responseBody)
      return {
        success: false,
        message: `Failed to submit to Zapier. Status: ${response.status}`,
      }
    }
  } catch (error: any) {
    console.error("Server Action: Error submitting form to Zapier:", {
      errorMessage: error.message,
      errorStack: error.stack,
      errorObject: error,
    })
    return {
      success: false,
      message: "An unexpected error occurred on the server.",
    }
  }
}
