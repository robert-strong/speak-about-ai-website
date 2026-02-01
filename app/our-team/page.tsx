import type { Metadata } from "next"
import TeamHero from "@/components/team-hero"
import TeamMembers from "@/components/team-members"
import JoinTeam from "@/components/join-team"
import { getPageContent, getFromContent } from "@/lib/website-content"

export const metadata: Metadata = {
  title: "Meet Our Team | Speak About AI",
  description:
    "Meet the Speak About AI team, your experts for connecting you with top AI keynote speakers. We're the world's leading AI-exclusive speaker bureau.",
  keywords:
    "AI speaker bureau team, Speak About AI team, AI keynote speaker experts, artificial intelligence bureau staff",
  alternates: {
    canonical: "https://speakabout.ai/our-team",
  },
}

export default async function OurTeamPage() {
  // Fetch content for client components
  const content = await getPageContent('team')

  // JoinTeam (CTA) section props
  const joinTeamProps = {
    title: getFromContent(content, 'team', 'cta', 'title'),
    subtitle: getFromContent(content, 'team', 'cta', 'subtitle'),
    buttonText: getFromContent(content, 'team', 'cta', 'button_text'),
    email: getFromContent(content, 'team', 'cta', 'email'),
  }

  return (
    <div className="min-h-screen bg-white">
      <TeamHero />
      <TeamMembers />
      <JoinTeam {...joinTeamProps} />
    </div>
  )
}
