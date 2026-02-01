import { submitLandingPageForm } from "@/app/actions/submit-landing-page-form"

export default function TestDirectActionPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">Test Direct Server Action</h1>
          
          <form action={async (formData) => {
            "use server"
            
            const data = {
              name: formData.get('name') as string,
              email: formData.get('email') as string,
              phone: formData.get('phone') as string || '',
              organizationName: formData.get('organizationName') as string || '',
              message: formData.get('message') as string || ''
            }
            
            const result = await submitLandingPageForm(data)
            console.log('[TestDirectAction] Server result:', result)
            
            // This will cause a page refresh with the result
            if (!result.success) {
              throw new Error(result.message)
            }
          }}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  defaultValue="Test User"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  defaultValue="test@example.com"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
              >
                Submit Direct Action
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              This form uses a direct server action. If successful, the page will refresh. 
              If it fails, you'll see an error page.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}