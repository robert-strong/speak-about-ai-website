/**
 * Semrush API Service
 *
 * This service provides methods to interact with the Semrush API
 * for SEO analytics, keyword research, and domain analysis.
 *
 * API Documentation: https://www.semrush.com/api-documentation/
 */

const SEMRUSH_API_KEY = process.env.SEMRUSH_API_KEY
const SEMRUSH_API_BASE = 'https://api.semrush.com'

interface SemrushParams {
  [key: string]: string | number | undefined
}

/**
 * Make a request to the Semrush API
 */
async function semrushRequest(params: SemrushParams) {
  if (!SEMRUSH_API_KEY) {
    throw new Error('SEMRUSH_API_KEY is not configured')
  }

  const queryParams = new URLSearchParams({
    key: SEMRUSH_API_KEY,
    ...Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined)
    ) as Record<string, string>
  })

  const url = `${SEMRUSH_API_BASE}/?${queryParams.toString()}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Semrush API error: ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  return text
}

/**
 * Parse CSV response from Semrush API
 */
function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(';')
  const rows = lines.slice(1)

  return rows.map(row => {
    const values = row.split(';')
    const obj: Record<string, string> = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    return obj
  })
}

/**
 * Get domain overview analytics
 */
export async function getDomainOverview(domain: string, database = 'us') {
  const result = await semrushRequest({
    type: 'domain_ranks',
    domain,
    database,
    export_columns: 'Dn,Rk,Or,Ot,Oc,Ad,At,Ac'
  })

  const data = parseCSV(result)
  return data[0] || null
}

/**
 * Get organic search keywords for a domain
 */
export async function getOrganicKeywords(
  domain: string,
  database = 'us',
  limit = 100,
  offset = 0
) {
  const result = await semrushRequest({
    type: 'domain_organic',
    domain,
    database,
    display_limit: limit,
    display_offset: offset,
    export_columns: 'Ph,Po,Nq,Cp,Ur,Tr,Tc,Co,Nr,Td'
  })

  return parseCSV(result)
}

/**
 * Get backlinks for a domain
 */
export async function getBacklinks(
  domain: string,
  type: 'backlinks' | 'backlinks_overview' = 'backlinks_overview',
  limit = 100
) {
  const result = await semrushRequest({
    type,
    target: domain,
    target_type: 'root_domain',
    display_limit: limit,
    export_columns: type === 'backlinks_overview'
      ? 'ascore,total,domains_num,urls_num,ips_num,ipclassc_num,follows_num,nofollows_num,sponsored_num,ugc_num,texts_num,forms_num,frames_num'
      : 'source_url,source_title,target_url,external_num,internal_num,anchor,image_url,type,last_seen'
  })

  if (type === 'backlinks_overview') {
    const data = parseCSV(result)
    return data[0] || null
  }

  return parseCSV(result)
}

/**
 * Get keyword analytics
 */
export async function getKeywordAnalytics(
  keyword: string,
  database = 'us'
) {
  const result = await semrushRequest({
    type: 'phrase_this',
    phrase: keyword,
    database,
    export_columns: 'Ph,Nq,Cp,Co,Nr,Td'
  })

  const data = parseCSV(result)
  return data[0] || null
}

/**
 * Get keyword suggestions
 */
export async function getKeywordSuggestions(
  keyword: string,
  database = 'us',
  limit = 100
) {
  const result = await semrushRequest({
    type: 'phrase_related',
    phrase: keyword,
    database,
    display_limit: limit,
    export_columns: 'Ph,Nq,Cp,Co,Nr,Td'
  })

  return parseCSV(result)
}

/**
 * Get organic search competitors
 */
export async function getOrganicCompetitors(
  domain: string,
  database = 'us',
  limit = 20
) {
  const result = await semrushRequest({
    type: 'domain_organic_organic',
    domain,
    database,
    display_limit: limit,
    export_columns: 'Dn,Cr,Np,Or,Ot,Oc,Ad'
  })

  return parseCSV(result)
}

/**
 * Get domain rank history
 */
export async function getDomainRankHistory(
  domain: string,
  database = 'us'
) {
  const result = await semrushRequest({
    type: 'rank',
    domain,
    database,
    export_columns: 'Dt,Rk,Or,Ot,Oc,Ad,At,Ac'
  })

  return parseCSV(result)
}

/**
 * Get URL rankings
 */
export async function getURLRankings(
  url: string,
  database = 'us',
  limit = 100
) {
  const result = await semrushRequest({
    type: 'url_organic',
    url,
    database,
    display_limit: limit,
    export_columns: 'Ph,Po,Nq,Cp,Co,Tr,Tc,Nr,Td'
  })

  return parseCSV(result)
}

/**
 * Get common keywords between two domains
 */
export async function getCommonKeywords(
  domain1: string,
  domain2: string,
  database = 'us',
  limit = 100
) {
  const result = await semrushRequest({
    type: 'domain_domains',
    domains: `${domain1};${domain2}`,
    database,
    display_limit: limit,
    export_columns: 'Ph,P1,P2,Nq,Cp,Co'
  })

  return parseCSV(result)
}

/**
 * Get keyword gap analysis (keywords competitor ranks for but you don't)
 */
export async function getKeywordGap(
  yourDomain: string,
  competitorDomain: string,
  database = 'us',
  limit = 100
) {
  // Get competitor keywords
  const competitorKeywords = await getOrganicKeywords(competitorDomain, database, limit, 0)

  // Get your keywords
  const yourKeywords = await getOrganicKeywords(yourDomain, database, 1000, 0)

  // Create a set of your keywords for fast lookup
  const yourKeywordSet = new Set(yourKeywords.map(kw => kw.Ph || kw.Keyword))

  // Find keywords competitor has that you don't
  const gap = competitorKeywords.filter(kw => {
    const keyword = kw.Ph || kw.Keyword
    return keyword && !yourKeywordSet.has(keyword)
  })

  return gap
}
