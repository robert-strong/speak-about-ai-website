"use client"

import { useState, useEffect } from "react"
import { authGet, authPost, authPut, authPatch, authDelete, authFetch } from "@/lib/auth-fetch"

export default function TestContractsWorkingPage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  
  useEffect(() => {
    runTests()
  }, [])
  
  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${result}`])
  }
  
  const runTests = async () => {
    // Test 1: Fetch contracts
    try {
      addResult("Testing: Fetch contracts...")
      const response = await authGet("/api/contracts")
      const data = await response.json()
      setContracts(data)
      addResult(`✅ SUCCESS: Fetched ${data.length} contracts`)
    } catch (error: any) {
      addResult(`❌ FAILED: ${error.message}`)
    }
    
    // Test 2: Create a contract
    try {
      addResult("Testing: Create new contract...")
      const response = await authPost("/api/contracts", {
        title: `Test Contract ${Date.now()}`,
        type: "speaker",
        client_name: "Test Client",
        speaker_name: "Test Speaker"
      })
      const data = await response.json()
      addResult(`✅ SUCCESS: Created contract ${data.contract_number}`)
      
      // Reload contracts
      const fetchResponse = await authGet("/api/contracts")
      const updatedData = await fetchResponse.json()
      setContracts(updatedData)
    } catch (error: any) {
      addResult(`❌ FAILED: ${error.message}`)
    }
  }
  
  const testButtonClick = () => {
    addResult("Button clicked successfully!")
  }
  
  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Contract System Test</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <button 
          onClick={testButtonClick}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            cursor: "pointer",
            marginRight: "10px"
          }}
        >
          Test Button Click
        </button>
        
        <button 
          onClick={runTests}
          style={{
            padding: "10px 20px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            cursor: "pointer"
          }}
        >
          Re-run Tests
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: "#f0f0f0", 
        padding: "10px", 
        marginBottom: "20px",
        height: "200px",
        overflow: "auto"
      }}>
        <h3>Test Results:</h3>
        {testResults.map((result, i) => (
          <div key={i}>{result}</div>
        ))}
      </div>
      
      <div style={{ backgroundColor: "#fff", padding: "10px", border: "1px solid #ddd" }}>
        <h3>Contracts in Database ({contracts.length}):</h3>
        {contracts.map((contract, i) => (
          <div key={i} style={{ marginBottom: "10px", padding: "5px", backgroundColor: "#f9f9f9" }}>
            <strong>{contract.contract_number}</strong> - {contract.title}
            <br />
            Status: {contract.status} | Type: {contract.type}
          </div>
        ))}
      </div>
    </div>
  )
}