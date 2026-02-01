import { neon } from '@neondatabase/serverless'
import { notFound } from 'next/navigation'
import { FirmOfferClientPage } from './client-page'

const sql = neon(process.env.DATABASE_URL!)

interface Props {
  params: Promise<{ token: string }>
}

export default async function FirmOfferPage({ params }: Props) {
  const { token } = await params

  // Find firm offer by speaker access token or create from proposal
  let firmOffer = null
  let proposal = null

  // First check if this is a firm offer token (with optional proposal)
  const [existingOffer] = await sql`
    SELECT fo.*, p.title as proposal_title, p.client_name as p_client_name, p.client_email as p_client_email,
           p.speakers, p.event_title as p_event_title, p.event_date as p_event_date, p.total_investment
    FROM firm_offers fo
    LEFT JOIN proposals p ON p.id = fo.proposal_id
    WHERE fo.speaker_access_token = ${token}
  `

  if (existingOffer) {
    firmOffer = existingOffer
    // Proposal may be null if firm offer was created without one (from deal)
    if (firmOffer.proposal_id) {
      proposal = {
        id: firmOffer.proposal_id,
        title: firmOffer.proposal_title,
        client_name: firmOffer.p_client_name,
        client_email: firmOffer.p_client_email,
        speakers: firmOffer.speakers,
        event_title: firmOffer.p_event_title,
        event_date: firmOffer.p_event_date,
        total_investment: firmOffer.total_investment
      }
    }
  } else {
    // Check if this is a proposal access token
    const [proposalData] = await sql`
      SELECT * FROM proposals WHERE access_token = ${token}
    `

    if (!proposalData) {
      notFound()
    }

    proposal = proposalData

    // Check if firm offer already exists for this proposal
    const [existingFirmOffer] = await sql`
      SELECT * FROM firm_offers WHERE proposal_id = ${proposal.id}
    `

    if (existingFirmOffer) {
      firmOffer = existingFirmOffer
    }
  }

  // Get speaker info from firm offer or proposal
  const speakers = proposal?.speakers || []
  const primarySpeaker = speakers[0] || { name: 'Speaker', fee: 0 }

  // Extract data from firm offer if available
  const eventOverview = firmOffer?.event_overview || {}
  const speakerProgram = firmOffer?.speaker_program || {}
  const financialDetails = firmOffer?.financial_details || {}

  // Determine values with fallbacks
  const speakerName = speakerProgram.requested_speaker_name || primarySpeaker.name || 'Speaker'
  const speakerFee = financialDetails.speaker_fee || primarySpeaker.fee || proposal?.total_investment || 0
  const travelBuyout = financialDetails.travel_buyout_amount || 0
  const eventDate = eventOverview.event_date || proposal?.event_date
  const eventName = eventOverview.event_name || proposal?.event_title || proposal?.title
  const eventLocation = eventOverview.venue_address || ''
  const clientName = eventOverview.billing_contact?.name || proposal?.client_name
  const clientCompany = eventOverview.end_client_name || ''

  return (
    <FirmOfferClientPage
      token={token}
      proposal={proposal}
      firmOffer={firmOffer}
      speakerName={speakerName}
      speakerFee={speakerFee}
      travelBuyout={travelBuyout}
      eventDate={eventDate}
      eventName={eventName}
      eventLocation={eventLocation}
      clientName={clientName}
      clientCompany={clientCompany}
    />
  )
}
