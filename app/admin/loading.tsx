export default function AdminLoading() {
  return (
    <div className="ml-72 min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-3 text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  )
}
