"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { AdminSidebar } from "@/components/admin-sidebar"
import {
  TrendingUp,
  DollarSign,
  Target,
  Search,
  Eye,
  MousePointerClick,
  BarChart3,
  Calendar,
  Clock,
  Check,
  X,
  Plus,
  Trash2,
  Play,
  Pause,
  AlertCircle,
  Globe,
  Users,
  Layers,
  FileText,
  Link2,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Save,
  ExternalLink,
  Zap,
  Monitor,
  Smartphone
} from "lucide-react"

// ===== CAMPAIGN DATA =====
interface Campaign {
  id: number
  name: string
  type: string
  goal: string
  audience: string
  budgetRange: string
  monthlyBudget: number
  dailyBudget: number
  priority: "HIGH" | "MEDIUM" | "LOW"
  status: "active" | "paused" | "draft"
  biddingStrategy: string
  targetCPA: string
  estClicks: string
  estLeads: string
  notes: string
  launchDate: string
  endDate: string
}

interface Keyword {
  id: number
  campaign: string
  adGroup: string
  keyword: string
  matchType: "Exact" | "Phrase" | "Broad"
  estCPC: string
  intent: string
  enabled: boolean
}

interface AdCopy {
  id: string
  type: "headline" | "description"
  adGroup: string
  text: string
  charCount: number
  maxChars: number
  pinPosition: string
  theme: string
  status: "Active" | "Paused" | "Testing"
  notes: string
}

interface NegativeKeyword {
  id: number
  keyword: string
  matchType: string
  reason: string
  applyTo: string
  enabled: boolean
}

interface CROItem {
  id: number
  priority: string
  recommendation: string
  expectedImpact: string
  effort: string
  completed: boolean
}

interface Task {
  id: number
  title: string
  category: string
  priority: "critical" | "high" | "medium" | "low"
  status: "todo" | "in_progress" | "completed"
  dueDate: string
  notes: string
}

const initialCampaigns: Campaign[] = [
  { id: 1, name: "AI Keynote Speakers — Core", type: "Search", goal: "Lead Generation", audience: "Event planners searching for AI speakers", budgetRange: "$1,500 – $3,000", monthlyBudget: 2500, dailyBudget: 83, priority: "HIGH", status: "draft", biddingStrategy: "Target CPA", targetCPA: "$150–$250", estClicks: "170–310", estLeads: "10–17", notes: "Highest priority — pure intent", launchDate: "", endDate: "" },
  { id: 2, name: "AI Conference Speakers — Events", type: "Search", goal: "Lead Generation", audience: "Conference organizers needing AI talent", budgetRange: "$1,000 – $2,000", monthlyBudget: 1500, dailyBudget: 50, priority: "HIGH", status: "draft", biddingStrategy: "Target CPA", targetCPA: "$125–$200", estClicks: "105–190", estLeads: "8–12", notes: "Event-specific intent", launchDate: "", endDate: "" },
  { id: 3, name: "Named Speaker Searches", type: "Search", goal: "Lead Generation", audience: "People searching for specific speakers on roster", budgetRange: "$500 – $1,000", monthlyBudget: 750, dailyBudget: 25, priority: "MEDIUM", status: "draft", biddingStrategy: "Maximize Conversions", targetCPA: "$50–$100", estClicks: "125–250", estLeads: "8–15", notes: "Low CPC, high intent", launchDate: "", endDate: "" },
  { id: 4, name: "AI Industry Verticals", type: "Search", goal: "Lead Generation", audience: "Industry-specific event planners (healthcare, tech, etc.)", budgetRange: "$750 – $1,500", monthlyBudget: 1000, dailyBudget: 33, priority: "MEDIUM", status: "draft", biddingStrategy: "Target CPA", targetCPA: "$150–$250", estClicks: "70–125", estLeads: "4–7", notes: "Niche but qualified", launchDate: "", endDate: "" },
  { id: 5, name: "Competitor Conquesting", type: "Search", goal: "Market Share", audience: "Users searching competitor speaker bureaus", budgetRange: "$500 – $1,000", monthlyBudget: 750, dailyBudget: 25, priority: "LOW", status: "draft", biddingStrategy: "Target Impression Share", targetCPA: "N/A", estClicks: "95–190", estLeads: "3–5", notes: "Awareness play", launchDate: "", endDate: "" },
  { id: 6, name: "Performance Max — Awareness", type: "PMax", goal: "Awareness + Leads", audience: "In-market audiences for events & conferences", budgetRange: "$750 – $1,500", monthlyBudget: 1000, dailyBudget: 33, priority: "MEDIUM", status: "draft", biddingStrategy: "Maximize Conversions", targetCPA: "$200–$350", estClicks: "50–100", estLeads: "3–5", notes: "Broad awareness funnel", launchDate: "", endDate: "" },
]

const initialKeywords: Keyword[] = [
  { id: 1, campaign: "AI Keynote Speakers — Core", adGroup: "AI Keynote Speakers", keyword: "ai keynote speaker", matchType: "Phrase", estCPC: "$8–$15", intent: "High-intent booking", enabled: true },
  { id: 2, campaign: "AI Keynote Speakers — Core", adGroup: "AI Keynote Speakers", keyword: "artificial intelligence keynote speaker", matchType: "Phrase", estCPC: "$7–$14", intent: "High-intent booking", enabled: true },
  { id: 3, campaign: "AI Keynote Speakers — Core", adGroup: "AI Keynote Speakers", keyword: "book ai speaker", matchType: "Phrase", estCPC: "$10–$18", intent: "Transactional", enabled: true },
  { id: 4, campaign: "AI Keynote Speakers — Core", adGroup: "AI Keynote Speakers", keyword: "hire ai keynote speaker", matchType: "Phrase", estCPC: "$12–$20", intent: "Transactional", enabled: true },
  { id: 5, campaign: "AI Keynote Speakers — Core", adGroup: "AI Keynote Speakers", keyword: "ai keynote speaker for event", matchType: "Phrase", estCPC: "$9–$16", intent: "High-intent booking", enabled: true },
  { id: 6, campaign: "AI Keynote Speakers — Core", adGroup: "AI Keynote Speakers", keyword: "best ai speakers", matchType: "Broad", estCPC: "$6–$12", intent: "Research", enabled: true },
  { id: 7, campaign: "AI Keynote Speakers — Core", adGroup: "AI Keynote Speakers", keyword: "top artificial intelligence speakers", matchType: "Broad", estCPC: "$6–$12", intent: "Research", enabled: true },
  { id: 8, campaign: "AI Keynote Speakers — Core", adGroup: "AI Speaker Bureau", keyword: "ai speaker bureau", matchType: "Exact", estCPC: "$10–$18", intent: "High-intent booking", enabled: true },
  { id: 9, campaign: "AI Keynote Speakers — Core", adGroup: "AI Speaker Bureau", keyword: "ai speakers bureau", matchType: "Exact", estCPC: "$10–$18", intent: "High-intent booking", enabled: true },
  { id: 10, campaign: "AI Keynote Speakers — Core", adGroup: "AI Speaker Bureau", keyword: "artificial intelligence speaker agency", matchType: "Phrase", estCPC: "$8–$15", intent: "High-intent booking", enabled: true },
  { id: 11, campaign: "AI Keynote Speakers — Core", adGroup: "AI Speaker Bureau", keyword: "ai speaking agency", matchType: "Phrase", estCPC: "$8–$14", intent: "High-intent booking", enabled: true },
  { id: 12, campaign: "AI Keynote Speakers — Core", adGroup: "AI Speaker Bureau", keyword: "speaker bureau for technology", matchType: "Broad", estCPC: "$5–$10", intent: "Research", enabled: true },
  { id: 13, campaign: "AI Keynote Speakers — Core", adGroup: "Generative AI Speakers", keyword: "generative ai speaker", matchType: "Phrase", estCPC: "$8–$15", intent: "High-intent booking", enabled: true },
  { id: 14, campaign: "AI Keynote Speakers — Core", adGroup: "Generative AI Speakers", keyword: "chatgpt keynote speaker", matchType: "Phrase", estCPC: "$6–$12", intent: "Research", enabled: true },
  { id: 15, campaign: "AI Keynote Speakers — Core", adGroup: "Generative AI Speakers", keyword: "large language model speaker", matchType: "Phrase", estCPC: "$7–$13", intent: "High-intent booking", enabled: true },
  { id: 16, campaign: "AI Keynote Speakers — Core", adGroup: "Generative AI Speakers", keyword: "generative ai expert for conference", matchType: "Phrase", estCPC: "$9–$16", intent: "Transactional", enabled: true },
  { id: 17, campaign: "AI Conference Speakers — Events", adGroup: "Conference Speakers", keyword: "ai conference speaker", matchType: "Phrase", estCPC: "$8–$14", intent: "High-intent booking", enabled: true },
  { id: 18, campaign: "AI Conference Speakers — Events", adGroup: "Conference Speakers", keyword: "ai speaker for conference", matchType: "Phrase", estCPC: "$9–$16", intent: "High-intent booking", enabled: true },
  { id: 19, campaign: "AI Conference Speakers — Events", adGroup: "Conference Speakers", keyword: "artificial intelligence conference keynote", matchType: "Phrase", estCPC: "$8–$14", intent: "High-intent booking", enabled: true },
  { id: 20, campaign: "AI Conference Speakers — Events", adGroup: "Conference Speakers", keyword: "ai summit speaker", matchType: "Phrase", estCPC: "$7–$13", intent: "High-intent booking", enabled: true },
  { id: 21, campaign: "AI Conference Speakers — Events", adGroup: "Conference Speakers", keyword: "tech conference ai speaker", matchType: "Phrase", estCPC: "$8–$14", intent: "High-intent booking", enabled: true },
  { id: 22, campaign: "AI Conference Speakers — Events", adGroup: "Corporate Events", keyword: "ai speaker corporate event", matchType: "Phrase", estCPC: "$10–$18", intent: "Transactional", enabled: true },
  { id: 23, campaign: "AI Conference Speakers — Events", adGroup: "Corporate Events", keyword: "ai keynote for company event", matchType: "Phrase", estCPC: "$10–$17", intent: "Transactional", enabled: true },
  { id: 24, campaign: "AI Conference Speakers — Events", adGroup: "Corporate Events", keyword: "hire ai expert for corporate retreat", matchType: "Phrase", estCPC: "$12–$20", intent: "Transactional", enabled: true },
  { id: 25, campaign: "AI Conference Speakers — Events", adGroup: "Corporate Events", keyword: "ai town hall speaker", matchType: "Phrase", estCPC: "$8–$15", intent: "Transactional", enabled: true },
  { id: 26, campaign: "AI Conference Speakers — Events", adGroup: "Corporate Events", keyword: "ai expert for executive briefing", matchType: "Phrase", estCPC: "$10–$18", intent: "Transactional", enabled: true },
  { id: 27, campaign: "AI Conference Speakers — Events", adGroup: "Workshops & Panels", keyword: "ai workshop facilitator", matchType: "Phrase", estCPC: "$7–$13", intent: "High-intent booking", enabled: true },
  { id: 28, campaign: "AI Conference Speakers — Events", adGroup: "Workshops & Panels", keyword: "ai panel discussion speakers", matchType: "Phrase", estCPC: "$6–$12", intent: "High-intent booking", enabled: true },
  { id: 29, campaign: "AI Conference Speakers — Events", adGroup: "Workshops & Panels", keyword: "ai training workshop for companies", matchType: "Phrase", estCPC: "$8–$14", intent: "High-intent booking", enabled: true },
  { id: 30, campaign: "AI Conference Speakers — Events", adGroup: "Workshops & Panels", keyword: "ai fireside chat speaker", matchType: "Phrase", estCPC: "$7–$13", intent: "High-intent booking", enabled: true },
  { id: 31, campaign: "Named Speaker Searches", adGroup: "Peter Norvig", keyword: "peter norvig keynote speaker", matchType: "Exact", estCPC: "$3–$6", intent: "Speaker-specific", enabled: true },
  { id: 32, campaign: "Named Speaker Searches", adGroup: "Peter Norvig", keyword: "book peter norvig", matchType: "Phrase", estCPC: "$3–$6", intent: "Speaker-specific", enabled: true },
  { id: 33, campaign: "Named Speaker Searches", adGroup: "Peter Norvig", keyword: "peter norvig speaking fee", matchType: "Exact", estCPC: "$4–$7", intent: "Speaker-specific", enabled: true },
  { id: 34, campaign: "Named Speaker Searches", adGroup: "Adam Cheyer", keyword: "adam cheyer speaker", matchType: "Exact", estCPC: "$3–$6", intent: "Speaker-specific", enabled: true },
  { id: 35, campaign: "Named Speaker Searches", adGroup: "Adam Cheyer", keyword: "siri co-founder keynote", matchType: "Phrase", estCPC: "$5–$10", intent: "Speaker-specific", enabled: true },
  { id: 36, campaign: "Named Speaker Searches", adGroup: "Adam Cheyer", keyword: "book adam cheyer", matchType: "Phrase", estCPC: "$3–$6", intent: "Speaker-specific", enabled: true },
  { id: 37, campaign: "Named Speaker Searches", adGroup: "Gopi Kallayil", keyword: "gopi kallayil speaker", matchType: "Exact", estCPC: "$3–$6", intent: "Speaker-specific", enabled: true },
  { id: 38, campaign: "Named Speaker Searches", adGroup: "Gopi Kallayil", keyword: "google ai strategist keynote", matchType: "Phrase", estCPC: "$6–$12", intent: "Speaker-specific", enabled: true },
  { id: 39, campaign: "Named Speaker Searches", adGroup: "Allie K Miller", keyword: "allie k miller keynote", matchType: "Exact", estCPC: "$4–$8", intent: "Speaker-specific", enabled: true },
  { id: 40, campaign: "Named Speaker Searches", adGroup: "Allie K Miller", keyword: "book allie k miller", matchType: "Phrase", estCPC: "$4–$8", intent: "Speaker-specific", enabled: true },
  { id: 41, campaign: "Named Speaker Searches", adGroup: "Rana el Kaliouby", keyword: "rana el kaliouby speaker", matchType: "Exact", estCPC: "$3–$6", intent: "Speaker-specific", enabled: true },
  { id: 42, campaign: "Named Speaker Searches", adGroup: "Rana el Kaliouby", keyword: "emotion ai keynote speaker", matchType: "Phrase", estCPC: "$6–$12", intent: "Speaker-specific", enabled: true },
  { id: 43, campaign: "AI Industry Verticals", adGroup: "Healthcare AI", keyword: "ai healthcare keynote speaker", matchType: "Phrase", estCPC: "$8–$15", intent: "Industry-specific", enabled: true },
  { id: 44, campaign: "AI Industry Verticals", adGroup: "Healthcare AI", keyword: "ai in healthcare speaker", matchType: "Phrase", estCPC: "$7–$13", intent: "Industry-specific", enabled: true },
  { id: 45, campaign: "AI Industry Verticals", adGroup: "Healthcare AI", keyword: "medical ai conference speaker", matchType: "Phrase", estCPC: "$8–$14", intent: "Industry-specific", enabled: true },
  { id: 46, campaign: "AI Industry Verticals", adGroup: "AI Ethics & Policy", keyword: "ai ethics keynote speaker", matchType: "Phrase", estCPC: "$6–$12", intent: "Industry-specific", enabled: true },
  { id: 47, campaign: "AI Industry Verticals", adGroup: "AI Ethics & Policy", keyword: "responsible ai speaker", matchType: "Phrase", estCPC: "$6–$11", intent: "Industry-specific", enabled: true },
  { id: 48, campaign: "AI Industry Verticals", adGroup: "AI Ethics & Policy", keyword: "ai governance speaker", matchType: "Phrase", estCPC: "$7–$13", intent: "Industry-specific", enabled: true },
  { id: 49, campaign: "AI Industry Verticals", adGroup: "AI Leadership & Strategy", keyword: "ai leadership keynote speaker", matchType: "Phrase", estCPC: "$9–$16", intent: "Industry-specific", enabled: true },
  { id: 50, campaign: "AI Industry Verticals", adGroup: "AI Leadership & Strategy", keyword: "ai transformation speaker", matchType: "Phrase", estCPC: "$8–$14", intent: "Industry-specific", enabled: true },
  { id: 51, campaign: "AI Industry Verticals", adGroup: "AI Leadership & Strategy", keyword: "digital transformation ai speaker", matchType: "Phrase", estCPC: "$8–$15", intent: "Industry-specific", enabled: true },
  { id: 52, campaign: "AI Industry Verticals", adGroup: "Cybersecurity AI", keyword: "ai cybersecurity speaker", matchType: "Phrase", estCPC: "$8–$15", intent: "Industry-specific", enabled: true },
  { id: 53, campaign: "AI Industry Verticals", adGroup: "Cybersecurity AI", keyword: "cybersecurity keynote speaker ai", matchType: "Phrase", estCPC: "$9–$16", intent: "Industry-specific", enabled: true },
  { id: 54, campaign: "Competitor Conquesting", adGroup: "Competitor Names", keyword: "bigspeak ai speakers", matchType: "Exact", estCPC: "$4–$8", intent: "Competitor", enabled: true },
  { id: 55, campaign: "Competitor Conquesting", adGroup: "Competitor Names", keyword: "ai speakers agency", matchType: "Exact", estCPC: "$5–$10", intent: "Competitor", enabled: true },
  { id: 56, campaign: "Competitor Conquesting", adGroup: "Competitor Names", keyword: "ai speaker bureau alternative", matchType: "Phrase", estCPC: "$6–$12", intent: "Competitor", enabled: true },
  { id: 57, campaign: "Competitor Conquesting", adGroup: "Competitor Names", keyword: "washington speakers bureau ai", matchType: "Phrase", estCPC: "$5–$10", intent: "Competitor", enabled: true },
  { id: 58, campaign: "Competitor Conquesting", adGroup: "Competitor Names", keyword: "harry walker agency ai speakers", matchType: "Phrase", estCPC: "$4–$8", intent: "Competitor", enabled: true },
]

const initialAdCopy: AdCopy[] = [
  { id: "H1", type: "headline", adGroup: "Core — AI Keynote", text: "#1 AI Speakers Bureau", charCount: 21, maxChars: 30, pinPosition: "Pin 1", theme: "Brand Authority", status: "Active", notes: "Establishes market position" },
  { id: "H2", type: "headline", adGroup: "Core — AI Keynote", text: "Book AI Keynote Speakers", charCount: 24, maxChars: 30, pinPosition: "Pin 1", theme: "Action CTA", status: "Active", notes: "Direct action headline" },
  { id: "H3", type: "headline", adGroup: "Core — AI Keynote", text: "81+ AI Expert Speakers", charCount: 22, maxChars: 30, pinPosition: "Pin 2", theme: "Social Proof", status: "Active", notes: "Roster size as proof point" },
  { id: "H4", type: "headline", adGroup: "Core — AI Keynote", text: "AI Builders, Not Just Talkers", charCount: 28, maxChars: 30, pinPosition: "Pin 2", theme: "Differentiation", status: "Active", notes: "KEY differentiator" },
  { id: "H5", type: "headline", adGroup: "Core — AI Keynote", text: "Siri Founders on Our Roster", charCount: 27, maxChars: 30, pinPosition: "Pin 3", theme: "Name Recognition", status: "Active", notes: "Marquee name draws clicks" },
  { id: "H6", type: "headline", adGroup: "Core — AI Keynote", text: "OpenAI & Google AI Veterans", charCount: 27, maxChars: 30, pinPosition: "Pin 3", theme: "Name Recognition", status: "Active", notes: "Institutional credibility" },
  { id: "H7", type: "headline", adGroup: "Core — AI Keynote", text: "24-Hour Response Guaranteed", charCount: 27, maxChars: 30, pinPosition: "—", theme: "Service Promise", status: "Active", notes: "Speed commitment" },
  { id: "H8", type: "headline", adGroup: "Core — AI Keynote", text: "AI-Exclusive Speaker Bureau", charCount: 27, maxChars: 30, pinPosition: "—", theme: "Specialization", status: "Active", notes: "Not generalist — only AI" },
  { id: "H9", type: "headline", adGroup: "Core — AI Keynote", text: "Practitioners Who Build AI", charCount: 25, maxChars: 30, pinPosition: "—", theme: "Differentiation", status: "Active", notes: "Reinforces builder positioning" },
  { id: "H10", type: "headline", adGroup: "Core — AI Keynote", text: "Stanford & Harvard AI Experts", charCount: 29, maxChars: 30, pinPosition: "—", theme: "Credibility", status: "Active", notes: "Academic prestige" },
  { id: "H11", type: "headline", adGroup: "Core — AI Keynote", text: "From Google, Amazon & OpenAI", charCount: 28, maxChars: 30, pinPosition: "—", theme: "Credibility", status: "Active", notes: "Company association" },
  { id: "H12", type: "headline", adGroup: "Core — AI Keynote", text: "Get a Custom Speaker Proposal", charCount: 29, maxChars: 30, pinPosition: "—", theme: "CTA", status: "Active", notes: "Soft conversion action" },
  { id: "H13", type: "headline", adGroup: "Events — Conference", text: "AI Speakers for Your Event", charCount: 26, maxChars: 30, pinPosition: "Pin 1", theme: "Relevance", status: "Active", notes: "Direct match to search" },
  { id: "H14", type: "headline", adGroup: "Events — Conference", text: "Elevate Your AI Conference", charCount: 26, maxChars: 30, pinPosition: "Pin 2", theme: "Benefit", status: "Active", notes: "Aspirational framing" },
  { id: "H15", type: "headline", adGroup: "Events — Conference", text: "Keynotes, Panels & Workshops", charCount: 29, maxChars: 30, pinPosition: "—", theme: "Service Range", status: "Active", notes: "Shows format flexibility" },
  { id: "H16", type: "headline", adGroup: "Verticals — Healthcare", text: "AI Healthcare Keynote Experts", charCount: 29, maxChars: 30, pinPosition: "Pin 1", theme: "Industry Match", status: "Active", notes: "Direct vertical targeting" },
  { id: "H17", type: "headline", adGroup: "Verticals — Ethics", text: "AI Ethics & Policy Speakers", charCount: 27, maxChars: 30, pinPosition: "Pin 1", theme: "Industry Match", status: "Active", notes: "Hot topic targeting" },
  { id: "H18", type: "headline", adGroup: "Verticals — Leadership", text: "AI Strategy Keynote Speakers", charCount: 28, maxChars: 30, pinPosition: "Pin 1", theme: "Industry Match", status: "Active", notes: "C-suite appeal" },
  { id: "D1", type: "description", adGroup: "Core — All", text: "The only AI-exclusive speakers bureau. 81+ practitioners from Google, OpenAI & Stanford.", charCount: 87, maxChars: 90, pinPosition: "Pin 1", theme: "Authority + Proof", status: "Active", notes: "Primary description" },
  { id: "D2", type: "description", adGroup: "Core — All", text: "Book real AI builders — Siri co-founders, Amazon AGI leads & top researchers. Get a proposal.", charCount: 90, maxChars: 90, pinPosition: "Pin 2", theme: "Differentiation", status: "Active", notes: "Builder positioning" },
  { id: "D3", type: "description", adGroup: "Core — All", text: "From keynotes to workshops, we match your event with the perfect AI expert. 24hr response.", charCount: 89, maxChars: 90, pinPosition: "—", theme: "Service Range", status: "Active", notes: "Format flexibility" },
  { id: "D4", type: "description", adGroup: "Core — All", text: "Not motivational speakers — real AI practitioners who build the tech. Browse 81+ experts now.", charCount: 90, maxChars: 90, pinPosition: "—", theme: "Differentiation", status: "Active", notes: "Anti-generalist messaging" },
  { id: "D5", type: "description", adGroup: "Events — Conference", text: "Planning an AI conference or corporate event? We curate the perfect speaker for your audience.", charCount: 90, maxChars: 90, pinPosition: "—", theme: "Relevance", status: "Active", notes: "Event planner targeting" },
  { id: "D6", type: "description", adGroup: "Events — Corporate", text: "Engage your executive team with AI insights from Fortune 500 leaders and Silicon Valley pioneers.", charCount: 90, maxChars: 90, pinPosition: "—", theme: "Prestige", status: "Active", notes: "C-suite targeting" },
  { id: "D7", type: "description", adGroup: "Verticals — Healthcare", text: "AI healthcare speakers for your medical conference. Experts from Stanford, WHO & leading hospitals.", charCount: 90, maxChars: 90, pinPosition: "—", theme: "Industry Match", status: "Active", notes: "Healthcare vertical" },
  { id: "D8", type: "description", adGroup: "Verticals — Ethics", text: "Navigate responsible AI with keynote speakers on ethics, governance, and policy frameworks.", charCount: 89, maxChars: 90, pinPosition: "—", theme: "Industry Match", status: "Active", notes: "Ethics vertical" },
]

const initialNegativeKeywords: NegativeKeyword[] = [
  { id: 1, keyword: "free", matchType: "Broad", reason: "Filters out freebie seekers", applyTo: "All Campaigns", enabled: true },
  { id: 2, keyword: "cheap", matchType: "Broad", reason: "Low-budget seekers", applyTo: "All Campaigns", enabled: true },
  { id: 3, keyword: "salary", matchType: "Broad", reason: "Job searchers, not event planners", applyTo: "All Campaigns", enabled: true },
  { id: 4, keyword: "job", matchType: "Broad", reason: "Employment searches", applyTo: "All Campaigns", enabled: true },
  { id: 5, keyword: "career", matchType: "Broad", reason: "Employment searches", applyTo: "All Campaigns", enabled: true },
  { id: 6, keyword: "how to become a speaker", matchType: "Phrase", reason: "Aspiring speakers, not buyers", applyTo: "All Campaigns", enabled: true },
  { id: 7, keyword: "become an ai speaker", matchType: "Phrase", reason: "Aspiring speakers, not buyers", applyTo: "All Campaigns", enabled: true },
  { id: 8, keyword: "speaker application", matchType: "Phrase", reason: "Aspiring speakers, not buyers", applyTo: "All Campaigns", enabled: true },
  { id: 9, keyword: "public speaking tips", matchType: "Phrase", reason: "Self-improvement, not booking", applyTo: "All Campaigns", enabled: true },
  { id: 10, keyword: "public speaking course", matchType: "Phrase", reason: "Training seekers", applyTo: "All Campaigns", enabled: true },
  { id: 11, keyword: "toastmasters", matchType: "Broad", reason: "Public speaking club", applyTo: "All Campaigns", enabled: true },
  { id: 12, keyword: "ted talk", matchType: "Phrase", reason: "Content viewers, not bookers", applyTo: "All Campaigns", enabled: true },
  { id: 13, keyword: "ted talks ai", matchType: "Phrase", reason: "Watching videos, not booking", applyTo: "All Campaigns", enabled: true },
  { id: 14, keyword: "youtube", matchType: "Broad", reason: "Video viewers", applyTo: "All Campaigns", enabled: true },
  { id: 15, keyword: "podcast", matchType: "Broad", reason: "Media content, not booking", applyTo: "All Campaigns", enabled: true },
  { id: 16, keyword: "ai tools", matchType: "Phrase", reason: "Software seekers, not speakers", applyTo: "All Campaigns", enabled: true },
  { id: 17, keyword: "ai software", matchType: "Phrase", reason: "Product searches", applyTo: "All Campaigns", enabled: true },
  { id: 18, keyword: "chatgpt", matchType: "Exact", reason: "Product search, not speaker", applyTo: "Core & Events only", enabled: true },
  { id: 19, keyword: "openai api", matchType: "Phrase", reason: "Developer search", applyTo: "All Campaigns", enabled: true },
  { id: 20, keyword: "ai certification", matchType: "Phrase", reason: "Training seekers", applyTo: "All Campaigns", enabled: true },
  { id: 21, keyword: "ai course", matchType: "Phrase", reason: "Training seekers", applyTo: "All Campaigns", enabled: true },
  { id: 22, keyword: "bluetooth speaker", matchType: "Phrase", reason: "Hardware search", applyTo: "All Campaigns", enabled: true },
  { id: 23, keyword: "smart speaker", matchType: "Phrase", reason: "Hardware search", applyTo: "All Campaigns", enabled: true },
  { id: 24, keyword: "wireless speaker", matchType: "Phrase", reason: "Hardware search", applyTo: "All Campaigns", enabled: true },
  { id: 25, keyword: "diy", matchType: "Broad", reason: "Self-service intent", applyTo: "All Campaigns", enabled: true },
  { id: 26, keyword: "template", matchType: "Broad", reason: "Self-service intent", applyTo: "All Campaigns", enabled: true },
  { id: 27, keyword: "wedding speaker", matchType: "Phrase", reason: "Wrong event type", applyTo: "All Campaigns", enabled: true },
  { id: 28, keyword: "motivational speaker", matchType: "Phrase", reason: "Generalist — not AI focused", applyTo: "All Campaigns", enabled: true },
  { id: 29, keyword: "inspirational quotes", matchType: "Phrase", reason: "Content search, not booking", applyTo: "All Campaigns", enabled: true },
  { id: 30, keyword: "resume", matchType: "Broad", reason: "Job seekers", applyTo: "All Campaigns", enabled: true },
]

const initialCROItems: CROItem[] = [
  { id: 1, priority: "P1 — Critical", recommendation: "Add Google Tag Manager + conversion tracking on /contact form submissions", expectedImpact: "Track all leads accurately", effort: "Low (1-2 hours)", completed: false },
  { id: 2, priority: "P1 — Critical", recommendation: "Implement Enhanced Conversions for better attribution", expectedImpact: "20-30% more attributed conversions", effort: "Low (1-2 hours)", completed: false },
  { id: 3, priority: "P1 — Critical", recommendation: "Set up retargeting pixels (Google Ads + Meta) on all pages", expectedImpact: "Enable remarketing campaigns", effort: "Low (1 hour)", completed: false },
  { id: 4, priority: "P2 — High", recommendation: "Add client logos / social proof above the fold on homepage", expectedImpact: "+15-25% CTR on landing page", effort: "Medium (half day)", completed: false },
  { id: 5, priority: "P2 — High", recommendation: "Create dedicated landing pages for top 3 ad groups", expectedImpact: "+20-40% conversion rate", effort: "Medium (2-3 days)", completed: false },
  { id: 6, priority: "P2 — High", recommendation: "Add live chat or chatbot for instant speaker inquiries", expectedImpact: "+10-20% lead capture", effort: "Medium (1 day)", completed: false },
  { id: 7, priority: "P3 — Medium", recommendation: "A/B test CTA button copy: 'Book Speaker' vs 'Get a Free Proposal' vs 'Check Availability'", expectedImpact: "+5-15% conversion rate", effort: "Low (ongoing)", completed: false },
  { id: 8, priority: "P3 — Medium", recommendation: "Add speaker video highlights on individual speaker pages", expectedImpact: "+10-20% time on page", effort: "Medium (ongoing)", completed: false },
  { id: 9, priority: "P3 — Medium", recommendation: "Implement exit-intent popup with lead magnet", expectedImpact: "+5-10% lead capture", effort: "Low (half day)", completed: false },
  { id: 10, priority: "P4 — Nice to Have", recommendation: "Create comparison page: 'Why Choose an AI-Exclusive Bureau'", expectedImpact: "SEO + ads landing page", effort: "Medium (1-2 days)", completed: false },
]

const initialTasks: Task[] = [
  { id: 1, title: "Set up Google Ads account & billing", category: "Setup", priority: "critical", status: "todo", dueDate: "", notes: "Create account at ads.google.com, link to speakabout.ai" },
  { id: 2, title: "Install Google Tag Manager", category: "Tracking", priority: "critical", status: "todo", dueDate: "", notes: "Add GTM container to all pages" },
  { id: 3, title: "Configure conversion tracking", category: "Tracking", priority: "critical", status: "todo", dueDate: "", notes: "Track contact form submissions, CTA clicks" },
  { id: 4, title: "Set up Enhanced Conversions", category: "Tracking", priority: "high", status: "todo", dueDate: "", notes: "Pass hashed email for better attribution" },
  { id: 5, title: "Build Campaign 1: AI Keynote Speakers — Core", category: "Campaigns", priority: "critical", status: "todo", dueDate: "", notes: "Highest priority — start with this campaign first" },
  { id: 6, title: "Build Campaign 2: AI Conference Speakers — Events", category: "Campaigns", priority: "high", status: "todo", dueDate: "", notes: "Launch alongside Campaign 1" },
  { id: 7, title: "Build Campaign 3: Named Speaker Searches", category: "Campaigns", priority: "medium", status: "todo", dueDate: "", notes: "Low CPC, launch in week 2" },
  { id: 8, title: "Build Campaign 4: AI Industry Verticals", category: "Campaigns", priority: "medium", status: "todo", dueDate: "", notes: "Launch in week 2-3" },
  { id: 9, title: "Build Campaign 5: Competitor Conquesting", category: "Campaigns", priority: "low", status: "todo", dueDate: "", notes: "Launch in week 3-4" },
  { id: 10, title: "Build Campaign 6: Performance Max", category: "Campaigns", priority: "medium", status: "todo", dueDate: "", notes: "Launch after search campaigns are optimized" },
  { id: 11, title: "Upload negative keyword list", category: "Keywords", priority: "high", status: "todo", dueDate: "", notes: "Apply to all campaigns at launch" },
  { id: 12, title: "Set up remarketing audiences", category: "Audiences", priority: "high", status: "todo", dueDate: "", notes: "Website visitors, speaker page viewers" },
  { id: 13, title: "Upload CRM customer match list", category: "Audiences", priority: "medium", status: "todo", dueDate: "", notes: "Past inquiry contacts for targeting" },
  { id: 14, title: "Create ad extensions (sitelinks, callouts, snippets)", category: "Ad Copy", priority: "high", status: "todo", dueDate: "", notes: "All extensions from plan" },
  { id: 15, title: "Set up ad schedule (dayparting)", category: "Targeting", priority: "medium", status: "todo", dueDate: "", notes: "Mon–Fri 8am–6pm bid up, weekends bid down" },
  { id: 16, title: "Review & optimize after Week 1", category: "Optimization", priority: "high", status: "todo", dueDate: "", notes: "Check search terms, pause poor performers" },
  { id: 17, title: "Review & optimize after Month 1", category: "Optimization", priority: "high", status: "todo", dueDate: "", notes: "Analyze CPL, adjust budgets, add negatives" },
]

// ===== MAIN COMPONENT =====
export default function GoogleAdsCampaignPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords)
  const [adCopy, setAdCopy] = useState<AdCopy[]>(initialAdCopy)
  const [negativeKeywords, setNegativeKeywords] = useState<NegativeKeyword[]>(initialNegativeKeywords)
  const [croItems, setCROItems] = useState<CROItem[]>(initialCROItems)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTab, setActiveTab] = useState("overview")
  const [keywordFilter, setKeywordFilter] = useState("all")
  const [keywordSearch, setKeywordSearch] = useState("")
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [budgetMultiplier, setBudgetMultiplier] = useState([100])

  const totalBudget = campaigns.reduce((sum, c) => sum + c.monthlyBudget, 0)
  const adjustedBudget = Math.round(totalBudget * budgetMultiplier[0] / 100)
  const activeCampaigns = campaigns.filter(c => c.status === "active").length
  const totalKeywords = keywords.filter(k => k.enabled).length

  const filteredKeywords = keywords.filter(k => {
    const matchesCampaign = keywordFilter === "all" || k.campaign === keywordFilter
    const matchesSearch = !keywordSearch || k.keyword.toLowerCase().includes(keywordSearch.toLowerCase()) || k.adGroup.toLowerCase().includes(keywordSearch.toLowerCase())
    return matchesCampaign && matchesSearch
  })

  const campaignNames = [...new Set(keywords.map(k => k.campaign))]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": case "critical": return "bg-red-100 text-red-800"
      case "MEDIUM": case "medium": return "bg-yellow-100 text-yellow-800"
      case "LOW": case "low": return "bg-green-100 text-green-800"
      case "high": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "paused": return "bg-yellow-100 text-yellow-800"
      case "draft": return "bg-gray-100 text-gray-800"
      case "completed": return "bg-blue-100 text-blue-800"
      case "in_progress": return "bg-purple-100 text-purple-800"
      case "todo": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getMatchTypeBadge = (matchType: string) => {
    switch (matchType) {
      case "Exact": return "bg-blue-100 text-blue-800"
      case "Phrase": return "bg-purple-100 text-purple-800"
      case "Broad": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const toggleCampaignStatus = (id: number) => {
    setCampaigns(campaigns.map(c =>
      c.id === id ? { ...c, status: c.status === "active" ? "paused" : c.status === "paused" ? "active" : "active" } : c
    ))
  }

  const updateCampaignBudget = (id: number, newBudget: number) => {
    setCampaigns(campaigns.map(c =>
      c.id === id ? { ...c, monthlyBudget: newBudget, dailyBudget: Math.round(newBudget / 30) } : c
    ))
  }

  const updateCampaignDate = (id: number, field: "launchDate" | "endDate", value: string) => {
    setCampaigns(campaigns.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const toggleKeyword = (id: number) => {
    setKeywords(keywords.map(k => k.id === id ? { ...k, enabled: !k.enabled } : k))
  }

  const toggleNegativeKeyword = (id: number) => {
    setNegativeKeywords(negativeKeywords.map(nk => nk.id === id ? { ...nk, enabled: !nk.enabled } : nk))
  }

  const toggleCROItem = (id: number) => {
    setCROItems(croItems.map(item => item.id === id ? { ...item, completed: !item.completed } : item))
  }

  const updateTaskStatus = (id: number, status: Task["status"]) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status } : t))
  }

  const updateTaskDate = (id: number, dueDate: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, dueDate } : t))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72 min-h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-8">
          <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-orange-600" />
            Google Ads Campaign Manager
          </h1>
          <p className="text-gray-600 mt-1">SpeakAbout.ai — AI-Exclusive Speakers Bureau</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCalendar(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Launch Calendar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <DollarSign className="h-4 w-4" />Monthly Budget
          </div>
          <div className="text-2xl font-bold">${adjustedBudget.toLocaleString()}</div>
          <div className="text-xs text-gray-500">${Math.round(adjustedBudget / 30)}/day</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Layers className="h-4 w-4" />Campaigns
          </div>
          <div className="text-2xl font-bold">{campaigns.length}</div>
          <div className="text-xs text-gray-500">{activeCampaigns} active</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Search className="h-4 w-4" />Keywords
          </div>
          <div className="text-2xl font-bold">{totalKeywords}</div>
          <div className="text-xs text-gray-500">{keywords.length} total</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <MousePointerClick className="h-4 w-4" />Est. Clicks/Mo
          </div>
          <div className="text-2xl font-bold">615–1,165</div>
          <div className="text-xs text-gray-500">across all campaigns</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Target className="h-4 w-4" />Est. Leads/Mo
          </div>
          <div className="text-2xl font-bold">36–61</div>
          <div className="text-xs text-gray-500">at launch</div>
        </Card>
      </div>

      {/* Budget Lever */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold">Budget Scaling Lever</Label>
          <span className="text-sm font-mono">{budgetMultiplier[0]}% &rarr; ${adjustedBudget.toLocaleString()}/mo</span>
        </div>
        <Slider
          value={budgetMultiplier}
          onValueChange={setBudgetMultiplier}
          min={25}
          max={200}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>25% ($1,875)</span>
          <span>100% ($7,500)</span>
          <span>200% ($15,000)</span>
        </div>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full md:min-w-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="adcopy">Ad Copy</TabsTrigger>
            <TabsTrigger value="extensions">Extensions</TabsTrigger>
            <TabsTrigger value="negatives">Negatives</TabsTrigger>
            <TabsTrigger value="audiences">Audiences</TabsTrigger>
            <TabsTrigger value="landing">Landing Pages</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>
        </div>

        {/* ===== OVERVIEW TAB ===== */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {campaigns.map(campaign => (
              <Card key={campaign.id} className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">{campaign.name}</h3>
                      <Badge className={getPriorityColor(campaign.priority)}>{campaign.priority}</Badge>
                      <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                      <Badge variant="outline">{campaign.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{campaign.audience}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${Math.round(campaign.monthlyBudget * budgetMultiplier[0] / 100).toLocaleString()}/mo</span>
                      <span className="flex items-center gap-1"><Target className="h-3 w-3" />CPA: {campaign.targetCPA}</span>
                      <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3" />{campaign.estClicks} clicks</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{campaign.estLeads} leads</span>
                      <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{campaign.biddingStrategy}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex flex-col gap-1 mr-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-gray-500 w-12">Launch</Label>
                        <Input
                          type="date"
                          value={campaign.launchDate}
                          onChange={e => updateCampaignDate(campaign.id, "launchDate", e.target.value)}
                          className="h-8 text-xs w-36"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-gray-500 w-12">End</Label>
                        <Input
                          type="date"
                          value={campaign.endDate}
                          onChange={e => updateCampaignDate(campaign.id, "endDate", e.target.value)}
                          className="h-8 text-xs w-36"
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCampaignStatus(campaign.id)}
                      className={campaign.status === "active" ? "text-yellow-600" : "text-green-600"}
                    >
                      {campaign.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCampaign(campaign)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* KPI Benchmarks */}
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Target KPIs & Benchmarks</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">KPI</th>
                    <th className="text-left py-2 pr-4">Month 1–2</th>
                    <th className="text-left py-2 pr-4">Month 3–6</th>
                    <th className="text-left py-2 pr-4">Benchmark</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b"><td className="py-2 pr-4 font-medium">Click-Through Rate</td><td className="py-2 pr-4">3.5%–5%</td><td className="py-2 pr-4">5%–8%</td><td className="py-2 pr-4">Industry avg: 3.17%</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-medium">Cost Per Click</td><td className="py-2 pr-4">$6–$15</td><td className="py-2 pr-4">$5–$12</td><td className="py-2 pr-4">B2B avg: $8–$14</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-medium">Conversion Rate</td><td className="py-2 pr-4">4%–6%</td><td className="py-2 pr-4">6%–10%</td><td className="py-2 pr-4">B2B avg: 3.04%</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-medium">Cost Per Lead</td><td className="py-2 pr-4">$120–$250</td><td className="py-2 pr-4">$80–$180</td><td className="py-2 pr-4">Bureau avg: $150–$300</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-medium">Monthly Leads</td><td className="py-2 pr-4">36–61</td><td className="py-2 pr-4">50–80+</td><td className="py-2 pr-4">—</td></tr>
                  <tr className="border-b"><td className="py-2 pr-4 font-medium">Quality Score</td><td className="py-2 pr-4">6–7</td><td className="py-2 pr-4">7–9</td><td className="py-2 pr-4">Avg: 5–6</td></tr>
                  <tr><td className="py-2 pr-4 font-medium">Impression Share</td><td className="py-2 pr-4">40%–60%</td><td className="py-2 pr-4">60%–80%</td><td className="py-2 pr-4">—</td></tr>
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ===== KEYWORDS TAB ===== */}
        <TabsContent value="keywords" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search keywords..."
                value={keywordSearch}
                onChange={e => setKeywordSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={keywordFilter} onValueChange={setKeywordFilter}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Filter by campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaignNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 w-10"></th>
                    <th className="text-left p-3">Keyword</th>
                    <th className="text-left p-3">Ad Group</th>
                    <th className="text-left p-3">Match</th>
                    <th className="text-left p-3">Est. CPC</th>
                    <th className="text-left p-3">Intent</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKeywords.map(kw => (
                    <tr key={kw.id} className={`border-b hover:bg-gray-50 ${!kw.enabled ? "opacity-40" : ""}`}>
                      <td className="p-3">
                        <Switch checked={kw.enabled} onCheckedChange={() => toggleKeyword(kw.id)} />
                      </td>
                      <td className="p-3 font-mono text-sm">{kw.keyword}</td>
                      <td className="p-3 text-gray-600">{kw.adGroup}</td>
                      <td className="p-3"><Badge className={getMatchTypeBadge(kw.matchType)}>{kw.matchType}</Badge></td>
                      <td className="p-3 text-gray-600">{kw.estCPC}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{kw.intent}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-gray-50 text-sm text-gray-500">
              Showing {filteredKeywords.length} of {keywords.length} keywords • {keywords.filter(k => k.enabled).length} enabled
            </div>
          </Card>
        </TabsContent>

        {/* ===== AD COPY TAB ===== */}
        <TabsContent value="adcopy" className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Headlines (30 char max)</h3>
            <div className="grid gap-3">
              {adCopy.filter(a => a.type === "headline").map(ad => (
                <Card key={ad.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-400">{ad.id}</span>
                        <Badge variant="outline" className="text-xs">{ad.adGroup}</Badge>
                        {ad.pinPosition !== "—" && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">{ad.pinPosition}</Badge>
                        )}
                        <Badge className={getStatusColor(ad.status.toLowerCase())}>{ad.status}</Badge>
                      </div>
                      <p className="font-medium text-base">{ad.text}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs ${ad.charCount > ad.maxChars ? "text-red-600 font-bold" : "text-gray-400"}`}>
                          {ad.charCount}/{ad.maxChars} chars
                        </span>
                        <span className="text-xs text-gray-400">{ad.theme}</span>
                        <span className="text-xs text-gray-400">{ad.notes}</span>
                      </div>
                    </div>
                    <div className="w-24 bg-gray-100 rounded h-2">
                      <div
                        className={`h-2 rounded ${ad.charCount / ad.maxChars > 0.9 ? "bg-orange-500" : "bg-green-500"}`}
                        style={{ width: `${Math.min(100, (ad.charCount / ad.maxChars) * 100)}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Descriptions (90 char max)</h3>
            <div className="grid gap-3">
              {adCopy.filter(a => a.type === "description").map(ad => (
                <Card key={ad.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-400">{ad.id}</span>
                        <Badge variant="outline" className="text-xs">{ad.adGroup}</Badge>
                        {ad.pinPosition !== "—" && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">{ad.pinPosition}</Badge>
                        )}
                        <Badge className={getStatusColor(ad.status.toLowerCase())}>{ad.status}</Badge>
                      </div>
                      <p className="text-sm">{ad.text}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs ${ad.charCount > ad.maxChars ? "text-red-600 font-bold" : "text-gray-400"}`}>
                          {ad.charCount}/{ad.maxChars} chars
                        </span>
                        <span className="text-xs text-gray-400">{ad.theme}</span>
                      </div>
                    </div>
                    <div className="w-24 bg-gray-100 rounded h-2">
                      <div
                        className={`h-2 rounded ${ad.charCount / ad.maxChars > 0.9 ? "bg-orange-500" : "bg-green-500"}`}
                        style={{ width: `${Math.min(100, (ad.charCount / ad.maxChars) * 100)}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ===== EXTENSIONS TAB ===== */}
        <TabsContent value="extensions" className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Link2 className="h-4 w-4" />Sitelink Extensions</h3>
            <div className="grid gap-3">
              {[
                { title: "Browse All 81+ Speakers", desc1: "Explore our full roster of AI", desc2: "keynote speakers and experts", url: "speakabout.ai/speakers" },
                { title: "AI Workshops & Panels", desc1: "Hands-on AI training and", desc2: "panel discussion facilitation", url: "speakabout.ai/ai-workshops" },
                { title: "Healthcare AI Speakers", desc1: "Medical & health AI experts", desc2: "for your industry event", url: "speakabout.ai/industries/healthcare-keynote-speakers" },
                { title: "About Our Bureau", desc1: "30+ years of speaker booking", desc2: "The world's only AI-exclusive bureau", url: "speakabout.ai/our-team" },
                { title: "Book a Speaker Today", desc1: "Get a custom proposal in 24hrs", desc2: "Fast, personalized service", url: "speakabout.ai/contact" },
                { title: "Technology AI Speakers", desc1: "Enterprise tech and AI leaders", desc2: "from Google, Amazon & more", url: "speakabout.ai/industries/technology-keynote-speakers" },
              ].map((sl, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-blue-700">{sl.title}</p>
                      <p className="text-sm text-gray-600">{sl.desc1}</p>
                      <p className="text-sm text-gray-600">{sl.desc2}</p>
                    </div>
                    <a href={`https://${sl.url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 flex-shrink-0">
                      <ExternalLink className="h-3 w-3" />{sl.url}
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Callout Extensions</h3>
              <div className="flex flex-wrap gap-2">
                {["81+ AI Expert Speakers", "AI-Exclusive Bureau", "24-Hour Response Time", "Real AI Practitioners", "Siri Co-Founders", "Virtual & In-Person", "Custom Speaker Matching", "Fortune 500 Trusted"].map((callout, i) => (
                  <Badge key={i} variant="secondary" className="text-sm py-1 px-3">{callout}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Structured Snippets</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Types:</span> Keynotes, Panels, Workshops, Fireside Chats, Virtual Events, Executive Briefings</div>
                <div><span className="font-medium">Topics:</span> Generative AI, Machine Learning, AI Ethics, AI Strategy, Healthcare AI, Cybersecurity AI</div>
                <div><span className="font-medium">Brands:</span> Google, Amazon, OpenAI, Stanford, Apple (Siri), Meta, NASA</div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ===== NEGATIVE KEYWORDS TAB ===== */}
        <TabsContent value="negatives" className="space-y-4">
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 w-10"></th>
                    <th className="text-left p-3">Keyword</th>
                    <th className="text-left p-3">Match Type</th>
                    <th className="text-left p-3">Reason</th>
                    <th className="text-left p-3">Apply To</th>
                  </tr>
                </thead>
                <tbody>
                  {negativeKeywords.map(nk => (
                    <tr key={nk.id} className={`border-b hover:bg-gray-50 ${!nk.enabled ? "opacity-40" : ""}`}>
                      <td className="p-3">
                        <Switch checked={nk.enabled} onCheckedChange={() => toggleNegativeKeyword(nk.id)} />
                      </td>
                      <td className="p-3 font-mono"><Ban className="h-3 w-3 inline mr-1 text-red-400" />{nk.keyword}</td>
                      <td className="p-3"><Badge className={getMatchTypeBadge(nk.matchType)}>{nk.matchType}</Badge></td>
                      <td className="p-3 text-gray-600">{nk.reason}</td>
                      <td className="p-3 text-gray-500 text-xs">{nk.applyTo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-gray-50 text-sm text-gray-500">
              {negativeKeywords.filter(nk => nk.enabled).length} of {negativeKeywords.length} negatives active
            </div>
          </Card>
        </TabsContent>

        {/* ===== AUDIENCES TAB ===== */}
        <TabsContent value="audiences" className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">In-Market & Affinity Audiences</h3>
            <div className="grid gap-3">
              {[
                { segment: "Event Planning Services", category: "In-Market", bid: "+25%", rationale: "Active event planners — core buyer", applyTo: "All Search" },
                { segment: "Conference & Event Tickets", category: "In-Market", bid: "+15%", rationale: "Conference attendees who may plan events", applyTo: "Core & Events" },
                { segment: "Business Technology Solutions", category: "In-Market", bid: "+10%", rationale: "Tech decision makers exploring AI", applyTo: "Verticals & Events" },
                { segment: "Corporate Training & Development", category: "In-Market", bid: "+20%", rationale: "L&D buyers often book speakers", applyTo: "Core & Events" },
                { segment: "Business Consulting Services", category: "In-Market", bid: "+10%", rationale: "Consultants organizing events", applyTo: "All Search" },
                { segment: "Marketing & Advertising Services", category: "In-Market", bid: "+15%", rationale: "Marketing teams booking speakers", applyTo: "Core & Events" },
                { segment: "Event Planners & Coordinators", category: "Affinity", bid: "+10%", rationale: "Long-term event planning interest", applyTo: "PMax" },
                { segment: "Business Professionals", category: "Affinity", bid: "+5%", rationale: "General business audience", applyTo: "PMax" },
                { segment: "Technophiles", category: "Affinity", bid: "+10%", rationale: "Tech-savvy audience", applyTo: "PMax" },
              ].map((a, i) => (
                <Card key={i} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{a.segment}</span>
                      <Badge variant="outline" className="text-xs">{a.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{a.rationale}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <Badge className="bg-green-100 text-green-800">{a.bid}</Badge>
                    <div className="text-xs text-gray-400 mt-1">{a.applyTo}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Remarketing Lists</h3>
            <div className="grid gap-3">
              {[
                { segment: "Uploaded CRM List (past inquiries)", bid: "+40%", rationale: "Highest intent — past contacts returning" },
                { segment: "Website Visitors (speakabout.ai)", bid: "+30%", rationale: "Site visitors who didn't convert" },
                { segment: "Speaker Page Viewers", bid: "+35%", rationale: "Viewed specific speaker — very high intent" },
              ].map((r, i) => (
                <Card key={i} className="p-4 flex items-center justify-between border-l-4 border-l-purple-400">
                  <div>
                    <span className="font-medium">{r.segment}</span>
                    <p className="text-sm text-gray-500">{r.rationale}</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">{r.bid}</Badge>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Demographic & Device Targeting</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2"><Users className="h-4 w-4" />Demographics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Age: 25–64 (include)</span><span className="text-gray-400">—</span></div>
                  <div className="flex justify-between"><span>Age: 35–54 (bid up)</span><Badge className="bg-green-100 text-green-800">+15%</Badge></div>
                  <div className="flex justify-between"><span>Household Income: Top 30%</span><Badge className="bg-green-100 text-green-800">+10%</Badge></div>
                </div>
              </Card>
              <Card className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2"><Globe className="h-4 w-4" />Geography</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Primary: United States</span><span className="text-gray-400">—</span></div>
                  <div className="flex justify-between"><span>Tier 1: NYC, SF, LA, Chicago, Boston, Austin, Seattle, DC</span><Badge className="bg-green-100 text-green-800">+20%</Badge></div>
                  <div className="flex justify-between"><span>Secondary: UK, Canada, Australia</span><Badge className="bg-red-100 text-red-800">-10%</Badge></div>
                </div>
              </Card>
              <Card className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2"><Monitor className="h-4 w-4" />Device</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Desktop</span><Badge className="bg-green-100 text-green-800">+10%</Badge></div>
                  <div className="flex justify-between"><span>Mobile</span><Badge className="bg-red-100 text-red-800">-15%</Badge></div>
                </div>
              </Card>
              <Card className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2"><Clock className="h-4 w-4" />Schedule (Dayparting)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Mon–Fri, 8am–6pm</span><Badge className="bg-green-100 text-green-800">+15%</Badge></div>
                  <div className="flex justify-between"><span>Weekends</span><Badge className="bg-red-100 text-red-800">-25%</Badge></div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ===== LANDING PAGES TAB ===== */}
        <TabsContent value="landing" className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Landing Page Mapping</h3>
            <div className="grid gap-3">
              {[
                { campaign: "AI Keynote Speakers — Core", page: "speakabout.ai (homepage) or /speakers", cta: "Book Speaker Today", notes: "Add trust badges, speaker count, and client logos above the fold" },
                { campaign: "AI Conference Speakers — Events", page: "speakabout.ai/our-services", cta: "Get a Custom Proposal", notes: "Highlight format flexibility (keynotes, panels, workshops)" },
                { campaign: "Named Speaker — Peter Norvig", page: "speakabout.ai/speakers/peter-norvig", cta: "Check Availability", notes: "Ensure each speaker page has strong CTA and social proof" },
                { campaign: "Named Speaker — Adam Cheyer", page: "speakabout.ai/speakers/adam-cheyer", cta: "Check Availability", notes: "Feature video clips and past event testimonials" },
                { campaign: "Named Speaker — Gopi Kallayil", page: "speakabout.ai/speakers/gopi-kallayil", cta: "Check Availability", notes: "Highlight Google credentials prominently" },
                { campaign: "Healthcare AI Vertical", page: "speakabout.ai/industries/healthcare-keynote-speakers", cta: "Find Healthcare AI Speaker", notes: "Include healthcare-specific case studies" },
                { campaign: "AI Ethics & Policy", page: "speakabout.ai/ethics-speakers-in-ai", cta: "Book Ethics Speaker", notes: "Feature timely policy content" },
                { campaign: "Technology AI Vertical", page: "speakabout.ai/industries/technology-keynote-speakers", cta: "Explore Tech Speakers", notes: "Emphasize Fortune 500 experience" },
                { campaign: "Competitor Conquesting", page: "speakabout.ai/speakers (full roster)", cta: "Browse 81+ AI Speakers", notes: "Showcase breadth and exclusivity" },
                { campaign: "Performance Max", page: "speakabout.ai (homepage)", cta: "Book Speaker Today", notes: "Ensure fast load speed and mobile optimization" },
              ].map((lp, i) => (
                <Card key={i} className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium">{lp.campaign}</p>
                      <p className="text-sm text-blue-600">{lp.page}</p>
                      <p className="text-xs text-gray-500 mt-1">{lp.notes}</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 flex-shrink-0">{lp.cta}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">CRO Optimization Checklist</h3>
            <div className="grid gap-2">
              {croItems.map(item => (
                <Card key={item.id} className={`p-4 cursor-pointer transition-all ${item.completed ? "bg-green-50 border-green-200" : ""}`} onClick={() => toggleCROItem(item.id)}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {item.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(item.priority.includes("P1") ? "critical" : item.priority.includes("P2") ? "high" : item.priority.includes("P3") ? "medium" : "low")} >{item.priority}</Badge>
                      </div>
                      <p className={`text-sm mt-1 ${item.completed ? "line-through text-gray-400" : ""}`}>{item.recommendation}</p>
                      <div className="flex gap-4 mt-1 text-xs text-gray-500">
                        <span>Impact: {item.expectedImpact}</span>
                        <span>Effort: {item.effort}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ===== TASKS TAB ===== */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {tasks.filter(t => t.status === "completed").length}/{tasks.length} completed
            </div>
          </div>

          {["critical", "high", "medium", "low"].map(priority => {
            const priorityTasks = tasks.filter(t => t.priority === priority)
            if (priorityTasks.length === 0) return null
            return (
              <div key={priority}>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge className={getPriorityColor(priority)}>{priority.toUpperCase()}</Badge>
                  <span className="text-sm text-gray-500">({priorityTasks.filter(t => t.status === "completed").length}/{priorityTasks.length})</span>
                </h3>
                <div className="grid gap-2">
                  {priorityTasks.map(task => (
                    <Card key={task.id} className={`p-4 ${task.status === "completed" ? "bg-green-50 border-green-200" : ""}`}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {task.status === "completed" ? (
                            <button onClick={() => updateTaskStatus(task.id, "todo")}>
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </button>
                          ) : task.status === "in_progress" ? (
                            <button onClick={() => updateTaskStatus(task.id, "completed")}>
                              <Clock className="h-5 w-5 text-purple-600 animate-pulse" />
                            </button>
                          ) : (
                            <button onClick={() => updateTaskStatus(task.id, "in_progress")}>
                              <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                            </button>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium ${task.status === "completed" ? "line-through text-gray-400" : ""}`}>{task.title}</span>
                            <Badge variant="outline" className="text-xs">{task.category}</Badge>
                            <Badge className={getStatusColor(task.status)}>{task.status.replace("_", " ")}</Badge>
                          </div>
                          {task.notes && (
                            <p className="text-xs text-gray-500 mt-1">{task.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Input
                            type="date"
                            value={task.dueDate}
                            onChange={e => updateTaskDate(task.id, e.target.value)}
                            className="h-8 text-xs w-36"
                          />
                          <Select value={task.status} onValueChange={(v: Task["status"]) => updateTaskStatus(task.id, v)}>
                            <SelectTrigger className="h-8 w-32 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </TabsContent>
      </Tabs>

      {/* ===== EDIT CAMPAIGN DIALOG ===== */}
      {editingCampaign && (
        <Dialog open={!!editingCampaign} onOpenChange={() => setEditingCampaign(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Campaign: {editingCampaign.name}</DialogTitle>
              <DialogDescription>Adjust budget, dates, and bidding strategy</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Monthly Budget ($)</Label>
                <Input
                  type="number"
                  value={editingCampaign.monthlyBudget}
                  onChange={e => setEditingCampaign({ ...editingCampaign, monthlyBudget: parseInt(e.target.value) || 0, dailyBudget: Math.round((parseInt(e.target.value) || 0) / 30) })}
                />
                <p className="text-xs text-gray-500 mt-1">Daily: ${editingCampaign.dailyBudget}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Launch Date</Label>
                  <Input type="date" value={editingCampaign.launchDate} onChange={e => setEditingCampaign({ ...editingCampaign, launchDate: e.target.value })} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={editingCampaign.endDate} onChange={e => setEditingCampaign({ ...editingCampaign, endDate: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Bidding Strategy</Label>
                <Select value={editingCampaign.biddingStrategy} onValueChange={v => setEditingCampaign({ ...editingCampaign, biddingStrategy: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Target CPA">Target CPA</SelectItem>
                    <SelectItem value="Maximize Conversions">Maximize Conversions</SelectItem>
                    <SelectItem value="Target Impression Share">Target Impression Share</SelectItem>
                    <SelectItem value="Maximize Clicks">Maximize Clicks</SelectItem>
                    <SelectItem value="Manual CPC">Manual CPC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editingCampaign.status} onValueChange={(v: Campaign["status"]) => setEditingCampaign({ ...editingCampaign, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCampaign(null)}>Cancel</Button>
              <Button onClick={() => {
                setCampaigns(campaigns.map(c => c.id === editingCampaign.id ? editingCampaign : c))
                setEditingCampaign(null)
              }}>
                <Save className="h-4 w-4 mr-1" />Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ===== LAUNCH CALENDAR DIALOG ===== */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Campaign Launch Calendar</DialogTitle>
            <DialogDescription>Plan your campaign rollout schedule</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Recommended Launch Sequence</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Badge className="bg-red-100 text-red-800 flex-shrink-0">Week 1</Badge>
                  <div>
                    <p className="font-medium">Foundation & High-Priority Campaigns</p>
                    <ul className="text-gray-600 list-disc ml-4 mt-1">
                      <li>Set up Google Ads account, GTM, conversion tracking</li>
                      <li>Launch Campaign 1: AI Keynote Speakers — Core</li>
                      <li>Launch Campaign 2: AI Conference Speakers — Events</li>
                      <li>Upload all negative keywords</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-orange-100 text-orange-800 flex-shrink-0">Week 2</Badge>
                  <div>
                    <p className="font-medium">Expand to Medium-Priority</p>
                    <ul className="text-gray-600 list-disc ml-4 mt-1">
                      <li>Launch Campaign 3: Named Speaker Searches</li>
                      <li>Launch Campaign 4: AI Industry Verticals</li>
                      <li>Set up remarketing audiences</li>
                      <li>Create ad extensions</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-yellow-100 text-yellow-800 flex-shrink-0">Week 3–4</Badge>
                  <div>
                    <p className="font-medium">Full Rollout & Optimization</p>
                    <ul className="text-gray-600 list-disc ml-4 mt-1">
                      <li>Launch Campaign 5: Competitor Conquesting</li>
                      <li>Launch Campaign 6: Performance Max</li>
                      <li>First optimization review</li>
                      <li>Upload CRM customer match list</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-green-100 text-green-800 flex-shrink-0">Month 2+</Badge>
                  <div>
                    <p className="font-medium">Optimize & Scale</p>
                    <ul className="text-gray-600 list-disc ml-4 mt-1">
                      <li>Analyze CPL and lead quality by campaign</li>
                      <li>Shift budget to highest-performing campaigns</li>
                      <li>A/B test ad copy and landing pages</li>
                      <li>Scale budget based on validated lead quality</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            <div>
              <h4 className="font-semibold mb-2">Campaign Dates</h4>
              <div className="space-y-2">
                {campaigns.map(c => (
                  <div key={c.id} className="flex items-center gap-3 text-sm">
                    <Badge className={getStatusColor(c.status)} >{c.status}</Badge>
                    <span className="font-medium flex-1 truncate">{c.name}</span>
                    <Input type="date" value={c.launchDate} onChange={e => updateCampaignDate(c.id, "launchDate", e.target.value)} className="h-8 text-xs w-36" />
                    <span className="text-gray-400">→</span>
                    <Input type="date" value={c.endDate} onChange={e => updateCampaignDate(c.id, "endDate", e.target.value)} className="h-8 text-xs w-36" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
        </div>
      </div>
    </div>
  )
}
