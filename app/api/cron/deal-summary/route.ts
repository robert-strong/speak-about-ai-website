import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { sendSlackWebhook } from '@/lib/slack'

const sql = neon(process.env.DATABASE_URL!)

// This endpoint is called by Vercel Cron
// Schedule: Mon, Wed, Fri at 8am PST (4pm UTC)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active deals
    const deals = await sql`
      SELECT * FROM deals
      WHERE status NOT IN ('won', 'lost', 'cancelled')
      ORDER BY
        CASE status
          WHEN 'negotiation' THEN 1
          WHEN 'proposal_sent' THEN 2
          WHEN 'contacted' THEN 3
          WHEN 'new' THEN 4
        END,
        deal_value DESC NULLS LAST
    `

    // Get summary stats
    const stats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status NOT IN ('won', 'lost', 'cancelled')) as active_deals,
        COUNT(*) FILTER (WHERE status = 'new') as new_deals,
        COUNT(*) FILTER (WHERE status = 'negotiation') as in_negotiation,
        COALESCE(SUM(deal_value) FILTER (WHERE status NOT IN ('won', 'lost', 'cancelled')), 0) as pipeline_value,
        COALESCE(SUM(deal_value) FILTER (WHERE status = 'won' AND created_at > NOW() - INTERVAL '30 days'), 0) as won_this_month,
        COUNT(*) FILTER (WHERE status NOT IN ('won', 'lost', 'cancelled') AND COALESCE(updated_at, created_at) < NOW() - INTERVAL '7 days') as stale_count
      FROM deals
    `

    const s = stats[0]
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const today = dayNames[new Date().getDay()]

    // Build the message
    let text = `*📊 ${today} Deal Update*\n\n`
    text += `*Pipeline Overview:*\n`
    text += `• Active Deals: ${s.active_deals}\n`
    text += `• Pipeline Value: $${Number(s.pipeline_value).toLocaleString()}\n`
    text += `• In Negotiation: ${s.in_negotiation}\n`
    text += `• New Leads: ${s.new_deals}\n`
    text += `• Won This Month: $${Number(s.won_this_month).toLocaleString()}\n`

    if (Number(s.stale_count) > 0) {
      text += `\n⚠️ *${s.stale_count} deal(s) need attention* (no updates in 7+ days)\n`
    }

    // Add top deals section
    if (deals.length > 0) {
      text += `\n*🔥 Top Active Deals:*\n`
      const topDeals = deals.slice(0, 5)
      topDeals.forEach((deal: any) => {
        const value = deal.deal_value ? `$${Number(deal.deal_value).toLocaleString()}` : 'TBD'
        const statusEmoji: Record<string, string> = {
          'new': '🆕',
          'contacted': '📞',
          'proposal_sent': '📨',
          'negotiation': '🤝'
        }
        const emoji = statusEmoji[deal.status] || '📋'
        text += `${emoji} *${deal.event_title}* - ${deal.client_name} (${value})\n`
      })
    }

    text += `\n_Type \`/deals list\` to see all deals and update statuses_`

    // Send to Slack
    await sendSlackWebhook({
      text,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: '📋 View All Deals', emoji: true },
              url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/admin/deals`,
              action_id: 'view_all_deals'
            }
          ]
        }
      ]
    })

    return NextResponse.json({
      success: true,
      message: 'Deal summary sent to Slack',
      stats: s
    })
  } catch (error) {
    console.error('Cron deal summary error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
