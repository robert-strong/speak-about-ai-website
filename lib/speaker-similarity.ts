import type { Speaker } from './speakers-data'

/**
 * Calculates similarity score between two speakers based on multiple factors
 * with weighted importance
 */

interface SimilarityWeights {
  industries: number      // Company/sector - highest weight
  expertise: number       // Areas of expertise - highest weight
  topics: number         // Speaking topics
  feeRange: number       // Price point
  location: number       // Geographic location
}

const WEIGHTS: SimilarityWeights = {
  industries: 0.35,  // 35% - Company/sector (highest)
  expertise: 0.30,   // 30% - Areas of expertise (highest)
  topics: 0.15,      // 15% - Speaking topics
  feeRange: 0.12,    // 12% - Price point
  location: 0.08,    // 8%  - Location
}

/**
 * Calculate Jaccard similarity between two arrays
 */
function jaccardSimilarity(arr1: string[], arr2: string[]): number {
  if (!arr1?.length || !arr2?.length) return 0

  const set1 = new Set(arr1.map(s => s.toLowerCase().trim()))
  const set2 = new Set(arr2.map(s => s.toLowerCase().trim()))

  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])

  return union.size === 0 ? 0 : intersection.size / union.size
}

/**
 * Compare fee ranges and return similarity score (0-1)
 */
function feeSimilarity(fee1?: string, fee2?: string): number {
  if (!fee1 || !fee2) return 0

  // Normalize fee strings
  const normalize = (fee: string): number => {
    const lower = fee.toLowerCase()

    // Extract numbers from fee string
    const numbers = fee.match(/\d+/g)?.map(n => parseInt(n)) || []

    if (numbers.length === 0) return 0

    // If range (e.g., "25k to 50k"), take average
    if (numbers.length >= 2) {
      return (numbers[0] + numbers[1]) / 2
    }

    // Single number
    return numbers[0]
  }

  const fee1Val = normalize(fee1)
  const fee2Val = normalize(fee2)

  if (fee1Val === 0 || fee2Val === 0) return 0

  // Calculate similarity based on percentage difference
  const diff = Math.abs(fee1Val - fee2Val)
  const avg = (fee1Val + fee2Val) / 2
  const percentDiff = diff / avg

  // Convert to similarity score (closer = higher score)
  // If within 20% = 1.0, if 100% different = 0.0
  return Math.max(0, 1 - percentDiff / 1.0)
}

/**
 * Compare locations and return similarity score (0-1)
 */
function locationSimilarity(loc1?: string, loc2?: string): number {
  if (!loc1 || !loc2) return 0

  const l1 = loc1.toLowerCase().trim()
  const l2 = loc2.toLowerCase().trim()

  // Exact match
  if (l1 === l2) return 1.0

  // Same state/country
  const l1Parts = l1.split(',').map(p => p.trim())
  const l2Parts = l2.split(',').map(p => p.trim())

  // Check if they share any location parts (city, state, country)
  const sharedParts = l1Parts.filter(p => l2Parts.includes(p))

  if (sharedParts.length > 0) {
    return 0.5 + (sharedParts.length / Math.max(l1Parts.length, l2Parts.length)) * 0.5
  }

  // Check for common regions
  const usStates = ['california', 'new york', 'texas', 'florida', 'washington']
  const l1InUS = usStates.some(state => l1.includes(state))
  const l2InUS = usStates.some(state => l2.includes(state))

  if (l1InUS && l2InUS) return 0.3 // Both in US
  if (l1.includes('usa') || l1.includes('united states')) {
    if (l2.includes('usa') || l2.includes('united states')) return 0.3
  }

  return 0
}

/**
 * Calculate overall similarity score between two speakers
 */
export function calculateSimilarity(speaker1: Speaker, speaker2: Speaker): number {
  // Don't compare speaker to themselves
  if (speaker1.slug === speaker2.slug) return 0

  // Calculate individual similarity scores
  const industriesSim = jaccardSimilarity(speaker1.industries || [], speaker2.industries || [])
  const expertiseSim = jaccardSimilarity(speaker1.expertise || [], speaker2.expertise || [])
  const topicsSim = jaccardSimilarity(speaker1.topics || [], speaker2.topics || [])
  const feeSim = feeSimilarity(speaker1.fee, speaker2.fee)
  const locationSim = locationSimilarity(speaker1.location, speaker2.location)

  // Calculate weighted score
  const totalScore = (
    industriesSim * WEIGHTS.industries +
    expertiseSim * WEIGHTS.expertise +
    topicsSim * WEIGHTS.topics +
    feeSim * WEIGHTS.feeRange +
    locationSim * WEIGHTS.location
  )

  return totalScore
}

/**
 * Find the most similar speakers to the given speaker
 */
export function findSimilarSpeakers(
  currentSpeaker: Speaker,
  allSpeakers: Speaker[],
  limit: number = 3
): Speaker[] {
  // Calculate similarity scores for all other speakers
  const scoredSpeakers = allSpeakers
    .filter(s => s.slug !== currentSpeaker.slug && s.listed !== false)
    .map(speaker => ({
      speaker,
      score: calculateSimilarity(currentSpeaker, speaker)
    }))
    .filter(s => s.score > 0) // Only include speakers with some similarity
    .sort((a, b) => b.score - a.score) // Sort by score descending

  // Return top N speakers
  return scoredSpeakers.slice(0, limit).map(s => s.speaker)
}

/**
 * Get similarity explanation for debugging/display
 */
export function getSimilarityExplanation(speaker1: Speaker, speaker2: Speaker): {
  totalScore: number
  breakdown: Record<string, { score: number; weight: number; contribution: number }>
} {
  const industriesSim = jaccardSimilarity(speaker1.industries || [], speaker2.industries || [])
  const expertiseSim = jaccardSimilarity(speaker1.expertise || [], speaker2.expertise || [])
  const topicsSim = jaccardSimilarity(speaker1.topics || [], speaker2.topics || [])
  const feeSim = feeSimilarity(speaker1.fee, speaker2.fee)
  const locationSim = locationSimilarity(speaker1.location, speaker2.location)

  const breakdown = {
    industries: {
      score: industriesSim,
      weight: WEIGHTS.industries,
      contribution: industriesSim * WEIGHTS.industries
    },
    expertise: {
      score: expertiseSim,
      weight: WEIGHTS.expertise,
      contribution: expertiseSim * WEIGHTS.expertise
    },
    topics: {
      score: topicsSim,
      weight: WEIGHTS.topics,
      contribution: topicsSim * WEIGHTS.topics
    },
    feeRange: {
      score: feeSim,
      weight: WEIGHTS.feeRange,
      contribution: feeSim * WEIGHTS.feeRange
    },
    location: {
      score: locationSim,
      weight: WEIGHTS.location,
      contribution: locationSim * WEIGHTS.location
    }
  }

  const totalScore = Object.values(breakdown).reduce((sum, item) => sum + item.contribution, 0)

  return { totalScore, breakdown }
}
