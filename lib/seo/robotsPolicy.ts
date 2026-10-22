export const PRIVATE_PATHS = [
  "/admin/",
  "/api/",
  "/login",
  "/register",
  "/profile",
  "/reset-password",
  "/switch-account",
  "/my-ticket/",
] as const;

/**
 * Search engines and link-preview fetchers remain implicitly allowed through
 * the wildcard group. They are listed here so tests can guard against a future
 * change that accidentally blocks them.
 */
export const ALLOWED_BOTS = [
  "Googlebot",
  "Googlebot-Image",
  "Google-InspectionTool",
  "Storebot-Google",
  "AdsBot-Google",
  "bingbot",
  "BingPreview",
  "adidxbot",
  "Applebot",
  "DuckDuckBot",
  "facebookexternalhit",
  "Twitterbot",
  "LinkedInBot",
  "WhatsApp",
  "Slackbot",
  "Discordbot",
  "TelegramBot",
  "Pinterestbot",
  "redditbot",
] as const;

/**
 * AI training crawlers, AI agents, and high-volume SEO/data scrapers.
 * robots.txt is policy only; Cloudflare must enforce it for non-compliant bots.
 */
export const BLOCKED_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "Claude-Web",
  "anthropic-ai",
  "Google-Extended",
  "GoogleOther",
  "Google-CloudVertexBot",
  "Google-GeminiNotebook",
  "Google-NotebookLM",
  "Google-Agent",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "Amzn-SearchBot",
  "meta-externalagent",
  "meta-externalfetcher",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot-Extended",
  "PetalBot",
  "Diffbot",
  "omgili",
  "cohere-ai",
  "MistralAI-Training",
  "MistralAI-User",
  "KimiBot",
  "Kimi-User",
  "Firecrawl",
  "FirecrawlAgent",
  "DotBot",
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DataForSeoBot",
  "BLEXBot",
  "Barkrowler",
  "SerpstatBot",
  "MegaIndex",
  "SeznamBot",
  "AwarioSmartBot",
  "AwarioRssBot",
  "QualifiedBot",
  "Cotoyogi",
  "ICC-Crawler",
  "atlassian-bot",
  "FishBot",
  "BorderxBot",
  "NavuBot",
  "WARDBot",
  "magpie-crawler",
  "CitibotSiteCrawler",
  "ChathiveCrawler",
  "Retool",
  "Instapaper",
] as const;

export type RobotsRule = {
  userAgent: string;
  allow?: string;
  disallow?: string | string[];
};

export function buildRobotsRules(): RobotsRule[] {
  return [
    {
      userAgent: "*",
      allow: "/",
      disallow: [...PRIVATE_PATHS],
    },
    ...BLOCKED_BOTS.map((userAgent) => ({
      userAgent,
      disallow: "/",
    })),
  ];
}
