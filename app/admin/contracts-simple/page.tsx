"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authGet, authPost, authPut, authPatch, authDelete, authFetch } from "@/lib/auth-fetch"

export default function SimpleContractsPage() {
  const router = useRouter()
  const [deals, setDeals] = useState<any[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  const [selectedDeal, setSelectedDeal] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    title: "",
    type: "speaker",
    client_name: "",
    client_company: "",
    client_email: "",
    speaker_name: "",
    speaker_email: "",
    event_title: "",
    event_date: "",
    event_location: "",
    fee_amount: "",
    payment_terms: "Net 30",
    description: "",
    deal_id: ""
  })

  useEffect(() => {
    console.log("Component mounted, loading data...")
    loadDeals()
    loadContracts()
  }, [])

  const loadDeals = async () => {
    try {
      console.log("Loading deals...")
      setError("")
      const response = await authGet("/api/deals")
      
      if (!response.ok) {
        throw new Error(`Failed to load deals: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("Total deals loaded:", data.length)
      
      const availableDeals = data.filter((deal: any) => 
        deal.status === "won" || deal.status === "qualified" || deal.status === "proposal"
      )
      console.log("Filtered deals (won/qualified/proposal):", availableDeals.length)
      console.log("Available deals:", availableDeals)
      
      setDeals(availableDeals)
    } catch (error: any) {
      console.error("Error loading deals:", error)
      setError("Failed to load deals: " + error.message)
    }
  }

  const loadContracts = async () => {
    try {
      const response = await authGet("/api/contracts")
      if (response.ok) {
        const data = await response.json()
        setContracts(data)
      }
    } catch (error) {
      console.error("Error loading contracts:", error)
    }
  }

  const handleDealSelect = (dealId: string) => {
    console.log("Selecting deal:", dealId)
    setSelectedDeal(dealId)
    
    const deal = deals.find(d => d.id.toString() === dealId)
    if (deal) {
      console.log("Found deal, auto-filling:", deal)
      setFormData({
        ...formData,
        deal_id: dealId,
        title: `Contract for ${deal.event_title}`,
        client_name: deal.client_name || "",
        client_company: deal.company || "",
        client_email: deal.client_email || "",
        event_title: deal.event_title || "",
        event_date: deal.event_date ? deal.event_date.split('T')[0] : "",
        event_location: deal.event_location || "",
        fee_amount: deal.deal_value?.toString() || "",
        speaker_name: deal.speaker_requested || "",
        speaker_email: "",
        payment_terms: "Net 30",
        description: ""
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await authPost("/api/contracts", {
          ...formData,
          deal_id: formData.deal_id ? parseInt(formData.deal_id) : null
      })
      
      if (response.ok) {
        const contract = await response.json()
        console.log("Contract created:", contract)
        alert("Contract created successfully!")
        setShowForm(false)
        setFormData({
          title: "",
          type: "speaker",
          client_name: "",
          client_company: "",
          client_email: "",
          speaker_name: "",
          speaker_email: "",
          event_title: "",
          event_date: "",
          event_location: "",
          fee_amount: "",
          payment_terms: "Net 30",
          description: "",
          deal_id: ""
        })
        setSelectedDeal("")
        loadContracts()
      } else {
        alert("Failed to create contract")
      }
    } catch (error) {
      console.error("Error creating contract:", error)
      alert("Error creating contract")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Simple Contracts Page</h1>
      
      {/* Debug Info */}
      <div style={{ 
        backgroundColor: "#f0f0f0", 
        padding: "10px", 
        marginBottom: "20px",
        borderRadius: "5px"
      }}>
        <strong>Debug Info:</strong><br />
        Deals loaded: {deals.length}<br />
        Contracts loaded: {contracts.length}<br />
        {error && <span style={{ color: "red" }}>Error: {error}</span>}
      </div>

      {/* Toggle Form Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          padding: "10px 20px",
          backgroundColor: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginBottom: "20px"
        }}
      >
        {showForm ? "Hide Form" : "New Contract"}
      </button>

      {/* Contract Form */}
      {showForm && (
        <div style={{
          backgroundColor: "white",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "5px",
          marginBottom: "20px"
        }}>
          <h2>Create New Contract</h2>
          
          {/* DEAL SELECTION SECTION - ALWAYS VISIBLE */}
          <div style={{
            backgroundColor: "#dbeafe",
            padding: "15px",
            marginBottom: "20px",
            borderRadius: "5px",
            border: "1px solid #60a5fa"
          }}>
            <h3 style={{ marginTop: 0 }}>Link to Existing Deal (Optional)</h3>
            <p>Available deals: {deals.length}</p>
            
            <select
              value={selectedDeal}
              onChange={(e) => handleDealSelect(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "16px",
                border: "1px solid #ccc",
                borderRadius: "4px"
              }}
            >
              <option value="">-- Select a Deal ({deals.length} available) --</option>
              {deals.length > 0 ? (
                deals.map(deal => (
                  <option key={deal.id} value={deal.id}>
                    ID: {deal.id} | {deal.company} - {deal.event_title} ({deal.status}) - ${deal.deal_value}
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading deals...</option>
              )}
            </select>
            
            {selectedDeal && (
              <p style={{ color: "#059669", marginTop: "10px" }}>
                ✓ Contract will be linked to deal ID: {selectedDeal}
              </p>
            )}
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label>Contract Title*</label><br />
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>
              
              <div>
                <label>Client Name</label><br />
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>
              
              <div>
                <label>Client Company</label><br />
                <input
                  type="text"
                  value={formData.client_company}
                  onChange={(e) => setFormData({...formData, client_company: e.target.value})}
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>
              
              <div>
                <label>Client Email</label><br />
                <input
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({...formData, client_email: e.target.value})}
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>
              
              <div>
                <label>Event Title</label><br />
                <input
                  type="text"
                  value={formData.event_title}
                  onChange={(e) => setFormData({...formData, event_title: e.target.value})}
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>
              
              <div>
                <label>Fee Amount</label><br />
                <input
                  type="number"
                  value={formData.fee_amount}
                  onChange={(e) => setFormData({...formData, fee_amount: e.target.value})}
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                backgroundColor: loading ? "#ccc" : "#10b981",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Creating..." : "Create Contract"}
            </button>
          </form>
        </div>
      )}

      {/* Contracts List */}
      <div style={{
        backgroundColor: "white",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "5px"
      }}>
        <h2>Existing Contracts ({contracts.length})</h2>
        {contracts.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6" }}>
                <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Number</th>
                <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Title</th>
                <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Client</th>
                <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Deal ID</th>
                <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Status</th>
                <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map(contract => (
                <tr key={contract.id}>
                  <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{contract.contract_number}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{contract.title}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{contract.client_name || "-"}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{contract.deal_id || "None"}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{contract.status}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                    <button 
                      onClick={() => router.push(`/admin/contracts/${contract.id}`)}
                      style={{ color: "#3b82f6", cursor: "pointer", textDecoration: "underline", border: "none", background: "none" }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No contracts yet</p>
        )}
      </div>
    </div>
  )
}