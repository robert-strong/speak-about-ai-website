import { getProposalByToken, trackProposalView } from "@/lib/proposals-db"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { ProposalView } from "./proposal-view"

export default async function PublicProposalPage({
  params
}: {
  params: { token: string }
}) {
  // Fetch proposal by token
  const proposal = await getProposalByToken(params.token)
  
  if (!proposal) {
    notFound()
  }
  
  // Track view (basic tracking, client component will handle detailed tracking)
  const headersList = headers()
  const userAgent = headersList.get("user-agent") || ""
  const referer = headersList.get("referer") || ""
  
  await trackProposalView({
    proposal_id: proposal.id,
    user_agent: userAgent,
    referrer: referer,
    // Note: IP address would need to be extracted from headers in production
  })
  
  return <ProposalView proposal={proposal} />
}