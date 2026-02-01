"use client"

import { useState } from "react"

export default function TestClickPage() {
  const [count, setCount] = useState(0)
  
  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h1>Simple Click Test (Outside Admin)</h1>
      <p style={{ fontSize: "24px", margin: "20px" }}>Count: {count}</p>
      <button 
        onClick={() => {
          console.log("Button clicked!")
          setCount(count + 1)
        }}
        style={{
          padding: "15px 30px",
          fontSize: "18px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        Click Me
      </button>
      
      <div style={{ marginTop: "40px", padding: "20px", backgroundColor: "#f0f0f0", borderRadius: "10px" }}>
        <p>If the count increases when you click the button, React event handling is working.</p>
        <p>Open browser console (F12) to see console logs.</p>
      </div>
    </div>
  )
}