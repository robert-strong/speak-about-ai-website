"use client"

import { Mail } from "lucide-react"

interface JoinTeamProps {
  title?: string
  subtitle?: string
  buttonText?: string
  email?: string
}

export default function JoinTeam({
  title,
  subtitle,
  buttonText,
  email,
}: JoinTeamProps) {
  const displayTitle = title || 'Get In Touch'
  const displaySubtitle = subtitle || "Interested in working with Speak About AI or have questions about our services? We'd love to hear from you."
  const displayButtonText = buttonText || 'Email Us'
  const displayEmail = email || 'human@speakabout.ai'

  return (
    <section className="py-20 bg-[#1E68C6]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-6 font-neue-haas">{displayTitle}</h2>
        <p className="text-xl text-white text-opacity-90 mb-8 max-w-3xl mx-auto font-montserrat">
          {displaySubtitle}
        </p>

        <a
          href={`mailto:${displayEmail}`}
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-montserrat text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-md"
          style={{
            background: "linear-gradient(to right, #f59e0b, #d97706)",
            color: "white",
          }}
          data-button="yellow"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "linear-gradient(to right, #d97706, #b45309)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(to right, #f59e0b, #d97706)"
          }}
        >
          <Mail className="w-5 h-5 mr-2" />
          {displayButtonText}
        </a>
      </div>
    </section>
  )
}
