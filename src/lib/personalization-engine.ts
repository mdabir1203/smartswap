/**
 * ============================================================
 * PERSONALIZATION ENGINE — "The Brain"
 * ============================================================
 * 
 * Architecture Decision: Pure functions with zero side-effects.
 * This module is designed to be framework-agnostic — it could
 * be extracted as a standalone CDN script with minimal changes.
 * 
 * The engine follows a 3-stage pipeline:
 *   1. SIGNAL COLLECTION  → Parse all available user signals
 *   2. INTENT RESOLUTION  → Map signals to a known intent
 *   3. VARIANT SELECTION   → Return the correct content variant
 * 
 * Safety Philosophy: If confidence is low, ALWAYS fallback to
 * the default variant. A generic hero is better than a wrong one.
 * ============================================================
 */

// ---------------------
// TYPE DEFINITIONS
// ---------------------

export type IntentType = "gaming" | "productivity" | "budget" | "default";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface UserSignal {
  source: string;       // Where we found this signal (e.g., "utm_campaign", "query", "referrer")
  value: string;        // The raw value we detected
  intentMatch: IntentType; // What intent this signal maps to
  weight: number;       // How confident we are in this signal (0-1)
}

export interface IntentResult {
  intent: IntentType;
  confidence: ConfidenceLevel;
  signals: UserSignal[];
  reasoning: string;    // Human-readable explanation for the debug overlay
}

export interface ContentVariant {
  intent: IntentType;
  headline: string;
  subhead: string;
  ctaText: string;
  ctaSecondary: string;
  heroImageKey: string;  // Maps to the image asset
  accentColor: string;   // CSS custom property name
  badgeText: string;     // Small badge above headline
}

// ---------------------
// DATA STORE
// ---------------------
// Why a constant map? For an MVP, this is the simplest structure 
// that allows instant O(1) lookups. In production, this would 
// come from a CMS or API endpoint.

export const CONTENT_VARIANTS: Record<IntentType, ContentVariant> = {
  gaming: {
    intent: "gaming",
    headline: "Dominate the Leaderboard",
    subhead: "144Hz refresh rate. 1ms response time. Zero excuses. Our gaming monitors are built for players who refuse to lose.",
    ctaText: "Shop Gaming Monitors",
    ctaSecondary: "Compare Specs",
    heroImageKey: "gaming",
    accentColor: "--intent-gaming",
    badgeText: "⚡ Gaming Collection",
  },
  productivity: {
    intent: "productivity",
    headline: "Maximize Your Efficiency",
    subhead: "4K clarity. Ergonomic stands. Blue light filters. The workspace upgrade your eyes have been begging for.",
    ctaText: "Explore Office Displays",
    ctaSecondary: "See Ergonomic Options",
    heroImageKey: "productivity",
    accentColor: "--intent-productivity",
    badgeText: "📊 Pro Workspace",
  },
  budget: {
    intent: "budget",
    headline: "Best Value Monitors",
    subhead: "Premium quality doesn't require a premium price. Discover monitors rated 4.5★ and above — all under $300.",
    ctaText: "See Today's Deals",
    ctaSecondary: "Price Match Guarantee",
    heroImageKey: "budget",
    accentColor: "--intent-budget",
    badgeText: "🏷️ Best Sellers Under $300",
  },
  default: {
    intent: "default",
    headline: "Crystal Clear Displays for Everyone",
    subhead: "From gaming to productivity, find the perfect monitor that matches your world. Trusted by 50,000+ customers.",
    ctaText: "Browse All Monitors",
    ctaSecondary: "Take the Quiz",
    heroImageKey: "default",
    accentColor: "--primary",
    badgeText: "✨ New Arrivals",
  },
};

// ---------------------
// SIGNAL DETECTION
// ---------------------
// Why keyword arrays? They allow fuzzy matching against URL params
// without requiring exact string matches. A user searching for 
// "144hz gaming monitor" should trigger the gaming intent.

const INTENT_KEYWORDS: Record<Exclude<IntentType, "default">, string[]> = {
  gaming: [
    "gaming", "game", "gamer", "esports", "fps", "144hz", "240hz",
    "1ms", "curved", "rgb", "competitive", "twitch", "stream",
  ],
  productivity: [
    "office", "work", "productivity", "4k", "ergonomic", "usb-c",
    "daisy-chain", "color-accurate", "design", "linkedin", "professional",
  ],
  budget: [
    "cheap", "budget", "affordable", "deal", "sale", "discount",
    "under-300", "value", "best-price", "clearance",
  ],
};

/**
 * Stage 1: SIGNAL COLLECTION
 * 
 * Scans all available data sources (URL params, referrer) and 
 * produces an array of weighted signals. Each signal represents 
 * one piece of evidence about user intent.
 */
export function collectSignals(searchParams: URLSearchParams, referrer: string = ""): UserSignal[] {
  const signals: UserSignal[] = [];

  // --- UTM Campaign (Highest confidence — the marketer told us) ---
  const utmCampaign = searchParams.get("utm_campaign");
  if (utmCampaign) {
    const matched = matchKeywordToIntent(utmCampaign);
    if (matched) {
      signals.push({
        source: "utm_campaign",
        value: utmCampaign,
        intentMatch: matched,
        weight: 0.95, // Very high — explicit marketing signal
      });
    }
  }

  // --- UTM Source (Medium confidence) ---
  const utmSource = searchParams.get("utm_source");
  if (utmSource) {
    const matched = matchKeywordToIntent(utmSource);
    if (matched) {
      signals.push({
        source: "utm_source",
        value: utmSource,
        intentMatch: matched,
        weight: 0.7,
      });
    }
  }

  // --- Direct intent param (Highest confidence — explicit) ---
  const intentParam = searchParams.get("intent");
  if (intentParam) {
    const matched = matchKeywordToIntent(intentParam);
    if (matched) {
      signals.push({
        source: "intent",
        value: intentParam,
        intentMatch: matched,
        weight: 1.0,
      });
    }
  }

  // --- Search query (Medium-high confidence — behavioral signal) ---
  const query = searchParams.get("q") || searchParams.get("query") || searchParams.get("search");
  if (query) {
    const matched = matchKeywordToIntent(query);
    if (matched) {
      signals.push({
        source: "search_query",
        value: query,
        intentMatch: matched,
        weight: 0.8,
      });
    }
  }

  // --- Referrer analysis (Medium confidence — contextual) ---
  const refParam = searchParams.get("ref") || referrer;
  if (refParam) {
    const matched = matchKeywordToIntent(refParam);
    if (matched) {
      signals.push({
        source: "referrer",
        value: refParam,
        intentMatch: matched,
        weight: 0.6,
      });
    }
  }

  // --- Catch-all: scan ALL params for keyword matches ---
  searchParams.forEach((value, key) => {
    if (!["utm_campaign", "utm_source", "intent", "q", "query", "search", "ref"].includes(key)) {
      const matched = matchKeywordToIntent(`${key} ${value}`);
      if (matched) {
        signals.push({
          source: `param:${key}`,
          value: value || key,
          intentMatch: matched,
          weight: 0.4,
        });
      }
    }
  });

  return signals;
}

/**
 * Stage 2: INTENT RESOLUTION
 * 
 * Aggregates all signals and determines the dominant intent.
 * Uses a weighted scoring system — not just "first match wins."
 * This prevents a low-confidence signal from overriding a 
 * high-confidence one.
 */
export function resolveIntent(signals: UserSignal[]): IntentResult {
  // Safety: No signals? Default immediately.
  if (signals.length === 0) {
    return {
      intent: "default",
      confidence: "low",
      signals: [],
      reasoning: "No personalization signals detected. Showing default experience.",
    };
  }

  // Aggregate scores per intent
  const scores: Record<IntentType, number> = {
    gaming: 0,
    productivity: 0,
    budget: 0,
    default: 0,
  };

  signals.forEach((signal) => {
    scores[signal.intentMatch] += signal.weight;
  });

  // Find the winning intent
  const sortedIntents = (Object.entries(scores) as [IntentType, number][])
    .filter(([intent]) => intent !== "default")
    .sort(([, a], [, b]) => b - a);

  const [topIntent, topScore] = sortedIntents[0] || ["default", 0];
  const [, secondScore] = sortedIntents[1] || ["default", 0];

  // Confidence calculation:
  // High: Strong signal (>= 0.8) and clear winner
  // Medium: Decent signal but ambiguous 
  // Low: Weak signals — fallback to default
  let confidence: ConfidenceLevel;
  let finalIntent: IntentType;

  if (topScore >= 0.8) {
    confidence = "high";
    finalIntent = topIntent;
  } else if (topScore >= 0.4 && topScore - secondScore >= 0.2) {
    confidence = "medium";
    finalIntent = topIntent;
  } else {
    confidence = "low";
    finalIntent = "default"; // SAFETY: Unclear intent → show default
  }

  // Build human-readable reasoning
  const topSignal = signals.find((s) => s.intentMatch === finalIntent);
  const reasoning = finalIntent === "default"
    ? "Intent signals too weak or ambiguous. Defaulting to generic experience."
    : `Detected '${topSignal?.value}' in ${topSignal?.source}. Confidence: ${(topScore * 100).toFixed(0)}%.`;

  return {
    intent: finalIntent,
    confidence,
    signals,
    reasoning,
  };
}

/**
 * Stage 3: VARIANT SELECTION
 * 
 * Simple lookup — the heavy lifting was done in Stages 1 & 2.
 * Always returns a valid variant (default as fallback).
 */
export function getVariant(intent: IntentType): ContentVariant {
  return CONTENT_VARIANTS[intent] || CONTENT_VARIANTS.default;
}

// ---------------------
// UTILITY FUNCTIONS
// ---------------------

/**
 * Fuzzy keyword matching against all intent keyword sets.
 * Returns the first matching intent, or null if no match.
 * 
 * Why lowercase + includes? It handles compound strings like 
 * "gaming-monitors-sale" matching the "gaming" keyword.
 */
function matchKeywordToIntent(input: string): IntentType | null {
  const normalized = input.toLowerCase().replace(/[_-]/g, " ");

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return intent as IntentType;
      }
    }
  }

  return null;
}

/**
 * Full pipeline: Collect → Resolve → Select
 * 
 * This is the main entry point. In a real CDN script, this would
 * be the function that runs on DOMContentLoaded.
 */
export function personalize(searchParams: URLSearchParams, referrer?: string): {
  variant: ContentVariant;
  result: IntentResult;
} {
  const signals = collectSignals(searchParams, referrer);
  const result = resolveIntent(signals);
  const variant = getVariant(result.intent);

  return { variant, result };
}
