"use client"

import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, CheckCircle, XCircle, Clock, FileText, Handshake, Target } from "lucide-react"

interface DealStatusDropdownProps {
  currentStatus: string
  dealId: number
  dealName: string
  onStatusChange: (dealId: number, newStatus: string, dealName: string) => void
  disabled?: boolean
}

const DEAL_STATUSES = {
  lead: {
    label: "Lead",
    color: "bg-gray-500",
    icon: Target,
  },
  qualified: {
    label: "Qualified",
    color: "bg-blue-500",
    icon: CheckCircle,
  },
  proposal: {
    label: "Proposal",
    color: "bg-purple-500",
    icon: FileText,
  },
  negotiation: {
    label: "Negotiation",
    color: "bg-yellow-500",
    icon: Handshake,
  },
  won: {
    label: "Won",
    color: "bg-green-500",
    icon: CheckCircle,
  },
  lost: {
    label: "Lost",
    color: "bg-red-500",
    icon: XCircle,
  },
}

export function DealStatusDropdown({ 
  currentStatus, 
  dealId, 
  dealName,
  onStatusChange,
  disabled = false 
}: DealStatusDropdownProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  
  const currentStatusData = DEAL_STATUSES[currentStatus as keyof typeof DEAL_STATUSES]
  const StatusIcon = currentStatusData?.icon || Clock

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return
    
    setIsUpdating(true)
    await onStatusChange(dealId, newStatus, dealName)
    setIsUpdating(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto p-0 hover:bg-transparent"
          disabled={disabled || isUpdating}
        >
          <Badge className={`${currentStatusData?.color || 'bg-gray-500'} text-white hover:opacity-90 cursor-pointer`}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {currentStatusData?.label || currentStatus}
            <ChevronDown className="ml-1 h-3 w-3" />
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {Object.entries(DEAL_STATUSES).map(([status, data]) => {
          const Icon = data.icon
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`cursor-pointer ${status === currentStatus ? 'bg-gray-100' : ''}`}
            >
              <Icon className={`mr-2 h-4 w-4 ${status === currentStatus ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className={status === currentStatus ? 'font-semibold' : ''}>
                {data.label}
              </span>
              {status === currentStatus && (
                <CheckCircle className="ml-auto h-4 w-4 text-blue-600" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}