"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  FileText,
  Plus,
  Search,
  Eye,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Mail,
  User,
  Calendar,
  DollarSign,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Deal } from "@/lib/deals-db"
import { formatDateShortPST } from "@/lib/date-utils"

interface Contract {
  id: number
  deal_id: number
  contract_number: string
  title: string
  status: "draft" | "sent" | "partially_signed" | "fully_executed" | "cancelled"
  total_amount: number
  event_title: string
  event_date: string
  client_name: string
  speaker_name?: string
  generated_at: string
  sent_at?: string
  completed_at?: string
  client_signing_token?: string
  speaker_signing_token?: string
}

interface ContractFormData {
  deal_id: string
  speaker_name: string
  speaker_email: string
  speaker_fee: string
  additional_terms: string
}

const CONTRACT_STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-gray-500", icon: FileText },
  sent: { label: "Sent", color: "bg-blue-500", icon: Mail },
  partially_signed: { label: "Partially Signed", color: "bg-yellow-500", icon: Clock },
  fully_executed: { label: "Fully Executed", color: "bg-green-500", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500", icon: AlertTriangle }
}

export function ContractsManagement() {
  const { toast } = useToast()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [wonDeals, setWonDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [formData, setFormData] = useState<ContractFormData>({
    deal_id: "",
    speaker_name: "",
    speaker_email: "",
    speaker_fee: "",
    additional_terms: ""
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load contracts and won deals in parallel
      const [contractsResponse, dealsResponse] = await Promise.all([
        fetch("/api/contracts"),
        fetch("/api/deals?status=won")
      ])

      if (contractsResponse.ok) {
        const contractsData = await contractsResponse.json()
        setContracts(contractsData)
      }

      if (dealsResponse.ok) {
        const dealsData = await dealsResponse.json()
        setWonDeals(dealsData)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load contracts data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          deal_id: parseInt(formData.deal_id),
          speaker_info: {
            name: formData.speaker_name,
            email: formData.speaker_email,
            fee: parseFloat(formData.speaker_fee) || undefined
          },
          additional_terms: formData.additional_terms,
          created_by: "admin"
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Contract created successfully!"
        })
        setShowCreateForm(false)
        setFormData({
          deal_id: "",
          speaker_name: "",
          speaker_email: "",
          speaker_fee: "",
          additional_terms: ""
        })
        loadData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create contract")
      }
    } catch (error) {
      console.error("Error creating contract:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create contract",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (contractId: number, newStatus: Contract['status']) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: newStatus,
          updated_by: "admin"
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Contract status updated successfully!"
        })
        loadData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update contract")
      }
    } catch (error) {
      console.error("Error updating contract:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update contract",
        variant: "destructive"
      })
    }
  }

  const handleSendContract = async (contractId: number) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: "Contract sent to all parties for signing!"
        })
        loadData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send contract")
      }
    } catch (error) {
      console.error("Error sending contract:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send contract",
        variant: "destructive"
      })
    }
  }

  const handlePreviewContract = async (contractId: number) => {
    try {
      // Simply open the preview URL - cookies will be sent automatically
      const previewUrl = `/api/contracts/${contractId}/preview`
      window.open(previewUrl, '_blank')
    } catch (error) {
      console.error("Error opening preview:", error)
      toast({
        title: "Error",
        description: "Failed to open contract preview",
        variant: "destructive"
      })
    }
  }

  const generateSigningLink = (contract: Contract, signerType: 'client' | 'speaker') => {
    const token = signerType === 'client' ? contract.client_signing_token : contract.speaker_signing_token
    if (!token) return ''
    return `${window.location.origin}/contracts/sign/${token}`
  }

  const copySigningLink = async (contract: Contract, signerType: 'client' | 'speaker') => {
    const link = generateSigningLink(contract, signerType)
    if (link) {
      await navigator.clipboard.writeText(link)
      toast({
        title: "Success",
        description: `${signerType === 'client' ? 'Client' : 'Speaker'} signing link copied to clipboard!`
      })
    }
  }

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.event_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.speaker_name && contract.speaker_name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Get available deals for contract creation (won deals without existing contracts)
  const availableDeals = wonDeals.filter(deal => 
    !contracts.some(contract => contract.deal_id === deal.id)
  )

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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contract Management</h2>
          <p className="text-gray-600">Manage contracts and digital signatures</p>
        </div>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Contract</DialogTitle>
              <DialogDescription>
                Generate a contract from a won deal
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateContract} className="space-y-4">
              <div>
                <Label htmlFor="deal_id">Select Won Deal *</Label>
                <Select 
                  value={formData.deal_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, deal_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a won deal" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDeals.map(deal => (
                      <SelectItem key={deal.id} value={deal.id.toString()}>
                        {deal.event_title} - {deal.client_name} (${deal.deal_value.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="speaker_name">Speaker Name</Label>
                  <Input
                    id="speaker_name"
                    value={formData.speaker_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, speaker_name: e.target.value }))}
                    placeholder="Speaker full name"
                  />
                </div>
                <div>
                  <Label htmlFor="speaker_email">Speaker Email</Label>
                  <Input
                    id="speaker_email"
                    type="email"
                    value={formData.speaker_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, speaker_email: e.target.value }))}
                    placeholder="speaker@example.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="speaker_fee">Speaker Fee ($)</Label>
                <Input
                  id="speaker_fee"
                  type="number"
                  value={formData.speaker_fee}
                  onChange={(e) => setFormData(prev => ({ ...prev, speaker_fee: e.target.value }))}
                  placeholder="Enter speaker fee"
                />
              </div>

              <div>
                <Label htmlFor="additional_terms">Additional Terms (Optional)</Label>
                <Textarea
                  id="additional_terms"
                  value={formData.additional_terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, additional_terms: e.target.value }))}
                  placeholder="Any additional contract terms or conditions"
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={submitting || !formData.deal_id}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Contract"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fully Executed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contracts.filter(c => c.status === 'fully_executed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Signatures</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contracts.filter(c => ['sent', 'partially_signed'].includes(c.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Deals</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableDeals.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contracts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="partially_signed">Partially Signed</SelectItem>
                <SelectItem value="fully_executed">Fully Executed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contracts</CardTitle>
          <CardDescription>
            {filteredContracts.length} contract{filteredContracts.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No contracts found</h3>
              <p className="text-gray-500 mb-6">
                {contracts.length === 0 
                  ? "Create your first contract from a won deal"
                  : "Try adjusting your search or filters"
                }
              </p>
              {availableDeals.length > 0 && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Contract
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => {
                  const statusConfig = CONTRACT_STATUS_CONFIG[contract.status]
                  const StatusIcon = statusConfig.icon
                  
                  return (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.contract_number}</p>
                          <p className="text-sm text-gray-500">{contract.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{contract.client_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.event_title}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {formatDateShortPST(contract.event_date)}
                          </div>
                        </div>
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
                        {formatDateShortPST(contract.generated_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewContract(contract.id)}
                            title="Preview contract"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {contract.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => handleSendContract(contract.id)}
                              title="Send contract to parties for signing"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {(contract.status === 'sent' || contract.status === 'partially_signed') && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copySigningLink(contract, 'client')}
                                title="Copy client signing link"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              {contract.speaker_name && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copySigningLink(contract, 'speaker')}
                                  title="Copy speaker signing link"
                                >
                                  <User className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {availableDeals.length === 0 && contracts.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No won deals available for contract creation. Ensure you have deals marked as "won" in your CRM.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}