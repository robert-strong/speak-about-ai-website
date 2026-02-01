"use client"

import { use, useEffect, useState } from "react"
import { notFound, useRouter } from "next/navigation"
import { ProposalView } from "@/app/proposal/[token]/proposal-view"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, Edit, Send, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Proposal } from "@/lib/proposals-db"

export default function AdminProposalViewPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const resolvedParams = use(params)
  const proposalId = parseInt(resolvedParams.id)
  
  useEffect(() => {
    if (isNaN(proposalId)) {
      notFound()
      return
    }
    
    fetchProposal()
  }, [proposalId])
  
  const fetchProposal = async () => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}`)
      if (!response.ok) {
        throw new Error('Proposal not found')
      }
      const data = await response.json()
      setProposal(data)
    } catch (error) {
      console.error('Error fetching proposal:', error)
      notFound()
    } finally {
      setLoading(false)
    }
  }
  
  const handleSendProposal = async () => {
    if (!proposal) return
    
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/send`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Proposal sent to client"
        })
        // Refresh proposal data
        fetchProposal()
      } else {
        throw new Error('Failed to send proposal')
      }
    } catch (error) {
      console.error('Error sending proposal:', error)
      toast({
        title: "Error",
        description: "Failed to send proposal",
        variant: "destructive"
      })
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading proposal...</p>
      </div>
    )
  }
  
  if (!proposal) {
    return notFound()
  }
  
  const publicUrl = `${window.location.origin}/proposal/${proposal.access_token}`
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/crm?tab=proposals">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold">Proposal {proposal.proposal_number}</h1>
                <p className="text-sm text-gray-500">Admin Preview</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {proposal.status === 'draft' && (
                <Button size="sm" onClick={handleSendProposal} className="bg-green-600 hover:bg-green-700">
                  <Send className="h-4 w-4 mr-2" />
                  Send to Client
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl)
                  toast({
                    title: "Link copied",
                    description: "Proposal link copied to clipboard"
                  })
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              
              <Link href={publicUrl} target="_blank">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Public View
                </Button>
              </Link>
              
              <Link href={`/admin/proposals/${proposal.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Proposal View */}
      <div className="py-8">
        <ProposalView proposal={proposal} isPreview={true} />
      </div>
    </div>
  )
}