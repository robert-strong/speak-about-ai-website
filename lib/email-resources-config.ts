/**
 * Email Resources Configuration
 * 
 * Edit this file to change what resources are sent for each landing page.
 * The system matches based on URL patterns or page titles.
 */

export interface EmailResource {
  // Matching criteria (at least one must match)
  urlPatterns?: string[]      // URL patterns to match (e.g., 'ai-tools-for-event-planners')
  titlePatterns?: string[]    // Page title patterns to match (case-insensitive)
  
  // Email content
  subject: string
  resourceContent: string      // HTML content for the resources section
}

export const emailResources: EmailResource[] = [
  {
    // AI Tools for Event Planners Page
    urlPatterns: ['ai-tools-for-event-planners'],
    titlePatterns: ['ai tools', 'event planners'],
    subject: 'Your 5 Essential AI Tools for Event Planning',
    resourceContent: `
      <h3>🎯 Your AI Tools for Event Planning</h3>
      <p>Here are the 5 essential free AI tools we promised:</p>
      
      <ol style="line-height: 1.8;">
        <li><strong>ChatGPT</strong> - For creating event content, email templates, and attendee communications<br>
            <a href="https://chat.openai.com" style="color: #1E68C6;">Access ChatGPT →</a></li>
        
        <li><strong>Claude</strong> - For detailed event planning, vendor communications, and budget analysis<br>
            <a href="https://claude.ai" style="color: #1E68C6;">Access Claude →</a></li>
        
        <li><strong>Canva AI</strong> - For creating event graphics, social media posts, and presentations<br>
            <a href="https://www.canva.com/ai-image-generator/" style="color: #1E68C6;">Access Canva AI →</a></li>
        
        <li><strong>Otter.ai</strong> - For transcribing meetings, speaker sessions, and creating event summaries<br>
            <a href="https://otter.ai" style="color: #1E68C6;">Access Otter.ai →</a></li>
        
        <li><strong>Gamma</strong> - For creating beautiful presentations and event proposals with AI<br>
            <a href="https://gamma.app" style="color: #1E68C6;">Access Gamma →</a></li>
      </ol>
      
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>💡 Pro Tip:</strong> Start with ChatGPT or Claude for planning, then use the other tools for specific tasks like design or transcription.</p>
      </div>
    `
  },
  
  {
    // Event Planning Checklist Generator
    urlPatterns: ['event-planning-checklist'],
    titlePatterns: ['checklist', 'event planning checklist'],
    subject: 'Your Event Planning Checklist Generator',
    resourceContent: `
      <h3>📋 Your Custom Event Planning Checklist Generator</h3>
      <p>Click the link below to access your personalized event planning checklist generator:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://chat.openai.com/g/g-eventplanner" style="display: inline-block; background: #1E68C6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Access Your Checklist Generator →
        </a>
      </div>
      
      <p>This AI-powered tool will help you:</p>
      <ul>
        <li>Create customized checklists for any event type</li>
        <li>Set automatic reminders and deadlines</li>
        <li>Track your progress in real-time</li>
        <li>Collaborate with your team</li>
      </ul>
    `
  },
  
  {
    // AI Speaker Booking Guide
    urlPatterns: ['ai-speaker-guide', 'speaker-booking'],
    titlePatterns: ['speaker', 'booking guide'],
    subject: 'Your AI Speaker Booking Guide',
    resourceContent: `
      <h3>🎤 Your Complete AI Speaker Booking Guide</h3>
      <p>Here's everything you need to know about booking AI keynote speakers:</p>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #1E68C6; margin-top: 0;">Quick Start Checklist:</h4>
        <ul style="line-height: 1.8;">
          <li>✓ Define your event goals and audience</li>
          <li>✓ Set your speaker budget range</li>
          <li>✓ Review speaker portfolios and videos</li>
          <li>✓ Check availability for your date</li>
          <li>✓ Request proposals from top choices</li>
        </ul>
      </div>
      
      <p><strong>Top AI Speaker Topics for 2025:</strong></p>
      <ul>
        <li>Generative AI in Business</li>
        <li>AI Ethics and Responsible Innovation</li>
        <li>The Future of Work with AI</li>
        <li>AI in Healthcare and Life Sciences</li>
        <li>Practical AI Implementation Strategies</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://speakabout.ai/speakers" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Browse Our AI Speakers →
        </a>
      </div>
    `
  },
  
  {
    // Virtual Event Tools
    urlPatterns: ['virtual-event', 'hybrid-event'],
    titlePatterns: ['virtual', 'hybrid'],
    subject: 'Your Virtual & Hybrid Event Toolkit',
    resourceContent: `
      <h3>💻 Virtual & Hybrid Event AI Tools</h3>
      <p>Transform your virtual events with these AI-powered tools:</p>
      
      <ul style="line-height: 1.8;">
        <li><strong>StreamYard with AI Captions</strong> - Professional streaming with auto-captions<br>
            <a href="https://streamyard.com" style="color: #1E68C6;">Try StreamYard →</a></li>
        
        <li><strong>Fireflies.ai</strong> - AI meeting assistant for virtual events<br>
            <a href="https://fireflies.ai" style="color: #1E68C6;">Try Fireflies →</a></li>
        
        <li><strong>Wonder Dynamics</strong> - AI-powered virtual backgrounds and effects<br>
            <a href="https://wonderdynamics.com" style="color: #1E68C6;">Explore Wonder →</a></li>
        
        <li><strong>Synthesia</strong> - Create AI avatar presentations<br>
            <a href="https://synthesia.io" style="color: #1E68C6;">Try Synthesia →</a></li>
      </ul>
    `
  }
]

/**
 * Default email content for pages that don't match any specific resource
 */
export const defaultEmailContent = {
  subject: 'Thank you for contacting Speak About AI',
  resourceContent: `
    <p>We've received your submission and will get back to you within 24 hours with the resources you requested.</p>
    
    <p>In the meantime, explore our most popular resources:</p>
    <ul>
      <li><a href="https://speakabout.ai/blog" style="color: #1E68C6;">AI Insights Blog</a> - Latest trends and tips</li>
      <li><a href="https://speakabout.ai/speakers" style="color: #1E68C6;">Browse AI Speakers</a> - Find the perfect speaker</li>
      <li><a href="https://speakabout.ai/contact" style="color: #1E68C6;">Contact Us</a> - Get personalized assistance</li>
    </ul>
  `
}

/**
 * Find the matching email resource for a given form submission
 * This is now async to support database fetching
 */
export async function getEmailResourceForPageAsync(sourceUrl?: string, pageTitle?: string): Promise<{ subject: string; resourceContent: string }> {
  try {
    // Try to fetch from database first
    const databaseUrl = process.env.DATABASE_URL
    if (databaseUrl) {
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(databaseUrl)
      
      // Fetch active resources from database
      const dbResources = await sql`
        SELECT url_patterns, title_patterns, subject, resource_content
        FROM landing_page_resources 
        WHERE is_active = true 
        ORDER BY priority DESC, created_at DESC
      `
      
      if (dbResources.length > 0) {
        // Check database resources
        for (const resource of dbResources) {
          // Check URL patterns
          if (sourceUrl && resource.url_patterns) {
            for (const pattern of resource.url_patterns) {
              if (sourceUrl.toLowerCase().includes(pattern.toLowerCase())) {
                return {
                  subject: resource.subject,
                  resourceContent: resource.resource_content
                }
              }
            }
          }
          
          // Check title patterns
          if (pageTitle && resource.title_patterns) {
            for (const pattern of resource.title_patterns) {
              if (pageTitle.toLowerCase().includes(pattern.toLowerCase())) {
                return {
                  subject: resource.subject,
                  resourceContent: resource.resource_content
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching from database, falling back to config:', error)
  }
  
  // Fallback to static config
  return getEmailResourceForPage(sourceUrl, pageTitle)
}

/**
 * Find the matching email resource for a given form submission (synchronous version)
 * This uses the static configuration only
 */
export function getEmailResourceForPage(sourceUrl?: string, pageTitle?: string): { subject: string; resourceContent: string } {
  // Try to find a matching resource
  for (const resource of emailResources) {
    // Check URL patterns
    if (sourceUrl && resource.urlPatterns) {
      for (const pattern of resource.urlPatterns) {
        if (sourceUrl.toLowerCase().includes(pattern.toLowerCase())) {
          return {
            subject: resource.subject,
            resourceContent: resource.resourceContent
          }
        }
      }
    }
    
    // Check title patterns
    if (pageTitle && resource.titlePatterns) {
      for (const pattern of resource.titlePatterns) {
        if (pageTitle.toLowerCase().includes(pattern.toLowerCase())) {
          return {
            subject: resource.subject,
            resourceContent: resource.resourceContent
          }
        }
      }
    }
  }
  
  // Return default if no match
  return defaultEmailContent
}