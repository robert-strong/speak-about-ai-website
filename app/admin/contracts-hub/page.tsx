"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Users,
  Calendar,
  Download,
  Copy,
  Loader2,
  FileSignature,
  Settings,
  Save
} from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { ContractsList } from "@/components/contracts-hub/contracts-list"
import { ContractEditor } from "@/components/contracts-hub/contract-editor"
import { ContractPreview } from "@/components/contracts-hub/contract-preview"
import { ContractTemplates } from "@/components/contracts-hub/contract-templates"
import { useToast } from "@/hooks/use-toast"

interface ContractStats {
  total: number
  draft: number
  sent: number
  partially_signed: number
  fully_executed: number
  total_value: number
}

export default function ContractsHubPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ContractStats>({
    total: 0,
    draft: 0,
    sent: 0,
    partially_signed: 0,
    fully_executed: 0,
    total_value: 0
  })
  const [activeTab, setActiveTab] = useState("contracts")
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    loadStats()
  }, [router])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/contracts/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleContractSelect = (contractId: number) => {
    setSelectedContractId(contractId)
    setActiveTab("editor")
  }

  const handleCreateNew = () => {
    setSelectedContractId(null)
    setIsCreating(true)
    setActiveTab("editor")
  }

  const handleSaveComplete = () => {
    loadStats()
    setActiveTab("contracts")
    setIsCreating(false)
    toast({
      title: "Success",
      description: "Contract saved successfully"
    })
  }

  if (!isLoggedIn || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contracts hub...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>
      
      <div className="flex-1 ml-72 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <FileSignature className="w-8 h-8 text-blue-600" />
                  Contracts Hub
                </h1>
                <p className="mt-2 text-gray-600">
                  Create, manage, and track all your contracts in one place
                </p>
              </div>
              <Button 
                onClick={handleCreateNew}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Contract
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{stats.total}</span>
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Drafts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{stats.draft}</span>
                  <Edit className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{stats.sent}</span>
                  <Send className="w-5 h-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Partially Signed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{stats.partially_signed}</span>
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Fully Executed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{stats.fully_executed}</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    ${stats.total_value.toLocaleString()}
                  </span>
                  <DollarSign className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b">
                  <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
                    <TabsTrigger 
                      value="contracts" 
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Contracts
                    </TabsTrigger>
                    <TabsTrigger 
                      value="editor" 
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editor
                    </TabsTrigger>
                    <TabsTrigger 
                      value="preview" 
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger 
                      value="templates" 
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Templates
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="contracts" className="p-6">
                  <ContractsList 
                    onSelectContract={handleContractSelect}
                    onRefresh={loadStats}
                  />
                </TabsContent>

                <TabsContent value="editor" className="p-6">
                  <ContractEditor 
                    contractId={selectedContractId}
                    isCreating={isCreating}
                    onSave={handleSaveComplete}
                    onCancel={() => {
                      setActiveTab("contracts")
                      setIsCreating(false)
                    }}
                  />
                </TabsContent>

                <TabsContent value="preview" className="p-6">
                  <ContractPreview contractId={selectedContractId} />
                </TabsContent>

                <TabsContent value="templates" className="p-6">
                  <ContractTemplates />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Info Alert */}
          <Alert className="mt-8 border-blue-200 bg-blue-50">
            <FileSignature className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Contracts Hub Features</AlertTitle>
            <AlertDescription className="text-blue-700">
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p>• Create contracts from templates or deals</p>
                  <p>• Edit contract terms with live preview</p>
                  <p>• Track signature status in real-time</p>
                </div>
                <div className="space-y-1">
                  <p>• Send contracts for digital signature</p>
                  <p>• Manage contract templates</p>
                  <p>• Export contracts as PDF</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}