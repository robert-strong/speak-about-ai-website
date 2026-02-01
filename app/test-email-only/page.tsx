import { submitLandingPageForm } from "@/app/actions/submit-landing-page-form"

export default function TestEmailOnlyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">Test Email-Only Form (Like Landing Pages)</h1>
          
          <form action={async (formData) => {
            "use server"
            
            // Only pass email, like the landing pages do
            const data = {
              email: formData.get('email') as string
            }
            
            const result = await submitLandingPageForm(data as any)
            console.log('[TestEmailOnly] Result:', result)
            
            if (!result.success) {
              throw new Error(result.message)
            }
          }}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Work Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="human@speakabout.ai"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
              >
                Get Instant Access
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              This form mimics the landing page forms that only collect email addresses.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}