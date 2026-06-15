-- Migration: Create blog_settings table for blog pipeline configuration
-- Date: 2026-06-14
-- Description: Key-value store for blog pipeline settings like prompts and ratios

-- Create blog_settings table
CREATE TABLE IF NOT EXISTS blog_settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for key lookup
CREATE INDEX IF NOT EXISTS idx_blog_settings_key ON blog_settings(key);

-- Seed default settings
INSERT INTO blog_settings (key, value, description) VALUES
    ('briefs_prompt', 'You are generating fresh blog post briefs for Speak About AI (https://speakabout.ai), a premier AI keynote speakers bureau. The audience for the resulting articles: event planners, corporate marketers, sales/revenue/HR/L&D leaders, and executives who book speakers for corporate events. The articles should also rank in Google for AI-related search queries and pull organic traffic to speakabout.ai.

GROUND TRUTH IN CURRENT EVENTS — IMPORTANT
Before writing any briefs, USE THE web_search TOOL 2-4 times to find recent (last 30-60 days) AI developments. Search for things like:
- "enterprise AI deployment 2026"
- recent AI product launches by major labs (OpenAI, Anthropic, Google, etc.)
- AI regulation news and policy shifts
- industry-specific AI applications (healthcare, finance, sales, manufacturing, etc.)
- notable AI case studies, controversies, or research findings

Use the actual headlines, companies, products, and findings you discover as the grounding for your briefs. Do NOT rely solely on training knowledge that may be months out of date. Each brief should reference at least one specific real development you found in your searches.

Generate {count} distinct, high-quality briefs. Each brief must:

REQUIREMENTS
1. Cover a different angle on AI today or the near future (next 6-12 months). Vary the topic areas across briefs — no two briefs should target the same audience or sub-topic.
2. Reference at least one specific real-world example, recent news event, company, product launch, or research finding. Use your knowledge of recent AI developments — be accurate; don''t fabricate specifics or invent quotes.
3. Provide enough specificity that a writer can produce a 1500-1800 word article from the brief alone. Each brief must explicitly name:
   - Target audience for the article
   - Specific angle or thesis (what makes this article''s take different from generic AI content)
   - 3-5 sub-topics or sections to cover
   - 2-3 concrete examples, case studies, or companies to reference
4. Identify 2-3 SEO target keyword phrases (long-tail) the article should rank for.
5. End with EITHER a CTA hook tied to booking AI keynote speakers OR a substantive non-sales close — see CTA RATIO section below. When using a CTA hook, the closing beat should feel natural — sample phrasings: "the kind of insight that lands harder when delivered live by a keynote speaker," "for organizations ready to align their teams, an AI keynote can accelerate the conversation," "to bring this perspective to your next event, browse our AI speaker roster." When NOT using a CTA hook, end with a substantive editorial close — a forward-looking question, a takeaway implication, or a thought-provoking observation about the topic — and DO NOT mention keynote speakers, Speak About AI, or any sales beat.

CTA RATIO — IMPORTANT
Of these {count} briefs, EXACTLY {cta_count} should include the speaker-bureau CTA hook (per requirement #5). The remaining {non_cta_count} briefs should end with a substantive non-sales editorial close — no mention of keynote speakers, no funnel toward Speak About AI''s roster, no sales beat at all. Just smart commentary that lands on its own.

You decide which briefs get the CTA based on topic fit. Some topics naturally invite a "bring this conversation to your event" close (e.g., AI strategy for executives, change management, internal alignment); others read better as straight editorial without the sales beat (e.g., regulatory analysis, breaking news commentary, technical deep-dives). Distribute the {cta_count} CTAs across the batch wherever they feel most natural.

LENGTH: Each brief 100-180 words. Detailed enough to be useful; not so long it becomes the article itself.

TOPIC AREAS TO ROTATE ACROSS (pick a different one per brief):
- AI in specific industries (healthcare, finance, manufacturing, retail, legal, education, real estate, media, hospitality, logistics)
- Enterprise AI deployment, governance, organizational change management
- AI for sales, marketing, customer service, HR/recruiting
- Generative AI / AI agents / multi-modal AI applications
- AI impact on jobs, hiring, talent strategy, reskilling
- AI security, deepfakes, misinformation, brand protection
- AI strategy and decision-making for executives and boards
- AI in events, conferences, B2B marketing, demand generation
- Recent breakthroughs or product/regulatory shifts
- AI economics: compute costs, infrastructure, ROI, build-vs-buy
- Practical AI adoption patterns: what''s working vs. what''s stalling

AVOID
- Duplicating angles from the existing briefs listed below
- Vague AI-thought-leadership generalities without concrete specifics
- Generic "what is AI" explainers
- Overplayed framings — bring a fresh contrarian or specific angle (e.g., not "ChatGPT for business" but "Why ChatGPT-only deployments stall in enterprise: the integration gap")

EXISTING BRIEFS (do not duplicate these angles):
{existing_briefs}

OUTPUT FORMAT
Reply with ONLY a JSON array of {count} strings. Each string is a single brief. No preamble, no markdown code fences, no explanation. The output must be valid JSON parseable by json.loads(). Use double quotes inside briefs by escaping them as \".

Example output structure:
[
  "Audience: ... Angle: ... Cover: ... Examples: ... SEO targets: ... CTA hook: ...",
  "Audience: ... etc."
]', 'Claude prompt for generating blog briefs. Template variables: {count}, {cta_count}, {non_cta_count}, {existing_briefs}'),

    ('cta_ratio', '0.6', 'Ratio of briefs that should include a CTA hook (0.0 to 1.0)'),

    ('github_repo', 'speakaboutai/speak-about-ai-blog', 'GitHub repository for workflow triggers (owner/repo format)')
ON CONFLICT (key) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE blog_settings IS 'Key-value store for blog pipeline configuration settings';
