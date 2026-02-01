"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Star,
  MapPin,
  DollarSign,
  CheckCircle,
  Eye,
  TrendingUp,
  Award,
  Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SpeakerCardProps {
  speaker: {
    id: string
    name: string
    slug: string
    title: string
    bio: string
    short_bio?: string
    location?: string
    fee_range?: string
    image_url?: string
    topics?: string[]
    match_score?: number
    match_reasons?: string[]
    availability?: boolean
    past_events?: number
    rating?: number
  }
  selected?: boolean
  onSelect?: () => void
  onViewProfile?: () => void
  budget?: number
}

export function SpeakerCard({
  speaker,
  selected,
  onSelect,
  onViewProfile,
  budget
}: SpeakerCardProps) {
  const matchScore = speaker.match_score || 0
  const getMatchColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50 border-green-200"
    if (score >= 75) return "text-blue-600 bg-blue-50 border-blue-200"
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-gray-600 bg-gray-50 border-gray-200"
  }

  const getMatchLabel = (score: number) => {
    if (score >= 90) return "Excellent Match"
    if (score >= 75) return "Great Match"
    if (score >= 60) return "Good Match"
    return "Possible Match"
  }

  const isWithinBudget = budget
    ? speaker.fee_range && parseInt(speaker.fee_range.split("-")[0].replace(/\D/g, "")) <= budget
    : true

  return (
    <Card
      className={cn(
        "p-4 transition-all duration-200 hover:shadow-lg",
        selected && "ring-2 ring-purple-500 bg-purple-50/50",
        matchScore >= 90 && "border-green-200",
        matchScore >= 75 && matchScore < 90 && "border-blue-200"
      )}
    >
      {/* Match Score Badge */}
      {matchScore > 0 && (
        <div className="flex items-center justify-between mb-3">
          <Badge className={cn("text-xs font-semibold", getMatchColor(matchScore))}>
            <Star className="h-3 w-3 mr-1" />
            {matchScore}% {getMatchLabel(matchScore)}
          </Badge>
          {selected && (
            <Badge className="bg-purple-600 text-white text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Selected
            </Badge>
          )}
        </div>
      )}

      <div className="flex gap-4">
        {/* Avatar */}
        <Avatar className="h-20 w-20 border-2 border-gray-200">
          <AvatarImage src={speaker.image_url} alt={speaker.name} />
          <AvatarFallback className="text-lg font-semibold">
            {speaker.name.split(" ").map(n => n[0]).join("")}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base leading-tight mb-1">
            {speaker.name}
          </h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
            {speaker.title}
          </p>

          <p className="text-sm text-gray-700 line-clamp-2 mb-3">
            {speaker.short_bio || speaker.bio}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-3">
            {speaker.location && (
              <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                <MapPin className="h-3 w-3" />
                {speaker.location}
              </span>
            )}
            {speaker.fee_range && (
              <span className={cn(
                "flex items-center gap-1 px-2 py-1 rounded font-semibold",
                isWithinBudget ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                <DollarSign className="h-3 w-3" />
                {speaker.fee_range}
                {isWithinBudget && budget && " ✓"}
              </span>
            )}
            {speaker.rating && (
              <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                <Star className="h-3 w-3 fill-current" />
                {speaker.rating}/5
              </span>
            )}
          </div>

          {/* Topics */}
          {speaker.topics && speaker.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {speaker.topics.slice(0, 3).map((topic, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
              {speaker.topics.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{speaker.topics.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Match Reasons */}
          {speaker.match_reasons && speaker.match_reasons.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-xs font-semibold text-blue-900 mb-2">
                Why recommended:
              </p>
              <ul className="space-y-1">
                {speaker.match_reasons.map((reason, idx) => (
                  <li key={idx} className="text-xs text-blue-800 flex items-start gap-2">
                    <TrendingUp className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={onSelect}
              variant={selected ? "secondary" : "default"}
              size="sm"
              className={cn(
                selected && "bg-purple-600 text-white hover:bg-purple-700"
              )}
            >
              {selected ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Selected
                </>
              ) : (
                <>Select Speaker</>
              )}
            </Button>
            <Button
              onClick={onViewProfile}
              variant="outline"
              size="sm"
            >
              <Eye className="h-3 w-3 mr-1" />
              View Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      {(speaker.past_events || speaker.availability) && (
        <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs text-gray-600">
          {speaker.past_events && (
            <span className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              {speaker.past_events} past events
            </span>
          )}
          {speaker.availability && (
            <span className="flex items-center gap-1 text-green-600">
              <Calendar className="h-3 w-3" />
              Available
            </span>
          )}
        </div>
      )}
    </Card>
  )
}
