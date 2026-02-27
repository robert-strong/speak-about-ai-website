"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, AlertCircle, FileText, PenTool, RotateCcw, Loader2, Printer, ArrowDown, ArrowRight, Lock } from "lucide-react"
import SignatureCanvas from "react-signature-canvas"
import { useToast } from "@/hooks/use-toast"
import { SigningProgressBar, SigningProgressSidebar, type SigningStep } from "@/components/signing-progress"
import { ContractInitialField } from "@/components/contract-initial-field"

const INITIAL_SECTIONS = [
  { id: "section-2", label: "Taxation" },
  { id: "section-3", label: "Deposit and Payment" },
  { id: "section-4", label: "Permission to Photograph and Record" },
  { id: "section-5", label: "Cancellation" },
  { id: "section-6", label: "Limitation of Liability" },
  { id: "section-7", label: "Miscellaneous" },
]

interface ContractDetail {
  id: number
  contract_number: string
  title: string
  status: string
  event_title: string
  event_date: string
  event_location: string
  client_name: string
  client_company: string
  speaker_name: string
  fee_amount: number
  deal_value: number
  contract_data: Record<string, any>
}

interface Signature {
  id: number
  signer_type: "client" | "speaker" | "admin"
  signer_name: string
  signer_email: string
  signer_title: string
  signature_data: string
  signed_at: string
}

interface ContractResponse {
  contract: ContractDetail
  signer_type: "client" | "speaker" | "admin"
  signatures: Signature[]
  can_sign: boolean
}

export default function ContractSigningPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const signatureRef = useRef<SignatureCanvas>(null)
  const contractRef = useRef<HTMLDivElement>(null)

  const [data, setData] = useState<ContractResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)

  // Enhanced signing flow state
  const [currentStep, setCurrentStep] = useState<SigningStep>("review")
  const [initials, setInitials] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    signer_name: "",
    signer_email: "",
    signer_title: ""
  })

  const token = params.token as string

  const initialsCompleted = Object.keys(initials).length
  const initialsTotal = INITIAL_SECTIONS.length
  const allInitialsComplete = initialsCompleted === initialsTotal

  useEffect(() => {
    loadContract()
  }, [token])

  // Load existing initials when contract loads
  useEffect(() => {
    if (data?.can_sign) {
      loadInitials()
    }
  }, [data?.contract?.id])

  const loadContract = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/contracts/sign/${token}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to load contract")
      setData(result)

      // Pre-fill signer info
      if (result.signer_type === "client") {
        setFormData(prev => ({
          ...prev,
          signer_name: result.contract.client_name || "",
          signer_email: result.contract.contract_data?.client_email || ""
        }))
      } else if (result.signer_type === "speaker") {
        setFormData(prev => ({
          ...prev,
          signer_name: result.contract.speaker_name || "",
          signer_email: result.contract.contract_data?.speaker_email || ""
        }))
      }

      // If already signed or can't sign, skip the flow
      if (!result.can_sign) {
        const hasClient = result.signatures.some((s: Signature) => s.signer_type === "client")
        const hasSpeaker = result.signatures.some((s: Signature) => s.signer_type === "speaker")
        if (hasClient && hasSpeaker) {
          setCurrentStep("complete")
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contract")
    } finally {
      setLoading(false)
    }
  }

  const loadInitials = async () => {
    try {
      const response = await fetch(`/api/contracts/sign/${token}/initials`)
      if (response.ok) {
        const result = await response.json()
        const initialsMap: Record<string, string> = {}
        for (const initial of result.initials) {
          initialsMap[initial.section_id] = initial.initial_data
        }
        setInitials(initialsMap)

        // If all initials already complete, advance to sign step
        if (Object.keys(initialsMap).length === INITIAL_SECTIONS.length) {
          setCurrentStep("sign")
        } else if (Object.keys(initialsMap).length > 0) {
          setCurrentStep("initial")
        }
      }
    } catch {
      // Non-fatal
    }
  }

  const handleInitialSaved = useCallback((sectionId: string, data: string) => {
    setInitials(prev => {
      const updated = { ...prev, [sectionId]: data }
      // Auto-advance to sign step when all initials done
      if (Object.keys(updated).length === INITIAL_SECTIONS.length) {
        setTimeout(() => {
          setCurrentStep("sign")
          // Scroll to signature block
          document.getElementById("signature-block")?.scrollIntoView({ behavior: "smooth", block: "center" })
        }, 500)
      }
      return updated
    })
  }, [])

  const scrollToNextUninitialedSection = () => {
    for (const section of INITIAL_SECTIONS) {
      if (!initials[section.id]) {
        document.getElementById(`initial-${section.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
        return
      }
    }
  }

  const handleSign = async () => {
    if (!data || !signatureRef.current) return

    if (!formData.signer_name || !formData.signer_email) {
      toast({ title: "Error", description: "Please fill in your name and email", variant: "destructive" })
      return
    }
    if (signatureRef.current.isEmpty()) {
      toast({ title: "Error", description: "Please draw your signature", variant: "destructive" })
      return
    }
    if (!allInitialsComplete) {
      toast({ title: "Error", description: "Please initial all required sections before signing", variant: "destructive" })
      return
    }

    try {
      setSigning(true)
      const signatureData = signatureRef.current.toDataURL()

      const response = await fetch(`/api/contracts/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signer_name: formData.signer_name,
          signer_email: formData.signer_email,
          signer_title: formData.signer_title,
          signature_data: signatureData
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to submit signature")

      setSigned(true)
      setCurrentStep("complete")
      toast({ title: "Contract Signed", description: "Your signature has been recorded." })
      await loadContract()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to submit signature",
        variant: "destructive"
      })
    } finally {
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading contract...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Access Error</CardTitle>
            <CardDescription className="text-red-700">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const { contract, signer_type, signatures, can_sign } = data
  const cd = contract.contract_data || {}
  const hasClientSig = signatures.find(s => s.signer_type === "client")
  const hasSpeakerSig = signatures.find(s => s.signer_type === "speaker")
  const isFullyExecuted = !!hasClientSig && !!hasSpeakerSig

  const dealValue = Number(cd.deal_value || contract.deal_value || contract.fee_amount || 0)
  const speakerName = cd.speaker_name || contract.speaker_name || "TBD"
  const clientName = cd.client_contact_name || contract.client_name || "TBD"
  const clientCompany = cd.client_company || contract.client_company || ""
  const eventTitle = cd.event_title || contract.event_title || "TBD"
  const eventDate = cd.event_date || (contract.event_date ? new Date(contract.event_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "TBD")
  const eventLocation = cd.event_location || contract.event_location || "TBD"
  const travelDetails = cd.travel_details || "To be determined"
  const deliverables = cd.deliverables || "- Speaking engagement as agreed upon"
  const depositPercent = cd.deposit_percent || 20
  const midPaymentPercent = cd.mid_payment_percent || 30
  const midPaymentDate = cd.mid_payment_date || "TBD"
  const balancePercent = cd.balance_percent || 50
  const balanceDueDate = cd.balance_due_date || eventDate
  const eventReference = cd.event_reference || contract.contract_number || ""

  const showSigningFlow = can_sign && !signed

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white print:py-0">
      {/* Progress Bar - Top */}
      {showSigningFlow && (
        <SigningProgressBar
          currentStep={currentStep}
          initialsCompleted={initialsCompleted}
          initialsTotal={initialsTotal}
          className="sticky top-0 z-50 shadow-sm"
        />
      )}

      <div className="flex max-w-[1200px] mx-auto">
        {/* Progress Sidebar - Desktop */}
        {showSigningFlow && (
          <SigningProgressSidebar
            currentStep={currentStep}
            initialsCompleted={initialsCompleted}
            initialsTotal={initialsTotal}
            className="pt-8 pl-4"
          />
        )}

        <div className="flex-1 py-8 px-4 print:px-0 print:py-0">
          <div className="max-w-[8.5in] mx-auto">
            {/* Print / Download Bar */}
            <div className="flex justify-between items-center mb-6 print:hidden">
              <div className="flex items-center gap-3">
                <img src="/speak-about-ai-logo.png" alt="Speak About AI" className="h-10" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Contract Signing</h1>
                  <p className="text-sm text-gray-500">
                    {signer_type === "client" ? "Client" : "Agent"} Signature Required
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-1" /> Print
                </Button>
              </div>
            </div>

            {/* Step 1: Review instruction */}
            {showSigningFlow && currentStep === "review" && (
              <Alert className="mb-6 border-blue-200 bg-blue-50 print:hidden">
                <FileText className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Step 1:</strong> Please review the contract below carefully. When ready, click "Begin Signing" to initial each section.
                </AlertDescription>
              </Alert>
            )}

            {/* Step 2: Initial instruction */}
            {showSigningFlow && currentStep === "initial" && (
              <Alert className="mb-6 border-orange-200 bg-orange-50 print:hidden">
                <PenTool className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 flex items-center justify-between">
                  <span>
                    <strong>Step 2:</strong> Initial each section ({initialsCompleted} of {initialsTotal} complete).
                    Click "Initial Here" next to each section.
                  </span>
                  {!allInitialsComplete && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={scrollToNextUninitialedSection}
                      className="ml-3 whitespace-nowrap"
                    >
                      Next Section <ArrowDown className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Signature Status Banner */}
            {!can_sign && !isFullyExecuted && (
              <Alert className="mb-6 border-yellow-200 bg-yellow-50 print:hidden">
                <CheckCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  You have already signed this contract. Waiting for the other party to sign.
                </AlertDescription>
              </Alert>
            )}
            {isFullyExecuted && currentStep !== "complete" && (
              <Alert className="mb-6 border-green-200 bg-green-50 print:hidden">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  This contract has been fully executed. Signed copies have been sent to all parties.
                </AlertDescription>
              </Alert>
            )}

            {/* Contract Document */}
            <div ref={contractRef} className="bg-white shadow-lg print:shadow-none" style={{ fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif", fontSize: "11pt", lineHeight: "1.5", padding: "0.75in 1in" }}>
              {/* Header with Logo */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <h1 style={{ fontSize: "18pt", fontWeight: "bold", margin: 0 }}>SPEAKER/CLIENT/AGENT AGREEMENT</h1>
                <img src="/speak-about-ai-logo.png" alt="Speak About AI" style={{ width: "180px", height: "auto" }} />
              </div>

              {/* Parties */}
              <div style={{ marginBottom: "8px" }}>
                <p style={{ margin: "4px 0" }}>This agreement is entered into by and between</p>
                <p style={{ marginLeft: "20px", margin: "4px 0 4px 20px" }}>a) <span style={{ color: "#2563eb", fontWeight: "bold" }}>Speak About AI</span>, a division of Strong Entertainment, LLC ("Agent" for the "Speaker"),</p>
                <p style={{ marginLeft: "20px", margin: "4px 0 4px 20px" }}>b) <span style={{ color: "#2563eb", fontWeight: "bold" }}>{speakerName}</span> ("Speaker"), and</p>
                <p style={{ marginLeft: "20px", margin: "4px 0 4px 20px" }}>c) <span style={{ color: "#2563eb", fontWeight: "bold" }}>{clientName}</span> ("Client") for the purposes of engaging the Speaker for:</p>
              </div>

              {/* Contract Details */}
              <div style={{ margin: "16px 0" }}>
                <p style={{ fontWeight: "bold" }}>Contract details:</p>
                <div style={{ marginLeft: "8px" }}>
                  <p style={{ margin: "4px 0" }}><strong>Event Reference:</strong> <span style={{ color: "#2563eb" }}>{eventReference}</span></p>
                  <p style={{ margin: "4px 0" }}><strong>Client & Name of Event:</strong> <span style={{ color: "#2563eb" }}>{clientCompany}{clientCompany && eventTitle ? " / " : ""}{eventTitle}</span></p>
                  <p style={{ margin: "4px 0" }}><strong>Date(s)/Time(s):</strong> <span style={{ color: "#2563eb" }}>Event on {eventDate}</span></p>
                  <p style={{ margin: "4px 0" }}><strong>Location(s):</strong> <span style={{ color: "#2563eb" }}>{eventLocation}</span></p>
                  <p style={{ margin: "4px 0" }}><strong>The fee and any other consideration payable to the Agent:</strong> <span style={{ color: "#2563eb" }}>${dealValue.toLocaleString("en-US")} USD</span></p>
                  <p style={{ margin: "4px 0" }}><strong>Travel:</strong> <span style={{ color: "#2563eb" }}>{travelDetails}</span></p>
                  <p style={{ fontWeight: "bold", margin: "8px 0 4px 0" }}>For that fee, the Speaker will provide:</p>
                  <ul style={{ margin: "4px 0 4px 24px", paddingLeft: 0 }}>
                    {deliverables.split("\n").filter((l: string) => l.trim()).map((line: string, i: number) => (
                      <li key={i} style={{ color: "#2563eb", fontWeight: "bold", margin: "2px 0" }}>
                        {line.replace(/^[-*]\s*/, "").trim()}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Section 2: Taxation */}
              <div style={{ margin: "20px 0" }} id="contract-section-2">
                <p style={{ textAlign: "justify" }}><strong>2. Taxation</strong> - The Speaker agrees to act as an independent contractor under the terms of this agreement and assumes all responsibility for Social Security, State, and Federal Income Tax, etc., as governed by the laws of the federal government of the United States and the Speaker's state of residence. The Client is not responsible for any additional expenses or costs.</p>
                {showSigningFlow && (
                  <ContractInitialField
                    sectionId="section-2"
                    sectionLabel="Taxation"
                    token={token}
                    initialData={initials["section-2"]}
                    active={currentStep === "initial" || currentStep === "sign"}
                    onInitialSaved={handleInitialSaved}
                  />
                )}
              </div>

              {/* Section 3: Deposit and Payment */}
              <div style={{ margin: "20px 0" }} id="contract-section-3">
                <p style={{ textAlign: "justify" }}><strong>3. Deposit and Payment</strong> - A <span style={{ color: "#2563eb", fontWeight: "bold" }}>{depositPercent}% Deposit is due at the time of execution/signing of this agreement. An additional {midPaymentPercent}% is due {midPaymentDate}, and the remaining {balancePercent}% Balance Payment is due by {balanceDueDate}</span>. All parties enter into this agreement in good faith. However, cancellation by the client shall make the client liable for the amount of the 50% deposit. If the contract is canceled by the Speaker, the Speaker and the Agent will refund all payments made.</p>
                {showSigningFlow && (
                  <ContractInitialField
                    sectionId="section-3"
                    sectionLabel="Deposit and Payment"
                    token={token}
                    initialData={initials["section-3"]}
                    active={currentStep === "initial" || currentStep === "sign"}
                    onInitialSaved={handleInitialSaved}
                  />
                )}
              </div>

              {/* Section 4: Permission to Photograph and Record */}
              <div style={{ margin: "20px 0" }} id="contract-section-4">
                <p style={{ textAlign: "justify" }}><strong>4. Permission to Photograph and Record</strong> - Any use of the Speaker's name, likeness, presentation content, or Recordings (as that term is defined in this section) for commercial purposes (and the section below marked "Permissible Use" is not considered to be commercial purposes) is expressly prohibited. No Trademark license is granted.</p>
                <p style={{ textAlign: "justify", marginTop: "12px" }}><strong>Permissible Use:</strong> All parties agree that the client may use the recorded video footage (the "Recording") of the Speaker for this Event. The Client may, without further fee or payment, use the Speaker's name and likeness for up to twelve months after the talk is delivered in marketing and promotion, but that does not suggest Speaker affiliation or endorsement. For example, the Client may share short snippets (up to 5-minute clips) from or about the event and talk that reference or include the Speaker. However, those snippets may not suggest endorsement by the speaker of the Client's products or the Client itself. The Recording in its entirety may be shared internally and with Event attendees via a private link for the 12 months after the initial airing date of <span style={{ color: "#2563eb", fontWeight: "bold" }}>{eventDate}</span>. The Client agrees that they will not use the Recording for the purpose of training artificial intelligence models or digital twins of the Speaker.</p>
                {showSigningFlow && (
                  <ContractInitialField
                    sectionId="section-4"
                    sectionLabel="Permission to Photograph and Record"
                    token={token}
                    initialData={initials["section-4"]}
                    active={currentStep === "initial" || currentStep === "sign"}
                    onInitialSaved={handleInitialSaved}
                  />
                )}
              </div>

              {/* Footer on page 1 */}
              <div style={{ textAlign: "center", fontSize: "9pt", fontWeight: "bold", borderTop: "1px solid #ccc", paddingTop: "10px", marginTop: "40px" }}>
                Speak About AI is a division of Strong Entertainment, LLC, 651 Homer Avenue, Palo Alto, CA 94301
              </div>

              {/* Section 5: Cancellation */}
              <div style={{ margin: "30px 0 20px 0" }} id="contract-section-5">
                <p style={{ textAlign: "justify" }}><strong>5. Cancellation</strong> - This contract is binding and may be canceled only if:</p>
                <div style={{ marginLeft: "20px" }}>
                  <p>a) there is a mutual agreement between the parties; or</p>
                  <p>b) by force majeure; or</p>
                  <p>c) If the Speaker is delayed by airline delay/cancellation, accident due to travel, or incapacitated due to illness; or</p>
                  <p>d) An immediate family member is stricken by serious injury, illness, or death.</p>
                </div>
                {showSigningFlow && (
                  <ContractInitialField
                    sectionId="section-5"
                    sectionLabel="Cancellation"
                    token={token}
                    initialData={initials["section-5"]}
                    active={currentStep === "initial" || currentStep === "sign"}
                    onInitialSaved={handleInitialSaved}
                  />
                )}
              </div>

              {/* Section 6: Limitation of Liability */}
              <div style={{ margin: "20px 0" }} id="contract-section-6">
                <p style={{ fontWeight: "bold" }}>6. Limitation of Liability</p>
                <p style={{ textTransform: "uppercase", fontWeight: "bold", textAlign: "justify" }}>6.1 EXCLUSION OF CERTAIN DAMAGES. NOTWITHSTANDING ANYTHING TO THE CONTRARY IN THIS AGREEMENT AND TO THE FULLEST EXTENT PERMITTED UNDER APPLICABLE LAWS, IN NO EVENT WILL EITHER PARTY BE LIABLE TO THE OTHER PARTY OR TO ANY THIRD PARTY UNDER ANY TORT, CONTRACT, NEGLIGENCE, STRICT LIABILITY, OR OTHER LEGAL OR EQUITABLE THEORY FOR (1) INDIRECT, INCIDENTAL, CONSEQUENTIAL, EXEMPLARY, REPUTATIONAL, SPECIAL OR PUNITIVE DAMAGES OF ANY KIND; (2) COSTS OF PROCUREMENT, COVER, OR SUBSTITUTE SERVICES; (3) LOSS OF USE OR CORRUPTION OF DATA, CONTENT OR INFORMATION; OR (4) LOSS OF BUSINESS OPPORTUNITIES, REVENUES, PROFITS, GOODWILL, OR SAVINGS, EVEN IF THE PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH LOSS OR DAMAGES OR SUCH OR LOSS DAMAGES COULD HAVE BEEN REASONABLY FORESEEN.</p>
                <p style={{ textTransform: "uppercase", fontWeight: "bold", textAlign: "justify", marginTop: "12px" }}>6.2 LIMITATION OF LIABILITY. NEITHER PARTY SHALL BE LIABLE FOR CUMULATIVE, AGGREGATE DAMAGES THAT EXCEED THE AMOUNT ACTUALLY PAID OR PAYABLE BY CLIENT TO SPEAKER OR AGENCY FOR THE APPLICABLE SERVICES.</p>
                {showSigningFlow && (
                  <ContractInitialField
                    sectionId="section-6"
                    sectionLabel="Limitation of Liability"
                    token={token}
                    initialData={initials["section-6"]}
                    active={currentStep === "initial" || currentStep === "sign"}
                    onInitialSaved={handleInitialSaved}
                  />
                )}
              </div>

              {/* Section 7: Miscellaneous */}
              <div style={{ margin: "20px 0" }} id="contract-section-7">
                <p style={{ textAlign: "justify" }}><strong>7. Miscellaneous</strong> - This agreement represents the entire understanding between all parties, and supersedes all prior negotiations, representations, and agreements made by or between parties. No alterations, amendments, or modifications to any of the terms and conditions of this agreement shall be valid unless made in writing and signed by each party. Any controversy, dispute, or claim shall be resolved at the request of any party to this Agreement by final and binding arbitration administered by Judicial Arbitration & Mediation Services, Inc., and judgment upon any award rendered by the arbitrator may be entered by any State or Federal Court having jurisdiction thereof. This Agreement shall be governed by California law without reference to its conflicts of law principles. Any such arbitration shall occur exclusively in the County of Santa Clara, California.</p>
                {showSigningFlow && (
                  <ContractInitialField
                    sectionId="section-7"
                    sectionLabel="Miscellaneous"
                    token={token}
                    initialData={initials["section-7"]}
                    active={currentStep === "initial" || currentStep === "sign"}
                    onInitialSaved={handleInitialSaved}
                  />
                )}
              </div>

              {/* Signature Blocks */}
              <div style={{ marginTop: "40px" }}>
                {/* Client Signature */}
                <div style={{ marginBottom: "30px", display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
                  <span>Date: <span style={{ borderBottom: "1px solid #333", display: "inline-block", minWidth: "100px", padding: "0 4px" }}>
                    {hasClientSig ? new Date(hasClientSig.signed_at).toLocaleDateString() : ""}
                  </span></span>
                  <span>Client Signature: <span style={{ borderBottom: "1px solid #333", display: "inline-block", minWidth: "200px" }}>
                    {hasClientSig?.signature_data && (
                      <img src={hasClientSig.signature_data} alt="Client Signature" style={{ height: "40px", verticalAlign: "bottom" }} />
                    )}
                  </span></span>
                  <span>Title: <span style={{ borderBottom: "1px solid #333", display: "inline-block", minWidth: "120px", padding: "0 4px" }}>
                    {hasClientSig?.signer_title || ""}
                  </span></span>
                  <span>Company: <span style={{ borderBottom: "1px solid #333", display: "inline-block", minWidth: "120px", padding: "0 4px" }}>
                    {clientCompany}
                  </span></span>
                </div>

                {/* Agent Signature */}
                <div style={{ marginBottom: "30px", display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
                  <span>Date: <span style={{ borderBottom: "1px solid #333", display: "inline-block", minWidth: "100px", padding: "0 4px" }}>
                    {hasSpeakerSig ? new Date(hasSpeakerSig.signed_at).toLocaleDateString() : ""}
                  </span></span>
                  <span>Agent Signature: <span style={{ borderBottom: "1px solid #333", display: "inline-block", minWidth: "200px" }}>
                    {hasSpeakerSig?.signature_data && (
                      <img src={hasSpeakerSig.signature_data} alt="Agent Signature" style={{ height: "40px", verticalAlign: "bottom" }} />
                    )}
                  </span></span>
                  <span>Title: <span style={{ borderBottom: "1px solid #333", display: "inline-block", minWidth: "120px", padding: "0 4px" }}>
                    {hasSpeakerSig?.signer_title || ""}
                  </span></span>
                  <span>Company: <span style={{ borderBottom: "1px solid #333", display: "inline-block", minWidth: "120px", padding: "0 4px" }}>
                    {hasSpeakerSig ? "Speak About AI" : ""}
                  </span></span>
                </div>
              </div>

              {/* Footer */}
              <div style={{ textAlign: "center", fontSize: "9pt", fontWeight: "bold", borderTop: "1px solid #ccc", paddingTop: "10px", marginTop: "40px" }}>
                Speak About AI is a division of Strong Entertainment, LLC, 651 Homer Avenue, Palo Alto, CA 94301
              </div>
            </div>

            {/* Step Navigation Buttons */}
            {showSigningFlow && currentStep === "review" && (
              <div className="mt-6 text-center print:hidden">
                <Button
                  size="lg"
                  onClick={() => {
                    setCurrentStep("initial")
                    // Scroll to first initial field
                    setTimeout(() => {
                      document.getElementById("initial-section-2")?.scrollIntoView({ behavior: "smooth", block: "center" })
                    }, 100)
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Begin Signing
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Signing Form - Below Contract */}
            <div id="signature-block">
              {showSigningFlow && (currentStep === "sign" || currentStep === "initial") && (
                <Card className={`mt-8 print:hidden ${currentStep !== "sign" ? "opacity-60" : ""}`}>
                  <CardHeader className="bg-blue-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      {currentStep === "sign" ? (
                        <PenTool className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-400" />
                      )}
                      Sign This Contract
                    </CardTitle>
                    <CardDescription>
                      {currentStep === "sign"
                        ? "All sections initialed. Please provide your information and signature below."
                        : `Please initial all ${initialsTotal} sections above before signing. (${initialsCompleted} of ${initialsTotal} done)`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="signer_name">Full Name *</Label>
                        <Input
                          id="signer_name"
                          value={formData.signer_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, signer_name: e.target.value }))}
                          placeholder="Your full name"
                          disabled={currentStep !== "sign"}
                        />
                      </div>
                      <div>
                        <Label htmlFor="signer_email">Email Address *</Label>
                        <Input
                          id="signer_email"
                          type="email"
                          value={formData.signer_email}
                          onChange={(e) => setFormData(prev => ({ ...prev, signer_email: e.target.value }))}
                          placeholder="you@example.com"
                          disabled={currentStep !== "sign"}
                        />
                      </div>
                      <div>
                        <Label htmlFor="signer_title">Title / Position</Label>
                        <Input
                          id="signer_title"
                          value={formData.signer_title}
                          onChange={(e) => setFormData(prev => ({ ...prev, signer_title: e.target.value }))}
                          placeholder="e.g., CEO, Event Manager"
                          disabled={currentStep !== "sign"}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-base font-medium mb-3 block">Your Signature *</Label>
                      <div className={`border-2 border-dashed rounded-lg p-3 ${currentStep === "sign" ? "border-gray-300 bg-gray-50" : "border-gray-200 bg-gray-100"}`}>
                        {currentStep === "sign" ? (
                          <SignatureCanvas
                            ref={signatureRef}
                            canvasProps={{
                              width: 600,
                              height: 150,
                              className: "signature-canvas bg-white rounded border w-full cursor-crosshair"
                            }}
                            backgroundColor="white"
                          />
                        ) : (
                          <div className="h-[150px] flex items-center justify-center text-gray-400">
                            <Lock className="w-5 h-5 mr-2" />
                            Complete all initials to unlock signature
                          </div>
                        )}
                      </div>
                      {currentStep === "sign" && (
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-sm text-gray-500">Draw your signature using your mouse, trackpad, or touch screen</p>
                          <Button variant="outline" size="sm" onClick={() => signatureRef.current?.clear()}>
                            <RotateCcw className="w-4 h-4 mr-1" /> Clear
                          </Button>
                        </div>
                      )}
                    </div>

                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        By signing, you acknowledge that you have read, understood, and agree to be bound by all terms and conditions of this agreement. Signed copies will be emailed to all parties.
                      </AlertDescription>
                    </Alert>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleSign}
                        disabled={signing || currentStep !== "sign"}
                        className="bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        {signing ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing...</>
                        ) : (
                          <><PenTool className="w-4 h-4 mr-2" /> Sign Contract</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Success / Complete Step */}
            {(signed || currentStep === "complete") && (
              <Card className="mt-8 border-green-200 bg-green-50 print:hidden">
                <CardContent className="pt-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-green-900 mb-2">Contract Signed Successfully</h3>
                  <p className="text-green-700 mb-4">
                    {isFullyExecuted
                      ? "All parties have signed. Fully executed copies have been emailed to everyone."
                      : "Your signature has been recorded. The other party will be notified to sign."}
                  </p>
                  {isFullyExecuted && (
                    <div className="flex justify-center gap-3 mt-4">
                      <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-1" /> Print Contract
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
