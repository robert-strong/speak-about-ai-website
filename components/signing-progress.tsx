"use client"

import { CheckCircle, Circle, FileText, PenLine, PenTool, PartyPopper } from "lucide-react"
import { cn } from "@/lib/utils"

export type SigningStep = "review" | "initial" | "sign" | "complete"

interface SigningProgressProps {
  currentStep: SigningStep
  initialsCompleted: number
  initialsTotal: number
  className?: string
}

const STEPS = [
  { id: "review" as const, label: "Review Contract", icon: FileText },
  { id: "initial" as const, label: "Initial Sections", icon: PenLine },
  { id: "sign" as const, label: "Sign Agreement", icon: PenTool },
  { id: "complete" as const, label: "Complete", icon: PartyPopper },
]

function getStepIndex(step: SigningStep): number {
  return STEPS.findIndex((s) => s.id === step)
}

export function SigningProgressBar({ currentStep, initialsCompleted, initialsTotal, className }: SigningProgressProps) {
  const currentIdx = getStepIndex(currentStep)

  return (
    <div className={cn("bg-white border-b px-4 py-3 print:hidden", className)}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const isComplete = idx < currentIdx
            const isCurrent = idx === currentIdx
            const Icon = step.icon

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-initial">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                      isComplete && "bg-green-600 text-white",
                      isCurrent && "bg-blue-600 text-white",
                      !isComplete && !isCurrent && "bg-gray-200 text-gray-400"
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p
                      className={cn(
                        "text-xs font-medium",
                        isCurrent && "text-blue-600",
                        isComplete && "text-green-600",
                        !isComplete && !isCurrent && "text-gray-400"
                      )}
                    >
                      {step.label}
                    </p>
                    {step.id === "initial" && isCurrent && (
                      <p className="text-[10px] text-blue-500">
                        {initialsCompleted} of {initialsTotal}
                      </p>
                    )}
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-3",
                      idx < currentIdx ? "bg-green-400" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function SigningProgressSidebar({ currentStep, initialsCompleted, initialsTotal, className }: SigningProgressProps) {
  const currentIdx = getStepIndex(currentStep)

  return (
    <div className={cn("hidden lg:block w-64 flex-shrink-0 print:hidden", className)}>
      <div className="sticky top-24 bg-white rounded-lg border p-4 space-y-1">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Signing Progress</h3>
        {STEPS.map((step, idx) => {
          const isComplete = idx < currentIdx
          const isCurrent = idx === currentIdx
          const Icon = step.icon

          return (
            <div key={step.id}>
              <div
                className={cn(
                  "flex items-center gap-3 py-2 px-2 rounded-md",
                  isCurrent && "bg-blue-50",
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                    isComplete && "bg-green-100 text-green-600",
                    isCurrent && "bg-blue-600 text-white",
                    !isComplete && !isCurrent && "bg-gray-100 text-gray-400"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCurrent && "text-blue-700",
                      isComplete && "text-green-700",
                      !isComplete && !isCurrent && "text-gray-400"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.id === "initial" && (isCurrent || isComplete) && (
                    <p className={cn("text-xs", isComplete ? "text-green-500" : "text-blue-500")}>
                      {initialsCompleted} of {initialsTotal} sections
                    </p>
                  )}
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="ml-[22px] h-4 w-0.5 bg-gray-200" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
