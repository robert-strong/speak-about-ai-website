import Image from "next/image"
import { Linkedin, Twitter, Globe } from "lucide-react"
import { getPageContent, getFromContent } from "@/lib/website-content"

interface TeamMember {
  id: string
  name: string
  title: string
  image: string
  bio: string
  linkedin?: string
  twitter?: string
  website?: string
}

// Default team members
const defaultMembers: TeamMember[] = [
  {
    id: "member1",
    name: "Robert Strong",
    title: "CEO",
    image: "/team/robert-strong-headshot.png",
    bio: "Speak About AI was founded by author, speaker, and entertainer Robert Strong and is a division of Strong Entertainment, LLC. With 30+ years of experience booking speakers and entertainers globally, Robert brings unparalleled expertise to the AI speaking circuit. He's also a world-renowned magician who's performed at the White House twice, on Penn & Teller Fool Us, and for every major tech company in Silicon Valley. His Amazon best-selling book 'Amaze & Delight: Secrets to Creating Magic in Business' showcases his unique approach to business entertainment.",
    linkedin: "https://linkedin.com/in/robertstrong",
  },
]

export default async function TeamMembers() {
  // Fetch content from database
  const content = await getPageContent('team')

  // Try to get members from JSON list, fall back to defaults
  const membersJson = getFromContent(content, 'team', 'members', 'list')
  let teamMembers: TeamMember[] = defaultMembers

  if (membersJson) {
    try {
      teamMembers = JSON.parse(membersJson)
    } catch (e) {
      // Use defaults if JSON parsing fails
    }
  }

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#1E68C6]/20 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 md:p-8 border border-gray-100 hover:border-[#1E68C6]/30 relative overflow-hidden"
            >
              {/* Card accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-[#1E68C6] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>

              <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* Image with ring effect */}
                <div className="relative flex-shrink-0 mx-auto md:mx-0">
                  <div className="absolute -inset-2 bg-[#1E68C6] rounded-full opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
                  <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden ring-4 ring-gray-100 group-hover:ring-[#1E68C6]/30 transition-all duration-300">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 160px, 192px"
                      priority
                    />
                  </div>
                </div>

                {/* Text content */}
                <div className="flex flex-col text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1 font-neue-haas group-hover:text-[#1E68C6] transition-colors duration-300">
                    {member.name}
                  </h3>
                  <p className="text-[#1E68C6] font-semibold mb-4 font-montserrat text-sm uppercase tracking-wide">
                    {member.title}
                  </p>
                  <p className="text-gray-600 mb-4 font-montserrat leading-relaxed text-sm flex-grow">
                    {member.bio}
                  </p>

                  {/* Social links */}
                  <div className="flex space-x-3 justify-center md:justify-start">
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-[#1E68C6] hover:text-white transition-all duration-300"
                        aria-label={`${member.name}'s LinkedIn profile`}
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {member.twitter && (
                      <a
                        href={member.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-[#1E68C6] hover:text-white transition-all duration-300"
                        aria-label={`${member.name}'s Twitter profile`}
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {member.website && (
                      <a
                        href={member.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-[#1E68C6] hover:text-white transition-all duration-300"
                        aria-label={`${member.name}'s personal website`}
                      >
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
