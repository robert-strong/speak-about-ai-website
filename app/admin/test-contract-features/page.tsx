"use client"

import { useState } from "react"
import { authGet, authPost, authPut, authPatch, authDelete, authFetch } from "@/lib/auth-fetch"

export default function TestContractFeaturesPage() {
  const [results, setResults] = useState<string[]>([])
  const [contractId, setContractId] = useState("1")
  
  const addResult = (result: string, success: boolean = true) => {
    const icon = success ? "✅" : "❌"
    setResults(prev => [...prev, `${icon} ${result}`])
  }
  
  const testView = async () => {
    try {
      const response = await authGet(`/api/contracts/${contractId}`)
      const data = await response.json()
      addResult(`View Contract: ${data.title} (Status: ${data.status})`)
    } catch (error) {
      addResult("Failed to view contract", false)
    }
  }
  
  const testEdit = async () => {
    try {
      const response = await authPut(`/api/contracts/${contractId}`, {
        title: `Edited at ${new Date().toLocaleTimeString()}`,
        type: "speaker",
        status: "draft"
      })
      const data = await response.json()
      addResult(`Edit Contract: ${data.title}`)
    } catch (error) {
      addResult("Failed to edit contract", false)
    }
  }
  
  const testStatusUpdate = async () => {
    try {
      const response = await authFetch(`/api/contracts/${contractId}/send`, { method: "POST" })
      const data = await response.json()
      addResult(`Status Update: Contract marked as ${data.contract?.status || 'sent'}`)
    } catch (error) {
      addResult("Failed to update status", false)
    }
  }
  
  const testSign = async () => {
    try {
      const response = await authPost(`/api/contracts/${contractId}/sign`, {
          signer_name: "Test Signer",
          signer_email: "test@example.com",
          signer_role: "client"
        })
      const data = await response.json()
      addResult(`Sign Contract: ${data.signatures?.length || 0} signatures`)
    } catch (error) {
      addResult("Failed to sign contract", false)
    }
  }
  
  const testTemplates = async () => {
    try {
      const response = await authGet("/api/contracts/templates")
      const data = await response.json()
      addResult(`Templates: Found ${data.length} templates`)
    } catch (error) {
      addResult("Failed to fetch templates", false)
    }
  }
  
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Contract Features Test</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <label>Contract ID: </label>
        <input
          type="text"
          value={contractId}
          onChange={(e) => setContractId(e.target.value)}
          style={{ marginLeft: "10px", padding: "5px" }}
        />
      </div>
      
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button onClick={testView} style={buttonStyle("blue")}>
          Test View
        </button>
        <button onClick={testEdit} style={buttonStyle("green")}>
          Test Edit
        </button>
        <button onClick={testStatusUpdate} style={buttonStyle("orange")}>
          Test Send
        </button>
        <button onClick={testSign} style={buttonStyle("purple")}>
          Test Sign
        </button>
        <button onClick={testTemplates} style={buttonStyle("teal")}>
          Test Templates
        </button>
      </div>
      
      <div style={{
        backgroundColor: "#f5f5f5",
        padding: "15px",
        borderRadius: "5px",
        height: "400px",
        overflow: "auto"
      }}>
        <h3>Test Results:</h3>
        {results.length === 0 ? (
          <p>Click a test button to start...</p>
        ) : (
          results.map((result, i) => (
            <div key={i} style={{ marginBottom: "5px" }}>
              {result}
            </div>
          ))
        )}
      </div>
      
      <div style={{ marginTop: "20px" }}>
        <button 
          onClick={() => setResults([])}
          style={buttonStyle("gray")}
        >
          Clear Results
        </button>
      </div>
    </div>
  )
}

function buttonStyle(color: string) {
  const colors: Record<string, string> = {
    blue: "#2196F3",
    green: "#4CAF50",
    orange: "#FF9800",
    purple: "#9C27B0",
    teal: "#009688",
    gray: "#757575"
  }
  
  return {
    padding: "10px 20px",
    backgroundColor: colors[color] || colors.blue,
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px"
  }
}