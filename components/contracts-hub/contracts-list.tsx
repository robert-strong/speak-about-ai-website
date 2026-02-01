"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  Eye,
  Edit,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  DollarSign,
  Download,
  Copy,
  ExternalLink,
  Loader2,
  Filter
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Contract {
  id: number
  contract_number: string
  title: string
  type: string
  category: string
  status: "draft" | "pending_review" | "sent_for_signature" | "partially_signed" | "fully_executed" | "active" | "completed" | "cancelled"
  deal_id?: number
  client_name: string
  client_company: string
  speaker_name?: string
  event_title: string
  event_date: string
  event_location: string
  total_amount: number
  created_date: string
  sent_date?: string
  execution_date?: string
  signatures_completed: number
  signatures_total: number
}

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-gray-500", icon: FileText },
  pending_review: { label: "Pending Review", color: "bg-yellow-500", icon: Clock },
  sent_for_signature: { label: "Sent for Signature", color: "bg-blue-500", icon: Send },
  partially_signed: { label: "Partially Signed", color: "bg-orange-500", icon: Clock },
  fully_executed: { label: "Fully Executed", color: "bg-green-500", icon: CheckCircle },
  active: { label: "Active", color: "bg-green-600", icon: CheckCircle },
  completed: { label: "Completed", color: "bg-gray-600", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500", icon: AlertTriangle }
}

interface ContractsListProps {
  onSelectContract: (contractId: number) => void
  onRefresh?: () => void
}

export function ContractsList({ onSelectContract, onRefresh }: ContractsListProps) {
  const { toast } = useToast()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")

  useEffect(() => {
    loadContracts()
  }, [])

  const loadContracts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/contracts")
      if (response.ok) {
        const data = await response.json()
        // Transform the data to match our interface
        const transformedData = data.map((contract: any) => ({
          ...contract,
          signatures_completed: contract.status === 'fully_executed' ? 2 : 
                               contract.status === 'partially_signed' ? 1 : 0,
          signatures_total: contract.speaker_name ? 2 : 1,
          client_company: contract.client_company || contract.client_name,
          total_amount: contract.total_amount || contract.deal_value || 0,
          created_date: contract.created_at || contract.generated_at
        }))
        setContracts(transformedData)
      }
    } catch (error) {
      console.error("Error loading contracts:", error)
      toast({
        title: "Error",
        description: "Failed to load contracts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (contractId: number, newStatus: Contract['status']) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Contract status updated"
        })
        loadContracts()
        onRefresh?.()
      }
    } catch (error) {
      console.error("Error updating contract:", error)
      toast({
        title: "Error",
        description: "Failed to update contract status",
        variant: "destructive"
      })
    }
  }

  const handleSendForSignature = async (contractId: number) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Contract sent for signature"
        })
        loadContracts()
        onRefresh?.()
      }
    } catch (error) {
      console.error("Error sending contract:", error)
      toast({
        title: "Error",
        description: "Failed to send contract",
        variant: "destructive"
      })
    }
  }

  const copySigningLink = async (contractId: number) => {
    const link = `${window.location.origin}/contracts/sign/${contractId}`
    await navigator.clipboard.writeText(link)
    toast({
      title: "Success",
      description: "Signing link copied to clipboard"
    })
  }

  const downloadContract = (contractId: number) => {
    window.open(`/api/contracts/${contractId}/download`, '_blank')
  }

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.event_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.speaker_name && contract.speaker_name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter
    const matchesType = typeFilter === "all" || contract.type === typeFilter
    
    let matchesDate = true
    if (dateFilter !== "all") {
      const contractDate = new Date(contract.event_date)
      const now = new Date()
      const daysDiff = Math.floor((contractDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (dateFilter === "upcoming7") matchesDate = daysDiff >= 0 && daysDiff <= 7
      else if (dateFilter === "upcoming30") matchesDate = daysDiff >= 0 && daysDiff <= 30
      else if (dateFilter === "past") matchesDate = daysDiff < 0
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDate
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading contracts...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search contracts, clients, or speakers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="sent_for_signature">Sent for Signature</SelectItem>
              <SelectItem value="partially_signed">Partially Signed</SelectItem>
              <SelectItem value="fully_executed">Fully Executed</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="speaker_agreement">Speaker Agreement</SelectItem>
              <SelectItem value="client_speaker">Client-Speaker</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="consulting">Consulting</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="upcoming7">Next 7 Days</SelectItem>
              <SelectItem value="upcoming30">Next 30 Days</SelectItem>
              <SelectItem value="past">Past Events</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contracts Table */}
      {filteredContracts.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No contracts found</h3>
          <p className="text-gray-500">
            {contracts.length === 0 
              ? "Create your first contract to get started"
              : "Try adjusting your search or filters"
            }
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract</TableHead>
                <TableHead>Client / Event</TableHead>
                <TableHead>Speaker</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Signatures</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => {
                const statusConfig = STATUS_CONFIG[contract.status]
                const StatusIcon = statusConfig.icon
                
                return (
                  <TableRow 
                    key={contract.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onSelectContract(contract.id)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{contract.contract_number}</p>
                        <p className="text-sm text-gray-500">{contract.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{contract.client_name}</span>
                        </div>
                        <p className="text-sm text-gray-500">{contract.event_title}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(contract.event_date).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contract.speaker_name ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{contract.speaker_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">TBD</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        ${contract.total_amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig.color} text-white`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {contract.signatures_completed}/{contract.signatures_total}
                        </span>
                        {contract.signatures_completed === contract.signatures_total && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onSelectContract(contract.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`/api/contracts/${contract.id}/preview`, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {contract.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSendForSignature(contract.id)}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {['sent_for_signature', 'partially_signed'].includes(contract.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copySigningLink(contract.id)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadContract(contract.id)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}