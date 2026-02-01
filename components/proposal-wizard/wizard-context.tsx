"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

export interface WizardData {
  // Deal info
  deal_id?: string
  client_name: string
  client_email: string
  client_company: string
  client_title?: string
  event_title: string
  event_date?: Date
  event_location: string
  event_type: string
  event_format: "in-person" | "virtual" | "hybrid"
  attendee_count: number
  budget: number

  // Clarifications
  main_theme?: string
  session_format?: string
  speaker_preferences?: string[]

  // Speakers
  selected_speakers: Array<{
    id: string
    name: string
    slug: string
    title: string
    bio: string
    fee: number
    image_url: string
    match_score?: number
    match_reasons?: string[]
  }>

  // Services
  services: Array<{
    name: string
    description: string
    price: number
    included: boolean
  }>

  // Final details
  payment_terms: string
  valid_days: number
  total_investment: number
}

interface WizardContextType {
  currentStep: number
  setCurrentStep: (step: number) => void
  wizardData: WizardData
  updateWizardData: (data: Partial<WizardData>) => void
  goToNextStep: () => void
  goToPreviousStep: () => void
  resetWizard: () => void
}

const WizardContext = createContext<WizardContextType | undefined>(undefined)

const initialData: WizardData = {
  client_name: "",
  client_email: "",
  client_company: "",
  event_title: "",
  event_location: "",
  event_type: "",
  event_format: "in-person",
  attendee_count: 0,
  budget: 0,
  selected_speakers: [],
  services: [],
  payment_terms: "50% deposit upon signing, 50% due 7 days before event",
  valid_days: 30,
  total_investment: 0
}

export function WizardProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [wizardData, setWizardData] = useState<WizardData>(initialData)

  const updateWizardData = (data: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...data }))
  }

  const goToNextStep = () => {
    setCurrentStep(prev => prev + 1)
  }

  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }

  const resetWizard = () => {
    setCurrentStep(0)
    setWizardData(initialData)
  }

  return (
    <WizardContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        wizardData,
        updateWizardData,
        goToNextStep,
        goToPreviousStep,
        resetWizard
      }}
    >
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error("useWizard must be used within WizardProvider")
  }
  return context
}
