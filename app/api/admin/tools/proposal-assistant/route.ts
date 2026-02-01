import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-middleware'

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
        error: 'Anthropic API key not configured'
      }, { status: 500 })
    }

    const { message, step, context, conversationHistory } = await request.json()

    if (!message) {
      return NextResponse.json({
        error: 'Message is required'
      }, { status: 400 })
    }

    // Build system prompt based on current step
    const stepPrompts: Record<number, string> = {
      0: `You are a helpful AI assistant helping to create a speaker proposal.
The user is selecting a deal to create a proposal for. Provide guidance on which deals might be good candidates based on their urgency, budget, and clarity of requirements.`,

      1: `You are analyzing a deal to create a speaker proposal. Ask clarifying questions about:
- The main theme/topic of the event
- The preferred session format (keynote, panel, workshop, etc.)
- Any specific speaker preferences (background, expertise, style)
- Special requirements or constraints
Keep questions brief and conversational. Only ask 2-3 questions at a time.`,

      2: `You are helping select speakers for an event proposal. You have access to:
- Speaker match scores (0-100)
- Speaker expertise and topics
- Budget constraints
- Event requirements
Help explain why certain speakers are recommended, compare speakers, and answer questions about their qualifications and fit.`,

      3: `You are helping build a service package for the proposal. Suggest appropriate services based on:
- Event type and format
- Attendee count
- Speaker requirements
- Budget
Explain why certain services are recommended and help price them appropriately.`,

      4: `You are helping review and finalize the proposal. Help the user:
- Review all proposal details
- Make final adjustments
- Ensure everything is accurate
- Confirm readiness to send
Be thorough but concise.`
    }

    const systemPrompt = stepPrompts[step] || stepPrompts[0]

    // Build context string
    const contextStr = context ? `\n\nCurrent context:\n${JSON.stringify(context, null, 2)}` : ''

    // Build conversation history
    const messages = [
      {
        role: "user" as const,
        content: systemPrompt + contextStr + "\n\nUser message: " + message
      }
    ]

    // Add conversation history if available
    if (conversationHistory && conversationHistory.length > 0) {
      // Only include last 5 messages to keep context manageable
      const recentHistory = conversationHistory.slice(-5)
      recentHistory.forEach((msg: any) => {
        messages.push({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        })
      })
      messages.push({
        role: 'user' as const,
        content: message
      })
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: messages
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Claude API error:', error)
      return NextResponse.json({
        error: 'Failed to get AI response'
      }, { status: 500 })
    }

    const data = await response.json()
    const assistantResponse = data.content[0].text

    return NextResponse.json({
      response: assistantResponse,
      suggestions: [] // Can add suggested actions here
    })

  } catch (error) {
    console.error('Error in proposal assistant:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
