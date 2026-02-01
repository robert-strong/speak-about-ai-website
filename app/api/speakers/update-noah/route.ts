import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // Update Noah's basic information
    const result = await sql`
      UPDATE speakers 
      SET 
        name = 'Noah Cheyer',
        email = 'noah@speakabout.ai',
        bio = 'Co-Founder and Head of Marketing & Operations at Speak About AI. Passionate about connecting organizations with world-class AI speakers.',
        short_bio = 'Co-Founder at Speak About AI',
        one_liner = 'Co-Founder, Head of Marketing & Operations at Speak About AI',
        title = 'Co-Founder & Head of Marketing & Operations at Speak About AI',
        location = 'San Francisco, CA',
        website = NULL,
        social_media = '{"linkedin_url": "https://linkedin.com/in/noah-cheyer"}',
        topics = '["AI Strategy", "Speaker Bureau Management", "Event Planning", "Marketing", "AI in Events Industry", "Digital Marketing", "Entrepreneurship"]'::jsonb,
        industries = '["Events", "Marketing", "Technology", "Professional Services", "Education"]'::jsonb,
        programs = '[
          {
            "title": "The Future of AI Speaking",
            "description": "Explore the rapidly evolving landscape of AI thought leadership and how organizations can leverage AI expertise to drive innovation. Noah shares insights from building the world''s first AI-exclusive speaker bureau, including how to identify top AI talent, connect experts with audiences, and create impactful speaking engagements that transform businesses and industries.",
            "duration": "45 minutes",
            "format": "Keynote"
          },
          {
            "title": "Building World-Class Events",
            "description": "Learn the strategies behind creating memorable, high-impact events that deliver real value. Drawing from experience curating AI speaker lineups for Fortune 500 companies, Noah reveals best practices for speaker selection, audience engagement, event logistics, and measuring ROI. Perfect for event planners and organizations looking to elevate their conferences and corporate gatherings.",
            "duration": "45 minutes",
            "format": "Keynote"
          },
          {
            "title": "Marketing in the AI Era",
            "description": "Discover how to harness AI and position your brand in an AI-driven world. Noah shares practical marketing strategies from growing Speak About AI, including digital marketing tactics, content creation, brand positioning in emerging markets, and leveraging thought leadership. Attendees will leave with actionable frameworks for marketing success in the age of artificial intelligence.",
            "duration": "45 minutes",
            "format": "Keynote"
          }
        ]'::jsonb,
        videos = '[]',
        active = true,
        listed = true
      WHERE id = 85
      RETURNING id, name, email
    `
    
    if (result.length === 0) {
      // Noah doesn't exist with ID 85, create him
      const insertResult = await sql`
        INSERT INTO speakers (
          id, name, email, bio, short_bio, one_liner, title, location,
          website, social_media, topics, industries, programs,
          videos, active, listed
        ) VALUES (
          85,
          'Noah Cheyer',
          'noah@speakabout.ai',
          'Co-Founder and Head of Marketing & Operations at Speak About AI. Passionate about connecting organizations with world-class AI speakers.',
          'Co-Founder at Speak About AI',
          'Co-Founder, Head of Marketing & Operations at Speak About AI',
          'Co-Founder & Head of Marketing & Operations at Speak About AI',
          'San Francisco, CA',
          NULL,
          '{"linkedin_url": "https://linkedin.com/in/noahcheyer"}',
          '["AI Strategy", "Speaker Bureau Management", "Event Planning", "Marketing", "AI in Events Industry", "Digital Marketing", "Entrepreneurship"]'::jsonb,
          '["Events", "Marketing", "Technology", "Professional Services", "Education"]'::jsonb,
          '[
            {
              "title": "The Future of AI Speaking",
              "description": "Explore the rapidly evolving landscape of AI thought leadership and how organizations can leverage AI expertise to drive innovation. Noah shares insights from building the world''s first AI-exclusive speaker bureau, including how to identify top AI talent, connect experts with audiences, and create impactful speaking engagements that transform businesses and industries.",
              "duration": "45 minutes",
              "format": "Keynote"
            },
            {
              "title": "Building World-Class Events",
              "description": "Learn the strategies behind creating memorable, high-impact events that deliver real value. Drawing from experience curating AI speaker lineups for Fortune 500 companies, Noah reveals best practices for speaker selection, audience engagement, event logistics, and measuring ROI. Perfect for event planners and organizations looking to elevate their conferences and corporate gatherings.",
              "duration": "45 minutes",
              "format": "Keynote"
            },
            {
              "title": "Marketing in the AI Era",
              "description": "Discover how to harness AI and position your brand in an AI-driven world. Noah shares practical marketing strategies from growing Speak About AI, including digital marketing tactics, content creation, brand positioning in emerging markets, and leveraging thought leadership. Attendees will leave with actionable frameworks for marketing success in the age of artificial intelligence.",
              "duration": "45 minutes",
              "format": "Keynote"
            }
          ]'::jsonb,
          '[]',
          true,
          true
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          bio = EXCLUDED.bio,
          short_bio = EXCLUDED.short_bio,
          one_liner = EXCLUDED.one_liner,
          title = EXCLUDED.title,
          location = EXCLUDED.location,
          website = EXCLUDED.website,
          social_media = EXCLUDED.social_media,
          topics = EXCLUDED.topics,
          industries = EXCLUDED.industries,
          programs = EXCLUDED.programs,
          videos = EXCLUDED.videos,
          active = EXCLUDED.active,
          listed = EXCLUDED.listed
        RETURNING id, name, email
      `
      
      return NextResponse.json({ 
        success: true, 
        message: 'Noah created/updated successfully',
        speaker: insertResult[0] 
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Noah updated successfully',
      speaker: result[0] 
    })
    
  } catch (error) {
    console.error('Error updating Noah:', error)
    return NextResponse.json({ 
      error: 'Failed to update Noah',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}