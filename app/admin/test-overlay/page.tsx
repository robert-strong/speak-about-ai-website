"use client"

import { useState, useEffect } from "react"

export default function TestOverlayPage() {
  const [clickResults, setClickResults] = useState<string[]>([])
  const [overlayInfo, setOverlayInfo] = useState<string>("")

  useEffect(() => {
    // Check for overlapping elements
    const checkForOverlays = () => {
      const elements = document.querySelectorAll('*')
      const results: string[] = []
      
      elements.forEach((el) => {
        const styles = window.getComputedStyle(el)
        const zIndex = styles.zIndex
        const position = styles.position
        const pointerEvents = styles.pointerEvents
        
        // Check for high z-index elements
        if (zIndex !== 'auto' && parseInt(zIndex) > 50) {
          results.push(`Element with z-index ${zIndex}: ${el.tagName}.${el.className}`)
        }
        
        // Check for pointer-events: none
        if (pointerEvents === 'none') {
          results.push(`Pointer events disabled on: ${el.tagName}.${el.className}`)
        }
        
        // Check for fixed/absolute positioning that might overlay
        if ((position === 'fixed' || position === 'absolute') && zIndex !== 'auto') {
          const rect = el.getBoundingClientRect()
          if (rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.8) {
            results.push(`Large overlay element: ${el.tagName}.${el.className} (${position}, z-${zIndex})`)
          }
        }
      })
      
      setOverlayInfo(results.length > 0 ? results.join('\n') : 'No overlay issues detected')
    }
    
    setTimeout(checkForOverlays, 500)
  }, [])

  const testClick = (source: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setClickResults(prev => [...prev, `[${timestamp}] Click from: ${source}`])
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Overlay and Click Test</h1>
      
      {/* Test different z-index levels */}
      <div style={{ position: "relative", marginTop: "20px" }}>
        <button
          onClick={() => testClick("z-index: auto")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            cursor: "pointer",
            marginRight: "10px"
          }}
        >
          Normal Button
        </button>
        
        <button
          onClick={() => testClick("z-index: 10")}
          style={{
            position: "relative",
            zIndex: 10,
            padding: "10px 20px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            cursor: "pointer",
            marginRight: "10px"
          }}
        >
          Z-Index: 10
        </button>
        
        <button
          onClick={() => testClick("z-index: 100")}
          style={{
            position: "relative",
            zIndex: 100,
            padding: "10px 20px",
            backgroundColor: "#FF9800",
            color: "white",
            border: "none",
            cursor: "pointer",
            marginRight: "10px"
          }}
        >
          Z-Index: 100
        </button>
        
        <button
          onClick={() => testClick("z-index: 9999")}
          style={{
            position: "relative",
            zIndex: 9999,
            padding: "10px 20px",
            backgroundColor: "#9C27B0",
            color: "white",
            border: "none",
            cursor: "pointer"
          }}
        >
          Z-Index: 9999
        </button>
      </div>

      {/* Click test with event delegation */}
      <div 
        onClick={(e) => {
          const target = e.target as HTMLElement
          if (target.tagName === 'BUTTON') {
            testClick(`Delegated: ${target.textContent}`)
          }
        }}
        style={{ marginTop: "20px", padding: "20px", backgroundColor: "#f0f0f0" }}
      >
        <p>Event Delegation Test (click any button):</p>
        <button style={{ marginRight: "10px" }}>Button A</button>
        <button style={{ marginRight: "10px" }}>Button B</button>
        <button>Button C</button>
      </div>

      {/* Results display */}
      <div style={{ marginTop: "20px", padding: "20px", backgroundColor: "#fff", border: "1px solid #ddd" }}>
        <h2>Click Results:</h2>
        {clickResults.length === 0 ? (
          <p>No clicks registered yet...</p>
        ) : (
          <ul>
            {clickResults.map((result, i) => (
              <li key={i}>{result}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Overlay analysis */}
      <div style={{ marginTop: "20px", padding: "20px", backgroundColor: "#fffbf0", border: "1px solid #ffa500" }}>
        <h2>Overlay Analysis:</h2>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px" }}>
          {overlayInfo || "Analyzing..."}
        </pre>
      </div>

      {/* Direct DOM test */}
      <div style={{ marginTop: "20px" }}>
        <button
          id="domTestBtn"
          style={{
            padding: "10px 20px",
            backgroundColor: "#607D8B",
            color: "white",
            border: "none",
            cursor: "pointer"
          }}
        >
          DOM Event Test
        </button>
        <div id="domResult"></div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            const btn = document.getElementById('domTestBtn');
            const result = document.getElementById('domResult');
            if (btn && result) {
              btn.addEventListener('click', function() {
                result.innerHTML = '<p style="color: green;">DOM click worked at: ' + new Date().toLocaleTimeString() + '</p>';
              });
            }
          });
        `
      }} />
    </div>
  )
}