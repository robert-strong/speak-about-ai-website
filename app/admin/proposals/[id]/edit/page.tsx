"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function EditProposalPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const proposalId = resolvedParams.id

  useEffect(() => {
    // Redirect to the proposal creation page in edit mode
    router.push(`/admin/proposals/new?edit=${proposalId}`)
  }, [proposalId, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Loading proposal editor...</p>
    </div>
  )
}