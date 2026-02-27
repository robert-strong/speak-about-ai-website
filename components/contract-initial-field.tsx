"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, PenLine, RotateCcw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import SignatureCanvas from "react-signature-canvas"

interface ContractInitialFieldProps {
  sectionId: string
  sectionLabel: string
  token: string
  initialData?: string
  active: boolean
  onInitialSaved: (sectionId: string, data: string) => void
}

export function ContractInitialField({
  sectionId,
  sectionLabel,
  token,
  initialData,
  active,
  onInitialSaved,
}: ContractInitialFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedData, setSavedData] = useState(initialData || "")
  const canvasRef = useRef<SignatureCanvas>(null)

  const handleSave = async () => {
    if (!canvasRef.current || canvasRef.current.isEmpty()) return

    try {
      setSaving(true)
      const data = canvasRef.current.toDataURL()

      const response = await fetch(`/api/contracts/sign/${token}/initials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_id: sectionId,
          section_label: sectionLabel,
          initial_data: data,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to save initial")
      }

      setSavedData(data)
      setIsOpen(false)
      onInitialSaved(sectionId, data)
    } catch (error) {
      console.error("Failed to save initial:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleReInitial = () => {
    setSavedData("")
    setIsOpen(true)
  }

  // If already initialed, show the saved initial
  if (savedData && !isOpen) {
    return (
      <div className="inline-flex items-center gap-2 my-2 print:hidden" id={`initial-${sectionId}`}>
        <div className="flex items-center gap-1.5 border border-green-200 bg-green-50 rounded px-2 py-1">
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          <img src={savedData} alt="Initials" className="h-5" />
        </div>
        {active && (
          <button
            onClick={handleReInitial}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
          >
            <RotateCcw className="w-3 h-3" />
            Re-initial
          </button>
        )}
      </div>
    )
  }

  // If not active (still in review mode), show disabled placeholder
  if (!active) {
    return (
      <div className="inline-flex items-center gap-2 my-2 print:hidden" id={`initial-${sectionId}`}>
        <div className="border border-dashed border-gray-300 rounded px-3 py-1.5 text-xs text-gray-400 bg-gray-50">
          <PenLine className="w-3 h-3 inline mr-1" />
          Initial Here
        </div>
      </div>
    )
  }

  // Expanded state - show canvas
  if (isOpen) {
    return (
      <div className="my-3 print:hidden" id={`initial-${sectionId}`}>
        <div className="inline-block border-2 border-blue-300 rounded-lg p-2 bg-blue-50">
          <p className="text-xs text-blue-600 mb-1 font-medium">
            Draw your initials for: {sectionLabel}
          </p>
          <div className="bg-white rounded border">
            <SignatureCanvas
              ref={canvasRef}
              canvasProps={{
                width: 200,
                height: 60,
                className: "cursor-crosshair",
              }}
              backgroundColor="white"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <CheckCircle className="w-3 h-3 mr-1" />
              )}
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => canvasRef.current?.clear()}
              className="h-7 text-xs"
            >
              Clear
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Default: clickable prompt
  return (
    <div className="inline-flex items-center gap-2 my-2 print:hidden" id={`initial-${sectionId}`}>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "border-2 border-dashed rounded px-3 py-1.5 text-xs flex items-center gap-1 transition-colors",
          "border-blue-400 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-500",
          "animate-pulse"
        )}
      >
        <PenLine className="w-3.5 h-3.5" />
        Initial Here
      </button>
    </div>
  )
}
