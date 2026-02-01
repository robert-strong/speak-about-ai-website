import { getAllLandingPages } from "@/lib/landing-page-data"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, ExternalLink } from "lucide-react"

export const metadata = {
  title: "Landing Pages - Speak About AI",
  description: "Browse all available landing pages",
}

export default async function LandingPagesIndex() {
  const pages = await getAllLandingPages()

  if (pages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="container mx-auto px-4 py-20 text-center">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTitle>No Landing Pages Found</AlertTitle>
            <AlertDescription>
              We could not find any published landing pages in Contentful. Please check your
              Contentful space or contact an administrator.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Landing Pages</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore our collection of specialized landing pages designed for different campaigns and audiences.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => {
              const hasSlug = !!page.fields.urlSlug
              return (
                <div key={page.sys.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">
                          {page.fields.pageTitle || "Untitled Page"}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {page.fields.metaDescription || "No description available"}
                        </p>
                      </div>
                      <div className="ml-3">
                        {hasSlug ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        <span>Slug: {page.fields.urlSlug ? `/${page.fields.urlSlug}` : "Not set"}</span>
                      </div>
                      {hasSlug ? (
                        <Link
                          href={`/lp/${page.fields.urlSlug}`}
                          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                        >
                          View Page <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-md">Invalid Link</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Found {pages.length} landing page{pages.length !== 1 ? 's' : ''} in Contentful
          </p>
        </div>
      </div>
    </div>
  )
}