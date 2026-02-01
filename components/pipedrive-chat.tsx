"use client"

import { useEffect, useState } from "react"

export default function PipedriveChat() {
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return

    // Function to safely load the Pipedrive script
    const loadPipedriveScript = () => {
      try {
        // Set up Pipedrive LeadBooster configuration
        // @ts-ignore
        window.pipedriveLeadboosterConfig = {
          base: "leadbooster-chat.pipedrive.com",
          companyId: 13689122,
          playbookUuid: "591113a1-96f5-4f8e-88ca-32b9bded9c26",
          version: 2,
          // Add a random parameter to avoid caching issues
          cacheBuster: new Date().getTime(),
        }

        // Initialize LeadBooster if it doesn't exist
        // @ts-ignore
        if (!window.LeadBooster) {
          // @ts-ignore
          window.LeadBooster = {
            q: [],
            on: function (n: string, h: Function) {
              this.q.push({ t: "o", n: n, h: h })
            },
            trigger: function (n: string) {
              this.q.push({ t: "t", n: n })
            },
          }
        }

        // Load the LeadBooster script
        const script = document.createElement("script")
        script.src = "https://leadbooster-chat.pipedrive.com/assets/loader.js"
        script.async = true
        script.defer = true

        script.onload = () => {
          console.log("Pipedrive LeadBooster loaded successfully")
          setScriptLoaded(true)
        }

        script.onerror = (error) => {
          console.error("Failed to load Pipedrive LeadBooster:", error)
          setLoadError(true)
        }

        document.body.appendChild(script)

        // Cleanup function
        return () => {
          try {
            if (script.parentNode) {
              script.parentNode.removeChild(script)
            }
          } catch (e) {
            console.error("Error removing Pipedrive script:", e)
          }
        }
      } catch (error) {
        console.error("Error setting up Pipedrive chat:", error)
        setLoadError(true)
        return () => {}
      }
    }

    // Delay loading the script to ensure the DOM is fully loaded
    const timer = setTimeout(loadPipedriveScript, 2000)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  // If there was an error loading the script, don't render anything
  if (loadError) return null

  return null // This component doesn't render anything visible
}
