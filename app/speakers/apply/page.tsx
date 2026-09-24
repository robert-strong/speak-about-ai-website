import { permanentRedirect } from "next/navigation"

// Legacy URL. Redirect on the server (301) instead of rendering a
// "Redirecting..." page that crawlers indexed as a thin, 200-status page.
export default function SpeakerApplicationRedirect() {
  permanentRedirect("/apply")
}
