-- Update Joan's workshop agenda to remove custom section, other workshops, and keynotes

UPDATE workshops
SET agenda = 'FEATURED WORKSHOP: 3 AI Tools Workshop (Half Day - Most Popular)
Hands-on training with ChatGPT, Claude, and Gemini. Learn practical prompt engineering and immediate use cases for your role.
• Perfect for: Teams new to AI or looking to standardize tools
• Format options: Half-day (3 hours), Full-day (6 hours), or 3-week series (1 hour weekly)
• Includes: Live demos, hands-on exercises, custom use-case workshops

FROM AI TOOLS TO INTEGRATED WORKFLOWS (Full Day or Multi-Day)
Move beyond individual tools to build complete AI-powered workflows that save hours daily.
• Perfect for: Teams ready to scale AI adoption
• Format options: Full-day intensive or 2-day deep dive
• Includes: Workflow templates, integration strategies, team implementation planning

FUTURE-PROOF YOUR BUSINESS: AI STRATEGY & ROI (Full Day or Multi-Session)
Executive-focused program covering AI strategy, change management, and measuring ROI. Based on BCG 2024 research.
• Perfect for: Leadership teams and decision-makers
• Format options: Full-day strategy session or 4-week executive series
• Includes: Custom ROI analysis, implementation roadmap, change management framework

EXECUTIVE STRATEGY SESSIONS (2 Hours)
Condensed strategic overview for C-suite and senior leadership. Quick-start AI adoption planning.
• Perfect for: Busy executives needing fast AI insights
• Format: 2-hour intensive session
• Includes: Strategic recommendations, priority action items, resource planning'
WHERE slug = 'ai-workshops-joan-bajorek';
