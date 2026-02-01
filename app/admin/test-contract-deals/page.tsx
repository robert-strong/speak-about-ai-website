"use client"

import { useState, useEffect } from "react"
import { authGet, authPost, authPut, authPatch, authDelete, authFetch } from "@/lib/auth-fetch"

export default function TestContractDealsPage() {
  const [deals, setDeals] = useState<any[]>([])
  const [selectedDeal, setSelectedDeal] = useState("")
  const [formData, setFormData] = useState<any>({})
  
  useEffect(() => {
    loadDeals()
  }, [])
  
  const loadDeals = async () => {
    try {
      const response = await authGet("/api/deals")
      if (response.ok) {
        const data = await response.json()
        const availableDeals = data.filter((deal: any) => 
          deal.status === "won" || deal.status === "qualified" || deal.status === "proposal"
        )
        setDeals(availableDeals)
      }
    } catch (error) {
      console.error("Error loading deals:", error)
    }
  }
  
  const handleDealSelect = (dealId: string) => {
    setSelectedDeal(dealId)
    const deal = deals.find(d => d.id.toString() === dealId)
    if (deal) {
      setFormData({
        deal_id: dealId,
        title: `Contract for ${deal.event_title}`,
        client_name: deal.client_name,
        client_company: deal.company,
        client_email: deal.client_email,
        event_title: deal.event_title,
        event_date: deal.event_date ? deal.event_date.split('T')[0] : "",
        event_location: deal.event_location || "",
        fee_amount: deal.deal_value?.toString() || "",
        speaker_name: deal.speaker_requested || ""
      })
    }
  }
  
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Test Contract Deals Selection</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <h3>Available Deals: {deals.length}</h3>
        <select
          value={selectedDeal}
          onChange={(e) => handleDealSelect(e.target.value)}
          style={{ width: "100%", padding: "10px", fontSize: "16px" }}
        >
          <option value="">-- Select a Deal --</option>
          {deals.map(deal => (
            <option key={deal.id} value={deal.id}>
              {deal.company} - {deal.event_title} ({deal.status}) - ${deal.deal_value}
            </option>
          ))}
        </select>
      </div>
      
      {selectedDeal && (
        <div style={{ 
          backgroundColor: "#f0f0f0", 
          padding: "20px", 
          borderRadius: "8px",
          marginTop: "20px"
        }}>
          <h3>Auto-filled Form Data:</h3>
          <pre>{JSON.stringify(formData, null, 2)}</pre>
        </div>
      )}
      
      <div style={{ marginTop: "20px" }}>
        <h3>All Available Deals:</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#e0e0e0" }}>
              <th style={{ padding: "10px", border: "1px solid #ccc" }}>ID</th>
              <th style={{ padding: "10px", border: "1px solid #ccc" }}>Company</th>
              <th style={{ padding: "10px", border: "1px solid #ccc" }}>Event</th>
              <th style={{ padding: "10px", border: "1px solid #ccc" }}>Status</th>
              <th style={{ padding: "10px", border: "1px solid #ccc" }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {deals.map(deal => (
              <tr key={deal.id}>
                <td style={{ padding: "10px", border: "1px solid #ccc" }}>{deal.id}</td>
                <td style={{ padding: "10px", border: "1px solid #ccc" }}>{deal.company}</td>
                <td style={{ padding: "10px", border: "1px solid #ccc" }}>{deal.event_title}</td>
                <td style={{ padding: "10px", border: "1px solid #ccc" }}>{deal.status}</td>
                <td style={{ padding: "10px", border: "1px solid #ccc" }}>${deal.deal_value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}