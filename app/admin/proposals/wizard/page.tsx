"use client"

import { WizardProvider, useWizard } from "@/components/proposal-wizard/wizard-context"
import { ChatAssistant } from "@/components/proposal-wizard/chat-assistant"
import { StepDealSelection } from "@/components/proposal-wizard/steps/step-deal-selection"
import { StepSpeakerSelection } from "@/components/proposal-wizard/steps/step-speaker-selection"
import { StepServices } from "@/components/proposal-wizard/steps/step-services"
import { StepReview } from "@/components/proposal-wizard/steps/step-review"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

function WizardContent() {
  const { currentStep, setCurrentStep } = useWizard()
  const router = useRouter()

  const steps = [
    { title: "Deal Selection", component: StepDealSelection },
    { title: "Speaker Selection", component: StepSpeakerSelection },
    { title: "Services & Pricing", component: StepServices },
    { title: "Review & Generate", component: StepReview }
  ]

  const CurrentStepComponent = steps[currentStep].component
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden lg:block lg:fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/admin/proposals")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Proposals
            </Button>

            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                  AI Proposal Wizard
                </h1>
                <p className="text-gray-600 mt-1">
                  Create professional proposals in minutes with AI assistance
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">
                  Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
                </p>
                <p className="text-sm text-gray-600">{Math.round(progress)}% Complete</p>
              </div>
              <Progress value={progress} className="h-2" />

              {/* Step Indicators */}
              <div className="flex justify-between mt-4">
                {steps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => idx < currentStep && setCurrentStep(idx)}
                    disabled={idx > currentStep}
                    className={`flex-1 text-xs text-center py-2 px-1 rounded transition-colors ${
                      idx === currentStep
                        ? "bg-purple-100 text-purple-900 font-semibold"
                        : idx < currentStep
                        ? "text-gray-600 hover:bg-gray-100 cursor-pointer"
                        : "text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {step.title}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Grid: Step Content + Chat Assistant */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step Content (2/3 width on large screens) */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <CurrentStepComponent />
              </Card>
            </div>

            {/* Chat Assistant (1/3 width on large screens, full width on mobile) */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 h-[calc(100vh-2rem)]">
                <ChatAssistant
                  step={currentStep}
                  totalSteps={steps.length}
                  context={{
                    currentStepTitle: steps[currentStep].title
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProposalWizardPage() {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  )
}
