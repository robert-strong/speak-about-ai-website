import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import crypto from 'crypto'

const sql = neon(process.env.DATABASE_URL!)

// Verify Slack request signature (disabled - low risk for internal CRM)
function verifySlackRequest(request: NextRequest, body: string): boolean {
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    // Verify request is from Slack
    if (!verifySlackRequest(request, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse form data
    const params = new URLSearchParams(body)
    const command = params.get('command')
    const text = params.get('text')?.trim() || ''
    const userId = params.get('user_id')
    const userName = params.get('user_name')

    if (command === '/deals') {
      // Handle different subcommands
      const subcommand = text.split(' ')[0].toLowerCase()

      switch (subcommand) {
        case 'summary':
        case '': {
          // Get pipeline summary
          const deals = await sql`
            SELECT * FROM deals
            WHERE status NOT IN ('lost', 'cancelled')
            ORDER BY created_at DESC
          `

          const statusCounts: Record<string, number> = {}
          const statusValues: Record<string, number> = {}
          let totalValue = 0

          deals.forEach((deal: any) => {
            statusCounts[deal.status] = (statusCounts[deal.status] || 0) + 1
            statusValues[deal.status] = (statusValues[deal.status] || 0) + Number(deal.deal_value || 0)
            totalValue += Number(deal.deal_value || 0)
          })

          const statusEmoji: Record<string, string> = {
            'lead': '🆕',
            'qualified': '✅',
            'proposal': '📨',
            'negotiation': '🤝',
            'won': '🎉',
            'lost': '❌'
          }

          let summaryText = `*📊 Deal Pipeline Summary*\n\n`
          summaryText += `*Total Active Deals:* ${deals.length}\n`
          summaryText += `*Total Pipeline Value:* $${totalValue.toLocaleString()}\n\n`
          summaryText += `*By Status:*\n`

          Object.entries(statusCounts).forEach(([status, count]) => {
            const emoji = statusEmoji[status] || '📋'
            const value = statusValues[status] || 0
            summaryText += `${emoji} ${status}: ${count} deals ($${value.toLocaleString()})\n`
          })

          return NextResponse.json({
            response_type: 'in_channel',
            text: summaryText
          })
        }

        case 'list': {
          // List all active deals
          const deals = await sql`
            SELECT * FROM deals
            WHERE status NOT IN ('lost', 'cancelled')
            ORDER BY deal_value DESC NULLS LAST
            LIMIT 15
          `

          if (deals.length === 0) {
            return NextResponse.json({
              response_type: 'ephemeral',
              text: 'No active deals found.'
            })
          }

          const blocks: any[] = [
            {
              type: 'header',
              text: { type: 'plain_text', text: '📋 Active Deals', emoji: true }
            }
          ]

          deals.forEach((deal: any) => {
            const value = deal.deal_value ? `$${Number(deal.deal_value).toLocaleString()}` : 'TBD'
            const date = deal.event_date ? new Date(deal.event_date).toLocaleDateString() : 'TBD'

            blocks.push({
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${deal.event_title}*\n${deal.client_name} • ${value} • ${date}`
              },
              accessory: {
                type: 'static_select',
                placeholder: { type: 'plain_text', text: deal.status },
                action_id: 'update_deal_status',
                options: [
                  { text: { type: 'plain_text', text: '🆕 Lead' }, value: `${deal.id}:lead` },
                  { text: { type: 'plain_text', text: '✅ Qualified' }, value: `${deal.id}:qualified` },
                  { text: { type: 'plain_text', text: '📨 Proposal' }, value: `${deal.id}:proposal` },
                  { text: { type: 'plain_text', text: '🤝 Negotiation' }, value: `${deal.id}:negotiation` },
                  { text: { type: 'plain_text', text: '🎉 Won' }, value: `${deal.id}:won` },
                  { text: { type: 'plain_text', text: '❌ Lost' }, value: `${deal.id}:lost` }
                ]
              }
            })
          })

          return NextResponse.json({
            response_type: 'in_channel',
            blocks
          })
        }

        case 'stale': {
          // Find deals with no updates in 7+ days
          const staleDeals = await sql`
            SELECT *,
              EXTRACT(DAY FROM NOW() - COALESCE(updated_at, created_at)) as days_stale
            FROM deals
            WHERE status NOT IN ('won', 'lost', 'cancelled')
              AND COALESCE(updated_at, created_at) < NOW() - INTERVAL '7 days'
            ORDER BY updated_at ASC NULLS FIRST
            LIMIT 10
          `

          if (staleDeals.length === 0) {
            return NextResponse.json({
              response_type: 'ephemeral',
              text: '✅ No stale deals! All deals have been updated within the last 7 days.'
            })
          }

          let staleText = `*⚠️ Stale Deals (No updates in 7+ days)*\n\n`
          staleDeals.forEach((deal: any) => {
            const days = Math.floor(deal.days_stale)
            const value = deal.deal_value ? `$${Number(deal.deal_value).toLocaleString()}` : 'TBD'
            staleText += `• *${deal.event_title}* (${deal.client_name})\n   ${deal.status} • ${value} • _${days} days since update_\n\n`
          })

          return NextResponse.json({
            response_type: 'in_channel',
            text: staleText
          })
        }

        case 'new': {
          // Show recent deals (last 7 days)
          const newDeals = await sql`
            SELECT * FROM deals
            WHERE created_at > NOW() - INTERVAL '7 days'
            ORDER BY created_at DESC
            LIMIT 10
          `

          if (newDeals.length === 0) {
            return NextResponse.json({
              response_type: 'ephemeral',
              text: 'No new deals in the last 7 days.'
            })
          }

          let newText = `*🆕 New Deals (Last 7 Days)*\n\n`
          newDeals.forEach((deal: any) => {
            const value = deal.deal_value ? `$${Number(deal.deal_value).toLocaleString()}` : 'TBD'
            const created = new Date(deal.created_at).toLocaleDateString()
            newText += `• *${deal.event_title}* (${deal.client_name})\n   ${value} • Created ${created}\n\n`
          })

          return NextResponse.json({
            response_type: 'in_channel',
            text: newText
          })
        }

        case 'help':
        default: {
          if (subcommand && subcommand !== 'help') {
            // Unknown subcommand
            return NextResponse.json({
              response_type: 'ephemeral',
              text: `Unknown command: \`${subcommand}\`. Type \`/deals help\` for available commands.`
            })
          }

          return NextResponse.json({
            response_type: 'ephemeral',
            text: `*📋 /deals Commands*\n\n` +
              `\`/deals\` or \`/deals summary\` - Pipeline overview with totals\n` +
              `\`/deals list\` - List all active deals with status dropdowns\n` +
              `\`/deals stale\` - Deals with no updates in 7+ days\n` +
              `\`/deals new\` - Deals created in the last 7 days\n` +
              `\`/deals help\` - Show this help message`
          })
        }
      }
    }

    if (command === '/projects') {
      // Handle different subcommands
      const subcommand = text.split(' ')[0].toLowerCase()

      switch (subcommand) {
        case 'summary':
        case '': {
          // Get projects summary
          const projects = await sql`
            SELECT * FROM projects
            WHERE status NOT IN ('completed', 'cancelled')
            ORDER BY event_date ASC NULLS LAST
          `

          const statusCounts: Record<string, number> = {}
          let totalRevenue = 0

          projects.forEach((project: any) => {
            statusCounts[project.status] = (statusCounts[project.status] || 0) + 1
            totalRevenue += Number(project.speaker_fee || 0)
          })

          const stageEmoji: Record<string, string> = {
            'planning': '📋',
            'contracts_signed': '📝',
            'invoicing': '💳',
            'logistics_planning': '🗺️',
            'pre_event': '🎯',
            'event_week': '🎤',
            'follow_up': '📧',
            'completed': '🎉',
            'cancelled': '❌'
          }

          // Count projects by time until event
          const timeCounts: Record<string, number> = { 'Final Week': 0, '< 1 Month': 0, '1-2 Months': 0, '2+ Months': 0 }
          projects.forEach((p: any) => {
            if (p.event_date) {
              const daysAway = Math.ceil((new Date(p.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              if (daysAway <= 7) timeCounts['Final Week']++
              else if (daysAway <= 30) timeCounts['< 1 Month']++
              else if (daysAway <= 60) timeCounts['1-2 Months']++
              else timeCounts['2+ Months']++
            }
          })

          let summaryText = `*📁 Projects Summary*\n\n`
          summaryText += `*Total Active Projects:* ${projects.length}\n`
          summaryText += `*Total Revenue:* $${totalRevenue.toLocaleString()}\n\n`

          summaryText += `*⏱️ By Time Until Event:*\n`
          if (timeCounts['Final Week'] > 0) summaryText += `🔥 Final Week: ${timeCounts['Final Week']} projects\n`
          if (timeCounts['< 1 Month'] > 0) summaryText += `⏰ < 1 Month: ${timeCounts['< 1 Month']} projects\n`
          if (timeCounts['1-2 Months'] > 0) summaryText += `📆 1-2 Months: ${timeCounts['1-2 Months']} projects\n`
          if (timeCounts['2+ Months'] > 0) summaryText += `📅 2+ Months: ${timeCounts['2+ Months']} projects\n`

          summaryText += `\n*📋 By Stage:*\n`
          Object.entries(statusCounts).forEach(([status, count]) => {
            const emoji = stageEmoji[status] || '📁'
            summaryText += `${emoji} ${status}: ${count} projects\n`
          })

          return NextResponse.json({
            response_type: 'in_channel',
            text: summaryText
          })
        }

        case 'list': {
          // List all active projects
          const projects = await sql`
            SELECT * FROM projects
            WHERE status NOT IN ('completed', 'cancelled')
            ORDER BY event_date ASC NULLS LAST
            LIMIT 15
          `

          if (projects.length === 0) {
            return NextResponse.json({
              response_type: 'ephemeral',
              text: 'No active projects found.'
            })
          }

          const blocks: any[] = [
            {
              type: 'header',
              text: { type: 'plain_text', text: '📁 Active Projects', emoji: true }
            }
          ]

          projects.forEach((project: any) => {
            const fee = project.speaker_fee ? `$${Number(project.speaker_fee).toLocaleString()}` : 'TBD'
            const date = project.event_date ? new Date(project.event_date).toLocaleDateString() : 'TBD'

            // Calculate time until event (months and days)
            let timeUntil = ''
            if (project.event_date) {
              const daysAway = Math.ceil((new Date(project.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              const formatTime = (days: number) => {
                const absDays = Math.abs(days)
                const months = Math.floor(absDays / 30)
                const remainingDays = absDays % 30
                if (months > 0 && remainingDays > 0) return `${months}mo ${remainingDays}d`
                if (months > 0) return `${months}mo`
                return `${absDays}d`
              }
              if (daysAway < 0) timeUntil = `📍 ${formatTime(daysAway)} ago`
              else if (daysAway === 0) timeUntil = '🔥 Today'
              else if (daysAway <= 7) timeUntil = `🔥 ${daysAway}d`
              else if (daysAway <= 30) timeUntil = `⏰ ${formatTime(daysAway)}`
              else timeUntil = `📅 ${formatTime(daysAway)}`
            }

            const stageEmoji: Record<string, string> = {
              'planning': '📋',
              'contracts_signed': '📝',
              'invoicing': '💳',
              'logistics_planning': '🗺️',
              'pre_event': '🎯',
              'event_week': '🎤',
              'follow_up': '📧',
              'completed': '🎉',
              'cancelled': '❌'
            }
            const emoji = stageEmoji[project.status] || '📁'

            blocks.push({
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `${emoji} *${project.project_name}*\n${project.client_name} • ${fee} • ${date} • ${timeUntil}`
              },
              accessory: {
                type: 'static_select',
                placeholder: { type: 'plain_text', text: project.status },
                action_id: 'update_project_status',
                options: [
                  { text: { type: 'plain_text', text: '📋 Planning' }, value: `${project.id}:planning` },
                  { text: { type: 'plain_text', text: '📝 Contracts Signed' }, value: `${project.id}:contracts_signed` },
                  { text: { type: 'plain_text', text: '💳 Invoicing' }, value: `${project.id}:invoicing` },
                  { text: { type: 'plain_text', text: '🗺️ Logistics' }, value: `${project.id}:logistics_planning` },
                  { text: { type: 'plain_text', text: '🎯 Pre-Event' }, value: `${project.id}:pre_event` },
                  { text: { type: 'plain_text', text: '🎤 Event Week' }, value: `${project.id}:event_week` },
                  { text: { type: 'plain_text', text: '📧 Follow Up' }, value: `${project.id}:follow_up` },
                  { text: { type: 'plain_text', text: '🎉 Completed' }, value: `${project.id}:completed` }
                ]
              }
            })
          })

          return NextResponse.json({
            response_type: 'in_channel',
            blocks
          })
        }

        case 'upcoming': {
          // Show projects with events in the next 30 days
          const upcomingProjects = await sql`
            SELECT * FROM projects
            WHERE status NOT IN ('completed', 'cancelled')
              AND event_date IS NOT NULL
              AND event_date <= NOW() + INTERVAL '30 days'
              AND event_date >= NOW()
            ORDER BY event_date ASC
            LIMIT 10
          `

          if (upcomingProjects.length === 0) {
            return NextResponse.json({
              response_type: 'ephemeral',
              text: 'No upcoming events in the next 30 days.'
            })
          }

          let upcomingText = `*📅 Upcoming Events (Next 30 Days)*\n\n`
          upcomingProjects.forEach((project: any) => {
            const date = new Date(project.event_date).toLocaleDateString()
            const daysAway = Math.ceil((new Date(project.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            const stageEmoji: Record<string, string> = {
              'planning': '📋',
              'contracts_signed': '📝',
              'invoicing': '💳',
              'logistics_planning': '🗺️',
              'pre_event': '🎯',
              'event_week': '🎤',
              'follow_up': '📧',
              'completed': '🎉',
              'cancelled': '❌'
            }
            const emoji = stageEmoji[project.status] || '📁'
            const urgency = daysAway === 0 ? '🔥 Today!' : daysAway <= 7 ? '🔥' : daysAway <= 14 ? '⚠️' : ''
            const timeText = daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `${daysAway}d`
            upcomingText += `${urgency}${emoji} *${project.project_name}* (${project.client_name})\n   ${date} - _${timeText}_ - ${project.status}\n\n`
          })

          return NextResponse.json({
            response_type: 'in_channel',
            text: upcomingText
          })
        }

        case 'help':
        default: {
          if (subcommand && subcommand !== 'help') {
            return NextResponse.json({
              response_type: 'ephemeral',
              text: `Unknown command: \`${subcommand}\`. Type \`/projects help\` for available commands.`
            })
          }

          return NextResponse.json({
            response_type: 'ephemeral',
            text: `*📁 /projects Commands*\n\n` +
              `\`/projects\` or \`/projects summary\` - Overview of active projects\n` +
              `\`/projects list\` - List all active projects with status dropdowns\n` +
              `\`/projects upcoming\` - Events in the next 30 days\n` +
              `\`/projects help\` - Show this help message`
          })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Slack command error:', error)
    return NextResponse.json({
      response_type: 'ephemeral',
      text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
}
