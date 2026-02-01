import { neon } from '@neondatabase/serverless'
import { notFound } from 'next/navigation'
import { SpeakerReviewClient } from './client-page'

const sql = neon(process.env.DATABASE_URL!)

interface Props {
  params: Promise<{ token: string }>
}

export default async function SpeakerReviewPage({ params }: Props) {
  const { token } = await params

  // Try to find firm offer by speaker access token - first with proposal, then standalone
  let firmOffer = null

  // Try with proposal join first
  const withProposal = await sql`
    SELECT fo.*, p.title as proposal_title, p.client_name, p.client_email,
           p.client_company, p.speakers, p.event_title as proposal_event_title,
           p.event_date as proposal_event_date, p.event_location as proposal_event_location,
           p.total_investment
    FROM firm_offers fo
    JOIN proposals p ON p.id = fo.proposal_id
    WHERE fo.speaker_access_token = ${token}
  `

  if (withProposal.length > 0) {
    firmOffer = withProposal[0]
  } else {
    // Try standalone firm offer (created from deals, not proposals)
    const standalone = await sql`
      SELECT fo.*, d.event_title as deal_event_title, d.company as deal_company,
             d.client_name as deal_client_name, d.client_email as deal_client_email,
             d.event_date as deal_event_date, d.event_location as deal_event_location,
             d.speaker_requested as deal_speaker_name
      FROM firm_offers fo
      LEFT JOIN deals d ON d.firm_offer_id = fo.id
      WHERE fo.speaker_access_token = ${token}
    `
    if (standalone.length > 0) {
      firmOffer = standalone[0]
    }
  }

  if (!firmOffer) {
    notFound()
  }

  // Mark as viewed if not already
  if (!firmOffer.speaker_viewed_at) {
    await sql`
      UPDATE firm_offers
      SET speaker_viewed_at = CURRENT_TIMESTAMP,
          status = CASE WHEN status = 'sent' OR status = 'draft' OR status = 'completed' THEN 'speaker_viewed' ELSE status END
      WHERE id = ${firmOffer.id}
    `
  }

  // Get speaker name from various sources
  let speakerName = 'Speaker'
  if (firmOffer.speaker_program?.speaker_name) {
    speakerName = firmOffer.speaker_program.speaker_name
  } else if (firmOffer.speakers && firmOffer.speakers[0]) {
    speakerName = firmOffer.speakers[0].name
  } else if (firmOffer.deal_speaker_name) {
    speakerName = firmOffer.deal_speaker_name
  }

  return (
    <SpeakerReviewClient
      token={token}
      firmOffer={firmOffer}
      speakerName={speakerName}
    />
  )
}
