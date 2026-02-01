"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Download, Mail } from "lucide-react"
import Link from "next/link"

function ContractSuccessContent() {
  const searchParams = useSearchParams()
  const contractNumber = searchParams.get("contract")

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Contract Signed Successfully!</CardTitle>
          <CardDescription>
            {contractNumber && `Contract ${contractNumber} has been signed`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            Thank you for signing the contract. You will receive a confirmation email 
            with a copy of the signed contract for your records.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• You'll receive an email confirmation within a few minutes</li>
              <li>• All parties will be notified of the signature</li>
              <li>• Once all parties have signed, you'll receive the fully executed contract</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Contract Copy
            </Button>
            <Link href="/" className="w-full">
              <Button variant="default" className="w-full">
                Return to Homepage
              </Button>
            </Link>
          </div>

          <p className="text-xs text-center text-gray-500 pt-4">
            If you have any questions, please contact us at contracts@speakaboutai.com
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ContractSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <ContractSuccessContent />
    </Suspense>
  )
}