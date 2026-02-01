"use client"

import type { LandingPage } from "@/types/contentful-landing-page"
import { useActionState } from "react"
import Image from "next/image"
import { LexicalRenderer } from "@/components/LexicalRenderer"
import { getImageUrl } from "@/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { submitChecklistForm } from "./actions"

const initialState = {
  message: "",
  isSuccess: false,
}

export function LandingPageClient({ pageData }: { pageData: LandingPage }) {
  const [state, formAction, isPending] = useActionState(submitChecklistForm, initialState)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-12 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">{pageData.heroHeadline}</h1>

              {pageData.heroSubheadline && (
                <div className="text-lg text-gray-600 mb-8 prose max-w-none">
                  <p>{pageData.heroSubheadline}</p>
                </div>
              )}

              {pageData.heroBulletPoints && Array.isArray(pageData.heroBulletPoints) && (
                <ul className="space-y-3 mb-8">
                  {pageData.heroBulletPoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Form Section */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold mb-4 text-lg">Get Your Custom Checklist</h3>
                {state.isSuccess ? (
                  <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md">
                    <p className="font-bold">Success!</p>
                    <p>{state.message}</p>
                  </div>
                ) : (
                  <form action={formAction} className="space-y-4">
                    {pageData.formFields && pageData.formFields.length > 0 ? (
                      pageData.formFields.map((field, index) => (
                        <div key={index}>
                          <label
                            htmlFor={field.fields.fieldName}
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            {field.fields.fieldLabel}
                            {field.fields.validations?.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <input
                            id={field.fields.fieldName}
                            name={field.fields.fieldName}
                            type={field.fields.fieldType.startsWith("email") ? "email" : "text"}
                            placeholder={field.fields.placeholderText || ""}
                            required={field.fields.validations?.required}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                          {field.fields.helpText && (
                            <p className="text-xs text-gray-500 mt-1">{field.fields.helpText}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">Form not configured.</p>
                    )}
                    <button
                      type="submit"
                      aria-disabled={isPending}
                      className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                      disabled={isPending}
                    >
                      {isPending ? "Submitting..." : "Generate Checklist"}
                    </button>
                    {state.message && !state.isSuccess && <p className="text-sm text-red-600">{state.message}</p>}
                  </form>
                )}
              </div>
            </div>

            <div>
              {pageData.heroImage ? (
                <div className="relative">
                  <Image
                    src={getImageUrl(pageData.heroImage.fields.file.url) || "/placeholder.svg"}
                    alt={pageData.heroImage.fields.title || "Hero image"}
                    width={pageData.heroImage.fields.file.details.image.width}
                    height={pageData.heroImage.fields.file.details.image.height}
                    className="rounded-lg shadow-lg w-full h-auto"
                    priority
                  />
                </div>
              ) : (
                <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
                  <p className="text-gray-500">No hero image set</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      {pageData.howItWorksSteps && pageData.howItWorksSteps.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {pageData.howItWorksSteps.map((step, index) => (
                <div key={index} className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {step.fields.stepNumber}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.fields.stepTitle}</h3>
                  <p className="text-gray-600">{step.fields.stepDescription}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      {pageData.benefitsSection && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto prose lg:prose-xl">
              <LexicalRenderer content={pageData.benefitsSection} />
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {pageData.faqSection && pageData.faqSection.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                {pageData.faqSection.map((faq, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-lg font-semibold text-left">
                      {faq.fields.question}
                    </AccordionTrigger>
                    <AccordionContent className="prose max-w-none">
                      <LexicalRenderer content={faq.fields.answer} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      )}

      {/* SEO Content Section */}
      {pageData.seoContent && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto prose lg:prose-xl">
              <LexicalRenderer content={pageData.seoContent} />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
