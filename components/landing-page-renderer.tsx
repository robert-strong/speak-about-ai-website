"use client"

import { useState } from "react"
import { documentToReactComponents } from "@contentful/rich-text-react-renderer"
import { BLOCKS, INLINES } from "@contentful/rich-text-types"
import Image from "next/image"
import type { LandingPage } from "@/lib/landing-page-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { submitLandingPageForm } from "@/app/actions/submit-landing-page-form"

interface LandingPageRendererProps {
  page: LandingPage
}

const richTextOptions = {
  renderNode: {
    [BLOCKS.PARAGRAPH]: (node: any, children: any) => (
      <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>
    ),
    [BLOCKS.HEADING_1]: (node: any, children: any) => (
      <h2 className="text-4xl font-bold mb-6 text-gray-900">{children}</h2>
    ),
    [BLOCKS.HEADING_2]: (node: any, children: any) => (
      <h2 className="text-3xl font-semibold mb-4 text-gray-900">{children}</h2>
    ),
    [BLOCKS.HEADING_3]: (node: any, children: any) => (
      <h3 className="text-2xl font-semibold mb-3 text-gray-900">{children}</h3>
    ),
    [BLOCKS.UL_LIST]: (node: any, children: any) => (
      <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
    ),
    [BLOCKS.OL_LIST]: (node: any, children: any) => (
      <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>
    ),
    [BLOCKS.LIST_ITEM]: (node: any, children: any) => (
      <li className="text-gray-700">{children}</li>
    ),
    [INLINES.HYPERLINK]: (node: any, children: any) => (
      <a
        href={node.data.uri}
        className="text-blue-600 hover:text-blue-800 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
  },
}

export default function LandingPageRenderer({ page }: LandingPageRendererProps) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [expandedFaqs, setExpandedFaqs] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      // Add source URL and page title for resource delivery
      const enrichedFormData = {
        ...formData,
        sourceUrl: window.location.href,
        landingPageTitle: page.pageTitle || document.title
      }
      console.log('[LandingPageRenderer] Submitting form data:', enrichedFormData)
      // Pass form data directly to the new action
      const result = await submitLandingPageForm(enrichedFormData)
      console.log('[LandingPageRenderer] Result:', result)

      if (result.success) {
        setSubmitStatus({ type: 'success', message: '✅ Success! Check your email inbox - your resources should arrive within a few minutes.' })
        setFormData({}) // Clear form on success
      } else {
        setSubmitStatus({ type: 'error', message: result.message || 'Something went wrong. Please try again.' })
      }
    } catch (error) {
      console.error('[LandingPageRenderer] Form submission error:', error)
      console.error('[LandingPageRenderer] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      setSubmitStatus({ type: 'error', message: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleFaq = (index: string) => {
    setExpandedFaqs(prev => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {page.heroHeadline}
              </h1>
              <div className="text-xl mb-6 text-blue-100">
                {page.heroSubheadline && page.heroSubheadline.content && Array.isArray(page.heroSubheadline.content) && (
                  documentToReactComponents(page.heroSubheadline, richTextOptions)
                )}
              </div>
              {page.heroBulletPoints && Array.isArray(page.heroBulletPoints) && page.heroBulletPoints.length > 0 && (
                <ul className="space-y-3 mb-8">
                  {page.heroBulletPoints.map((point, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {page.heroImage && (
              <div className="relative h-96 lg:h-full">
                <Image
                  src={page.heroImage.fields.file?.url?.startsWith("//") 
                    ? `https:${page.heroImage.fields.file.url}` 
                    : page.heroImage.fields.file?.url || ""}
                  alt={page.heroImage.fields.description || page.heroHeadline}
                  fill
                  className="object-cover rounded-lg shadow-xl"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Form Section */}
      {page.formFields && Array.isArray(page.formFields) && page.formFields.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Get Started Today</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {page.formFields.map((field) => {
                    const fieldData = field.fields
                    return (
                      <div key={fieldData.fieldName}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {fieldData.fieldLabel}
                          {fieldData.validations?.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        {fieldData.fieldType === "textarea" ? (
                          <Textarea
                            placeholder={fieldData.placeholderText}
                            value={formData[fieldData.fieldName] || ""}
                            onChange={(e) => handleInputChange(fieldData.fieldName, e.target.value)}
                            required={fieldData.validations?.required}
                            className="w-full"
                          />
                        ) : (
                          <Input
                            type={fieldData.fieldType || "text"}
                            placeholder={fieldData.placeholderText}
                            value={formData[fieldData.fieldName] || ""}
                            onChange={(e) => handleInputChange(fieldData.fieldName, e.target.value)}
                            required={fieldData.validations?.required}
                            className="w-full"
                          />
                        )}
                        {fieldData.helpText && (
                          <p className="text-sm text-gray-500 mt-1">{fieldData.helpText}</p>
                        )}
                      </div>
                    )
                  })}
                  {submitStatus && (
                    <div className={`p-4 rounded-lg ${
                      submitStatus.type === 'success' 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {submitStatus.message}
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      {page.howItWorksSteps && Array.isArray(page.howItWorksSteps) && page.howItWorksSteps.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {page.howItWorksSteps.map((step) => {
                const stepData = step.fields
                return (
                  <Card key={stepData.stepNumber} className="text-center">
                    <CardHeader>
                      <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                        {stepData.stepNumber}
                      </div>
                      <CardTitle>{stepData.stepTitle}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{stepData.stepDescription}</p>
                      {stepData.timeEstimate && (
                        <p className="text-sm text-blue-600 mt-2 font-medium">
                          {stepData.timeEstimate}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      {page.benefitsSection && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              {documentToReactComponents(page.benefitsSection, richTextOptions)}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {page.faqSection && Array.isArray(page.faqSection) && page.faqSection.length > 0 && (
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {page.faqSection.map((faq, index) => {
                const faqData = faq.fields
                const isExpanded = expandedFaqs[index.toString()]
                return (
                  <Card key={index}>
                    <CardHeader>
                      <button
                        onClick={() => toggleFaq(index.toString())}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <CardTitle className="text-lg">{faqData.question}</CardTitle>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent>
                        <div className="prose prose-sm max-w-none">
                          {documentToReactComponents(faqData.answer, richTextOptions)}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* SEO Content Section */}
      {page.seoContent && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              {documentToReactComponents(page.seoContent, richTextOptions)}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}