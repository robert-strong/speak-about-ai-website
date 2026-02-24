// Slack Integration for CRM
// Supports: Incoming Webhooks, Bot Messages, Interactive Components

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID || '#deals'

export interface SlackMessage {
  text: string
  blocks?: SlackBlock[]
  attachments?: SlackAttachment[]
  channel?: string
  thread_ts?: string
}

export interface SlackBlock {
  type: string
  text?: {
    type: string
    text: string
    emoji?: boolean
  }
  elements?: any[]
  accessory?: any
  fields?: any[]
  block_id?: string
}

export interface SlackAttachment {
  color?: string
  title?: string
  text?: string
  fields?: { title: string; value: string; short?: boolean }[]
  footer?: string
  ts?: number
}

// Send message via Incoming Webhook (simplest, one-way)
export async function sendSlackWebhook(message: SlackMessage): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('SLACK_WEBHOOK_URL not configured')
    return false
  }

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })

    if (!response.ok) {
      console.error('Slack webhook error:', await response.text())
      return false
    }

    return true
  } catch (error) {
    console.error('Slack webhook error:', error)
    return false
  }
}

// Send message via Bot API (supports channels, threads, reactions)
export async function sendSlackMessage(message: SlackMessage): Promise<{ ok: boolean; ts?: string }> {
  if (!SLACK_BOT_TOKEN) {
    console.warn('SLACK_BOT_TOKEN not configured')
    return { ok: false }
  }

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`
      },
      body: JSON.stringify({
        channel: message.channel || SLACK_CHANNEL_ID,
        text: message.text,
        blocks: message.blocks,
        attachments: message.attachments,
        thread_ts: message.thread_ts
      })
    })

    const data = await response.json()

    if (!data.ok) {
      console.error('Slack API error:', data.error)
      return { ok: false }
    }

    return { ok: true, ts: data.ts }
  } catch (error) {
    console.error('Slack API error:', error)
    return { ok: false }
  }
}

// Update an existing message
export async function updateSlackMessage(
  channel: string,
  ts: string,
  message: Partial<SlackMessage>
): Promise<boolean> {
  if (!SLACK_BOT_TOKEN) return false

  try {
    const response = await fetch('https://slack.com/api/chat.update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`
      },
      body: JSON.stringify({
        channel,
        ts,
        text: message.text,
        blocks: message.blocks,
        attachments: message.attachments
      })
    })

    const data = await response.json()
    return data.ok
  } catch (error) {
    console.error('Slack update error:', error)
    return false
  }
}

// ===== CRM-Specific Message Builders =====

export function buildNewDealMessage(deal: {
  id: number
  event_title: string
  client_name: string
  company?: string
  deal_value?: number
  event_date?: string
  speaker_name?: string
  status?: string
}): SlackMessage {
  const value = deal.deal_value ? `$${Number(deal.deal_value).toLocaleString()}` : 'TBD'
  const date = deal.event_date ? new Date(deal.event_date).toLocaleDateString() : 'TBD'

  return {
    text: `New Deal: ${deal.event_title}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎯 New Deal Created',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Event:*\n${deal.event_title}` },
          { type: 'mrkdwn', text: `*Client:*\n${deal.client_name}${deal.company ? ` (${deal.company})` : ''}` },
          { type: 'mrkdwn', text: `*Value:*\n${value}` },
          { type: 'mrkdwn', text: `*Date:*\n${date}` },
          { type: 'mrkdwn', text: `*Speaker:*\n${deal.speaker_name || 'Not assigned'}` },
          { type: 'mrkdwn', text: `*Status:*\n${deal.status || 'New'}` }
        ]
      },
      {
        type: 'actions',
        block_id: `deal_actions_${deal.id}`,
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '📋 View Deal', emoji: true },
            url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/admin/deals/${deal.id}`,
            action_id: 'view_deal'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '✅ Mark Contacted', emoji: true },
            style: 'primary',
            action_id: 'mark_contacted',
            value: String(deal.id)
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '📞 Log Call', emoji: true },
            action_id: 'log_call',
            value: String(deal.id)
          }
        ]
      }
    ]
  }
}

export function buildDealStatusUpdateMessage(deal: {
  id: number
  event_title: string
  client_name: string
  old_status: string
  new_status: string
  deal_value?: number
  updated_by?: string
}): SlackMessage {
  const statusEmoji: Record<string, string> = {
    'new': '🆕',
    'contacted': '📞',
    'proposal_sent': '📨',
    'negotiation': '🤝',
    'won': '🎉',
    'lost': '❌',
    'cancelled': '🚫'
  }

  const emoji = statusEmoji[deal.new_status] || '📋'
  const value = deal.deal_value ? `$${Number(deal.deal_value).toLocaleString()}` : ''

  return {
    text: `Deal Updated: ${deal.event_title} → ${deal.new_status}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *${deal.event_title}* ${value}\n${deal.client_name}\n\n_Status changed: ${deal.old_status} → *${deal.new_status}*_${deal.updated_by ? `\nby ${deal.updated_by}` : ''}`
        },
        accessory: {
          type: 'button',
          text: { type: 'plain_text', text: 'View', emoji: true },
          url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/admin/deals/${deal.id}`,
          action_id: 'view_deal'
        }
      }
    ]
  }
}

export function buildDealWonMessage(deal: {
  id: number
  event_title: string
  client_name: string
  company?: string
  deal_value?: number
  speaker_name?: string
  event_date?: string
}): SlackMessage {
  const value = deal.deal_value ? `$${Number(deal.deal_value).toLocaleString()}` : 'TBD'

  return {
    text: `🎉 Deal Won: ${deal.event_title}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎉 DEAL WON!',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${deal.event_title}*\n${deal.client_name}${deal.company ? ` • ${deal.company}` : ''}`
        }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Deal Value:*\n${value}` },
          { type: 'mrkdwn', text: `*Speaker:*\n${deal.speaker_name || 'TBD'}` },
          { type: 'mrkdwn', text: `*Event Date:*\n${deal.event_date ? new Date(deal.event_date).toLocaleDateString() : 'TBD'}` }
        ]
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: '🚀 Time to create the project and send contracts!' }
        ]
      },
      {
        type: 'actions',
        block_id: `deal_won_${deal.id}`,
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '📁 Create Project', emoji: true },
            style: 'primary',
            action_id: 'create_project',
            value: String(deal.id)
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '📄 Send Contract', emoji: true },
            action_id: 'send_contract',
            value: String(deal.id)
          }
        ]
      }
    ]
  }
}

export function buildNewInquiryMessage(inquiry: {
  id: number
  client_name: string
  email: string
  company?: string
  event_title?: string
  event_date?: string
  message?: string
  speaker_name?: string
}): SlackMessage {
  return {
    text: `New Inquiry from ${inquiry.client_name}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📬 New Inquiry',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*From:*\n${inquiry.client_name}` },
          { type: 'mrkdwn', text: `*Email:*\n${inquiry.email}` },
          { type: 'mrkdwn', text: `*Company:*\n${inquiry.company || 'N/A'}` },
          { type: 'mrkdwn', text: `*Event:*\n${inquiry.event_title || 'N/A'}` },
          { type: 'mrkdwn', text: `*Date:*\n${inquiry.event_date ? new Date(inquiry.event_date).toLocaleDateString() : 'TBD'}` },
          { type: 'mrkdwn', text: `*Speaker Interest:*\n${inquiry.speaker_name || 'General'}` }
        ]
      },
      ...(inquiry.message ? [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Message:*\n>${inquiry.message.substring(0, 500)}${inquiry.message.length > 500 ? '...' : ''}`
        }
      }] : []),
      {
        type: 'actions',
        block_id: `inquiry_actions_${inquiry.id}`,
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '🎯 Create Deal', emoji: true },
            style: 'primary',
            action_id: 'create_deal_from_inquiry',
            value: String(inquiry.id)
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '📧 Reply', emoji: true },
            action_id: 'reply_to_inquiry',
            value: String(inquiry.id)
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '🗑️ Archive', emoji: true },
            action_id: 'archive_inquiry',
            value: String(inquiry.id)
          }
        ]
      }
    ]
  }
}

// Daily/Weekly summary message
export function buildDealsSummaryMessage(summary: {
  total_deals: number
  new_deals: number
  deals_won: number
  deals_lost: number
  total_value: number
  pipeline_value: number
  top_deals: { event_title: string; client_name: string; value: number; status: string }[]
}): SlackMessage {
  return {
    text: `CRM Summary: ${summary.total_deals} deals, ${summary.deals_won} won`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📊 CRM Daily Summary',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Total Active Deals:*\n${summary.total_deals}` },
          { type: 'mrkdwn', text: `*New This Week:*\n${summary.new_deals}` },
          { type: 'mrkdwn', text: `*Won:*\n${summary.deals_won} 🎉` },
          { type: 'mrkdwn', text: `*Lost:*\n${summary.deals_lost}` },
          { type: 'mrkdwn', text: `*Total Won Value:*\n$${summary.total_value.toLocaleString()}` },
          { type: 'mrkdwn', text: `*Pipeline Value:*\n$${summary.pipeline_value.toLocaleString()}` }
        ]
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*🔥 Top Deals in Pipeline:*\n' + summary.top_deals.map(d =>
            `• ${d.event_title} (${d.client_name}) - $${d.value.toLocaleString()} - _${d.status}_`
          ).join('\n')
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
  }
}

// Notify about deals needing attention
export function buildDealsNeedingAttentionMessage(deals: {
  id: number
  event_title: string
  client_name: string
  days_stale: number
  status: string
}[]): SlackMessage {
  return {
    text: `⚠️ ${deals.length} deals need attention`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '⚠️ Deals Needing Attention',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: deals.map(d =>
            `• *${d.event_title}* (${d.client_name})\n   _${d.status}_ - No updates for ${d.days_stale} days`
          ).join('\n\n')
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '📋 Review Stale Deals', emoji: true },
            style: 'primary',
            url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/admin/deals?filter=stale`,
            action_id: 'view_stale_deals'
          }
        ]
      }
    ]
  }
}

// ===== Project-Specific Message Builders =====

export function buildProjectStatusUpdateMessage(project: {
  id: number
  project_name: string
  client_name: string
  old_status: string
  new_status: string
  speaker_fee?: number
  event_date?: string
  updated_by?: string
}): SlackMessage {
  const statusEmoji: Record<string, string> = {
    'qualified': '🎯',
    'proposal': '📋',
    'contracts_signed': '📝',
    'logistics_planning': '🗂️',
    'pre_event': '🎯',
    'event_week': '🎤',
    'follow_up': '📧',
    'completed': '🎉',
    'cancelled': '🚫',
    'on_hold': '⏸️'
  }

  const emoji = statusEmoji[project.new_status] || '📁'
  const fee = project.speaker_fee ? `$${Number(project.speaker_fee).toLocaleString()}` : ''

  return {
    text: `Project Updated: ${project.project_name} → ${project.new_status}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *${project.project_name}* ${fee}\n${project.client_name}\n\n_Status changed: ${project.old_status} → *${project.new_status}*_${project.updated_by ? `\nby ${project.updated_by}` : ''}`
        },
        accessory: {
          type: 'button',
          text: { type: 'plain_text', text: 'View', emoji: true },
          url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/admin/projects/${project.id}`,
          action_id: 'view_project'
        }
      }
    ]
  }
}

export function buildProjectCompletedMessage(project: {
  id: number
  project_name: string
  client_name: string
  company?: string
  speaker_fee?: number
  speaker_name?: string
  event_date?: string
}): SlackMessage {
  const fee = project.speaker_fee ? `$${Number(project.speaker_fee).toLocaleString()}` : 'N/A'

  return {
    text: `🎉 Project Completed: ${project.project_name}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎉 PROJECT COMPLETED!',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${project.project_name}*\n${project.client_name}${project.company ? ` • ${project.company}` : ''}`
        }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Speaker Fee:*\n${fee}` },
          { type: 'mrkdwn', text: `*Speaker:*\n${project.speaker_name || 'N/A'}` },
          { type: 'mrkdwn', text: `*Event Date:*\n${project.event_date ? new Date(project.event_date).toLocaleDateString() : 'N/A'}` }
        ]
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: '✨ Great job team! Time to follow up for feedback and referrals.' }
        ]
      },
      {
        type: 'actions',
        block_id: `project_completed_${project.id}`,
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '📋 View Project', emoji: true },
            url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/admin/projects/${project.id}`,
            action_id: 'view_project'
          }
        ]
      }
    ]
  }
}

export function buildProjectsSummaryMessage(summary: {
  total_projects: number
  by_status: Record<string, number>
  upcoming_events: { project_name: string; client_name: string; event_date: string; status: string }[]
  total_revenue: number
}): SlackMessage {
  const statusEmoji: Record<string, string> = {
    'qualified': '🎯',
    'proposal': '📋',
    'contracts_signed': '📝',
    'logistics_planning': '🗂️',
    'pre_event': '🎯',
    'event_week': '🎤',
    'follow_up': '📧',
    'completed': '🎉',
    'cancelled': '🚫',
    'on_hold': '⏸️'
  }

  const statusBreakdown = Object.entries(summary.by_status)
    .map(([status, count]) => `${statusEmoji[status] || '📁'} ${status}: ${count}`)
    .join('\n')

  const upcomingText = summary.upcoming_events.length > 0
    ? summary.upcoming_events.map(p =>
        `• *${p.project_name}* (${p.client_name}) - ${new Date(p.event_date).toLocaleDateString()}`
      ).join('\n')
    : '_No upcoming events_'

  return {
    text: `Projects Summary: ${summary.total_projects} active projects`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📁 Projects Summary',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Total Active:*\n${summary.total_projects}` },
          { type: 'mrkdwn', text: `*Total Revenue:*\n$${summary.total_revenue.toLocaleString()}` }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*By Status:*\n${statusBreakdown}`
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📅 Upcoming Events:*\n${upcomingText}`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '📋 View All Projects', emoji: true },
            url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/admin/projects`,
            action_id: 'view_all_projects'
          }
        ]
      }
    ]
  }
}
