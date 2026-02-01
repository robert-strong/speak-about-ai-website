import { getAllLandingPages } from "@/lib/contentful-landing-page"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, ExternalLink } from "lucide-react"

export const metadata = {
  title: "Landing Page Directory",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function LandingPageDirectory() {
  const pages = await getAllLandingPages()

  if (pages.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTitle>No Landing Pages Found</AlertTitle>
          <AlertDescription>
            We could not find any published entries with the content type "landingPage" in Contentful. Please check your
            Contentful space.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-2">Landing Page Directory</h1>
        <p className="text-center text-gray-600 mb-12">
          This page lists all entries with the "landingPage" content type for debugging purposes.
        </p>
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {pages.map((page) => {
              const hasSlug = !!page.fields.urlSlug
              return (
                <li key={page.sys.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    {hasSlug ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-3" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">{page.fields.pageTitle || "Untitled Page"}</p>
                      <p className="text-sm text-gray-500">
                        Slug: {page.fields.urlSlug ? `/${page.fields.urlSlug}` : "Not set"}
                      </p>
                    </div>
                  </div>
                  {hasSlug ? (
                    <Link
                      href={`/${page.fields.urlSlug}`}
                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Page <ExternalLink className="h-4 w-4 ml-1" />
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-400">Invalid Link</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
