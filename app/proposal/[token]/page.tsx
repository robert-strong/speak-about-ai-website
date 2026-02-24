import { getProposalByToken, trackProposalView } from "@/lib/proposals-db"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { ProposalView } from "./proposal-view"

export default async function PublicProposalPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Fetch proposal by token
  const proposal = await getProposalByToken(token)

  if (!proposal) {
    notFound()
  }

  // Track view (basic tracking, client component will handle detailed tracking)
  const headersList = await headers()
  const userAgent = headersList.get("user-agent") || ""
  const referer = headersList.get("referer") || ""

  await trackProposalView({
    proposal_id: proposal.id,
    user_agent: userAgent,
    referrer: referer,
  })

  return <ProposalView proposal={proposal} />
}