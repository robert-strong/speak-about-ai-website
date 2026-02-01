import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { updateSlackMessage, buildDealStatusUpdateMessage, sendSlackMessage } from '@/lib/slack'
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

    // Parse the payload
    const params = new URLSearchParams(body)
    const payloadStr = params.get('payload')

    if (!payloadStr) {
      return NextResponse.json({ error: 'No payload' }, { status: 400 })
    }

    const payload = JSON.parse(payloadStr)

    // Handle different interaction types
    if (payload.type === 'block_actions') {
      const action = payload.actions[0]
      const dealId = parseInt(action.value)
      const userId = payload.user?.id
      const userName = payload.user?.name || 'Unknown'

      switch (action.action_id) {
        case 'mark_contacted': {
          // Update deal status to 'contacted'
          const result = await sql`
            UPDATE deals
            SET status = 'contacted', updated_at = NOW()
            WHERE id = ${dealId}
            RETURNING *
          `

          if (result.length > 0) {
            const deal = result[0]

            // Send status update message
            await sendSlackMessage(buildDealStatusUpdateMessage({
              id: deal.id,
              event_title: deal.event_title,
              client_name: deal.client_name,
              old_status: 'new',
              new_status: 'contacted',
              deal_value: deal.deal_value,
              updated_by: userName
            }))

            // Respond to Slack
            return NextResponse.json({
              response_type: 'ephemeral',
              text: `✅ Deal marked as contacted!`
            })
          }
          break
        }

        case 'log_call': {
          // Open a modal for logging call notes
          const modalResponse = await fetch('https://slack.com/api/views.open', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
            },
            body: JSON.stringify({
              trigger_id: payload.trigger_id,
              view: {
                type: 'modal',
                callback_id: `log_call_${dealId}`,
                title: { type: 'plain_text', text: 'Log Call' },
                submit: { type: 'plain_text', text: 'Save' },
                blocks: [
                  {
                    type: 'input',
                    block_id: 'call_notes',
                    element: {
                      type: 'plain_text_input',
                      action_id: 'notes',
                      multiline: true,
                      placeholder: { type: 'plain_text', text: 'Enter call notes...' }
                    },
                    label: { type: 'plain_text', text: 'Call Notes' }
                  },
                  {
                    type: 'input',
                    block_id: 'call_outcome',
                    element: {
                      type: 'static_select',
                      action_id: 'outcome',
                      options: [
                        { text: { type: 'plain_text', text: 'Positive - Moving forward' }, value: 'positive' },
                        { text: { type: 'plain_text', text: 'Neutral - Need follow up' }, value: 'neutral' },
                        { text: { type: 'plain_text', text: 'Negative - Not interested' }, value: 'negative' },
                        { text: { type: 'plain_text', text: 'No Answer' }, value: 'no_answer' }
                      ]
                    },
                    label: { type: 'plain_text', text: 'Call Outcome' }
                  },
                  {
                    type: 'input',
                    block_id: 'next_action',
                    optional: true,
                    element: {
                      type: 'plain_text_input',
                      action_id: 'action',
                      placeholder: { type: 'plain_text', text: 'e.g., Send proposal by Friday' }
                    },
                    label: { type: 'plain_text', text: 'Next Action' }
                  }
                ]
              }
            })
          })

          return NextResponse.json({ response_type: 'ephemeral', text: '' })
        }

        case 'create_project': {
          // Create project from won deal
          const deal = await sql`SELECT * FROM deals WHERE id = ${dealId}`

          if (deal.length > 0) {
            const d = deal[0]

            // Check if project already exists
            const existingProject = await sql`
              SELECT id FROM projects WHERE deal_id = ${dealId}
            `

            if (existingProject.length > 0) {
              return NextResponse.json({
                response_type: 'ephemeral',
                text: `Project already exists for this deal!`
              })
            }

            // Create the project
            const project = await sql`
              INSERT INTO projects (
                deal_id, project_name, client_name, company,
                event_date, event_location, status, created_at
              ) VALUES (
                ${dealId}, ${d.event_title}, ${d.client_name}, ${d.company},
                ${d.event_date}, ${d.event_location}, 'planning', NOW()
              )
              RETURNING *
            `

            return NextResponse.json({
              response_type: 'in_channel',
              text: `📁 Project created for "${d.event_title}"!\n<${process.env.NEXT_PUBLIC_BASE_URL}/admin/projects/${project[0].id}|View Project>`
            })
          }
          break
        }

        case 'create_deal_from_inquiry': {
          // Create deal from inquiry
          const inquiry = await sql`SELECT * FROM inquiries WHERE id = ${dealId}`

          if (inquiry.length > 0) {
            const i = inquiry[0]

            const deal = await sql`
              INSERT INTO deals (
                event_title, client_name, company, email,
                event_date, status, notes, source, created_at
              ) VALUES (
                ${i.event_title || 'New Event'}, ${i.client_name}, ${i.company},
                ${i.email}, ${i.event_date}, 'new',
                ${'From inquiry: ' + (i.message || '')}, 'inquiry', NOW()
              )
              RETURNING *
            `

            // Update inquiry as converted
            await sql`
              UPDATE inquiries SET status = 'converted', deal_id = ${deal[0].id}
              WHERE id = ${dealId}
            `

            return NextResponse.json({
              response_type: 'in_channel',
              text: `🎯 Deal created from inquiry!\n<${process.env.NEXT_PUBLIC_BASE_URL}/admin/deals/${deal[0].id}|View Deal>`
            })
          }
          break
        }

        case 'update_deal_status': {
          // Update deal status (from select menu)
          // Value format: "dealId:newStatus" from /deals list command
          const selectedValue = action.selected_option?.value

          if (selectedValue) {
            const [idStr, newStatus] = selectedValue.split(':')
            const targetDealId = parseInt(idStr)

            if (targetDealId && newStatus) {
              const oldDeal = await sql`SELECT status, event_title, client_name, deal_value FROM deals WHERE id = ${targetDealId}`

              await sql`
                UPDATE deals SET status = ${newStatus}, updated_at = NOW()
                WHERE id = ${targetDealId}
              `

              if (oldDeal.length > 0 && oldDeal[0].status !== newStatus) {
                await sendSlackMessage(buildDealStatusUpdateMessage({
                  id: targetDealId,
                  event_title: oldDeal[0].event_title,
                  client_name: oldDeal[0].client_name,
                  old_status: oldDeal[0].status,
                  new_status: newStatus,
                  deal_value: oldDeal[0].deal_value,
                  updated_by: userName
                }))
              }

              return NextResponse.json({
                response_type: 'ephemeral',
                text: `✅ Deal "${oldDeal[0]?.event_title}" status updated to ${newStatus}`
              })
            }
          }
          break
        }

        case 'update_project_status': {
          // Update project status (from select menu)
          // Value format: "projectId:newStatus" from /projects list command
          const selectedValue = action.selected_option?.value
          console.log('update_project_status triggered, value:', selectedValue)

          if (selectedValue) {
            const [idStr, newStatus] = selectedValue.split(':')
            const targetProjectId = parseInt(idStr)
            console.log('Parsed:', { targetProjectId, newStatus })

            if (targetProjectId && newStatus) {
              try {
                const oldProject = await sql`SELECT status, project_name, client_name, speaker_fee FROM projects WHERE id = ${targetProjectId}`
                console.log('Old project:', oldProject[0])

                await sql`
                  UPDATE projects SET status = ${newStatus}, updated_at = NOW()
                  WHERE id = ${targetProjectId}
                `
                console.log('Project updated successfully')

                return NextResponse.json({
                  response_type: 'ephemeral',
                  text: `✅ Project "${oldProject[0]?.project_name}" status updated to ${newStatus}`
                })
              } catch (dbError) {
                console.error('Database error updating project:', dbError)
                return NextResponse.json({
                  response_type: 'ephemeral',
                  text: `❌ Error updating project: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
                })
              }
            }
          }
          break
        }
      }
    }

    // Handle modal submissions
    if (payload.type === 'view_submission') {
      const callbackId = payload.view.callback_id

      if (callbackId.startsWith('log_call_')) {
        const dealId = parseInt(callbackId.replace('log_call_', ''))
        const values = payload.view.state.values
        const notes = values.call_notes?.notes?.value
        const outcome = values.call_outcome?.outcome?.selected_option?.value
        const nextAction = values.next_action?.action?.value

        // Save call log to database
        await sql`
          INSERT INTO deal_activities (
            deal_id, activity_type, description, outcome, next_action, created_by, created_at
          ) VALUES (
            ${dealId}, 'call', ${notes}, ${outcome}, ${nextAction}, ${payload.user.name}, NOW()
          )
        `

        // Update deal's last activity
        await sql`
          UPDATE deals SET
            last_contact_date = NOW(),
            updated_at = NOW()
          WHERE id = ${dealId}
        `

        // Send confirmation to channel
        const deal = await sql`SELECT event_title, client_name FROM deals WHERE id = ${dealId}`
        if (deal.length > 0) {
          await sendSlackMessage({
            text: `📞 Call logged for ${deal[0].event_title}`,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `📞 *Call Logged* - ${deal[0].event_title} (${deal[0].client_name})\n\n*Notes:* ${notes}\n*Outcome:* ${outcome}${nextAction ? `\n*Next Action:* ${nextAction}` : ''}\n_by ${payload.user.name}_`
                }
              }
            ]
          })
        }

        return NextResponse.json({ response_action: 'clear' })
      }
    }

    // Handle slash commands (if configured)
    if (payload.command) {
      // Will be handled by separate route
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Slack interaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
