/**
 * Keyword Matcher for SEO Blog Posts
 *
 * Matches article content against speakers and their workshops
 * to suggest relevant internal links and mentions.
 */

import { getAllSpeakers, Speaker } from './speakers-data'
import { getActiveWorkshops, WorkshopWithSpeaker } from './workshops-db'

export interface KeywordMatch {
  keyword: string
  matchedIn: string[] // e.g., ['topics', 'expertise', 'bio']
  relevanceScore: number
}

export interface SpeakerMatch {
  speaker: Speaker
  score: number
  matchedKeywords: KeywordMatch[]
  hasWorkshops: boolean
  workshopCount: number
}

export interface WorkshopMatch {
  workshop: WorkshopWithSpeaker
  score: number
  matchedKeywords: KeywordMatch[]
  speakerName?: string
}

export interface MatchResult {
  speakers: SpeakerMatch[]
  workshops: WorkshopMatch[]
  suggestedMentions: string[] // Formatted suggestions for blog content
}

// Common stop words to filter out
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
  'we', 'us', 'our', 'you', 'your', 'he', 'she', 'him', 'her', 'his',
  'who', 'what', 'where', 'when', 'why', 'how', 'which', 'whom',
  'i', 'me', 'my', 'myself', 'yourself', 'himself', 'herself', 'itself',
  'about', 'above', 'after', 'again', 'against', 'all', 'also', 'am',
  'any', 'because', 'before', 'being', 'below', 'between', 'both',
  'during', 'each', 'few', 'further', 'here', 'into', 'just', 'more',
  'most', 'no', 'nor', 'not', 'now', 'only', 'other', 'out', 'over',
  'own', 'same', 'so', 'some', 'such', 'than', 'then', 'there', 'through',
  'too', 'under', 'until', 'up', 'very', 'while', 'why', 'yet'
])

// AI/Tech specific keywords with higher weight
const HIGH_VALUE_KEYWORDS = new Set([
  'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
  'neural network', 'nlp', 'natural language processing', 'chatgpt', 'gpt',
  'claude', 'gemini', 'llm', 'large language model', 'generative ai',
  'automation', 'robotics', 'computer vision', 'data science', 'analytics',
  'transformers', 'prompt engineering', 'rag', 'fine-tuning', 'embeddings',
  'siri', 'alexa', 'voice assistant', 'conversational ai', 'chatbot',
  'enterprise ai', 'ai strategy', 'ai implementation', 'ai adoption',
  'ai ethics', 'responsible ai', 'ai governance', 'ai safety',
  'productivity', 'workflow', 'efficiency', 'roi', 'digital transformation',
  'innovation', 'entrepreneurship', 'startup', 'venture capital',
  'healthcare ai', 'fintech', 'edtech', 'agritech'
])

/**
 * Extract meaningful keywords from article content
 */
export function extractKeywords(content: string): string[] {
  if (!content) return []

  // Normalize content
  const normalized = content
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ') // Remove special chars except hyphens
    .replace(/\s+/g, ' ')
    .trim()

  // Extract individual words
  const words = normalized.split(' ')
    .filter(word => word.length > 2) // Min 3 chars
    .filter(word => !STOP_WORDS.has(word))
    .filter(word => !/^\d+$/.test(word)) // Filter pure numbers

  // Extract 2-word and 3-word phrases
  const phrases: string[] = []
  for (let i = 0; i < words.length - 1; i++) {
    // 2-word phrases
    const twoWord = `${words[i]} ${words[i + 1]}`
    if (HIGH_VALUE_KEYWORDS.has(twoWord)) {
      phrases.push(twoWord)
    }

    // 3-word phrases
    if (i < words.length - 2) {
      const threeWord = `${words[i]} ${words[i + 1]} ${words[i + 2]}`
      if (HIGH_VALUE_KEYWORDS.has(threeWord)) {
        phrases.push(threeWord)
      }
    }
  }

  // Count word frequency
  const wordCount = new Map<string, number>()
  for (const word of words) {
    wordCount.set(word, (wordCount.get(word) || 0) + 1)
  }

  // Get top keywords by frequency (min 2 occurrences or high-value)
  const keywords = Array.from(wordCount.entries())
    .filter(([word, count]) => count >= 2 || HIGH_VALUE_KEYWORDS.has(word))
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 50) // Top 50 keywords

  // Combine with phrases, dedup
  return [...new Set([...phrases, ...keywords])]
}

/**
 * Calculate match score between keywords and a text field
 */
function calculateFieldScore(
  keywords: string[],
  fieldValue: string | string[] | undefined,
  fieldName: string,
  fieldWeight: number = 1
): KeywordMatch[] {
  if (!fieldValue) return []

  const matches: KeywordMatch[] = []
  const textToSearch = Array.isArray(fieldValue)
    ? fieldValue.join(' ').toLowerCase()
    : fieldValue.toLowerCase()

  for (const keyword of keywords) {
    if (textToSearch.includes(keyword)) {
      const isHighValue = HIGH_VALUE_KEYWORDS.has(keyword)
      const baseScore = isHighValue ? 3 : 1

      // Check for exact match vs partial
      const exactMatch = new RegExp(`\\b${keyword}\\b`, 'i').test(textToSearch)
      const matchScore = exactMatch ? baseScore * fieldWeight : baseScore * fieldWeight * 0.5

      // Find existing match or create new
      const existingMatch = matches.find(m => m.keyword === keyword)
      if (existingMatch) {
        existingMatch.matchedIn.push(fieldName)
        existingMatch.relevanceScore += matchScore
      } else {
        matches.push({
          keyword,
          matchedIn: [fieldName],
          relevanceScore: matchScore
        })
      }
    }
  }

  return matches
}

/**
 * Match speakers against extracted keywords
 */
async function matchSpeakers(
  keywords: string[],
  workshops: WorkshopWithSpeaker[]
): Promise<SpeakerMatch[]> {
  const speakers = await getAllSpeakers()
  const speakerMatches: SpeakerMatch[] = []

  // Create a map of speaker_id to workshop count
  const speakerWorkshopCount = new Map<number, number>()
  for (const workshop of workshops) {
    if (workshop.speaker_id) {
      speakerWorkshopCount.set(
        workshop.speaker_id,
        (speakerWorkshopCount.get(workshop.speaker_id) || 0) + 1
      )
    }
  }

  for (const speaker of speakers) {
    const allMatches: KeywordMatch[] = []

    // Match against various speaker fields with different weights
    allMatches.push(...calculateFieldScore(keywords, speaker.topics, 'topics', 3))
    allMatches.push(...calculateFieldScore(keywords, speaker.expertise, 'expertise', 3))
    allMatches.push(...calculateFieldScore(keywords, speaker.programs, 'programs', 2))
    allMatches.push(...calculateFieldScore(keywords, speaker.industries, 'industries', 1.5))
    allMatches.push(...calculateFieldScore(keywords, speaker.bio, 'bio', 1))
    allMatches.push(...calculateFieldScore(keywords, speaker.title, 'title', 2))
    allMatches.push(...calculateFieldScore(keywords, speaker.tags, 'tags', 2))

    // Consolidate matches by keyword
    const consolidatedMatches = new Map<string, KeywordMatch>()
    for (const match of allMatches) {
      const existing = consolidatedMatches.get(match.keyword)
      if (existing) {
        existing.matchedIn = [...new Set([...existing.matchedIn, ...match.matchedIn])]
        existing.relevanceScore += match.relevanceScore
      } else {
        consolidatedMatches.set(match.keyword, { ...match })
      }
    }

    const matchedKeywords = Array.from(consolidatedMatches.values())
    const totalScore = matchedKeywords.reduce((sum, m) => sum + m.relevanceScore, 0)

    // Look up workshop count by matching speaker name to workshop speaker_name
    const speakerWorkshops = workshops.filter(w =>
      w.speaker_name?.toLowerCase() === speaker.name.toLowerCase()
    )
    const workshopCount = speakerWorkshops.length

    // Boost score if speaker has workshops (they're more actionable to mention)
    const workshopBoost = workshopCount > 0 ? 1.5 : 1

    if (totalScore > 0) {
      speakerMatches.push({
        speaker,
        score: totalScore * workshopBoost,
        matchedKeywords,
        hasWorkshops: workshopCount > 0,
        workshopCount
      })
    }
  }

  // Sort by score descending
  return speakerMatches.sort((a, b) => b.score - a.score)
}

/**
 * Match workshops against extracted keywords
 */
function matchWorkshops(
  keywords: string[],
  workshops: WorkshopWithSpeaker[]
): WorkshopMatch[] {
  const workshopMatches: WorkshopMatch[] = []

  for (const workshop of workshops) {
    const allMatches: KeywordMatch[] = []

    // Match against workshop fields with different weights
    allMatches.push(...calculateFieldScore(keywords, workshop.topics, 'topics', 3))
    allMatches.push(...calculateFieldScore(keywords, workshop.keywords, 'keywords', 3))
    allMatches.push(...calculateFieldScore(keywords, workshop.title, 'title', 2.5))
    allMatches.push(...calculateFieldScore(keywords, workshop.description, 'description', 1))
    allMatches.push(...calculateFieldScore(keywords, workshop.short_description, 'short_description', 1.5))
    allMatches.push(...calculateFieldScore(keywords, workshop.target_audience, 'target_audience', 2))
    allMatches.push(...calculateFieldScore(keywords, workshop.learning_objectives, 'learning_objectives', 2))
    allMatches.push(...calculateFieldScore(keywords, workshop.key_takeaways, 'key_takeaways', 2))

    // Consolidate matches
    const consolidatedMatches = new Map<string, KeywordMatch>()
    for (const match of allMatches) {
      const existing = consolidatedMatches.get(match.keyword)
      if (existing) {
        existing.matchedIn = [...new Set([...existing.matchedIn, ...match.matchedIn])]
        existing.relevanceScore += match.relevanceScore
      } else {
        consolidatedMatches.set(match.keyword, { ...match })
      }
    }

    const matchedKeywords = Array.from(consolidatedMatches.values())
    const totalScore = matchedKeywords.reduce((sum, m) => sum + m.relevanceScore, 0)

    if (totalScore > 0) {
      workshopMatches.push({
        workshop,
        score: totalScore,
        matchedKeywords,
        speakerName: workshop.speaker_name
      })
    }
  }

  // Sort by score descending
  return workshopMatches.sort((a, b) => b.score - a.score)
}

/**
 * Generate suggested mentions for blog content
 */
function generateSuggestions(
  speakerMatches: SpeakerMatch[],
  workshopMatches: WorkshopMatch[]
): string[] {
  const suggestions: string[] = []

  // Top 3 speakers with workshops get priority
  const speakersWithWorkshops = speakerMatches
    .filter(m => m.hasWorkshops)
    .slice(0, 3)

  for (const match of speakersWithWorkshops) {
    const topKeywords = match.matchedKeywords
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3)
      .map(k => k.keyword)
      .join(', ')

    suggestions.push(
      `Consider mentioning ${match.speaker.name} (has ${match.workshopCount} workshop${match.workshopCount > 1 ? 's' : ''}) - ` +
      `matches: ${topKeywords}. Link: /speakers/${match.speaker.slug}`
    )
  }

  // Top 2 workshops
  const topWorkshops = workshopMatches.slice(0, 2)
  for (const match of topWorkshops) {
    const topKeywords = match.matchedKeywords
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3)
      .map(k => k.keyword)
      .join(', ')

    suggestions.push(
      `Link to workshop: "${match.workshop.title}"` +
      (match.speakerName ? ` by ${match.speakerName}` : '') +
      ` - matches: ${topKeywords}. Link: /ai-workshops/${match.workshop.slug}`
    )
  }

  // Add remaining top speakers without workshops
  const speakersWithoutWorkshops = speakerMatches
    .filter(m => !m.hasWorkshops)
    .slice(0, 2)

  for (const match of speakersWithoutWorkshops) {
    const topKeywords = match.matchedKeywords
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 2)
      .map(k => k.keyword)
      .join(', ')

    suggestions.push(
      `Also consider: ${match.speaker.name} - matches: ${topKeywords}. ` +
      `Link: /speakers/${match.speaker.slug}`
    )
  }

  return suggestions
}

/**
 * Main function: Match article content to speakers and workshops
 */
export async function matchContentToSpeakers(
  articleContent: string,
  options: {
    maxSpeakers?: number
    maxWorkshops?: number
    minScore?: number
  } = {}
): Promise<MatchResult> {
  const { maxSpeakers = 10, maxWorkshops = 5, minScore = 2 } = options

  // Extract keywords from article
  const keywords = extractKeywords(articleContent)

  if (keywords.length === 0) {
    return {
      speakers: [],
      workshops: [],
      suggestedMentions: []
    }
  }

  // Get active workshops
  let workshops: WorkshopWithSpeaker[] = []
  try {
    workshops = await getActiveWorkshops()
  } catch (error) {
    console.error('Error fetching workshops for keyword matching:', error)
  }

  // Match speakers
  const speakerMatches = await matchSpeakers(keywords, workshops)
  const filteredSpeakers = speakerMatches
    .filter(m => m.score >= minScore)
    .slice(0, maxSpeakers)

  // Match workshops
  const workshopMatches = matchWorkshops(keywords, workshops)
  const filteredWorkshops = workshopMatches
    .filter(m => m.score >= minScore)
    .slice(0, maxWorkshops)

  // Generate suggestions
  const suggestions = generateSuggestions(filteredSpeakers, filteredWorkshops)

  return {
    speakers: filteredSpeakers,
    workshops: filteredWorkshops,
    suggestedMentions: suggestions
  }
}

/**
 * Quick match function for API use - returns simplified results
 */
export async function quickMatch(articleContent: string): Promise<{
  topSpeakers: Array<{ name: string; slug: string; score: number; hasWorkshops: boolean }>
  topWorkshops: Array<{ title: string; slug: string; score: number; speakerName?: string }>
  suggestions: string[]
}> {
  const result = await matchContentToSpeakers(articleContent, {
    maxSpeakers: 5,
    maxWorkshops: 3,
    minScore: 3
  })

  return {
    topSpeakers: result.speakers.map(m => ({
      name: m.speaker.name,
      slug: m.speaker.slug,
      score: Math.round(m.score * 10) / 10,
      hasWorkshops: m.hasWorkshops
    })),
    topWorkshops: result.workshops.map(m => ({
      title: m.workshop.title,
      slug: m.workshop.slug,
      score: Math.round(m.score * 10) / 10,
      speakerName: m.speakerName
    })),
    suggestions: result.suggestedMentions
  }
}
