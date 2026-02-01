import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { requireAdminAuth } from '@/lib/auth-middleware'
import * as cheerio from 'cheerio'

const getSqlClient = () => {
  if (!process.env.DATABASE_URL) {
    console.log('Blog writer: No DATABASE_URL found')
    return null
  }
  try {
    return neon(process.env.DATABASE_URL)
  } catch (error) {
    console.error('Failed to initialize Neon client for blog writer:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authError = requireAdminAuth(request)
    if (authError) {
      return authError
    }

    // Check for Anthropic API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        error: 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your environment variables.'
      }, { status: 500 })
    }

    // Get SQL client
    const sql = getSqlClient()
    if (!sql) {
      return NextResponse.json({
        error: 'Database connection failed'
      }, { status: 500 })
    }

    // Parse request body
    const body = await request.json()
    const { semrush_url, style, selected_speakers, selected_blog_posts } = body

    if (!semrush_url) {
      return NextResponse.json({
        error: 'SEMrush URL is required'
      }, { status: 400 })
    }

    console.log('Blog writer received:', {
      semrush_url,
      style,
      selected_speakers: selected_speakers?.length || 0,
      selected_blog_posts: selected_blog_posts?.length || 0
    })

    // Fetch article from SEMrush URL
    let article = ''
    let images: string[] = []

    try {
      const response = await fetch(semrush_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      })

      if (!response.ok) {
        console.error('SEMrush fetch failed:', response.status, response.statusText)
        throw new Error(`Failed to fetch SEMrush article: ${response.status} ${response.statusText}`)
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Extract title
      const title = $('h1').first().text() || $('title').text()

      // Extract main content (adjust selectors based on SEMrush HTML structure)
      const content = $('article').html() || $('main').html() || $('body').html()

      // Extract images
      $('img').each((_, elem) => {
        const src = $(elem).attr('src')
        if (src && src.startsWith('http')) {
          images.push(src)
        }
      })

      // Build article text
      article = `# ${title}\n\n${$('<div>').html(content).text()}`

    } catch (error) {
      console.error('Error fetching SEMrush article:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json({
        error: 'Failed to fetch article from SEMrush URL',
        details: errorMessage
      }, { status: 500 })
    }

    // Get speakers - prioritize user selections, fall back to keyword search
    let allSpeakers: any[] = []

    // If user selected specific speakers, fetch those
    if (selected_speakers && selected_speakers.length > 0) {
      console.log('Fetching user-selected speakers:', selected_speakers)
      // Convert string IDs to numbers for the query
      const speakerIds = selected_speakers.map((id: string | number) =>
        typeof id === 'string' ? parseInt(id, 10) : id
      ).filter((id: number) => !isNaN(id))

      if (speakerIds.length > 0) {
        allSpeakers = await sql`
          SELECT
            id, name, bio, short_bio, one_liner, title, topics, industries, website, slug
          FROM speakers
          WHERE id = ANY(${speakerIds})
          ORDER BY featured DESC, ranking DESC
        `
        console.log(`Found ${allSpeakers.length} selected speakers`)
      }
    }

    // Fall back to keyword search if no speakers selected or found
    if (allSpeakers.length === 0) {
      const articleText = article.toLowerCase()
      const keywords = ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural', 'automation', 'robotics', 'nlp', 'computer vision', 'data science', 'tech', 'innovation', 'digital transformation', 'blockchain', 'crypto', 'web3']
      const articleKeywords = keywords.filter(kw => articleText.includes(kw))

      if (articleKeywords.length > 0) {
        const searchPattern = `%${articleKeywords[0]}%`
        allSpeakers = await sql`
          SELECT
            id, name, bio, short_bio, one_liner, title, topics, industries, website, slug
          FROM speakers
          WHERE active = true
            AND (
              LOWER(bio) LIKE ${searchPattern}
              OR LOWER(short_bio) LIKE ${searchPattern}
              OR LOWER(one_liner) LIKE ${searchPattern}
              OR LOWER(title) LIKE ${searchPattern}
              OR EXISTS (
                SELECT 1 FROM jsonb_array_elements_text(topics) topic
                WHERE LOWER(topic) LIKE ${searchPattern}
              )
            )
          ORDER BY featured DESC, ranking DESC
          LIMIT 5
        `
      }
    }

    // Build speaker context for all relevant speakers
    const speakersContext = allSpeakers.map(s => ({
      name: s.name,
      title: s.title || '',
      bio: s.short_bio || s.one_liner || s.bio?.substring(0, 200) || '',
      topics: Array.isArray(s.topics) ? s.topics.join(', ') : '',
      website: `https://speakabout.ai/speakers/${s.slug}` || s.website || ''
    }))

    // Fetch ALL speaker names from roster for cross-referencing
    let rosterSpeakers: { name: string; slug: string }[] = []
    try {
      const rosterResult = await sql`
        SELECT name, slug FROM speakers WHERE active = true OR listed = true
      `
      rosterSpeakers = rosterResult.map((s: any) => ({ name: s.name, slug: s.slug }))
      console.log(`Fetched ${rosterSpeakers.length} roster speakers for cross-referencing`)
    } catch (error) {
      console.error('Error fetching roster speakers:', error)
    }

    // Famous AI figures who can be mentioned even if not on roster
    const famousAIFigures = [
      'Sam Altman', 'Elon Musk', 'Fei-Fei Li', 'Andrew Ng', 'Yann LeCun',
      'Geoffrey Hinton', 'Demis Hassabis', 'Ilya Sutskever', 'Dario Amodei',
      'Satya Nadella', 'Sundar Pichai', 'Jensen Huang', 'Mark Zuckerberg',
      'Jeff Dean', 'Andrej Karpathy', 'Ian Goodfellow', 'Yoshua Bengio',
      'Stuart Russell', 'Nick Bostrom', 'Max Tegmark', 'Gary Marcus',
      'Timnit Gebru', 'Joy Buolamwini', 'Kate Crawford', 'Cathy O\'Neil',
      'Kai-Fu Lee', 'Mustafa Suleyman', 'Reid Hoffman', 'Peter Thiel',
      'Eric Schmidt', 'Larry Page', 'Sergey Brin', 'Bill Gates'
    ]

    // Fetch blog posts from Contentful - prioritize user selections
    let existingPosts: any[] = []
    try {
      const contentful = require('contentful')
      if (process.env.CONTENTFUL_SPACE_ID && process.env.CONTENTFUL_ACCESS_TOKEN) {
        const client = contentful.createClient({
          space: process.env.CONTENTFUL_SPACE_ID,
          accessToken: process.env.CONTENTFUL_ACCESS_TOKEN
        })

        // If user selected specific blog posts, fetch those
        if (selected_blog_posts && selected_blog_posts.length > 0) {
          console.log('Fetching user-selected blog posts:', selected_blog_posts)
          // Fetch entries that match the selected slugs
          const entries = await client.getEntries({
            content_type: 'blogPost',
            'fields.slug[in]': selected_blog_posts.join(','),
            limit: 20
          })

          existingPosts = entries.items.map((item: any) => ({
            title: item.fields.title,
            slug: item.fields.slug,
            url: `https://speakabout.ai/blog/${item.fields.slug}`
          }))
          console.log(`Found ${existingPosts.length} selected blog posts`)
        }

        // Fall back to recent posts if no selections or none found
        if (existingPosts.length === 0) {
          const entries = await client.getEntries({
            content_type: 'blogPost',
            limit: 10,
            order: '-sys.createdAt'
          })

          existingPosts = entries.items.map((item: any) => ({
            title: item.fields.title,
            slug: item.fields.slug,
            url: `https://speakabout.ai/blog/${item.fields.slug}`
          }))
        }
      }
    } catch (error) {
      console.log('Could not fetch Contentful posts:', error)
      // Continue without blog posts if Contentful fails
    }

    // Define writing style instructions
    const styleInstructions = {
      'professional': 'Write in a professional and technical tone. Use industry terminology, data-driven insights, and maintain a formal voice. Focus on credibility and expertise.',
      'conversational': 'Write in a friendly, conversational tone. Use simple language, personal anecdotes, and engaging storytelling. Make complex topics accessible.',
      'thought-leadership': 'Write as a thought leader establishing authority. Use bold statements, future predictions, and industry insights. Challenge conventional thinking.',
      'educational': 'Write in an instructive, educational tone. Break down complex concepts, use examples, and provide actionable takeaways. Focus on teaching.',
      'simple': 'Write at an 8th grade reading level. Use short sentences, simple words, and a friendly approachable tone. Avoid jargon and technical terms - explain concepts simply. Make it easy for anyone to understand.'
    }

    const styleInstruction = styleInstructions[style as keyof typeof styleInstructions] || styleInstructions.professional

    // Determine if user made specific selections
    const userSelectedSpeakers = selected_speakers && selected_speakers.length > 0
    const userSelectedPosts = selected_blog_posts && selected_blog_posts.length > 0

    // Build the prompt for Claude
    const userPrompt = `Enhance the following article with internal links to our speakers and blog posts.

ORIGINAL ARTICLE:
${article}

${images.length > 0 ? `ORIGINAL IMAGES (MUST INCLUDE THESE in markdown format):
${images.map((img, i) => `${i + 1}. ![Image ${i + 1}](${img})`).join('\n')}

IMPORTANT: Include these images at appropriate places throughout the article using markdown image syntax: ![alt text](url)

` : ''}${userSelectedSpeakers ? '⭐ USER-SELECTED SPEAKERS (MUST INCLUDE THESE):' : 'RELEVANT SPEAKERS FROM OUR ROSTER:'}
${speakersContext.map((s, i) => `${i + 1}. ${s.name} - ${s.title}
   Bio: ${s.bio}
   Topics: ${s.topics}
   Profile: ${s.website}`).join('\n\n')}

${userSelectedPosts ? '⭐ USER-SELECTED BLOG POSTS (MUST LINK TO THESE):' : 'EXISTING BLOG POSTS (link to if relevant):'}
${existingPosts.map(p => `- ${p.title}: ${p.url}`).join('\n')}

🔍 SPEAKER CROSS-REFERENCING (CRITICAL):
The original article may mention speakers/experts. You MUST cross-reference any names against our roster and famous AI figures:

OUR FULL ROSTER (${rosterSpeakers.length} speakers - link to profiles if mentioned):
${rosterSpeakers.map(s => `- ${s.name}: https://speakabout.ai/speakers/${s.slug}`).join('\n')}

FAMOUS AI FIGURES (okay to mention without links):
${famousAIFigures.join(', ')}

RULES FOR SPEAKER MENTIONS:
1. If a person is on OUR ROSTER → LINK to their profile: [Name](https://speakabout.ai/speakers/slug)
2. If a person is in FAMOUS AI FIGURES list → Keep the mention (no link needed)
3. If a person is NOT on roster AND NOT famous → REMOVE the mention entirely
4. Never invent or add speakers that weren't in the original article (unless they're user-selected)

SPEAK ABOUT AI:
- Main site: https://speakabout.ai
- Roster: 70+ AI pioneers (Siri Co-Founders, OpenAI Staff, Stanford Researchers)
- Contact: https://speakabout.ai/contact

YOUR TASK:
${userSelectedSpeakers ? `**MANDATORY SPEAKER INTEGRATIONS (${speakersContext.length} speakers - ALL MUST APPEAR):**
For EACH speaker below, add a paragraph or sentence that naturally integrates them into the article:
${speakersContext.map((s, i) => `${i + 1}. **${s.name}** - Add: "As [${s.name}](${s.website}), ${s.title}, notes: '${s.bio.substring(0, 100)}...'"`).join('\n')}

Example integration: "Industry experts like [Speaker Name](profile-url), who has extensive experience in AI ethics, emphasize the importance of..."
` : ''}
${userSelectedPosts ? `**MANDATORY BLOG POST LINKS (${existingPosts.length} posts - ALL MUST BE LINKED):**
For EACH blog post, add an inline link somewhere in the article:
${existingPosts.map((p, i) => `${i + 1}. Link to: [${p.title}](${p.url})`).join('\n')}

Example: "For more insights on this topic, see our article on [Blog Post Title](url)."
` : ''}
**CONTENT GUIDELINES:**
1. Keep the original article structure and main content
2. ADD new paragraphs or sentences to integrate speakers - don't just mention names, add context from their bios
3. ADD inline links to blog posts where relevant topics are discussed
4. Add Speak About AI branding in conclusion with CTA: "To book an AI expert for your event, visit [Speak About AI](https://speakabout.ai/contact)"
5. Preserve all images using markdown: ![alt](url)
6. NEVER invent quotes - only use information from the speaker bios provided above

**OUTPUT:** Return the COMPLETE enhanced article with all speakers mentioned and all blog posts linked.`

    // Call Anthropic Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 8000,
        system: `You are a content editor for Speak About AI, the #1 AI speaker bureau. Your job is to ENHANCE articles by integrating speaker mentions and internal links.

${userSelectedSpeakers || userSelectedPosts ? `🚨 MANDATORY REQUIREMENTS:
- You MUST add content to mention ALL ${speakersContext.length} selected speaker(s) with links to their profiles
- You MUST add links to ALL ${existingPosts.length} selected blog post(s)
- These are NON-NEGOTIABLE - the user specifically selected these items
- Add new sentences or paragraphs to naturally integrate each speaker
- Add inline links to blog posts where topics align` : ''}

🔍 SPEAKER CROSS-REFERENCING (CRITICAL):
When the original article mentions ANY person/expert by name:
1. CHECK if they're on our roster (list provided in prompt) → If YES, link to their profile
2. CHECK if they're a famous AI figure (list provided in prompt) → If YES, keep the mention
3. If they're NOT on roster AND NOT famous → REMOVE the mention entirely from the article
This ensures we only promote our speakers or well-known industry figures.

HOW TO INTEGRATE SPEAKERS:
- Add a sentence like: "As [Speaker Name](profile-url), an expert in [topic], explains: '[brief insight from their bio]'"
- Or: "Industry leaders like [Speaker Name](profile-url) have noted that..."
- Use ONLY information from the provided speaker bios - never invent quotes

HOW TO INTEGRATE BLOG POSTS:
- Add inline links: "For more on this topic, see [Article Title](url)"
- Or naturally link relevant phrases to the blog post URLs

PRESERVE:
- Original article structure and main content
- All images using markdown: ![alt](url)
- Headings, lists, and formatting

ADD:
- Speaker mentions with profile links (REQUIRED if speakers selected)
- Blog post links (REQUIRED if posts selected)
- Speak About AI CTA in conclusion

REMOVE:
- Mentions of people who are NOT on our roster AND NOT famous AI figures

Style: ${styleInstruction}`,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Anthropic API error:', error)
      return NextResponse.json({
        error: 'Failed to generate blog post'
      }, { status: 500 })
    }

    const data = await response.json()
    const blogContent = data.content[0]?.text || 'Sorry, I could not generate a blog post.'

    return NextResponse.json({
      blog: blogContent,
      images: images,
      semrush_url: semrush_url,
      speakers_mentioned: allSpeakers.length
    })

  } catch (error) {
    console.error('Blog writer error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}
